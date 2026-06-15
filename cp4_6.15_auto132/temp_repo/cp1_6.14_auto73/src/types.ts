export interface ColorItem {
  hex: string
  rgb: [number, number, number]
}

export interface ImageItem {
  id: string
  filename: string
  originalName: string
  path: string
  url: string
  width: number
  height: number
  colors: ColorItem[]
  composition: string
  createdAt: string
}

export interface Board {
  id: string
  title: string
  description: string
  images: ImageItem[]
  palette: ColorItem[]
  createdAt: string
  updatedAt: string
}

export interface BoardCard {
  id: string
  title: string
  description: string
  imageCount: number
  thumbnail: string | null
  createdAt: string
}

export interface BoardsListResponse {
  boards: BoardCard[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
