'use client'

import { useEffect, useRef } from 'react'
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
  const manifestBlobRef = useRef<string | null>(null)

  // 1. Update document.title
  useEffect(() => {
    if (appTitle) {
      document.title = appTitle
    }
  }, [appTitle])

  // 2. Generate composited favicon (logo on colored background) + update links + manifest
  useEffect(() => {
    let cancelled = false

    const updateAll = async () => {
      // Generate favicon
      let finalIconUrl: string = '/logo.svg'

      if (appLogo) {
        const size = 192
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')

        if (ctx) {
          // Draw rounded background
          ctx.fillStyle = iconBackgroundColor || '#A5D6A7'
          const r = size * 0.2
          ctx.beginPath()
          // roundRect with fallback
          if (ctx.roundRect) {
            ctx.roundRect(0, 0, size, size, r)
          } else {
            ctx.moveTo(r, 0)
            ctx.lineTo(size - r, 0)
            ctx.quadraticCurveTo(size, 0, size, r)
            ctx.lineTo(size, size - r)
            ctx.quadraticCurveTo(size, size, size - r, size)
            ctx.lineTo(r, size)
            ctx.quadraticCurveTo(0, size, 0, size - r)
            ctx.lineTo(0, r)
            ctx.quadraticCurveTo(0, 0, r, 0)
          }
          ctx.closePath()
          ctx.fill()

          // Draw logo image on top
          try {
            const img = new Image()
            if (!appLogo.startsWith('blob:') && !appLogo.startsWith('data:')) {
              img.crossOrigin = 'anonymous'
            }
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve()
              img.onerror = () => reject(new Error('Failed to load'))
              img.src = appLogo
            })
            const padding = size * 0.12
            const imgSize = size - padding * 2
            ctx.drawImage(img, padding, padding, imgSize, imgSize)
          } catch {
            ctx.fillStyle = '#ffffff'
            ctx.font = `bold ${size * 0.4}px sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(appTitle?.charAt(0)?.toUpperCase() || 'A', size / 2, size / 2)
          }

          finalIconUrl = canvas.toDataURL('image/png')
        } else {
          finalIconUrl = appLogo
        }
      }

      if (cancelled) return

      // Update favicon <link> elements
      document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((el) => el.remove())
      const iconLink = document.createElement('link')
      iconLink.rel = 'icon'
      iconLink.type = finalIconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
      iconLink.href = finalIconUrl
      document.head.appendChild(iconLink)

      // Update apple-touch-icon
      document.querySelectorAll('link[rel="apple-touch-icon"]').forEach((el) => el.remove())
      const appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      appleLink.href = finalIconUrl
      document.head.appendChild(appleLink)

      // Update PWA manifest
      if (manifestBlobRef.current) {
        URL.revokeObjectURL(manifestBlobRef.current)
        manifestBlobRef.current = null
      }
      document.querySelector('link[rel="manifest"]')?.remove()

      const shortName = appTitle?.split(' ').slice(0, 2).join('') || 'ar-Raqmi'
      const bgColor = iconBackgroundColor || '#A5D6A7'
      const manifest = {
        name: appTitle || 'ar-Raqmi Database',
        short_name: shortName,
        description: 'Premium PWA Personal Dashboard — Material 3 Expressive Design',
        start_url: '/',
        display: 'standalone' as const,
        background_color: bgColor,
        theme_color: bgColor,
        orientation: 'portrait-primary',
        icons: [
          {
            src: finalIconUrl,
            sizes: 'any',
            type: finalIconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['productivity', 'utilities'],
        lang: 'en',
        dir: 'ltr',
      }

      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
      const manifestUrl = URL.createObjectURL(blob)
      manifestBlobRef.current = manifestUrl

      const manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      manifestLink.href = manifestUrl
      document.head.appendChild(manifestLink)
    }

    updateAll()

    return () => {
      cancelled = true
    }
  }, [appTitle, appLogo, iconBackgroundColor])

  // Cleanup manifest blob on unmount
  useEffect(() => {
    return () => {
      if (manifestBlobRef.current) {
        URL.revokeObjectURL(manifestBlobRef.current)
      }
    }
  }, [])

  return null // This component renders nothing
}
