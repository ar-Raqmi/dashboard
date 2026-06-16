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

  // Local dev (next dev or wrangler pages dev without D1 binding):
  // Falls back to standard Prisma using DATABASE_URL from .env.local
  if (!globalForPrisma.prismaLocal) {
    globalForPrisma.prismaLocal = new PrismaClient()
  }
  return globalForPrisma.prismaLocal
}