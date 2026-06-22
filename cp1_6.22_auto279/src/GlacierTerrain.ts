import * as THREE from 'three'
import { fbm, randomRange, lerp, clamp, mapRange, hexToRgb } from './utils'
import type { GlacierState } from './ClimateDataModel'

export interface TerrainParams {
  width: number
  depth: number
  segments: number
  maxHeight: number
}

interface Crevice {
  start: THREE.Vector3
  end: THREE.Vector3
}

export class GlacierTerrain {
  private scene: THREE.Scene
  private params: TerrainParams
  private glacierMesh: THREE.Mesh | null = null
  private glacierMaterial: THREE.MeshStandardMaterial | null = null
  private creviceLines: THREE.LineSegments | null = null
  private historicalBoundary: THREE.Line | null = null
  private baseGeometry: THREE.BufferGeometry | null = null
  private basePositions: Float32Array | null = null
  private crevices: Crevice[] = []
  private meltingProgress: number = 0
  private targetMeltingProgress: number = 0
  private baseOpacity: number = 0.85
  private vertexMask: boolean[] = []
  private submergedFlashTime: number = 0

  constructor(scene: THREE.Scene, params: TerrainParams) {
    this.scene = scene
    this.params = params
    this.generateBaseGeometry()
    this.generateCrevices()
    this.createGlacierMesh()
    this.createCreviceLines()
  }

  private generateBaseGeometry(): void {
    const { width, depth, segments, maxHeight } = this.params
    const geometry = new THREE.PlaneGeometry(width, depth, segments, segments)
    geometry.rotateX(-Math.PI / 2)

    const positions = geometry.attributes.position.array as Float32Array
    const vertexCount = positions.length / 3
    this.basePositions = new Float32Array(positions)
    this.vertexMask = new Array(vertexCount).fill(true)

    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3
      const x = positions[i3]
      const z = positions[i3 + 2]

      const distFromCenter = Math.sqrt(x * x + z * z)
      const maxDist = Math.min(width, depth) / 2
      const edgeFactor = clamp(1 - distFromCenter / maxDist, 0, 1)

      const tongueFactor = this.calculateTongueFactor(x, z, width, depth)
      const noiseValue = fbm(x * 0.02, z * 0.02, 4)

      const height =
        maxHeight *
        Math.pow(edgeFactor, 1.5) *
        tongueFactor *
        (0.6 + noiseValue * 0.4)

      positions[i3 + 1] = Math.max(0, height)
      this.basePositions[i3 + 1] = positions[i3 + 1]
    }

