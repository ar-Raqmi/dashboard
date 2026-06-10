import { useState, useEffect } from 'react'

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
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path, args }),
        })
        if (!res.ok) throw new Error('Query failed')
        const json = await res.json()
        if (active) {
          let val = json.value
          if (Array.isArray(val)) {
            val = val.map((item: any) => {
              if (item && typeof item === 'object' && 'id' in item && !('_id' in item)) {
                return { ...item, _id: item.id }
              }
              return item
            })
          }
          setData(val)
        }
      } catch (err) {
        console.error(`useQuery error for ${path}:`, err)
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

  return async (args: any) => {
    const res = await fetch('/api/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args }),
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error || 'Mutation failed')
    }
    return json.value
  }
}

export function useAction(apiEndpoint: any) {
  const path = getPathString(apiEndpoint)

  return async (args: any) => {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, args }),
    })
    const json = await res.json()
    if (!res.ok) {
      throw new Error(json.error || 'Action failed')
    }
    return json.value
  }
}
