# Dashboard Developer Guidelines

This project is built on a fully local and serverless architecture powered by Cloudflare Pages.

## Tech Stack
- **Frontend**: Next.js (Edge Runtime) & React 19
- **Database**: Cloudflare D1 (managed via Prisma ORM)
- **Object Storage**: Cloudflare R2
- **Styling**: TailwindCSS & shadcn/ui

## Code Architecture
- All API interactions on the client side must go through the unified, static [ApiClient](src/lib/api-client.ts) (`ApiClient.query` and `ApiClient.mutate`). Do not perform manual fetches to `/api/query` or `/api/mutation`.
- Client-side queries/mutations can also use the `useQuery` / `useMutation` React hooks in [useApi.ts](src/hooks/useApi.ts).
- The backend routes requests through a single unified OOP API Router ([api-router.ts](src/lib/api-router.ts)).
- Domain logic is encapsulated in object-oriented service classes extending `BaseService` under [src/lib/services/](src/lib/services/).
- The database instance is managed dynamically per-request using `AsyncLocalStorage` to bind Cloudflare D1 to Prisma ([db.ts](src/lib/db.ts)).

## Development Commands
- Build project for Cloudflare Pages: `npm run pages:build`
- Run wrangler local emulation (D1 and R2):
  `npx wrangler pages dev .vercel/output/static --compatibility-date=2025-01-01 --d1=DB`
- Sync local Prisma schema: `npm run db:push`
- Regenerate Prisma client: `npm run db:generate`
- Deploy to Cloudflare Pages (recommends setting up DB bindings first): `npm run pages:deploy`
