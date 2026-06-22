import type { Ingredient } from '@/data/ingredients';

export interface LayerInfo {
  color: string;
  label: string;
  opacity?: number;
}

export interface Bubble {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
}

interface CupBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function buildLayers(
  base: Ingredient | null,
  syrups: Ingredient[],
  foamLevel: number,
  garnishes: Ingredient[]
): LayerInfo[] {
  const layers: LayerInfo[] = [];

  if (base) {
    layers.push({ color: base.color, label: base.name, opacity: 0.9 });
  }

  for (const syrup of syrups) {
    layers.push({ color: syrup.color, label: syrup.name, opacity: 0.8 });
  }

  if (foamLevel > 0) {
    layers.push({
      color: '#FFFFFF',
      label: '奶泡',
      opacity: Math.min(0.7, 0.4 + foamLevel * 0.1),
    });
  }

  for (const garnish of garnishes) {
    layers.push({ color: garnish.color, label: garnish.name, opacity: 0.85 });
  }

  return layers;
}

function getCupGeometry(
  width: number,
  height: number
): {
  topY: number;
  bottomY: number;
  topLeftX: number;
  topRightX: number;
  bottomLeftX: number;
  bottomRightX: number;
} {
  const centerX = width / 2;
  const topHalfWidth = width * 0.3;
  const bottomHalfWidth = width * 0.225;
  const topY = height * 0.08;
  const bottomY = height * 0.88;

  return {
    topY,
    bottomY,
    topLeftX: centerX - topHalfWidth,
    topRightX: centerX + topHalfWidth,
    bottomLeftX: centerX - bottomHalfWidth,
    bottomRightX: centerX + bottomHalfWidth,
  };
}

function getCupBounds(width: number, height: number): CupBounds {
  const geo = getCupGeometry(width, height);
  return {
    left: geo.bottomLeftX,
    right: geo.bottomRightX,
    top: geo.topY,
    bottom: geo.bottomY,
  };
}

function buildCupPath(
  ctx: CanvasRenderingContext2D,
  geo: ReturnType<typeof getCupGeometry>
) {
  ctx.beginPath();
  ctx.moveTo(geo.topLeftX, geo.topY);
  ctx.lineTo(geo.topRightX, geo.topY);
  ctx.lineTo(geo.bottomRightX, geo.bottomY);
  ctx.lineTo(geo.bottomLeftX, geo.bottomY);
  ctx.closePath();
}

function getXAtY(y: number, geo: ReturnType<typeof getCupGeometry>): { left: number; right: number } {
  const t = (y - geo.topY) / (geo.bottomY - geo.topY);
  const leftX = geo.topLeftX + t * (geo.bottomLeftX - geo.topLeftX);
  const rightX = geo.topRightX + t * (geo.bottomRightX - geo.topRightX);
  return { left: leftX, right: rightX };
}

export function renderCup(
  canvas: HTMLCanvasElement,
  layers: LayerInfo[],
  width: number,
  height: number,
  bubbles?: Bubble[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  const geo = getCupGeometry(width, height);
  const cupHeight = geo.bottomY - geo.topY;

  if (layers.length > 0) {
    ctx.save();
    buildCupPath(ctx, geo);
    ctx.clip();

    const layerHeight = cupHeight / layers.length;
    const transitionHeight = layerHeight * 0.15;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerOpacity = layer.opacity ?? 1;
      const yStart = geo.bottomY - (i + 1) * layerHeight;
      const yEnd = geo.bottomY - i * layerHeight;

      const gradient = ctx.createLinearGradient(0, yStart, 0, yEnd);
      gradient.addColorStop(0, hexWithOpacity(layer.color, layerOpacity));
      if (i < layers.length - 1) {
        gradient.addColorStop(
          Math.min(1, transitionHeight / layerHeight),
          hexWithOpacity(layer.color, layerOpacity)
        );
        const nextLayer = layers[i + 1];
        const nextOpacity = nextLayer.opacity ?? 1;
        gradient.addColorStop(1, hexWithOpacity(nextLayer.color, nextOpacity));
      } else {
        gradient.addColorStop(1, hexWithOpacity(layer.color, layerOpacity));
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(geo.bottomLeftX - 10, yStart, geo.topRightX - geo.bottomLeftX + 20, layerHeight + 1);
    }

    if (bubbles && bubbles.length > 0) {
      const bounds: CupBounds = {
        left: geo.bottomLeftX,
        right: geo.bottomRightX,
        top: geo.topY,
        bottom: geo.bottomY,
      };
      renderBubbles(ctx, bubbles, bounds);
    }

    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  buildCupPath(ctx, geo);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  buildCupPath(ctx, geo);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

function hexWithOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function renderBubbles(
  ctx: CanvasRenderingContext2D,
  bubbles: Bubble[],
  cupBounds: CupBounds
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(cupBounds.left, cupBounds.top, cupBounds.right - cupBounds.left, cupBounds.bottom - cupBounds.top);
  ctx.clip();

  for (const bubble of bubbles) {
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`;
    ctx.fill();
  }

  ctx.restore();
}

export function createBubbles(count: number, cupBounds: CupBounds): Bubble[] {
  const bubbles: Bubble[] = [];
  const { left, right, top, bottom } = cupBounds;
  const width = right - left;

  for (let i = 0; i < count; i++) {
    bubbles.push({
      x: left + Math.random() * width,
      y: top + Math.random() * (bottom - top),
      radius: 1 + Math.random() * 2,
      speed: 1 + Math.random() * 2,
      opacity: 0.6,
    });
  }

  return bubbles;
}

export function updateBubbles(bubbles: Bubble[], cupBounds: CupBounds): Bubble[] {
  const { left, right, top, bottom } = cupBounds;
  const width = right - left;

  return bubbles.map((bubble) => {
    const newY = bubble.y - bubble.speed;
    if (newY < top) {
      return {
        ...bubble,
        x: left + Math.random() * width,
        y: bottom,
      };
    }
    return {
      ...bubble,
      y: newY,
    };
  });
}

export function generateCupThumbnail(layers: LayerInfo[]): string {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 180;
  renderCup(canvas, layers, 120, 180);
  return canvas.toDataURL();
}
