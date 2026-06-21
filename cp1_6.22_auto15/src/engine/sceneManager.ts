import * as THREE from 'three'
import { PhysicsWorld } from './physicsWorld'
import * as CANNON from 'cannon-es'

export interface GameObject {
  id: string
  mesh: THREE.Mesh
  body: CANNON.Body
  originalPosition: THREE.Vector3
  originalRotation: THREE.Euler
  type: 'box' | 'sphere' | 'cylinder'
  color: number
  isDestroyed: boolean
}

export interface Fragment {
  mesh: THREE.Mesh
  body: CANNON.Body
  createdAt: number
  lifetime: number
}

export interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  createdAt: number
  lifetime: number
}

export class SceneManager {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  physicsWorld: PhysicsWorld
  
  private fragments: Fragment[] = []
  private particles: Particle[] = []
  private explosionLights: THREE.PointLight[] = []
  private groundMesh: THREE.Mesh | null = null
  
  private gridHelper: THREE.GridHelper | null = null
  
  private maxFragments: number = 200
  private activeFragmentCount: number = 0

  constructor(container: HTMLElement, physicsWorld: PhysicsWorld) {
    this.physicsWorld = physicsWorld
    
    this.scene = new THREE.Scene()
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 8, 20)
    this.camera.lookAt(0, 2, 0)
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    
    container.appendChild(this.renderer.domElement)
    
    this.setupSkybox()
    this.setupLighting()
    this.setupGround()
    
