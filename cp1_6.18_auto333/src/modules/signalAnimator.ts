import type { SignalParticle, SynapseConnection, Vec3 } from '../types/neuralTypes'

interface ParticlePoolItem {
  particle: SignalParticle
  inUse: boolean
}

class ParticlePool {
  private pool: ParticlePoolItem[] = []
  private maxSize = 500

  acquire(id: string, connectionId: string, position: Vec3, size: number): SignalParticle {
    const available = this.pool.find((p) => !p.inUse)
    if (available) {
      available.inUse = true
      available.particle.id = id
      available.particle.connectionId = connectionId
      available.particle.position = { ...position }
      available.particle.progress = 0
      available.particle.size = size
      available.particle.active = true
      return available.particle
    }

    if (this.pool.length >= this.maxSize) {
      const oldest = this.pool[0]
      oldest.inUse = true
      oldest.particle.id = id
      oldest.particle.connectionId = connectionId
      oldest.particle.position = { ...position }
      oldest.particle.progress = 0
      oldest.particle.size = size
      oldest.particle.active = true
      return oldest.particle
    }

    const newParticle: SignalParticle = {
      id,
      connectionId,
      position: { ...position },
      progress: 0,
      size,
      active: true,
    }
    this.pool.push({ particle: newParticle, inUse: true })
    return newParticle
  }

  release(particle: SignalParticle): void {
    const item = this.pool.find((p) => p.particle.id === particle.id)
    if (item) {
      item.inUse = false
      item.particle.active = false
    }
  }

  releaseAll(): void {
    this.pool.forEach((p) => {
      p.inUse = false
      p.particle.active = false
    })
  }
}

export const particlePool = new ParticlePool()

const getPositionOnPath = (pathPoints: Vec3[], progress: number): Vec3 => {
  if (pathPoints.length < 2) return pathPoints[0] || { x: 0, y: 0, z: 0 }
  const clampedProgress = Math.max(0, Math.min(1, progress))
  const totalSegments = pathPoints.length - 1
  const exactIndex = clampedProgress * totalSegments
  const startIndex = Math.floor(exactIndex)
  const endIndex = Math.min(startIndex + 1, totalSegments)
  const t = exactIndex - startIndex
  const start = pathPoints[startIndex]
  const end = pathPoints[endIndex]
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
    z: start.z + (end.z - start.z) * t,
  }
}

const calculatePathLength = (pathPoints: Vec3[]): number => {
  let length = 0
  for (let i = 1; i < pathPoints.length; i++) {
    const dx = pathPoints[i].x - pathPoints[i - 1].x
    const dy = pathPoints[i].y - pathPoints[i - 1].y
    const dz = pathPoints[i].z - pathPoints[i - 1].z
    length += Math.sqrt(dx * dx + dy * dy + dz * dz)
  }
  return length
}

export const createParticle = (
  connection: SynapseConnection,
  poolIndex: number,
): SignalParticle => {
  const particleSize = 0.01 + connection.signalStrength * 0.002
  const id = `particle-${connection.id}-${poolIndex}-${Date.now()}`
  return particlePool.acquire(
    id,
    connection.id,
    connection.pathPoints[0],
    particleSize,
  )
}

export const updateParticles = (
  particles: SignalParticle[],
  connections: SynapseConnection[],
  delta: number,
): SignalParticle[] => {
  const speed = 0.5
  const updated: SignalParticle[] = []

  for (const particle of particles) {
    if (!particle.active) continue

    const connection = connections.find((c) => c.id === particle.connectionId)
    if (!connection) {
      particlePool.release(particle)
      continue
    }

    const pathLength = calculatePathLength(connection.pathPoints)
    const progressIncrement = (speed * delta) / pathLength
    particle.progress += progressIncrement

    if (particle.progress >= 1) {
      particlePool.release(particle)
      continue
    }

    particle.position = getPositionOnPath(connection.pathPoints, particle.progress)
    particle.size = 0.01 + connection.signalStrength * 0.002
    updated.push(particle)
  }

  return updated
}

export const shouldEmitParticle = (
  connection: SynapseConnection,
  lastEmitTime: number,
  currentTime: number,
): boolean => {
  const interval = 1 / connection.frequency
  return currentTime - lastEmitTime >= interval * 1000
}

export const getParticleCountForConnection = (connection: SynapseConnection): number => {
  return Math.floor(30 + connection.weight * 20)
}
