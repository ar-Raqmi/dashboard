import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

export function getDb(env?: any): PrismaClient {
  const d1 = env?.DB

  if (d1) {
    // Cloudflare Pages / Workers: use D1 binding
    const adapter = new PrismaD1(d1)
    return new PrismaClient({ adapter } as any)
  }

  // Local dev (next dev or wrangler pages dev without D1 binding):
  // Falls back to standard Prisma using DATABASE_URL from .env.local
  return new PrismaClient()
}