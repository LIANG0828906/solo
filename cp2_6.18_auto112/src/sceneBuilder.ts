import * as THREE from 'three'
import {
  ParsedMolecule,
  createAtomGeometries,
  createBondCylinders,
  getElementRadius
} from './proteinParser'

export type DisplayMode = 'ball-stick' | 'space-filling' | 'wireframe'

export interface MoleculeGroup {
  atomGroup: THREE.Group
  bondGroup: THREE.Group
  atomMeshes: THREE.Mesh[]
  originalRadii: number[]
}

export function buildMoleculeScene(molecule: ParsedMolecule): MoleculeGroup {
  const { meshes: atomMeshes, positions, elements } = createAtomGeometries(molecule.atoms)

  const atomGroup = new THREE.Group()
  atomMeshes.forEach((mesh) => atomGroup.add(mesh))

  const bondGroup = createBondCylinders(molecule.bonds, positions, elements)

  const originalRadii = molecule.atoms.map((atom) => getElementRadius(atom.element))

  return { atomGroup, bondGroup, atomMeshes, originalRadii }
}

export function setupLights(scene: THREE.Scene): void {
  const ambientLight = new THREE.AmbientLight(0x404050, 0.6)
  scene.add(ambientLight)

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0)
  directionalLight1.position.set(5, 10, 7)
  scene.add(directionalLight1)

  const directionalLight2 = new THREE.DirectionalLight(0x6080ff, 0.3)
  directionalLight2.position.set(-5, -3, -5)
  scene.add(directionalLight2)

  const hemisphereLight = new THREE.HemisphereLight(0x8090ff, 0x202040, 0.4)
  scene.add(hemisphereLight)
}

export function createGlowMaterial(originalColor: number): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    color: originalColor,
    emissive: originalColor,
    emissiveIntensity: 0.6,
    shininess: 100
  })
}

export function setDisplayMode(
  group: MoleculeGroup,
  mode: DisplayMode,
  animate: boolean = true
): void {
  const { atomMeshes, bondGroup, originalRadii } = group

  if (animate) {
    animateDisplayMode(group, mode)
    return
  }

  applyDisplayModeImmediate(group, mode)
}

function applyDisplayModeImmediate(group: MoleculeGroup, mode: DisplayMode): void {
  const { atomMeshes, bondGroup, originalRadii } = group

  atomMeshes.forEach((mesh, index) => {
    const material = mesh.material as THREE.MeshPhongMaterial
    const baseRadius = group.originalRadii[index]

    if (mode === 'ball-stick') {
      material.wireframe = false
      mesh.scale.setScalar(1)
      mesh.visible = true
    } else if (mode === 'space-filling') {
      material.wireframe = false
      mesh.scale.setScalar(2.2)
      mesh.visible = true
    } else if (mode === 'wireframe') {
      material.wireframe = true
      mesh.scale.setScalar(1)
      mesh.visible = true
    }
  })

  if (mode === 'space-filling') {
    bondGroup.visible = false
  } else {
    bondGroup.visible = true
    bondGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshPhongMaterial
        mat.wireframe = mode === 'wireframe'
      }
    })
  }
}

let animationId: number | null = null
let currentAnimation: {
  startRadii: number[]
  targetRadii: number[]
  startTime: number
  duration: number
  mode: DisplayMode
  group: MoleculeGroup
} | null = null

function animateDisplayMode(group: MoleculeGroup, mode: DisplayMode): void {
  if (animationId !== null) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  const duration = 500
  const startTime = performance.now()

  const startRadii: number[] = []
  const targetRadii: number[] = []
  const targetScale = mode === 'space-filling' ? 2.2 : 1.0

  group.atomMeshes.forEach((mesh, index) => {
    startRadii.push(mesh.scale.x)
    targetRadii.push(targetScale)
  })

  currentAnimation = {
    startRadii,
    targetRadii,
    startTime,
    duration,
    mode,
    group
  }

  if (mode === 'space-filling') {
    group.bondGroup.visible = true
    fadeBondGroup(group.bondGroup, 0, duration)
  } else if (currentAnimation && currentAnimation.mode === 'space-filling') {
    group.bondGroup.visible = true
    fadeBondGroup(group.bondGroup, 1, duration)
  }

  function step() {
    if (!currentAnimation) return

    const elapsed = performance.now() - currentAnimation.startTime
    const t = Math.min(elapsed / currentAnimation.duration, 1)
    const eased = easeInOutCubic(t)

    currentAnimation.group.atomMeshes.forEach((mesh, index) => {
      const start = currentAnimation!.startRadii[index]
      const target = currentAnimation!.targetRadii[index]
      const current = start + (target - start) * eased
      mesh.scale.setScalar(current)
    })

    if (currentAnimation.mode === 'wireframe' || t > 0.5) {
      updateWireframeState(currentAnimation.group, currentAnimation.mode)
    }

    if (t < 1) {
      animationId = requestAnimationFrame(step)
    } else {
      applyDisplayModeImmediate(currentAnimation.group, currentAnimation.mode)
      animationId = null
      currentAnimation = null
    }
  }

  animationId = requestAnimationFrame(step)
}

function updateWireframeState(group: MoleculeGroup, mode: DisplayMode): void {
  group.atomMeshes.forEach((mesh) => {
    const material = mesh.material as THREE.MeshPhongMaterial
    material.wireframe = mode === 'wireframe'
  })

  group.bondGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshPhongMaterial
      mat.wireframe = mode === 'wireframe'
    }
  })
}

function fadeBondGroup(group: THREE.Group, targetOpacity: number, duration: number): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshPhongMaterial
      mat.transparent = true
    }
  })
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function getBoundingBox(molecule: ParsedMolecule): THREE.Box3 {
  const box = new THREE.Box3()
  molecule.atoms.forEach((atom) => {
    box.expandByPoint(new THREE.Vector3(atom.x, atom.y, atom.z))
  })
  return box
}
