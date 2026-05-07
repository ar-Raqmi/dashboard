'use client'

import { ConvexReactClient } from 'convex/react'
import { api } from '../../convex/_generated/api'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || ''

// Singleton Convex client - used by both ConvexProvider and direct mutation calls
let convexClient: ConvexReactClient | null = null

export function getConvexClient(): ConvexReactClient | null {
  if (!convexUrl) return null
  if (!convexClient) {
    convexClient = new ConvexReactClient(convexUrl)
  }
  return convexClient
}

export function isConvexConfigured(): boolean {
  return !!convexUrl
}

export { convexUrl, api }
