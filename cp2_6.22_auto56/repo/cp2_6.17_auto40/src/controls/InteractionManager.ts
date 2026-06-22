import * as THREE from 'three'
import { useFractalStore } from '@/store/useFractalStore'

export class InteractionManager {
  private container: HTMLElement
  private camera: THREE.PerspectiveCamera
  private isDragging = false
  private previousMousePosition = { x: 0, y: 0 }
  private targetRotationY = 0
  private targetRotationX = 0
  private onClickCallback?: (point: THREE.Vector3 | null) => void
  private handlers: Record<string, any> = {}

  constructor(container: HTMLElement, camera: THREE.PerspectiveCamera) {
    this.container = container
    this.camera = camera
    this.bindEvents()
  }

  setOnClickCallback(callback: (point: THREE.Vector3 | null) => void) {
    this.onClickCallback = callback
  }

  private bindEvents(): void {
    this.handlers = {
      mousedown: this.onMouseDown.bind(this),
      mousemove: this.onMouseMove.bind(this),
      mouseup: this.onMouseUp.bind(this),
      mouseleave: this.onMouseUp.bind(this),
      wheel: this.onWheel.bind(this),
      click: this.onClick.bind(this),
      keydown: this.onKeyDown.bind(this),
      resize: this.onResize.bind(this)
    }

    this.container.addEventListener('mousedown', this.handlers.mousedown)
    this.container.addEventListener('mousemove', this.handlers.mousemove)
    this.container.addEventListener('mouseup', this.handlers.mouseup)
    this.container.addEventListener('mouseleave', this.handlers.mouseleave)
    this.container.addEventListener('wheel', this.handlers.wheel, { passive: false })
    this.container.addEventListener('click', this.handlers.click)
    window.addEventListener('keydown', this.handlers.keydown)
    window.addEventListener('resize', this.handlers.resize)
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true
    this.previousMousePosition = { x: event.clientX, y: event.clientY }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return

    const deltaX = event.clientX - this.previousMousePosition.x
    const deltaY = event.clientY - this.previousMousePosition.y

    this.targetRotationY += deltaX * 0.01
    this.targetRotationX += deltaY * 0.01
    this.targetRotationX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.targetRotationX))

    useFractalStore.getState().setCamera({
      rotationX: this.targetRotationX,
      rotationY: this.targetRotationY
    })

    this.previousMousePosition = { x: event.clientX, y: event.clientY }
  }

  private onMouseUp(): void {
    this.isDragging = false
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault()
    const { camera } = useFractalStore.getState()
    const zoomDelta = event.deltaY > 0 ? 1.1 : 0.9
    const newZoom = camera.zoom * zoomDelta
    const clampedZoom = Math.max(5, Math.min(30, newZoom))

    useFractalStore.getState().setCamera({ zoom: clampedZoom })
  }

  private onClick(event: MouseEvent): void {
    if (this.isDragging) return

    const rect = this.container.getBoundingClientRect()
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )

    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, this.camera)

    const { branchTips } = useFractalStore.getState()

    let closestTip: { position: THREE.Vector3; distance: number } | null = null

    for (const tip of branchTips) {
      const distance = tip.position.distanceTo(this.camera.position)
      const projected = tip.position.clone().project(this.camera)
      const screenDistance = Math.sqrt(
        Math.pow(projected.x - mouse.x, 2) + Math.pow(projected.y - mouse.y, 2)
      )

      if (screenDistance < 0.05 && (!closestTip || distance < closestTip.distance)) {
        closestTip = { position: tip.position, distance }
      }
    }

    if (closestTip && this.onClickCallback) {
      this.onClickCallback(closestTip.position)
    } else if (this.onClickCallback) {
      this.onClickCallback(null)
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      event.preventDefault()
      const { render, startTransition, cycleMode } = useFractalStore.getState()

      if (!render.isTransitioning) {
        startTransition()
        cycleMode()
      }
    }
  }

  private onResize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  update(): void {
    const { camera } = useFractalStore.getState()

    this.targetRotationY = camera.rotationY
    this.targetRotationX = camera.rotationX

    const radius = camera.zoom
    const x = radius * Math.sin(camera.rotationY) * Math.cos(camera.rotationX)
    const y = radius * Math.sin(camera.rotationX)
    const z = radius * Math.cos(camera.rotationY) * Math.cos(camera.rotationX)

    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 4, 0)
  }

  dispose(): void {
    this.container.removeEventListener('mousedown', this.handlers.mousedown)
    this.container.removeEventListener('mousemove', this.handlers.mousemove)
    this.container.removeEventListener('mouseup', this.handlers.mouseup)
    this.container.removeEventListener('mouseleave', this.handlers.mouseleave)
    this.container.removeEventListener('wheel', this.handlers.wheel)
    this.container.removeEventListener('click', this.handlers.click)
    window.removeEventListener('keydown', this.handlers.keydown)
    window.removeEventListener('resize', this.handlers.resize)
  }
}
