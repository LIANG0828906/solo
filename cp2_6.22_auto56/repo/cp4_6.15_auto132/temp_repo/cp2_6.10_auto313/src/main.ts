import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CubeController } from './CubeController'
import { ConnectionLine } from './ConnectionLine'
import { UIManager } from './UIManager'
import { PulseEffect } from './PulseEffect'

const CONFIG = {
  MAX_BLOCKS: 60,
  BLOCK_SIZE: 1,
  SNAP_GRID: 1.5,
  CONNECTION_DISTANCE: 2.5,
  colors: {
    iceBlue: '#00bfff',
    pinkCrystal: '#ff6eb4',
    background: '#0a0a1f'
  }
}

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let clock: THREE.Clock

let cubeController: CubeController
let connectionLine: ConnectionLine
let uiManager: UIManager
let pulseEffect: PulseEffect

let raycaster: THREE.Raycaster
let mouse: THREE.Vector2
let groundPlane: THREE.Mesh

function init() {
  const container = document.getElementById('canvas-container')!
  
  scene = new THREE.Scene()
  scene.background = new THREE.Color(CONFIG.colors.background)
  scene.fog = new THREE.FogExp2(CONFIG.colors.background, 0.015)

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(8, 6, 8)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 3
  controls.maxDistance = 30
  controls.maxPolarAngle = Math.PI * 0.85

  clock = new THREE.Clock()

  setupLights()
  setupGround()
  setupHelpers()

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()

  cubeController = new CubeController(scene, CONFIG)
  connectionLine = new ConnectionLine(scene, CONFIG)
  pulseEffect = new PulseEffect(scene, CONFIG)
  uiManager = new UIManager(CONFIG, {
    onBlockTypeChange: (type) => cubeController.setCurrentType(type),
    onFlowIntensityChange: (value) => connectionLine.setFlowIntensity(value),
    onResetCamera: resetCamera,
    onToggleFullscreen: toggleFullscreen,
    onBlockPlaced: (log) => {
      connectionLine.updateConnections(cubeController.getBlocks())
      uiManager.addLog(log)
      updateBlockCount()
    },
    onBlockClicked: (block) => {
      pulseEffect.trigger(block.mesh.position, block.color)
    }
  })

  setupEventListeners()
  updateBlockCount()

  setTimeout(() => {
    document.getElementById('loading-screen')?.classList.add('hidden')
  }, 2000)

  animate()
}

function setupLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const blueLight = new THREE.DirectionalLight(0x00bfff, 0.8)
  blueLight.position.set(5, 10, 5)
  scene.add(blueLight)

  const pinkLight = new THREE.DirectionalLight(0xff6eb4, 0.6)
  pinkLight.position.set(-5, 8, -5)
  scene.add(pinkLight)

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
  fillLight.position.set(0, -5, 0)
  scene.add(fillLight)
}

function setupGround() {
  const gridHelper = new THREE.GridHelper(30, 30, 0x333366, 0x222244)
  gridHelper.position.y = -0.51
  scene.add(gridHelper)

  const groundGeometry = new THREE.PlaneGeometry(100, 100)
  const groundMaterial = new THREE.MeshBasicMaterial({
    color: 0x0a0a1f,
    transparent: true,
    opacity: 0.8
  })
  groundPlane = new THREE.Mesh(groundGeometry, groundMaterial)
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.position.y = -0.5
  scene.add(groundPlane)
}

function setupHelpers() {
  const axesHelper = new THREE.AxesHelper(0)
  scene.add(axesHelper)
}

function setupEventListeners() {
  window.addEventListener('resize', onWindowResize)
  renderer.domElement.addEventListener('click', onMouseClick)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  window.addEventListener('keydown', onKeyDown)
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function onMouseClick(event: MouseEvent) {
  if (event.target !== renderer.domElement) return

  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const blocks = cubeController.getBlocks()
  const blockMeshes = blocks.map(b => b.mesh)
  
  const blockIntersects = raycaster.intersectObjects(blockMeshes)
  if (blockIntersects.length > 0) {
    const clickedBlock = blocks.find(b => b.mesh === blockIntersects[0].object)
    if (clickedBlock) {
      uiManager.handleBlockClick(clickedBlock)
      return
    }
  }

  const groundIntersects = raycaster.intersectObject(groundPlane)
  if (groundIntersects.length > 0) {
    const point = groundIntersects[0].point
    const snappedPoint = new THREE.Vector3(
      Math.round(point.x / CONFIG.SNAP_GRID) * CONFIG.SNAP_GRID,
      0,
      Math.round(point.z / CONFIG.SNAP_GRID) * CONFIG.SNAP_GRID
    )
    
    if (cubeController.canPlaceBlock(snappedPoint)) {
      const log = cubeController.placeBlock(snappedPoint)
      if (log) {
        uiManager.handleBlockPlaced(log)
      }
    }
  }
}

function onMouseMove(event: MouseEvent) {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObject(groundPlane)
  
  if (intersects.length > 0) {
    const point = intersects[0].point
    const snappedPoint = new THREE.Vector3(
      Math.round(point.x / CONFIG.SNAP_GRID) * CONFIG.SNAP_GRID,
      0,
      Math.round(point.z / CONFIG.SNAP_GRID) * CONFIG.SNAP_GRID
    )
    cubeController.updatePreview(snappedPoint)
  }
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    const selectedBlock = cubeController.getSelectedBlock()
    if (selectedBlock) {
      cubeController.removeBlock(selectedBlock.id)
      connectionLine.updateConnections(cubeController.getBlocks())
      updateBlockCount()
    }
  }
}

function resetCamera() {
  controls.reset()
  camera.position.set(8, 6, 8)
  controls.update()
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

function updateBlockCount() {
  const countEl = document.getElementById('block-count')
  if (countEl) {
    countEl.textContent = cubeController.getBlockCount().toString()
  }
}

let frameCount = 0

function animate() {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()

  controls.update()
  cubeController.update(delta)
  pulseEffect.update(delta)
  
  frameCount++
  if (frameCount % 2 === 0) {
    connectionLine.update(delta)
  }

  renderer.render(scene, camera)
}

init()
