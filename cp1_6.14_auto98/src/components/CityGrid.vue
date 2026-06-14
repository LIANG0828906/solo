<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import * as TWEEN from '@tweenjs/tween.js'
import type { BlockData, DataDimension, ThemeColors } from '@/composables/useHeatmapData'

interface Props {
  rows?: number
  cols?: number
  blocks: BlockData[]
  animationState: {
    currentHeights: Float32Array
    currentColors: Float32Array
  }
  currentDimension: DataDimension
  currentHour: number
  currentThemeColors: ThemeColors
  getBlockValue: (block: BlockData, hour?: number, dimension?: DataDimension) => number
  getRating: (value: number) => string
  getDimensionLabel: (dim: DataDimension) => string
  getDimensionUnit: (dim: DataDimension) => string
  hexToRgb: (hex: string) => [number, number, number]
  interpolateColor: (t: number, colors: ThemeColors) => [number, number, number]
  updateTargets: () => void
}

const props = withDefaults(defineProps<Props>(), {
  rows: 8,
  cols: 8,
})

const emit = defineEmits<{
  (e: 'block-click', block: BlockData): void
  (e: 'fps-update', fps: number): void
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const labelContainerRef = ref<HTMLElement | null>(null)
const detailPanelRef = ref<HTMLDivElement | null>(null)
const lineCanvasRef = ref<HTMLCanvasElement | null>(null)
const autoRotateEnabled = ref(false)
const autoRotateSpeed = ref(0.3)
const showDetailPanel = ref(false)
const selectedBlock = ref<BlockData | null>(null)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let labelRenderer: CSS2DRenderer
let controls: OrbitControls
let instancedMesh: THREE.InstancedMesh
let dummy: THREE.Object3D
let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
let hoveredInstance = -1
let lastInteractionTime = 0
let autoRotatePaused = false
let animationId: number
let lastTime = performance.now()
let frameCount = 0
let fps = 0

const cellSize = 1
const gap = 0.15
const totalWidth = computed(() => props.cols * (cellSize + gap))
const totalHeight = computed(() => props.rows * (cellSize + gap))

const hoverScale = 1.2
const hoverRaise = 0.3

function initScene() {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  scene = new THREE.Scene()
  scene.background = null

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  const maxDim = Math.max(totalWidth.value, totalHeight.value)
  camera.position.set(maxDim * 0.8, maxDim * 0.8, maxDim * 1.2)

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  containerRef.value.appendChild(renderer.domElement)
  canvasRef.value = renderer.domElement

  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(width, height)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0'
  labelRenderer.domElement.style.left = '0'
  labelRenderer.domElement.style.pointerEvents = 'none'
  containerRef.value.appendChild(labelRenderer.domElement)
  labelContainerRef.value = labelRenderer.domElement

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = maxDim * 0.5
  controls.maxDistance = maxDim * 3
  controls.maxPolarAngle = Math.PI / 2.2
  controls.addEventListener('start', onUserInteraction)
  controls.addEventListener('change', onUserInteraction)

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  const ambientLight = new THREE.AmbientLight(0x404080, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
  directionalLight.position.set(10, 20, 10)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.set(2048, 2048)
  directionalLight.shadow.camera.left = -maxDim
  directionalLight.shadow.camera.right = maxDim
  directionalLight.shadow.camera.top = maxDim
  directionalLight.shadow.camera.bottom = -maxDim
  scene.add(directionalLight)

  const rimLight = new THREE.DirectionalLight(0x0088ff, 0.4)
  rimLight.position.set(-10, 10, -10)
  scene.add(rimLight)

  createGroundGrid()
  createInstancedBlocks()

  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('click', onClick)
  renderer.domElement.addEventListener('mouseleave', onMouseLeave)
  window.addEventListener('resize', onResize)
}

function createGroundGrid() {
  const maxDim = Math.max(totalWidth.value, totalHeight.value)
  const gridRadius = maxDim * 0.8

  const gridGroup = new THREE.Group()

  const ringGeometry = new THREE.RingGeometry(gridRadius * 0.9, gridRadius, 64)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = -0.02
  gridGroup.add(ring)

  for (let i = 0; i < 5; i++) {
    const r = (gridRadius * 0.2) * (i + 1)
    const circle = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 64 }, (_, j) => {
          const angle = (j / 64) * Math.PI * 2
          return new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r)
        })
      ),
      new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.15 - i * 0.02,
      })
    )
    gridGroup.add(circle)
  }

  const gridHelper = new THREE.GridHelper(
    gridRadius * 2,
    32,
    0x00f0ff,
    0x004466
  )
  ;(gridHelper.material as THREE.Material).opacity = 0.2
  ;(gridHelper.material as THREE.Material).transparent = true
  gridGroup.add(gridHelper)

  scene.add(gridGroup)
}

