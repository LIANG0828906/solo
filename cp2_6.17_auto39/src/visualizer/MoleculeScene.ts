import * as THREE from 'three'
import type { MoleculeData, AtomData, BondData } from '../types'
import { ELEMENT_COLORS, ELEMENT_RADII } from '../types'
import { createBondMesh } from './BondGeometry'

interface HighlightRing {
  mesh: THREE.Mesh
  startTime: number
}

export class MoleculeScene {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private atomGroup: THREE.Group
  private bondGroup: THREE.Group
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private atomMeshes: Map<number, THREE.Mesh> = new Map()
  private highlightRings: Map<number, HighlightRing> = new Map()
  private tooltip: HTMLDivElement
  private isDragging: boolean = false
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 }
  private targetRotationY: number = 0
  private targetRotationX: number = 0
  private autoRotationSpeed: number = 2
  private isAutoRotating: boolean = true
  private autoRotateResumeTimer: number | null = null
  private zoom: number = 1
  private animationId: number = 0

  private onAtomClick: ((atomId: number) => void) | null = null
  private onRotationChange: ((rotationY: number) => void) | null = null
  private onDraggingChange: ((dragging: boolean) => void) | null = null
  private onAutoRotatingChange: ((auto: boolean) => void) | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.atomGroup = new THREE.Group()
    this.bondGroup = new THREE.Group()
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    this.camera.position.set(0, 3, 15)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 0)
    container.appendChild(this.renderer.domElement)

    this.tooltip = document.createElement('div')
    this.tooltip.style.position = 'absolute'
    this.tooltip.style.pointerEvents = 'none'
    this.tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
    this.tooltip.style.color = 'white'
    this.tooltip.style.fontSize = '12px'
    this.tooltip.style.padding = '4px 8px'
    this.tooltip.style.borderRadius = '4px'
    this.tooltip.style.zIndex = '1000'
    this.tooltip.style.display = 'none'
    this.tooltip.style.transition = 'opacity 0.2s ease'
    this.tooltip.style.whiteSpace = 'nowrap'
    container.appendChild(this.tooltip)

    this.setupLights()
    this.setupEventListeners()

    this.scene.add(this.atomGroup)
    this.scene.add(this.bondGroup)

    console.log('[MoleculeScene] Initialized with', {
      width,
      height,
      atomGroupChildren: this.atomGroup.children.length,
      bondGroupChildren: this.bondGroup.children.length,
    })
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight1.position.set(10, 10, 10)
    this.scene.add(dirLight1)

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
    dirLight2.position.set(-10, -10, 10)
    this.scene.add(dirLight2)

    console.log('[MoleculeScene] Lights added:', this.scene.children.length, 'objects in scene')
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement

    canvas.addEventListener('mousedown', this.onMouseDown)
    canvas.addEventListener('mousemove', this.onMouseMove)
    canvas.addEventListener('mouseup', this.onMouseUp)
    canvas.addEventListener('mouseleave', this.onMouseLeave)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    canvas.addEventListener('click', this.onClick)

    window.addEventListener('resize', this.onResize)
  }

  private onMouseDown = (e: MouseEvent): void => {
    this.isDragging = true
    this.previousMousePosition = { x: e.clientX, y: e.clientY }
    this.onDraggingChange?.(true)

    if (this.autoRotateResumeTimer) {
      clearTimeout(this.autoRotateResumeTimer)
      this.autoRotateResumeTimer = null
    }

    if (this.isAutoRotating) {
      this.isAutoRotating = false
      this.onAutoRotatingChange?.(false)
    }
  }

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect()

    if (this.isDragging) {
      const deltaX = e.clientX - this.previousMousePosition.x
      const deltaY = e.clientY - this.previousMousePosition.y

      this.targetRotationY += deltaX * 0.01
      this.targetRotationX += deltaY * 0.01
      this.targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.targetRotationX))

      this.previousMousePosition = { x: e.clientX, y: e.clientY }
      this.onRotationChange?.(this.targetRotationY)
    }

    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.updateHover(e.clientX, e.clientY)
  }

  private onMouseUp = (): void => {
    if (this.isDragging) {
      this.isDragging = false
      this.onDraggingChange?.(false)

      this.autoRotateResumeTimer = window.setTimeout(() => {
        this.isAutoRotating = true
        this.onAutoRotatingChange?.(true)
      }, 2000)
    }
  }

  private onMouseLeave = (): void => {
    this.tooltip.style.display = 'none'
    if (this.isDragging) {
      this.isDragging = false
      this.onDraggingChange?.(false)
    }
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    this.zoom = Math.max(0.5, Math.min(5, this.zoom * delta))
    this.camera.position.setLength(15 / this.zoom)
    this.camera.lookAt(0, 0, 0)
  }

  private onClick = (e: MouseEvent): void => {
    if (this.isDragging) return

    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const meshes = Array.from(this.atomMeshes.values())
    const intersects = this.raycaster.intersectObjects(meshes)

    console.log('[MoleculeScene] Click detected, atom meshes available:', meshes.length, 'intersections:', intersects.length)

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh
      const atomId = Number(clickedMesh.userData.atomId)
      console.log('[MoleculeScene] Atom clicked:', atomId, 'element:', clickedMesh.userData.element)
      this.highlightAtom(atomId)
      this.onAtomClick?.(atomId)
    }
  }

  private onResize = (): void => {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  private updateHover(clientX: number, clientY: number): void {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const meshes = Array.from(this.atomMeshes.values())
    const intersects = this.raycaster.intersectObjects(meshes)

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh
      const element = mesh.userData.element as string
      this.tooltip.textContent = element
      this.tooltip.style.display = 'block'
      this.tooltip.style.left = `${clientX - this.container.getBoundingClientRect().left + 12}px`
      this.tooltip.style.top = `${clientY - this.container.getBoundingClientRect().top + 12}px`
      this.renderer.domElement.style.cursor = 'pointer'
    } else {
      this.tooltip.style.display = 'none'
      this.renderer.domElement.style.cursor = this.isDragging ? 'grabbing' : 'grab'
    }
  }

  public highlightAtom(atomId: number): void {
    const atomMesh = this.atomMeshes.get(atomId)
    if (!atomMesh) return

    if (this.highlightRings.has(atomId)) {
      const oldRing = this.highlightRings.get(atomId)!
      this.atomGroup.remove(oldRing.mesh)
      this.highlightRings.delete(atomId)
    }

    const radius = Number(atomMesh.userData.radius)
    const ringGeometry = new THREE.SphereGeometry(radius + 0.15, 32, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide,
    })

    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)
    ringMesh.position.copy(atomMesh.position)
    ringMesh.scale.setScalar(1)

    this.atomGroup.add(ringMesh)
    this.highlightRings.set(atomId, {
      mesh: ringMesh,
      startTime: performance.now(),
    })

    setTimeout(() => {
      if (this.highlightRings.has(atomId)) {
        const ring = this.highlightRings.get(atomId)!
        this.atomGroup.remove(ring.mesh)
        ring.mesh.geometry.dispose()
        ;(ring.mesh.material as THREE.Material).dispose()
        this.highlightRings.delete(atomId)
      }
    }, 500)
  }

  public clearHighlights(): void {
    this.highlightRings.forEach((ring) => {
      this.atomGroup.remove(ring.mesh)
      ring.mesh.geometry.dispose()
      ;(ring.mesh.material as THREE.Material).dispose()
    })
    this.highlightRings.clear()
  }

  public loadMolecule(molecule: MoleculeData): void {
    console.log('[MoleculeScene] Loading molecule:', molecule.name, 'atoms:', molecule.atoms.length, 'bonds:', molecule.bonds.length)
    this.clearMolecule()

    molecule.atoms.forEach((atom, index) => {
      this.createAtomMesh(atom, index)
    })

    molecule.bonds.forEach((bond) => {
      this.createBondMesh(bond, molecule.atoms)
    })

    console.log('[MoleculeScene] Molecule loaded. Atoms in group:', this.atomGroup.children.length, 'Bonds in group:', this.bondGroup.children.length)
    console.log('[MoleculeScene] Scene total objects:', this.scene.children.length)
  }

  private createAtomMesh(atom: AtomData, index: number): void {
    const color = ELEMENT_COLORS[atom.element] || '#FFFFFF'
    const radius = ELEMENT_RADII[atom.element] || 0.3
    const emissiveColor = new THREE.Color(color).multiplyScalar(0.3)

    const geometry = new THREE.SphereGeometry(radius, 32, 32)

    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissiveColor,
      emissiveIntensity: 1,
      roughness: 0.4,
      metalness: 0.1,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(atom.x, atom.y, atom.z)
    mesh.userData = { atomId: atom.id, element: atom.element, radius, index }
    mesh.visible = true

    this.atomGroup.add(mesh)
    this.atomMeshes.set(atom.id, mesh)

    console.log('[MoleculeScene] Atom created:', {
      id: atom.id,
      element: atom.element,
      position: [atom.x, atom.y, atom.z],
      radius,
      color,
      inGroup: this.atomGroup.children.includes(mesh),
    })
  }

  private createBondMesh(bond: BondData, atoms: AtomData[]): void {
    const atom1 = atoms.find((a) => a.id === bond.atom1)
    const atom2 = atoms.find((a) => a.id === bond.atom2)

    if (!atom1 || !atom2) {
      console.warn('[MoleculeScene] Could not find atoms for bond:', bond)
      return
    }

    const bondMesh = createBondMesh(atom1, atom2, 0.1)
    bondMesh.userData.bondId = `${bond.atom1}-${bond.atom2}`
    bondMesh.visible = true

    this.bondGroup.add(bondMesh)

    console.log('[MoleculeScene] Bond created:', bond.atom1, '-', bond.atom2, 'at position:', bondMesh.position.toArray())
  }

  private clearMolecule(): void {
    this.atomMeshes.forEach((mesh) => {
      this.atomGroup.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    })
    this.atomMeshes.clear()

    this.bondGroup.children.slice().forEach((child) => {
      const mesh = child as THREE.Mesh
      this.bondGroup.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    })

    this.clearHighlights()
    console.log('[MoleculeScene] Molecule cleared')
  }

  public setOnAtomClick(callback: (atomId: number) => void): void {
    this.onAtomClick = callback
  }

  public setOnRotationChange(callback: (rotationY: number) => void): void {
    this.onRotationChange = callback
  }

  public setOnDraggingChange(callback: (dragging: boolean) => void): void {
    this.onDraggingChange = callback
  }

  public setOnAutoRotatingChange(callback: (auto: boolean) => void): void {
    this.onAutoRotatingChange = callback
  }

  public startAnimation(): void {
    console.log('[MoleculeScene] Starting animation loop')
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)

      if (this.isAutoRotating && !this.isDragging) {
        this.targetRotationY += (this.autoRotationSpeed * Math.PI / 180) / 60
        this.onRotationChange?.(this.targetRotationY)
      }

      const damping = this.isDragging ? 1 : 0.1
      this.atomGroup.rotation.y += (this.targetRotationY - this.atomGroup.rotation.y) * damping
      this.atomGroup.rotation.x += (this.targetRotationX - this.atomGroup.rotation.x) * damping
      this.bondGroup.rotation.y = this.atomGroup.rotation.y
      this.bondGroup.rotation.x = this.atomGroup.rotation.x

      this.updateHighlights()
      this.renderer.render(this.scene, this.camera)
    }

    animate()
  }

  private updateHighlights(): void {
    const now = performance.now()
    this.highlightRings.forEach((ring) => {
      const elapsed = (now - ring.startTime) / 500
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * Math.PI * 4)
      ring.mesh.scale.setScalar(1 + pulse * 0.2)
      const material = ring.mesh.material as THREE.MeshBasicMaterial
      material.opacity = Math.max(0, 0.6 * (1 - elapsed))
    })
  }

  public stopAnimation(): void {
    cancelAnimationFrame(this.animationId)
  }

  public dispose(): void {
    this.stopAnimation()
    this.clearMolecule()

    const canvas = this.renderer.domElement
    canvas.removeEventListener('mousedown', this.onMouseDown)
    canvas.removeEventListener('mousemove', this.onMouseMove)
    canvas.removeEventListener('mouseup', this.onMouseUp)
    canvas.removeEventListener('mouseleave', this.onMouseLeave)
    canvas.removeEventListener('wheel', this.onWheel)
    canvas.removeEventListener('click', this.onClick)
    window.removeEventListener('resize', this.onResize)

    this.tooltip.remove()
    this.renderer.dispose()

    if (this.autoRotateResumeTimer) {
      clearTimeout(this.autoRotateResumeTimer)
    }

    console.log('[MoleculeScene] Disposed')
  }
}
