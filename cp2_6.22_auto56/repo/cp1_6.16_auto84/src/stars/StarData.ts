export interface Star {
  x: number
  y: number
  size: number
  brightness: number
  isSpecial?: boolean
  id: string
}

export interface Constellation {
  name: string
  stars: string[]
}

export interface StarChartData {
  season: string
  stars: Star[]
  constellations: Constellation[]
  specialStarIds: string[]
  constellationLabelPos: { x: number; y: number }
}

function generateStars(
  count: number,
  width: number,
  height: number,
  specialPositions: Array<{ x: number; y: number }>
): Star[] {
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 2,
      brightness: 0.3 + Math.random() * 0.7,
      id: `star-${i}`,
    })
  }
  specialPositions.forEach((pos, idx) => {
    const specialStar: Star = {
      x: pos.x,
      y: pos.y,
      size: 2.5,
      brightness: 1,
      isSpecial: true,
      id: `special-${idx}`,
    }
    stars.push(specialStar)
  })
  return stars
}

const CHART_WIDTH = 700
const CHART_HEIGHT = 450

export const starCharts: Record<string, StarChartData> = {
  winter: {
    season: 'winter',
    stars: generateStars(
      80,
      CHART_WIDTH,
      CHART_HEIGHT,
      [
        { x: 350, y: 200 },
        { x: 150, y: 120 },
        { x: 550, y: 320 },
      ]
    ),
    constellations: [
      {
        name: '猎户座',
        stars: ['special-0', 'special-1', 'special-2'],
      },
    ],
    specialStarIds: ['special-0', 'special-1', 'special-2'],
    constellationLabelPos: { x: 350, y: 240 },
  },
  spring: {
    season: 'spring',
    stars: generateStars(
      85,
      CHART_WIDTH,
      CHART_HEIGHT,
      [
        { x: 200, y: 150 },
        { x: 400, y: 280 },
        { x: 580, y: 180 },
      ]
    ),
    constellations: [
      {
        name: '狮子座',
        stars: ['special-0', 'special-1', 'special-2'],
      },
    ],
    specialStarIds: ['special-0', 'special-1', 'special-2'],
    constellationLabelPos: { x: 400, y: 320 },
  },
  summer: {
    season: 'summer',
    stars: generateStars(
      90,
      CHART_WIDTH,
      CHART_HEIGHT,
      [
        { x: 180, y: 220 },
        { x: 380, y: 120 },
        { x: 520, y: 300 },
      ]
    ),
    constellations: [
      {
        name: '天蝎座',
        stars: ['special-0', 'special-1', 'special-2'],
      },
    ],
    specialStarIds: ['special-0', 'special-1', 'special-2'],
    constellationLabelPos: { x: 380, y: 160 },
  },
  autumn: {
    season: 'autumn',
    stars: generateStars(
      75,
      CHART_WIDTH,
      CHART_HEIGHT,
      [
        { x: 250, y: 180 },
        { x: 450, y: 250 },
        { x: 350, y: 380 },
      ]
    ),
    constellations: [
      {
        name: '仙女座',
        stars: ['special-0', 'special-1', 'special-2'],
      },
    ],
    specialStarIds: ['special-0', 'special-1', 'special-2'],
    constellationLabelPos: { x: 350, y: 420 },
  },
}

export const CHART_CANVAS_WIDTH = CHART_WIDTH
export const CHART_CANVAS_HEIGHT = CHART_HEIGHT
