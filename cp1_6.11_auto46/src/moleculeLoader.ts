import * as THREE from 'three';

export type ElementType = 'C' | 'H' | 'O' | 'N' | 'S';

export interface ElementInfo {
  name: string;
  atomicNumber: number;
  atomicRadius: number;
  cpkColor: number;
  displayRadius: number;
}

export interface AtomData {
  id: string;
  element: ElementType;
  position: [number, number, number];
}

export type BondType = 'single' | 'double' | 'triple' | 'aromatic-single' | 'aromatic-double';

export interface BondData {
  atom1Id: string;
  atom2Id: string;
  type: BondType;
}

export interface MoleculeData {
  id: string;
  name: string;
  formula: string;
  atoms: AtomData[];
  bonds: BondData[];
}

export interface MoleculeGroup {
  atomGroup: THREE.Group;
  bondGroup: THREE.Group;
  atomMap: Map<string, THREE.Mesh>;
  bondCount: number;
  atomCount: number;
  data: MoleculeData;
}

export const ELEMENT_INFO: Record<ElementType, ElementInfo> = {
  C: { name: '碳', atomicNumber: 6, atomicRadius: 77, cpkColor: 0x909090, displayRadius: 0.4 },
  H: { name: '氢', atomicNumber: 1, atomicRadius: 37, cpkColor: 0xffffff, displayRadius: 0.2 },
  O: { name: '氧', atomicNumber: 8, atomicRadius: 66, cpkColor: 0xff4444, displayRadius: 0.35 },
  N: { name: '氮', atomicNumber: 7, atomicRadius: 75, cpkColor: 0x3050f8, displayRadius: 0.35 },
  S: { name: '硫', atomicNumber: 16, atomicRadius: 104, cpkColor: 0xffff30, displayRadius: 0.4 },
};

export const MOLECULE_DATABASE: Record<string, MoleculeData> = {
  water: {
    id: 'water',
    name: '水',
    formula: 'H₂O',
    atoms: [
      { id: 'O1', element: 'O', position: [0, 0, 0] },
      { id: 'H1', element: 'H', position: [0.757, 0.586, 0] },
      { id: 'H2', element: 'H', position: [-0.757, 0.586, 0] },
    ],
    bonds: [
      { atom1Id: 'O1', atom2Id: 'H1', type: 'single' },
      { atom1Id: 'O1', atom2Id: 'H2', type: 'single' },
    ],
  },
  methane: {
    id: 'methane',
    name: '甲烷',
    formula: 'CH₄',
    atoms: [
      { id: 'C1', element: 'C', position: [0, 0, 0] },
      { id: 'H1', element: 'H', position: [0.629, 0.629, 0.629] },
      { id: 'H2', element: 'H', position: [-0.629, -0.629, 0.629] },
      { id: 'H3', element: 'H', position: [-0.629, 0.629, -0.629] },
      { id: 'H4', element: 'H', position: [0.629, -0.629, -0.629] },
    ],
    bonds: [
      { atom1Id: 'C1', atom2Id: 'H1', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'H2', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'H3', type: 'single' },
      { atom1Id: 'C1', atom2Id: 'H4', type: 'single' },
    ],
  },
  benzene: {
    id: 'benzene',
    name: '苯',
    formula: 'C₆H₆',
    atoms: generateBenzeneAtoms(),
    bonds: generateBenzeneBonds(),
  },
};

function generateBenzeneAtoms(): AtomData[] {
  const atoms: AtomData[] = [];
  const ccBond = 1.39;
  const chBond = 1.09;

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    atoms.push({
      id: `C${i + 1}`,
      element: 'C',
      position: [
        ccBond * Math.cos(angle),
        ccBond * Math.sin(angle),
        0,
      ],
    });
  }

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    atoms.push({
      id: `H${i + 1}`,
      element: 'H',
      position: [
        (ccBond + chBond) * Math.cos(angle),
        (ccBond + chBond) * Math.sin(angle),
        0,
      ],
    });
  }

  return atoms;
}

function generateBenzeneBonds(): BondData[] {
  const bonds: BondData[] = [];

  for (let i = 0; i < 6; i++) {
    const next = (i + 1) % 6;
    bonds.push({
      atom1Id: `C${i + 1}`,
      atom2Id: `C${next + 1}`,
      type: i % 2 === 0 ? 'aromatic-double' : 'aromatic-single',
    });
  }

  for (let i = 0; i < 6; i++) {
    bonds.push({
      atom1Id: `C${i + 1}`,
      atom2Id: `H${i + 1}`,
      type: 'single',
    });
  }

  return bonds;
}

const BOND_COLORS: Record<BondType, number> = {
  single: 0x888899,
  double: 0x6666aa,
  triple: 0x5555bb,
  'aromatic-single': 0x22aa66,
  'aromatic-double': 0x4488ff,
};

