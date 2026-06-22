import * as THREE from 'three'
import { colorThemes, ColorTheme } from './store'

export interface NebulaParams {
  particleCount: number
  particleSize: number
  colorSpeed: number
  colorThemeIndex: number
}

interface RippleEffect {
  position: THREE.Vector3
  currentRadius: number
  maxRadius: number
  startTime: number
  duration: number
  mesh: THREE.Mesh
}

export class NebulaSystem {
  private scene: THREE.Scene
  private particles: THREE.Points | null = null
  private particleGeometry: THREE.BufferGeometry | null = null
  private particleMaterial: THREE.PointsMaterial | null = null
  private lineGeometry: THREE.BufferGeometry | null = null
  private lineMaterial: THREE.LineBasicMaterial | null = null
  private lines: THREE.LineSegments | null = null
  private backgroundStars: THREE.Points | null = null
  
  private positions: Float32Array | null = null
  private velocities: THREE.Vector3[] = []
  private colors: Float32Array | null = null
  private sizes: Float32Array | null = null
  private originalPositions: Float32Array | null = null
  private phaseOffsets: Float32Array | null = null
  
  private params: NebulaParams
  private time: number = 0
  private spiralRadius: number = 30
  
  private ripples: RippleEffect[] = []
  
  private spriteTexture: THREE.Texture | null = null
  
  private colorHue: number = 0
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.params = {
      particleCount: 2000,
      particleSize: 2,
      colorSpeed: 0.5,
      colorThemeIndex: 0
    }
    
