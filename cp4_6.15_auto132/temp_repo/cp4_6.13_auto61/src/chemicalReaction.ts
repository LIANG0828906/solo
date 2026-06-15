import type { Atom, Bond, Molecule, BondChange, ReactionResult, ReactionType } from './moleculeStore'
import { genId, generateFormula } from './moleculeStore'

function molCenter(atoms: Atom[]): [number, number, number] {
  if (atoms.length === 0) return [0, 0, 0]
  const sum = atoms.reduce((acc, a) => [acc[0] + a.position[0], acc[1] + a.position[1], acc[2] + a.position[2]], [0, 0, 0] as [number, number, number])
  return [sum[0] / atoms.length, sum[1] / atoms.length, sum[2] / atoms.length]
}

function offsetAtoms(atoms: Atom[], offset: [number, number, number]): Atom[] {
  return atoms.map(a => ({
    ...a,
    id: genId(),
    position: [a.position[0] + offset[0], a.position[1] + offset[1], a.position[2] + offset[2]] as [number, number, number],
  }))
}

function substitution(molA: Molecule, molB: Molecule): ReactionResult {
  const centerA = molCenter(molA.atoms)
  const centerB = molCenter(molB.atoms)
  const offsetA: [number, number, number] = [-2, 0, 0]
  const offsetB: [number, number, number] = [2, 0, 0]

  const atomsA = offsetAtoms(molA.atoms, [
    offsetA[0] - centerA[0],
    offsetA[1] - centerA[1],
    offsetA[2] - centerA[2],
  ])
  const atomsB = offsetAtoms(molB.atoms, [
    offsetB[0] - centerB[0],
    offsetB[1] - centerB[1],
    offsetB[2] - centerB[2],
  ])

  const bondA = molA.bonds.length > 0 ? molA.bonds[molA.bonds.length - 1] : null
  const bondB = molB.bonds.length > 0 ? molB.bonds[0] : null

  const brokenBonds: BondChange[] = []
  const formedBonds: BondChange[] = []

  if (bondA) {
    brokenBonds.push({
      bondId: bondA.id,
      atomAId: atomsA.find((_, i) => molA.atoms[i]?.id === bondA.atomAId)?.id || bondA.atomAId,
      atomBId: atomsA.find((_, i) => molA.atoms[i]?.id === bondA.atomBId)?.id || bondA.atomBId,
      order: bondA.order,
    })
  }
  if (bondB) {
    brokenBonds.push({
      bondId: bondB.id,
      atomAId: atomsB.find((_, i) => molB.atoms[i]?.id === bondB.atomAId)?.id || bondB.atomAId,
      atomBId: atomsB.find((_, i) => molB.atoms[i]?.id === bondB.atomBId)?.id || bondB.atomBId,
      order: bondB.order,
    })
  }

  const idMapA = new Map<string, string>()
  const idMapB = new Map<string, string>()
  molA.atoms.forEach((old, i) => idMapA.set(old.id, atomsA[i].id))
  molB.atoms.forEach((old, i) => idMapB.set(old.id, atomsB[i].id))

  const remainingBondsA = molA.bonds
    .filter(b => b !== bondA)
    .map(b => ({
      id: genId(),
      atomAId: idMapA.get(b.atomAId)!,
      atomBId: idMapA.get(b.atomBId)!,
      order: b.order,
    }))

  const remainingBondsB = molB.bonds
    .filter(b => b !== bondB)
    .map(b => ({
      id: genId(),
      atomAId: idMapB.get(b.atomAId)!,
      atomBId: idMapB.get(b.atomBId)!,
      order: b.order,
    }))

  let newBond1: Bond | null = null
  let newBond2: Bond | null = null

  if (bondA && bondB) {
    const aSide = idMapA.get(bondA.atomAId)!
    const bSide = idMapB.get(bondB.atomAId)!
    const aSide2 = idMapA.get(bondA.atomBId)!
    const bSide2 = idMapB.get(bondB.atomBId)!
    newBond1 = { id: genId(), atomAId: aSide, atomBId: bSide, order: 1 }
    newBond2 = { id: genId(), atomAId: aSide2, atomBId: bSide2, order: 1 }
    formedBonds.push(
      { bondId: newBond1.id, atomAId: aSide, atomBId: bSide, order: 1 },
      { bondId: newBond2.id, atomAId: aSide2, atomBId: bSide2, order: 1 },
    )
  }

  const allAtoms = [...atomsA, ...atomsB]
  const allBonds = [...remainingBondsA, ...remainingBondsB]
  if (newBond1) allBonds.push(newBond1)
  if (newBond2) allBonds.push(newBond2)

  return {
    product: {
      id: genId(),
      name: '取代产物',
      formula: generateFormula(allAtoms),
      atoms: allAtoms,
      bonds: allBonds,
    },
    brokenBonds,
    formedBonds,
  }
}

