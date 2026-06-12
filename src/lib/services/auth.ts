import { BaseService } from './base'

export class AuthService extends BaseService {
  async validateSession(args: { sessionToken: string }) {
    const { sessionToken } = args
    try {
      const user = await this.getAuthedUser(sessionToken)
      return {
        userId: user.id,
        username: user.username,
      }
    } catch (err) {
      return null
    }
  }

  async getUserByUsername(args: { username: string }) {
    const { username } = args
    const user = await this.db.user.findUnique({
      where: { username },
    })
    if (!user) return null
    return {
      _id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      salt: user.salt,
    }
  }

  async createSession(args: { userId: string; token: string; expiresAt: string | Date }) {
    const { userId, token, expiresAt } = args
    return await this.db.session.create({
      data: {
        userId,
        token,
        expiresAt: new Date(expiresAt),
      },
    })
  }

  async removeSession(args: { token: string }) {
    const { token } = args
    try {
      await this.db.session.delete({
        where: { token },
      })
    } catch (err) {
      // Already removed
    }
    return { success: true }
  }

  async updateUser(args: {
    sessionToken: string
    newUsername?: string
    newPasswordHash?: string
    newSalt?: string
  }) {
    const { sessionToken, newUsername, newPasswordHash, newSalt } = args
    const user = await this.getAuthedUser(sessionToken)

    const updates: any = {}
    if (newUsername) {
      const existing = await this.db.user.findUnique({
        where: { username: newUsername },
      })
      if (existing && existing.id !== user.id) {
        return { success: false, error: 'Username already taken' }
      }
      updates.username = newUsername
    }
    if (newPasswordHash) {
      updates.passwordHash = newPasswordHash
      updates.salt = newSalt
    }

    await this.db.user.update({
      where: { id: user.id },
      data: updates,
    })
    return { success: true }
  }
}
