'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/lib/store'

/**
 * ConvexSync subscribes to all Convex queries and syncs data to the Zustand store.
 * This allows existing components to continue using the Zustand store for reads,
 * while data is actually sourced from Convex.
 */
export function ConvexSync({ children }: { children: React.ReactNode }) {
  const { sessionToken, user } = useAuth()
  const initialized = useRef(false)

  // Subscribe to all Convex queries
  const tasks = useQuery(api.tasks.list, sessionToken ? { sessionToken } : 'skip')
  const goals = useQuery(api.goals.list, sessionToken ? { sessionToken } : 'skip')
  const notes = useQuery(api.notes.list, sessionToken ? { sessionToken } : 'skip')
  const events = useQuery(api.events.list, sessionToken ? { sessionToken } : 'skip')
  const files = useQuery(api.files.list, sessionToken ? { sessionToken } : 'skip')
  const clocks = useQuery(api.clocks.list, sessionToken ? { sessionToken } : 'skip')
  const widgets = useQuery(api.dashboard.listWidgets, sessionToken ? { sessionToken } : 'skip')
  const desktopLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'desktop' } : 'skip')
  const mobileLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'mobile' } : 'skip')
  const notesDesktopLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'notesDesktop' } : 'skip')
  const notesMobileLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'notesMobile' } : 'skip')
  const pinnedDesktopLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'pinnedDesktop' } : 'skip')
  const pinnedMobileLayouts = useQuery(api.dashboard.getLayout, sessionToken ? { sessionToken, layoutType: 'pinnedMobile' } : 'skip')
  const settings = useQuery(api.settings.get, sessionToken ? { sessionToken } : 'skip')

  // Convex mutations for write operations
  const createTask = useMutation(api.tasks.create)
  const updateTask = useMutation(api.tasks.update)
  const deleteTaskMut = useMutation(api.tasks.remove)
  const deleteCompletedTasksMut = useMutation(api.tasks.deleteCompleted)
  const toggleTaskStatusMut = useMutation(api.tasks.toggleStatus)

  const createGoal = useMutation(api.goals.create)
  const updateGoal = useMutation(api.goals.update)
  const deleteGoalMut = useMutation(api.goals.remove)
  const toggleMilestoneMut = useMutation(api.goals.toggleMilestone)

  const createNote = useMutation(api.notes.create)
  const updateNote = useMutation(api.notes.update)
  const deleteNoteMut = useMutation(api.notes.remove)
  const toggleNotePinnedMut = useMutation(api.notes.togglePinned)

  const createEvent = useMutation(api.events.create)
  const deleteEventMut = useMutation(api.events.remove)

  const createFile = useMutation(api.files.create)
  const renameFileMut = useMutation(api.files.rename)
  const deleteFileMut = useMutation(api.files.remove)
  const moveFileMut = useMutation(api.files.move)

  const addClockMut = useMutation(api.clocks.add)
  const removeClockMut = useMutation(api.clocks.remove)
  const updateClockMut = useMutation(api.clocks.update)

  const toggleWidgetVisMut = useMutation(api.dashboard.toggleWidgetVisibility)
  const setLayoutMut = useMutation(api.dashboard.setLayout)

  const updateSettingsMut = useMutation(api.settings.update)

  // Sync Convex query results to Zustand store
  useEffect(() => {
    if (tasks !== undefined) {
      useAppStore.setState({ tasks })
    }
  }, [tasks])

  useEffect(() => {
    if (goals !== undefined) {
      useAppStore.setState({ goals })
    }
  }, [goals])

  useEffect(() => {
    if (notes !== undefined) {
      useAppStore.setState({ notes })
    }
  }, [notes])

  useEffect(() => {
    if (events !== undefined) {
      useAppStore.setState({ events })
    }
  }, [events])

  useEffect(() => {
    if (files !== undefined) {
      useAppStore.setState({ files })
    }
  }, [files])

  useEffect(() => {
    if (clocks !== undefined) {
      useAppStore.setState({ clocks })
    }
  }, [clocks])

  useEffect(() => {
    if (widgets !== undefined) {
      useAppStore.setState({ widgets })
    }
  }, [widgets])

  useEffect(() => {
    if (desktopLayouts !== undefined) {
      useAppStore.setState({ layouts: desktopLayouts })
    }
  }, [desktopLayouts])

  useEffect(() => {
    if (mobileLayouts !== undefined) {
      useAppStore.setState({ mobileLayouts })
    }
  }, [mobileLayouts])

  useEffect(() => {
    if (notesDesktopLayouts !== undefined) {
      useAppStore.setState({ noteLayouts: notesDesktopLayouts })
    }
  }, [notesDesktopLayouts])

  useEffect(() => {
    if (notesMobileLayouts !== undefined) {
      useAppStore.setState({ noteMobileLayouts: notesMobileLayouts })
    }
  }, [notesMobileLayouts])

  useEffect(() => {
    if (pinnedDesktopLayouts !== undefined) {
      useAppStore.setState({ pinnedNoteLayouts: pinnedDesktopLayouts })
    }
  }, [pinnedDesktopLayouts])

  useEffect(() => {
    if (pinnedMobileLayouts !== undefined) {
      useAppStore.setState({ pinnedNoteMobileLayouts: pinnedMobileLayouts })
    }
  }, [pinnedMobileLayouts])

  useEffect(() => {
    if (settings !== undefined && settings !== null) {
      useAppStore.setState({
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
      })
    }
  }, [settings])

  // Override Zustand actions with Convex-aware versions
  // This is the key part: when components call Zustand actions,
  // we also persist the changes to Convex
  useEffect(() => {
    if (!sessionToken || initialized.current) return
    initialized.current = true

    const store = useAppStore

    // Override task actions
    store.setState({
      addTask: (task) => {
        const id = crypto.randomUUID()
        const createdAt = new Date().toISOString()
        const newTask = { ...task, id, createdAt }
        store.setState((state) => ({ tasks: [...state.tasks, newTask] }))
        createTask({ sessionToken, ...task }).catch(console.error)
      },
      updateTask: (id, updates) => {
        store.setState((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }))
        updateTask({ sessionToken, taskId: id as any, ...updates }).catch(console.error)
      },
      deleteTask: (id) => {
        store.setState((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
        deleteTaskMut({ sessionToken, taskId: id as any }).catch(console.error)
      },
      deleteCompletedTasks: () => {
        store.setState((state) => ({ tasks: state.tasks.filter((t) => t.status !== 'completed') }))
        deleteCompletedTasksMut({ sessionToken }).catch(console.error)
      },
      toggleTaskStatus: (id) => {
        store.setState((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' }
              : t
          ),
        }))
        toggleTaskStatusMut({ sessionToken, taskId: id as any }).catch(console.error)
      },

      // Goal actions
      addGoal: (goal) => {
        const id = crypto.randomUUID()
        const createdAt = new Date().toISOString()
        const newGoal = { ...goal, id, createdAt }
        store.setState((state) => ({ goals: [...state.goals, newGoal] }))
        createGoal({ sessionToken, ...goal }).catch(console.error)
      },
      updateGoal: (id, updates) => {
        store.setState((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }))
        updateGoal({ sessionToken, goalId: id as any, ...updates }).catch(console.error)
      },
      deleteGoal: (id) => {
        store.setState((state) => ({ goals: state.goals.filter((g) => g.id !== id) }))
        deleteGoalMut({ sessionToken, goalId: id as any }).catch(console.error)
      },
      toggleMilestone: (goalId, milestoneId) => {
        store.setState((state) => ({
          goals: state.goals.map((g) => {
            if (g.id !== goalId) return g
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed } : m
            )
            const completed = milestones.filter((m) => m.completed).length
            const progress = Math.round((completed / milestones.length) * 100)
            return { ...g, milestones, progress }
          }),
        }))
        toggleMilestoneMut({ sessionToken, goalId: goalId as any, milestoneId: milestoneId as any }).catch(console.error)
      },

      // Note actions
      addNote: (note) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const newNote = { ...note, id, createdAt: now, updatedAt: now }
        store.setState((state) => ({ notes: [newNote, ...state.notes] }))
        createNote({ sessionToken, ...note }).catch(console.error)
      },
      updateNote: (id, updates) => {
        store.setState((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        }))
        updateNote({ sessionToken, noteId: id as any, ...updates }).catch(console.error)
      },
      deleteNote: (id) => {
        store.setState((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
          noteLayouts: state.noteLayouts.filter((l) => l.i !== id),
          noteMobileLayouts: state.noteMobileLayouts.filter((l) => l.i !== id),
          pinnedNoteLayouts: state.pinnedNoteLayouts.filter((l) => l.i !== id),
          pinnedNoteMobileLayouts: state.pinnedNoteMobileLayouts.filter((l) => l.i !== id),
        }))
        deleteNoteMut({ sessionToken, noteId: id as any }).catch(console.error)
      },
      toggleNotePinned: (id) => {
        const state = store.getState()
        const note = state.notes.find((n) => n.id === id)
        if (!note) return
        const newPinned = !note.pinned
        store.setState({
          notes: state.notes.map((n) => n.id === id ? { ...n, pinned: newPinned } : n),
        })
        toggleNotePinnedMut({ sessionToken, noteId: id as any }).catch(console.error)
      },

      // Event actions
      addEvent: (event) => {
        const id = crypto.randomUUID()
        store.setState((state) => ({ events: [...state.events, { ...event, id }] }))
        createEvent({ sessionToken, ...event }).catch(console.error)
      },
      deleteEvent: (id) => {
        store.setState((state) => ({ events: state.events.filter((e) => e.id !== id) }))
        deleteEventMut({ sessionToken, eventId: id as any }).catch(console.error)
      },

      // File actions
      addFile: (file) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        store.setState((state) => ({
          files: [...state.files, { ...file, id, createdAt: now, updatedAt: now }],
        }))
        createFile({ sessionToken, ...file, parentId: file.parentId ? (file.parentId as any) : undefined }).catch(console.error)
      },
      renameFile: (id, name) => {
        store.setState((state) => ({
          files: state.files.map((f) => f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f),
        }))
        renameFileMut({ sessionToken, fileId: id as any, name }).catch(console.error)
      },
      deleteFile: (id) => {
        const { files } = store.getState()
        const getChildrenIds = (parentId: string): string[] => {
          const children = files.filter((f) => f.parentId === parentId)
          return children.flatMap((c) => [c.id, ...getChildrenIds(c.id)])
        }
        const idsToDelete = new Set([id, ...getChildrenIds(id)])
        store.setState({ files: files.filter((f) => !idsToDelete.has(f.id)) })
        deleteFileMut({ sessionToken, fileId: id as any }).catch(console.error)
      },
      moveFile: (fileId, newParentId) => {
        store.setState((state) => ({
          files: state.files.map((f) =>
            f.id === fileId ? { ...f, parentId: newParentId, updatedAt: new Date().toISOString() } : f
          ),
        }))
        moveFileMut({ sessionToken, fileId: fileId as any, newParentId: newParentId ? (newParentId as any) : undefined }).catch(console.error)
      },

      // Clock actions
      addClock: (clock) => {
        const id = crypto.randomUUID()
        store.setState((state) => ({ clocks: [...state.clocks, { ...clock, id }] }))
        addClockMut({ sessionToken, ...clock }).catch(console.error)
      },
      removeClock: (id) => {
        store.setState((state) => ({ clocks: state.clocks.filter((c) => c.id !== id) }))
        removeClockMut({ sessionToken, clockId: id as any }).catch(console.error)
      },
      updateClock: (id, updates) => {
        store.setState((state) => ({
          clocks: state.clocks.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }))
        updateClockMut({ sessionToken, clockId: id as any, ...updates }).catch(console.error)
      },

      // Dashboard actions
      toggleWidgetVisibility: (type) => {
        store.setState((state) => ({
          widgets: state.widgets.map((w) =>
            w.type === type ? { ...w, visible: !w.visible } : w
          ),
        }))
        toggleWidgetVisMut({ sessionToken, widgetType: type }).catch(console.error)
      },
      setLayouts: (layouts) => {
        store.setState({ layouts })
        setLayoutMut({ sessionToken, layoutType: 'desktop', layouts: JSON.stringify(layouts) }).catch(console.error)
      },
      setMobileLayouts: (layouts) => {
        store.setState({ mobileLayouts: layouts })
        setLayoutMut({ sessionToken, layoutType: 'mobile', layouts: JSON.stringify(layouts) }).catch(console.error)
      },
      setNoteLayouts: (layouts) => {
        store.setState({ noteLayouts: layouts })
        setLayoutMut({ sessionToken, layoutType: 'notesDesktop', layouts: JSON.stringify(layouts) }).catch(console.error)
      },
      setNoteMobileLayouts: (layouts) => {
        store.setState({ noteMobileLayouts: layouts })
        setLayoutMut({ sessionToken, layoutType: 'notesMobile', layouts: JSON.stringify(layouts) }).catch(console.error)
      },
      setPinnedNoteLayouts: (layouts) => {
        store.setState({ pinnedNoteLayouts: layouts })
        setLayoutMut({ sessionToken, layoutType: 'pinnedDesktop', layouts: JSON.stringify(layouts) }).catch(console.error)
      },
      setPinnedNoteMobileLayouts: (layouts) => {
        store.setState({ pinnedNoteMobileLayouts: layouts })
        setLayoutMut({ sessionToken, layoutType: 'pinnedMobile', layouts: JSON.stringify(layouts) }).catch(console.error)
      },

      // Settings actions
      setProfileName: (name) => {
        store.setState({ profileName: name })
        updateSettingsMut({ sessionToken, profileName: name }).catch(console.error)
      },
      setProfilePicture: (url) => {
        store.setState({ profilePicture: url })
        updateSettingsMut({ sessionToken, profilePicture: url }).catch(console.error)
      },
      setAppTitle: (title) => {
        store.setState({ appTitle: title })
        updateSettingsMut({ sessionToken, appTitle: title }).catch(console.error)
      },
      setAppLogo: (url) => {
        store.setState({ appLogo: url })
        updateSettingsMut({ sessionToken, appLogo: url }).catch(console.error)
      },
      setIconBackgroundColor: (color) => {
        store.setState({ iconBackgroundColor: color })
        updateSettingsMut({ sessionToken, iconBackgroundColor: color }).catch(console.error)
      },
      setHijriVisible: (visible) => {
        store.setState({ hijriVisible: visible })
        updateSettingsMut({ sessionToken, hijriVisible: visible }).catch(console.error)
      },
      setHijriOffset: (offset) => {
        store.setState({ hijriOffset: Math.max(-2, Math.min(2, offset)) })
        updateSettingsMut({ sessionToken, hijriOffset: offset }).catch(console.error)
      },
      setShowSeconds: (show) => {
        store.setState({ showSeconds: show })
        updateSettingsMut({ sessionToken, showSeconds: show }).catch(console.error)
      },
      setClipboardText: (text) => {
        store.setState({ clipboardText: text })
        updateSettingsMut({ sessionToken, clipboardText: text }).catch(console.error)
      },
      setBackground: (updates) => {
        store.setState((state) => ({
          background: { ...state.background, ...updates },
        }))
        updateSettingsMut({
          sessionToken,
          ...(updates.type !== undefined ? { backgroundType: updates.type } : {}),
          ...(updates.color !== undefined ? { backgroundColor: updates.color } : {}),
          ...(updates.gradient !== undefined ? { backgroundGradient: updates.gradient } : {}),
          ...(updates.image !== undefined ? { backgroundImage: updates.image } : {}),
          ...(updates.opacity !== undefined ? { backgroundOpacity: updates.opacity } : {}),
        }).catch(console.error)
      },
    })
  }, [sessionToken])

  // Reset initialized flag when user logs out
  useEffect(() => {
    if (!user) {
      initialized.current = false
    }
  }, [user])

  return <>{children}</>
}
