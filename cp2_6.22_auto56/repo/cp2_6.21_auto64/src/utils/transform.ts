import type { CanvasConfig, Layer, ShapeType } from '../store';

export const CANVAS_SIZE = 500;
export const CANVAS_CENTER = CANVAS_SIZE / 2;

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;

export interface TransformResult {
  transform: string;
  key: string;
}

export const getSymmetryTransforms = (
  layer: Layer,
  config: CanvasConfig,
  cx: number = CANVAS_CENTER,
  cy: number = CANVAS_CENTER
): TransformResult[] => {
  if (config.symmetryMode === 'mirror') {
    return [
      {
        key: `${layer.id}-orig`,
        transform: buildBaseTransform(layer, cx, cy, 0)
      },
      {
        key: `${layer.id}-mirror`,
        transform: buildMirrorTransform(layer, cx, cy)
      }
    ];
  }

  const count = config.symmetryCount;
  const results: TransformResult[] = [];
  const step = 360 / count;

  for (let i = 0; i < count; i++) {
    const angle = step * i + config.angleOffset;
    results.push({
      key: `${layer.id}-${i}`,
      transform: buildBaseTransform(layer, cx, cy, angle)
    });
  }
  return results;
};

const buildBaseTransform = (
  layer: Layer,
  cx: number,
  cy: number,
  symmetryAngle: number
): string => {
  return `translate(${cx} ${cy}) rotate(${symmetryAngle}) translate(${layer.radialDistance} 0) rotate(${layer.rotation}) scale(${layer.scale})`;
};

const buildMirrorTransform = (
  layer: Layer,
  cx: number,
  cy: number
): string => {
  return `translate(${cx} ${cy}) scale(-1 1) translate(${-layer.radialDistance} 0) rotate(${-layer.rotation}) scale(${layer.scale})`;
};

export const getShapePath = (shape: ShapeType): string => {
  switch (shape) {
    case 'circle':
      return '';
    case 'ellipse':
      return '';
    case 'diamond':
      return 'M0,-25 L20,0 L0,25 L-20,0 Z';
    case 'hexagon': {
      const pts: string[] = [];
      for (let i = 0; i < 6; i++) {
        const a = degToRad(60 * i - 90);
        pts.push(`${(Math.cos(a) * 22).toFixed(2)},${(Math.sin(a) * 22).toFixed(2)}`);
      }
      return `M${pts.join(' L')} Z`;
    }
    case 'triangle': {
      const pts: string[] = [];
      for (let i = 0; i < 3; i++) {
        const a = degToRad(120 * i - 90);
        pts.push(`${(Math.cos(a) * 24).toFixed(2)},${(Math.sin(a) * 24).toFixed(2)}`);
      }
      return `M${pts.join(' L')} Z`;
    }
    case 'star': {
      const pts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 26 : 11;
        const a = degToRad(36 * i - 90);
        pts.push(`${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`);
      }
      return `M${pts.join(' L')} Z`;
    }
    case 'petal': {
      return 'M0,-30 C15,-25 18,0 0,30 C-18,0 -15,-25 0,-30 Z';
    }
    case 'ring':
      return '';
    case 'stripe':
      return 'M-30,-6 L30,-6 L30,6 L-30,6 Z';
    case 'zigzag': {
      const pts: string[] = [];
      for (let i = 0; i <= 8; i++) {
        const x = -28 + i * 7;
        const y = i % 2 === 0 ? -10 : 10;
        pts.push(`${x.toFixed(1)},${y}`);
      }
      return `M${pts.join(' L')}`;
    }
    default:
      return '';
  }
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16)
      }
    : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));

export interface Polar {
  distance: number;
  angleDeg: number;
}

export const svgPointToPolar = (
  svgX: number,
  svgY: number,
  cx: number = CANVAS_CENTER,
  cy: number = CANVAS_CENTER
): Polar => {
  const dx = svgX - cx;
  const dy = svgY - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  return { distance, angleDeg };
};

export const clientToSvgPoint = (
  clientX: number,
  clientY: number,
  svg: SVGSVGElement
): { x: number; y: number } => {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const svgPt = pt.matrixTransform(ctm.inverse());
  return { x: svgPt.x, y: svgPt.y };
};

export const normalizeAngle = (deg: number): number => {
  let a = deg % 360;
  if (a < 0) a += 360;
  return a;
};

export const findNearestSymmetryAngle = (
  targetAngle: number,
  config: CanvasConfig
): { symmetryAngle: number; index: number } => {
  if (config.symmetryMode === 'mirror') {
    return { symmetryAngle: 0, index: 0 };
  }
  const count = config.symmetryCount;
  const step = 360 / count;
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < count; i++) {
    const sym = step * i + config.angleOffset;
    let diff = Math.abs(normalizeAngle(targetAngle - sym + 180) - 180);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return { symmetryAngle: step * bestIdx + config.angleOffset, index: bestIdx };
};
