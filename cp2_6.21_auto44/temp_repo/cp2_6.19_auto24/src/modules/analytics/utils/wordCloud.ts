const STOP_WORDS = new Set([
  '的', '了', '和', '是', '在', '我', '有', '也', '不', '人', '都', '一', '一个',
  '上', '下', '中', '为', '以', '及', '等', '这', '那', '他', '她', '它', '们',
  '会', '要', '就', '可以', '这个', '那个', '什么', '怎么', '为什么', '因为',
  '所以', '但是', '而且', '或者', '如果', '虽然', '然后', '还有', '就是',
  '非常', '很', '比较', '更', '最', '已经', '正在', '将', '被', '把', '给',
  '让', '对', '从', '到', '与', '跟', '同', '和', '向', '由', '自', '由于',
  '啊', '哦', '呀', '吧', '呢', '吗', '嗯', '哈哈', '时候', '东西', '感觉',
  '觉得', '一点', '一些', '很多', '太多', '太少', '不错', '好的', '好', '坏',
  '能', '能够', '应该', '必须', '需要', '可能', '大概', '大约', '几乎',
  '关于', '对于', '通过', '根据', '按照', '随着', '作为', '这种', '那种',
  '会议', '本次', '大家', '我们', '你们', '他们', '问题', '方面', '内容',
  '进行', '做', '说', '看', '想', '知道', '认为', '希望', '建议', '意见',
]);

export interface WordItem {
  word: string;
  frequency: number;
  fontSize: number;
  color: string;
}

function segmentChinese(text: string): string[] {
  const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');
  const words: string[] = [];
  const engWords = cleaned.match(/[a-zA-Z]+/g) || [];
  engWords.forEach((w) => {
    if (w.length >= 2 && !STOP_WORDS.has(w.toLowerCase())) {
      words.push(w.toLowerCase());
    }
  });
  const chineseText = cleaned.replace(/[a-zA-Z0-9\s]/g, '');
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= chineseText.length - len; i++) {
      const word = chineseText.slice(i, i + len);
      if (!STOP_WORDS.has(word)) {
        words.push(word);
      }
    }
  }
  return words;
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

function interpolateColor(ratio: number): string {
  const startColor = hexToRgb('#1890ff');
  const endColor = hexToRgb('#722ed1');
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

export function generateWordCloud(texts: string[], maxWords = 30): WordItem[] {
  const frequencyMap = new Map<string, number>();
  texts.forEach((text) => {
    const words = segmentChinese(text);
    words.forEach((word) => {
      frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
    });
  });
  const sorted = Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords);
  if (sorted.length === 0) return [];
  const maxFreq = sorted[0][1];
  const minFreq = sorted[sorted.length - 1][1];
  const fontSizeRange = { min: 14, max: 42 };
  return sorted.map(([word, frequency]) => {
    const freqRatio = minFreq === maxFreq ? 0.5 : (frequency - minFreq) / (maxFreq - minFreq);
    const fontSize = fontSizeRange.min + (fontSizeRange.max - fontSizeRange.min) * freqRatio;
    const color = interpolateColor(freqRatio);
    return { word, frequency, fontSize, color };
  });
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function getScoreGradient(avgScore: number): string {
  const ratio = Math.max(0, Math.min(1, avgScore === 0 ? 0.5 : (avgScore - 1) / 4));
  const hue = 0 + 120 * ratio;
  const saturation = 0.7;
  const lightness = 0.45;
  const { r, g, b } = hslToRgb(hue / 360, saturation, lightness);
  return `linear-gradient(135deg, hsla(${hue}, ${saturation * 100}%, ${lightness * 100}%, 0.12), hsla(${hue}, ${saturation * 100}%, ${lightness * 100}%, 0.25))`;
}

export function getScoreColor(avgScore: number): string {
  const ratio = Math.max(0, Math.min(1, avgScore === 0 ? 0.5 : (avgScore - 1) / 4));
  const hue = 0 + 120 * ratio;
  const saturation = 0.7;
  const lightness = 0.45;
  return `hsl(${hue}, ${saturation * 100}%, ${lightness * 100}%)`;
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    host: '主持人',
    participant: '参会者',
    observer: '旁听',
  };
  return labels[role] || role;
}


