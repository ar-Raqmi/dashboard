/* ------------------------------------------------------------------ *
 * Database models — one interface per table in db/migrations.     *
 * DateTime columns arrive as ISO strings; Booleans as booleans.      *
 * ------------------------------------------------------------------ */

import type { BrandIconSetting } from '@/features/brand/icons';

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
  id: string; userId: string; profileName: string; profilePicture: string | null; appTitle: string; brandName: string; brandIcon: BrandIconSetting; dateFormat: string; timezone: string; appLogo: string | null;
  iconBackgroundColor: string; showSeconds: boolean;
  clipboardText: string; backgroundType: string; backgroundColor: string; backgroundGradient: string; backgroundImage: string;
  backgroundOpacity: number;
  prayerProvider: 'jakim' | 'aladhan'; jakimZone: string; prayerPlace: 'city' | 'coords'; aladhanCity: string; aladhanCountry: string;
  prayerLatitude: number | null; prayerLongitude: number | null; prayerPlaceName: string; prayerMethod: number; prayerSchool: 0 | 1;
  hijriVisible: boolean; hijriMethod: HijriMethod; hijriRollover: 'midnight' | 'maghrib'; hijriOffset: number;
}
export type HijriMethod = 'jakim' | 'UAQ' | 'HJCoSA' | 'DIYANET' | 'MATHEMATICAL';

/* ------------------------------------------------------------- *
 * API views — what the endpoints return (user-scoped, derived). *
 * ------------------------------------------------------------- */

export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export interface TaskView extends Omit<Task, 'userId' | 'priority' | 'status'> {
  priority: Priority; status: TaskStatus; isRecurring: boolean; occurrenceDate: string | null; description: string;
}
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
  width: number | null; height: number | null; duration: number | null; thumbnail: boolean;
  starred: boolean; storageSource: string | null; available: boolean; createdAt: string; updatedAt: string;
}
export interface TwoFactorAccount { id: string; accountName: string; category: string; icon: string | null; token: string | null; nextToken: string | null; undecryptable?: boolean }
export interface TwoFactorList { locked: boolean; period: number; generatedAt: number; accounts: TwoFactorAccount[] }
export interface HijriDate { day: number; month: string; year: number }
export interface PrayerDay {
  /** The calendar date at the prayer location, which may differ from the device's date while travelling. */
  date: string; source: string; location: string; timezone: string;
  times: { fajr: string; syuruk: string; dhuhr: string; asr: string; maghrib: string; isha: string };
  /** Today's Hijri date and tomorrow's (for switching at Maghrib); null when its source could not be reached. */
  hijri: { today: HijriDate; tomorrow: HijriDate; source: string } | null;
  hijriError?: string;
}
export interface DailyVerse { arabic: string; translation: string; reference: string; url: string }
export interface DailyHadith { translation: string; arabic: string | null; source: string; url: string }
