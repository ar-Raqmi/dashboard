import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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

export type WidgetType = 'tasks' | 'calendar' | 'notes' | 'verse' | 'goals' | 'clock' | 'files'

export interface DashboardWidget {
  type: WidgetType
  label: string
  icon: string
  visible: boolean
}

export type ActivePage = 'dashboard' | 'tasks' | 'calendar' | 'notes' | 'files' | 'spiritual' | 'goals' | 'settings'

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
  { type: 'clock', label: 'GMT Clock', icon: 'schedule', visible: true },
  { type: 'files', label: 'Files', icon: 'folder', visible: true },
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
  { i: 'clock', x: 0, y: 4, w: 1, h: 1, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
  { i: 'files', x: 1, y: 4, w: 1, h: 1, minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H },
]

// Mobile layouts: 1-column stack (preserves h, forces w:1, x:0)
const defaultMobileLayouts: Layout[] = [
  { i: 'tasks', x: 0, y: 0, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'calendar', x: 0, y: 2, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'notes', x: 0, y: 4, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'verse', x: 0, y: 6, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'goals', x: 0, y: 8, w: 1, h: 2, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'clock', x: 0, y: 10, w: 1, h: 1, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
  { i: 'files', x: 0, y: 12, w: 1, h: 1, minW: 1, maxW: 1, minH: 1, maxH: MAX_H },
]

// ===== SAMPLE DATA =====
const sampleTasks: Task[] = [
  { id: crypto.randomUUID(), title: 'Review project proposal', dueDate: new Date().toISOString().split('T')[0], priority: 'high', status: 'pending', createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), title: 'Update documentation', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], priority: 'medium', status: 'pending', createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), title: 'Team standup meeting', dueDate: new Date().toISOString().split('T')[0], priority: 'low', status: 'completed', createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), title: 'Fix API endpoint bug', dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], priority: 'high', status: 'pending', createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), title: 'Write unit tests', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], priority: 'medium', status: 'pending', createdAt: new Date().toISOString() },
]

