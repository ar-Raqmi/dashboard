import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { AsyncLocalStorage } from 'node:async_hooks'

export const d1Storage = new AsyncLocalStorage<any>()

let d1PrismaInstance: PrismaClient | null = null
let localPrismaInstance: PrismaClient | null = null

// Create a proxy that dynamically routes database operations to the active request's D1 binding in AsyncLocalStorage.
// This prevents connection context closed errors while allowing us to reuse the PrismaClient instance safely across concurrent requests.
const d1Proxy = new Proxy({} as any, {
  get(target, prop) {
    const activeD1 = d1Storage.getStore()
    if (!activeD1) {
      throw new Error("D1 database binding is not set in AsyncLocalStorage for the current request")
    }
    const value = activeD1[prop]
    if (typeof value === 'function') {
      return value.bind(activeD1)
    }
    return value
  }
})

export function getDb(env?: any): PrismaClient {
  const d1 = env?.DB

  if (d1) {
    if (!d1PrismaInstance) {
      const adapter = new PrismaD1(d1Proxy)
      d1PrismaInstance = new PrismaClient({ adapter } as any)
    }
    return d1PrismaInstance
  }

  // Local dev (next dev or wrangler pages dev without D1 binding)
  if (!localPrismaInstance) {
    localPrismaInstance = new PrismaClient()
  }
  return localPrismaInstance
}