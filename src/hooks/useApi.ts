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

export function useQuery(apiEndpoint: any, args: any) {
  const [data, setData] = useState<any>(undefined)
  const argsKey = JSON.stringify(args)
  const path = getPathString(apiEndpoint)

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

    // 10-second polling for live-updating dashboard feel
    const interval = setInterval(fetchData, 10000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [path, argsKey])

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
