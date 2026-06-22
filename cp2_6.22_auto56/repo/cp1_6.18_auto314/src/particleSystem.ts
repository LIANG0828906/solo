import { createNoise3D } from 'simplex-noise'

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

const PARTICLE_COUNT = 3000
const X_RANGE: [number, number] = [-200, 200]
const Y_RANGE: [number, number] = [0, 300]
const Z_RANGE: [number, number] = [-200, 200]
const COLOR_LOW: [number, number, number] = [0.043, 0.239, 0.569]
const COLOR_MID: [number, number, number] = [0.282, 0.792, 0.894]
const COLOR_HIGH: [number, number, number] = [1, 1, 1]

interface Building {
  x: number
  z: number
  width: number
  depth: number
  height: number
}

const BUILDINGS: Building[] = [
  { x: -80, z: -60, width: 25, depth: 20, height: 85 },
  { x: 50, z: 30, width: 20, depth: 25, height: 65 },
  { x: -30, z: 80, width: 30, depth: 15, height: 45 },
  { x: 100, z: -90, width: 15, depth: 20, height: 95 },
  { x: -120, z: 40, width: 22, depth: 28, height: 55 },
  { x: 70, z: -30, width: 18, depth: 22, height: 75 },
  { x: 0, z: 0, width: 28, depth: 24, height: 100 },
]

const noise3D = createNoise3D()

const SEASON_ANGLES: Record<Season, number> = {
  spring: Math.PI / 2,
  summer: Math.PI,
  autumn: (3 * Math.PI) / 2,
  winter: 0,
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function heightToColor(y: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, y / 300))
  if (t < 0.5) {
    const s = t * 2
    return [lerp(COLOR_LOW[0], COLOR_MID[0], s), lerp(COLOR_LOW[1], COLOR_MID[1], s), lerp(COLOR_LOW[2], COLOR_MID[2], s)]
  }
  const s = (t - 0.5) * 2
  return [lerp(COLOR_MID[0], COLOR_HIGH[0], s), lerp(COLOR_MID[1], COLOR_HIGH[1], s), lerp(COLOR_MID[2], COLOR_HIGH[2], s)]
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function generateInitialParticles(): { positions: Float32Array; colors: Float32Array; sizes: Float32Array } {
  const positions = new Float32Array(PARTICLE_COUNT * 6)
  const colors = new Float32Array(PARTICLE_COUNT * 6)
  const sizes = new Float32Array(PARTICLE_COUNT)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i6 = i * 6
    const x = randRange(X_RANGE[0], X_RANGE[1])
    const y = randRange(Y_RANGE[0], Y_RANGE[1])
    const z = randRange(Z_RANGE[0], Z_RANGE[1])
    const angle = Math.random() * Math.PI * 2
    const len = randRange(0.5, 1.5)

    positions[i6] = x
    positions[i6 + 1] = y
    positions[i6 + 2] = z
    positions[i6 + 3] = x + Math.cos(angle) * len
    positions[i6 + 4] = y
    positions[i6 + 5] = z + Math.sin(angle) * len

    const c0 = heightToColor(y)
    const c1 = heightToColor(y)
    colors[i6] = c0[0]
    colors[i6 + 1] = c0[1]
    colors[i6 + 2] = c0[2]
    colors[i6 + 3] = c1[0]
    colors[i6 + 4] = c1[1]
    colors[i6 + 5] = c1[2]

    sizes[i] = randRange(0.5, 1.5)
  }

  return { positions, colors, sizes }
}

export function getWindVectorAt(x: number, y: number, z: number, season: Season, time: number, intensity: number): [number, number, number] {
  const baseAngle = SEASON_ANGLES[season]
  const heightFactor = 1 + y / 300
  const scale = 0.008
  const tScale = 0.05

  const nx = noise3D(x * scale, y * scale + 100, time * tScale)
  const ny = noise3D(x * scale + 200, y * scale + 300, time * tScale)
  const nz = noise3D(x * scale + 400, y * scale + 500, time * tScale)

  const angle = baseAngle + nx * Math.PI * 0.4
  const baseSpeed = 15 * intensity * heightFactor

  const vx = Math.sin(angle) * baseSpeed + nz * baseSpeed * 0.25
  const vy = ny * 1.5
  const vz = -Math.cos(angle) * baseSpeed + nz * baseSpeed * 0.25

  return [vx, vy, vz]
}

export function generateWindField(season: Season, time: number, intensity: number): Float32Array {
  const gridX = 20
  const gridY = 10
  const gridZ = 20
  const field = new Float32Array(gridX * gridY * gridZ * 3)
  let idx = 0

  for (let ix = 0; ix < gridX; ix++) {
    for (let iy = 0; iy < gridY; iy++) {
      for (let iz = 0; iz < gridZ; iz++) {
        const px = X_RANGE[0] + (ix / (gridX - 1)) * (X_RANGE[1] - X_RANGE[0])
        const py = Y_RANGE[0] + (iy / (gridY - 1)) * (Y_RANGE[1] - Y_RANGE[0])
        const pz = Z_RANGE[0] + (iz / (gridZ - 1)) * (Z_RANGE[1] - Z_RANGE[0])
        const [vx, vy, vz] = getWindVectorAt(px, py, pz, season, time, intensity)
        field[idx++] = vx
        field[idx++] = vy
        field[idx++] = vz
      }
    }
  }

  return field
}

