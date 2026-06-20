import * as THREE from 'three'

export interface PointCloudChunk {
  positions: Float32Array
  colors: Float32Array
  sourceType: string
}

export interface ProcessedCloudData {
  positions: Float32Array
  baseColors: Float32Array
  curvatures: Float32Array
  residuals: Float32Array
  artifacts: Float32Array
  noiseSeeds: Float32Array
  totalPoints: number
  artifactRegionCount: number
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateSeafloor(rand: () => number, count: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const x = (rand() - 0.5) * 20
    const z = (rand() - 0.5) * 20
    const y = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.5 + (rand() - 0.5) * 0.3
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    colors[i * 3] = 0.25 + rand() * 0.1
    colors[i * 3 + 1] = 0.3 + rand() * 0.1
    colors[i * 3 + 2] = 0.2 + rand() * 0.05
  }
  return { positions, colors }
}

function generateWallRuins(rand: () => number, count: number, cx: number, cz: number, angle: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  for (let i = 0; i < count; i++) {
    const lw = (rand() - 0.5) * 4
    const lh = rand() * 3
    const ld = (rand() - 0.5) * 0.4
    const x = cx + lw * cosA - ld * sinA
    const z = cz + lw * sinA + ld * cosA
    const y = lh + (rand() - 0.5) * 0.1
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    colors[i * 3] = 0.35 + rand() * 0.1
    colors[i * 3 + 1] = 0.32 + rand() * 0.08
    colors[i * 3 + 2] = 0.25 + rand() * 0.05
  }
  return { positions, colors }
}

function generateColumnBase(rand: () => number, count: number, cx: number, cz: number, radius: number, height: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = rand() * Math.PI * 2
    const h = rand() * height
    const r = radius + (rand() - 0.5) * 0.15
    positions[i * 3] = cx + Math.cos(theta) * r
    positions[i * 3 + 1] = h
    positions[i * 3 + 2] = cz + Math.sin(theta) * r
    colors[i * 3] = 0.4 + rand() * 0.08
    colors[i * 3 + 1] = 0.38 + rand() * 0.06
    colors[i * 3 + 2] = 0.3 + rand() * 0.05
  }
  return { positions, colors }
}

function generateCarvedSlab(rand: () => number, count: number, cx: number, cz: number): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const gridSize = Math.ceil(Math.sqrt(count))
  let idx = 0
  for (let gi = 0; gi < gridSize && idx < count; gi++) {
    for (let gj = 0; gj < gridSize && idx < count; gj++) {
      const u = gi / gridSize
      const v = gj / gridSize
      const x = cx + (u - 0.5) * 3
      const z = cz + (v - 0.5) * 2
      const pattern = Math.sin(u * Math.PI * 6) * Math.cos(v * Math.PI * 8)
      const y = 0.05 + pattern * 0.08 + (rand() - 0.5) * 0.01
      positions[idx * 3] = x
      positions[idx * 3 + 1] = y
      positions[idx * 3 + 2] = z
      colors[idx * 3] = 0.45 + rand() * 0.08
      colors[idx * 3 + 1] = 0.42 + rand() * 0.06
      colors[idx * 3 + 2] = 0.35 + rand() * 0.05
      idx++
    }
  }
  return { positions, colors }
}

class PointCloudProcessor {
  private data: ProcessedCloudData | null = null
  private geometry: THREE.BufferGeometry | null = null
  private allPositions: Float32Array = new Float32Array(0)
  private allColors: Float32Array = new Float32Array(0)
  private chunksLoaded: number = 0
  private readonly totalChunks: number = 10
  private readonly pointsPerChunk: number = 2500

