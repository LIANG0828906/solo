export interface LatLng {
  lat: number;
  lng: number;
}

export interface PixelPosition {
  x: number;
  y: number;
}

export type CapsuleStatus = 'planted' | 'sealed' | 'unlocked' | 'discovered';

export interface Capsule {
  id: string;
  lat: number;
  lng: number;
  text: string;
  imageUrl: string;
  openDate: string;
  createdAt: string;
  status: CapsuleStatus;
  discoveredAt?: string;
  discoveredBy?: string;
}

export const MAP_WIDTH = 1024;
export const MAP_HEIGHT = 512;

export const latLngToPixel = (
  lat: number,
  lng: number,
  mapWidth: number = MAP_WIDTH,
  mapHeight: number = MAP_HEIGHT
): PixelPosition => {
  const x = ((lng + 180) / 360) * mapWidth;

  const latRad = (lat * Math.PI) / 180;
  const mercatorN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = mapHeight / 2 - (mapHeight / (2 * Math.PI)) * mercatorN;

  return { x: Math.max(0, Math.min(mapWidth, x)), y: Math.max(0, Math.min(mapHeight, y)) };
};

export const pixelToLatLng = (
  x: number,
  y: number,
  mapWidth: number = MAP_WIDTH,
  mapHeight: number = MAP_HEIGHT
): LatLng => {
  const lng = (x / mapWidth) * 360 - 180;

  const mercatorN = ((mapHeight / 2 - y) * 2 * Math.PI) / mapHeight;
  const latRad = 2 * (Math.atan(Math.exp(mercatorN)) - Math.PI / 4);
  const lat = (latRad * 180) / Math.PI;

  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng,
  };
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const getCurrentCapsuleStatus = (openDate: string): CapsuleStatus => {
  const now = new Date();
  const open = new Date(openDate);
  return now >= open ? 'unlocked' : 'sealed';
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const continentsData: Array<Array<[number, number]>> = [
  [
    [-168, 65], [-168, 60], [-165, 55], [-160, 55], [-155, 58], [-150, 60],
    [-145, 70], [-140, 69], [-135, 68], [-130, 69], [-125, 70], [-120, 69],
    [-115, 70], [-110, 69], [-105, 68], [-100, 69], [-95, 70], [-90, 68],
    [-85, 65], [-82, 60], [-80, 50], [-75, 45], [-72, 40], [-70, 35],
    [-75, 30], [-80, 25], [-82, 30], [-85, 32], [-88, 30], [-90, 28],
    [-94, 29], [-97, 26], [-99, 20], [-105, 18], [-110, 22], [-115, 30],
    [-118, 34], [-122, 37], [-124, 40], [-125, 48], [-130, 54], [-135, 57],
    [-140, 60], [-150, 60], [-160, 58], [-165, 55], [-168, 60], [-168, 65],
  ],
  [
    [-82, 10], [-78, 8], [-75, 5], [-72, 8], [-70, 12], [-68, 15],
    [-65, 18], [-62, 20], [-60, 22], [-55, 25], [-52, 30], [-50, 35],
    [-48, 40], [-45, 45], [-42, 50], [-40, 55], [-42, 60], [-45, 58],
    [-50, 55], [-55, 52], [-58, 50], [-60, 45], [-62, 40], [-65, 35],
    [-68, 30], [-70, 25], [-72, 20], [-75, 15], [-78, 12], [-82, 10],
  ],
  [
    [-10, 35], [-5, 38], [0, 42], [5, 45], [10, 48], [15, 52], [20, 55],
    [25, 58], [30, 60], [35, 62], [40, 65], [45, 68], [50, 70], [55, 68],
    [60, 65], [65, 60], [70, 55], [65, 50], [60, 48], [55, 45], [50, 42],
    [45, 40], [40, 38], [35, 36], [30, 34], [25, 32], [20, 30], [15, 32],
    [10, 34], [5, 36], [0, 38], [-5, 37], [-10, 35],
  ],
  [
    [-18, 35], [-15, 30], [-10, 25], [-5, 20], [0, 15], [5, 10], [10, 5],
    [15, 0], [20, -5], [25, -10], [30, -15], [35, -20], [40, -25], [42, -30],
    [45, -35], [42, -34], [38, -32], [35, -28], [32, -25], [30, -20],
    [28, -15], [25, -10], [22, -5], [20, 0], [18, 5], [15, 10], [12, 15],
    [10, 20], [8, 25], [5, 30], [0, 33], [-5, 34], [-10, 34], [-15, 34],
    [-18, 35],
  ],
  [
    [50, 40], [55, 42], [60, 45], [65, 48], [70, 50], [75, 52], [80, 50],
    [85, 48], [90, 45], [95, 42], [100, 40], [105, 38], [110, 35],
    [115, 32], [120, 30], [125, 28], [130, 30], [135, 35], [140, 40],
    [142, 45], [140, 50], [135, 52], [130, 50], [125, 48], [120, 45],
    [115, 42], [110, 40], [105, 38], [100, 36], [95, 34], [90, 32],
    [85, 30], [80, 28], [75, 26], [70, 25], [65, 26], [60, 28], [55, 32],
    [50, 35], [50, 40],
  ],
  [
    [113, -12], [118, -15], [122, -18], [126, -22], [130, -25], [134, -28],
    [138, -32], [142, -35], [146, -38], [150, -36], [152, -32], [150, -28],
    [148, -24], [146, -20], [144, -16], [142, -12], [140, -8], [138, -5],
    [135, -3], [132, -5], [130, -8], [128, -10], [125, -12], [122, -14],
    [118, -14], [115, -13], [113, -12],
  ],
];

export const generateContinentPolygons = (
  mapWidth: number = MAP_WIDTH,
  mapHeight: number = MAP_HEIGHT
): Array<Array<{ x: number; y: number }>> => {
  return continentsData.map((continent) =>
    continent.map(([lng, lat]) => latLngToPixel(lat, lng, mapWidth, mapHeight))
  );
};

const noiseCache = new Map<string, number>();

export const valueNoise = (x: number, y: number, seed: number = 12345): number => {
  const key = `${x},${y},${seed}`;
  if (noiseCache.has(key)) return noiseCache.get(key)!;

  const hash = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  const value = hash - Math.floor(hash);
  noiseCache.set(key, value);
  return value;
};

export const smoothNoise = (x: number, y: number, seed: number = 12345): number => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const a = valueNoise(ix, iy, seed);
  const b = valueNoise(ix + 1, iy, seed);
  const c = valueNoise(ix, iy + 1, seed);
  const d = valueNoise(ix + 1, iy + 1, seed);

  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const ab = a + ux * (b - a);
  const cd = c + ux * (d - c);

  return ab + uy * (cd - ab);
};

export const generateUserId = (): string => {
  const stored = localStorage.getItem('tc_user_id');
  if (stored) return stored;
  const newId = 'user_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('tc_user_id', newId);
  return newId;
};
