export type TagType = '写作' | '设计' | '编程' | '其他'

export interface Inspiration {
  id: string
  title: string
  description: string
  tags: TagType[]
  keywords: string[]
  createdAt: number
  order: number
  isArchived: boolean
}

export interface PlanStep {
  id: string
  title: string
  description: string
  duration: number
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

export type FilterTagType = TagType | '全部'
