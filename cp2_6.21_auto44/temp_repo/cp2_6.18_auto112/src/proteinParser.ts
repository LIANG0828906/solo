import * as THREE from 'three'

export interface AtomData {
  id: number
  element: string
  x: number
  y: number
  z: number
}

export type BondType = 'single' | 'double' | 'triple'

export interface BondData {
  atomIndex1: number
  atomIndex2: number
  type: BondType
}

export interface ParsedMolecule {
  atoms: AtomData[]
  bonds: BondData[]
}

import proteinData from './data/proteinData.json'

const ELEMENT_RADII: Record<string, number> = {
  C: 0.4,
  O: 0.35,
  N: 0.38,
  S: 0.5,
  H: 0.25
}

const ELEMENT_COLORS: Record<string, number> = {
  C: 0x808080,
  O: 0xFF0D0D,
  N: 0x3050F8,
  S: 0xFFFF30,
  H: 0xFFFFFF
}

export function getElementColor(element: string): number {
  return ELEMENT_COLORS[element] ?? 0x808080
}

export function getElementRadius(element: string, scale: number = 1): number {
  return (ELEMENT_RADII[element] ?? 0.4) * scale
}

export function parseProteinData(): ParsedMolecule {
  const atoms: AtomData[] = proteinData.atoms.map((a: any) => ({
    id: a.id,
    element: a.element,
    x: a.x,
    y: a.y,
    z: a.z
  }))

  const bonds: BondData[] = proteinData.bonds.map((b: any) => ({
    atomIndex1: b.atomIndex1 ?? b[0],
    atomIndex2: b.atomIndex2 ?? b[1],
    type: (b.type as BondType) ?? 'single'
  }))

  return { atoms, bonds }
}

export function createAtomGeometries(atoms: AtomData[]): {
  meshes: THREE.Mesh[]
  positions: THREE.Vector3[]
  elements: string[]
} {
  const meshes: THREE.Mesh[] = []
  const positions: THREE.Vector3[] = []
  const elements: string[] = []

  atoms.forEach((atom) => {
    const color = getElementColor(atom.element)
    const geometry = new THREE.SphereGeometry(getElementRadius(atom.element), 16, 16)
    const material = new THREE.MeshPhongMaterial({
      color,
      shininess: 80,
      specular: 0x222222
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(atom.x, atom.y, atom.z)
    mesh.userData = { atomId: atom.id, element: atom.element, originalColor: color }
    meshes.push(mesh)
    positions.push(new THREE.Vector3(atom.x, atom.y, atom.z))
    elements.push(atom.element)
  })

  return { meshes, positions, elements }
}

export function createBondLines(bonds: BondData[], atomPositions: THREE.Vector3[]): THREE.LineSegments {
  const points: THREE.Vector3[] = []

  bonds.forEach((bond) => {
    const p1 = atomPositions[bond.atomIndex1]
    const p2 = atomPositions[bond.atomIndex2]
    if (p1 && p2) {
      points.push(p1.clone(), p2.clone())
    }
  })

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ color: 0x555555 })
  return new THREE.LineSegments(geometry, material)
}

const SINGLE_BOND_RADIUS = 0.08
const DOUBLE_BOND_RADIUS = 0.045
const DOUBLE_BOND_OFFSET = 0.09

export function createBondCylinders(
  bonds: BondData[],
  atomPositions: THREE.Vector3[],
  atomElements: string[]
): THREE.Group {
  const group = new THREE.Group()

  bonds.forEach((bond) => {
    const p1 = atomPositions[bond.atomIndex1]
    const p2 = atomPositions[bond.atomIndex2]
    if (!p1 || !p2) return

    if (bond.type === 'double') {
      createDoubleBondCylinders(group, p1, p2)
    } else {
      createSingleBondCylinder(group, p1, p2)
    }
  })

  return group
}

function createSingleBondCylinder(
  group: THREE.Group,
  p1: THREE.Vector3,
  p2: THREE.Vector3
): void {
  const direction = new THREE.Vector3().subVectors(p2, p1)
  const length = direction.length()
  const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)

  const geometry = new THREE.CylinderGeometry(SINGLE_BOND_RADIUS, SINGLE_BOND_RADIUS, length, 8)
  const material = new THREE.MeshPhongMaterial({ color: 0x666666, shininess: 40 })
  const cylinder = new THREE.Mesh(geometry, material)

  cylinder.position.copy(midPoint)
  cylinder.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  )
  cylinder.userData = { bondType: 'single' }

  group.add(cylinder)
}

function createDoubleBondCylinders(
  group: THREE.Group,
  p1: THREE.Vector3,
  p2: THREE.Vector3
): void {
  const direction = new THREE.Vector3().subVectors(p2, p1)
  const length = direction.length()
  const dirNormalized = direction.clone().normalize()
  const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)

  const up = new THREE.Vector3(0, 1, 0)
  let perpendicular = new THREE.Vector3().crossVectors(dirNormalized, up)
  if (perpendicular.lengthSq() < 0.001) {
    perpendicular.set(1, 0, 0)
  }
  perpendicular.normalize().multiplyScalar(DOUBLE_BOND_OFFSET)

  for (let i = -1; i <= 1; i += 2) {
    const offset = perpendicular.clone().multiplyScalar(i)
    const offsetP1 = p1.clone().add(offset)
    const offsetP2 = p2.clone().add(offset)
    const offsetMid = new THREE.Vector3().addVectors(offsetP1, offsetP2).multiplyScalar(0.5)

    const geometry = new THREE.CylinderGeometry(DOUBLE_BOND_RADIUS, DOUBLE_BOND_RADIUS, length, 8)
    const material = new THREE.MeshPhongMaterial({ color: 0x777777, shininess: 40 })
    const cylinder = new THREE.Mesh(geometry, material)

    cylinder.position.copy(offsetMid)
    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dirNormalized
    )
    cylinder.userData = { bondType: 'double' }

    group.add(cylinder)
  }
}

export function createGlowSpheres(
  atomPositions: THREE.Vector3[],
  atomElements: string[]
): { group: THREE.Group; spheres: THREE.Mesh[] } {
  const group = new THREE.Group()
  group.name = 'glowSpheres'
  group.visible = false

  const spheres: THREE.Mesh[] = []

  atomPositions.forEach((pos, index) => {
    const color = getElementColor(atomElements[index])
    const baseRadius = getElementRadius(atomElements[index])

    const geometry = new THREE.SphereGeometry(baseRadius * 1.5, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.copy(pos)
    sphere.userData = { atomIndex: index }

    spheres.push(sphere)
    group.add(sphere)
  })

  return { group, spheres }
}

export function projectAtomToScreen(
  atomPosition: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number
): { x: number; y: number; visible: boolean } {
  const vector = atomPosition.clone().project(camera)
  const x = (vector.x * 0.5 + 0.5) * width
  const y = (-vector.y * 0.5 + 0.5) * height
  const visible = vector.z > -1 && vector.z < 1
  return { x, y, visible }
}
