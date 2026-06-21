export interface Atom {
  id: string
  element: string
  x: number
  y: number
  z: number
  residue?: string
  hybridization?: string
}

export interface Bond {
  atom1Id: string
  atom2Id: string
  type: 'single' | 'double' | 'triple'
}

export interface Molecule {
  id: string
  name: string
  formula: string
  atoms: Atom[]
  bonds: Bond[]
}

export interface Marker {
  id: string
  atomId: string
  label: string
}

export const elementColors: Record<string, string> = {
  C: '#444444',
  H: '#FFFFFF',
  O: '#FF0D0D',
  N: '#3050F8',
  S: '#FFFF30',
  P: '#FF8000',
  F: '#90E050',
  Cl: '#1FF01F',
  Br: '#A62929',
  I: '#940094',
}

export const elementNames: Record<string, string> = {
  C: '碳',
  H: '氢',
  O: '氧',
  N: '氮',
  S: '硫',
  P: '磷',
  F: '氟',
  Cl: '氯',
  Br: '溴',
  I: '碘',
}

export const elementAtomicNumbers: Record<string, number> = {
  C: 6,
  H: 1,
  O: 8,
  N: 7,
  S: 16,
  P: 15,
  F: 9,
  Cl: 17,
  Br: 35,
  I: 53,
}

