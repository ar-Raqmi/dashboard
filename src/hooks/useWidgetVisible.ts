'use client'

import { useAppStore, type WidgetType } from '@/lib/store'

/**
 * Whether a dashboard section is switched on in Settings. Defaults to visible until the
 * widget list has synced, so nothing flickers away on first load.
 */
export function useWidgetVisible(type: WidgetType): boolean {
  return useAppStore((s) => s.widgets.find((w) => w.type === type)?.visible ?? true)
}
