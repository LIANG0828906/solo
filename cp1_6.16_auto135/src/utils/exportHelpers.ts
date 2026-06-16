import { saveAs } from 'file-saver';
import { GeneticElement, Connection, ELEMENT_SIZE } from '@/models/GeneticElement';

const getShapeSvg = (element: GeneticElement): string => {
  const { x, y } = element.position;
  const w = ELEMENT_SIZE.width;
  const h = ELEMENT_SIZE.height;
  const cx = x + w / 2;
  const cy = y + h / 2;

  switch (element.shape) {
    case 'rectangle':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${element.color}" stroke="#fff" stroke-width="1"/>`;
    case 'diamond':
      return `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" fill="${element.color}" stroke="#fff" stroke-width="1"/>`;
    case 'triangle':
      return `<polygon points="${cx},${y} ${x + w},${y + h} ${x},${y + h}" fill="${element.color}" stroke="#fff" stroke-width="1"/>`;
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) / 2}" fill="${element.color}" stroke="#fff" stroke-width="1"/>`;
    case 'hexagon':
      const r = Math.min(w, h) / 2;
      const hexPoints = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      return `<polygon points="${hexPoints}" fill="${element.color}" stroke="#fff" stroke-width="1"/>`;
    default:
      return '';
  }
};

const getLabelSvg = (element: GeneticElement): string => {
  const { x, y } = element.position;
  const w = ELEMENT_SIZE.width;
  const h = ELEMENT_SIZE.height;
  return `<text x="${x + w / 2}" y="${y + h + 14}" text-anchor="middle" fill="#333" font-size="12" font-family="Roboto, sans-serif">${element.label}</text>`;
};

const getConnectionPath = (from: GeneticElement, to: GeneticElement, color: string): string => {
  const fx = from.position.x + ELEMENT_SIZE.width / 2;
  const fy = from.position.y + ELEMENT_SIZE.height / 2;
  const tx = to.position.x + ELEMENT_SIZE.width / 2;
  const ty = to.position.y + ELEMENT_SIZE.height / 2;

  const dx = tx - fx;
  const dy = ty - fy;
  const cx1 = fx + dx * 0.5;
  const cy1 = fy;
  const cx2 = fx + dx * 0.5;
  const cy2 = ty;

  const pathId = `arrow-${from.id}-${to.id}`;
  const angle = Math.atan2(ty - cy2, tx - cx2);
  const arrowSize = 8;
  const ax1 = tx - arrowSize * Math.cos(angle - Math.PI / 6);
  const ay1 = ty - arrowSize * Math.sin(angle - Math.PI / 6);
  const ax2 = tx - arrowSize * Math.cos(angle + Math.PI / 6);
  const ay2 = ty - arrowSize * Math.sin(angle + Math.PI / 6);

  return `
    <path d="M ${fx} ${fy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}"
          fill="none" stroke="${color}" stroke-width="2" marker-end="url(#${pathId})"/>
    <defs>
      <marker id="${pathId}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, ${arrowSize} 3, 0 6" fill="${color}"/>
      </marker>
    </defs>
    <polygon points="${tx},${ty} ${ax1},${ay1} ${ax2},${ay2}" fill="${color}"/>
  `;
};

export const generateSvg = (elements: GeneticElement[], connections: Connection[]): string => {
  let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
  elements.forEach((el) => {
    minX = Math.min(minX, el.position.x);
    minY = Math.min(minY, el.position.y);
    maxX = Math.max(maxX, el.position.x + ELEMENT_SIZE.width);
    maxY = Math.max(maxY, el.position.y + ELEMENT_SIZE.height + 20);
  });
  if (elements.length === 0) {
    minX = 0; minY = 0; maxX = 800; maxY = 600;
  }
  const padding = 50;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  const shiftedElements = elements.map((el) => ({
    ...el,
    position: { x: el.position.x + offsetX, y: el.position.y + offsetY }
  }));

  const connectionsSvg = connections.map((conn) => {
    const from = shiftedElements.find((el) => el.id === conn.fromId);
    const to = shiftedElements.find((el) => el.id === conn.toId);
    if (!from || !to) return '';
    return getConnectionPath(from, to, conn.color);
  }).join('\n');

  const shapesSvg = shiftedElements.map(getShapeSvg).join('\n');
  const labelsSvg = shiftedElements.map(getLabelSvg).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#FFF8E1"/>
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E0E0E0" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  ${connectionsSvg}
  ${shapesSvg}
  ${labelsSvg}
</svg>`;
};

export const exportSvg = (elements: GeneticElement[], connections: Connection[]) => {
  const svgString = generateSvg(elements, connections);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  saveAs(blob, `gene-network-${timestamp}.svg`);
};

export const exportGif = async (canvasElement: HTMLCanvasElement | null) => {
  if (!canvasElement) {
    alert('Canvas 未找到');
    return;
  }
  try {
    const { default: GIF } = await import('gif.js');
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: canvasElement.width,
      height: canvasElement.height,
      workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
    });

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    const frames = 36;
    for (let i = 0; i < frames; i++) {
      const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvasElement.width;
      tempCanvas.height = canvasElement.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(imageData, 0, 0);
        gif.addFrame(tempCanvas, { delay: 1000 / 12, copy: true });
      }
      await new Promise((resolve) => setTimeout(resolve, 16));
    }

    gif.on('finished', (blob: Blob) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      saveAs(blob, `gene-simulation-${timestamp}.gif`);
    });

    gif.render();
  } catch (error) {
    console.error('GIF 导出失败:', error);
    alert('GIF 导出失败，请检查控制台获取详情');
  }
};
