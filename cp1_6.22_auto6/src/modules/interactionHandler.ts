import { SceneManager } from './sceneManager'
import * as THREE from 'three'

export interface PointInfoData {
  material: string
  productionDate: string
  description: string
  position: { x: number; y: number; z: number }
  screenX: number
  screenY: number
}

export type OnPickCallback = (info: PointInfoData | null) => void
export type OnRotateCallback = () => void

export class InteractionHandler {
  private sceneManager: SceneManager
  private container: HTMLElement
  private onPick: OnPickCallback
  private onRotate?: OnRotateCallback

  private isDragging: boolean = false
  private isPinching: boolean = false
  private lastTouchDistance: number = 0
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 }
  private mouseDownPos: { x: number; y: number } = { x: 0, y: 0 }
  private hasMoved: boolean = false
  private touchStartTime: number = 0

  private boundHandleMouseDown: (e: MouseEvent) => void
  private boundHandleMouseMove: (e: MouseEvent) => void
  private boundHandleMouseUp: (e: MouseEvent) => void
  private boundHandleWheel: (e: WheelEvent) => void
  private boundHandleTouchStart: (e: TouchEvent) => void
  private boundHandleTouchMove: (e: TouchEvent) => void
  private boundHandleTouchEnd: (e: TouchEvent) => void

  constructor(
    sceneManager: SceneManager,
    container: HTMLElement,
    onPick: OnPickCallback,
    onRotate?: OnRotateCallback
  ) {
    this.sceneManager = sceneManager
    this.container = container
    this.onPick = onPick
    this.onRotate = onRotate

    this.boundHandleMouseDown = this.handleMouseDown.bind(this)
    this.boundHandleMouseMove = this.handleMouseMove.bind(this)
    this.boundHandleMouseUp = this.handleMouseUp.bind(this)
    this.boundHandleWheel = this.handleWheel.bind(this)
    this.boundHandleTouchStart = this.handleTouchStart.bind(this)
    this.boundHandleTouchMove = this.handleTouchMove.bind(this)
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this)

    this.setupEventListeners()
  }

  private setupEventListeners() {
    const canvas = this.sceneManager.getRendererDomElement()
    
    canvas.addEventListener('mousedown', this.boundHandleMouseDown)
    window.addEventListener('mousemove', this.boundHandleMouseMove)
    window.addEventListener('mouseup', this.boundHandleMouseUp)
    canvas.addEventListener('wheel', this.boundHandleWheel, { passive: false })
    
    canvas.addEventListener('touchstart', this.boundHandleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', this.boundHandleTouchMove, { passive: false })
    canvas.addEventListener('touchend', this.boundHandleTouchEnd, { passive: false })
  }

  private getNormalizedCoordinates(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.container.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return
    
    this.isDragging = true
    this.hasMoved = false
    this.mouseDownPos = { x: e.clientX, y: e.clientY }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging) return

    const dx = Math.abs(e.clientX - this.mouseDownPos.x)
    const dy = Math.abs(e.clientY - this.mouseDownPos.y)
    
    if (dx > 3 || dy > 3) {
      this.hasMoved = true
      if (this.onRotate) {
        this.onRotate()
      }
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (!this.isDragging) return
    
    this.isDragging = false

    if (!this.hasMoved && e.button === 0) {
      this.handleClick(e.clientX, e.clientY)
    }
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (e.touches.length === 1) {
      this.isDragging = true
      this.hasMoved = false
      this.touchStartTime = Date.now()
      this.touchStartPos = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
      this.mouseDownPos = { ...this.touchStartPos }
    } else if (e.touches.length === 2) {
      this.isPinching = true
      this.isDragging = false
      this.hasMoved = true
      
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy)
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (this.isPinching && e.touches.length === 2) {
      if (this.onRotate) {
        this.onRotate()
      }
      return
    }

    if (this.isDragging && e.touches.length === 1) {
      const dx = Math.abs(e.touches[0].clientX - this.touchStartPos.x)
      const dy = Math.abs(e.touches[0].clientY - this.touchStartPos.y)
      
      if (dx > 5 || dy > 5) {
        this.hasMoved = true
        if (this.onRotate) {
          this.onRotate()
        }
      }
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (this.isPinching && e.touches.length < 2) {
      this.isPinching = false
      return
    }

    if (this.isDragging && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0]
      const touchDuration = Date.now() - this.touchStartTime
      
      this.isDragging = false

      if (!this.hasMoved && touchDuration < 300) {
        this.handleClick(touch.clientX, touch.clientY)
      }
    }
  }

  private handleClick(clientX: number, clientY: number) {
    const normalized = this.getNormalizedCoordinates(clientX, clientY)
    
    const result = this.sceneManager.pick(normalized.x, normalized.y)
    
    if (result && result.info) {
      const screenPos = this.sceneManager.worldToScreen(result.point)
      
      const pointInfo: PointInfoData = {
        material: result.info.material,
        productionDate: result.info.productionDate,
        description: result.info.description,
        position: {
          x: result.point.x,
          y: result.point.y,
          z: result.point.z,
        },
        screenX: screenPos.x,
        screenY: screenPos.y,
      }
      
      this.onPick(pointInfo)
    } else {
      this.onPick(null)
    }
  }

  updateInfoPanelPosition(worldPoint: { x: number; y: number; z: number }): { x: number; y: number } {
    const point = new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z)
    return this.sceneManager.worldToScreen(point)
  }

  dispose() {
    const canvas = this.sceneManager.getRendererDomElement()
    
    canvas.removeEventListener('mousedown', this.boundHandleMouseDown)
    window.removeEventListener('mousemove', this.boundHandleMouseMove)
    window.removeEventListener('mouseup', this.boundHandleMouseUp)
    canvas.removeEventListener('wheel', this.boundHandleWheel)
    
    canvas.removeEventListener('touchstart', this.boundHandleTouchStart)
    canvas.removeEventListener('touchmove', this.boundHandleTouchMove)
    canvas.removeEventListener('touchend', this.boundHandleTouchEnd)
  }
}

export default InteractionHandler
