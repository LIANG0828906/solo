import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export class SceneManager {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  gridHelper: THREE.GridHelper
  model: THREE.Group | null = null
  animationId: number = 0
  controlPointMeshes: Map<string, THREE.Mesh> = new Map()
  dashLines: Map<string, THREE.Line> = new Map()

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene()

    const bgColorTop = new THREE.Color('#0B0F19')
    const bgColorBottom = new THREE.Color('#1A2440')
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, bgColorTop.getStyle())
    gradient.addColorStop(1, bgColorBottom.getStyle())
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 2, 512)
    const bgTexture = new THREE.CanvasTexture(canvas)
    this.scene.background = bgTexture

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 5, 8)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.target.set(0, 0, 0)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0x4FD1C5, 0.3)
    fillLight.position.set(-5, 3, -5)
    this.scene.add(fillLight)

    this.gridHelper = new THREE.GridHelper(20, 40, 0x4A5568, 0x4A5568)
    const gridMat = this.gridHelper.material as THREE.Material
    gridMat.opacity = 0.3
    gridMat.transparent = true
    this.scene.add(this.gridHelper)

    this.animate = this.animate.bind(this)
    this.animate()
  }

  animate(): void {
    this.animationId = requestAnimationFrame(this.animate)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  setModel(group: THREE.Group, boundingBox: THREE.Box3): void {
    if (this.model) {
      this.scene.remove(this.model)
    }
    this.model = group
    this.scene.add(group)

    const center = new THREE.Vector3()
    boundingBox.getCenter(center)
    const size = new THREE.Vector3()
    boundingBox.getSize(size)

    group.position.sub(center)

    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = this.camera.fov * (Math.PI / 180)
    const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.4
    this.camera.position.set(cameraZ * 0.5, cameraZ * 0.4, cameraZ)
    this.camera.lookAt(0, 0, 0)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }

  addControlPoint(id: string, position: THREE.Vector3, normal: THREE.Vector3): void {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color: 0xF6AD55,
      transparent: true,
      opacity: 0.8,
    })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.copy(position)

    const glowGeometry = new THREE.SphereGeometry(0.45, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xF6AD55,
      transparent: true,
      opacity: 0.3,
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    sphere.add(glow)

    sphere.userData.controlPointId = id
    sphere.userData.normal = normal.clone()
    this.scene.add(sphere)
    this.controlPointMeshes.set(id, sphere)
  }

  updateControlPoint(id: string, displacement: number): void {
    const sphere = this.controlPointMeshes.get(id)
    if (!sphere) return
    const normal = sphere.userData.normal as THREE.Vector3
    const basePos = sphere.userData.basePosition as THREE.Vector3 | undefined
    if (!basePos) {
      sphere.userData.basePosition = sphere.position.clone()
    }
    const origin = basePos || sphere.userData.basePosition
    sphere.position.copy(origin).addScaledVector(normal, displacement)

    const mat = sphere.material as THREE.MeshBasicMaterial
    mat.color.setHex(0xE53E3E)
    mat.opacity = 1.0

    this.removeDashLine(id)
    const points = [origin.clone(), sphere.position.clone()]
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0xCBD5E0,
      dashSize: 0.1,
      gapSize: 0.05,
    })
    const line = new THREE.Line(lineGeometry, lineMaterial)
    line.computeLineDistances()
    this.scene.add(line)
    this.dashLines.set(id, line)
  }

  removeDashLine(id: string): void {
    const existing = this.dashLines.get(id)
    if (existing) {
      this.scene.remove(existing)
      existing.geometry.dispose()
      ;(existing.material as THREE.Material).dispose()
      this.dashLines.delete(id)
    }
  }

  removeControlPoint(id: string): void {
    const sphere = this.controlPointMeshes.get(id)
    if (sphere) {
      this.scene.remove(sphere)
      sphere.geometry.dispose()
      ;(sphere.material as THREE.Material).dispose()
      this.controlPointMeshes.delete(id)
    }
    this.removeDashLine(id)
  }

  updateModelVertices(meshUuid: string, positions: Float32Array): void {
    if (!this.model) return
    this.model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.uuid === meshUuid) {
          const positionAttr = mesh.geometry.getAttribute('position')
          if (positionAttr) {
            for (let i = 0; i < positions.length; i++) {
              positionAttr.setXYZ(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
            }
            positionAttr.needsUpdate = true
            mesh.geometry.computeVertexNormals()
          }
        }
      }
    })
  }

  getRaycaster(): THREE.Raycaster {
    return new THREE.Raycaster()
  }

  getMouseNDC(event: MouseEvent, container: HTMLElement): THREE.Vector2 {
    const rect = container.getBoundingClientRect()
    return new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    )
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  dispose(): void {
    cancelAnimationFrame(this.animationId)
    this.controls.dispose()
    this.renderer.dispose()
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.geometry.dispose()
        const mat = mesh.material
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose())
        } else {
          mat.dispose()
        }
      }
    })
  }
}
