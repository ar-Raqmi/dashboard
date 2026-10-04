'use client'

import { useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { useToastStore } from '@/lib/toast'

export default function ToastHost() {
  const current = useToastStore((s) => s.current)
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    if (!current || current.duration === 0) return
    const timer = window.setTimeout(dismiss, current.duration)
    return () => window.clearTimeout(timer)
  }, [current, dismiss])

  return (
    <div className={`toast ${current ? 'visible' : ''} ${current ? `toast-${current.tone}` : ''}`} role="status" aria-live="polite">
      {current && (
        <>
          <Icon name={current.tone === 'error' ? 'info' : 'check'} size={16} />
          <span className="toast-body">
            <span>{current.message}</span>
            {current.detail && <small>{current.detail}</small>}
          </span>
          {current.action && (
            <button
              className="toast-action"
              onClick={() => {
                current.action?.onClick()
                dismiss()
              }}
            >
              {current.action.label}
            </button>
          )}
          <button className="icon-button compact" aria-label="Dismiss notification" onClick={dismiss}>
            <Icon name="close" size={13} />
          </button>
        </>
      )}
    </div>
  )
}
