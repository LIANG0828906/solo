import { PatternParams, SymmetryType, BaseShape } from '@/types/pattern';
import { generateColorPalette } from './colorSchemes';

interface DrawShapeOptions {
  cx: number;
  cy: number;
  size: number;
  color: string;
  rotation: number;
}

function drawShape(
  shape: BaseShape,
  { cx, cy, size, color, rotation }: DrawShapeOptions
): string {
  const transform = `translate(${cx}, ${cy}) rotate(${rotation})`;

  switch (shape) {
    case 'circle':
      return `<circle cx="0" cy="0" r="${size}" fill="${color}" transform="${transform}" />`;

    case 'triangle': {
      const h = size * Math.sqrt(3) / 2;
      const points = `0,${-size * 2 / 3} ${-size / 2},${h - size * 2 / 3} ${size / 2},${h - size * 2 / 3}`;
      return `<polygon points="${points}" fill="${color}" transform="${transform}" />`;
    }

    case 'hexagon': {
      const points: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        points.push(`${Math.cos(angle) * size},${Math.sin(angle) * size}`);
      }
      return `<polygon points="${points.join(' ')}" fill="${color}" transform="${transform}" />`;
    }

    case 'spiral': {
      let path = '';
      const turns = 3;
      const steps = 60;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = t * turns * Math.PI * 2 + rotation * Math.PI / 180;
        const r = t * size;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        path += i === 0 ? `M${x},${y}` : `L${x},${y}`;
      }
      return `<path d="${path}" stroke="${color}" stroke-width="3" fill="none" transform="translate(${cx}, ${cy})" />`;
    }

    default:
      return '';
  }
}

function applySymmetry(
  shapes: string[],
  symmetryType: SymmetryType,
  complexity: number,
  centerX: number,
  centerY: number,
  size: number
): string[] {
  const result: string[] = [...shapes];

  switch (symmetryType) {
    case 'rotation': {
      const count = complexity + 3;
      const angleStep = 360 / count;
      const allShapes: string[] = [];

      for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const dist = size * 0.3;
        const x = centerX + Math.cos((angle - 90) * Math.PI / 180) * dist;
        const y = centerY + Math.sin((angle - 90) * Math.PI / 180) * dist;

        shapes.forEach((shape) => {
          allShapes.push(
            `<g transform="translate(${x - centerX}, ${y - centerY}) rotate(${angle}, ${centerX}, ${centerY})">${shape}</g>`
          );
        });
      }
      return allShapes;
    }

    case 'reflection': {
      const allShapes: string[] = [...shapes];
      shapes.forEach((shape) => {
        allShapes.push(`<g transform="scale(-1, 1) translate(${-centerX * 2}, 0)">${shape}</g>`);
      });

      const horizontal: string[] = [...allShapes];
      horizontal.forEach((shape) => {
        allShapes.push(`<g transform="scale(1, -1) translate(0, ${-centerY * 2})">${shape}</g>`);
      });
      return allShapes;
    }

    case 'translation': {
      const count = Math.floor(complexity / 2) + 2;
      const allShapes: string[] = [];
      const spacing = (size * 2) / count;

      for (let row = -count; row <= count; row++) {
        for (let col = -count; col <= count; col++) {
          const offsetX = col * spacing + (row % 2 === 0 ? 0 : spacing / 2);
          const offsetY = row * spacing * 0.866;
          shapes.forEach((shape) => {
            allShapes.push(
              `<g transform="translate(${offsetX}, ${offsetY})">${shape}</g>`
            );
          });
        }
      }
      return allShapes;
    }

    default:
      return result;
  }
}

export function generateSVG(params: PatternParams, width: number, height: number): string {
  const { symmetryType, baseShape, colorScheme, complexity, baseColors, backgroundColor } = params;

  const centerX = width / 2;
  const centerY = height / 2;
  const size = Math.min(width, height) * 0.4;

  const palette = generateColorPalette(baseColors, colorScheme, Math.max(complexity * 2, 5));

  const shapes: string[] = [];
  const layers = Math.min(complexity, 15);

  for (let i = 0; i < layers; i++) {
    const t = i / Math.max(layers - 1, 1);
    const shapeSize = size * (1 - t * 0.7);
    const color = palette[i % palette.length];
    const rotation = t * 180;

    const shapeSvg = drawShape(baseShape, {
      cx: centerX,
      cy: centerY,
      size: Math.max(shapeSize, 5),
      color,
      rotation,
    });

    shapes.push(shapeSvg);
  }

  const symmetricShapes = applySymmetry(shapes, symmetryType, complexity, centerX, centerY, size);

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${backgroundColor}" />
      <g transform="translate(${centerX}, ${centerY})">
        ${symmetricShapes.map(s => `<g transform="translate(${-centerX}, ${-centerY})">${s}</g>`).join('\n')}
      </g>
    </svg>
  `.trim();

  return svgContent;
}

export function downloadSVG(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPNG(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        resolve();
      } else {
        reject(new Error('Failed to generate PNG blob'));
      }
    }, 'image/png');
  });
}

export function generateThumbnailBase64(canvas: HTMLCanvasElement, size: number = 200): string {
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = size;
  thumbCanvas.height = size;
  const ctx = thumbCanvas.getContext('2d');

  if (ctx) {
    const scale = Math.min(size / canvas.width, size / canvas.height);
    const x = (size - canvas.width * scale) / 2;
    const y = (size - canvas.height * scale) / 2;
    ctx.drawImage(canvas, x, y, canvas.width * scale, canvas.height * scale);
    return thumbCanvas.toDataURL('image/png').split(',')[1];
  }

  return '';
}
