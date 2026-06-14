import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import * as TWEEN from '@tweenjs/tween.js'
import { scaleLinear } from 'd3-scale'
import type { FloorEnergyData, Direction, BarClickPayload } from '@/types'
import { DIRECTION_LABELS, DIRECTION_ORDER } from '@/types'

type EventCallback = (...args: any[]) => void

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
    return this
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args))
    }
    return this
  }
}

interface EnergyBarGroup {
  mesh: THREE.Mesh
  topDot: THREE.Mesh
  direction: Direction
  floor: number
  currentHeight: number
  targetHeight: number
  baseScale: THREE.Vector3
}

export default class Building3D extends EventEmitter {
  private container: HTMLElement
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private labelRenderer!: CSS2DRenderer
  private controls!: OrbitControls
  private animationId: number = 0

  private buildingWidth: number = 30
  private buildingDepth: number = 20

  private floorSlabs: THREE.Mesh[] = []
  private energyBars: EnergyBarGroup[] = []
  private buildingFacade: THREE.Group | null = null
  private baseDisc: THREE.Mesh | null = null

  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private mouse: THREE.Vector2 = new THREE.Vector2()
  private hoveredBar: EnergyBarGroup | null = null
  private selectedBar: EnergyBarGroup | null = null
  private infoCardElement: HTMLDivElement | null = null
  private infoCardCSS2D: CSS2DObject | null = null

  private colorScale!: (t: number) => string
  private maxValue: number = 800
  private barMaxHeight: number = 12

  private clock: THREE.Clock = new THREE.Clock()

  private floorData: FloorEnergyData[] = []
  private highlightedFloor: number = 0

  constructor(container: HTMLElement) {
    super()
    this.container = container
  }

  init() {
    this.initColorScale()
    this.createScene()
    this.createCamera()
    this.createRenderer()
    this.createControls()
    this.createLights()
    this.createBaseDisc()
    this.createBuilding()
    this.addEventListeners()
    this.animateCameraEntry()
    this.startLoop()
  }

  private initColorScale() {
    this.colorScale = scaleLinear<string>()
      .domain([0, 0.25, 0.5, 0.75, 1])
      .range(['#0a2463', '#1e88e5', '#43a047', '#ff9800', '#e53935'])
      .clamp(true)
  }

