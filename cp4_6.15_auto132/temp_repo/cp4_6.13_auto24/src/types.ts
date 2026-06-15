export type LeatherType = '植鞣革' | '铬鞣革'

export interface Leather {
  id: number
  name: string
  type: LeatherType
  thickness: number
  area: number
  remaining: number
  receiveDate: string
}

export interface ProcessStep {
  id?: number
  order: number
  description: string
  duration: number
}

export interface Article {
  id: number
  name: string
  completionDate: string
  mainImageUrl: string
  steps: ProcessStep[]
  leatherIds: number[]
}

export interface ArticleDetail extends Article {
  leathers: Leather[]
}

export interface WorkshopStats {
  totalLeatherTypes: number
  totalArticles: number
  totalRemainingArea: number
}
