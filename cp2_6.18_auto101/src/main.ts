import * as THREE from 'three'
import { usePipeStore, Pipe } from './store/pipeStore'
import { initDefaultPipes } from './modules/pipeData'
import { detectCollisions } from './modules/collisionDetect'
import {
  initScene,
  setupStoreSubscriptions,
  showPropertyPanel,
  hidePropertyPanel,
  updateTooltip,
  animate,
  getSceneContext,
  resetCamera,
  clearMarkers,
  showMarkers,
  handleResize,
  getPipeMeshes
} from './modules/sceneRender'

const app = document.getElementById('app')
if (!app) {
  throw new Error('App container not found')
}

initScene(app)
setupStoreSubscriptions()

initDefaultPipes()

const initialCollisions = detectCollisions(usePipeStore.getState().pipes)
usePipeStore.getState().setCollisions(initialCollisions)

let lastCollisionCheck = 0
const COLLISION_CHECK_INTERVAL = 100
let lastCollisionsCache = ''

const checkCollisions = () => {
  const now = performance.now()
  if (now - lastCollisionCheck < COLLISION_CHECK_INTERVAL) return
  lastCollisionCheck = now

  const { pipes: currentPipes } = usePipeStore.getState()
  const collisions = detectCollisions(currentPipes)

  const collisionKey = collisions.map(c => 
    `${c.pipeA.id}-${c.pipeB.id}-${c.minDistance.toFixed(3)}`
  ).join('|')

  if (collisionKey !== lastCollisionsCache) {
    lastCollisionsCache = collisionKey
    usePipeStore.getState().setCollisions(collisions)

    const { selectedPipeId } = usePipeStore.getState()
    if (selectedPipeId) {
      const selectedPipe = currentPipes.find(p => p.id === selectedPipeId)
      if (selectedPipe) {
        showPropertyPanel(selectedPipe, collisions)
      }
    }
  }
}

const setupInteraction = () => {
  const ctx = getSceneContext()
  if (!ctx) return

  const { camera, renderer, raycaster, mouse } = ctx
  const canvas = renderer.domElement

  let isDragging = false
  let mouseDownPos = { x: 0, y: 0 }

  const updateMouse = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  const getHoveredPipe = (): Pipe | null => {
    raycaster.setFromCamera(mouse, camera)
    const pipeMeshes = getPipeMeshes()
    const meshes = Array.from(pipeMeshes.values())
    const intersects = raycaster.intersectObjects(meshes)

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh
      return mesh.userData.pipe as Pipe
    }
    return null
  }

  canvas.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      isDragging = false
      mouseDownPos = { x: event.clientX, y: event.clientY }
    }
  })

  canvas.addEventListener('mousemove', (event) => {
    if (event.button === 0) {
      const dx = Math.abs(event.clientX - mouseDownPos.x)
      const dy = Math.abs(event.clientY - mouseDownPos.y)
      if (dx > 3 || dy > 3) {
        isDragging = true
      }
    }

    updateMouse(event)
    const hoveredPipe = getHoveredPipe()
    const { hoveredPipeId, setHoveredPipe } = usePipeStore.getState()

    if (hoveredPipe && hoveredPipe.id !== hoveredPipeId) {
      setHoveredPipe(hoveredPipe.id)
    } else if (!hoveredPipe && hoveredPipeId) {
      setHoveredPipe(null)
    }

    updateTooltip(!!hoveredPipe, hoveredPipe, event.clientX, event.clientY)
  })

  canvas.addEventListener('mouseleave', () => {
    usePipeStore.getState().setHoveredPipe(null)
    updateTooltip(false, null, 0, 0)
  })

  canvas.addEventListener('click', (event) => {
    if (isDragging) return
    if (event.button !== 0) return

    updateMouse(event)
    const clickedPipe = getHoveredPipe()
    const { selectedPipeId, setSelectedPipe, collisions } = usePipeStore.getState()

    if (clickedPipe) {
      if (clickedPipe.id === selectedPipeId) {
        setSelectedPipe(null)
        hidePropertyPanel()
      } else {
        setSelectedPipe(clickedPipe.id)
        showPropertyPanel(clickedPipe, collisions)
      }
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      usePipeStore.getState().setSelectedPipe(null)
      hidePropertyPanel()
    }
  })

  document.addEventListener('click', (event) => {
    const panel = document.getElementById('propertyPanel')
    const target = event.target as HTMLElement

    if (panel && !panel.contains(target) && !canvas.contains(target)) {
      usePipeStore.getState().setSelectedPipe(null)
      hidePropertyPanel()
    }
  })
}

const setupButtons = () => {
  const clearBtn = document.getElementById('clearMarkersBtn')
  const resetBtn = document.getElementById('resetCameraBtn')

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      const { markersVisible } = usePipeStore.getState()
      if (markersVisible) {
        clearMarkers()
        clearBtn.textContent = '显示冲突标记'
      } else {
        showMarkers()
        clearBtn.textContent = '清除所有冲突标记'
      }
    })
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      resetCamera()
    })
  }
}

setupInteraction()
setupButtons()

const startAnimationLoop = () => {
  const loop = () => {
    checkCollisions()
    requestAnimationFrame(loop)
  }
  loop()
}

animate()
startAnimationLoop()

window.addEventListener('resize', handleResize)

console.log('PipeVue application initialized successfully')
