export interface Position {
  x: number
  y: number
}

export interface FireLevelConfig {
  count: number
  color: string
}

export type FireLevel = 'small' | 'medium' | 'large'

export const FIRE_CONFIGS: Record<FireLevel, FireLevelConfig> = {
  small: { count: 30, color: '#7C3AED' },
  medium: { count: 60, color: '#F59E0B' },
  large: { count: 120, color: '#EF4444' },
}

const SKY_COLOR_NODES: Array<{ progress: number; color: string }> = [
  { progress: 0, color: '#0B1026' },
  { progress: 0.16, color: '#1E3A5F' },
  { progress: 0.33, color: '#4A6FA5' },
  { progress: 0.5, color: '#87CEEB' },
  { progress: 0.66, color: '#FFB347' },
  { progress: 0.83, color: '#FF6B6B' },
  { progress: 1, color: '#2C1810' },
]

export function calculateParabola(
  t: number,
  vx: number = 1.5,
  vy: number = 2.0,
  g: number = 9.8
): Position {
  return {
    x: vx * t,
    y: vy * t - 0.5 * g * t * t,
  }
}

export function calculateLandingTime(vy: number = 2.0, g: number = 9.8): number {
  return (2 * vy) / g
}

export function calculateLandingPosition(
  vx: number = 1.5,
  vy: number = 2.0,
  g: number = 9.8
): Position {
  const t = calculateLandingTime(vy, g)
  return { x: vx * t, y: 0 }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  return rgbToHex(r, g, b)
}

export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export function snapToTarget(
  currentPos: Position,
  targetPos: Position,
  snapRadius: number = 1.5
): { snapped: boolean; position: Position } {
  const dx = targetPos.x - currentPos.x
  const dy = targetPos.y - currentPos.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  return distance <= snapRadius
    ? { snapped: true, position: { ...targetPos } }
    : { snapped: false, position: { ...currentPos } }
}

export function getSkyColorByProgress(progress: number): string {
  const clampedProgress = Math.max(0, Math.min(1, progress))
  for (let i = 0; i < SKY_COLOR_NODES.length - 1; i++) {
    const curr = SKY_COLOR_NODES[i]
    const next = SKY_COLOR_NODES[i + 1]
    if (clampedProgress >= curr.progress && clampedProgress <= next.progress) {
      const range = next.progress - curr.progress
      const localT = (clampedProgress - curr.progress) / range
      return lerpColor(curr.color, next.color, localT)
    }
  }
  return SKY_COLOR_NODES[SKY_COLOR_NODES.length - 1].color
}
