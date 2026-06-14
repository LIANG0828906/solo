import * as THREE from 'three';
import { StarData, getStarPosition } from './stars';

export interface ConstellationDefinition {
  name: string;
  chineseName: string;
  lines: [number, number][];
}

export const CONSTELLATION_DEFINITIONS: ConstellationDefinition[] = [
  {
    name: 'Ursa Major',
    chineseName: '大熊座',
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0],
      [1, 5], [2, 6]
    ]
  },
  {
    name: 'Cassiopeia',
    chineseName: '仙后座',
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4]
    ]
  },
  {
    name: 'Orion',
    chineseName: '猎户座',
    lines: [
      [0, 1], [0, 2], [1, 3], [2, 4],
      [2, 5], [3, 5], [4, 6], [5, 6],
      [4, 7], [3, 7]
    ]
  },
  {
    name: 'Cygnus',
    chineseName: '天鹅座',
    lines: [
      [0, 1], [0, 2], [0, 3], [0, 4]
    ]
  },
  {
    name: 'Taurus',
    chineseName: '金牛座',
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 0],
      [1, 4], [2, 5], [5, 6]
    ]
  }
];

const URSAMAJOR_STARS: StarData[] = [
  { ra: 11.06, dec: 61.75, magnitude: 1.86, chineseName: '常陈一', westernName: 'Dubhe', constellation: '大熊座' },
  { ra: 11.03, dec: 56.38, magnitude: 2.37, chineseName: '天枢', westernName: 'Merak', constellation: '大熊座' },
  { ra: 11.9, dec: 53.69, magnitude: 2.44, chineseName: '天璇', westernName: 'Phecda', constellation: '大熊座' },
  { ra: 12.26, dec: 57.03, magnitude: 1.81, chineseName: '天玑', westernName: 'Megrez', constellation: '大熊座' },
  { ra: 12.9, dec: 55.96, magnitude: 1.77, chineseName: '天权', westernName: 'Alioth', constellation: '大熊座' },
  { ra: 13.41, dec: 49.33, magnitude: 1.77, chineseName: '玉衡', westernName: 'Mizar', constellation: '大熊座' },
  { ra: 13.77, dec: 49.33, magnitude: 1.86, chineseName: '开阳', westernName: 'Alkaid', constellation: '大熊座' },
  { ra: 12.6, dec: 57.03, magnitude: 3.3, chineseName: '摇光', westernName: 'Psi UMa', constellation: '大熊座' }
];

const CASSIOPEIA_STARS: StarData[] = [
  { ra: 0.16, dec: 59.15, magnitude: 2.47, chineseName: '王良一', westernName: 'Caph', constellation: '仙后座' },
  { ra: 0.89, dec: 54.68, magnitude: 2.68, chineseName: '阁道二', westernName: 'Segin', constellation: '仙后座' },
  { ra: 1.4, dec: 35.62, magnitude: 2.28, chineseName: '王良四', westernName: 'Schedar', constellation: '仙后座' },
  { ra: 1.9, dec: 60.72, magnitude: 2.68, chineseName: '阁道三', westernName: 'Ruchbah', constellation: '仙后座' },
  { ra: 2.29, dec: 60.72, magnitude: 2.24, chineseName: '策', westernName: 'Gamma Cas', constellation: '仙后座' }
];

const ORION_STARS: StarData[] = [
  { ra: 5.24, dec: -8.2, magnitude: 0.13, chineseName: '参宿七', westernName: 'Rigel', constellation: '猎户座' },
  { ra: 5.6, dec: -1.2, magnitude: 1.64, chineseName: '参宿五', westernName: 'Bellatrix', constellation: '猎户座' },
  { ra: 5.68, dec: -1.94, magnitude: 1.77, chineseName: '参宿一', westernName: 'Mintaka', constellation: '猎户座' },
  { ra: 5.46, dec: -1.94, magnitude: 2.23, chineseName: '参宿二', westernName: 'Alnilam', constellation: '猎户座' },
  { ra: 5.41, dec: -6.85, magnitude: 1.7, chineseName: '参宿三', westernName: 'Alnitak', constellation: '猎户座' },
  { ra: 3.98, dec: -1.2, magnitude: -0.05, chineseName: '参宿四', westernName: 'Betelgeuse', constellation: '猎户座' },
  { ra: 5.59, dec: -7.41, magnitude: 2.77, chineseName: '参宿六', westernName: 'Saiph', constellation: '猎户座' },
  { ra: 5.28, dec: -6.85, magnitude: 3.2, chineseName: '参宿增十一', westernName: 'Nair al Saif', constellation: '猎户座' }
];

