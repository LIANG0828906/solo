import type { FavoriteRecipe } from '../stores/recipeStore';

interface CalendarData {
  favorites: FavoriteRecipe[];
  solarTermOrder: string[];
  userName: string;
  generatedDate: string;
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = ((i * 72 - 90) * Math.PI) / 180;
    const innerAngle = ((i * 72 + 36 - 90) * Math.PI) / 180;
    const outerX = cx + Math.cos(outerAngle) * size;
    const outerY = cy + Math.sin(outerAngle) * size;
    const innerX = cx + Math.cos(innerAngle) * size * 0.45;
    const innerY = cy + Math.sin(innerAngle) * size * 0.45;
    if (i === 0) {
      ctx.moveTo(outerX, outerY);
    } else {
      ctx.lineTo(outerX, outerY);
    }
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();
}

function generateWatercolorTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#F5EDE3');
  gradient.addColorStop(0.3, '#F0E5D8');
  gradient.addColorStop(0.6, '#E8D9C5');
  gradient.addColorStop(1, '#D4C9B8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 50 + Math.random() * 150;
    const alpha = 0.03 + Math.random() * 0.05;
    
    const blobGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const hue = 25 + Math.random() * 20;
    const light = 75 + Math.random() * 15;
    blobGradient.addColorStop(0, `hsla(${hue}, 30%, ${light}%, ${alpha})`);
    blobGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = blobGradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 0.5 + Math.random() * 2;
    ctx.fillStyle = `rgba(180, 160, 140, ${0.03 + Math.random() * 0.05})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function generateCalendarImage(data: CalendarData): string {
  const width = 1080;
  const height = 1920;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  generateWatercolorTexture(ctx, width, height);

  ctx.fillStyle = '#3D2914';
  ctx.font = 'bold 64px "Ma Shan Zheng", "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('节气食单', width / 2, 120);

  ctx.fillStyle = '#8B7355';
  ctx.font = '28px "Noto Serif SC", serif';
  ctx.fillText('二十四节气 · 时令美食日历', width / 2, 170);

  const badgeRadius = 80;
  const badgeGapX = 220;
  const badgeGapY = 200;
  const startX = width / 2 - badgeGapX;
  const startY = 260;
  const cols = 4;
  const rows = 6;

  const favMap = new Map(data.favorites.map((f) => [f.solarTerm, f]));

  for (let i = 0; i < 24; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = startX + col * badgeGapX;
    const cy = startY + row * badgeGapY;
    const solarTerm = data.solarTermOrder[i];
    const favorite = favMap.get(solarTerm);

    ctx.save();
    ctx.shadowColor = 'rgba(80,60,40,0.15)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;

    const bgGradient = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy, badgeRadius);
    if (favorite) {
      bgGradient.addColorStop(0, '#FFFAF5');
      bgGradient.addColorStop(0.7, '#FFF7ED');
      bgGradient.addColorStop(1, '#F5E6D3');
    } else {
      bgGradient.addColorStop(0, 'rgba(255,250,245,0.6)');
      bgGradient.addColorStop(1, 'rgba(245,237,227,0.4)');
    }

    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = favorite ? '#E56B5D' : '#D4C9B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeRadius - 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = favorite ? '#E56B5D' : '#B8A48C';
    ctx.font = 'bold 28px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(solarTerm, cx, cy - 25);

    if (favorite) {
      ctx.fillStyle = '#3D2914';
      ctx.font = 'bold 22px "Ma Shan Zheng", "Noto Serif SC", serif';
      ctx.fillText(favorite.dishName, cx, cy + 10);

      const rating = favorite.rating;
      const starSize = 10;
      const starGap = 6;
      const starTotalWidth = 5 * starSize * 2 + 4 * starGap;
      const starStartX = cx - starTotalWidth / 2 + starSize;

      for (let s = 0; s < 5; s++) {
        const starX = starStartX + s * (starSize * 2 + starGap);
        const starY = cy + 40;
        const isFilled = s < rating;
        drawStar(
          ctx,
          starX,
          starY,
          starSize,
          isFilled ? '#F39C12' : '#D4C9B8'
        );
      }
    } else {
      ctx.fillStyle = '#CCBBA8';
      ctx.font = '18px "Noto Serif SC", serif';
      ctx.fillText('待收藏', cx, cy + 10);
      ctx.fillText('—', cx, cy + 40);
    }
  }

  const dividerY = startY + rows * badgeGapY + 40;
  ctx.strokeStyle = 'rgba(184, 164, 140, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(100, dividerY);
  ctx.lineTo(width - 100, dividerY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(107, 83, 68, 0.8)';
  ctx.font = '24px "Noto Serif SC", serif';
  ctx.textAlign = 'left';
  ctx.fillText(`美食家：${data.userName}`, 100, dividerY + 60);

  ctx.textAlign = 'right';
  ctx.fillText(data.generatedDate, width - 100, dividerY + 60);

  ctx.fillStyle = 'rgba(184, 164, 140, 0.6)';
  ctx.font = '20px "Noto Serif SC", serif';
  ctx.textAlign = 'center';
  ctx.fillText('—— 节气食单 · 顺应时节 · 品味生活 ——', width / 2, height - 60);

  const decorations = [
    { emoji: '🌸', x: 80, y: 80, size: 32 },
    { emoji: '🍃', x: width - 80, y: 100, size: 28 },
    { emoji: '❄️', x: 80, y: height - 120, size: 26 },
    { emoji: '🍁', x: width - 80, y: height - 100, size: 30 },
    { emoji: '🌿', x: 50, y: dividerY + 30, size: 24 },
    { emoji: '🌾', x: width - 50, y: dividerY + 30, size: 24 },
  ];

  decorations.forEach((dec) => {
    ctx.font = `${dec.size}px serif`;
    ctx.globalAlpha = 0.4;
    ctx.textAlign = 'center';
    ctx.fillText(dec.emoji, dec.x, dec.y);
    ctx.globalAlpha = 1;
  });

  return canvas.toDataURL('image/png', 0.95);
}

export function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