function addition(molA: Molecule, molB: Molecule): ReactionResult {
  const centerA = molCenter(molA.atoms)
  const centerB = molCenter(molB.atoms)
  const offsetA: [number, number, number] = [-2, 0, 0]
  const offsetB: [number, number, number] = [2, 0, 0]

  const atomsA = offsetAtoms(molA.atoms, [
    offsetA[0] - centerA[0], offsetA[1] - centerA[1], offsetA[2] - centerA[2],
  ])
  const atomsB = offsetAtoms(molB.atoms, [
    offsetB[0] - centerB[0], offsetB[1] - centerB[1], offsetB[2] - centerB[2],
  ])

  const idMapA = new Map<string, string>()
  const idMapB = new Map<string, string>()
  molA.atoms.forEach((old, i) => idMapA.set(old.id, atomsA[i].id))
  molB.atoms.forEach((old, i) => idMapB.set(old.id, atomsB[i].id))

  const brokenBonds: BondChange[] = []
  const formedBonds: BondChange[] = []

  const multipleBond = molA.bonds.find(b => b.order >= 2)
  let targetAtomId = atomsA.length > 0 ? atomsA[0].id : ''

  if (multipleBond) {
    brokenBonds.push({
      bondId: multipleBond.id,
      atomAId: idMapA.get(multipleBond.atomAId)!,
      atomBId: idMapA.get(multipleBond.atomBId)!,
      order: multipleBond.order,
    })
    targetAtomId = idMapA.get(multipleBond.atomAId)!
  }

  const bondsA = molA.bonds.map(b => {
    if (b === multipleBond) {
      return { id: genId(), atomAId: idMapA.get(b.atomAId)!, atomBId: idMapA.get(b.atomBId)!, order: (b.order - 1) as 1 | 2 | 3 }
    }
    return { id: genId(), atomAId: idMapA.get(b.atomAId)!, atomBId: idMapA.get(b.atomBId)!, order: b.order }
  })

  const bondsB = molB.bonds.map(b => ({
    id: genId(),
    atomAId: idMapB.get(b.atomAId)!,
    atomBId: idMapB.get(b.atomBId)!,
    order: b.order,
  }))

  const firstBAtom = atomsB.length > 0 ? atomsB[0].id : ''
  const newBond: Bond = { id: genId(), atomAId: targetAtomId, atomBId: firstBAtom, order: 1 }
  formedBonds.push({ bondId: newBond.id, atomAId: targetAtomId, atomBId: firstBAtom, order: 1 })

  const allAtoms = [...atomsA, ...atomsB]
  const allBonds = [...bondsA, ...bondsB, newBond]

  return {
    product: {
      id: genId(),
      name: '加成产物',
      formula: generateFormula(allAtoms),
      atoms: allAtoms,
      bonds: allBonds,
    },
    brokenBonds,
    formedBonds,
  }
}

