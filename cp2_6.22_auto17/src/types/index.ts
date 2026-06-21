export interface ImageItem {
  id: string
  title: string
  url: string
  thumbnailUrl: string
  width: number
  height: number
  placeholderColor: string
  tags: string[]
}

export interface TagInfo {
  name: string
  count: number
}
