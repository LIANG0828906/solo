import * as THREE from 'three'

export const CELL_SIZE = 2
export const WALL_HEIGHT = 3
export const MAZE_SIZE = 9

export type Cell = {
  x: number
  z: number
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean }
  visited: boolean
}

export class Maze {
  public grid: Cell[][] = []
  public group: THREE.Group
  public exitPosition: THREE.Vector3
  private exitBeam: THREE.Mesh | null = null
  private exitBeamLight: THREE.PointLight | null = null
  private time: number = 0

  constructor() {
    this.group = new THREE.Group()
    this.exitPosition = new THREE.Vector3()
    this.generate()
    this.build()
  }

  private generate(): void {
    this.grid = []
    for (let z = 0; z < MAZE_SIZE; z++) {
      const row: Cell[] = []
      for (let x = 0; x < MAZE_SIZE; x++) {
        row.push({
          x,
          z,
          walls: { top: true, right: true, bottom: true, left: true },
          visited: false,
        })
      }
      this.grid.push(row)
    }

    const stack: Cell[] = []
    const start = this.grid[0][0]
    start.visited = true
    stack.push(start)

    while (stack.length > 0) {
      const current = stack[stack.length - 1]
      const neighbors = this.getUnvisitedNeighbors(current)

      if (neighbors.length === 0) {
        stack.pop()
      } else {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)]
        this.removeWall(current, next)
        next.visited = true
        stack.push(next)
      }
    }
  }

  private getUnvisitedNeighbors(cell: Cell): Cell[] {
    const neighbors: Cell[] = []
    const { x, z } = cell

    if (z > 0 && !this.grid[z - 1][x].visited) neighbors.push(this.grid[z - 1][x])
    if (x < MAZE_SIZE - 1 && !this.grid[z][x + 1].visited) neighbors.push(this.grid[z][x + 1])
    if (z < MAZE_SIZE - 1 && !this.grid[z + 1][x].visited) neighbors.push(this.grid[z + 1][x])
    if (x > 0 && !this.grid[z][x - 1].visited) neighbors.push(this.grid[z][x - 1])

    return neighbors
  }

  private removeWall(current: Cell, next: Cell): void {
    const dx = next.x - current.x
    const dz = next.z - current.z

    if (dx === 1) {
      current.walls.right = false
      next.walls.left = false
    } else if (dx === -1) {
      current.walls.left = false
      next.walls.right = false
    } else if (dz === 1) {
      current.walls.bottom = false
      next.walls.top = false
    } else if (dz === -1) {
      current.walls.top = false
      next.walls.bottom = false
    }
  }

  private build(): void {
    const halfSize = (MAZE_SIZE * CELL_SIZE) / 2
    const floorGeo = new THREE.PlaneGeometry(MAZE_SIZE * CELL_SIZE, MAZE_SIZE * CELL_SIZE)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.9,
      metalness: 0.1,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0, 0)
    floor.receiveShadow = true
    this.group.add(floor)

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2c2c2c,
      transparent: true,
      opacity: 0.8,
      roughness: 0.7,
      metalness: 0.2,
    })

    for (let z = 0; z < MAZE_SIZE; z++) {
      for (let x = 0; x < MAZE_SIZE; x++) {
        const cell = this.grid[z][x]
        const wx = x * CELL_SIZE - halfSize + CELL_SIZE / 2
        const wz = z * CELL_SIZE - halfSize + CELL_SIZE / 2

        if (cell.walls.top && z === 0) {
          const wall = this.createWall(CELL_SIZE, WALL_HEIGHT, 0.1, wallMat)
          wall.position.set(wx, WALL_HEIGHT / 2, wz - CELL_SIZE / 2)
          this.group.add(wall)
        }

        if (cell.walls.left && x === 0) {
          const wall = this.createWall(0.1, WALL_HEIGHT, CELL_SIZE, wallMat)
          wall.position.set(wx - CELL_SIZE / 2, WALL_HEIGHT / 2, wz)
          this.group.add(wall)
        }

        if (cell.walls.right) {
          const wall = this.createWall(0.1, WALL_HEIGHT, CELL_SIZE, wallMat)
          wall.position.set(wx + CELL_SIZE / 2, WALL_HEIGHT / 2, wz)
          this.group.add(wall)
        }

        if (cell.walls.bottom) {
          const wall = this.createWall(CELL_SIZE, WALL_HEIGHT, 0.1, wallMat)
          wall.position.set(wx, WALL_HEIGHT / 2, wz + CELL_SIZE / 2)
          this.group.add(wall)
        }
      }
    }

    const exitX = (MAZE_SIZE - 1) * CELL_SIZE - halfSize + CELL_SIZE / 2
    const exitZ = (MAZE_SIZE - 1) * CELL_SIZE - halfSize + CELL_SIZE / 2
    this.exitPosition.set(exitX, 0, exitZ)

    const beamGeo = new THREE.CylinderGeometry(0.3, 0.5, WALL_HEIGHT * 2, 16)
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.7,
    })
    this.exitBeam = new THREE.Mesh(beamGeo, beamMat)
    this.exitBeam.position.set(exitX, WALL_HEIGHT, exitZ)
    this.group.add(this.exitBeam)

    this.exitBeamLight = new THREE.PointLight(0xffd700, 2, 10)
    this.exitBeamLight.position.set(exitX, WALL_HEIGHT / 2, exitZ)
    this.group.add(this.exitBeamLight)
  }

  private createWall(w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
    const geo = new THREE.BoxGeometry(w, h, d)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    return mesh
  }

  public update(deltaTime: number): void {
    this.time += deltaTime
    if (this.exitBeam) {
      const pulse = 0.6 + 0.4 * Math.sin((this.time * Math.PI) / 1)
      const mat = this.exitBeam.material as THREE.MeshBasicMaterial
      mat.opacity = 0.5 + 0.3 * Math.sin((this.time * Math.PI) / 1)
      this.exitBeam.scale.set(pulse, 1, pulse)
    }
    if (this.exitBeamLight) {
      this.exitBeamLight.intensity = 1.5 + 0.8 * Math.sin((this.time * Math.PI) / 1)
    }
  }

  public isWalkable(worldX: number, worldZ: number, radius: number): boolean {
    const halfSize = (MAZE_SIZE * CELL_SIZE) / 2

    if (
      worldX - radius < -halfSize ||
      worldX + radius > halfSize ||
      worldZ - radius < -halfSize ||
      worldZ + radius > halfSize
    ) {
      return false
    }

    const offsetX = worldX + halfSize
    const offsetZ = worldZ + halfSize
    const gx = Math.floor(offsetX / CELL_SIZE)
    const gz = Math.floor(offsetZ / CELL_SIZE)

    if (gx < 0 || gx >= MAZE_SIZE || gz < 0 || gz >= MAZE_SIZE) return false

    const cell = this.grid[gz][gx]
    const localX = offsetX - gx * CELL_SIZE
    const localZ = offsetZ - gz * CELL_SIZE

    if (cell.walls.top && localZ - radius < 0) return false
    if (cell.walls.bottom && localZ + radius > CELL_SIZE) return false
    if (cell.walls.left && localX - radius < 0) return false
    if (cell.walls.right && localX + radius > CELL_SIZE) return false

    return true
  }

  public hasLineOfSight(
    x1: number,
    z1: number,
    x2: number,
    z2: number
  ): boolean {
    const halfSize = (MAZE_SIZE * CELL_SIZE) / 2
    const ox1 = x1 + halfSize
    const oz1 = z1 + halfSize
    const ox2 = x2 + halfSize
    const oz2 = z2 + halfSize

    const steps = 20
    for (let i = 1; i < steps; i++) {
      const t = i / steps
      const px = ox1 + (ox2 - ox1) * t
      const pz = oz1 + (oz2 - oz1) * t
      const gx = Math.floor(px / CELL_SIZE)
      const gz = Math.floor(pz / CELL_SIZE)
      if (gx < 0 || gx >= MAZE_SIZE || gz < 0 || gz >= MAZE_SIZE) return false
      const cell = this.grid[gz][gx]
      const lx = px - gx * CELL_SIZE
      const lz = pz - gz * CELL_SIZE
      const margin = 0.05
      if (cell.walls.top && lz < margin) return false
      if (cell.walls.bottom && lz > CELL_SIZE - margin) return false
      if (cell.walls.left && lx < margin) return false
      if (cell.walls.right && lx > CELL_SIZE - margin) return false
    }
    return true
  }

  public getRandomEmptyPositions(count: number, excludeStart: boolean = true): { x: number; z: number }[] {
    const positions: { x: number; z: number }[] = []
    const available: { x: number; z: number }[] = []
    const halfSize = (MAZE_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2

    for (let z = 0; z < MAZE_SIZE; z++) {
      for (let x = 0; x < MAZE_SIZE; x++) {
        if (excludeStart && x === 0 && z === 0) continue
        if (x === MAZE_SIZE - 1 && z === MAZE_SIZE - 1) continue
        available.push({
          x: x * CELL_SIZE - halfSize + CELL_SIZE / 2,
          z: z * CELL_SIZE - halfSize + CELL_SIZE / 2,
        })
      }
    }

    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length)
      positions.push(available.splice(idx, 1)[0])
    }

    return positions
  }
}
