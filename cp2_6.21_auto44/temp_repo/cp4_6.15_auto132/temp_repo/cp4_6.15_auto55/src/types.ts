export type MaterialType = '木材' | '金属' | '塑料' | '织物' | '涂料' | '五金' | '玻璃' | '其他'

export type Difficulty = '新手' | '进阶' | '专家'

export type MaterialStatus = 'available' | 'taken'

export type HexColor = string & { __brand: 'HexColor' }

export function isHexColor(value: string): value is HexColor {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)
}

export function toHexColor(value: string): HexColor {
  return isHexColor(value) ? value : ('#888888' as HexColor)
}

export interface Material {
  id: string
  name: string
  quantity: number
  dimensions: string
  materialType: MaterialType
  color: HexColor
  condition: number
  photos: string[]
  status: MaterialStatus
  publisherName: string
  contact: string
  createdAt: number
}

export interface Project {
  id: string
  name: string
  requiredMaterialTypes: MaterialType[]
  difficulty: Difficulty
  estimatedHours: number
  matchScore: number
  publisherName: string
  contact: string
  createdAt: number
}

export interface AppNotification {
  id: string
  type: 'taken' | 'favorite' | 'match'
  message: string
  materialId?: string
  read: boolean
  createdAt: number
}

export interface Favorite {
  id: string
  itemId: string
  itemType: 'material' | 'project'
  createdAt: number
}

export interface FilterState {
  materialType: MaterialType | null
  color: HexColor | null
  conditionRange: [number, number]
}

export const MATERIAL_TYPES: MaterialType[] = ['木材', '金属', '塑料', '织物', '涂料', '五金', '玻璃', '其他']

export const DIFFICULTIES: Difficulty[] = ['新手', '进阶', '专家']

export const CONDITION_EMOJIS = ['😞', '😕', '😐', '🙂', '😊']

export const COLOR_PRESETS: { value: HexColor; label: string }[] = [
  { value: '#D2B48C' as HexColor, label: '原木色' },
  { value: '#2F4F4F' as HexColor, label: '墨绿' },
  { value: '#FFFFFF' as HexColor, label: '纯白' },
  { value: '#B87333' as HexColor, label: '铜色' },
  { value: '#1C1C1C' as HexColor, label: '雅黑' },
  { value: '#F0E68C' as HexColor, label: '亚麻' },
  { value: '#3E2723' as HexColor, label: '深棕' },
  { value: '#87CEEB' as HexColor, label: '天蓝' },
  { value: '#5D4037' as HexColor, label: '胡桃木' },
  { value: '#D3D3D3' as HexColor, label: '浅灰' },
]

export function calculateColorSimilarity(color1: HexColor, color2: HexColor): number {
  const parseHex = (hex: HexColor): [number, number, number] => {
    let h = hex.slice(1)
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('')
    }
    const r = parseInt(h.substring(0, 2), 16)
    const g = parseInt(h.substring(2, 4), 16)
    const b = parseInt(h.substring(4, 6), 16)
    return [r, g, b]
  }

  const [r1, g1, b1] = parseHex(color1)
  const [r2, g2, b2] = parseHex(color2)

  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  )

  const maxDistance = Math.sqrt(255 * 255 * 3)
  return 100 * (1 - distance / maxDistance)
}