export const molecules: Molecule[] = [
  {
    id: 'methane',
    name: '甲烷',
    formula: 'CH₄',
    atoms: [
      { id: 'C1', element: 'C', x: 0, y: 0, z: 0, hybridization: 'sp³' },
      { id: 'H1', element: 'H', x: 0.629, y: 0.629, z: 0.629 },
      { id: 'H2', element: 'H', x: -0.629, y: -0.629, z: 0.629 },
      { id: 'H3', element: 'H', x: -0.629, y: 0.629, z: -0.629 },
      { id: 'H4', element: 'H', x: 0.629, y: -0.629, z: -0.629 },
    ],
    bonds: [
      { atom1Id: 'C1', atom2Id: 'H1', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'H2', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'H3', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'H4', type: 'single' },
    ],
  },
  {
    id: 'benzene',
    name: '苯环',
    formula: 'C₆H₆',
    atoms: [
      { id: 'C1', element: 'C', x: 1.395, y: 0, z: 0, hybridization: 'sp²' },
      { id: 'C2', element: 'C', x: 0.6975, y: 1.208, z: 0, hybridization: 'sp²' },
      { id: 'C3', element: 'C', x: -0.6975, y: 1.208, z: 0, hybridization: 'sp²' },
      { id: 'C4', element: 'C', x: -1.395, y: 0, z: 0, hybridization: 'sp²' },
      { id: 'C5', element: 'C', x: -0.6975, y: -1.208, z: 0, hybridization: 'sp²' },
      { id: 'C6', element: 'C', x: 0.6975, y: -1.208, z: 0, hybridization: 'sp²' },
      { id: 'H1', element: 'H', x: 2.477, y: 0, z: 0 },
      { id: 'H2', element: 'H', x: 1.2385, y: 2.146, z: 0 },
      { id: 'H3', element: 'H', x: -1.2385, y: 2.146, z: 0 },
      { id: 'H4', element: 'H', x: -2.477, y: 0, z: 0 },
      { id: 'H5', element: 'H', x: -1.2385, y: -2.146, z: 0 },
      { id: 'H6', element: 'H', x: 1.2385, y: -2.146, z: 0 },
    ],
    bonds: [
      { atom1Id: 'C1', atom2Id: 'C2', type: 'double' },
      { atom1Id: 'C2', atom2Id: 'C3', type: 'single' },
      { atom1Id: 'C3', atom2Id: 'C4', type: 'double' },
      { atom1Id: 'C4', atom2Id: 'C5', type: 'single' },
      { atom1Id: 'C5', atom2Id: 'C6', type: 'double' },
      { atom1Id: 'C6', atom2Id: 'C1', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'H1', type: 'single' },
      { atom1Id: 'C2', atom2Id: 'H2', type: 'single' },
      { atom1Id: 'C3', atom2Id: 'H3', type: 'single' },
      { atom1Id: 'C4', atom2Id: 'H4', type: 'single' },
      { atom1Id: 'C5', atom2Id: 'H5', type: 'single' },
      { atom1Id: 'C6', atom2Id: 'H6', type: 'single' },
    ],
  },
  {
    id: 'caffeine',
    name: '咖啡因',
    formula: 'C₈H₁₀N₄O₂',
    atoms: [
      { id: 'C1', element: 'C', x: 0.0, y: 0.0, z: 0.0, hybridization: 'sp²' },
      { id: 'C2', element: 'C', x: 1.5, y: 0.2, z: 0.3, hybridization: 'sp²' },
      { id: 'C3', element: 'C', x: 2.0, y: 1.5, z: 0.1, hybridization: 'sp³' },
      { id: 'C4', element: 'C', x: -1.5, y: 0.2, z: -0.3, hybridization: 'sp²' },
      { id: 'C5', element: 'C', x: -2.0, y: -1.2, z: -0.5, hybridization: 'sp³' },
      { id: 'C6', element: 'C', x: -0.5, y: -1.5, z: -0.2, hybridization: 'sp²' },
      { id: 'C7', element: 'C', x: 1.5, y: -1.3, z: 0.5, hybridization: 'sp³' },
      { id: 'C8', element: 'C', x: -1.8, y: 1.5, z: -0.1, hybridization: 'sp³' },
      { id: 'N1', element: 'N', x: 0.7, y: -0.8, z: 0.2, hybridization: 'sp²' },
      { id: 'N2', element: 'N', x: -0.7, y: 0.8, z: -0.2, hybridization: 'sp²' },
      { id: 'N3', element: 'N', x: 1.8, y: -0.3, z: 0.6, hybridization: 'sp²' },
      { id: 'N4', element: 'N', x: -1.8, y: -0.1, z: -0.6, hybridization: 'sp²' },
      { id: 'O1', element: 'O', x: 0.3, y: 1.0, z: 0.1, hybridization: 'sp²' },
      { id: 'O2', element: 'O', x: -0.3, y: -2.5, z: -0.3, hybridization: 'sp²' },
      { id: 'H1', element: 'H', x: 2.8, y: 1.5, z: 0.3 },
      { id: 'H2', element: 'H', x: 1.7, y: 2.2, z: -0.7 },
      { id: 'H3', element: 'H', x: 1.9, y: 1.9, z: 1.0 },
      { id: 'H4', element: 'H', x: -2.8, y: -1.2, z: -0.7 },
      { id: 'H5', element: 'H', x: -1.7, y: -1.8, z: -1.3 },
      { id: 'H6', element: 'H', x: -1.7, y: -1.7, z: 0.4 },
      { id: 'H7', element: 'H', x: 1.7, y: -2.0, z: 1.2 },
      { id: 'H8', element: 'H', x: 2.5, y: -1.3, z: 0.0 },
      { id: 'H9', element: 'H', x: 0.8, y: -1.9, z: 0.8 },
      { id: 'H10', element: 'H', x: -2.3, y: 1.6, z: 0.8 },
    ],
    bonds: [
      { atom1Id: 'C1', atom2Id: 'N1', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'N2', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'O1', type: 'double' },
      { atom1Id: 'C2', atom2Id: 'N1', type: 'single' },
      { atom1Id: 'C2', atom2Id: 'N3', type: 'double' },
      { atom1Id: 'C2', atom2Id: 'C3', type: 'single' },
      { atom1Id: 'C3', atom2Id: 'H1', type: 'single' },
      { atom1Id: 'C3', atom2Id: 'H2', type: 'single' },
      { atom1Id: 'C3', atom2Id: 'H3', type: 'single' },
      { atom1Id: 'C4', atom2Id: 'N2', type: 'single' },
      { atom1Id: 'C4', atom2Id: 'N4', type: 'double' },
      { atom1Id: 'C4', atom2Id: 'C8', type: 'single' },
      { atom1Id: 'C5', atom2Id: 'N4', type: 'single' },
      { atom1Id: 'C5', atom2Id: 'H4', type: 'single' },
      { atom1Id: 'C5', atom2Id: 'H5', type: 'single' },
      { atom1Id: 'C5', atom2Id: 'H6', type: 'single' },
      { atom1Id: 'C6', atom2Id: 'N1', type: 'single' },
      { atom1Id: 'C6', atom2Id: 'N4', type: 'single' },
      { atom1Id: 'C6', atom2Id: 'O2', type: 'double' },
      { atom1Id: 'C7', atom2Id: 'N3', type: 'single' },
      { atom1Id: 'C7', atom2Id: 'H7', type: 'single' },
      { atom1Id: 'C7', atom2Id: 'H8', type: 'single' },
      { atom1Id: 'C7', atom2Id: 'H9', type: 'single' },
      { atom1Id: 'C8', atom2Id: 'H10', type: 'single' },
    ],
  },
  {
    id: 'ldopa',
    name: 'L-多巴',
    formula: 'C₉H₁₁NO₄',
    atoms: [
      { id: 'C1', element: 'C', x: 0.0, y: 0.0, z: 0.0, hybridization: 'sp²' },
      { id: 'C2', element: 'C', x: 1.39, y: 0.0, z: 0.2, hybridization: 'sp²' },
      { id: 'C3', element: 'C', x: 2.085, y: 1.208, z: 0.1, hybridization: 'sp²' },
      { id: 'C4', element: 'C', x: 1.39, y: 2.416, z: -0.1, hybridization: 'sp²' },
      { id: 'C5', element: 'C', x: 0.0, y: 2.416, z: -0.3, hybridization: 'sp²' },
      { id: 'C6', element: 'C', x: -0.695, y: 1.208, z: -0.2, hybridization: 'sp²' },
      { id: 'C7', element: 'C', x: -2.0, y: 1.5, z: -0.4, hybridization: 'sp³' },
      { id: 'C8', element: 'C', x: -2.8, y: 1.0, z: 0.8, hybridization: 'sp³' },
      { id: 'C9', element: 'C', x: -3.8, y: 1.8, z: 1.2, hybridization: 'sp²' },
      { id: 'N1', element: 'N', x: -2.2, y: 1.0, z: -1.5, hybridization: 'sp³' },
      { id: 'O1', element: 'O', x: 3.4, y: 1.208, z: 0.2, hybridization: 'sp³' },
      { id: 'O2', element: 'O', x: 1.9, y: 3.5, z: -0.2, hybridization: 'sp³' },
      { id: 'O3', element: 'O', x: -4.5, y: 1.2, z: 2.0, hybridization: 'sp²' },
      { id: 'O4', element: 'O', x: -4.0, y: 2.9, z: 0.5, hybridization: 'sp³' },
      { id: 'H1', element: 'H', x: -0.5, y: -0.9, z: 0.1 },
      { id: 'H2', element: 'H', x: -0.5, y: 3.3, z: -0.5 },
      { id: 'H3', element: 'H', x: 3.5, y: 0.4, z: 0.4 },
      { id: 'H4', element: 'H', x: 1.8, y: 4.2, z: -0.3 },
      { id: 'H5', element: 'H', x: -1.8, y: 2.5, z: -0.3 },
      { id: 'H6', element: 'H', x: -2.8, y: -0.0, z: 0.5 },
      { id: 'H7', element: 'H', x: -3.2, y: 1.5, z: -1.9 },
      { id: 'H8', element: 'H', x: -1.5, y: 0.5, z: -1.8 },
      { id: 'H9', element: 'H', x: -2.3, y: 1.8, z: -1.9 },
      { id: 'H10', element: 'H', x: -4.8, y: 2.8, z: 0.8 },
      { id: 'H11', element: 'H', x: -3.3, y: 3.5, z: 0.2 },
    ],
    bonds: [
      { atom1Id: 'C1', atom2Id: 'C2', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'C6', type: 'double' },
      { atom1Id: 'C1', atom2Id: 'H1', type: 'single' },
      { atom1Id: 'C2', atom2Id: 'C3', type: 'double' },
      { atom1Id: 'C3', atom2Id: 'C4', type: 'single' },
      { atom1Id: 'C3', atom2Id: 'O1', type: 'single' },
      { atom1Id: 'C4', atom2Id: 'C5', type: 'double' },
      { atom1Id: 'C4', atom2Id: 'O2', type: 'single' },
      { atom1Id: 'C5', atom2Id: 'C6', type: 'single' },
      { atom1Id: 'C5', atom2Id: 'H2', type: 'single' },
      { atom1Id: 'C6', atom2Id: 'C7', type: 'single' },
      { atom1Id: 'C7', atom2Id: 'C8', type: 'single' },
      { atom1Id: 'C7', atom2Id: 'N1', type: 'single' },
      { atom1Id: 'C7', atom2Id: 'H5', type: 'single' },
      { atom1Id: 'C8', atom2Id: 'C9', type: 'single' },
      { atom1Id: 'C8', atom2Id: 'H6', type: 'single' },
      { atom1Id: 'C9', atom2Id: 'O3', type: 'double' },
      { atom1Id: 'C9', atom2Id: 'O4', type: 'single' },
      { atom1Id: 'N1', atom2Id: 'H7', type: 'single' },
      { atom1Id: 'N1', atom2Id: 'H8', type: 'single' },
      { atom1Id: 'N1', atom2Id: 'H9', type: 'single' },
      { atom1Id: 'O1', atom2Id: 'H3', type: 'single' },
      { atom1Id: 'O2', atom2Id: 'H4', type: 'single' },
      { atom1Id: 'O4', atom2Id: 'H10', type: 'single' },
    ],
  },
]

