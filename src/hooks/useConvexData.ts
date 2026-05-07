'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from './useAuth'
import type { Priority, TaskStatus } from '@/lib/store'

// ===== TASKS =====
export function useTasks() {
  const { sessionToken } = useAuth()

  const tasks = useQuery(api.tasks.list, sessionToken ? { sessionToken } : 'skip')
  const createMutation = useMutation(api.tasks.create)
  const updateMutation = useMutation(api.tasks.update)
  const removeMutation = useMutation(api.tasks.remove)
  const deleteCompletedMutation = useMutation(api.tasks.deleteCompleted)
  const toggleStatusMutation = useMutation(api.tasks.toggleStatus)

  return {
    tasks: (tasks ?? []) as Array<{
      id: string
      title: string
      dueDate: string | null
      priority: Priority
      status: TaskStatus
      createdAt: string
    }>,
    addTask: (task: Omit<{ title: string; dueDate?: string; priority: Priority; status: TaskStatus }, never>) =>
      createMutation({ sessionToken, ...task, dueDate: task.dueDate || undefined }),
    updateTask: (id: string, updates: Partial<{ title: string; dueDate: string | null; priority: Priority; status: TaskStatus }>) =>
      updateMutation({
        sessionToken,
        taskId: id as any,
        ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate || undefined } : {}),
        ...updates,
      }),
    deleteTask: (id: string) =>
      removeMutation({ sessionToken, taskId: id as any }),
    deleteCompletedTasks: () =>
      deleteCompletedMutation({ sessionToken }),
    toggleTaskStatus: (id: string) =>
      toggleStatusMutation({ sessionToken, taskId: id as any }),
  }
}

// ===== GOALS =====
export function useGoals() {
  const { sessionToken } = useAuth()

  const goals = useQuery(api.goals.list, sessionToken ? { sessionToken } : 'skip')
  const createMutation = useMutation(api.goals.create)
  const updateMutation = useMutation(api.goals.update)
  const removeMutation = useMutation(api.goals.remove)
  const toggleMilestoneMutation = useMutation(api.goals.toggleMilestone)

  return {
    goals: (goals ?? []) as Array<{
      id: string
      title: string
      progress: number
      milestones: Array<{ id: string; label: string; completed: boolean }>
      createdAt: string
    }>,
    addGoal: (goal: { title: string; progress: number; milestones: Array<{ label: string; completed: boolean }> }) =>
      createMutation({ sessionToken, ...goal }),
    updateGoal: (id: string, updates: Partial<{ title: string; progress: number }>) =>
      updateMutation({ sessionToken, goalId: id as any, ...updates }),
    deleteGoal: (id: string) =>
      removeMutation({ sessionToken, goalId: id as any }),
    toggleMilestone: (goalId: string, milestoneId: string) =>
      toggleMilestoneMutation({ sessionToken, goalId: goalId as any, milestoneId: milestoneId as any }),
  }
}

// ===== NOTES =====
export function useNotes() {
  const { sessionToken } = useAuth()

  const notes = useQuery(api.notes.list, sessionToken ? { sessionToken } : 'skip')
  const createMutation = useMutation(api.notes.create)
  const updateMutation = useMutation(api.notes.update)
  const removeMutation = useMutation(api.notes.remove)
  const togglePinnedMutation = useMutation(api.notes.togglePinned)

  return {
    notes: (notes ?? []) as Array<{
      id: string
      title: string
      content: string
      color: string
      pinned: boolean
      createdAt: string
      updatedAt: string
    }>,
    addNote: (note: { title: string; content: string; color: string; pinned: boolean }) =>
      createMutation({ sessionToken, ...note }),
    updateNote: (id: string, updates: Partial<{ title: string; content: string; color: string; pinned: boolean }>) =>
      updateMutation({ sessionToken, noteId: id as any, ...updates }),
    deleteNote: (id: string) =>
      removeMutation({ sessionToken, noteId: id as any }),
    toggleNotePinned: (id: string) =>
      togglePinnedMutation({ sessionToken, noteId: id as any }),
  }
}

