import type { ActivePage } from '@/lib/store'

export const PAGE_DESCRIPTION: Record<ActivePage, string> = {
  dashboard: 'A calm view of what needs you today.',
  tasks: 'Everything on your plate, including what repeats.',
  calendar: 'Your days at a glance, one date at a time.',
  notes: 'Thoughts worth keeping, one page at a time.',
  files: 'Your documents, images and media, kept safe.',
  goals: 'Long-term goals, broken into milestones you can finish.',
  spiritual: 'Prayer times, the verse of the day and a hadith.',
  twoFactor: 'Time-based sign-in codes for your accounts.',
  settings: 'Make the dashboard fit the way you work.',
}