export function checkBuildingDeflection(
  x: number, y: number, z: number,
  vx: number, vy: number, vz: number,
  buildings: Building[]
): [number, number, number] {
  const margin = 8
  let dvx = vx
  let dvy = vy
  let dvz = vz

  for (let b = 0; b < buildings.length; b++) {
    const bld = buildings[b]
    const halfW = bld.width / 2 + margin
    const halfD = bld.depth / 2 + margin

    if (y > bld.height + margin) continue

    const dx = x - bld.x
    const dz = z - bld.z

    if (Math.abs(dx) > halfW || Math.abs(dz) > halfD) continue

    const penX = halfW - Math.abs(dx)
    const penZ = halfD - Math.abs(dz)

    if (penX < penZ) {
      const sign = dx >= 0 ? 1 : -1
      dvx += sign * Math.abs(dvz) * 0.5
      dvz *= 0.5
      if (Math.abs(dx) < bld.width / 2 + 2) {
        dvx += sign * 2
      }
    } else {
      const sign = dz >= 0 ? 1 : -1
      dvz += sign * Math.abs(dvx) * 0.5
      dvx *= 0.5
      if (Math.abs(dz) < bld.depth / 2 + 2) {
        dvz += sign * 2
      }
    }

    if (y < bld.height + 2) {
      dvy += 0.5
    }
  }

  return [dvx, dvy, dvz]
}

function respawnAtEdge(): [number, number, number] {
  const edge = Math.floor(Math.random() * 6)
  switch (edge) {
    case 0: return [X_RANGE[0], randRange(Y_RANGE[0], Y_RANGE[1]), randRange(Z_RANGE[0], Z_RANGE[1])]
    case 1: return [X_RANGE[1], randRange(Y_RANGE[0], Y_RANGE[1]), randRange(Z_RANGE[0], Z_RANGE[1])]
    case 2: return [randRange(X_RANGE[0], X_RANGE[1]), Y_RANGE[0], randRange(Z_RANGE[0], Z_RANGE[1])]
    case 3: return [randRange(X_RANGE[0], X_RANGE[1]), Y_RANGE[1], randRange(Z_RANGE[0], Z_RANGE[1])]
    case 4: return [randRange(X_RANGE[0], X_RANGE[1]), randRange(Y_RANGE[0], Y_RANGE[1]), Z_RANGE[0]]
    default: return [randRange(X_RANGE[0], X_RANGE[1]), randRange(Y_RANGE[0], Y_RANGE[1]), Z_RANGE[1]]
  }
}

export function updateParticles(
  currentPositions: Float32Array,
  season: Season,
  time: number,
  intensity: number,
  deltaTime: number,
  buildings: Building[]
): { positions: Float32Array; colors: Float32Array; averageSpeed: number; activeRatio: number } {
  const positions = new Float32Array(currentPositions)
  const colors = new Float32Array(PARTICLE_COUNT * 6)
  let totalSpeed = 0
  let activeCount = 0

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i6 = i * 6
    const sx = positions[i6]
    const sy = positions[i6 + 1]
    const sz = positions[i6 + 2]
    const ex = positions[i6 + 3]
    const ey = positions[i6 + 4]
    const ez = positions[i6 + 5]

    const mx = (sx + ex) * 0.5
    const my = (sy + ey) * 0.5
    const mz = (sz + ez) * 0.5

    let [vx, vy, vz] = getWindVectorAt(mx, my, mz, season, time, intensity)
    ;[vx, vy, vz] = checkBuildingDeflection(mx, my, mz, vx, vy, vz, buildings)

    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
    totalSpeed += speed
    if (speed > 0.5) activeCount++

    const dx = vx * deltaTime
    const dy = vy * deltaTime
    const dz = vz * deltaTime

    positions[i6] = sx + dx
    positions[i6 + 1] = sy + dy
    positions[i6 + 2] = sz + dz
    positions[i6 + 3] = ex + dx
    positions[i6 + 4] = ey + dy
    positions[i6 + 5] = ez + dz

    const nsx = positions[i6]
    const nsy = positions[i6 + 1]
    const nsz = positions[i6 + 2]
    const nex = positions[i6 + 3]
    const ney = positions[i6 + 4]
    const nez = positions[i6 + 5]

    const oob =
      nsx < X_RANGE[0] || nsx > X_RANGE[1] ||
      nsy < Y_RANGE[0] || nsy > Y_RANGE[1] ||
      nsz < Z_RANGE[0] || nsz > Z_RANGE[1] ||
      nex < X_RANGE[0] || nex > X_RANGE[1] ||
      ney < Y_RANGE[0] || ney > Y_RANGE[1] ||
      nez < Z_RANGE[0] || nez > Z_RANGE[1]

    if (oob) {
      const [rx, ry, rz] = respawnAtEdge()
      const rAngle = Math.random() * Math.PI * 2
      const rLen = 0.5 + Math.random()
      positions[i6] = rx
      positions[i6 + 1] = ry
      positions[i6 + 2] = rz
      positions[i6 + 3] = rx + Math.cos(rAngle) * rLen
      positions[i6 + 4] = ry
      positions[i6 + 5] = rz + Math.sin(rAngle) * rLen
    }

    const c0 = heightToColor(positions[i6 + 1])
    const c1 = heightToColor(positions[i6 + 4])
    colors[i6] = c0[0]
    colors[i6 + 1] = c0[1]
    colors[i6 + 2] = c0[2]
    colors[i6 + 3] = c1[0]
    colors[i6 + 4] = c1[1]
    colors[i6 + 5] = c1[2]
  }

  return {
    positions,
    colors,
    averageSpeed: totalSpeed / PARTICLE_COUNT,
    activeRatio: activeCount / PARTICLE_COUNT,
  }
}

export { PARTICLE_COUNT, X_RANGE, Y_RANGE, Z_RANGE, COLOR_LOW, COLOR_MID, COLOR_HIGH, BUILDINGS }
export type { Building, Season }
