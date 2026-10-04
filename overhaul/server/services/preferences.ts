import { uuid } from '../db';
import { BaseService } from './base';

/**
 * `DashboardLayout` is a per-user JSON document keyed by `layoutType`. The legacy app
 * keeps its grid layouts there ('desktop', 'mobile', ...); the overhaul stores its own
 * documents under the `overhaul:` namespace and never touches the legacy keys.
 */
export class LayoutStore extends BaseService {
  async get<T>(layoutType: string, fallback: T): Promise<T> {
    const row = await this.db.first<{ layouts: string }>('SELECT layouts FROM DashboardLayout WHERE userId = ? AND layoutType = ?', this.user.id, layoutType);
    if (!row) return fallback;
    try {
      let parsed = JSON.parse(row.layouts);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  }

  async set(layoutType: string, value: unknown) {
    const json = JSON.stringify(value);
    const existing = await this.db.first<{ id: string }>('SELECT id FROM DashboardLayout WHERE userId = ? AND layoutType = ?', this.user.id, layoutType);
    if (existing) await this.db.run('UPDATE DashboardLayout SET layouts = ? WHERE id = ?', json, existing.id);
    else await this.db.run('INSERT INTO DashboardLayout (id, userId, layoutType, layouts) VALUES (?, ?, ?, ?)', uuid(), this.user.id, layoutType, json);
  }
}

export interface Preferences {
  theme?: 'dark' | 'light';
  compact?: boolean;
  reducedMotion?: boolean;
  sidebarCollapsed?: boolean;
  notificationsReadAt?: string;
}
const PREFERENCES = 'overhaul:preferences';

export class PreferenceService extends LayoutStore {
  load() {
    return this.get<Preferences>(PREFERENCES, {});
  }

  async update(patch: Preferences) {
    const current = await this.load();
    const next: Preferences = { ...current };
    if (patch.theme === 'dark' || patch.theme === 'light') next.theme = patch.theme;
    for (const key of ['compact', 'reducedMotion', 'sidebarCollapsed'] as const) if (typeof patch[key] === 'boolean') next[key] = patch[key];
    if (typeof patch.notificationsReadAt === 'string') next.notificationsReadAt = patch.notificationsReadAt;
    await this.set(PREFERENCES, next);
    return next;
  }
}

const DEFAULT_WIDGETS = [
  { type: 'tasks', label: 'Daily Tasks', icon: 'check_circle' },
  { type: 'calendar', label: 'Calendar', icon: 'calendar_month' },
  { type: 'notes', label: 'Quick Notes', icon: 'sticky_note_2' },
  { type: 'verse', label: 'Daily Verse', icon: 'auto_stories' },
  { type: 'goals', label: 'Goals', icon: 'flag' },
  { type: 'clock', label: 'World Clock', icon: 'schedule' },
  { type: 'files', label: 'Files', icon: 'folder' },
  { type: 'clipboard', label: 'Clipboard', icon: 'content_paste' },
  { type: 'twoFactor', label: '2FA Authenticator', icon: 'security' },
  { type: 'prayerTimes', label: 'Prayer Times', icon: 'mosque' },
];

/** `DashboardWidget` rows decide which Overview sections are shown. */
export class WidgetService extends BaseService {
  async list() {
    let rows = await this.db.all<{ type: string; label: string; icon: string; visible: number }>('SELECT type, label, icon, visible FROM DashboardWidget WHERE userId = ?', this.user.id);
    const have = new Set(rows.map(r => r.type));
    const missing = DEFAULT_WIDGETS.filter(w => !have.has(w.type));
    if (missing.length) {
      await this.db.batch(missing.map(w => ({ sql: 'INSERT INTO DashboardWidget (id, userId, type, label, icon, visible) VALUES (?, ?, ?, ?, ?, 1)', params: [uuid(), this.user.id, w.type, w.label, w.icon] })));
      rows = await this.db.all('SELECT type, label, icon, visible FROM DashboardWidget WHERE userId = ?', this.user.id);
    }
    const order = DEFAULT_WIDGETS.map(w => w.type);
    return rows
      .map(r => ({ type: r.type, label: r.label, icon: r.icon, visible: !!r.visible }))
      .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  }

  async toggle(args: { type?: unknown }) {
    await this.db.run('UPDATE DashboardWidget SET visible = CASE visible WHEN 1 THEN 0 ELSE 1 END WHERE userId = ? AND type = ?', this.user.id, String(args.type));
    return this.list();
  }
}
