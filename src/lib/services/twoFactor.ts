import { BaseService } from './base'
import { TOTP } from 'otpauth'
import { encryptText, decryptText } from '../crypto'

export class TwoFactorService extends BaseService {
  async list(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const secrets = await this.db.twoFactorSecret.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    const list = []
    for (const s of secrets) {
      const decrypted = await decryptText(s.secret)
      let token = '------'
      let remainingSeconds = 30
      try {
        const cleanSecret = decrypted.replace(/\s+/g, '').toUpperCase()
        const totp = new TOTP({ secret: cleanSecret })
        token = totp.generate()
        remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30)
      } catch (err) {
        console.error('Failed to generate TOTP for', s.accountName, err)
      }

      list.push({
        id: s.id,
        accountName: s.accountName,
        category: s.category || 'Other',
        icon: s.icon || undefined,
        token,
        remainingSeconds,
      })
    }
    return list
  }

  async create(args: {
    sessionToken: string
    accountName: string
    secret: string
    category?: string
    icon?: string
  }) {
    await this.getAuthedUser(args.sessionToken)
    const { accountName, secret, category, icon } = args

    const cleanSecret = secret.replace(/\s+/g, '').toUpperCase()
    try {
      new TOTP({ secret: cleanSecret })
    } catch (err) {
      return { success: false, error: 'Invalid secret key. Must be a valid Base32 string.' }
    }

    const encrypted = await encryptText(cleanSecret)
    const user = await this.getAuthedUser(args.sessionToken)
    await this.db.twoFactorSecret.create({
      data: {
        userId: user.id,
        accountName,
        secret: encrypted,
        category: category || 'Other',
        icon: icon || undefined,
        updatedAt: new Date(),
      },
    })
    return { success: true }
  }

  async update(args: {
    sessionToken: string
    id: string
    accountName?: string
    category?: string
    icon?: string
    secret?: string
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { id, accountName, category, icon, secret } = args
    if (!id) throw new Error('Missing account id')
    const item = await this.db.twoFactorSecret.findUnique({ where: { id } })
    if (!item || item.userId !== user.id) {
      throw new Error('2FA account not found or unauthorized')
    }

    const updates: any = {}
    if (accountName !== undefined) updates.accountName = accountName
    if (category !== undefined) updates.category = category || 'Other'
    if (icon !== undefined) updates.icon = icon || null

    if (secret !== undefined && secret.trim() !== '') {
      const cleanSecret = secret.replace(/\s+/g, '').toUpperCase()
      try {
        new TOTP({ secret: cleanSecret })
      } catch (err) {
        return { success: false, error: 'Invalid secret key. Must be a valid Base32 string.' }
      }
      updates.secret = await encryptText(cleanSecret)
    }

    await this.db.twoFactorSecret.update({
      where: { id },
      data: updates,
    })
    return { success: true }
  }

  async remove(args: { sessionToken: string; id: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { id } = args
    const item = await this.db.twoFactorSecret.findUnique({ where: { id } })
    if (!item || item.userId !== user.id) {
      throw new Error('2FA account not found or unauthorized')
    }
    await this.db.twoFactorSecret.delete({ where: { id } })
    return { success: true }
  }
}
