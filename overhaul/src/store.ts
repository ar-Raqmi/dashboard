import { create } from 'zustand';
import { ApiClient } from './api';
import { todayKey } from './utils/date';

/* ------------------------------------------------------------------ *
 * Database models — one interface per model in prisma/schema.prisma. *
 * DateTime columns arrive as ISO strings; Booleans as booleans.      *
 * ------------------------------------------------------------------ */

export interface User { id: string; username: string; passwordHash: string; salt: string; createdAt: string }
export interface Session { id: string; userId: string; token: string; expiresAt: string; createdAt: string }
export interface CalendarEvent {
  id: string; userId: string; title: string; date: string; color: string | null; startTime: string | null; endTime: string | null;
  allDay: boolean | null; rrule: string | null; dtstart: string | null; recurrenceUntil: string | null; recurrenceCount: number | null;
}
export interface Clock { id: string; userId: string; label: string; timezone: string }
export interface DashboardLayout { id: string; userId: string; layoutType: string; layouts: string }
export interface DashboardWidget { id: string; userId: string; type: string; label: string; icon: string; visible: boolean }
export interface FileItem {
  id: string; userId: string; name: string; type: string; category: string | null; parentId: string | null; size: number | null;
  storageId: string | null; r2Key: string | null; storageSource: string | null; starred: boolean | null; lastAccessed: number | null;
  mimeType: string | null; width: number | null; height: number | null; duration: number | null; thumbnailR2Key: string | null;
  createdAt: string; updatedAt: string;
}
export interface Goal { id: string; userId: string; title: string; progress: number; order: number | null; createdAt: string }
export interface Milestone { id: string; goalId: string; label: string; completed: boolean; order: number }
export interface Note { id: string; userId: string; title: string; content: string; color: string; pinned: boolean; createdAt: string; updatedAt: string }
export interface RecurrenceException {
  id: string; userId: string; entityType: string; entityId: string; date: string; status: string | null; newDate: string | null; title: string | null; createdAt: string;
}
export interface Task {
  id: string; userId: string; title: string; dueDate: string | null; priority: string; status: string; rrule: string | null;
  dtstart: string | null; recurrenceUntil: string | null; recurrenceCount: number | null; createdAt: string;
}
export interface TwoFactorSecret {
  id: string; userId: string; accountName: string; secret: string; createdAt: string; updatedAt: string; category: string | null; icon: string | null;
}
export interface UserSettings {
  id: string; userId: string; profileName: string; profilePicture: string | null; appTitle: string; appLogo: string | null;
  iconBackgroundColor: string; hijriVisible: boolean; hijriOffset: number; hijriProvider: string; hijriCalendar: string; showSeconds: boolean;
  clipboardText: string; backgroundType: string; backgroundColor: string; backgroundGradient: string; backgroundImage: string;
  backgroundOpacity: number; aladhanCity: string; aladhanCountry: string;
}

/* ------------------------------------------------------------- *
 * API views — what the endpoints return (user-scoped, derived). *
 * ------------------------------------------------------------- */

export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export interface TaskView extends Omit<Task, 'userId' | 'priority' | 'status'> {
  priority: Priority; status: TaskStatus; isRecurring: boolean; occurrenceDate: string | null; goalId: string | null; description: string;
}
/** A repeating task's own date is its occurrence; one-off tasks use their due date. */
export const taskDate = (t: TaskView) => (t.isRecurring ? t.occurrenceDate ?? t.dueDate : t.dueDate);
/** Open and actionable now. A repeating task's occurrence only counts once its own day has started. */
export const isActionable = (t: TaskView, today: string) => {
  if (t.status === 'completed') return false;
  const date = taskDate(t);
  return !t.isRecurring || !date || date <= today;
};
export interface Completion { taskId: string; date: string }
export interface GoalView extends Omit<Goal, 'userId' | 'order'> { order: number; milestones: Omit<Milestone, 'goalId'>[] }
export type NoteView = Omit<Note, 'userId'>;
export interface EventView extends Omit<CalendarEvent, 'userId' | 'allDay'> { allDay: boolean; isRecurring: boolean; occurrenceDate: string | null }
export type ClockView = Omit<Clock, 'userId'>;
export type WidgetView = Omit<DashboardWidget, 'id' | 'userId'>;
export type SettingsView = Omit<UserSettings, 'id' | 'userId' | 'profilePicture' | 'appLogo'> & { profilePicture: string; appLogo: string };
export type Theme = 'dark' | 'light';
export interface Preferences { theme?: Theme; compact?: boolean; reducedMotion?: boolean; sidebarCollapsed?: boolean; notificationsReadAt?: string }
export interface FileView {
  id: string; name: string; type: 'file' | 'folder'; category: string | null; parentId: string | null; size: number; mimeType: string | null;
  starred: boolean; storageSource: string | null; available: boolean; createdAt: string; updatedAt: string;
}
export interface TwoFactorAccount { id: string; accountName: string; category: string; icon: string | null; token: string | null; nextToken: string | null; undecryptable?: boolean }
export interface TwoFactorList { locked: boolean; period: number; generatedAt: number; accounts: TwoFactorAccount[] }
export interface PrayerDay {
  source: string; location: string; timezone: string;
  times: { fajr: string; syuruk?: string; dhuhr: string; asr: string; maghrib: string; isha: string };
  hijri: { day: number; month: string; year: number } | null;
}
export interface DailyVerse { arabic: string; translation: string; reference: string; url: string }
export interface DailyHadith { translation: string; arabic: string | null; source: string; url: string }

