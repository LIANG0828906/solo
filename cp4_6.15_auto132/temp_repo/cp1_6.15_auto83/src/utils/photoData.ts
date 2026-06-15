export interface PhotoParams {
  aperture: number;
  shutterSpeed: string;
  shutterSpeedNum: number;
  iso: number;
  focalLength: number;
  ev: number;
}

export interface RadarScores {
  detail: number;
  noise: number;
  depthOfField: number;
  dynamicRange: number;
  colorSaturation: number;
}

export interface PhotoData {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  params: PhotoParams;
  tags: string[];
  radarScores: RadarScores;
}

export const TAGS = [
  { id: 'portrait', name: '人像', color: 'rgba(244, 114, 182, 0.85)' },
  { id: 'night', name: '夜景', color: 'rgba(96, 165, 250, 0.85)' },
  { id: 'street', name: '街拍', color: 'rgba(251, 191, 36, 0.85)' },
  { id: 'macro', name: '微距', color: 'rgba(74, 222, 128, 0.85)' },
  { id: 'landscape', name: '风光', color: 'rgba(167, 139, 250, 0.85)' },
  { id: 'architecture', name: '建筑', color: 'rgba(255, 140, 66, 0.85)' },
  { id: 'food', name: '美食', color: 'rgba(239, 68, 68, 0.85)' },
  { id: 'sports', name: '运动', color: 'rgba(34, 197, 94, 0.85)' },
];

const apertureValues = [1.4, 1.8, 2.0, 2.8, 3.5, 4.0, 5.6, 8.0, 11, 16];
const shutterSpeeds = [
  { display: '1/4000', value: 1 / 4000 },
  { display: '1/2000', value: 1 / 2000 },
  { display: '1/1000', value: 1 / 1000 },
  { display: '1/500', value: 1 / 500 },
  { display: '1/250', value: 1 / 250 },
  { display: '1/125', value: 1 / 125 },
  { display: '1/60', value: 1 / 60 },
  { display: '1/30', value: 1 / 30 },
  { display: '1/15', value: 1 / 15 },
  { display: '1/8', value: 1 / 8 },
  { display: '1/4', value: 1 / 4 },
  { display: '1s', value: 1 },
  { display: '2s', value: 2 },
];
const isoValues = [100, 200, 400, 800, 1600, 3200, 6400, 12800];
const focalLengths = [24, 35, 50, 85, 105, 135, 200];

function calculateEV(aperture: number, shutterSpeed: number, iso: number): number {
  const ev = Math.log2((aperture * aperture) / shutterSpeed) - Math.log2(iso / 100);
  return Math.round(ev * 10) / 10;
}

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, value));
}