const BOND_OPACITY: Record<BondType, number> = {
  single: 0.65,
  double: 0.7,
  triple: 0.75,
  'aromatic-single': 0.8,
  'aromatic-double': 0.85,
};

const sharedSphereGeo = new THREE.SphereGeometry(1, 32, 24);
const sharedCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1, false);
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function getAtomMaterial(element: ElementType): THREE.MeshStandardMaterial {
  const info = ELEMENT_INFO[element];
  const key = `atom-${element}`;
  if (!materialCache.has(key)) {
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color: info.cpkColor,
        metalness: 0.25,
        roughness: 0.35,
        envMapIntensity: 0.8,
      })
    );
  }
  return materialCache.get(key)!;
}

function getBondMaterial(type: BondType): THREE.MeshStandardMaterial {
  const key = `bond-${type}`;
  if (!materialCache.has(key)) {
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({
        color: BOND_COLORS[type],
        transparent: true,
        opacity: BOND_OPACITY[type],
        metalness: 0.15,
        roughness: 0.5,
        depthWrite: type !== 'single',
      })
    );
  }
  return materialCache.get(key)!;
}

function createBondMesh(
  atom1Pos: THREE.Vector3,
  atom2Pos: THREE.Vector3,
  type: BondType,
  radius: number = 0.05
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(atom2Pos, atom1Pos);
  const length = direction.length();
  const midPoint = new THREE.Vector3().addVectors(atom1Pos, atom2Pos).multiplyScalar(0.5);

  const mesh = new THREE.Mesh(sharedCylinderGeo, getBondMaterial(type));
  mesh.scale.set(radius, length, radius);
  mesh.position.copy(midPoint);

  const up = new THREE.Vector3(0, 1, 0);
  const dirNorm = direction.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dirNorm);
  mesh.quaternion.copy(quaternion);

  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.bondType = type;

  return mesh;
}

export function buildMolecule(moleculeData: MoleculeData): MoleculeGroup {
  const atomGroup = new THREE.Group();
  const bondGroup = new THREE.Group();
  const atomMap = new Map<string, THREE.Mesh>();
  const positionMap = new Map<string, THREE.Vector3>();

  for (const atom of moleculeData.atoms) {
    const info = ELEMENT_INFO[atom.element];
    const mesh = new THREE.Mesh(sharedSphereGeo, getAtomMaterial(atom.element));
    mesh.scale.setScalar(info.displayRadius);
    mesh.position.set(atom.position[0], atom.position[1], atom.position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = {
      atomId: atom.id,
      element: atom.element,
      originalScale: info.displayRadius,
      isAtom: true,
    };
    atomGroup.add(mesh);
    atomMap.set(atom.id, mesh);
    positionMap.set(atom.id, new THREE.Vector3(...atom.position));
  }

  for (const bond of moleculeData.bonds) {
    const p1 = positionMap.get(bond.atom1Id)!;
    const p2 = positionMap.get(bond.atom2Id)!;
    const mesh = createBondMesh(p1, p2, bond.type);
    bondGroup.add(mesh);
  }

  const box = new THREE.Box3().setFromObject(atomGroup);
  const center = box.getCenter(new THREE.Vector3());
  atomGroup.position.sub(center);
  bondGroup.position.sub(center);

  atomGroup.name = 'atoms';
  bondGroup.name = 'bonds';

  return {
    atomGroup,
    bondGroup,
    atomMap,
    bondCount: moleculeData.bonds.length,
    atomCount: moleculeData.atoms.length,
    data: moleculeData,
  };
}

export function getCoordinationNumber(atomId: string, moleculeData: MoleculeData): { count: number; neighbors: ElementType[] } {
  const neighbors: ElementType[] = [];
  const atomElementMap = new Map(moleculeData.atoms.map((a) => [a.id, a.element]));

  for (const bond of moleculeData.bonds) {
    if (bond.atom1Id === atomId) {
      neighbors.push(atomElementMap.get(bond.atom2Id)!);
    } else if (bond.atom2Id === atomId) {
      neighbors.push(atomElementMap.get(bond.atom1Id)!);
    }
  }

  return { count: neighbors.length, neighbors };
}

export function formatCoordination(neighbors: ElementType[]): string {
  if (neighbors.length === 0) return '0';
  const counts = new Map<ElementType, number>();
  for (const el of neighbors) {
    counts.set(el, (counts.get(el) || 0) + 1);
  }
  const parts = Array.from(counts.entries())
    .map(([el, c]) => (c > 1 ? `${el}×${c}` : el))
    .join(', ');
  return `${neighbors.length} (${parts})`;
}

export function disposeMolecule(group: MoleculeGroup | null): void {
  if (!group) return;
  const disposeObj = (obj: THREE.Object3D) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && mesh.geometry !== sharedSphereGeo && mesh.geometry !== sharedCylinderGeo) {
      mesh.geometry.dispose();
    }
  };
  group.atomGroup.traverse(disposeObj);
  group.bondGroup.traverse(disposeObj);
}
