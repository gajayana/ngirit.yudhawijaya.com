# TODO: Fix Vercel Function Invocation Timeouts for Logged-In Users

**Status:** Investigation complete — awaiting implementation
**Date:** 2026-07-08
**Symptom:** Intermittent `FUNCTION_INVOCATION_TIMEOUT` (504) on Vercel when accessing the app as a logged-in user. Anonymous visitors are never affected.

---

## Root Cause Analysis

### Why it only happens to logged-in users

The `@nuxtjs/supabase` (v2.0.9) server plugin (`node_modules/@nuxtjs/supabase/dist/runtime/plugins/supabase.server.js`) runs with `enforce: 'pre'` and **blocks every SSR page render** on:

```js
const [session, user] = await Promise.all([
  serverSupabaseSession(event),   // getSession() — may trigger a token REFRESH network call
  serverSupabaseUser(event),      // getClaims()  — may trigger a getUser() network call
]);
```

For an **anonymous** visitor there is no auth cookie, so both resolve instantly with no network I/O. For a **logged-in** user:

1. **`serverSupabaseUser()` → `auth.getClaims()`**: with the current setup (legacy **HS256/symmetric** JWT secret — verified in `@supabase/auth-js@2.110.0` `GoTrueClient.getClaims()`), the JWT cannot be verified locally, so it falls back to `getUser(token)` — a **blocking HTTPS round-trip to the Supabase Auth server on every single SSR request**.
2. **`serverSupabaseSession()` → `auth.getSession()`**: if the access token has expired (user reopens the app after >1 hour), `__loadSession()` calls `_callRefreshToken()` — **another blocking network call**, with refresh-token *rotation*.

The same happens on **every API endpoint** via `getAuthenticatedUserId()` (`server/utils/auth.ts:10` → `serverSupabaseUser` → `getClaims` → `getUser`). A single dashboard load fires 3 client API calls (`/api/v1/user/me`, `/api/v1/families`, `/api/v1/transactions`), so one page visit = **4+ Vercel invocations, each doing its own serial auth round-trip** before touching the database.

### Why it times out (instead of just being slow)

- The module wraps all Supabase HTTP calls in `fetchWithRetry` (`runtime/utils/fetch-retry.js`): **3 attempts, no per-attempt timeout**. A hung TCP connection never rejects, so the SSR render never completes and Vercel kills the invocation at `maxDuration`.
- On Vercel, a resumed/suspended function instance can hold **stale keep-alive sockets** to Supabase; reusing them produces exactly this "hangs forever" behavior. This is a documented Supabase/Vercel failure mode ("CONNECT_TIMEOUT or hanging queries in Serverless Functions") and explains the **intermittency** — it typically bites the first request after the function was idle.
- The refresh path makes it worse: when the token is expired, the SSR request **and** the client-side Supabase instance **and** the 3 parallel API invocations may all try to refresh with the *same* refresh token. Supabase rotates refresh tokens, so concurrent refreshes race ("Already Used" errors → retries → more latency).
- There is no `vercel.json`, so the function runs with the default `maxDuration`. Cold start + auth round-trip(s) + refresh race can exceed it even without a fully hung socket.

### Contributing anti-pattern in our own code

`pages/index.vue:38-42` redirects logged-in users via `watchEffect(() => { if (user.value) router.push('/dashboard') })`. During SSR `user.value` **is** populated (cookie session), so `router.push()` executes **on the server**. `router.push` does not perform a real HTTP redirect server-side — Nuxt renders the full login page anyway and the client redirects after hydration. Result: logged-in users hitting `/` pay for a wasted SSR render (with the blocking auth calls above) *plus* a second SSR render of `/dashboard`. The same pattern exists in `pages/dashboard.vue:74-78`. Nuxt's documented server-safe primitive is `navigateTo()` (which the module's own `auth-redirect` middleware uses).

### Ruled out

- No `useFetch`/`useAsyncData` anywhere — SSR never awaits our own API routes.
- Realtime subscriptions are correctly gated behind `import.meta.client` (`composables/useRealtime.ts:82`, stores) — no WebSocket opens server-side.
- No server middleware, no infinite redirect loop (module middleware only redirects when session is *absent*, and `/` is excluded).

---

## Fix Plan (in priority order)

### 1. Migrate the Supabase project to asymmetric JWT signing keys — **highest impact, no code change**

`GoTrueClient.getClaims()` verifies **asymmetric** (ES256/RS256) JWTs locally via WebCrypto, using a JWKS cache that is **global across client instances** (`GLOBAL_JWKS` in `@supabase/auth-js`), explicitly designed for Vercel Fluid Compute / Lambda. After migration, the per-request `getUser()` network call disappears from **both** the SSR plugin and every `getAuthenticatedUserId()` call — auth verification becomes a local CPU operation.

Steps:
- [ ] Supabase Dashboard → Project Settings → **JWT Keys** → "Migrate to asymmetric JWT signing keys" (choose ECC/ES256).
- [ ] Confirm the app uses the new publishable/anon key flow if prompted (env names stay the same; only values change if we also rotate API keys — rotating API keys is *not* required for signing-key migration).
- [ ] Note: existing sessions keep HS256 tokens until refresh (~1 hour) — the fallback path still works during the transition; full effect after tokens rotate.
- [ ] Verify after deploy: decode a fresh access token (jwt.io) and confirm `header.alg` is `ES256` and `header.kid` is present; confirm SSR TTFB drops.

