export interface AtomData {
  id: number
  element: string
  x: number
  y: number
  z: number
}

export interface BondData {
  atom1: number
  atom2: number
}

export interface MoleculeData {
  name: string
  atoms: AtomData[]
  bonds: BondData[]
}

export const ELEMENT_COLORS: Record<string, string> = {
  C: '#808080',
  O: '#FF0D0D',
  N: '#3050F8',
  S: '#FFFF30',
  P: '#FF8000',
  H: '#FFFFFF',
}

export const ELEMENT_RADII: Record<string, number> = {
  C: 0.4,
  O: 0.35,
  N: 0.35,
  S: 0.45,
  P: 0.45,
  H: 0.25,
}

export const ELEMENT_NAMES: Record<string, string> = {
  C: '碳',
  O: '氧',
  N: '氮',
  S: '硫',
  P: '磷',
  H: '氢',
}

export const ELEMENT_MASSES: Record<string, number> = {
  C: 12.011,
  O: 15.999,
  N: 14.007,
  S: 32.06,
  P: 30.974,
  H: 1.008,
}
