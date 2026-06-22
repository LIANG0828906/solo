import type { CharacterCard, SceneCard, SwatchCard, Card } from '@/data/cardStore';

export const CARD_SIZES = {
  character: { width: 200, height: 280 },
  scene: { width: 280, height: 200 },
  swatch: { width: 160, height: 100 },
};

const COLORS = {
  bgCard: '#2D283E',
  border: '#413D57',
  textPrimary: '#D3CDE0',
  textSecondary: '#8E8AA3',
  accent: '#A277D1',
  accentSecondary: '#7C6FBA',
  glow: 'rgba(124, 111, 186, 0.4)',
  tagBg: 'rgba(162, 119, 209, 0.2)',
};

export function getCardSize(card: Card): { width: number; height: number } {
  return CARD_SIZES[card.type];
}

export function drawCard(
  ctx: CanvasRenderingContext2D,
  card: Card,
  x: number,
  y: number,
  isHovered: boolean,
  isSelected: boolean
): void {
  const { width, height } = getCardSize(card);
  const radius = 12;

  ctx.save();

  if (isHovered || isSelected) {
    ctx.shadowColor = isSelected ? 'rgba(162, 119, 209, 0.6)' : COLORS.glow;
    ctx.shadowBlur = 16;
  }

  ctx.beginPath();
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = COLORS.bgCard;
  ctx.fill();

  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.strokeStyle = isSelected ? COLORS.accent : COLORS.border;
  ctx.stroke();

  ctx.restore();

  if (card.type === 'character') {
    drawCharacterCard(ctx, card as CharacterCard, x, y, width, height);
  } else if (card.type === 'scene') {
    drawSceneCard(ctx, card as SceneCard, x, y, width, height);
  } else {
    drawSwatchCard(ctx, card as SwatchCard, x, y, width, height);
  }
}

function drawCharacterCard(
  ctx: CanvasRenderingContext2D,
  card: CharacterCard,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const avatarHeight = 140;
  const radius = 12;

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, width, avatarHeight, radius);
  ctx.closePath();
  ctx.clip();

  const gradient = ctx.createLinearGradient(x, y, x + width, y + avatarHeight);
  gradient.addColorStop(0, card.primaryColor);
  gradient.addColorStop(1, card.secondaryColor);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(x + width * 0.7, y + avatarHeight * 0.3, 30, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.beginPath();
  ctx.arc(x + width * 0.3, y + avatarHeight * 0.7, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const contentY = y + avatarHeight + 16;

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(truncateText(ctx, card.title, width - 32), x + 16, contentY);

  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  const descY = contentY + 28;
  const lines = wrapText(ctx, card.description, width - 32, 2);
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 16, descY + i * 18);
  });

  const tagsY = y + height - 40;
  drawTags(ctx, card.tags, x + 16, tagsY, width - 32);
}

function drawSceneCard(
  ctx: CanvasRenderingContext2D,
  card: SceneCard,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const thumbHeight = 130;
  const radius = 12;

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, width, thumbHeight, radius);
  ctx.closePath();
  ctx.clip();

  drawGeometricPattern(ctx, x, y, width, thumbHeight, card.patternSeed);

  ctx.restore();

  const contentY = y + thumbHeight + 12;

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(truncateText(ctx, card.title, width - 32), x + 16, contentY);

  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  const descY = contentY + 24;
  const lines = wrapText(ctx, card.description, width - 32, 2);
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 16, descY + i * 16);
  });
}

function drawSwatchCard(
  ctx: CanvasRenderingContext2D,
  card: SwatchCard,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const barHeight = 50;
  const radius = 12;

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x + 12, y + 12, width - 24, barHeight, 6);
  ctx.closePath();
  ctx.clip();

  if (card.colors.length > 0) {
    if (card.colors.length === 1) {
      ctx.fillStyle = card.colors[0];
      ctx.fillRect(x + 12, y + 12, width - 24, barHeight);
    } else {
      const gradient = ctx.createLinearGradient(x + 12, 0, x + width - 12, 0);
      card.colors.forEach((color, i) => {
        gradient.addColorStop(i / (card.colors.length - 1), color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(x + 12, y + 12, width - 24, barHeight);
    }
  }

  ctx.restore();

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(truncateText(ctx, card.title, width - 32), x + 16, y + 70);

  const hexColor = card.colors[0] || '#7C6FBA';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '11px monospace';
  ctx.fillText(hexColor.toUpperCase(), x + 16, y + 88);
}

function drawTags(
  ctx: CanvasRenderingContext2D,
  tags: string[],
  x: number,
  y: number,
  maxWidth: number
): void {
  let currentX = x;
  let currentY = y;
  const tagPaddingX = 8;
  const tagPaddingY = 3;
  const tagRadius = 10;
  const fontSize = 11;

  ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;

  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i];
    const textWidth = ctx.measureText(tag).width;
    const tagWidth = textWidth + tagPaddingX * 2;

    if (currentX + tagWidth > x + maxWidth) {
      break;
    }

    ctx.fillStyle = COLORS.tagBg;
    ctx.beginPath();
    roundRect(ctx, currentX, currentY, tagWidth, fontSize + tagPaddingY * 2, tagRadius);
    ctx.fill();

    ctx.fillStyle = COLORS.accent;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(tag, currentX + tagPaddingX, currentY + tagPaddingY);

    currentX += tagWidth + 6;
  }
}

function drawGeometricPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  seed: number
): void {
  const random = seededRandom(seed);

  const bgGradient = ctx.createLinearGradient(x, y, x + width, y + height);
  bgGradient.addColorStop(0, `hsl(${random() * 60 + 240}, 40%, 25%)`);
  bgGradient.addColorStop(1, `hsl(${random() * 60 + 260}, 50%, 15%)`);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(x, y, width, height);

  const shapes = 8;
  for (let i = 0; i < shapes; i++) {
    const shapeX = x + random() * width;
    const shapeY = y + random() * height;
    const shapeSize = 20 + random() * 60;
    const hue = random() * 60 + 250;
    const alpha = 0.1 + random() * 0.3;

    ctx.fillStyle = `hsla(${hue}, 60%, 60%, ${alpha})`;
    ctx.beginPath();

    const shapeType = Math.floor(random() * 3);
    if (shapeType === 0) {
      ctx.arc(shapeX, shapeY, shapeSize / 2, 0, Math.PI * 2);
    } else if (shapeType === 1) {
      ctx.rect(shapeX - shapeSize / 2, shapeY - shapeSize / 2, shapeSize, shapeSize);
    } else {
      ctx.moveTo(shapeX, shapeY - shapeSize / 2);
      ctx.lineTo(shapeX + shapeSize / 2, shapeY + shapeSize / 2);
      ctx.lineTo(shapeX - shapeSize / 2, shapeY + shapeSize / 2);
      ctx.closePath();
    }
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 20;
  for (let gx = 0; gx < width; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x + gx, y);
    ctx.lineTo(x + gx, y + height);
    ctx.stroke();
  }
  for (let gy = 0; gy < height; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, y + gy);
    ctx.lineTo(x + width, y + gy);
    ctx.stroke();
  }
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let result = text;
  while (result.length > 0 && ctx.measureText(result + '...').width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + '...';
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const lines: string[] = [];
  let currentLine = '';
  const chars = text.split('');

  for (let i = 0; i < chars.length; i++) {
    const testLine = currentLine + chars[i];
    if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
      if (lines.length >= maxLines - 1) {
        while (ctx.measureText(currentLine + '...').width > maxWidth && currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
        }
        lines.push(currentLine + '...');
        return lines;
      }
      lines.push(currentLine);
      currentLine = chars[i];
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, maxLines);
}

export function drawConnection(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  isHovered: boolean
): void {
  const dx = toX - fromX;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);

  ctx.save();

  ctx.strokeStyle = isHovered ? '#A277D1' : '#7C6FBA';
  ctx.lineWidth = isHovered ? 3 : 2;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.bezierCurveTo(
    fromX + controlOffset,
    fromY,
    toX - controlOffset,
    toY,
    toX,
    toY
  );
  ctx.stroke();

  if (isHovered) {
    ctx.fillStyle = '#A277D1';
    ctx.beginPath();
    ctx.arc(fromX, fromY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(toX, toY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function getCardCenter(card: Card, x: number, y: number): { x: number; y: number } {
  const size = getCardSize(card);
  return {
    x: x + size.width / 2,
    y: y + size.height / 2,
  };
}

export function hitTestCard(card: Card, cardX: number, cardY: number, px: number, py: number): boolean {
  const { width, height } = getCardSize(card);
  return px >= cardX && px <= cardX + width && py >= cardY && py <= cardY + height;
}

export function hitTestConnection(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  px: number,
  py: number,
  threshold: number = 5
): boolean {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 150);

  for (let t = 0; t <= 1; t += 0.05) {
    const bezierX = bezierPoint(fromX, fromX + controlOffset, toX - controlOffset, toX, t);
    const bezierY = bezierPoint(fromY, fromY, toY, toY, t);
    const dist = Math.sqrt((px - bezierX) ** 2 + (py - bezierY) ** 2);
    if (dist < threshold) {
      return true;
    }
  }
  return false;
}

function bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}
