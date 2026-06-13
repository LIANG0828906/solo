import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export class InteractionManager {
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private container: HTMLElement
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private mouseFields: MouseField[]
  private onClickCallback: ((field: MouseField) => void) | null

  constructor(camera: THREE.PerspectiveCamera, container: HTMLElement) {
    this.camera = camera
    this.container = container
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.mouseFields = []
    this.onClickCallback = null

    this.controls = new OrbitControls(camera, container)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minPolarAngle = (Math.PI / 180) * (-60)
    this.controls.maxPolarAngle = (Math.PI / 180) * 60
    this.controls.minDistance = 5
    this.controls.maxDistance = 20

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.container.addEventListener('contextmenu', this.onContextMenu.bind(this))
    
    const resetBtn = document.getElementById('reset-btn')
    if (resetBtn) {
      resetBtn.addEventListener('click', this.resetView.bind(this))
    }

    const controlToggle = document.getElementById('control-toggle')
    const controlPanel = document.getElementById('control-panel')
    if (controlToggle && controlPanel) {
      controlToggle.addEventListener('click', () => {
        controlPanel.classList.toggle('visible')
      })
    }
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return
    
    this.handleClick(event, 'attract')
  }

  private onContextMenu(event: MouseEvent): void {
    event.preventDefault()
    this.handleClick(event, 'repel')
  }

  private handleClick(event: MouseEvent, type: 'attract' | 'repel'): void {
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion), 0)
    const intersectPoint = new THREE.Vector3()
    this.raycaster.ray.intersectPlane(plane, intersectPoint)

    if (intersectPoint) {
      const field: MouseField = {
        position: intersectPoint.clone(),
        type,
        radius: 3,
        strength: 5,
        startTime: Date.now(),
        duration: 2000,
        isExpired: function() {
          return Date.now() - this.startTime >= this.duration
        }
      }

      this.mouseFields.push(field)

      if (this.onClickCallback) {
        this.onClickCallback(field)
      }
    }
  }

  private resetView(): void {
    this.controls.reset()
  }

  update(): void {
    this.controls.update()

    this.mouseFields = this.mouseFields.filter(field => !field.isExpired())
  }

  getActiveField(): MouseField | null {
    return this.mouseFields.length > 0 ? this.mouseFields[this.mouseFields.length - 1] : null
  }

  setOnClickCallback(callback: (field: MouseField) => void): void {
    this.onClickCallback = callback
  }

  dispose(): void {
    this.controls.dispose()
  }
}

export interface MouseField {
  position: THREE.Vector3
  type: 'attract' | 'repel'
  radius: number
  strength: number
  startTime: number
  duration: number
  isExpired(): boolean
}