  generateChunk(chunkIndex: number): PointCloudChunk {
    const rand = seededRandom(chunkIndex * 7919 + 42)
    const count = this.pointsPerChunk
    let result: { positions: Float32Array; colors: Float32Array }
    let sourceType: string

    switch (chunkIndex % 5) {
      case 0:
        result = generateSeafloor(rand, count)
        sourceType = 'seafloor'
        break
      case 1:
        result = generateWallRuins(rand, count, -3 + (chunkIndex * 0.7), -2 + (chunkIndex * 0.3), chunkIndex * 0.4)
        sourceType = 'wall'
        break
      case 2:
        result = generateWallRuins(rand, count, 2 + (chunkIndex * 0.5), 1 + (chunkIndex * 0.2), Math.PI * 0.3 + chunkIndex * 0.2)
        sourceType = 'wall'
        break
      case 3:
        result = generateColumnBase(rand, count, -1 + chunkIndex * 0.8, 2 - chunkIndex * 0.3, 0.5 + rand() * 0.3, 2 + rand() * 1.5)
        sourceType = 'column'
        break
      case 4:
        result = generateCarvedSlab(rand, count, 1.5, -1.5)
        sourceType = 'carved'
        break
      default:
        result = generateSeafloor(rand, count)
        sourceType = 'seafloor'
    }

    return { positions: result.positions, colors: result.colors, sourceType }
  }

  appendChunk(chunk: PointCloudChunk): number {
    const newLen = this.allPositions.length + chunk.positions.length
    const newPos = new Float32Array(newLen)
    const newCol = new Float32Array(newLen)
    newPos.set(this.allPositions)
    newCol.set(this.allColors)
    newPos.set(chunk.positions, this.allPositions.length)
    newCol.set(chunk.colors, this.allColors.length)
    this.allPositions = newPos
    this.allColors = newCol
    this.chunksLoaded++
    return this.allPositions.length / 3
  }

  processLoadedData(): ProcessedCloudData {
    const totalPoints = this.allPositions.length / 3
    const curvatures = new Float32Array(totalPoints)
    const residuals = new Float32Array(totalPoints)
    const artifacts = new Float32Array(totalPoints)
    const noiseSeeds = new Float32Array(totalPoints)
    const rand = seededRandom(12345)

    const k = 8
    const positions = this.allPositions

    for (let i = 0; i < totalPoints; i++) {
      const ix = positions[i * 3]
      const iy = positions[i * 3 + 1]
      const iz = positions[i * 3 + 2]

      const dists: { idx: number; d: number }[] = []
      const sampleStep = Math.max(1, Math.floor(totalPoints / 500))
      for (let j = 0; j < totalPoints; j += sampleStep) {
        if (j === i) continue
        const dx = positions[j * 3] - ix
        const dy = positions[j * 3 + 1] - iy
        const dz = positions[j * 3 + 2] - iz
        dists.push({ idx: j, d: dx * dx + dy * dy + dz * dz })
      }
      dists.sort((a, b) => a.d - b.d)
      const neighbors = dists.slice(0, k)

      let sumX = 0, sumY = 0, sumZ = 0
      for (const n of neighbors) {
        sumX += positions[n.idx * 3]
        sumY += positions[n.idx * 3 + 1]
        sumZ += positions[n.idx * 3 + 2]
      }
      const cx = sumX / k, cy = sumY / k, cz = sumZ / k

      let cxx = 0, cyy = 0, czz = 0, cxy = 0, cxz = 0, cyz = 0
      for (const n of neighbors) {
        const dx = positions[n.idx * 3] - cx
        const dy = positions[n.idx * 3 + 1] - cy
        const dz = positions[n.idx * 3 + 2] - cz
        cxx += dx * dx; cyy += dy * dy; czz += dz * dz
        cxy += dx * dy; cxz += dx * dz; cyz += dy * dz
      }
      const trace = cxx + cyy + czz
      const curvature = trace > 0 ? Math.min(1.0, (3 * Math.min(cxx, cyy, czz)) / trace) : 0
      curvatures[i] = curvature

      const a = cyy * czz - cyz * cyz
      const b = cxy * czz - cxz * cyz
      const c = cxy * cyz - cxz * cyy
      const normalLen = Math.sqrt(a * a + b * b + c * c)
      let residual = 0
      if (normalLen > 1e-8) {
        const na = a / normalLen, nb = b / normalLen, nc = c / normalLen
        const d = -(na * cx + nb * cy + nc * cz)
        for (const n of neighbors) {
          const dist = na * positions[n.idx * 3] + nb * positions[n.idx * 3 + 1] + nc * positions[n.idx * 3 + 2] + d
          residual += dist * dist
        }
        residual = Math.sqrt(residual / k)
      }
      residuals[i] = Math.min(1.0, residual * 5)

      artifacts[i] = (curvature > 0.15 && residual > 0.3) ? 1.0 : 0.0
      noiseSeeds[i] = rand() * 100.0
    }

    let artifactRegionCount = 0
    const visited = new Uint8Array(totalPoints)
    for (let i = 0; i < totalPoints; i++) {
      if (artifacts[i] > 0.5 && !visited[i]) {
        artifactRegionCount++
        const queue = [i]
        visited[i] = 1
        while (queue.length > 0) {
          const curr = queue.shift()!
          const cx = positions[curr * 3]
          const cy = positions[curr * 3 + 1]
          const cz = positions[curr * 3 + 2]
          for (let j = 0; j < totalPoints; j += sampleStep_calc(totalPoints)) {
            if (visited[j] || artifacts[j] < 0.5) continue
            const dx = positions[j * 3] - cx
            const dy = positions[j * 3 + 1] - cy
            const dz = positions[j * 3 + 2] - cz
            if (dx * dx + dy * dy + dz * dz < 0.5) {
              visited[j] = 1
              queue.push(j)
            }
          }
        }
      }
    }

    this.data = {
      positions: this.allPositions.slice(),
      baseColors: this.allColors.slice(),
      curvatures,
      residuals,
      artifacts,
      noiseSeeds,
      totalPoints,
      artifactRegionCount,
    }
    return this.data
  }