// ===== EVENTS =====
export function useEvents() {
  const { sessionToken } = useAuth()

  const events = useQuery(api.events.list, sessionToken ? { sessionToken } : 'skip')
  const createMutation = useMutation(api.events.create)
  const removeMutation = useMutation(api.events.remove)

  return {
    events: (events ?? []) as Array<{
      id: string
      title: string
      date: string
      color?: string
    }>,
    addEvent: (event: { title: string; date: string; color?: string }) =>
      createMutation({ sessionToken, ...event }),
    deleteEvent: (id: string) =>
      removeMutation({ sessionToken, eventId: id as any }),
  }
}

// ===== FILES =====
export function useFiles() {
  const { sessionToken } = useAuth()

  const files = useQuery(api.files.list, sessionToken ? { sessionToken } : 'skip')
  const createMutation = useMutation(api.files.create)
  const renameMutation = useMutation(api.files.rename)
  const removeMutation = useMutation(api.files.remove)
  const moveMutation = useMutation(api.files.move)

  return {
    files: (files ?? []) as Array<{
      id: string
      name: string
      type: string
      category: string
      parentId: string | null
      size: number
      createdAt: string
      updatedAt: string
      content?: string
    }>,
    addFile: (file: { name: string; type: string; category: string; parentId?: string; size: number; content?: string }) =>
      createMutation({
        sessionToken,
        ...file,
        parentId: file.parentId ? (file.parentId as any) : undefined,
      }),
    renameFile: (id: string, name: string) =>
      renameMutation({ sessionToken, fileId: id as any, name }),
    deleteFile: (id: string) =>
      removeMutation({ sessionToken, fileId: id as any }),
    moveFile: (fileId: string, newParentId: string | null) =>
      moveMutation({ sessionToken, fileId: fileId as any, newParentId: newParentId ? (newParentId as any) : undefined }),
  }
}

// ===== CLOCKS =====
export function useClocks() {
  const { sessionToken } = useAuth()

  const clocks = useQuery(api.clocks.list, sessionToken ? { sessionToken } : 'skip')
  const addMutation = useMutation(api.clocks.add)
  const removeMutation = useMutation(api.clocks.remove)
  const updateMutation = useMutation(api.clocks.update)

  return {
    clocks: (clocks ?? []) as Array<{
      id: string
      label: string
      timezone: string
    }>,
    addClock: (clock: { label: string; timezone: string }) =>
      addMutation({ sessionToken, ...clock }),
    removeClock: (id: string) =>
      removeMutation({ sessionToken, clockId: id as any }),
    updateClock: (id: string, updates: Partial<{ label: string; timezone: string }>) =>
      updateMutation({ sessionToken, clockId: id as any, ...updates }),
  }
}

// ===== DASHBOARD =====
export function useDashboard() {
  const { sessionToken } = useAuth()

  const widgets = useQuery(api.dashboard.listWidgets, sessionToken ? { sessionToken } : 'skip')
  const desktopLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'desktop' } : 'skip')
  const mobileLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'mobile' } : 'skip')
  const notesDesktopLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'notesDesktop' } : 'skip')
  const notesMobileLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'notesMobile' } : 'skip')
  const pinnedDesktopLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'pinnedDesktop' } : 'skip')
  const pinnedMobileLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'pinnedMobile' } : 'skip')

  const toggleVisibilityMutation = useMutation(api.dashboard.toggleWidgetVisibility)
  const setWidgetsMutation = useMutation(api.dashboard.setWidgets)
  const setLayoutMutation = useMutation(api.dashboard.setLayout)

  return {
    widgets: (widgets ?? []) as Array<{
      type: string
      label: string
      icon: string
      visible: boolean
    }>,
    layouts: (desktopLayouts ?? []) as any[],
    mobileLayouts: (mobileLayouts ?? []) as any[],
    noteLayouts: (notesDesktopLayouts ?? []) as any[],
    noteMobileLayouts: (notesMobileLayouts ?? []) as any[],
    pinnedNoteLayouts: (pinnedDesktopLayouts ?? []) as any[],
    pinnedNoteMobileLayouts: (pinnedMobileLayouts ?? []) as any[],
    toggleWidgetVisibility: (type: string) =>
      toggleVisibilityMutation({ sessionToken, widgetType: type }),
    setWidgets: (widgets: Array<{ type: string; label: string; icon: string; visible: boolean }>) =>
      setWidgetsMutation({ sessionToken, widgets }),
    setLayouts: (layouts: any[]) =>
      setLayoutMutation({ sessionToken, layoutType: 'desktop', layouts: JSON.stringify(layouts) }),
    setMobileLayouts: (layouts: any[]) =>
      setLayoutMutation({ sessionToken, layoutType: 'mobile', layouts: JSON.stringify(layouts) }),
    setNoteLayouts: (layouts: any[]) =>
      setLayoutMutation({ sessionToken, layoutType: 'notesDesktop', layouts: JSON.stringify(layouts) }),
    setNoteMobileLayouts: (layouts: any[]) =>
      setLayoutMutation({ sessionToken, layoutType: 'notesMobile', layouts: JSON.stringify(layouts) }),
    setPinnedNoteLayouts: (layouts: any[]) =>
      setLayoutMutation({ sessionToken, layoutType: 'pinnedDesktop', layouts: JSON.stringify(layouts) }),
    setPinnedNoteMobileLayouts: (layouts: any[]) =>
      setLayoutMutation({ sessionToken, layoutType: 'pinnedMobile', layouts: JSON.stringify(layouts) }),
  }
}

