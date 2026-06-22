import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { usePlanetariumStore } from '@/store/store'

export class CameraControls {
  private controls: OrbitControls
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer

  private isFlying: boolean = false
  private flyStartPosition: THREE.Vector3 = new THREE.Vector3()
  private flyStartTarget: THREE.Vector3 = new THREE.Vector3()
  private flyEndPosition: THREE.Vector3 = new THREE.Vector3()
  private flyEndTarget: THREE.Vector3 = new THREE.Vector3()
  private flyDuration: number = 2000
  private flyProgress: number = 0
  private flyStartTime: number = 0

  private autoRotateSpeed: number = 0.5
  private isAutoRotating: boolean = false
  private lastIsAutoRotate: boolean = false
  private lastCameraTarget: THREE.Vector3 = new THREE.Vector3()

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.camera = camera
    this.renderer = renderer

    this.controls = new OrbitControls(camera, renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 1
    this.controls.maxDistance = 200
    this.controls.maxPolarAngle = Math.PI
    this.controls.enablePan = true

    const { camera: cameraState, isAutoRotate } =
      usePlanetariumStore.getState()

    this.controls.target.copy(cameraState.target)
    this.lastCameraTarget.copy(cameraState.target)

    this.camera.position.set(0, 15, 35)
    this.camera.lookAt(cameraState.target)

    this.isAutoRotating = isAutoRotate
    this.lastIsAutoRotate = isAutoRotate
    this.controls.autoRotate = isAutoRotate
    this.controls.autoRotateSpeed = this.autoRotateSpeed
  }

  private checkStoreChanges(): void {
    const state = usePlanetariumStore.getState()

    if (state.isAutoRotate !== this.lastIsAutoRotate) {
      this.lastIsAutoRotate = state.isAutoRotate
      this.isAutoRotating = state.isAutoRotate
      this.controls.autoRotate = state.isAutoRotate
    }

    const target = state.camera.target
    if (
      !this.isFlying &&
      (target.x !== this.lastCameraTarget.x ||
        target.y !== this.lastCameraTarget.y ||
        target.z !== this.lastCameraTarget.z)
    ) {
      this.lastCameraTarget.copy(target)
      this.controls.target.copy(target)
    }
  }

  flyToPlanet(
    planetPosition: THREE.Vector3,
    planetRadius: number,
    duration: number = 2000
  ): void {
    if (this.isFlying) return

    usePlanetariumStore.getState().setCameraFlying(true)

    this.isFlying = true
    this.flyDuration = duration
    this.flyProgress = 0
    this.flyStartTime = performance.now()

    this.flyStartPosition.copy(this.camera.position)
    this.flyStartTarget.copy(this.controls.target)

    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize()

    const distance = planetRadius * 5
    const offset = direction.multiplyScalar(distance)

    this.flyEndPosition.copy(planetPosition).add(offset)
    this.flyEndTarget.copy(planetPosition)

    this.controls.enabled = false
  }

  flyToOverview(duration: number = 2000): void {
    if (this.isFlying) return

    usePlanetariumStore.getState().setCameraFlying(true)

    this.isFlying = true
    this.flyDuration = duration
    this.flyProgress = 0
    this.flyStartTime = performance.now()

    this.flyStartPosition.copy(this.camera.position)
    this.flyStartTarget.copy(this.controls.target)

    this.flyEndPosition.set(0, 15, 35)
    this.flyEndTarget.set(0, 0, 0)

    this.controls.enabled = false
  }

  update(deltaTime: number): void {
    this.checkStoreChanges()

    if (this.isFlying) {
      this.updateFly(deltaTime)
    } else {
      this.controls.update()
    }

    this.syncToStore()
  }

  private updateFly(deltaTime: number): void {
    const elapsed = performance.now() - this.flyStartTime
    this.flyProgress = Math.min(elapsed / this.flyDuration, 1)

    const easedProgress = this.easeInOutCubic(this.flyProgress)

    this.camera.position.lerpVectors(
      this.flyStartPosition,
      this.flyEndPosition,
      easedProgress
    )

    const currentTarget = new THREE.Vector3().lerpVectors(
      this.flyStartTarget,
      this.flyEndTarget,
      easedProgress
    )

    this.camera.lookAt(currentTarget)
    this.controls.target.copy(currentTarget)

    if (this.flyProgress >= 1) {
      this.isFlying = false
      this.controls.enabled = true
      usePlanetariumStore.getState().setCameraFlying(false)
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  private syncToStore(): void {
    const state = usePlanetariumStore.getState()

    if (
      state.camera.target.x !== this.controls.target.x ||
      state.camera.target.y !== this.controls.target.y ||
      state.camera.target.z !== this.controls.target.z
    ) {
      usePlanetariumStore
        .getState()
        .setCameraTarget(this.controls.target.clone())
    }
  }

  getControls(): OrbitControls {
    return this.controls
  }

  getIsFlying(): boolean {
    return this.isFlying
  }

  setAutoRotate(enable: boolean): void {
    this.isAutoRotating = enable
    this.controls.autoRotate = enable
    usePlanetariumStore.getState().setIsAutoRotate(enable)
  }

  dispose(): void {
    this.controls.dispose()
  }
}
