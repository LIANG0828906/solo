import * as THREE from 'three'
import { RuneType, RuneData } from './types'

export const RUNE_DATA: Record<RuneType, RuneData> = {
  [RuneType.FIRE]: {
    type: RuneType.FIRE,
    name: '火焰',
    color: '#FF4500',
    symbol: '△'
  },
  [RuneType.ICE]: {
    type: RuneType.ICE,
    name: '冰霜',
    color: '#00BCD4',
    symbol: '◇'
  },
  [RuneType.THUNDER]: {
    type: RuneType.THUNDER,
    name: '雷电',
    color: '#FFEB3B',
    symbol: '⚡'
  },
  [RuneType.EARTH]: {
    type: RuneType.EARTH,
    name: '大地',
    color: '#795548',
    symbol: '□'
  },
  [RuneType.WIND]: {
    type: RuneType.WIND,
    name: '风',
    color: '#E0E0E0',
    symbol: '🌀'
  },
  [RuneType.SHADOW]: {
    type: RuneType.SHADOW,
    name: '暗影',
    color: '#673AB7',
    symbol: '○'
  }
}

export class Rune {
  public mesh: THREE.Group
  public type: RuneType
  public data: RuneData
  private glowMesh: THREE.Mesh
  private symbolMesh: THREE.Mesh | null = null

  constructor(type: RuneType) {
    this.type = type
    this.data = RUNE_DATA[type]
    this.mesh = new THREE.Group()

    const radius = 0.5
    const geometry = new THREE.CircleGeometry(radius, 32)
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.data.color),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    })
    const circle = new THREE.Mesh(geometry, material)
    this.mesh.add(circle)

    const glowGeometry = new THREE.RingGeometry(radius * 0.9, radius * 1.2, 32)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.data.color),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    })
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    this.mesh.add(this.glowMesh)

    const symbolShape = this.createSymbolShape()
    if (symbolShape) {
      const symbolGeometry = new THREE.ShapeGeometry(symbolShape)
      const symbolMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      })
      this.symbolMesh = new THREE.Mesh(symbolGeometry, symbolMaterial)
      this.symbolMesh.scale.set(0.4, 0.4, 1)
      this.symbolMesh.position.z = 0.01
      this.mesh.add(this.symbolMesh)
    }
  }

  private createSymbolShape(): THREE.Shape | null {
    const shape = new THREE.Shape()
    const size = 0.3

    switch (this.type) {
      case RuneType.FIRE:
        shape.moveTo(0, size)
        shape.lineTo(size, -size * 0.7)
        shape.lineTo(-size, -size * 0.7)
        shape.lineTo(0, size)
        break
      case RuneType.ICE:
        shape.moveTo(0, size)
        shape.lineTo(size * 0.8, 0)
        shape.lineTo(0, -size)
        shape.lineTo(-size * 0.8, 0)
        shape.lineTo(0, size)
        break
      case RuneType.THUNDER:
        shape.moveTo(-size * 0.3, size)
        shape.lineTo(size * 0.3, size * 0.2)
        shape.lineTo(-size * 0.1, size * 0.2)
        shape.lineTo(size * 0.3, -size)
        shape.lineTo(-size * 0.3, -size * 0.2)
        shape.lineTo(size * 0.1, -size * 0.2)
        shape.lineTo(-size * 0.3, size)
        break
      case RuneType.EARTH:
        shape.moveTo(-size * 0.8, -size * 0.8)
        shape.lineTo(size * 0.8, -size * 0.8)
        shape.lineTo(size * 0.8, size * 0.8)
        shape.lineTo(-size * 0.8, size * 0.8)
        shape.lineTo(-size * 0.8, -size * 0.8)
        break
      case RuneType.WIND:
        const spiralPoints: THREE.Vector2[] = []
        for (let i = 0; i < 720; i += 10) {
          const angle = (i * Math.PI) / 180
          const r = (size * i) / 720
          spiralPoints.push(new THREE.Vector2(Math.cos(angle) * r, Math.sin(angle) * r))
        }
        if (spiralPoints.length > 1) {
          shape.moveTo(spiralPoints[0].x, spiralPoints[0].y)
          for (let i = 1; i < spiralPoints.length; i++) {
            shape.lineTo(spiralPoints[i].x, spiralPoints[i].y)
          }
        }
        break
      case RuneType.SHADOW:
        const outerRadius = size
        const innerRadius = size * 0.6
        shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)
        shape.absarc(0, 0, innerRadius, Math.PI * 2, 0, true)
        break
      default:
        return null
    }

    return shape
  }

  public animateGlow(time: number): void {
    const glowIntensity = 0.2 + Math.sin(time * 2) * 0.1
    const glowMat = this.glowMesh.material as THREE.MeshBasicMaterial
    glowMat.opacity = glowIntensity + 0.2
  }

  public dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }
}

export class BurstParticles {
  public mesh: THREE.Points
  private velocities: THREE.Vector3[]
  private life: number
  private maxLife: number = 0.3
  private particleCount: number = 30

  constructor(position: THREE.Vector3, color: string) {
    this.life = this.maxLife
    this.velocities = []

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.particleCount * 3)
    const colors = new Float32Array(this.particleCount * 3)
    const sizes = new Float32Array(this.particleCount)

    const baseColor = new THREE.Color(color)

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      positions[i3] = position.x
      positions[i3 + 1] = position.y
      positions[i3 + 2] = position.z

      colors[i3] = baseColor.r
      colors[i3 + 1] = baseColor.g
      colors[i3 + 2] = baseColor.b

      sizes[i] = 0.05 + Math.random() * 0.1

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      )
      this.velocities.push(velocity)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      sizeAttenuation: true
    })

    this.mesh = new THREE.Points(geometry, material)
  }

  public update(deltaTime: number): boolean {
    this.life -= deltaTime
    if (this.life <= 0) return false

    const positions = this.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    const array = positions.array as Float32Array

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      const vel = this.velocities[i]
      array[i3] += vel.x * deltaTime
      array[i3 + 1] += vel.y * deltaTime
      array[i3 + 2] += vel.z * deltaTime

      vel.y -= 5 * deltaTime
    }

    positions.needsUpdate = true

    const material = this.mesh.material as THREE.PointsMaterial
    material.opacity = (this.life / this.maxLife) * 0.8

    return true
  }

  public dispose(): void {
    this.mesh.geometry.dispose()
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose())
    } else {
      this.mesh.material.dispose()
    }
  }
}
