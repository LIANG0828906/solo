import * as THREE from 'three'
import { gameEngine } from '@/modules/game/GameEngine'
import { useGameStore } from '@/store/useGameStore'

export class InteractionHandler {
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private camera: THREE.Camera | null = null
  private scene: THREE.Scene | null = null
  private isDraggingStar: boolean = false
  private draggedStarId: string | null = null
  private dragStartPosition: THREE.Vector3 = new THREE.Vector3()
  private dragStartClientX: number = 0
  private dragStartClientY: number = 0
  private hasMoved: boolean = false
  private readonly dragThreshold: number = 5

  constructor() {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
  }

  setCamera(camera: THREE.Camera): void {
    this.camera = camera
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene
  }

  updateMousePosition(clientX: number, clientY: number, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect()
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  intersectStars(stars: THREE.Object3D[]): THREE.Intersection | null {
    if (!this.camera) return null

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(stars, true)

    return intersects.length > 0 ? intersects[0] : null
  }

  handlePointerDown(event: { clientX: number; clientY: number; pointerId: number; target: EventTarget | null }, starId: string, starPosition: THREE.Vector3): void {
    this.isDraggingStar = true
    this.draggedStarId = starId
    this.hasMoved = false
    this.dragStartPosition.copy(starPosition)
    this.dragStartClientX = event.clientX
    this.dragStartClientY = event.clientY
    if (event.target) {
      (event.target as HTMLElement).setPointerCapture(event.pointerId)
    }

    gameEngine.handleStarDragStart(starId, starPosition.clone())
  }

  handlePointerMove(event: { clientX: number; clientY: number; currentTarget: EventTarget | null }, starObjects: Map<string, THREE.Object3D>): void {
    if (!this.isDraggingStar || !this.draggedStarId || !this.camera) return

    const canvas = event.currentTarget as HTMLCanvasElement
    this.updateMousePosition(event.clientX, event.clientY, canvas)

    const dragDistance = Math.sqrt(
      Math.pow(event.clientX - this.dragStartClientX, 2) +
      Math.pow(event.clientY - this.dragStartClientY, 2)
    )

    if (dragDistance > this.dragThreshold) {
      this.hasMoved = true
    }

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const starObj = starObjects.get(this.draggedStarId)
    if (starObj) {
      const distance = starObj.position.distanceTo(this.camera.position)
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion),
        starObj.position
      )

      const targetPoint = new THREE.Vector3()
      this.raycaster.ray.intersectPlane(plane, targetPoint)

      if (targetPoint) {
        gameEngine.handleStarDragMove(this.draggedStarId, targetPoint)
      }
    }

    const hoveredIntersect = this.intersectStars(Array.from(starObjects.values()).filter(o => o.userData.starId !== this.draggedStarId))
    const store = useGameStore.getState()

    if (hoveredIntersect && hoveredIntersect.object.userData.starId) {
      const hoveredStarId = hoveredIntersect.object.userData.starId
      if (store.selectedStarId && store.selectedStarId !== this.draggedStarId) {
        store.addPreviewConnection(store.selectedStarId, hoveredStarId)
      } else if (store.selectedStarId === this.draggedStarId) {
        store.addPreviewConnection(this.draggedStarId, hoveredStarId)
      }
    } else {
      store.removePreviewConnection()
    }
  }

  handlePointerUp(event: React.PointerEvent, starObjects: Map<string, THREE.Object3D>): void {
    if (!this.isDraggingStar || !this.draggedStarId) return

    ;(event.target as HTMLElement).releasePointerCapture(event.pointerId)

    const store = useGameStore.getState()
    store.removePreviewConnection()

    if (!this.camera) return

    const canvas = event.currentTarget as HTMLCanvasElement
    this.updateMousePosition(event.clientX, event.clientY, canvas)

    const targetIntersect = this.intersectStars(Array.from(starObjects.values()).filter(o => o.userData.starId !== this.draggedStarId))
    const targetStarId = targetIntersect?.object.userData.starId

    if (this.hasMoved) {
      gameEngine.handleStarDragEnd(this.draggedStarId, targetStarId)
    } else {
      gameEngine.handleStarDragEnd(this.draggedStarId)
      gameEngine.handleStarClick(this.draggedStarId)
    }

    this.isDraggingStar = false
    this.draggedStarId = null
    this.hasMoved = false
  }

  handlePointerLeave(event: React.PointerEvent): void {
    if (this.isDraggingStar && this.draggedStarId) {
      gameEngine.handleStarDragEnd(this.draggedStarId)
      this.isDraggingStar = false
      this.draggedStarId = null
      this.hasMoved = false
    }
  }

  handleSceneClick(event: React.MouseEvent, starObjects: Map<string, THREE.Object3D>): void {
    if (this.isDraggingStar || this.hasMoved) return

    const canvas = event.currentTarget as HTMLCanvasElement
    this.updateMousePosition(event.clientX, event.clientY, canvas)

    const intersect = this.intersectStars(Array.from(starObjects.values()))

    if (!intersect) {
      const store = useGameStore.getState()
      store.dispatch({ type: 'CLEAR_SELECTION' })
    }
  }

  getRaycaster(): THREE.Raycaster {
    return this.raycaster
  }

  getMouse(): THREE.Vector2 {
    return this.mouse
  }

  isDragging(): boolean {
    return this.isDraggingStar
  }

  getDraggedStarId(): string | null {
    return this.draggedStarId
  }
}

export const interactionHandler = new InteractionHandler()
