'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'

/**
 * Client-side component that dynamically updates:
 * - document.title from appTitle store
 * - Favicon <link> elements from appLogo store (with iconBackgroundColor compositing)
 * - PWA manifest <link> with dynamic title/logo
 */
export default function DynamicHead() {
  const appTitle = useAppStore((s) => s.appTitle)
  const appLogo = useAppStore((s) => s.appLogo)
  const iconBackgroundColor = useAppStore((s) => s.iconBackgroundColor)
  
  const defaultIcon = 'https://cdn-icons-png.flaticon.com/512/8323/8323511.png'
  const [faviconUrl, setFaviconUrl] = useState<string>(defaultIcon)

  // 1. Determine favicon URL
  useEffect(() => {
    const logoToUse = appLogo || defaultIcon
    setFaviconUrl(logoToUse)
  }, [appLogo])

  // 2. Direct DOM manipulation for Title and Icons
  useEffect(() => {
    document.title = appTitle || 'ar-Raqmi Database'

    // Update Favicon
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    
    link.href = faviconUrl

    // Update Apple Touch Icon
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
    if (!appleLink) {
      appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      document.head.appendChild(appleLink)
    }
    appleLink.href = faviconUrl

    // Ensure manifest is PRESENT
    let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement
    if (!manifestLink) {
      manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      document.head.appendChild(manifestLink)
    }
    manifestLink.href = '/manifest.json'
  }, [appTitle, faviconUrl])

  return null
}


