import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Atom,
  Bond,
  MaterialCategory,
  MaterialData,
  MaterialStoreState,
  NeighborInfo,
  Vec3,
  VisualParams,
} from '../types';

function dist(a: Vec3, b: Vec3): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function computeBonds(atoms: Atom[], maxBondLength: number = 1.8): Bond[] {
  const bonds: Bond[] = [];
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const d = dist(atoms[i].position, atoms[j].position);
      if (d < maxBondLength) {
        bonds.push({
          id: uuidv4(),
          atomAId: atoms[i].id,
          atomBId: atoms[j].id,
          length: d,
        });
        atoms[i].neighbors.push(atoms[j].id);
        atoms[j].neighbors.push(atoms[i].id);
      }
    }
  }
  atoms.forEach((a) => {
    a.coordinationNumber = a.neighbors.length;
  });
  return bonds;
}

function generateCarbonNanotube(): MaterialData {
  const atoms: Atom[] = [];
  const radius = 4.0;
  const length = 12;
  const circumferentialAtoms = 16;
  const layers = 14;
  const bondLength = 1.42;

  const axialStep = bondLength * Math.sqrt(3) / 2;
  const angularStep = (2 * Math.PI) / circumferentialAtoms;

  for (let layer = 0; layer < layers; layer++) {
    const z = -length / 2 + layer * axialStep;
    const offset = layer % 2 === 0 ? 0 : angularStep / 2;

    for (let i = 0; i < circumferentialAtoms; i++) {
      const theta = i * angularStep + offset;
      atoms.push({
        id: uuidv4(),
        element: 'C',
        position: {
          x: radius * Math.cos(theta),
          y: radius * Math.sin(theta),
          z,
        },
        coordinationNumber: 0,
        neighbors: [],
      });
    }
  }

  const bonds = computeBonds(atoms, 1.6);

  return {
    id: 'nanotube',
    name: 'carbon-nanotube',
    displayName: '碳纳米管',
    category: '一维纳米管',
    atoms,
    bonds,
    latticeParams: { a: bondLength, c: axialStep * 2 },
  };
}

function generateGraphene(): MaterialData {
  const atoms: Atom[] = [];
  const sizeX = 8;
  const sizeY = 8;
  const bondLength = 1.42;
  const a = bondLength;
  const dx = a * Math.sqrt(3);
  const dy = a * 1.5;

  for (let i = 0; i < sizeX; i++) {
    for (let j = 0; j < sizeY; j++) {
      const offset = j % 2 === 0 ? 0 : dx / 2;
      atoms.push({
        id: uuidv4(),
        element: 'C',
        position: {
          x: -sizeX * dx / 2 + i * dx + offset,
          y: -sizeY * dy / 2 + j * dy,
          z: 0,
        },
        coordinationNumber: 0,
        neighbors: [],
      });
    }
  }

  const bonds = computeBonds(atoms, 1.6);

  return {
    id: 'graphene',
    name: 'graphene',
    displayName: '石墨烯',
    category: '二维材料',
    atoms,
    bonds,
    latticeParams: { a: dx, b: dy },
  };
}

function generateQuantumDot(): MaterialData {
  const atoms: Atom[] = [];
  const radius = 3.5;
  const spacing = 1.7;

  for (let x = -radius; x <= radius; x += spacing) {
    for (let y = -radius; y <= radius; y += spacing) {
      for (let z = -radius; z <= radius; z += spacing) {
        const r = Math.sqrt(x * x + y * y + z * z);
        if (r <= radius) {
          const distFromSurface = radius - r;
          const element = distFromSurface < 0.8 ? 'Si' : 'C';
          atoms.push({
            id: uuidv4(),
            element,
            position: { x, y, z },
            coordinationNumber: 0,
            neighbors: [],
          });
        }
      }
    }
  }

  const bonds = computeBonds(atoms, 2.0);

  return {
    id: 'quantumdot',
    name: 'silicon-quantum-dot',
    displayName: '硅量子点',
    category: '零维量子点',
    atoms,
    bonds,
    latticeParams: { a: spacing },
  };
}

export function generateMaterials(): Record<MaterialCategory, MaterialData> {
  return {
    nanotube: generateCarbonNanotube(),
    graphene: generateGraphene(),
    quantumdot: generateQuantumDot(),
  };
}

export const useMaterialStore = create<MaterialStoreState>((set, get) => ({
  currentMaterial: 'nanotube',
  materials: generateMaterials(),
  selectedAtom: null,
  visualParams: {
    atomScale: 1.0,
    showBonds: true,
    generateDefects: false,
    defectDensity: 0.1,
  },
  cameraDistance: 20,

  setCurrentMaterial: (id: MaterialCategory) => {
    set({ currentMaterial: id, selectedAtom: null });
  },

  selectAtom: (atom: Atom | null) => {
    set({ selectedAtom: atom });
  },

  setVisualParams: (params: Partial<VisualParams>) => {
    set((state) => ({
      visualParams: { ...state.visualParams, ...params },
    }));
  },

  setCameraDistance: (distance: number) => {
    set({ cameraDistance: Math.max(5, Math.min(80, distance)) });
  },

  searchAndNavigate: (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return;

    const { materials, setCurrentMaterial } = get();
    const categories = Object.values(materials);

    for (const mat of categories) {
      if (
        mat.name.toLowerCase().includes(q) ||
        mat.displayName.toLowerCase().includes(q) ||
        mat.category.toLowerCase().includes(q)
      ) {
        setCurrentMaterial(mat.id);
        return;
      }
    }

    const elementMap: Record<string, MaterialCategory> = {
      c: 'graphene',
      碳: 'graphene',
      carbon: 'graphene',
      si: 'quantumdot',
      硅: 'quantumdot',
      silicon: 'quantumdot',
    };
    if (elementMap[q]) {
      setCurrentMaterial(elementMap[q]);
    }
  },

  getNeighborsWithinRange: (atomId: string, rangeNm: number): NeighborInfo[] => {
    const { materials, currentMaterial } = get();
    const material = materials[currentMaterial];
    const centerAtom = material.atoms.find((a) => a.id === atomId);
    if (!centerAtom) return [];

    const result: NeighborInfo[] = [];
    material.atoms.forEach((atom) => {
      if (atom.id !== atomId) {
        const d = dist(centerAtom.position, atom.position);
        if (d <= rangeNm * 10) {
          result.push({ atom, distance: d });
        }
      }
    });

    return result.sort((a, b) => a.distance - b.distance);
  },
}));
