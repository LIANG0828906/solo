import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface Atom {
  id: number
  element: string
  x: number
  y: number
  z: number
}

export interface Bond {
  atom1: number
  atom2: number
}

type ModelType = 'ball-stick' | 'space-filling'

interface AtomMesh extends THREE.Mesh {
  userData: {
    type: 'atom'
    atom: Atom
    baseRadius: number
    targetRadius: number
    currentRadius: number
  }
}

interface BondMesh extends THREE.Mesh {
  userData: {
    type: 'bond'
    bond: Bond
    baseRadius: number
    targetRadius: number
    currentRadius: number
    baseColor: THREE.Color
    highlighted: boolean
  }
}

interface HighlightMesh extends THREE.Mesh {
  userData: {
    type: 'highlight'
    atomId: number
    phase: number
  }
}

const ELEMENT_COLORS: Record<string, number> = {
  C: 0x808080,
  O: 0xff0000,
  H: 0xffffff,
  N: 0x3050f8,
  S: 0xffff30,
  P: 0xff8000,
  F: 0x90e050,
  Cl: 0x1ff01f,
  Br: 0xa62929,
  I: 0x940094
}

const ELEMENT_RADII: Record<string, number> = {
  C: 0.7,
  O: 0.66,
  H: 0.31,
  N: 0.65,
  S: 1.05,
  P: 1.0,
  F: 0.57,
  Cl: 1.02,
  Br: 1.2,
  I: 1.39
}

const BALL_STICK_ATOM_SCALE = 0.4
const BALL_STICK_BOND_RADIUS = 0.1
const SPACE_FILL_ATOM_SCALE = 1.0
const SPACE_FILL_BOND_RADIUS = 0.01
const HIGHLIGHT_BRIGHT_COLOR = 0x00ffff
const TRANSITION_SPEED = 5.0
const AUTO_ROTATE_SPEED = 0.8
const CAMERA_FOCUS_SPEED = 3.0

export class MoleculeScene {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private container: HTMLElement
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private clock: THREE.Clock

  private atomsGroup: THREE.Group
  private bondsGroup: THREE.Group
  private highlightsGroup: THREE.Group

  private atomMeshes: Map<number, AtomMesh> = new Map()
  private bondMeshes: Map<string, BondMesh> = new Map()
  private highlightMeshes: Map<number, HighlightMesh> = new Map()

  private atoms: Atom[] = []
  private bonds: Bond[] = []

  private modelType: ModelType = 'ball-stick'
  private hoveredAtomId: number | null = null
  private selectedAtomId: number | null = null

  private targetCameraPos: THREE.Vector3 | null = null
  private targetLookAt: THREE.Vector3 | null = null

