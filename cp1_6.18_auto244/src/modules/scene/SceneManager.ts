import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ParticleEngine } from '../particle/ParticleEngine'
import { Particle } from '../particle/types'
import { CONSTELLATION_TEMPLATES } from '../constellations/templates'
import { useStore } from '../../store/useStore'

export class SceneManager {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private engine: ParticleEngine
  private particleGroup: THREE.Group
  private particleMeshes: Map<number, THREE.Mesh> = new Map()
  private trailMeshes: Map<number, THREE.Line> = new Map()
  private connectionLines: THREE.LineSegments | null = null
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private mouseWorld: THREE.Vector3
  private isDragging: boolean = false
  private draggedParticleId: number | null = null
  private dragOffset: THREE.Vector3 = new THREE.Vector3()
  private dragPlane: THREE.Plane = new THREE.Plane()
  private animationFrameId: number = 0
  private clock: THREE.Clock
  private startTime: number = 0
  private rotateGroup: THREE.Group
  private backgroundStars: THREE.Points | null = null
  private resizeObserver: ResizeObserver | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.clock = new THREE.Clock()
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.mouseWorld = new THREE.Vector3()

    this.engine = new ParticleEngine({ particleCount: 200 })
    this.updateStoreEngineRef()

    this.setupRenderer()
    this.setupCamera()
    this.setupControls()
    this.setupBackground()
    this.setupLights()

    this.rotateGroup = new THREE.Group()
    this.scene.add(this.rotateGroup)

    this.particleGroup = new THREE.Group()
    this.rotateGroup.add(this.particleGroup)

