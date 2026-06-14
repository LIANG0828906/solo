import * as THREE from 'three';
import type { MoleculeData, ParsedMolecule } from '@/types';

export function parseMoleculeData(data: MoleculeData): ParsedMolecule {
  const atoms = data.atoms.map((atom) => ({
    id: atom.id,
    element: atom.element,
    position: [atom.x, atom.y, atom.z] as [number, number, number],
  }));

  const bonds = data.bonds.map((bond) => ({
    id: bond.id,
    atom1Id: bond.atom1,
    atom2Id: bond.atom2,
    order: bond.order,
  }));

  return { atoms, bonds };
}

export function validateSDFContent(content: string): { valid: boolean; error?: string; atomCount?: number } {
  const lines = content.split(/\r?\n/);

  if (lines.length < 4) {
    return { valid: false, error: 'SDF文件格式不正确：文件内容过短' };
  }

  const countsLine = lines[3];
  const countsMatch = countsLine.trim().match(/^(\d+)\s+(\d+)/);

  if (!countsMatch) {
    return { valid: false, error: 'SDF文件格式不正确：无法解析原子/键计数行' };
  }

  const atomCount = parseInt(countsMatch[1], 10);
  const bondCount = parseInt(countsMatch[2], 10);

  if (atomCount <= 0 || atomCount > 5000) {
    return { valid: false, error: `原子数量异常：${atomCount}个，有效范围为1-5000` };
  }

  const expectedAtomLines = atomCount;
  const expectedBondLines = bondCount;
  const expectedTotalLines = 4 + expectedAtomLines + expectedBondLines;

  if (lines.length < expectedTotalLines) {
    return {
      valid: false,
      error: `SDF文件内容不完整：预期至少${expectedTotalLines}行，实际只有${lines.length}行`,
      atomCount,
    };
  }

  for (let i = 4; i < 4 + expectedAtomLines; i++) {
    const atomLine = lines[i];
    const atomMatch = atomLine.trim().match(/^(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+([A-Za-z]+)/);
    if (!atomMatch) {
      return { valid: false, error: `SDF文件格式不正确：第${i + 1}行原子数据格式错误`, atomCount };
    }
  }

  return { valid: true, atomCount };
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > MAX_FILE_SIZE) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    return { valid: false, error: `文件大小为${sizeMB}MB，超过10MB限制` };
  }
  return { valid: true };
}

export function getBondsForAtom(bonds: ParsedMolecule['bonds'], atomId: string): number {
  return bonds.filter((b) => b.atom1Id === atomId || b.atom2Id === atomId).length;
}

export function calculateBondCenterAndOrientation(
  pos1: [number, number, number],
  pos2: [number, number, number]
): {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
} {
  const dx = pos2[0] - pos1[0];
  const dy = pos2[1] - pos1[1];
  const dz = pos2[2] - pos1[2];

  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const cx = (pos1[0] + pos2[0]) / 2;
  const cy = (pos1[1] + pos2[1]) / 2;
  const cz = (pos1[2] + pos2[2]) / 2;

  const axis = new THREE.Vector3(dx, dy, dz).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, axis);
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  return {
    position: [cx, cy, cz],
    rotation: [euler.x, euler.y, euler.z],
    length,
  };
}
