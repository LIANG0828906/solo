import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFireflyStore, type Firefly } from '../store/fireflyStore'

const NEIGHBOR_COUNT = 10
const NEIGHBOR_WEIGHT = 0.3
const RANDOM_WALK_WEIGHT = 0.7
const PULSE_ATTRACTION_WEIGHT = 0.5
const BOUNDARY_RADIUS = 20
const BOUNDARY_FORCE = 2
const GRID_CELL_SIZE = 8
const GRID_EXTENT = 24

class SpatialGrid {
  private cells: Map<number, number[]> = new Map()
  private originX: number
  private originY: number
  private originZ: number
  private dimX: number
  private dimY: number
  private dimZ: number

  constructor() {
    this.originX = -GRID_EXTENT
    this.originY = -GRID_EXTENT
    this.originZ = -GRID_EXTENT
    this.dimX = Math.ceil((2 * GRID_EXTENT) / GRID_CELL_SIZE)
    this.dimY = Math.ceil((2 * GRID_EXTENT) / GRID_CELL_SIZE)
    this.dimZ = Math.ceil((2 * GRID_EXTENT) / GRID_CELL_SIZE)
  }

  private key(cx: number, cy: number, cz: number): number {
    return (cx * this.dimY + cy) * this.dimZ + cz
  }

  rebuild(fireflies: Firefly[]) {
    this.cells.clear()
    for (let i = 0; i < fireflies.length; i++) {
      const p = fireflies[i].position
      const cx = Math.floor((p.x - this.originX) / GRID_CELL_SIZE)
      const cy = Math.floor((p.y - this.originY) / GRID_CELL_SIZE)
      const cz = Math.floor((p.z - this.originZ) / GRID_CELL_SIZE)
      const k = this.key(cx, cy, cz)
      let cell = this.cells.get(k)
      if (!cell) {
        cell = []
        this.cells.set(k, cell)
      }
      cell.push(i)
    }
  }

  getNeighborIndices(pos: THREE.Vector3): number[] {
    const cx = Math.floor((pos.x - this.originX) / GRID_CELL_SIZE)
    const cy = Math.floor((pos.y - this.originY) / GRID_CELL_SIZE)
    const cz = Math.floor((pos.z - this.originZ) / GRID_CELL_SIZE)
    const result: number[] = []
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const k = this.key(cx + dx, cy + dy, cz + dz)
          const cell = this.cells.get(k)
          if (cell) {
            for (let i = 0; i < cell.length; i++) {
              result.push(cell[i])
            }
          }
        }
      }
    }
    return result
  }
}

const _grid = new SpatialGrid()

function computeNeighborAttraction(
  fireflies: Firefly[],
  index: number
): THREE.Vector3 {
  const self = fireflies[index]
  const candidateIndices = _grid.getNeighborIndices(self.position)

  const distances: { idx: number; d: number }[] = []
  for (let i = 0; i < candidateIndices.length; i++) {
    const ci = candidateIndices[i]
    if (ci === index) continue
    const d = self.position.distanceToSquared(fireflies[ci].position)
    distances.push({ idx: ci, d })
  }

  distances.sort((a, b) => a.d - b.d)

  const center = new THREE.Vector3()
  const take = Math.min(NEIGHBOR_COUNT, distances.length)
  for (let i = 0; i < take; i++) {
    center.add(fireflies[distances[i].idx].position)
  }
  if (take === 0) return center
  center.divideScalar(take)

  const dir = new THREE.Vector3().subVectors(center, self.position)
  if (dir.lengthSq() > 0) {
    dir.normalize()
  }
  return dir
}

function randomWalk(): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  ).normalize()
}

function boundaryForce(pos: THREE.Vector3): THREE.Vector3 {
  const dist = pos.length()
  if (dist < BOUNDARY_RADIUS) return new THREE.Vector3()
  const force = new THREE.Vector3().copy(pos).normalize().multiplyScalar(-1)
  const over = dist - BOUNDARY_RADIUS
  return force.multiplyScalar(over * BOUNDARY_FORCE)
}

export function useSimulation() {
  const store = useFireflyStore
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      store.getState().initFireflies()
      initialized.current = true
    }
  }, [store])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const state = store.getState()
    const fireflies = state.fireflies

    if (fireflies.length === 0) return

    _grid.rebuild(fireflies)

    state.updateFirefliesBatch((list) => {
      for (let i = 0; i < list.length; i++) {
        const f = list[i]

        const neighborDir = computeNeighborAttraction(list, i)
        const randomDir = randomWalk()

        const newDir = new THREE.Vector3()
          .addScaledVector(neighborDir, NEIGHBOR_WEIGHT)
          .addScaledVector(randomDir, RANDOM_WALK_WEIGHT)

        if (f.pulseBoostTimer > 0 && f.pulseTarget) {
          const pulseDir = new THREE.Vector3()
            .subVectors(f.pulseTarget, f.position)
            .normalize()
          newDir.addScaledVector(pulseDir, PULSE_ATTRACTION_WEIGHT)
        }

        newDir.add(boundaryForce(f.position))

        if (newDir.lengthSq() > 0) {
          newDir.normalize()
        }

        const lerpedVel = new THREE.Vector3()
          .copy(f.velocity)
          .lerp(newDir, 0.15)
          .normalize()

        const speedFactor = 1 - f.fatigue * 0.75
        let actualSpeed = f.baseSpeed * speedFactor
        if (f.pulseBoostTimer > 0) {
          actualSpeed *= 1.5
        }

        f.velocity = lerpedVel
        f.position.addScaledVector(lerpedVel, actualSpeed * dt)

        const maxTrail = f.fatigue < 0.5 ? 30 : 15
        f.trail.unshift(f.position.clone())
        if (f.trail.length > maxTrail) {
          f.trail.length = maxTrail
        }

        f.fatigue = Math.min(1, f.fatigue + dt * 0.02)

        f.phase += (dt / f.blinkPeriod) * Math.PI * 2
        if (f.phase > Math.PI * 2) {
          f.phase -= Math.PI * 2
        }

        if (f.pulseBoostTimer > 0) {
          f.pulseBoostTimer = Math.max(0, f.pulseBoostTimer - dt)
          if (f.pulseBoostTimer === 0) {
            f.pulseTarget = null
          }
        }
      }
    })

    store.getState().updatePulses(dt)
    store.getState().incrementFpsFrame()
  })
}
