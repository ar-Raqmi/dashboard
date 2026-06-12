import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

let prismaInstance: PrismaClient | null = null
let currentD1: any = null

// Create a proxy that dynamically routes database operations to the active request's D1 binding.
// This prevents connection context closed errors while allowing us to reuse the PrismaClient instance.
const d1Proxy = new Proxy({} as any, {
  get(target, prop) {
    if (!currentD1) {
      throw new Error("D1 database binding is not set for the current request")
    }
    const value = currentD1[prop]
    if (typeof value === 'function') {
      return value.bind(currentD1)
    }
    return value
  }
})

export function getDb(env?: any): PrismaClient {
  const d1 = env?.DB

  if (d1) {
    currentD1 = d1 // Dynamically update the active D1 binding to the current request context
    if (!prismaInstance) {
      const adapter = new PrismaD1(d1Proxy)
      prismaInstance = new PrismaClient({ adapter } as any)
    }
    return prismaInstance
  }

  // Local dev (next dev or wrangler pages dev without D1 binding)
  if (!prismaInstance) {
    prismaInstance = new PrismaClient()
  }
  return prismaInstance
}