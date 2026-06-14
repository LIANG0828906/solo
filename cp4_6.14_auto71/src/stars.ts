import * as THREE from 'three';

export interface StarData {
  ra: number;
  dec: number;
  magnitude: number;
  chineseName: string;
  westernName: string;
  constellation: string;
}

export interface StarMeshData {
  mesh: THREE.Points;
  data: StarData[];
}

export const BRIGHT_STARS: StarData[] = [
  { ra: 6.75, dec: 16.5, magnitude: -1.46, chineseName: '天狼星', westernName: 'Sirius', constellation: '大犬座' },
  { ra: 14.26, dec: 60.83, magnitude: 0.03, chineseName: '织女一', westernName: 'Vega', constellation: '天琴座' },
  { ra: 13.77, dec: 49.33, magnitude: 0.05, chineseName: '大角星', westernName: 'Arcturus', constellation: '牧夫座' },
  { ra: 3.98, dec: -1.2, magnitude: -0.05, chineseName: '参宿四', westernName: 'Betelgeuse', constellation: '猎户座' },
  { ra: 5.24, dec: -8.2, magnitude: 0.13, chineseName: '参宿七', westernName: 'Rigel', constellation: '猎户座' },
  { ra: 10.14, dec: 11.97, magnitude: 0.08, chineseName: '轩辕十四', westernName: 'Regulus', constellation: '狮子座' },
  { ra: 7.66, dec: 5.23, magnitude: 0.38, chineseName: '南河三', westernName: 'Procyon', constellation: '小犬座' },
  { ra: 12.45, dec: -16.72, magnitude: 0.96, chineseName: '角宿一', westernName: 'Spica', constellation: '室女座' },
  { ra: 17.0, dec: -26.43, magnitude: -0.72, chineseName: '心宿二', westernName: 'Antares', constellation: '天蝎座' },
  { ra: 22.08, dec: -29.76, magnitude: -0.62, chineseName: '北落师门', westernName: 'Fomalhaut', constellation: '南鱼座' },
  { ra: 14.06, dec: -60.37, magnitude: -0.01, chineseName: '南门二', westernName: 'Rigil Kent', constellation: '半人马座' },
  { ra: 11.06, dec: -61.75, magnitude: -0.27, chineseName: '马腹一', westernName: 'Hadar', constellation: '半人马座' },
  { ra: 5.6, dec: -1.2, magnitude: 1.64, chineseName: '参宿五', westernName: 'Bellatrix', constellation: '猎户座' },
  { ra: 5.68, dec: -1.94, magnitude: 1.77, chineseName: '参宿一', westernName: 'Mintaka', constellation: '猎户座' },
  { ra: 5.46, dec: -1.94, magnitude: 2.23, chineseName: '参宿二', westernName: 'Alnilam', constellation: '猎户座' },
  { ra: 5.41, dec: -6.85, magnitude: 1.7, chineseName: '参宿三', westernName: 'Alnitak', constellation: '猎户座' },
  { ra: 5.59, dec: -7.41, magnitude: 2.77, chineseName: '参宿六', westernName: 'Saiph', constellation: '猎户座' },
  { ra: 11.06, dec: 61.75, magnitude: 1.86, chineseName: '常陈一', westernName: 'Dubhe', constellation: '大熊座' },
  { ra: 11.03, dec: 56.38, magnitude: 2.37, chineseName: '天枢', westernName: 'Merak', constellation: '大熊座' },
  { ra: 11.9, dec: 53.69, magnitude: 2.44, chineseName: '天璇', westernName: 'Phecda', constellation: '大熊座' },
  { ra: 12.26, dec: 57.03, magnitude: 1.81, chineseName: '天玑', westernName: 'Megrez', constellation: '大熊座' },
  { ra: 12.9, dec: 55.96, magnitude: 1.77, chineseName: '天权', westernName: 'Alioth', constellation: '大熊座' },
  { ra: 13.41, dec: 49.33, magnitude: 0.77, chineseName: '玉衡', westernName: 'Mizar', constellation: '大熊座' },
  { ra: 2.53, dec: 42.31, magnitude: 1.79, chineseName: '开阳', westernName: 'Alkaid', constellation: '大熊座' },
  { ra: 0.16, dec: 59.15, magnitude: 2.47, chineseName: '王良一', westernName: 'Caph', constellation: '仙后座' },
  { ra: 0.89, dec: 54.68, magnitude: 2.68, chineseName: '阁道二', westernName: 'Segin', constellation: '仙后座' },
  { ra: 1.4, dec: 35.62, magnitude: 2.28, chineseName: '王良四', westernName: 'Schedar', constellation: '仙后座' },
  { ra: 1.9, dec: 60.72, magnitude: 2.68, chineseName: '阁道三', westernName: 'Ruchbah', constellation: '仙后座' },
  { ra: 2.29, dec: 60.72, magnitude: 2.24, chineseName: '策', westernName: 'Gamma Cas', constellation: '仙后座' },
  { ra: 20.69, dec: 45.28, magnitude: 1.25, chineseName: '天津四', westernName: 'Deneb', constellation: '天鹅座' },
  { ra: 19.85, dec: 8.4, magnitude: 2.2, chineseName: '辇道增七', westernName: 'Albireo', constellation: '天鹅座' },
  { ra: 20.52, dec: 27.13, magnitude: 2.46, chineseName: '天津一', westernName: 'Sadr', constellation: '天鹅座' },
  { ra: 20.38, dec: 33.97, magnitude: 2.87, chineseName: '天津二', westernName: 'Delta Cyg', constellation: '天鹅座' },
  { ra: 20.99, dec: 30.74, magnitude: 2.9, chineseName: '天津九', westernName: 'Epsilon Cyg', constellation: '天鹅座' },
  { ra: 17.5, dec: 37.33, magnitude: 1.87, chineseName: '河鼓二', westernName: 'Altair', constellation: '天鹰座' },
  { ra: 5.64, dec: 23.46, magnitude: 1.65, chineseName: '五车五', westernName: 'Menkalinan', constellation: '金牛座' },
  { ra: 5.43, dec: 28.61, magnitude: 1.9, chineseName: '天船三', westernName: 'Mirfak', constellation: '金牛座' },
  { ra: 4.6, dec: 16.5, magnitude: 1.65, chineseName: '天关', westernName: 'Alnath', constellation: '金牛座' },
  { ra: 4.43, dec: 12.37, magnitude: 2.97, chineseName: '天廪四', westernName: 'Theta Tau', constellation: '金牛座' },
  { ra: 4.95, dec: 15.95, magnitude: 2.85, chineseName: '天廪三', westernName: 'Omicron Tau', constellation: '金牛座' },
  { ra: 3.74, dec: 18.05, magnitude: 0.85, chineseName: '毕宿五', westernName: 'Aldebaran', constellation: '金牛座' },
  { ra: 5.28, dec: 45.98, magnitude: 1.93, chineseName: '五车二', westernName: 'Capella', constellation: '御夫座' },
  { ra: 1.63, dec: 89.26, magnitude: 1.97, chineseName: '勾陈一', westernName: 'Polaris', constellation: '小熊座' },
  { ra: 7.76, dec: 31.89, magnitude: 1.16, chineseName: '北河二', westernName: 'Pollux', constellation: '双子座' },
  { ra: 7.58, dec: 31.89, magnitude: 1.98, chineseName: '井宿一', westernName: 'Castor', constellation: '双子座' },
  { ra: 16.5, dec: 36.47, magnitude: 2.23, chineseName: '帝座', westernName: 'Rasalgethi', constellation: '武仙座' },
  { ra: 18.62, dec: 38.78, magnitude: 2.31, chineseName: '左枢', westernName: 'Rastaban', constellation: '天龙座' },
  { ra: 18.68, dec: 38.78, magnitude: 2.43, chineseName: '右枢', westernName: 'Etamin', constellation: '天龙座' },
  { ra: 9.47, dec: 11.33, magnitude: 2.56, chineseName: '太微右垣五', westernName: 'Zosma', constellation: '狮子座' },
  { ra: 8.95, dec: 20.52, magnitude: 2.5, chineseName: '太微左垣五', westernName: 'Adhafera', constellation: '狮子座' },
  { ra: 5.92, dec: 7.41, magnitude: 1.96, chineseName: '井宿三', westernName: 'Alhena', constellation: '双子座' },
  { ra: 15.35, dec: -10.93, magnitude: 2.65, chineseName: '氐宿一', westernName: 'Zubenelgenubi', constellation: '天秤座' },
  { ra: 15.81, dec: -26.01, magnitude: 2.59, chineseName: '房宿三', westernName: 'Dschubba', constellation: '天蝎座' },
  { ra: 16.33, dec: -25.94, magnitude: 2.29, chineseName: '房宿四', westernName: 'Pi Sco', constellation: '天蝎座' },
  { ra: 16.72, dec: -34.4, magnitude: 1.92, chineseName: '尾宿五', westernName: 'Sargas', constellation: '天蝎座' },
  { ra: 18.97, dec: -26.43, magnitude: 2.29, chineseName: '尾宿八', westernName: 'Shaula', constellation: '天蝎座' }
];

