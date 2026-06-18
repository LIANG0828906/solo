import { SceneManager } from '../scene/SceneManager'

export interface BrushControllerOptions {
  sceneManager: SceneManager
  container: HTMLElement
  onCursorMove?: (x: number, y: number, isDragging: boolean) => void
}

export class BrushController {
  private sceneManager: SceneManager
  private container: HTMLElement
  private isDragging: boolean = false
  private onCursorMove?: (x: number, y: number, isDragging: boolean) => void

  constructor(options: BrushControllerOptions) {
    this.sceneManager = options.sceneManager
    this.container = options.container
    this.onCursorMove = options.onCursorMove

    this.bindEvents()
  }

  private bindEvents(): void {
    this.container.addEventListener('mousedown', this.handleMouseDown)
    this.container.addEventListener('mousemove', this.handleMouseMove)
    this.container.addEventListener('mouseup', this.handleMouseUp)
    this.container.addEventListener('mouseleave', this.handleMouseUp)

    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false })
    this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.container.addEventListener('touchend', this.handleTouchEnd)
    this.container.addEventListener('touchcancel', this.handleTouchEnd)
  }

  private handleMouseDown = (e: MouseEvent): void => {
    this.isDragging = true
    this.sceneManager.setMouseDown(true)
    this.updateMousePosition(e.clientX, e.clientY)
  }

  private handleMouseMove = (e: MouseEvent): void => {
    this.updateMousePosition(e.clientX, e.clientY)
  }

  private handleMouseUp = (): void => {
    this.isDragging = false
    this.sceneManager.setMouseDown(false)
    if (this.onCursorMove) {
      const rect = this.container.getBoundingClientRect()
      this.onCursorMove(0, 0, false)
    }
  }

  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault()
    if (e.touches.length > 0) {
      this.isDragging = true
      this.sceneManager.setMouseDown(true)
      const touch = e.touches[0]
      this.updateMousePosition(touch.clientX, touch.clientY)
    }
  }

  private handleTouchMove = (e: TouchEvent): void => {
    e.preventDefault()
    if (e.touches.length > 0) {
      const touch = e.touches[0]
      this.updateMousePosition(touch.clientX, touch.clientY)
    }
  }

  private handleTouchEnd = (): void => {
    this.isDragging = false
    this.sceneManager.setMouseDown(false)
  }

  private updateMousePosition(clientX: number, clientY: number): void {
    this.sceneManager.setMousePosition(clientX, clientY)

    if (this.onCursorMove) {
      const rect = this.container.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      this.onCursorMove(x, y, this.isDragging)
    }
  }

  dispose(): void {
    this.container.removeEventListener('mousedown', this.handleMouseDown)
    this.container.removeEventListener('mousemove', this.handleMouseMove)
    this.container.removeEventListener('mouseup', this.handleMouseUp)
    this.container.removeEventListener('mouseleave', this.handleMouseUp)

    this.container.removeEventListener('touchstart', this.handleTouchStart)
    this.container.removeEventListener('touchmove', this.handleTouchMove)
    this.container.removeEventListener('touchend', this.handleTouchEnd)
    this.container.removeEventListener('touchcancel', this.handleTouchEnd)
  }
}
