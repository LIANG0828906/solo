import type { Shape, ColorItem, CanvasSize } from '@/types';
import { SHAPE_STROKE_COLORS, SHAPE_OPACITY, STROKE_WIDTH } from '@/types';

function getStrokeColor(index: number): string {
  return SHAPE_STROKE_COLORS[index % SHAPE_STROKE_COLORS.length];
}

function shapeToSvg(shape: Shape, colors: ColorItem[]): string {
  const color = colors[shape.colorIndex]?.color || '#ffffff';
  const strokeColor = getStrokeColor(shape.colorIndex);
  const { x, y, size } = shape;
  const halfSize = size / 2;

  switch (shape.type) {
    case 'circle':
      return `<circle cx="${x}" cy="${y}" r="${halfSize}" fill="${color}" fill-opacity="${SHAPE_OPACITY}" stroke="${strokeColor}" stroke-width="${STROKE_WIDTH}" />`;

    case 'triangle': {
      const height = (size * Math.sqrt(3)) / 2;
      const topY = y - height / 2;
      const bottomY = y + height / 2;
      const leftX = x - halfSize;
      const rightX = x + halfSize;
      const points = `${x},${topY} ${leftX},${bottomY} ${rightX},${bottomY}`;
      return `<polygon points="${points}" fill="${color}" fill-opacity="${SHAPE_OPACITY}" stroke="${strokeColor}" stroke-width="${STROKE_WIDTH}" />`;
    }

    case 'diamond': {
      const points = `${x},${y - halfSize} ${x + halfSize},${y} ${x},${y + halfSize} ${x - halfSize},${y}`;
      return `<polygon points="${points}" fill="${color}" fill-opacity="${SHAPE_OPACITY}" stroke="${strokeColor}" stroke-width="${STROKE_WIDTH}" />`;
    }

    default:
      return '';
  }
}

export function generateSvgString(
  colors: ColorItem[],
  shapes: Shape[],
  canvasSize: CanvasSize
): string {
  const { width, height } = canvasSize;
  const stripeHeight = height / colors.length;

  let stripesSvg = '';
  colors.forEach((colorItem, index) => {
    const y = index * stripeHeight;
    stripesSvg += `<rect x="0" y="${y}" width="${width}" height="${stripeHeight}" fill="${colorItem.color}" />`;
  });

  let shapesSvg = '';
  shapes.forEach((shape) => {
    shapesSvg += shapeToSvg(shape, colors);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g id="stripes">
    ${stripesSvg}
  </g>
  <g id="shapes">
    ${shapesSvg}
  </g>
</svg>`;
}
