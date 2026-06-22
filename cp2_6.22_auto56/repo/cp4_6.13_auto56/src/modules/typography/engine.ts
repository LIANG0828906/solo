import type { ITypographyParams } from './types';

export function applyTypography(params: ITypographyParams): React.CSSProperties {
  return {
    fontFamily: params.fontFamily,
    fontSize: `${params.fontSize}px`,
    lineHeight: params.lineHeight,
    letterSpacing: `${params.letterSpacing}px`,
    color: params.color,
    transition: 'all 0.2s ease',
  };
}

export function generatePreviewUrl(
  text: string,
  params: ITypographyParams,
  width = 200,
  height = 60
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  const fontSize = Math.min(params.fontSize * 0.5, 28);
  const fontFamily = params.fontFamily.split(',')[0].replace(/['"]/g, '');
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = params.color;
  ctx.textBaseline = 'middle';

  const displayText = text.slice(0, 15) || 'FontLab Preview';
  ctx.fillText(displayText, 10, height / 2);

  return canvas.toDataURL('image/png');
}
