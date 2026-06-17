import { v4 as uuidv4 } from 'uuid';
import type { CrystalType, AtomData, BondData } from './store';

export interface CrystalConfig {
  Na: { color: string; radius: number };
  Cl: { color: string; radius: number };
  Cs: { color: string; radius: number };
  Zn: { color: string; radius: number };
  S: { color: string; radius: number };
}

export const ATOM_CONFIG: CrystalConfig = {
  Na: { color: '#FFD700', radius: 0.4 },
  Cl: { color: '#00BFFF', radius: 0.6 },
  Cs: { color: '#9966FF', radius: 0.5 },
  Zn: { color: '#66FF99', radius: 0.35 },
  S: { color: '#FFAA33', radius: 0.45 },
};

function generateNaCl(latticeConstant: number): { atoms: AtomData[]; bonds: BondData[] } {
  const atoms: AtomData[] = [];
  const bonds: BondData[] = [];
  const a = latticeConstant;
  const half = a / 2;

  const clPositions: [number, number, number][] = [
    [0, 0, 0],
    [half, half, 0],
    [half, 0, half],
    [0, half, half],
    [a, 0, 0],
    [0, a, 0],
    [0, 0, a],
    [a, a, 0],
    [a, 0, a],
    [0, a, a],
    [a, a, a],
    [half, half, a],
    [half, a, half],
    [a, half, half],
  ];

  const naPositions: [number, number, number][] = [
    [half, 0, 0],
    [0, half, 0],
    [0, 0, half],
    [half, half, half],
    [a, half, 0],
    [half, a, 0],
    [a, 0, half],
    [0, a, half],
    [half, 0, a],
    [0, half, a],
    [a, half, a],
    [half, a, a],
    [a, a, half],
  ];

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = -1; k <= 1; k++) {
        if (Math.abs(i) + Math.abs(j) + Math.abs(k) <= 1) {
          const offsetX = i * a;
          const offsetY = j * a;
          const offsetZ = k * a;

          clPositions.forEach((pos) => {
            const x = pos[0] + offsetX - a / 2;
            const y = pos[1] + offsetY - a / 2;
            const z = pos[2] + offsetZ - a / 2;
            const dist = Math.sqrt(x * x + y * y + z * z);
            if (dist <= a * 1.2) {
              atoms.push({
                id: uuidv4(),
                position: [x, y, z],
                color: ATOM_CONFIG.Cl.color,
                radius: ATOM_CONFIG.Cl.radius,
                element: 'Cl',
              });
            }
          });

          naPositions.forEach((pos) => {
            const x = pos[0] + offsetX - a / 2;
            const y = pos[1] + offsetY - a / 2;
            const z = pos[2] + offsetZ - a / 2;
            const dist = Math.sqrt(x * x + y * y + z * z);
            if (dist <= a * 1.2) {
              atoms.push({
                id: uuidv4(),
                position: [x, y, z],
                color: ATOM_CONFIG.Na.color,
                radius: ATOM_CONFIG.Na.radius,
                element: 'Na',
              });
            }
          });
        }
      }
    }
  }

  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const a1 = atoms[i];
      const a2 = atoms[j];
      const dx = a2.position[0] - a1.position[0];
      const dy = a2.position[1] - a1.position[1];
      const dz = a2.position[2] - a1.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 0 && dist <= half * 1.1 && a1.element !== a2.element) {
        bonds.push({
          id: uuidv4(),
          atomA: a1.id,
          atomB: a2.id,
          positionA: a1.position,
          positionB: a2.position,
        });
      }
    }
  }

  return { atoms, bonds };
}

function generateCsCl(latticeConstant: number): { atoms: AtomData[]; bonds: BondData[] } {
  const atoms: AtomData[] = [];
  const bonds: BondData[] = [];
  const a = latticeConstant;
  const half = a / 2;

  const clPositions: [number, number, number][] = [
    [0, 0, 0],
    [a, 0, 0],
    [0, a, 0],
    [0, 0, a],
    [a, a, 0],
    [a, 0, a],
    [0, a, a],
    [a, a, a],
  ];

  const csPositions: [number, number, number][] = [
    [half, half, half],
  ];

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = -1; k <= 1; k++) {
        if (Math.abs(i) + Math.abs(j) + Math.abs(k) <= 1) {
          const offsetX = i * a;
          const offsetY = j * a;
          const offsetZ = k * a;

          clPositions.forEach((pos) => {
            const x = pos[0] + offsetX - a / 2;
            const y = pos[1] + offsetY - a / 2;
            const z = pos[2] + offsetZ - a / 2;
            const dist = Math.sqrt(x * x + y * y + z * z);
            if (dist <= a * 1.2) {
              atoms.push({
                id: uuidv4(),
                position: [x, y, z],
                color: ATOM_CONFIG.Cl.color,
                radius: ATOM_CONFIG.Cl.radius,
                element: 'Cl',
              });
            }
          });

          csPositions.forEach((pos) => {
            const x = pos[0] + offsetX - a / 2;
            const y = pos[1] + offsetY - a / 2;
            const z = pos[2] + offsetZ - a / 2;
            const dist = Math.sqrt(x * x + y * y + z * z);
            if (dist <= a * 1.2) {
              atoms.push({
                id: uuidv4(),
                position: [x, y, z],
                color: ATOM_CONFIG.Cs.color,
                radius: ATOM_CONFIG.Cs.radius,
                element: 'Cs',
              });
            }
          });
        }
      }
    }
  }

  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const a1 = atoms[i];
      const a2 = atoms[j];
      const dx = a2.position[0] - a1.position[0];
      const dy = a2.position[1] - a1.position[1];
      const dz = a2.position[2] - a1.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const bondLength = (a * Math.sqrt(3)) / 2;
      if (dist > 0 && dist <= bondLength * 1.1 && a1.element !== a2.element) {
        bonds.push({
          id: uuidv4(),
          atomA: a1.id,
          atomB: a2.id,
          positionA: a1.position,
          positionB: a2.position,
        });
      }
    }
  }

  return { atoms, bonds };
}

