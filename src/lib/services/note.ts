import { BaseService } from './base'

export class NoteService extends BaseService {
  async list(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const notes = await this.db.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })
    return notes.map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      color: n.color,
      pinned: n.pinned,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }))
  }

  async create(args: {
    sessionToken: string
    title: string
    content: string
    color: string
    pinned: boolean
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { title, content, color, pinned } = args
    const n = await this.db.note.create({
      data: {
        userId: user.id,
        title,
        content,
        color,
        pinned,
        updatedAt: new Date(),
      },
    })
    return n.id
  }

  async update(args: {
    sessionToken: string
    id?: string
    noteId?: string
    title?: string
    content?: string
    color?: string
    pinned?: boolean
  }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const id = args.id || args.noteId
    if (!id) throw new Error('Missing note id')
    
    const note = await this.db.note.findUnique({ where: { id } })
    if (!note || note.userId !== user.id) {
      throw new Error('Note not found or unauthorized')
    }

    const cleanUpdates: any = {}
    if (args.title !== undefined) cleanUpdates.title = args.title
    if (args.content !== undefined) cleanUpdates.content = args.content
    if (args.color !== undefined) cleanUpdates.color = args.color
    if (args.pinned !== undefined) cleanUpdates.pinned = args.pinned

    await this.db.note.update({
      where: { id },
      data: cleanUpdates,
    })
    return { success: true }
  }

  async remove(args: { sessionToken: string; id?: string; noteId?: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const id = args.id || args.noteId
    if (!id) throw new Error('Missing note id')

    const note = await this.db.note.findUnique({ where: { id } })
    if (!note || note.userId !== user.id) {
      throw new Error('Note not found or unauthorized')
    }
    await this.db.note.delete({ where: { id } })
    return { success: true }
  }

  async togglePinned(args: { sessionToken: string; id?: string; noteId?: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const id = args.id || args.noteId
    if (!id) throw new Error('Missing note id')

    const note = await this.db.note.findUnique({ where: { id } })
    if (!note || note.userId !== user.id) {
      throw new Error('Note not found or unauthorized')
    }
    await this.db.note.update({
      where: { id },
      data: { pinned: !note.pinned },
    })
    return { success: true }
  }
}
