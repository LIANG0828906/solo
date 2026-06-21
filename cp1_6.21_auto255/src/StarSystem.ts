export interface PlanetData {
  id: number
  name: string
  orbitRadius: number
  orbitSpeed: number
  radius: number
  color: string
  textureType: 'noise' | 'stripes'
  seed: number
  orbitPeriod: number
}

export interface StarSystemData {
  star: {
    radius: number
    color: string
    glowRadius: number
  }
  planets: PlanetData[]
}

const PLANET_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16'
]

const STAR_NAMES = [
  'Proxima',
  'Kepler',
  'Sirius',
  'Vega',
  'Arcturus',
  'Altair',
  'Deneb',
  'Rigel',
  'Betelgeuse',
  'Antares'
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export function generateStarSystem(): StarSystemData {
  const baseSeed = Date.now()
  const random = seededRandom(baseSeed)

  const planetCount = Math.floor(random() * 5) + 5

  const orbitRadii: number[] = []
  let currentRadius = 2
  for (let i = 0; i < planetCount; i++) {
    const gap = 0.8 + random() * 1.2
    currentRadius += gap
    if (currentRadius > 8) currentRadius = 8
    orbitRadii.push(currentRadius)
  }

  const usedColors: string[] = []
  const planets: PlanetData[] = orbitRadii.map((orbitRadius, index) => {
    const starName = STAR_NAMES[Math.floor(random() * STAR_NAMES.length)]
    const name = `${starName}-${index + 1}`

    let color: string
    do {
      color = PLANET_COLORS[Math.floor(random() * PLANET_COLORS.length)]
    } while (usedColors[usedColors.length - 1] === color && usedColors.length > 0)
    usedColors.push(color)

    const orbitSpeed = 0.5 + (8 - orbitRadius) * 0.15
    const radius = 0.3 + random() * 0.5

    const orbitPeriod = Math.round(365 * Math.sqrt(Math.pow(orbitRadius / 5, 3)))

    return {
      id: index,
      name,
      orbitRadius,
      orbitSpeed,
      radius,
      color,
      textureType: random() > 0.5 ? 'noise' : 'stripes',
      seed: Math.floor(random() * 100000),
      orbitPeriod
    }
  })

  return {
    star: {
      radius: 0.8,
      color: '#FDE047',
      glowRadius: 3
    },
    planets
  }
}
