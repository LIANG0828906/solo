export interface Atom {
  id: number
  elementId: string
  element: string
  elementName: string
  atomicNumber: number
  position: [number, number, number]
  radius: number
  color: string
}

export interface Bond {
  id: string
  from: string
  to: string
  order: number
}

export interface Molecule {
  id: string
  name: string
  description: string
  formula: string
  atoms: Atom[]
  bonds: Bond[]
}

interface MoleculeData {
  id: string
  name: string
  description: string
  formula: string
  atoms: Omit<Atom, 'id'>[]
  bonds: Bond[]
}

const ELEMENT_COLORS: Record<string, string> = {
  H: '#FFFFFF',
  C: '#909090',
  N: '#3050F8',
  O: '#FF0D0D',
  S: '#FFFF30',
  P: '#FF8000',
  F: '#90E050',
  Cl: '#1FF01F',
  Br: '#A62929',
  I: '#940094',
}

const ELEMENT_RADII: Record<string, number> = {
  H: 0.31,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  S: 1.05,
  P: 1.07,
  F: 0.57,
  Cl: 1.02,
  Br: 1.20,
  I: 1.39,
}

const ELEMENT_NAMES: Record<string, string> = {
  H: '氢',
  C: '碳',
  N: '氮',
  O: '氧',
  S: '硫',
  P: '磷',
  F: '氟',
  Cl: '氯',
  Br: '溴',
  I: '碘',
}

const ELEMENT_NUMBERS: Record<string, number> = {
  H: 1,
  C: 6,
  N: 7,
  O: 8,
  F: 9,
  P: 15,
  S: 16,
  Cl: 17,
  Br: 35,
  I: 53,
}

function createAtom(elementId: string, element: string, x: number, y: number, z: number): Omit<Atom, 'id'> {
  return {
    elementId,
    element,
    elementName: ELEMENT_NAMES[element] || element,
    atomicNumber: ELEMENT_NUMBERS[element] || 0,
    position: [x, y, z],
    radius: ELEMENT_RADII[element] || 0.5,
    color: ELEMENT_COLORS[element] || '#CCCCCC',
  }
}

const WATER: MoleculeData = {
  id: 'water',
  name: '水',
  description: '水分子 H₂O',
  formula: 'H₂O',
  atoms: [
    createAtom('o1', 'O', 0, 0, 0),
    createAtom('h1', 'H', 0.76, 0.59, 0),
    createAtom('h2', 'H', -0.76, 0.59, 0),
  ],
  bonds: [
    { id: 'b1', from: 'o1', to: 'h1', order: 1 },
    { id: 'b2', from: 'o1', to: 'h2', order: 1 },
  ],
}

const BENZENE: MoleculeData = (() => {
  const atoms: Omit<Atom, 'id'>[] = []
  const bonds: Bond[] = []
  const radius = 1.4
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const x = radius * Math.cos(angle)
    const z = radius * Math.sin(angle)
    atoms.push(createAtom(`c${i}`, 'C', x, 0, z))
    const hX = (radius + 1.09) * Math.cos(angle)
    const hZ = (radius + 1.09) * Math.sin(angle)
    atoms.push(createAtom(`h${i}`, 'H', hX, 0, hZ))
  }
  for (let i = 0; i < 6; i++) {
    bonds.push({
      id: `cc${i}`,
      from: `c${i}`,
      to: `c${(i + 1) % 6}`,
      order: i % 2 === 0 ? 2 : 1,
    })
    bonds.push({
      id: `ch${i}`,
      from: `c${i}`,
      to: `h${i}`,
      order: 1,
    })
  }
  return {
    id: 'benzene',
    name: '苯',
    description: '苯分子 C₆H₆',
    formula: 'C₆H₆',
    atoms,
    bonds,
  }
})()

