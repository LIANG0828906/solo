import * as THREE from 'three'
import type { Atom, Bond } from '@/store'

export const BOND_RADIUS = 0.15

export const CPK_COLORS: Record<string, string> = {
  C: '#555555',
  O: '#ff0d0d',
  N: '#3050f8',
  H: '#ffffff',
  S: '#ffff30',
  P: '#ff8000',
  Cl: '#1ff01f',
  F: '#00ff00',
  Br: '#a52a2a',
  I: '#940094',
  Fe: '#ffa500',
  Na: '#ab5cf2',
  Mg: '#8aff00',
  Zn: '#7d80b0',
  Cu: '#c88033',
}

export function getCpkColor(element: string): string {
  return CPK_COLORS[element] || '#ff1493'
}

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
): { position: THREE.Vector3; rotation: THREE.Quaternion; length: number } {
  const start = new THREE.Vector3(from.x, from.y, from.z)
  const end = new THREE.Vector3(to.x, to.y, to.z)
  const direction = new THREE.Vector3().subVectors(end, start)
  const length = direction.length()
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  const rotation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
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
  rotation: THREE.Quaternion
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
      rotation,
    }
  })
}

export interface InstancedAtomData {
  element: string
  positions: Float32Array
  colors: string
  radius: number
}

export interface InstancedBondData {
  transforms: {
    position: THREE.Vector3
    rotation: THREE.Quaternion
    length: number
  }[]
}

export function createInstancedAtomData(
  atoms: Atom[],
): Map<string, InstancedAtomData> {
  const grouped = new Map<string, InstancedAtomData>()

  atoms.forEach((atom) => {
    const key = `${atom.element}-${atom.radius}-${atom.color}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        element: atom.element,
        positions: new Float32Array(atoms.length * 3),
        colors: atom.color,
        radius: atom.radius,
        count: 0,
      } as any)
    }
    const data = grouped.get(key)!
    const idx = (data as any).count * 3
    data.positions[idx] = atom.x
    data.positions[idx + 1] = atom.y
    data.positions[idx + 2] = atom.z
    ;(data as any).count++
  })

  return grouped
}

export function disposeGeometry(geometry: THREE.BufferGeometry): void {
  geometry.dispose()
}

export function disposeMaterial(material: THREE.Material): void {
  material.dispose()
}
