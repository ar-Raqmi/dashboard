'use client'

import { useEffect, useRef } from 'react'
import { useUi, type UiCommandName } from '@/lib/ui'

/**
 * Run `handler` when the shell fires `name` (e.g. the header's "New event" button).
 * A command already pending when the page mounts is ignored so stale clicks never replay.
 */
export function useUiCommand(name: UiCommandName, handler: () => void) {
  const command = useUi((s) => s.command)
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const lastSeen = useRef<number>(useUi.getState().command?.id ?? 0)

  useEffect(() => {
    if (!command || command.id === lastSeen.current) return
    lastSeen.current = command.id
    if (command.name === name) handlerRef.current()
  }, [command, name])
}
