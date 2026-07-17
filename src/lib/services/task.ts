import { BaseService } from './base'
import { RecurrenceService } from './recurrence'
import { expandRecurring, getDefaultRecurrenceWindow } from '../recurrence'

export class TaskService extends BaseService {
  async list(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const tasks = await this.db.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    const mapped = tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      rrule: t.rrule,
      dtstart: t.dtstart,
      recurrenceUntil: t.recurrenceUntil,
      recurrenceCount: t.recurrenceCount,
    }))

    // Expand recurring templates into virtual instances within the window
    const templateIds = mapped.filter((t: any) => t.rrule).map((t: any) => t.id)
    if (templateIds.length === 0) return mapped.map((t: any) => ({ ...t, isRecurring: false }))

    const recurrenceService = new RecurrenceService(this.db, this.env)
    const exceptions = await recurrenceService.getExceptionMap({
      sessionToken: args.sessionToken,
      entityType: 'task',
      entityIds: templateIds,
    })
    const { windowStart, windowEnd } = getDefaultRecurrenceWindow()
    return expandRecurring(mapped, {
      dateField: 'dueDate',
      windowStart,
      windowEnd,
      exceptions,
      defaultStatus: 'pending',
    })
  }

  async create(args: {
    sessionToken: string
    title: string
    dueDate?: string | null
    priority: string
    status: string
    rrule?: string | null
    dtstart?: string | null
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { title, dueDate, priority, status, rrule, dtstart } = args
    const t = await this.db.task.create({
      data: {
        userId: user.id,
        title,
        dueDate: dueDate || dtstart || null,
        priority,
        status,
        rrule: rrule ?? null,
        dtstart: dtstart ?? null,
      },
    })
    return t.id
  }

  async update(args: {
    sessionToken: string
    taskId: string
    title?: string
    dueDate?: string | null
    priority?: string
    status?: string
    rrule?: string | null
    dtstart?: string | null
    clearRecurrence?: boolean
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { taskId, rrule, dtstart, clearRecurrence, ...updates } = args
    const task = await this.db.task.findUnique({ where: { id: taskId } })
    if (!task || task.userId !== user.id) {
      throw new Error('Task not found or unauthorized')
    }

    const cleanUpdates: any = {}
    if (updates.title !== undefined) cleanUpdates.title = updates.title
    if (updates.dueDate !== undefined) cleanUpdates.dueDate = updates.dueDate
    if (updates.priority !== undefined) cleanUpdates.priority = updates.priority
    if (updates.status !== undefined) cleanUpdates.status = updates.status

    if (clearRecurrence) {
      cleanUpdates.rrule = null
      cleanUpdates.dtstart = null
      cleanUpdates.recurrenceUntil = null
      cleanUpdates.recurrenceCount = null
    } else {
      if (rrule !== undefined) cleanUpdates.rrule = rrule
      if (dtstart !== undefined) cleanUpdates.dtstart = dtstart
    }

    await this.db.task.update({
      where: { id: taskId },
      data: cleanUpdates,
    })
    return { success: true }
  }

  async remove(args: { sessionToken: string; taskId: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { taskId } = args
    const task = await this.db.task.findUnique({ where: { id: taskId } })
    if (!task || task.userId !== user.id) {
      throw new Error('Task not found or unauthorized')
    }
    await this.db.task.delete({ where: { id: taskId } })
    // also drop any per-occurrence overrides for this (template) task
    const recurrenceService = new RecurrenceService(this.db, this.env)
    await recurrenceService.removeAllForEntity({ sessionToken: args.sessionToken, entityType: 'task', entityId: taskId })
    return { success: true }
  }

  async deleteCompleted(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    await this.db.task.deleteMany({
      where: { userId: user.id, status: 'completed', rrule: null },
    })
    return { success: true }
  }

  async deleteOldCompleted(args: { sessionToken: string; today: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { today } = args
    await this.db.task.deleteMany({
      where: {
        userId: user.id,
        status: 'completed',
        rrule: null,
        dueDate: { lt: today },
      },
    })
    return { success: true }
  }

  async toggleStatus(args: { sessionToken: string; taskId: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { taskId } = args
    const task = await this.db.task.findUnique({ where: { id: taskId } })
    if (!task || task.userId !== user.id) {
      throw new Error('Task not found or unauthorized')
    }
    await this.db.task.update({
      where: { id: taskId },
      data: {
        status: task.status === 'pending' ? 'completed' : 'pending',
      },
    })
    return { success: true }
  }

  /** Per-occurrence override for a recurring task (complete / postpone / cancel). */
  async setOccurrenceException(args: {
    sessionToken: string
    entityId: string
    date: string
    status?: string | null
    newDate?: string | null
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { entityId, date, status, newDate } = args
    const task = await this.db.task.findUnique({ where: { id: entityId } })
    if (!task || task.userId !== user.id) {
      throw new Error('Task not found or unauthorized')
    }
    const recurrenceService = new RecurrenceService(this.db, this.env)
    return recurrenceService.setException({
      sessionToken: args.sessionToken,
      entityType: 'task',
      entityId,
      date,
      status,
      newDate,
    })
  }
}