  onAtomHover: ((atom: Atom | null, screenX: number, screenY: number) => void) | null = null
  onAtomClick: ((atom: Atom | null) => void) | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.clock = new THREE.Clock()
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a2e)
    this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 60)

    const width = container.clientWidth
    const height = container.clientHeight

    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    this.camera.position.set(0, 5, 15)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.rotateSpeed = 0.8
    this.controls.zoomSpeed = 1.0
    this.controls.panSpeed = 0.8
    this.controls.minDistance = 3
    this.controls.maxDistance = 50

    this.atomsGroup = new THREE.Group()
    this.bondsGroup = new THREE.Group()
    this.highlightsGroup = new THREE.Group()
    this.scene.add(this.atomsGroup)
    this.scene.add(this.bondsGroup)
    this.scene.add(this.highlightsGroup)

    this.setupLights()
    this.setupEventListeners()
    this.loadSampleMolecule()
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x404060, 0.6)
    this.scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
    dirLight.position.set(5, 10, 7)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 50
    dirLight.shadow.camera.left = -20
    dirLight.shadow.camera.right = 20
    dirLight.shadow.camera.top = 20
    dirLight.shadow.camera.bottom = -20
    this.scene.add(dirLight)

    const pointLight1 = new THREE.PointLight(0x00d4ff, 0.6, 40)
    pointLight1.position.set(-8, 3, -5)
    this.scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff0080, 0.3, 40)
    pointLight2.position.set(8, -3, 5)
    this.scene.add(pointLight2)
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this))
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this))
    this.renderer.domElement.addEventListener('mouseleave', this.onMouseLeave.bind(this))
  }

  private onResize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.atomsGroup.children, false)

    if (intersects.length > 0) {
      const mesh = intersects[0].object as AtomMesh
      if (mesh.userData.type === 'atom') {
        if (this.hoveredAtomId !== mesh.userData.atom.id) {
          this.hoveredAtomId = mesh.userData.atom.id
          if (this.onAtomHover) {
            this.onAtomHover(mesh.userData.atom, event.clientX, event.clientY)
          }
        } else if (this.onAtomHover) {
          this.onAtomHover(mesh.userData.atom, event.clientX, event.clientY)
        }
        this.renderer.domElement.style.cursor = 'pointer'
        return
      }
    }

    if (this.hoveredAtomId !== null) {
      this.hoveredAtomId = null
      if (this.onAtomHover) {
        this.onAtomHover(null, 0, 0)
      }
    }
    this.renderer.domElement.style.cursor = 'default'
  }

  private onMouseLeave(): void {
    if (this.hoveredAtomId !== null) {
      this.hoveredAtomId = null
      if (this.onAtomHover) {
        this.onAtomHover(null, 0, 0)
      }
    }
  }

  private onClick(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.atomsGroup.children, false)

    if (intersects.length > 0) {
      const mesh = intersects[0].object as AtomMesh
      if (mesh.userData.type === 'atom') {
        this.selectAtom(mesh.userData.atom.id)
        return
      }
    }

    this.selectAtom(null)
  }

  private loadSampleMolecule(): void {
    this.atoms = [
      { id: 1, element: 'C', x: 0.0, y: 0.0, z: 0.0 },
      { id: 2, element: 'H', x: 0.629, y: 0.629, z: 0.629 },
      { id: 3, element: 'H', x: -0.629, y: -0.629, z: 0.629 },
      { id: 4, element: 'H', x: -0.629, y: 0.629, z: -0.629 },
      { id: 5, element: 'C', x: 1.5, y: -0.3, z: -0.8 },
      { id: 6, element: 'O', x: 2.6, y: -0.5, z: -0.3 },
      { id: 7, element: 'C', x: 1.2, y: -0.8, z: -2.2 },
      { id: 8, element: 'H', x: 1.9, y: -1.0, z: -2.9 },
      { id: 9, element: 'H', x: 0.3, y: -0.5, z: -2.5 },
      { id: 10, element: 'H', x: 0.9, y: -1.7, z: -1.8 },
      { id: 11, element: 'N', x: -1.2, y: 0.3, z: 0.5 },
      { id: 12, element: 'H', x: -1.8, y: -0.1, z: 1.2 },
      { id: 13, element: 'H', x: -1.5, y: 0.9, z: -0.1 },
      { id: 14, element: 'C', x: -0.5, y: 1.5, z: 0.8 },
      { id: 15, element: 'O', x: -1.1, y: 2.4, z: 1.3 },
      { id: 16, element: 'H', x: 0.5, y: 1.6, z: 0.6 },
      { id: 17, element: 'C', x: 0.5, y: -1.2, z: 0.8 },
      { id: 18, element: 'O', x: 0.2, y: -2.3, z: 0.4 },
      { id: 19, element: 'H', x: 0.9, y: -1.2, z: 1.8 },
      { id: 20, element: 'H', x: 1.4, y: -0.9, z: 0.3 }
    ]

    this.bonds = [
      { atom1: 1, atom2: 2 },
      { atom1: 1, atom2: 3 },
      { atom1: 1, atom2: 4 },
      { atom1: 1, atom2: 5 },
      { atom1: 5, atom2: 6 },
      { atom1: 5, atom2: 7 },
      { atom1: 7, atom2: 8 },
      { atom1: 7, atom2: 9 },
      { atom1: 7, atom2: 10 },
      { atom1: 1, atom2: 11 },
      { atom1: 11, atom2: 12 },
      { atom1: 11, atom2: 13 },
      { atom1: 11, atom2: 14 },
      { atom1: 14, atom2: 15 },
      { atom1: 14, atom2: 16 },
      { atom1: 1, atom2: 17 },
      { atom1: 17, atom2: 18 },
      { atom1: 17, atom2: 19 },
      { atom1: 17, atom2: 20 }
    ]

    this.buildMeshes()
  }

  private buildMeshes(): void {
    this.clearMeshes()

    for (const atom of this.atoms) {
      const mesh = this.createAtomMesh(atom)
      this.atomMeshes.set(atom.id, mesh)
      this.atomsGroup.add(mesh)
    }

    for (const bond of this.bonds) {
      const mesh = this.createBondMesh(bond)
      if (mesh) {
        const key = `${bond.atom1}-${bond.atom2}`
        this.bondMeshes.set(key, mesh)
        this.bondsGroup.add(mesh)
      }
    }

    this.centerCamera()
  }

  private clearMeshes(): void {
    for (const mesh of this.atomMeshes.values()) {
      this.atomsGroup.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose())
      } else {
        mesh.material.dispose()
      }
    }
    this.atomMeshes.clear()

    for (const mesh of this.bondMeshes.values()) {
      this.bondsGroup.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose())
      } else {
        mesh.material.dispose()
      }
    }
    this.bondMeshes.clear()

    this.clearHighlights()
  }

  private createAtomMesh(atom: Atom): AtomMesh {
    const baseRadius = (ELEMENT_RADII[atom.element] ?? 0.5) * BALL_STICK_ATOM_SCALE
    const geometry = new THREE.SphereGeometry(baseRadius, 32, 32)

    const color = ELEMENT_COLORS[atom.element] ?? 0xcccccc
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.35,
      emissive: new THREE.Color(color).multiplyScalar(0.08)
    })

    const mesh = new THREE.Mesh(geometry, material) as unknown as AtomMesh
    mesh.position.set(atom.x, atom.y, atom.z)
    mesh.castShadow = true
    mesh.receiveShadow = true

    mesh.userData = {
      type: 'atom',
      atom,
      baseRadius,
      targetRadius: baseRadius,
      currentRadius: baseRadius
    }

    return mesh
  }

  private createBondMesh(bond: Bond): BondMesh | null {
    const atom1 = this.atoms.find((a) => a.id === bond.atom1)
    const atom2 = this.atoms.find((a) => a.id === bond.atom2)
    if (!atom1 || !atom2) return null

    const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z)
    const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z)
    const direction = new THREE.Vector3().subVectors(end, start)
    const length = direction.length()

    if (length < 0.001) return null

    const geometry = new THREE.CylinderGeometry(BALL_STICK_BOND_RADIUS, BALL_STICK_BOND_RADIUS, length, 12, 1)
    geometry.translate(0, length / 2, 0)
    geometry.rotateX(Math.PI / 2)

    const material = new THREE.MeshStandardMaterial({
      color: 0x555566,
      metalness: 0.4,
      roughness: 0.5
    })

    const mesh = new THREE.Mesh(geometry, material) as unknown as BondMesh
    mesh.position.copy(start)
    mesh.lookAt(end)
    mesh.receiveShadow = true
    mesh.castShadow = true

    mesh.userData = {
      type: 'bond',
      bond,
      baseRadius: BALL_STICK_BOND_RADIUS,
      targetRadius: BALL_STICK_BOND_RADIUS,
      currentRadius: BALL_STICK_BOND_RADIUS,
      baseColor: new THREE.Color(0x555566),
      highlighted: false
    }

    return mesh
  }

  private centerCamera(): void {
    const box = new THREE.Box3().setFromObject(this.atomsGroup)
    const center = new THREE.Vector3()
    box.getCenter(center)

    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = this.camera.fov * (Math.PI / 180)
    const distance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.8

    this.camera.position.set(center.x, center.y + distance * 0.5, center.z + distance)
    this.controls.target.copy(center)
    this.controls.update()
  }

  setModelType(type: ModelType): void {
    if (this.modelType === type) return
    this.modelType = type

    for (const atom of this.atoms) {
      const mesh = this.atomMeshes.get(atom.id)
      if (!mesh) continue
      const baseElementRadius = ELEMENT_RADII[atom.element] ?? 0.5
      mesh.userData.targetRadius =
        type === 'ball-stick'
          ? baseElementRadius * BALL_STICK_ATOM_SCALE
          : baseElementRadius * SPACE_FILL_ATOM_SCALE
    }

    for (const bond of this.bonds) {
      const key = `${bond.atom1}-${bond.atom2}`
      const mesh = this.bondMeshes.get(key)
      if (!mesh) continue
      mesh.userData.targetRadius =
        type === 'ball-stick' ? BALL_STICK_BOND_RADIUS : SPACE_FILL_BOND_RADIUS
    }
  }

  setAutoRotate(enabled: boolean): void {
    this.controls.autoRotate = enabled
    this.controls.autoRotateSpeed = AUTO_ROTATE_SPEED
  }

  selectAtom(atomId: number | null): void {
    if (this.selectedAtomId === atomId) {
      this.selectedAtomId = null
      this.updateBondHighlights(null)
      if (this.onAtomClick) this.onAtomClick(null)
      return
    }

    this.selectedAtomId = atomId
    this.updateBondHighlights(atomId)

    if (atomId !== null) {
      const atom = this.atoms.find((a) => a.id === atomId)
      if (this.onAtomClick && atom) this.onAtomClick(atom)
    } else {
      if (this.onAtomClick) this.onAtomClick(null)
    }
  }

  private updateBondHighlights(selectedAtomId: number | null): void {
    for (const bond of this.bonds) {
      const key = `${bond.atom1}-${bond.atom2}`
      const mesh = this.bondMeshes.get(key)
      if (!mesh) continue

      const shouldHighlight =
        selectedAtomId !== null &&
        (bond.atom1 === selectedAtomId || bond.atom2 === selectedAtomId)

      mesh.userData.highlighted = shouldHighlight
      const material = mesh.material as THREE.MeshStandardMaterial

      if (shouldHighlight) {
        material.color.setHex(HIGHLIGHT_BRIGHT_COLOR)
        material.emissive.setHex(HIGHLIGHT_BRIGHT_COLOR)
        material.emissiveIntensity = 0.6
        mesh.userData.targetRadius =
          this.modelType === 'ball-stick' ? BALL_STICK_BOND_RADIUS * 2.2 : BALL_STICK_BOND_RADIUS * 2.2
      } else {
        material.color.copy(mesh.userData.baseColor)
        material.emissive.setHex(0x000000)
        material.emissiveIntensity = 0
        mesh.userData.targetRadius =
          this.modelType === 'ball-stick' ? BALL_STICK_BOND_RADIUS : SPACE_FILL_BOND_RADIUS
      }
    }
  }

  searchAtom(query: string): Atom | null {
    query = query.trim()
    if (!query) return null

    const byId = parseInt(query, 10)
    if (!isNaN(byId)) {
      const atom = this.atoms.find((a) => a.id === byId)
      if (atom) {
        this.focusAndHighlight(atom.id)
        return atom
      }
    }

    const upper = query.toUpperCase()
    const atom = this.atoms.find((a) => a.element.toUpperCase() === upper)
    if (atom) {
      this.focusAndHighlight(atom.id)
      return atom
    }

    return null
  }

  private focusAndHighlight(atomId: number): void {
    const atom = this.atoms.find((a) => a.id === atomId)
    if (!atom) return

    this.selectAtom(atomId)
    this.addHighlight(atomId)

    const atomPos = new THREE.Vector3(atom.x, atom.y, atom.z)
    const direction = new THREE.Vector3()
      .subVectors(this.camera.position, this.controls.target)
      .normalize()
    const distance = 6

    this.targetCameraPos = new THREE.Vector3().copy(atomPos).add(direction.multiplyScalar(distance))
    this.targetLookAt = atomPos.clone()
  }

  private addHighlight(atomId: number): void {
    this.removeHighlight(atomId)

    const atom = this.atoms.find((a) => a.id === atomId)
    if (!atom) return

    const baseRadius = ELEMENT_RADII[atom.element] ?? 0.5
    const highlightRadius = baseRadius * BALL_STICK_ATOM_SCALE * 2.5

    const geometry = new THREE.SphereGeometry(highlightRadius, 24, 24)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false
    })

    const mesh = new THREE.Mesh(geometry, material) as unknown as HighlightMesh
    mesh.position.set(atom.x, atom.y, atom.z)
    mesh.userData = {
      type: 'highlight',
      atomId,
      phase: 0
    }

    this.highlightMeshes.set(atomId, mesh)
    this.highlightsGroup.add(mesh)

    setTimeout(() => {
      this.removeHighlight(atomId)
    }, 3000)
  }

  private removeHighlight(atomId: number): void {
    const mesh = this.highlightMeshes.get(atomId)
    if (mesh) {
      this.highlightsGroup.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose())
      } else {
        mesh.material.dispose()
      }
      this.highlightMeshes.delete(atomId)
    }
  }

  private clearHighlights(): void {
    for (const atomId of Array.from(this.highlightMeshes.keys())) {
      this.removeHighlight(atomId)
    }
  }

  update(): void {
    const delta = Math.min(this.clock.getDelta(), 0.05)

    for (const mesh of this.atomMeshes.values()) {
      if (Math.abs(mesh.userData.currentRadius - mesh.userData.targetRadius) > 0.001) {
        mesh.userData.currentRadius +=
          (mesh.userData.targetRadius - mesh.userData.currentRadius) *
          Math.min(TRANSITION_SPEED * delta, 1.0)
        const baseRadius = mesh.userData.baseRadius
        const scale = mesh.userData.currentRadius / baseRadius
        mesh.scale.setScalar(scale)
      }
    }

    for (const mesh of this.bondMeshes.values()) {
      if (Math.abs(mesh.userData.currentRadius - mesh.userData.targetRadius) > 0.001) {
        mesh.userData.currentRadius +=
          (mesh.userData.targetRadius - mesh.userData.currentRadius) *
          Math.min(TRANSITION_SPEED * delta, 1.0)
        const baseRadius = mesh.userData.baseRadius
        const scaleXZ = mesh.userData.currentRadius / baseRadius
        mesh.scale.set(scaleXZ, 1, scaleXZ)
      }
    }

    for (const mesh of this.highlightMeshes.values()) {
      mesh.userData.phase += delta * 2.5
      const pulse = (Math.sin(mesh.userData.phase) + 1) / 2
      const material = mesh.material as THREE.MeshBasicMaterial
      material.opacity = 0.15 + pulse * 0.35
      const baseScale = 1.0
      const pulseScale = baseScale + pulse * 0.3
      mesh.scale.setScalar(pulseScale)
    }

    if (this.targetCameraPos && this.targetLookAt) {
      this.camera.position.lerp(this.targetCameraPos, Math.min(CAMERA_FOCUS_SPEED * delta, 1.0))
      this.controls.target.lerp(this.targetLookAt, Math.min(CAMERA_FOCUS_SPEED * delta, 1.0))

      const posDiff = this.camera.position.distanceTo(this.targetCameraPos)
      const targetDiff = this.controls.target.distanceTo(this.targetLookAt)
      if (posDiff < 0.05 && targetDiff < 0.05) {
        this.camera.position.copy(this.targetCameraPos)
        this.controls.target.copy(this.targetLookAt)
        this.targetCameraPos = null
        this.targetLookAt = null
      }
    }

    this.controls.update()
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    this.clearMeshes()
    this.renderer.dispose()
    this.controls.dispose()
    window.removeEventListener('resize', this.onResize.bind(this))
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
