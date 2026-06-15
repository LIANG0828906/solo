export interface ProjectCard {
  id: string
  name: string
  description: string
  thumbnailUrl: string
  tags: string[]
  link: string
  x: number
  y: number
}

export type TemplateStyle = 'minimal' | 'modern' | 'artistic'

export interface Template {
  id: TemplateStyle
  name: string
  description: string
}

export interface GlobalSettings {
  backgroundColor: string
  fontFamily: string
  borderRadius: number
  spacing: number
}

export interface PortfolioState {
  template: TemplateStyle
  cards: ProjectCard[]
  settings: GlobalSettings
}

export interface SaveResponse {
  success: boolean
  projectId: string
  message: string
}

export interface PublishResponse {
  success: boolean
  downloadUrl: string
  message: string
}

export type ToastType = 'success' | 'error'

export interface Toast {
  id: string
  type: ToastType
  message: string
}
