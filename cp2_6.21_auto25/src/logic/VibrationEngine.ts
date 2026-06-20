import { useRef, useCallback } from 'react'
import type { Atom, Bond } from './MoleculeData'

interface BondVibrationState {
  amplitude: number
  phase: number
  direction: [number, number, number]
}

export class VibrationEngine {
  private bondStates = new Map<string, BondVibrationState>()
  private lastTime = 0
  private fpsHistory: number[] = []
  private reducedPrecision = false

  initBondStates(bonds: Bond[], atoms: Atom[]): void {
    this.bondStates.clear()
    const atomMap = new Map(atoms.map(a => [a.id, a]))

    for (const bond of bonds) {
      const aA = atomMap.get(bond.atomAId)
      const aB = atomMap.get(bond.atomBId)
      if (!aA || !aB) continue

      const dx = aB.position[0] - aA.position[0]
      const dy = aB.position[1] - aA.position[1]
      const dz = aB.position[2] - aA.position[2]
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

      this.bondStates.set(bond.id, {
        amplitude: 0.05 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        direction: [dx / len, dy / len, dz / len],
      })
    }
  }

  computeOffsets(
    bonds: Bond[],
    atoms: Atom[],
    frequency: number,
    time: number,
  ): Map<string, Float32Array> {
    const offsets = new Map<string, Float32Array>()
    const now = performance.now()

    if (this.lastTime > 0) {
      const dt = now - this.lastTime
      const fps = 1000 / dt
      this.fpsHistory.push(fps)
      if (this.fpsHistory.length > 30) this.fpsHistory.shift()
      const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
      this.reducedPrecision = avgFps < 30
    }
    this.lastTime = now

    for (const atom of atoms) {
      offsets.set(atom.id, new Float32Array(3))
    }

    const angularFreq = 2 * Math.PI * frequency
    const step = this.reducedPrecision ? 2 : 1
    const bondArray = this.reducedPrecision ? bonds.filter((_, i) => i % 2 === 0) : bonds

    for (let bi = 0; bi < bondArray.length; bi += step) {
      const bond = bondArray[bi]
      const state = this.bondStates.get(bond.id)
      if (!state) continue

      const displacement = state.amplitude * Math.sin(angularFreq * time + state.phase)
      const dx = state.direction[0] * displacement * 0.5
      const dy = state.direction[1] * displacement * 0.5
      const dz = state.direction[2] * displacement * 0.5

      const offsetA = offsets.get(bond.atomAId)
      if (offsetA) {
        offsetA[0] += dx
        offsetA[1] += dy
        offsetA[2] += dz
      }

      const offsetB = offsets.get(bond.atomBId)
      if (offsetB) {
        offsetB[0] -= dx
        offsetB[1] -= dy
        offsetB[2] -= dz
      }
    }

    return offsets
  }

  isReducedPrecision(): boolean {
    return this.reducedPrecision
  }
}

export function useVibrationEngine(): VibrationEngine {
  const engineRef = useRef(new VibrationEngine())
  return engineRef.current
}
