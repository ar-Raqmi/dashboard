import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

export function getDb(env?: any): PrismaClient {
  const d1 = env?.DB

  if (d1) {
    // Cloudflare Pages / Workers: always create a fresh client per request.
    // Do NOT cache in global state — the D1 binding is scoped to the request
    // context and becomes invalid across requests on the Edge Runtime.
    const adapter = new PrismaD1(d1)
    return new PrismaClient({ adapter } as any)
  }

  throw new Error(
    "D1 Database binding 'DB' is missing. Please bind your D1 database to the 'DB' variable in the Cloudflare Pages project settings."
  )
}