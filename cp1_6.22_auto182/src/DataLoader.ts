export interface AtomData {
  id: number;
  element: string;
  x: number;
  y: number;
  z: number;
  name: string;
  mass: number;
  color: string;
  covalentRadius: number;
}

export interface BondData {
  from: number;
  to: number;
  order: number;
}

export interface MoleculeData {
  name: string;
  formula: string;
  atoms: AtomData[];
  bonds: BondData[];
}

export interface MoleculeInfo {
  id: string;
  name: string;
  formula: string;
  atomCount: number;
}

export async function fetchMoleculeList(): Promise<MoleculeInfo[]> {
  const response = await fetch('/api/molecules');
  if (!response.ok) {
    throw new Error('获取分子列表失败');
  }
  return response.json();
}

export async function fetchMolecule(id: string): Promise<MoleculeData> {
  const response = await fetch(`/api/molecules/${id}`);
  if (!response.ok) {
    throw new Error('获取分子数据失败');
  }
  return response.json();
}

export function calculateMoleculeRadius(atoms: AtomData[]): number {
  if (atoms.length === 0) return 1;
  
  let maxDist = 0;
  for (const atom of atoms) {
    const dist = Math.sqrt(atom.x ** 2 + atom.y ** 2 + atom.z ** 2) + atom.covalentRadius;
    if (dist > maxDist) {
      maxDist = dist;
    }
  }
  return maxDist || 1;
}
