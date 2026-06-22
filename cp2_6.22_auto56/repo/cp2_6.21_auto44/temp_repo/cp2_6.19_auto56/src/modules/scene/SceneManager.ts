import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Atom, Residue, StructureData, Measurement, ModelMode, ResidueLabel } from '../../types'
import { picker } from '../interaction/Picker'

const ELEMENT_COLORS: Record<string, number> = {
  C: 0x909090,
  N: 0x3050f8,
  O: 0xff0d0d,
  S: 0xffff30,
  P: 0xff8000,
  H: 0xffffff,
  FE: 0xe06633,
  ZN: 0x7d80b0,
  CA: 0x3dff00,
  MG: 0x8aff00
}

const ELEMENT_RADIUS: Record<string, number> = {
  C: 0.4,
  N: 0.35,
  O: 0.35,
  S: 0.45,
  P: 0.5,
  H: 0.25,
  FE: 0.5,
  ZN: 0.5,
  CA: 0.5,
  MG: 0.45
}

export interface SceneManagerCallbacks {
  onResidueSelect?: (residue: Residue | null) => void
  onAtomClick?: (atom: Atom | null) => void
  onHover?: (atom: Atom | null, screenPos: { x: number; y: number } | null) => void
  onLabelPositionUpdate?: (labels: { id: number; x: number; y: number; text: string }[]) => void
  onMeasurementLabelUpdate?: (measurements: { id: string; x: number; y: number; distance: number }[]) => void
  onMeasurementAdded?: (measurement: Measurement) => void
  onMeasuringAtomChange?: (atom: Atom | null) => void
}

export class SceneManager {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private container: HTMLElement | null = null
  private animationId: number | null = null
  private callbacks: SceneManagerCallbacks = {}

  private structureData: StructureData | null = null
  private modelMode: ModelMode = 'ballstick'

  private ballStickGroup: THREE.Group = new THREE.Group()
  private cartoonGroup: THREE.Group = new THREE.Group()
  private highlightGroup: THREE.Group = new THREE.Group()
  private measurementGroup: THREE.Group = new THREE.Group()
  private labelGroup: THREE.Group = new THREE.Group()

  private atomMeshMap: Map<THREE.Object3D, Atom> = new Map()
  private cartoonMeshMap: Map<THREE.Object3D, Residue> = new Map()

  private selectedResidue: Residue | null = null
  private measurements: Measurement[] = []
  private labels: ResidueLabel[] = []

  private measuringAtom: Atom | null = null
  private isMeasuringMode: boolean = false

