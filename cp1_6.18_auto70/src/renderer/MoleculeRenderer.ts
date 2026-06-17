import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Atom, Bond, Molecule } from '@/models/Molecule'

interface RendererCallbacks {
  onHoverAtom: (atom: Atom | null, screenX: number, screenY: number) => void
  onHoverBond: (bond: Bond | null, screenX: number, screenY: number) => void
}

export class MoleculeRenderer {
  private container: HTMLElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private moleculeGroup: THREE.Group
  private clipPlane: THREE.Plane
  private clipPlaneMesh: THREE.Mesh | null
  private clipGridHelper: THREE.GridHelper | null
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private callbacks: RendererCallbacks
  private animFrameId: number
  private autoRotate: boolean
  private rotationSpeed: number
  private atomMeshes: Map<string, THREE.Mesh>
  private bondMeshes: Map<string, THREE.Mesh>
  private bondHitMeshes: THREE.Mesh[]
  private clock: THREE.Clock
  private disposed: boolean
  private currentAtomMaterial: THREE.MeshPhysicalMaterial | null
  private fadeOpacity: number
  private fadeTarget: number

  constructor(container: HTMLElement, callbacks: RendererCallbacks) {
    this.container = container
    this.callbacks = callbacks
    this.animFrameId = 0
    this.autoRotate = true
    this.rotationSpeed = 2 * (Math.PI / 180)
    this.atomMeshes = new Map()
    this.bondMeshes = new Map()
    this.bondHitMeshes = []
    this.clock = new THREE.Clock()
    this.disposed = false
    this.currentAtomMaterial = null
    this.fadeOpacity = 1
    this.fadeTarget = 1
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 5)
    this.clipPlaneMesh = null
    this.clipGridHelper = null
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2(-999, -999)
    this.moleculeGroup = new THREE.Group()