function createInstancedBlocks() {
  const total = props.rows * props.cols
  const geometry = new THREE.BoxGeometry(cellSize, 1, cellSize)

  const positions = geometry.attributes.position.array as Float32Array
  const topVertices: number[] = []
  const sideVertices: number[] = []

  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1]
    if (y > 0.49) {
      topVertices.push(i / 3)
    } else {
      sideVertices.push(i / 3)
    }
  }

  const colors = new Float32Array(positions.length)
  for (let i = 0; i < positions.length; i += 3) {
    const vertexIndex = i / 3
    const isTop = topVertices.includes(vertexIndex)
    if (isTop) {
      colors[i] = 0.5
      colors[i + 1] = 1
      colors[i + 2] = 0.5
    } else {
      colors[i] = 1
      colors[i + 1] = 1
      colors[i + 2] = 1
    }
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.MeshPhongMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    shininess: 100,
  })

  instancedMesh = new THREE.InstancedMesh(geometry, material, total)
  instancedMesh.castShadow = true
  instancedMesh.receiveShadow = true
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  instancedMesh.userData.instanceColors = new Float32Array(total * 3)

  dummy = new THREE.Object3D()

  for (let i = 0; i < total; i++) {
    updateBlockTransform(i, 0.1, false)
  }

  scene.add(instancedMesh)
}

function updateBlockTransform(index: number, height: number, isHovered: boolean) {
  const row = Math.floor(index / props.cols)
  const col = index % props.cols

  const scale = isHovered ? hoverScale : 1
  const raise = isHovered ? hoverRaise : 0
  const heightScale = Math.max(0.05, height / 10)

  dummy.scale.set(scale, heightScale * scale, scale)
  dummy.position.x = col * (cellSize + gap) - totalWidth.value / 2 + cellSize / 2
  dummy.position.y = (heightScale * scale) / 2 + raise
  dummy.position.z = row * (cellSize + gap) - totalHeight.value / 2 + cellSize / 2
  dummy.updateMatrix()

  instancedMesh.setMatrixAt(index, dummy.matrix)
}

function createBlockLabel(block: BlockData): CSS2DObject {
  const div = document.createElement('div')
  div.className = 'block-label'
  div.style.cssText = `
    padding: 6px 10px;
    background: rgba(10, 14, 26, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(0, 240, 255, 0.3);
    border-radius: 6px;
    color: #ffffff;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 11px;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transform: translate(-50%, -130%);
    opacity: 0;
    transition: opacity 0.2s ease;
  `
  return new CSS2DObject(div)
}

function updateLabelContent(label: CSS2DObject, block: BlockData) {
  const value = props.getBlockValue(block)
  const rating = props.getRating(value)
  const ratingColor = rating === '高' ? '#ff3366' : rating === '中' ? '#ffdd00' : '#00ff88'

  const html = `
    <div style="font-weight: 600; margin-bottom: 2px; font-size: 12px;">${block.name}</div>
    <div style="color: #a0a0c0; font-size: 10px;">${props.getDimensionLabel(props.currentDimension)}</div>
    <div style="font-size: 16px; font-weight: 700; margin-top: 2px;">
      ${value.toFixed(0)} <span style="font-size: 10px; color: #8080a0;">${props.getDimensionUnit(props.currentDimension)}</span>
    </div>
    <div style="display: inline-block; padding: 1px 6px; border-radius: 3px; background: ${ratingColor}; color: #000; font-weight: 600; font-size: 10px; margin-top: 2px;">
      ${rating}
    </div>
  `
  label.element.innerHTML = html
  label.element.style.opacity = '1'
}

function hideLabel(label: CSS2DObject) {
  label.element.style.opacity = '0'
}

const blockLabels = new Map<number, CSS2DObject>()

function initBlockLabels() {
  props.blocks.forEach((block) => {
    const label = createBlockLabel(block)
    const row = block.row
    const col = block.col
    label.position.x = col * (cellSize + gap) - totalWidth.value / 2 + cellSize / 2
    label.position.y = 2
    label.position.z = row * (cellSize + gap) - totalHeight.value / 2 + cellSize / 2
    scene.add(label)
    blockLabels.set(block.id, label)
  })
}

