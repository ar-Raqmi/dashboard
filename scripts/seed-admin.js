const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const db = new PrismaClient()

async function main() {
  const username = process.argv[2] || 'admin'
  const password = process.argv[3] || 'admin'

  console.log(`Seeding user: ${username} with password: ${password}`)

  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)

  // Clean up existing user if exists
  await db.user.deleteMany({
    where: { username }
  }).catch(() => {})

  const user = await db.user.create({
    data: {
      username,
      passwordHash,
      salt,
    }
  })

  // Create default settings
  await db.userSettings.create({
    data: {
      userId: user.id,
      profileName: "User",
      appTitle: "ar-Raqmi Dashboard",
      appLogo: "https://cdn-icons-png.flaticon.com/512/8323/8323511.png",
      iconBackgroundColor: "#A5D6A7",
      hijriVisible: true,
      hijriOffset: 0,
      showSeconds: true,
      clipboardText: "",
      backgroundType: "default",
      backgroundColor: "#A5D6A7",
      backgroundGradient: "citrus-dawn",
      backgroundImage: "",
      backgroundOpacity: 30,
    }
  })

  // Create default widgets
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
    data: defaultWidgets.map(w => ({ ...w, userId: user.id }))
  })

  console.log(`Seeding completed successfully!`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
