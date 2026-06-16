import * as THREE from 'three'
import type { ChartType, Dataset, DataSeries, DataPoint, ViewState } from './types'
import { useDataStore } from './dataStore'
import { createBars, createLine, createScatter } from './chartFactory'

interface ChartInstance {
  seriesId: string
  chartType: ChartType
  group: THREE.Group
  objects: Map<number, THREE.Mesh>
  animateIn: () => void
  animateOut: () => Promise<void>
  updateData: (data: DataPoint[], progress?: number) => void
  dispose: () => void
}

export class SceneManager {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  
  private chartGroups: Map<string, ChartInstance> = new Map()
  private chartsContainer: THREE.Group
  
  private stars: THREE.Points | null = null
  private starCount = 300
  private starSizes: Float32Array | null = null
  
  private isDragging = false
  private previousMousePosition = { x: 0, y: 0 }
  private spherical = { theta: 0, phi: Math.PI / 4, radius: 35 }
  private targetSpherical = { theta: 0, phi: Math.PI / 4, radius: 35 }
  
  private autoRotate = false
  private autoRotateSpeed = 0.5
  private lastInteractionTime = 0
  private autoRotatePaused = false
  
  private highlightedObject: THREE.Mesh | null = null
  private highlightOriginalScale = 1
  private highlightOriginalColor = new THREE.Color()
  
  private animationFrameId: number = 0
  private clock: THREE.Clock
  
  private groundPlane: THREE.Mesh | null = null
  