const AMINO_ACID: MoleculeData = (() => {
  const atoms: Omit<Atom, 'id'>[] = [
    createAtom('c_alpha', 'C', 0, 0, 0),
    createAtom('c_carboxyl', 'C', 1.51, 0, 0),
    createAtom('o1', 'O', 2.23, 1.06, 0),
    createAtom('o2', 'O', 2.08, -1.23, 0),
    createAtom('n_amino', 'N', -1.45, 0, 0),
    createAtom('h_n1', 'H', -1.91, 0.89, 0.35),
    createAtom('h_n2', 'H', -1.91, 0.89, -0.35),
    createAtom('h_alpha', 'H', 0.28, -0.44, 1.02),
    createAtom('cb', 'C', -0.05, -1.44, -0.55),
    createAtom('cg', 'C', 0.04, -2.72, 0.33),
    createAtom('cd', 'C', -0.16, -3.96, -0.55),
    createAtom('ne', 'N', 0.29, -4.97, 0.37),
    createAtom('cz', 'C', 1.32, -4.92, 0.99),
    createAtom('nh1', 'N', 1.87, -3.90, 1.44),
    createAtom('nh2', 'N', 1.86, -6.09, 1.19),
    createAtom('h_1', 'H', -1.98, -3.99, -1.05),
    createAtom('h_2', 'H', 0.94, -2.74, 0.91),
    createAtom('h_3', 'H', 1.57, -3.49, 1.75),
    createAtom('h_4', 'H', 2.43, -6.70, 1.51),
    createAtom('h_5', 'H', 1.38, -6.14, 0.93),
    createAtom('h_ho', 'H', 3.04, -1.02, 0),
  ]
  const bonds: Bond[] = [
    { id: 'b1', from: 'c_alpha', to: 'c_carboxyl', order: 1 },
    { id: 'b2', from: 'c_carboxyl', to: 'o1', order: 2 },
    { id: 'b3', from: 'c_carboxyl', to: 'o2', order: 1 },
    { id: 'b4', from: 'o2', to: 'h_ho', order: 1 },
    { id: 'b5', from: 'c_alpha', to: 'n_amino', order: 1 },
    { id: 'b6', from: 'n_amino', to: 'h_n1', order: 1 },
    { id: 'b7', from: 'n_amino', to: 'h_n2', order: 1 },
    { id: 'b8', from: 'c_alpha', to: 'h_alpha', order: 1 },
    { id: 'b9', from: 'c_alpha', to: 'cb', order: 1 },
    { id: 'b10', from: 'cb', to: 'cg', order: 1 },
    { id: 'b11', from: 'cg', to: 'cd', order: 1 },
    { id: 'b12', from: 'cd', to: 'ne', order: 1 },
    { id: 'b13', from: 'ne', to: 'cz', order: 1 },
    { id: 'b14', from: 'cz', to: 'nh1', order: 1 },
    { id: 'b15', from: 'cz', to: 'nh2', order: 2 },
    { id: 'b16', from: 'cd', to: 'h_1', order: 1 },
    { id: 'b17', from: 'cg', to: 'h_2', order: 1 },
    { id: 'b18', from: 'nh1', to: 'h_3', order: 1 },
    { id: 'b19', from: 'nh2', to: 'h_4', order: 1 },
    { id: 'b20', from: 'nh2', to: 'h_5', order: 1 },
  ]
  return {
    id: 'amino_acid',
    name: '精氨酸',
    description: '精氨酸 - 碱性氨基酸',
    formula: 'C₆H₁₄N₄O₂',
    atoms,
    bonds,
  }
})()

