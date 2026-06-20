export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('')
  }
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return [r, g, b]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(color1)
  const [r2, g2, b2] = hexToRgb(color2)
  const r = r1 + (r2 - r1) * t
  const g = g1 + (g2 - g1) * t
  const b = b1 + (b2 - b1) * t
  return rgbToHex(r, g, b)
}

export function heatmapColor(value: number, min: number, max: number): string {
  const t = max === min ? 0 : (value - min) / (max - min)
  const clamped = Math.max(0, Math.min(1, t))
  const blue = [0, 0, 255]
  const cyan = [0, 255, 255]
  const green = [0, 255, 0]
  const yellow = [255, 255, 0]
  const red = [255, 0, 0]
  
  let r: number, g: number, b: number
  
  if (clamped < 0.25) {
    const t2 = clamped / 0.25
    r = blue[0] + (cyan[0] - blue[0]) * t2
    g = blue[1] + (cyan[1] - blue[1]) * t2
    b = blue[2] + (cyan[2] - blue[2]) * t2
  } else if (clamped < 0.5) {
    const t2 = (clamped - 0.25) / 0.25
    r = cyan[0] + (green[0] - cyan[0]) * t2
    g = cyan[1] + (green[1] - cyan[1]) * t2
    b = cyan[2] + (green[2] - cyan[2]) * t2
  } else if (clamped < 0.75) {
    const t2 = (clamped - 0.5) / 0.25
    r = green[0] + (yellow[0] - green[0]) * t2
    g = green[1] + (yellow[1] - green[1]) * t2
    b = green[2] + (yellow[2] - green[2]) * t2
  } else {
    const t2 = (clamped - 0.75) / 0.25
    r = yellow[0] + (red[0] - yellow[0]) * t2
    g = yellow[1] + (red[1] - yellow[1]) * t2
    b = yellow[2] + (red[2] - yellow[2]) * t2
  }
  
  return rgbToHex(r, g, b)
}

interface SkyGradient {
  top: string
  bottom: string
}

const SUNRISE_GRADIENT: SkyGradient = { top: '#FF6B35', bottom: '#FFD93D' }
const NOON_GRADIENT: SkyGradient = { top: '#4A90D9', bottom: '#B8E0F7' }
const SUNSET_GRADIENT: SkyGradient = { top: '#FF5722', bottom: '#9C27B0' }
const CLOUDY_GRADIENT: SkyGradient = { top: '#9E9E9E', bottom: '#E0E0E0' }

export function getSkyGradient(time: number, isCloudy: boolean): SkyGradient {
  if (isCloudy) {
    return CLOUDY_GRADIENT
  }
  
  if (time <= 6) {
    return { top: '#1A237E', bottom: '#3F51B5' }
  } else if (time < 12) {
    const t = (time - 6) / 6
    return {
      top: lerpColor('#FF6B35', '#4A90D9', t),
      bottom: lerpColor('#FFD93D', '#B8E0F7', t),
    }
  } else if (time < 19) {
    const t = (time - 12) / 7
    return {
      top: lerpColor('#4A90D9', '#FF5722', t),
      bottom: lerpColor('#B8E0F7', '#9C27B0', t),
    }
  } else {
    return { top: '#1A237E', bottom: '#3F51B5' }
  }
}

export function adjustShadowBrightness(baseShadowColor: string, groundColor: string): string {
  const [sr, sg, sb] = hexToRgb(baseShadowColor)
  const [gr, gg, gb] = hexToRgb(groundColor)
  
  const groundBrightness = (gr * 299 + gg * 587 + gb * 114) / 1000
  
  const factor = 0.7 + (groundBrightness / 255) * 0.3
  
  const r = sr * factor
  const g = sg * factor
  const b = sb * factor
  
  return rgbToHex(r, g, b)
}
