import { BaseService } from './base'
import { buildExceptionMap } from '../recurrence'
import type { RecurrenceEntityType, ExceptionOverride } from '../recurrence'

/**
 * Owns the shared `RecurrenceException` table, which stores per-occurrence
 * overrides (complete / cancel / postpone / rename) for recurring tasks and
 * events. Both TaskService and EventService compose this service.
 */
export class RecurrenceService extends BaseService {
  /** Returns all exceptions for the given entity ids, as an override map. */
  async getExceptionMap(args: {
    sessionToken: string
    entityType: RecurrenceEntityType
    entityIds: string[]
  }): Promise<Record<string, ExceptionOverride>> {
    const user = await this.getAuthedUser(args.sessionToken)
    if (args.entityIds.length === 0) return {}
    const rows = await this.db.recurrenceException.findMany({
      where: { userId: user.id, entityType: args.entityType, entityId: { in: args.entityIds } },
    })
    return buildExceptionMap(
      rows.map((r: any) => ({
        entityId: r.entityId,
        date: r.date,
        status: r.status,
        newDate: r.newDate,
        title: r.title,
      })),
    )
  }

  /** Upserts a single occurrence override (create or replace). */
  async setException(args: {
    sessionToken: string
    entityType: RecurrenceEntityType
    entityId: string
    date: string
    status?: string | null
    newDate?: string | null
    title?: string | null
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { entityType, entityId, date, status, newDate, title } = args
    const existing = await this.db.recurrenceException.findFirst({
      where: { userId: user.id, entityType, entityId, date },
    })
    if (existing) {
      await this.db.recurrenceException.update({
        where: { id: existing.id },
        data: { status, newDate, title },
      })
    } else {
      await this.db.recurrenceException.create({
        data: {
          userId: user.id,
          entityType,
          entityId,
          date,
          status: status ?? null,
          newDate: newDate ?? null,
          title: title ?? null,
        },
      })
    }
    return { success: true }
  }

  /** Clears a single occurrence override (reverts to template behaviour). */
  async removeException(args: {
    sessionToken: string
    entityType: RecurrenceEntityType
    entityId: string
    date: string
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    await this.db.recurrenceException.deleteMany({
      where: { userId: user.id, entityType: args.entityType, entityId: args.entityId, date: args.date },
    })
    return { success: true }
  }

  /** Removes every override for an entity (used when a series is deleted). */
  async removeAllForEntity(args: {
    sessionToken: string
    entityType: RecurrenceEntityType
    entityId: string
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    await this.db.recurrenceException.deleteMany({
      where: { userId: user.id, entityType: args.entityType, entityId: args.entityId },
    })
    return { success: true }
  }
}
