export const easeInOut = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t
}

export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

export const damp = (
  a: number,
  b: number,
  lambda: number,
  dt: number
): number => {
  return lerp(a, b, 1 - Math.exp(-lambda * dt))
}

export const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

export const radiansToDegrees = (radians: number): number => {
  return radians * (180 / Math.PI)
}