const sampleGoals: Goal[] = [
  {
    id: crypto.randomUUID(), title: 'Complete ar-Raqmi Database', progress: 65,
    milestones: [
      { id: 'm1', label: 'Design Phase', completed: true },
      { id: 'm2', label: 'Core Features', completed: true },
      { id: 'm3', label: 'Grid Engine', completed: false },
      { id: 'm4', label: 'Launch', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(), title: 'Learn Arabic Calligraphy', progress: 30,
    milestones: [
      { id: 'm5', label: 'Basic Strokes', completed: true },
      { id: 'm6', label: 'Letter Forms', completed: false },
      { id: 'm7', label: 'Composition', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(), title: 'Read 30 Books This Year', progress: 43,
    milestones: [
      { id: 'm8', label: '10 Books', completed: true },
      { id: 'm9', label: '20 Books', completed: false },
      { id: 'm10', label: '30 Books', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
]

const sampleNotes: Note[] = [
  { id: crypto.randomUUID(), title: 'Project Ideas', content: 'Build a Quran study app with AI-powered tafsir recommendations', color: '#A5D6A7', pinned: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: crypto.randomUUID(), title: 'Meeting Notes', content: 'Discuss sprint priorities and assign tasks for next week', color: '#F48FB1', pinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: crypto.randomUUID(), title: 'Quick Reminder', content: 'Submit quarterly report by Friday', color: '#CE93D8', pinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: crypto.randomUUID(), title: 'Design Inspiration', content: 'Material 3 Expressive: bouncy animations, bold colors, rounded shapes', color: '#80CBC4', pinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

// Helper: local date string to avoid UTC shift from toISOString()
const localDateStr = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const sampleEvents: CalendarEvent[] = [
  { id: crypto.randomUUID(), title: 'Team Meeting', date: localDateStr(new Date()), color: '#A5D6A7' },
  { id: crypto.randomUUID(), title: 'Project Deadline', date: localDateStr(new Date(Date.now() + 86400000 * 2)), color: '#F48FB1' },
  { id: crypto.randomUUID(), title: 'Design Review', date: localDateStr(new Date(Date.now() + 86400000 * 5)), color: '#CE93D8' },
  { id: crypto.randomUUID(), title: 'Sprint Planning', date: localDateStr(new Date(Date.now() + 86400000 * 7)), color: '#80CBC4' },
]

const sampleFiles: FileItem[] = [
  { id: 'f1', name: 'Documents', type: 'folder', category: 'folder', parentId: null, size: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f2', name: 'Images', type: 'folder', category: 'folder', parentId: null, size: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f3', name: 'Audio', type: 'folder', category: 'folder', parentId: null, size: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f4', name: 'Project Plan.pdf', type: 'file', category: 'pdf', parentId: 'f1', size: 2450000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f5', name: 'Meeting Notes.doc', type: 'file', category: 'doc', parentId: 'f1', size: 156000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f6', name: 'Dashboard Mock.png', type: 'file', category: 'image', parentId: 'f2', size: 3200000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f7', name: 'Logo.svg', type: 'file', category: 'image', parentId: 'f2', size: 24000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f8', name: 'Recitation.mp3', type: 'file', category: 'audio', parentId: 'f3', size: 8500000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f9', name: 'Adhan.mp3', type: 'file', category: 'audio', parentId: 'f3', size: 4200000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'f10', name: 'Budget.xlsx', type: 'file', category: 'doc', parentId: 'f1', size: 89000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

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
  timezone: string
  setTimezone: (tz: string) => void

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

  // Dashboard Manager
  showDashboardManager: boolean
  setShowDashboardManager: (show: boolean) => void

  // Dashboard Edit Mode
  dashboardEditMode: boolean
  setDashboardEditMode: (edit: boolean) => void

  // Background
  background: BackgroundSettings
  setBackground: (settings: Partial<BackgroundSettings>) => void
}

// ===== GENERATE ID =====
const genId = () => crypto.randomUUID()

// ===== STORE =====
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
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
      tasks: sampleTasks,
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
      toggleTaskStatus: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' }
              : t
          ),
        })),

      // Goals
      goals: sampleGoals,
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
      notes: sampleNotes,
      addNote: (note) =>
        set((state) => {
          const newId = genId()
          const newNote = {
            ...note,
            id: newId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          // Add layout entry at the top of the appropriate section
          const isPinned = note.pinned ?? false
          const layoutEntry: Layout = {
            i: newId, x: 0, y: 0, w: 1, h: 1,
            minW: 1, maxW: MAX_W, minH: 1, maxH: MAX_H,
          }
          return {
            // New notes go to the TOP
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
          // Remove from old section, add to new section at top
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
      events: sampleEvents,
      addEvent: (event) =>
        set((state) => ({ events: [...state.events, { ...event, id: genId() }] })),
      deleteEvent: (id) =>
        set((state) => ({ events: state.events.filter((e) => e.id !== id) })),

      // File Manager
      files: sampleFiles,
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
        // Recursively find all children
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
      timezone: 'Asia/Kuala_Lumpur',
      setTimezone: (tz) => set({ timezone: tz }),

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
    }),
    {
      name: 'ar-raqmi-store',
      partialize: (state) => ({
        widgets: state.widgets,
        layouts: state.layouts,
        mobileLayouts: state.mobileLayouts,
        tasks: state.tasks,
        goals: state.goals,
        notes: state.notes,
        events: state.events,
        files: state.files,
        timezone: state.timezone,
        profileName: state.profileName,
        profilePicture: state.profilePicture,
        appTitle: state.appTitle,
        appLogo: state.appLogo,
        background: state.background,
        noteLayouts: state.noteLayouts,
        noteMobileLayouts: state.noteMobileLayouts,
        pinnedNoteLayouts: state.pinnedNoteLayouts,
        pinnedNoteMobileLayouts: state.pinnedNoteMobileLayouts,
      }),
    }
  )
)
