import * as THREE from 'three'

export interface AtomData {
  id: number
  element: string
  x: number
  y: number
  z: number
}

export interface BondData {
  atomIndex1: number
  atomIndex2: number
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

  const bonds: BondData[] = proteinData.bonds.map((b: number[]) => ({
    atomIndex1: b[0],
    atomIndex2: b[1]
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

export function createBondCylinders(
  bonds: BondData[],
  atomPositions: THREE.Vector3[],
  atomElements: string[]
): THREE.Group {
  const group = new THREE.Group()
  const bondRadius = 0.08

  bonds.forEach((bond) => {
    const p1 = atomPositions[bond.atomIndex1]
    const p2 = atomPositions[bond.atomIndex2]
    if (!p1 || !p2) return

    const direction = new THREE.Vector3().subVectors(p2, p1)
    const length = direction.length()
    const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)

    const geometry = new THREE.CylinderGeometry(bondRadius, bondRadius, length, 8)
    const color = 0x666666
    const material = new THREE.MeshPhongMaterial({ color, shininess: 40 })
    const cylinder = new THREE.Mesh(geometry, material)

    cylinder.position.copy(midPoint)
    cylinder.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    )

    group.add(cylinder)
  })

  return group
}
