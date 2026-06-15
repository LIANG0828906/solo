import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import TWEEN from '@tweenjs/tween.js'
import MoonClock, { MOON_PHASES, ORB_TYPES } from './moonClock.js'
import CollectibleManager from './collectible.js'
import NarrativeSystem from './narrative.js'
import EffectSystem from './effects.js'
import './style.css'

class Game {
  constructor() {
    this.scene = null
    this.camera = null
    this.renderer = null
    this.controls = null
    this.clock = new THREE.Clock()
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.moonClock = null
    this.collectibleManager = null
    this.narrativeSystem = null
    this.effectSystem = null

    this.selectedOrbType = null
    this.moonSurface = null
    this.craters = []

    this.frameCount = 0
    this.lastFpsUpdate = 0
    this.targetFps = 60
    this.frameInterval = 1000 / this.targetFps
    this.lastFrameTime = 0

    this.init()
  }

  init() {
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initControls()
    this.initLighting()
    this.initMoonSurface()
    this.initStarfield()
    this.initModules()
    this.initUI()
    this.initEventListeners()
    this.animate()

    this.collectibleManager.spawnWave(12, 8)
    this.narrativeSystem.unlockStory(0)
    this.narrativeSystem.showHologram(0)
  }

  initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0a1a)
    this.scene.fog = new THREE.Fog(0x0a0a1a, 15, 30)
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 10, 15)
    this.camera.lookAt(0, 2, 0)
  }

  initRenderer() {
    const container = document.getElementById('canvas-container')
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.enablePan = false
    this.controls.minDistance = 8
    this.controls.maxDistance = 25
    this.controls.minPolarAngle = Math.PI / 6
    this.controls.maxPolarAngle = Math.PI / 2.2
    this.controls.target.set(0, 2, 0)
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.3
  }

  initLighting() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5)
    this.scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2)
    sunLight.position.set(10, 15, 10)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 50
    sunLight.shadow.camera.left = -15
    sunLight.shadow.camera.right = 15
    sunLight.shadow.camera.top = 15
    sunLight.shadow.camera.bottom = -15
    sunLight.shadow.bias = -0.0001
    this.scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3)
    fillLight.position.set(-10, 5, -10)
    this.scene.add(fillLight)

    const moonLight = new THREE.PointLight(0x88ccff, 0.5, 20)
    moonLight.position.set(0, 5, 0)
    this.scene.add(moonLight)
  }

  initMoonSurface() {
    const surfaceGroup = new THREE.Group()

    const surfaceGeometry = new THREE.CylinderGeometry(10, 12, 1, 64, 4)
    const positions = surfaceGeometry.attributes.position.array
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 2]
      const distance = Math.sqrt(x * x + z * z)
      if (distance < 9.5 && distance > 2) {
        positions[i + 1] += (Math.random() - 0.5) * 0.2
      }
    }
    surfaceGeometry.computeVertexNormals()

    const surfaceMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      roughness: 0.9,
      metalness: 0.1
    })

    this.moonSurface = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
    this.moonSurface.receiveShadow = true
    surfaceGroup.add(this.moonSurface)

    this.createCraters(surfaceGroup)

    const rimGeometry = new THREE.TorusGeometry(10, 0.3, 16, 64)
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x777777,
      roughness: 0.7,
      metalness: 0.3
    })
    const rim = new THREE.Mesh(rimGeometry, rimMaterial)
    rim.rotation.x = Math.PI / 2
    rim.position.y = 0.5
    rim.receiveShadow = true
    surfaceGroup.add(rim)

    this.scene.add(surfaceGroup)
  }

  createCraters(surfaceGroup) {
    const craterPositions = [
      { x: 4, z: 3, radius: 1.2 },
      { x: -5, z: 2, radius: 0.8 },
      { x: 2, z: -6, radius: 1.5 },
      { x: -3, z: -4, radius: 0.7 },
      { x: 6, z: -2, radius: 1.0 },
      { x: -6, z: -1, radius: 0.9 }
    ]

    craterPositions.forEach((pos, index) => {
      const craterGeometry = new THREE.CylinderGeometry(
        pos.radius,
        pos.radius * 0.7,
        0.4,
        32
      )
      const craterMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.95,
        metalness: 0.05
      })
      const crater = new THREE.Mesh(craterGeometry, craterMaterial)
      crater.position.set(pos.x, 0.1, pos.z)
      crater.receiveShadow = true
      crater.userData = { craterIndex: index }
      surfaceGroup.add(crater)
      this.craters.push(crater)

      const rimGeometry = new THREE.TorusGeometry(pos.radius, 0.1, 8, 32)
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.8,
        metalness: 0.1
      })
      const rim = new THREE.Mesh(rimGeometry, rimMaterial)
      rim.rotation.x = Math.PI / 2
      rim.position.set(pos.x, 0.4, pos.z)
      rim.receiveShadow = true
      surfaceGroup.add(rim)
    })
  }

  initStarfield() {
    const starsGeometry = new THREE.BufferGeometry()
    const starCount = 2000
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      const radius = 50 + Math.random() * 50
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.cos(phi)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)

      const brightness = 0.5 + Math.random() * 0.5
      const colorChoice = Math.random()
      if (colorChoice < 0.7) {
        colors[i * 3] = brightness
        colors[i * 3 + 1] = brightness
        colors[i * 3 + 2] = brightness
      } else if (colorChoice < 0.85) {
        colors[i * 3] = brightness * 0.8
        colors[i * 3 + 1] = brightness * 0.9
        colors[i * 3 + 2] = brightness
      } else {
        colors[i * 3] = brightness
        colors[i * 3 + 1] = brightness * 0.85
        colors[i * 3 + 2] = brightness * 0.7
      }
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    })

    const stars = new THREE.Points(starsGeometry, starsMaterial)
    this.scene.add(stars)
  }

  initModules() {
    this.moonClock = new MoonClock(this.scene)
    this.collectibleManager = new CollectibleManager(this.scene)
    this.narrativeSystem = new NarrativeSystem()
    this.effectSystem = new EffectSystem(this.scene)

    this.moonClock.onRepairComplete((phase) => {
      this.onRepairComplete(phase)
    })

    this.collectibleManager.onCollect((orbType, position) => {
      this.effectSystem.createCollectEffect(position)
      this.updateInventoryUI()
    })
  }

  initUI() {
    this.updateInventoryUI()
    this.updatePhaseIndicator()
    this.updateHintText()
  }

  updateInventoryUI() {
    const orbGrid = document.querySelector('.orb-grid')
    if (!orbGrid) return

    const orbTypes = Object.values(ORB_TYPES)
    orbGrid.innerHTML = ''

    orbTypes.forEach(orbData => {
      const count = this.collectibleManager.getOrbCount(orbData.id)
      const orbItem = document.createElement('div')
      orbItem.className = `orb-item ${this.selectedOrbType === orbData.id ? 'selected' : ''}`
      orbItem.dataset.orbType = orbData.id
      orbItem.innerHTML = `
        <div class="orb-icon orb-${orbData.id}"></div>
        <span class="orb-count">${count}</span>
        <span class="orb-name">${orbData.name}</span>
      `

      orbItem.addEventListener('click', () => {
        if (count > 0) {
          this.selectedOrbType = this.selectedOrbType === orbData.id ? null : orbData.id
          this.updateInventoryUI()
          this.updateHintText()
        }
      })

      orbGrid.appendChild(orbItem)
    })
  }

  updatePhaseIndicator() {
    const phaseIcons = document.querySelector('.phase-icons')
    const phaseText = document.querySelector('.phase-text')
    if (!phaseIcons || !phaseText) return

    phaseIcons.innerHTML = ''
    MOON_PHASES.forEach((phase, index) => {
      const icon = document.createElement('div')
      icon.className = `phase-icon ${index <= this.moonClock.currentPhase ? 'active' : ''}`
      phaseIcons.appendChild(icon)
    })

    const currentPhaseData = MOON_PHASES[Math.floor(this.moonClock.currentPhase)]
    phaseText.textContent = `${currentPhaseData.name} · ${Math.floor(this.moonClock.currentPhase) + 1}/${MOON_PHASES.length}`
  }

  updateHintText() {
    const hintText = document.querySelector('.hint-text')
    if (!hintText) return

    if (this.selectedOrbType) {
      const orbData = Object.values(ORB_TYPES).find(o => o.id === this.selectedOrbType)
      hintText.textContent = `已选中 ${orbData.name}，点击齿轮槽位嵌入光玉，或按 ESC 取消选择`
    } else {
      hintText.textContent = '点击光玉收集 · 左键旋转视角 · 滚轮缩放'
    }
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize())
    window.addEventListener('click', (event) => this.onMouseClick(event))
    window.addEventListener('keydown', (event) => this.onKeyDown(event))
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  onMouseClick(event) {
    if (event.target.closest('.ui-panel') || event.target.closest('.hologram-overlay')) {
      return
    }

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    if (this.selectedOrbType) {
      const gearSlots = this.moonClock.getGearSlotMeshes()
      const intersects = this.raycaster.intersectObjects(gearSlots, true)

      if (intersects.length > 0) {
        let slot = intersects[0].object
        while (slot && !slot.userData.isOrbSlot) {
          slot = slot.parent
        }

        if (slot && slot.userData.isOrbSlot) {
          const gearIndex = slot.userData.gearIndex
          if (this.collectibleManager.useOrb(this.selectedOrbType)) {
            this.moonClock.embedOrb(gearIndex, this.selectedOrbType)
            this.selectedOrbType = null
            this.updateInventoryUI()
            this.updateHintText()
            return
          }
        }
      }
    }

    const orbMeshes = this.collectibleManager.getOrbMeshes()
    const orbIntersects = this.raycaster.intersectObjects(orbMeshes, true)

    if (orbIntersects.length > 0) {
      let orb = orbIntersects[0].object
      while (orb && !orb.userData.collectible) {
        orb = orb.parent
      }

      if (orb && orb.userData.collectible) {
        this.collectibleManager.collectOrb(orb)
        return
      }
    }
  }

  onKeyDown(event) {
    if (event.key === 'Escape') {
      this.selectedOrbType = null
      this.updateInventoryUI()
      this.updateHintText()
    }
  }

  onRepairComplete(phase) {
    const actualPhase = Math.floor(phase) % MOON_PHASES.length

    this.effectSystem.createPhaseFlow(actualPhase)
    this.effectSystem.createMoonGlow(1)

    this.narrativeSystem.unlockStory(actualPhase)
    this.narrativeSystem.showHologram(actualPhase)

    this.updatePhaseIndicator()

    setTimeout(() => {
      this.collectibleManager.spawnWave(8, 8)
    }, 2000)

    if (actualPhase === MOON_PHASES.length - 1) {
      setTimeout(() => {
        this.showGameComplete()
      }, 3000)
    }
  }

  showGameComplete() {
    const overlay = document.querySelector('.hologram-overlay')
    if (overlay) {
      const title = document.getElementById('hologram-title')
      const text = document.getElementById('hologram-text')
      const content = document.getElementById('hologram-content')

      if (title) title.textContent = '🎉 恭喜完成！'
      if (text) text.textContent = '「时间的守护者，你的使命已经完成」'
      if (content) content.textContent = '你成功修复了月相计时器，解锁了月球文明的全部记忆。作为新的时间守护者，你将带着这份古老的智慧，继续守护宇宙的秩序。感谢你的游玩！'

      overlay.classList.add('active')
    }
  }

  animate(currentTime = 0) {
    requestAnimationFrame((time) => this.animate(time))

    const deltaTime = currentTime - this.lastFrameTime
    if (deltaTime < this.frameInterval) {
      return
    }
    this.lastFrameTime = currentTime - (deltaTime % this.frameInterval)

    const delta = this.clock.getDelta()
    const elapsedTime = this.clock.getElapsedTime()

    TWEEN.update(currentTime)

    this.controls.update()

    if (this.moonClock) {
      this.moonClock.update(delta)
    }

    if (this.collectibleManager) {
      this.collectibleManager.update(delta, elapsedTime)
    }

    if (this.effectSystem) {
      this.effectSystem.update(delta)
    }

    this.updatePhaseIndicator()

    this.frameCount++
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.lastFpsUpdate = currentTime
      this.frameCount = 0
    }

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    if (this.moonClock) this.moonClock.dispose()
    if (this.collectibleManager) this.collectibleManager.dispose()
    if (this.narrativeSystem) this.narrativeSystem.dispose()
    if (this.effectSystem) this.effectSystem.dispose()

    this.renderer.dispose()
    this.controls.dispose()

    window.removeEventListener('resize', () => this.onWindowResize())
    window.removeEventListener('click', (event) => this.onMouseClick(event))
    window.removeEventListener('keydown', (event) => this.onKeyDown(event))
  }
}

const game = new Game()
window.game = game

export default Game
