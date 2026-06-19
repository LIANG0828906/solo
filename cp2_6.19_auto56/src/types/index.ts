export interface Atom {
  id: number
  name: string
  element: string
  x: number
  y: number
  z: number
  residueId: number
  chainId: string
}

export interface Residue {
  id: number
  name: string
  seqNum: number
  chainId: string
  atoms: Atom[]
  center: { x: number; y: number; z: number }
}

export interface StructureData {
  atoms: Atom[]
  residues: Residue[]
  chains: string[]
}

export interface Measurement {
  id: string
  atom1: Atom
  atom2: Atom
  distance: number
}

export interface ResidueLabel {
  residueId: number
  text: string
}

export type ModelMode = 'ballstick' | 'cartoon'

export interface PickerResult {
  atom: Atom | null
  residue: Residue | null
  point: { x: number; y: number; z: number } | null
}
