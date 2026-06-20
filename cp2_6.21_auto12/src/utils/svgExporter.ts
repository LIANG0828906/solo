// ============================================================
// svgExporter.ts - SVG导出工具模块
// 调用关系:
//   Toolbar.tsx (导出按钮) → exportIllustration(layers, palette)
//   → buildSvgDocument(layers, palette) → 构造<svg> XML字符串
//     → autoViewBox(layers) → 调用 CanvasRenderer.getLayerBounds
//     → layerToSvgElement(layer, palette) → 调用 SHAPE_PATHS (CanvasRenderer)
//   → triggerDownload(svgString, filename) → Blob + URL + <a download>
//   数据流向: Store.layers + Store.palette → 完整SVG DOM → 浏览器下载
// ============================================================
import type { Layer, BlendMode, ShapeType } from '@/shared/store';
import { SHAPE_PATHS, getLayerBounds } from '@/components/CanvasRenderer';

export const SHAPE_SVG_PATHS: Record<ShapeType, string> = SHAPE_PATHS;

export function getLayerColor(layer: Layer, palette: string[]): string {
  if (layer.colorIndex >= 0 && layer.colorIndex < palette.length) {
    return palette[layer.colorIndex];
  }
  return layer.customColor || '#000000';
}

export function blendModeToCss(mode: BlendMode): string {
  const map: Record<BlendMode, string> = {
    normal: 'normal',
    multiply: 'multiply',
    screen: 'screen',
    overlay: 'overlay'
  };
  return map[mode];
}

export function autoViewBox(layers: Layer[]): string {
  if (layers.length === 0) {
    return '0 0 800 600';
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const layer of layers) {
    const b = getLayerBounds(layer);
    if (b.x < minX) minX = b.x;
    if (b.y < minY) minY = b.y;
    if (b.x + b.w > maxX) maxX = b.x + b.w;
    if (b.y + b.h > maxY) maxY = b.y + b.h;
  }

  const pad = 10;
  minX = Math.floor(minX - pad);
  minY = Math.floor(minY - pad);
  maxX = Math.ceil(maxX + pad);
  maxY = Math.ceil(maxY + pad);
  const w = maxX - minX;
  const h = maxY - minY;

  return `${minX} ${minY} ${w} ${h}`;
}

export function layerToSvgElement(layer: Layer, palette: string[]): string {
  const d = SHAPE_SVG_PATHS[layer.type];
  const color = getLayerColor(layer, palette);
  const opacity = (layer.opacity / 100).toFixed(2);
  const blend = blendModeToCss(layer.blendMode);
  const s = layer.scale / 100;
  const r = layer.rotation;
  const transform = `translate(${layer.x} ${layer.y}) rotate(${r}) scale(${s}) translate(-50 -50)`;

  return `<g transform="${transform}" style="opacity:${opacity};mix-blend-mode:${blend}"><path d="${d}" fill="${color}" fill-rule="evenodd"/></g>`;
}

export function buildSvgDocument(layers: Layer[], palette: string[]): string {
  const viewBox = autoViewBox(layers);
  const layersSvg = layers.map(layer => layerToSvgElement(layer, palette)).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%">
  ${layersSvg}
</svg>`;
}

export function triggerDownload(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportIllustration(layers: Layer[], palette: string[]): void {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const filename = `illustration_${y}${mo}${d}_${h}${mi}${ss}.svg`;
  const svg = buildSvgDocument(layers, palette);
  triggerDownload(svg, filename);
}
