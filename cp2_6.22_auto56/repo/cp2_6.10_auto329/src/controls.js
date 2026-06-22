import * as THREE from 'three'

export class ControlManager {
  constructor(container, sceneManager, camera, controls) {
    this.container = container
    this.sceneManager = sceneManager
    this.camera = camera
    this.controls = controls

    this.logs = []
    this.maxLogs = 5

    this.isPointerLocked = false
    this.mouseDownTime = 0
    this.mouseDownPos = { x: 0, y: 0 }
    this.clickThreshold = 200
    this.dragThreshold = 5

    this.initialCameraPosition = new THREE.Vector3(0, 2, 15)
    this.initialTarget = new THREE.Vector3(0, 0, 0)

    this.fpsFrames = 0
    this.fpsLastTime = performance.now()
    this.fpsValue = 60

    this.init()
  }

  init() {
    this.bindUIEvents()
    this.bindCanvasEvents()
    this.bindWindowEvents()
    this.updateFPSDisplay()
  }

  bindUIEvents() {
    const addNodeBtn = document.getElementById('btn-add-node')
    const intensitySlider = document.getElementById('intensity-slider')
    const intensityValue = document.getElementById('intensity-value')
    const resetViewBtn = document.getElementById('btn-reset-view')
    const fullscreenToggle = document.getElementById('toggle-fullscreen')

    addNodeBtn.addEventListener('click', () => {
      this.handleAddNode()
    })

    intensitySlider.addEventListener('input', (e) => {
      const value = e.target.value / 100
      this.sceneManager.setFlowIntensity(value)
      intensityValue.textContent = `${e.target.value}%`
    })

    resetViewBtn.addEventListener('click', () => {
      this.handleResetView()
    })

    fullscreenToggle.addEventListener('change', (e) => {
      this.handleFullscreenToggle(e.target.checked)
    })

    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = !!document.fullscreenElement
      fullscreenToggle.checked = isFullscreen
    })
  }

  bindCanvasEvents() {
    this.container.addEventListener('mousedown', (e) => this.onMouseDown(e))
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e))
    this.container.addEventListener('mouseup', (e) => this.onMouseUp(e))
    this.container.addEventListener('mouseleave', (e) => this.onMouseUp(e))

    this.container.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false })
    this.container.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false })
    this.container.addEventListener('touchend', (e) => this.onTouchEnd(e))
  }

  bindWindowEvents() {
    window.addEventListener('resize', () => this.onResize())
    window.addEventListener('keydown', (e) => this.onKeyDown(e))
  }

  onMouseDown(e) {
    this.mouseDownTime = performance.now()
    this.mouseDownPos = { x: e.clientX, y: e.clientY }

    const intersectedNode = this.sceneManager.getIntersectedNode(e)
    
    if (intersectedNode) {
      this.controls.enabled = false
      this.sceneManager.startDrag(intersectedNode, e)
      this.container.style.cursor = 'grabbing'
    }
  }

  onMouseMove(e) {
    if (this.sceneManager.isDragging) {
      this.sceneManager.updateDrag(e)
    }
  }

  onMouseUp(e) {
    const upTime = performance.now()
    const upPos = { x: e.clientX, y: e.clientY }
    const timeDiff = upTime - this.mouseDownTime
    const posDiff = Math.sqrt(
      Math.pow(upPos.x - this.mouseDownPos.x, 2) +
      Math.pow(upPos.y - this.mouseDownPos.y, 2)
    )

    const wasDragging = this.sceneManager.isDragging
    const draggedNode = this.sceneManager.draggedNode

    this.sceneManager.endDrag()
    this.controls.enabled = true
    this.container.style.cursor = 'grab'

    if (wasDragging && timeDiff < this.clickThreshold && posDiff < this.dragThreshold) {
      if (draggedNode) {
        this.handleNodeClick(draggedNode)
      }
    } else if (!wasDragging && timeDiff < this.clickThreshold && posDiff < this.dragThreshold) {
      this.handleCanvasClick(e)
    }
  }

  onTouchStart(e) {
    e.preventDefault()
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      this.mouseDownTime = performance.now()
      this.mouseDownPos = { x: touch.clientX, y: touch.clientY }

      const intersectedNode = this.sceneManager.getIntersectedNode(touch)
      
      if (intersectedNode) {
        this.controls.enabled = false
        this.sceneManager.startDrag(intersectedNode, touch)
      }
    }
  }

  onTouchMove(e) {
    e.preventDefault()
    if (e.touches.length === 1 && this.sceneManager.isDragging) {
      const touch = e.touches[0]
      this.sceneManager.updateDrag(touch)
    }
  }

  onTouchEnd(e) {
    const upTime = performance.now()
    const posDiff = Math.sqrt(
      Math.pow(this.mouseDownPos.x - this.mouseDownPos.x, 2) +
      Math.pow(this.mouseDownPos.y - this.mouseDownPos.y, 2)
    )

    const timeDiff = upTime - this.mouseDownTime
    const wasDragging = this.sceneManager.isDragging
    const draggedNode = this.sceneManager.draggedNode

    this.sceneManager.endDrag()
    this.controls.enabled = true

    if (wasDragging && timeDiff < this.clickThreshold && posDiff < this.dragThreshold) {
      if (draggedNode) {
        this.handleNodeClick(draggedNode)
      }
    } else if (!wasDragging && timeDiff < this.clickThreshold && posDiff < this.dragThreshold) {
      const touch = e.changedTouches[0]
      this.handleCanvasClick(touch)
    }
  }

  handleCanvasClick(e) {
    const position = this.sceneManager.getClickPosition(e)
    const node = this.sceneManager.createNode(position)
    
    if (node) {
      this.addLog(node, 'create')
    }
  }

  handleNodeClick(node) {
    this.sceneManager.triggerSonicBoom(node)
    this.addLog(node, 'click')
  }

  handleAddNode() {
    const nodes = this.sceneManager.getNodes()
    let position

    if (nodes.length === 0) {
      position = new THREE.Vector3(0, 0, 0)
    } else {
      const angle = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 4
      const height = (Math.random() - 0.5) * 4
      position = new THREE.Vector3(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      )
    }

    const node = this.sceneManager.createNode(position)
    if (node) {
      this.addLog(node, 'create')
    }
  }

  handleResetView() {
    this.camera.position.copy(this.initialCameraPosition)
    this.controls.target.copy(this.initialTarget)
    this.controls.update()
  }

  handleFullscreenToggle(isFullscreen) {
    if (isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen()
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    }
  }

  addLog(node, type) {
    const log = {
      nodeId: node.id,
      pitch: node.pitch,
      timestamp: new Date(),
      type: type
    }

    this.logs.unshift(log)
    
    if (this.logs.length > this.maxLogs) {
      this.logs.pop()
    }

    this.updateLogDisplay()
  }

  updateLogDisplay() {
    const logList = document.getElementById('log-list')
    const logEmpty = document.getElementById('log-empty')

    if (this.logs.length === 0) {
      logEmpty.style.display = 'block'
      logList.innerHTML = '<div class="log-empty" id="log-empty">等待第一次交互...</div>'
      return
    }

    if (logEmpty) {
      logEmpty.style.display = 'none'
    }

    logList.innerHTML = this.logs.map(log => `
      <li class="log-item ${log.type}">
        <div class="log-header">
          <span class="log-node">节点 #${String(log.nodeId).padStart(2, '0')}</span>
          <span class="log-time">${this.formatTime(log.timestamp)}</span>
        </div>
        <div class="log-details">
          <span class="log-pitch">${log.pitch}</span>
          <span>${log.type === 'create' ? '创建节点' : '触发音爆'}</span>
        </div>
      </li>
    `).join('')
  }

  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
  }

  onKeyDown(e) {
    if (e.key === 'f' || e.key === 'F') {
      const fullscreenToggle = document.getElementById('toggle-fullscreen')
      fullscreenToggle.checked = !fullscreenToggle.checked
      this.handleFullscreenToggle(fullscreenToggle.checked)
    }
    if (e.key === 'r' || e.key === 'R') {
      this.handleResetView()
    }
    if (e.key === ' ') {
      e.preventDefault()
      this.handleAddNode()
    }
  }

  updateFPS() {
    this.fpsFrames++
    const now = performance.now()
    
    if (now - this.fpsLastTime >= 1000) {
      this.fpsValue = this.fpsFrames
      this.fpsFrames = 0
      this.fpsLastTime = now
      this.updateFPSDisplay()
    }
  }

  updateFPSDisplay() {
    const fpsElement = document.getElementById('fps-value')
    if (fpsElement) {
      fpsElement.textContent = this.fpsValue
    }
  }

  update() {
    this.updateFPS()
  }
}
