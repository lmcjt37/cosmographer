import { Cosmograph } from "@cosmograph/react/cosmograph"
import { ComponentProps } from "react"

export type PointRecord = Record<string, unknown>
export type LinkRecord = Record<string, unknown>

type CosmographProps = ComponentProps<typeof Cosmograph>
export type GraphConfig = Omit<CosmographProps, 'points' | 'links'>

export type GraphState = {
  points: PointRecord[]
  links: LinkRecord[]
  config: GraphConfig
  pointIdKey: string
  pointIndexKey: string
  linkSourceKey: string
  linkTargetKey: string
  pointByIndex: Map<number, PointRecord>
  relatedPointIndicesByIndex: Map<number, number[]>
  relatedLinksByIndex: Map<number, LinkRecord[]>
}

export type SelectedPointState = {
  index: number
  point: PointRecord
  relatedPointIndices: number[]
  relatedLinks: LinkRecord[]
}