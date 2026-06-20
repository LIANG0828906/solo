export enum TagCategory {
  WRITING = 'writing',
  DESIGN = 'design',
  CODING = 'coding',
  OTHER = 'other'
}

export const TagLabelMap: Record<TagCategory, string> = {
  [TagCategory.WRITING]: '写作',
  [TagCategory.DESIGN]: '设计',
  [TagCategory.CODING]: '编程',
  [TagCategory.OTHER]: '其他'
}

export type TagType = TagCategory

export interface Inspiration {
  id: string
  title: string
  description: string
  tags: TagType[]
  keywords: string[]
  createdAt: number
  order: number
  isArchived: boolean
  isRemoving?: boolean
}

export interface PlanStep {
  id: string
  title: string
  description: string
  estimatedMinutes: number
  prerequisites: string[]
  inspirationIds: string[]
  order: number
}

export interface GeneratedPlan {
  id: string
  title: string
  description: string
  steps: PlanStep[]
  totalDuration: number
  createdAt: number
  selectedInspirationIds: string[]
}

export type FilterTagType = TagType | 'all'

export const FilterTagLabelMap: Record<FilterTagType, string> = {
  all: '全部',
  ...TagLabelMap
}

export interface DragItem<T> {
  id: string
  data: T
  index: number
}
