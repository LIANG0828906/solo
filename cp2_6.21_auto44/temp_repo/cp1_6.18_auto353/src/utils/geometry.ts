export type BrushType = 'dot' | 'petal' | 'star' | 'wave';

export interface Point {
  x: number;
  y: number;
}

export interface PathData {
  id: string;
  points: Point[];
  brush: BrushType;
  color: string;
  startHue: number;
  endHue: number;
  opacity: number;
}

export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

export function generateSymmetricPaths(
  points: Point[],
  center: Point,
  symmetry: number
): Point[][] {
  const paths: Point[][] = [];
  const angleStep = (Math.PI * 2) / symmetry;
  for (let i = 0; i < symmetry; i++) {
    const angle = i * angleStep;
    const rotated = points.map(p => rotatePoint(p, center, angle));
    paths.push(rotated);
  }
  return paths;
}

export function hueToColor(hue: number, baseColor: string): string {
  if (baseColor.startsWith('#')) {
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2 / 255;
    const s = max === min ? 0 : (max - min) / 255 / (1 - Math.abs(2 * l - 1));
    return `hsla(${hue}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, `;
  }
  return `hsla(${hue}, 70%, 55%, `;
}

export function hslToString(hue: number, saturation: number, lightness: number, alpha: number): string {
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

export function pathToSvgString(points: Point[]): string {
  if (points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }
  return d;
}

export function buildGradientStops(pathId: string, startHue: number, endHue: number, opacity: number): string {
  const stops = [];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const hue = startHue + (endHue - startHue) * t;
    const offset = (t * 100).toFixed(1);
    stops.push(`<stop offset="${offset}%" stop-color="hsl(${hue.toFixed(1)}, 70%, 55%)" stop-opacity="${opacity}"/>`);
  }
  return `<linearGradient id="grad_${pathId}" x1="0%" y1="0%" x2="100%" y2="0%">${stops.join('')}</linearGradient>`;
}

export function exportPathsToSvg(
  paths: PathData[],
  symmetry: number,
  center: Point,
  width: number = 1600,
  height: number = 1200
): string {
  const defs: string[] = [];
  const elements: string[] = [];

  paths.forEach((path, pathIndex) => {
    const symmetric = generateSymmetricPaths(path.points, center, symmetry);
    symmetric.forEach((points, symIndex) => {
      const gid = `p_${pathIndex}_${symIndex}`;
      const gradId = `grad_${gid}`;
      const grad = buildGradientStops(gid, path.startHue, path.endHue, path.opacity);
      defs.push(grad);

      if (path.brush === 'dot') {
        const d = pathToSvgString(points);
        elements.push(`<path d="${d}" fill="none" stroke="url(#${gradId})" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
      } else if (path.brush === 'petal') {
        points.forEach((p, idx) => {
          const t = idx / Math.max(1, points.length - 1);
          const hue = path.startHue + (path.endHue - path.startHue) * t;
          const color = `hsla(${hue}, 70%, 55%, ${path.opacity})`;
          for (let k = 0; k < 3; k++) {
            const angle = (k * 120 * Math.PI) / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            elements.push(
              `<ellipse cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" rx="7" ry="3" fill="${color}" transform="rotate(${(angle * 180 / Math.PI).toFixed(1)} ${p.x.toFixed(2)} ${p.y.toFixed(2)})"/>`
            );
          }
        });
      } else if (path.brush === 'star') {
        points.forEach((p, idx) => {
          const t = idx / Math.max(1, points.length - 1);
          const hue = path.startHue + (path.endHue - path.startHue) * t;
          const color = `hsla(${hue}, 70%, 55%, ${path.opacity})`;
          let starD = '';
          const outerR = 6;
          const innerR = 3;
          for (let k = 0; k < 16; k++) {
            const r = k % 2 === 0 ? outerR : innerR;
            const a = (k * Math.PI) / 8 - Math.PI / 2;
            const x = p.x + r * Math.cos(a);
            const y = p.y + r * Math.sin(a);
            starD += (k === 0 ? 'M ' : ' L ') + x.toFixed(2) + ' ' + y.toFixed(2);
          }
          starD += ' Z';
          elements.push(`<path d="${starD}" fill="${color}"/>`);
        });
      } else if (path.brush === 'wave') {
        if (points.length >= 2) {
          let waveD = '';
          let totalLen = 0;
          const segments: { from: Point; to: Point; len: number }[] = [];
          for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i - 1].x;
            const dy = points[i].y - points[i - 1].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            segments.push({ from: points[i - 1], to: points[i], len });
            totalLen += len;
          }
          let accLen = 0;
          const amplitude = 6;
          const wavelength = 20;
          for (let si = 0; si < segments.length; si++) {
            const seg = segments[si];
            const steps = Math.max(2, Math.ceil(seg.len / 3));
            for (let i = 0; i <= steps; i++) {
              const tt = i / steps;
              const x = seg.from.x + (seg.to.x - seg.from.x) * tt;
              const y = seg.from.y + (seg.to.y - seg.from.y) * tt;
              const dx = seg.to.x - seg.from.x;
              const dy = seg.to.y - seg.from.y;
              const len = seg.len || 1;
              const nx = -dy / len;
              const ny = dx / len;
              const globalT = (accLen + tt * seg.len) / Math.max(1, totalLen);
              const phase = ((accLen + tt * seg.len) / wavelength) * Math.PI * 2;
              const offset = Math.sin(phase) * amplitude;
              const wx = x + nx * offset;
              const wy = y + ny * offset;
              waveD += (si === 0 && i === 0 ? 'M ' : ' L ') + wx.toFixed(2) + ' ' + wy.toFixed(2);
            }
            accLen += seg.len;
          }
          const gradId2 = `grad_wave_${pathIndex}_${symIndex}`;
          const g2 = buildGradientStops(`wave_${pathIndex}_${symIndex}`, path.startHue, path.endHue, path.opacity);
          defs.push(g2);
          elements.push(`<path d="${waveD}" fill="none" stroke="url(#${gradId2})" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
        }
      }
    });
  });

  const svg =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${(center.x - width / 2).toFixed(2)} ${(center.y - height / 2).toFixed(2)} ${width} ${height}">\n` +
    `<rect x="${(center.x - width / 2).toFixed(2)}" y="${(center.y - height / 2).toFixed(2)}" width="${width}" height="${height}" fill="#F5F5F5"/>\n` +
    `<defs>\n${defs.join('\n')}\n</defs>\n` +
    `<g>\n${elements.join('\n')}\n</g>\n` +
    `</svg>`;
  return svg;
}