function onMouseMove(event: MouseEvent) {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(instancedMesh)

  if (intersects.length > 0) {
    const instanceId = intersects[0].instanceId
    if (instanceId !== undefined && instanceId !== hoveredInstance) {
      if (hoveredInstance !== -1) {
        const label = blockLabels.get(hoveredInstance)
        if (label) hideLabel(label)
      }
      hoveredInstance = instanceId
      const block = props.blocks[instanceId]
      const label = blockLabels.get(instanceId)
      if (label) updateLabelContent(label, block)
      document.body.style.cursor = 'pointer'
    }
  } else if (hoveredInstance !== -1) {
    const label = blockLabels.get(hoveredInstance)
    if (label) hideLabel(label)
    hoveredInstance = -1
    document.body.style.cursor = 'default'
  }

  onUserInteraction()
}

function onClick(event: MouseEvent) {
  if (!containerRef.value || hoveredInstance === -1) return
  const rect = containerRef.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(instancedMesh)

  if (intersects.length > 0) {
    const instanceId = intersects[0].instanceId
    if (instanceId !== undefined) {
      const block = props.blocks[instanceId]
      selectedBlock.value = block
      zoomToBlock(block)
      showDetailPanel.value = true
      nextTick(() => {
        renderLineChart()
      })
    }
  }
  onUserInteraction()
}

function onMouseLeave() {
  if (hoveredInstance !== -1) {
    const label = blockLabels.get(hoveredInstance)
    if (label) hideLabel(label)
    hoveredInstance = -1
    document.body.style.cursor = 'default'
  }
}

function onUserInteraction() {
  lastInteractionTime = performance.now()
  if (autoRotateEnabled.value) {
    autoRotatePaused = true
  }
}

function zoomToBlock(block: BlockData) {
  const targetX = block.col * (cellSize + gap) - totalWidth.value / 2 + cellSize / 2
  const targetZ = block.row * (cellSize + gap) - totalHeight.value / 2 + cellSize / 2
  const targetY = 2

  const startPos = { ...camera.position }
  const startTarget = { ...controls.target }
  const endPos = {
    x: targetX + 5,
    y: targetY + 4,
    z: targetZ + 5,
  }
  const endTarget = {
    x: targetX,
    y: targetY,
    z: targetZ,
  }

  new TWEEN.Tween({ t: 0 })
    .to({ t: 1 }, 1200)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onUpdate((obj) => {
      camera.position.x = startPos.x + (endPos.x - startPos.x) * obj.t
      camera.position.y = startPos.y + (endPos.y - startPos.y) * obj.t
      camera.position.z = startPos.z + (endPos.z - startPos.z) * obj.t
      controls.target.x = startTarget.x + (endTarget.x - startTarget.x) * obj.t
      controls.target.y = startTarget.y + (endTarget.y - startTarget.y) * obj.t
      controls.target.z = startTarget.z + (endTarget.z - startTarget.z) * obj.t
      controls.update()
    })
    .start()
}

function resetCamera() {
  const maxDim = Math.max(totalWidth.value, totalHeight.value)
  const endPos = {
    x: maxDim * 0.8,
    y: maxDim * 0.8,
    z: maxDim * 1.2,
  }
  const endTarget = { x: 0, y: 0, z: 0 }

  new TWEEN.Tween({ t: 0 })
    .to({ t: 1 }, 1000)
    .easing(TWEEN.Easing.Cubic.InOut)
    .onUpdate((obj) => {
      camera.position.x = camera.position.x + (endPos.x - camera.position.x) * obj.t
      camera.position.y = camera.position.y + (endPos.y - camera.position.y) * obj.t
      camera.position.z = camera.position.z + (endPos.z - camera.position.z) * obj.t
      controls.target.x = controls.target.x + (endTarget.x - controls.target.x) * obj.t
      controls.target.y = controls.target.y + (endTarget.y - controls.target.y) * obj.t
      controls.target.z = controls.target.z + (endTarget.z - controls.target.z) * obj.t
      controls.update()
    })
    .start()
}

