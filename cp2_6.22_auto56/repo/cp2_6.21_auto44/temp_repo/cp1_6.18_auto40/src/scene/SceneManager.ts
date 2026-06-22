import * as THREE from 'three'
import { AtomCreator, CreatedAtom } from './AtomCreator'
import { useMoleculeStore, Atom, Bond, ATOM_CONFIG, ValidationResult } from '../store/moleculeStore'

export class SceneManager {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private atomCreator: AtomCreator
  private animationId: number | null = null
  private lastTime = 0

  private atomMap: Map<string, { group: THREE.Group; ghost?: THREE.Group }> = new Map()
  private bondMap: Map<string, THREE.Group> = new Map()
  private bondAnimationMap: Map<string, number> = new Map()

  private cameraAngleY = 0
  private cameraAngleX = 0
  private cameraDistance = 8
  private targetAngleY = 0
  private targetAngleX = 0
  private targetDistance = 8

  private isDragging = false
  private isRotating = false
  private lastMouseX = 0
  private lastMouseY = 0
  private draggedAtomId: string | null = null
  private dragOffset = new THREE.Vector3()
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()

  private gridHelper: THREE.Group
  private validationGlow: THREE.PointLight | null = null
  private shakeStartTime = 0
  private isShaking = false

  private validationLabel: HTMLDivElement | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.atomCreator = new AtomCreator()

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#0D1117')

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.updateCameraPosition()

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    container.appendChild(this.renderer.domElement)

    this.setupLighting()
    this.gridHelper = this.atomCreator.createGridHelper()
    this.scene.add(this.gridHelper)