function elimination(molA: Molecule, molB: Molecule): ReactionResult {
  const centerA = molCenter(molA.atoms)
  const offsetA: [number, number, number] = [0, 0, 0]
  const atomsA = offsetAtoms(molA.atoms, [
    offsetA[0] - centerA[0], offsetA[1] - centerA[1], offsetA[2] - centerA[2],
  ])

  const idMapA = new Map<string, string>()
  molA.atoms.forEach((old, i) => idMapA.set(old.id, atomsA[i].id))

  const brokenBonds: BondChange[] = []
  const formedBonds: BondChange[] = []

  const hydrogenAtom = atomsA.find(a => a.element === 'H')
  const neighborBond = hydrogenAtom
    ? molA.bonds.find(b => b.atomAId === molA.atoms.find(a => a.id === hydrogenAtom.id.replace(atomsA[0].id.substring(3), ''))?.id || b.atomBId === hydrogenAtom.id)
    : null

  let eliminatedAtomIds: string[] = []
  let carbonNeighborId = ''

  if (hydrogenAtom && molA.bonds.length > 0) {
    const hBond = molA.bonds.find(b =>
      molA.atoms.find(a => a.id === b.atomAId)?.element === 'H' ||
      molA.atoms.find(a => a.id === b.atomBId)?.element === 'H'
    )
    if (hBond) {
      const carbonId = molA.atoms.find(a => a.id === hBond.atomAId)?.element === 'H' ? hBond.atomBId : hBond.atomAId
      carbonNeighborId = idMapA.get(carbonId)!
      const hId = idMapA.get(molA.atoms.find(a => a.id === hBond.atomAId)?.element === 'H' ? hBond.atomAId : hBond.atomBId)!
      eliminatedAtomIds.push(hId)
      brokenBonds.push({
        bondId: hBond.id,
        atomAId: idMapA.get(hBond.atomAId)!,
        atomBId: idMapA.get(hBond.atomBId)!,
        order: hBond.order,
      })
    }
  }

  const h2Atom = atomsA.filter(a => a.element === 'H')
  if (h2Atom.length >= 2 && eliminatedAtomIds.length < 2) {
    eliminatedAtomIds = [h2Atom[h2Atom.length - 1].id, h2Atom[h2Atom.length - 2].id]
    const bondToRemove = molA.bonds.find(b => {
      const aId = idMapA.get(b.atomAId)!
      const bId = idMapA.get(b.atomBId)!
      return eliminatedAtomIds.includes(aId) || eliminatedAtomIds.includes(bId)
    })
    if (bondToRemove) {
      brokenBonds.push({
        bondId: bondToRemove.id,
        atomAId: idMapA.get(bondToRemove.atomAId)!,
        atomBId: idMapA.get(bondToRemove.atomBId)!,
        order: bondToRemove.order,
      })
    }
  }

  const remainingAtoms = atomsA.filter(a => !eliminatedAtomIds.includes(a.id))
  const remainingBonds = molA.bonds
    .filter(b => {
      const aId = idMapA.get(b.atomAId)!
      const bId = idMapA.get(b.atomBId)!
      return !eliminatedAtomIds.includes(aId) && !eliminatedAtomIds.includes(bId)
    })
    .map(b => ({
      id: genId(),
      atomAId: idMapA.get(b.atomAId)!,
      atomBId: idMapA.get(b.atomBId)!,
      order: b.order,
    }))

  if (carbonNeighborId && remainingAtoms.length >= 2) {
    const cAtoms = remainingAtoms.filter(a => a.element === 'C')
    if (cAtoms.length >= 2) {
      const existingBond = remainingBonds.find(b =>
        (b.atomAId === cAtoms[0].id && b.atomBId === cAtoms[1].id) ||
        (b.atomAId === cAtoms[1].id && b.atomBId === cAtoms[0].id)
      )
      if (existingBond) {
        existingBond.order = Math.min(existingBond.order + 1, 3) as 1 | 2 | 3
        formedBonds.push({
          bondId: existingBond.id,
          atomAId: existingBond.atomAId,
          atomBId: existingBond.atomBId,
          order: existingBond.order,
        })
      } else {
        const newBond: Bond = { id: genId(), atomAId: cAtoms[0].id, atomBId: cAtoms[1].id, order: 2 }
        remainingBonds.push(newBond)
        formedBonds.push({
          bondId: newBond.id,
          atomAId: cAtoms[0].id,
          atomBId: cAtoms[1].id,
          order: 2,
        })
      }
    }
  }

  const center = molCenter(remainingAtoms)
  const centeredAtoms = remainingAtoms.map(a => ({
    ...a,
    position: [a.position[0] - center[0], a.position[1] - center[1], a.position[2] - center[2]] as [number, number, number],
  }))

  return {
    product: {
      id: genId(),
      name: '消除产物',
      formula: generateFormula(centeredAtoms),
      atoms: centeredAtoms,
      bonds: remainingBonds,
    },
    brokenBonds,
    formedBonds,
  }
}

export function executeReaction(
  molA: Molecule,
  molB: Molecule,
  type: ReactionType
): ReactionResult {
  switch (type) {
    case 'substitution':
      return substitution(molA, molB)
    case 'addition':
      return addition(molA, molB)
    case 'elimination':
      return elimination(molA, molB)
  }
}
