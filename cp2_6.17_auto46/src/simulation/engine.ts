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
const QUERY_RADIUS = 12

class SpatialGrid {
  private cells: Map<number, number[]> = new Map()
  private originX: number
  private originY: number
  private originZ: number
  private dimX: number
  private dimY: number
  private dimZ: number
  private cellSize: number

  constructor(cellSize: number, extent: number) {
    this.cellSize = cellSize
    this.originX = -extent
    this.originY = -extent
    this.originZ = -extent
    this.dimX = Math.ceil((2 * extent) / cellSize)
    this.dimY = Math.ceil((2 * extent) / cellSize)
    this.dimZ = Math.ceil((2 * extent) / cellSize)
  }

  private key(cx: number, cy: number, cz: number): number {
    return (cx * this.dimY + cy) * this.dimZ + cz
  }

  private posToCell(pos: THREE.Vector3): [number, number, number] {
    return [
      Math.floor((pos.x - this.originX) / this.cellSize),
      Math.floor((pos.y - this.originY) / this.cellSize),
      Math.floor((pos.z - this.originZ) / this.cellSize)
    ]
  }

  rebuild(fireflies: Firefly[]) {
    this.cells.clear()
    for (let i = 0; i < fireflies.length; i++) {
      const [cx, cy, cz] = this.posToCell(fireflies[i].position)
      const k = this.key(cx, cy, cz)
      let cell = this.cells.get(k)
      if (!cell) {
        cell = []
        this.cells.set(k, cell)
      }
      cell.push(i)
    }
  }

  queryRadius(pos: THREE.Vector3, radius: number): number[] {
    const [cx, cy, cz] = this.posToCell(pos)
    const cellRadius = Math.ceil(radius / this.cellSize)
    const result: number[] = []
    const r2 = radius * radius

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dz = -cellRadius; dz <= cellRadius; dz++) {
          const k = this.key(cx + dx, cy + dy, cz + dz)
          const cell = this.cells.get(k)
          if (!cell) continue
          for (let i = 0; i < cell.length; i++) {
            result.push(cell[i])
          }
        }
      }
    }
    return result
  }
}

const _grid = new SpatialGrid(GRID_CELL_SIZE, GRID_EXTENT)

function findClosestFireflies(
  fireflies: Firefly[],
  index: number,
  count: number
): number[] {
  const self = fireflies[index]
  const candidates = _grid.queryRadius(self.position, QUERY_RADIUS)

  const distances: { idx: number; d: number }[] = []
  for (let i = 0; i < candidates.length; i++) {
    const ci = candidates[i]
    if (ci === index) continue
    const d = self.position.distanceToSquared(fireflies[ci].position)
    if (d <= QUERY_RADIUS * QUERY_RADIUS) {
      distances.push({ idx: ci, d })
    }
  }

  distances.sort((a, b) => a.d - b.d)

  const result: number[] = []
  const take = Math.min(count, distances.length)
  for (let i = 0; i < take; i++) {
    result.push(distances[i].idx)
  }
  return result
}

function computeNeighborAttraction(
  fireflies: Firefly[],
  index: number
): THREE.Vector3 {
  const self = fireflies[index]
  const closest = findClosestFireflies(fireflies, index, NEIGHBOR_COUNT)

  const center = new THREE.Vector3()
  if (closest.length === 0) return center

  for (let i = 0; i < closest.length; i++) {
    center.add(fireflies[closest[i]].position)
  }
  center.divideScalar(closest.length)

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
