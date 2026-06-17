import * as THREE from 'three'

export interface SceneOptions {
  cameraPosition?: THREE.Vector3
  minHeight?: number
  maxHeight?: number
  bottomRadius?: number
  topRadius?: number
  particleCount?: number
}

interface PitchData {
  pitchSequence: number[]
  volumeSequence: number[]
}

export class SceneRenderer {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private cylinders: THREE.Mesh[] = []
  private cylinderGlows: THREE.Mesh[] = []
  private particles: THREE.Points | null = null
  private particleData: { angle: number; radius: number; y: number; speed: number }[] = []
  private ground: THREE.Mesh | null = null
  private trailLines: THREE.Line[] = []
  private trailData: { positions: THREE.Vector3[]; line: THREE.Line }[] = []
  
  private isDragging: boolean = false
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private cameraAngleY: number = 0
  private cameraAngleX: number = 0
  private cameraDistance: number = 6
  
  private minAngleX: number = -30 * Math.PI / 180
  private maxAngleX: number = 45 * Math.PI / 180
  private minDistance: number = 2
  private maxDistance: number = 15
  
  private animationId: number = 0
  private particlesEnabled: boolean = true
  private trailsEnabled: boolean = false
  
  private colorStart = new THREE.Color(0xBB86FC)
  private colorEnd = new THREE.Color(0x03DAC6)
  
  private particleColors = [0xBB86FC, 0x03DAC6, 0xCF6679]

  constructor(container: HTMLElement, options: SceneOptions = {}) {
    this.container = container
    
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x121212)
    this.scene.fog = new THREE.Fog(0x121212, 8, 20)
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.cameraDistance = options.cameraPosition?.length() || 6
    this.updateCameraPosition()
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    
    container.appendChild(this.renderer.domElement)
    
