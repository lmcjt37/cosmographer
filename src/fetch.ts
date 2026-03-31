const DATA_BASE = '/data'

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${DATA_BASE}/${path}`)

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

export async function fetchOptionalJson<T>(path: string): Promise<T | null> {
  const response = await fetch(`${DATA_BASE}/${path}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    return null
  }

  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}