import { PARTICLE_CONSTANTS, SCENE_CONSTANTS, FAN_CONSTANTS } from './constants'
import type { FanLevel, DoorWindowState } from '@/types'

const { ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH, SKYLIGHT_RADIUS, SKYLIGHT_POSITION } = SCENE_CONSTANTS
const { MAX_PARTICLES, PARTICLE_LIFETIME, INITIAL_SPEED, BOUNCE_FACTOR, BUOYANCY, SPAWN_POINTS } = PARTICLE_CONSTANTS

export function createParticleData(count: number) {
  return {
    position: new Float32Array(count * 3),
    velocity: new Float32Array(count * 3),
    life: new Float32Array(count),
    size: new Float32Array(count),
    alpha: new Float32Array(count),
    active: new Float32Array(count),
  }
}

export function getSpawnPoints(stovePosition: [number, number, number], count: number): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = []
  const baseY = stovePosition[1] + 0.8
  const radius = 0.15

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    points.push([
      stovePosition[0] + Math.cos(angle) * radius,
      baseY,
      stovePosition[2] + Math.sin(angle) * radius,
    ])
  }
  return points
}

export function spawnParticle(
  data: {
    position: Float32Array
    velocity: Float32Array
    life: Float32Array
    size: Float32Array
    alpha: Float32Array
    active: Float32Array
  },
  index: number,
  spawnPoints: Array<[number, number, number]>,
  minSize: number,
  maxSize: number
) {
  const spawnPoint = spawnPoints[index % spawnPoints.length]
  const i3 = index * 3

  data.position[i3] = spawnPoint[0] + (Math.random() - 0.5) * 0.05
  data.position[i3 + 1] = spawnPoint[1] + (Math.random() - 0.5) * 0.05
  data.position[i3 + 2] = spawnPoint[2] + (Math.random() - 0.5) * 0.05

  const baseAngle = Math.random() * Math.PI * 2
  const deflection = ((Math.random() - 0.5) * Math.PI) / 3
  const speed = INITIAL_SPEED * (0.8 + Math.random() * 0.4)

  data.velocity[i3] = Math.cos(baseAngle + deflection) * speed * 0.3
  data.velocity[i3 + 1] = speed + Math.random() * 0.1
  data.velocity[i3 + 2] = Math.sin(baseAngle + deflection) * speed * 0.3

  data.life[index] = 0
  data.size[index] = minSize + Math.random() * (maxSize - minSize)
  data.alpha[index] = 0
  data.active[index] = 1
}

