import type { ShapeType, LayerTransform } from '../types';

export function createRectPath(x: number, y: number, w: number, h: number): string {
  return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
}

export function createCirclePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

export function createTrianglePath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  return `M ${cx} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
}

export function createStarPath(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x} ${y}`);
  }
  return `M ${points.join(' L ')} Z`;
}

export function createShapeFromDrag(
  type: ShapeType,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { pathData: string; transform: Omit<LayerTransform, 'rotation' | 'opacity' | 'blur'> } {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX) || 50;
  const height = Math.abs(endY - startY) || 50;

  let pathData = '';
  const cx = x + width / 2;
  const cy = y + height / 2;

  switch (type) {
    case 'rect':
      pathData = createRectPath(0, 0, width, height);
      break;
    case 'circle':
      const r = Math.min(width, height) / 2;
      pathData = createCirclePath(width / 2, height / 2, r);
      break;
    case 'triangle':
      pathData = createTrianglePath(0, 0, width, height);
      break;
    case 'star':
      const outerR = Math.min(width, height) / 2;
      const innerR = outerR * 0.4;
      pathData = createStarPath(width / 2, height / 2, outerR, innerR);
      break;
  }

  return {
    pathData,
    transform: { x, y, width, height }
  };
}

export function getShapeIcon(type: ShapeType): string {
  switch (type) {
    case 'rect': return 'crop_square';
    case 'circle': return 'radio_button_unchecked';
    case 'triangle': return 'change_history';
    case 'star': return 'star';
  }
}

export function getShapeColor(type: ShapeType): string {
  switch (type) {
    case 'rect': return '#FF5722';
    case 'circle': return '#4CAF50';
    case 'triangle': return '#2196F3';
    case 'star': return '#FFC107';
  }
}