    const w = container.clientWidth
    const h = container.clientHeight

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0A0A1A)

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
    this.camera.position.set(0, 2, 6)
    this.camera.lookAt(0, 0, 0)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setSize(w, h)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.localClippingEnabled = true
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.9
    this.controls.rotateSpeed = 0.7
    this.controls.minDistance = 1.2
    this.controls.maxDistance = 24
    this.controls.panSpeed = 0.01
    this.controls.enablePan = true
    this.controls.target.set(0, 0, 0)

    this.setupLights()
    this.scene.add(this.moleculeGroup)

    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this))
    this.renderer.domElement.addEventListener('mouseleave', this.onMouseLeave.bind(this))
    window.addEventListener('resize', this.onResize.bind(this))

    this.animate()
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0x404060, 0.6)
    this.scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(5, 8, 5)
    this.scene.add(dirLight)

    const dirLight2 = new THREE.DirectionalLight(0x4ECDC4, 0.3)
    dirLight2.position.set(-5, -3, -5)
    this.scene.add(dirLight2)

    const pointLight = new THREE.PointLight(0x6BCB77, 0.5, 20)
    pointLight.position.set(0, 5, 3)
    this.scene.add(pointLight)
  }

  loadMolecule(molecule: Molecule) {
    this.fadeTarget = 0
    setTimeout(() => {
      this.clearMolecule()
      this.createMolecule(molecule)
      this.fadeTarget = 1
      this.fadeOpacity = 0
    }, 300)
  }

  private clearMolecule() {
    this.atomMeshes.forEach((mesh) => {
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    })
    this.bondMeshes.forEach((mesh) => {
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    })
    this.bondHitMeshes.forEach((mesh) => {
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    })
    this.atomMeshes.clear()
    this.bondMeshes.clear()
    this.bondHitMeshes = []

    while (this.moleculeGroup.children.length > 0) {
      this.moleculeGroup.remove(this.moleculeGroup.children[0])
    }
  }

  private createMolecule(molecule: Molecule) {
    const atomGeometry = new THREE.SphereGeometry(1, 32, 24)

    const atomMap = new Map<string, Atom>()
    molecule.atoms.forEach((atom) => {
      atomMap.set(atom.id, atom)
      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(atom.color),
        emissive: new THREE.Color(atom.color),
        emissiveIntensity: 0.25,
        metalness: 0.3,
        roughness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        clippingPlanes: [this.clipPlane],
        clipShadows: true,
        transparent: true,
        opacity: 1,
      })

      const mesh = new THREE.Mesh(atomGeometry, mat)
      mesh.position.set(atom.x, atom.y, atom.z)
      mesh.scale.setScalar(atom.radius)
      mesh.userData = { type: 'atom', data: atom }
      this.moleculeGroup.add(mesh)
      this.atomMeshes.set(atom.id, mesh)
    })

    const bondGeometry = new THREE.CylinderGeometry(1, 1, 1, 12)

    molecule.bonds.forEach((bond) => {
      const atomA = atomMap.get(bond.atomAId)
      const atomB = atomMap.get(bond.atomBId)
      if (!atomA || !atomB) return

      const mid = new THREE.Vector3(
        (atomA.x + atomB.x) / 2,
        (atomA.y + atomB.y) / 2,
        (atomA.z + atomB.z) / 2,
      )
      const direction = new THREE.Vector3(
        atomB.x - atomA.x,
        atomB.y - atomA.y,
        atomB.z - atomA.z,
      )
      const length = direction.length()
      direction.normalize()

      const bondRadius = 0.04
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x888899,
        emissive: 0x222233,
        emissiveIntensity: 0.15,
        metalness: 0.1,
        roughness: 0.3,
        transparent: true,
        opacity: 0.7,
        clippingPlanes: [this.clipPlane],
        clipShadows: true,
      })

      const mesh = new THREE.Mesh(bondGeometry, mat)
      mesh.position.copy(mid)
      mesh.scale.set(bondRadius, length, bondRadius)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
      mesh.userData = { type: 'bond', data: bond }
      this.moleculeGroup.add(mesh)
      this.bondMeshes.set(bond.id, mesh)

      const hitMat = new THREE.MeshBasicMaterial({ visible: false })
      const hitMesh = new THREE.Mesh(bondGeometry, hitMat)
      hitMesh.position.copy(mid)
      hitMesh.scale.set(0.2, length, 0.2)
      hitMesh.quaternion.copy(mesh.quaternion)
      hitMesh.userData = { type: 'bond', data: bond }
      this.moleculeGroup.add(hitMesh)
      this.bondHitMeshes.push(hitMesh)
    })

    this.centerMolecule()
  }

  private centerMolecule() {
    const box = new THREE.Box3().setFromObject(this.moleculeGroup)
    const center = box.getCenter(new THREE.Vector3())
    this.moleculeGroup.position.sub(center)
    this.controls.target.set(0, 0, 0)
  }

  setAutoRotate(enabled: boolean) {
    this.autoRotate = enabled
  }

  setClipPlaneY(y: number) {
    this.clipPlane.constant = -y
    this.updateClipPlaneVisual(y)
  }

  updateClipEnabled(enabled: boolean) {
    this.moleculeGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
        const mat = child.material as THREE.MeshPhysicalMaterial
        if (mat.clippingPlanes) {
          mat.clippingPlanes = enabled ? [this.clipPlane] : []
          mat.needsUpdate = true
        }
      }
    })
    if (this.clipPlaneMesh) {
      this.clipPlaneMesh.visible = enabled
    }
    if (this.clipGridHelper) {
      this.clipGridHelper.visible = enabled
    }
  }

  private updateClipPlaneVisual(y: number) {
    if (this.clipPlaneMesh) {
      this.clipPlaneMesh.position.y = y
    }
    if (this.clipGridHelper) {
      this.clipGridHelper.position.y = y
    }
  }

  createClipPlaneVisual(y: number) {
    if (this.clipPlaneMesh) {
      this.scene.remove(this.clipPlaneMesh)
      this.clipPlaneMesh.geometry.dispose()
      ;(this.clipPlaneMesh.material as THREE.Material).dispose()
    }
    if (this.clipGridHelper) {
      this.scene.remove(this.clipGridHelper)
    }

    const planeGeo = new THREE.PlaneGeometry(10, 10)
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x4ECDC4,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    this.clipPlaneMesh = new THREE.Mesh(planeGeo, planeMat)
    this.clipPlaneMesh.rotation.x = -Math.PI / 2
    this.clipPlaneMesh.position.y = y
    this.scene.add(this.clipPlaneMesh)

    this.clipGridHelper = new THREE.GridHelper(10, 20, 0x4ECDC4, 0x2A6A64)
    this.clipGridHelper.position.y = y
    ;(this.clipGridHelper.material as THREE.Material).transparent = true
    ;(this.clipGridHelper.material as THREE.Material).opacity = 0.3
    this.scene.add(this.clipGridHelper)
  }

  private onMouseMove(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const atomIntersects = this.raycaster.intersectObjects(
      Array.from(this.atomMeshes.values()),
    )
    if (atomIntersects.length > 0) {
      const hit = atomIntersects[0].object
      const data = hit.userData
      if (data.type === 'atom') {
        this.callbacks.onHoverAtom(data.data, event.clientX, event.clientY)
        this.highlightAtom(hit as THREE.Mesh)
        return
      }
    }

    const bondIntersects = this.raycaster.intersectObjects(this.bondHitMeshes)
    if (bondIntersects.length > 0) {
      const data = bondIntersects[0].object.userData
      if (data.type === 'bond') {
        this.callbacks.onHoverBond(data.data, event.clientX, event.clientY)
        this.unhighlightAtom()
        return
      }
    }

    this.callbacks.onHoverAtom(null, 0, 0)
    this.callbacks.onHoverBond(null, 0, 0)
    this.unhighlightAtom()
  }

  private onMouseLeave() {
    this.callbacks.onHoverAtom(null, 0, 0)
    this.callbacks.onHoverBond(null, 0, 0)
    this.unhighlightAtom()
  }

  private highlightAtom(mesh: THREE.Mesh) {
    this.unhighlightAtom()
    const mat = mesh.material as THREE.MeshPhysicalMaterial
    this.currentAtomMaterial = mat
    mat.emissiveIntensity = 0.8
    mat.clearcoatRoughness = 0.0
  }

  private unhighlightAtom() {
    if (this.currentAtomMaterial) {
      this.currentAtomMaterial.emissiveIntensity = 0.25
      this.currentAtomMaterial.clearcoatRoughness = 0.05
      this.currentAtomMaterial = null
    }
  }

  private onResize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private animate() {
    if (this.disposed) return
    this.animFrameId = requestAnimationFrame(() => this.animate())

    const delta = this.clock.getDelta()

    if (this.autoRotate) {
      this.moleculeGroup.rotation.y += this.rotationSpeed * delta
    }

    if (this.fadeOpacity !== this.fadeTarget) {
      const fadeSpeed = 4
      if (this.fadeTarget > this.fadeOpacity) {
        this.fadeOpacity = Math.min(this.fadeTarget, this.fadeOpacity + fadeSpeed * delta)
      } else {
        this.fadeOpacity = Math.max(this.fadeTarget, this.fadeOpacity - fadeSpeed * delta)
      }
      this.moleculeGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.Material) {
          const mat = child.material as THREE.MeshPhysicalMaterial
          if (mat.opacity !== undefined) {
            mat.opacity = this.fadeOpacity
          }
        }
      })
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.animFrameId)
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this))
    this.renderer.domElement.removeEventListener('mouseleave', this.onMouseLeave.bind(this))
    window.removeEventListener('resize', this.onResize.bind(this))
    this.clearMolecule()
    this.renderer.dispose()
    if (this.clipPlaneMesh) {
      this.clipPlaneMesh.geometry.dispose()
      ;(this.clipPlaneMesh.material as THREE.Material).dispose()
    }
    this.container.removeChild(this.renderer.domElement)
  }
}