export const STAR_INDEX_MAP: Record<string, number> = {};
BRIGHT_STARS.forEach((star, index) => {
  const key = `${star.constellation}_${star.westernName}`;
  STAR_INDEX_MAP[key] = index;
});

const CELESTIAL_RADIUS = 200;

export function raDecToVector3(ra: number, dec: number, radius: number): THREE.Vector3 {
  const phi = (ra * 15) * (Math.PI / 180);
  const theta = (90 - dec) * (Math.PI / 180);
  const x = radius * Math.sin(theta) * Math.cos(phi);
  const y = radius * Math.cos(theta);
  const z = radius * Math.sin(theta) * Math.sin(phi);
  return new THREE.Vector3(x, y, z);
}

export function magnitudeToSize(magnitude: number): number {
  const brightestMag = -1.5;
  const dimmestMag = 3.0;
  const t = (magnitude - brightestMag) / (dimmestMag - brightestMag);
  const size = 6 - t * 4;
  return Math.max(2, Math.min(6, size));
}

export function createStars(): StarMeshData {
  const starData = BRIGHT_STARS.filter(s => s.magnitude < 3.0).slice(0, 60);
  const positions = new Float32Array(starData.length * 3);
  const colors = new Float32Array(starData.length * 3);
  const sizes = new Float32Array(starData.length);

  starData.forEach((star, i) => {
    const pos = raDecToVector3(star.ra, star.dec, CELESTIAL_RADIUS);
    positions[i * 3] = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;

    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 1.0;
    colors[i * 3 + 2] = 1.0;

    sizes[i] = magnitudeToSize(star.magnitude);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const vertexShader = `
    attribute float size;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      if (dist > 0.5) discard;
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      gl_FragColor = vec4(vColor, alpha);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: {},
    vertexColors: true,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  points.userData.starData = starData;

  return {
    mesh: points,
    data: starData
  };
}

export function createMilkyWay(): THREE.Points {
  const particleCount = 8000;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const l = Math.random() * 360;
    const b = (Math.random() - 0.5) * 30;
    const radius = CELESTIAL_RADIUS * (0.9 + Math.random() * 0.2);

    const phi = l * (Math.PI / 180);
    const theta = (90 - b) * (Math.PI / 180);

    positions[i * 3] = radius * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = radius * Math.cos(theta);
    positions[i * 3 + 2] = radius * Math.sin(theta) * Math.sin(phi);

    const gray = 0.3 + Math.random() * 0.4;
    const tint = Math.random();
    colors[i * 3] = gray * (0.8 + tint * 0.2);
    colors[i * 3 + 1] = gray * (0.85 + tint * 0.15);
    colors[i * 3 + 2] = gray;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  return new THREE.Points(geometry, material);
}

export function getStarPosition(index: number, starData: StarData[]): THREE.Vector3 {
  const star = starData[index];
  return raDecToVector3(star.ra, star.dec, CELESTIAL_RADIUS);
}

export { CELESTIAL_RADIUS };
