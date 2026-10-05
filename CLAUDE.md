# Dashboard Developer Guidelines

A personal workspace (tasks, calendar, notes, goals, files, prayer times, 2FA codes) built as a
Vite single-page app on Cloudflare Pages.

## Tech stack
- **Frontend**: Vite 7, React 19, TypeScript, Tailwind CSS 4, Zustand
- **API**: Cloudflare Pages Functions. One catch-all, [functions/api/[[path]].ts](functions/api/[[path]].ts), hands every `/api/*` request to [server/api.ts](server/api.ts)
- **Data**: Cloudflare D1 (binding `DB`, plain SQL through `server/db.ts`) and R2 (binding `BUCKET`)
- **Schema**: numbered SQL files in [db/migrations](db/migrations); `0001_baseline.sql` mirrors production

## Code architecture
- Domain logic lives in service classes under [server/services/](server/services/), each extending `BaseService` and scoped to the signed-in user for one request. Add behaviour to the matching service rather than to the router.
- The client talks to the API only through [src/api.ts](src/api.ts); do not call `fetch('/api/...')` from components.
- Settings, theme and UI state live in the Zustand store ([src/store.ts](src/store.ts)).
- Keep React components as functions; use classes for services and clients.
- Do not rename stored identifiers: the `overhaul:` keys in `DashboardLayout.layoutType` and the `overhaul/` R2 key prefix are live data.

## Commands
- `npm run dev`: Vite dev server (proxies `/api` to `wrangler pages dev` on :8788)
- `npm run preview`: build, then `wrangler pages dev` with local D1 and R2
- `npm run typecheck` / `npm run build`: the checks to run before every commit
- `npx wrangler d1 migrations apply dashboard-db --local|--remote`: apply schema changes
- `npm run deploy`: build and publish to **production** (`--branch=main`). Any other branch is a preview that shares production's D1 and R2

## Conventions
- Small, focused commits in `type(scope): message` form. No co-author trailer.
- Comments explain why, not what.
- `wrangler.toml` and `.dev.vars` are gitignored; edit `wrangler.toml.example` and `.dev.vars.example` when the shape changes.
