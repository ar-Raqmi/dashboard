import { PrismaClient } from '@prisma/client'

export abstract class BaseService {
  protected db: PrismaClient
  protected env: any

  constructor(db: PrismaClient, env?: any) {
    this.db = db
    this.env = env
  }

  protected async getAuthedUser(sessionToken: string) {
    if (!sessionToken) {
      throw new Error('Unauthorized: Session token missing')
    }
    const session = await this.db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
      throw new Error('Unauthorized: Invalid or expired session')
    }
    return session.user
  }
}
