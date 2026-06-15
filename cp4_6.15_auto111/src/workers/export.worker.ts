/// <reference lib="webworker" />
import type {
  CanvasElement,
  ExportWorkerMessage,
  ExportWorkerResponse,
  PresetElement,
} from '@/types';
import { buildFullSvg, svgToBlob } from '@/utils/svgSerializer';

const ctx: Worker = self as unknown as Worker;

function buildElementInlineSvg(
  el: CanvasElement,
  preset: PresetElement
): string {
  const cx = el.width / 2;
  const cy = el.height / 2;
  const glitchOffset = el.glitchIntensity / 100;

  let inner = '';
  if (el.glitchIntensity > 0) {
    inner += `<g transform="translate(${glitchOffset * 3} ${glitchOffset * -1})" opacity="${glitchOffset * 0.55}" style="color:#ff2d95;mix-blend-mode:screen;">${preset.svgContent}</g>`;
    inner += `<g transform="translate(${glitchOffset * -3} ${glitchOffset * 1})" opacity="${glitchOffset * 0.55}" style="color:#00f0ff;mix-blend-mode:screen;">${preset.svgContent}</g>`;
  }
  inner += `<g style="color:${el.color};">${preset.svgContent}</g>`;

  const glowDeviation = 3 + el.glitchIntensity / 18;
  const filterId = `g-${el.id.slice(0, 8)}`;

  return `<g transform="translate(${el.x} ${el.y}) rotate(${el.rotation} ${cx} ${cy})" filter="url(#${filterId})">
    <svg x="0" y="0" width="${el.width}" height="${el.height}" viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible">
      <defs>
        <filter id="${filterId}" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="${glowDeviation}" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      ${inner}
    </svg>
  </g>`;
}

function buildExportSvg(
  elements: CanvasElement[],
  presetsMap: Record<string, PresetElement>,
  w: number,
  h: number
): string {
  const visible = elements
    .filter((e) => e.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  let inner = '';
  for (const el of visible) {
    const p = presetsMap[el.presetId];
    if (!p) continue;
    inner += buildElementInlineSvg(el, p);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="45%" r="75%">
        <stop offset="0%" stop-color="#1a1a28"/>
        <stop offset="100%" stop-color="#0a0a0f"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bgGrad)"/>
    ${inner}
  </svg>`;
}

async function svgToPngBlob(
  svgString: string,
  width: number,
  height: number
): Promise<Blob> {
  const svgBlob = svgToBlob(svgString);
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('SVG load failed'));
      image.src = url;
    });

    const offscreen = new OffscreenCanvas(width, height);
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) throw new Error('Canvas context not available');

    offCtx.imageSmoothingEnabled = true;
    offCtx.imageSmoothingQuality = 'high';
    offCtx.drawImage(img, 0, 0, width, height);

    const blob = await offscreen.convertToBlob({
      type: 'image/png',
      quality: 1.0,
    });
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function handleExport(
  format: 'png' | 'svg',
  scale: number,
  elements: CanvasElement[],
  width: number,
  height: number,
  presetsMap: Record<string, PresetElement>
) {
  try {
    const baseW = width;
    const baseH = height;
    const outW = Math.round(baseW * scale);
    const outH = Math.round(baseH * scale);

    const svgStr = buildExportSvg(elements, presetsMap, baseW, baseH);

    const totalSteps = elements.filter((e) => e.visible).length + 2;
    let step = 0;
    const reportStep = () => {
      step++;
      const percent = Math.min(Math.round((step / totalSteps) * 100), 99);
      ctx.postMessage({ type: 'progress', percent } as ExportWorkerResponse);
    };

    reportStep();
    const visibleElements = elements.filter((e) => e.visible);
    for (let i = 0; i < visibleElements.length; i += Math.max(1, Math.ceil(visibleElements.length / 10))) {
      reportStep();
      await new Promise((r) => setTimeout(r, 0));
    }

    let blob: Blob;
    let ext: string;
    const timestamp = new Date().toISOString().slice(0, 10);

    if (format === 'svg') {
      blob = svgToBlob(svgStr);
      ext = 'svg';
    } else {
      blob = await svgToPngBlob(svgStr, outW, outH);
      ext = 'png';
    }

    ctx.postMessage({
      type: 'progress',
      percent: 100,
    } as ExportWorkerResponse);

    await new Promise((r) => setTimeout(r, 200));

    ctx.postMessage(
      {
        type: 'done',
        blob,
        filename: `cyber-sign-${timestamp}-${scale}x.${ext}`,
      } as ExportWorkerResponse,
      [blob]
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    ctx.postMessage({ type: 'error', message } as ExportWorkerResponse);
  }
}

ctx.addEventListener('message', (event: MessageEvent<ExportWorkerMessage>) => {
  const msg = event.data;
  if (msg.type === 'export') {
    handleExport(
      msg.format,
      msg.scale,
      msg.elements,
      msg.width,
      msg.height,
      msg.presetsMap
    );
  }
});
