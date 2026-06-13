import { saveAs } from 'file-saver';
import type { MosaicCell, GridType } from '../generator';

function generateCellPath(cell: MosaicCell): string {
  const { x, y, width, height, shape, rotation, scale } = cell;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const w = width * scale;
  const h = height * scale;

  if (shape === 'square') {
    const rx = cx - w / 2;
    const ry = cy - h / 2;
    const radius = Math.min(2, w * 0.1);
    return `M ${rx + radius} ${ry}
            L ${rx + w - radius} ${ry}
            Q ${rx + w} ${ry} ${rx + w} ${ry + radius}
            L ${rx + w} ${ry + h - radius}
            Q ${rx + w} ${ry + h} ${rx + w - radius} ${ry + h}
            L ${rx + radius} ${ry + h}
            Q ${rx} ${ry + h} ${rx} ${ry + h - radius}
            L ${rx} ${ry + radius}
            Q ${rx} ${ry} ${rx + radius} ${ry} Z`;
  }

  if (shape === 'hexagon') {
    const hw = w / 2;
    const hh = h / 2;
    const points = [
      { x: cx + hw * 0.5, y: cy - hh },
      { x: cx + hw, y: cy },
      { x: cx + hw * 0.5, y: cy + hh },
      { x: cx - hw * 0.5, y: cy + hh },
      { x: cx - hw, y: cy },
      { x: cx - hw * 0.5, y: cy - hh },
    ];
    return (
      'M ' + points.map((p) => `${p.x} ${p.y}`).join(' L ') + ' Z'
    );
  }

  if (shape === 'triangle') {
    const hw = w / 2;
    const hh = h / 2;
    const points = [
      { x: cx, y: cy - hh },
      { x: cx + hw, y: cy + hh },
      { x: cx - hw, y: cy + hh },
    ];
    return (
      'M ' + points.map((p) => `${p.x} ${p.y}`).join(' L ') + ' Z'
    );
  }

  return '';
}

export function generateSVG(cells: MosaicCell[], width: number, height: number): string {
  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
    </linearGradient>
    <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="blur"/>
      <feOffset dx="0" dy="0" result="offsetBlur"/>
      <feComposite in="SourceGraphic" in2="offsetBlur" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/>
      <feFlood flood-color="#000000" flood-opacity="0.3" result="shadowColor"/>
      <feComposite in="shadowColor" in2="shadowDiff" operator="in" result="shadow"/>
      <feComposite in="shadow" in2="SourceGraphic" operator="over"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  <g filter="url(#innerShadow)">
    ${cells
      .map(
        (cell) =>
          `<path d="${generateCellPath(cell)}" fill="${cell.color}" />`
      )
      .join('\n    ')}
  </g>
</svg>`;

  return svgContent;
}

export function exportSVG(cells: MosaicCell[], width: number, height: number): void {
  const svgString = generateSVG(cells, width, height);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, `neon-mosaic-${Date.now()}.svg`);
}

export async function exportPNG(
  cells: MosaicCell[],
  width: number,
  height: number,
  exportWidth: number = 1920,
  exportHeight: number = 1080
): Promise<void> {
  const scaleX = exportWidth / width;
  const scaleY = exportHeight / height;
  const scale = Math.min(scaleX, scaleY);

  const canvas = document.createElement('canvas');
  canvas.width = exportWidth;
  canvas.height = exportHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, exportHeight);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, exportWidth, exportHeight);

  const offsetX = (exportWidth - width * scale) / 2;
  const offsetY = (exportHeight - height * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  for (const cell of cells) {
    const path = new Path2D(generateCellPath(cell));
    ctx.fillStyle = cell.color;
    ctx.fill(path);

    ctx.save();
    ctx.clip(path);
    const innerGradient = ctx.createLinearGradient(
      cell.x,
      cell.y,
      cell.x + cell.width,
      cell.y + cell.height
    );
    innerGradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    innerGradient.addColorStop(0.5, 'rgba(255,255,255,0)');
    innerGradient.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = innerGradient;
    ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
    ctx.restore();
  }

  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `neon-mosaic-${Date.now()}.png`);
      }
      resolve();
    }, 'image/png');
  });
}

export const ExportManager = {
  generateSVG,
  exportSVG,
  exportPNG,
};

export default ExportManager;