export function getMoleculeById(id: string): Molecule | undefined {
  return molecules.find((m) => m.id === id)
}

export function getAtomById(molecule: Molecule, atomId: string): Atom | undefined {
  return molecule.atoms.find((a) => a.id === atomId)
}

export function calculateBondLength(atom1: Atom, atom2: Atom): number {
  const dx = atom2.x - atom1.x
  const dy = atom2.y - atom1.y
  const dz = atom2.z - atom1.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function calculateBondAngle(atom1: Atom, centralAtom: Atom, atom2: Atom): number {
  const v1x = atom1.x - centralAtom.x
  const v1y = atom1.y - centralAtom.y
  const v1z = atom1.z - centralAtom.z

  const v2x = atom2.x - centralAtom.x
  const v2y = atom2.y - centralAtom.y
  const v2z = atom2.z - centralAtom.z

  const dotProduct = v1x * v2x + v1y * v2y + v1z * v2z

  const len1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z)
  const len2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z)

  if (len1 === 0 || len2 === 0) return 0

  const cosAngle = Math.max(-1, Math.min(1, dotProduct / (len1 * len2)))
  return (Math.acos(cosAngle) * 180) / Math.PI
}

export function getConnectedAtoms(molecule: Molecule, atomId: string): Atom[] {
  const connected: Atom[] = []
  for (const bond of molecule.bonds) {
    let connectedAtomId: string | null = null
    if (bond.atom1Id === atomId) {
      connectedAtomId = bond.atom2Id
    } else if (bond.atom2Id === atomId) {
      connectedAtomId = bond.atom1Id
    }
    if (connectedAtomId) {
      const atom = getAtomById(molecule, connectedAtomId)
      if (atom) connected.push(atom)
    }
  }
  return connected
}