export function updateParticles(
  data: {
    position: Float32Array
    velocity: Float32Array
    life: Float32Array
    size: Float32Array
    alpha: Float32Array
    active: Float32Array
  },
  delta: number,
  fanLevel: FanLevel,
  fanAngle: number,
  fanPosition: [number, number, number],
  doorWindow: DoorWindowState,
  stovePosition: [number, number, number]
): number {
  const fanConfig = FAN_CONSTANTS.LEVELS[fanLevel]
  const fanAcceleration = fanConfig.acceleration
  const fanRad = (fanAngle * Math.PI) / 180
  const fanDirX = Math.cos(fanRad)
  const fanDirZ = Math.sin(fanRad)

  let activeCount = 0
  const halfW = ROOM_WIDTH / 2
  const halfD = ROOM_DEPTH / 2

  for (let i = 0; i < MAX_PARTICLES; i++) {
    if (data.active[i] === 0) continue

    activeCount++
    const i3 = i * 3

    data.life[i] += delta / PARTICLE_LIFETIME

    if (data.life[i] >= 1) {
      data.active[i] = 0
      continue
    }

    if (data.life[i] < 0.1) {
      data.alpha[i] = data.life[i] / 0.1
    } else if (data.life[i] > 0.8) {
      data.alpha[i] = (1 - data.life[i]) / 0.2
    } else {
      data.alpha[i] = 1
    }

    const dx = data.position[i3] - fanPosition[0]
    const dy = data.position[i3 + 1] - fanPosition[1]
    const dz = data.position[i3 + 2] - fanPosition[2]
    const distToFan = Math.sqrt(dx * dx + dy * dy + dz * dz)

    if (fanAcceleration > 0 && distToFan < 4) {
      const fanInfluence = Math.max(0, 1 - distToFan / 4)
      const vortexStrength = fanInfluence * fanAcceleration * 0.3
      const perpX = -dz
      const perpZ = dx
      const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1

      data.velocity[i3] += fanDirX * fanAcceleration * delta * fanInfluence * 0.5
      data.velocity[i3 + 2] += fanDirZ * fanAcceleration * delta * fanInfluence * 0.5

      data.velocity[i3] += (perpX / perpLen) * vortexStrength * delta
      data.velocity[i3 + 2] += (perpZ / perpLen) * vortexStrength * delta
    }

    data.velocity[i3 + 1] += BUOYANCY * delta

    data.velocity[i3] *= 0.98
    data.velocity[i3 + 1] *= 0.99
    data.velocity[i3 + 2] *= 0.98

    data.position[i3] += data.velocity[i3] * delta
    data.position[i3 + 1] += data.velocity[i3 + 1] * delta
    data.position[i3 + 2] += data.velocity[i3 + 2] * delta

    if (data.position[i3] <= -halfW + 0.1) {
      if (!doorWindow.leftDoor || data.position[i3 + 2] < -1 || data.position[i3 + 2] > 1) {
        data.position[i3] = -halfW + 0.1
        data.velocity[i3] = -data.velocity[i3] * BOUNCE_FACTOR
        data.velocity[i3 + 1] += 0.05
      }
    }
    if (data.position[i3] >= halfW - 0.1) {
      data.position[i3] = halfW - 0.1
      data.velocity[i3] = -data.velocity[i3] * BOUNCE_FACTOR
      data.velocity[i3 + 1] += 0.05
    }
    if (data.position[i3 + 2] <= -halfD + 0.1) {
      if (!doorWindow.backWindow || data.position[i3] < -1 || data.position[i3] > 1) {
        data.position[i3 + 2] = -halfD + 0.1
        data.velocity[i3 + 2] = -data.velocity[i3 + 2] * BOUNCE_FACTOR
        data.velocity[i3 + 1] += 0.05
      }
    }
    if (data.position[i3 + 2] >= halfD - 0.1) {
      data.position[i3 + 2] = halfD - 0.1
      data.velocity[i3 + 2] = -data.velocity[i3 + 2] * BOUNCE_FACTOR
      data.velocity[i3 + 1] += 0.05
    }

    if (data.position[i3 + 1] <= 0.1) {
      data.position[i3 + 1] = 0.1
      data.velocity[i3 + 1] = -data.velocity[i3 + 1] * BOUNCE_FACTOR
    }

    if (data.position[i3 + 1] >= ROOM_HEIGHT - 0.1) {
      const skylightDx = data.position[i3] - SKYLIGHT_POSITION[0]
      const skylightDz = data.position[i3 + 2] - SKYLIGHT_POSITION[2]
      const skylightDist = Math.sqrt(skylightDx * skylightDx + skylightDz * skylightDz)

      if (skylightDist < SKYLIGHT_RADIUS) {
        data.active[i] = 0
        continue
      } else {
        data.position[i3 + 1] = ROOM_HEIGHT - 0.1
        data.velocity[i3 + 1] = -data.velocity[i3 + 1] * BOUNCE_FACTOR
      }
    }

    const stoveDx = data.position[i3] - stovePosition[0]
    const stoveDz = data.position[i3 + 2] - stovePosition[2]
    const stoveDist = Math.sqrt(stoveDx * stoveDx + stoveDz * stoveDz)
    if (stoveDist < 0.4 && data.position[i3 + 1] < 0.8) {
      data.velocity[i3] += (stoveDx / stoveDist) * delta * 0.5
      data.velocity[i3 + 2] += (stoveDz / stoveDist) * delta * 0.5
    }
  }

  return activeCount
}

export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [1, 1, 1]
}

export { SPAWN_POINTS }
