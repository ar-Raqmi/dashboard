'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Icon from '@/components/ui/Icon'

interface ModalProps {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
}

const FOCUSABLE = 'button:not(:disabled), input, textarea, select, a[href], [tabindex="0"]'

/** Dialog with a focus trap, Escape-to-close, scroll lock and focus restore. */
export default function Modal({ title, children, onClose, className = '' }: ModalProps) {
  const container = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = window.setTimeout(() => {
      const root = container.current
      const target =
        root?.querySelector<HTMLElement>('input:not([type=hidden]), textarea, select') ??
        root?.querySelector<HTMLElement>('button')
      target?.focus()
    }, 40)

    const onKey = (e: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[role="dialog"]')
      if (dialogs[dialogs.length - 1] !== container.current) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
      }
      if (e.key !== 'Tab') return
      const items = Array.from(container.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null,
      )
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = oldOverflow
      previous?.focus()
    }
  }, [])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div ref={container} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