// ===== SETTINGS =====
export function useSettings() {
  const { sessionToken } = useAuth()

  const settings = useQuery(api.settings.get, sessionToken ? { sessionToken } : 'skip')
  const updateMutation = useMutation(api.settings.update)

  const defaultSettings = {
    profileName: 'User',
    profilePicture: '',
    appTitle: 'ar-Raqmi Database',
    appLogo: '',
    iconBackgroundColor: '#A5D6A7',
    hijriVisible: true,
    hijriOffset: 0,
    showSeconds: true,
    clipboardText: '',
    background: {
      type: 'default' as const,
      color: '#A5D6A7',
      gradient: 'citrus-dawn',
      image: '',
      opacity: 30,
    },
  }

  const currentSettings = settings ? {
    profileName: settings.profileName,
    profilePicture: settings.profilePicture ?? '',
    appTitle: settings.appTitle,
    appLogo: settings.appLogo ?? '',
    iconBackgroundColor: settings.iconBackgroundColor,
    hijriVisible: settings.hijriVisible,
    hijriOffset: settings.hijriOffset,
    showSeconds: settings.showSeconds,
    clipboardText: settings.clipboardText,
    background: settings.background,
  } : defaultSettings

  return {
    settings: currentSettings,
    updateSettings: (updates: Record<string, any>) =>
      updateMutation({ sessionToken, ...updates }),
    setProfileName: (name: string) =>
      updateMutation({ sessionToken, profileName: name }),
    setProfilePicture: (url: string) =>
      updateMutation({ sessionToken, profilePicture: url }),
    setAppTitle: (title: string) =>
      updateMutation({ sessionToken, appTitle: title }),
    setAppLogo: (url: string) =>
      updateMutation({ sessionToken, appLogo: url }),
    setIconBackgroundColor: (color: string) =>
      updateMutation({ sessionToken, iconBackgroundColor: color }),
    setHijriVisible: (visible: boolean) =>
      updateMutation({ sessionToken, hijriVisible: visible }),
    setHijriOffset: (offset: number) =>
      updateMutation({ sessionToken, hijriOffset: offset }),
    setShowSeconds: (show: boolean) =>
      updateMutation({ sessionToken, showSeconds: show }),
    setClipboardText: (text: string) =>
      updateMutation({ sessionToken, clipboardText: text }),
    setBackground: (updates: Partial<typeof defaultSettings.background>) =>
      updateMutation({
        sessionToken,
        ...(updates.type !== undefined ? { backgroundType: updates.type } : {}),
        ...(updates.color !== undefined ? { backgroundColor: updates.color } : {}),
        ...(updates.gradient !== undefined ? { backgroundGradient: updates.gradient } : {}),
        ...(updates.image !== undefined ? { backgroundImage: updates.image } : {}),
        ...(updates.opacity !== undefined ? { backgroundOpacity: updates.opacity } : {}),
      }),
  }
}
