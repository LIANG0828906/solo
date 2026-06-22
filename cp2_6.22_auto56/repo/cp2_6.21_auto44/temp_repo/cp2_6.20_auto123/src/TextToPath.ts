export interface Point {
  x: number;
  y: number;
}

export interface TextConfig {
  text: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  canvasWidth: number;
  canvasHeight: number;
}

export function getTextPoints(config: TextConfig, sampleStep: number = 2): Point[] {
  const { text, fontSize, fontWeight, fontStyle, canvasWidth, canvasHeight } = config;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return [];
  }

  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;
  const points: Point[] = [];
  const halfWidth = canvasWidth / 2;
  const halfHeight = canvasHeight / 2;

  for (let y = 0; y < canvasHeight; y += sampleStep) {
    for (let x = 0; x < canvasWidth; x += sampleStep) {
      const index = (y * canvasWidth + x) * 4 + 3;
      const alpha = imageData[index];
      if (alpha > 128) {
        points.push({
          x: x - halfWidth,
          y: y - halfHeight,
        });
      }
    }
  }

  return points;
}

export function estimateParticleCount(points: Point[]): number {
  const base = points.length * 0.8;
  const clamped = Math.max(1000, Math.min(3000, base));
  return Math.min(5000, clamped);
}

export function samplePointsForParticles(points: Point[], targetCount: number): Point[] {
  const result: Point[] = [];
  const total = points.length;

  if (total === 0) {
    return result;
  }

  if (total >= targetCount) {
    const step = total / targetCount;
    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(i * step);
      result.push(points[index]);
    }
  } else {
    for (let i = 0; i < targetCount; i++) {
      const index = Math.floor(Math.random() * total);
      result.push(points[index]);
    }
  }

  return result;
}
