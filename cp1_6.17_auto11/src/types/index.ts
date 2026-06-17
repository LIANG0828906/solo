export interface Atom {
  element: string
  position: [number, number, number]
  radius: number
  color: string
}

export interface Bond {
  from: number
  to: number
}

export interface Molecule {
  name: string
  nameZh: string
  formula: string
  atoms: Atom[]
  bonds: Bond[]
}
