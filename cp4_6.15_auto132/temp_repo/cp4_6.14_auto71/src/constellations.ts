import * as THREE from 'three';
import { BRIGHT_STARS, StarData, getStarPosition } from './stars';

export interface ConstellationDefinition {
  name: string;
  chineseName: string;
  starIndices: number[];
  lines: [number, number][];
}

export const CONSTELLATION_DEFINITIONS: ConstellationDefinition[] = [
  {
    name: 'Ursa Major',
    chineseName: '大熊座',
    starIndices: [17, 18, 19, 20, 21, 22, 23],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
      [0, 3], [3, 5]
    ]
  },
  {
    name: 'Cassiopeia',
    chineseName: '仙后座',
    starIndices: [24, 25, 26, 27, 28],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4]
    ]
  },
  {
    name: 'Orion',
    chineseName: '猎户座',
    starIndices: [3, 4, 12, 13, 14, 15, 16],
    lines: [
      [0, 2], [2, 4], [4, 3], [3, 1], [1, 6], [6, 0],
      [3, 5], [5, 4], [2, 5], [5, 1]
    ]
  },
  {
    name: 'Cygnus',
    chineseName: '天鹅座',
    starIndices: [29, 30, 31, 32, 33],
    lines: [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [2, 3], [3, 4], [4, 2]
    ]
  },
  {
    name: 'Taurus',
    chineseName: '金牛座',
    starIndices: [35, 36, 37, 38, 39, 40],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [0, 2], [1, 5], [3, 5]
    ]
  }
];

export interface ConstellationLineData {
  group: THREE.Group;
  definitions: ConstellationDefinition[];
}

export function createConstellations(): ConstellationLineData {
  const group = new THREE.Group();
  group.name = 'constellations';

  const color = new THREE.Color('#a5f3fc');
  const lineMaterial = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });

  CONSTELLATION_DEFINITIONS.forEach((constellation) => {
    const linePositions: number[] = [];

    constellation.lines.forEach(([localStartIdx, localEndIdx]) => {
      const globalStartIdx = constellation.starIndices[localStartIdx];
      const globalEndIdx = constellation.starIndices[localEndIdx];

      if (globalStartIdx === undefined || globalEndIdx === undefined) return;
      if (globalStartIdx >= BRIGHT_STARS.length || globalEndIdx >= BRIGHT_STARS.length) return;

      const startPos = getStarPosition(globalStartIdx, BRIGHT_STARS);
      const endPos = getStarPosition(globalEndIdx, BRIGHT_STARS);

      linePositions.push(startPos.x, startPos.y, startPos.z);
      linePositions.push(endPos.x, endPos.y, endPos.z);
    });

    if (linePositions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lines = new THREE.LineSegments(geometry, lineMaterial.clone());
      lines.name = constellation.name;
      lines.userData.constellationName = constellation.chineseName;
      lines.userData.starIndices = constellation.starIndices;
      group.add(lines);
    }
  });

  return {
    group,
    definitions: CONSTELLATION_DEFINITIONS
  };
}

export function findStarByGlobalIndex(
  globalIndex: number
): { star: StarData; constellation: string; localIndex: number } | null {
  for (const constellation of CONSTELLATION_DEFINITIONS) {
    const localIndex = constellation.starIndices.indexOf(globalIndex);
    if (localIndex !== -1) {
      return {
        star: BRIGHT_STARS[globalIndex],
        constellation: constellation.chineseName,
        localIndex
      };
    }
  }

  if (globalIndex >= 0 && globalIndex < BRIGHT_STARS.length) {
    return {
      star: BRIGHT_STARS[globalIndex],
      constellation: BRIGHT_STARS[globalIndex].constellation,
      localIndex: -1
    };
  }

  return null;
}
