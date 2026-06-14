import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'
import type { PlantType, EnvironmentParams, HealthMetrics } from '@/types'
import {
  createPlantMesh,
  updatePlantGrowth,
  shouldDropLeaves,
  getLeavesForDrop,
  type PlantInstance
} from '@/modules/plant'
import {
  createPollenParticles,
  updatePollenParticles,
  createLeafParticleSystem,
  spawnLeafParticles,
  updateLeafParticles,
  disposeParticleSystem,
  type ParticleSystem,
  type LeafParticleSystem
} from '@/modules/particles'
import { throttle } from '@/utils/helpers'

export interface ThreeSceneOptions {
  container: HTMLElement
  onPlantClick?: (plantId: string) => void
  onPlantAdd?: (plantId: string, plantData: { type: PlantType; health: HealthMetrics; stage: string; progress: number }) => void
  onPlantUpdate?: (plantId: string, data: { health: HealthMetrics; stage: string; progress: number }) => void
  onGroundClick?: (position: { x: number; z: number }) => void
  onPlantLimitReached?: (msg: string) => void
}

export class ThreeScene {
  private static readonly MAX_PLANTS = 20

  private container: HTMLElement
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private controls!: OrbitControls
  private ground!: THREE.Mesh
  private groundGrid!: THREE.GridHelper
  private ambientLight!: THREE.AmbientLight
  private directionalLight!: THREE.DirectionalLight
  private plants: Map<string, PlantInstance> = new Map()
  private pollenParticles!: ParticleSystem
  private leafParticles!: LeafParticleSystem
  private environmentParams: EnvironmentParams = {
    light: 60,
    water: 50,
    temperature: 60,
    nutrients: 50
  }
  private animationFrameId: number = 0
  private lastTime: number = 0
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private mouse: THREE.Vector2 = new THREE.Vector2()
  private selectedPlantId: string | null = null
  private hoveredPlantId: string | null = null
  private plantRings: Map<string, THREE.Mesh> = new Map()
  private isPlantingMode: boolean = false
  private selectedPlantType: PlantType = 'flower'
  private maxPlants: number = 20

  private onPlantClick?: (plantId: string) => void
  private onPlantAdd?: (plantId: string, plantData: { type: PlantType; health: HealthMetrics; stage: string; progress: number }) => void
  private onPlantUpdate?: (plantId: string, data: { health: HealthMetrics; stage: string; progress: number }) => void
  private onGroundClick?: (position: { x: number; z: number }) => void
  private onPlantLimitReached?: (msg: string) => void

  private handleResizeBound: () => void
  private handleMouseMoveBound: (event: MouseEvent) => void
  private handleCanvasClickBound: (event: MouseEvent) => void

  constructor(options: ThreeSceneOptions) {
    this.container = options.container
    this.onPlantClick = options.onPlantClick
    this.onPlantAdd = options.onPlantAdd
    this.onPlantUpdate = options.onPlantUpdate
    this.onGroundClick = options.onGroundClick
    this.onPlantLimitReached = options.onPlantLimitReached

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.handleResizeBound = this.handleResize.bind(this)
    this.handleMouseMoveBound = throttle(this.handleMouseMove.bind(this), 50)
    this.handleCanvasClickBound = throttle(this.handleCanvasClick.bind(this), 100)

    this.init()
  }

  private init() {
    this.createScene()
    this.createCamera()
    this.createRenderer()
    this.createControls()
    this.createLights()
    this.createGround()
    this.createParticles()
    this.setupEventListeners()
    this.startAnimationLoop()
  }

  private createScene() {
    this.scene = new THREE.Scene()
    this.scene.background = null
    this.scene.fog = new THREE.FogExp2(0x16213e, 0.05)
  }

  private createCamera() {
    const { clientWidth, clientHeight } = this.container
    this.camera = new THREE.PerspectiveCamera(
      60,
      clientWidth / clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(8, 6, 8)
    this.camera.lookAt(0, 0, 0)
  }

  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    this.container.appendChild(this.renderer.domElement)
  }

