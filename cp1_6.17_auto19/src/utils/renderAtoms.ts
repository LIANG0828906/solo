import * as THREE from 'three'
import type { Atom, Bond } from '@/store'

export const BOND_RADIUS = 0.15

export function createAtomGeometry(radius: number): THREE.SphereGeometry {
  return new THREE.SphereGeometry(radius, 32, 32)
}

export function createAtomMaterial(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.85,
    roughness: 0.3,
    metalness: 0.1,
  })
}

export function createBondMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.5,
    metalness: 0.3,
  })
}

export function createBondGeometry(length: number): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(BOND_RADIUS, BOND_RADIUS, length, 16, 1)
}

export function getBondTransform(
  from: Atom,
  to: Atom,
): { position: THREE.Vector3; rotation: THREE.Euler; length: number } {
  const start = new THREE.Vector3(from.x, from.y, from.z)
  const end = new THREE.Vector3(to.x, to.y, to.z)
  const direction = new THREE.Vector3().subVectors(end, start)
  const length = direction.length()
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  const rotation = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    ),
  )

  return { position, rotation, length }
}

export interface AtomMeshData {
  geometry: THREE.SphereGeometry
  material: THREE.MeshStandardMaterial
  position: [number, number, number]
  element: string
}

export interface BondMeshData {
  geometry: THREE.CylinderGeometry
  material: THREE.MeshStandardMaterial
  position: [number, number, number]
  rotation: [number, number, number]
}

export function generateAtomMeshes(atoms: Atom[]): AtomMeshData[] {
  const materialCache = new Map<string, THREE.MeshStandardMaterial>()
  const geometryCache = new Map<number, THREE.SphereGeometry>()

  return atoms.map((atom) => {
    if (!materialCache.has(atom.color)) {
      materialCache.set(atom.color, createAtomMaterial(atom.color))
    }
    if (!geometryCache.has(atom.radius)) {
      geometryCache.set(atom.radius, createAtomGeometry(atom.radius))
    }

    return {
      geometry: geometryCache.get(atom.radius)!,
      material: materialCache.get(atom.color)!,
      position: [atom.x, atom.y, atom.z] as [number, number, number],
      element: atom.element,
    }
  })
}

export function generateBondMeshes(atoms: Atom[], bonds: Bond[]): BondMeshData[] {
  const material = createBondMaterial()

  return bonds.map((bond) => {
    const fromAtom = atoms[bond.from]
    const toAtom = atoms[bond.to]
    const { position, rotation, length } = getBondTransform(fromAtom, toAtom)
    const geometry = createBondGeometry(length)

    return {
      geometry,
      material,
      position: [position.x, position.y, position.z] as [number, number, number],
      rotation: [rotation.x, rotation.y, rotation.z] as [number, number, number],
    }
  })
}

export function disposeGeometry(geometry: THREE.BufferGeometry): void {
  geometry.dispose()
}

export function disposeMaterial(material: THREE.Material): void {
  material.dispose()
}
