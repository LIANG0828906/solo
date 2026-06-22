export interface Atom {
  id: string
  element: string
  position: [number, number, number]
  radius: number
  color: string
}

export interface Bond {
  id: string
  atomAId: string
  atomBId: string
  order: number
  equilibriumLength: number
  energy: number
}

export interface MoleculePreset {
  id: string
  name: string
  formula: string
  atoms: Atom[]
  bonds: Bond[]
}

export const ATOM_RADII: Record<string, number> = {
  C: 0.4,
  H: 0.25,
  O: 0.35,
  N: 0.35,
}

export const ATOM_COLORS: Record<string, string> = {
  C: '#808080',
  H: '#ffffff',
  O: '#ff4444',
  N: '#4444ff',
}

type RawAtom = [string, number, number, number]
type RawBond = [number, number, number, number]

interface RawMolecule {
  atoms: RawAtom[]
  bonds: RawBond[]
}

const SCALE = 0.6

function buildMoleculeFromRaw(
  id: string,
  name: string,
  formula: string,
  raw: RawMolecule,
): MoleculePreset {
  const atoms: Atom[] = raw.atoms.map(([element, x, y, z], i) => ({
    id: `atom_${i}`,
    element,
    position: [x * SCALE, y * SCALE, z * SCALE],
    radius: ATOM_RADII[element] ?? 0.3,
    color: ATOM_COLORS[element] ?? '#ff00ff',
  }))

  const bonds: Bond[] = raw.bonds.map(([aIdx, bIdx, order, energy], i) => {
    const aA = atoms[aIdx]
    const aB = atoms[bIdx]
    const dx = aB.position[0] - aA.position[0]
    const dy = aB.position[1] - aA.position[1]
    const dz = aB.position[2] - aA.position[2]
    const eqLen = Math.sqrt(dx * dx + dy * dy + dz * dz)

    return {
      id: `bond_${i}`,
      atomAId: aA.id,
      atomBId: aB.id,
      order,
      equilibriumLength: eqLen,
      energy,
    }
  })

  return { id, name, formula, atoms, bonds }
}

const METHANE_RAW: RawMolecule = {
  atoms: [
    ['C',  0.00000,  0.00000,  0.00000],
    ['H',  0.62760,  0.62760,  0.62760],
    ['H', -0.62760, -0.62760,  0.62760],
    ['H', -0.62760,  0.62760, -0.62760],
    ['H',  0.62760, -0.62760, -0.62760],
  ],
  bonds: [
    [0, 1, 1, 413],
    [0, 2, 1, 413],
    [0, 3, 1, 413],
    [0, 4, 1, 413],
  ],
}

const BENZENE_CC = 1.39
const BENZENE_CH = 1.09

function buildBenzeneRaw(): RawMolecule {
  const atoms: RawAtom[] = []
  const bonds: RawBond[] = []
  const R = BENZENE_CC
  const HR = R + BENZENE_CH

  for (let i = 0; i < 6; i++) {
    const theta = (Math.PI / 3) * i
    atoms.push(['C', R * Math.cos(theta), R * Math.sin(theta), 0])
  }
  for (let i = 0; i < 6; i++) {
    const theta = (Math.PI / 3) * i
    atoms.push(['H', HR * Math.cos(theta), HR * Math.sin(theta), 0])
  }

  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6
    bonds.push([i, next, i % 2 === 0 ? 2 : 1, i % 2 === 0 ? 518 : 346])
  }
  for (let i = 0; i < 6; i++) {
    bonds.push([i, i + 6, 1, 413])
  }

  return { atoms, bonds }
}

const CAFFEINE_RAW: RawMolecule = {
  atoms: [
    ['N',  0.00000,  0.00000,  0.00000],
    ['C',  0.68369,  1.21062,  0.00000],
    ['N',  2.04589,  1.30873,  0.00000],
    ['C',  2.88556,  0.15144,  0.00000],
    ['N',  2.20186, -1.05918,  0.00000],
    ['C',  0.83966, -1.15729,  0.00000],
    ['C', -1.44275, -0.09816,  0.00000],
    ['C', -0.83966,  1.15729,  0.00000],
    ['O', -1.67933,  2.00695,  0.00000],
    ['O',  0.00000, -2.30795,  0.00000],
    ['C',  2.68197,  2.64812,  0.00000],
    ['H',  2.19243,  3.35144,  0.00000],
    ['H',  3.74197,  2.77344,  0.00000],
    ['H',  2.41546,  2.89303,  0.93300],
    ['C', -2.53517, -1.12169,  0.00000],
    ['H', -3.59517, -1.24701,  0.00000],
    ['H', -2.26866, -1.36660,  0.93300],
    ['H', -2.26866, -1.36660, -0.93300],
    ['C',  4.37556,  0.25144,  0.00000],
    ['H',  4.64207, -0.49147,  0.73300],
    ['H',  4.64207,  1.25144,  0.00000],
    ['H',  4.64207, -0.49147, -0.73300],
    ['C', -1.44275, -0.09816,  1.45000],
    ['H', -2.03517,  0.75184,  1.45000],
  ],
  bonds: [
    [0, 1, 1, 305],
    [1, 2, 2, 518],
    [2, 3, 1, 346],
    [3, 4, 2, 518],
    [4, 5, 1, 346],
    [5, 0, 2, 518],
    [0, 6, 1, 346],
    [1, 7, 1, 346],
    [7, 8, 2, 745],
    [5, 9, 2, 745],
    [2, 10, 1, 346],
    [10, 11, 1, 413],
    [10, 12, 1, 413],
    [10, 13, 1, 413],
    [6, 14, 1, 346],
    [14, 15, 1, 413],
    [14, 16, 1, 413],
    [14, 17, 1, 413],
    [3, 18, 1, 346],
    [18, 19, 1, 413],
    [18, 20, 1, 413],
    [18, 21, 1, 413],
    [6, 22, 1, 346],
    [22, 23, 1, 413],
  ],
}

export function createMethane(): MoleculePreset {
  return buildMoleculeFromRaw('methane', '甲烷', 'CH₄', METHANE_RAW)
}

export function createBenzene(): MoleculePreset {
  return buildMoleculeFromRaw('benzene', '苯环', 'C₆H₆', buildBenzeneRaw())
}

export function createCaffeine(): MoleculePreset {
  return buildMoleculeFromRaw('caffeine', '咖啡因', 'C₈H₁₀N₄O₂', CAFFEINE_RAW)
}

export function getMoleculePreset(id: string): MoleculePreset | undefined {
  switch (id) {
    case 'methane': return createMethane()
    case 'benzene': return createBenzene()
    case 'caffeine': return createCaffeine()
    default: return undefined
  }
}

export const MOLECULE_PRESETS = ['methane', 'benzene', 'caffeine'] as const
