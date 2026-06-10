import { getDb } from './db'
import { encryptText, decryptText } from './crypto'
import { TOTP } from 'otpauth'

// Helper: Verify session token and return user
async function getAuthedUser(db: any, sessionToken: string) {
  if (!sessionToken) {
    throw new Error('Unauthorized: Session token missing')
  }
  const session = await db.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  })
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    throw new Error('Unauthorized: Invalid or expired session')
  }
  return session.user
}

// Queries Router
export async function handleQuery(path: string, args: any, env?: any) {
  const db = getDb(env)

  switch (path) {
    case 'auth:validateSession': {
      const { sessionToken } = args
      try {
        const user = await getAuthedUser(db, sessionToken)
        return {
          userId: user.id,
          username: user.username,
        }
      } catch (err) {
        return null
      }
    }

    case 'auth:getUserByUsername': {
      const { username } = args
      const user = await db.user.findUnique({
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

    case 'tasks:list': {
      const user = await getAuthedUser(db, args.sessionToken)
      const tasks = await db.task.findMany({
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

    case 'goals:list': {
      const user = await getAuthedUser(db, args.sessionToken)
      const goals = await db.goal.findMany({
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

    case 'notes:list': {
      const user = await getAuthedUser(db, args.sessionToken)
      const notes = await db.note.findMany({
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

    case 'events:list': {
      const user = await getAuthedUser(db, args.sessionToken)
      const events = await db.calendarEvent.findMany({
        where: { userId: user.id },
      })
      return events.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        color: e.color || undefined,
      }))
    }

    case 'files:listAll': {
      const user = await getAuthedUser(db, args.sessionToken)
      const files = await db.fileItem.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      })
      return files.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.type,
        category: f.category || undefined,
        parentId: f.parentId || null,
        size: f.size || 0,
        storageId: f.storageId || undefined,
        r2Key: f.r2Key || undefined,
        storageSource: f.storageSource || undefined,
        starred: f.starred || false,
        lastAccessed: f.lastAccessed || undefined,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      }))
    }

    case 'clocks:list': {
      const user = await getAuthedUser(db, args.sessionToken)
      const clocks = await db.clock.findMany({
        where: { userId: user.id },
      })
      return clocks.map((c: any) => ({
        id: c.id,
        label: c.label,
        timezone: c.timezone,
      }))
    }

    case 'dashboard:listWidgets': {
      const user = await getAuthedUser(db, args.sessionToken)
      let widgets = await db.dashboardWidget.findMany({
        where: { userId: user.id },
      })

      if (widgets.length === 0) {
        // Seed default widgets
        const defaultWidgets = [
          { type: 'tasks', label: 'Daily Tasks', icon: 'check_circle', visible: true },
          { type: 'calendar', label: 'Calendar', icon: 'calendar_month', visible: true },
          { type: 'notes', label: 'Quick Notes', icon: 'sticky_note_2', visible: true },
          { type: 'verse', label: 'Daily Verse', icon: 'auto_stories', visible: true },
          { type: 'goals', label: 'Goals', icon: 'flag', visible: true },
          { type: 'clock', label: 'World Clock', icon: 'schedule', visible: true },
          { type: 'files', label: 'Files', icon: 'folder', visible: true },
          { type: 'clipboard', label: 'Clipboard', icon: 'content_paste', visible: true },
          { type: 'twoFactor', label: '2FA Authenticator', icon: 'security', visible: true },
        ]
        await db.dashboardWidget.createMany({
          data: defaultWidgets.map((w) => ({ ...w, userId: user.id })),
        })
        widgets = await db.dashboardWidget.findMany({
          where: { userId: user.id },
        })
      }

      return widgets.map((w: any) => ({
        type: w.type,
        label: w.label,
        icon: w.icon,
        visible: w.visible,
      }))
    }

    case 'dashboard:getLayout': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { layoutType } = args
      const entry = await db.dashboardLayout.findFirst({
        where: { userId: user.id, layoutType },
      })
      if (!entry) {
        // Return default empty layouts or predefined default layouts for the dashboard widgets
        if (layoutType === 'desktop') {
          const defaultLayouts = [
            { i: 'tasks', x: 0, y: 0, w: 2, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
            { i: 'calendar', x: 2, y: 0, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
            { i: 'notes', x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
            { i: 'verse', x: 1, y: 2, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
            { i: 'goals', x: 2, y: 2, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
            { i: 'clock', x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
            { i: 'files', x: 1, y: 4, w: 1, h: 1, minW: 1, maxW: 3, minH: 1, maxH: 6 },
            { i: 'clipboard', x: 2, y: 4, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
            { i: 'twoFactor', x: 1, y: 5, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
          ]
          return defaultLayouts
        }
        if (layoutType === 'mobile') {
          const defaultMobileLayouts = [
            { i: 'tasks', x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: 6 },
            { i: 'calendar', x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: 6 },
            { i: 'notes', x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: 6 },
            { i: 'verse', x: 0, y: 6, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: 6 },
            { i: 'goals', x: 0, y: 8, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: 6 },
            { i: 'clock', x: 0, y: 10, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: 6 },
            { i: 'files', x: 0, y: 12, w: 1, h: 1, minW: 1, maxW: 1, minH: 1, maxH: 6 },
            { i: 'clipboard', x: 0, y: 13, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: 6 },
            { i: 'twoFactor', x: 0, y: 15, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: 6 },
          ]
          return defaultMobileLayouts
        }
        return []
      }
      return JSON.parse(entry.layouts)
    }

    case 'settings:get': {
      const user = await getAuthedUser(db, args.sessionToken)
      let settings = await db.userSettings.findUnique({
        where: { userId: user.id },
      })

      if (!settings) {
        settings = await db.userSettings.create({
          data: {
            userId: user.id,
            profileName: user.username,
            profilePicture: '',
            appTitle: 'ar-Raqmi Dashboard',
            appLogo: '/logo.png',
            iconBackgroundColor: '#A5D6A7',
            hijriVisible: true,
            hijriOffset: 0,
            showSeconds: true,
            clipboardText: '',
            backgroundType: 'default',
            backgroundColor: '#A5D6A7',
            backgroundGradient: 'citrus-dawn',
            backgroundImage: '',
            backgroundOpacity: 30,
          },
        })
      }

      return {
        profileName: settings.profileName,
        profilePicture: settings.profilePicture || undefined,
        appTitle: settings.appTitle,
        appLogo: settings.appLogo || undefined,
        iconBackgroundColor: settings.iconBackgroundColor,
        hijriVisible: settings.hijriVisible,
        hijriOffset: settings.hijriOffset,
        showSeconds: settings.showSeconds,
        clipboardText: settings.clipboardText,
        background: {
          type: settings.backgroundType,
          color: settings.backgroundColor,
          gradient: settings.backgroundGradient,
          image: settings.backgroundImage,
          opacity: settings.backgroundOpacity,
        },
      }
    }

    case 'twoFactor:list': {
      const user = await getAuthedUser(db, args.sessionToken)
      const secrets = await db.twoFactorSecret.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })

      const list = []
      for (const s of secrets) {
        const decrypted = await decryptText(s.secret)
        let token = '------'
        let remainingSeconds = 30
        try {
          // Clean secret from spaces or format issues
          const cleanSecret = decrypted.replace(/\s+/g, '').toUpperCase()
          const totp = new TOTP({ secret: cleanSecret })
          token = totp.generate()
          // Calculate seconds remaining in 30-sec window
          remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30)
        } catch (err) {
          console.error('Failed to generate TOTP for', s.accountName, err)
        }

        list.push({
          id: s.id,
          accountName: s.accountName,
          token,
          remainingSeconds,
        })
      }
      return list
    }

    case 'content:getDailyVerseAction': {
      const ayahId = Math.floor(Math.random() * 6236) + 1
      try {
        const response = await fetch(`https://api.alquran.cloud/v1/ayah/${ayahId}/editions/quran-uthmani,en.sahih`)
        const data = await response.json()
        return {
          arabic: data.data[0].text,
          translation: data.data[1].text,
          reference: `${data.data[0].surah.englishName} ${data.data[0].numberInSurah}`,
        }
      } catch (err) {
        return null
      }
    }

    case 'content:getDailyHadithAction': {
      const hadithId = Math.floor(Math.random() * 7000) + 1
      try {
        const response = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-bukhari/${hadithId}.json`)
        const data = await response.json()
        const hadith = data.hadiths[0]
        return {
          arabic: 'Sahih al-Bukhari',
          translation: hadith.text,
          narrator: 'Narrated in Sahih Bukhari',
          source: `Hadith ${hadithId}`,
          grade: 'Sahih',
        }
      } catch (err) {
        console.error('Hadith fetch error:', err)
        return null
      }
    }

    default:
      throw new Error(`Unknown query path: ${path}`)
  }
}

// Mutations Router
export async function handleMutation(path: string, args: any, env?: any) {
  const db = getDb(env)

  switch (path) {
    case 'sessions:create': {
      const { userId, token, expiresAt } = args
      return await db.session.create({
        data: {
          userId,
          token,
          expiresAt: new Date(expiresAt),
        },
      })
    }

    case 'sessions:remove': {
      const { token } = args
      try {
        await db.session.delete({
          where: { token },
        })
      } catch (err) {
        // Already removed
      }
      return { success: true }
    }

    case 'auth:updateUser': {
      const { sessionToken, newUsername, newPasswordHash, newSalt } = args
      const user = await getAuthedUser(db, sessionToken)

      const updates: any = {}
      if (newUsername) {
        const existing = await db.user.findUnique({
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

      await db.user.update({
        where: { id: user.id },
        data: updates,
      })
      return { success: true }
    }

    case 'tasks:create': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { title, dueDate, priority, status } = args
      const t = await db.task.create({
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

    case 'tasks:update': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { taskId, ...updates } = args
      const task = await db.task.findUnique({ where: { id: taskId } })
      if (!task || task.userId !== user.id) {
        throw new Error('Task not found or unauthorized')
      }

      const cleanUpdates: any = {}
      if (updates.title !== undefined) cleanUpdates.title = updates.title
      if (updates.dueDate !== undefined) cleanUpdates.dueDate = updates.dueDate
      if (updates.priority !== undefined) cleanUpdates.priority = updates.priority
      if (updates.status !== undefined) cleanUpdates.status = updates.status

      await db.task.update({
        where: { id: taskId },
        data: cleanUpdates,
      })
      return { success: true }
    }

    case 'tasks:remove': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { taskId } = args
      const task = await db.task.findUnique({ where: { id: taskId } })
      if (!task || task.userId !== user.id) {
        throw new Error('Task not found or unauthorized')
      }
      await db.task.delete({ where: { id: taskId } })
      return { success: true }
    }

    case 'tasks:deleteCompleted': {
      const user = await getAuthedUser(db, args.sessionToken)
      await db.task.deleteMany({
        where: { userId: user.id, status: 'completed' },
      })
      return { success: true }
    }

    case 'tasks:deleteOldCompleted': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { today } = args
      await db.task.deleteMany({
        where: {
          userId: user.id,
          status: 'completed',
          dueDate: { lt: today },
        },
      })
      return { success: true }
    }

    case 'tasks:toggleStatus': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { taskId } = args
      const task = await db.task.findUnique({ where: { id: taskId } })
      if (!task || task.userId !== user.id) {
        throw new Error('Task not found or unauthorized')
      }
      await db.task.update({
        where: { id: taskId },
        data: {
          status: task.status === 'pending' ? 'completed' : 'pending',
        },
      })
      return { success: true }
    }

    case 'goals:create': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { title, progress, order, milestones } = args
      const goal = await db.goal.create({
        data: {
          userId: user.id,
          title,
          progress,
          order: order ?? 0,
        },
      })

      if (milestones && milestones.length > 0) {
        await db.milestone.createMany({
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

    case 'goals:update': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { goalId, title, progress, order, milestones } = args
      const goal = await db.goal.findUnique({ where: { id: goalId } })
      if (!goal || goal.userId !== user.id) {
        throw new Error('Goal not found or unauthorized')
      }

      const updates: any = {}
      if (title !== undefined) updates.title = title
      if (order !== undefined) updates.order = order

      if (milestones !== undefined) {
        // Delete existing milestones
        await db.milestone.deleteMany({ where: { goalId } })
        // Insert updated milestones
        if (milestones.length > 0) {
          await db.milestone.createMany({
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

      await db.goal.update({
        where: { id: goalId },
        data: updates,
      })
      return { success: true }
    }

    case 'goals:remove': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { goalId } = args
      const goal = await db.goal.findUnique({ where: { id: goalId } })
      if (!goal || goal.userId !== user.id) {
        throw new Error('Goal not found or unauthorized')
      }
      await db.goal.delete({ where: { id: goalId } })
      return { success: true }
    }

    case 'goals:toggleMilestone': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { goalId, milestoneId } = args
      const goal = await db.goal.findUnique({ where: { id: goalId } })
      if (!goal || goal.userId !== user.id) {
        throw new Error('Goal not found or unauthorized')
      }

      const milestone = await db.milestone.findUnique({ where: { id: milestoneId } })
      if (!milestone || milestone.goalId !== goalId) {
        throw new Error('Milestone not found')
      }

      const newCompleted = !milestone.completed
      await db.milestone.update({
        where: { id: milestoneId },
        data: { completed: newCompleted },
      })

      // Recalculate progress
      const allMilestones = await db.milestone.findMany({ where: { goalId } })
      const completed = allMilestones.filter((m: any) => m.id === milestoneId ? newCompleted : m.completed).length
      const total = allMilestones.length
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0

      await db.goal.update({
        where: { id: goalId },
        data: { progress },
      })
      return { success: true }
    }

    case 'goals:reorder': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { goalIds } = args
      for (let i = 0; i < goalIds.length; i++) {
        const goal = await db.goal.findUnique({ where: { id: goalIds[i] } })
        if (goal && goal.userId === user.id) {
          await db.goal.update({
            where: { id: goalIds[i] },
            data: { order: i },
          })
        }
      }
      return { success: true }
    }

    case 'notes:create': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { title, content, color, pinned } = args
      const n = await db.note.create({
        data: {
          userId: user.id,
          title,
          content,
          color,
          pinned,
        },
      })
      return n.id
    }

    case 'notes:update': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { id, ...updates } = args
      const note = await db.note.findUnique({ where: { id } })
      if (!note || note.userId !== user.id) {
        throw new Error('Note not found or unauthorized')
      }

      const cleanUpdates: any = {}
      if (updates.title !== undefined) cleanUpdates.title = updates.title
      if (updates.content !== undefined) cleanUpdates.content = updates.content
      if (updates.color !== undefined) cleanUpdates.color = updates.color
      if (updates.pinned !== undefined) cleanUpdates.pinned = updates.pinned

      await db.note.update({
        where: { id },
        data: cleanUpdates,
      })
      return { success: true }
    }

    case 'notes:remove': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { id } = args
      const note = await db.note.findUnique({ where: { id } })
      if (!note || note.userId !== user.id) {
        throw new Error('Note not found or unauthorized')
      }
      await db.note.delete({ where: { id } })
      return { success: true }
    }

    case 'notes:togglePinned': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { id } = args
      const note = await db.note.findUnique({ where: { id } })
      if (!note || note.userId !== user.id) {
        throw new Error('Note not found or unauthorized')
      }
      await db.note.update({
        where: { id },
        data: { pinned: !note.pinned },
      })
      return { success: true }
    }

    case 'events:create': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { title, date, color } = args
      const e = await db.calendarEvent.create({
        data: {
          userId: user.id,
          title,
          date,
          color: color || null,
        },
      })
      return e.id
    }

    case 'events:remove': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { eventId } = args
      const event = await db.calendarEvent.findUnique({ where: { id: eventId } })
      if (!event || event.userId !== user.id) {
        throw new Error('Event not found or unauthorized')
      }
      await db.calendarEvent.delete({ where: { id: eventId } })
      return { success: true }
    }

    case 'files:create': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { name, type, category, parentId, size, storageId, r2Key, storageSource } = args
      const f = await db.fileItem.create({
        data: {
          userId: user.id,
          name,
          type,
          category: category || null,
          parentId: parentId || null,
          size: size || null,
          storageId: storageId || null,
          r2Key: r2Key || null,
          storageSource: storageSource || (storageId ? 'convex' : r2Key ? 'r2' : null),
        },
      })
      return f.id
    }

    case 'files:rename': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { id, name } = args
      const file = await db.fileItem.findUnique({ where: { id } })
      if (!file || file.userId !== user.id) {
        throw new Error('File not found or unauthorized')
      }
      await db.fileItem.update({
        where: { id },
        data: { name },
      })
      return { success: true }
    }

    case 'files:remove': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { id } = args
      const file = await db.fileItem.findUnique({ where: { id } })
      if (!file || file.userId !== user.id) {
        throw new Error('File not found or unauthorized')
      }
      await db.fileItem.delete({ where: { id } })
      return { success: true }
    }

    case 'files:move': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { fileId, newParentId } = args
      const file = await db.fileItem.findUnique({ where: { id: fileId } })
      if (!file || file.userId !== user.id) {
        throw new Error('File not found or unauthorized')
      }
      await db.fileItem.update({
        where: { id: fileId },
        data: { parentId: newParentId || null },
      })
      return { success: true }
    }

    case 'clocks:add': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { label, timezone } = args
      const c = await db.clock.create({
        data: {
          userId: user.id,
          label,
          timezone,
        },
      })
      return c.id
    }

    case 'clocks:remove': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { id } = args
      const clock = await db.clock.findUnique({ where: { id } })
      if (!clock || clock.userId !== user.id) {
        throw new Error('Clock not found or unauthorized')
      }
      await db.clock.delete({ where: { id } })
      return { success: true }
    }

    case 'clocks:update': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { id, label, timezone } = args
      const clock = await db.clock.findUnique({ where: { id } })
      if (!clock || clock.userId !== user.id) {
        throw new Error('Clock not found or unauthorized')
      }
      await db.clock.update({
        where: { id },
        data: { label, timezone },
      })
      return { success: true }
    }

    case 'dashboard:toggleWidgetVisibility': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { type } = args
      const widget = await db.dashboardWidget.findFirst({
        where: { userId: user.id, type },
      })
      if (widget) {
        await db.dashboardWidget.update({
          where: { id: widget.id },
          data: { visible: !widget.visible },
        })
      }
      return { success: true }
    }

    case 'dashboard:setLayout': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { layoutType, layouts } = args
      const existing = await db.dashboardLayout.findFirst({
        where: { userId: user.id, layoutType },
      })
      if (existing) {
        await db.dashboardLayout.update({
          where: { id: existing.id },
          data: { layouts: JSON.stringify(layouts) },
        })
      } else {
        await db.dashboardLayout.create({
          data: {
            userId: user.id,
            layoutType,
            layouts: JSON.stringify(layouts),
          },
        })
      }
      return { success: true }
    }

    case 'settings:update': {
      const user = await getAuthedUser(db, args.sessionToken)
      const {
        profileName,
        profilePicture,
        appTitle,
        appLogo,
        iconBackgroundColor,
        hijriVisible,
        hijriOffset,
        showSeconds,
        clipboardText,
        background,
      } = args

      const data: any = {}
      if (profileName !== undefined) data.profileName = profileName
      if (profilePicture !== undefined) data.profilePicture = profilePicture
      if (appTitle !== undefined) data.appTitle = appTitle
      if (appLogo !== undefined) data.appLogo = appLogo
      if (iconBackgroundColor !== undefined) data.iconBackgroundColor = iconBackgroundColor
      if (hijriVisible !== undefined) data.hijriVisible = hijriVisible
      if (hijriOffset !== undefined) data.hijriOffset = hijriOffset
      if (showSeconds !== undefined) data.showSeconds = showSeconds
      if (clipboardText !== undefined) data.clipboardText = clipboardText

      if (background !== undefined) {
        if (background.type !== undefined) data.backgroundType = background.type
        if (background.color !== undefined) data.backgroundColor = background.color
        if (background.gradient !== undefined) data.backgroundGradient = background.gradient
        if (background.image !== undefined) data.backgroundImage = background.image
        if (background.opacity !== undefined) data.backgroundOpacity = background.opacity
      }

      await db.userSettings.update({
        where: { userId: user.id },
        data,
      })
      return { success: true }
    }

    case 'twoFactor:create': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { accountName, secret } = args
      
      // Clean and validate the secret key format
      const cleanSecret = secret.replace(/\s+/g, '').toUpperCase()
      // Test generation to throw if it's invalid base32
      try {
        new TOTP({ secret: cleanSecret })
      } catch (err) {
        return { success: false, error: 'Invalid secret key. Must be a valid Base32 string.' }
      }

      const encrypted = await encryptText(cleanSecret)
      await db.twoFactorSecret.create({
        data: {
          userId: user.id,
          accountName,
          secret: encrypted,
        },
      })
      return { success: true }
    }

    case 'twoFactor:remove': {
      const user = await getAuthedUser(db, args.sessionToken)
      const { id } = args
      const item = await db.twoFactorSecret.findUnique({ where: { id } })
      if (!item || item.userId !== user.id) {
        throw new Error('2FA account not found or unauthorized')
      }
      await db.twoFactorSecret.delete({ where: { id } })
      return { success: true }
    }

    default:
      throw new Error(`Unknown mutation path: ${path}`)
  }
}
