import type { VectorPath, BezierNode } from '../types';

export function exportToSVG(paths: VectorPath[], width: number, height: number): string {
  const svgPaths: string[] = [];

  for (const path of paths) {
    const d = generatePathD(path);
    const color = path.color.replace(/rgba?\(([^)]+)\)/, (_, content) => {
      const parts = content.split(',').map((s: string) => s.trim());
      if (parts.length === 4) {
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${Math.max(0.8, parseFloat(parts[3]))})`;
      }
      return path.color;
    });
    svgPaths.push(`  <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${svgPaths.join('\n')}
</svg>`;
}

function generatePathD(path: VectorPath): string {
  const { nodes, isClosed } = path;
  if (nodes.length === 0) return '';

  const parts: string[] = [];
  parts.push(`M ${nodes[0].x.toFixed(2)} ${nodes[0].y.toFixed(2)}`);

  const n = nodes.length;
  const maxIndex = isClosed ? n : n - 1;

  for (let i = 0; i < maxIndex; i++) {
    const p0 = nodes[i];
    const p3 = nodes[(i + 1) % n];
    const p1 = p0.controlOut || p0;
    const p2 = p3.controlIn || p3;
    parts.push(`C ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}, ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`);
  }

  if (isClosed) {
    parts.push('Z');
  }

  return parts.join(' ');
}

export function downloadSVG(svgContent: string, filename: string = 'vector-paths.svg'): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateSelectedNodeSVG(node: BezierNode): string {
  return `
    <circle cx="${node.x}" cy="${node.y}" r="6" fill="#e74c3c" stroke="#fff" stroke-width="2"/>
    ${node.controlOut ? `<circle cx="${node.controlOut.x}" cy="${node.controlOut.y}" r="3" fill="#f39c12"/>` : ''}
    ${node.controlIn ? `<circle cx="${node.controlIn.x}" cy="${node.controlIn.y}" r="3" fill="#f39c12"/>` : ''}
    ${node.controlOut ? `<line x1="${node.x}" y1="${node.y}" x2="${node.controlOut.x}" y2="${node.controlOut.y}" stroke="#f39c12" stroke-width="1" stroke-dasharray="2,2"/>` : ''}
  `;
}
