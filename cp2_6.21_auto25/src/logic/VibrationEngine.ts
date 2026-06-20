import type { Atom, Bond } from './MoleculeData'

interface BondVibrationState {
  amplitude: number
  phase: number
  basePhase: number
  direction: [number, number, number]
  order: number
}

interface AtomAdjacency {
  neighbors: string[]
  element: string
  depthLevel: number
}

export class VibrationEngine {
  private bondStates = new Map<string, BondVibrationState>()
  private adjacency = new Map<string, AtomAdjacency>()
  private lastTime = 0
  private fpsHistory: number[] = []
  private reducedPrecision = false
  private waveSpeed = 1.8

  initBondStates(bonds: Bond[], atoms: Atom[]): void {
    this.bondStates.clear()
    this.adjacency.clear()
    const atomMap = new Map(atoms.map(a => [a.id, a]))

    for (const atom of atoms) {
      this.adjacency.set(atom.id, {
        neighbors: [],
        element: atom.element,
        depthLevel: 0,
      })
    }

    for (const bond of bonds) {
      const adjA = this.adjacency.get(bond.atomAId)
      const adjB = this.adjacency.get(bond.atomBId)
      if (adjA && adjB) {
        adjA.neighbors.push(bond.atomBId)
        adjB.neighbors.push(bond.atomAId)
      }
    }

    if (atoms.length > 0) {
      this.computeDepthLevels(atoms[0].id)
    }

    for (const bond of bonds) {
      const aA = atomMap.get(bond.atomAId)
      const aB = atomMap.get(bond.atomBId)
      if (!aA || !aB) continue

      const dx = aB.position[0] - aA.position[0]
      const dy = aB.position[1] - aA.position[1]
      const dz = aB.position[2] - aA.position[2]
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

      const adjA = this.adjacency.get(bond.atomAId)
      const depth = adjA?.depthLevel ?? 0
      const basePhase = (depth / Math.max(1, this.maxDepthLevel())) * Math.PI * 2
      const amplitude = 0.05 + Math.random() * 0.15

      this.bondStates.set(bond.id, {
        amplitude,
        phase: basePhase,
        basePhase,
        direction: [dx / len, dy / len, dz / len],
        order: bond.order,
      })
    }
  }

  private computeDepthLevels(startId: string): void {
    const visited = new Set<string>()
    const queue: { id: string; depth: number }[] = [{ id: startId, depth: 0 }]
    visited.add(startId)

    while (queue.length > 0) {
      const current = queue.shift()!
      const adj = this.adjacency.get(current.id)
      if (!adj) continue
      adj.depthLevel = current.depth

      for (const neighborId of adj.neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          queue.push({ id: neighborId, depth: current.depth + 1 })
        }
      }
    }
  }

  private maxDepthLevel(): number {
    let max = 0
    for (const adj of this.adjacency.values()) {
      if (adj.depthLevel > max) max = adj.depthLevel
    }
    return Math.max(1, max)
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

      const adjA = this.adjacency.get(bond.atomAId)
      const adjB = this.adjacency.get(bond.atomBId)
      if (!adjA || !adjB) continue

      const sameElementFactor = adjA.element === adjB.element ? 1.0 : 0.6
      const depthFactor = (adjA.depthLevel + adjB.depthLevel) / (2 * this.maxDepthLevel())
      const wavePhase = time * this.waveSpeed * (1 + depthFactor * 0.5)
      const phaseShift = state.basePhase + wavePhase * sameElementFactor * state.order
      const finalPhase = angularFreq * time * 0.5 + phaseShift

      const displacement = state.amplitude * Math.sin(finalPhase)
      const dx = state.direction[0] * displacement * 0.5 * sameElementFactor
      const dy = state.direction[1] * displacement * 0.5 * sameElementFactor
      const dz = state.direction[2] * displacement * 0.5 * sameElementFactor

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
