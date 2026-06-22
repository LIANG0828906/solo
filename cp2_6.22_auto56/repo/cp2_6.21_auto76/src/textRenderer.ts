import type {
  ParsedFont,
  LayoutParams,
  PathCommand,
  LineMetrics,
  CharPosition,
  RenderResult,
} from './types';

function drawPath(
  ctx: CanvasRenderingContext2D,
  commands: PathCommand[],
  x: number,
  y: number,
  scale: number
) {
  ctx.beginPath();
  for (const cmd of commands) {
    switch (cmd.type) {
      case 'M':
        ctx.moveTo(x + (cmd.x || 0) * scale, y - (cmd.y || 0) * scale);
        break;
      case 'L':
        ctx.lineTo(x + (cmd.x || 0) * scale, y - (cmd.y || 0) * scale);
        break;
      case 'C':
        ctx.bezierCurveTo(
          x + (cmd.x1 || 0) * scale,
          y - (cmd.y1 || 0) * scale,
          x + (cmd.x2 || 0) * scale,
          y - (cmd.y2 || 0) * scale,
          x + (cmd.x || 0) * scale,
          y - (cmd.y || 0) * scale
        );
        break;
      case 'Q':
        ctx.quadraticCurveTo(
          x + (cmd.x1 || 0) * scale,
          y - (cmd.y1 || 0) * scale,
          x + (cmd.x || 0) * scale,
          y - (cmd.y || 0) * scale
        );
        break;
      case 'Z':
        ctx.closePath();
        break;
    }
  }
  ctx.fill();
}

function getGlyphAdvance(font: ParsedFont, char: string): number {
  const glyph = font.glyphs[char];
  return glyph ? glyph.advanceWidth : font.unitsPerEm * 0.5;
}

function getKerning(
  font: ParsedFont,
  leftChar: string,
  rightChar: string
): number {
  const key = `${leftChar}|${rightChar}`;
  return font.kerningValues[key] || 0;
}

function measureLine(
  font: ParsedFont,
  text: string,
  fontSize: number,
  letterSpacing: number
): number {
  const scale = fontSize / font.unitsPerEm;
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    width += getGlyphAdvance(font, text[i]) * scale;
    if (i < text.length - 1) {
      width += getKerning(font, text[i], text[i + 1]) * scale;
    }
    if (i < text.length - 1) {
      width += letterSpacing;
    }
  }
  return width;
}

export function renderText(
  font: ParsedFont,
  params: LayoutParams,
  canvasWidth: number
): RenderResult {
  const { fontSize, lineHeight, letterSpacing, alignment, text } = params;
  const scale = fontSize / font.unitsPerEm;
  const lines = text.split('\n');
  const lineHeightPx = fontSize * lineHeight;
  const padding = 16;

  const lineMetrics: LineMetrics[] = [];
  let totalHeight = padding * 2;

  for (const line of lines) {
    const lineWidth = measureLine(font, line, fontSize, letterSpacing);
    const charPositions: CharPosition[] = [];
    let x = padding;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const glyph = font.glyphs[char];
      const advance = getGlyphAdvance(font, char) * scale;
      const kerning = i > 0 ? getKerning(font, line[i - 1], char) * scale : 0;

      charPositions.push({
        char,
        x: x + kerning,
        y: totalHeight,
        width: advance,
        height: fontSize,
      });

      x += advance + kerning + letterSpacing;
    }

    lineMetrics.push({
      text: line,
      y: totalHeight,
      height: lineHeightPx,
      width: lineWidth,
      charPositions,
    });

    totalHeight += lineHeightPx;
  }

  totalHeight += padding;
  const height = Math.max(totalHeight, 200);
  const width = canvasWidth;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#e0e0e0';
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'alphabetic';

  for (let li = 0; li < lineMetrics.length; li++) {
    const line = lineMetrics[li];
    const baselineY = line.y + fontSize;

    let offsetX = padding;
    if (alignment === 'center') {
      offsetX = (width - line.width) / 2;
    } else if (alignment === 'right') {
      offsetX = width - line.width - padding;
    }

    let x = offsetX;
    for (let i = 0; i < line.text.length; i++) {
      const char = line.text[i];
      const glyph = font.glyphs[char];
      const kerning = i > 0 ? getKerning(font, line.text[i - 1], char) * scale : 0;
      x += kerning;

      if (glyph) {
        drawPath(ctx, glyph.commands, x, baselineY, scale);
      }

      const advance = getGlyphAdvance(font, char) * scale;
      line.charPositions[i].x = x;
      x += advance + letterSpacing;
    }
  }

  return { canvas, width, height, lineMetrics };
}

export function renderSampleOnCanvas(
  font: ParsedFont,
  canvas: HTMLCanvasElement,
  sampleText: string
) {
  const ctx = canvas.getContext('2d')!;
  const fontSize = 14;
  const scale = fontSize / font.unitsPerEm;
  const padding = 4;

  ctx.fillStyle = '#2b2b3d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#a78bfa';
  let x = padding;
  const baselineY = canvas.height / 2 + fontSize * 0.35;

  for (const ch of sampleText) {
    const glyph = font.glyphs[ch];
    if (glyph) {
      drawPath(ctx, glyph.commands, x, baselineY, scale);
      x += glyph.advanceWidth * scale + 1;
    } else {
      x += fontSize * 0.5;
    }
    if (x > canvas.width - padding) break;
  }
}
