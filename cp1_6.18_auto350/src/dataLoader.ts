import { v4 as uuidv4 } from 'uuid';
import type { StarData, Constellation, Era, Position3D } from './types';

interface RawConstellationDef {
  id: string;
  name: string;
  stars: Array<{
    name: string;
    magnitude: number;
    positions: [number, number, number][];
  }>;
  connections: [number, number][];
  labelOffset: [number, number, number];
}

const CONSTELLATION_DEFS: RawConstellationDef[] = [
  {
    id: 'ursa-major',
    name: '北斗七星',
    labelOffset: [0, 1.2, 0],
    stars: [
      { name: '天枢', magnitude: 1.79, positions: [[-5, 3, 0], [-4.98, 3.02, 0.01], [-4.95, 3.05, 0.02]] },
      { name: '天璇', magnitude: 2.37, positions: [[-4, 2.5, 0.1], [-3.97, 2.52, 0.12], [-3.93, 2.55, 0.15]] },
      { name: '天玑', magnitude: 2.44, positions: [[-3.2, 3.1, 0.15], [-3.17, 3.13, 0.17], [-3.13, 3.16, 0.20]] },
      { name: '天权', magnitude: 3.31, positions: [[-2.5, 2.8, 0.2], [-2.47, 2.83, 0.22], [-2.43, 2.86, 0.25]] },
      { name: '玉衡', magnitude: 1.76, positions: [[-1.5, 3.2, 0.15], [-1.47, 3.23, 0.17], [-1.43, 3.26, 0.20]] },
      { name: '开阳', magnitude: 2.27, positions: [[-0.5, 3.5, 0.1], [-0.47, 3.53, 0.12], [-0.43, 3.56, 0.15]] },
      { name: '摇光', magnitude: 1.86, positions: [[0.5, 3.8, 0.05], [0.53, 3.83, 0.07], [0.57, 3.86, 0.10]] },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [1, 3]],
  },
  {
    id: 'orion',
    name: '猎户座',
    labelOffset: [0, -1.5, 0],
    stars: [
      { name: '参宿四', magnitude: 0.58, positions: [[2, 5.5, -1], [2.03, 5.48, -0.98], [2.07, 5.45, -0.95]] },
      { name: '参宿五', magnitude: 1.64, positions: [[5, 5.5, -1], [5.03, 5.48, -0.98], [5.07, 5.45, -0.95]] },
      { name: '参宿一', magnitude: 2.23, positions: [[2.8, 3, -0.5], [2.82, 2.98, -0.48], [2.85, 2.95, -0.45]] },
      { name: '参宿二', magnitude: 1.70, positions: [[3.5, 3, -0.5], [3.52, 2.98, -0.48], [3.55, 2.95, -0.45]] },
      { name: '参宿三', magnitude: 2.23, positions: [[4.2, 3, -0.5], [4.22, 2.98, -0.48], [4.25, 2.95, -0.45]] },
      { name: '参宿七', magnitude: 0.13, positions: [[5, 0.5, -1], [5.03, 0.48, -0.98], [5.07, 0.45, -0.95]] },
    ],
    connections: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 5]],
  },
  {
    id: 'scorpius',
    name: '天蝎座',
    labelOffset: [-1, 0.5, 0],
    stars: [
      { name: '心宿二', magnitude: 1.09, positions: [[-6, -2, 2], [-6.03, -1.97, 2.02], [-6.07, -1.93, 2.05]] },
      { name: '房宿三', magnitude: 2.29, positions: [[-7, 0, 1.8], [-7.02, 0.03, 1.82], [-7.05, 0.07, 1.85]] },
      { name: '房宿四', magnitude: 2.89, positions: [[-6.5, -0.5, 1.9], [-6.52, -0.47, 1.92], [-6.55, -0.43, 1.95]] },
      { name: '尾宿八', magnitude: 2.41, positions: [[-4.5, -3, 2.2], [-4.48, -2.97, 2.22], [-4.45, -2.93, 2.25]] },
      { name: '尾宿九', magnitude: 1.63, positions: [[-3.5, -4, 2.5], [-3.48, -3.97, 2.52], [-3.45, -3.93, 2.55]] },
    ],
    connections: [[0, 1], [1, 2], [2, 0], [0, 3], [3, 4]],
  },
  {
    id: 'leo',
    name: '狮子座',
    labelOffset: [1, 0.5, 0],
    stars: [
      { name: '轩辕十四', magnitude: 1.35, positions: [[7, -1, 0.5], [7.03, -0.97, 0.52], [7.07, -0.93, 0.55]] },
      { name: '轩辕十三', magnitude: 2.98, positions: [[6, 0.5, 0.3], [6.03, 0.53, 0.32], [6.07, 0.57, 0.35]] },
      { name: '轩辕十二', magnitude: 2.56, positions: [[5, 1.2, 0.2], [5.03, 1.23, 0.22], [5.07, 1.27, 0.25]] },
      { name: '西上相', magnitude: 3.52, positions: [[6.5, 1, 0.25], [6.52, 1.03, 0.27], [6.55, 1.07, 0.30]] },
      { name: '五帝座一', magnitude: 2.14, positions: [[9, 0.5, 0.4], [9.03, 0.53, 0.42], [9.07, 0.57, 0.45]] },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 4]],
  },
  {
    id: 'andromeda',
    name: '仙女座',
    labelOffset: [0.5, 0, 0],
    stars: [
      { name: '壁宿二', magnitude: 2.06, positions: [[-2, -4, -2], [-1.97, -3.97, -1.98], [-1.93, -3.93, -1.95]] },
      { name: '奎宿九', magnitude: 2.06, positions: [[-4, -3.5, -2.2], [-3.97, -3.47, -2.18], [-3.93, -3.43, -2.15]] },
      { name: '天大将军一', magnitude: 2.28, positions: [[-6, -3, -2.5], [-5.97, -2.97, -2.48], [-5.93, -2.93, -2.45]] },
      { name: '奎宿八', magnitude: 3.07, positions: [[-5, -4.5, -2.3], [-4.98, -4.47, -2.28], [-4.95, -4.43, -2.25]] },
    ],
    connections: [[0, 1], [1, 2], [1, 3]],
  },
  {
    id: 'cygnus',
    name: '天鹅座',
    labelOffset: [0, 1, 0],
    stars: [
      { name: '天津四', magnitude: 1.25, positions: [[0, 7, 3], [0.03, 7.03, 3.02], [0.07, 7.07, 3.05]] },
      { name: '天津一', magnitude: 2.87, positions: [[-1.5, 5, 2.8], [-1.47, 5.03, 2.82], [-1.43, 5.07, 2.85]] },
      { name: '天津九', magnitude: 2.48, positions: [[1.5, 5, 2.8], [1.53, 5.03, 2.82], [1.57, 5.07, 2.85]] },
      { name: '辇道增七', magnitude: 3.20, positions: [[0, 4, 3.2], [0.03, 4.03, 3.22], [0.07, 4.07, 3.25]] },
      { name: '天津二', magnitude: 2.46, positions: [[0, 5.5, 3], [0.03, 5.53, 3.02], [0.07, 5.57, 3.05]] },
    ],
    connections: [[0, 1], [0, 2], [0, 4], [4, 3], [1, 4], [2, 4]],
  },
  {
    id: 'aquila',
    name: '天鹰座',
    labelOffset: [0.8, 0, 0],
    stars: [
      { name: '河鼓二', magnitude: 0.77, positions: [[4, -5, 1.5], [4.03, -4.97, 1.52], [4.07, -4.93, 1.55]] },
      { name: '河鼓一', magnitude: 2.72, positions: [[2.5, -5.5, 1.3], [2.53, -5.47, 1.32], [2.57, -5.43, 1.35]] },
      { name: '河鼓三', magnitude: 3.17, positions: [[5.5, -5.5, 1.3], [5.53, -5.47, 1.32], [5.57, -5.43, 1.35]] },
      { name: '天桴四', magnitude: 3.87, positions: [[4, -3.5, 1.7], [4.02, -3.47, 1.72], [4.05, -3.43, 1.75]] },
    ],
    connections: [[0, 1], [0, 2], [0, 3]],
  },
  {
    id: 'gemini',
    name: '双子座',
    labelOffset: [0, 0.8, 0],
    stars: [
      { name: '北河二', magnitude: 1.58, positions: [[-8, 4, -0.5], [-7.97, 4.03, -0.48], [-7.93, 4.07, -0.45]] },
      { name: '北河三', magnitude: 1.16, positions: [[-6.5, 3.5, -0.3], [-6.47, 3.53, -0.28], [-6.43, 3.57, -0.25]] },
      { name: '井宿三', magnitude: 1.93, positions: [[-8, 1.5, -0.2], [-7.97, 1.53, -0.18], [-7.93, 1.57, -0.15]] },
      { name: '井宿一', magnitude: 3.00, positions: [[-7, 1, -0.1], [-6.97, 1.03, -0.08], [-6.93, 1.07, -0.05]] },
      { name: '钺', magnitude: 3.35, positions: [[-5.5, 3, 0], [-5.47, 3.03, 0.02], [-5.43, 3.07, 0.05]] },
    ],
    connections: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [1, 3]],
  },
  {
    id: 'virgo',
    name: '处女座',
    labelOffset: [0.5, 0, 0],
    stars: [
      { name: '角宿一', magnitude: 0.97, positions: [[8, -5.5, -1], [8.03, -5.47, -0.98], [8.07, -5.43, -0.95]] },
      { name: '角宿二', magnitude: 3.54, positions: [[6.5, -4.5, -0.8], [6.53, -4.47, -0.78], [6.57, -4.43, -0.75]] },
      { name: '亢宿一', magnitude: 4.12, positions: [[9, -3.5, -0.6], [9.03, -3.47, -0.58], [9.07, -3.43, -0.55]] },
      { name: '亢宿二', magnitude: 3.61, positions: [[7.5, -3, -0.7], [7.53, -2.97, -0.68], [7.57, -2.93, -0.65]] },
    ],
    connections: [[0, 1], [0, 2], [2, 3], [1, 3]],
  },
  {
    id: 'aquarius',
    name: '水瓶座',
    labelOffset: [-0.5, 1, 0],
    stars: [
      { name: '危宿一', magnitude: 2.94, positions: [[8, 4, 1], [8.03, 4.03, 1.02], [8.07, 4.07, 1.05]] },
      { name: '虚宿一', magnitude: 2.90, positions: [[6, 5, 0.8], [6.03, 5.03, 0.82], [6.07, 5.07, 0.85]] },
      { name: '泣二', magnitude: 3.67, positions: [[7, 3, 1.2], [7.02, 3.03, 1.22], [7.05, 3.07, 1.25]] },
      { name: '羽林军二十六', magnitude: 3.74, positions: [[9.5, 2.5, 1.5], [9.52, 2.53, 1.52], [9.55, 2.57, 1.55]] },
      { name: '坟墓一', magnitude: 4.17, positions: [[5, 3.5, 0.6], [5.03, 3.53, 0.62], [5.07, 3.57, 0.65]] },
    ],
    connections: [[0, 1], [0, 2], [2, 3], [1, 4], [0, 3]],
  },
  {
    id: 'aries',
    name: '白羊座',
    labelOffset: [0, 0.8, 0],
    stars: [
      { name: '娄宿三', magnitude: 2.00, positions: [[1, -2, -3], [1.03, -1.97, -2.98], [1.07, -1.93, -2.95]] },
      { name: '娄宿一', magnitude: 2.70, positions: [[2.5, -1.5, -2.8], [2.53, -1.47, -2.78], [2.57, -1.43, -2.75]] },
      { name: '娄宿二', magnitude: 4.80, positions: [[1.8, -2.5, -2.9], [1.82, -2.47, -2.88], [1.85, -2.43, -2.85]] },
      { name: '胃宿一', magnitude: 3.72, positions: [[-0.5, -2.8, -3.1], [-0.47, -2.77, -3.08], [-0.43, -2.73, -3.05]] },
    ],
    connections: [[0, 1], [0, 2], [1, 2], [0, 3]],
  },
  {
    id: 'taurus',
    name: '金牛座',
    labelOffset: [0, -1, 0],
    stars: [
      { name: '毕宿五', magnitude: 0.85, positions: [[-3, -5, -1.5], [-2.97, -4.97, -1.48], [-2.93, -4.93, -1.45]] },
      { name: '五车五', magnitude: 1.65, positions: [[-4.5, -6, -1.2], [-4.47, -5.97, -1.18], [-4.43, -5.93, -1.15]] },
      { name: '毕宿一', magnitude: 3.65, positions: [[-2, -6.5, -1.3], [-1.97, -6.47, -1.28], [-1.93, -6.43, -1.25]] },
      { name: '毕宿三', magnitude: 4.28, positions: [[-4, -4, -1.6], [-3.98, -3.97, -1.58], [-3.95, -3.93, -1.55]] },
      { name: '天关', magnitude: 3.84, positions: [[-1, -5.5, -1.4], [-0.97, -5.47, -1.38], [-0.93, -5.43, -1.35]] },
    ],
    connections: [[0, 1], [0, 2], [0, 3], [2, 4], [1, 3]],
  },
  {
    id: 'cancer',
    name: '巨蟹座',
    labelOffset: [0, 0.8, 0],
    stars: [
      { name: '柳宿增三', magnitude: 3.53, positions: [[3.5, 1.5, -2], [3.53, 1.53, -1.98], [3.57, 1.57, -1.95]] },
      { name: '柳宿一', magnitude: 5.33, positions: [[4.5, 1, -1.8], [4.52, 1.03, -1.78], [4.55, 1.07, -1.75]] },
      { name: '鬼宿三', magnitude: 4.67, positions: [[4, 0.5, -2.1], [4.02, 0.53, -2.08], [4.05, 0.57, -2.05]] },
      { name: '鬼宿四', magnitude: 5.02, positions: [[3, 0, -1.9], [3.03, 0.03, -1.88], [3.07, 0.07, -1.85]] },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0]],
  },
  {
    id: 'capricornus',
    name: '摩羯座',
    labelOffset: [0, 0.8, 0],
    stars: [
      { name: '牛宿一', magnitude: 3.05, positions: [[-5, 5.5, 1.5], [-4.97, 5.53, 1.52], [-4.93, 5.57, 1.55]] },
      { name: '牛宿二', magnitude: 4.73, positions: [[-6.5, 4.5, 1.3], [-6.47, 4.53, 1.32], [-6.43, 4.57, 1.35]] },
      { name: '女宿一', magnitude: 4.37, positions: [[-4, 4, 1.6], [-3.97, 4.03, 1.62], [-3.93, 4.07, 1.65]] },
      { name: '女宿二', magnitude: 5.17, positions: [[-5.5, 3.5, 1.4], [-5.48, 3.53, 1.42], [-5.45, 3.57, 1.45]] },
      { name: '虚宿二', magnitude: 5.78, positions: [[-3, 5, 1.7], [-2.97, 5.03, 1.72], [-2.93, 5.07, 1.75]] },
    ],
    connections: [[0, 1], [0, 2], [2, 3], [1, 3], [2, 4], [0, 4]],
  },
  {
    id: 'libra',
    name: '天秤座',
    labelOffset: [0, 0.8, 0],
    stars: [
      { name: '氐宿四', magnitude: 2.61, positions: [[6.5, -3, 0.5], [6.53, -2.97, 0.52], [6.57, -2.93, 0.55]] },
      { name: '氐宿三', magnitude: 3.29, positions: [[5, -2.5, 0.3], [5.03, -2.47, 0.32], [5.07, -2.43, 0.35]] },
      { name: '氐宿一', magnitude: 2.75, positions: [[5.5, -1.5, 0.4], [5.53, -1.47, 0.42], [5.57, -1.43, 0.45]] },
      { name: '氐宿二', magnitude: 4.92, positions: [[7, -1.8, 0.6], [7.02, -1.77, 0.62], [7.05, -1.73, 0.65]] },
    ],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]],
  },
];

