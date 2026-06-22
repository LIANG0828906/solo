import type { Stroke, Point } from './strokeAnalyzer';

export type CalligraphyStyle = 'kaishu' | 'xingshu' | 'caoshu' | 'shoujin';

export interface StyleConfig {
  name: string;
  label: string;
  bezierOffset: { x: number; y: number };
  smoothingFactor: number;
  widthVariation: number;
  textureIntensity: number;
  endTaper: number;
  curveTension: number;
  brushTexture: {
    density: number;
    scatter: number;
    grain: number;
  };
}

export interface ProcessedStroke {
  id: string;
  paths: BezierPath[];
  originalStroke: Stroke;
  style: CalligraphyStyle;
  color: string;
}

export interface BezierPath {
  points: ControlPoints[];
  width: number;
}

export interface ControlPoints {
  start: Point;
  cp1: Point;
  cp2: Point;
  end: Point;
}

export const STYLE_PRESETS: Record<CalligraphyStyle, StyleConfig> = {
  kaishu: {
    name: 'kaishu',
    label: '楷书',
    bezierOffset: { x: 8, y: 6 },
    smoothingFactor: 0.35,
    widthVariation: 0.25,
    textureIntensity: 0.6,
    endTaper: 0.85,
    curveTension: 0.5,
    brushTexture: {
      density: 0.3,
      scatter: 0.4,
      grain: 0.5
    }
  },
  xingshu: {
    name: 'xingshu',
    label: '行书',
    bezierOffset: { x: 15, y: 12 },
    smoothingFactor: 0.5,
    widthVariation: 0.45,
    textureIntensity: 0.7,
    endTaper: 0.7,
    curveTension: 0.65,
    brushTexture: {
      density: 0.45,
      scatter: 0.6,
      grain: 0.6
    }
  },
  caoshu: {
    name: 'caoshu',
    label: '草书',
    bezierOffset: { x: 25, y: 20 },
    smoothingFactor: 0.65,
    widthVariation: 0.6,
    textureIntensity: 0.8,
    endTaper: 0.5,
    curveTension: 0.8,
    brushTexture: {
      density: 0.6,
      scatter: 0.8,
      grain: 0.75
    }
  },
  shoujin: {
    name: 'shoujin',
    label: '瘦金体',
    bezierOffset: { x: 5, y: 4 },
    smoothingFactor: 0.25,
    widthVariation: 0.15,
    textureIntensity: 0.4,
    endTaper: 0.95,
    curveTension: 0.35,
    brushTexture: {
      density: 0.2,
      scatter: 0.25,
      grain: 0.35
    }
  }
};

export type PaperTexture = 'rice' | 'maobian' | 'sajin';

export interface PaperConfig {
  name: PaperTexture;
  label: string;
  backgroundColor: string;
  filter: string;
  noiseOpacity: number;
  textureType: 'fine' | 'rough' | 'splotch';
  fiberDensity: number;
  goldSpots?: number;
}

export const PAPER_PRESETS: Record<PaperTexture, PaperConfig> = {
  rice: {
    name: 'rice',
    label: '宣纸',
    backgroundColor: '#f5f0e8',
    filter: 'contrast(1.05) brightness(1.02)',
    noiseOpacity: 0.08,
    textureType: 'fine',
    fiberDensity: 0.3
  },
  maobian: {
    name: 'maobian',
    label: '毛边纸',
    backgroundColor: '#e8dcc4',
    filter: 'contrast(1.08) sepia(0.08)',
    noiseOpacity: 0.15,
    textureType: 'rough',
    fiberDensity: 0.7
  },
  sajin: {
    name: 'sajin',
    label: '洒金纸',
    backgroundColor: '#faf3e3',
    filter: 'brightness(1.03) saturate(1.02)',
    noiseOpacity: 0.06,
    textureType: 'splotch',
    fiberDensity: 0.2,
    goldSpots: 35
  }
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
    pressure: lerp(p1.pressure, p2.pressure, t),
    timestamp: p1.timestamp,
    velocity: lerp(p1.velocity, p2.velocity, t)
  };
}

