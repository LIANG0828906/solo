import * as THREE from 'three'
import { eventBus } from './eventBus'
import { TowerSystem } from './towerSystem'
import { GameEngine } from './gameEngine'
import {
  Tower,
  Zombie,
  Projectile,
  GRID_SIZE,
  CELL_SIZE,
  TOWER_CONFIGS
} from './types'

export class RenderEngine {
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private renderer: THREE.WebGLRenderer
  private canvas: HTMLCanvasElement

  private gridGroup: THREE.Group = new THREE.Group()
  private towersGroup: THREE.Group = new THREE.Group()
  private zombiesGroup: THREE.Group = new THREE.Group()
  private projectilesGroup: THREE.Group = new THREE.Group()
  private effectsGroup: THREE.Group = new THREE.Group()

  private towerMeshes: Map<string, THREE.Group> = new Map()
  private zombieMeshes: Map<string, THREE.Group> = new Map()
  private projectileMeshes: Map<string, THREE.Group> = new Map()
  private deathEffects: Map<string, { mesh: THREE.Mesh; startTime: number }> = new Map()
  private muzzleFlashes: Map<string, { mesh: THREE.Mesh; startTime: number }> = new Map()

  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private mouse: THREE.Vector2 = new THREE.Vector2()
  private hoverCell: THREE.Mesh | null = null

  private towerSystem: TowerSystem
  private gameEngine: GameEngine
  private idCounter = 0

  constructor(canvas: HTMLCanvasElement, towerSystem: TowerSystem, gameEngine: GameEngine) {
    this.canvas = canvas
    this.towerSystem = towerSystem
    this.gameEngine = gameEngine

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0D0D1A)
    this.scene.fog = new THREE.Fog(0x0D0D1A, 10, 30)

    const aspect = window.innerWidth / window.innerHeight
    const viewSize = 12
    this.camera = new THREE.OrthographicCamera(
      -viewSize * aspect,
      viewSize * aspect,
      viewSize,
      -viewSize,
      0.1,
      100
    )
    this.camera.position.set(8, 10, 8)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.setupLights()
    this.createGrid()
    this.setupGroups()
    this.registerEvents()
    this.setupInput()

    window.addEventListener('resize', this.onResize.bind(this))

