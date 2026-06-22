import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'rect' | 'circle' | 'triangle';

export interface LayerElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  alpha: number;
  rotation: number;
}

export interface Layer {
  id: string;
  name: string;
  colorLabel: string;
  visible: boolean;
  elements: LayerElement[];
  elementCount: number;
  averageColor: string;
}

const LAYER_NAME_PREFIXES = [
  '背景', '主色调', '光影', '纹理', '描边', '阴影', '高光', '装饰',
  '主体', '细节', '氛围', '前景', '图案', '渐变', '轮廓', '叠加',
];

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E',
];

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomRange(min, max + 1));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1)}`;
}

export function computeAverageColor(colors: string[]): string {
  if (colors.length === 0) return '#6B7280';
  let totalR = 0, totalG = 0, totalB = 0, count = 0;
  for (const c of colors) {
    const rgb = hexToRgb(c);
    if (rgb) {
      totalR += rgb.r;
      totalG += rgb.g;
      totalB += rgb.b;
      count++;
    }
  }
  if (count === 0) return '#6B7280';
  return rgbToHex(totalR / count, totalG / count, totalB / count);
}

function randomElement(baseColor: string, canvasW = 1600, canvasH = 900): LayerElement {
  const types: ElementType[] = ['rect', 'circle', 'triangle'];
  const type = types[randomInt(0, types.length - 1)];
  const w = randomRange(canvasW * 0.06, canvasW * 0.28);
  const h = randomRange(canvasH * 0.08, canvasH * 0.32);
  return {
    id: uuidv4(),
    type,
    x: randomRange(-w * 0.1, canvasW - w * 0.9),
    y: randomRange(-h * 0.1, canvasH - h * 0.9),
    width: w,
    height: h,
    color: baseColor,
    alpha: randomRange(0.25, 0.7),
    rotation: randomRange(-30, 30),
  };
}

function generateLayer(index: number, totalLayers: number): Layer {
  const nameIndex = index % LAYER_NAME_PREFIXES.length;
  const suffix = Math.floor(index / LAYER_NAME_PREFIXES.length);
  const name = suffix > 0
    ? `${LAYER_NAME_PREFIXES[nameIndex]} ${suffix + 1}`
    : LAYER_NAME_PREFIXES[nameIndex];
  const colorLabel = PRESET_COLORS[randomInt(0, PRESET_COLORS.length - 1)];
  const elementCount = randomInt(2, 6);
  const elements: LayerElement[] = [];
  const colorsUsed: string[] = [];
  for (let i = 0; i < elementCount; i++) {
    const baseColor = PRESET_COLORS[randomInt(0, PRESET_COLORS.length - 1)];
    elements.push(randomElement(baseColor));
    colorsUsed.push(baseColor);
  }
  return {
    id: uuidv4(),
    name,
    colorLabel,
    visible: true,
    elements,
    elementCount,
    averageColor: computeAverageColor(colorsUsed),
  };
}

export function generateRandomLayers(count?: number): Layer[] {
  const layerCount = count ?? randomInt(8, 12);
  const layers: Layer[] = [];
  for (let i = 0; i < layerCount; i++) {
    layers.push(generateLayer(i, layerCount));
  }
  return layers;
}

export function deepCloneLayers(layers: Layer[]): Layer[] {
  return layers.map(layer => ({
    ...layer,
    elements: layer.elements.map(el => ({ ...el })),
  }));
}

export function drawElement(
  ctx: CanvasRenderingContext2D,
  element: LayerElement,
): void {
  ctx.save();
  const cx = element.x + element.width / 2;
  const cy = element.y + element.height / 2;
  ctx.translate(cx, cy);
  ctx.rotate((element.rotation * Math.PI) / 180);
  ctx.globalAlpha = element.alpha;
  ctx.fillStyle = element.color;
  ctx.beginPath();
  switch (element.type) {
    case 'rect':
      ctx.roundRect(-element.width / 2, -element.height / 2, element.width, element.height, 12);
      break;
    case 'circle':
      ctx.ellipse(0, 0, element.width / 2, element.height / 2, 0, 0, Math.PI * 2);
      break;
    case 'triangle': {
      const hw = element.width / 2;
      const hh = element.height / 2;
      ctx.moveTo(0, -hh);
      ctx.lineTo(hw, hh);
      ctx.lineTo(-hw, hh);
      ctx.closePath();
      break;
    }
  }
  ctx.fill();
  ctx.restore();
}

export function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
): void {
  if (!layer.visible || layer.elements.length === 0) return;
  for (const el of layer.elements) {
    drawElement(ctx, el);
  }
}

export function drawAllLayers(
  ctx: CanvasRenderingContext2D,
  layers: Layer[],
  width: number,
  height: number,
  allVisible = false,
): void {
  ctx.clearRect(0, 0, width, height);
  for (const layer of layers) {
    if (allVisible || layer.visible) {
      drawLayer(ctx, layer);
    }
  }
}
