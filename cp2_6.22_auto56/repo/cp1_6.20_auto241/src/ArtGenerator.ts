export interface ColorTheme {
  start: string;
  end: string;
}

export interface PoemLine {
  text: string;
  sentiment: 'positive' | 'negative';
  colorTheme: ColorTheme;
  index: number;
}

const POSITIVE_KEYWORDS = [
  '春', '花', '笑', '暖', '阳', '光', '喜', '乐', '福', '美',
  '好', '甜', '香', '明', '晴', '歌', '舞', '欢', '辉', '灿',
  '荣', '盛', '茂', '丰', '丽', '秀', '清', '朗', '温', '柔',
  '爱', '恋', '梦', '星', '月', '云', '风', '翠', '碧', '金',
  '锦', '瑞', '安', '宁', '和', '祥', '吉', '庆', '悦', '欣',
  'hope', 'joy', 'love', 'light', 'sun', 'bright', 'warm', 'sweet',
  'smile', 'bloom', 'dream', 'star', 'dawn', 'peace', 'gentle',
  'happy', 'grace', 'bliss', 'radiant', 'serene', 'golden', 'dear',
]

const NEGATIVE_KEYWORDS = [
  '愁', '泪', '寒', '孤', '凉', '悲', '苦', '恨', '怨', '哀',
  '忧', '伤', '痛', '凄', '惨', '暗', '暮', '残', '败', '落',
  '枯', '凋', '零', '散', '离', '别', '断', '碎', '灭', '亡',
  '死', '荒', '寂', '默', '沉', '闷', '窒息', '绝', '穷', '困',
  '倦', '疲', '懒', '废', '旧', '锈', '尘', '灰', '黑', '冷',
  'sorrow', 'tear', 'cold', 'lonely', 'grief', 'pain', 'dark', 'loss',
  'fear', 'fade', 'wither', 'ruin', 'despair', 'mourn', 'bleak',
  'regret', 'ache', 'void', 'shadow', 'decay', 'broken', 'gloomy',
]

export function analyzeSentiment(text: string): 'positive' | 'negative' {
  let positiveScore = 0;
  let negativeScore = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (text.includes(keyword)) positiveScore++;
  }
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (text.includes(keyword)) negativeScore++;
  }

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return Math.random() > 0.5 ? 'positive' : 'negative';
}

export function getColorTheme(sentiment: 'positive' | 'negative'): ColorTheme {
  if (sentiment === 'positive') {
    return { start: '#ff6b6b', end: '#ffd93d' };
  }
  return { start: '#6c5ce7', end: '#74b9ff' };
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

function lerpColor(
  start: ColorTheme,
  end: ColorTheme,
  t: number
): { r: number; g: number; b: number } {
  const s = hexToRgb(t < 0.5 ? start.start : start.end);
  const e = hexToRgb(t < 0.5 ? end.start : end.end);
  const localT = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  return {
    r: Math.round(s.r + (e.r - s.r) * localT),
    g: Math.round(s.g + (e.g - s.g) * localT),
    b: Math.round(s.b + (e.b - s.b) * localT),
  };
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x - size * 0.866, y + size * 0.5);
  ctx.lineTo(x + size * 0.866, y + size * 0.5);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.6, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.6, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: ColorTheme,
  rand: () => number,
  density: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    if (rand() < density) {
      const t = rand();
      const c = lerpColor(theme, theme, t);
      const noiseAlpha = rand() * 0.15;
      data[i] = Math.min(255, data[i] + c.r * noiseAlpha);
      data[i + 1] = Math.min(255, data[i + 1] + c.g * noiseAlpha);
      data[i + 2] = Math.min(255, data[i + 2] + c.b * noiseAlpha);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function generateArt(
  line: string,
  colorTheme: ColorTheme,
  index: number
): string {
  const WIDTH = 280;
  const HEIGHT = 280;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  let hash = 0;
  for (let i = 0; i < line.length; i++) {
    const char = line.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const rand = seededRandom(Math.abs(hash) + index * 1000 + 1);

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, colorTheme.start + '33');
  gradient.addColorStop(1, colorTheme.end + '33');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  gradient.addColorStop(0, colorTheme.start + '22');
  gradient.addColorStop(1, colorTheme.end + '22');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const bgGrad = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    20,
    WIDTH / 2,
    HEIGHT / 2,
    WIDTH * 0.7
  );
  bgGrad.addColorStop(0, colorTheme.start + '15');
  bgGrad.addColorStop(1, colorTheme.end + '10');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const shapeCount = 6 + Math.floor(rand() * 8);
  const shapeColors = [colorTheme.start, colorTheme.end];

  for (let i = 0; i < shapeCount; i++) {
    const shapeType = Math.floor(rand() * 3);
    const x = rand() * WIDTH;
    const y = rand() * HEIGHT;
    const size = 15 + rand() * 50;
    const alpha = 0.2 + rand() * 0.5;
    const colorIdx = Math.floor(rand() * shapeColors.length);
    const color = shapeColors[colorIdx];

    switch (shapeType) {
      case 0:
        drawCircle(ctx, x, y, size, color, alpha);
        break;
      case 1:
        drawTriangle(ctx, x, y, size, color, alpha);
        break;
      case 2:
        drawDiamond(ctx, x, y, size, color, alpha);
        break;
    }
  }

  for (let i = 0; i < 3; i++) {
    const cx = rand() * WIDTH;
    const cy = rand() * HEIGHT;
    const r = 30 + rand() * 80;
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const colorIdx = Math.floor(rand() * shapeColors.length);
    radGrad.addColorStop(0, shapeColors[colorIdx] + '40');
    radGrad.addColorStop(1, shapeColors[colorIdx] + '00');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawNoise(ctx, WIDTH, HEIGHT, colorTheme, rand, 0.05);

  for (let i = 0; i < 4; i++) {
    const lx = rand() * WIDTH;
    const ly = rand() * HEIGHT;
    const ex = lx + (rand() - 0.5) * 120;
    const ey = ly + (rand() - 0.5) * 120;
    ctx.save();
    ctx.globalAlpha = 0.15 + rand() * 0.2;
    ctx.strokeStyle = shapeColors[Math.floor(rand() * shapeColors.length)];
    ctx.lineWidth = 1 + rand() * 2;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.quadraticCurveTo(
      lx + (rand() - 0.5) * 80,
      ly + (rand() - 0.5) * 80,
      ex,
      ey
    );
    ctx.stroke();
    ctx.restore();
  }

  drawNoise(ctx, WIDTH, HEIGHT, colorTheme, rand, 0.02);

  return canvas.toDataURL('image/png');
}
