export type Element = 'H' | 'C' | 'O' | 'N';

export type BondType = 'single' | 'double' | 'triple';

export interface Atom {
  id: string;
  element: Element;
  position: [number, number, number];
  radius: number;
  color: string;
}

export interface Bond {
  id: string;
  from: string;
  to: string;
  type: BondType;
}

export interface MoleculeData {
  id: string;
  name: string;
  formula: string;
  atoms: Array<{
    element: Element;
    position: [number, number, number];
  }>;
  bonds: Array<{
    from: number;
    to: number;
    type: BondType;
  }>;
}

export interface ParsedMolecule {
  atoms: Atom[];
  bonds: Bond[];
}

export interface ElementConfig {
  color: string;
  radius: number;
  name: string;
}

export interface HoverInfo {
  atomId: string;
  element: Element;
  name: string;
  screenX: number;
  screenY: number;
}
