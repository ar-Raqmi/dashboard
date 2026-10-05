import { hashPassword, verifyPassword, type AuthUser } from './auth';
import { assert, type Db, type Env } from './db';
import { ClockService } from './services/clocks';
import { ContentService } from './services/content';
import { EventService } from './services/events';
import { FileService } from './services/files';
import { GoalService } from './services/goals';
import { NoteService } from './services/notes';
import { PreferenceService, WidgetService } from './services/preferences';
import { PrayerService } from './services/prayer/PrayerService';
import { SettingService } from './services/settings';
import { TaskService } from './services/tasks';
import { TwoFactorService } from './services/twoFactor';

export type Args = Record<string, unknown>;
export type Handler = (args: Args) => unknown;
export type ProcedureTable = Record<string, Handler>;

/** One request's worth of user-scoped services. */
export function services(db: Db, env: Env, user: AuthUser) {
  return {
    tasks: new TaskService(db, env, user),
    goals: new GoalService(db, env, user),
    notes: new NoteService(db, env, user),
    events: new EventService(db, env, user),
    clocks: new ClockService(db, env, user),
    settings: new SettingService(db, env, user),
    preferences: new PreferenceService(db, env, user),
    widgets: new WidgetService(db, env, user),
    twoFactor: new TwoFactorService(db, env, user),
    files: new FileService(db, env, user),
    content: new ContentService(db, env, user),
    prayer: new PrayerService(db, env, user),
  };
}
export type Services = ReturnType<typeof services>;

export const queries = (s: Services, user: AuthUser): ProcedureTable => ({
  'auth:me': () => user,
  /** Everything the shell needs on first paint, in one round trip. */
  'workspace:load': async args => {
    const [tasks, goals, notes, events, clocks, settings, preferences, widgets] = await Promise.all([
      s.tasks.list(args), s.goals.list(), s.notes.list(), s.events.list(args), s.clocks.list(),
      s.settings.get(), s.preferences.load(), s.widgets.list(),
    ]);
    return { user, ...tasks, goals, notes, events, clocks, settings, preferences, widgets };
  },
  'tasks:list': args => s.tasks.list(args),
  'goals:list': () => s.goals.list(),
  'notes:list': () => s.notes.list(),
  'events:list': args => s.events.list(args),
  'clocks:list': () => s.clocks.list(),
  'settings:get': () => s.settings.get(),
  'preferences:get': () => s.preferences.load(),
  'widgets:list': () => s.widgets.list(),
  'twoFactor:list': () => s.twoFactor.list(),
  'files:list': args => s.files.list(args),
  'files:stats': () => s.files.stats(),
  'files:zipInfo': args => s.files.zipInfo(args),
  'content:verse': args => s.content.verse(args),
  'content:hadith': args => s.content.hadith(args),
  'prayer:today': args => s.prayer.today(args),
});

/** `sessionToken` identifies the caller's own session, which password changes must keep alive. */
export const mutations = (s: Services, db: Db, user: AuthUser, sessionToken: string): ProcedureTable => ({
  'tasks:create': args => s.tasks.create(args),
  'tasks:update': args => s.tasks.update(args),
  'tasks:remove': args => s.tasks.remove(args),
  'tasks:toggleStatus': args => s.tasks.toggle(args),
  'tasks:setOccurrenceException': args => s.tasks.setOccurrence(args),
  'tasks:deleteCompleted': () => s.tasks.deleteCompleted(),

  'goals:create': args => s.goals.create(args),
  'goals:update': args => s.goals.update(args),
  'goals:remove': args => s.goals.remove(args),
  'goals:reorder': args => s.goals.reorder(args),
  'goals:addMilestone': args => s.goals.addMilestone(args),
  'goals:updateMilestone': args => s.goals.updateMilestone(args),
  'goals:toggleMilestone': args => s.goals.toggleMilestone(args),
  'goals:removeMilestone': args => s.goals.removeMilestone(args),

  'notes:create': args => s.notes.create(args),
  'notes:update': args => s.notes.update(args),
  'notes:remove': args => s.notes.remove(args),
  'notes:togglePinned': args => s.notes.togglePinned(args),

  'events:create': args => s.events.create(args),
  'events:update': args => s.events.update(args),
  'events:remove': args => s.events.remove(args),
  'events:setOccurrenceException': args => s.events.setOccurrence(args),

  'clocks:add': args => s.clocks.add(args),
  'clocks:update': args => s.clocks.update(args),
  'clocks:remove': args => s.clocks.remove(args),

  'settings:update': args => s.settings.update(args),
  'preferences:update': args => s.preferences.update(args),
  'widgets:toggle': args => s.widgets.toggle(args),

  'twoFactor:create': args => s.twoFactor.create(args),
  'twoFactor:update': args => s.twoFactor.update(args),
  'twoFactor:remove': args => s.twoFactor.remove(args),

  'files:createFolder': args => s.files.createFolder(args),
  'files:rename': args => s.files.rename(args),
  'files:move': args => s.files.move(args),
  'files:toggleStar': args => s.files.toggleStar(args),
  'files:remove': args => s.files.remove(args),

  'auth:changePassword': async args => {
    assert(await verifyPassword(db, user.id, String(args.currentPassword ?? '')), 400, 'Current password is incorrect');
    const next = String(args.newPassword ?? '');
    assert(next.length >= 8, 400, 'New password must be at least 8 characters');
    const { hash, salt } = await hashPassword(next);
    await db.run('UPDATE User SET passwordHash = ?, salt = ? WHERE id = ?', hash, salt, user.id);
    // Sign out every other session.
    await db.run('DELETE FROM Session WHERE userId = ? AND token != ?', user.id, sessionToken);
    return { success: true };
  },
});