  private createScene() {
    this.scene = new THREE.Scene()
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(1, 0.5, 0, 1, 0.5, 1.5)
    gradient.addColorStop(0, '#1a1a4e')
    gradient.addColorStop(0.5, '#0f0f2e')
    gradient.addColorStop(1, '#080820')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 2)
    const texture = new THREE.CanvasTexture(canvas)
    this.scene.background = texture
    this.scene.fog = new THREE.FogExp2(0x0a0a25, 0.015)
  }

  private createCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000)
    this.camera.position.set(60, 55, 70)
    this.camera.lookAt(0, 12, 0)
  }

  private createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.position = 'absolute'
    this.renderer.domElement.style.top = '0'
    this.renderer.domElement.style.left = '0'

    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.labelRenderer.domElement.style.position = 'absolute'
    this.labelRenderer.domElement.style.top = '0'
    this.labelRenderer.domElement.style.left = '0'
    this.labelRenderer.domElement.style.pointerEvents = 'none'
    this.container.appendChild(this.labelRenderer.domElement)
  }

  private createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 30
    this.controls.maxDistance = 150
    this.controls.maxPolarAngle = Math.PI * 0.48
    this.controls.minPolarAngle = Math.PI * 0.15
    this.controls.target.set(0, 12, 0)
    this.controls.enablePan = false
  }

  private createLights() {
    const ambient = new THREE.AmbientLight(0x5050a0, 0.6)
    this.scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(40, 60, 30)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.set(2048, 2048)
    dirLight.shadow.camera.left = -60
    dirLight.shadow.camera.right = 60
    dirLight.shadow.camera.top = 60
    dirLight.shadow.camera.bottom = -60
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 200
    this.scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0x7a9cff, 0.5)
    fillLight.position.set(-30, 20, -20)
    this.scene.add(fillLight)

    const bottomLight = new THREE.PointLight(0x6c5ce7, 0.8, 100)
    bottomLight.position.set(0, 2, 0)
    this.scene.add(bottomLight)

    const hemi = new THREE.HemisphereLight(0x6a5acd, 0x1a1a3e, 0.4)
    this.scene.add(hemi)
  }

  private createBaseDisc() {
    const group = new THREE.Group()

    const discGeo = new THREE.CylinderGeometry(38, 42, 0.8, 64)
    const discMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a2952,
      metalness: 0.7,
      roughness: 0.3,
      transparent: true,
      opacity: 0.7,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2
    })
    const disc = new THREE.Mesh(discGeo, discMat)
    disc.position.y = -0.4
    disc.receiveShadow = true
    group.add(disc)

    const ringGeo = new THREE.TorusGeometry(40, 0.15, 16, 100)
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4a9eff })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    group.add(ring)

    const directionLabels: { label: string; angle: number }[] = [
      { label: '北', angle: Math.PI / 2 },
      { label: '南', angle: -Math.PI / 2 },
      { label: '东', angle: 0 },
      { label: '西', angle: Math.PI }
    ]

    directionLabels.forEach(({ label, angle }) => {
      const div = document.createElement('div')
      div.textContent = label
      div.style.cssText = `
        color: #7ac4ff;
        font-family: 'Inter', sans-serif;
        font-size: 18px;
        font-weight: 700;
        text-shadow: 0 0 10px #4a9eff, 0 0 20px #4a9eff80;
        background: rgba(20, 30, 70, 0.6);
        padding: 6px 14px;
        border-radius: 8px;
        border: 1px solid rgba(74, 158, 255, 0.4);
        backdrop-filter: blur(4px);
        pointer-events: none;
      `
      const cssObj = new CSS2DObject(div)
      const r = 42
      cssObj.position.set(Math.cos(angle) * r, 1.5, -Math.sin(angle) * r)
      group.add(cssObj)

      const arrowGeo = new THREE.ConeGeometry(0.6, 1.8, 8)
      const arrowMat = new THREE.MeshBasicMaterial({ color: 0x4a9eff })
      const arrow = new THREE.Mesh(arrowGeo, arrowMat)
      const ar = 36
      arrow.position.set(Math.cos(angle) * ar, 0.8, -Math.sin(angle) * ar)
      arrow.rotation.z = angle
      arrow.rotation.x = Math.PI / 2
      group.add(arrow)
    })

    this.baseDisc = disc
    this.scene.add(group)
  }

  private createBuilding() {
    this.buildingFacade = new THREE.Group()
    const floorHeights = [5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 4]
    let currentY = 0

    for (let i = 0; i < 8; i++) {
      const h = floorHeights[i]
      this.createFloor(currentY, h, i + 1)
      currentY += h
    }

    const totalHeight = currentY
    this.createGlassFacade(totalHeight)
    this.scene.add(this.buildingFacade)
  }

  private createFloor(y: number, height: number, floorNum: number) {
    const w = this.buildingWidth
    const d = this.buildingDepth

    const slabGeo = new THREE.BoxGeometry(w + 1, 0.4, d + 1)
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: 0x2c2c4e,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 0.6,
      clearcoatRoughness: 0.3
    })
    const slab = new THREE.Mesh(slabGeo, slabMat)
    slab.position.set(0, y + height, 0)
    slab.castShadow = true
    slab.receiveShadow = true
    slab.userData.floor = floorNum
    this.floorSlabs.push(slab)
    this.buildingFacade?.add(slab)

    const edgeGeo = new THREE.BoxGeometry(w + 1.4, 0.08, d + 1.4)
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x4a9eff, transparent: true, opacity: 0.6 })
    const edge = new THREE.Mesh(edgeGeo, edgeMat)
    edge.position.set(0, y + height + 0.24, 0)
    this.buildingFacade?.add(edge)

    this.createEnergyBars(y + height, floorNum)
  }

  private createGlassFacade(totalHeight: number) {
    const w = this.buildingWidth
    const d = this.buildingDepth
    const h = totalHeight

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88bbee,
      metalness: 0,
      roughness: 0.05,
      transmission: 0.7,
      transparent: true,
      opacity: 0.35,
      reflectivity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide
    })

    const thickness = 0.2
    const faces: { geo: THREE.BufferGeometry; pos: THREE.Vector3; rot: THREE.Euler }[] = [
      { geo: new THREE.BoxGeometry(w, h, thickness), pos: new THREE.Vector3(0, h / 2, d / 2), rot: new THREE.Euler(0, 0, 0) },
      { geo: new THREE.BoxGeometry(w, h, thickness), pos: new THREE.Vector3(0, h / 2, -d / 2), rot: new THREE.Euler(0, 0, 0) },
      { geo: new THREE.BoxGeometry(thickness, h, d), pos: new THREE.Vector3(w / 2, h / 2, 0), rot: new THREE.Euler(0, 0, 0) },
      { geo: new THREE.BoxGeometry(thickness, h, d), pos: new THREE.Vector3(-w / 2, h / 2, 0), rot: new THREE.Euler(0, 0, 0) }
    ]

    faces.forEach(({ geo, pos, rot }) => {
      const mesh = new THREE.Mesh(geo, glassMat)
      mesh.position.copy(pos)
      mesh.rotation.copy(rot)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.buildingFacade?.add(mesh)
    })

    const frameMat = new THREE.MeshBasicMaterial({ color: 0x4a9eff, transparent: true, opacity: 0.5 })
    for (let i = 0; i < 8; i++) {
      let fy = 0
      for (let j = 0; j < i; j++) {
        fy += [5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 4][j]
      }
      fy += [5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 4][i]

      const frameEdges = [
        { size: [w + 0.6, 0.06, 0.06], pos: [0, fy, d / 2 + 0.1] },
        { size: [w + 0.6, 0.06, 0.06], pos: [0, fy, -d / 2 - 0.1] },
        { size: [0.06, 0.06, d + 0.6], pos: [w / 2 + 0.1, fy, 0] },
        { size: [0.06, 0.06, d + 0.6], pos: [-w / 2 - 0.1, fy, 0] }
      ]

      frameEdges.forEach(({ size, pos }) => {
        const fg = new THREE.BoxGeometry(size[0], size[1], size[2])
        const fm = new THREE.Mesh(fg, frameMat)
        fm.position.set(pos[0], pos[1], pos[2])
        this.buildingFacade?.add(fm)
      })
    }
  }

  private createEnergyBars(slabY: number, floorNum: number) {
    const w = this.buildingWidth / 2 + 1.8
    const d = this.buildingDepth / 2 + 1.8

    const positions: Record<Direction, { x: number; z: number; rot: number }> = {
      north: { x: 0, z: d, rot: 0 },
      south: { x: 0, z: -d, rot: Math.PI },
      east: { x: w, z: 0, rot: -Math.PI / 2 },
      west: { x: -w, z: 0, rot: Math.PI / 2 }
    }

    DIRECTION_ORDER.forEach((dir) => {
      const p = positions[dir]
      const group = this.createEnergyBar(floorNum, dir, slabY, p)
      this.energyBars.push(group)
    })
  }

  private createEnergyBar(floor: number, direction: Direction, baseY: number, pos: { x: number; z: number; rot: number }): EnergyBarGroup {
    const barWidth = 2.2
    const barDepth = 1.2
    const initialHeight = 0.5

    const geo = new THREE.BoxGeometry(barWidth, initialHeight, barDepth)
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x1e88e5,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.95,
      emissive: 0x000000,
      emissiveIntensity: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(pos.x, baseY + initialHeight / 2, pos.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.floor = floor
    mesh.userData.direction = direction
    mesh.userData.isEnergyBar = true
    this.buildingFacade?.add(mesh)

    const dotGeo = new THREE.SphereGeometry(0.25, 24, 24)
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const topDot = new THREE.Mesh(dotGeo, dotMat)
    topDot.position.set(pos.x, baseY + initialHeight + 0.25, pos.z)
    this.buildingFacade?.add(topDot)

    const glowGeo = new THREE.SphereGeometry(0.45, 16, 16)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.copy(topDot.position)
    this.buildingFacade?.add(glow)
    topDot.userData.glow = glow

    return {
      mesh,
      topDot,
      direction,
      floor,
      currentHeight: initialHeight,
      targetHeight: initialHeight,
      baseScale: new THREE.Vector3(1, 1, 1)
    }
  }

  private addEventListeners() {
    window.addEventListener('resize', this.onResize)
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove)
    this.renderer.domElement.addEventListener('click', this.onClick)
  }

  private onResize = () => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.labelRenderer.setSize(w, h)
  }

  private onMouseMove = (e: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const barMeshes = this.energyBars.map((b) => b.mesh)
    const intersects = this.raycaster.intersectObjects(barMeshes, false)

    if (this.hoveredBar && (!intersects.length || intersects[0].object.userData !== this.hoveredBar.mesh.userData)) {
      this.setBarHover(this.hoveredBar, false)
      this.hoveredBar = null
      this.renderer.domElement.style.cursor = 'default'
    }

    if (intersects.length > 0) {
      const bar = this.energyBars.find((b) => b.mesh === intersects[0].object)
      if (bar && bar !== this.hoveredBar && bar !== this.selectedBar) {
        this.hoveredBar = bar
        this.setBarHover(bar, true)
        this.renderer.domElement.style.cursor = 'pointer'
      }
    }
  }

  private onClick = (e: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const barMeshes = this.energyBars.map((b) => b.mesh)
    const intersects = this.raycaster.intersectObjects(barMeshes, false)

    if (intersects.length > 0) {
      const bar = this.energyBars.find((b) => b.mesh === intersects[0].object)
      if (bar) {
        this.selectBar(bar)
        return
      }
    }

    const slabIntersects = this.raycaster.intersectObjects(this.floorSlabs, false)
    if (slabIntersects.length > 0) {
      const floor = slabIntersects[0].object.userData.floor as number
      if (floor) {
        this.emit('floorSelected', floor)
        return
      }
    }

    this.clearBarSelection()
  }

  private setBarHover(bar: EnergyBarGroup, hovered: boolean) {
    const target = hovered ? 1.08 : 1
    new TWEEN.Tween(bar.mesh.scale)
      .to({ x: target, z: target }, 200)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()

    const mat = bar.mesh.material as THREE.MeshPhysicalMaterial
    new TWEEN.Tween(mat)
      .to({ emissiveIntensity: hovered ? 0.5 : 0.2 }, 200)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
  }

  private selectBar(bar: EnergyBarGroup) {
    if (this.selectedBar === bar) {
      this.clearBarSelection()
      return
    }

    if (this.selectedBar) {
      this.setBarSelection(this.selectedBar, false)
    }

    this.selectedBar = bar
    this.setBarSelection(bar, true)

    const floorData = this.floorData.find((f) => f.floor === bar.floor)
    const dirData = floorData?.directions.find((d) => d.direction === bar.direction)

    if (dirData) {
      this.showInfoCard(bar, floorData!, dirData.value, dirData.changePercent)
      this.emit('barClicked', {
        floor: bar.floor,
        direction: DIRECTION_LABELS[bar.direction],
        value: dirData.value,
        changePercent: dirData.changePercent,
        position: {
          x: bar.mesh.position.x,
          y: bar.mesh.position.y + bar.currentHeight / 2,
          z: bar.mesh.position.z
        }
      })
    }
  }

  private clearBarSelection() {
    if (this.selectedBar) {
      this.setBarSelection(this.selectedBar, false)
      this.selectedBar = null
    }
    this.hideInfoCard()
    this.emit('barClicked', null)
  }

  private setBarSelection(bar: EnergyBarGroup, selected: boolean) {
    const target = selected ? 1.15 : 1
    new TWEEN.Tween(bar.mesh.scale)
      .to({ x: target, y: 1, z: target }, 250)
      .easing(TWEEN.Easing.Back.Out)
      .start()

    const mat = bar.mesh.material as THREE.MeshPhysicalMaterial
    new TWEEN.Tween(mat)
      .to({ emissiveIntensity: selected ? 0.8 : 0.2 }, 250)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start()
  }

  private showInfoCard(bar: EnergyBarGroup, floorData: FloorEnergyData, value: number, changePercent: number) {
    this.hideInfoCard()

    const card = document.createElement('div')
    card.className = 'energy-info-card'
    const changeColor = changePercent >= 0 ? '#ff6b6b' : '#51cf66'
    const changeIcon = changePercent >= 0 ? '↑' : '↓'

    card.innerHTML = `
      <div class="card-header">
        <span class="floor-tag">${floorData.name}</span>
        <span class="dir-tag">${DIRECTION_LABELS[bar.direction]}向</span>
      </div>
      <div class="card-value">${value.toLocaleString()}<span class="unit">kWh</span></div>
      <div class="card-change" style="color: ${changeColor}">
        ${changeIcon} ${Math.abs(changePercent).toFixed(1)}% <span class="card-change-label">同比上周</span>
      </div>
    `

    card.style.cssText = `
      background: rgba(20, 25, 50, 0.75);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(120, 170, 255, 0.35);
      border-radius: 14px;
      padding: 16px 20px;
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      min-width: 200px;
      box-shadow: 0 8px 32px rgba(74, 120, 255, 0.25), inset 0 1px 0 rgba(255,255,255,0.1);
      pointer-events: none;
    `

    const styleId = 'energy-card-style'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .card-header { display: flex; gap: 8px; margin-bottom: 10px; }
        .floor-tag {
          background: linear-gradient(135deg, #4a9eff, #6c5ce7);
          padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
        }
        .dir-tag {
          background: rgba(74, 158, 255, 0.2);
          padding: 3px 10px; border-radius: 20px; font-size: 12px;
          border: 1px solid rgba(74, 158, 255, 0.4);
        }
        .card-value {
          font-size: 30px; font-weight: 700; letter-spacing: -0.5px;
          background: linear-gradient(135deg, #7ac4ff, #b197fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }
        .unit { font-size: 14px; font-weight: 500; opacity: 0.7; margin-left: 4px; -webkit-text-fill-color: #b0c4e8; }
        .card-change { font-size: 14px; font-weight: 600; margin-top: 8px; }
        .card-change-label { opacity: 0.6; font-weight: 400; font-size: 12px; margin-left: 4px; }
      `
      document.head.appendChild(style)
    }

    this.infoCardElement = card
    this.infoCardCSS2D = new CSS2DObject(card)
    this.infoCardCSS2D.position.set(
      bar.mesh.position.x,
      bar.mesh.position.y + bar.currentHeight + 3,
      bar.mesh.position.z
    )
    this.scene.add(this.infoCardCSS2D)
  }

  private hideInfoCard() {
    if (this.infoCardCSS2D) {
      this.scene.remove(this.infoCardCSS2D)
      this.infoCardCSS2D = null
    }
    if (this.infoCardElement) {
      this.infoCardElement.remove()
      this.infoCardElement = null
    }
  }

  private animateCameraEntry() {
    const startPos = { x: 120, y: 100, z: 120 }
    const endPos = { x: 60, y: 55, z: 70 }
    this.camera.position.set(startPos.x, startPos.y, startPos.z)

    new TWEEN.Tween(startPos)
      .to(endPos, 2000)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        this.camera.position.set(startPos.x, startPos.y, startPos.z)
        this.camera.lookAt(0, 12, 0)
      })
      .start()
  }

  updateFloorData(data: FloorEnergyData[]) {
    this.floorData = data

    let max = 0
    data.forEach((f) => f.directions.forEach((d) => (max = Math.max(max, d.value))))
    this.maxValue = Math.max(max, this.maxValue * 0.8)

    data.forEach((floorData) => {
      floorData.directions.forEach((dirData) => {
        const bar = this.energyBars.find((b) => b.floor === floorData.floor && b.direction === dirData.direction)
        if (bar) {
          this.animateBar(bar, dirData.value, floorData.baseY + floorData.height)
        }
      })
    })
  }

  private animateBar(bar: EnergyBarGroup, value: number, slabY: number) {
    const normalized = Math.min(value / this.maxValue, 1)
    const newHeight = Math.max(0.4, normalized * this.barMaxHeight)
    const colorHex = this.colorScale(normalized)
    const color = new THREE.Color(colorHex)

    const obj = { h: bar.currentHeight }
    const duration = 300

    new TWEEN.Tween(obj)
      .to({ h: newHeight }, duration)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        bar.currentHeight = obj.h
        bar.mesh.scale.y = obj.h / Math.max(bar.mesh.userData.originalHeight || 0.5, 0.01)
        const geo = bar.mesh.geometry as THREE.BoxGeometry
        const originalH = geo.parameters.height
        bar.mesh.scale.y = obj.h / originalH
        bar.mesh.position.y = slabY + obj.h / 2
        bar.topDot.position.y = slabY + obj.h + 0.25
        const glow = bar.topDot.userData.glow
        if (glow) glow.position.y = slabY + obj.h + 0.25
      })
      .start()

    const mat = bar.mesh.material as THREE.MeshPhysicalMaterial
    const curColor = mat.color.clone()
    const colorTween = { t: 0 }
    new TWEEN.Tween(colorTween)
      .to({ t: 1 }, duration)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(() => {
        mat.color.copy(curColor).lerp(color, colorTween.t)
        mat.emissive.copy(color).multiplyScalar(0.15 + colorTween.t * 0.1)
      })
      .start()

    const dotMat = bar.topDot.material as THREE.MeshBasicMaterial
    const curDotColor = dotMat.color.clone()
    new TWEEN.Tween({ t: 0 })
      .to({ t: 1 }, duration)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate(({ t }) => {
        dotMat.color.copy(curDotColor).lerp(color, t)
      })
      .start()

    bar.targetHeight = newHeight
  }

  setFloorHighlight(floor: number) {
    this.highlightedFloor = floor

    this.floorSlabs.forEach((slab) => {
      const f = slab.userData.floor as number
      const mat = slab.material as THREE.MeshPhysicalMaterial
      const targetOpacity = floor === 0 || f === floor ? 1 : 0.15
      mat.transparent = true
      new TWEEN.Tween(mat)
        .to({ opacity: targetOpacity }, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()
    })

    this.energyBars.forEach((bar) => {
      const mat = bar.mesh.material as THREE.MeshPhysicalMaterial
      const targetOpacity = floor === 0 || bar.floor === floor ? 0.95 : 0.1
      mat.transparent = true
      new TWEEN.Tween(mat)
        .to({ opacity: targetOpacity }, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()

      const dotMat = bar.topDot.material as THREE.MeshBasicMaterial
      const targetDotOpacity = floor === 0 || bar.floor === floor ? 1 : 0.1
      dotMat.transparent = true
      new TWEEN.Tween(dotMat)
        .to({ opacity: targetDotOpacity }, 300)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()

      const glow = bar.topDot.userData.glow
      if (glow) {
        const glowMat = glow.material as THREE.MeshBasicMaterial
        const glowTarget = floor === 0 || bar.floor === floor ? 0.25 : 0.02
        new TWEEN.Tween(glowMat)
          .to({ opacity: glowTarget }, 300)
          .easing(TWEEN.Easing.Quadratic.Out)
          .start()
      }
    })

    if (this.buildingFacade) {
      this.buildingFacade.children.forEach((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const userData = mesh.userData
          if (!userData.floor && !userData.isEnergyBar && !userData.glow) {
            const mat = mesh.material as THREE.Material & { opacity?: number; transparent?: boolean }
            if ('opacity' in mat) {
              const targetOpacity = floor === 0 ? 0.35 : 0.08
              mat.transparent = true
              new TWEEN.Tween(mat)
                .to({ opacity: targetOpacity }, 300)
                .easing(TWEEN.Easing.Quadratic.Out)
                .start()
            }
          }
        }
      })
    }
  }

  private startLoop() {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop)
      const delta = this.clock.getDelta()
      TWEEN.update()
      this.controls.update()
      this.updateTopDotPulse()
      this.renderer.render(this.scene, this.camera)
      this.labelRenderer.render(this.scene, this.camera)
    }
    loop()
  }

  private updateTopDotPulse() {
    const t = this.clock.getElapsedTime()
    this.energyBars.forEach((bar) => {
      const pulse = 1 + Math.sin(t * 3 + bar.floor * 0.5) * 0.15
      bar.topDot.scale.setScalar(pulse)
      const glow = bar.topDot.userData.glow
      if (glow) {
        glow.scale.setScalar(1.4 + Math.sin(t * 3 + bar.floor * 0.5) * 0.25)
      }
    })
  }

  dispose() {
    window.removeEventListener('resize', this.onResize)
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove)
    this.renderer.domElement.removeEventListener('click', this.onClick)

    cancelAnimationFrame(this.animationId)
    TWEEN.removeAll()

    this.hideInfoCard()

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.geometry?.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose())
        } else {
          mesh.material?.dispose()
        }
      }
    })

    this.renderer.dispose()
    this.controls.dispose()

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }
    if (this.labelRenderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.labelRenderer.domElement)
    }
  }
}
