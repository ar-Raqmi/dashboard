'use client'

import React, { useEffect } from 'react'
import { toast } from 'sonner'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration)

            // Check for updates at intervals
            setInterval(() => {
              registration.update()
            }, 60 * 60 * 1000) // Check every hour

            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      // New content is available, show toast
                      showUpdateToast(registration)
                    }
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('SW registration failed:', error)
          })
      })

      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })
    }
  }, [])

  const showUpdateToast = (registration: ServiceWorkerRegistration) => {
    toast.info('Update Available', {
      description: 'A new version of ar-Raqmi is available. Update now to see the latest changes.',
      duration: Infinity,
      action: {
        label: 'Update',
        onClick: () => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          }
        },
      },
    })
  }

  return <>{children}</>
}