export function loadAllStarData(): {
  stars: StarData[];
  constellations: Constellation[];
  eras: Era[];
} {
  const stars: StarData[] = [];
  const constellations: Constellation[] = [];

  const eras: Era[] = [
    { index: 0, name: '公元前2000年', year: -2000 },
    { index: 1, name: '公元元年', year: 1 },
    { index: 2, name: '公元1500年', year: 1500 },
  ];

  for (const def of CONSTELLATION_DEFS) {
    const constellationStarIds: string[] = [];

    for (const starDef of def.stars) {
      const starId = uuidv4();
      constellationStarIds.push(starId);

      const eraPositions: Position3D[] = starDef.positions.map(
        ([x, y, z]) => ({ x, y, z })
      );

      stars.push({
        id: starId,
        name: starDef.name,
        constellationId: def.id,
        magnitude: starDef.magnitude,
        eraPositions,
      });
    }

    const connections = def.connections.map(([idxA, idxB]) => ({
      starIdA: constellationStarIds[idxA],
      starIdB: constellationStarIds[idxB],
    }));

    const allPositions = def.stars.flatMap((s) => s.positions);
    const avgX = allPositions.reduce((a, p) => a + p[0], 0) / allPositions.length;
    const avgY = allPositions.reduce((a, p) => a + p[1], 0) / allPositions.length;
    const avgZ = allPositions.reduce((a, p) => a + p[2], 0) / allPositions.length;

    const labelPosition: Position3D = {
      x: avgX + def.labelOffset[0],
      y: avgY + def.labelOffset[1],
      z: avgZ + def.labelOffset[2],
    };

    constellations.push({
      id: def.id,
      name: def.name,
      starIds: constellationStarIds,
      connections,
      labelPosition,
    });
  }

  return { stars, constellations, eras };
}

export function calculateStarMaxDisplacement(star: StarData): number {
  let maxDist = 0;
  const positions = star.eraPositions;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[i].x - positions[j].x;
      const dy = positions[i].y - positions[j].y;
      const dz = positions[i].z - positions[j].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > maxDist) maxDist = dist;
    }
  }
  return maxDist;
}

export function calculateCoordinateOffsets(star: StarData): {
  era0To1: number;
  era1To2: number;
  era0To2: number;
} {
  const UNIT_TO_ARCSEC = 206265;
  const p = star.eraPositions;

  const dist3D = (a: Position3D, b: Position3D) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  return {
    era0To1: dist3D(p[0], p[1]) * UNIT_TO_ARCSEC * 0.01,
    era1To2: dist3D(p[1], p[2]) * UNIT_TO_ARCSEC * 0.01,
    era0To2: dist3D(p[0], p[2]) * UNIT_TO_ARCSEC * 0.01,
  };
}