const GLUCOSE: MoleculeData = (() => {
  const atoms: Omit<Atom, 'id'>[] = []
  const bonds: Bond[] = []
  const ringAtoms = ['C1', 'C2', 'C3', 'C4', 'C5', 'O5']
  const ringPos: Record<string, [number, number, number]> = {
    C1: [0.7, 0.0, 0.7],
    C2: [0.7, -1.2, 0.0],
    C3: [-0.7, -1.2, -0.7],
    C4: [-0.7, 0.0, 0.0],
    C5: [0.0, 0.5, 0.7],
    O5: [0.7, 0.7, 0.0],
  }
  ringAtoms.forEach((id, i) => {
    const elem = id.startsWith('O') ? 'O' : 'C'
    const [x, y, z] = ringPos[id]
    atoms.push(createAtom(id.toLowerCase(), elem, x, y, z))
  })
  const substituents: { parent: string; id: string; elem: string; pos: [number, number, number] }[] = [
    { parent: 'c1', id: 'o1', elem: 'O', pos: [1.6, 0.5, 1.4] },
    { parent: 'o1', id: 'h_o1', elem: 'H', pos: [2.2, 1.2, 1.0] },
    { parent: 'c2', id: 'o2', elem: 'O', pos: [1.6, -1.7, -0.7] },
    { parent: 'o2', id: 'h_o2', elem: 'H', pos: [2.2, -2.4, -0.3] },
    { parent: 'c3', id: 'o3', elem: 'O', pos: [-0.2, -1.7, -1.7] },
    { parent: 'o3', id: 'h_o3', elem: 'H', pos: [0.4, -2.4, -2.1] },
    { parent: 'c4', id: 'o4', elem: 'O', pos: [-1.7, 0.5, -0.7] },
    { parent: 'o4', id: 'h_o4', elem: 'H', pos: [-2.4, 1.2, -0.3] },
    { parent: 'c5', id: 'c6', elem: 'C', pos: [-0.3, 1.3, 1.5] },
    { parent: 'c6', id: 'o6', elem: 'O', pos: [0.4, 1.8, 2.3] },
    { parent: 'o6', id: 'h_o6', elem: 'H', pos: [0.1, 2.7, 2.1] },
    { parent: 'c6', id: 'h6_c', elem: 'H', pos: [-1.2, 2.0, 1.2] },
    { parent: 'c1', id: 'h1', elem: 'H', pos: [0.1, -0.5, 1.4] },
    { parent: 'c2', id: 'h2', elem: 'H', pos: [0.1, -1.8, 0.7] },
    { parent: 'c3', id: 'h3', elem: 'H', pos: [-1.3, -0.6, -1.0] },
    { parent: 'c4', id: 'h4', elem: 'H', pos: [-0.7, -0.7, 0.7] },
    { parent: 'c5', id: 'h5', elem: 'H', pos: [0.2, -0.2, 1.4] },
  ]
  substituents.forEach((s) => {
    atoms.push(createAtom(s.id, s.elem, ...s.pos))
  })
  for (let i = 0; i < 5; i++) {
    bonds.push({
      id: `ring${i}`,
      from: ringAtoms[i].toLowerCase(),
      to: ringAtoms[i + 1].toLowerCase(),
      order: 1,
    })
  }
  bonds.push({ id: 'ring5', from: 'o5', to: 'c1', order: 1 })
  substituents.forEach((s, i) => {
    bonds.push({ id: `sub${i}`, from: s.parent, to: s.id, order: 1 })
  })
  return {
    id: 'glucose',
    name: '葡萄糖',
    description: 'β-D-葡萄糖',
    formula: 'C₆H₁₂O₆',
    atoms,
    bonds,
  }
})()

