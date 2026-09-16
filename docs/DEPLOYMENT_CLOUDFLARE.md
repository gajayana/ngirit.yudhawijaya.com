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

## Environment variables — build time vs runtime

This is the one thing that bites on Workers. There are two distinct moments:

**Build time.** `nuxt build` inlines everything under `runtimeConfig.public` into
the client bundle. Those values come from `process.env` when the build runs, so
`NUXT_PUBLIC_HOST`, `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY`
must be present **at build time**:

- Building locally: they are read from `.env` automatically.
- Building in Cloudflare Workers Builds (git-connected CI): add them under
  *Settings → Build → Variables and Secrets*, or they will be baked in empty.

**Runtime.** Anything under the private half of `runtimeConfig` is resolved per
request from the Worker's env. Nuxt maps `NUXT_`-prefixed vars onto the config
tree, so `SUPABASE_SECRET_KEY` is overridden by a Worker secret named
`NUXT_SUPABASE_SECRET_KEY`. Rotating it needs no rebuild.

`NUXT_PUBLIC_HOST` is set in `wrangler.jsonc` `vars` as well, because the server
half of the config reads it at runtime (used for OAuth `redirectTo` and canonical
URLs). Change the value there if the domain changes — and rebuild, since the
client half was baked in.

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