/* ------------- *
 * Client store. *
 * ------------- */

type Resource = 'tasks' | 'goals' | 'notes' | 'events' | 'clocks' | 'settings' | 'preferences' | 'widgets';

interface WorkspaceData {
  tasks: TaskView[]; completions: Completion[]; goals: GoalView[]; notes: NoteView[]; events: EventView[];
  clocks: ClockView[]; settings: SettingsView | null; preferences: Preferences; widgets: WidgetView[];
}

interface WorkspaceState extends WorkspaceData {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  /** Number of in-flight writes; drives the "saving" footer state. */
  saving: number;
  lastSyncedAt: number | null;
  /** Shared cache for the daily content widgets (one fetch per day). */
  prayer: PrayerDay | null | undefined;
  verse: DailyVerse | null | undefined;
  hadith: DailyHadith | null | undefined;

  load: () => Promise<void>;
  reload: (...resources: Resource[]) => Promise<void>;
  /** Runs a mutation, then refreshes the resources it affects. */
  mutate: <T = unknown>(path: string, args: Record<string, unknown>, affects: Resource[]) => Promise<T>;
  loadDaily: () => Promise<void>;
  reset: () => void;

  toggleTask: (task: TaskView) => Promise<void>;
  updateTask: (id: string, patch: Partial<Pick<TaskView, 'title' | 'dueDate' | 'priority' | 'status' | 'goalId' | 'description'>>) => Promise<void>;
  toggleMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  saveNote: (note: { id?: string; title: string; content: string; pinned: boolean; color?: string }) => Promise<string>;
  updatePreferences: (patch: Preferences) => Promise<void>;
}

const empty: WorkspaceData = {
  tasks: [], completions: [], goals: [], notes: [], events: [], clocks: [], settings: null, preferences: {}, widgets: [],
};

const loaders: Record<Resource, () => Promise<Partial<WorkspaceData>>> = {
  tasks: async () => ApiClient.query<{ tasks: TaskView[]; completions: Completion[] }>('tasks:list', { today: todayKey() }),
  goals: async () => ({ goals: await ApiClient.query<GoalView[]>('goals:list') }),
  notes: async () => ({ notes: await ApiClient.query<NoteView[]>('notes:list') }),
  events: async () => ({ events: await ApiClient.query<EventView[]>('events:list', { today: todayKey() }) }),
  clocks: async () => ({ clocks: await ApiClient.query<ClockView[]>('clocks:list') }),
  settings: async () => ({ settings: await ApiClient.query<SettingsView>('settings:get') }),
  preferences: async () => ({ preferences: await ApiClient.query<Preferences>('preferences:get') }),
  widgets: async () => ({ widgets: await ApiClient.query<WidgetView[]>('widgets:list') }),
};

