import { BaseService } from './base'

export class TaskService extends BaseService {
  async list(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const tasks = await this.db.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    }))
  }

  async create(args: {
    sessionToken: string
    title: string
    dueDate?: string | null
    priority: string
    status: string
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { title, dueDate, priority, status } = args
    const t = await this.db.task.create({
      data: {
        userId: user.id,
        title,
        dueDate: dueDate || null,
        priority,
        status,
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
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { taskId, ...updates } = args
    const task = await this.db.task.findUnique({ where: { id: taskId } })
    if (!task || task.userId !== user.id) {
      throw new Error('Task not found or unauthorized')
    }

    const cleanUpdates: any = {}
    if (updates.title !== undefined) cleanUpdates.title = updates.title
    if (updates.dueDate !== undefined) cleanUpdates.dueDate = updates.dueDate
    if (updates.priority !== undefined) cleanUpdates.priority = updates.priority
    if (updates.status !== undefined) cleanUpdates.status = updates.status

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
    return { success: true }
  }

  async deleteCompleted(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    await this.db.task.deleteMany({
      where: { userId: user.id, status: 'completed' },
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
}
