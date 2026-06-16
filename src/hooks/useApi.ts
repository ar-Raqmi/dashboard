import { useState, useEffect, useCallback } from 'react'
import { ApiClient } from '@/lib/api-client'

function getPathString(apiEndpoint: any): string {
  if (!apiEndpoint) return ''
  if (typeof apiEndpoint === 'string') return apiEndpoint
  if (typeof apiEndpoint === 'object' || typeof apiEndpoint === 'function') {
    if ('path' in apiEndpoint && typeof apiEndpoint.path === 'string') {
      return apiEndpoint.path
    }
  }
  return String(apiEndpoint)
}

// Simple global event hub for manual sync trigger
const syncListeners = new Set<() => void>()
export function triggerGlobalSync() {
  syncListeners.forEach(listener => listener())
}

export function useQuery(apiEndpoint: any, args: any, options?: { pollInterval?: number }) {
  const [data, setData] = useState<any>(undefined)
  const [syncKey, setSyncKey] = useState(0)
  const argsKey = JSON.stringify(args)
  const path = getPathString(apiEndpoint)

  useEffect(() => {
    const handleSync = () => {
      setSyncKey(prev => prev + 1)
    }
    syncListeners.add(handleSync)
    return () => {
      syncListeners.delete(handleSync)
    }
  }, [])

  useEffect(() => {
    if (args === 'skip' || !path) {
      setData(undefined)
      return
    }

    let active = true

    const fetchData = async () => {
      try {
        const val = await ApiClient.query(path, args)
        if (active) {
          setData(val)
        }
      } catch (err) {
        console.error(`useQuery error for ${path}:`, err)
        if (active) setData(null)
      }
    }

    fetchData()

    if (options?.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(fetchData, options.pollInterval)
      return () => {
        active = false
        clearInterval(interval)
      }
    }

    return () => {
      active = false
    }
  }, [path, argsKey, syncKey, options?.pollInterval])

  return data
}

export function useMutation(apiEndpoint: any) {
  const path = getPathString(apiEndpoint)

  return useCallback(async (args: any) => {
    return ApiClient.mutate(path, args)
  }, [path])
}

export function useAction(apiEndpoint: any) {
  const path = getPathString(apiEndpoint)

  return useCallback(async (args: any) => {
    return ApiClient.query(path, args)
  }, [path])
}
