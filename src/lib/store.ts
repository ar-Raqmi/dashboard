import { create } from 'zustand'
import { Layout } from 'react-grid-layout'

// ===== TYPES =====
export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'completed'

export interface Task {
  id: string
  title: string
  dueDate: string | null
  priority: Priority
  status: TaskStatus
  createdAt: string
}

export interface Goal {
  id: string
  title: string
  progress: number // 0-100
  milestones: { id: string; label: string; completed: boolean }[]
  createdAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  color: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  date: string // ISO date string
  color?: string
}

export type FileItemType = 'file' | 'folder'
export type FileCategory = 'image' | 'audio' | 'pdf' | 'doc' | 'video' | 'other' | 'folder'

export interface FileItem {
  id: string
  name: string
  type: FileItemType
  category: FileCategory
  parentId: string | null
  size: number // bytes
  createdAt: string
  updatedAt: string
  content?: string // for text files or mock URLs
}

export interface VerseData {
  arabic: string
  translation: string
  surah: string
  ayah: number
  surahNumber: number
  reference: string
}

export interface HadithData {
  arabic: string
  translation: string
  narrator: string
  source: string
  grade: string
}

export type WidgetType = 'tasks' | 'calendar' | 'notes' | 'verse' | 'goals' | 'clock' | 'files' | 'clipboard'

export interface DashboardWidget {
  type: WidgetType
  label: string
  icon: string
  visible: boolean
}

export type ActivePage = 'dashboard' | 'tasks' | 'calendar' | 'notes' | 'files' | 'spiritual' | 'goals' | 'settings'

export interface ClockConfig {
  id: string
  label: string
  timezone: string // IANA timezone string, e.g. 'Asia/Kuala_Lumpur'
}

export type BackgroundType = 'default' | 'color' | 'gradient' | 'image'

export interface BackgroundSettings {
  type: BackgroundType
  color: string
  gradient: string
  image: string
  opacity: number // 0-100
}

// ===== DEFAULT WIDGET CONFIGS =====
const defaultWidgets: DashboardWidget[] = [
  { type: 'tasks', label: 'Daily Tasks', icon: 'check_circle', visible: true },
  { type: 'calendar', label: 'Calendar', icon: 'calendar_month', visible: true },
  { type: 'notes', label: 'Quick Notes', icon: 'sticky_note_2', visible: true },
  { type: 'verse', label: 'Daily Verse', icon: 'auto_stories', visible: true },
  { type: 'goals', label: 'Goals', icon: 'flag', visible: true },
  { type: 'clock', label: 'World Clock', icon: 'schedule', visible: true },
  { type: 'files', label: 'Files', icon: 'folder', visible: true },
  { type: 'clipboard', label: 'Clipboard', icon: 'content_paste', visible: true },
]

// Max dimensions for grid widgets
export const MAX_GRID_W = 3
export const MAX_GRID_H = 6

// Aliases for internal use
const MAX_W = MAX_GRID_W
const MAX_H = MAX_GRID_H

