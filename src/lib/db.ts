import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

let localPrismaInstance: PrismaClient | null = null

export function getDb(env?: any): PrismaClient {
  const d1 = env?.DB

  if (d1) {
    const adapter = new PrismaD1(d1)
    return new PrismaClient({ adapter } as any)
  }

  // Safety check for Edge runtime to prevent fatal 1101 worker crashes
  const isEdge =
    typeof process === 'undefined' ||
    process.env?.NEXT_RUNTIME === 'edge' ||
    typeof EdgeRuntime === 'string' ||
    typeof globalThis.WebSocketPair !== 'undefined' ||
    !process.versions ||
    !process.versions.node
  
  if (isEdge) {
    throw new Error(
      "D1 Database binding 'DB' is missing. " +
      "Please configure the D1 database binding 'DB' to your D1 database in your Cloudflare Pages dashboard " +
      "under Settings -> Functions -> D1 Database Bindings, and redeploy."
    )
  }

  // Local dev (next dev or wrangler pages dev without D1 binding)
  if (!localPrismaInstance) {
    localPrismaInstance = new PrismaClient()
  }
  return localPrismaInstance
}