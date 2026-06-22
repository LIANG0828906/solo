export interface DiaryEntry {
  id: string
  date: string
  content: string
  tags: string[]
  score: number
  createdAt: number
  updatedAt: number
}

export interface TagInfo {
  name: string
  type: 'positive' | 'negative'
}

export const POSITIVE_TAGS: TagInfo[] = [
  { name: '开心', type: 'positive' },
  { name: '满足', type: 'positive' },
  { name: '平静', type: 'positive' },
  { name: '感恩', type: 'positive' },
  { name: '兴奋', type: 'positive' },
  { name: '充实', type: 'positive' },
  { name: '温暖', type: 'positive' },
  { name: '希望', type: 'positive' },
]

export const NEGATIVE_TAGS: TagInfo[] = [
  { name: '焦虑', type: 'negative' },
  { name: '疲惫', type: 'negative' },
  { name: '悲伤', type: 'negative' },
  { name: '愤怒', type: 'negative' },
  { name: '孤独', type: 'negative' },
  { name: '压力', type: 'negative' },
  { name: '迷茫', type: 'negative' },
]

export const ALL_TAGS: TagInfo[] = [...POSITIVE_TAGS, ...NEGATIVE_TAGS]

export type PageType = 'diary' | 'report'

export interface SearchFilters {
  keyword: string
  tags: string[]
}
