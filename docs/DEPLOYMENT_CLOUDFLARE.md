# Deployment: Cloudflare Workers

The app builds to a Cloudflare Worker via the Nitro `cloudflare_module` preset.
The Nuxt server runs as the Worker; the client bundle and `public/` are served by
[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
through the `ASSETS` binding (free, does not count against Worker invocations).

## Files involved

| File | Role |
| --- | --- |
| `nuxt.config.ts` → `nitro.preset` | Selects `cloudflare_module` + `nodeCompat` |
| `wrangler.jsonc` | Worker name, compatibility date, non-secret vars |
| `.output/server/wrangler.json` | **Generated.** Nitro merges `wrangler.jsonc` and injects `main` + `assets` |
| `.wrangler/deploy/config.json` | **Generated.** Points `wrangler` at the file above so you can deploy from the repo root |

Do not set `main` or `assets` in `wrangler.jsonc` — Nitro owns those and will warn
and override them.

## First-time setup

```bash
pnpm install
pnpm wrangler login
```

Set the server-only secret (nothing sensitive belongs in `wrangler.jsonc`, which
is committed):

```bash
pnpm wrangler secret put NUXT_SUPABASE_SECRET_KEY
```

## Deploy

```bash
pnpm cf:deploy          # runs typecheck + nuxt build, then wrangler deploy
```

Preview the real Worker runtime (workerd) locally on port 8787:

```bash
pnpm build && pnpm preview
```

Tail production logs:

```bash
pnpm cf:tail
```

## Environment variables

`nuxt build` bakes whatever is in your local `.env` into the bundle — including
`http://127.0.0.1:54321` if your `.env` points at the local Supabase CLI. That
is expected; the Worker's `vars` override it.

Nuxt re-applies `NUXT_`-prefixed env vars onto `runtimeConfig` on **every
request**, and serializes the `public` half into the SSR payload. Because every
route in this app is server-rendered, the browser receives the overridden values
too — so `NUXT_PUBLIC_SUPABASE_URL` set in `wrangler.jsonc` `vars` genuinely
fixes the client, not just the server. (This would *not* hold for a prerendered
or `ssr: false` route, which would keep the baked-in value. Keep that in mind
before adding `nitro.prerender` routes.)

The mapping is positional: `NUXT_PUBLIC_SUPABASE_URL` → `public.supabase.url`,
`NUXT_SUPABASE_SECRET_KEY` → `SUPABASE_SECRET_KEY`.

### Where each variable is set

| Variable | Where | Why |
| --- | --- | --- |
| `NUXT_PUBLIC_HOST` | `wrangler.jsonc` `vars` | Not sensitive, useful in git |
| `NUXT_PUBLIC_SUPABASE_URL` | Cloudflare dashboard | Kept out of the repo |
| `NUXT_PUBLIC_SUPABASE_KEY` | Cloudflare dashboard | Kept out of the repo |
| `NUXT_SUPABASE_SECRET_KEY` | `wrangler secret put` | Genuinely secret |

By default `wrangler deploy` treats `wrangler.jsonc` as the sole source of truth
and **deletes** any var set only in the dashboard — the app then silently falls
back to the local value baked in at build time. `"keep_vars": true` in
`wrangler.jsonc` disables that deletion, which is what makes the dashboard rows
above survive deploys. Do not remove it.

Set the dashboard rows under *Worker → Settings → Variables and Secrets*. On a
brand-new Worker they do not exist until you add them, so the first deploy will
come up pointing at the baked-in local Supabase; adding the vars triggers a new
version and fixes it.

Because `keep_vars` lets deployed state drift from the repo, `wrangler.jsonc` no
longer tells you the full picture. Check the live state with:

```bash
pnpm wrangler versions view --latest   # shows bindings on the deployed version
pnpm wrangler secret list
```

**Alternative:** setting them as secrets instead (`pnpm wrangler secret put
NUXT_PUBLIC_SUPABASE_URL`) also keeps them out of git and survives deploys
without `keep_vars`. They reach the Worker env identically, so Nuxt maps them
the same way. The trade-off is that secret values cannot be read back afterwards.

### Verifying what actually shipped

```bash
curl -s https://ngirit.yudhawijaya.com/ | grep -o 'supabase:{url:"[^"]*"'
```

## Why Workers and not Pages

Cloudflare Pages is in maintenance for new features; Workers with Static Assets
is the supported path for new projects and gets observability, gradual
deployments, Durable Objects and cron triggers. Switching to Pages would mean
the `cloudflare_pages` preset and a different deploy command.

## Custom domain

`ngirit.yudhawijaya.com` is configured in `wrangler.jsonc` under `routes` with
`custom_domain: true`, so Wrangler provisions the DNS record and certificate on
deploy. The zone `yudhawijaya.com` is already on Cloudflare nameservers.

**Cutover from Vercel:** the hostname previously pointed at Vercel via a CNAME.
Wrangler will not create a custom domain while a conflicting DNS record exists,
so delete the old `ngirit` record in the Cloudflare dashboard (*DNS → Records*)
before the first deploy.

Then add the domain to Supabase → *Authentication → URL Configuration →
Redirect URLs*, including `https://ngirit.yudhawijaya.com/confirm`. If the
hostname ever changes, update `NUXT_PUBLIC_HOST` in **both** `.env` (build time,
client bundle) and `wrangler.jsonc` `vars` (runtime, server), then rebuild.

## Constraints to keep in mind

- **No Node runtime.** `nodejs_compat` polyfills most of what Nitro needs, but
  server code must stay on Web APIs (`fetch`, `crypto.subtle`, …). No `fs`, no
  native modules, no long-lived connections. Current server code already
  complies — it only talks to Supabase over HTTP.
- **Bundle size.** Free plan allows 3 MB gzipped, paid 10 MB. The build reports
  the total; it is currently ~460 kB gzipped, so there is plenty of headroom.
- **CPU time.** 10 ms per invocation on the free plan, 30 s on paid. Note that
  *waiting on Supabase is I/O, not CPU*, so it does not count — but see below.
- **`@nuxt/icon` runs in `remote` mode** (no `@iconify-json/*` packages are
  installed), so icon requests hit the Iconify API from the Worker. This works,
  but if you want zero outbound calls, install the used collections
  (`heroicons`, `lucide`, `logos`) and switch to `clientBundle: { scan: true }`.

## Known issue carried over from Vercel

`TODO.md` documents blocking Supabase auth round-trips on every SSR render and
every API call (`serverSupabaseUser()` → `getClaims()` → `getUser()` with a
symmetric JWT secret). Workers removes the cold-start and stale-keep-alive-socket
failure mode that caused `FUNCTION_INVOCATION_TIMEOUT`, but the extra round-trip
per request remains. Migrating the Supabase project to **asymmetric (ES256) JWT
signing keys** lets `getClaims()` verify locally and removes the network hop
entirely. Fixing the `router.push()`-during-SSR redirects in `pages/index.vue`
and `pages/dashboard.vue` (use `navigateTo()`) removes the wasted double render.
