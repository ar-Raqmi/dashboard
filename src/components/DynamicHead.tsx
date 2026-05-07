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
  
  const [faviconUrl, setFaviconUrl] = useState<string>('/logo.svg')
  const [manifestUrl, setManifestUrl] = useState<string>('')
  const manifestBlobRef = useRef<string | null>(null)

  // 1. Generate composited favicon (logo on colored background) + manifest
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
            finalIconUrl = canvas.toDataURL('image/png')
          } catch (err) {
            console.warn('Failed to draw logo to canvas, falling back to initial:', err)
            ctx.fillStyle = '#ffffff'
            ctx.font = `bold ${size * 0.4}px sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(appTitle?.charAt(0)?.toUpperCase() || 'A', size / 2, size / 2)
            finalIconUrl = canvas.toDataURL('image/png')
          }
        } else {
          finalIconUrl = appLogo
        }
      }

      if (cancelled) return
      setFaviconUrl(finalIconUrl)

      // Update PWA manifest
      if (manifestBlobRef.current) {
        URL.revokeObjectURL(manifestBlobRef.current)
        manifestBlobRef.current = null
      }

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
            type: finalIconUrl.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['productivity', 'utilities'],
        lang: 'en',
        dir: 'ltr',
      }

      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      manifestBlobRef.current = url
      setManifestUrl(url)
    }

    updateAll()

    return () => {
      cancelled = true
    }
  }, [appTitle, appLogo, iconBackgroundColor])

  // 2. Direct DOM manipulation to ensure updates are applied
  // This bypasses potential conflicts with Next.js static metadata
  useEffect(() => {
    // Update document title
    document.title = appTitle || 'ar-Raqmi Database'

    // Update Favicon
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = faviconUrl.startsWith('data:image/svg') || faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
    link.href = faviconUrl

    // Update Apple Touch Icon
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
    if (!appleLink) {
      appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      document.head.appendChild(appleLink)
    }
    appleLink.href = faviconUrl

    // Update Manifest
    if (manifestUrl) {
      let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement
      if (!manifestLink) {
        manifestLink = document.createElement('link')
        manifestLink.rel = 'manifest'
        document.head.appendChild(manifestLink)
      }
      manifestLink.href = manifestUrl
    }
  }, [appTitle, faviconUrl, manifestUrl])

  // Cleanup manifest blob on unmount
  useEffect(() => {
    return () => {
      if (manifestBlobRef.current) {
        URL.revokeObjectURL(manifestBlobRef.current)
      }
    }
  }, [])

  return null // We handle everything via side effects for maximum reliability
}


