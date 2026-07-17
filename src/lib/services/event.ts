import { BaseService } from './base'
import { RecurrenceService } from './recurrence'
import { expandRecurring, getDefaultRecurrenceWindow } from '../recurrence'

export class EventService extends BaseService {
  async list(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const events = await this.db.calendarEvent.findMany({
      where: { userId: user.id },
    })
    const mapped = events.map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      color: e.color || undefined,
      startTime: e.startTime ?? null,
      endTime: e.endTime ?? null,
      allDay: e.allDay ?? (e.startTime ? false : true),
      rrule: e.rrule,
      dtstart: e.dtstart,
      recurrenceUntil: e.recurrenceUntil,
      recurrenceCount: e.recurrenceCount,
    }))

    const templateIds = mapped.filter((e: any) => e.rrule).map((e: any) => e.id)
    if (templateIds.length === 0) return mapped.map((e: any) => ({ ...e, isRecurring: false }))

    const recurrenceService = new RecurrenceService(this.db, this.env)
    const exceptions = await recurrenceService.getExceptionMap({
      sessionToken: args.sessionToken,
      entityType: 'event',
      entityIds: templateIds,
    })
    const { windowStart, windowEnd } = getDefaultRecurrenceWindow()
    return expandRecurring(mapped, {
      dateField: 'date',
      windowStart,
      windowEnd,
      exceptions,
    })
  }

  async create(args: {
    sessionToken: string
    title: string
    date: string
    color?: string
    startTime?: string | null
    endTime?: string | null
    allDay?: boolean
    rrule?: string | null
    dtstart?: string | null
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { title, date, color, startTime, endTime, allDay, rrule, dtstart } = args
    const e = await this.db.calendarEvent.create({
      data: {
        userId: user.id,
        title,
        date,
        color: color || null,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        allDay: allDay ?? true,
        rrule: rrule ?? null,
        dtstart: dtstart ?? null,
      },
    })
    return e.id
  }

  async update(args: {
    sessionToken: string
    eventId: string
    title?: string
    date?: string
    color?: string
    startTime?: string | null
    endTime?: string | null
    allDay?: boolean
    rrule?: string | null
    dtstart?: string | null
    clearRecurrence?: boolean
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { eventId, rrule, dtstart, clearRecurrence, ...updates } = args
    const event = await this.db.calendarEvent.findUnique({ where: { id: eventId } })
    if (!event || event.userId !== user.id) {
      throw new Error('Event not found or unauthorized')
    }

    const cleanUpdates: any = {}
    if (updates.title !== undefined) cleanUpdates.title = updates.title
    if (updates.date !== undefined) cleanUpdates.date = updates.date
    if (updates.color !== undefined) cleanUpdates.color = updates.color
    if (updates.startTime !== undefined) cleanUpdates.startTime = updates.startTime
    if (updates.endTime !== undefined) cleanUpdates.endTime = updates.endTime
    if (updates.allDay !== undefined) cleanUpdates.allDay = updates.allDay

    if (clearRecurrence) {
      cleanUpdates.rrule = null
      cleanUpdates.dtstart = null
      cleanUpdates.recurrenceUntil = null
      cleanUpdates.recurrenceCount = null
    } else {
      if (rrule !== undefined) cleanUpdates.rrule = rrule
      if (dtstart !== undefined) cleanUpdates.dtstart = dtstart
    }

    await this.db.calendarEvent.update({
      where: { id: eventId },
      data: cleanUpdates,
    })
    return { success: true }
  }

  async remove(args: { sessionToken: string; eventId: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { eventId } = args
    const event = await this.db.calendarEvent.findUnique({ where: { id: eventId } })
    if (!event || event.userId !== user.id) {
      throw new Error('Event not found or unauthorized')
    }
    await this.db.calendarEvent.delete({ where: { id: eventId } })
    const recurrenceService = new RecurrenceService(this.db, this.env)
    await recurrenceService.removeAllForEntity({ sessionToken: args.sessionToken, entityType: 'event', entityId: eventId })
    return { success: true }
  }

  /** Per-occurrence override for a recurring event (cancel / postpone / rename). */
  async setOccurrenceException(args: {
    sessionToken: string
    entityId: string
    date: string
    status?: string | null
    newDate?: string | null
    title?: string | null
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { entityId, date, status, newDate, title } = args
    const event = await this.db.calendarEvent.findUnique({ where: { id: entityId } })
    if (!event || event.userId !== user.id) {
      throw new Error('Event not found or unauthorized')
    }
    const recurrenceService = new RecurrenceService(this.db, this.env)
    return recurrenceService.setException({
      sessionToken: args.sessionToken,
      entityType: 'event',
      entityId,
      date,
      status,
      newDate,
      title,
    })
  }
}