export const useStore = create<WorkspaceState>()((set, get) => {
  /** Wraps a write so the footer can show progress, and resyncs on failure. */
  async function write<T>(fn: () => Promise<T>, resync: Resource[]): Promise<T> {
    set(s => ({ saving: s.saving + 1 }));
    try {
      return await fn();
    } catch (err) {
      await get().reload(...resync).catch(() => undefined);
      throw err;
    } finally {
      set(s => ({ saving: s.saving - 1 }));
    }
  }

  return {
    ...empty,
    status: 'idle',
    error: null,
    saving: 0,
    lastSyncedAt: null,
    prayer: undefined,
    verse: undefined,
    hadith: undefined,

    async load() {
      set({ status: get().status === 'ready' ? 'ready' : 'loading', error: null });
      try {
        const data = await ApiClient.query<WorkspaceData>('workspace:load', { today: todayKey() });
        set({ ...data, status: 'ready', lastSyncedAt: Date.now() });
      } catch (err) {
        set({ status: get().status === 'ready' ? 'ready' : 'error', error: (err as Error).message });
        throw err;
      }
    },

    async reload(...resources) {
      const parts = await Promise.all([...new Set(resources)].map(r => loaders[r]()));
      set({ ...Object.assign({}, ...parts), lastSyncedAt: Date.now() });
    },

    async mutate<T>(path: string, args: Record<string, unknown>, affects: Resource[]) {
      return write(async () => {
        const result = await ApiClient.mutate<T>(path, args);
        await get().reload(...affects);
        return result;
      }, affects);
    },

    async loadDaily() {
      const today = todayKey();
      const [prayer, verse, hadith] = await Promise.all([
        ApiClient.query<PrayerDay | null>('content:prayer', { date: today }).catch(() => null),
        ApiClient.query<DailyVerse>('content:verse', { date: today }).catch(() => null),
        ApiClient.query<DailyHadith | null>('content:hadith', { date: today }).catch(() => null),
      ]);
      set({ prayer, verse, hadith });
    },

    reset() {
      set({ ...empty, status: 'idle', error: null, saving: 0, lastSyncedAt: null, prayer: undefined, verse: undefined, hadith: undefined });
    },

    async toggleTask(task) {
      // Repeating tasks complete one occurrence and roll forward, so wait for the server's next date.
      if (!task.isRecurring) {
        set(s => ({ tasks: s.tasks.map(t => (t.id === task.id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t)) }));
      }
      await write(async () => {
        await ApiClient.mutate('tasks:toggleStatus', { id: task.id, occurrenceDate: task.isRecurring ? task.occurrenceDate : undefined, today: todayKey() });
        await get().reload('tasks');
      }, ['tasks']);
    },

    async updateTask(id, patch) {
      set(s => ({ tasks: s.tasks.map(t => (t.id === id ? { ...t, ...patch } : t)) }));
      await write(async () => {
        await ApiClient.mutate('tasks:update', { id, ...patch, today: todayKey() });
        await get().reload('tasks');
      }, ['tasks']);
    },

    async toggleMilestone(goalId, milestoneId) {
      set(s => ({
        goals: s.goals.map(g => {
          if (g.id !== goalId) return g;
          const milestones = g.milestones.map(m => (m.id === milestoneId ? { ...m, completed: !m.completed } : m));
          return { ...g, milestones, progress: Math.round((milestones.filter(m => m.completed).length / milestones.length) * 100) };
        }),
      }));
      await write(() => ApiClient.mutate('goals:toggleMilestone', { id: milestoneId }), ['goals']);
    },

    async saveNote(note) {
      return write(async () => {
        const id = note.id
          ? (await ApiClient.mutate('notes:update', note), note.id)
          : await ApiClient.mutate<string>('notes:create', note);
        await get().reload('notes');
        return id;
      }, ['notes']);
    },

    async updatePreferences(patch) {
      set(s => ({ preferences: { ...s.preferences, ...patch } }));
      await write(async () => {
        const preferences = await ApiClient.mutate<Preferences>('preferences:update', patch as Record<string, unknown>);
        set({ preferences });
      }, ['preferences']);
    },
  };
});

/* ------------------------- *
 * Derived, shared helpers.  *
 * ------------------------- */

const GOAL_COLORS = ['var(--aqua)', 'var(--yellow)', 'var(--purple)', 'var(--blue)', 'var(--orange)', 'var(--green)', 'var(--red)'];

/** Goals double as projects; each gets a stable palette colour from its position. */
/** A project is complete at 100%. The server derives progress from milestones (or the manual slider when it has none), so no NaN and no drift reach the client. */
export const isGoalComplete = (goal: Pick<GoalView, 'progress'>) => goal.progress >= 100;

export function goalColor(goals: GoalView[], id: string | null | undefined) {
  const index = goals.findIndex(g => g.id === id);
  return index < 0 ? 'var(--subtle)' : GOAL_COLORS[index % GOAL_COLORS.length];
}
