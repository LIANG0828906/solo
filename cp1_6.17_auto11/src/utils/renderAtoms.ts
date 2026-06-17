import * as THREE from 'three'
import type { Atom, Bond } from '../types'

export function getBondGeometry(
  from: [number, number, number],
  to: [number, number, number]
): { position: [number, number, number]; rotation: [number, number, number]; length: number } {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const direction = new THREE.Vector3().subVectors(end, start)
  const length = direction.length()
  const position = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)

  const quaternion = new THREE.Quaternion()
  quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  )
  const euler = new THREE.Euler().setFromQuaternion(quaternion)

  return {
    position: position.toArray() as [number, number, number],
    rotation: [euler.x, euler.y, euler.z],
    length
  }
}

export function computeCentroid(atoms: Atom[]): [number, number, number] {
  if (atoms.length === 0) return [0, 0, 0]
  const sum = atoms.reduce(
    (acc, atom) => [
      acc[0] + atom.position[0],
      acc[1] + atom.position[1],
      acc[2] + atom.position[2]
    ],
    [0, 0, 0]
  )
  return [sum[0] / atoms.length, sum[1] / atoms.length, sum[2] / atoms.length]
}

export function getAtomsAndBonds(atoms: Atom[], bonds: Bond[]) {
  const centroid = computeCentroid(atoms)
  const centeredAtoms = atoms.map((atom) => ({
    ...atom,
    position: [
      atom.position[0] - centroid[0],
      atom.position[1] - centroid[1],
      atom.position[2] - centroid[2]
    ] as [number, number, number]
  }))

  const processedBonds = bonds.map((bond) => {
    const fromAtom = centeredAtoms[bond.from]
    const toAtom = centeredAtoms[bond.to]
    const { position, rotation, length } = getBondGeometry(
      fromAtom.position,
      toAtom.position
    )
    return { position, rotation, length, from: bond.from, to: bond.to }
  })

  return { atoms: centeredAtoms, bonds: processedBonds }
}