    this.setupEventListeners()
    this.subscribeToStore()
    this.animate()
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)

    const pointLight1 = new THREE.PointLight(0x4A90D9, 0.5, 20)
    pointLight1.position.set(-5, 3, -5)
    this.scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0x68D391, 0.3, 15)
    pointLight2.position.set(5, -2, 5)
    this.scene.add(pointLight2)
  }

  private updateCameraPosition() {
    const x = this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX)
    const y = this.cameraDistance * Math.sin(this.cameraAngleX)
    const z = this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX)
    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
  }

  private setupEventListeners() {
    const canvas = this.renderer.domElement

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    window.addEventListener('mousemove', this.onMouseMove.bind(this))
    window.addEventListener('mouseup', this.onMouseUp.bind(this))
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false })
    window.addEventListener('resize', this.onResize.bind(this))
    canvas.addEventListener('click', this.onClick.bind(this))
  }

  private updateMouse(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  private onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return

    this.updateMouse(event)
    this.lastMouseX = event.clientX
    this.lastMouseY = event.clientY

    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const atomMeshes: THREE.Object3D[] = []
    this.atomMap.forEach(({ group }) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.isAtom) {
          atomMeshes.push(child)
        }
      })
    })

    const intersects = this.raycaster.intersectObjects(atomMeshes, false)

    if (intersects.length > 0) {
      const mesh = intersects[0].object
      const atomId = mesh.userData.atomId
      if (atomId) {
        this.isDragging = true
        this.draggedAtomId = atomId
        useMoleculeStore.getState().setAtomDragging(atomId, true)
        
        const worldPos = new THREE.Vector3()
        mesh.getWorldPosition(worldPos)
        const planeIntersect = this.getPlaneIntersection()
        if (planeIntersect) {
          this.dragOffset.copy(worldPos).sub(planeIntersect)
        }
        return
      }
    }

    this.isRotating = true
  }

  private getPlaneIntersection(): THREE.Vector3 | null {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const intersectPoint = new THREE.Vector3()
    this.raycaster.setFromCamera(this.mouse, this.camera)
    this.raycaster.ray.intersectPlane(plane, intersectPoint)
    return intersectPoint
  }

  private onMouseMove(event: MouseEvent) {
    this.updateMouse(event)

    if (this.isRotating) {
      const deltaX = event.clientX - this.lastMouseX
      const deltaY = event.clientY - this.lastMouseY

      this.targetAngleY -= deltaX * 0.008727
      this.targetAngleX += deltaY * 0.008727

      const maxAngle = Math.PI / 4
      this.targetAngleX = Math.max(-maxAngle, Math.min(maxAngle, this.targetAngleX))

      this.lastMouseX = event.clientX
      this.lastMouseY = event.clientY
    }

    if (this.isDragging && this.draggedAtomId) {
      const planeIntersect = this.getPlaneIntersection()
      if (planeIntersect) {
        const newPos = planeIntersect.add(this.dragOffset)
        useMoleculeStore.getState().updateAtomPosition(
          this.draggedAtomId,
          newPos.x,
          newPos.y,
          newPos.z
        )
      }
    }
  }

  private onMouseUp() {
    if (this.isDragging && this.draggedAtomId) {
      useMoleculeStore.getState().setAtomDragging(this.draggedAtomId, false)
      this.checkAutoConnect()
    }
    this.isDragging = false
    this.isRotating = false
    this.draggedAtomId = null
  }

  private onWheel(event: WheelEvent) {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.1 : -0.1
    this.targetDistance += delta
    this.targetDistance = Math.max(4, Math.min(24, this.targetDistance))
  }

  private onClick(event: MouseEvent) {
    this.updateMouse(event)
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const bondMeshes: THREE.Object3D[] = []
    this.bondMap.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          bondMeshes.push(child)
        }
      })
    })

    const intersects = this.raycaster.intersectObjects(bondMeshes, true)
    if (intersects.length > 0) {
      const obj = intersects[0].object
      let parent = obj.parent
      while (parent && !parent.userData.bondId) {
        parent = parent.parent
      }
      if (parent && parent.userData.bondId) {
        useMoleculeStore.getState().changeBondOrder(parent.userData.bondId)
      }
    }
  }

  private onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  private checkAutoConnect() {
    const { atoms, bonds, connectAtoms } = useMoleculeStore.getState()
    
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const a1 = atoms[i]
        const a2 = atoms[j]
        
        const dx = a1.x - a2.x
        const dy = a1.y - a2.y
        const dz = a1.z - a2.z
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        const r1 = ATOM_CONFIG[a1.type].radius / 100
        const r2 = ATOM_CONFIG[a2.type].radius / 100
        const threshold = r1 + r2 + 0.2

        const existingBond = bonds.find(
          (b) =>
            (b.atom1Id === a1.id && b.atom2Id === a2.id) ||
            (b.atom1Id === a2.id && b.atom2Id === a1.id)
        )

        if (distance < threshold && !existingBond) {
          connectAtoms(a1.id, a2.id)
        }
      }
    }
  }

  private subscribeToStore() {
    let prevAtomCount = 0
    useMoleculeStore.subscribe((state) => {
      this.updateAtoms(state.atoms)
      this.updateBonds(state.bonds, state.atoms)
      this.handleValidation(state.validationResult, state.atoms)
      this.updateDetailLevel(state.atoms.length)
      
      if (state.atoms.length > prevAtomCount) {
        setTimeout(() => this.checkAutoConnect(), 50)
      }
      prevAtomCount = state.atoms.length
    })
    const initialState = useMoleculeStore.getState()
    this.updateAtoms(initialState.atoms)
    this.updateBonds(initialState.bonds, initialState.atoms)
    this.updateDetailLevel(initialState.atoms.length)
    prevAtomCount = initialState.atoms.length
  }

  private updateDetailLevel(atomCount: number) {
    const useHighDetail = atomCount <= 8
    this.atomCreator.setDetailLevel(useHighDetail)
  }

  private updateAtoms(atoms: Atom[]) {
    const currentIds = new Set(atoms.map((a) => a.id))

    this.atomMap.forEach(({ group, ghost }, id) => {
      if (!currentIds.has(id)) {
        this.scene.remove(group)
        if (ghost) this.scene.remove(ghost)
        this.atomCreator.disposeAtom(group)
        if (ghost) this.atomCreator.disposeAtom(ghost)
        this.atomMap.delete(id)
      }
    })

    atoms.forEach((atom) => {
      let entry = this.atomMap.get(atom.id)
      if (!entry) {
        const created = this.atomCreator.createAtom(atom.type)
        created.group.userData = { atomId: atom.id }
        created.mesh.userData.atomId = atom.id
        
        const ghost = this.atomCreator.createAtom(atom.type, true)
        
        this.scene.add(created.group)
        this.scene.add(ghost.group)
        entry = { group: created.group, ghost: ghost.group }
        this.atomMap.set(atom.id, entry)
      }

      entry.group.position.set(atom.x, atom.y, atom.z)
      
      if (entry.ghost) {
        const storePos = atom.isDragging ? this.getStorePosition(atom.type) : null
        if (storePos && atom.isDragging) {
          entry.ghost.visible = true
          entry.ghost.position.set(storePos.x, storePos.y, storePos.z)
        } else {
          entry.ghost.visible = false
        }
      }

      if (this.isShaking) {
        const elapsed = (performance.now() - this.shakeStartTime) / 1000
        const frequency = 10
        const amplitude = 0.05
        const shakeX = Math.sin(elapsed * frequency * Math.PI * 2) * amplitude
        const shakeY = Math.cos(elapsed * frequency * Math.PI * 2) * amplitude
        const shakeZ = Math.sin(elapsed * frequency * Math.PI * 2 + 1) * amplitude
        entry.group.position.x += shakeX
        entry.group.position.y += shakeY
        entry.group.position.z += shakeZ
      }
    })
  }

  private getStorePosition(type: string): { x: number; y: number; z: number } {
    const positions: Record<string, { x: number; y: number; z: number }> = {
      carbon: { x: -2.5, y: 0, z: 0 },
      hydrogen: { x: 0, y: 0, z: 0 },
      oxygen: { x: 2.5, y: 0, z: 0 }
    }
    return positions[type] || { x: 0, y: 0, z: 0 }
  }

  private updateBonds(bonds: Bond[], atoms: Atom[]) {
    const currentBondIds = new Set(bonds.map((b) => b.id))

    this.bondMap.forEach((group, id) => {
      if (!currentBondIds.has(id)) {
        this.scene.remove(group)
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (child.material instanceof THREE.Material) {
              child.material.dispose()
            }
          }
        })
        this.bondMap.delete(id)
        this.bondAnimationMap.delete(id)
      }
    })

    const atomPositionMap = new Map(atoms.map((a) => [a.id, new THREE.Vector3(a.x, a.y, a.z)]))

    bonds.forEach((bond) => {
      const pos1 = atomPositionMap.get(bond.atom1Id)
      const pos2 = atomPositionMap.get(bond.atom2Id)
      if (!pos1 || !pos2) return

      const distance = pos1.distanceTo(pos2)
      let bondGroup = this.bondMap.get(bond.id)

      if (!bondGroup) {
        const created = this.atomCreator.createBond(bond.order, distance)
        bondGroup = created.group
        bondGroup.userData = { bondId: bond.id }
        this.scene.add(bondGroup)
        this.bondMap.set(bond.id, bondGroup)
        this.bondAnimationMap.set(bond.id, Math.random() * Math.PI * 2)
      } else {
        const currentOrder = bondGroup.userData.currentOrder
        if (currentOrder !== bond.order) {
          this.atomCreator.updateBondVisuals(bondGroup, bond.order, distance)
          bondGroup.userData.currentOrder = bond.order
        }
      }

      bondGroup.userData.currentOrder = bond.order
      const midPoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5)
      bondGroup.position.copy(midPoint)

      const direction = new THREE.Vector3().subVectors(pos2, pos1).normalize()
      bondGroup.lookAt(pos2)
      bondGroup.rotateX(Math.PI / 2)
    })
  }

  private handleValidation(result: ValidationResult | null, atoms: Atom[]) {
    if (!result) {
      if (this.validationGlow) {
        this.scene.remove(this.validationGlow)
        this.validationGlow = null
      }
      this.isShaking = false
      if (this.validationLabel) {
        this.validationLabel.remove()
        this.validationLabel = null
      }
      return
    }

    if (result.success && result.matchedName) {
      this.validationGlow = new THREE.PointLight(0xFBBF24, 2, 5)
      this.validationGlow.position.set(0, 0, 0)
      this.scene.add(this.validationGlow)

      this.validationLabel = document.createElement('div')
      this.validationLabel.style.cssText = `
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 16px;
        color: #FFFFFF;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        font-weight: bold;
        pointer-events: none;
        z-index: 1000;
        background: rgba(0,0,0,0.5);
        padding: 8px 16px;
        border-radius: 8px;
      `
      this.validationLabel.textContent = result.matchedName
      this.container.appendChild(this.validationLabel)
    } else {
      this.isShaking = true
      this.shakeStartTime = performance.now()
      
      this.validationLabel = document.createElement('div')
      this.validationLabel.style.cssText = `
        position: absolute;
        top: 40%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 16px;
        color: #FC8181;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        font-weight: bold;
        pointer-events: none;
        z-index: 1000;
        background: rgba(0,0,0,0.5);
        padding: 8px 16px;
        border-radius: 8px;
      `
      this.validationLabel.textContent = `匹配失败：${result.mismatchedCount || 0} 个原子不匹配`
      this.container.appendChild(this.validationLabel)
    }
  }

  private animate(time = 0) {
    this.animationId = requestAnimationFrame(this.animate.bind(this))

    const delta = (time - this.lastTime) / 1000
    this.lastTime = time

    this.cameraAngleY += (this.targetAngleY - this.cameraAngleY) * 0.1
    this.cameraAngleX += (this.targetAngleX - this.cameraAngleX) * 0.1
    this.cameraDistance += (this.targetDistance - this.cameraDistance) * 0.1
    this.updateCameraPosition()

    this.bondMap.forEach((group, bondId) => {
      const phase = this.bondAnimationMap.get(bondId) || 0
      const rotationSpeed = 0.5236
      group.rotation.z = phase + time * rotationSpeed * 0.001

      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial) {
          const pulse = 0.7 + 0.3 * Math.sin(time * 0.005 + phase)
          child.material.opacity = pulse * 0.9
        }
      })
    })

    if (this.isShaking && performance.now() - this.shakeStartTime > 1000) {
      this.isShaking = false
    }

    if (this.validationGlow) {
      const elapsed = (performance.now() - this.shakeStartTime) / 2000
      if (elapsed < 1) {
        this.validationGlow.intensity = 2 * (1 - elapsed)
      }
    }

    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
  }
}
