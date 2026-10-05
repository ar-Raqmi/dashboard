import type { IconName } from '@/components/Icon';

export type Page = 'Overview' | 'Tasks' | 'Calendar' | 'Notes' | 'Files' | 'Spiritual' | 'Goals' | 'Authenticator' | 'Settings';
export interface NavItem { name: Page; icon: IconName }

/** `Goals` is the internal page id; users see it as Projects. */
export const pageLabel = (page: Page) => (page === 'Goals' ? 'Projects' : page);

export const workspaceNav: NavItem[] = [
  { name: 'Overview', icon: 'overview' }, { name: 'Tasks', icon: 'tasks' }, { name: 'Calendar', icon: 'calendar' },
  { name: 'Notes', icon: 'notes' }, { name: 'Files', icon: 'files' }, { name: 'Goals', icon: 'flag' },
];
export const personalNav: NavItem[] = [{ name: 'Spiritual', icon: 'book' }, { name: 'Authenticator', icon: 'shield' }];
export const settingsNav: NavItem = { name: 'Settings', icon: 'settings' };

export const pageDescriptions: Record<Page, string> = {
  Overview: 'A little clarity for the day ahead.',
  Tasks: 'Your priorities, all in one place.',
  Calendar: 'Your commitments, with room to breathe.',
  Notes: 'A place for the thoughts worth keeping.',
  Files: 'The documents behind your work.',
  Spiritual: 'Stay grounded in your daily rhythm.',
  Goals: 'Every project, one milestone at a time.',
  Authenticator: 'A quiet place for your one-time codes.',
  Settings: 'Make the workspace your own.',
};
