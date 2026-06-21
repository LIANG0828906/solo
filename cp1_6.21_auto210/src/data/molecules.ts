export interface Atom {
  id: string
  element: string
  position: [number, number, number]
  color: string
  radius: number
  mass: number
}

export interface Bond {
  id: string
  atom1Id: string
  atom2Id: string
  order: number
}

export interface MoleculeData {
  id: string
  name: string
  formula: string
  molecularWeight: number
  geometry: string
  bondAngles: string[]
  atoms: Atom[]
  bonds: Bond[]
}

export const ELEMENT_PROPERTIES: Record<string, { color: string; radius: number; mass: number }> = {
  H: { color: '#FFFFFF', radius: 0.25, mass: 1.008 },
  C: { color: '#666666', radius: 0.4, mass: 12.011 },
  N: { color: '#3050F8', radius: 0.38, mass: 14.007 },
  O: { color: '#FF3333', radius: 0.4, mass: 15.999 },
}

function atom(element: string, id: string, x: number, y: number, z: number): Atom {
  const props = ELEMENT_PROPERTIES[element]
  return { id, element, position: [x, y, z], color: props.color, radius: props.radius, mass: props.mass }
}

function bond(id: string, atom1Id: string, atom2Id: string, order: number = 1): Bond {
  return { id, atom1Id, atom2Id, order }
}

export const MOLECULES: Record<string, MoleculeData> = {
  h2o: {
    id: 'h2o',
    name: '水',
    formula: 'H₂O',
    molecularWeight: 18.015,
    geometry: 'V形（弯曲形）',
    bondAngles: ['H-O-H: 104.5°'],
    atoms: [
      atom('O', 'O1', 0, 0, 0),
      atom('H', 'H1', 0.757, 0.586, 0),
      atom('H', 'H2', -0.757, 0.586, 0),
    ],
    bonds: [
      bond('B1', 'O1', 'H1'),
      bond('B2', 'O1', 'H2'),
    ],
  },
  co2: {
    id: 'co2',
    name: '二氧化碳',
    formula: 'CO₂',
    molecularWeight: 44.009,
    geometry: '直线形',
    bondAngles: ['O=C=O: 180°'],
    atoms: [
      atom('C', 'C1', 0, 0, 0),
      atom('O', 'O1', 1.16, 0, 0),
      atom('O', 'O2', -1.16, 0, 0),
    ],
    bonds: [
      bond('B1', 'C1', 'O1', 2),
      bond('B2', 'C1', 'O2', 2),
    ],
  },
  c6h6: {
    id: 'c6h6',
    name: '苯',
    formula: 'C₆H₆',
    molecularWeight: 78.114,
    geometry: '平面正六边形',
    bondAngles: ['C-C-C: 120°', 'H-C-C: 120°'],
    atoms: [
      atom('C', 'C1', 1.39, 0, 0),
      atom('C', 'C2', 0.695, 1.204, 0),
      atom('C', 'C3', -0.695, 1.204, 0),
      atom('C', 'C4', -1.39, 0, 0),
      atom('C', 'C5', -0.695, -1.204, 0),
      atom('C', 'C6', 0.695, -1.204, 0),
      atom('H', 'H1', 2.48, 0, 0),
      atom('H', 'H2', 1.24, 2.148, 0),
      atom('H', 'H3', -1.24, 2.148, 0),
      atom('H', 'H4', -2.48, 0, 0),
      atom('H', 'H5', -1.24, -2.148, 0),
      atom('H', 'H6', 1.24, -2.148, 0),
    ],
    bonds: [
      bond('B1', 'C1', 'C2', 2),
      bond('B2', 'C2', 'C3', 1),
      bond('B3', 'C3', 'C4', 2),
      bond('B4', 'C4', 'C5', 1),
      bond('B5', 'C5', 'C6', 2),
      bond('B6', 'C6', 'C1', 1),
      bond('B7', 'C1', 'H1'),
      bond('B8', 'C2', 'H2'),
      bond('B9', 'C3', 'H3'),
      bond('B10', 'C4', 'H4'),
      bond('B11', 'C5', 'H5'),
      bond('B12', 'C6', 'H6'),
    ],
  },
  glycine: {
    id: 'glycine',
    name: '甘氨酸（氨基酸）',
    formula: 'C₂H₅NO₂',
    molecularWeight: 75.032,
    geometry: '非平面（Cα四面体，C\'三角平面）',
    bondAngles: ['N-Cα-C\': 110°', 'Cα-C\'=O: 125°', 'Cα-C\'-O: 112°'],
    atoms: [
      atom('N', 'N1', -1.4, 0, 0),
      atom('C', 'Ca', 0, 0, 0),
      atom('C', 'Cp', 1.5, 0, 0),
      atom('O', 'O1', 2.0, 1.1, 0),
      atom('O', 'O2', 2.3, -1.0, 0),
      atom('H', 'H1', -1.9, 0.9, 0),
      atom('H', 'H2', -1.9, -0.9, 0),
      atom('H', 'H3', -0.3, 0.9, 0.9),
      atom('H', 'H4', -0.3, -0.9, 0.9),
      atom('H', 'H5', 3.2, -0.7, 0),
    ],
    bonds: [
      bond('B1', 'N1', 'Ca'),
      bond('B2', 'Ca', 'Cp'),
      bond('B3', 'Cp', 'O1', 2),
      bond('B4', 'Cp', 'O2'),
      bond('B5', 'N1', 'H1'),
      bond('B6', 'N1', 'H2'),
      bond('B7', 'Ca', 'H3'),
      bond('B8', 'Ca', 'H4'),
      bond('B9', 'O2', 'H5'),
    ],
  },
}
