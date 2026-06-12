import {
  STATUS_LABELS,
  STATUS_COLORS,
  VESSEL_LABELS,
  CLAY_LABELS,
  MATERIAL_LABELS,
  GLAZE_BASE_LABELS,
} from '@/stores/useAppStore'

export function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

export function clayTypeName(clayType: string): string {
  return CLAY_LABELS[clayType] || clayType
}

export function vesselTypeName(vesselType: string): string {
  return VESSEL_LABELS[vesselType] || vesselType
}

export function statusName(status: string): string {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status
}

export function statusColor(status: string): string {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#BDBDBD'
}

export function qualityStars(quality: number): string {
  const q = Math.max(0, Math.min(5, Math.floor(quality)))
  return '★'.repeat(q) + '☆'.repeat(5 - q)
}

export function materialName(material: string): string {
  return MATERIAL_LABELS[material] || material
}

export function glazeBaseName(base: string): string {
  return GLAZE_BASE_LABELS[base] || base
}

export function getGlazeGradient(name: string): string {
  if (name.includes('青瓷')) return 'linear-gradient(135deg, #B2DFDB 0%, #80CBC4 100%)'
  if (name.includes('天目')) return 'linear-gradient(135deg, #4E342E 0%, #3E2723 100%)'
  if (name.includes('吴须') || name.includes('钴蓝') || name.includes('蓝')) return 'linear-gradient(135deg, #B0BEC5 0%, #78909C 100%)'
  if (name.includes('铁红') || name.includes('红')) return 'linear-gradient(135deg, #FFAB91 0%, #D84315 100%)'
  if (name.includes('白')) return 'linear-gradient(135deg, #FAFAFA 0%, #E0E0E0 100%)'
  return 'linear-gradient(135deg, #D7CCC8 0%, #BCAAA4 100%)'
}

export function getVesselShape(vesselType: string): string {
  if (vesselType === 'cup' || vesselType === 'teapot') return 'rounded-full'
  if (vesselType === 'plate') return 'rounded-none'
  return 'rounded-sm'
}
