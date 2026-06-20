import * as THREE from 'three'
import { FractalMode, FractalParams } from '@/store/useFractalStore'

export interface BranchData {
  geometry: THREE.BufferGeometry
  tips: Array<{ position: THREE.Vector3; depth: number }>
  vertices: Float32Array
  colors: Float32Array
}

interface SeededRandom {
  (): number
}

function createSeededRandom(seed: number): SeededRandom {
  let s = seed
  return function() {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  return new THREE.Color(
    color1.r + (color2.r - color1.r) * t,
    color1.g + (color2.g - color1.g) * t,
    color1.b + (color2.b - color1.b) * t
  )
}

const ROOT_COLOR = new THREE.Color(0x8B4513)
const TIP_COLOR1 = new THREE.Color(0xFF69B4)
const TIP_COLOR2 = new THREE.Color(0x9B59B6)

export class FractalTree {
  private params: FractalParams
  private mode: FractalMode
  private random: SeededRandom
  private allPoints: THREE.Vector3[] = []
  private allColors: THREE.Color[] = []
  private branchTips: Array<{ position: THREE.Vector3; depth: number }> = []
  private curvePoints: Array<THREE.Vector3[]> = []

  constructor(params: FractalParams, mode: FractalMode) {
    this.params = params
    this.mode = mode
    this.random = createSeededRandom(params.randomSeed)
  }

  generate(): BranchData {
    this.allPoints = []
    this.allColors = []
    this.branchTips = []
    this.curvePoints = []

    const start = new THREE.Vector3(0, 0, 0)
    const direction = new THREE.Vector3(0, 1, 0)

    switch (this.mode) {
      case 'pythagoras':
        this.generatePythagoras(start, direction, 0, 3)
        break
      case 'barnsley':
        this.generateBarnsley(start, direction, 0, 3)
        break
      case 'lsystem':
        this.generateLSystem(start, direction, 0, 3)
        break
    }

    const vertices = new Float32Array(this.allPoints.length * 3)
    const colors = new Float32Array(this.allColors.length * 3)

    for (let i = 0; i < this.allPoints.length; i++) {
      vertices[i * 3] = this.allPoints[i].x
      vertices[i * 3 + 1] = this.allPoints[i].y
      vertices[i * 3 + 2] = this.allPoints[i].z
      colors[i * 3] = this.allColors[i].r
      colors[i * 3 + 1] = this.allColors[i].g
      colors[i * 3 + 2] = this.allColors[i].b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.computeVertexNormals()

    return {
      geometry,
      tips: this.branchTips,
      vertices,
      colors
    }
  }

  private generatePythagoras(
    start: THREE.Vector3,
    direction: THREE.Vector3,
    depth: number,
    length: number
  ): void {
    if (depth >= this.params.maxDepth) {
      this.branchTips.push({ position: start.clone(), depth })
      return
    }

    const end = start.clone().add(direction.clone().multiplyScalar(length))

    const radius = 0.2 * Math.pow(this.params.lengthDecay, depth)
    this.addBranch(start, end, depth, radius)

    const angleRad = this.params.branchAngle * Math.PI / 180
    const randomOffset = (this.random() - 0.5) * 0.3

    const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 0, 1)).normalize()
    const up = new THREE.Vector3().crossVectors(right, direction).normalize()

    const dir1 = direction.clone()
      .applyAxisAngle(right, angleRad + randomOffset)
      .applyAxisAngle(direction, this.random() * Math.PI * 2)
      .normalize()

    const dir2 = direction.clone()
      .applyAxisAngle(right, -angleRad - randomOffset)
      .applyAxisAngle(direction, this.random() * Math.PI * 2)
      .normalize()

    const newLength = length * this.params.lengthDecay

    this.generatePythagoras(end, dir1, depth + 1, newLength)
    this.generatePythagoras(end, dir2, depth + 1, newLength)
  }

  private generateBarnsley(
    start: THREE.Vector3,
    direction: THREE.Vector3,
    depth: number,
    length: number
  ): void {
    if (depth >= this.params.maxDepth) {
      this.branchTips.push({ position: start.clone(), depth })
      return
    }

    const end = start.clone().add(direction.clone().multiplyScalar(length))
    const radius = 0.15 * Math.pow(this.params.lengthDecay, depth)
    this.addBranch(start, end, depth, radius)

    const angleRad = (this.params.branchAngle * 0.6) * Math.PI / 180

    const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(1, 0, 0)).normalize()
    const up = new THREE.Vector3().crossVectors(right, direction).normalize()

    const branchCount = 5
    const newLength = length * this.params.lengthDecay * 0.8

    for (let i = 0; i < branchCount; i++) {
      const angleOffset = (i - (branchCount - 1) / 2) * angleRad * 0.5
      const twistAngle = (i / branchCount) * Math.PI * 0.5

      const dir = direction.clone()
      const bendAxis = i % 2 === 0 ? right : up
      dir.applyAxisAngle(bendAxis, angleOffset + (this.random() - 0.5) * 0.2)
      dir.applyAxisAngle(direction, twistAngle)
      dir.normalize()

      const lengthVariation = 0.7 + this.random() * 0.6
      this.generateBarnsley(end, dir, depth + 1, newLength * lengthVariation)
    }
  }

  private generateLSystem(
    start: THREE.Vector3,
    direction: THREE.Vector3,
    depth: number,
    length: number
  ): void {
    if (depth >= this.params.maxDepth) {
      this.branchTips.push({ position: start.clone(), depth })
      return
    }

    const curve = this.createSpiralBranch(start, direction, length, depth)
    const end = curve[curve.length - 1]

    const radius = 0.18 * Math.pow(this.params.lengthDecay, depth)
    this.addCurveBranch(curve, depth, radius)

    const angleRad = (this.params.branchAngle * 0.8) * Math.PI / 180
    const spiralAngle = Math.PI / 4 + (this.random() - 0.5) * 0.3

    const tangent = new THREE.Vector3().subVectors(curve[curve.length - 1], curve[curve.length - 2]).normalize()

    const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize()
    const up = new THREE.Vector3().crossVectors(right, tangent).normalize()

    const dir1 = tangent.clone()
      .applyAxisAngle(right, angleRad)
      .applyAxisAngle(tangent, spiralAngle)
      .normalize()

    const dir2 = tangent.clone()
      .applyAxisAngle(up, angleRad * 0.7)
      .applyAxisAngle(tangent, -spiralAngle)
      .normalize()

    const newLength = length * this.params.lengthDecay

    const rule = depth % 3
    if (rule === 0) {
      this.generateLSystem(end, dir1, depth + 1, newLength)
      this.generateLSystem(end, dir2, depth + 1, newLength * 0.8)
    } else if (rule === 1) {
      this.generateLSystem(end, dir1, depth + 1, newLength)
      this.generateLSystem(end, dir2, depth + 1, newLength)
      const dir3 = tangent.clone()
        .applyAxisAngle(right, -angleRad * 0.5)
        .normalize()
      this.generateLSystem(end, dir3, depth + 1, newLength * 0.7)
    } else {
      this.generateLSystem(end, tangent.clone().normalize(), depth + 1, newLength * 1.1)
    }
  }

  private createSpiralBranch(
    start: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    depth: number
  ): THREE.Vector3[] {
    const points: THREE.Vector3[] = []
    const segments = 8

    const right = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 0, 1)).normalize()
    const up = new THREE.Vector3().crossVectors(right, direction).normalize()

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const spiralRadius = 0.3 * t * (1 + this.random() * 0.5)
      const spiralAngle = t * Math.PI * 0.5
      const spiralOffset = right.clone()
        .multiplyScalar(Math.cos(spiralAngle) * spiralRadius)
        .add(up.clone().multiplyScalar(Math.sin(spiralAngle) * spiralRadius))

      const pos = start.clone()
        .add(direction.clone().multiplyScalar(length * t))
        .add(spiralOffset)

      points.push(pos)
    }

    return points
  }

  private addBranch(start: THREE.Vector3, end: THREE.Vector3, depth: number, radius: number): void {
    const segments = Math.max(6, Math.floor(16 - depth))
    const tubularSegments = Math.max(3, Math.floor(10 - depth * 0.5))

    const direction = new THREE.Vector3().subVectors(end, start)
    const length = direction.length()

    const curve = new THREE.LineCurve3(start, end)
    const tubeGeometry = new THREE.TubeGeometry(curve, tubularSegments, radius, segments, false)

    const positions = tubeGeometry.attributes.position.array as Float32Array
    const tipColor = lerpColor(TIP_COLOR1, TIP_COLOR2, this.random())

    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new THREE.Vector3(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      )
      this.allPoints.push(vertex)

      const distFromStart = new THREE.Vector3().subVectors(vertex, start).length()
      const t = length > 0 ? distFromStart / length : 0
      const depthT = depth / this.params.maxDepth
      const colorT = Math.max(t, depthT)
      const branchColor = lerpColor(ROOT_COLOR, tipColor, colorT)
      this.allColors.push(branchColor)
    }

    tubeGeometry.dispose()
  }

  private addCurveBranch(points: THREE.Vector3[], depth: number, radius: number): void {
    const segments = Math.max(6, Math.floor(14 - depth))
    const tubularSegments = Math.max(3, Math.floor(8 - depth * 0.5))
    const curve = new THREE.CatmullRomCurve3(points)
    const tubeGeometry = new THREE.TubeGeometry(curve, tubularSegments, radius, segments, false)

    const positions = tubeGeometry.attributes.position.array as Float32Array
    const tipColor = lerpColor(TIP_COLOR1, TIP_COLOR2, this.random())
    const totalLength = curve.getLength()

    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new THREE.Vector3(
        positions[i],
        positions[i + 1],
        positions[i + 2]
      )
      this.allPoints.push(vertex)

      let closestDist = Infinity
      let closestT = 0
      for (let j = 0; j < points.length; j++) {
        const dist = vertex.distanceTo(points[j])
        if (dist < closestDist) {
          closestDist = dist
          closestT = j / (points.length - 1)
        }
      }

      const depthT = depth / this.params.maxDepth
      const colorT = Math.max(closestT, depthT)
      const branchColor = lerpColor(ROOT_COLOR, tipColor, colorT)
      this.allColors.push(branchColor)
    }

    tubeGeometry.dispose()
  }

  generateParticleData(particleCount: number): {
    positions: Float32Array
    colors: Float32Array
    sizes: Float32Array
  } {
    if (this.allPoints.length === 0) {
      this.generate()
    }

    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    const vertexCount = this.allPoints.length

    for (let i = 0; i < particleCount; i++) {
      const vertexIndex = Math.floor(this.random() * vertexCount)
      const point = this.allPoints[vertexIndex]
      const color = this.allColors[vertexIndex]

      positions[i * 3] = point.x + (this.random() - 0.5) * 0.1
      positions[i * 3 + 1] = point.y + (this.random() - 0.5) * 0.1
      positions[i * 3 + 2] = point.z + (this.random() - 0.5) * 0.1

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = 0.5 + this.random() * 1.5
    }

    return { positions, colors, sizes }
  }
}
