import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

const globalForPrisma = globalThis as unknown as {
  prismaD1: PrismaClient | undefined
  prismaLocal: PrismaClient | undefined
}

export function getDb(env?: any): PrismaClient {
  const d1 = env?.DB

  if (d1) {
    // Cloudflare Pages / Workers: use D1 binding
    if (!globalForPrisma.prismaD1) {
      const adapter = new PrismaD1(d1)
      globalForPrisma.prismaD1 = new PrismaClient({ adapter } as any)
    }
    return globalForPrisma.prismaD1
  }

  // If we are in the Edge runtime but have no D1 binding, throw a clear configuration error
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error(
      "D1 Database binding 'DB' is missing in Pages settings. Please bind your D1 database to the 'DB' variable in the Cloudflare Pages project settings (for both Production and Preview environments)."
    )
  }

  // Local dev (next dev or wrangler pages dev without D1 binding):
  // Falls back to standard Prisma using DATABASE_URL from .env.local
  if (!globalForPrisma.prismaLocal) {
    globalForPrisma.prismaLocal = new PrismaClient()
  }
  return globalForPrisma.prismaLocal
}