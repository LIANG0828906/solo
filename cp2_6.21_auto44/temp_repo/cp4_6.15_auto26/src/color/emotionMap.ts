const EMOTION_MAP = [
  { emotion: '愤怒', hueStart: 345, hueEnd: 15, satThresh: 60, lightThresh: 30, desc: '强烈的情绪波动' },
  { emotion: '热情', hueStart: 15, hueEnd: 40, satThresh: 50, lightThresh: 40, desc: '充满活力与激情' },
  { emotion: '活力', hueStart: 40, hueEnd: 60, satThresh: 50, lightThresh: 45, desc: '精力充沛的状态' },
  { emotion: '快乐', hueStart: 50, hueEnd: 75, satThresh: 50, lightThresh: 55, desc: '阳光般的愉悦' },
  { emotion: '希望', hueStart: 75, hueEnd: 150, satThresh: 40, lightThresh: 40, desc: '充满期待与向往' },
  { emotion: '平静', hueStart: 150, hueEnd: 210, satThresh: 30, lightThresh: 35, desc: '安宁与平和' },
  { emotion: '放松', hueStart: 180, hueEnd: 220, satThresh: 35, lightThresh: 45, desc: '舒缓自在' },
  { emotion: '忧郁', hueStart: 220, hueEnd: 260, satThresh: 40, lightThresh: 30, desc: '淡淡的忧伤' },
  { emotion: '沉思', hueStart: 240, hueEnd: 280, satThresh: 30, lightThresh: 25, desc: '深入思考的状态' },
  { emotion: '神秘', hueStart: 270, hueEnd: 310, satThresh: 40, lightThresh: 30, desc: '难以捉摸的感觉' },
  { emotion: '浪漫', hueStart: 310, hueEnd: 345, satThresh: 45, lightThresh: 45, desc: '温柔而甜蜜' },
];

export interface EmotionEntry {
  emotion: string;
  description: string;
}

export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function isHueInRange(hue: number, start: number, end: number): boolean {
  if (start > end) {
    return hue >= start || hue <= end;
  }
  return hue >= start && hue <= end;
}

export function getEmotionByColor(hex: string): EmotionEntry {
  const { h, s, l } = hexToHSL(hex);

  if (s < 10) {
    if (l < 20) return { emotion: '压抑', description: '沉重与窒息感' };
    if (l > 80) return { emotion: '空白', description: '空灵而无感' };
    return { emotion: '平淡', description: '波澜不惊' };
  }

  for (const entry of EMOTION_MAP) {
    if (isHueInRange(h, entry.hueStart, entry.hueEnd) && s >= entry.satThresh * 0.5) {
      return { emotion: entry.emotion, description: entry.description };
    }
  }

  return { emotion: '复杂', description: '难以名状的感受' };
}

export function calculateIntensity(hex: string): number {
  const { h, s, l } = hexToHSL(hex);
  const saturationFactor = s / 100;
  const lightnessFactor = 1 - Math.abs(l - 50) / 50;
  return Math.round((saturationFactor * 0.6 + lightnessFactor * 0.4) * 100);
}

export function isWarmColor(hex: string): boolean {
  const { h } = hexToHSL(hex);
  return h < 60 || h > 300;
}

export function getEmotionEmoji(emotion: string): string {
  const emojiMap: Record<string, string> = {
    '愤怒': '🔥', '热情': '💫', '活力': '⚡', '快乐': '☀️',
    '希望': '🌱', '平静': '🌊', '放松': '🍃', '忧郁': '🌧️',
    '沉思': '🦉', '神秘': '🔮', '浪漫': '🌹', '压抑': '🌑',
    '空白': '☁️', '平淡': '🌫️', '复杂': '🌀',
  };
  return emojiMap[emotion] || '🎨';
}
