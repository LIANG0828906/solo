import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface AtomInfo {
  element: string
  x: number
  y: number
  z: number
  neighborCount: number
  id: number
}

export type InteractionCallback = {
  onAtomHover?: (atomInfo: AtomInfo | null) => void
  onAtomClick?: (atomInfo: AtomInfo) => void
}

export class InteractionManager {
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private atomMeshes: THREE.Mesh[]
  private controls: OrbitControls
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private hoveredAtom: THREE.Mesh | null = null
  private originalMaterials: Map<THREE.Mesh, THREE.Material> = new Map()
  private callbacks: InteractionCallback
  private bondNeighbors: Map<number, number[]> = new Map()
  private atomsData: { element: string; x: number; y: number; z: number; id: number }[]

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    atomMeshes: THREE.Mesh[],
    controls: OrbitControls,
    bonds: { atomIndex1: number; atomIndex2: number }[],
    atomsData: { element: string; x: number; y: number; z: number; id: number }[],
    callbacks: InteractionCallback = {}
  ) {
    this.camera = camera
    this.renderer = renderer
    this.atomMeshes = atomMeshes
    this.controls = controls
    this.callbacks = callbacks
    this.atomsData = atomsData

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.buildNeighborMap(bonds)
    this.bindEvents()
    this.setupControls()
  }

  private buildNeighborMap(bonds: { atomIndex1: number; atomIndex2: number }[]): void {
    bonds.forEach((bond) => {
      if (!this.bondNeighbors.has(bond.atomIndex1)) {
        this.bondNeighbors.set(bond.atomIndex1, [])
      }
      if (!this.bondNeighbors.has(bond.atomIndex2)) {
        this.bondNeighbors.set(bond.atomIndex2, [])
      }
      this.bondNeighbors.get(bond.atomIndex1)!.push(bond.atomIndex2)
      this.bondNeighbors.get(bond.atomIndex2)!.push(bond.atomIndex1)
    })
  }

  private setupControls(): void {
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 2
    this.controls.maxDistance = 50
    this.controls.enablePan = true
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 1.0
  }

  private bindEvents(): void {
    const canvas = this.renderer.domElement
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this))
    canvas.addEventListener('click', this.onClick.bind(this))
    canvas.addEventListener('wheel', this.onWheel.bind(this))
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.checkHover()
  }

  private onClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.atomMeshes, true)

    if (intersects.length > 0) {
      const mesh = this.findTopMesh(intersects[0].object)
      const atomIndex = this.atomMeshes.indexOf(mesh)
      if (atomIndex >= 0) {
        const atomInfo = this.getAtomInfo(atomIndex)
        if (this.callbacks.onAtomClick) {
          this.callbacks.onAtomClick(atomInfo)
        }
      }
    }
  }

  private findTopMesh(obj: THREE.Object3D): THREE.Mesh {
    let current: THREE.Object3D = obj
    while (current.parent && !(current as THREE.Mesh).isMesh) {
      current = current.parent
    }
    return current as THREE.Mesh
  }

  private onWheel(event: WheelEvent): void {
  }

  private checkHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.atomMeshes, false)

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh
      if (this.hoveredAtom !== mesh) {
        this.unhoverCurrentAtom()
        this.hoverAtom(mesh)
      }
    } else {
      if (this.hoveredAtom) {
        this.unhoverCurrentAtom()
      }
    }
  }

  private hoverAtom(mesh: THREE.Mesh): void {
    this.hoveredAtom = mesh
    this.originalMaterials.set(mesh, (mesh.material as THREE.Material).clone())

    const originalMaterial = mesh.material as THREE.MeshPhongMaterial
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: originalMaterial.color,
      emissive: originalMaterial.color,
      emissiveIntensity: 0.8,
      shininess: 120,
      transparent: true,
      opacity: 1.0
    })

    this.animateMaterial(mesh, glowMaterial, 300)

    const atomIndex = this.atomMeshes.indexOf(mesh)
    if (atomIndex >= 0 && this.callbacks.onAtomHover) {
      this.callbacks.onAtomHover(this.getAtomInfo(atomIndex))
    }

    document.body.style.cursor = 'pointer'
  }

  private unhoverCurrentAtom(): void {
    if (!this.hoveredAtom) return

    const originalMaterial = this.originalMaterials.get(this.hoveredAtom)
    if (originalMaterial) {
      this.animateMaterial(this.hoveredAtom, originalMaterial as THREE.MeshPhongMaterial, 300)
    }

    this.originalMaterials.delete(this.hoveredAtom)
    this.hoveredAtom = null

    if (this.callbacks.onAtomHover) {
      this.callbacks.onAtomHover(null)
    }

    document.body.style.cursor = 'default'
  }

  private animateMaterial(mesh: THREE.Mesh, targetMaterial: THREE.MeshPhongMaterial, duration: number): void {
    const startMaterial = mesh.material as THREE.MeshPhongMaterial
    const startEmissiveIntensity = startMaterial.emissiveIntensity || 0
    const targetEmissiveIntensity = targetMaterial.emissiveIntensity || 0
    const startTime = performance.now()

    const material = startMaterial.clone() as THREE.MeshPhongMaterial
    mesh.material = material

    function step() {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

      material.emissiveIntensity = startEmissiveIntensity + (targetEmissiveIntensity - startEmissiveIntensity) * eased

      if (t < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }

  private getAtomInfo(index: number): AtomInfo {
    const atom = this.atomsData[index]
    const neighbors = this.bondNeighbors.get(index) || []
    return {
      element: atom.element,
      x: Number(atom.x.toFixed(2)),
      y: Number(atom.y.toFixed(2)),
      z: Number(atom.z.toFixed(2)),
      neighborCount: neighbors.length,
      id: atom.id
    }
  }

  public updateAtomMeshes(atomMeshes: THREE.Mesh[]): void {
    this.atomMeshes = atomMeshes
  }

  public setRotationSpeed(speed: number): void {
    this.controls.autoRotateSpeed = speed
  }

  public setAutoRotate(enabled: boolean): void {
    this.controls.autoRotate = enabled
  }

  public getControls(): OrbitControls {
    return this.controls
  }

  public dispose(): void {
    const canvas = this.renderer.domElement
    canvas.removeEventListener('mousemove', this.onMouseMove.bind(this))
    canvas.removeEventListener('click', this.onClick.bind(this))
    canvas.removeEventListener('wheel', this.onWheel.bind(this))
  }
}
