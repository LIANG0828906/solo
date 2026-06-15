/// <reference lib="webworker" />
import type {
  CanvasElement,
  PresetElement,
  ThumbnailWorkerMessage,
  ThumbnailWorkerResponse,
} from '@/types';

const ctx: Worker = self as unknown as Worker;

function buildThumbnailSvg(
  el: CanvasElement,
  preset: PresetElement,
  size: number
): string {
  const w = el.width;
  const h = el.height;
  const maxDim = Math.max(w, h);
  const scale = size / maxDim;
  const scaledW = w * scale;
  const scaledH = h * scale;
  const offsetX = (size - scaledW) / 2;
  const offsetY = (size - scaledH) / 2;
  const glitchVar = el.glitchIntensity / 100;

  let inner = '';
  if (glitchVar > 0) {
    inner += `<g transform="translate(${glitchVar * 1.5} ${-glitchVar * 0.5})" opacity="${glitchVar * 0.5}" style="color:#ff2d95;">${preset.svgContent}</g>`;
    inner += `<g transform="translate(${-glitchVar * 1.5} ${glitchVar * 0.5})" opacity="${glitchVar * 0.5}" style="color:#00f0ff;">${preset.svgContent}</g>`;
  }
  inner += `<g style="color:${el.color};">${preset.svgContent}</g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="100%" height="100%" rx="6" fill="rgba(20,20,30,0.9)"/>
    <g transform="translate(${offsetX} ${offsetY}) scale(${scale})" transform-origin="0 0" filter="drop-shadow(0 0 2px ${el.color}66)">
      <svg x="0" y="0" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="none">
        ${inner}
      </svg>
    </g>
  </svg>`;
}

ctx.addEventListener('message', (e: MessageEvent<ThumbnailWorkerMessage>) => {
  const msg = e.data;
  if (msg.type === 'generate') {
    const size = msg.size || 40;
    const results: Record<string, string> = {};
    msg.elements.forEach(({ id, element, preset }) => {
      const svg = buildThumbnailSvg(element, preset, size);
      const encoded =
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      results[id] = encoded;
    });
    const resp: ThumbnailWorkerResponse = { type: 'done', thumbnails: results };
    ctx.postMessage(resp);
  }
});