  private createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 2
    this.controls.maxDistance = 30
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1
    this.controls.target.set(0, 0.5, 0)
  }

  private createLights() {
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.4)
    this.scene.add(this.ambientLight)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.directionalLight.position.set(5, 10, 5)
    this.directionalLight.castShadow = true
    this.directionalLight.shadow.mapSize.width = 2048
    this.directionalLight.shadow.mapSize.height = 2048
    this.directionalLight.shadow.camera.near = 0.5
    this.directionalLight.shadow.camera.far = 50
    this.directionalLight.shadow.camera.left = -15
    this.directionalLight.shadow.camera.right = 15
    this.directionalLight.shadow.camera.top = 15
    this.directionalLight.shadow.camera.bottom = -15
    this.scene.add(this.directionalLight)

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3)
    fillLight.position.set(-5, 5, -5)
    this.scene.add(fillLight)
  }

  private createGround() {
    const groundGeo = new THREE.PlaneGeometry(30, 30, 64, 64)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a2a,
      transparent: true,
      opacity: 0.6,
      roughness: 0.9,
      metalness: 0.1
    })
    this.ground = new THREE.Mesh(groundGeo, groundMat)
    this.ground.rotation.x = -Math.PI / 2
    this.ground.receiveShadow = true
    this.ground.name = 'ground'
    this.scene.add(this.ground)

    this.groundGrid = new THREE.GridHelper(30, 30, 0x226644, 0x1a4a3a)
    this.groundGrid.position.y = 0.01
    this.groundGrid.material.transparent = true
    this.groundGrid.material.opacity = 0.3
    this.scene.add(this.groundGrid)

    const edgeGeo = new THREE.RingGeometry(14.8, 15.2, 64)
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0x22aa66,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })
    const edge = new THREE.Mesh(edgeGeo, edgeMat)
    edge.rotation.x = -Math.PI / 2
    edge.position.y = 0.02
    this.scene.add(edge)
  }

  private createParticles() {
    const bounds = new THREE.Box3(
      new THREE.Vector3(-15, 0, -15),
      new THREE.Vector3(15, 8, 15)
    )
    this.pollenParticles = createPollenParticles(500, bounds)
    this.scene.add(this.pollenParticles.points)

    this.leafParticles = createLeafParticleSystem(200)
    this.scene.add(this.leafParticles.points)
  }

  private setupEventListeners() {
    window.addEventListener('resize', this.handleResizeBound)
    this.renderer.domElement.addEventListener('mousemove', this.handleMouseMoveBound)
    this.renderer.domElement.addEventListener('click', this.handleCanvasClickBound)
  }

  private handleResize() {
    const { clientWidth, clientHeight } = this.container
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight)
  }

  private handleMouseMove(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const plantMeshes: THREE.Object3D[] = []
    this.plants.forEach((plant) => {
      plantMeshes.push(plant.group)
    })

    const intersects = this.raycaster.intersectObjects(plantMeshes, true)

    if (intersects.length > 0) {
      let plantId: string | null = null
      for (const plant of this.plants.values()) {
        if (intersects[0].object === plant.group || plant.group.children.includes(intersects[0].object as THREE.Mesh)) {
          plantId = plant.id
          break
        }
      }

      if (plantId && plantId !== this.hoveredPlantId) {
        if (this.hoveredPlantId && this.hoveredPlantId !== this.selectedPlantId) {
          this.setPlantHover(this.hoveredPlantId, false)
        }
        this.setPlantHover(plantId, true)
        this.hoveredPlantId = plantId
        this.renderer.domElement.style.cursor = 'pointer'
      }
    } else {
      if (this.hoveredPlantId && this.hoveredPlantId !== this.selectedPlantId) {
        this.setPlantHover(this.hoveredPlantId, false)
      }
      if (this.hoveredPlantId !== this.selectedPlantId) {
        this.hoveredPlantId = null
      }
      this.renderer.domElement.style.cursor = this.isPlantingMode ? 'crosshair' : 'default'
    }
  }

  private handleCanvasClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const normalizedMouse = new THREE.Vector2()
    normalizedMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    normalizedMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(normalizedMouse, this.camera)

    const groundIntersects = this.raycaster.intersectObject(this.ground)

    if (this.isPlantingMode) {
      if (groundIntersects.length > 0) {
        const hitPoint = groundIntersects[0].point
        this.addPlant(this.selectedPlantType, { x: hitPoint.x, z: hitPoint.z })
        if (this.onGroundClick) {
          this.onGroundClick({ x: hitPoint.x, z: hitPoint.z })
        }
      }
    } else {
      let hitPlantId: string | null = null
      for (const [id, plant] of this.plants) {
        const plantIntersects = this.raycaster.intersectObject(plant.group, true)
        if (plantIntersects.length > 0) {
          hitPlantId = id
          break
        }
      }

      if (hitPlantId) {
        this.selectPlant(hitPlantId)
        if (this.onPlantClick) {
          this.onPlantClick(hitPlantId)
        }
        return
      }

      if (groundIntersects.length > 0) {
        const point = groundIntersects[0].point
        if (this.onGroundClick) {
          this.onGroundClick({ x: point.x, z: point.z })
        }
      }
    }
  }

  private setPlantHover(plantId: string | null, isHovered: boolean) {
    if (!plantId) return
    const plant = this.plants.get(plantId)
    if (!plant) return

    const isSelected = this.selectedPlantId === plantId
    if (isSelected && !isHovered) return

    const ring = this.plantRings.get(plantId)
    if (ring) {
      const targetOpacity = isSelected ? 0.6 : (isHovered ? 0.8 : 0.3)
      new TWEEN.Tween(ring.material)
        .to({ opacity: targetOpacity }, 200)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()
    }

    plant.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.emissive !== undefined) {
          const targetIntensity = isHovered ? 0.3 : (isSelected ? 0.15 : 0)
          const targetColor = isSelected
            ? new THREE.Color(0x22ff88)
            : new THREE.Color(0.2, 0.8, 0.4)

          if (isHovered || isSelected) {
            new TWEEN.Tween({ r: mat.emissive.r, g: mat.emissive.g, b: mat.emissive.b })
              .to({ r: targetColor.r, g: targetColor.g, b: targetColor.b }, 200)
              .easing(TWEEN.Easing.Quadratic.Out)
              .onUpdate((obj) => {
                mat.emissive.setRGB(obj.r, obj.g, obj.b)
              })
              .start()
          } else {
            new TWEEN.Tween({ r: mat.emissive.r, g: mat.emissive.g, b: mat.emissive.b })
              .to({ r: 0, g: 0, b: 0 }, 200)
              .easing(TWEEN.Easing.Quadratic.Out)
              .onUpdate((obj) => {
                mat.emissive.setRGB(obj.r, obj.g, obj.b)
              })
              .start()
          }

          new TWEEN.Tween(mat)
            .to({ emissiveIntensity: targetIntensity }, 200)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start()
        }
      }
    })
  }

  public setPlantingMode(enabled: boolean, plantType?: PlantType) {
    this.isPlantingMode = enabled
    if (plantType) {
      this.selectedPlantType = plantType
    }
    this.renderer.domElement.style.cursor = enabled ? 'crosshair' : 'default'
  }

  public addPlant(type: PlantType, position: { x: number; z: number }): string | null {
    if (this.plants.size >= ThreeScene.MAX_PLANTS) {
      if (this.onPlantLimitReached) {
        this.onPlantLimitReached(`植物数量已达上限 ${ThreeScene.MAX_PLANTS} 株`)
      }
      return null
    }

    const plantInstance = createPlantMesh(type)
    const id = plantInstance.id || Math.random().toString(36).substring(2, 11)
    plantInstance.id = id
    plantInstance.group.position.set(position.x, 0, position.z)
    plantInstance.position.set(position.x, 0, position.z)

    plantInstance.group.scale.setScalar(0.1)
    plantInstance.currentScale = 0.1

    this.scene.add(plantInstance.group)
    this.plants.set(id, plantInstance)

    if (plantInstance.parts.seed) {
      const seed = plantInstance.parts.seed
      seed.position.y = 0.8

      new TWEEN.Tween(seed.position)
        .to({ y: 0.1 }, 250)
        .easing(TWEEN.Easing.Bounce.Out)
        .onComplete(() => {
          new TWEEN.Tween(seed.position)
            .to({ y: 0.25 }, 180)
            .easing(TWEEN.Easing.Bounce.Out)
            .onComplete(() => {
              new TWEEN.Tween(seed.position)
                .to({ y: 0.15 }, 140)
                .easing(TWEEN.Easing.Bounce.Out)
                .onComplete(() => {
                  new TWEEN.Tween(seed.position)
                    .to({ y: 0.1 }, 100)
                    .easing(TWEEN.Easing.Bounce.Out)
                    .start()
                })
                .start()
            })
            .start()
        })
        .start()
    }

    this.createPlantRing(id, position)
    this.createPlantingEffect(position)

    if (this.onPlantAdd) {
      this.onPlantAdd(id, {
        type,
        health: plantInstance.health,
        stage: plantInstance.stage,
        progress: plantInstance.growthProgress
      })
    }

    return id
  }

  private createPlantRing(plantId: string, position: { x: number; z: number }) {
    const ringGeo = new THREE.RingGeometry(0.4, 0.5, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x44ff88,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(position.x, 0.03, position.z)
    this.scene.add(ring)
    this.plantRings.set(plantId, ring)
  }

  private createPlantingEffect(position: { x: number; z: number }) {
    const glowGeo = new THREE.RingGeometry(0.1, 2, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.rotation.x = -Math.PI / 2
    glow.position.set(position.x, 0.05, position.z)
    glow.scale.setScalar(0.01)
    this.scene.add(glow)

    new TWEEN.Tween(glow.scale)
      .to({ x: 1.5, y: 1.5, z: 1.5 }, 1000)
      .easing(TWEEN.Easing.Quartic.Out)
      .start()

    new TWEEN.Tween(glow.material)
      .to({ opacity: 0 }, 1000)
      .easing(TWEEN.Easing.Quartic.Out)
      .onComplete(() => {
        this.scene.remove(glow)
        glow.geometry.dispose()
        glow.material.dispose()
      })
      .start()
  }

  public selectPlant(plantId: string) {
    if (this.selectedPlantId === plantId) return

    const previousSelectedId = this.selectedPlantId
    this.selectedPlantId = plantId

    if (previousSelectedId) {
      this.setPlantSelectedEmissive(previousSelectedId, false)
    }
    this.setPlantSelectedEmissive(plantId, true)

    this.plants.forEach((plant, id) => {
      const ring = this.plantRings.get(id)
      if (ring) {
        const isSelected = id === plantId
        const targetScale = isSelected ? 1.5 : 1
        const targetOpacity = isSelected ? 0.6 : 0.3
        const targetColor = isSelected ? 0x44aaff : 0x44ff88

        new TWEEN.Tween(ring.scale)
          .to({ x: targetScale, y: targetScale, z: targetScale }, 300)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start()

        new TWEEN.Tween(ring.material)
          .to({ opacity: targetOpacity }, 300)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start()

        const color = new THREE.Color(targetColor)
        new TWEEN.Tween((ring.material as THREE.MeshBasicMaterial).color)
          .to({ r: color.r, g: color.g, b: color.b }, 300)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start()
      }
    })
  }

  private setPlantSelectedEmissive(plantId: string, isSelected: boolean) {
    const plant = this.plants.get(plantId)
    if (!plant) return

    plant.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial
        if (mat.emissive !== undefined) {
          if (isSelected) {
            new TWEEN.Tween({ r: mat.emissive.r, g: mat.emissive.g, b: mat.emissive.b })
              .to({ r: 0.133, g: 1, b: 0.533 }, 300)
              .easing(TWEEN.Easing.Quadratic.Out)
              .onUpdate((obj) => {
                mat.emissive.setRGB(obj.r, obj.g, obj.b)
              })
              .start()
            new TWEEN.Tween(mat)
              .to({ emissiveIntensity: 0.15 }, 300)
              .easing(TWEEN.Easing.Quadratic.Out)
              .start()
          } else {
            const isHovered = this.hoveredPlantId === plantId
            const targetIntensity = isHovered ? 0.3 : 0
            new TWEEN.Tween({ r: mat.emissive.r, g: mat.emissive.g, b: mat.emissive.b })
              .to({
                r: isHovered ? 0.2 : 0,
                g: isHovered ? 0.8 : 0,
                b: isHovered ? 0.4 : 0
              }, 300)
              .easing(TWEEN.Easing.Quadratic.Out)
              .onUpdate((obj) => {
                mat.emissive.setRGB(obj.r, obj.g, obj.b)
              })
              .start()
            new TWEEN.Tween(mat)
              .to({ emissiveIntensity: targetIntensity }, 300)
              .easing(TWEEN.Easing.Quadratic.Out)
              .start()
          }
        }
      }
    })
  }

  public deselectPlant() {
    if (this.selectedPlantId) {
      this.setPlantSelectedEmissive(this.selectedPlantId, false)
    }
    this.selectedPlantId = null
    this.plants.forEach((_, id) => {
      const ring = this.plantRings.get(id)
      if (ring) {
        new TWEEN.Tween(ring.scale)
          .to({ x: 1, y: 1, z: 1 }, 300)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start()

        new TWEEN.Tween(ring.material)
          .to({ opacity: 0.3 }, 300)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start()

        const color = new THREE.Color(0x44ff88)
        new TWEEN.Tween((ring.material as THREE.MeshBasicMaterial).color)
          .to({ r: color.r, g: color.g, b: color.b }, 300)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start()
      }
    })
  }

  public focusOnPlant(plantId: string): Promise<void> {
    return new Promise((resolve) => {
      const plant = this.plants.get(plantId)
      if (!plant) {
        resolve()
        return
      }

      this.selectPlant(plantId)

      const targetPosition = new THREE.Vector3(
        plant.position.x + 3,
        plant.position.y + 2.5,
        plant.position.z + 3
      )
      const targetLookAt = new THREE.Vector3(
        plant.position.x,
        plant.position.y + 0.8,
        plant.position.z
      )

      const startPosition = this.camera.position.clone()
      const startTarget = this.controls.target.clone()

      const duration = 1000

      new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, duration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate((obj) => {
          this.camera.position.lerpVectors(startPosition, targetPosition, obj.t)
          this.controls.target.lerpVectors(startTarget, targetLookAt, obj.t)
        })
        .onComplete(() => {
          resolve()
        })
        .start()
    })
  }

  public resetCamera(): Promise<void> {
    return new Promise((resolve) => {
      const startPosition = this.camera.position.clone()
      const startTarget = this.controls.target.clone()
      const endPosition = new THREE.Vector3(8, 6, 8)
      const endTarget = new THREE.Vector3(0, 0.5, 0)

      new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, 1000)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate((obj) => {
          this.camera.position.lerpVectors(startPosition, endPosition, obj.t)
          this.controls.target.lerpVectors(startTarget, endTarget, obj.t)
        })
        .onComplete(() => {
          this.deselectPlant()
          resolve()
        })
        .start()
    })
  }

  public updateEnvironment(params: Partial<EnvironmentParams>) {
    this.environmentParams = { ...this.environmentParams, ...params }

    const lightFactor = 0.3 + (this.environmentParams.light / 100) * 0.7
    this.ambientLight.intensity = 0.2 + lightFactor * 0.4
    this.directionalLight.intensity = 0.4 + lightFactor * 0.8

    const tempFactor = this.environmentParams.temperature / 100
    const lightColor = new THREE.Color()
    lightColor.setHSL(0.12 - tempFactor * 0.05, 0.5, 0.5 + tempFactor * 0.3)
    this.directionalLight.color.lerp(lightColor, 0.1)

    this.plants.forEach((plant, id) => {
      const oldHealth = plant.health
      const oldAvgHealth =
        (oldHealth.light + oldHealth.water + oldHealth.temperature + oldHealth.nutrients) / 4

      const newAvgHealth =
        (plant.health.light +
          plant.health.water +
          plant.health.temperature +
          plant.health.nutrients) /
        4

      if (oldAvgHealth > 50 && newAvgHealth < 40) {
        spawnLeafParticles(
          this.leafParticles,
          plant.group.position.clone().add(new THREE.Vector3(0, 1, 0)),
          3,
          new THREE.Color(0x88cc66)
        )
      }
    })
  }

  public getPlantHealth(plantId: string): HealthMetrics | null {
    const plant = this.plants.get(plantId)
    if (!plant) return null
    return { ...plant.health }
  }

  public getPlantData(plantId: string) {
    const plant = this.plants.get(plantId)
    if (!plant) return null
    return {
      id: plant.id,
      type: plant.type,
      stage: plant.stage,
      growthProgress: plant.growthProgress,
      health: { ...plant.health },
      position: { x: plant.position.x, z: plant.position.z }
    }
  }

  private startAnimationLoop() {
    this.lastTime = performance.now()

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate)

      const currentTime = performance.now()
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1)
      this.lastTime = currentTime

      TWEEN.update()

      this.plants.forEach((plant, id) => {
        const result = updatePlantGrowth(plant, this.environmentParams, deltaTime)

        const dropCount = shouldDropLeaves(this.environmentParams, plant)
        if (dropCount > 0) {
          const droppedLeaves = getLeavesForDrop(plant, dropCount)
          if (droppedLeaves && droppedLeaves.length > 0) {
            droppedLeaves.forEach((leaf) => {
              const leafMat = leaf.material as THREE.MeshStandardMaterial
              const leafColor = leafMat.color ? leafMat.color.clone() : new THREE.Color(0x88cc66)
              spawnLeafParticles(
                this.leafParticles,
                leaf.getWorldPosition(new THREE.Vector3()),
                1,
                leafColor
              )
            })
          }
        }

        if (result.healthChanged || result.stageChanged) {
          if (this.onPlantUpdate) {
            this.onPlantUpdate(id, {
              health: plant.health,
              stage: plant.stage,
              progress: plant.growthProgress
            })
          }
        }
      })

      const bounds = new THREE.Box3(
        new THREE.Vector3(-15, 0, -15),
        new THREE.Vector3(15, 8, 15)
      )
      updatePollenParticles(
        this.pollenParticles,
        deltaTime,
        this.environmentParams.light,
        bounds
      )

      updateLeafParticles(this.leafParticles, deltaTime)

      this.controls.update()
      this.renderer.render(this.scene, this.camera)
    }

    animate()
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId)

    window.removeEventListener('resize', this.handleResizeBound)
    this.renderer.domElement.removeEventListener('mousemove', this.handleMouseMoveBound)
    this.renderer.domElement.removeEventListener('click', this.handleCanvasClickBound)

    this.plants.forEach((plant) => {
      this.scene.remove(plant.group)
      plant.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    })

    this.plantRings.forEach((ring) => {
      this.scene.remove(ring)
      ring.geometry.dispose()
      if (Array.isArray(ring.material)) {
        ring.material.forEach((mat) => mat.dispose())
      } else {
        ring.material.dispose()
      }
    })

    disposeParticleSystem(this.pollenParticles)
    disposeParticleSystem(this.leafParticles)
    this.scene.remove(this.pollenParticles.points)
    this.scene.remove(this.leafParticles.points)

    this.scene.remove(this.ground)
    this.scene.remove(this.groundGrid)
    this.ground.geometry.dispose()
    ;(this.ground.material as THREE.Material).dispose()

    this.controls.dispose()
    this.renderer.dispose()

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }

  public getPlantCount(): number {
    return this.plants.size
  }
}
