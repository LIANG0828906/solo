export interface RGB {
  r: number
  g: number
  b: number
  a?: number
}

export type PaperType = 'fine' | 'medium' | 'rough' | 'cold' | 'hot'

export interface BrushParams {
  size: number
  waterContent: number
  textureStrength: number
  paperType: PaperType
  currentColor: RGB
}

export interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: number
}

export interface Artwork {
  id: string
  title: string
  author: string
  thumbnail: string
  fullImage: string
  width: number
  height: number
  paperType: PaperType
  likes: number
  isLiked: boolean
  comments: Comment[]
  createdAt: number
}

export interface BusEvent {
  type: 'paint' | 'save' | 'delete' | 'like'
  payload: Record<string, unknown>
}

export type EventCallback = (event: BusEvent) => void

export const BASE_COLORS: RGB[] = [
  { r: 230, g: 57,  b: 70  },
  { r: 249, g: 132, b: 62  },
  { r: 253, g: 203, b: 110 },
  { r: 106, g: 176, b: 76  },
  { r: 38,  g: 136, b: 201 },
  { r: 67,  g: 97,  b: 238 },
  { r: 142, g: 68,  b: 173 },
  { r: 240, g: 98,  b: 190 },
  { r: 139, g: 90,  b: 43  },
  { r: 0,   g: 0,   b: 0   },
  { r: 108, g: 117, b: 125 },
  { r: 245, g: 240, b: 232 },
]

export const PAPER_CONFIGS: Record<PaperType, { name: string; filter: string; absorbRate: number }> = {
  fine:   { name: '细纹', filter: 'contrast(1.05) saturate(0.98)', absorbRate: 0.3 },
  medium: { name: '中纹', filter: 'contrast(1.1)  blur(0.3px) saturate(0.97)', absorbRate: 0.5 },
  rough:  { name: '粗纹', filter: 'contrast(1.18) blur(0.6px) saturate(0.95)', absorbRate: 0.7 },
  cold:   { name: '冷压', filter: 'contrast(1.12) blur(0.4px) saturate(0.96) hue-rotate(-3deg)', absorbRate: 0.6 },
  hot:    { name: '热压', filter: 'contrast(1.03) saturate(1.02) brightness(1.02)', absorbRate: 0.2 },
}
