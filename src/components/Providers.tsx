'use client'

import React from 'react'
import { ConvexProvider } from 'convex/react'
import { AuthProvider } from '@/hooks/useAuth'
import { getConvexClient } from '@/lib/convex-client'

export function Providers({ children }: { children: React.ReactNode }) {
  const client = getConvexClient()

  return (
    <AuthProvider>
      {client ? (
        <ConvexProvider client={client}>
          {children}
        </ConvexProvider>
      ) : (
        children
      )}
    </AuthProvider>
  )
}
