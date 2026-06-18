import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MoleculeGroup, highlightAtom, clearAllHighlights } from './sceneBuilder'
import { projectAtomToScreen } from './proteinParser'

export interface AtomInfo {
  element: string
  x: number
  y: number
  z: number
  neighborCount: number
  id: number
  screenX: number
  screenY: number
}

export type InteractionCallback = {
  onAtomHover?: (atomInfo: AtomInfo | null) => void
  onAtomClick?: (atomInfo: AtomInfo) => void
  onUserInteractionStart?: () => void
  onUserInteractionEnd?: () => void
}

export class InteractionManager {
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private atomMeshes: THREE.Mesh[]
  private controls: OrbitControls
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private hoveredAtomIndex: number | null = null
  private callbacks: InteractionCallback
  private bondNeighbors: Map<number, number[]> = new Map()
  private atomsData: { element: string; x: number; y: number; z: number; id: number }[]
  private moleculeGroup: MoleculeGroup
  private initialCameraPosition: THREE.Vector3
  private initialCameraTarget: THREE.Vector3

  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    atomMeshes: THREE.Mesh[],
    controls: OrbitControls,
    bonds: { atomIndex1: number; atomIndex2: number }[],
    atomsData: { element: string; x: number; y: number; z: number; id: number }[],
    moleculeGroup: MoleculeGroup,
    callbacks: InteractionCallback = {}
  ) {
    this.camera = camera
    this.renderer = renderer
    this.atomMeshes = atomMeshes
    this.controls = controls
    this.callbacks = callbacks
    this.atomsData = atomsData
    this.moleculeGroup = moleculeGroup

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.initialCameraPosition = camera.position.clone()
    this.initialCameraTarget = controls.target.clone()

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
    this.controls.autoRotate = false

    this.controls.addEventListener('start', () => {
      if (this.callbacks.onUserInteractionStart) {
        this.callbacks.onUserInteractionStart()
      }
    })

    this.controls.addEventListener('end', () => {
      if (this.callbacks.onUserInteractionEnd) {
        this.callbacks.onUserInteractionEnd()
      }
    })
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
      const atomIndex = this.atomMeshes.indexOf(mesh)
      if (atomIndex >= 0 && this.hoveredAtomIndex !== atomIndex) {
        this.unhoverCurrentAtom()
        this.hoverAtom(atomIndex)
      }
    } else {
      if (this.hoveredAtomIndex !== null) {
        this.unhoverCurrentAtom()
      }
    }
  }

  private hoverAtom(atomIndex: number): void {
    this.hoveredAtomIndex = atomIndex
    highlightAtom(this.moleculeGroup, atomIndex, true, true)

    if (this.callbacks.onAtomHover) {
      this.callbacks.onAtomHover(this.getAtomInfo(atomIndex))
    }

    document.body.style.cursor = 'pointer'
  }

  private unhoverCurrentAtom(): void {
    if (this.hoveredAtomIndex === null) return

    const prevIndex = this.hoveredAtomIndex
    this.hoveredAtomIndex = null
    highlightAtom(this.moleculeGroup, prevIndex, false, true)

    if (this.callbacks.onAtomHover) {
      this.callbacks.onAtomHover(null)
    }

    document.body.style.cursor = 'default'
  }

  private getAtomInfo(index: number): AtomInfo {
    const atom = this.atomsData[index]
    const neighbors = this.bondNeighbors.get(index) || []
    const position = new THREE.Vector3(atom.x, atom.y, atom.z)
    const { x: screenX, y: screenY } = projectAtomToScreen(
      position,
      this.camera,
      this.renderer.domElement.clientWidth,
      this.renderer.domElement.clientHeight
    )

    return {
      element: atom.element,
      x: Number(atom.x.toFixed(2)),
      y: Number(atom.y.toFixed(2)),
      z: Number(atom.z.toFixed(2)),
      neighborCount: neighbors.length,
      id: atom.id,
      screenX,
      screenY
    }
  }

  public resetView(): void {
    const startPos = this.camera.position.clone()
    const startTarget = this.controls.target.clone()
    const endPos = this.initialCameraPosition.clone()
    const endTarget = this.initialCameraTarget.clone()
    const startTime = performance.now()
    const duration = 600

    const animate = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      this.camera.position.lerpVectors(startPos, endPos, eased)
      this.controls.target.lerpVectors(startTarget, endTarget, eased)
      this.controls.update()

      if (t < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  public setInitialView(position: THREE.Vector3, target: THREE.Vector3): void {
    this.initialCameraPosition.copy(position)
    this.initialCameraTarget.copy(target)
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
    clearAllHighlights(this.moleculeGroup)
  }
}
