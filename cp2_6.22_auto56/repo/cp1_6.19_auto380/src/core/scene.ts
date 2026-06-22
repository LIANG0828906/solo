import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Atom, AtomPosition, Bond } from '@/utils/store'
import { useAppStore } from '@/utils/store'
import { eventBus } from '@/utils/eventBus'
import { isAtomHighEnergy } from './kinetics'

const ELEMENT_COLORS: Record<string, number> = {
  C: 0x444444,
  H: 0xffffff,
  Cl: 0x00ff00,
  O: 0xff0000
}

const ELEMENT_RADIUS: Record<string, number> = {
  C: 0.7,
  H: 0.5,
  Cl: 0.8,
  O: 0.66
}

const TRAJECTORY_COLOR = 0x4ecdc4
const TRAJECTORY_OPACITY = 0.3
const GRID_COLOR = 0x334155
const GRID_OPACITY = 0.15

export class SceneManager {
  private container: HTMLElement | null = null
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private atomMeshes: Map<string, THREE.Mesh> = new Map()
  private bondMeshes: Map<string, THREE.Mesh> = new Map()
  private trajectoryLines: Map<string, THREE.Line> = new Map()
  private atomGeometry: THREE.SphereGeometry
  private trajectoryGeometries: Map<string, THREE.BufferGeometry> = new Map()
  private animationId: number | null = null
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0f172a)

    this.camera = new THREE.PerspectiveCamera(
      60,
      1,
      0.1,
      1000
    )
    this.camera.position.set(0, 0, 8)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.target.set(0, 0, 0)

    this.atomGeometry = new THREE.SphereGeometry(1, 32, 32)

    this.setupLighting()
    this.setupGrid()
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.3)
    fillLight.position.set(-5, -3, -5)
    this.scene.add(fillLight)
  }

  private setupGrid(): void {
    const gridHelper = new THREE.GridHelper(20, 40, GRID_COLOR, GRID_COLOR)
    const gridMaterial = gridHelper.material as THREE.Material
    gridMaterial.transparent = true
    gridMaterial.opacity = GRID_OPACITY
    gridHelper.position.y = -2
    this.scene.add(gridHelper)
  }

  mount(container: HTMLElement): void {
    this.container = container
    container.appendChild(this.renderer.domElement)

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize()
    })
    this.resizeObserver.observe(container)

    this.handleResize()
    this.initializeAtoms()
    this.initializeBonds()
    this.startAnimationLoop()
  }

  unmount(): void {
    this.stopAnimationLoop()

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement)
    }

    this.cleanup()
  }

  private handleResize(): void {
    if (!this.container) return

    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
  }

  private initializeAtoms(): void {
    const store = useAppStore.getState()
    for (const atom of store.atoms) {
      this.createAtomMesh(atom)
    }
  }

  private initializeBonds(): void {
    const store = useAppStore.getState()
    for (const bond of store.bonds) {
      this.createBondMesh(bond, store.atoms)
    }
  }

  private createAtomMesh(atom: Atom): void {
    const color = ELEMENT_COLORS[atom.element] || 0x888888
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.4
    })

    const mesh = new THREE.Mesh(this.atomGeometry, material)
    const radius = ELEMENT_RADIUS[atom.element] || 0.6
    mesh.scale.setScalar(radius)
    mesh.position.set(atom.position.x, atom.position.y, atom.position.z)
    mesh.castShadow = true
    mesh.receiveShadow = true

    this.scene.add(mesh)
    this.atomMeshes.set(atom.id, mesh)
  }

  private createBondMesh(bond: Bond, atoms: Atom[]): void {
    const atomA = atoms.find((a) => a.id === bond.atomA)
    const atomB = atoms.find((a) => a.id === bond.atomB)
    if (!atomA || !atomB) return

    const start = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z)
    const end = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z)

    const direction = new THREE.Vector3().subVectors(end, start)
    const length = direction.length()
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)

    const cylinderGeometry = new THREE.CylinderGeometry(0.08, 0.08, length, 8)
    const material = new THREE.MeshStandardMaterial({
      color: 0x666666,
      metalness: 0.5,
      roughness: 0.3,
      transparent: true,
      opacity: bond.opacity
    })

    const mesh = new THREE.Mesh(cylinderGeometry, material)
    mesh.position.copy(midpoint)
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    )
    mesh.visible = bond.visible

    this.scene.add(mesh)
    this.bondMeshes.set(bond.id, mesh)
  }

  private updateAtomPosition(atomId: string, position: AtomPosition): void {
    const mesh = this.atomMeshes.get(atomId)
    if (mesh) {
      mesh.position.set(position.x, position.y, position.z)
    }
  }

  private updateBond(bondId: string, atoms: Atom[]): void {
    const store = useAppStore.getState()
    const bond = store.bonds.find((b) => b.id === bondId)
    const mesh = this.bondMeshes.get(bondId)

    if (!bond || !mesh) {
      if (bond && !mesh) {
        this.createBondMesh(bond, atoms)
      }
      return
    }

    const atomA = atoms.find((a) => a.id === bond.atomA)
    const atomB = atoms.find((a) => a.id === bond.atomB)
    if (!atomA || !atomB) return

    const start = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z)
    const end = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z)

    const direction = new THREE.Vector3().subVectors(end, start)
    const length = direction.length()
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)

    mesh.position.copy(midpoint)
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    )
    mesh.scale.y = length / (mesh.geometry as THREE.CylinderGeometry).parameters.height

    const material = mesh.material as THREE.MeshStandardMaterial
    material.opacity = bond.opacity
    mesh.visible = bond.visible
  }

  private updateTrajectory(atomId: string, positions: AtomPosition[]): void {
    if (positions.length < 2) return

    let line = this.trajectoryLines.get(atomId)
    let geometry = this.trajectoryGeometries.get(atomId)

    const points = positions.map(
      (p) => new THREE.Vector3(p.x, p.y, p.z)
    )

    if (!geometry) {
      geometry = new THREE.BufferGeometry().setFromPoints(points)
      this.trajectoryGeometries.set(atomId, geometry)
    } else {
      geometry.setFromPoints(points)
      geometry.attributes.position.needsUpdate = true
    }

    if (!line) {
      const material = new THREE.LineBasicMaterial({
        color: TRAJECTORY_COLOR,
        transparent: true,
        opacity: TRAJECTORY_OPACITY,
        linewidth: 1
      })
      line = new THREE.Line(geometry, material)
      this.scene.add(line)
      this.trajectoryLines.set(atomId, line)
    }
  }

  private clearTrajectories(): void {
    for (const line of this.trajectoryLines.values()) {
      this.scene.remove(line)
      line.geometry.dispose()
      ;(line.material as THREE.Material).dispose()
    }
    this.trajectoryLines.clear()

    for (const geometry of this.trajectoryGeometries.values()) {
      geometry.dispose()
    }
    this.trajectoryGeometries.clear()
  }

  private updateAtomEnergyIndicator(atom: Atom): void {
    const mesh = this.atomMeshes.get(atom.id)
    if (!mesh) return

    const material = mesh.material as THREE.MeshStandardMaterial
    const baseColor = ELEMENT_COLORS[atom.element] || 0x888888
    const isHighEnergy = isAtomHighEnergy(atom)

    if (isHighEnergy) {
      material.emissive = new THREE.Color(0xff4444)
      material.emissiveIntensity = 0.3
    } else {
      material.emissive = new THREE.Color(0x000000)
      material.emissiveIntensity = 0
    }

    material.color.setHex(baseColor)
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      this.controls.update()
      this.updateFromStore()
      this.renderer.render(this.scene, this.camera)
    }
    animate()
  }

  private stopAnimationLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private updateFromStore(): void {
    const store = useAppStore.getState()

    for (const atom of store.atoms) {
      if (!this.atomMeshes.has(atom.id)) {
        this.createAtomMesh(atom)
      }
      this.updateAtomPosition(atom.id, atom.position)
      this.updateAtomEnergyIndicator(atom)
    }

    for (const bond of store.bonds) {
      if (!this.bondMeshes.has(bond.id)) {
        this.createBondMesh(bond, store.atoms)
      }
      this.updateBond(bond.id, store.atoms)
    }

    for (const [atomId, trajectory] of Object.entries(store.trajectories)) {
      this.updateTrajectory(atomId, trajectory)
    }

    if (store.reactionStatus === 'idle' && Object.keys(store.trajectories).length === 0) {
      this.clearTrajectories()
    }
  }

  private cleanup(): void {
    for (const mesh of this.atomMeshes.values()) {
      this.scene.remove(mesh)
      ;(mesh.material as THREE.Material).dispose()
    }
    this.atomMeshes.clear()

    for (const mesh of this.bondMeshes.values()) {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    }
    this.bondMeshes.clear()

    this.clearTrajectories()

    this.atomGeometry.dispose()
    this.renderer.dispose()
  }

  resetCamera(): void {
    this.camera.position.set(0, 0, 8)
    this.camera.lookAt(0, 0, 0)
    this.controls.target.set(0, 0, 0)
    this.controls.update()
  }
}

export const sceneManager = new SceneManager()

export function initSceneEvents(): void {
  eventBus.on('reaction:reset', () => {
    sceneManager.resetCamera()
  })
}
