const { PrismaClient } = require('@prisma/client')
const fs = require('fs')

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  const settings = await prisma.userSettings.findMany()
  const widgets = await prisma.dashboardWidget.findMany()

  let sql = ''

  for (const u of users) {
    sql += `INSERT OR REPLACE INTO "User" ("id", "username", "passwordHash", "salt", "createdAt") VALUES ('${u.id}', '${u.username}', '${u.passwordHash}', '${u.salt}', '${u.createdAt.toISOString()}');\n`
  }

  for (const s of settings) {
    sql += `INSERT OR REPLACE INTO "UserSettings" ("id", "userId", "profileName", "profilePicture", "appTitle", "appLogo", "iconBackgroundColor", "hijriVisible", "hijriOffset", "showSeconds", "clipboardText", "backgroundType", "backgroundColor", "backgroundGradient", "backgroundImage", "backgroundOpacity") VALUES ('${s.id}', '${s.userId}', '${s.profileName}', '${s.profilePicture || ''}', '${s.appTitle}', '${s.appLogo || ''}', '${s.iconBackgroundColor}', ${s.hijriVisible ? 1 : 0}, ${s.hijriOffset}, ${s.showSeconds ? 1 : 0}, '${s.clipboardText}', '${s.backgroundType}', '${s.backgroundColor}', '${s.backgroundGradient}', '${s.backgroundImage}', ${s.backgroundOpacity});\n`
  }

  for (const w of widgets) {
    sql += `INSERT OR REPLACE INTO "DashboardWidget" ("id", "userId", "type", "label", "icon", "visible") VALUES ('${w.id}', '${w.userId}', '${w.type}', '${w.label}', '${w.icon}', ${w.visible ? 1 : 0});\n`
  }

  fs.writeFileSync('seed_remote.sql', sql)
  console.log('SQL seed dump generated successfully!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
