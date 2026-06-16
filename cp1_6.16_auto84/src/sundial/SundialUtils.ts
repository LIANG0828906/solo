export const SHICHEN = [
  { name: '子时', zodiac: '鼠', angle: -Math.PI / 2 },
  { name: '丑时', zodiac: '牛', angle: -Math.PI / 3 },
  { name: '寅时', zodiac: '虎', angle: -Math.PI / 6 },
  { name: '卯时', zodiac: '兔', angle: 0 },
  { name: '辰时', zodiac: '龙', angle: Math.PI / 6 },
  { name: '巳时', zodiac: '蛇', angle: Math.PI / 3 },
  { name: '午时', zodiac: '马', angle: Math.PI / 2 },
  { name: '未时', zodiac: '羊', angle: (2 * Math.PI) / 3 },
  { name: '申时', zodiac: '猴', angle: (5 * Math.PI) / 6 },
  { name: '酉时', zodiac: '鸡', angle: Math.PI },
  { name: '戌时', zodiac: '狗', angle: -(5 * Math.PI) / 6 },
  { name: '亥时', zodiac: '猪', angle: -(2 * Math.PI) / 3 },
]

export const SEASON_ANGLES: Record<string, { start: number; end: number; season: string }> = {
  winter: { start: -Math.PI * 0.75, end: -Math.PI * 0.25, season: 'winter' },
  spring: { start: -Math.PI * 0.25, end: Math.PI * 0.25, season: 'spring' },
  summer: { start: Math.PI * 0.25, end: Math.PI * 0.75, season: 'summer' },
  autumn: { start: Math.PI * 0.75, end: -Math.PI * 0.75, season: 'autumn' },
}

export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI
  while (angle < -Math.PI) angle += 2 * Math.PI
  return angle
}

export function getCurrentShichen(angle: number): typeof SHICHEN[0] {
  const normalized = normalizeAngle(angle)
  let closest = SHICHEN[0]
  let minDiff = Infinity
  for (const sc of SHICHEN) {
    const diff = Math.abs(normalizeAngle(sc.angle - normalized))
    if (diff < minDiff) {
      minDiff = diff
      closest = sc
    }
  }
  return closest
}

export function getSeasonByAngle(angle: number): string | null {
  const normalized = normalizeAngle(angle)
  
  if (normalized >= -Math.PI * 0.75 && normalized < -Math.PI * 0.25) {
    return 'winter'
  } else if (normalized >= -Math.PI * 0.25 && normalized < Math.PI * 0.25) {
    return 'spring'
  } else if (normalized >= Math.PI * 0.25 && normalized < Math.PI * 0.75) {
    return 'summer'
  } else {
    return 'autumn'
  }
}

export function isAngleInUnlockZone(angle: number, season: string): boolean {
  const normalized = normalizeAngle(angle)
  const threshold = 0.15

  switch (season) {
    case 'winter':
      return Math.abs(normalizeAngle(normalized - (-Math.PI / 2))) < threshold
    case 'spring':
      return Math.abs(normalizeAngle(normalized - 0)) < threshold
    case 'summer':
      return Math.abs(normalizeAngle(normalized - Math.PI / 2)) < threshold
    case 'autumn':
      return Math.abs(Math.abs(normalized) - Math.PI) < threshold
    default:
      return false
  }
}

export const SEASON_COLORS: Record<string, string> = {
  winter: '#6ab7ff',
  spring: '#7fff9f',
  summer: '#ffd966',
  autumn: '#ff9a4d',
}

export const SEASON_NAMES: Record<string, string> = {
  winter: '冬季',
  spring: '春季',
  summer: '夏季',
  autumn: '秋季',
}
