import { useSunStore } from '../storage/store'

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  return { r: r + m, g: g + m, b: b + m }
}

export function intensityToColor(intensity: number): { r: number; g: number; b: number; a: number } {
  const clampedIntensity = Math.max(0, Math.min(1, intensity))

  const h = 240 - clampedIntensity * 180
  const s = 0.8
  const v = 0.4 + clampedIntensity * 0.6
  const a = 0.3 + clampedIntensity * 0.6

  const rgb = hsvToRgb(h, s, v)
  return { r: rgb.r, g: rgb.g, b: rgb.b, a }
}

export function intensityToHsv(intensity: number): { h: number; s: number; v: number; a: number } {
  const clampedIntensity = Math.max(0, Math.min(1, intensity))

  const h = 240 - clampedIntensity * 180
  const s = 0.8
  const v = 0.4 + clampedIntensity * 0.6
  const a = 0.3 + clampedIntensity * 0.6

  return { h, s, v, a }
}

export function updateFaceColors(): void {
  const state = useSunStore.getState()
  const { buildingFaces } = state

  if (buildingFaces.length === 0) return

  const colors = buildingFaces.map((face) => intensityToHsv(face.intensity))
  useSunStore.getState().setFaceColors(colors)
}
