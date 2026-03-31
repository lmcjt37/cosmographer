import { useEffect, useRef, useState } from 'react'
import { Cosmograph } from '@cosmograph/react/cosmograph.js'
import type { CosmographRef } from '@cosmograph/react/cosmograph.js'
import { GraphConfig, GraphState, LinkRecord, PointRecord, SelectedPointState } from './types'
import { fetchJson, fetchOptionalJson } from './fetch'
import { getConfigKey, getNumberField, formatMetadataValue, getMetadataEntries } from './helper'

const ZOOM_DURATION_MS = 700
const ZOOM_SCALE = 3.2

function buildGraphState(points: PointRecord[], links: LinkRecord[], config: GraphConfig): GraphState {
  const pointIdKey = getConfigKey(config.pointIdBy, 'id')
  const pointIndexKey = getConfigKey(config.pointIndexBy, 'index')
  const linkSourceKey = getConfigKey(config.linkSourceIndexBy, getConfigKey(config.linkSourceBy, 'source'))
  const linkTargetKey = getConfigKey(config.linkTargetIndexBy, getConfigKey(config.linkTargetBy, 'target'))

  const pointByIndex = new Map<number, PointRecord>()
  const pointIndexById = new Map<unknown, number>()
  const relatedPointIndicesByIndex = new Map<number, Set<number>>()
  const relatedLinksByIndex = new Map<number, LinkRecord[]>()

  for (const point of points) {
    const pointIndex = getNumberField(point, pointIndexKey)

    if (pointIndex === undefined) {
      continue
    }

    pointByIndex.set(pointIndex, point)
    relatedPointIndicesByIndex.set(pointIndex, new Set())
    relatedLinksByIndex.set(pointIndex, [])

    const pointId = point[pointIdKey]
    if (pointId !== undefined) {
      pointIndexById.set(pointId, pointIndex)
    }
  }

  for (const link of links) {
    const sourceIndex =
      getNumberField(link, linkSourceKey) ?? pointIndexById.get(link[getConfigKey(config.linkSourceBy, 'source')])
    const targetIndex =
      getNumberField(link, linkTargetKey) ?? pointIndexById.get(link[getConfigKey(config.linkTargetBy, 'target')])

    if (typeof sourceIndex !== 'number' || typeof targetIndex !== 'number') {
      continue
    }

    relatedPointIndicesByIndex.get(sourceIndex)?.add(targetIndex)
    relatedPointIndicesByIndex.get(targetIndex)?.add(sourceIndex)
    relatedLinksByIndex.get(sourceIndex)?.push(link)
    relatedLinksByIndex.get(targetIndex)?.push(link)
  }

  return {
    points,
    links,
    config,
    pointIdKey,
    pointIndexKey,
    linkSourceKey,
    linkTargetKey,
    pointByIndex,
    relatedPointIndicesByIndex: new Map(
      Array.from(relatedPointIndicesByIndex.entries(), ([pointIndex, indices]) => [pointIndex, Array.from(indices)]),
    ),
    relatedLinksByIndex,
  }
}

export default function App() {
  const graphRef = useRef<CosmographRef>(undefined)
  const [graph, setGraph] = useState<GraphState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<SelectedPointState | null>(null)

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

        setGraph(
          buildGraphState(points, links, {
            ...indexedConfig,
            ...(layoutConfig ?? {}),
          }),
        )
        setSelectedPoint(null)
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

  const handlePointSelection = (pointIndex?: number) => {
    if (!graph || pointIndex === undefined) {
      setSelectedPoint(null)
      return
    }

    const point = graph.pointByIndex.get(pointIndex)

    if (!point) {
      setSelectedPoint(null)
      return
    }

    const relatedPointIndices = graph.relatedPointIndicesByIndex.get(pointIndex) ?? []
    const relatedLinks = graph.relatedLinksByIndex.get(pointIndex) ?? []

    graphRef.current?.zoomToPoint(pointIndex, ZOOM_DURATION_MS, ZOOM_SCALE, false)
    graphRef.current?.setFocusedPoint(pointIndex)

    setSelectedPoint({
      index: pointIndex,
      point,
      relatedPointIndices,
      relatedLinks,
    })
  }

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
          <div className="panel-stack">
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

            {selectedPoint ? (
              <aside className="detail-panel" aria-label="Selected point details">
                <div className="detail-header">
                  <p className="detail-kicker">Selected Point</p>
                  <h2>{formatMetadataValue(selectedPoint.point.label ?? selectedPoint.point[graph.pointIdKey] ?? 'Node')}</h2>
                </div>

                <div className="detail-summary">
                  <div className="detail-stat">
                    <span className="debug-label">Related points</span>
                    <strong className="debug-value">{selectedPoint.relatedPointIndices.length}</strong>
                  </div>
                  <div className="detail-stat">
                    <span className="debug-label">Related links</span>
                    <strong className="debug-value">{selectedPoint.relatedLinks.length}</strong>
                  </div>
                </div>

                <dl className="metadata-list">
                  {getMetadataEntries(selectedPoint.point).map(([key, value]) => (
                    <div className="metadata-row" key={key}>
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="status-panel">
            <h2>Could not load graph data</h2>
            <p>{error}</p>
          </div>
        ) : graph ? (
          <Cosmograph
            ref={graphRef}
            className="graph-canvas"
            style={{ width: '100%', height: '100%' }}
            points={graph.points}
            links={graph.links}
            {...graph.config}
            fitViewOnInit
            fitViewDelay={1500}
            selectPointOnClick
            onClick={(pointIndex) => {
              handlePointSelection(pointIndex)
            }}
            onLabelClick={(pointIndex) => {
              handlePointSelection(pointIndex)
            }}
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