function smoothStrokePoints(points: Point[], factor: number): Point[] {
  if (points.length < 3) return points;

  const smoothed: Point[] = [points[0]];
  const windowSize = Math.max(2, Math.floor(factor * 5) + 2);

  for (let i = 1; i < points.length - 1; i++) {
    const start = Math.max(0, i - windowSize);
    const end = Math.min(points.length - 1, i + windowSize);
    const slice = points.slice(start, end + 1);

    const weights: number[] = slice.map((_, idx) => {
      const distance = Math.abs(idx - (slice.length - 1) / 2);
      return 1 / (1 + distance * factor * 2);
    });
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let x = 0, y = 0, pressure = 0, velocity = 0;
    slice.forEach((p, idx) => {
      const w = weights[idx] / totalWeight;
      x += p.x * w;
      y += p.y * w;
      pressure += p.pressure * w;
      velocity += p.velocity * w;
    });

    smoothed.push({
      x, y, pressure, velocity,
      timestamp: points[i].timestamp
    });
  }

  smoothed.push(points[points.length - 1]);
  return smoothed;
}

function generateBezierSegments(points: Point[], config: StyleConfig): ControlPoints[] {
  if (points.length < 2) return [];

  const segments: ControlPoints[] = [];
  const tension = config.curveTension;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension / 6 + config.bezierOffset.x * (Math.random() - 0.5);
    const cp1y = p1.y + (p2.y - p0.y) * tension / 6 + config.bezierOffset.y * (Math.random() - 0.5);
    const cp2x = p2.x - (p3.x - p1.x) * tension / 6 + config.bezierOffset.x * (Math.random() - 0.5);
    const cp2y = p2.y - (p3.y - p1.y) * tension / 6 + config.bezierOffset.y * (Math.random() - 0.5);

    segments.push({
      start: { ...p1 },
      cp1: { x: cp1x, y: cp1y, pressure: p1.pressure, timestamp: p1.timestamp, velocity: p1.velocity },
      cp2: { x: cp2x, y: cp2y, pressure: p2.pressure, timestamp: p2.timestamp, velocity: p2.velocity },
      end: { ...p2 }
    });
  }

  return segments;
}

function getVariableWidth(
  pointIndex: number,
  totalPoints: number,
  baseWidth: number,
  pressure: number,
  config: StyleConfig
): number {
  const progress = pointIndex / Math.max(totalPoints - 1, 1);
  const taperMultiplier = progress < 0.1
    ? progress / 0.1
    : progress > 0.85
      ? (1 - (progress - 0.85) / 0.15) * config.endTaper + (1 - config.endTaper)
      : 1;

  const variation = (Math.sin(pointIndex * 0.5) * 0.5 + 0.5) * config.widthVariation;
  const pressureFactor = 0.6 + pressure * 0.4;

  return baseWidth * taperMultiplier * pressureFactor * (1 - variation * 0.3);
}

export function processStroke(stroke: Stroke, style: CalligraphyStyle): ProcessedStroke {
  const config = STYLE_PRESETS[style];
  const smoothedPoints = smoothStrokePoints(stroke.points, config.smoothingFactor);
  
  const densityMultiplier = 1 + Math.floor(config.smoothingFactor * 2);
  const interpolatedPoints: Point[] = [];

  for (let i = 0; i < smoothedPoints.length - 1; i++) {
    for (let j = 0; j < densityMultiplier; j++) {
      const t = j / densityMultiplier;
      interpolatedPoints.push(lerpPoint(smoothedPoints[i], smoothedPoints[i + 1], t));
    }
  }
  interpolatedPoints.push(smoothedPoints[smoothedPoints.length - 1]);

  const bezierSegments = generateBezierSegments(interpolatedPoints, config);
  const baseWidth = stroke.baseWidth * (1 + config.widthVariation * 0.3);

  const paths: BezierPath[] = bezierSegments.map((seg, idx) => ({
    points: [seg],
    width: getVariableWidth(idx, bezierSegments.length, baseWidth, seg.start.pressure, config)
  }));

  return {
    id: stroke.id,
    paths,
    originalStroke: stroke,
    style,
    color: stroke.color
  };
}

export function processAllStrokes(strokes: Stroke[], style: CalligraphyStyle): ProcessedStroke[] {
  return strokes.map(stroke => processStroke(stroke, style));
}