function gaussian(x: number, center: number, sigma: number): number {
  return Math.exp(-((x - center) ** 2) / (2 * sigma ** 2));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function scoreApertureDetail(aperture: number): number {
  const logA = Math.log2(aperture);
  const bestLogA = Math.log2(9.5);
  const sigma = 1.35;
  const g = gaussian(logA, bestLogA, sigma);
  return clampScore(1 + 9 * g);
}

function scoreIsoDetail(iso: number): number {
  const isoRatio = iso / 100;
  const base = 10 / Math.sqrt(isoRatio);
  return clampScore(base);
}

function scoreNoise(iso: number): number {
  const isoRatio = iso / 100;
  const base = 1 + 9 * Math.exp(-0.6931 * (Math.sqrt(isoRatio) - 1));
  return clampScore(base);
}

function scoreDepthOfField(aperture: number): number {
  const logA = Math.log2(aperture);
  const bestLogA = Math.log2(1.4);
  const sigma = 2.2;
  const g = gaussian(logA, bestLogA, sigma);
  return clampScore(1 + 9 * g);
}

function scoreIsoDynamicRange(iso: number): number {
  const isoRatio = iso / 100;
  const base = 1 + 9 * Math.exp(-0.4621 * (isoRatio - 1));
  return clampScore(base);
}

function scoreShutterDynamicRange(shutterSpeedNum: number): number {
  const logShutter = Math.log2(shutterSpeedNum);
  const bestMin = Math.log2(1 / 250);
  const bestMax = Math.log2(1 / 30);
  const bestCenter = (bestMin + bestMax) / 2;
  const halfRange = (bestMax - bestMin) / 2;
  const sigma = halfRange * 1.4;
  const g = gaussian(logShutter, bestCenter, sigma);
  return clampScore(3 + 7 * g);
}

function scoreColorSaturation(ev: number): number {
  const bestMin = 8;
  const bestMax = 13;
  const bestCenter = (bestMin + bestMax) / 2;
  const halfRange = (bestMax - bestMin) / 2;
  const sigma = halfRange * 1.2;
  const g = gaussian(ev, bestCenter, sigma);
  return clampScore(2 + 8 * g);
}

function calculateRadarScores(params: PhotoParams): RadarScores {
  const { aperture, iso, shutterSpeedNum, ev } = params;
  
  const apertureDetail = scoreApertureDetail(aperture);
  const isoDetail = scoreIsoDetail(iso);
  const detail = clampScore(apertureDetail * 0.62 + isoDetail * 0.38);
  
  const noise = clampScore(scoreNoise(iso));
  
  const depthOfField = clampScore(scoreDepthOfField(aperture));
  
  const isoDr = scoreIsoDynamicRange(iso);
  const shutterDr = scoreShutterDynamicRange(shutterSpeedNum);
  const dynamicRange = clampScore(isoDr * 0.55 + shutterDr * 0.45);
  
  const colorSaturation = clampScore(scoreColorSaturation(ev));
  
  return {
    detail: round1(detail),
    noise: round1(noise),
    depthOfField: round1(depthOfField),
    dynamicRange: round1(dynamicRange),
    colorSaturation: round1(colorSaturation),
  };
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTags(): string[] {
  const numTags = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...TAGS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numTags).map(t => t.id);
}

const photoThemes = [
  'nature', 'city', 'portrait', 'abstract', 'architecture',
  'food', 'landscape', 'night', 'street', 'macro'
];

function generateImageUrl(seed: number, width: number, height: number): string {
  const theme = photoThemes[seed % photoThemes.length];
  return `https://picsum.photos/seed/${theme}${seed}/${width}/${height}`;
}

export function generateMockPhotos(count: number): PhotoData[] {
  const photos: PhotoData[] = [];
  
  for (let i = 0; i < count; i++) {
    const aperture = getRandomItem(apertureValues);
    const shutter = getRandomItem(shutterSpeeds);
    const iso = getRandomItem(isoValues);
    const focalLength = getRandomItem(focalLengths);
    
    const aspectRatios = [
      { w: 800, h: 600 },
      { w: 800, h: 800 },
      { w: 600, h: 800 },
      { w: 800, h: 533 },
      { w: 800, h: 1067 },
    ];
    const ratio = getRandomItem(aspectRatios);
    
    const ev = calculateEV(aperture, shutter.value, iso);
    
    const params: PhotoParams = {
      aperture,
      shutterSpeed: shutter.display,
      shutterSpeedNum: shutter.value,
      iso,
      focalLength,
      ev,
    };
    
    photos.push({
      id: `photo-${i}`,
      imageUrl: generateImageUrl(i + 100, ratio.w, ratio.h),
      width: ratio.w,
      height: ratio.h,
      aspectRatio: ratio.w / ratio.h,
      params,
      tags: getRandomTags(),
      radarScores: calculateRadarScores(params),
    });
  }
  
  return photos;
}

export function getExposureTrend(photos: PhotoData[], currentIndex: number, count: number = 5): { index: number; ev: number }[] {
  const start = Math.max(0, currentIndex - count + 1);
  const trend: { index: number; ev: number }[] = [];
  
  for (let i = start; i <= currentIndex && i < photos.length; i++) {
    trend.push({
      index: i,
      ev: photos[i].params.ev,
    });
  }
  
  return trend;
}

export function compareParams(photos: PhotoData[]): {
  maxAperture: number;
  minAperture: number;
  maxIso: number;
  minIso: number;
  maxShutter: number;
  minShutter: number;
  maxEv: number;
  minEv: number;
} {
  const apertures = photos.map(p => p.params.aperture);
  const isos = photos.map(p => p.params.iso);
  const shutters = photos.map(p => p.params.shutterSpeedNum);
  const evs = photos.map(p => p.params.ev);
  
  return {
    maxAperture: Math.max(...apertures),
    minAperture: Math.min(...apertures),
    maxIso: Math.max(...isos),
    minIso: Math.min(...isos),
    maxShutter: Math.max(...shutters),
    minShutter: Math.min(...shutters),
    maxEv: Math.max(...evs),
    minEv: Math.min(...evs),
  };
}

export function calculateExposureAdjustment(
  baseEV: number,
  apertureAdjustment: number,
  shutterAdjustment: number,
  isoAdjustment: number
): { brightness: number; contrast: number } {
  const evChange = apertureAdjustment + shutterAdjustment + isoAdjustment;
  const brightness = 1 + evChange * 0.08;
  const contrast = 1 + evChange * 0.03;
  
  return {
    brightness: Math.max(0.3, Math.min(2, brightness)),
    contrast: Math.max(0.5, Math.min(1.5, contrast)),
  };
}
