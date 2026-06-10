const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

async function main() {
  const rawData = fs.readFileSync('db/convex-data.json', 'utf-8')
  const data = JSON.parse(rawData)

  console.log('Starting data migration to Prisma SQLite...')

  // 1. Migrate Users
  console.log(`Migrating ${data.users.length} users...`)
  for (const u of data.users) {
    await db.user.upsert({
      where: { id: u._id },
      update: {
        username: u.username,
        passwordHash: u.passwordHash,
        salt: u.salt,
        createdAt: new Date(u.createdAt || u._creationTime),
      },
      create: {
        id: u._id,
        username: u.username,
        passwordHash: u.passwordHash,
        salt: u.salt,
        createdAt: new Date(u.createdAt || u._creationTime),
      }
    })
  }

  // 2. Migrate UserSettings
  console.log(`Migrating ${data.userSettings.length} user settings...`)
  for (const s of data.userSettings) {
    await db.userSettings.upsert({
      where: { userId: s.userId },
      update: {
        profileName: s.profileName,
        profilePicture: s.profilePicture || null,
        appTitle: s.appTitle,
        appLogo: s.appLogo || null,
        iconBackgroundColor: s.iconBackgroundColor,
        hijriVisible: s.hijriVisible,
        hijriOffset: s.hijriOffset,
        showSeconds: s.showSeconds,
        clipboardText: s.clipboardText,
        backgroundType: s.backgroundType,
        backgroundColor: s.backgroundColor,
        backgroundGradient: s.backgroundGradient,
        backgroundImage: s.backgroundImage,
        backgroundOpacity: s.backgroundOpacity,
      },
      create: {
        userId: s.userId,
        profileName: s.profileName,
        profilePicture: s.profilePicture || null,
        appTitle: s.appTitle,
        appLogo: s.appLogo || null,
        iconBackgroundColor: s.iconBackgroundColor,
        hijriVisible: s.hijriVisible,
        hijriOffset: s.hijriOffset,
        showSeconds: s.showSeconds,
        clipboardText: s.clipboardText,
        backgroundType: s.backgroundType,
        backgroundColor: s.backgroundColor,
        backgroundGradient: s.backgroundGradient,
        backgroundImage: s.backgroundImage,
        backgroundOpacity: s.backgroundOpacity,
      }
    })
  }

  // 3. Migrate DashboardWidgets
  console.log(`Migrating ${data.dashboardWidgets.length} dashboard widgets...`)
  await db.dashboardWidget.deleteMany()
  for (const w of data.dashboardWidgets) {
    await db.dashboardWidget.create({
      data: {
        id: w._id,
        userId: w.userId,
        type: w.type,
        label: w.label,
        icon: w.icon,
        visible: w.visible,
      }
    })
  }

  // 4. Migrate DashboardLayouts
  console.log(`Migrating ${data.dashboardLayouts.length} dashboard layouts...`)
  await db.dashboardLayout.deleteMany()
  for (const l of data.dashboardLayouts) {
    await db.dashboardLayout.create({
      data: {
        id: l._id,
        userId: l.userId,
        layoutType: l.layoutType,
        layouts: l.layouts,
      }
    })
  }

  // 5. Migrate Tasks
  console.log(`Migrating ${data.tasks.length} tasks...`)
  await db.task.deleteMany()
  for (const t of data.tasks) {
    await db.task.create({
      data: {
        id: t._id,
        userId: t.userId,
        title: t.title,
        dueDate: t.dueDate || null,
        priority: t.priority,
        status: t.status,
        createdAt: new Date(t.createdAt || t._creationTime),
      }
    })
  }

  // 6. Migrate Goals & Milestones
  console.log(`Migrating ${data.goals.length} goals...`)
  await db.goal.deleteMany()
  const createdGoalIds = new Set()
  for (const g of data.goals) {
    await db.goal.create({
      data: {
        id: g._id,
        userId: g.userId,
        title: g.title,
        progress: g.progress,
        order: g.order ?? null,
        createdAt: new Date(g.createdAt || g._creationTime),
      }
    })
    createdGoalIds.add(g._id)
  }

  console.log(`Migrating ${data.milestones.length} milestones...`)
  await db.milestone.deleteMany()
  for (const m of data.milestones) {
    if (!createdGoalIds.has(m.goalId)) {
      console.warn(`Skipping orphaned milestone: ${m._id} referencing non-existent goal: ${m.goalId}`)
      continue
    }
    await db.milestone.create({
      data: {
        id: m._id,
        goalId: m.goalId,
        label: m.label,
        completed: m.completed,
        order: m.order,
      }
    })
  }

  // 7. Migrate Notes
  console.log(`Migrating ${data.notes.length} notes...`)
  await db.note.deleteMany()
  for (const n of data.notes) {
    await db.note.create({
      data: {
        id: n._id,
        userId: n.userId,
        title: n.title,
        content: n.content,
        color: n.color,
        pinned: n.pinned,
        createdAt: new Date(n.createdAt || n._creationTime),
        updatedAt: new Date(n.updatedAt || n._creationTime),
      }
    })
  }

  // 8. Migrate Events
  console.log(`Migrating ${data.events.length} events...`)
  await db.calendarEvent.deleteMany()
  for (const e of data.events) {
    await db.calendarEvent.create({
      data: {
        id: e._id,
        userId: e.userId,
        title: e.title,
        date: e.date,
        color: e.color || null,
      }
    })
  }

  // 9. Migrate Files
  console.log(`Migrating ${data.files.length} files...`)
  await db.fileItem.deleteMany()
  const sortedFiles = [...data.files].sort((a, b) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1
    if (a.type !== 'folder' && b.type === 'folder') return 1
    return 0
  })
  
  const createdFileIds = new Set()
  for (const f of sortedFiles) {
    const parentExists = f.parentId && createdFileIds.has(f.parentId)
    await db.fileItem.create({
      data: {
        id: f._id,
        userId: f.userId,
        name: f.name,
        type: f.type,
        category: f.category || null,
        parentId: parentExists ? f.parentId : null,
        size: f.size || null,
        storageId: f.storageId || null,
        r2Key: f.r2Key || null,
        storageSource: f.storageSource || null,
        starred: f.starred || false,
        lastAccessed: f.lastAccessed || null,
        createdAt: new Date(f.createdAt || f._creationTime),
        updatedAt: new Date(f.updatedAt || f._creationTime),
      }
    })
    createdFileIds.add(f._id)
  }

  // 10. Migrate Clocks
  console.log(`Migrating ${data.clocks.length} clocks...`)
  await db.clock.deleteMany()
  for (const c of data.clocks) {
    await db.clock.create({
      data: {
        id: c._id,
        userId: c.userId,
        label: c.label,
        timezone: c.timezone,
      }
    })
  }

  // 11. Migrate Sessions
  console.log(`Migrating ${data.sessions.length} sessions...`)
  await db.session.deleteMany()
  for (const s of data.sessions) {
    await db.session.create({
      data: {
        id: s._id,
        userId: s.userId,
        token: s.token,
        expiresAt: new Date(s.expiresAt),
        createdAt: new Date(s._creationTime),
      }
    })
  }

  console.log('Migration completed successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
