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
  background: string
  subtitle: string
  sectionTitle: string
}

export interface TemplateStyles {
  colors: TemplateColors
  fontFamily: string
  titleFontSize: string
  sectionTitleFontSize: string
  bodyFontSize: string
  lineHeight: string
  paragraphSpacing: string
  listItemSpacing: string
  borderRadius: string
  dividerStyle: 'solid' | 'gradient'
  dividerHeight: string
  listMarker: string
  paperShadow: string
}