const CYGNUS_STARS: StarData[] = [
  { ra: 20.69, dec: 45.28, magnitude: 1.25, chineseName: '天津四', westernName: 'Deneb', constellation: '天鹅座' },
  { ra: 19.85, dec: 8.4, magnitude: 2.2, chineseName: '辇道增七', westernName: 'Albireo', constellation: '天鹅座' },
  { ra: 20.52, dec: 27.13, magnitude: 2.46, chineseName: '天津一', westernName: 'Sadr', constellation: '天鹅座' },
  { ra: 20.38, dec: 33.97, magnitude: 2.87, chineseName: '天津二', westernName: 'Delta Cyg', constellation: '天鹅座' },
  { ra: 20.99, dec: 30.74, magnitude: 3.21, chineseName: '天津九', westernName: 'Epsilon Cyg', constellation: '天鹅座' }
];

const TAURUS_STARS: StarData[] = [
  { ra: 5.64, dec: 23.46, magnitude: 1.65, chineseName: '五车五', westernName: 'Menkalinan', constellation: '金牛座' },
  { ra: 5.43, dec: 28.61, magnitude: 1.9, chineseName: '天船三', westernName: 'Mirfak', constellation: '金牛座' },
  { ra: 4.6, dec: 16.5, magnitude: 1.65, chineseName: '天关', westernName: 'Alnath', constellation: '金牛座' },
  { ra: 4.43, dec: 12.37, magnitude: 3.0, chineseName: '天廪四', westernName: 'Theta Tau', constellation: '金牛座' },
  { ra: 4.95, dec: 15.95, magnitude: 2.85, chineseName: '天廪三', westernName: 'Omicron Tau', constellation: '金牛座' },
  { ra: 3.74, dec: 18.05, magnitude: 0.85, chineseName: '毕宿五', westernName: 'Aldebaran', constellation: '金牛座' },
  { ra: 3.95, dec: 13.22, magnitude: 3.4, chineseName: '毕宿一', westernName: 'Epsilon Tau', constellation: '金牛座' }
];

export const CONSTELLATION_STAR_DATA: Record<string, StarData[]> = {
  'Ursa Major': URSAMAJOR_STARS,
  'Cassiopeia': CASSIOPEIA_STARS,
  'Orion': ORION_STARS,
  'Cygnus': CYGNUS_STARS,
  'Taurus': TAURUS_STARS
};

export interface ConstellationLineData {
  group: THREE.Group;
  definitions: ConstellationDefinition[];
  starDataMap: Record<string, StarData[]>;
}

export function createConstellations(): ConstellationLineData {
  const group = new THREE.Group();
  group.name = 'constellations';

  const color = new THREE.Color('#a5f3fc');
  const lineMaterial = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.3,
    linewidth: 1.5,
    depthWrite: false
  });

  CONSTELLATION_DEFINITIONS.forEach((constellation) => {
    const starData = CONSTELLATION_STAR_DATA[constellation.name];
    if (!starData) return;

    const linePositions: number[] = [];

    constellation.lines.forEach(([startIdx, endIdx]) => {
      if (startIdx >= starData.length || endIdx >= starData.length) return;

      const startPos = getStarPosition(startIdx, starData);
      const endPos = getStarPosition(endIdx, starData);

      linePositions.push(startPos.x, startPos.y, startPos.z);
      linePositions.push(endPos.x, endPos.y, endPos.z);
    });

    if (linePositions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      const lines = new THREE.LineSegments(geometry, lineMaterial.clone());
      lines.name = constellation.name;
      lines.userData.constellationName = constellation.chineseName;
      lines.userData.starData = starData;
      group.add(lines);
    }
  });

  return {
    group,
    definitions: CONSTELLATION_DEFINITIONS,
    starDataMap: CONSTELLATION_STAR_DATA
  };
}

export function getAllConstellationStars(): StarData[] {
  const allStars: StarData[] = [];
  Object.values(CONSTELLATION_STAR_DATA).forEach(stars => {
    allStars.push(...stars);
  });
  return allStars;
}

export function findStarByPosition(pos: THREE.Vector3, allStarData: StarData[], threshold: number = 3): { star: StarData; constellation: string } | null {
  for (const [constellationName, stars] of Object.entries(CONSTELLATION_STAR_DATA)) {
    for (const star of stars) {
      const starPos = getStarPosition(stars.indexOf(star), stars);
      if (pos.distanceTo(starPos) < threshold) {
        const constellationDef = CONSTELLATION_DEFINITIONS.find(d => d.name === constellationName);
        return {
          star,
          constellation: constellationDef ? constellationDef.chineseName : constellationName
        };
      }
    }
  }

  for (const star of allStarData) {
    const starPos = getStarPosition(allStarData.indexOf(star), allStarData);
    if (pos.distanceTo(starPos) < threshold) {
      return { star, constellation: star.constellation };
    }
  }

  return null;
}
