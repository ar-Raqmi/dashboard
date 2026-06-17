import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

const globalForPrisma = globalThis as unknown as {
  prismaD1: PrismaClient | undefined
  prismaLocal: PrismaClient | undefined
}

export function getDb(env?: any): PrismaClient {
  // If we already have the cached connection, return it immediately to bypass potential context loss
  if (globalForPrisma.prismaD1) {
    return globalForPrisma.prismaD1
  }

  const d1 = env?.DB || (process.env as any)?.DB || (globalThis as any)?.DB

  if (d1) {
    // Cloudflare Pages / Workers: use D1 binding
    const adapter = new PrismaD1(d1)
    globalForPrisma.prismaD1 = new PrismaClient({ adapter } as any)
    return globalForPrisma.prismaD1
  }

  throw new Error(
    "D1 Database binding 'DB' is missing. Please bind your D1 database to the 'DB' variable in the Cloudflare Pages project settings (for both Production and Preview environments)."
  )
}