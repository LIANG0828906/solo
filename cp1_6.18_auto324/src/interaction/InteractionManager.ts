import * as THREE from 'three'
import { useSimulationStore, Particle } from '../data/SimulationStore'

export class InteractionManager {
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private camera: THREE.PerspectiveCamera | null = null
  private scene: THREE.Scene | null = null
  private pointsRef: THREE.Points | null = null
  private isPointerDown: boolean = false
  private pointerDownTime: number = 0
  private pointerDownPos: { x: number; y: number } = { x: 0, y: 0 }
  private dragThreshold: number = 5
  private hasDragged: boolean = false
  private dragPlane: THREE.Plane = new THREE.Plane()

  constructor() {
    this.raycaster = new THREE.Raycaster()
    this.raycaster.params.Points.threshold = 0.5
    this.mouse = new THREE.Vector2()
  }

  setCamera(camera: THREE.PerspectiveCamera) {
    this.camera = camera
  }

  setScene(scene: THREE.Scene) {
    this.scene = scene
  }

  setPoints(points: THREE.Points) {
    this.pointsRef = points
  }

  private updateMouse(clientX: number, clientY: number) {
    if (!this.camera) return
    const rect = this.camera.userData.canvasRect || {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight
    }
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  private getIntersectedParticle(): Particle | null {
    if (!this.camera || !this.pointsRef) return null

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObject(this.pointsRef, false)

    if (intersects.length > 0 && intersects[0].index !== undefined) {
      const particles = useSimulationStore.getState().particles
      if (particles[intersects[0].index]) {
        return particles[intersects[0].index]
      }
    }
    return null
  }

  private getPointOnPlane(clientX: number, clientY: number): THREE.Vector3 | null {
    if (!this.camera) return null
    this.updateMouse(clientX, clientY)
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersection = new THREE.Vector3()
    const hit = this.raycaster.ray.intersectPlane(this.dragPlane, intersection)
    return hit ? intersection : null
  }

  handlePointerDown(clientX: number, clientY: number, shiftKey: boolean) {
    this.isPointerDown = true
    this.hasDragged = false
    this.pointerDownTime = performance.now()
    this.pointerDownPos = { x: clientX, y: clientY }
    this.updateMouse(clientX, clientY)

    const particle = this.getIntersectedParticle()
    const state = useSimulationStore.getState()

    if (particle) {
      if (shiftKey && state.selectedParticleId && state.selectedParticleId !== particle.id) {
        useSimulationStore.getState().addConnection(state.selectedParticleId, particle.id)
        useSimulationStore.getState().setSecondSelected(particle.id)
      } else {
        useSimulationStore.getState().setSelectedParticle(particle.id)
        useSimulationStore.getState().setSecondSelected(null)
      }

      if (this.camera) {
        const normal = new THREE.Vector3()
        this.camera.getWorldDirection(normal)
        normal.negate()
        this.dragPlane.setFromNormalAndCoplanarPoint(
          normal,
          new THREE.Vector3(particle.x, particle.y, particle.z)
        )
      }

      useSimulationStore.getState().setDragging(true, particle.id)
    } else {
      if (!shiftKey) {
        useSimulationStore.getState().setSelectedParticle(null)
        useSimulationStore.getState().setSecondSelected(null)
      }
    }
  }

  handlePointerMove(clientX: number, clientY: number) {
    if (!this.isPointerDown) return

    const dx = clientX - this.pointerDownPos.x
    const dy = clientY - this.pointerDownPos.y
    if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) {
      this.hasDragged = true
    }

    const state = useSimulationStore.getState()
    if (state.isDragging && state.draggedParticleId && this.hasDragged) {
      const point = this.getPointOnPlane(clientX, clientY)
      if (point) {
        useSimulationStore.getState().updateParticle(state.draggedParticleId, {
          x: point.x,
          y: point.y,
          z: point.z,
          vx: 0,
          vy: 0,
          vz: 0
        })
      }
    }
  }

  handlePointerUp(clientX: number, clientY: number, shiftKey: boolean) {
    const state = useSimulationStore.getState()
    const wasDragging = state.isDragging

    useSimulationStore.getState().setDragging(false)

    if (!this.hasDragged && !wasDragging) {
      this.updateMouse(clientX, clientY)
      const particle = this.getIntersectedParticle()

      if (!particle) {
        if (this.camera) {
          this.raycaster.setFromCamera(this.mouse, this.camera)
          const direction = new THREE.Vector3()
          this.raycaster.ray.direction.normalize()
          const origin = new THREE.Vector3()
          this.raycaster.ray.origin.copy(origin)
          this.raycaster.ray.origin.copy(this.camera.position)
          direction.copy(this.raycaster.ray.direction)

          const distance = 15
          const newX = this.camera.position.x + direction.x * distance
          const newY = this.camera.position.y + direction.y * distance
          const newZ = this.camera.position.z + direction.z * distance

          if (!shiftKey) {
            useSimulationStore.getState().addParticle({
              x: newX,
              y: newY,
              z: newZ,
              vx: 0,
              vy: 0,
              vz: 0
            })
          }
        }
      }
    }

    this.isPointerDown = false
    this.hasDragged = false
  }

  handleKeyDown(key: string) {
    if (key === 'Delete' || key === 'Backspace') {
      const state = useSimulationStore.getState()
      if (state.selectedParticleId) {
        useSimulationStore.getState().removeParticle(state.selectedParticleId)
      }
    }
  }
}

export const interactionManager = new InteractionManager()
export default interactionManager
