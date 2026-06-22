import * as THREE from 'three';

export interface AtomData {
  element: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
}

export interface BondData {
  from: number;
  to: number;
  order: number;
}

export interface MoleculeData {
  name: string;
  atoms: AtomData[];
  bonds: BondData[];
}

export function getAtomPosition(atom: AtomData): THREE.Vector3 {
  return new THREE.Vector3(atom.x, atom.y, atom.z);
}

export function createBondGeometry(
  from: THREE.Vector3,
  to: THREE.Vector3,
  order: number = 1
): { positions: THREE.Vector3[]; rotations: THREE.Euler[]; scales: THREE.Vector3[] } {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);

  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(up, direction.normalize());

  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  const bondRadius = 0.08;
  const positions: THREE.Vector3[] = [];
  const rotations: THREE.Euler[] = [];
  const scales: THREE.Vector3[] = [];

  if (order === 1) {
    positions.push(midpoint);
    rotations.push(euler);
    scales.push(new THREE.Vector3(bondRadius * 2, length, bondRadius * 2));
  } else if (order === 2) {
    const offset = 0.12;
    const perpDir = new THREE.Vector3().crossVectors(direction, up).normalize();
    if (perpDir.length() < 0.01) {
      perpDir.set(1, 0, 0);
    }
    const m1 = midpoint.clone().add(perpDir.clone().multiplyScalar(offset));
    const m2 = midpoint.clone().add(perpDir.clone().multiplyScalar(-offset));
    positions.push(m1, m2);
    rotations.push(euler, euler);
    scales.push(
      new THREE.Vector3(bondRadius * 1.5, length, bondRadius * 1.5),
      new THREE.Vector3(bondRadius * 1.5, length, bondRadius * 1.5)
    );
  } else if (order === 3) {
    const offset = 0.15;
    const perpDir = new THREE.Vector3().crossVectors(direction, up).normalize();
    if (perpDir.length() < 0.01) {
      perpDir.set(1, 0, 0);
    }
    const m1 = midpoint.clone().add(perpDir.clone().multiplyScalar(offset));
    const m2 = midpoint.clone();
    const m3 = midpoint.clone().add(perpDir.clone().multiplyScalar(-offset));
    positions.push(m1, m2, m3);
    rotations.push(euler, euler, euler);
    scales.push(
      new THREE.Vector3(bondRadius * 1.2, length, bondRadius * 1.2),
      new THREE.Vector3(bondRadius * 1.2, length, bondRadius * 1.2),
      new THREE.Vector3(bondRadius * 1.2, length, bondRadius * 1.2)
    );
  }

  return { positions, rotations, scales };
}

export function getMoleculeCenter(atoms: AtomData[]): THREE.Vector3 {
  const center = new THREE.Vector3();
  atoms.forEach((atom) => {
    center.add(new THREE.Vector3(atom.x, atom.y, atom.z));
  });
  center.divideScalar(atoms.length);
  return center;
}