  private isTransitioning: boolean = false

  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      60,
      1,
      0.1,
      1000
    )
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    
    this.setupScene()
    this.setupControls()
  }

  private setupScene(): void {
    this.scene.background = new THREE.Color(0x0f0c29)
    this.scene.fog = new THREE.Fog(0x0f0c29, 50, 200)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 15)
    this.scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0x4facfe, 0.5)
    pointLight.position.set(-10, 10, -10)
    this.scene.add(pointLight)

    this.ballStickGroup.name = 'ballStickGroup'
    this.cartoonGroup.name = 'cartoonGroup'
    this.highlightGroup.name = 'highlightGroup'
    this.measurementGroup.name = 'measurementGroup'
    this.labelGroup.name = 'labelGroup'

    this.scene.add(this.ballStickGroup)
    this.scene.add(this.cartoonGroup)
    this.scene.add(this.highlightGroup)
    this.scene.add(this.measurementGroup)
    this.scene.add(this.labelGroup)

    this.cartoonGroup.visible = false
  }

  private setupControls(): void {
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.screenSpacePanning = false
    this.controls.minDistance = 2
    this.controls.maxDistance = 50
    this.controls.maxPolarAngle = Math.PI
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    }
  }

  init(container: HTMLElement, callbacks: SceneManagerCallbacks = {}): void {
    this.container = container
    this.callbacks = callbacks

    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.camera.aspect = container.clientWidth / container.clientHeight
    this.camera.updateProjectionMatrix()

    container.appendChild(this.renderer.domElement)

    this.setupEventListeners()
    this.animate()
  }

  private setupEventListeners(): void {
    if (!this.container) return

    this.container.addEventListener('click', this.handleClick)
    this.container.addEventListener('mousemove', this.handleMouseMove)
    window.addEventListener('resize', this.handleResize)
  }

  private handleClick = (event: MouseEvent): void => {
    if (!this.container || this.isTransitioning) return

    const result = picker.pick(
      event.clientX,
      event.clientY,
      this.container,
      this.camera
    )

    if (result.atom) {
      this.handleAtomClick(result.atom)
    } else if (result.residue) {
      this.selectResidue(result.residue)
    } else {
      this.selectResidue(null)
    }
  }

  private atomsEqual(atom1: Atom, atom2: Atom): boolean {
    if (atom1.uid && atom2.uid) {
      return atom1.uid === atom2.uid
    }
    if (atom1.serial !== undefined && atom2.serial !== undefined &&
        atom1.serial !== 0 && atom2.serial !== 0) {
      return atom1.serial === atom2.serial &&
             atom1.chainId === atom2.chainId
    }
    if (atom1.id === atom2.id && atom1.id !== 0 && atom2.id !== 0) {
      return true
    }
    return (
      atom1.name === atom2.name &&
      atom1.chainId === atom2.chainId &&
      atom1.residueId === atom2.residueId &&
      atom1.x === atom2.x &&
      atom1.y === atom2.y &&
      atom1.z === atom2.z
    )
  }

  private handleAtomClick(atom: Atom): void {
    if (this.isMeasuringMode) {
      if (!this.measuringAtom) {
        this.measuringAtom = atom
        if (this.callbacks.onMeasuringAtomChange) {
          this.callbacks.onMeasuringAtomChange(atom)
        }
      } else {
        const isSameAtom = this.atomsEqual(this.measuringAtom, atom)
        if (!isSameAtom) {
          this.addMeasurement(this.measuringAtom, atom)
        }
        this.measuringAtom = null
        if (this.callbacks.onMeasuringAtomChange) {
          this.callbacks.onMeasuringAtomChange(null)
        }
      }
    } else {
      const residue = this.findResidueByAtom(atom)
      if (residue) {
        this.selectResidue(residue)
      }
    }

    if (this.callbacks.onAtomClick) {
      this.callbacks.onAtomClick(atom)
    }
  }

  private findResidueByAtom(atom: Atom): Residue | null {
    if (!this.structureData) return null
    return this.structureData.residues.find(
      r => r.chainId === atom.chainId && r.seqNum === atom.residueId
    ) || null
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.container) return

    const result = picker.hoverPick(
      event.clientX,
      event.clientY,
      this.container,
      this.camera
    )

    if (result.atom && result.point) {
      const screenPos = this.worldToScreen(result.point)
      if (this.callbacks.onHover) {
        this.callbacks.onHover(result.atom, screenPos)
      }
    } else {
      if (this.callbacks.onHover) {
        this.callbacks.onHover(null, null)
      }
    }
  }

  private worldToScreen(point: { x: number; y: number; z: number }): { x: number; y: number } | null {
    if (!this.container) return null

    const vector = new THREE.Vector3(point.x, point.y, point.z)
    vector.project(this.camera)

    const rect = this.container.getBoundingClientRect()
    return {
      x: (vector.x + 1) / 2 * rect.width + rect.left,
      y: (-vector.y + 1) / 2 * rect.height + rect.top
    }
  }

  private handleResize = (): void => {
    if (!this.container) return

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)
    this.controls.update()
    this.updateLabelPositions()
    this.updateMeasurementLabelPositions()
    this.renderer.render(this.scene, this.camera)
  }

  private updateLabelPositions(): void {
    if (!this.container || !this.callbacks.onLabelPositionUpdate) return

    const labelPositions: { id: number; x: number; y: number; text: string }[] = []
    const rect = this.container.getBoundingClientRect()

    for (const label of this.labels) {
      const residue = this.structureData?.residues.find(r => r.id === label.residueId)
      if (!residue) continue

      const vector = new THREE.Vector3(
        residue.center.x,
        residue.center.y + 2,
        residue.center.z
      )
      vector.project(this.camera)

      if (vector.z < 1) {
        labelPositions.push({
          id: label.residueId,
          x: (vector.x + 1) / 2 * rect.width,
          y: (-vector.y + 1) / 2 * rect.height,
          text: label.text
        })
      }
    }

    this.callbacks.onLabelPositionUpdate(labelPositions)
  }

  private updateMeasurementLabelPositions(): void {
    if (!this.container || !this.callbacks.onMeasurementLabelUpdate) return

    const measurementPositions: { id: string; x: number; y: number; distance: number }[] = []
    const rect = this.container.getBoundingClientRect()

    for (const measurement of this.measurements) {
      const midPoint = {
        x: (measurement.atom1.x + measurement.atom2.x) / 2,
        y: (measurement.atom1.y + measurement.atom2.y) / 2,
        z: (measurement.atom1.z + measurement.atom2.z) / 2
      }

      const vector = new THREE.Vector3(midPoint.x, midPoint.y, midPoint.z)
      vector.project(this.camera)

      if (vector.z < 1) {
        measurementPositions.push({
          id: measurement.id,
          x: (vector.x + 1) / 2 * rect.width,
          y: (-vector.y + 1) / 2 * rect.height,
          distance: measurement.distance
        })
      }
    }

    this.callbacks.onMeasurementLabelUpdate(measurementPositions)
  }

  loadStructure(data: StructureData): void {
    this.structureData = data
    this.clearModel()
    this.buildBallStickModel(data)
    this.buildCartoonModel(data)
    this.centerCamera()
    
    picker.setAtomMeshes(this.atomMeshMap)
    picker.setCartoonMeshes(this.cartoonMeshMap)
  }

  private clearModel(): void {
    this.ballStickGroup.clear()
    this.cartoonGroup.clear()
    this.highlightGroup.clear()
    this.atomMeshMap.clear()
    this.cartoonMeshMap.clear()
    this.selectedResidue = null
  }

  private buildBallStickModel(data: StructureData): void {
    const sphereGeometry = new THREE.SphereGeometry(1, 16, 16)

    for (const atom of data.atoms) {
      const radius = ELEMENT_RADIUS[atom.element] || 0.4
      const color = ELEMENT_COLORS[atom.element] || 0x909090

      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 50,
        specular: 0x333333
      })

      const mesh = new THREE.Mesh(sphereGeometry, material)
      mesh.scale.set(radius, radius, radius)
      mesh.position.set(atom.x, atom.y, atom.z)
      mesh.userData = { atom }

      this.ballStickGroup.add(mesh)
      this.atomMeshMap.set(mesh, atom)
    }

    this.buildBonds(data)
  }

  private buildBonds(data: StructureData): void {
    const bondRadius = 0.1
    const bondMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 })
    const cylinderGeometry = new THREE.CylinderGeometry(bondRadius, bondRadius, 1, 8)

    const bonded = new Set<string>()

    for (let i = 0; i < data.atoms.length; i++) {
      for (let j = i + 1; j < data.atoms.length; j++) {
        const atom1 = data.atoms[i]
        const atom2 = data.atoms[j]

        if (atom1.chainId !== atom2.chainId) continue
        if (Math.abs(atom1.residueId - atom2.residueId) > 1) continue

        const dx = atom2.x - atom1.x
        const dy = atom2.y - atom1.y
        const dz = atom2.z - atom1.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (distance < 1.8 && distance > 0.5) {
          const bondKey = `${atom1.id}_${atom2.id}`
          if (bonded.has(bondKey)) continue
          bonded.add(bondKey)

          const cylinder = new THREE.Mesh(cylinderGeometry, bondMaterial)
          
          const midPoint = new THREE.Vector3(
            (atom1.x + atom2.x) / 2,
            (atom1.y + atom2.y) / 2,
            (atom1.z + atom2.z) / 2
          )
          
          cylinder.position.copy(midPoint)
          cylinder.scale.y = distance
          cylinder.lookAt(new THREE.Vector3(atom1.x, atom1.y, atom1.z))
          cylinder.rotateX(Math.PI / 2)
          
          this.ballStickGroup.add(cylinder)
        }
      }
    }
  }

  private buildCartoonModel(data: StructureData): void {
    const cylinderRadius = 0.3

    for (const chainId of data.chains) {
      const chainResidues = data.residues
        .filter(r => r.chainId === chainId)
        .sort((a, b) => a.seqNum - b.seqNum)

      for (let i = 0; i < chainResidues.length - 1; i++) {
        const residue1 = chainResidues[i]
        const residue2 = chainResidues[i + 1]

        const ca1 = residue1.atoms.find(a => a.name === 'CA') || residue1.atoms[0]
        const ca2 = residue2.atoms.find(a => a.name === 'CA') || residue2.atoms[0]

        if (!ca1 || !ca2) continue

        const color = this.getChainColor(chainId)
        const material = new THREE.MeshPhongMaterial({
          color,
          shininess: 30,
          specular: 0x222222
        })

        const geometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, 1, 12)
        const cylinder = new THREE.Mesh(geometry, material)

        const dx = ca2.x - ca1.x
        const dy = ca2.y - ca1.y
        const dz = ca2.z - ca1.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        cylinder.position.set(
          (ca1.x + ca2.x) / 2,
          (ca1.y + ca2.y) / 2,
          (ca1.z + ca2.z) / 2
        )
        cylinder.scale.y = distance
        cylinder.lookAt(new THREE.Vector3(ca1.x, ca1.y, ca1.z))
        cylinder.rotateX(Math.PI / 2)

        cylinder.userData = { residue: residue1 }

        this.cartoonGroup.add(cylinder)
        this.cartoonMeshMap.set(cylinder, residue1)
      }
    }
  }

  private getChainColor(chainId: string): number {
    const colors = [0x4facfe, 0x43e97b, 0xfa709a, 0xf9d423, 0x667eea]
    const index = chainId.charCodeAt(0) % colors.length
    return colors[index]
  }

  private centerCamera(): void {
    if (!this.structureData || this.structureData.atoms.length === 0) return

    const box = new THREE.Box3()
    
    for (const atom of this.structureData.atoms) {
      box.expandByPoint(new THREE.Vector3(atom.x, atom.y, atom.z))
    }

    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    this.camera.position.set(center.x + maxDim * 1.5, center.y + maxDim * 0.5, center.z + maxDim * 1.5)
    this.controls.target.copy(center)
    this.controls.update()
  }

  toggleModelMode(mode: ModelMode): void {
    if (this.modelMode === mode || this.isTransitioning) return

    this.isTransitioning = true
    this.modelMode = mode

    const fadeOutGroup = mode === 'ballstick' ? this.cartoonGroup : this.ballStickGroup
    const fadeInGroup = mode === 'ballstick' ? this.ballStickGroup : this.cartoonGroup

    this.fadeTransition(fadeOutGroup, fadeInGroup, 500, () => {
      this.isTransitioning = false
    })
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  private fadeTransition(
    fadeOut: THREE.Group,
    fadeIn: THREE.Group,
    duration: number,
    callback?: () => void
  ): void {
    const startTime = performance.now()

    const fadeOutClonedMaterials = this.cloneGroupMaterials(fadeOut)
    const fadeInClonedMaterials = this.cloneGroupMaterials(fadeIn)

    fadeIn.visible = true
    this.setClonedGroupOpacity(fadeInClonedMaterials, 0, true)

    const animate = () => {
      const elapsed = performance.now() - startTime
      const linearProgress = Math.min(elapsed / duration, 1)
      const easedProgress = this.easeInOutCubic(linearProgress)

      const fadeOutOpacity = 1 - easedProgress
      const fadeInOpacity = easedProgress

      this.setClonedGroupOpacity(fadeOutClonedMaterials, fadeOutOpacity, true)
      this.setClonedGroupOpacity(fadeInClonedMaterials, fadeInOpacity, true)

      if (linearProgress < 1) {
        requestAnimationFrame(animate)
      } else {
        fadeOut.visible = false
        this.restoreOriginalMaterials(fadeOut, fadeOutClonedMaterials)
        this.restoreOriginalMaterials(fadeIn, fadeInClonedMaterials)
        this.setGroupOpacity(fadeIn, 1, false)
        if (callback) callback()
      }
    }

    animate()
  }

  private cloneGroupMaterials(group: THREE.Group): Map<THREE.Mesh, THREE.Material[]> {
    const meshMaterials = new Map<THREE.Mesh, THREE.Material[]>()
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          const clones = child.material.map(mat => mat.clone())
          meshMaterials.set(child, clones)
          child.material = clones
        } else {
          const clone = child.material.clone()
          meshMaterials.set(child, [clone])
          child.material = clone
        }
      }
    })
    return meshMaterials
  }

  private setClonedGroupOpacity(
    meshMaterials: Map<THREE.Mesh, THREE.Material[]>,
    opacity: number,
    transparent: boolean
  ): void {
    meshMaterials.forEach((materials) => {
      for (const mat of materials) {
        mat.opacity = opacity
        mat.transparent = transparent
        mat.needsUpdate = true
      }
    })
  }

  private restoreOriginalMaterials(
    group: THREE.Group,
    clonedMaterials: Map<THREE.Mesh, THREE.Material[]>
  ): void {
    clonedMaterials.forEach((_, mesh) => {
      if (mesh.parent === null || !group.children.includes(mesh)) return
      const mats = mesh.material
      if (Array.isArray(mats)) {
        for (const mat of mats) {
          mat.dispose()
        }
      } else {
        ;(mats as THREE.Material).dispose()
      }
    })
  }

  private setGroupOpacity(group: THREE.Group, opacity: number, transparent: boolean): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.opacity = opacity
            mat.transparent = transparent
            mat.needsUpdate = true
          })
        } else {
          child.material.opacity = opacity
          child.material.transparent = transparent
          child.material.needsUpdate = true
        }
      }
    })
  }

  selectResidue(residue: Residue | null): void {
    this.selectedResidue = residue
    this.highlightResidue(residue)

    if (this.callbacks.onResidueSelect) {
      this.callbacks.onResidueSelect(residue)
    }
  }

  private highlightResidue(residue: Residue | null): void {
    this.highlightGroup.clear()

    if (!residue || !this.structureData) return

    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffff00,
      linewidth: 2
    })

    for (const atom of residue.atoms) {
      const radius = (ELEMENT_RADIUS[atom.element] || 0.4) * 1.3
      
      const geometry = new THREE.SphereGeometry(radius, 16, 16)
      const mesh = new THREE.Mesh(geometry, highlightMaterial)
      mesh.position.set(atom.x, atom.y, atom.z)
      
      const edges = new THREE.EdgesGeometry(geometry)
      const line = new THREE.LineSegments(edges, edgeMaterial)
      line.position.set(atom.x, atom.y, atom.z)
      
      this.highlightGroup.add(mesh)
      this.highlightGroup.add(line)
    }
  }

  toggleMeasurementMode(enable?: boolean): void {
    if (enable !== undefined) {
      this.isMeasuringMode = enable
    } else {
      this.isMeasuringMode = !this.isMeasuringMode
    }
    this.measuringAtom = null
    if (this.callbacks.onMeasuringAtomChange) {
      this.callbacks.onMeasuringAtomChange(null)
    }
  }

  getMeasuringMode(): boolean {
    return this.isMeasuringMode
  }

  private addMeasurement(atom1: Atom, atom2: Atom): void {
    const distance = this.calculateDistance(atom1, atom2)
    const measurement: Measurement = {
      id: `${atom1.id}_${atom2.id}_${Date.now()}`,
      atom1,
      atom2,
      distance
    }

    this.measurements.push(measurement)
    this.drawMeasurementLine(measurement)

    if (this.callbacks.onMeasurementAdded) {
      this.callbacks.onMeasurementAdded(measurement)
    }
  }

  private calculateDistance(atom1: Atom, atom2: Atom): number {
    const dx = atom2.x - atom1.x
    const dy = atom2.y - atom1.y
    const dz = atom2.z - atom1.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  private drawMeasurementLine(measurement: Measurement): void {
    const points = [
      new THREE.Vector3(measurement.atom1.x, measurement.atom1.y, measurement.atom1.z),
      new THREE.Vector3(measurement.atom2.x, measurement.atom2.y, measurement.atom2.z)
    ]

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineDashedMaterial({
      color: 0xffffff,
      linewidth: 2,
      dashSize: 0.3,
      gapSize: 0.2
    })

    const line = new THREE.Line(geometry, material)
    line.computeLineDistances()
    line.userData = { measurementId: measurement.id }

    this.measurementGroup.add(line)
  }

  removeMeasurement(id: string): void {
    this.measurements = this.measurements.filter(m => m.id !== id)

    const toRemove: THREE.Object3D[] = []
    this.measurementGroup.traverse((child) => {
      if (child.userData.measurementId === id) {
        toRemove.push(child)
      }
    })

    toRemove.forEach(obj => {
      this.measurementGroup.remove(obj)
    })
  }

  getMeasurements(): Measurement[] {
    return [...this.measurements]
  }

  addLabel(residueId: number, text: string): void {
    const existingIndex = this.labels.findIndex(l => l.residueId === residueId)
    if (existingIndex >= 0) {
      this.labels[existingIndex].text = text
    } else {
      this.labels.push({ residueId, text })
    }
  }

  removeLabel(residueId: number): void {
    this.labels = this.labels.filter(l => l.residueId !== residueId)
  }

  getLabels(): ResidueLabel[] {
    return [...this.labels]
  }

  getSelectedResidue(): Residue | null {
    return this.selectedResidue
  }

  getModelMode(): ModelMode {
    return this.modelMode
  }

  dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }

    if (this.container) {
      this.container.removeEventListener('click', this.handleClick)
      this.container.removeEventListener('mousemove', this.handleMouseMove)
      if (this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement)
      }
    }

    window.removeEventListener('resize', this.handleResize)

    this.controls.dispose()
    this.renderer.dispose()
  }
}

export const sceneManager = new SceneManager()