    this.setupLighting()
    this.createGround()
    this.setupEventListeners()
    this.animate()
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambientLight)
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(5, 10, 5)
    this.scene.add(mainLight)
    
    const fillLight = new THREE.DirectionalLight(0xBB86FC, 0.3)
    fillLight.position.set(-5, 3, -5)
    this.scene.add(fillLight)
    
    const rimLight = new THREE.DirectionalLight(0x03DAC6, 0.4)
    rimLight.position.set(0, 5, -8)
    this.scene.add(rimLight)
  }

  private createGround() {
    const groundGeometry = new THREE.CircleGeometry(4, 64)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E1E2E,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    })
    
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.position.y = 0
    this.scene.add(this.ground)
    
    const gridHelper = new THREE.GridHelper(8, 32, 0x3A3A4A, 0x2A2A3A)
    gridHelper.position.y = 0.01
    this.scene.add(gridHelper)
  }

  private setupEventListeners() {
    const canvas = this.renderer.domElement
    
    canvas.addEventListener('mousedown', this.onMouseDown)
    canvas.addEventListener('mousemove', this.onMouseMove)
    canvas.addEventListener('mouseup', this.onMouseUp)
    canvas.addEventListener('mouseleave', this.onMouseUp)
    canvas.addEventListener('wheel', this.onWheel)
    
    canvas.addEventListener('touchstart', this.onTouchStart)
    canvas.addEventListener('touchmove', this.onTouchMove)
    canvas.addEventListener('touchend', this.onTouchEnd)
    
    window.addEventListener('resize', this.onResize)
  }

  private onMouseDown = (e: MouseEvent) => {
    this.isDragging = true
    this.previousMousePosition = { x: e.clientX, y: e.clientY }
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return
    
    const deltaX = e.clientX - this.previousMousePosition.x
    const deltaY = e.clientY - this.previousMousePosition.y
    
    this.cameraAngleY += deltaX * 0.01
    this.cameraAngleX += deltaY * 0.01
    this.cameraAngleX = Math.max(this.minAngleX, Math.min(this.maxAngleX, this.cameraAngleX))
    
    this.previousMousePosition = { x: e.clientX, y: e.clientY }
    this.updateCameraPosition()
  }

  private onMouseUp = () => {
    this.isDragging = false
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    this.cameraDistance += e.deltaY * 0.01
    this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance))
    this.updateCameraPosition()
  }

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this.isDragging = true
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  private onTouchMove = (e: TouchEvent) => {
    if (!this.isDragging || e.touches.length !== 1) return
    
    const deltaX = e.touches[0].clientX - this.previousMousePosition.x
    const deltaY = e.touches[0].clientY - this.previousMousePosition.y
    
    this.cameraAngleY += deltaX * 0.01
    this.cameraAngleX += deltaY * 0.01
    this.cameraAngleX = Math.max(this.minAngleX, Math.min(this.maxAngleX, this.cameraAngleX))
    
    this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    this.updateCameraPosition()
  }

  private onTouchEnd = () => {
    this.isDragging = false
  }

  private onResize = () => {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  private updateCameraPosition() {
    const x = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX)
    const y = this.cameraDistance * Math.sin(this.cameraAngleX) + 2
    const z = this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX)
    
    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 1, 0)
  }

  setPitchData(data: PitchData) {
    this.clearCylinders()
    this.createCylinders(data)
    this.createParticles()
  }

  private clearCylinders() {
    for (const cylinder of this.cylinders) {
      this.scene.remove(cylinder)
      cylinder.geometry.dispose()
      if (Array.isArray(cylinder.material)) {
        cylinder.material.forEach(m => m.dispose())
      } else {
        cylinder.material.dispose()
      }
    }
    this.cylinders = []
    
    for (const glow of this.cylinderGlows) {
      this.scene.remove(glow)
      glow.geometry.dispose()
      if (Array.isArray(glow.material)) {
        glow.material.forEach(m => m.dispose())
      } else {
        glow.material.dispose()
      }
    }
    this.cylinderGlows = []
    
    this.clearTrails()
  }
  
  private clearTrails() {
    for (const trail of this.trailData) {
      this.scene.remove(trail.line)
      trail.line.geometry.dispose()
      if (Array.isArray(trail.line.material)) {
        trail.line.material.forEach(m => m.dispose())
      } else {
        trail.line.material.dispose()
      }
    }
    this.trailData = []
    this.trailLines = []
  }

  private createCylinders(data: PitchData) {
    const { pitchSequence, volumeSequence } = data
    const count = Math.min(pitchSequence.length, 256)
    const minHeight = 0.2
    const maxHeight = 2.5
    const bottomRadius = 0.05
    const topRadius = 0.08
    
    const spiralTurns = 2.5
    const maxSpiralRadius = 3
    
    for (let i = 0; i < count; i++) {
      const pitch = pitchSequence[i]
      const volume = volumeSequence[i] || 0.5
      
      const height = minHeight + pitch * (maxHeight - minHeight)
      
      const angle = (i / count) * spiralTurns * Math.PI * 2
      const radiusRatio = i / count
      const spiralRadius = radiusRatio * maxSpiralRadius
      
      const x = Math.cos(angle) * spiralRadius
      const z = Math.sin(angle) * spiralRadius
      const y = height / 2
      
      const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 16)
      
      const color = new THREE.Color()
      color.lerpColors(this.colorStart, this.colorEnd, pitch)
      
      const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.4,
        emissive: color,
        emissiveIntensity: volume * 0.3
      })
      
      const cylinder = new THREE.Mesh(geometry, material)
      cylinder.position.set(x, y, z)
      cylinder.rotation.y = -angle
      
      this.scene.add(cylinder)
      this.cylinders.push(cylinder)
      
      const glowGeometry = new THREE.SphereGeometry(0.1, 16, 16)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
      })
      
      const glow = new THREE.Mesh(glowGeometry, glowMaterial)
      glow.position.set(x, height, z)
      
      this.scene.add(glow)
      this.cylinderGlows.push(glow)
    }
  }

  private createParticles() {
    if (this.particles) {
      this.scene.remove(this.particles)
      this.particles.geometry.dispose()
      if (Array.isArray(this.particles.material)) {
        this.particles.material.forEach(m => m.dispose())
      } else {
        this.particles.material.dispose()
      }
      this.particles = null
    }
    
    const particleCount = 200
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    
    this.particleData = []
    
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1 + Math.random() * 3
      const y = 0.5 + Math.random() * 2.5
      
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(angle) * radius
      
      const colorHex = this.particleColors[Math.floor(Math.random() * this.particleColors.length)]
      const color = new THREE.Color(colorHex)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      
      this.particleData.push({
        angle,
        radius,
        y,
        speed: 0.2 + Math.random() * 0.3
      })
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const material = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    })
    
    this.particles = new THREE.Points(geometry, material)
    this.scene.add(this.particles)
  }

  setParticlesEnabled(enabled: boolean) {
    this.particlesEnabled = enabled
    if (this.particles) {
      this.particles.visible = enabled
    }
  }

  setTrailsEnabled(enabled: boolean) {
    this.trailsEnabled = enabled
    if (this.trailData.length === 0 && enabled && this.cylinderGlows.length > 0) {
      this.createTrails()
    }
    for (const trail of this.trailData) {
      trail.line.visible = enabled
    }
  }
  
  private createTrails() {
    this.clearTrails()
    
    const trailCount = Math.min(this.cylinderGlows.length, 30)
    const trailLength = 20
    
    for (let i = 0; i < trailCount; i++) {
      const glowIndex = Math.floor(i * this.cylinderGlows.length / trailCount)
      const glow = this.cylinderGlows[glowIndex]
      const color = (glow.material as THREE.MeshBasicMaterial).color
      
      const positions: THREE.Vector3[] = []
      for (let j = 0; j < trailLength; j++) {
        positions.push(glow.position.clone())
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(positions)
      
      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
      })
      
      const line = new THREE.Line(geometry, material)
      line.visible = this.trailsEnabled
      
      this.scene.add(line)
      this.trailData.push({ positions, line })
      this.trailLines.push(line)
    }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate)
    
    const time = Date.now() * 0.001
    
    if (this.particles && this.particlesEnabled) {
      const positions = this.particles.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < this.particleData.length; i++) {
        const data = this.particleData[i]
        const newAngle = data.angle + time * data.speed * 0.2
        
        positions[i * 3] = Math.cos(newAngle) * data.radius
        positions[i * 3 + 2] = Math.sin(newAngle) * data.radius
        positions[i * 3 + 1] = data.y + Math.sin(time + i) * 0.1
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true
    }
    
    for (let i = 0; i < this.cylinderGlows.length; i++) {
      const glow = this.cylinderGlows[i]
      const pulse = 1 + Math.sin(time * 2 + i * 0.5) * 0.2
      glow.scale.setScalar(pulse)
      
      const material = glow.material as THREE.MeshBasicMaterial
      material.opacity = 0.6 + Math.sin(time * 3 + i * 0.3) * 0.2
    }
    
    if (this.trailsEnabled && this.trailData.length > 0) {
      const trailCount = this.trailData.length
      for (let i = 0; i < trailCount; i++) {
        const trail = this.trailData[i]
        const glowIndex = Math.floor(i * this.cylinderGlows.length / trailCount)
        const glow = this.cylinderGlows[glowIndex]
        
        for (let j = trail.positions.length - 1; j > 0; j--) {
          trail.positions[j].copy(trail.positions[j - 1])
        }
        trail.positions[0].copy(glow.position)
        
        const offsetAngle = time * 0.5 + i * 0.3
        const offsetRadius = 0.1 + Math.sin(time + i) * 0.05
        trail.positions[0].x += Math.cos(offsetAngle) * offsetRadius
        trail.positions[0].z += Math.sin(offsetAngle) * offsetRadius
        
        trail.line.geometry.setFromPoints(trail.positions)
        trail.line.geometry.attributes.position.needsUpdate = true
        
        const material = trail.line.material as THREE.LineBasicMaterial
        material.opacity = 0.4 + Math.sin(time * 2 + i) * 0.2
      }
    }
    
    this.renderer.render(this.scene, this.camera)
  }

  destroy() {
    cancelAnimationFrame(this.animationId)
    
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown)
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove)
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp)
    this.renderer.domElement.removeEventListener('mouseleave', this.onMouseUp)
    this.renderer.domElement.removeEventListener('wheel', this.onWheel)
    this.renderer.domElement.removeEventListener('touchstart', this.onTouchStart)
    this.renderer.domElement.removeEventListener('touchmove', this.onTouchMove)
    this.renderer.domElement.removeEventListener('touchend', this.onTouchEnd)
    
    window.removeEventListener('resize', this.onResize)
    
    this.clearCylinders()
    
    if (this.particles) {
      this.scene.remove(this.particles)
      this.particles.geometry.dispose()
      if (Array.isArray(this.particles.material)) {
        this.particles.material.forEach(m => m.dispose())
      } else {
        this.particles.material.dispose()
      }
    }
    
    if (this.ground) {
      this.scene.remove(this.ground)
      this.ground.geometry.dispose()
      if (Array.isArray(this.ground.material)) {
        this.ground.material.forEach(m => m.dispose())
      } else {
        this.ground.material.dispose()
      }
    }
    
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
