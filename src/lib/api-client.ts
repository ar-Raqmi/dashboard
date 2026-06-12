'use client'

export class ApiClient {
  private static normalizeValue(val: any): any {
    if (Array.isArray(val)) {
      return val.map((item: any) => {
        if (item && typeof item === 'object' && 'id' in item && !('_id' in item)) {
          return { ...item, _id: item.id }
        }
        return item
      })
    } else if (val && typeof val === 'object' && 'id' in val && !('_id' in val)) {
      return { ...val, _id: val.id }
    }
    return val
  }

  static async query(path: string, args: any) {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args }),
    })
    if (!res.ok) {
      let errorMsg = 'Query failed'
      try {
        const json = await res.json()
        errorMsg = json.error || errorMsg
      } catch {
        try {
          const text = await res.text()
          if (text.includes('Worker threw exception') || text.includes('1101')) {
            errorMsg = 'Worker threw exception (Error 1101). D1 database binding "DB" is likely missing in Pages settings.'
          } else {
            errorMsg = `HTTP Error ${res.status}: ${res.statusText || text.substring(0, 100)}`
          }
        } catch {
          errorMsg = `HTTP Error ${res.status}`
        }
      }
      throw new Error(errorMsg)
    }
    const json = await res.json()
    return this.normalizeValue(json.value)
  }

  static async mutate(path: string, args: any) {
    const res = await fetch('/api/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args }),
    })
    if (!res.ok) {
      let errorMsg = 'Mutation failed'
      try {
        const json = await res.json()
        errorMsg = json.error || errorMsg
      } catch {
        try {
          const text = await res.text()
          if (text.includes('Worker threw exception') || text.includes('1101')) {
            errorMsg = 'Worker threw exception (Error 1101). D1 database binding "DB" is likely missing in Pages settings.'
          } else {
            errorMsg = `HTTP Error ${res.status}: ${res.statusText || text.substring(0, 100)}`
          }
        } catch {
          errorMsg = `HTTP Error ${res.status}`
        }
      }
      throw new Error(errorMsg)
    }
    const json = await res.json()
    return this.normalizeValue(json.value)
  }
}

// Helper to recursively create a path proxy
function createProxy(parts: string[]): any {
  const fn = () => {}
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
