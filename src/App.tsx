import { useEffect, useState } from 'react'
import { Cosmograph } from '@cosmograph/react/cosmograph.js'
import type { ComponentProps } from 'react'

type PointRecord = Record<string, unknown>
type LinkRecord = Record<string, unknown>
type CosmographProps = ComponentProps<typeof Cosmograph>
type GraphConfig = Omit<CosmographProps, 'points' | 'links'>

type GraphState = {
  points: PointRecord[]
  links: LinkRecord[]
  config: GraphConfig
}

const DATA_BASE = '/data'

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${DATA_BASE}/${path}`)

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

async function fetchOptionalJson<T>(path: string): Promise<T | null> {
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

export default function App() {
  const [graph, setGraph] = useState<GraphState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadGraph = async () => {
      try {
        const [points, links, indexedConfig, layoutConfig] = await Promise.all([
          fetchJson<PointRecord[]>('points.json'),
          fetchJson<LinkRecord[]>('links.json'),
          fetchJson<GraphConfig>('config.json'),
          fetchOptionalJson<GraphConfig>('layout.json'),
        ])

        if (cancelled) {
          return
        }

        setGraph({
          points,
          links,
          config: {
            ...indexedConfig,
            ...(layoutConfig ?? {}),
          },
        })
      } catch (loadError) {
        if (cancelled) {
          return
        }

        const message = loadError instanceof Error ? loadError.message : 'Unknown graph loading error'
        setError(message)
      }
    }

    void loadGraph()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Cosmograph</p>
          <h1>Local Graph Viewer</h1>
        </div>
        <p className="app-copy">
          Drop fresh indexed JSON into <code>data/</code>, restart the dev server if needed, and reload the page.
        </p>
      </header>

      <section className="graph-panel">
        {graph ? (
          <aside className="debug-panel" aria-label="Graph statistics">
            <div className="debug-stat">
              <span className="debug-label">Points</span>
              <strong className="debug-value">{graph.points.length}</strong>
            </div>
            <div className="debug-stat">
              <span className="debug-label">Links</span>
              <strong className="debug-value">{graph.links.length}</strong>
            </div>
          </aside>
        ) : null}

        {error ? (
          <div className="status-panel">
            <h2>Could not load graph data</h2>
            <p>{error}</p>
          </div>
        ) : graph ? (
          <Cosmograph
            className="graph-canvas"
            style={{ width: '100%', height: '100%' }}
            points={graph.points}
            links={graph.links}
            fitViewOnInit
            fitViewDelay={1500}
            {...graph.config}
          />
        ) : (
          <div className="status-panel">
            <h2>Loading graph data</h2>
            <p>Fetching indexed points, links, and configuration from the root data directory.</p>
          </div>
        )}
      </section>
    </main>
  )
}
