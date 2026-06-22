import { v4 as uuidv4 } from 'uuid';
import type { Star } from '../types';
import { SCENE_CONSTANTS } from './constants';

const { HEMISPHERE_RADIUS } = SCENE_CONSTANTS;

function sphericalToCartesian(ra: number, dec: number, radius: number): [number, number, number] {
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad);
  const z = radius * Math.cos(decRad) * Math.sin(raRad);
  return [x, y, z];
}

const brightStarsData = [
  { name: 'Vega', chineseName: '织女星', ra: 279.2348, dec: 38.7837, magnitude: 0.03, color: '#a0d8ff' },
  { name: 'Arcturus', chineseName: '大角星', ra: 213.9154, dec: 19.1824, magnitude: -0.05, color: '#ffcc99' },
  { name: 'Sirius', chineseName: '天狼星', ra: 101.2871, dec: -16.7161, magnitude: -1.46, color: '#ffffff' },
  { name: 'Polaris', chineseName: '北极星', ra: 37.9546, dec: 89.2641, magnitude: 1.98, color: '#fff8e7' },
  { name: 'Betelgeuse', chineseName: '参宿四', ra: 88.7929, dec: 7.4071, magnitude: 0.42, color: '#ff6b4a' },
  { name: 'Rigel', chineseName: '参宿七', ra: 78.6345, dec: -8.2016, magnitude: 0.13, color: '#c8e6ff' },
  { name: 'Procyon', chineseName: '南河三', ra: 114.8255, dec: 5.22499, magnitude: 0.34, color: '#fff4e6' },
  { name: 'Altair', chineseName: '牵牛星', ra: 297.6958, dec: 8.8683, magnitude: 0.77, color: '#e6f2ff' },
  { name: 'Aldebaran', chineseName: '毕宿五', ra: 68.9802, dec: 16.5093, magnitude: 0.87, color: '#ff8c66' },
  { name: 'Antares', chineseName: '心宿二', ra: 247.3518, dec: -26.4320, magnitude: 1.09, color: '#ff5a3c' },
  { name: 'Spica', chineseName: '角宿一', ra: 201.2983, dec: -11.1613, magnitude: 0.98, color: '#b3d9ff' },
  { name: 'Deneb', chineseName: '天津四', ra: 310.3570, dec: 45.2803, magnitude: 1.25, color: '#e0f0ff' },
  { name: 'Regulus', chineseName: '轩辕十四', ra: 152.0929, dec: 11.9672, magnitude: 1.35, color: '#c9e4ff' },
  { name: 'Castor', chineseName: '北河二', ra: 113.6495, dec: 31.8883, magnitude: 1.58, color: '#ffffff' },
  { name: 'Pollux', chineseName: '北河三', ra: 116.3289, dec: 28.0262, magnitude: 1.16, color: '#ffe6cc' },
  { name: 'Fomalhaut', chineseName: '北落师门', ra: 344.4118, dec: -29.6222, magnitude: 1.16, color: '#e8f4ff' },
  { name: 'Mizar', chineseName: '开阳', ra: 200.9814, dec: 54.9254, magnitude: 2.23, color: '#ffffff' },
  { name: 'Dubhe', chineseName: '天枢', ra: 165.9321, dec: 61.7510, magnitude: 1.81, color: '#fff8e1' },
  { name: 'Merak', chineseName: '天璇', ra: 165.4604, dec: 56.3824, magnitude: 2.37, color: '#ffffff' },
  { name: 'Phecda', chineseName: '天玑', ra: 173.1291, dec: 53.6948, magnitude: 2.44, color: '#ffffff' },
  { name: 'Megrez', chineseName: '天权', ra: 183.8565, dec: 57.0326, magnitude: 3.31, color: '#ffffff' },
  { name: 'Alioth', chineseName: '玉衡', ra: 193.5068, dec: 55.9598, magnitude: 1.76, color: '#ffffff' },
  { name: 'Alkaid', chineseName: '摇光', ra: 206.8852, dec: 49.3133, magnitude: 1.85, color: '#ffffff' },
  { name: 'Achernar', chineseName: '水委一', ra: 24.4285, dec: -57.2367, magnitude: 0.46, color: '#cce8ff' },
  { name: 'Hadar', chineseName: '马腹一', ra: 210.9510, dec: -59.6888, magnitude: 0.61, color: '#c8e6ff' },
  { name: 'Rigil Kentaurus', chineseName: '南门二', ra: 219.9010, dec: -60.8339, magnitude: -0.27, color: '#fff2cc' },
  { name: 'Arneb', chineseName: '厕一', ra: 79.5630, dec: -17.5896, magnitude: 2.58, color: '#fff8e7' },
  { name: 'Sargas', chineseName: '尾宿五', ra: 269.2310, dec: -42.9840, magnitude: 1.86, color: '#fff4e6' },
  { name: 'Kaus Australis', chineseName: '箕宿三', ra: 281.7310, dec: -34.3840, magnitude: 1.79, color: '#ffeedd' },
  { name: 'Shaula', chineseName: '尾宿八', ra: 274.6530, dec: -37.1040, magnitude: 1.62, color: '#c9e4ff' },
];