export function adjustColorDepth(color: string, depth: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const minDepth = 26;
  const maxDepth = 102;
  const targetGray = Math.round(lerp(minDepth, maxDepth, 1 - depth));

  const adjustedR = Math.round(lerp(r, targetGray, 0.7));
  const adjustedG = Math.round(lerp(g, targetGray, 0.7));
  const adjustedB = Math.round(lerp(b, targetGray, 0.7));

  return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
}

export function renderProcessedStroke(
  ctx: CanvasRenderingContext2D,
  processed: ProcessedStroke,
  inkDepth: number = 1
): void {
  const config = STYLE_PRESETS[processed.style];
  const adjustedColor = adjustColorDepth(processed.color, inkDepth);

  processed.paths.forEach((path, pathIdx) => {
    if (path.points.length === 0) return;

    const seg = path.points[0];
    const progress = pathIdx / Math.max(processed.paths.length - 1, 1);
    
    const opacity = progress < 0.05 
      ? progress / 0.05 
      : progress > 0.9 
        ? (1 - (progress - 0.9) / 0.1) * 0.9 + 0.1
        : 1;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(seg.start.x, seg.start.y);
    ctx.bezierCurveTo(seg.cp1.x, seg.cp1.y, seg.cp2.x, seg.cp2.y, seg.end.x, seg.end.y);
    ctx.strokeStyle = adjustedColor;
    ctx.lineWidth = path.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity * (0.85 + Math.sin(pathIdx * 1.2) * 0.15 * config.textureIntensity);
    ctx.stroke();
    ctx.restore();

    if (config.brushTexture.density > 0) {
      const textureCount = Math.floor(path.width * config.brushTexture.density * 2);
      for (let i = 0; i < textureCount; i++) {
        const t = Math.random();
        const scatter = (Math.random() - 0.5) * config.brushTexture.scatter * path.width;
        
        const x = (1 - t) * (1 - t) * (1 - t) * seg.start.x +
                  3 * (1 - t) * (1 - t) * t * seg.cp1.x +
                  3 * (1 - t) * t * t * seg.cp2.x +
                  t * t * t * seg.end.x + scatter;
        
        const y = (1 - t) * (1 - t) * (1 - t) * seg.start.y +
                  3 * (1 - t) * (1 - t) * t * seg.cp1.y +
                  3 * (1 - t) * t * t * seg.cp2.y +
                  t * t * t * seg.end.y + scatter;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, path.width * (0.05 + Math.random() * 0.1) * config.brushTexture.grain, 0, Math.PI * 2);
        ctx.fillStyle = adjustedColor;
        ctx.globalAlpha = opacity * 0.08 * config.brushTexture.density;
        ctx.fill();
        ctx.restore();
      }
    }
  });
}

export function renderOriginalStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  inkDepth: number = 1
): void {
  if (stroke.points.length < 2) return;

  const adjustedColor = adjustColorDepth(stroke.color, inkDepth);

  for (let i = 1; i < stroke.points.length; i++) {
    const prev = stroke.points[i - 1];
    const curr = stroke.points[i];
    const width = stroke.baseWidth * (0.6 + curr.pressure * 0.4);
    const opacity = 0.3 + curr.pressure * 0.7;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.strokeStyle = adjustedColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = opacity;
    ctx.stroke();
    ctx.restore();
  }
}

export async function processStrokesAsync(
  strokes: Stroke[],
  style: CalligraphyStyle,
  onProgress?: (progress: number) => void
): Promise<ProcessedStroke[]> {
  const result: ProcessedStroke[] = [];
  const chunkSize = Math.max(1, Math.ceil(strokes.length / 10));

  for (let i = 0; i < strokes.length; i += chunkSize) {
    const chunk = strokes.slice(i, i + chunkSize);
    const processedChunk = chunk.map(s => processStroke(s, style));
    result.push(...processedChunk);
    
    if (onProgress) {
      onProgress(Math.min(1, (i + chunkSize) / strokes.length));
    }

    await new Promise(resolve => setTimeout(resolve, 30));
  }

  return result;
}

export default {
  processStroke,
  processAllStrokes,
  processStrokesAsync,
  renderProcessedStroke,
  renderOriginalStroke,
  adjustColorDepth,
  STYLE_PRESETS,
  PAPER_PRESETS
};
