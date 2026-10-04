'use client'

import { useCallback } from 'react'
import { useAppStore, type ActivePage } from '@/lib/store'
import { useUi } from '@/lib/ui'

/** Single entry point for moving between pages: closes transient UI and resets scroll. */
export function useNavigate() {
  const setActivePage = useAppStore((s) => s.setActivePage)
  const selectTask = useUi((s) => s.selectTask)
  const setMobileNav = useUi((s) => s.setMobileNav)

  return useCallback(
    (page: ActivePage) => {
      setActivePage(page)
      selectTask(null)
      setMobileNav(false)
      document.getElementById('main-content')?.scrollTo({ top: 0 })
    },
    [setActivePage, selectTask, setMobileNav],
  )
}
