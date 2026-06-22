import { Imagery, ShapeType } from '../stores/poemStore';

interface RenderOptions {
  draggingId: string | null;
  dragPosition: { x: number; y: number } | null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function drawInkBleed(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity: number
) {
  const rgb = hexToRgb(color);
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.15 * opacity})`);
  gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawBamboo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 8 * size;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y + 80 * size);
  ctx.bezierCurveTo(x - 5 * size, y + 40 * size, x + 5 * size, y + 20 * size, x, y - 60 * size);
  ctx.stroke();

  ctx.lineWidth = 2 * size;
  for (let i = 0; i < 5; i++) {
    const yPos = y + 60 * size - i * 28 * size;
    ctx.beginPath();
    ctx.moveTo(x - 12 * size, yPos);
    ctx.lineTo(x + 12 * size, yPos);
    ctx.stroke();
  }

  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const leafX = x + (i === 1 ? -18 : 18) * size;
    const leafY = y - 20 * size - i * 25 * size;
    ctx.beginPath();
    ctx.moveTo(leafX, leafY);
    ctx.quadraticCurveTo(
      leafX + (i === 1 ? -30 : 30) * size,
      leafY - 15 * size,
      leafX + (i === 1 ? -50 : 50) * size,
      leafY - 5 * size
    );
    ctx.quadraticCurveTo(
      leafX + (i === 1 ? -25 : 25) * size,
      leafY + 5 * size,
      leafX,
      leafY
    );
    ctx.fill();
  }

  ctx.restore();
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.ellipse(x, y, 22 * size, 14 * size, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x + 20 * size, y - 8 * size, 10 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2A2015';
  ctx.beginPath();
  ctx.arc(x + 24 * size, y - 10 * size, 2 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#D4883A';
  ctx.beginPath();
  ctx.moveTo(x + 30 * size, y - 8 * size);
  ctx.lineTo(x + 42 * size, y - 6 * size);
  ctx.lineTo(x + 30 * size, y - 4 * size);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 10 * size, y - 5 * size);
  ctx.quadraticCurveTo(x - 35 * size, y - 30 * size, x - 50 * size, y - 5 * size);
  ctx.quadraticCurveTo(x - 35 * size, y - 5 * size, x - 10 * size, y - 5 * size);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x - 10 * size, y + 5 * size);
  ctx.quadraticCurveTo(x - 35 * size, y + 25 * size, x - 45 * size, y + 10 * size);
  ctx.quadraticCurveTo(x - 30 * size, y + 10 * size, x - 10 * size, y + 5 * size);
  ctx.fill();

  ctx.strokeStyle = '#D4883A';
  ctx.lineWidth = 2 * size;
  ctx.beginPath();
  ctx.moveTo(x - 5 * size, y + 12 * size);
  ctx.lineTo(x - 8 * size, y + 25 * size);
  ctx.moveTo(x + 5 * size, y + 12 * size);
  ctx.lineTo(x + 8 * size, y + 25 * size);
  ctx.stroke();

  ctx.restore();
}

function drawMountain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 100 * size, y + 60 * size);
  ctx.lineTo(x - 40 * size, y - 50 * size);
  ctx.lineTo(x - 10 * size, y - 20 * size);
  ctx.lineTo(x + 30 * size, y - 80 * size);
  ctx.lineTo(x + 80 * size, y - 10 * size);
  ctx.lineTo(x + 100 * size, y + 60 * size);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * opacity})`;
  ctx.beginPath();
  ctx.moveTo(x + 15 * size, y - 55 * size);
  ctx.lineTo(x + 30 * size, y - 80 * size);
  ctx.lineTo(x + 45 * size, y - 50 * size);
  ctx.lineTo(x + 35 * size, y - 45 * size);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = `rgba(60, 50, 40, ${0.3 * opacity})`;
  ctx.lineWidth = 1.5 * size;
  ctx.beginPath();
  ctx.moveTo(x - 30 * size, y);
  ctx.quadraticCurveTo(x - 20 * size, y + 20 * size, x - 10 * size, y + 10 * size);
  ctx.moveTo(x + 40 * size, y - 30 * size);
  ctx.quadraticCurveTo(x + 50 * size, y - 10 * size, x + 60 * size, y - 20 * size);
  ctx.stroke();

  ctx.restore();
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * size;
  ctx.lineCap = 'round';

  for (let i = 0; i < 5; i++) {
    const yOffset = (i - 2) * 16 * size;
    ctx.beginPath();
    ctx.moveTo(x - 90 * size, y + yOffset);
    for (let j = 0; j < 6; j++) {
      const xPos = x - 90 * size + j * 30 * size;
      const yPos = y + yOffset + (j % 2 === 0 ? 6 * size : -6 * size);
      ctx.quadraticCurveTo(xPos + 15 * size, yPos + (j % 2 === 0 ? -6 : 6) * size, xPos + 30 * size, y + yOffset);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawBoat(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.moveTo(x - 60 * size, y);
  ctx.quadraticCurveTo(x - 50 * size, y + 25 * size, x, y + 30 * size);
  ctx.quadraticCurveTo(x + 50 * size, y + 25 * size, x + 60 * size, y);
  ctx.lineTo(x + 50 * size, y + 5 * size);
  ctx.lineTo(x - 50 * size, y + 5 * size);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * size;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 55 * size);
  ctx.stroke();

  ctx.fillStyle = '#F5F0EB';
  ctx.beginPath();
  ctx.moveTo(x + 3 * size, y - 50 * size);
  ctx.lineTo(x + 45 * size, y - 20 * size);
  ctx.lineTo(x + 3 * size, y - 15 * size);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#5A4A3A';
  ctx.beginPath();
  ctx.arc(x - 10 * size, y - 5 * size, 4 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(angle) * 16 * size;
    const py = y + Math.sin(angle) * 16 * size;
    ctx.beginPath();
    ctx.ellipse(px, py, 14 * size, 10 * size, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#E8C84A';
  ctx.beginPath();
  ctx.arc(x, y, 10 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#5B8C5A';
  ctx.lineWidth = 3 * size;
  ctx.beginPath();
  ctx.moveTo(x, y + 18 * size);
  ctx.quadraticCurveTo(x - 5 * size, y + 40 * size, x + 3 * size, y + 70 * size);
  ctx.stroke();

  ctx.fillStyle = '#5B8C5A';
  ctx.beginPath();
  ctx.ellipse(x - 15 * size, y + 45 * size, 14 * size, 7 * size, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMoon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 60 * size);
  gradient.addColorStop(0, `rgba(255, 252, 240, ${0.9})`);
  gradient.addColorStop(0.6, color);
  gradient.addColorStop(1, 'rgba(255, 252, 240, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, 60 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FDFAF0';
  ctx.beginPath();
  ctx.arc(x, y, 35 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(200, 195, 180, 0.3)';
  ctx.beginPath();
  ctx.arc(x - 10 * size, y + 5 * size, 8 * size, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 12 * size, y - 8 * size, 5 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCloud(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity * 0.8;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.arc(x - 35 * size, y, 22 * size, 0, Math.PI * 2);
  ctx.arc(x - 10 * size, y - 12 * size, 26 * size, 0, Math.PI * 2);
  ctx.arc(x + 20 * size, y, 24 * size, 0, Math.PI * 2);
  ctx.arc(x + 45 * size, y - 5 * size, 20 * size, 0, Math.PI * 2);
  ctx.arc(x - 5 * size, y + 8 * size, 22 * size, 0, Math.PI * 2);
  ctx.arc(x + 25 * size, y + 10 * size, 18 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.fillStyle = '#7A5A3A';
  ctx.beginPath();
  ctx.moveTo(x - 8 * size, y + 70 * size);
  ctx.lineTo(x - 5 * size, y - 10 * size);
  ctx.lineTo(x + 5 * size, y - 10 * size);
  ctx.lineTo(x + 8 * size, y + 70 * size);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color;
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const cx = x + Math.cos(angle) * 22 * size;
    const cy = y - 30 * size + Math.sin(angle) * 18 * size;
    ctx.beginPath();
    ctx.arc(cx, cy, 28 * size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y - 35 * size, 30 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80 * size);
  gradient.addColorStop(0, 'rgba(255, 220, 160, 0.9)');
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, 'rgba(255, 180, 100, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, 80 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFB060';
  ctx.beginPath();
  ctx.arc(x, y, 40 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 * size;
  ctx.lineCap = 'round';

  for (let i = 0; i < 20; i++) {
    const ox = (Math.random() - 0.5) * 120 * size;
    const oy = (Math.random() - 0.5) * 100 * size;
    ctx.beginPath();
    ctx.moveTo(x + ox, y + oy);
    ctx.lineTo(x + ox - 5 * size, y + oy + 15 * size);
    ctx.stroke();
  }

  ctx.restore();
}

function drawWind(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * size;
  ctx.lineCap = 'round';

  for (let i = 0; i < 4; i++) {
    const yOffset = (i - 1.5) * 20 * size;
    ctx.beginPath();
    ctx.moveTo(x - 60 * size, y + yOffset);
    ctx.quadraticCurveTo(x - 30 * size, y + yOffset - 15 * size, x, y + yOffset);
    ctx.quadraticCurveTo(x + 30 * size, y + yOffset + 15 * size, x + 60 * size, y + yOffset);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDefault(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 30 * size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeType,
  x: number,
  y: number,
  size: number,
  color: string,
  opacity: number
) {
  switch (shape) {
    case 'bamboo':
      drawBamboo(ctx, x, y, size, color, opacity);
      break;
    case 'bird':
      drawBird(ctx, x, y, size, color, opacity);
      break;
    case 'mountain':
      drawMountain(ctx, x, y, size, color, opacity);
      break;
    case 'water':
      drawWater(ctx, x, y, size, color, opacity);
      break;
    case 'boat':
      drawBoat(ctx, x, y, size, color, opacity);
      break;
    case 'flower':
      drawFlower(ctx, x, y, size, color, opacity);
      break;
    case 'moon':
      drawMoon(ctx, x, y, size, color, opacity);
      break;
    case 'cloud':
      drawCloud(ctx, x, y, size, color, opacity);
      break;
    case 'tree':
      drawTree(ctx, x, y, size, color, opacity);
      break;
    case 'sun':
      drawSun(ctx, x, y, size, color, opacity);
      break;
    case 'rain':
      drawRain(ctx, x, y, size, color, opacity);
      break;
    case 'wind':
      drawWind(ctx, x, y, size, color, opacity);
      break;
    default:
      drawDefault(ctx, x, y, size, color, opacity);
  }
}

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  imageries: Imagery[],
  options: RenderOptions
) {
  ctx.clearRect(0, 0, width, height);

  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#FDFAF5');
  bgGradient.addColorStop(1, '#F0E8D8');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  imageries.forEach((imagery) => {
    const pos =
      options.draggingId === imagery.id && options.dragPosition
        ? options.dragPosition
        : imagery.position;

    drawInkBleed(ctx, pos.x, pos.y, 50 * imagery.size + 10, imagery.color, imagery.opacity);
  });

  imageries.forEach((imagery) => {
    const pos =
      options.draggingId === imagery.id && options.dragPosition
        ? options.dragPosition
        : imagery.position;

    drawShape(ctx, imagery.shape, pos.x, pos.y, imagery.size, imagery.color, imagery.opacity);
  });

  if (options.draggingId && options.dragPosition) {
    ctx.strokeStyle = 'rgba(139, 115, 85, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(options.dragPosition.x - 10, options.dragPosition.y);
    ctx.lineTo(options.dragPosition.x + 10, options.dragPosition.y);
    ctx.moveTo(options.dragPosition.x, options.dragPosition.y - 10);
    ctx.lineTo(options.dragPosition.x, options.dragPosition.y + 10);
    ctx.stroke();
  }
}

export function getImageryAtPosition(
  imageries: Imagery[],
  x: number,
  y: number
): Imagery | null {
  for (let i = imageries.length - 1; i >= 0; i--) {
    const img = imageries[i];
    const hitRadius = 50 * img.size;
    const dx = x - img.position.x;
    const dy = y - img.position.y;
    if (dx * dx + dy * dy <= hitRadius * hitRadius) {
      return img;
    }
  }
  return null;
}
