import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { AtomData, BondData } from './MoleculeData'
import { calculateBondLength, findAdjacentAtoms } from './MoleculeData'
import { useMoleculeStore } from './store'

const ELEMENT_COLORS: Record<string, number> = {
  C: 0x2d3436,
  H: 0xecf0f1,
  O: 0xe74c3c,
  N: 0x3498db,
  S: 0xf1c40f,
  P: 0xe67e22,
}

const ELEMENT_RADIUS: Record<string, number> = {
  H: 0.25,
  C: 0.40,
  N: 0.38,
  O: 0.36,
  S: 0.50,
  P: 0.50,
}

const BOND_STYLES: Record<number, { color: number; opacity: number; count: number; spacing: number }> = {
  1: { color: 0xb0b0b0, opacity: 0.7, count: 1, spacing: 0 },
  2: { color: 0xa0a0ff, opacity: 0.8, count: 2, spacing: 0.12 },
  3: { color: 0xffa0a0, opacity: 0.85, count: 3, spacing: 0.12 },
  4: { color: 0xc8a0ff, opacity: 0.6, count: 2, spacing: 0.10 },
}

export class MoleculeScene {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  labelRenderer: CSS2DRenderer
  controls: OrbitControls
  raycaster: THREE.Raycaster
  mouse: THREE.Vector2
  atomGroup: THREE.Group
  bondGroup: THREE.Group
  atomMeshes: Map<string, THREE.Mesh>
  atomLabels: Map<string, CSS2DObject>
  bondMeshes: Map<string, THREE.Group>
  bondFlashTimers: Map<string, number>
  handleGroup: THREE.Group
  handleArrows: { x: THREE.Mesh; y: THREE.Mesh; z: THREE.Mesh }
  selectedAtomId: string | null
  draggingAtomId: string | null
  draggingAxis: 'x' | 'y' | 'z' | null
  dragPlane: THREE.Plane
  dragOffset: THREE.Vector3
  container: HTMLElement | null
  atomMaterialsCache: Map<string, THREE.MeshStandardMaterial>
  atomGeometriesCache: Map<number, THREE.SphereGeometry>
  bondGeometry: THREE.CylinderGeometry
  previousStateVersion: number = 0
  _onStoreUnsubscribe: (() => void) | null = null

  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera()
    this.renderer = new THREE.WebGLRenderer()
    this.labelRenderer = new CSS2DRenderer()
    this.controls = new OrbitControls(this.camera, document.createElement('div'))
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.atomGroup = new THREE.Group()
    this.bondGroup = new THREE.Group()
    this.atomMeshes = new Map()
    this.atomLabels = new Map()
    this.bondMeshes = new Map()
    this.bondFlashTimers = new Map()
    this.handleGroup = new THREE.Group()
    this.handleArrows = {
      x: new THREE.Mesh(),
      y: new THREE.Mesh(),
      z: new THREE.Mesh(),
    }
    this.selectedAtomId = null
    this.draggingAtomId = null
    this.draggingAxis = null
    this.dragPlane = new THREE.Plane()
    this.dragOffset = new THREE.Vector3()
    this.container = null
    this.atomMaterialsCache = new Map()
    this.atomGeometriesCache = new Map()
    this.bondGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1, 12)
  }

  init(container: HTMLElement): void {
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = null

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(10, 7, 13)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.shadowMap.enabled = true
    container.appendChild(this.renderer.domElement)

    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(container.clientWidth, container.clientHeight)
    const labelDom = this.labelRenderer.domElement
    labelDom.style.position = 'absolute'
    labelDom.style.top = '0'
    labelDom.style.left = '0'
    labelDom.style.pointerEvents = 'none'
    container.appendChild(labelDom)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.minDistance = 3
    this.controls.maxDistance = 50
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    }
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    directionalLight.position.set(6, 9, 6)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)

    const pointLight1 = new THREE.PointLight(0xffffff, 0.5)
    pointLight1.position.set(-8, 4, -4)
    this.scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5)
    pointLight2.position.set(-8, 4, -4)
    this.scene.add(pointLight2)

    this.atomGroup = new THREE.Group()
    this.bondGroup = new THREE.Group()
    this.scene.add(this.atomGroup)
    this.scene.add(this.bondGroup)

    this.atomMaterialsCache = new Map()
    this.atomGeometriesCache = new Map()
    this.bondGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1, 12)

    this.handleGroup = new THREE.Group()
    this.handleGroup.visible = false
    this.scene.add(this.handleGroup)

    const arrowLength = 1.5
    const cylinderRadius = 0.03
    const coneRadius = 0.09

    const createArrow = (axis: 'x' | 'y' | 'z', color: number): THREE.Mesh => {
      const cylinderGeo = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, arrowLength * 0.7, 12)
      const coneGeo = new THREE.ConeGeometry(coneRadius, arrowLength * 0.3, 12)
      const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 })

      const group = new THREE.Group()

      const cylinder = new THREE.Mesh(cylinderGeo, material)
      cylinder.position.y = arrowLength * 0.35
      group.add(cylinder)

      const cone = new THREE.Mesh(coneGeo, material)
      cone.position.y = arrowLength * 0.85
      group.add(cone)

      if (axis === 'x') {
        group.rotation.z = -Math.PI / 2
      } else if (axis === 'z') {
        group.rotation.x = Math.PI / 2
      }

      const merged = new THREE.Mesh(new THREE.BufferGeometry(), material)
      group.updateMatrixWorld(true)
      const mergedGeo = new THREE.BufferGeometry()
      const positions: number[] = []
      const indices: number[] = []
      let vertexOffset = 0
      group.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh && mesh.geometry) {
          const geo = mesh.geometry as THREE.BufferGeometry
          const posAttr = geo.getAttribute('position')
          const idxAttr = geo.getIndex()
          if (posAttr) {
            for (let i = 0; i < posAttr.count; i++) {
              const v = new THREE.Vector3().fromBufferAttribute(posAttr, i)
              mesh.localToWorld(v)
              positions.push(v.x, v.y, v.z)
            }
          }
          if (idxAttr) {
            for (let i = 0; i < idxAttr.count; i++) {
              indices.push(idxAttr.getX(i) + vertexOffset)
            }
            vertexOffset += posAttr ? posAttr.count : 0
          }
        }
      })
      mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      mergedGeo.setIndex(indices)
      merged.geometry = mergedGeo
      merged.userData = { axis }

      this.handleGroup.add(merged)
      return merged
    }

    this.handleArrows.x = createArrow('x', 0xff0000)
    this.handleArrows.y = createArrow('y', 0x00ff00)
    this.handleArrows.z = createArrow('z', 0x0000ff)

    this._setupInteraction()

    this._onStoreUnsubscribe = useMoleculeStore.subscribe((state, prevState) => {
      this.refreshMoleculeFromStore()
      this._updateSelectedHighlight()
    })

    this.refreshMoleculeFromStore()
  }

  refreshMoleculeFromStore(): void {
    const store = useMoleculeStore.getState()
    const { molecule } = store

    this._clearMolecule()

    for (const atom of molecule.atoms) {
      this._createAtomMesh(atom)
    }

    for (const bond of molecule.bonds) {
      this._createBondCylinder(bond)
    }

    if (molecule.atoms.length > 0) {
      const bbox = new THREE.Box3()
      for (const mesh of this.atomMeshes.values()) {
        bbox.expandByObject(mesh)
      }
      const center = new THREE.Vector3()
      bbox.getCenter(center)
      this.atomGroup.position.sub(center)
      this.bondGroup.position.sub(center)
    }
  }

  _clearMolecule(): void {
    while (this.atomGroup.children.length > 0) {
      const child = this.atomGroup.children[0]
      this.atomGroup.remove(child)
    }
    while (this.bondGroup.children.length > 0) {
      const child = this.bondGroup.children[0]
      this.bondGroup.remove(child)
    }

    this.atomMeshes.clear()
    this.atomLabels.clear()
    this.bondMeshes.clear()
  }

  _createAtomMesh(atom: AtomData): void {
    const element = atom.element
    const radius = ELEMENT_RADIUS[element] ?? 0.35
    const color = ELEMENT_COLORS[element] ?? 0x9b59b6

    let geometry = this.atomGeometriesCache.get(radius)
    if (!geometry) {
      geometry = new THREE.SphereGeometry(radius, 32, 32)
      this.atomGeometriesCache.set(radius, geometry)
    }

    let material = this.atomMaterialsCache.get(element)
    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.3,
        roughness: 0.35,
        emissive: 0x000000,
        emissiveIntensity: 0,
      })
      this.atomMaterialsCache.set(element, material)
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = { atomId: atom.id }
    mesh.position.set(atom.x, atom.y, atom.z)
    this.atomGroup.add(mesh)
    this.atomMeshes.set(atom.id, mesh)

    const div = document.createElement('div')
    div.className = 'atom-label'
    div.textContent = atom.element
    div.style.padding = '2px 6px'
    div.style.background = 'rgba(255,255,255,0.15)'
    div.style.color = 'white'
    div.style.borderRadius = '4px'
    div.style.fontFamily = '-apple-system, Segoe UI, sans-serif'
    div.style.fontSize = '11px'
    div.style.fontWeight = '600'
    div.style.backdropFilter = 'blur(4px)'
    div.style.transition = 'all 0.2s ease'
    div.style.pointerEvents = 'none'
    div.addEventListener('mouseover', () => {
      div.style.background = 'rgba(255,255,255,0.3)'
      div.style.transform = 'scale(1.1)'
    })
    div.addEventListener('mouseout', () => {
      div.style.background = 'rgba(255,255,255,0.15)'
      div.style.transform = 'scale(1)'
    })

    const label = new CSS2DObject(div)
    label.position.set(0, radius + 0.1, 0)
    mesh.add(label)
    this.atomLabels.set(atom.id, label)
  }

  _createBondCylinder(bond: BondData): void {
    const store = useMoleculeStore.getState()
    const a1 = store.molecule.atoms.find((a) => a.id === bond.atom1Id)
    const a2 = store.molecule.atoms.find((a) => a.id === bond.atom2Id)
    if (!a1 || !a2) return

    const style = BOND_STYLES[bond.type] ?? BOND_STYLES[1]
    const group = new THREE.Group()
    group.userData = { bondId: bond.id }

    const p1 = new THREE.Vector3(a1.x, a1.y, a1.z)
    const p2 = new THREE.Vector3(a2.x, a2.y, a2.z)
    const direction = p2.clone().sub(p1).normalize()
    const length = p1.distanceTo(p2)
    const up = new THREE.Vector3(0, 1, 0)
    let perp = direction.clone().cross(up)
    if (perp.length() < 0.001) {
      const altUp = new THREE.Vector3(1, 0, 0)
      perp = direction.clone().cross(altUp)
    }
    perp.normalize()

    const { count, spacing, color, opacity } = style

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spacing
      const cylPos = p1.clone().add(p2).multiplyScalar(0.5).add(perp.clone().multiplyScalar(offset))

      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        roughness: 0.6,
      })

      const mesh = new THREE.Mesh(this.bondGeometry, material)
      mesh.scale.set(1, length, 1)
      mesh.position.copy(cylPos)
      mesh.quaternion.setFromUnitVectors(up, direction)
      mesh.userData = { isBondCylinder: true, bondId: bond.id }
      group.add(mesh)
    }

    if (bond.type === 4) {
      group.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.emissive = new THREE.Color(0xc8a0ff)
          mat.emissiveIntensity = 0.15
        }
      })
    }

    this.bondGroup.add(group)
    this.bondMeshes.set(bond.id, group)
  }

  _updateBondCylinder(bondId: string): void {
    const store = useMoleculeStore.getState()
    const bond = store.molecule.bonds.find((b) => b.id === bondId)
    const group = this.bondMeshes.get(bondId)
    if (!bond || !group) return

    const a1 = store.molecule.atoms.find((a) => a.id === bond.atom1Id)
    const a2 = store.molecule.atoms.find((a) => a.id === bond.atom2Id)
    if (!a1 || !a2) return

    const style = BOND_STYLES[bond.type] ?? BOND_STYLES[1]

    const p1 = new THREE.Vector3(a1.x, a1.y, a1.z)
    const p2 = new THREE.Vector3(a2.x, a2.y, a2.z)
    const direction = p2.clone().sub(p1).normalize()
    const length = p1.distanceTo(p2)
    const up = new THREE.Vector3(0, 1, 0)
    let perp = direction.clone().cross(up)
    if (perp.length() < 0.001) {
      const altUp = new THREE.Vector3(1, 0, 0)
      perp = direction.clone().cross(altUp)
    }
    perp.normalize()

    const { count, spacing } = style
    const cylinders = group.children.filter((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh[]

    for (let i = 0; i < cylinders.length; i++) {
      const mesh = cylinders[i]
      const offset = (i - (count - 1) / 2) * spacing
      const cylPos = p1.clone().add(p2).multiplyScalar(0.5).add(perp.clone().multiplyScalar(offset))
      mesh.scale.set(1, length, 1)
      mesh.position.copy(cylPos)
      mesh.quaternion.setFromUnitVectors(up, direction)
    }
  }

  _setupInteraction(): void {
    const domElement = this.renderer.domElement
    let downPos = new THREE.Vector2()
    let isDragging = false
    let clickMoved = false

    const updateMouse = (event: PointerEvent) => {
      const rect = domElement.getBoundingClientRect()
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    domElement.addEventListener('pointerdown', (event: PointerEvent) => {
      isDragging = true
      clickMoved = false
      downPos.set(event.clientX, event.clientY)
      updateMouse(event)

      this.raycaster.setFromCamera(this.mouse, this.camera)

      const handleIntersects = this.raycaster.intersectObjects(this.handleGroup.children, false)
      if (handleIntersects.length > 0 && this.selectedAtomId) {
        const hit = handleIntersects[0]
        const axis = (hit.object.userData.axis as 'x' | 'y' | 'z')
        this.draggingAtomId = this.selectedAtomId
        this.draggingAxis = axis

        const atomMesh = this.atomMeshes.get(this.selectedAtomId)
        if (!atomMesh) return
        const atomPos = atomMesh.getWorldPosition(new THREE.Vector3())

        const cameraRight = new THREE.Vector3()
        const cameraUp = new THREE.Vector3()
        const cameraForward = new THREE.Vector3()
        this.camera.matrixWorld.extractBasis(cameraRight, cameraUp, cameraForward)

        let normal: THREE.Vector3
        if (axis === 'x') {
          normal = cameraRight.clone()
        } else if (axis === 'y') {
          normal = cameraUp.clone()
        } else {
          normal = cameraForward.clone()
        }
        this.dragPlane = new THREE.Plane(normal, -normal.dot(atomPos))
        this.dragOffset = hit.point.clone().sub(atomPos)
        this.controls.enabled = false
        event.preventDefault()
        event.stopPropagation()
        return
      }

      const atomIntersects = this.raycaster.intersectObjects(this.atomGroup.children, false)
      if (atomIntersects.length > 0) {
        const atomId = atomIntersects[0].object.userData.atomId as string
        useMoleculeStore.getState().selectAtom(atomId)
      } else {
        const store = useMoleculeStore.getState()
        if (!store.bondEditMode) {
          store.selectAtom(null)
        }
      }
    })

    domElement.addEventListener('pointermove', (event: PointerEvent) => {
      updateMouse(event)

      if (isDragging) {
        const dx = Math.abs(event.clientX - downPos.x)
        const dy = Math.abs(event.clientY - downPos.y)
        if (dx > 3 || dy > 3) {
          clickMoved = true
        }
      }

      if (this.draggingAtomId && this.draggingAxis) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        const intersect = new THREE.Vector3()
        if (this.raycaster.ray.intersectPlane(this.dragPlane, intersect)) {
          const atomMesh = this.atomMeshes.get(this.draggingAtomId)
          if (!atomMesh) return
          const currentPos = atomMesh.getWorldPosition(new THREE.Vector3())
          const newPos = intersect.clone().sub(this.dragOffset)

          const axis = this.draggingAxis
          const targetX = axis === 'x' ? newPos.x : currentPos.x
          const targetY = axis === 'y' ? newPos.y : currentPos.y
          const targetZ = axis === 'z' ? newPos.z : currentPos.z

          useMoleculeStore.getState().setAtomTarget(this.draggingAtomId, targetX, targetY, targetZ)
        }
        event.preventDefault()
        event.stopPropagation()
        return
      }

      this.raycaster.setFromCamera(this.mouse, this.camera)
      const atomIntersects = this.raycaster.intersectObjects(this.atomGroup.children, false)
      if (atomIntersects.length > 0) {
        domElement.style.cursor = 'pointer'
      } else {
        domElement.style.cursor = 'default'
      }
    })

    domElement.addEventListener('pointerup', (_event: PointerEvent) => {
      if (this.draggingAtomId) {
        const store = useMoleculeStore.getState()
        const target = store.atomTargetPositions.get(this.draggingAtomId)
        if (target) {
          store.updateAtomPosition(this.draggingAtomId, target.x, target.y, target.z)
        }
        this.draggingAtomId = null
        this.draggingAxis = null
        this.controls.enabled = true
      }
      isDragging = false
    })

    domElement.addEventListener('click', (event: PointerEvent) => {
      if (clickMoved) return
      updateMouse(event)
      this.raycaster.setFromCamera(this.mouse, this.camera)

      const bondIntersects = this.raycaster.intersectObjects(this.bondGroup.children, true)
      if (bondIntersects.length > 0) {
        let hit = bondIntersects[0]
        let bondId: string | null = null
        if (hit.object.userData.bondId) {
          bondId = hit.object.userData.bondId as string
        } else if (hit.object.parent?.userData?.bondId) {
          bondId = hit.object.parent.userData.bondId as string
        }
        if (bondId) {
          useMoleculeStore.getState().selectBond(bondId)
        }
      }
    })

    domElement.addEventListener('contextmenu', (event: Event) => {
      event.preventDefault()
    })
  }

  _updateSelectedHighlight(): void {
    const store = useMoleculeStore.getState()
    const { selectedAtomId, firstBondAtomId, selectedBondId } = store

    this.selectedAtomId = selectedAtomId

    this.atomMeshes.forEach((mesh, atomId) => {
      const material = mesh.material as THREE.MeshStandardMaterial
      if (atomId === selectedAtomId) {
        material.emissive = new THREE.Color(0xffd700)
        material.emissiveIntensity = 0.6
        mesh.scale.setScalar(1.1)
        const worldPos = new THREE.Vector3()
        mesh.getWorldPosition(worldPos)
        this._showDragHandles(worldPos)
      } else {
        material.emissive = new THREE.Color(0x000000)
        material.emissiveIntensity = 0
        mesh.scale.setScalar(1)
      }

      if (atomId === firstBondAtomId && firstBondAtomId !== selectedAtomId) {
        material.emissive = new THREE.Color(0x00ffff)
        material.emissiveIntensity = 0.4
      }
    })

    if (!selectedAtomId) {
      this._hideDragHandles()
    }

    this.bondMeshes.forEach((group, bondId) => {
      group.traverse((child) => {
        const mesh = child as THREE.Mesh
        if (mesh.isMesh) {
          const material = mesh.material as THREE.MeshStandardMaterial
          if (bondId === selectedBondId) {
            material.emissive = new THREE.Color(0xffd700)
            material.emissiveIntensity = 0.5
          } else {
            material.emissive = new THREE.Color(0x000000)
            material.emissiveIntensity = 0
          }
        }
      })
    })
  }

  _showDragHandles(pos: THREE.Vector3): void {
    this.handleGroup.position.copy(pos)
    this.handleGroup.visible = true
  }

  _hideDragHandles(): void {
    this.handleGroup.visible = false
  }

  update(delta: number): void {
    this.controls.update()

    const store = useMoleculeStore.getState()
    const updatedAtomIds: Set<string> = new Set()

    store.atomTargetPositions.forEach((target, id) => {
      const mesh = this.atomMeshes.get(id)
      if (!mesh) return

      const currentPos = mesh.position
      const targetVec = new THREE.Vector3(target.x, target.y, target.z)
      currentPos.lerp(targetVec, 0.15)
      store.updateAtomPosition(id, currentPos.x, currentPos.y, currentPos.z)
      updatedAtomIds.add(id)

      const dist = currentPos.distanceTo(targetVec)
      if (dist < 0.001) {
        const newMap = new Map(store.atomTargetPositions)
        newMap.delete(id)
        useMoleculeStore.setState({ atomTargetPositions: newMap })
      }
    })

    if (updatedAtomIds.size > 0) {
      const affectedBondIds = new Set<string>()
      updatedAtomIds.forEach((atomId) => {
        const adjacent = findAdjacentAtoms(atomId, store.molecule.bonds)
        store.molecule.bonds.forEach((bond) => {
          if (bond.atom1Id === atomId || bond.atom2Id === atomId) {
            affectedBondIds.add(bond.id)
          }
        })
      })
      affectedBondIds.forEach((bondId) => {
        this._updateBondCylinder(bondId)
      })
    }

    this.bondFlashTimers.forEach((timer, bondId) => {
      const newTimer = timer - delta * 1000
      if (newTimer <= 0) {
        this.bondFlashTimers.delete(bondId)
        const group = this.bondMeshes.get(bondId)
        if (group) {
          group.scale.setScalar(1)
          group.traverse((child) => {
            const mesh = child as THREE.Mesh
            if (mesh.isMesh) {
              const material = mesh.material as THREE.MeshStandardMaterial
              material.opacity = material.userData?.originalOpacity ?? material.opacity
            }
          })
        }
      } else {
        this.bondFlashTimers.set(bondId, newTimer)
        const group = this.bondMeshes.get(bondId)
        if (group) {
          const progress = 1 - newTimer / 300
          const scale = 1 + Math.sin(progress * Math.PI) * 0.3
          group.scale.setScalar(scale)
          group.traverse((child) => {
            const mesh = child as THREE.Mesh
            if (mesh.isMesh) {
              const material = mesh.material as THREE.MeshStandardMaterial
              if (material.userData?.originalOpacity === undefined) {
                material.userData = { ...material.userData, originalOpacity: material.opacity }
              }
              material.opacity = material.userData.originalOpacity * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2))
            }
          })
        }
      }
    })

    this._updateSelectedHighlight()
    this.camera.updateMatrixWorld()
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
    this.labelRenderer.render(this.scene, this.camera)
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.labelRenderer.setSize(width, height)
  }

  dispose(): void {
    if (this._onStoreUnsubscribe) {
      this._onStoreUnsubscribe()
      this._onStoreUnsubscribe = null
    }

    this.renderer.dispose()
    this.bondGeometry.dispose()

    this.atomGeometriesCache.forEach((geo) => geo.dispose())
    this.atomMaterialsCache.forEach((mat) => mat.dispose())

    if (this.container) {
      if (this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement)
      }
      if (this.labelRenderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.labelRenderer.domElement)
      }
    }

    this.controls.dispose()
  }

  flashBond(bondId: string): void {
    this.bondFlashTimers.set(bondId, 300)
  }
}
