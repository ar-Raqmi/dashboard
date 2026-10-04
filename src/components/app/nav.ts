import type { IconName } from '@/components/ui/Icon'
import type { ActivePage } from '@/lib/store'

export interface NavItem {
  page: ActivePage
  label: string
  icon: IconName
}

export const WORKSPACE_NAV: NavItem[] = [
  { page: 'dashboard', label: 'Overview', icon: 'overview' },
  { page: 'tasks', label: 'Tasks', icon: 'tasks' },
  { page: 'calendar', label: 'Calendar', icon: 'calendar' },
  { page: 'notes', label: 'Notes', icon: 'notes' },
  { page: 'files', label: 'Files', icon: 'files' },
]

export const PERSONAL_NAV: NavItem[] = [
  { page: 'goals', label: 'Goals', icon: 'flag' },
  { page: 'spiritual', label: 'Spiritual', icon: 'book' },
  { page: 'twoFactor', label: 'Authenticator', icon: 'shield' },
]

export const SETTINGS_NAV: NavItem = { page: 'settings', label: 'Settings', icon: 'settings' }

export const PAGE_LABEL: Record<ActivePage, string> = {
  dashboard: 'Overview',
  tasks: 'Tasks',
  calendar: 'Calendar',
  notes: 'Notes',
  files: 'Files',
  goals: 'Goals',
  spiritual: 'Spiritual',
  twoFactor: 'Authenticator',
  settings: 'Settings',
}

/** Rotating accent per item so goals read as distinct without storing a colour. */
export const ACCENTS = ['var(--green)', 'var(--aqua)', 'var(--blue)', 'var(--purple)', 'var(--orange)', 'var(--yellow)', 'var(--red)']
export const accentAt = (index: number) => ACCENTS[index % ACCENTS.length]