const CAFFEINE: MoleculeData = (() => {
  const atoms: Omit<Atom, 'id'>[] = [
    createAtom('n1', 'N', 0, 0, 0),
    createAtom('c2', 'C', 1.43, 0, 0),
    createAtom('n3', 'N', 2.15, 1.20, 0),
    createAtom('c4', 'C', 1.43, 2.40, 0),
    createAtom('c5', 'C', 0, 2.40, 0),
    createAtom('c6', 'C', -0.72, 1.20, 0),
    createAtom('n7', 'N', -1.45, 2.80, 0),
    createAtom('c8', 'C', -0.96, 4.00, 0),
    createAtom('n9', 'N', 0.43, 3.82, 0),
    createAtom('o2', 'O', 2.15, -1.00, 0),
    createAtom('o6', 'O', -2.00, 1.00, 0),
    createAtom('c10', 'C', -1.43, -1.00, 0.5),
    createAtom('c11', 'C', 3.50, 1.50, 0.5),
    createAtom('c12', 'C', -2.80, 3.00, 0.5),
    createAtom('c13', 'C', 1.00, 5.00, 0.5),
    createAtom('h10a', 'H', -1.30, -1.90, -0.1),
    createAtom('h10b', 'H', -2.40, -0.70, 0.2),
    createAtom('h10c', 'H', -1.20, -1.10, 1.5),
    createAtom('h11a', 'H', 4.00, 0.60, 0.9),
    createAtom('h11b', 'H', 3.70, 2.20, 1.3),
    createAtom('h11c', 'H', 3.80, 1.80, -0.5),
    createAtom('h12a', 'H', -3.20, 2.10, 0.9),
    createAtom('h12b', 'H', -3.30, 3.80, 0.9),
    createAtom('h12c', 'H', -2.90, 3.10, -0.5),
    createAtom('h13a', 'H', 0.80, 5.50, 1.4),
    createAtom('h13b', 'H', 0.60, 5.60, -0.3),
    createAtom('h13c', 'H', 2.00, 4.80, 0.6),
  ]
  const bonds: Bond[] = [
    { id: 'b1', from: 'n1', to: 'c2', order: 1 },
    { id: 'b2', from: 'c2', to: 'n3', order: 1 },
    { id: 'b3', from: 'n3', to: 'c4', order: 2 },
    { id: 'b4', from: 'c4', to: 'c5', order: 1 },
    { id: 'b5', from: 'c5', to: 'c6', order: 1 },
    { id: 'b6', from: 'c6', to: 'n1', order: 2 },
    { id: 'b7', from: 'c5', to: 'n7', order: 1 },
    { id: 'b8', from: 'n7', to: 'c8', order: 1 },
    { id: 'b9', from: 'c8', to: 'n9', order: 2 },
    { id: 'b10', from: 'n9', to: 'c4', order: 1 },
    { id: 'b11', from: 'c2', to: 'o2', order: 2 },
    { id: 'b12', from: 'c6', to: 'o6', order: 2 },
    { id: 'b13', from: 'n1', to: 'c10', order: 1 },
    { id: 'b14', from: 'n3', to: 'c11', order: 1 },
    { id: 'b15', from: 'n7', to: 'c12', order: 1 },
    { id: 'b16', from: 'n9', to: 'c13', order: 1 },
    { id: 'b17', from: 'c10', to: 'h10a', order: 1 },
    { id: 'b18', from: 'c10', to: 'h10b', order: 1 },
    { id: 'b19', from: 'c10', to: 'h10c', order: 1 },
    { id: 'b20', from: 'c11', to: 'h11a', order: 1 },
    { id: 'b21', from: 'c11', to: 'h11b', order: 1 },
    { id: 'b22', from: 'c11', to: 'h11c', order: 1 },
    { id: 'b23', from: 'c12', to: 'h12a', order: 1 },
    { id: 'b24', from: 'c12', to: 'h12b', order: 1 },
    { id: 'b25', from: 'c12', to: 'h12c', order: 1 },
    { id: 'b26', from: 'c13', to: 'h13a', order: 1 },
    { id: 'b27', from: 'c13', to: 'h13b', order: 1 },
    { id: 'b28', from: 'c13', to: 'h13c', order: 1 },
  ]
  return {
    id: 'caffeine',
    name: '咖啡因',
    description: '咖啡因 - 黄嘌呤类生物碱',
    formula: 'C₈H₁₀N₄O₂',
    atoms,
    bonds,
  }
})()

export const MOLECULES: Molecule[] = [WATER, BENZENE, AMINO_ACID, GLUCOSE, CAFFEINE].map(
  (mol) => ({
    ...mol,
    atoms: mol.atoms.map((atom, index) => ({
      ...atom,
      id: index,
    })),
  })
)

export function getMoleculeById(id: string): Molecule | undefined {
  return MOLECULES.find((m) => m.id === id)
}
