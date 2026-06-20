import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Disease, RepairParams } from '../store'

interface ParticleData {
  baseSize: number
  baseY: number
  phase: number
}

export class ThreeScene {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private artifactModel: THREE.Group | null = null
  private particleSystems: Map<string, THREE.Points> = new Map()
  private repairMeshes: Map<string, THREE.Mesh> = new Map()
  private particleData: Map<string, ParticleData[]> = new Map()
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private hoveredDiseaseId: string | null = null
  private animationFrameId: number | null = null
  private lastTime: number = 0
  private targetRepairOpacity: number = 0
  private currentRepairOpacity: number = 0
  private diseases: Disease[] = []
  private highlightedId: string | null = null
  private repairParams: RepairParams = { material: 'epoxy', fillLevel: 50 }

  public onHoverChange: ((disease: Disease | null, screenPos?: { x: number; y: number }) => void) | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a0f0a)

    const { clientWidth, clientHeight } = container
    this.camera = new THREE.PerspectiveCamera(45, clientWidth / clientHeight, 0.1, 1000)
    this.camera.position.set(0, 0.5, 3.5)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(clientWidth, clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 2
    this.controls.maxDistance = 8
    this.controls.target.set(0, 0, 0)

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.setupLighting()
    this.createArtifactModel()
    this.setupEventListeners()
    this.animate()
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x403020, 0.4)
    this.scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.0)
    keyLight.position.set(5, 8, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 50
    this.scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x8b7355, 0.5)
    fillLight.position.set(-5, 3, -3)
    this.scene.add(fillLight)

    const rimLight = new THREE.PointLight(0xb8860b, 0.8, 10)
    rimLight.position.set(0, 2, -4)
    this.scene.add(rimLight)

    const spotLight = new THREE.SpotLight(0xffe4b5, 1.5)
    spotLight.position.set(0, 4, 2)
    spotLight.angle = Math.PI / 6
    spotLight.penumbra = 0.3
    spotLight.castShadow = true
    this.scene.add(spotLight)
  }

  private createArtifactModel(): void {
    this.artifactModel = new THREE.Group()

    const bodyGeometry = new THREE.SphereGeometry(1, 64, 64)
    const positions = bodyGeometry.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)
      const noise = Math.sin(x * 4) * Math.cos(y * 4) * Math.sin(z * 4) * 0.08
      positions.setX(i, x * (1 + noise))
      positions.setY(i, y * (1 + noise * 0.8))
      positions.setZ(i, z * (1 + noise))
    }
    bodyGeometry.computeVertexNormals()

    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x8b7355,
      transparent: true,
      opacity: 0.55,
      roughness: 0.8,
      metalness: 0.1,
      transmission: 0.3,
      thickness: 0.5,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      side: THREE.DoubleSide
    })

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.castShadow = true
    body.receiveShadow = true
    this.artifactModel.add(body)

    const innerGeometry = new THREE.SphereGeometry(0.7, 48, 48)
    const innerPositions = innerGeometry.attributes.position
    for (let i = 0; i < innerPositions.count; i++) {
      const x = innerPositions.getX(i)
      const y = innerPositions.getY(i)
      const z = innerPositions.getZ(i)
      const noise = Math.sin(x * 6) * Math.cos(y * 6) * Math.sin(z * 6) * 0.1
      innerPositions.setX(i, x * (1 + noise))
      innerPositions.setY(i, y * (1 + noise))
      innerPositions.setZ(i, z * (1 + noise))
    }
    innerGeometry.computeVertexNormals()

    const innerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x5c4033,
      transparent: true,
      opacity: 0.3,
      roughness: 0.9,
      side: THREE.BackSide
    })

    const inner = new THREE.Mesh(innerGeometry, innerMaterial)
    this.artifactModel.add(inner)

    const baseGeometry = new THREE.CylinderGeometry(1.1, 1.3, 0.2, 64)
    const baseMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3d2817,
      roughness: 0.7,
      metalness: 0.2
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = -1.1
    base.castShadow = true
    base.receiveShadow = true
    this.artifactModel.add(base)

    this.scene.add(this.artifactModel)
  }

  public updateDiseases(diseases: Disease[]): void {
    this.clearParticleSystems()
    this.diseases = diseases
    this.createParticleSystems(diseases)
    this.createRepairMeshes(diseases)
  }

  public updateHighlighted(highlightedId: string | null): void {
    this.highlightedId = highlightedId
    this.updateParticleHighlighting()
  }

  public updateRepairParams(params: RepairParams): void {
    this.repairParams = params
    this.targetRepairOpacity = params.fillLevel / 100
    this.updateRepairMeshes()
  }

  private clearParticleSystems(): void {
    this.particleSystems.forEach((points) => {
      this.scene.remove(points)
      points.geometry.dispose()
      if (Array.isArray(points.material)) {
        points.material.forEach(m => m.dispose())
      } else {
        points.material.dispose()
      }
    })
    this.particleSystems.clear()
    this.particleData.clear()

    this.repairMeshes.forEach((mesh) => {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material.dispose()
      }
    })
    this.repairMeshes.clear()
  }

  private createParticleSystems(diseases: Disease[]): void {
    const maxParticles = 500
    const particlesPerDisease = Math.floor(maxParticles / diseases.length)

    diseases.forEach((disease) => {
      const particleCount = Math.min(particlesPerDisease, 60)
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const sizes = new Float32Array(particleCount)
      const data: ParticleData[] = []

      const color = new THREE.Color(disease.color)

      for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const rOffset = (Math.random() - 0.5) * 0.15
        const r = 1 + rOffset

        const x = disease.position.x + r * Math.sin(phi) * Math.cos(theta) * 0.15
        const y = disease.position.y + r * Math.sin(phi) * Math.sin(theta) * 0.15
        const z = disease.position.z + r * Math.cos(phi) * 0.15

        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z

        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b

        const size = Math.random() * 0.15 + 0.05
        sizes[i] = size

        data.push({
          baseSize: size,
          baseY: y,
          phase: Math.random() * Math.PI * 2
        })
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      })

      const points = new THREE.Points(geometry, material)
      points.userData = { diseaseId: disease.id }
      this.scene.add(points)
      this.particleSystems.set(disease.id, points)
      this.particleData.set(disease.id, data)
    })
  }

  private createRepairMeshes(diseases: Disease[]): void {
    diseases.forEach((disease) => {
      const geometry = new THREE.SphereGeometry(0.12, 16, 16)
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0,
        roughness: 0.3,
        metalness: 0.5,
        emissive: 0xffd700,
        emissiveIntensity: 0.2
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(disease.position.x, disease.position.y, disease.position.z)
      mesh.visible = false
      mesh.userData = { diseaseId: disease.id }
      this.scene.add(mesh)
      this.repairMeshes.set(disease.id, mesh)
    })
  }

  private updateParticleHighlighting(): void {
    this.particleSystems.forEach((points, id) => {
      const material = points.material as THREE.PointsMaterial
      if (id === this.highlightedId) {
        material.opacity = 1.0
        material.size = 0.15
      } else if (this.highlightedId === null) {
        material.opacity = 0.9
        material.size = 0.1
      } else {
        material.opacity = 0.3
        material.size = 0.08
      }
    })
  }

  private updateRepairMeshes(): void {
    this.repairMeshes.forEach((mesh, id) => {
      const material = mesh.material as THREE.MeshPhysicalMaterial
      const disease = this.diseases.find(d => d.id === id)
      if (disease) {
        material.color.set(this.getMaterialColor())
        material.emissive.set(this.getMaterialColor())
        mesh.visible = true
        const scale = 0.8 + (this.repairParams.fillLevel / 100) * 0.4
        mesh.scale.setScalar(scale)
      }
    })
  }

  private getMaterialColor(): THREE.Color {
    switch (this.repairParams.material) {
      case 'epoxy':
        return new THREE.Color(0xd4a574)
      case 'acrylate':
        return new THREE.Color(0xf5f5f5)
      case 'nanoCalcium':
        return new THREE.Color(0xe8e4d9)
      default:
        return new THREE.Color(0xffd700)
    }
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      this.checkHover(event.clientX, event.clientY)
    })

    canvas.addEventListener('mouseleave', () => {
      this.hoveredDiseaseId = null
      if (this.onHoverChange) {
        this.onHoverChange(null)
      }
    })

    window.addEventListener('resize', this.onResize.bind(this))
  }

  private checkHover(screenX: number, screenY: number): void {
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const allPoints = Array.from(this.particleSystems.values())
    const intersects = this.raycaster.intersectObjects(allPoints, false)

    if (intersects.length > 0) {
      const points = intersects[0].object as THREE.Points
      const diseaseId = points.userData.diseaseId
      if (diseaseId !== this.hoveredDiseaseId) {
        this.hoveredDiseaseId = diseaseId
        const disease = this.diseases.find(d => d.id === diseaseId)
        if (this.onHoverChange && disease) {
          this.onHoverChange(disease, { x: screenX, y: screenY })
        }
      }
    } else if (this.hoveredDiseaseId !== null) {
      this.hoveredDiseaseId = null
      if (this.onHoverChange) {
        this.onHoverChange(null)
      }
    }
  }

  private onResize(): void {
    const { clientWidth, clientHeight } = this.container
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight)
  }

  private animate(time: number = 0): void {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this))

    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1)
    this.lastTime = time

    const pulseFrequency = 1.5
    const pulsePhase = time * 0.001 * pulseFrequency * Math.PI * 2

    this.particleSystems.forEach((points, diseaseId) => {
      const geometry = points.geometry
      const positions = geometry.attributes.position as THREE.BufferAttribute
      const sizes = geometry.attributes.size as THREE.BufferAttribute
      const data = this.particleData.get(diseaseId)

      if (data) {
        for (let i = 0; i < data.length; i++) {
          const particle = data[i]
          const pulse = Math.sin(pulsePhase + particle.phase) * 0.5 + 0.5
          const newSize = particle.baseSize * (0.7 + pulse * 0.6)
          sizes.setX(i, newSize)

          const floatY = particle.baseY + Math.sin(pulsePhase * 0.5 + particle.phase) * 0.03
          positions.setY(i, floatY)
        }
        sizes.needsUpdate = true
        positions.needsUpdate = true
      }

      const material = points.material as THREE.PointsMaterial
      const baseOpacity = diseaseId === this.highlightedId ? 1.0 : (this.highlightedId === null ? 0.9 : 0.3)
      material.opacity = baseOpacity * (0.6 + pulse * 0.4)
    })

    const opacityDelta = (this.targetRepairOpacity - this.currentRepairOpacity) * deltaTime * 2
    this.currentRepairOpacity += opacityDelta

    this.repairMeshes.forEach((mesh, id) => {
      const material = mesh.material as THREE.MeshPhysicalMaterial
      const isHighlighted = id === this.highlightedId || this.highlightedId === null
      material.opacity = this.currentRepairOpacity * (isHighlighted ? 0.8 : 0.4)
      material.emissiveIntensity = 0.1 + this.currentRepairOpacity * 0.2
    })

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
    window.removeEventListener('resize', this.onResize.bind(this))
    this.clearParticleSystems()
    this.controls.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
