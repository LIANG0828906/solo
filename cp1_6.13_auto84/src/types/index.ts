import { RGB } from '@/utils/colorUtils'

export interface Icon {
  id: string
  name: string
  category: string
  color: RGB
  path: string
  brightness: number
}

export interface CanvasIcon {
  id: string
  iconId: string
  x: number
  y: number
  scale: number
  rotation: number
  color: RGB
}

export interface CanvasTransform {
  scale: number
  offsetX: number
  offsetY: number
}

export interface RenderProgress {
  percentage: number
  isComplete: boolean
}
