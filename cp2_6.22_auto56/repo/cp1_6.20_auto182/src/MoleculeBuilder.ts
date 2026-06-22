import * as THREE from 'three';

export interface ElementData {
  symbol: string;
  atomicNumber: number;
  color: number;
  radius: number;
}

export const ELEMENTS: Record<string, ElementData> = {
  H: { symbol: 'H', atomicNumber: 1, color: 0xffffff, radius: 0.35 },
  C: { symbol: 'C', atomicNumber: 6, color: 0x555555, radius: 0.7 },
  O: { symbol: 'O', atomicNumber: 8, color: 0xe53935, radius: 0.6 },
};

export interface BondData {
  atom1: number;
  atom2: number;
  type: 'single' | 'double' | 'triple';
  energy: number;
}

export interface MoleculeData {
  name: string;
  formula: string;
  atoms: { element: string; position: [number, number, number] }[];
  bonds: BondData[];
}

export const BOND_ENERGIES: Record<string, number> = {
  'H-H': 436,
  'C-H': 413,
  'C-C': 347,
  'C=C': 614,
  'C≡C': 839,
  'C-O': 358,
  'C=O': 745,
  'O-H': 463,
};

export function getBondEnergy(elem1: string, elem2: string, type: 'single' | 'double' | 'triple'): number {
  const prefix = type === 'triple' ? '≡' : type === 'double' ? '=' : '-';
  const key1 = `${elem1}${prefix}${elem2}`;
  const key2 = `${elem2}${prefix}${elem1}`;
  return BOND_ENERGIES[key1] || BOND_ENERGIES[key2] || 0;
}

export const MOLECULES: Record<string, MoleculeData> = {
  H2O: {
    name: '水分子',
    formula: 'H₂O',
    atoms: [
      { element: 'O', position: [0, 0, 0] },
      { element: 'H', position: [-0.76, 0.59, 0] },
      { element: 'H', position: [0.76, 0.59, 0] },
    ],
    bonds: [
      { atom1: 0, atom2: 1, type: 'single', energy: getBondEnergy('O', 'H', 'single') },
      { atom1: 0, atom2: 2, type: 'single', energy: getBondEnergy('O', 'H', 'single') },
    ],
  },
  CO2: {
    name: '二氧化碳',
    formula: 'CO₂',
    atoms: [
      { element: 'C', position: [0, 0, 0] },
      { element: 'O', position: [-1.16, 0, 0] },
      { element: 'O', position: [1.16, 0, 0] },
    ],
    bonds: [
      { atom1: 0, atom2: 1, type: 'double', energy: getBondEnergy('C', 'O', 'double') },
      { atom1: 0, atom2: 2, type: 'double', energy: getBondEnergy('C', 'O', 'double') },
    ],
  },
  C6H6: {
    name: '苯',
    formula: 'C₆H₆',
    atoms: [
      { element: 'C', position: [1.4, 0, 0] },
      { element: 'C', position: [0.7, 1.21, 0] },
      { element: 'C', position: [-0.7, 1.21, 0] },
      { element: 'C', position: [-1.4, 0, 0] },
      { element: 'C', position: [-0.7, -1.21, 0] },
      { element: 'C', position: [0.7, -1.21, 0] },
      { element: 'H', position: [2.49, 0, 0] },
      { element: 'H', position: [1.24, 2.16, 0] },
      { element: 'H', position: [-1.24, 2.16, 0] },
      { element: 'H', position: [-2.49, 0, 0] },
      { element: 'H', position: [-1.24, -2.16, 0] },
      { element: 'H', position: [1.24, -2.16, 0] },
    ],
    bonds: [
      { atom1: 0, atom2: 1, type: 'double', energy: getBondEnergy('C', 'C', 'double') },
      { atom1: 1, atom2: 2, type: 'single', energy: getBondEnergy('C', 'C', 'single') },
      { atom1: 2, atom2: 3, type: 'double', energy: getBondEnergy('C', 'C', 'double') },
      { atom1: 3, atom2: 4, type: 'single', energy: getBondEnergy('C', 'C', 'single') },
      { atom1: 4, atom2: 5, type: 'double', energy: getBondEnergy('C', 'C', 'double') },
      { atom1: 5, atom2: 0, type: 'single', energy: getBondEnergy('C', 'C', 'single') },
      { atom1: 0, atom2: 6, type: 'single', energy: getBondEnergy('C', 'H', 'single') },
      { atom1: 1, atom2: 7, type: 'single', energy: getBondEnergy('C', 'H', 'single') },
      { atom1: 2, atom2: 8, type: 'single', energy: getBondEnergy('C', 'H', 'single') },
      { atom1: 3, atom2: 9, type: 'single', energy: getBondEnergy('C', 'H', 'single') },
      { atom1: 4, atom2: 10, type: 'single', energy: getBondEnergy('C', 'H', 'single') },
      { atom1: 5, atom2: 11, type: 'single', energy: getBondEnergy('C', 'H', 'single') },
    ],
  },
};

export interface AtomMeshUserData {
  kind: 'atom';
  index: number;
  element: string;
  bondCount: number;
  baseMaterial: THREE.MeshStandardMaterial;
  highlightMesh: THREE.Mesh;
}

export interface BondMeshUserData {
  kind: 'bond';
  index: number;
  atom1: string;
  atom2: string;
  type: 'single' | 'double' | 'triple';
  energy: number;
  baseOpacity: number;
  baseRadius: number;
}

