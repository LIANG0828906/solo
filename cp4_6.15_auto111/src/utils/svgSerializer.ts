import type { CanvasElement, PresetElement } from '@/types';

export function buildElementSvg(
  el: CanvasElement,
  preset: PresetElement,
  includeGlow: boolean = true
): string {
  const cx = el.width / 2;
  const cy = el.height / 2;
  const glitchOffset = el.glitchIntensity / 100;

  let innerContent = '';
  const glitchLayers: Array<{ dx: number; dy: number; color: string; opacity: number }> = [];

  if (el.glitchIntensity > 0) {
    glitchLayers.push({
      dx: glitchOffset * 3,
      dy: glitchOffset * -1,
      color: '#ff2d95',
      opacity: glitchOffset * 0.6,
    });
    glitchLayers.push({
      dx: glitchOffset * -3,
      dy: glitchOffset * 1,
      color: '#00f0ff',
      opacity: glitchOffset * 0.6,
    });
  }

  for (const layer of glitchLayers) {
    innerContent += `<g transform="translate(${layer.dx} ${layer.dy})" opacity="${layer.opacity}" style="color:${layer.color};mix-blend-mode:screen;">${preset.svgContent}</g>`;
  }

  innerContent += `<g style="color:${el.color};">${preset.svgContent}</g>`;

  const glowFilter = includeGlow
    ? `<filter id="glow-${el.id}" x="-50%" y="-50%" width="200%" height="200%">
         <feGaussianBlur stdDeviation="${3 + el.glitchIntensity / 20}" result="blur"/>
         <feMerge>
           <feMergeNode in="blur"/>
           <feMergeNode in="SourceGraphic"/>
         </feMerge>
       </filter>`
    : '';

  return `<g transform="translate(${el.x} ${el.y}) rotate(${el.rotation} ${cx} ${cy})" ${
    includeGlow ? `filter="url(#glow-${el.id})"` : ''
  }>
    <defs>${glowFilter}</defs>
    <svg x="0" y="0" width="${el.width}" height="${el.height}" viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible">
      ${innerContent}
    </svg>
  </g>`;
}

export function buildFullSvg(
  elements: CanvasElement[],
  presetsMap: Record<string, PresetElement>,
  width: number = 1200,
  height: number = 900,
  backgroundColor: string = '#0a0a0f'
): string {
  const visibleElements = elements
    .filter((e) => e.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  let content = `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;
  for (const el of visibleElements) {
    const preset = presetsMap[el.presetId];
    if (!preset) continue;
    content += buildElementSvg(el, preset, true);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="75%">
      <stop offset="0%" stop-color="#1a1a28"/>
      <stop offset="100%" stop-color="${backgroundColor}"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${content}
</svg>`;
}

export function svgToBlob(svgString: string): Blob {
  return new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
