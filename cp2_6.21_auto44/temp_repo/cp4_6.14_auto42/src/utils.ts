export interface Point2D {
  x: number
  y: number
}

export interface Point3D extends Point2D {
  z: number
}

export function normalizeToPixel(
  normalized: Point2D,
  canvasWidth: number,
  canvasHeight: number
): Point2D {
  return {
    x: normalized.x * canvasWidth,
    y: normalized.y * canvasHeight
  }
}

export function distance(
  p1: Point2D | Point3D,
  p2: Point2D | Point3D
): number {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  if ('z' in p1 && 'z' in p2) {
    const dz = (p1 as Point3D).z - (p2 as Point3D).z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  return Math.sqrt(dx * dx + dy * dy)
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  if (inMax === inMin) return outMin
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpPoint(a: Point2D, b: Point2D, t: number): Point2D {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t)
  }
}