  createGeometry(): THREE.BufferGeometry {
    if (!this.data) throw new Error('No data processed')
    if (this.geometry) this.geometry.dispose()

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.data.positions, 3))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(this.data.baseColors, 3))
    geometry.setAttribute('aCurvature', new THREE.BufferAttribute(this.data.curvatures, 1))
    geometry.setAttribute('aIsArtifact', new THREE.BufferAttribute(this.data.artifacts, 1))
    geometry.setAttribute('aNoiseSeed', new THREE.BufferAttribute(this.data.noiseSeeds, 1))
    geometry.setAttribute('aResidual', new THREE.BufferAttribute(this.data.residuals, 1))

    this.geometry = geometry
    return geometry
  }

  highlightArtifactNear(worldPoint: THREE.Vector3, radius: number): number {
    if (!this.data) return 0
    const positions = this.data.positions
    const artifacts = this.data.artifacts
    let newHighlights = 0
    const r2 = radius * radius

    for (let i = 0; i < this.data.totalPoints; i++) {
      if (artifacts[i] < 0.5) continue
      const dx = positions[i * 3] - worldPoint.x
      const dy = positions[i * 3 + 1] - worldPoint.y
      const dz = positions[i * 3 + 2] - worldPoint.z
      if (dx * dx + dy * dy + dz * dz < r2) {
        if (artifacts[i] < 1.5) {
          artifacts[i] = 2.0
          newHighlights++
        }
      }
    }
    return newHighlights
  }

  getGeometry(): THREE.BufferGeometry | null { return this.geometry }
  getData(): ProcessedCloudData | null { return this.data }
  getTotalPoints(): number { return this.data?.totalPoints ?? 0 }
  getArtifactRegionCount(): number { return this.data?.artifactRegionCount ?? 0 }
  getChunksLoaded(): number { return this.chunksLoaded }
  getTotalChunks(): number { return this.totalChunks }
  getPointsPerChunk(): number { return this.pointsPerChunk }
  reset(): void {
    this.allPositions = new Float32Array(0)
    this.allColors = new Float32Array(0)
    this.chunksLoaded = 0
    this.data = null
    if (this.geometry) { this.geometry.dispose(); this.geometry = null }
  }
}

function sampleStep_calc(total: number): number {
  return Math.max(1, Math.floor(total / 500))
}

export const pointCloudProcessor = new PointCloudProcessor()
export default PointCloudProcessor
