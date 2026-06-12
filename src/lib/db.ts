import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

let prismaInstance: PrismaClient | null = null

export function getDb(env?: any): PrismaClient {
  const d1 = env?.DB

  if (d1) {
    if (!prismaInstance) {
      const adapter = new PrismaD1(d1)
      prismaInstance = new PrismaClient({ adapter } as any)
    }
    return prismaInstance
  }

  if (!prismaInstance) {
    prismaInstance = new PrismaClient()
  }
  return prismaInstance
}