    this.animate()
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    this.scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0x00FF88, 0.3, 20)
    pointLight.position.set(0, 5, 0)
    this.scene.add(pointLight)
  }

  private setupGroups(): void {
    this.scene.add(this.gridGroup)
    this.scene.add(this.towersGroup)
    this.scene.add(this.zombiesGroup)
    this.scene.add(this.projectilesGroup)
    this.scene.add(this.effectsGroup)
  }

  private createGrid(): void {
    const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x2A2A3A, 0x2A2A3A)
    gridHelper.position.y = 0.01
    this.gridGroup.add(gridHelper)

    const groundGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x12121E,
      roughness: 0.9,
      metalness: 0.1
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.gridGroup.add(ground)

    const pathY = Math.floor(GRID_SIZE / 2)
    const pathGeometry = new THREE.PlaneGeometry(GRID_SIZE + 2, CELL_SIZE * 0.9)
    const pathMaterial = new THREE.MeshStandardMaterial({
      color: 0x3D3D5C,
      roughness: 0.8
    })
    const path = new THREE.Mesh(pathGeometry, pathMaterial)
    path.rotation.x = -Math.PI / 2
    path.position.y = 0.02
    path.position.z = (pathY - GRID_SIZE / 2 + 0.5) * CELL_SIZE
    path.receiveShadow = true
    this.gridGroup.add(path)

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (this.towerSystem.isPathCell(x, y)) continue

        const cellGeometry = new THREE.PlaneGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9)
        const cellMaterial = new THREE.MeshStandardMaterial({
          color: 0x1A1A2E,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide
        })
        const cell = new THREE.Mesh(cellGeometry, cellMaterial)
        cell.rotation.x = -Math.PI / 2
        cell.position.set(
          (x - GRID_SIZE / 2 + 0.5) * CELL_SIZE,
          0.03,
          (y - GRID_SIZE / 2 + 0.5) * CELL_SIZE
        )
        cell.userData = { gridX: x, gridY: y, isCell: true }
        this.gridGroup.add(cell)
      }
    }

    const hoverGeometry = new THREE.PlaneGeometry(CELL_SIZE * 0.95, CELL_SIZE * 0.95)
    const hoverMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FF88,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    this.hoverCell = new THREE.Mesh(hoverGeometry, hoverMaterial)
    this.hoverCell.rotation.x = -Math.PI / 2
    this.hoverCell.position.y = 0.05
    this.hoverCell.visible = false
    this.gridGroup.add(this.hoverCell)
  }

  private registerEvents(): void {
    eventBus.on('render:updateTower', (data) => {
      const tower = data as Tower
      this.updateTowerMesh(tower)
    })

    eventBus.on('render:removeTower', (data) => {
      const towerId = data as string
      this.removeTowerMesh(towerId)
    })

    eventBus.on('render:updateZombie', (data) => {
      const zombie = data as Zombie
      this.updateZombieMesh(zombie)
    })

    eventBus.on('render:removeZombie', (data) => {
      const zombieId = data as string
      this.removeZombieMesh(zombieId)
    })

    eventBus.on('render:addProjectile', (data) => {
      const projectile = data as Projectile
      this.createProjectileMesh(projectile)
    })

    eventBus.on('render:removeProjectile', (data) => {
      const projId = data as string
      this.removeProjectileMesh(projId)
    })

    eventBus.on('render:addDeathEffect', (data) => {
      const { x, y } = data as { x: number; y: number }
      this.createDeathEffect(x, y)
    })

    eventBus.on('render:muzzleFlash', (data) => {
      const towerId = data as string
      this.createMuzzleFlash(towerId)
    })

    eventBus.on('tower:select', (data) => {
      const towerId = data as string
      this.highlightTower(towerId)
    })

    eventBus.on('tower:deselect', () => {
      this.clearTowerHighlight()
    })
  }

  private setupInput(): void {
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.addEventListener('click', this.onClick.bind(this))
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.gridGroup.children, true)

    if (this.hoverCell) {
      let foundCell = false
      for (const intersect of intersects) {
        if (intersect.object.userData.isCell) {
          const { gridX, gridY } = intersect.object.userData
          const selectedType = this.towerSystem.getSelectedTowerType()

          if (selectedType) {
            const canPlace = this.towerSystem.canPlaceTower(gridX, gridY)
            const cost = TOWER_CONFIGS[selectedType].cost
            const hasGold = this.gameEngine.getGold() >= cost

            this.hoverCell.position.x = (gridX - GRID_SIZE / 2 + 0.5) * CELL_SIZE
            this.hoverCell.position.z = (gridY - GRID_SIZE / 2 + 0.5) * CELL_SIZE
            this.hoverCell.visible = true

            const material = this.hoverCell.material as THREE.MeshBasicMaterial
            if (canPlace && hasGold) {
              material.color.setHex(0x00FF88)
            } else {
              material.color.setHex(0xFF4444)
            }
            foundCell = true
          }
          break
        }
      }
      if (!foundCell) {
        this.hoverCell.visible = false
      }
    }
  }

  private onClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const towerIntersects = this.raycaster.intersectObjects(this.towersGroup.children, true)
    for (const intersect of towerIntersects) {
      let obj: THREE.Object3D | null = intersect.object
      while (obj) {
        if (obj.userData.towerId) {
          eventBus.emit('tower:select', obj.userData.towerId)
          return
        }
        obj = obj.parent
      }
    }

    const gridIntersects = this.raycaster.intersectObjects(this.gridGroup.children, true)
    for (const intersect of gridIntersects) {
      if (intersect.object.userData.isCell) {
        const { gridX, gridY } = intersect.object.userData
        const selectedType = this.towerSystem.getSelectedTowerType()

        if (selectedType) {
          const success = this.towerSystem.placeTower(
            gridX,
            gridY,
            selectedType,
            this.gameEngine.getGold()
          )
          if (success) {
            eventBus.emit('ui:towerSelected', null)
          }
        } else {
          eventBus.emit('tower:deselect')
        }
        return
      }
    }

    eventBus.emit('tower:deselect')
  }

  private updateTowerMesh(tower: Tower): void {
    let towerGroup = this.towerMeshes.get(tower.id)

    if (!towerGroup) {
      towerGroup = this.createTowerMesh(tower)
      this.towerMeshes.set(tower.id, towerGroup)
      this.towersGroup.add(towerGroup)
    } else {
      this.updateTowerVisual(towerGroup, tower)
    }

    towerGroup.position.set(
      (tower.gridX - GRID_SIZE / 2 + 0.5) * CELL_SIZE,
      0,
      (tower.gridY - GRID_SIZE / 2 + 0.5) * CELL_SIZE
    )
  }

  private createTowerMesh(tower: Tower): THREE.Group {
    const group = new THREE.Group()
    group.userData.towerId = tower.id

    const baseGeometry = new THREE.CylinderGeometry(0.4, 0.45, 0.15, 8)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: tower.color,
      transparent: true,
      opacity: 0.6,
      roughness: 0.7,
      metalness: 0.3
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = 0.075
    base.receiveShadow = true
    base.castShadow = true
    group.add(base)

    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.4, 8)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: tower.color,
      roughness: 0.5,
      metalness: 0.5
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.35
    body.castShadow = true
    body.userData.isTowerBody = true
    group.add(body)

    this.createTowerSpecificParts(group, tower)

    return group
  }

  private createTowerSpecificParts(group: THREE.Group, tower: Tower): void {
    const levelScale = 1 + (tower.level - 1) * 0.2

    if (tower.type === 'machinegun') {
      const barrelLength = 0.5 * levelScale
      const barrelRadius = 0.08 * levelScale
      const barrelGeometry = new THREE.CylinderGeometry(barrelRadius, barrelRadius, barrelLength, 8)
      const barrelMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.4,
        metalness: 0.8
      })
      const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial)
      barrel.rotation.x = Math.PI / 2
      barrel.position.set(0, 0.45, barrelLength / 2)
      barrel.castShadow = true
      barrel.userData.isBarrel = true
      group.add(barrel)

      const muzzleGeometry = new THREE.SphereGeometry(0.12, 8, 8)
      const muzzleMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        transparent: true,
        opacity: 0
      })
      const muzzle = new THREE.Mesh(muzzleGeometry, muzzleMaterial)
      muzzle.position.set(0, 0.45, barrelLength + 0.05)
      muzzle.userData.isMuzzleFlash = true
      group.add(muzzle)
    } else if (tower.type === 'flame') {
      const intensity = 1 + (tower.level - 1) * 0.3
      const flameGeometry = new THREE.ConeGeometry(0.2, 0.5 * levelScale, 8)
      const flameMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.05 + (tower.level - 1) * 0.02, 1, 0.5 + intensity * 0.1),
        transparent: true,
        opacity: 0.8
      })
      const flame = new THREE.Mesh(flameGeometry, flameMaterial)
      flame.position.y = 0.7
      flame.userData.isFlame = true
      group.add(flame)

      const innerFlameGeometry = new THREE.ConeGeometry(0.1, 0.3 * levelScale, 8)
      const innerFlameMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00,
        transparent: true,
        opacity: 0.9
      })
      const innerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial)
      innerFlame.position.y = 0.75
      group.add(innerFlame)
    } else if (tower.type === 'slow') {
      const auraRadius = (0.6 + (tower.level - 1) * 0.15) * tower.range / 4
      const auraGeometry = new THREE.RingGeometry(auraRadius * 0.8, auraRadius, 32)
      const auraMaterial = new THREE.MeshBasicMaterial({
        color: 0x00BCD4,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
      const aura = new THREE.Mesh(auraGeometry, auraMaterial)
      aura.rotation.x = -Math.PI / 2
      aura.position.y = 0.1
      aura.userData.isAura = true
      group.add(aura)

      const crystalGeometry = new THREE.OctahedronGeometry(0.2 * levelScale, 0)
      const crystalMaterial = new THREE.MeshStandardMaterial({
        color: 0x00BCD4,
        emissive: 0x006064,
        emissiveIntensity: 0.5 + (tower.level - 1) * 0.2,
        roughness: 0.2,
        metalness: 0.8
      })
      const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial)
      crystal.position.y = 0.6
      crystal.castShadow = true
      crystal.userData.isCrystal = true
      group.add(crystal)
    }
  }

  private updateTowerVisual(group: THREE.Group, tower: Tower): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.userData.isBarrel) {
          const levelScale = 1 + (tower.level - 1) * 0.2
          child.scale.set(levelScale, levelScale, levelScale)
        }
        if (child.userData.isFlame) {
          const levelScale = 1 + (tower.level - 1) * 0.2
          child.scale.set(levelScale, levelScale, levelScale)
          const material = child.material as THREE.MeshBasicMaterial
          material.color.setHSL(0.05 + (tower.level - 1) * 0.02, 1, 0.5 + (1 + (tower.level - 1) * 0.3) * 0.1)
        }
        if (child.userData.isAura) {
          const auraRadius = (0.6 + (tower.level - 1) * 0.15) * tower.range / 4
          child.geometry.dispose()
          child.geometry = new THREE.RingGeometry(auraRadius * 0.8, auraRadius, 32)
        }
        if (child.userData.isCrystal) {
          const levelScale = 1 + (tower.level - 1) * 0.2
          child.scale.set(levelScale, levelScale, levelScale)
          const material = child.material as THREE.MeshStandardMaterial
          material.emissiveIntensity = 0.5 + (tower.level - 1) * 0.2
        }
      }
    })
  }

  private removeTowerMesh(towerId: string): void {
    const mesh = this.towerMeshes.get(towerId)
    if (mesh) {
      this.towersGroup.remove(mesh)
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      this.towerMeshes.delete(towerId)
    }
  }

  private highlightTower(towerId: string): void {
    this.towerMeshes.forEach((group, id) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isTowerBody) {
          const material = child.material as THREE.MeshStandardMaterial
          if (id === towerId) {
            material.emissive = new THREE.Color(0x00FF88)
            material.emissiveIntensity = 0.3
          } else {
            material.emissive = new THREE.Color(0x000000)
            material.emissiveIntensity = 0
          }
        }
      })
    })
  }

  private clearTowerHighlight(): void {
    this.towerMeshes.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isTowerBody) {
          const material = child.material as THREE.MeshStandardMaterial
          material.emissive = new THREE.Color(0x000000)
          material.emissiveIntensity = 0
        }
      })
    })
  }

  private updateZombieMesh(zombie: Zombie): void {
    let zombieGroup = this.zombieMeshes.get(zombie.id)

    if (!zombieGroup) {
      zombieGroup = this.createZombieMesh(zombie)
      this.zombieMeshes.set(zombie.id, zombieGroup)
      this.zombiesGroup.add(zombieGroup)
    }

    const towerY = 0.5
    if (zombie.y < towerY) {
      zombieGroup.renderOrder = 1
    } else {
      zombieGroup.renderOrder = -1
    }

    zombieGroup.position.set(zombie.x, 0, zombie.y)

    zombieGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.userData.isZombieBody) {
          const material = child.material as THREE.MeshStandardMaterial
          if (zombie.isHit) {
            material.emissive = new THREE.Color(0xFFFFFF)
            material.emissiveIntensity = 1
          } else {
            material.emissive = zombie.type === 'elite' ? new THREE.Color(0xB71C1C) : new THREE.Color(0x000000)
            material.emissiveIntensity = zombie.type === 'elite' ? 0.3 : 0
          }
        }

        if (zombie.isDying) {
          const deathProgress = (performance.now() - zombie.deathTime) / 500
          const material = child.material as THREE.MeshStandardMaterial
          material.opacity = Math.max(0, 1 - deathProgress)
          material.transparent = true
          zombieGroup.rotation.x = -deathProgress * Math.PI / 2
        }
      }
    })
  }

  private createZombieMesh(zombie: Zombie): THREE.Group {
    const group = new THREE.Group()
    group.userData.zombieId = zombie.id
    group.scale.setScalar(zombie.scale)

    const bodyGeometry = new THREE.BoxGeometry(0.4, 0.7, 0.3)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: zombie.color,
      roughness: 0.8
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.y = 0.45
    body.castShadow = true
    body.userData.isZombieBody = true
    group.add(body)

    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8)
    const headMaterial = new THREE.MeshStandardMaterial({
      color: zombie.color,
      roughness: 0.8
    })
    const head = new THREE.Mesh(headGeometry, headMaterial)
    head.position.y = 0.95
    head.castShadow = true
    group.add(head)

    const eyeGeometry = new THREE.SphereGeometry(0.05, 6, 6)
    const eyeMaterial = new THREE.MeshBasicMaterial({
      color: zombie.type === 'elite' ? 0xFF0000 : 0xFF0000
    })
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.08, 0.98, 0.15)
    group.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.08, 0.98, 0.15)
    group.add(rightEye)

    const healthBgGeometry = new THREE.PlaneGeometry(0.5, 0.08)
    const healthBgMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      side: THREE.DoubleSide
    })
    const healthBg = new THREE.Mesh(healthBgGeometry, healthBgMaterial)
    healthBg.position.y = 1.2
    healthBg.userData.isHealthBg = true
    group.add(healthBg)

    const healthGeometry = new THREE.PlaneGeometry(0.48, 0.06)
    const healthMaterial = new THREE.MeshBasicMaterial({
      color: zombie.type === 'elite' ? 0xFF4444 : 0x00FF88,
      side: THREE.DoubleSide
    })
    const healthBar = new THREE.Mesh(healthGeometry, healthMaterial)
    healthBar.position.y = 1.2
    healthBar.position.z = 0.01
    healthBar.userData.isHealthBar = true
    group.add(healthBar)

    this.updateHealthBar(group, zombie)

    return group
  }

  private updateHealthBar(group: THREE.Group, zombie: Zombie): void {
    const healthPercent = zombie.currentHealth / zombie.health
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isHealthBar) {
        child.scale.x = Math.max(0, healthPercent)
        child.position.x = -0.24 * (1 - healthPercent)
      }
    })
  }

  private removeZombieMesh(zombieId: string): void {
    const mesh = this.zombieMeshes.get(zombieId)
    if (mesh) {
      this.zombiesGroup.remove(mesh)
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      this.zombieMeshes.delete(zombieId)
    }
  }

  private createProjectileMesh(projectile: Projectile): void {
    const group = new THREE.Group()
    group.userData.projectileId = projectile.id

    if (projectile.towerType === 'flame') {
      const flameGeometry = new THREE.SphereGeometry(0.15, 8, 8)
      const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF9800,
        transparent: true,
        opacity: 0.9
      })
      const flame = new THREE.Mesh(flameGeometry, flameMaterial)
      group.add(flame)

      const innerGeometry = new THREE.SphereGeometry(0.08, 8, 8)
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF00
      })
      const inner = new THREE.Mesh(innerGeometry, innerMaterial)
      group.add(inner)
    } else if (projectile.towerType === 'slow') {
      const iceGeometry = new THREE.OctahedronGeometry(0.1, 0)
      const iceMaterial = new THREE.MeshBasicMaterial({
        color: 0x00BCD4,
        transparent: true,
        opacity: 0.8
      })
      const ice = new THREE.Mesh(iceGeometry, iceMaterial)
      group.add(ice)
    } else {
      const bulletGeometry = new THREE.SphereGeometry(0.06, 6, 6)
      const bulletMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFEB3B
      })
      const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial)
      group.add(bullet)
    }

    const trailGeometry = new THREE.BufferGeometry()
    const trailMaterial = new THREE.LineBasicMaterial({
      color: projectile.towerType === 'flame' ? 0xFF9800 :
             projectile.towerType === 'slow' ? 0x00BCD4 : 0xFFEB3B,
      transparent: true,
      opacity: 0.6
    })
    const trail = new THREE.Line(trailGeometry, trailMaterial)
    trail.userData.isTrail = true
    group.add(trail)

    group.position.set(projectile.startX, 0.5, projectile.startY)
    this.projectileMeshes.set(projectile.id, group)
    this.projectilesGroup.add(group)
  }

  private removeProjectileMesh(projId: string): void {
    const mesh = this.projectileMeshes.get(projId)
    if (mesh) {
      this.projectilesGroup.remove(mesh)
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
      this.projectileMeshes.delete(projId)
    }
  }

  private createDeathEffect(x: number, y: number): void {
    const id = `death_${++this.idCounter}`
    const ringGeometry = new THREE.RingGeometry(0.05, 0.1, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF0000,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, 0.02, y)
    this.effectsGroup.add(ring)
    this.deathEffects.set(id, { mesh: ring, startTime: performance.now() })
  }

  private createMuzzleFlash(towerId: string): void {
    const towerGroup = this.towerMeshes.get(towerId)
    if (!towerGroup) return

    towerGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isMuzzleFlash) {
        const material = child.material as THREE.MeshBasicMaterial
        material.opacity = 1
        child.scale.set(1, 1, 1)
        this.muzzleFlashes.set(towerId, { mesh: child, startTime: performance.now() })
      }
    })
  }

  private updateProjectiles(): void {
    const projectiles = this.towerSystem.getProjectiles()

    projectiles.forEach(proj => {
      const group = this.projectileMeshes.get(proj.id)
      if (!group) return

      const dx = proj.targetX - proj.startX
      const dy = proj.targetY - proj.startY
      const currentX = proj.startX + dx * Math.min(proj.progress, 1)
      const currentY = proj.startY + dy * Math.min(proj.progress, 1)

      group.position.set(currentX, 0.5, currentY)

      group.traverse((child) => {
        if (child instanceof THREE.Line && child.userData.isTrail) {
          const positions = new Float32Array(proj.trail.length * 3)
          proj.trail.forEach((point, i) => {
            positions[i * 3] = point.x
            positions[i * 3 + 1] = 0.5
            positions[i * 3 + 2] = point.y
          })
          child.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
          child.geometry.attributes.position.needsUpdate = true

          const material = child.material as THREE.LineBasicMaterial
          material.opacity = 0.6 * (1 - proj.progress)
        }
      })
    })
  }

  private updateEffects(): void {
    const currentTime = performance.now()

    this.deathEffects.forEach((effect, id) => {
      const progress = (currentTime - effect.startTime) / 300
      if (progress >= 1) {
        this.effectsGroup.remove(effect.mesh)
        effect.mesh.geometry.dispose()
        ;(effect.mesh.material as THREE.Material).dispose()
        this.deathEffects.delete(id)
      } else {
        const radius = 0.05 + progress * 0.25
        effect.mesh.geometry.dispose()
        effect.mesh.geometry = new THREE.RingGeometry(radius * 0.8, radius, 32)
        const material = effect.mesh.material as THREE.MeshBasicMaterial
        material.opacity = 0.3 * (1 - progress)
      }
    })

    this.muzzleFlashes.forEach((effect, id) => {
      const progress = (currentTime - effect.startTime) / 100
      if (progress >= 1) {
        const material = effect.mesh.material as THREE.MeshBasicMaterial
        material.opacity = 0
        this.muzzleFlashes.delete(id)
      } else {
        const scale = 1 - progress * 0.5
        effect.mesh.scale.set(scale, scale, scale)
        const material = effect.mesh.material as THREE.MeshBasicMaterial
        material.opacity = 1 - progress
      }
    })
  }

  private updateHealthBars(): void {
    this.gameEngine.getZombies().forEach(zombie => {
      const group = this.zombieMeshes.get(zombie.id)
      if (group) {
        this.updateHealthBar(group, zombie)
      }
    })
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this))

    this.updateProjectiles()
    this.updateEffects()
    this.updateHealthBars()

    this.towerSystem.getTowers().forEach(tower => {
      const group = this.towerMeshes.get(tower.id)
      if (group) {
        group.traverse((child) => {
          if (child.userData.isFlame || child.userData.isCrystal) {
            child.rotation.y += 0.02
          }
          if (child.userData.isAura) {
            child.rotation.z += 0.01
          }
        })
      }
    })

    this.renderer.render(this.scene, this.camera)
  }

  private onResize(): void {
    const aspect = window.innerWidth / window.innerHeight
    const viewSize = 12
    this.camera.left = -viewSize * aspect
    this.camera.right = viewSize * aspect
    this.camera.top = viewSize
    this.camera.bottom = -viewSize
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this))
    this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this))
    this.canvas.removeEventListener('click', this.onClick.bind(this))
    this.renderer.dispose()
  }
}