export type InteractiveObject = THREE.Mesh & { userData: AtomMeshUserData | BondMeshUserData };

export interface BuiltMolecule {
  group: THREE.Group;
  atomMeshes: THREE.Mesh[];
  bondMeshes: THREE.Mesh[];
  data: MoleculeData;
}

const ATOM_SEGMENTS = 32;
const BOND_RADIUS_SINGLE = 0.18;
const BOND_RADIUS_DOUBLE = 0.14;

function createAtom(element: string, position: [number, number, number], bondCount: number) {
  const elemData = ELEMENTS[element];
  const geometry = new THREE.SphereGeometry(elemData.radius, ATOM_SEGMENTS, ATOM_SEGMENTS);
  const material = new THREE.MeshStandardMaterial({
    color: elemData.color,
    metalness: 0.15,
    roughness: 0.55,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);

  const highlightGeo = new THREE.SphereGeometry(elemData.radius * 1.25, ATOM_SEGMENTS, ATOM_SEGMENTS);
  const highlightMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
  });
  const highlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
  mesh.add(highlightMesh);

  (mesh.userData as AtomMeshUserData) = {
    kind: 'atom',
    index: -1,
    element,
    bondCount,
    baseMaterial: material,
    highlightMesh,
  };

  return mesh;
}

function createBondCylinder(
  pos1: THREE.Vector3,
  pos2: THREE.Vector3,
  radius: number,
  offset: number = 0
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(pos2, pos1);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length - 0.1, 16, 1, false);
  const material = new THREE.MeshStandardMaterial({
    color: 0x9e9e9e,
    metalness: 0.6,
    roughness: 0.3,
    transparent: true,
    opacity: 0.45,
  });

  const mesh = new THREE.Mesh(geometry, material);

  const midPoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
  if (offset !== 0) {
    const perp = new THREE.Vector3(0, 0, 1).cross(direction).normalize();
    midPoint.add(perp.multiplyScalar(offset));
  }

  mesh.position.copy(midPoint);
  mesh.lookAt(pos2);
  mesh.rotateX(Math.PI / 2);

  return mesh;
}

function createBondHitbox(pos1: THREE.Vector3, pos2: THREE.Vector3): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(pos2, pos1);
  const length = direction.length();
  const hitboxRadius = 0.45;
  const geometry = new THREE.CylinderGeometry(hitboxRadius, hitboxRadius, length, 8, 1, false);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  const midPoint = new THREE.Vector3().addVectors(pos1, pos2).multiplyScalar(0.5);
  mesh.position.copy(midPoint);
  mesh.lookAt(pos2);
  mesh.rotateX(Math.PI / 2);
  mesh.userData.isBondHitbox = true;
  (mesh.userData as { isBondHitbox?: boolean }).isBondHitbox = true;

  return mesh;
}

export function buildMolecule(key: string): BuiltMolecule {
  const data = MOLECULES[key];
  const group = new THREE.Group();

  const bondCountMap = new Map<number, number>();
  data.bonds.forEach((b) => {
    bondCountMap.set(b.atom1, (bondCountMap.get(b.atom1) || 0) + 1);
    bondCountMap.set(b.atom2, (bondCountMap.get(b.atom2) || 0) + 1);
  });

  const atomMeshes: THREE.Mesh[] = data.atoms.map((atom, idx) => {
    const mesh = createAtom(atom.element, atom.position, bondCountMap.get(idx) || 0);
    (mesh.userData as AtomMeshUserData).index = idx;
    group.add(mesh);
    return mesh;
  });

  const bondMeshes: THREE.Mesh[] = [];

  data.bonds.forEach((bond, idx) => {
    const pos1 = new THREE.Vector3(...data.atoms[bond.atom1].position);
    const pos2 = new THREE.Vector3(...data.atoms[bond.atom2].position);
    const elem1 = data.atoms[bond.atom1].element;
    const elem2 = data.atoms[bond.atom2].element;
    const baseRadius = bond.type === 'double' ? BOND_RADIUS_DOUBLE : BOND_RADIUS_SINGLE;

    const g = new THREE.Group();

    if (bond.type === 'double') {
      const c1 = createBondCylinder(pos1, pos2, baseRadius, baseRadius * 2.0);
      const c2 = createBondCylinder(pos1, pos2, baseRadius, -baseRadius * 2.0);
      g.add(c1, c2);
    } else {
      const c = createBondCylinder(pos1, pos2, baseRadius, 0);
      g.add(c);
    }

    const hitbox = createBondHitbox(pos1, pos2);
    g.add(hitbox);

    const bondGroup = g as unknown as THREE.Mesh;

    (bondGroup.userData as BondMeshUserData) = {
      kind: 'bond',
      index: idx,
      atom1: elem1,
      atom2: elem2,
      type: bond.type,
      energy: bond.energy,
      baseOpacity: 0.45,
      baseRadius,
    };

    group.add(bondGroup);
    bondMeshes.push(bondGroup);
  });

  return { group, atomMeshes, bondMeshes, data };
}

export function collectInteractiveObjects(mol: BuiltMolecule): InteractiveObject[] {
  const result: InteractiveObject[] = [];
  mol.atomMeshes.forEach((m) => result.push(m as InteractiveObject));
  mol.bondMeshes.forEach((m) => result.push(m as InteractiveObject));
  return result;
}