function generateZnS(latticeConstant: number): { atoms: AtomData[]; bonds: BondData[] } {
  const atoms: AtomData[] = [];
  const bonds: BondData[] = [];
  const a = latticeConstant;
  const half = a / 2;
  const quarter = a / 4;

  const sPositions: [number, number, number][] = [
    [0, 0, 0],
    [half, half, 0],
    [half, 0, half],
    [0, half, half],
    [a, 0, 0],
    [0, a, 0],
    [0, 0, a],
    [a, a, 0],
    [a, 0, a],
    [0, a, a],
    [a, a, a],
    [half, half, a],
    [half, a, half],
    [a, half, half],
  ];

  const znPositions: [number, number, number][] = [
    [quarter, quarter, quarter],
    [quarter, quarter + half, quarter + half],
    [quarter + half, quarter, quarter + half],
    [quarter + half, quarter + half, quarter],
  ];

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      for (let k = -1; k <= 1; k++) {
        if (Math.abs(i) + Math.abs(j) + Math.abs(k) <= 1) {
          const offsetX = i * a;
          const offsetY = j * a;
          const offsetZ = k * a;

          sPositions.forEach((pos) => {
            const x = pos[0] + offsetX - a / 2;
            const y = pos[1] + offsetY - a / 2;
            const z = pos[2] + offsetZ - a / 2;
            const dist = Math.sqrt(x * x + y * y + z * z);
            if (dist <= a * 1.2) {
              atoms.push({
                id: uuidv4(),
                position: [x, y, z],
                color: ATOM_CONFIG.S.color,
                radius: ATOM_CONFIG.S.radius,
                element: 'S',
              });
            }
          });

          znPositions.forEach((pos) => {
            const x = pos[0] + offsetX - a / 2;
            const y = pos[1] + offsetY - a / 2;
            const z = pos[2] + offsetZ - a / 2;
            const dist = Math.sqrt(x * x + y * y + z * z);
            if (dist <= a * 1.2) {
              atoms.push({
                id: uuidv4(),
                position: [x, y, z],
                color: ATOM_CONFIG.Zn.color,
                radius: ATOM_CONFIG.Zn.radius,
                element: 'Zn',
              });
            }
          });
        }
      }
    }
  }

  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const a1 = atoms[i];
      const a2 = atoms[j];
      const dx = a2.position[0] - a1.position[0];
      const dy = a2.position[1] - a1.position[1];
      const dz = a2.position[2] - a1.position[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const bondLength = (a * Math.sqrt(3)) / 4;
      if (dist > 0 && dist <= bondLength * 1.3 && a1.element !== a2.element) {
        bonds.push({
          id: uuidv4(),
          atomA: a1.id,
          atomB: a2.id,
          positionA: a1.position,
          positionB: a2.position,
        });
      }
    }
  }

  return { atoms, bonds };
}

export function generateCrystal(
  type: CrystalType,
  latticeConstant: number
): { atoms: AtomData[]; bonds: BondData[] } {
  switch (type) {
    case 'NaCl':
      return generateNaCl(latticeConstant);
    case 'CsCl':
      return generateCsCl(latticeConstant);
    case 'ZnS':
      return generateZnS(latticeConstant);
    default:
      return generateNaCl(latticeConstant);
  }
}

export function getExplodedPosition(
  position: [number, number, number],
  explodeFactor: number
): [number, number, number] {
  const [x, y, z] = position;
  const factor = 1 + explodeFactor;
  return [x * factor, y * factor, z * factor];
}

export function getCrystalDescription(type: CrystalType): string {
  switch (type) {
    case 'NaCl':
      return '面心立方晶格';
    case 'CsCl':
      return '体心立方晶格';
    case 'ZnS':
      return '闪锌矿结构';
    default:
      return '';
  }
}
