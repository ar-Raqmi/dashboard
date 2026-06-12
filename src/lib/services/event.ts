import { BaseService } from './base'

export class EventService extends BaseService {
  async list(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const events = await this.db.calendarEvent.findMany({
      where: { userId: user.id },
    })
    return events.map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      color: e.color || undefined,
    }))
  }

  async create(args: { sessionToken: string; title: string; date: string; color?: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { title, date, color } = args
    const e = await this.db.calendarEvent.create({
      data: {
        userId: user.id,
        title,
        date,
        color: color || null,
      },
    })
    return e.id
  }

  async remove(args: { sessionToken: string; eventId: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { eventId } = args
    const event = await this.db.calendarEvent.findUnique({ where: { id: eventId } })
    if (!event || event.userId !== user.id) {
      throw new Error('Event not found or unauthorized')
    }
    await this.db.calendarEvent.delete({ where: { id: eventId } })
    return { success: true }
  }
}
