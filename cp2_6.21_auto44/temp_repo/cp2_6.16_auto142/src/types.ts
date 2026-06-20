export type ElementType = 'C' | 'O' | 'H' | 'N' | 'Si';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Atom {
  id: string;
  element: ElementType;
  position: Vec3;
  coordinationNumber: number;
  neighbors: string[];
  isDefect?: boolean;
}

export interface Bond {
  id: string;
  atomAId: string;
  atomBId: string;
  length: number;
}

export type MaterialCategory = 'nanotube' | 'graphene' | 'quantumdot';

export interface MaterialData {
  id: MaterialCategory;
  name: string;
  displayName: string;
  category: string;
  atoms: Atom[];
  bonds: Bond[];
  latticeParams: { a?: number; b?: number; c?: number };
}

export interface VisualParams {
  atomScale: number;
  showBonds: boolean;
  generateDefects: boolean;
  defectDensity: number;
}

export interface NeighborInfo {
  atom: Atom;
  distance: number;
}

export interface MaterialStoreState {
  currentMaterial: MaterialCategory;
  materials: Record<MaterialCategory, MaterialData>;
  selectedAtom: Atom | null;
  visualParams: VisualParams;
  cameraDistance: number;
  setCurrentMaterial: (id: MaterialCategory) => void;
  selectAtom: (atom: Atom | null) => void;
  setVisualParams: (params: Partial<VisualParams>) => void;
  setCameraDistance: (distance: number) => void;
  searchAndNavigate: (query: string) => void;
  getNeighborsWithinRange: (atomId: string, rangeNm: number) => NeighborInfo[];
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  C: '#4A4A4A',
  O: '#E53935',
  H: '#FAFAFA',
  N: '#3D5AFE',
  Si: '#FFB300',
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  C: '碳',
  O: '氧',
  H: '氢',
  N: '氮',
  Si: '硅',
};
