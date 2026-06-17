import * as THREE from 'three';
import { TreeParams } from '../store/useStore';

export interface BranchData {
  id: string;
  level: number;
  start: THREE.Vector3;
  end: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  thickness: number;
  color: THREE.Color;
  angle: number;
}

export interface LeafData {
  position: THREE.Vector3;
  radius: number;
}

export interface TreeData {
  branches: BranchData[];
  leaves: LeafData[];
}

const TRUNK_COLOR = new THREE.Color('#4A3728');
const TOP_COLOR = new THREE.Color('#2D5A27');

const lerpColor = (c1: THREE.Color, c2: THREE.Color, t: number): THREE.Color => {
  return c1.clone().lerp(c2, t);
};

const randomAngleOffset = (maxDeg: number): number => {
  if (maxDeg === 0) return 0;
  return (Math.random() - 0.5) * 2 * maxDeg * (Math.PI / 180);
};

interface BranchState {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  thickness: number;
  level: number;
}

export const generateTree = (params: TreeParams): TreeData => {
  const { angle, scale, depth, thicknessDecay, randomness, leafDensity } = params;
  const angleRad = (angle * Math.PI) / 180;

  const branches: BranchData[] = [];
  const leaves: LeafData[] = [];
  const idCounter = { val: 0 };
  const branchId = () => `branch_${idCounter.val++}`;

  const leafReduction = depth > 6 ? 0.5 : 1;
  const effectiveLeafDensity = Math.max(0, Math.round(leafDensity * leafReduction));

  const stack: BranchState[] = [
    {
      position: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 1, 0),
      length: 1.5,
      thickness: 0.12,
      level: 0,
    },
  ];

  while (stack.length > 0) {
    const state = stack.pop()!;
    if (state.level >= depth) continue;

    const end = state.position.clone().add(state.direction.clone().multiplyScalar(state.length));

    const colorT = depth === 0 ? 0 : state.level / (depth - 1);
    const branchColor = lerpColor(TRUNK_COLOR, TOP_COLOR, Math.min(colorT, 1));

    const branchAngleDeg = angle + (randomness > 0 ? (Math.random() - 0.5) * 2 * randomness : 0);

    const branch: BranchData = {
      id: branchId(),
      level: state.level,
      start: state.position.clone(),
      end: end.clone(),
      direction: state.direction.clone(),
      length: state.length,
      thickness: state.thickness,
      color: branchColor,
      angle: branchAngleDeg,
    };
    branches.push(branch);

    if (state.level === depth - 1 && effectiveLeafDensity > 0) {
      for (let i = 0; i < effectiveLeafDensity; i++) {
        const t = 0.6 + Math.random() * 0.4;
        const leafPos = new THREE.Vector3().lerpVectors(state.position, end, t);
        leafPos.x += (Math.random() - 0.5) * 0.2;
        leafPos.y += (Math.random() - 0.5) * 0.15;
        leafPos.z += (Math.random() - 0.5) * 0.2;

        leaves.push({
          position: leafPos,
          radius: 0.05 + Math.random() * 0.1,
        });
      }
    }

    if (state.level < depth - 1) {
      const childCount = state.level === 0 ? 2 : 2;
      const nextLength = state.length * scale;
      const nextThickness = state.thickness * thicknessDecay;

      for (let i = 0; i < childCount; i++) {
        const rotationAngle = (i / childCount) * Math.PI * 2;

        const up = new THREE.Vector3(0, 1, 0);
        const baseDir = state.direction.clone().normalize();
        let tangent: THREE.Vector3;
        if (Math.abs(baseDir.dot(up)) > 0.95) {
          tangent = new THREE.Vector3(1, 0, 0);
        } else {
          tangent = new THREE.Vector3().crossVectors(baseDir, up).normalize();
        }
        const bitangent = new THREE.Vector3().crossVectors(baseDir, tangent).normalize();

        const totalAngle = angleRad + randomAngleOffset(randomness);

        let newDir = baseDir.clone().multiplyScalar(Math.cos(totalAngle));
        newDir.add(tangent.multiplyScalar(Math.sin(totalAngle) * Math.cos(rotationAngle)));
        newDir.add(bitangent.multiplyScalar(Math.sin(totalAngle) * Math.sin(rotationAngle)));
        newDir.normalize();

        stack.push({
          position: end.clone(),
          direction: newDir,
          length: nextLength,
          thickness: Math.max(0.005, nextThickness),
          level: state.level + 1,
        });
      }
    }
  }

  return { branches, leaves };
};
