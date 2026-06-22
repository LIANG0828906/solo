import * as THREE from 'three'
import { Forge, Torch } from './Forge'
import { Rune, BurstParticles } from './Rune'
import { RuneType } from './types'

export class ForgeScene {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public forge: Forge
  private torches: Torch[] = []
  private runesInForge: Rune[] = []
  private burstParticles: BurstParticles[] = []
  private clock: THREE.Clock
  private container: HTMLElement
  private animationId: number | null = null
  private temperature: number = 800

  constructor(container: HTMLElement) {
    this.container = container
    this.clock = new THREE.Clock()

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#1a1008')
    this.scene.fog = new THREE.Fog('#1a1008', 15, 30)

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    this.camera.position.set(0, 6, 10)
    this.camera.lookAt(0, 3, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    this.createEnvironment()

    this.forge = new Forge()
    this.scene.add(this.forge.mesh)

    this.createTorches()

    window.addEventListener('resize', this.onResize.bind(this))
  }

  private createEnvironment(): void {
    const floorGeometry = new THREE.PlaneGeometry(30, 30)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#5D4037'),
      roughness: 0.9,
      metalness: 0.1
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#4E342E'),
      roughness: 0.95,
      metalness: 0.05
    })

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 12),
      wallMaterial
    )
    backWall.position.set(0, 6, -12)
    backWall.receiveShadow = true
    this.scene.add(backWall)

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 12),
      wallMaterial
    )
    leftWall.position.set(-12, 6, 0)
    leftWall.rotation.y = Math.PI / 2
    leftWall.receiveShadow = true
    this.scene.add(leftWall)

    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 12),
      wallMaterial
    )
    rightWall.position.set(12, 6, 0)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.receiveShadow = true
    this.scene.add(rightWall)

    const ambientLight = new THREE.AmbientLight(0x403020, 0.4)
    this.scene.add(ambientLight)
  }

  private createTorches(): void {
    const torchPositions = [
      new THREE.Vector3(-8, 0, -10),
      new THREE.Vector3(8, 0, -10),
      new THREE.Vector3(-10, 0, 2),
      new THREE.Vector3(10, 0, 2)
    ]

    torchPositions.forEach((pos) => {
      const torch = new Torch(pos)
      this.torches.push(torch)
      this.scene.add(torch.mesh)
    })
  }

  private onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  public setTemperature(temp: number): void {
    this.temperature = Math.max(500, Math.min(1500, temp))
  }

  public addRune(type: RuneType): void {
    const rune = new Rune(type)
    rune.mesh.position.set(0, 6, 0)
    rune.mesh.scale.set(0, 0, 0)
    this.scene.add(rune.mesh)
    this.runesInForge.push(rune)

    const targetY = 4.2 + this.runesInForge.length * 0.15
    const startTime = Date.now()
    const duration = 500
    const startY = 6

    const animateDrop = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const bounceProgress = this.elasticOut(progress)
      const scale = 0.5 + bounceProgress * 0.5
      rune.mesh.scale.set(scale, scale, scale)

      const yOffset = startY - (startY - targetY) * bounceProgress
      rune.mesh.position.y = yOffset

      if (progress < 1) {
        requestAnimationFrame(animateDrop)
      } else {
        const burst = new BurstParticles(
          new THREE.Vector3(0, targetY, 0),
          rune.data.color
        )
        this.burstParticles.push(burst)
        this.scene.add(burst.mesh)
      }
    }

    animateDrop()
  }

  private elasticOut(t: number): number {
    if (t === 0 || t === 1) return t
    const p = 0.3
    const s = p / 4
    return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1
  }

  public clearRunes(): void {
    this.runesInForge.forEach((rune) => {
      this.scene.remove(rune.mesh)
      rune.dispose()
    })
    this.runesInForge = []
  }

  public start(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      this.update()
    }
    animate()
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private update(): void {
    const deltaTime = this.clock.getDelta()
    const time = this.clock.getElapsedTime()

    this.forge.update(time, deltaTime, this.temperature)

    this.torches.forEach((torch) => torch.update(time))

    this.runesInForge.forEach((rune, index) => {
      rune.animateGlow(time + index * 0.5)
      rune.mesh.rotation.y = time * 0.5 + index
    })

    this.burstParticles = this.burstParticles.filter((burst) => {
      const alive = burst.update(deltaTime)
      if (!alive) {
        this.scene.remove(burst.mesh)
        burst.dispose()
      }
      return alive
    })

    this.renderer.render(this.scene, this.camera)
  }

  public dispose(): void {
    this.stop()
    this.clearRunes()
    this.burstParticles.forEach((burst) => {
      this.scene.remove(burst.mesh)
      burst.dispose()
    })
    this.burstParticles = []

    this.forge.dispose()
    this.scene.remove(this.forge.mesh)

    this.torches.forEach((torch) => {
      this.scene.remove(torch.mesh)
    })
    this.torches = []

    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }

    window.removeEventListener('resize', this.onResize.bind(this))
  }

  public getRendererDomElement(): HTMLCanvasElement {
    return this.renderer.domElement
  }
}

export function initScene(container: HTMLElement): ForgeScene {
  const scene = new ForgeScene(container)
  scene.start()
  return scene
}
