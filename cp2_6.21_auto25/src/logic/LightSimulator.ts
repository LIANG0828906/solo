import * as THREE from 'three'
import { useRef } from 'react'
import type { Atom, Bond } from './MoleculeData'

export interface LightCalculationResult {
  lightIntensity: number
  atomIntensities: Map<string, number>
  bondEnergies: Map<string, { value: number; exceedsThreshold: boolean }>
}

export class LightSimulator {
  private lightDir = new THREE.Vector3(0, 0, 1)
  private readonly energyThreshold = 600

  updateLightPosition(screenX: number, screenY: number, viewportWidth: number, viewportHeight: number): void {
    const ndcX = (screenX / viewportWidth) * 2 - 1
    const ndcY = -(screenY / viewportHeight) * 2 + 1
    this.lightDir.set(ndcX, ndcY, 1).normalize()
  }

  computePhong(
    atom: Atom,
    cameraPosition: THREE.Vector3,
    ambientIntensity: number,
  ): number {
    const pos = new THREE.Vector3(...atom.position)
    const toCamera = cameraPosition.clone().sub(pos).normalize()
    const normal = toCamera.clone()

    const diffuse = Math.max(0, normal.dot(this.lightDir))

    const reflectDir = this.lightDir.clone().reflect(normal)
    const specular = Math.pow(Math.max(0, reflectDir.dot(toCamera)), 32) * 0.6

    return ambientIntensity * 0.3 + diffuse * 0.5 + specular
  }

  computeAll(
    atoms: Atom[],
    bonds: Bond[],
    cameraPosition: THREE.Vector3,
  ): LightCalculationResult {
    const atomIntensities = new Map<string, number>()

    for (const atom of atoms) {
      const intensity = this.computePhong(atom, cameraPosition, 1.0)
      atomIntensities.set(atom.id, intensity)
    }

    const bondEnergies = new Map<string, { value: number; exceedsThreshold: boolean }>()

    for (const bond of bonds) {
      const aA = atoms.find(a => a.id === bond.atomAId)
      const aB = atoms.find(a => a.id === bond.atomBId)
      if (!aA || !aB) continue

      const midPos = new THREE.Vector3(
        (aA.position[0] + aB.position[0]) / 2,
        (aA.position[1] + aB.position[1]) / 2,
        (aA.position[2] + aB.position[2]) / 2,
      )
      const normal = cameraPosition.clone().sub(midPos).normalize()
      const dotFactor = Math.max(0, normal.dot(this.lightDir))
      const modulatedEnergy = bond.energy * (0.5 + dotFactor * 0.8)

      bondEnergies.set(bond.id, {
        value: Math.round(modulatedEnergy),
        exceedsThreshold: modulatedEnergy > this.energyThreshold,
      })
    }

    const lightIntensity = this.lightDir.length()

    return { lightIntensity, atomIntensities, bondEnergies }
  }

  getLightDirection(): THREE.Vector3 {
    return this.lightDir.clone()
  }
}

export function useLightSimulator(): LightSimulator {
  const simulatorRef = useRef(new LightSimulator())
  return simulatorRef.current
}
