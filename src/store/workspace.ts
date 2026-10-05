import { create } from 'zustand';
import { ApiClient } from '@/lib/api';
import { todayKey } from '@/lib/date';
import { timeZone } from '@/lib/timezone';
import type {
  ClockView, Completion, DailyHadith, DailyVerse, EventView, GoalView, NoteView, Preferences, PrayerDay, SettingsView, TaskView, WidgetView,
} from './types';

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
  updateTask: (id: string, patch: Partial<Pick<TaskView, 'title' | 'dueDate' | 'priority' | 'status' | 'description'>>) => Promise<void>;
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

// "Today" everywhere follows the time zone chosen in settings, so it is applied the moment settings arrive.
useStore.subscribe(state => timeZone.select(state.settings?.timezone));
