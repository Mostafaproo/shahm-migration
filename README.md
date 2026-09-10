# Shaham — Nuxt 4

Standalone Nuxt 4 rewrite of [shaham-go-fe](https://github.com/our-edu) (the legacy Nuxt 2 / Vue 2
LMS front-end), following the same architectural conventions as `ouredu-lms-monorepo` — **but as a
regular, single-project Nuxt 4 app, not a monorepo**.

The migration runs on a strangler pattern: the legacy app keeps running in production while
domains are ported over here one at a time, sharing the same backend and session cookie.

## Stack

- [Nuxt 4](https://nuxt.com) (`srcDir: app/`) + [Nuxt UI v4](https://ui.nuxt.com)
- [Pinia](https://pinia.vuejs.org) for domain stores
- [`@nuxtjs/i18n`](https://i18n.nuxtjs.org) — `ar` (RTL, default) + `en`, `prefix` strategy
- [Zod](https://zod.dev) for form schemas
- `sarala-json-api-data-formatter` for JSON:API (de)serialization

## Architecture

A three-tier structure ported from the LMS monorepo, vendored locally (no `pnpm` workspaces or
Nuxt layers):

- **`app/core/http`** — framework-agnostic HTTP client wrapping `$fetch`, JSON:API
  serialize/deserialize, and the multi-tenant settings gate.
- **`app/composables/useDynamicCrud`** — action-driven CRUD + list/pagination state, built on top
  of the backend's `ActionMap`/`BackendAction` contract (same HATEOAS-style actions as the LMS).
- **`app/stores/*.ts`** — one Pinia store per domain, spreading `useDynamicCrud<T>()`.

### Multi-tenancy

Every tenant (school) has its own API base URL and theme. On boot, `app/plugins/01.settings.ts`
resolves the current tenant by hostname against `TENANT_BASE_DOMAIN`, then:

- points the shared HTTP client at that tenant's own `env.BASE_URL` (`app/plugins/02.http.ts`),
- applies its colors via `--ui-primary` / `--ui-secondary` CSS custom properties.

`SETTINGS_DOMAIN` overrides hostname-based resolution for local dev, where `localhost` doesn't
match a real tenant subdomain.

## Getting started

```bash
pnpm install
cp .env.example .env   # then fill in TENANT_BASE_DOMAIN / SETTINGS_DOMAIN
pnpm dev
```

App runs at `http://localhost:3000` (redirects to `/ar` by default).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview the production build locally |
| `pnpm typecheck` | `nuxt typecheck` |
| `pnpm lint` | `eslint .` |

## Environment variables

See [`.env.example`](.env.example):

- `TENANT_BASE_DOMAIN` — base URL of the tenant-management service used to resolve the current
  tenant by hostname.
- `SETTINGS_DOMAIN` — overrides hostname-based tenant resolution (local dev only).