    window.addEventListener('resize', () => this.onResize(container))
  }

  private setupSkybox(): void {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#1a0a2e')
    gradient.addColorStop(0.5, '#2d1b4e')
    gradient.addColorStop(1, '#16213e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    this.scene.background = texture
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x6b5b95, 0.4)
    this.scene.add(ambientLight)
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(10, 20, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 50
    mainLight.shadow.camera.left = -20
    mainLight.shadow.camera.right = 20
    mainLight.shadow.camera.top = 20
    mainLight.shadow.camera.bottom = -20
    mainLight.shadow.bias = -0.0001
    this.scene.add(mainLight)
    
    const fillLight = new THREE.DirectionalLight(0x9370db, 0.3)
    fillLight.position.set(-10, 10, -10)
    this.scene.add(fillLight)
    
    const rimLight = new THREE.PointLight(0xff6b9d, 0.5, 30)
    rimLight.position.set(0, 5, -10)
    this.scene.add(rimLight)
  }

  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(100, 100)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2
    })
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial)
    this.groundMesh.rotation.x = -Math.PI / 2
    this.groundMesh.receiveShadow = true
    this.scene.add(this.groundMesh)
    
    this.gridHelper = new THREE.GridHelper(50, 50, 0x6b5b95, 0x3d2d5c)
    this.gridHelper.position.y = 0.01
    this.scene.add(this.gridHelper)
    
    const groundShape = new CANNON.Plane()
    const groundBody = new CANNON.Body({ mass: 0 })
    groundBody.addShape(groundShape)
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    groundBody.position.y = 0
    this.physicsWorld.addBody(groundBody)
  }

  createBox(
    position: THREE.Vector3,
    size: THREE.Vector3,
    color: number,
    mass: number = 1
  ): { mesh: THREE.Mesh; body: CANNON.Body } {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z)
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.7
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
    
    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2))
    const body = new CANNON.Body({ mass })
    body.addShape(shape)
    body.position.set(position.x, position.y, position.z)
    this.physicsWorld.addBody(body)
    
    return { mesh, body }
  }

  createSphere(
    position: THREE.Vector3,
    radius: number,
    color: number,
    mass: number = 1
  ): { mesh: THREE.Mesh; body: CANNON.Body } {
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.2,
      metalness: 0.8
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
    
    const shape = new CANNON.Sphere(radius)
    const body = new CANNON.Body({ mass })
    body.addShape(shape)
    body.position.set(position.x, position.y, position.z)
    this.physicsWorld.addBody(body)
    
    return { mesh, body }
  }

  createCylinder(
    position: THREE.Vector3,
    radius: number,
    height: number,
    color: number,
    mass: number = 1
  ): { mesh: THREE.Mesh; body: CANNON.Body } {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32)
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.6
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.scene.add(mesh)
    
    const shape = new CANNON.Cylinder(radius, radius, height, 32)
    const body = new CANNON.Body({ mass })
    body.addShape(shape)
    body.position.set(position.x, position.y, position.z)
    this.physicsWorld.addBody(body)
    
    return { mesh, body }
  }

  shatterObject(
    position: THREE.Vector3,
    size: THREE.Vector3,
    color: number,
    objectType: 'box' | 'sphere' | 'cylinder'
  ): void {
    const fragmentCount = Math.min(15, Math.floor(this.maxFragments * 0.075))
    
    if (this.activeFragmentCount + fragmentCount > this.maxFragments) {
      this.cleanupOldFragments(fragmentCount)
    }
    
    for (let i = 0; i < fragmentCount; i++) {
      const fragmentSize = new THREE.Vector3(
        size.x * (0.15 + Math.random() * 0.25),
        size.y * (0.15 + Math.random() * 0.25),
        size.z * (0.15 + Math.random() * 0.25)
      )
      
      let geometry: THREE.BufferGeometry
      let shape: CANNON.Shape
      
      const shapeType = Math.floor(Math.random() * 3)
      if (shapeType === 0) {
        geometry = new THREE.BoxGeometry(fragmentSize.x, fragmentSize.y, fragmentSize.z)
        shape = new CANNON.Box(new CANNON.Vec3(fragmentSize.x / 2, fragmentSize.y / 2, fragmentSize.z / 2))
      } else if (shapeType === 1) {
        const radius = Math.min(fragmentSize.x, fragmentSize.y, fragmentSize.z) / 2
        geometry = new THREE.SphereGeometry(radius, 8, 8)
        shape = new CANNON.Sphere(radius)
      } else {
        const radius = Math.min(fragmentSize.x, fragmentSize.z) / 2
        geometry = new THREE.CylinderGeometry(radius * 0.8, radius, fragmentSize.y, 8)
        shape = new CANNON.Cylinder(radius * 0.8, radius, fragmentSize.y, 8)
      }
      
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.5,
        transparent: true,
        opacity: 1
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * size.x * 0.5,
        (Math.random() - 0.5) * size.y * 0.5,
        (Math.random() - 0.5) * size.z * 0.5
      )
      mesh.position.copy(position).add(offset)
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      
      this.scene.add(mesh)
      
      const mass = 0.2 + Math.random() * 0.3
      const body = new CANNON.Body({ mass })
      body.addShape(shape)
      body.position.set(mesh.position.x, mesh.position.y, mesh.position.z)
      body.quaternion.setFromEuler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z)
      
      const force = 3 + Math.random() * 5
      const direction = new CANNON.Vec3(
        (Math.random() - 0.5) * 2,
        0.3 + Math.random() * 0.7,
        (Math.random() - 0.5) * 2
      )
      direction.normalize()
      body.velocity.set(
        direction.x * force,
        direction.y * force,
        direction.z * force
      )
      body.angularVelocity.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      )
      
      body.linearDamping = 0.1
      body.angularDamping = 0.1
      
      this.physicsWorld.addBody(body)
      
      this.fragments.push({
        mesh,
        body,
        createdAt: performance.now(),
        lifetime: 1000
      })
      
      this.activeFragmentCount++
    }
    
    this.playShatterSound()
  }

  private cleanupOldFragments(needed: number): void {
    const sorted = [...this.fragments].sort((a, b) => a.createdAt - b.createdAt)
    let removed = 0
    
    for (const fragment of sorted) {
      if (removed >= needed) break
      this.removeFragment(fragment)
      removed++
    }
  }

  private removeFragment(fragment: Fragment): void {
    this.scene.remove(fragment.mesh)
    this.physicsWorld.removeBody(fragment.body)
    
    const index = this.fragments.indexOf(fragment)
    if (index > -1) {
      this.fragments.splice(index, 1)
      this.activeFragmentCount--
    }
    
    if (fragment.mesh.geometry) {
      fragment.mesh.geometry.dispose()
    }
    if (fragment.mesh.material instanceof THREE.Material) {
      fragment.mesh.material.dispose()
    }
  }

  createExplosion(position: THREE.Vector3, radius: number = 8, force: number = 30): void {
    const flashLight = new THREE.PointLight(0xffffff, 5, radius * 3)
    flashLight.position.copy(position)
    this.scene.add(flashLight)
    this.explosionLights.push(flashLight)
    
    const particleCount = 30
    for (let i = 0; i < particleCount; i++) {
      const size = 0.1 + Math.random() * 0.3
      const geometry = new THREE.SphereGeometry(size, 6, 6)
      const material = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xff6b35 : 0xffd93d,
        transparent: true,
        opacity: 1
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)
      this.scene.add(mesh)
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1.5 + 0.5,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(5 + Math.random() * 10)
      
      this.particles.push({
        mesh,
        velocity,
        createdAt: performance.now(),
        lifetime: 500 + Math.random() * 500
      })
    }
    
    this.playExplosionSound()
    
    setTimeout(() => {
      const index = this.explosionLights.indexOf(flashLight)
      if (index > -1) {
        this.scene.remove(flashLight)
        this.explosionLights.splice(index, 1)
      }
    }, 300)
  }

  createDustParticles(position: THREE.Vector3): void {
    const count = 12
    for (let i = 0; i < count; i++) {
      const size = 0.15 + Math.random() * 0.2
      const geometry = new THREE.SphereGeometry(size, 6, 6)
      const material = new THREE.MeshBasicMaterial({
        color: 0x8b7355,
        transparent: true,
        opacity: 0.6
      })
      const mesh = new THREE.Mesh(geometry, material)
      
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0.1 + Math.random() * 0.5,
        (Math.random() - 0.5) * 2
      )
      mesh.position.copy(position).add(offset)
      this.scene.add(mesh)
      
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        1 + Math.random() * 2,
        (Math.random() - 0.5) * 2
      )
      
      this.particles.push({
        mesh,
        velocity,
        createdAt: performance.now(),
        lifetime: 800 + Math.random() * 400
      })
    }
  }

  private playShatterSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const filter = audioContext.createBiquadFilter()
      
      filter.type = 'highpass'
      filter.frequency.value = 800
      
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15)
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15)
      
      oscillator.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.15)
    } catch (e) {
      // Audio not supported
    }
  }

  private playExplosionSound(): void {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const oscillator1 = audioContext.createOscillator()
      const gainNode1 = audioContext.createGain()
      oscillator1.type = 'sawtooth'
      oscillator1.frequency.setValueAtTime(150, audioContext.currentTime)
      oscillator1.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.5)
      gainNode1.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode1.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)
      oscillator1.connect(gainNode1)
      gainNode1.connect(audioContext.destination)
      oscillator1.start()
      oscillator1.stop(audioContext.currentTime + 0.5)
      
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()
      const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.3, audioContext.sampleRate)
      const noiseData = noiseBuffer.getChannelData(0)
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1
      }
      const noise = audioContext.createBufferSource()
      noise.buffer = noiseBuffer
      const noiseGain = audioContext.createGain()
      noiseGain.gain.setValueAtTime(0.15, audioContext.currentTime)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
      noise.connect(noiseGain)
      noiseGain.connect(audioContext.destination)
      noise.start()
      noise.stop(audioContext.currentTime + 0.3)
    } catch (e) {
      // Audio not supported
    }
  }

  update(deltaTime: number): void {
    const now = performance.now()
    
    for (let i = this.fragments.length - 1; i >= 0; i--) {
      const fragment = this.fragments[i]
      
      fragment.mesh.position.copy(fragment.body.position as any)
      fragment.mesh.quaternion.copy(fragment.body.quaternion as any)
      
      const elapsed = now - fragment.createdAt
      const remaining = fragment.lifetime - elapsed
      
      if (remaining < 0) {
        this.removeFragment(fragment)
      } else if (remaining < 300) {
        const material = fragment.mesh.material as THREE.MeshStandardMaterial
        material.opacity = remaining / 300
      }
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      
      particle.velocity.y -= 15 * deltaTime
      particle.mesh.position.add(particle.velocity.clone().multiplyScalar(deltaTime))
      
      const elapsed = now - particle.createdAt
      const remaining = particle.lifetime - elapsed
      
      if (remaining < 0) {
        this.scene.remove(particle.mesh)
        this.particles.splice(i, 1)
        
        if (particle.mesh.geometry) {
          particle.mesh.geometry.dispose()
        }
        if (particle.mesh.material instanceof THREE.Material) {
          particle.mesh.material.dispose()
        }
      } else {
        const material = particle.mesh.material as THREE.MeshBasicMaterial
        material.opacity = Math.min(1, remaining / particle.lifetime * 2)
      }
    }
    
    for (const light of this.explosionLights) {
      light.intensity = Math.max(0, light.intensity - deltaTime * 15)
    }
    
    this.renderer.render(this.scene, this.camera)
  }

  private onResize(container: HTMLElement): void {
    this.camera.aspect = container.clientWidth / container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(container.clientWidth, container.clientHeight)
  }

  dispose(): void {
    for (const fragment of this.fragments) {
      this.scene.remove(fragment.mesh)
      this.physicsWorld.removeBody(fragment.body)
      if (fragment.mesh.geometry) fragment.mesh.geometry.dispose()
      if (fragment.mesh.material instanceof THREE.Material) fragment.mesh.material.dispose()
    }
    this.fragments = []
    
    for (const particle of this.particles) {
      this.scene.remove(particle.mesh)
      if (particle.mesh.geometry) particle.mesh.geometry.dispose()
      if (particle.mesh.material instanceof THREE.Material) particle.mesh.material.dispose()
    }
    this.particles = []
    
    this.renderer.dispose()
  }
}
