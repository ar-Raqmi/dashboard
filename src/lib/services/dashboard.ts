import { BaseService } from './base'

export class DashboardService extends BaseService {
  async listWidgets(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    let widgets = await this.db.dashboardWidget.findMany({
      where: { userId: user.id },
    })

    const allDefaultWidgets = [
      { type: 'tasks', label: 'Daily Tasks', icon: 'check_circle', visible: true },
      { type: 'calendar', label: 'Calendar', icon: 'calendar_month', visible: true },
      { type: 'notes', label: 'Quick Notes', icon: 'sticky_note_2', visible: true },
      { type: 'verse', label: 'Daily Verse', icon: 'auto_stories', visible: true },
      { type: 'goals', label: 'Goals', icon: 'flag', visible: true },
      { type: 'clock', label: 'World Clock', icon: 'schedule', visible: true },
      { type: 'files', label: 'Files', icon: 'folder', visible: true },
      { type: 'clipboard', label: 'Clipboard', icon: 'content_paste', visible: true },
      { type: 'twoFactor', label: '2FA Authenticator', icon: 'security', visible: true },
      { type: 'prayerTimes', label: 'Prayer Times', icon: 'mosque', visible: true },
    ]

    if (widgets.length === 0) {
      // Brand new user — seed all defaults
      await this.db.dashboardWidget.createMany({
        data: allDefaultWidgets.map((w) => ({ ...w, userId: user.id })),
      })
      widgets = await this.db.dashboardWidget.findMany({
        where: { userId: user.id },
      })
    } else {
      // Existing user — insert any newly added widget types they don't have yet
      const existingTypes = new Set(widgets.map((w: any) => w.type))
      const missingWidgets = allDefaultWidgets.filter((w) => !existingTypes.has(w.type))
      if (missingWidgets.length > 0) {
        await this.db.dashboardWidget.createMany({
          data: missingWidgets.map((w) => ({ ...w, userId: user.id })),
        })
        widgets = await this.db.dashboardWidget.findMany({
          where: { userId: user.id },
        })
      }
    }

    return widgets.map((w: any) => ({
      type: w.type,
      label: w.label,
      icon: w.icon,
      visible: w.visible,
    }))
  }

  async getLayout(args: { sessionToken: string; layoutType: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { layoutType } = args
    const entry = await this.db.dashboardLayout.findFirst({
      where: { userId: user.id, layoutType },
    })

    const defaultDesktopLayouts = [
      { i: 'tasks', x: 0, y: 0, w: 2, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
      { i: 'calendar', x: 2, y: 0, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
      { i: 'notes', x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
      { i: 'verse', x: 1, y: 2, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
      { i: 'goals', x: 2, y: 2, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
      { i: 'clock', x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
      { i: 'files', x: 1, y: 4, w: 1, h: 1, minW: 1, maxW: 3, minH: 1, maxH: 6 },
      { i: 'clipboard', x: 2, y: 4, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
      { i: 'twoFactor', x: 1, y: 5, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
      { i: 'prayerTimes', x: 2, y: 6, w: 1, h: 2, minW: 1, maxW: 3, minH: 1, maxH: 6 },
    ]

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
      { i: 'prayerTimes', x: 0, y: 17, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: 6 },
    ]

    if (!entry) {
      return layoutType === 'desktop' ? defaultDesktopLayouts : defaultMobileLayouts
    }

    let parsed = JSON.parse(entry.layouts)
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }

    const layouts = Array.isArray(parsed) ? parsed : []

    // Ensure all default widget layouts are present
    const defaults = layoutType === 'desktop' ? defaultDesktopLayouts : defaultMobileLayouts
    const existingIds = new Set(layouts.map((l: any) => l.i))
    
    let updated = false
    for (const d of defaults) {
      if (!existingIds.has(d.i)) {
        layouts.push(d)
        updated = true
      }
    }

    // Save the layout if we updated it, so we don't keep merging on every load
    if (updated) {
      await this.db.dashboardLayout.update({
        where: { id: entry.id },
        data: { layouts: JSON.stringify(layouts) },
      })
    }

    return layouts
  }

  async toggleWidgetVisibility(args: { sessionToken: string; type: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { type } = args
    const widget = await this.db.dashboardWidget.findFirst({
      where: { userId: user.id, type },
    })
    if (widget) {
      await this.db.dashboardWidget.update({
        where: { id: widget.id },
        data: { visible: !widget.visible },
      })
    }
    return { success: true }
  }

  async setLayout(args: { sessionToken: string; layoutType: string; layouts: any }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { layoutType, layouts } = args
    const existing = await this.db.dashboardLayout.findFirst({
      where: { userId: user.id, layoutType },
    })
    if (existing) {
      await this.db.dashboardLayout.update({
        where: { id: existing.id },
        data: { layouts: typeof layouts === 'string' ? layouts : JSON.stringify(layouts) },
      })
    } else {
      await this.db.dashboardLayout.create({
        data: {
          userId: user.id,
          layoutType,
          layouts: typeof layouts === 'string' ? layouts : JSON.stringify(layouts),
        },
      })
    }
    return { success: true }
  }
}
