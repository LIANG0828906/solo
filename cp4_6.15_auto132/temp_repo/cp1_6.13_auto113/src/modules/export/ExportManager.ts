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
  exportHeight: number = 1080,
  aaScale: number = 4
): Promise<void> {
  const targetRatio = exportWidth / exportHeight;
  const canvasRatio = width / height;
  let renderW: number, renderH: number;

  if (canvasRatio > targetRatio) {
    renderW = exportWidth;
    renderH = exportWidth / canvasRatio;
  } else {
    renderH = exportHeight;
    renderW = exportHeight * canvasRatio;
  }

  const ssaaScale = aaScale;
  const ssaaWidth = Math.floor(renderW * ssaaScale);
  const ssaaHeight = Math.floor(renderH * ssaaScale);

  const offscreen = document.createElement('canvas');
  offscreen.width = ssaaWidth;
  offscreen.height = ssaaHeight;
  const offCtx = offscreen.getContext('2d');
  if (!offCtx) return;

  offCtx.imageSmoothingEnabled = true;
  offCtx.imageSmoothingQuality = 'high';

  const contentScale = Math.min(ssaaWidth / width, ssaaHeight / height);
  const offsetX = (ssaaWidth - width * contentScale) / 2;
  const offsetY = (ssaaHeight - height * contentScale) / 2;

  const bgGradient = offCtx.createLinearGradient(0, 0, 0, ssaaHeight);
  bgGradient.addColorStop(0, '#1a1a2e');
  bgGradient.addColorStop(1, '#16213e');
  offCtx.fillStyle = bgGradient;
  offCtx.fillRect(0, 0, ssaaWidth, ssaaHeight);

  offCtx.save();
  offCtx.translate(offsetX, offsetY);
  offCtx.scale(contentScale, contentScale);

  for (const cell of cells) {
    const path = new Path2D(generateCellPath(cell));
    offCtx.fillStyle = cell.color;
    offCtx.fill(path);

    offCtx.save();
    offCtx.clip(path);
    const innerGradient = offCtx.createLinearGradient(
      cell.x,
      cell.y,
      cell.x + cell.width,
      cell.y + cell.height
    );
    innerGradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    innerGradient.addColorStop(0.5, 'rgba(255,255,255,0)');
    innerGradient.addColorStop(1, 'rgba(0,0,0,0.25)');
    offCtx.fillStyle = innerGradient;
    offCtx.fillRect(cell.x, cell.y, cell.width, cell.height);
    offCtx.restore();

    offCtx.save();
    offCtx.clip(path);
    const innerShadow = offCtx.createRadialGradient(
      cell.x + cell.width / 2,
      cell.y + cell.height / 2,
      cell.width * 0.1,
      cell.x + cell.width / 2,
      cell.y + cell.height / 2,
      Math.max(cell.width, cell.height) * 0.7
    );
    innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
    innerShadow.addColorStop(1, 'rgba(0,0,0,0.2)');
    offCtx.fillStyle = innerShadow;
    offCtx.fillRect(cell.x - 2, cell.y - 2, cell.width + 4, cell.height + 4);
    offCtx.restore();
  }

  offCtx.restore();

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = exportWidth;
  outputCanvas.height = exportHeight;
  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) return;

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  const finalBg = outCtx.createLinearGradient(0, 0, 0, exportHeight);
  finalBg.addColorStop(0, '#1a1a2e');
  finalBg.addColorStop(1, '#16213e');
  outCtx.fillStyle = finalBg;
  outCtx.fillRect(0, 0, exportWidth, exportHeight);

  const drawX = (exportWidth - renderW) / 2;
  const drawY = (exportHeight - renderH) / 2;
  outCtx.drawImage(offscreen, drawX, drawY, renderW, renderH);

  return new Promise((resolve) => {
    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          saveAs(blob, `neon-mosaic-${Date.now()}.png`);
        }
        resolve();
      },
      'image/png',
      1.0
    );
  });
}

export const ExportManager = {
  generateSVG,
  exportSVG,
  exportPNG,
};

export default ExportManager;
