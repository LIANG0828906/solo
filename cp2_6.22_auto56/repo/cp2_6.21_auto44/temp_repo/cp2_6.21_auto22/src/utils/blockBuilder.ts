import type { BuildingBlockData } from '@/store/sceneStore'

export interface GeometryParams {
  width: number
  height: number
  depth: number
  posX: number
  posY: number
  posZ: number
  color: string
  opacity: number
}

export function toGeometryParams(block: BuildingBlockData): GeometryParams {
  return {
    width: block.dimensions.width,
    height: block.dimensions.height,
    depth: block.dimensions.length,
    posX: block.position.x,
    posY: block.position.y + block.dimensions.height / 2,
    posZ: block.position.z,
    color: block.color,
    opacity: block.opacity,
  }
}

export function clampDimension(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function clampPosition(value: number): number {
  return Math.max(-10, Math.min(10, value))
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  )
}

export function lerpColor3(
  colorA: string,
  colorB: string,
  colorC: string,
  t: number
): string {
  const a = hexToRgb(colorA)
  const b = hexToRgb(colorB)
  const c = hexToRgb(colorC)
  if (!a || !b || !c) return colorA

  const clamped = Math.max(0, Math.min(1, t))
  if (clamped <= 0.5) {
    const localT = clamped * 2
    return rgbToHex(
      a.r + (b.r - a.r) * localT,
      a.g + (b.g - a.g) * localT,
      a.b + (b.b - a.b) * localT
    )
  }
  const localT = (clamped - 0.5) * 2
  return rgbToHex(
    b.r + (c.r - b.r) * localT,
    b.g + (c.g - b.g) * localT,
    b.b + (c.b - b.b) * localT
  )
}

export function validateBlockData(data: unknown): data is BuildingBlockData[] {
  if (!Array.isArray(data)) return false
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as any).name === 'string' &&
      typeof (item as any).position === 'object' &&
      typeof (item as any).dimensions === 'object' &&
      typeof (item as any).color === 'string'
  )
}