    this.createSpriteTexture()
    this.createBackgroundStars()
    this.createParticles()
    this.createLines()
  }
  
  private createSpriteTexture(): void {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)')
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
    
    this.spriteTexture = new THREE.CanvasTexture(canvas)
    this.spriteTexture.needsUpdate = true
  }
  
  private createBackgroundStars(): void {
    const starCount = 500
    const positions = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)
    
    for (let i = 0; i < starCount; i++) {
      const radius = 200 + Math.random() * 300
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
      
      sizes[i] = Math.random() * 1.5 + 0.5
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      map: this.spriteTexture!,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    this.backgroundStars = new THREE.Points(geometry, material)
    this.scene.add(this.backgroundStars)
  }
  
  private createParticles(): void {
    if (this.particles) {
      this.scene.remove(this.particles)
      this.particleGeometry?.dispose()
      this.particleMaterial?.dispose()
    }
    
    const count = this.params.particleCount
    
    this.positions = new Float32Array(count * 3)
    this.originalPositions = new Float32Array(count * 3)
    this.colors = new Float32Array(count * 3)
    this.sizes = new Float32Array(count)
    this.phaseOffsets = new Float32Array(count)
    this.velocities = []
    
    const theme = colorThemes[this.params.colorThemeIndex]
    
    for (let i = 0; i < count; i++) {
      const t = i / count
      const angle = t * Math.PI * 6 + (Math.random() - 0.5) * 0.5
      const radius = Math.sqrt(t) * this.spiralRadius + (Math.random() - 0.5) * 8
      const height = (Math.random() - 0.5) * 15
      
      const x = Math.cos(angle) * radius
      const y = height
      const z = Math.sin(angle) * radius
      
      this.positions[i * 3] = x
      this.positions[i * 3 + 1] = y
      this.positions[i * 3 + 2] = z
      
      this.originalPositions[i * 3] = x
      this.originalPositions[i * 3 + 1] = y
      this.originalPositions[i * 3 + 2] = z
      
      const colorIndex = Math.floor(Math.random() * theme.colors.length)
      const color = new THREE.Color(theme.colors[colorIndex])
      
      const nextColorIndex = (colorIndex + 1) % theme.colors.length
      const nextColor = new THREE.Color(theme.colors[nextColorIndex])
      const mixFactor = Math.random()
      
      color.lerp(nextColor, mixFactor)
      
      this.colors[i * 3] = color.r
      this.colors[i * 3 + 1] = color.g
      this.colors[i * 3 + 2] = color.b
      
      this.sizes[i] = 0.5 + Math.random() * 2.5
      
      this.phaseOffsets[i] = Math.random() * Math.PI * 2
      
      const speed = 0.1 + Math.random() * 0.2
      const velAngle = angle + Math.PI / 2 + (Math.random() - 0.5) * 0.3
      const vel = new THREE.Vector3(
        Math.cos(velAngle) * speed,
        (Math.random() - 0.5) * 0.05,
        Math.sin(velAngle) * speed
      )
      this.velocities.push(vel)
    }
    
    this.particleGeometry = new THREE.BufferGeometry()
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    
    this.particleMaterial = new THREE.PointsMaterial({
      size: this.params.particleSize,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      map: this.spriteTexture!,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial)
    this.scene.add(this.particles)
  }
  
  private createLines(): void {
    if (this.lines) {
      this.scene.remove(this.lines)
      this.lineGeometry?.dispose()
      this.lineMaterial?.dispose()
    }
    
    this.lineGeometry = new THREE.BufferGeometry()
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    this.lines = new THREE.LineSegments(this.lineGeometry, this.lineMaterial)
    this.scene.add(this.lines)
    
    this.updateLines()
  }
  
  private updateLines(): void {
    if (!this.positions || !this.lineGeometry) return
    
    const maxLines = 800
    const linePositions: number[] = []
    const threshold = 15
    const count = Math.min(this.params.particleCount, 300)
    
    for (let i = 0; i < count && linePositions.length / 6 < maxLines; i++) {
      const i3 = i * 3
      const x1 = this.positions[i3]
      const y1 = this.positions[i3 + 1]
      const z1 = this.positions[i3 + 2]
      
      for (let j = i + 1; j < count && linePositions.length / 6 < maxLines; j++) {
        const j3 = j * 3
        const dx = this.positions[j3] - x1
        const dy = this.positions[j3 + 1] - y1
        const dz = this.positions[j3 + 2] - z1
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        
        if (dist < threshold) {
          linePositions.push(x1, y1, z1)
          linePositions.push(this.positions[j3], this.positions[j3 + 1], this.positions[j3 + 2])
        }
      }
    }
    
    this.lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    this.lineGeometry.computeBoundingSphere()
  }
  
  public updateParams(params: Partial<NebulaParams>): void {
    const needsRebuild = params.particleCount !== undefined && params.particleCount !== this.params.particleCount
    const needsThemeUpdate = params.colorThemeIndex !== undefined && params.colorThemeIndex !== this.params.colorThemeIndex
    const needsSizeUpdate = params.particleSize !== undefined && params.particleSize !== this.params.particleSize
    
    Object.assign(this.params, params)
    
    if (needsRebuild) {
      this.createParticles()
      this.createLines()
    }
    
    if (needsThemeUpdate && !needsRebuild) {
      this.updateParticleColors()
    }
    
    if (needsSizeUpdate && this.particleMaterial) {
      this.particleMaterial.size = this.params.particleSize
    }
  }
  
  private updateParticleColors(): void {
    if (!this.colors || !this.particleGeometry) return
    
    const theme = colorThemes[this.params.colorThemeIndex]
    const count = this.params.particleCount
    
    for (let i = 0; i < count; i++) {
      const colorIndex = Math.floor(Math.random() * theme.colors.length)
      const color = new THREE.Color(theme.colors[colorIndex])
      
      const nextColorIndex = (colorIndex + 1) % theme.colors.length
      const nextColor = new THREE.Color(theme.colors[nextColorIndex])
      const mixFactor = Math.random()
      
      color.lerp(nextColor, mixFactor)
      
      this.colors[i * 3] = color.r
      this.colors[i * 3 + 1] = color.g
      this.colors[i * 3 + 2] = color.b
    }
    
    this.particleGeometry.attributes.color.needsUpdate = true
  }
  
  public update(deltaTime: number): void {
    this.time += deltaTime
    
    if (!this.positions || !this.particleGeometry || !this.originalPositions) return
    
    const count = this.params.particleCount
    const colorSpeed = this.params.colorSpeed
    
    this.colorHue += deltaTime * colorSpeed * 0.1
    
    const breathIntensity = 0.6 + 0.4 * (Math.sin(this.time * 0.5) * 0.5 + 0.5)
    
    if (this.particleMaterial) {
      this.particleMaterial.opacity = 0.7 * breathIntensity
    }
    
    const autoRotationSpeed = (Math.PI * 2) / 10
    const rotationAngle = autoRotationSpeed * deltaTime
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      const vel = this.velocities[i]
      this.positions[i3] += vel.x * deltaTime * 5
      this.positions[i3 + 1] += vel.y * deltaTime * 5
      this.positions[i3 + 2] += vel.z * deltaTime * 5
      
      const driftOffset = Math.sin(this.time * 0.3 + this.phaseOffsets![i]) * 0.02
      this.positions[i3 + 1] += driftOffset
      
      const cos = Math.cos(rotationAngle)
      const sin = Math.sin(rotationAngle)
      const x = this.positions[i3]
      const z = this.positions[i3 + 2]
      this.positions[i3] = x * cos - z * sin
      this.positions[i3 + 2] = x * sin + z * cos
      
      const distFromCenter = Math.sqrt(
        this.positions[i3] ** 2 + 
        this.positions[i3 + 1] ** 2 + 
        this.positions[i3 + 2] ** 2
      )
      
      if (distFromCenter > this.spiralRadius * 1.5) {
        const scale = (this.spiralRadius * 0.8) / distFromCenter
        this.positions[i3] *= scale
        this.positions[i3 + 1] *= scale
        this.positions[i3 + 2] *= scale
      }
    }
    
    this.particleGeometry.attributes.position.needsUpdate = true
    
    if (Math.floor(this.time * 10) % 3 === 0) {
      this.updateLines()
    }
    
    this.updateRipples(deltaTime)
    
    if (this.backgroundStars) {
      this.backgroundStars.rotation.y += deltaTime * 0.02
    }
  }
  
  public createRipple(position: THREE.Vector3): void {
    const geometry = new THREE.RingGeometry(0.1, 0.5, 64)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.lookAt(new THREE.Vector3(0, 0, 0))
    
    this.scene.add(mesh)
    
    this.ripples.push({
      position: position.clone(),
      currentRadius: 0.5,
      maxRadius: 50,
      startTime: this.time,
      duration: 1.0,
      mesh
    })
    
    const vignette = document.getElementById('vignette-overlay')
    if (vignette) {
      vignette.classList.add('active')
      setTimeout(() => {
        vignette.classList.remove('active')
      }, 300)
    }
  }
  
  private updateRipples(deltaTime: number): void {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const ripple = this.ripples[i]
      const elapsed = this.time - ripple.startTime
      const progress = elapsed / ripple.duration
      
      if (progress >= 1) {
        this.scene.remove(ripple.mesh)
        ripple.mesh.geometry.dispose()
        ;(ripple.mesh.material as THREE.Material).dispose()
        this.ripples.splice(i, 1)
        continue
      }
      
      const currentRadius = ripple.maxRadius * progress
      const tubeWidth = 2 + progress * 3
      
      const newGeometry = new THREE.RingGeometry(
        Math.max(0.1, currentRadius - tubeWidth / 2),
        currentRadius + tubeWidth / 2,
        64
      )
      
      ripple.mesh.geometry.dispose()
      ripple.mesh.geometry = newGeometry
      
      const material = ripple.mesh.material as THREE.MeshBasicMaterial
      material.opacity = 0.6 * (1 - progress)
    }
  }
  
  public getParticleSystem(): THREE.Points | null {
    return this.particles
  }
  
  public dispose(): void {
    if (this.particles) {
      this.scene.remove(this.particles)
      this.particleGeometry?.dispose()
      this.particleMaterial?.dispose()
    }
    
    if (this.lines) {
      this.scene.remove(this.lines)
      this.lineGeometry?.dispose()
      this.lineMaterial?.dispose()
    }
    
    if (this.backgroundStars) {
      this.scene.remove(this.backgroundStars)
      this.backgroundStars.geometry.dispose()
      ;(this.backgroundStars.material as THREE.Material).dispose()
    }
    
    this.ripples.forEach(ripple => {
      this.scene.remove(ripple.mesh)
      ripple.mesh.geometry.dispose()
      ;(ripple.mesh.material as THREE.Material).dispose()
    })
    
    this.spriteTexture?.dispose()
  }
}
