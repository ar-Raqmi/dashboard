import { getDb } from './db'
import {
  AuthService,
  TaskService,
  GoalService,
  NoteService,
  EventService,
  FileService,
  ClockService,
  DashboardService,
  SettingService,
  TwoFactorService,
  ContentService,
} from './services'

// Queries Router
export async function handleQuery(path: string, args: any, env?: any) {
  const db = getDb(env)

    const authService = new AuthService(db, env)
    const taskService = new TaskService(db, env)
    const goalService = new GoalService(db, env)
    const noteService = new NoteService(db, env)
    const eventService = new EventService(db, env)
    const fileService = new FileService(db, env)
    const clockService = new ClockService(db, env)
    const dashboardService = new DashboardService(db, env)
    const settingService = new SettingService(db, env)
    const twoFactorService = new TwoFactorService(db, env)
    const contentService = new ContentService(db, env)

    switch (path) {
      // Auth
      case 'auth:validateSession':
        return authService.validateSession(args)
      case 'auth:getUserByUsername':
        return authService.getUserByUsername(args)

      // Tasks
      case 'tasks:list':
        return taskService.list(args)

      // Goals
      case 'goals:list':
        return goalService.list(args)

      // Notes
      case 'notes:list':
        return noteService.list(args)

      // Events
      case 'events:list':
        return eventService.list(args)

      // Files
      case 'files:list':
        return fileService.list(args)
      case 'files:listAll':
        return fileService.listAll(args)
      case 'files:getStorageStats':
        return fileService.getStorageStats(args)
      case 'files:getFileUrl':
        return fileService.getFileUrl(args)
      case 'files:getThumbnailUrl':
        return fileService.getThumbnailUrl(args)
      case 'files:getFilesRecursive':
        return fileService.getFilesRecursive(args)
      case 'files:search':
        return fileService.search(args)

      // Clocks
      case 'clocks:list':
        return clockService.list(args)

      // Dashboard
      case 'dashboard:listWidgets':
        return dashboardService.listWidgets(args)
      case 'dashboard:getLayout':
        return dashboardService.getLayout(args)
      case 'dashboard:getData': {
        const [tasks, goals, notes, events, files, clocks, widgets, desktopLayouts, mobileLayouts, notesDesktopLayouts, notesMobileLayouts, pinnedDesktopLayouts, pinnedMobileLayouts, goalDesktopLayouts, goalMobileLayouts, settings] = await Promise.all([
          taskService.list(args),
          goalService.list(args),
          noteService.list(args),
          eventService.list(args),
          fileService.listAll(args),
          clockService.list(args),
          dashboardService.listWidgets(args),
          dashboardService.getLayout({ ...args, layoutType: 'desktop' }),
          dashboardService.getLayout({ ...args, layoutType: 'mobile' }),
          dashboardService.getLayout({ ...args, layoutType: 'notesDesktop' }),
          dashboardService.getLayout({ ...args, layoutType: 'notesMobile' }),
          dashboardService.getLayout({ ...args, layoutType: 'pinnedDesktop' }),
          dashboardService.getLayout({ ...args, layoutType: 'pinnedMobile' }),
          dashboardService.getLayout({ ...args, layoutType: 'goalsDesktop' }),
          dashboardService.getLayout({ ...args, layoutType: 'goalsMobile' }),
          settingService.get(args),
        ])
        return {
          tasks,
          goals,
          notes,
          events,
          files,
          clocks,
          widgets,
          desktopLayouts,
          mobileLayouts,
          notesDesktopLayouts,
          notesMobileLayouts,
          pinnedDesktopLayouts,
          pinnedMobileLayouts,
          goalDesktopLayouts,
          goalMobileLayouts,
          settings,
        }
      }

      // Settings
      case 'settings:get':
        return settingService.get(args)

      // 2FA
      case 'twoFactor:list':
        return twoFactorService.list(args)

      // Content
      case 'content:getDailyVerseAction':
        return contentService.getDailyVerseAction()
      case 'content:getDailyHadithAction':
        return contentService.getDailyHadithAction()

      // R2 Storage
      case 'r2:getUploadUrl':
        return fileService.getUploadUrl(args)
      case 'r2:removeFile':
        return fileService.removeFile(args)
      case 'r2:removeFiles':
        return fileService.removeFiles(args)

      default:
        throw new Error(`Unknown query path: ${path}`)
    }
}

// Mutations Router
export async function handleMutation(path: string, args: any, env?: any) {
  const db = getDb(env)

    const authService = new AuthService(db, env)
    const taskService = new TaskService(db, env)
    const goalService = new GoalService(db, env)
    const noteService = new NoteService(db, env)
    const eventService = new EventService(db, env)
    const fileService = new FileService(db, env)
    const clockService = new ClockService(db, env)
    const dashboardService = new DashboardService(db, env)
    const settingService = new SettingService(db, env)
    const twoFactorService = new TwoFactorService(db, env)

    switch (path) {
      // Sessions
      case 'sessions:create':
        return authService.createSession(args)
      case 'sessions:remove':
        return authService.removeSession(args)

      // Auth
      case 'auth:updateUser':
        return authService.updateUser(args)

      // Tasks
      case 'tasks:create':
        return taskService.create(args)
      case 'tasks:update':
        return taskService.update(args)
      case 'tasks:remove':
        return taskService.remove(args)
      case 'tasks:deleteCompleted':
        return taskService.deleteCompleted(args)
      case 'tasks:deleteOldCompleted':
        return taskService.deleteOldCompleted(args)
      case 'tasks:toggleStatus':
        return taskService.toggleStatus(args)
      case 'tasks:setOccurrenceException':
        return taskService.setOccurrenceException(args)

      // Goals
      case 'goals:create':
        return goalService.create(args)
      case 'goals:update':
        return goalService.update(args)
      case 'goals:remove':
        return goalService.remove(args)
      case 'goals:toggleMilestone':
        return goalService.toggleMilestone(args)
      case 'goals:reorder':
        return goalService.reorder(args)

      // Notes
      case 'notes:create':
        return noteService.create(args)
      case 'notes:update':
        return noteService.update(args)
      case 'notes:remove':
        return noteService.remove(args)
      case 'notes:togglePinned':
        return noteService.togglePinned(args)

      // Events
      case 'events:create':
        return eventService.create(args)
      case 'events:update':
        return eventService.update(args)
      case 'events:remove':
        return eventService.remove(args)
      case 'events:setOccurrenceException':
        return eventService.setOccurrenceException(args)

      // Files
      case 'files:create':
      case 'files:createFile':
        return fileService.create(args)
      case 'files:rename':
        return fileService.rename(args)
      case 'files:remove':
        return fileService.remove(args)
      case 'files:move':
        return fileService.move(args)
      case 'files:moveFiles':
        return fileService.moveFiles(args)
      case 'files:toggleStar':
        return fileService.toggleStar(args)

      // Clocks
      case 'clocks:add':
        return clockService.add(args)
      case 'clocks:remove':
        return clockService.remove(args)
      case 'clocks:update':
        return clockService.update(args)

      // Dashboard
      case 'dashboard:toggleWidgetVisibility':
        return dashboardService.toggleWidgetVisibility(args)
      case 'dashboard:setLayout':
        return dashboardService.setLayout(args)

      // Settings
      case 'settings:update':
        return settingService.update(args)

      // 2FA
      case 'twoFactor:create':
        return twoFactorService.create(args)
      case 'twoFactor:update':
        return twoFactorService.update(args)
      case 'twoFactor:remove':
        return twoFactorService.remove(args)

      default:
        throw new Error(`Unknown mutation path: ${path}`)
    }
}
