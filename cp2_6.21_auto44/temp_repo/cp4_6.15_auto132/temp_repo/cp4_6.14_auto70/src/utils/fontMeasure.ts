export interface CharBounds {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface FontConfig {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

export interface MeasureData {
  width: number;
  height: number;
  charBounds: CharBounds | null;
}

export const FONT_OPTIONS = [
  { label: 'Noto Sans SC',
  value: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
},
  { label: 'Inter', value: 'Inter, system-ui, -apple-system, sans-serif' },
  { label: 'Roboto', value: 'Roboto, Arial, sans-serif' },
  { label: 'PingFang SC',
  value: '"PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: 'Microsoft YaHei',
  value: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  { label: 'Helvetica Neue',
  value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'SimSun', value: 'SimSun, "宋体", serif' },
];

export function getCharBounds(char: string, config: FontConfig): CharBounds | null {
  if (!char || char.length === 0) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const fontSize = config.fontSize;
  canvas.width = fontSize * 3;
  canvas.height = fontSize * 3;

  ctx.font = `${fontSize}px ${config.fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';
  ctx.fillText(char[0], fontSize * 0.5, fontSize * 0.5);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let minX = canvas.width;
  let maxX = -1;
  let minY = canvas.height;
  let maxY = -1;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const alpha = imageData[(y * canvas.width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) {
    return null;
  }

  return {
    left: minX - fontSize * 0.5,
    right: maxX - fontSize * 0.5,
    top: minY - fontSize * 0.5,
    bottom: maxY - fontSize * 0.5,
  };
}

export function calcVisualScore(
  boundsA: CharBounds | null,
  boundsB: CharBounds | null,
  fontSizeA: number,
  fontSizeB: number
): number {
  if (!boundsA || !boundsB) return 0;

  const normA = {
    top: boundsA.top / fontSizeA,
    bottom: boundsA.bottom / fontSizeA,
    left: boundsA.left / fontSizeA,
    right: boundsA.right / fontSizeA,
  };

  const normB = {
    top: boundsB.top / fontSizeB,
    bottom: boundsB.bottom / fontSizeB,
    left: boundsB.left / fontSizeB,
    right: boundsB.right / fontSizeB,
  };

  const topDiff = normA.top - normB.top;
  const bottomDiff = normA.bottom - normB.bottom;
  const leftDiff = normA.left - normB.left;
  const rightDiff = normA.right - normB.right;

  const sumSq =
    topDiff * topDiff +
    bottomDiff * bottomDiff +
    leftDiff * leftDiff +
    rightDiff * rightDiff;

  return Math.round(sumSq * 1000);
}

export function renderTextToCanvas(
  text: string,
  config: FontConfig,
  maxWidth: number = 500
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const fontSize = config.fontSize;
  const lineHeight = fontSize * config.lineHeight;
  const padding = 20;

  ctx.font = `${fontSize}px ${config.fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';

  const words = text.split('');
  const lines: string[] = [];
  let currentLine = '';

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth - padding * 2 && currentLine !== '') {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  canvas.width = maxWidth;
  canvas.height = lines.length * lineHeight + padding * 2;

  ctx.font = `${fontSize}px ${config.fontFamily}`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], padding, padding + i * lineHeight);
  }

  return canvas.toDataURL('image/png');
}

export function getFirstCompleteChar(
  text: string,
  selectionX: number,
  selectionWidth: number,
  config: FontConfig
): string {
  if (!text || text.length === 0) return '';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  ctx.textBaseline = 'top';

  let accumulatedWidth = 0;
  for (let i = 0; i < text.length; i++) {
    const charWidth = ctx.measureText(text[i]).width;
    if (accumulatedWidth + charWidth >= selectionX) {
      if (accumulatedWidth + charWidth <= selectionX + selectionWidth) {
        return text[i];
      }
      break;
    }
    accumulatedWidth += charWidth;
  }

  return '';
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  configA: FontConfig;
  configB: FontConfig;
  measureA: MeasureData | null;
  measureB: MeasureData | null;
  score: number;
  text: string;
}
