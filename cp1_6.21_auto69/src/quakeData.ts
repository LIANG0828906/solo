export interface Earthquake {
  id: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  timestamp: number;
}

export interface TimeRange {
  start: number;
  end: number;
}

const PLATE_BOUNDARIES: [number, number][] = [
  [36, 138], [37, 141], [38, 143], [40, 144], [42, 145], [44, 147],
  [14, 121], [15, 120], [18, 121], [20, 122], [23, 121], [25, 123],
  [-5, 130], [-8, 115], [-2, 128], [0, 127], [2, 126], [5, 125],
  [-33, -72], [-35, -71], [-38, -73], [-40, -74], [-45, -75],
  [-15, -75], [-20, -70], [-10, -78], [-5, -80], [0, -80], [5, -77],
  [10, -84], [15, -92], [18, -103], [20, -106],
  [60, 150], [55, 160], [52, 155], [50, 156], [48, 155],
  [-40, 175], [-38, 177], [-37, 178], [-41, 174],
  [28, 85], [30, 81], [35, 74], [37, 73], [39, 72],
  [38, 43], [40, 44], [42, 45], [37, 36],
  [0, 30], [-5, 35], [-10, 40], [12, 44], [15, 42],
  [62, -20], [65, -18], [70, -25],
  [-15, 168], [-17, 169], [-20, 170],
  [5, 95], [7, 97], [10, 99], [14, 100], [18, 99],
  [-25, -15], [-30, -13], [-35, -18], [-40, -25],
  [45, 25], [42, 28], [40, 30],
  [70, -30], [72, -25], [75, -20],
  [50, 90], [48, 100], [45, 110],
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateId(index: number): string {
  return `eq_${index.toString().padStart(4, '0')}`;
}

export function generateEarthquakes(): Earthquake[] {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const rand = seededRandom(42);
  const earthquakes: Earthquake[] = [];

  const boundaryCount = Math.floor(PLATE_BOUNDARIES.length * 0.75);
  const randomCount = 120 - boundaryCount;

  for (let i = 0; i < boundaryCount; i++) {
    const [baseLat, baseLng] = PLATE_BOUNDARIES[i];
    const latOffset = (rand() - 0.5) * 8;
    const lngOffset = (rand() - 0.5) * 8;
    const magnitude = 4.0 + rand() * 5.0;
    const depthRand = rand();
    let depth: number;
    if (depthRand < 0.6) {
      depth = rand() * 70;
    } else if (depthRand < 0.9) {
      depth = 70 + rand() * 230;
    } else {
      depth = 300 + rand() * 400;
    }
    earthquakes.push({
      id: generateId(i),
      latitude: Math.max(-90, Math.min(90, baseLat + latOffset)),
      longitude: ((baseLng + lngOffset + 180) % 360) - 180,
      depth: Math.round(depth * 10) / 10,
      magnitude: Math.round(magnitude * 10) / 10,
      timestamp: now - rand() * thirtyDays,
    });
  }

  for (let i = 0; i < randomCount; i++) {
    const lat = (rand() - 0.5) * 160;
    const lng = (rand() - 0.5) * 360;
    const magnitude = 4.0 + rand() * 5.0;
    const depthRand = rand();
    let depth: number;
    if (depthRand < 0.6) {
      depth = rand() * 70;
    } else if (depthRand < 0.9) {
      depth = 70 + rand() * 230;
    } else {
      depth = 300 + rand() * 400;
    }
    earthquakes.push({
      id: generateId(boundaryCount + i),
      latitude: Math.round(lat * 100) / 100,
      longitude: Math.round(lng * 100) / 100,
      depth: Math.round(depth * 10) / 10,
      magnitude: Math.round(magnitude * 10) / 10,
      timestamp: now - rand() * thirtyDays,
    });
  }

  return earthquakes.sort((a, b) => a.timestamp - b.timestamp);
}

export function filterByTimeRange(data: Earthquake[], range: TimeRange): Earthquake[] {
  return data.filter((eq) => eq.timestamp >= range.start && eq.timestamp <= range.end);
}

export function magnitudeToRadius(magnitude: number): number {
  const minMag = 4.0;
  const maxMag = 9.0;
  const minRadius = 0.015;
  const maxRadius = 0.06;
  const t = (magnitude - minMag) / (maxMag - minMag);
  return minRadius + t * (maxRadius - minRadius);
}

export function magnitudeToColor(magnitude: number): string {
  const minMag = 4.0;
  const maxMag = 9.0;
  const t = Math.max(0, Math.min(1, (magnitude - minMag) / (maxMag - minMag)));
  const r = Math.round(0x00 + t * (0xff - 0x00));
  const g = Math.round(0xff - t * (0xff - 0x00) + t * (0x00));
  const b = Math.round(0x88 - t * (0x88 - 0x44));
  return `rgb(${r}, ${g}, ${b})`;
}

export function magnitudeToHex(magnitude: number): number {
  const minMag = 4.0;
  const maxMag = 9.0;
  const t = Math.max(0, Math.min(1, (magnitude - minMag) / (maxMag - minMag)));
  const r = Math.round(0x00 + t * (0xff - 0x00));
  const g = Math.round(0xff - t * (0xff - 0x00));
  const b = Math.round(0x88 - t * (0x88 - 0x44));
  return (r << 16) | (g << 8) | b;
}

export function depthToOffset(depth: number): number {
  if (depth <= 70) return 0;
  if (depth <= 300) return -0.02;
  return -0.05;
}

export function formatUTC(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toUTCString();
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
