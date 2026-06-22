export type ContentCategory = '文章' | '短视频' | '图文'
export type PublishStatus = '待发布' | '发布中' | '已发布' | '失败'
export type Platform = 'Twitter' | 'Instagram' | 'YouTube'

export interface ContentItem {
  id: string
  title: string
  summary: string
  category: ContentCategory
  materialIds: string[]
  platforms: Platform[]
  publishDate: string | null
  status: PublishStatus
  order: number
  createdAt: string
  updatedAt: string
}

export interface Material {
  id: string
  name: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl: string
  size: number
  linkedContentIds: string[]
  createdAt: string
}

export interface CalendarDay {
  date: string
  items: ScheduleEntry[]
  count: number
}

export interface ScheduleEntry {
  id: string
  contentId: string
  date: string
  platforms: Platform[]
  status: PublishStatus
}

export interface SyncLog {
  id: string
  contentId: string
  platform: Platform
  publishTime: string
  status: '成功' | '失败'
  errorMessage?: string
}
