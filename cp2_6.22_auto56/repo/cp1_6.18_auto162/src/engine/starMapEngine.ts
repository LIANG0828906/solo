export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export interface StarPoint {
  id: string
  x: number
  y: number
  brightness: number
  size: number
  twinklePeriod: number
  twinkleOffset: number
  appearDelay: number
  ra: number
  dec: number
}

export interface ViewportParams {
  width: number
  height: number
  season: Season
  centerX: number
  centerY: number
  zoom: number
}

const SEED_TABLE: Record<Season, number> = {
  spring: 12345,
  summer: 67890,
  autumn: 24680,
  winter: 13579,
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hmsToDegrees(h: number, m: number, s: number): number {
  return (h + m / 60 + s / 3600) * 15
}

function dmsToDegrees(d: number, m: number, s: number): number {
  const sign = d >= 0 ? 1 : -1
  return sign * (Math.abs(d) + m / 60 + s / 3600)
}

const BRIGHT_STARS: Array<{ ra: [number, number, number]; dec: [number, number, number]; mag: number }> = [
  { ra: [6, 45, 8.9], dec: [-16, 42, 58], mag: -1.46 },
  { ra: [14, 15, 39.7], dec: [-60, 50, 7], mag: -0.74 },
  { ra: [7, 39, 18.1], dec: [5, 13, 30], mag: 0.03 },
  { ra: [5, 14, 32.3], dec: [-8, 12, 6], mag: 0.08 },
  { ra: [18, 36, 56.3], dec: [38, 47, 1], mag: 0.03 },
  { ra: [1, 37, 42.8], dec: [89, 15, 51], mag: 1.98 },
  { ra: [22, 58, 39.6], dec: [-29, 37, 20], mag: -0.3 },
  { ra: [12, 26, 35.9], dec: [-16, 42, 58], mag: 0.77 },
  { ra: [20, 41, 25.9], dec: [45, 16, 49], mag: 2.51 },
  { ra: [10, 8, 22.3], dec: [11, 58, 2], mag: 1.15 },
  { ra: [19, 50, 47], dec: [8, 52, 12], mag: 1.25 },
  { ra: [16, 29, 24.4], dec: [-26, 25, 55], mag: 1.35 },
  { ra: [14, 39, 36], dec: [-60, 50, 7], mag: 1.68 },
  { ra: [5, 35, 17.5], dec: [-1, 12, 5], mag: 1.64 },
  { ra: [6, 9, 42.7], dec: [-18, 31, 54], mag: 1.58 },
  { ra: [3, 47, 29.1], dec: [24, 6, 18], mag: 1.79 },
  { ra: [19, 10, 57], dec: [-13, 13, 34], mag: 1.67 },
  { ra: [14, 4, 23.3], dec: [19, 6, 18], mag: 2.23 },
  { ra: [17, 37, 19.2], dec: [-37, 6, 14], mag: 1.69 },
  { ra: [21, 43, 30.4], dec: [-14, 3, 22], mag: 2.39 },
  { ra: [0, 6, 19.4], dec: [5, 13, 30], mag: 2.04 },
  { ra: [7, 34, 35.5], dec: [31, 53, 18], mag: 1.65 },
  { ra: [9, 51, 23.9], dec: [-54, 17, 59], mag: 2.45 },
  { ra: [13, 25, 13.8], dec: [-11, 9, 41], mag: 2.63 },
  { ra: [17, 59, 12], dec: [66, 42, 26], mag: 1.77 },
]

function calcBrightness(mag: number): { brightness: number; size: number } {
  if (mag <= 0.5) return { brightness: 0.6, size: 3.5 }
  if (mag <= 1.8) return { brightness: 0.3, size: 2.2 }
  return { brightness: 0.1, size: 1.4 }
}

export function generateStars(params: ViewportParams): StarPoint[] {
  const { width, height, season, centerX, centerY, zoom } = params
  const seed = SEED_TABLE[season]
  const rand = mulberry32(seed)
  const stars: StarPoint[] = []
  const baseCount = 1200
  const cx = width / 2 + centerX
  const cy = height / 2 + centerY

  const seasonOffset: Record<Season, number> = {
    spring: 0,
    summer: 90,
    autumn: 180,
    winter: 270,
  }

  for (let i = 0; i < BRIGHT_STARS.length; i++) {
    const star = BRIGHT_STARS[i]
    const ra = hmsToDegrees(...star.ra) + seasonOffset[season]
    const dec = dmsToDegrees(...star.dec)
    const normalizedRA = ((ra % 360) + 360) % 360 / 360
    const normalizedDec = (dec + 90) / 180

    const x = cx + (normalizedRA - 0.5) * width * 1.4 * zoom + (rand() - 0.5) * 40
    const y = cy + (0.5 - normalizedDec) * height * 1.4 * zoom + (rand() - 0.5) * 40

    if (x >= -50 && x <= width + 50 && y >= -50 && y <= height + 50) {
      const { brightness, size } = calcBrightness(star.mag)
      const distFromCenter = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2))
      const maxDist = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2))
      stars.push({
        id: `bright-${season}-${i}`,
        x,
        y,
        brightness,
        size,
        twinklePeriod: 1 + rand() * 2,
        twinkleOffset: rand() * Math.PI * 2,
        appearDelay: (distFromCenter / maxDist) * 600,
        ra,
        dec,
      })
    }
  }

  for (let i = 0; i < baseCount - BRIGHT_STARS.length; i++) {
    const ra = rand() * 360
    const dec = (rand() - 0.5) * 150
    const normalizedRA = ra / 360
    const normalizedDec = (dec + 90) / 180

    const x = cx + (normalizedRA - 0.5) * width * 1.4 * zoom + (rand() - 0.5) * 30
    const y = cy + (0.5 - normalizedDec) * height * 1.4 * zoom + (rand() - 0.5) * 30

    if (x >= -20 && x <= width + 20 && y >= -20 && y <= height + 20) {
      const mag = 2 + rand() * 3
      const { brightness, size } = calcBrightness(mag)
      const distFromCenter = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2))
      const maxDist = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2))
      stars.push({
        id: `star-${season}-${i}`,
        x,
        y,
        brightness,
        size,
        twinklePeriod: 1 + rand() * 2,
        twinkleOffset: rand() * Math.PI * 2,
        appearDelay: (distFromCenter / maxDist) * 600,
        ra,
        dec,
      })
    }
  }

  return stars
}

export function findNearestStar(
  stars: StarPoint[],
  x: number,
  y: number,
  maxDistance: number = 35
): StarPoint | null {
  let nearest: StarPoint | null = null
  let minDist = maxDistance

  for (const star of stars) {
    const dx = star.x - x
    const dy = star.y - y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) {
      minDist = dist
      nearest = star
    }
  }
  return nearest
}

export function getSeasonName(season: Season): string {
  const names: Record<Season, string> = {
    spring: '春',
    summer: '夏',
    autumn: '秋',
    winter: '冬',
  }
  return names[season]
}