    this.createParticles()
    this.createConnectionLines()
    this.createBackgroundStars()
    this.setupEventListeners()
    this.startAnimation()
  }

  private updateStoreEngineRef() {
    const state = useStore.getState()
    if (!state.engineRef) {
      useStore.setState({ engineRef: this.engine } as any)
    }
  }

  private setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setClearColor(0x120e1e, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.container.appendChild(this.renderer.domElement)
  }

  private setupCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000)
    this.camera.position.set(0, 50, 500)
  }

  private setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 100
    this.controls.maxDistance = 1200
    this.controls.enablePan = true
    this.controls.rotateSpeed = 0.8
    this.controls.zoomSpeed = 0.8
  }

  private setupBackground() {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#1A1628')
    gradient.addColorStop(0.5, '#161222')
    gradient.addColorStop(1, '#120E1E')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 512)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    this.scene.background = texture
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambient)

    const pointLight1 = new THREE.PointLight(0x6c63ff, 1, 1000)
    pointLight1.position.set(300, 200, 300)
    this.scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x9b59b6, 0.8, 1000)
    pointLight2.position.set(-300, -100, -200)
    this.scene.add(pointLight2)
  }

  private createParticles() {
    const particles = this.engine.getParticles()
    for (const p of particles) {
      const mesh = this.createParticleMesh(p)
      this.particleGroup.add(mesh)
      this.particleMeshes.set(p.id, mesh)
    }
  }

  private createParticleMesh(particle: Particle): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(particle.radius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
    const material = new THREE.MeshStandardMaterial({
      color: particle.color,
      emissive: particle.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.95,
      roughness: 0.2,
      metalness: 0.1,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(particle.position)
    mesh.userData = { particleId: particle.id }

    const glowGeometry = new THREE.SphereGeometry(particle.radius * 2.5, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: particle.color,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    mesh.add(glow)

    return mesh
  }

  private createConnectionLines() {
    const maxConnections = 2000
    const positions = new Float32Array(maxConnections * 6)
    const colors = new Float32Array(maxConnections * 6)
    const opacities = new Float32Array(maxConnections * 2)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 1,
    })

    this.connectionLines = new THREE.LineSegments(geometry, material)
    this.connectionLines.userData = { opacities }
    this.particleGroup.add(this.connectionLines)
  }

  private createBackgroundStars() {
    const starCount = 1500
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      const r = 800 + Math.random() * 600
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      const brightness = 0.3 + Math.random() * 0.7
      colors[i * 3] = brightness
      colors[i * 3 + 1] = brightness
      colors[i * 3 + 2] = brightness + Math.random() * 0.1

      sizes[i] = 0.5 + Math.random() * 1.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.backgroundStars = new THREE.Points(geometry, material)
    this.scene.add(this.backgroundStars)
  }

  private setupEventListeners() {
    const dom = this.renderer.domElement

    dom.addEventListener('pointerdown', this.onPointerDown)
    dom.addEventListener('pointermove', this.onPointerMove)
    dom.addEventListener('pointerup', this.onPointerUp)
    dom.addEventListener('pointerleave', this.onPointerUp)
    dom.addEventListener('click', this.onClick)

    this.resizeObserver = new ResizeObserver(() => {
      this.onWindowResize()
    })
    this.resizeObserver.observe(this.container)
  }

  private updateMouseNDC(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  private getMouseWorldPosition(z: number = 0): THREE.Vector3 {
    const ndc = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5)
    ndc.unproject(this.camera)
    const dir = ndc.sub(this.camera.position).normalize()
    const distance = (z - this.camera.position.z) / dir.z
    return this.camera.position.clone().add(dir.multiplyScalar(distance))
  }

  private onPointerDown = (event: PointerEvent) => {
    this.updateMouseNDC(event.clientX, event.clientY)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const meshes = Array.from(this.particleMeshes.values())
    const intersects = this.raycaster.intersectObjects(meshes, false)

    if (intersects.length > 0) {
      const hit = intersects[0]
      const particleId = hit.object.userData.particleId
      if (particleId !== undefined) {
        this.isDragging = true
        this.draggedParticleId = particleId
        this.controls.enabled = false

        const cameraDir = new THREE.Vector3()
        this.camera.getWorldDirection(cameraDir)
        this.dragPlane.setFromNormalAndCoplanarPoint(
          cameraDir.negate(),
          hit.point
        )

        const intersection = new THREE.Vector3()
        this.raycaster.ray.intersectPlane(this.dragPlane, intersection)
        if (intersection) {
          const particle = this.engine.getParticles().find(p => p.id === particleId)
          if (particle) {
            this.dragOffset.copy(particle.position).sub(intersection)
          }
        }

        this.engine.setDragging(particleId, true)
        this.renderer.domElement.setPointerCapture(event.pointerId)
      }
    }
  }

  private onPointerMove = (event: PointerEvent) => {
    this.updateMouseNDC(event.clientX, event.clientY)

    const worldPos = this.getMouseWorldPosition(0)
    const localPos = worldPos.clone()
    this.rotateGroup.worldToLocal(localPos)
    this.engine.mouseWorldPos.copy(localPos)

    if (this.isDragging && this.draggedParticleId !== null) {
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const intersection = new THREE.Vector3()
      this.raycaster.ray.intersectPlane(this.dragPlane, intersection)

      if (intersection) {
        const targetLocal = intersection.clone().add(this.dragOffset)
        this.rotateGroup.worldToLocal(targetLocal)
        this.engine.moveParticleTo(this.draggedParticleId, targetLocal, true)
      }
    }
  }

  private onPointerUp = (event: PointerEvent) => {
    if (this.isDragging && this.draggedParticleId !== null) {
      this.engine.setDragging(this.draggedParticleId, false)
      this.renderer.domElement.releasePointerCapture?.(event.pointerId)
    }
    this.isDragging = false
    this.draggedParticleId = null
    this.controls.enabled = true
  }

  private onClick = (event: PointerEvent) => {
    if (this.isDragging) return

    this.updateMouseNDC(event.clientX, event.clientY)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const meshes = Array.from(this.particleMeshes.values())
    const intersects = this.raycaster.intersectObjects(meshes, false)

    let selectedId: number | null = null

    if (intersects.length > 0) {
      const particleId = intersects[0].object.userData.particleId
      if (particleId !== undefined) {
        selectedId = particleId
      }
    }

    this.engine.selectParticle(selectedId)
    this.updateSelectedInfo(selectedId)
  }

  private updateSelectedInfo(id: number | null) {
    if (id === null) {
      useStore.getState().setSelectedParticle(null)
      return
    }

    const particle = this.engine.getParticles().find(p => p.id === id)
    if (!particle) return

    const worldPos = particle.position.clone()
    this.rotateGroup.localToWorld(worldPos)

    useStore.getState().setSelectedParticle({
      id,
      position: {
        x: Math.round(worldPos.x * 100) / 100,
        y: Math.round(worldPos.y * 100) / 100,
        z: Math.round(worldPos.z * 100) / 100,
      },
      kineticEnergy: Math.round(this.engine.getKineticEnergy(id) * 100) / 100,
    })
  }

  private onWindowResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  private updateParticleVisuals() {
    const particles = this.engine.getParticles()
    const selectedScale = 1.5
    const goldColor = new THREE.Color(0xffd700)

    for (const p of particles) {
      const mesh = this.particleMeshes.get(p.id)
      if (!mesh) continue

      mesh.position.copy(p.position)

      const material = mesh.material as THREE.MeshStandardMaterial
      const glowMesh = mesh.children[0] as THREE.Mesh
      const glowMaterial = glowMesh.material as THREE.MeshBasicMaterial

      if (p.state === 'selected' || p.state === 'dragging') {
        material.color.copy(goldColor)
        material.emissive.copy(goldColor)
        material.emissiveIntensity = 1.2
        glowMaterial.color.copy(goldColor)
        glowMaterial.opacity = 0.3
        mesh.scale.setScalar(selectedScale)
      } else {
        material.color.copy(p.color)
        material.emissive.copy(p.color)
        material.emissiveIntensity = 0.8
        glowMaterial.color.copy(p.color)
        glowMaterial.opacity = 0.15
        mesh.scale.setScalar(1)
      }

      this.updateTrail(p)
    }
  }

  private updateTrail(particle: Particle) {
    const existingTrail = this.trailMeshes.get(particle.id)

    if (particle.trail.length < 2) {
      if (existingTrail) {
        this.particleGroup.remove(existingTrail)
        existingTrail.geometry.dispose()
        ;(existingTrail.material as THREE.Material).dispose()
        this.trailMeshes.delete(particle.id)
      }
      return
    }

    const positions = new Float32Array(particle.trail.length * 3)
    const colors = new Float32Array(particle.trail.length * 3)

    for (let i = 0; i < particle.trail.length; i++) {
      positions[i * 3] = particle.trail[i].x
      positions[i * 3 + 1] = particle.trail[i].y
      positions[i * 3 + 2] = particle.trail[i].z

      const alpha = 1 - i / particle.trail.length
      const trailColor = particle.state === 'dragging' 
        ? new THREE.Color(0xffd700)
        : particle.color.clone()
      
      colors[i * 3] = trailColor.r * alpha
      colors[i * 3 + 1] = trailColor.g * alpha
      colors[i * 3 + 2] = trailColor.b * alpha
    }

    if (existingTrail) {
      const posAttr = existingTrail.geometry.getAttribute('position') as THREE.BufferAttribute
      const colorAttr = existingTrail.geometry.getAttribute('color') as THREE.BufferAttribute
      
      if (posAttr.count !== particle.trail.length) {
        existingTrail.geometry.dispose()
        const newGeometry = new THREE.BufferGeometry()
        newGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        newGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        existingTrail.geometry = newGeometry
      } else {
        posAttr.array.set(positions)
        posAttr.needsUpdate = true
        colorAttr.array.set(colors)
        colorAttr.needsUpdate = true
      }
    } else {
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })

      const line = new THREE.Line(geometry, material)
      this.particleGroup.add(line)
      this.trailMeshes.set(particle.id, line)
    }
  }

  private updateConnections() {
    if (!this.connectionLines) return

    const connections = this.engine.getConnections()
    const maxConnections = 2000
    const count = Math.min(connections.length, maxConnections)

    const geometry = this.connectionLines.geometry
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute

    const positions = posAttr.array as Float32Array
    const colors = colorAttr.array as Float32Array

    const colorStart = new THREE.Color(0x6c63ff)
    const colorEnd = new THREE.Color(0x9b59b6)

    for (let i = 0; i < count; i++) {
      const conn = connections[i]
      positions[i * 6] = conn.from.x
      positions[i * 6 + 1] = conn.from.y
      positions[i * 6 + 2] = conn.from.z
      positions[i * 6 + 3] = conn.to.x
      positions[i * 6 + 4] = conn.to.y
      positions[i * 6 + 5] = conn.to.z

      const t = conn.opacity / 0.6
      const r = colorStart.r + (colorEnd.r - colorStart.r) * t
      const g = colorStart.g + (colorEnd.g - colorStart.g) * t
      const b = colorStart.b + (colorEnd.b - colorStart.b) * t

      colors[i * 6] = r
      colors[i * 6 + 1] = g
      colors[i * 6 + 2] = b
      colors[i * 6 + 3] = r
      colors[i * 6 + 4] = g
      colors[i * 6 + 5] = b
    }

    geometry.setDrawRange(0, count * 2)
    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
  }

  public loadConstellation(id: string) {
    const template = CONSTELLATION_TEMPLATES.find(t => t.id === id)
    if (!template) return

    this.engine.startTransition(template.points)
    useStore.getState().setActiveConstellation(id)
  }

  public setDynamicMode(mode: 'free' | 'gravity') {
    this.engine.setDynamicMode(mode)
    useStore.getState().setDynamicMode(mode)
  }

  private startAnimation() {
    this.startTime = performance.now()
    this.animate()
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate)

    const delta = Math.min(this.clock.getDelta(), 0.05)
    const elapsed = (performance.now() - this.startTime) / 1000

    this.engine.update(delta)
    this.updateParticleVisuals()
    this.updateConnections()

    const angle = this.engine.getRotationAngle(elapsed)
    this.rotateGroup.rotation.y = angle

    if (this.backgroundStars) {
      this.backgroundStars.rotation.y = -angle * 0.1
    }

    const selectedId = this.engine.getSelectedParticleId()
    if (selectedId !== null) {
      this.updateSelectedInfo(selectedId)
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId)
    this.resizeObserver?.disconnect()

    const dom = this.renderer.domElement
    dom.removeEventListener('pointerdown', this.onPointerDown)
    dom.removeEventListener('pointermove', this.onPointerMove)
    dom.removeEventListener('pointerup', this.onPointerUp)
    dom.removeEventListener('pointerleave', this.onPointerUp)
    dom.removeEventListener('click', this.onClick)

    this.particleMeshes.forEach(mesh => {
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      mesh.children.forEach(child => {
        ;(child as THREE.Mesh).geometry.dispose()
        ;((child as THREE.Mesh).material as THREE.Material).dispose()
      })
    })

    this.trailMeshes.forEach(line => {
      line.geometry.dispose()
      ;(line.material as THREE.Material).dispose()
    })

    if (this.connectionLines) {
      this.connectionLines.geometry.dispose()
      ;(this.connectionLines.material as THREE.Material).dispose()
    }

    if (this.backgroundStars) {
      this.backgroundStars.geometry.dispose()
      ;(this.backgroundStars.material as THREE.Material).dispose()
    }

    this.controls.dispose()
    this.renderer.dispose()

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }

    useStore.setState({ engineRef: null } as any)
  }

  public getEngine(): ParticleEngine {
    return this.engine
  }
}