function renderLineChart() {
  if (!lineCanvasRef.value || !selectedBlock.value) return

  const canvas = lineCanvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  ctx.clearRect(0, 0, width, height)

  const block = selectedBlock.value
  const datasets = [
    { name: '人口密度', data: block.hourlyData.population, color: '#00d4ff' },
    { name: '交通流量', data: block.hourlyData.traffic, color: '#ff6600' },
    { name: '空气质量', data: block.hourlyData.airQuality, color: '#00ff88' },
  ]

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1

  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()

    const value = 100 - i * 20
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(value.toString(), padding.left - 5, y + 3)
  }

  for (let h = 0; h <= 24; h += 6) {
    const x = padding.left + (chartWidth / 23) * h
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${h}:00`, x, height - padding.bottom + 15)
  }

  const currentX = padding.left + (chartWidth / 23) * props.currentHour
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(currentX, padding.top)
  ctx.lineTo(currentX, height - padding.bottom)
  ctx.stroke()
  ctx.setLineDash([])

  datasets.forEach((dataset) => {
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
    gradient.addColorStop(0, dataset.color + '40')
    gradient.addColorStop(1, dataset.color + '00')

    ctx.beginPath()
    ctx.moveTo(padding.left, height - padding.bottom)

    dataset.data.forEach((value, i) => {
      const x = padding.left + (chartWidth / 23) * i
      const y = padding.top + chartHeight * (1 - value / 100)
      if (i === 0) {
        ctx.lineTo(x, y)
      } else {
        const prevX = padding.left + (chartWidth / 23) * (i - 1)
        const prevY = padding.top + chartHeight * (1 - dataset.data[i - 1] / 100)
        const cpX = (prevX + x) / 2
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
      }
    })

    ctx.lineTo(padding.left + chartWidth, height - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    ctx.strokeStyle = dataset.color
    ctx.lineWidth = 2

    dataset.data.forEach((value, i) => {
      const x = padding.left + (chartWidth / 23) * i
      const y = padding.top + chartHeight * (1 - value / 100)
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        const prevX = padding.left + (chartWidth / 23) * (i - 1)
        const prevY = padding.top + chartHeight * (1 - dataset.data[i - 1] / 100)
        const cpX = (prevX + x) / 2
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y)
      }
    })
    ctx.stroke()

    const currentValue = dataset.data[props.currentHour]
    const x = padding.left + (chartWidth / 23) * props.currentHour
    const y = padding.top + chartHeight * (1 - currentValue / 100)

    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = dataset.color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  })

  const legendX = padding.left
  let legendY = padding.top + 10

  datasets.forEach((dataset) => {
    ctx.fillStyle = dataset.color
    ctx.fillRect(legendX, legendY, 12, 12)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '11px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(dataset.name, legendX + 18, legendY + 10)
    legendY += 20
  })
}

function closeDetailPanel() {
  showDetailPanel.value = false
  selectedBlock.value = null
  resetCamera()
}

function onResize() {
  if (!containerRef.value) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  labelRenderer.setSize(width, height)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  const currentTime = performance.now()
  frameCount++
  if (currentTime - lastTime >= 1000) {
    fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
    emit('fps-update', fps)
    frameCount = 0
    lastTime = currentTime
  }

  if (autoRotateEnabled.value && autoRotatePaused) {
    if (currentTime - lastInteractionTime > 3000) {
      autoRotatePaused = false
    }
  }

  if (autoRotateEnabled.value && !autoRotatePaused) {
    const center = new THREE.Vector3(0, 1, 0)
    const radius = camera.position.distanceTo(center)
    const angle = Math.atan2(camera.position.z - center.z, camera.position.x - center.x)
    const newAngle = angle + autoRotateSpeed.value * 0.005

    camera.position.x = center.x + Math.cos(newAngle) * radius
    camera.position.z = center.z + Math.sin(newAngle) * radius
    camera.lookAt(center)
    controls.target.copy(center)
  }

  TWEEN.update()
  controls.update()

  updateInstancedBlocks()

  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

function updateInstancedBlocks() {
  props.blocks.forEach((_, i) => {
    const height = props.animationState.currentHeights[i]
    const isHovered = i === hoveredInstance
    updateBlockTransform(i, height, isHovered)

    const r = props.animationState.currentColors[i * 3]
    const g = props.animationState.currentColors[i * 3 + 1]
    const b = props.animationState.currentColors[i * 3 + 2]
    instancedMesh.setColorAt(i, new THREE.Color(r, g, b))
  })

  instancedMesh.instanceMatrix.needsUpdate = true
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true
  }
}

watch(
  () => [props.rows, props.cols],
  () => {
    if (scene) {
      scene.remove(instancedMesh)
      blockLabels.forEach((label) => scene.remove(label))
      blockLabels.clear()
      createInstancedBlocks()
      initBlockLabels()
      props.updateTargets()
    }
  }
)

watch(
  () => props.blocks.length,
  () => {
    if (scene) {
      scene.remove(instancedMesh)
      blockLabels.forEach((label) => scene.remove(label))
      blockLabels.clear()
      createInstancedBlocks()
      initBlockLabels()
    }
  }
)

watch(
  () => showDetailPanel.value,
  (val) => {
    if (val && selectedBlock.value) {
      nextTick(() => renderLineChart())
    }
  }
)

watch(
  () => props.currentHour,
  () => {
    if (showDetailPanel.value && lineCanvasRef.value) {
      renderLineChart()
    }
  }
)

onMounted(() => {
  initScene()
  initBlockLabels()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', onResize)
  if (renderer) {
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('click', onClick)
    renderer.domElement.removeEventListener('mouseleave', onMouseLeave)
    renderer.dispose()
  }
  controls?.dispose()
  TWEEN.removeAll()
})

defineExpose({
  resetCamera,
})
</script>

<template>
  <div class="city-grid-wrapper">
    <div ref="containerRef" class="three-container"></div>

    <div v-if="showDetailPanel && selectedBlock" ref="detailPanelRef" class="detail-panel">
      <div class="detail-header">
        <h3 class="detail-title">{{ selectedBlock.name }}</h3>
        <button class="close-btn" @click="closeDetailPanel">×</button>
      </div>
      <div class="detail-body">
        <div class="detail-stats">
          <div class="stat-item">
            <span class="stat-label">当前人口密度</span>
            <span class="stat-value population">{{ selectedBlock.hourlyData.population[currentHour].toFixed(0) }} <small>人/km²</small></span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前交通流量</span>
            <span class="stat-value traffic">{{ selectedBlock.hourlyData.traffic[currentHour].toFixed(0) }} <small>车辆/小时</small></span>
          </div>
          <div class="stat-item">
            <span class="stat-label">空气质量指数</span>
            <span class="stat-value air">{{ selectedBlock.hourlyData.airQuality[currentHour].toFixed(0) }} <small>AQI</small></span>
          </div>
        </div>
        <div class="chart-container">
          <canvas ref="lineCanvasRef" class="line-chart"></canvas>
        </div>
      </div>
    </div>

    <div class="rotate-control">
      <div class="control-row">
        <span class="control-label">自动旋转</span>
        <button
          :class="['toggle-btn', { active: autoRotateEnabled }]"
          @click="autoRotateEnabled = !autoRotateEnabled"
        >
          {{ autoRotateEnabled ? '开启' : '关闭' }}
        </button>
      </div>
      <div v-if="autoRotateEnabled" class="control-row slider-row">
        <span class="control-label">速度</span>
        <input
          type="range"
          class="control-slider"
          min="0.1"
          max="1.5"
          step="0.1"
          v-model.number="autoRotateSpeed"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.city-grid-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.three-container {
  width: 100%;
  height: 100%;
}

.detail-panel {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 560px;
  background: rgba(10, 14, 26, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 240, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: 'Consolas', 'Monaco', monospace;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-radius: 6px;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 51, 102, 0.6);
  transform: scale(1.1);
}

.detail-body {
  padding: 20px;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.stat-value small {
  font-size: 10px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
}

.stat-value.population {
  color: #00d4ff;
}

.stat-value.traffic {
  color: #ff6600;
}

.stat-value.air {
  color: #00ff88;
}

.chart-container {
  width: 100%;
  height: 180px;
}

.line-chart {
  width: 100%;
  height: 100%;
}

.rotate-control {
  position: absolute;
  bottom: 24px;
  right: 24px;
  background: rgba(10, 14, 26, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 180px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.slider-row {
  margin-top: 10px;
}

.control-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.toggle-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-family: inherit;
}

.toggle-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toggle-btn.active {
  background: linear-gradient(135deg, #00f0ff 0%, #0088ff 100%);
  color: #000;
}

.control-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, rgba(0, 240, 255, 0.3), rgba(0, 136, 255, 0.8));
  border-radius: 2px;
  outline: none;
}

.control-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00f0ff;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
  transition: transform 0.2s ease;
}

.control-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.control-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #00f0ff;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.6);
}
</style>
