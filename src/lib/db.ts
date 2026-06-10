import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

let prismaClient: PrismaClient | null = null

export function getDb(env?: any): PrismaClient {
  if (prismaClient) return prismaClient

  const d1 = env?.DB || (process.env as any).DB

  if (d1) {
    const adapter = new PrismaD1(d1)
    prismaClient = new PrismaClient({ adapter })
  } else {
    prismaClient = new PrismaClient()
  }

  return prismaClient
}

// Default export of local client for scripts or standard environments
export const db = getDb()