    geometry.computeVertexNormals()
    this.baseGeometry = geometry
  }

  private calculateTongueFactor(
    x: number,
    z: number,
    width: number,
    depth: number
  ): number {
    const tongueX = width * 0.3
    const tongueWidth = width * 0.4
    const tongueLength = depth * 0.6

    if (z > -tongueLength && Math.abs(x - tongueX) < tongueWidth / 2) {
      const zFactor = 1 - (z + tongueLength) / tongueLength
      const xFactor = 1 - Math.abs(x - tongueX) / (tongueWidth / 2)
      return 1 + zFactor * xFactor * 0.5
    }
    return 1
  }

  private generateCrevices(): void {
    const creviceCount = 30
    const { width, depth } = this.params

    for (let i = 0; i < creviceCount; i++) {
      const angle = randomRange(0, Math.PI * 2)
      const length = randomRange(2, 8)
      const startX = randomRange(-width / 3, width / 3)
      const startZ = randomRange(-depth / 3, depth / 3)

      const startY = this.getHeightAt(startX, startZ)
      const endX = startX + Math.cos(angle) * length
      const endZ = startZ + Math.sin(angle) * length
      const endY = this.getHeightAt(endX, endZ)

      if (startY > 0.5 && endY > 0.5) {
        this.crevices.push({
          start: new THREE.Vector3(startX, startY + 0.05, startZ),
          end: new THREE.Vector3(endX, endY + 0.05, endZ),
        })
      }
    }
  }

  private getHeightAt(x: number, z: number): number {
    if (!this.basePositions) return 0

    const { width, depth, segments } = this.params
    const halfWidth = width / 2
    const halfDepth = depth / 2

    const gridX = Math.round(
      ((x + halfWidth) / width) * segments
    )
    const gridZ = Math.round(
      ((z + halfDepth) / depth) * segments
    )

    const clampedX = clamp(gridX, 0, segments)
    const clampedZ = clamp(gridZ, 0, segments)

    const index = (clampedZ * (segments + 1) + clampedX) * 3
    return this.basePositions[index + 1] || 0
  }

  private createGlacierMesh(): void {
    if (!this.baseGeometry) return

    this.glacierMaterial = new THREE.MeshStandardMaterial({
      color: 0xb0d4f1,
      transparent: true,
      opacity: this.baseOpacity,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide,
      vertexColors: false,
    })

    this.glacierMesh = new THREE.Mesh(
      this.baseGeometry.clone(),
      this.glacierMaterial
    )
    this.glacierMesh.castShadow = true
    this.glacierMesh.receiveShadow = true
    this.scene.add(this.glacierMesh)
  }

  private createCreviceLines(): void {
    const points: number[] = []
    const colors: number[] = []
    const creviceColor = hexToRgb('#1A3A5C')

    this.crevices.forEach((crevice) => {
      points.push(
        crevice.start.x,
        crevice.start.y,
        crevice.start.z,
        crevice.end.x,
        crevice.end.y,
        crevice.end.z
      )
      colors.push(
        creviceColor.r,
        creviceColor.g,
        creviceColor.b,
        creviceColor.r,
        creviceColor.g,
        creviceColor.b
      )
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    })

    this.creviceLines = new THREE.LineSegments(geometry, material)
    this.scene.add(this.creviceLines)
  }

  generateTerrain(temperature: number, historicalState?: GlacierState): void {
    if (!this.glacierMesh || !this.baseGeometry || !this.basePositions) return

    const positions = this.glacierMesh.geometry.attributes.position
      .array as Float32Array
    const basePositions = this.basePositions

    const heightMultiplier = historicalState
      ? historicalState.vertexHeightMultiplier
      : this.calculateHeightMultiplier(temperature)

    const tintColor = historicalState
      ? hexToRgb(historicalState.colorTint)
      : null

    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3
      positions[i3 + 1] = basePositions[i3 + 1] * heightMultiplier
      this.vertexMask[i] = positions[i3 + 1] > 0.1
    }

    this.glacierMesh.geometry.attributes.position.needsUpdate = true
    this.glacierMesh.geometry.computeVertexNormals()

    if (tintColor && this.glacierMaterial) {
      this.glacierMaterial.color.setRGB(tintColor.r, tintColor.g, tintColor.b)
    }

    this.updateCrevicePositions(heightMultiplier)
  }

  private calculateHeightMultiplier(temperature: number): number {
    const normalizedTemp = mapRange(temperature, -10, 10, 1, 0.3)
    return clamp(normalizedTemp, 0.3, 1)
  }

  private updateCrevicePositions(heightMultiplier: number): void {
    if (!this.creviceLines) return

    const positions = this.creviceLines.geometry.attributes.position
      .array as Float32Array

    for (let i = 0; i < this.crevices.length; i++) {
      const i6 = i * 6
      const crevice = this.crevices[i]
      positions[i6 + 1] = crevice.start.y * heightMultiplier + 0.05
      positions[i6 + 4] = crevice.end.y * heightMultiplier + 0.05
    }

    this.creviceLines.geometry.attributes.position.needsUpdate = true
  }

  updateMelting(temperature: number, deltaTime: number): void {
    const meltingRate = temperature > 0 ? temperature / 10 : 0
    this.targetMeltingProgress = clamp(meltingRate, 0, 1)

    this.meltingProgress = lerp(
      this.meltingProgress,
      this.targetMeltingProgress,
      deltaTime * 0.5
    )

    if (this.glacierMaterial) {
      const targetOpacity = lerp(this.baseOpacity, 0.2, this.meltingProgress)
      this.glacierMaterial.opacity = lerp(
        this.glacierMaterial.opacity,
        targetOpacity,
        deltaTime * 2
      )
    }

    if (this.creviceLines) {
      const creviceMaterial = this.creviceLines.material as THREE.LineBasicMaterial
      creviceMaterial.opacity = lerp(0.8, 0.1, this.meltingProgress)
    }

    this.updateEdgeContraction(deltaTime)
  }

  private updateEdgeContraction(deltaTime: number): void {
    if (!this.glacierMesh || !this.basePositions) return

    const positions = this.glacierMesh.geometry.attributes.position
      .array as Float32Array
    const contractionSpeed = 20 * this.meltingProgress

    for (let i = 0; i < positions.length / 3; i++) {
      if (!this.vertexMask[i]) continue

      const i3 = i * 3
      const x = positions[i3]
      const z = positions[i3 + 2]

      const distFromCenter = Math.sqrt(x * x + z * z)
      const { width, depth } = this.params
      const maxDist = Math.min(width, depth) / 2

      if (distFromCenter > maxDist * 0.5) {
        const edgeFactor = (distFromCenter - maxDist * 0.5) / (maxDist * 0.5)
        const contraction = contractionSpeed * edgeFactor * deltaTime

        const nx = x / distFromCenter
        const nz = z / distFromCenter

        positions[i3] -= nx * contraction
        positions[i3 + 2] -= nz * contraction
        positions[i3 + 1] *= 1 - deltaTime * 0.1 * this.meltingProgress
      }
    }

    this.glacierMesh.geometry.attributes.position.needsUpdate = true
    this.glacierMesh.geometry.computeVertexNormals()
  }

  updateSeaLevelSubmergence(
    seaLevel: number,
    deltaTime: number
  ): void {
    if (!this.glacierMesh || !this.glacierMaterial) return

    this.submergedFlashTime += deltaTime
    const flashIntensity = (Math.sin(this.submergedFlashTime * 5) + 1) / 2

    const positions = this.glacierMesh.geometry.attributes.position
      .array as Float32Array
    const colors = new Float32Array(positions.length)

    const baseColor = hexToRgb('#B0D4F1')
    const submergedColor = hexToRgb('#003D5B')

    let hasSubmerged = false

    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3
      const y = positions[i3 + 1]

      if (y < seaLevel) {
        hasSubmerged = true
        const flashFactor = flashIntensity * 0.3
        colors[i3] = lerp(submergedColor.r, baseColor.r, flashFactor)
        colors[i3 + 1] = lerp(submergedColor.g, baseColor.g, flashFactor)
        colors[i3 + 2] = lerp(submergedColor.b, baseColor.b, flashFactor)

        if (y < seaLevel - 0.5 && this.vertexMask[i]) {
          this.vertexMask[i] = false
          positions[i3 + 1] = -100
        }
      } else {
        colors[i3] = baseColor.r
        colors[i3 + 1] = baseColor.g
        colors[i3 + 2] = baseColor.b
      }
    }

    if (hasSubmerged) {
      if (!this.glacierMesh.geometry.attributes.color) {
        this.glacierMesh.geometry.setAttribute(
          'color',
          new THREE.BufferAttribute(colors, 3)
        )
      } else {
        const colorAttribute = this.glacierMesh.geometry.attributes.color
        colorAttribute.array.set(colors)
        colorAttribute.needsUpdate = true
      }
      this.glacierMaterial.vertexColors = true
    }

    this.glacierMesh.geometry.attributes.position.needsUpdate = true
    this.glacierMesh.geometry.computeVertexNormals()
  }

  showHistoricalBoundary(_year: number, state: GlacierState): void {
    this.hideHistoricalBoundary()

    if (!this.basePositions) return

    const { segments } = this.params
    const boundaryPoints: THREE.Vector3[] = []
    const step = Math.max(1, Math.floor(segments / 50))

    for (let x = 0; x <= segments; x += step) {
      for (let z = 0; z <= segments; z += step) {
        const isEdge =
          x === 0 ||
          x === segments ||
          z === 0 ||
          z === segments ||
          !this.isValidVertex(x - step, z, segments) ||
          !this.isValidVertex(x + step, z, segments) ||
          !this.isValidVertex(x, z - step, segments) ||
          !this.isValidVertex(x, z + step, segments)

        if (isEdge) {
          const index = (z * (segments + 1) + x) * 3
          const height = this.basePositions[index + 1] * state.vertexHeightMultiplier

          if (height > 0.5) {
            boundaryPoints.push(
              new THREE.Vector3(
                this.basePositions[index],
                height + 0.1,
                this.basePositions[index + 2]
              )
            )
          }
        }
      }
    }

    if (boundaryPoints.length > 2) {
      const geometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints)
      const material = new THREE.LineBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.7,
      })

      this.historicalBoundary = new THREE.LineLoop(geometry, material)
      this.scene.add(this.historicalBoundary)
    }
  }

  private isValidVertex(x: number, z: number, segments: number): boolean {
    if (x < 0 || x > segments || z < 0 || z > segments) return false
    if (!this.basePositions) return false

    const index = (z * (segments + 1) + x) * 3
    return this.basePositions[index + 1] > 0.5
  }

  hideHistoricalBoundary(): void {
    if (this.historicalBoundary) {
      this.scene.remove(this.historicalBoundary)
      this.historicalBoundary.geometry.dispose()
      const material = this.historicalBoundary.material as THREE.Material
      material.dispose()
      this.historicalBoundary = null
    }
  }

  getGlacierArea(): number {
    if (!this.glacierMesh || !this.baseGeometry) return 0

    const positions = this.glacierMesh.geometry.attributes.position
      .array as Float32Array
    let area = 0
    const { segments, width, depth } = this.params
    const cellWidth = width / segments
    const cellDepth = depth / segments

    for (let z = 0; z < segments; z++) {
      for (let x = 0; x < segments; x++) {
        const i00 = (z * (segments + 1) + x) * 3
        const i10 = (z * (segments + 1) + x + 1) * 3
        const i01 = ((z + 1) * (segments + 1) + x) * 3

        const y00 = positions[i00 + 1]
        const y10 = positions[i10 + 1]
        const y01 = positions[i01 + 1]

        if (y00 > 0 && y10 > 0 && y01 > 0) {
          area += cellWidth * cellDepth * 0.5
        }
      }
    }

    return Math.round(area * 0.1)
  }

  getGlacierVolume(): number {
    if (!this.glacierMesh) return 0

    const positions = this.glacierMesh.geometry.attributes.position
      .array as Float32Array
    let volume = 0
    const { segments, width, depth } = this.params
    const cellWidth = width / segments
    const cellDepth = depth / segments

    for (let z = 0; z < segments; z++) {
      for (let x = 0; x < segments; x++) {
        const i00 = (z * (segments + 1) + x) * 3
        const i10 = (z * (segments + 1) + x + 1) * 3
        const i01 = ((z + 1) * (segments + 1) + x) * 3
        const i11 = ((z + 1) * (segments + 1) + x + 1) * 3

        const y00 = Math.max(0, positions[i00 + 1])
        const y10 = Math.max(0, positions[i10 + 1])
        const y01 = Math.max(0, positions[i01 + 1])
        const y11 = Math.max(0, positions[i11 + 1])

        const avgHeight = (y00 + y10 + y01 + y11) / 4
        volume += cellWidth * cellDepth * avgHeight
      }
    }

    return Math.round(volume * 0.05)
  }

  getGlacierSurfacePoints(): THREE.Vector3[] {
    if (!this.glacierMesh) return []

    const positions = this.glacierMesh.geometry.attributes.position
      .array as Float32Array
    const points: THREE.Vector3[] = []

    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1]
      if (y > 1 && y < this.params.maxHeight * 0.8) {
        points.push(
          new THREE.Vector3(positions[i], y + 0.01, positions[i + 2])
        )
      }
    }

    return points
  }

  dispose(): void {
    if (this.glacierMesh) {
      this.glacierMesh.geometry.dispose()
      const material = this.glacierMesh.material as THREE.Material
      material.dispose()
      this.scene.remove(this.glacierMesh)
    }

    if (this.creviceLines) {
      this.creviceLines.geometry.dispose()
      const material = this.creviceLines.material as THREE.Material
      material.dispose()
      this.scene.remove(this.creviceLines)
    }

    if (this.baseGeometry) {
      this.baseGeometry.dispose()
    }

    this.hideHistoricalBoundary()
  }
}
