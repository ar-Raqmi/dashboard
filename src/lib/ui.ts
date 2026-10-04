import { create } from 'zustand'
import type { Note, Task } from '@/lib/store'

export interface ConfirmOptions {
  title: string
  body: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

export interface ChoiceOption {
  id: string
  label: string
  description?: string
  danger?: boolean
}

export interface ChoiceOptions {
  title: string
  body: string
  options: ChoiceOption[]
}

interface ChoiceRequest extends ChoiceOptions {
  resolve: (id: string | null) => void
}

/** Header actions that a page owns the dialog for (the shell only fires them). */
export type UiCommandName = 'newEvent' | 'upload' | 'newFolder' | 'newGoal' | 'newAccount'

interface UiState {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  mobileNav: boolean
  setMobileNav: (v: boolean) => void
  /** Display preferences (persisted per device). */
  compact: boolean
  setCompact: (v: boolean) => void
  reduceMotion: boolean
  setReduceMotion: (v: boolean) => void

  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  helpOpen: boolean
  setHelpOpen: (v: boolean) => void

  /** Task create/edit modal. 'new' opens an empty form. */
  taskEditor: Task | 'new' | null
  setTaskEditor: (v: Task | 'new' | null) => void
  /** Task shown in the right-hand detail rail. */
  selectedTaskId: string | null
  selectTask: (id: string | null) => void

  noteEditor: Note | 'new' | null
  setNoteEditor: (v: Note | 'new' | null) => void

  /** Date (YYYY-MM-DD) the Calendar page should open on, set by search / the rail. */
  calendarFocus: string | null
  setCalendarFocus: (date: string | null) => void
  /** Query the Files page should pre-fill, set by global search. */
  fileSearch: string
  setFileSearch: (q: string) => void

  command: { name: UiCommandName; id: number } | null
  runCommand: (name: UiCommandName) => void

  confirmRequest: ConfirmRequest | null
  confirm: (options: ConfirmOptions) => Promise<boolean>
  resolveConfirm: (ok: boolean) => void

  choiceRequest: ChoiceRequest | null
  choose: (options: ChoiceOptions) => Promise<string | null>
  resolveChoice: (id: string | null) => void
}

export const SIDEBAR_STORAGE_KEY = 'raqmi-sidebar-collapsed'
export const COMPACT_STORAGE_KEY = 'raqmi-compact'
export const MOTION_STORAGE_KEY = 'raqmi-reduce-motion'

function persist(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* Preference lasts for the session only. */
  }
}

/** Read the saved display preferences once on the client. */
export function loadDisplayPreferences() {
  const read = (key: string) => {
    try {
      return localStorage.getItem(key) === '1'
    } catch {
      return false
    }
  }
  return {
    collapsed: read(SIDEBAR_STORAGE_KEY),
    compact: read(COMPACT_STORAGE_KEY),
    reduceMotion:
      localStorage.getItem(MOTION_STORAGE_KEY) === null
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : read(MOTION_STORAGE_KEY),
  }
}

export const useUi = create<UiState>((set, get) => ({
  collapsed: false,
  setCollapsed: (collapsed) => {
    set({ collapsed })
    persist(SIDEBAR_STORAGE_KEY, collapsed)
  },
  mobileNav: false,
  setMobileNav: (mobileNav) => set({ mobileNav }),
  compact: false,
  setCompact: (compact) => {
    set({ compact })
    persist(COMPACT_STORAGE_KEY, compact)
  },
  reduceMotion: false,
  setReduceMotion: (reduceMotion) => {
    set({ reduceMotion })
    persist(MOTION_STORAGE_KEY, reduceMotion)
  },

  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  helpOpen: false,
  setHelpOpen: (helpOpen) => set({ helpOpen }),

  taskEditor: null,
  setTaskEditor: (taskEditor) => set({ taskEditor }),
  selectedTaskId: null,
  selectTask: (selectedTaskId) => set({ selectedTaskId }),

  noteEditor: null,
  setNoteEditor: (noteEditor) => set({ noteEditor }),

  calendarFocus: null,
  setCalendarFocus: (calendarFocus) => set({ calendarFocus }),
  fileSearch: '',
  setFileSearch: (fileSearch) => set({ fileSearch }),

  command: null,
  runCommand: (name) => set((s) => ({ command: { name, id: (s.command?.id ?? 0) + 1 } })),

  confirmRequest: null,
  confirm: (options) =>
    new Promise<boolean>((resolve) => {
      get().confirmRequest?.resolve(false)
      set({ confirmRequest: { ...options, resolve } })
    }),
  resolveConfirm: (ok) => {
    const request = get().confirmRequest
    set({ confirmRequest: null })
    request?.resolve(ok)
  },

  choiceRequest: null,
  choose: (options) =>
    new Promise<string | null>((resolve) => {
      get().choiceRequest?.resolve(null)
      set({ choiceRequest: { ...options, resolve } })
    }),
  resolveChoice: (id) => {
    const request = get().choiceRequest
    set({ choiceRequest: null })
    request?.resolve(id)
  },
}))

/** Imperative helper so non-React code (and handlers) can ask for confirmation. */
export const confirmAction = (options: ConfirmOptions) => useUi.getState().confirm(options)

/** Ask which scope a destructive action applies to on a recurring item. */
export async function askRecurringDelete(kind: 'task' | 'event', occurrenceDate: string): Promise<'this' | 'all' | null> {
  const choice = await useUi.getState().choose({
    title: `Delete recurring ${kind}`,
    body: `This ${kind} repeats. Choose what to delete.`,
    options: [
      { id: 'this', label: 'Delete this day only', description: `Skip ${occurrenceDate}. The series continues.` },
      { id: 'all', label: 'Delete the entire series', description: 'Remove every occurrence permanently.', danger: true },
    ],
  })
  return choice === 'this' || choice === 'all' ? choice : null
}