export const BRIGHT_STARS: Star[] = brightStarsData.map((star) => ({
  id: uuidv4(),
  name: star.name,
  chineseName: star.chineseName,
  ra: star.ra,
  dec: star.dec,
  magnitude: star.magnitude,
  color: star.color,
  position: sphericalToCartesian(star.ra, star.dec, HEMISPHERE_RADIUS * 0.9),
}));

export function generateBackgroundStars(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(1 - v * 0.5);
    
    const x = HEMISPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
    const y = HEMISPHERE_RADIUS * Math.cos(phi);
    const z = HEMISPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    const brightness = 0.3 + Math.random() * 0.7;
    const colorVariation = Math.random();
    if (colorVariation < 0.6) {
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;
    } else if (colorVariation < 0.8) {
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.9;
      colors[i * 3 + 2] = brightness * 0.7;
    } else {
      colors[i * 3] = brightness * 0.8;
      colors[i * 3 + 1] = brightness * 0.9;
      colors[i * 3 + 2] = brightness;
    }
  }
  
  const combined = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    combined[i * 6] = positions[i * 3];
    combined[i * 6 + 1] = positions[i * 3 + 1];
    combined[i * 6 + 2] = positions[i * 3 + 2];
    combined[i * 6 + 3] = colors[i * 3];
    combined[i * 6 + 4] = colors[i * 3 + 1];
    combined[i * 6 + 5] = colors[i * 3 + 2];
  }
  
  return combined;
}

export function findNearestStar(
  cameraDirection: [number, number, number],
  threshold: number = 0.15
): Star | null {
  let nearestStar: Star | null = null;
  let minDistance = threshold;
  
  const dirLength = Math.sqrt(
    cameraDirection[0] ** 2 + cameraDirection[1] ** 2 + cameraDirection[2] ** 2
  );
  const normalizedDir: [number, number, number] = [
    cameraDirection[0] / dirLength,
    cameraDirection[1] / dirLength,
    cameraDirection[2] / dirLength,
  ];
  
  for (const star of BRIGHT_STARS) {
    const starDirLength = Math.sqrt(
      star.position[0] ** 2 + star.position[1] ** 2 + star.position[2] ** 2
    );
    const normalizedStarDir: [number, number, number] = [
      star.position[0] / starDirLength,
      star.position[1] / starDirLength,
      star.position[2] / starDirLength,
    ];
    
    const dot = 
      normalizedDir[0] * normalizedStarDir[0] +
      normalizedDir[1] * normalizedStarDir[1] +
      normalizedDir[2] * normalizedStarDir[2];
    
    const angularDistance = Math.acos(Math.max(-1, Math.min(1, dot)));
    
    if (angularDistance < minDistance) {
      minDistance = angularDistance;
      nearestStar = star;
    }
  }
  
  return nearestStar;
}
