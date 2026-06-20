export interface BuildingData {
  x: number
  z: number
  width: number
  depth: number
  height: number
  windowSeed: number
}

export function generateBuildings(count: number, areaSize: number): BuildingData[] {
  const buildings: BuildingData[] = []
  const gridCols = Math.ceil(Math.sqrt(count * 1.5))
  const cellSize = areaSize / gridCols
  let seed = 42

  const random = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  for (let i = 0; i < count; i++) {
    const col = i % gridCols
    const row = Math.floor(i / gridCols)
    const baseX = (col - gridCols / 2) * cellSize
    const baseZ = (row - gridCols / 2) * cellSize

    const width = cellSize * (0.5 + random() * 0.4)
    const depth = cellSize * (0.5 + random() * 0.4)
    const x = baseX + (random() - 0.5) * cellSize * 0.3
    const z = baseZ + (random() - 0.5) * cellSize * 0.3
    const height = 5 + random() * random() * 45

    buildings.push({
      x,
      z,
      width,
      depth,
      height,
      windowSeed: Math.floor(random() * 10000)
    })
  }

  return buildings
}

export function getWindowLitRatio(time: number): number {
  if (time < 17) {
    return 0
  } else if (time < 19) {
    const t = (time - 17) / 2
    return t * 0.6
  } else if (time < 21) {
    return 0.6
  } else {
    const t = (time - 21) / 1
    return 0.6 - t * 0.2
  }
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function shouldLightBeOn(windowSeed: number, windowIndex: number, litRatio: number): boolean {
  if (litRatio <= 0) return false
  if (litRatio >= 1) return true
  const r = seededRandom(windowSeed + windowIndex * 7.3)
  return r < litRatio
}

export function lerpColor(color1: number[], color2: number[], t: number): number[] {
  return [
    color1[0] + (color2[0] - color1[0]) * t,
    color1[1] + (color2[1] - color1[1]) * t,
    color1[2] + (color2[2] - color1[2]) * t
  ]
}

export function formatTime(time: number): string {
  const hours = Math.floor(time)
  const minutes = Math.floor((time - hours) * 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