  private onPointClick: ((point: { seriesId: string; pointIndex: number; data: DataPoint; seriesName: string } | null) => void) | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.clock = new THREE.Clock()
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0B0E1A)
    this.scene.fog = new THREE.Fog(0x0B0E1A, 50, 100)
    
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 15, 30)
    this.camera.lookAt(0, 0, 0)
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    
    container.appendChild(this.renderer.domElement)
    
    this.chartsContainer = new THREE.Group()
    this.scene.add(this.chartsContainer)
    
    this.setupLights()
    this.createStars()
    this.createGroundPlane()
    this.setupEventListeners()
    this.animate()
  }

  private setupLights() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4)
    this.scene.add(ambientLight)
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
    mainLight.position.set(10, 20, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 100
    mainLight.shadow.camera.left = -30
    mainLight.shadow.camera.right = 30
    mainLight.shadow.camera.top = 30
    mainLight.shadow.camera.bottom = -30
    this.scene.add(mainLight)
    
    const fillLight = new THREE.DirectionalLight(0x007BFF, 0.3)
    fillLight.position.set(-10, 10, -10)
    this.scene.add(fillLight)
    
    const rimLight = new THREE.PointLight(0xFF6B35, 0.5, 50)
    rimLight.position.set(0, 15, -20)
    this.scene.add(rimLight)
  }

  private createStars() {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.starCount * 3)
    const colors = new Float32Array(this.starCount * 3)
    this.starSizes = new Float32Array(this.starCount)
    
    for (let i = 0; i < this.starCount; i++) {
      const radius = 70 + Math.random() * 40
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.cos(phi)
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta)
      
      const colorChoice = Math.random()
      if (colorChoice < 0.25) {
        colors.set([1, 0.85, 0.7], i * 3)
      } else if (colorChoice < 0.5) {
        colors.set([0.75, 0.85, 1], i * 3)
      } else if (colorChoice < 0.75) {
        colors.set([0.9, 0.95, 1], i * 3)
      } else {
        colors.set([1, 1, 0.9], i * 3)
      }
      
      this.starSizes[i] = 0.4 + Math.random() * 0.8
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    })
    
    this.stars = new THREE.Points(geometry, material)
    this.scene.add(this.stars)
  }

  private createGroundPlane() {
    const geometry = new THREE.PlaneGeometry(80, 60)
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a1f35,
      roughness: 0.9,
      metalness: 0.1,
      transparent: true,
      opacity: 0.6
    })
    
    this.groundPlane = new THREE.Mesh(geometry, material)
    this.groundPlane.rotation.x = -Math.PI / 2
    this.groundPlane.position.y = -0.01
    this.groundPlane.receiveShadow = true
    this.scene.add(this.groundPlane)
    
    const gridHelper = new THREE.GridHelper(60, 30, 0x2a3a5a, 0x1a2a3a)
    gridHelper.position.y = 0
    this.scene.add(gridHelper)
  }

  private setupEventListeners() {
    const canvas = this.renderer.domElement
    
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
    canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this))
    canvas.addEventListener('wheel', this.onWheel.bind(this))
    canvas.addEventListener('click', this.onClick.bind(this))
    
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private onMouseDown(event: MouseEvent) {
    this.isDragging = true
    this.previousMousePosition = { x: event.clientX, y: event.clientY }
    this.lastInteractionTime = performance.now()
    this.autoRotatePaused = true
  }

  private onMouseMove(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    if (this.isDragging) {
      const deltaX = event.clientX - this.previousMousePosition.x
      const deltaY = event.clientY - this.previousMousePosition.y
      
      this.targetSpherical.theta -= deltaX * 0.005
      this.targetSpherical.phi = Math.max(
        0.1, 
        Math.min(Math.PI / 2 - 0.1, this.targetSpherical.phi - deltaY * 0.005)
      )
      
      this.previousMousePosition = { x: event.clientX, y: event.clientY }
      this.lastInteractionTime = performance.now()
    }
  }

  private onMouseUp() {
    this.isDragging = false
    this.lastInteractionTime = performance.now()
  }

  private onMouseLeave() {
    this.isDragging = false
    this.lastInteractionTime = performance.now()
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault()
    
    const delta = event.deltaY * 0.01
    this.targetSpherical.radius = Math.max(
      10, 
      Math.min(80, this.targetSpherical.radius * (1 + delta * 0.1))
    )
    
    this.lastInteractionTime = performance.now()
    this.autoRotatePaused = true
  }

  private onClick(event: MouseEvent) {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const allObjects: THREE.Mesh[] = []
    this.chartGroups.forEach(chart => {
      chart.objects.forEach(obj => {
        if (obj.visible) allObjects.push(obj)
      })
    })
    
    const intersects = this.raycaster.intersectObjects(allObjects, false)
    
    if (intersects.length > 0) {
      const obj = intersects[0].object as THREE.Mesh
      const userData = obj.userData
      
      if (userData.pointData !== undefined) {
        this.highlightObject(obj)
        
        if (this.onPointClick) {
          this.onPointClick({
            seriesId: userData.seriesId,
            pointIndex: userData.pointIndex,
            data: userData.pointData,
            seriesName: userData.seriesName
          })
        }
      }
    } else {
      this.clearHighlight()
      if (this.onPointClick) {
        this.onPointClick(null)
      }
    }
    
    this.lastInteractionTime = performance.now()
  }

  private highlightObject(obj: THREE.Mesh) {
    this.clearHighlight()
    
    this.highlightedObject = obj
    this.highlightOriginalScale = obj.scale.x
    
    const material = obj.material as THREE.MeshStandardMaterial
    if (material && material.color) {
      this.highlightOriginalColor.copy(material.color)
      material.color.set(0xFFFF00)
      material.emissive.set(0xFFFF00)
      material.emissiveIntensity = 0.8
    }
    
    obj.scale.setScalar(this.highlightOriginalScale * 1.2)
  }

  private clearHighlight() {
    if (this.highlightedObject) {
      this.highlightedObject.scale.setScalar(this.highlightOriginalScale)
      
      const material = this.highlightedObject.material as THREE.MeshStandardMaterial
      if (material && material.color) {
        material.color.copy(this.highlightOriginalColor)
        material.emissive.copy(this.highlightOriginalColor)
        material.emissive.multiplyScalar(1.3)
        material.emissiveIntensity = 0.3
      }
      
      this.highlightedObject = null
    }
  }

  public setOnPointClick(callback: (point: { seriesId: string; pointIndex: number; data: DataPoint; seriesName: string } | null) => void) {
    this.onPointClick = callback
  }

  private onResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(width, height)
  }

  public updateCharts(datasets: Dataset[], chartType: ChartType, timeRange?: { start: number; end: number } | null) {
    const allSeries = datasets.flatMap(d => d.series)
    const colorMap = useDataStore.getState().getSeriesColors()
    
    const hasZ = allSeries.some(s => s.data.some(p => p.z !== undefined))
    
    let globalYMin = Infinity
    let globalYMax = -Infinity
    let globalXMin = Infinity
    let globalXMax = -Infinity
    let globalZMin = Infinity
    let globalZMax = -Infinity
    
    allSeries.forEach(series => {
      let dataToUse = series.data
      if (timeRange && series.hasTimeDimension) {
        dataToUse = series.data.filter(p => {
          if (p.time === undefined) return true
          const t = typeof p.time === 'number' ? p.time : new Date(p.time).getTime()
          return t >= timeRange.start && t <= timeRange.end
        })
      }
      
      dataToUse.forEach(p => {
        if (p.y < globalYMin) globalYMin = p.y
        if (p.y > globalYMax) globalYMax = p.y
        if (p.z !== undefined) {
          if (p.z < globalZMin) globalZMin = p.z
          if (p.z > globalZMax) globalZMax = p.z
        }
      })
      
      if (dataToUse.length - 1 < globalXMin) globalXMin = 0
      if (dataToUse.length - 1 > globalXMax) globalXMax = dataToUse.length - 1
    })
    
    if (!isFinite(globalYMin)) globalYMin = 0
    if (!isFinite(globalYMax)) globalYMax = 1
    if (!isFinite(globalZMin)) globalZMin = 0
    if (!isFinite(globalZMax)) globalZMax = 1
    
    const seriesSpacing = !hasZ && allSeries.length > 1 ? getSeriesSpacing(allSeries.length) : null
    let seriesIndex = 0
    
    allSeries.forEach((series, idx) => {
      const color = colorMap.get(series.id) || '#00D4FF'
      
      let chart = this.chartGroups.get(series.id)
      
      if (chart && chart.chartType === chartType) {
        chart.group.visible = true
        chart.updateData(series.data, 1)
        
        if (seriesSpacing) {
          chart.group.position.z = seriesSpacing[idx]
        } else {
          chart.group.position.z = 0
        }
      } else {
        if (chart) {
          this.chartsContainer.remove(chart.group)
          chart.dispose()
        }
        
        const options = {
          color,
          hasZ,
          xRange: [globalXMin, globalXMax] as [number, number],
          yRange: [globalYMin, globalYMax] as [number, number],
          zRange: [globalZMin, globalZMax] as [number, number],
          lodLevel: series.data.length > 300 ? 1 : 0
        }
        
        let newChart: ChartInstance
        
        switch (chartType) {
          case 'bar':
            const barResult = createBars(series, options)
            newChart = {
              seriesId: series.id,
              chartType: 'bar',
              ...barResult
            }
            break
          case 'line':
            const lineResult = createLine(series, options)
            newChart = {
              seriesId: series.id,
              chartType: 'line',
              ...lineResult
            }
            break
          case 'scatter':
            const scatterResult = createScatter(series, options)
            newChart = {
              seriesId: series.id,
              chartType: 'scatter',
              ...scatterResult
            }
            break
          default:
            return
        }
        
        if (seriesSpacing) {
          newChart.group.position.z = seriesSpacing[idx]
        }
        
        this.chartsContainer.add(newChart.group)
        this.chartGroups.set(series.id, newChart)
        
        setTimeout(() => {
          newChart.animateIn()
        }, idx * 100)
      }
      
      seriesIndex++
    })
    
    const currentSeriesIds = new Set(allSeries.map(s => s.id))
    this.chartGroups.forEach((chart, id) => {
      if (!currentSeriesIds.has(id)) {
        chart.animateOut().then(() => {
          this.chartsContainer.remove(chart.group)
          chart.dispose()
          this.chartGroups.delete(id)
        })
      }
    })
  }

  public transitionChartType(newType: ChartType) {
    const state = useDataStore.getState()
    const allSeries = state.datasets.flatMap(d => d.series)
    
    const animations: Promise<void>[] = []
    this.chartGroups.forEach(chart => {
      animations.push(chart.animateOut())
    })
    
    Promise.all(animations).then(() => {
      this.chartGroups.forEach(chart => {
        this.chartsContainer.remove(chart.group)
        chart.dispose()
      })
      this.chartGroups.clear()
      
      this.updateCharts(state.datasets, newType, state.timeRange)
    })
  }

  public updateTimeRange(timeRange: { start: number; end: number }) {
    const state = useDataStore.getState()
    const allSeries = state.datasets.flatMap(d => d.series)
    
    allSeries.forEach(series => {
      const chart = this.chartGroups.get(series.id)
      if (!chart) return
      
      const filteredData = series.data.filter(p => {
        if (p.time === undefined) return true
        const t = typeof p.time === 'number' ? p.time : new Date(p.time).getTime()
        return t >= timeRange.start && t <= timeRange.end
      })
      
      const paddedData: DataPoint[] = []
      for (let i = 0; i < series.data.length; i++) {
        if (i < filteredData.length) {
          paddedData.push(filteredData[i])
        } else {
          paddedData.push({ x: i, y: 0 })
        }
      }
      
      chart.updateData(paddedData, true)
    })
  }

  public setAutoRotate(enabled: boolean) {
    this.autoRotate = enabled
  }

  public resetView() {
    this.targetSpherical = { theta: 0, phi: Math.PI / 4, radius: 35 }
    this.spherical = { theta: 0, phi: Math.PI / 4, radius: 35 }
    this.updateCameraPosition()
  }

  public setViewState(viewState: ViewState) {
    const pos = viewState.cameraPosition
    const target = viewState.cameraTarget
    
    const dx = pos.x - target.x
    const dy = pos.y - target.y
    const dz = pos.z - target.z
    
    const radius = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const phi = Math.acos(dy / radius)
    const theta = Math.atan2(dx, dz)
    
    this.targetSpherical = { theta, phi, radius }
    this.spherical = { theta, phi, radius }
    this.autoRotate = viewState.autoRotate
    this.autoRotateSpeed = viewState.autoRotateSpeed
    
    this.updateCameraPosition()
  }

  public getViewState(): ViewState {
    return {
      cameraPosition: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      },
      cameraTarget: { x: 0, y: 0, z: 0 },
      autoRotate: this.autoRotate,
      autoRotateSpeed: this.autoRotateSpeed
    }
  }

  private updateCameraPosition() {
    const { theta, phi, radius } = this.spherical
    
    this.camera.position.x = radius * Math.sin(phi) * Math.sin(theta)
    this.camera.position.y = radius * Math.cos(phi)
    this.camera.position.z = radius * Math.sin(phi) * Math.cos(theta)
    
    this.camera.lookAt(0, 3, 0)
  }

  private animate() {
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this))
    
    const delta = this.clock.getDelta()
    const now = performance.now()
    const elapsed = this.clock.getElapsedTime()
    
    if (this.autoRotate && !this.autoRotatePaused) {
      this.targetSpherical.theta += (this.autoRotateSpeed * Math.PI / 180) * delta
    }
    
    if (this.autoRotatePaused && now - this.lastInteractionTime > 2000) {
      this.autoRotatePaused = false
    }
    
    this.spherical.theta += (this.targetSpherical.theta - this.spherical.theta) * 0.08
    this.spherical.phi += (this.targetSpherical.phi - this.spherical.phi) * 0.08
    this.spherical.radius += (this.targetSpherical.radius - this.spherical.radius) * 0.08
    
    this.updateCameraPosition()
    
    if (this.stars) {
      this.stars.rotation.y += (this.autoRotateSpeed * Math.PI / 180) * delta * 0.3
      
      if (this.starSizes) {
        const material = this.stars.material as THREE.PointsMaterial
        const twinkle = Math.sin(elapsed * 2) * 0.15 + 0.85
        material.size = 0.8 * twinkle
      }
    }
    
    this.renderer.render(this.scene, this.camera)
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId)
    
    this.chartGroups.forEach(chart => {
      this.chartsContainer.remove(chart.group)
      chart.dispose()
    })
    this.chartGroups.clear()
    
    if (this.stars) {
      const starGeom = this.stars.geometry as THREE.BufferGeometry
      const starMat = this.stars.material as THREE.PointsMaterial
      starGeom.dispose()
      starMat.dispose()
      this.scene.remove(this.stars)
    }
    
    this.renderer.dispose()
    window.removeEventListener('resize', this.onResize.bind(this))
  }
}

function getSeriesSpacing(count: number): number[] {
  if (count <= 1) return [0]
  const spacing = 4
  const totalWidth = (count - 1) * spacing
  const start = -totalWidth / 2
  return Array.from({ length: count }, (_, i) => start + i * spacing)
}
