'use client'

import React, { useEffect } from 'react'
import { toast } from 'sonner'

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Handle Install Prompt (Android/Chrome)
      const handleBeforeInstallPrompt = (e: any) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault()
        // Stash the event so it can be triggered later.
        const deferredPrompt = e
        
        // Show a "Install" toast or banner
        toast.info('Install ar-Raqmi', {
          description: 'Add this app to your home screen for a better experience.',
          duration: 10000,
          action: {
            label: 'Install',
            onClick: () => {
              deferredPrompt.prompt()
              deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                  console.log('User accepted the install prompt')
                }
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
              })
            },
          },
        })
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      // 1.1 Handle iOS Install Guidance
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      
      if (isIOS && !isStandalone) {
        // Show iOS guidance toast after a short delay
        setTimeout(() => {
          toast.info('Install on iOS', {
            description: 'To install ar-Raqmi, tap the Share icon and then "Add to Home Screen".',
            duration: 10000,
          })
        }, 5000)
      }

      // 2. Handle Service Worker
      if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
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

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
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
