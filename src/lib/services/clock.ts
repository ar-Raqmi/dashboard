import { BaseService } from './base'

export class ClockService extends BaseService {
  async list(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const clocks = await this.db.clock.findMany({
      where: { userId: user.id },
    })
    return clocks.map((c: any) => ({
      id: c.id,
      label: c.label,
      timezone: c.timezone,
    }))
  }

  async add(args: { sessionToken: string; label: string; timezone: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { label, timezone } = args
    const c = await this.db.clock.create({
      data: {
        userId: user.id,
        label,
        timezone,
      },
    })
    return c.id
  }

  async remove(args: { sessionToken: string; id: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { id } = args
    const clock = await this.db.clock.findUnique({ where: { id } })
    if (!clock || clock.userId !== user.id) {
      throw new Error('Clock not found or unauthorized')
    }
    await this.db.clock.delete({ where: { id } })
    return { success: true }
  }

  async update(args: { sessionToken: string; id: string; label: string; timezone: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { id, label, timezone } = args
    const clock = await this.db.clock.findUnique({ where: { id } })
    if (!clock || clock.userId !== user.id) {
      throw new Error('Clock not found or unauthorized')
    }
    await this.db.clock.update({
      where: { id },
      data: { label, timezone },
    })
    return { success: true }
  }
}
