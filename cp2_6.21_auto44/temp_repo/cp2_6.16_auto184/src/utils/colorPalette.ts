import * as THREE from 'three';

export type GalaxyType = 'spiral' | 'elliptical' | 'irregular';

export interface ColorStop {
  position: number;
  color: THREE.Color;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      }
    : { r: 0, g: 0, b: 0 };
};

const hexToColor = (hex: string): THREE.Color => {
  const rgb = hexToRgb(hex);
  return new THREE.Color(rgb.r, rgb.g, rgb.b);
};

export const COLORS = {
  coreGold: hexToColor('#FFD700'),
  coreOrange: hexToColor('#FF4500'),
  armPurple: hexToColor('#8A2BE2'),
  armBlue: hexToColor('#00BFFF'),
  ellipseRed: hexToColor('#FF6347'),
  ellipseOrange: hexToColor('#FFA07A'),
  coreWarmStart: hexToColor('#FFD700'),
  coreWarmEnd: hexToColor('#FF6347')
};

const lerpColor = (c1: THREE.Color, c2: THREE.Color, t: number): THREE.Color => {
  const result = new THREE.Color();
  result.r = c1.r + (c2.r - c1.r) * t;
  result.g = c1.g + (c2.g - c1.g) * t;
  result.b = c1.b + (c2.b - c1.b) * t;
  return result;
};

const lerpColorArray = (stops: ColorStop[], t: number): THREE.Color => {
  if (stops.length === 0) return new THREE.Color(0xffffff);
  if (t <= stops[0].position) return stops[0].color.clone();
  if (t >= stops[stops.length - 1].position) return stops[stops.length - 1].color.clone();

  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (t >= s1.position && t <= s2.position) {
      const localT = (t - s1.position) / (s2.position - s1.position);
      return lerpColor(s1.color, s2.color, localT);
    }
  }
  return stops[stops.length - 1].color.clone();
};

export const getSpiralCoreColor = (distanceFromCenter: number, maxRadius: number): THREE.Color => {
  const t = Math.min(distanceFromCenter / (maxRadius * 0.2), 1);
  return lerpColor(COLORS.coreGold, COLORS.coreOrange, t);
};

export const getSpiralArmColor = (t: number): THREE.Color => {
  return lerpColor(COLORS.armPurple, COLORS.armBlue, t);
};

export const getEllipticalColor = (distanceFromCenter: number, maxRadius: number): THREE.Color => {
  const t = Math.min(distanceFromCenter / maxRadius, 1);
  const stops: ColorStop[] = [
    { position: 0, color: COLORS.coreGold },
    { position: 0.2, color: COLORS.coreOrange },
    { position: 0.5, color: COLORS.ellipseRed },
    { position: 1, color: COLORS.ellipseOrange }
  ];
  return lerpColorArray(stops, t);
};

const irregularPalette = [
  '#FFD700', '#FF4500', '#8A2BE2', '#00BFFF',
  '#FF6347', '#FFA07A', '#00FF7F', '#FF69B4',
  '#7FFF00', '#FF1493', '#00CED1', '#FFA500'
];

export const getIrregularColor = (seed: number, clusterBias: number = 0): THREE.Color => {
  const palette = irregularPalette.map(hexToColor);
  const idx = Math.floor((seed + clusterBias * 0.3) * palette.length) % palette.length;
  const color = palette[Math.abs(idx)];
  const variation = 0.85 + (seed % 0.15);
  const result = color.clone();
  result.r *= variation;
  result.g *= variation;
  result.b *= variation;
  return result;
};

export const getStarBrightness = (distanceFromCenter: number, maxRadius: number): number => {
  const t = distanceFromCenter / maxRadius;
  return Math.max(0.25, 1 - t * 0.75);
};

export const getStarSize = (distanceFromCenter: number, maxRadius: number, baseSize: number): number => {
  const t = distanceFromCenter / maxRadius;
  const coreFactor = Math.max(0.3, 1 - t * 0.9);
  const noise = 0.7 + ((distanceFromCenter * 13.37) % 0.6);
  return baseSize * coreFactor * noise;
};
