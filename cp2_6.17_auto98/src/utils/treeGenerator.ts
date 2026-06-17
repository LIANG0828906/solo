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

interface LSystemState {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  up: THREE.Vector3;
  length: number;
  thickness: number;
  level: number;
}

const TRUNK_COLOR = new THREE.Color('#4A3728');
const TOP_COLOR = new THREE.Color('#2D5A27');
const LEAF_COLOR = new THREE.Color('#2D5A27');

const lerpColor = (c1: THREE.Color, c2: THREE.Color, t: number): THREE.Color => {
  return c1.clone().lerp(c2, Math.min(1, Math.max(0, t)));
};

export const generateLSystemString = (axiom: string, rules: Record<string, string>, iterations: number): string => {
  let result = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = '';
    for (let j = 0; j < result.length; j++) {
      const char = result[j];
      next += rules[char] !== undefined ? rules[char] : char;
    }
    result = next;
  }
  return result;
};

export const generateTree = (params: TreeParams): TreeData => {
  const { angle, scale, depth, thicknessDecay, randomness, leafDensity } = params;
  const angleRad = (angle * Math.PI) / 180;
  const rollAngle = (360 / 3) * (Math.PI / 180);

  const axiom = 'A';
  const rules: Record<string, string> = {
    A: '[&FL!A]/////[&FL!A]/////[&FL!A]',
    F: 'S/////F',
    S: 'FL',
  };

  const lSystemStr = generateLSystemString(axiom, rules, depth);

  const branches: BranchData[] = [];
  const leaves: LeafData[] = [];
  let idCounter = 0;
  const branchId = () => `branch_${idCounter++}`;

  const leafReduction = depth > 6 ? 0.5 : 1;
  const effectiveLeafDensity = Math.max(0, Math.round(leafDensity * leafReduction));

  const stack: LSystemState[] = [];

  const initialLength = 1.5;
  const initialThickness = 0.12;

  let currentState: LSystemState = {
    position: new THREE.Vector3(0, 0, 0),
    direction: new THREE.Vector3(0, 1, 0),
    up: new THREE.Vector3(0, 0, 1),
    length: initialLength,
    thickness: initialThickness,
    level: 0,
  };

  const rotateAroundAxis = (dir: THREE.Vector3, axis: THREE.Vector3, ang: number): THREE.Vector3 => {
    return dir.clone().applyAxisAngle(axis, ang);
  };

  const randomOffset = (maxDeg: number): number => {
    if (maxDeg === 0) return 0;
    return (Math.random() - 0.5) * 2 * maxDeg * (Math.PI / 180);
  };

  let maxLevel = 0;
  const tempBranches: Array<Omit<BranchData, 'color'> & { colorT: number }> = [];

  for (let i = 0; i < lSystemStr.length; i++) {
    const char = lSystemStr[i];

    switch (char) {
      case 'F':
      case 'L': {
        const randAngleX = randomOffset(randomness);
        const randAngleY = randomOffset(randomness * 0.5);
        const randAngleZ = randomOffset(randomness * 0.5);

        let dir = currentState.direction.clone();
        const right = new THREE.Vector3().crossVectors(dir, currentState.up).normalize();
        const actualUp = new THREE.Vector3().crossVectors(right, dir).normalize();

        dir.applyAxisAngle(right, randAngleX);
        dir.applyAxisAngle(actualUp, randAngleY);
        dir.applyAxisAngle(dir, randAngleZ);
        dir.normalize();

        const newUp = actualUp.clone().applyAxisAngle(dir, randAngleZ).normalize();

        const end = currentState.position.clone().add(dir.clone().multiplyScalar(currentState.length));

        const avgAngleDeg = angle + (randomness > 0 ? (Math.random() - 0.5) * randomness : 0);

        tempBranches.push({
          id: branchId(),
          level: currentState.level,
          start: currentState.position.clone(),
          end: end.clone(),
          direction: dir.clone(),
          length: currentState.length,
          thickness: currentState.thickness,
          colorT: 0,
          angle: avgAngleDeg,
        });

        if (currentState.level > maxLevel) {
          maxLevel = currentState.level;
        }

        currentState = {
          ...currentState,
          position: end,
          direction: dir,
          up: newUp,
        };

        if (char === 'L' && effectiveLeafDensity > 0) {
          for (let li = 0; li < effectiveLeafDensity; li++) {
            const t = 0.5 + Math.random() * 0.5;
            const leafPos = new THREE.Vector3().lerpVectors(
              currentState.position.clone().add(dir.clone().multiplyScalar(-currentState.length)),
              end,
              t
            );
            leafPos.x += (Math.random() - 0.5) * 0.15;
            leafPos.y += (Math.random() - 0.5) * 0.1;
            leafPos.z += (Math.random() - 0.5) * 0.15;

            leaves.push({
              position: leafPos,
              radius: 0.05 + Math.random() * 0.1,
            });
          }
        }
        break;
      }

      case 'S': {
        const end = currentState.position.clone().add(
          currentState.direction.clone().multiplyScalar(currentState.length * 0.3)
        );
        currentState = {
          ...currentState,
          position: end,
        };
        break;
      }

      case '+': {
        const right = new THREE.Vector3().crossVectors(currentState.direction, currentState.up).normalize();
        const newDir = rotateAroundAxis(currentState.direction, right, angleRad + randomOffset(randomness));
        const newUp = new THREE.Vector3().crossVectors(right, newDir).normalize();
        currentState = {
          ...currentState,
          direction: newDir,
          up: newUp,
        };
        break;
      }

      case '-': {
        const right = new THREE.Vector3().crossVectors(currentState.direction, currentState.up).normalize();
        const newDir = rotateAroundAxis(currentState.direction, right, -angleRad - randomOffset(randomness));
        const newUp = new THREE.Vector3().crossVectors(right, newDir).normalize();
        currentState = {
          ...currentState,
          direction: newDir,
          up: newUp,
        };
        break;
      }

      case '&': {
        const right = new THREE.Vector3().crossVectors(currentState.direction, currentState.up).normalize();
        const newDir = rotateAroundAxis(currentState.direction, right, angleRad + randomOffset(randomness));
        const newUp = new THREE.Vector3().crossVectors(right, newDir).normalize();
        currentState = {
          ...currentState,
          direction: newDir,
          up: newUp,
        };
        break;
      }

      case '^': {
        const right = new THREE.Vector3().crossVectors(currentState.direction, currentState.up).normalize();
        const newDir = rotateAroundAxis(currentState.direction, right, -angleRad - randomOffset(randomness));
        const newUp = new THREE.Vector3().crossVectors(right, newDir).normalize();
        currentState = {
          ...currentState,
          direction: newDir,
          up: newUp,
        };
        break;
      }

      case '\\': {
        const newUp = currentState.up.clone().applyAxisAngle(currentState.direction, -rollAngle - randomOffset(randomness * 0.5));
        currentState = {
          ...currentState,
          up: newUp.normalize(),
        };
        break;
      }

      case '/': {
        const newUp = currentState.up.clone().applyAxisAngle(currentState.direction, rollAngle + randomOffset(randomness * 0.5));
        currentState = {
          ...currentState,
          up: newUp.normalize(),
        };
        break;
      }

      case '[': {
        stack.push({
          position: currentState.position.clone(),
          direction: currentState.direction.clone(),
          up: currentState.up.clone(),
          length: currentState.length,
          thickness: currentState.thickness,
          level: currentState.level,
        });
        currentState = {
          ...currentState,
          level: currentState.level + 1,
          length: currentState.length * scale,
          thickness: Math.max(0.005, currentState.thickness * thicknessDecay),
        };
        break;
      }

      case ']': {
        const prev = stack.pop();
        if (prev) {
          currentState = prev;
        }
        break;
      }

      case '!': {
        currentState = {
          ...currentState,
          thickness: Math.max(0.005, currentState.thickness * thicknessDecay),
        };
        break;
      }

      case "'": {
        break;
      }

      default:
        break;
    }
  }

  for (const tb of tempBranches) {
    const colorT = maxLevel === 0 ? 0 : tb.level / maxLevel;
    const branchColor = lerpColor(TRUNK_COLOR, TOP_COLOR, colorT);
    branches.push({
      id: tb.id,
      level: tb.level,
      start: tb.start,
      end: tb.end,
      direction: tb.direction,
      length: tb.length,
      thickness: tb.thickness,
      color: branchColor,
      angle: tb.angle,
    });
  }

  return { branches, leaves };
};

export { LEAF_COLOR };
