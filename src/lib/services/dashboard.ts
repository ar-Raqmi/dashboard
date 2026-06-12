import { BaseService } from './base'

export class DashboardService extends BaseService {
  async listWidgets(args: { sessionToken: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    let widgets = await this.db.dashboardWidget.findMany({
      where: { userId: user.id },
    })

    if (widgets.length === 0) {
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
      await this.db.dashboardWidget.createMany({
        data: defaultWidgets.map((w) => ({ ...w, userId: user.id })),
      })
      widgets = await this.db.dashboardWidget.findMany({
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

  async getLayout(args: { sessionToken: string; layoutType: string }) {
    const user = await this.getAuthedUser(args.sessionToken)
    const { layoutType } = args
    const entry = await this.db.dashboardLayout.findFirst({
      where: { userId: user.id, layoutType },
    })
    if (!entry) {
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
    let parsed = JSON.parse(entry.layouts)
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }
    return Array.isArray(parsed) ? parsed : []
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