// Desktop layouts: 3-column grid
const defaultLayouts: Layout[] = [
  { i: 'tasks', x: 0, y: 0, w: 2, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
  { i: 'calendar', x: 2, y: 0, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
  { i: 'notes', x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
  { i: 'verse', x: 1, y: 2, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
  { i: 'goals', x: 2, y: 2, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
  { i: 'clock', x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
  { i: 'files', x: 1, y: 4, w: 1, h: 1, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
  { i: 'clipboard', x: 2, y: 4, w: 1, h: 2, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
]

// Mobile layouts: 1-column stack (preserves h, forces w:1, x:0)
const defaultMobileLayouts: Layout[] = [
  { i: 'tasks', x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'calendar', x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'notes', x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'verse', x: 0, y: 6, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'goals', x: 0, y: 8, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'clock', x: 0, y: 10, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'files', x: 0, y: 12, w: 1, h: 1, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'clipboard', x: 0, y: 13, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
]

// Helper: local date string to avoid UTC shift from toISOString()
const localDateStr = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ===== GENERATE ID =====
const genId = () => crypto.randomUUID()

// ===== STORE INTERFACE =====
interface AppStore {
  // Navigation
  activePage: ActivePage
  setActivePage: (page: ActivePage) => void

  // Dashboard
  widgets: DashboardWidget[]
  layouts: Layout[]
  mobileLayouts: Layout[]
  setLayouts: (layouts: Layout[]) => void
  setMobileLayouts: (layouts: Layout[]) => void
  toggleWidgetVisibility: (type: WidgetType) => void
  updateWidgetSize: (widgetId: string, w: number, h: number) => void

  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  deleteCompletedTasks: () => void
  toggleTaskStatus: (id: string) => void

  // Goals
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  toggleMilestone: (goalId: string, milestoneId: string) => void

  // Notes
  notes: Note[]
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  toggleNotePinned: (id: string) => void

  // Note Layouts (regular notes)
  noteLayouts: Layout[]
  noteMobileLayouts: Layout[]
  setNoteLayouts: (layouts: Layout[]) => void
  setNoteMobileLayouts: (layouts: Layout[]) => void

  // Note Layouts (pinned notes)
  pinnedNoteLayouts: Layout[]
  pinnedNoteMobileLayouts: Layout[]
  setPinnedNoteLayouts: (layouts: Layout[]) => void
  setPinnedNoteMobileLayouts: (layouts: Layout[]) => void

  // Calendar
  events: CalendarEvent[]
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void
  deleteEvent: (id: string) => void

  // Clipboard
  clipboardText: string
  setClipboardText: (text: string) => void

  // File Manager
  files: FileItem[]
  currentFolderId: string | null
  setCurrentFolderId: (id: string | null) => void
  addFile: (file: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>) => void
  renameFile: (id: string, name: string) => void
  deleteFile: (id: string) => void
  moveFile: (fileId: string, newParentId: string | null) => void
  previewFile: FileItem | null
  setPreviewFile: (file: FileItem | null) => void

  // Spiritual
  verse: VerseData | null
  setVerse: (verse: VerseData | null) => void
  hadith: HadithData | null
  setHadith: (hadith: HadithData | null) => void
  verseLoading: boolean
  setVerseLoading: (loading: boolean) => void
  hadithLoading: boolean
  setHadithLoading: (loading: boolean) => void

  // Clock
  clocks: ClockConfig[]
  addClock: (clock: Omit<ClockConfig, 'id'>) => void
  removeClock: (id: string) => void
  updateClock: (id: string, updates: Partial<ClockConfig>) => void
  hijriVisible: boolean
  setHijriVisible: (visible: boolean) => void
  hijriOffset: number // -2 to +2 days
  setHijriOffset: (offset: number) => void
  showSeconds: boolean
  setShowSeconds: (show: boolean) => void
  iconBackgroundColor: string
  setIconBackgroundColor: (color: string) => void

  // Settings
  profileName: string
  setProfileName: (name: string) => void
  profilePicture: string
  setProfilePicture: (url: string) => void
  appTitle: string
  setAppTitle: (title: string) => void
  appLogo: string
  setAppLogo: (url: string) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void

  // Dashboard Manager
  showDashboardManager: boolean
  setShowDashboardManager: (show: boolean) => void

  // Dashboard Edit Mode
  dashboardEditMode: boolean
  setDashboardEditMode: (edit: boolean) => void

  // Background
  background: BackgroundSettings
  setBackground: (settings: Partial<BackgroundSettings>) => void

  // Highlighting (for navigation from search)
  highlightedTaskId: string | null
  setHighlightedTask: (id: string | null) => void
  highlightedNoteId: string | null
  setHighlightedNote: (id: string | null) => void
  highlightedGoalId: string | null
  setHighlightedGoal: (id: string | null) => void
}

// ===== STORE =====
// Note: This store starts with empty state.
// When authenticated with Convex, ConvexSync component will:
// 1. Override all write actions with Convex-aware versions
// 2. Sync Convex query results to the store state
export const useAppStore = create<AppStore>()((set, get) => ({
  // Navigation
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // Dashboard
  widgets: defaultWidgets,
  layouts: defaultLayouts,
  mobileLayouts: defaultMobileLayouts,
  setLayouts: (layouts) => set({ layouts }),
  setMobileLayouts: (layouts) => set({ mobileLayouts: layouts }),
  toggleWidgetVisibility: (type) =>
    set((state) => ({
      widgets: state.widgets.map((w) =>
        w.type === type ? { ...w, visible: !w.visible } : w
      ),
    })),
  updateWidgetSize: (widgetId, w, h) =>
    set((state) => ({
      layouts: state.layouts.map((l) =>
        l.i === widgetId ? { ...l, w: Math.min(Math.max(w, 1), MAX_W), h: Math.min(Math.max(h, 1), MAX_H) } : l
      ),
      mobileLayouts: state.mobileLayouts.map((l) =>
        l.i === widgetId ? { ...l, h: Math.min(Math.max(h, 1), MAX_H) } : l
      ),
    })),

  // Tasks
  tasks: [],
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, { ...task, id: genId(), createdAt: new Date().toISOString() }],
    })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  deleteTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
  deleteCompletedTasks: () =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.status !== 'completed') })),
  toggleTaskStatus: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' }
          : t
      ),
    })),

  // Goals
  goals: [],
  addGoal: (goal) =>
    set((state) => ({
      goals: [...state.goals, { ...goal, id: genId(), createdAt: new Date().toISOString() }],
    })),
  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  deleteGoal: (id) =>
    set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),
  toggleMilestone: (goalId, milestoneId) =>
    set((state) => ({
      goals: state.goals.map((g) => {
        if (g.id !== goalId) return g
        const milestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        )
        const completed = milestones.filter((m) => m.completed).length
        const progress = Math.round((completed / milestones.length) * 100)
        return { ...g, milestones, progress }
      }),
    })),

  // Notes
  notes: [],
  addNote: (note) =>
    set((state) => {
      const newId = genId()
      const newNote = {
        ...note,
        id: newId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const isPinned = note.pinned ?? false
      const layoutEntry: Layout = {
        i: newId, x: 0, y: 0, w: 1, h: 1,
        minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H,
      }
      return {
        notes: [newNote, ...state.notes],
        ...(isPinned
          ? {
            pinnedNoteLayouts: [layoutEntry, ...state.pinnedNoteLayouts.map((l) => ({ ...l, y: l.y + 1 }))],
            pinnedNoteMobileLayouts: [layoutEntry, ...state.pinnedNoteMobileLayouts.map((l) => ({ ...l, y: l.y + 1 }))],
          }
          : {
            noteLayouts: [layoutEntry, ...state.noteLayouts.map((l) => ({ ...l, y: l.y + 1 }))],
            noteMobileLayouts: [layoutEntry, ...state.noteMobileLayouts.map((l) => ({ ...l, y: l.y + 1 }))],
          }),
      }
    }),
  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      ),
    })),
  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      noteLayouts: state.noteLayouts.filter((l) => l.i !== id),
      noteMobileLayouts: state.noteMobileLayouts.filter((l) => l.i !== id),
      pinnedNoteLayouts: state.pinnedNoteLayouts.filter((l) => l.i !== id),
      pinnedNoteMobileLayouts: state.pinnedNoteMobileLayouts.filter((l) => l.i !== id),
    })),
  toggleNotePinned: (id) =>
    set((state) => {
      const note = state.notes.find((n) => n.id === id)
      if (!note) return state
      const newPinned = !note.pinned
      const layoutEntry: Layout = {
        i: id, x: 0, y: 0, w: 1, h: 1,
        minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H,
      }
      if (newPinned) {
        return {
          notes: state.notes.map((n) => n.id === id ? { ...n, pinned: true } : n),
          noteLayouts: state.noteLayouts.filter((l) => l.i !== id),
          noteMobileLayouts: state.noteMobileLayouts.filter((l) => l.i !== id),
          pinnedNoteLayouts: [layoutEntry, ...state.pinnedNoteLayouts.map((l) => ({ ...l, y: l.y + 1 }))],
          pinnedNoteMobileLayouts: [layoutEntry, ...state.pinnedNoteMobileLayouts.map((l) => ({ ...l, y: l.y + 1 }))],
        }
      } else {
        return {
          notes: state.notes.map((n) => n.id === id ? { ...n, pinned: false } : n),
          pinnedNoteLayouts: state.pinnedNoteLayouts.filter((l) => l.i !== id),
          pinnedNoteMobileLayouts: state.pinnedNoteMobileLayouts.filter((l) => l.i !== id),
          noteLayouts: [layoutEntry, ...state.noteLayouts.map((l) => ({ ...l, y: l.y + 1 }))],
          noteMobileLayouts: [layoutEntry, ...state.noteMobileLayouts.map((l) => ({ ...l, y: l.y + 1 }))],
        }
      }
    }),

  // Note Layouts
  noteLayouts: [],
  noteMobileLayouts: [],
  setNoteLayouts: (layouts) => set({ noteLayouts: layouts }),
  setNoteMobileLayouts: (layouts) => set({ noteMobileLayouts: layouts }),

  pinnedNoteLayouts: [],
  pinnedNoteMobileLayouts: [],
  setPinnedNoteLayouts: (layouts) => set({ pinnedNoteLayouts: layouts }),
  setPinnedNoteMobileLayouts: (layouts) => set({ pinnedNoteMobileLayouts: layouts }),

  // Calendar
  events: [],
  addEvent: (event) =>
    set((state) => ({ events: [...state.events, { ...event, id: genId() }] })),
  deleteEvent: (id) =>
    set((state) => ({ events: state.events.filter((e) => e.id !== id) })),

  // Clipboard
  clipboardText: '',
  setClipboardText: (text) => set({ clipboardText: text }),

  // File Manager
  files: [],
  currentFolderId: null,
  setCurrentFolderId: (id) => set({ currentFolderId: id }),
  addFile: (file) =>
    set((state) => ({
      files: [
        ...state.files,
        {
          ...file,
          id: genId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    })),
  renameFile: (id, name) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f
      ),
    })),
  deleteFile: (id) => {
    const { files } = get()
    const getChildrenIds = (parentId: string): string[] => {
      const children = files.filter((f) => f.parentId === parentId)
      return children.flatMap((c) => [c.id, ...getChildrenIds(c.id)])
    }
    const idsToDelete = [id, ...getChildrenIds(id)]
    set({ files: files.filter((f) => !idsToDelete.includes(f.id)) })
  },
  moveFile: (fileId, newParentId) =>
    set((state) => ({
      files: state.files.map((f) =>
        f.id === fileId ? { ...f, parentId: newParentId, updatedAt: new Date().toISOString() } : f
      ),
    })),
  previewFile: null,
  setPreviewFile: (file) => set({ previewFile: file }),

  // Spiritual
  verse: null,
  setVerse: (verse) => set({ verse }),
  hadith: null,
  setHadith: (hadith) => set({ hadith }),
  verseLoading: false,
  setVerseLoading: (loading) => set({ verseLoading: loading }),
  hadithLoading: false,
  setHadithLoading: (loading) => set({ hadithLoading: loading }),

  // Clock
  clocks: [],
  addClock: (clock) =>
    set((state) => ({
      clocks: [...state.clocks, { ...clock, id: genId() }],
    })),
  removeClock: (id) =>
    set((state) => ({
      clocks: state.clocks.filter((c) => c.id !== id),
    })),
  updateClock: (id, updates) =>
    set((state) => ({
      clocks: state.clocks.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  hijriVisible: true,
  setHijriVisible: (visible) => set({ hijriVisible: visible }),
  hijriOffset: 0,
  setHijriOffset: (offset) => set({ hijriOffset: Math.max(-2, Math.min(2, offset)) }),
  showSeconds: true,
  setShowSeconds: (show) => set({ showSeconds: show }),
  iconBackgroundColor: '#A5D6A7',
  setIconBackgroundColor: (color) => set({ iconBackgroundColor: color }),

  // Settings
  profileName: 'User',
  setProfileName: (name) => set({ profileName: name }),
  profilePicture: '',
  setProfilePicture: (url) => set({ profilePicture: url }),
  appTitle: 'ar-Raqmi Database',
  setAppTitle: (title) => set({ appTitle: title }),
  appLogo: '',
  setAppLogo: (url) => set({ appLogo: url }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  // Dashboard Manager
  showDashboardManager: false,
  setShowDashboardManager: (show) => set({ showDashboardManager: show }),

  // Dashboard Edit Mode
  dashboardEditMode: false,
  setDashboardEditMode: (edit) => set({ dashboardEditMode: edit }),

  // Background
  background: {
    type: 'default',
    color: '#A5D6A7',
    gradient: 'citrus-dawn',
    image: '',
    opacity: 30,
  },
  setBackground: (updates) =>
    set((state) => ({
      background: { ...state.background, ...updates },
    })),
  // Highlighting
  highlightedTaskId: null,
  setHighlightedTask: (id) => set({ highlightedTaskId: id }),
  highlightedNoteId: null,
  setHighlightedNote: (id) => set({ highlightedNoteId: id }),
  highlightedGoalId: null,
  setHighlightedGoal: (id) => set({ highlightedGoalId: id }),
}))
