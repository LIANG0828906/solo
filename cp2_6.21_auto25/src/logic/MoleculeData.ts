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

let atomCounter = 0

function makeAtom(element: string, position: [number, number, number]): Atom {
  atomCounter += 1
  return {
    id: `atom_${atomCounter}`,
    element,
    position,
    radius: ATOM_RADII[element] ?? 0.3,
    color: ATOM_COLORS[element] ?? '#ff00ff',
  }
}

let bondCounter = 0

function makeBond(atomAId: string, atomBId: string, order: number, energy: number): Bond {
  bondCounter += 1
  return {
    id: `bond_${bondCounter}`,
    atomAId,
    atomBId,
    order,
    equilibriumLength: 1.0,
    energy,
  }
}

export function createMethane(): MoleculePreset {
  atomCounter = 0
  bondCounter = 0

  const c = makeAtom('C', [0, 0, 0])
  const h1 = makeAtom('H', [1.09, 0, 0])
  const h2 = makeAtom('H', [-0.36, 1.03, 0])
  const h3 = makeAtom('H', [-0.36, -0.51, 0.89])
  const h4 = makeAtom('H', [-0.36, -0.51, -0.89])

  return {
    id: 'methane',
    name: '甲烷',
    formula: 'CH₄',
    atoms: [c, h1, h2, h3, h4],
    bonds: [
      makeBond(c.id, h1.id, 1, 413),
      makeBond(c.id, h2.id, 1, 413),
      makeBond(c.id, h3.id, 1, 413),
      makeBond(c.id, h4.id, 1, 413),
    ],
  }
}

export function createBenzene(): MoleculePreset {
  atomCounter = 0
  bondCounter = 0

  const r = 1.4
  const atoms: Atom[] = []
  const carbonIds: string[] = []

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const c = makeAtom('C', [r * Math.cos(angle), r * Math.sin(angle), 0])
    atoms.push(c)
    carbonIds.push(c.id)
  }

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const hR = r + 1.09
    const h = makeAtom('H', [hR * Math.cos(angle), hR * Math.sin(angle), 0])
    atoms.push(h)
  }

  const bonds: Bond[] = []
  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6
    bonds.push(makeBond(carbonIds[i], carbonIds[next], i % 2 === 0 ? 2 : 1, i % 2 === 0 ? 518 : 346))
  }
  for (let i = 0; i < 6; i++) {
    bonds.push(makeBond(carbonIds[i], atoms[6 + i].id, 1, 413))
  }

  return {
    id: 'benzene',
    name: '苯环',
    formula: 'C₆H₆',
    atoms,
    bonds,
  }
}

export function createCaffeine(): MoleculePreset {
  atomCounter = 0
  bondCounter = 0

  const atoms: Atom[] = []
  const atomMap: Record<string, string> = {}

  const positions: [string, string, [number, number, number]][] = [
    ['C1', 'C', [0, 1.2, 0]],
    ['C2', 'C', [1.04, 0.6, 0]],
    ['C3', 'C', [1.04, -0.6, 0]],
    ['C4', 'C', [0, -1.2, 0]],
    ['C5', 'C', [-1.04, -0.6, 0]],
    ['C6', 'C', [-1.04, 0.6, 0]],
    ['N1', 'N', [2.34, -0.9, 0]],
    ['N2', 'N', [2.34, 0.9, 0]],
    ['N3', 'N', [-2.34, -0.9, 0]],
    ['N4', 'N', [-2.34, 0.9, 0]],
    ['O1', 'O', [0, 2.4, 0]],
    ['O2', 'O', [0, -2.4, 0]],
    ['H1', 'H', [3.2, -1.6, 0]],
    ['H2', 'H', [3.2, 1.6, 0]],
    ['H3', 'H', [-3.2, -1.6, 0]],
    ['H4', 'H', [-3.2, 1.6, 0]],
    ['CH1_C', 'C', [-2.8, 2.2, 0]],
    ['CH1_H1', 'H', [-3.8, 1.7, 0]],
    ['CH1_H2', 'H', [-2.5, 3.2, 0]],
    ['CH1_H3', 'H', [-3.3, 2.6, -0.8]],
    ['CH2_C', 'C', [-2.8, -2.2, 0]],
    ['CH2_H1', 'H', [-3.8, -1.7, 0]],
    ['CH2_H2', 'H', [-2.5, -3.2, 0]],
    ['CH2_H3', 'H', [-3.3, -2.6, -0.8]],
  ]

  for (const [name, element, pos] of positions) {
    const a = makeAtom(element, pos)
    atoms.push(a)
    atomMap[name] = a.id
  }

  const bonds: Bond[] = [
    makeBond(atomMap['C1'], atomMap['C2'], 1, 346),
    makeBond(atomMap['C2'], atomMap['C3'], 1, 346),
    makeBond(atomMap['C3'], atomMap['C4'], 1, 346),
    makeBond(atomMap['C4'], atomMap['C5'], 1, 346),
    makeBond(atomMap['C5'], atomMap['C6'], 1, 346),
    makeBond(atomMap['C6'], atomMap['C1'], 1, 346),
    makeBond(atomMap['C2'], atomMap['N2'], 2, 518),
    makeBond(atomMap['N2'], atomMap['H2'], 1, 391),
    makeBond(atomMap['C3'], atomMap['N1'], 2, 518),
    makeBond(atomMap['N1'], atomMap['H1'], 1, 391),
    makeBond(atomMap['C5'], atomMap['N3'], 1, 305),
    makeBond(atomMap['N3'], atomMap['H3'], 1, 391),
    makeBond(atomMap['N3'], atomMap['CH2_C'], 1, 346),
    makeBond(atomMap['C6'], atomMap['N4'], 1, 305),
    makeBond(atomMap['N4'], atomMap['H4'], 1, 391),
    makeBond(atomMap['N4'], atomMap['CH1_C'], 1, 346),
    makeBond(atomMap['C1'], atomMap['O1'], 2, 745),
    makeBond(atomMap['C4'], atomMap['O2'], 2, 745),
    makeBond(atomMap['CH1_C'], atomMap['CH1_H1'], 1, 413),
    makeBond(atomMap['CH1_C'], atomMap['CH1_H2'], 1, 413),
    makeBond(atomMap['CH1_C'], atomMap['CH1_H3'], 1, 413),
    makeBond(atomMap['CH2_C'], atomMap['CH2_H1'], 1, 413),
    makeBond(atomMap['CH2_C'], atomMap['CH2_H2'], 1, 413),
    makeBond(atomMap['CH2_C'], atomMap['CH2_H3'], 1, 413),
  ]

  return {
    id: 'caffeine',
    name: '咖啡因',
    formula: 'C₈H₁₀N₄O₂',
    atoms,
    bonds,
  }
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