export function getBondsForAtom(molecule: Molecule, atomId: string): Bond[] {
  return molecule.bonds.filter(
    (b) => b.atom1Id === atomId || b.atom2Id === atomId
  )
}

export function getBondLengthsForAtom(molecule: Molecule, atomId: string): Array<{ atom: Atom; length: number; bondType: string }> {
  const atom = getAtomById(molecule, atomId)
  if (!atom) return []

  const bonds = getBondsForAtom(molecule, atomId)
  return bonds.map((bond) => {
    const otherAtomId = bond.atom1Id === atomId ? bond.atom2Id : bond.atom1Id
    const otherAtom = getAtomById(molecule, otherAtomId)!
    return {
      atom: otherAtom,
      length: calculateBondLength(atom, otherAtom),
      bondType: bond.type,
    }
  })
}

export function getBondAnglesForAtom(molecule: Molecule, atomId: string): Array<{ atom1: Atom; atom2: Atom; angle: number }> {
  const connected = getConnectedAtoms(molecule, atomId)
  const centralAtom = getAtomById(molecule, atomId)
  if (!centralAtom || connected.length < 2) return []

  const angles: Array<{ atom1: Atom; atom2: Atom; angle: number }> = []
  for (let i = 0; i < connected.length; i++) {
    for (let j = i + 1; j < connected.length; j++) {
      angles.push({
        atom1: connected[i],
        atom2: connected[j],
        angle: calculateBondAngle(connected[i], centralAtom, connected[j]),
      })
    }
  }
  return angles
}
