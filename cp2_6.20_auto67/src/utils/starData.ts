import { Star } from '@/types';
import { getSpectralType } from './colorTemperature';

const famousStars: Partial<Star>[] = [
  { name: '天狼星', temperature: 9940, magnitude: -1.46, distance: 8.6 },
  { name: '织女星', temperature: 9602, magnitude: 0.03, distance: 25.04 },
  { name: '牛郎星', temperature: 7550, magnitude: 0.77, distance: 16.73 },
  { name: '北极星', temperature: 6015, magnitude: 1.98, distance: 433 },
  { name: '参宿四', temperature: 3600, magnitude: 0.5, distance: 640 },
  { name: '参宿七', temperature: 12100, magnitude: 0.13, distance: 860 },
  { name: '南河三', temperature: 6530, magnitude: 0.34, distance: 11.4 },
  { name: '五车二', temperature: 4940, magnitude: 0.08, distance: 42.2 },
  { name: '心宿二', temperature: 3660, magnitude: 1.09, distance: 550 },
  { name: '角宿一', temperature: 22400, magnitude: 1.04, distance: 250 },
  { name: '大角星', temperature: 4286, magnitude: -0.05, distance: 36.7 },
  { name: '天津四', temperature: 8500, magnitude: 1.25, distance: 2615 },
  { name: '北落师门', temperature: 8590, magnitude: 1.17, distance: 25.1 },
  { name: '轩辕十四', temperature: 12460, magnitude: 1.4, distance: 79.3 },
  { name: '老人星', temperature: 7350, magnitude: -0.74, distance: 310 },
  { name: '水委一', temperature: 15000, magnitude: 0.46, distance: 139 },
  { name: '马腹一', temperature: 25500, magnitude: 0.61, distance: 390 },
  { name: '河鼓二', temperature: 7550, magnitude: 0.77, distance: 16.7 },
  { name: '毕宿五', temperature: 4050, magnitude: 0.85, distance: 65 },
  { name: '孔雀十一', temperature: 12000, magnitude: 1.92, distance: 180 },
];

function generateStars(count: number): Star[] {
  const stars: Star[] = [];
  const maxRadius = 100;

  for (let i = 0; i < count; i++) {
    const id = `star-${i}`;

    let name: string;
    let temperature: number;
    let magnitude: number;
    let distance: number;

    if (i < famousStars.length) {
      const fs = famousStars[i];
      name = fs.name || `恒星-${i}`;
      temperature = fs.temperature || 3500 + Math.random() * 1500;
      magnitude = fs.magnitude || 0;
      distance = fs.distance || 10;
    } else {
      const starIndex = Math.floor(Math.random() * 100000);
      name = `HD-${starIndex.toString().padStart(6, '0')}`;
      temperature = 3500 + Math.random() * 1500;
      magnitude = Math.random() * 6 - 1;
      distance = 10 + Math.random() * 500;
    }

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = Math.pow(Math.random(), 0.5) * maxRadius;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    const size = Math.max(0.3, Math.min(1.5, (6 - magnitude) * 0.15));
    const spectralType = getSpectralType(temperature);

    stars.push({
      id,
      name,
      x,
      y,
      z,
      temperature,
      magnitude,
      distance,
      spectralType,
      size,
    });
  }

  return stars;
}

export const MAX_STARS = 8000;
export const INITIAL_VISIBLE_STARS = 6000;

export const stars = generateStars(MAX_STARS);

export function getStarById(id: string): Star | undefined {
  return stars.find((s) => s.id === id);
}

export function findStarByName(name: string): Star | undefined {
  const lowerName = name.toLowerCase().trim();
  return stars.find(
    (s) =>
      s.name.toLowerCase() === lowerName ||
      s.name.toLowerCase().includes(lowerName)
  );
}

export function getFamousStarNames(): string[] {
  return famousStars.map((s) => s.name || '').filter(Boolean);
}
