'use client'

export function getConvexClient() {
  return null
}

export function isConvexConfigured(): boolean {
  return false
}

export const convexUrl = ''

// Helper to recursively create a path proxy
function createProxy(parts: string[]): any {
  const fn = () => {}
  // Set the path property on the function object itself
  Object.defineProperty(fn, 'path', {
    get() {
      return parts.join(':')
    }
  })
  
  return new Proxy(fn, {
    get(target, prop) {
      if (prop === 'path') {
        return parts.join(':')
      }
      // Handle symbol checking or built-in properties
      if (typeof prop === 'symbol' || prop === 'then' || prop === 'prototype') {
        return undefined
      }
      return createProxy([...parts, String(prop)])
    }
  })
}

// Global API builder proxy
export const api = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'symbol' || prop === 'then' || prop === 'prototype') {
      return undefined
    }
    return createProxy([String(prop)])
  }
}) as any