### 2. Replace server-side `router.push` with `navigateTo()` — code fix

- [ ] `pages/index.vue:38-42`: replace `watchEffect` + `router.push('/dashboard')` with `watchEffect(() => { if (user.value) navigateTo('/dashboard') })` — or better, drop the watcher and add a small route middleware on `/` that returns `navigateTo('/dashboard')` when `useSupabaseSession().value` exists. This turns the wasted SSR render of the login page into a real 302 for logged-in users.
- [ ] `pages/dashboard.vue:74-78`: same treatment for the `!user → '/'` redirect (this one is redundant with the module's global `auth-redirect` middleware — consider deleting the watcher entirely).
- [ ] `pages/confirm.vue`, `pages/profile.vue`, `components/auth/action-button.vue`: these `router.push` calls run in `onMounted`/event handlers (client-only), so they are safe — optionally normalize to `navigateTo` for consistency, low priority.

### 3. Add `vercel.json` — region pinning + timeout headroom

- [ ] Pin the function region to the Supabase project's region (e.g. Supabase in `ap-southeast-1` → Vercel `sin1`) to cut round-trip latency on every auth/DB call:
  ```json
  {
    "regions": ["sin1"],
    "functions": { "**": { "maxDuration": 30 } }
  }
  ```
  (Check the actual Supabase project region in the dashboard first; adjust the region slug accordingly. `maxDuration` 30s is a stopgap so a slow-but-alive request degrades instead of 504ing — it does *not* replace fixes 1–2.)
- [ ] Confirm **Fluid Compute** is enabled in the Vercel project settings (default on newer projects) — it reduces cold starts and lets the global JWKS cache from Fix 1 actually stay warm between invocations.

### 4. Fail fast instead of hanging: add a fetch timeout to the Supabase clients

The module's `fetchWithRetry` has no per-attempt timeout, so a dead keep-alive socket hangs the whole render. The module accepts `clientOptions.global.fetch` (it spreads `...clientOptions.global` *after* setting its own fetch, so ours wins):

- [ ] In `nuxt.config.ts`, pass a custom fetch with an abort timeout:
  ```ts
  supabase: {
    // ...existing options
    clientOptions: {
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(8000) }),
      },
    },
  }
  ```
  With this, a hung socket rejects in 8s; the SSR plugin already `.catch(() => null)`s, so the page renders (as logged-out at worst) instead of 504ing. Verify `clientOptions` is serializable/accepted by the module version in use (it is exposed via `runtimeConfig.public.supabase` — a function here may not survive serialization; if not, apply the same timeout by overriding fetch in a Nuxt plugin or upgrading the module, see Fix 6). **Test locally first.**

### 5. Reduce per-page-load invocation count (after Fix 1, lower priority)

- [ ] Dashboard mount fires `/api/v1/user/me` (via auth store), `/api/v1/families`, then `/api/v1/transactions` **serially** (`pages/dashboard.vue:89-92`). Combine `fetchFamilyMembers()` + `fetchCurrentMonth()` into a single endpoint (e.g. `/api/v1/dashboard`) or at minimum run them with `Promise.all` where the family filter allows.
- [ ] Each invocation currently does auth verification + its own Supabase REST call; fewer invocations = fewer chances to hit a stale socket.

### 6. Upgrade `@nuxtjs/supabase` and `@supabase/supabase-js`

- [ ] Check for releases newer than `2.0.9` / `2.110.0` — changelogs since 2.0.x include fixes around SSR session handling and fetch retry behavior. Upgrade and re-test (per repo convention: majors included).

---

## Verification Plan

1. **Before**: capture baseline — Vercel dashboard → Observability → filter 504/`FUNCTION_INVOCATION_TIMEOUT`; note which paths time out (`/`, `/dashboard`, or `/api/v1/*`) and TTFB p95 for logged-in SSR.
2. Apply Fix 1 (dashboard config) + Fix 2 + Fix 3, deploy to preview, log in, and:
   - Hit `/` while logged in → expect a **302 to `/dashboard`** (curl with session cookies, check status code).
   - Confirm fresh access token uses `ES256`.
   - Measure SSR TTFB logged-in vs anonymous — the gap should collapse to ~0.
3. Simulate the expiry scenario: log in, wait >1h (or shorten JWT expiry in Supabase settings temporarily), reopen the app → no 504, single successful refresh.
4. Watch Vercel logs for 1–2 weeks for recurrence; if stale-socket hangs persist, Fix 4's abort timeout converts them into fast, logged failures we can see.

## References

- `node_modules/@nuxtjs/supabase/dist/runtime/plugins/supabase.server.js` — blocking SSR auth fetch
- `node_modules/@supabase/auth-js` `GoTrueClient.getClaims()` — HS256 → `getUser()` network fallback; `GLOBAL_JWKS` cache
- `server/utils/auth.ts:10` — per-API-call `serverSupabaseUser`
- [nuxt-modules/supabase#119 — serverSupabaseUser adds 200–400ms per request](https://github.com/nuxt-modules/supabase/issues/119)
- [Supabase: CONNECT_TIMEOUT / hanging queries in serverless functions](https://supabase.com/docs/guides/troubleshooting/troubleshooting-connect_timeout-or-hanging-queries-in-vercel-serverless-functions-775f92)
- [Supabase docs: getClaims vs getUser](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
