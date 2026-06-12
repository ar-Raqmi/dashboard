import { BaseService } from './base'

export class GoalService extends BaseService {
  async list(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const goals = await this.db.goal.findMany({
      where: { userId: user.id },
      include: { milestones: true },
      orderBy: { order: 'asc' },
    })
    return goals.map((g: any) => ({
      id: g.id,
      title: g.title,
      progress: g.progress,
      order: g.order ?? 0,
      createdAt: g.createdAt.toISOString(),
      milestones: g.milestones
        .sort((a: any, b: any) => a.order - b.order)
        .map((m: any) => ({
          id: m.id,
          label: m.label,
          completed: m.completed,
        })),
    }))
  }

  async create(args: {
    sessionToken: string
    title: string
    progress: number
    order?: number
    milestones?: Array<{ label: string; completed: boolean }>
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { title, progress, order, milestones } = args
    const goal = await this.db.goal.create({
      data: {
        userId: user.id,
        title,
        progress,
        order: order ?? 0,
      },
    })

    if (milestones && milestones.length > 0) {
      await this.db.milestone.createMany({
        data: milestones.map((m: any, idx: number) => ({
          goalId: goal.id,
          label: m.label,
          completed: m.completed,
          order: idx,
        })),
      })
    }

    return goal.id
  }

  async update(args: {
    sessionToken: string
    goalId: string
    title?: string
    progress?: number
    order?: number
    milestones?: Array<{ label: string; completed: boolean }>
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { goalId, title, progress, order, milestones } = args
    const goal = await this.db.goal.findUnique({ where: { id: goalId } })
    if (!goal || goal.userId !== user.id) {
      throw new Error('Goal not found or unauthorized')
    }

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (order !== undefined) updates.order = order

    if (milestones !== undefined) {
      // Delete existing milestones
      await this.db.milestone.deleteMany({ where: { goalId } })
      // Insert updated milestones
      if (milestones.length > 0) {
        await this.db.milestone.createMany({
          data: milestones.map((m: any, idx: number) => ({
            goalId,
            label: m.label,
            completed: m.completed,
            order: idx,
          })),
        })
      }

      // Recalculate progress if not explicitly provided
      if (progress === undefined) {
        const completedCount = milestones.filter((m: any) => m.completed).length
        const totalCount = milestones.length
        updates.progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
      }
    }

    if (progress !== undefined) {
      updates.progress = progress
    }

    await this.db.goal.update({
      where: { id: goalId },
      data: updates,
    })
    return { success: true }
  }

  async remove(args: { sessionToken: string; goalId: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { goalId } = args
    const goal = await this.db.goal.findUnique({ where: { id: goalId } })
    if (!goal || goal.userId !== user.id) {
      throw new Error('Goal not found or unauthorized')
    }
    await this.db.goal.delete({ where: { id: goalId } })
    return { success: true }
  }

  async toggleMilestone(args: { sessionToken: string; goalId: string; milestoneId: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { goalId, milestoneId } = args
    const goal = await this.db.goal.findUnique({ where: { id: goalId } })
    if (!goal || goal.userId !== user.id) {
      throw new Error('Goal not found or unauthorized')
    }

    const milestone = await this.db.milestone.findUnique({ where: { id: milestoneId } })
    if (!milestone || milestone.goalId !== goalId) {
      throw new Error('Milestone not found')
    }

    const newCompleted = !milestone.completed
    await this.db.milestone.update({
      where: { id: milestoneId },
      data: { completed: newCompleted },
    })

    // Recalculate progress
    const allMilestones = await this.db.milestone.findMany({ where: { goalId } })
    const completed = allMilestones.filter((m: any) => m.id === milestoneId ? newCompleted : m.completed).length
    const total = allMilestones.length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    await this.db.goal.update({
      where: { id: goalId },
      data: { progress },
    })
    return { success: true }
  }

  async reorder(args: { sessionToken: string; goalIds: string[] }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { goalIds } = args
    for (let i = 0; i < goalIds.length; i++) {
      const goal = await this.db.goal.findUnique({ where: { id: goalIds[i] } })
      if (goal && goal.userId === user.id) {
        await this.db.goal.update({
          where: { id: goalIds[i] },
          data: { order: i },
        })
      }
    }
    return { success: true }
  }
}
