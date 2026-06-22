export interface ImageryItem {
  keyword: string;
  category: 'landscape' | 'celestial' | 'flora' | 'fauna' | 'object' | 'weather' | 'emotion';
  confidence: number;
}

const IMAGERY_MAP: Record<string, ImageryItem> = {
  '月': { keyword: '月', category: 'celestial', confidence: 0.95 },
  '明月': { keyword: '月', category: 'celestial', confidence: 0.95 },
  '残月': { keyword: '月', category: 'celestial', confidence: 0.9 },
  '山': { keyword: '山', category: 'landscape', confidence: 0.95 },
  '青山': { keyword: '山', category: 'landscape', confidence: 0.95 },
  '远山': { keyword: '山', category: 'landscape', confidence: 0.9 },
  '空山': { keyword: '山', category: 'landscape', confidence: 0.9 },
  '水': { keyword: '水', category: 'landscape', confidence: 0.95 },
  '流水': { keyword: '水', category: 'landscape', confidence: 0.95 },
  '江水': { keyword: '水', category: 'landscape', confidence: 0.9 },
  '秋水': { keyword: '水', category: 'landscape', confidence: 0.9 },
  '花': { keyword: '花', category: 'flora', confidence: 0.9 },
  '落花': { keyword: '花', category: 'flora', confidence: 0.85 },
  '桃花': { keyword: '花', category: 'flora', confidence: 0.9 },
  '梅花': { keyword: '花', category: 'flora', confidence: 0.9 },
  '荷花': { keyword: '花', category: 'flora', confidence: 0.9 },
  '鸟': { keyword: '鸟', category: 'fauna', confidence: 0.9 },
  '飞鸟': { keyword: '鸟', category: 'fauna', confidence: 0.95 },
  '归鸟': { keyword: '鸟', category: 'fauna', confidence: 0.9 },
  '舟': { keyword: '舟', category: 'object', confidence: 0.9 },
  '孤舟': { keyword: '舟', category: 'object', confidence: 0.95 },
  '扁舟': { keyword: '舟', category: 'object', confidence: 0.9 },
  '渔舟': { keyword: '舟', category: 'object', confidence: 0.9 },
  '竹': { keyword: '竹', category: 'flora', confidence: 0.9 },
  '竹叶': { keyword: '竹', category: 'flora', confidence: 0.9 },
  '修竹': { keyword: '竹', category: 'flora', confidence: 0.9 },
  '云': { keyword: '云', category: 'weather', confidence: 0.9 },
  '白云': { keyword: '云', category: 'weather', confidence: 0.9 },
  '浮云': { keyword: '云', category: 'weather', confidence: 0.9 },
  '云雾': { keyword: '云', category: 'weather', confidence: 0.9 },
  '雾': { keyword: '雾', category: 'weather', confidence: 0.85 },
  '烟': { keyword: '烟', category: 'weather', confidence: 0.85 },
  '烟雨': { keyword: '烟', category: 'weather', confidence: 0.85 },
  '风': { keyword: '风', category: 'weather', confidence: 0.8 },
  '清风': { keyword: '风', category: 'weather', confidence: 0.8 },
  '秋风': { keyword: '风', category: 'weather', confidence: 0.85 },
  '春风': { keyword: '风', category: 'weather', confidence: 0.8 },
  '雨': { keyword: '雨', category: 'weather', confidence: 0.85 },
  '细雨': { keyword: '雨', category: 'weather', confidence: 0.85 },
  '夜雨': { keyword: '雨', category: 'weather', confidence: 0.85 },
  '雪': { keyword: '雪', category: 'weather', confidence: 0.9 },
  '暮雪': { keyword: '雪', category: 'weather', confidence: 0.9 },
  '飞雪': { keyword: '雪', category: 'weather', confidence: 0.9 },
  '日': { keyword: '日', category: 'celestial', confidence: 0.8 },
  '夕阳': { keyword: '日', category: 'celestial', confidence: 0.9 },
  '落日': { keyword: '日', category: 'celestial', confidence: 0.9 },
  '斜阳': { keyword: '日', category: 'celestial', confidence: 0.85 },
  '星': { keyword: '星', category: 'celestial', confidence: 0.85 },
  '星辰': { keyword: '星', category: 'celestial', confidence: 0.85 },
  '繁星': { keyword: '星', category: 'celestial', confidence: 0.85 },
  '树': { keyword: '树', category: 'flora', confidence: 0.8 },
  '松': { keyword: '松', category: 'flora', confidence: 0.9 },
  '古松': { keyword: '松', category: 'flora', confidence: 0.9 },
  '柳': { keyword: '柳', category: 'flora', confidence: 0.9 },
  '垂柳': { keyword: '柳', category: 'flora', confidence: 0.9 },
  '石': { keyword: '石', category: 'landscape', confidence: 0.8 },
  '岩石': { keyword: '石', category: 'landscape', confidence: 0.8 },
  '桥': { keyword: '桥', category: 'object', confidence: 0.85 },
  '小桥': { keyword: '桥', category: 'object', confidence: 0.85 },
  '亭': { keyword: '亭', category: 'object', confidence: 0.85 },
  '孤亭': { keyword: '亭', category: 'object', confidence: 0.85 },
  '楼': { keyword: '楼', category: 'object', confidence: 0.8 },
  '钟': { keyword: '钟', category: 'object', confidence: 0.75 },
  '寺': { keyword: '寺', category: 'object', confidence: 0.8 },
  '古寺': { keyword: '寺', category: 'object', confidence: 0.85 },
  '愁': { keyword: '愁', category: 'emotion', confidence: 0.7 },
  '思': { keyword: '思', category: 'emotion', confidence: 0.7 },
  '故乡': { keyword: '思', category: 'emotion', confidence: 0.7 },
  '酒': { keyword: '酒', category: 'object', confidence: 0.75 },
  '茶': { keyword: '茶', category: 'object', confidence: 0.75 },
};

function splitPoemLines(poem: string): string[] {
  return poem
    .split(/[，。！？；、\n,.\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function extractImagery(poem: string): ImageryItem[] {
  const lines = splitPoemLines(poem);
  const found: Map<string, ImageryItem> = new Map();

  const sortedKeys = Object.keys(IMAGERY_MAP).sort((a, b) => b.length - a.length);

  for (const line of lines) {
    let remaining = line;
    while (remaining.length > 0) {
      let matched = false;
      for (const key of sortedKeys) {
        if (remaining.startsWith(key)) {
          const item = IMAGERY_MAP[key];
          if (!found.has(item.keyword)) {
            found.set(item.keyword, { ...item });
          }
          remaining = remaining.slice(key.length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        remaining = remaining.slice(1);
      }
    }
  }

  return Array.from(found.values()).sort((a, b) => b.confidence - a.confidence);
}

export function extractTitle(poem: string): string {
  const firstLine = poem.split(/[，。！？；\n]/)[0].trim();
  return firstLine.length > 7 ? firstLine.slice(0, 7) : firstLine;
}

export function getImageryHash(imagery: string[]): string {
  return imagery.map((i) => `#${i}`).join('');
}
