import { create } from 'zustand'

export type ToastTone = 'ok' | 'error' | 'info'

export interface ToastOptions {
  tone?: ToastTone
  detail?: string
  /** Milliseconds; 0 keeps the toast until dismissed. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

export interface ToastItem extends Required<Pick<ToastOptions, 'tone' | 'duration'>> {
  id: number
  message: string
  detail?: string
  action?: ToastOptions['action']
}

interface ToastState {
  current: ToastItem | null
  show: (message: string, options?: ToastOptions) => void
  dismiss: () => void
}

let nextId = 1

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (message, options = {}) =>
    set({
      current: {
        id: nextId++,
        message,
        detail: options.detail,
        action: options.action,
        tone: options.tone ?? 'ok',
        duration: options.duration ?? 3500,
      },
    }),
  dismiss: () => set({ current: null }),
}))

/** Show a toast from anywhere (components, stores, event handlers). */
export const notify = (message: string, options?: ToastOptions) =>
  useToastStore.getState().show(message, options)

export const notifyError = (message: string, detail?: string) =>
  useToastStore.getState().show(message, { tone: 'error', detail, duration: 6000 })
