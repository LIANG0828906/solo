export interface WeekItem {
  id: string
  content: string
}

export interface WeekData {
  weekNumber: number
  year: number
  dateRange: string
  currentWork: WeekItem[]
  nextPlan: WeekItem[]
  reflection: string
}

export type TemplateType = 'professional' | 'creative'

export interface TemplateColors {
  title: string
  body: string
  listMarker: string
  divider: string
  accent: string
}
