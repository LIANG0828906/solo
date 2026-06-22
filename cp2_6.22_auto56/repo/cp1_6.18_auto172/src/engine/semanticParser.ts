export interface ImageryData {
  id: string;
  keyword: string;
  color: string;
  position: { x: number; y: number; z: number };
  particleCount: number;
  motionParams: {
    amplitude: number;
    periodMin: number;
    periodMax: number;
  };
  emotionTags: string[];
  textSnippet: string;
}

interface KeywordMapping {
  keywords: string[];
  color: string;
  motion: {
    amplitude: number;
    periodMin: number;
    periodMax: number;
  };
  emotions: string[];
}

const keywordMappings: KeywordMapping[] = [
  {
    keywords: ['森林', '树林', '树', '丛林', '密林', '森林里', '森林中', '树木', '绿荫', '林间'],
    color: '#2E8B57',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['宁静', '神秘', '生机']
  },
  {
    keywords: ['湖泊', '湖', '水', '水面', '湖水', '池塘', '水潭', '溪流', '河流', '江水', '海边', '海洋', '大海', '波浪'],
    color: '#4682B4',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['平静', '深邃', '流动']
  },
  {
    keywords: ['星辰', '星星', '星空', '星光', '银河', '夜空', '星', '繁星', '流星', '星座'],
    color: '#FFD700',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['璀璨', '梦幻', '希望']
  },
  {
    keywords: ['迷雾', '雾', '雾气', '烟雾', '薄雾', '浓雾', '云雾', '烟', '霾', '朦胧'],
    color: '#C0C0C0',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['朦胧', '迷茫', '诗意']
  },
  {
    keywords: ['月亮', '月', '月光', '明月', '圆月', '残月', '月色'],
    color: '#F0E68C',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['温柔', '思念', '静谧']
  },
  {
    keywords: ['太阳', '阳光', '日光', '晨光', '夕阳', '朝阳', '落日', '日出', '光', '光芒'],
    color: '#FF8C00',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['温暖', '明亮', '希望']
  },
  {
    keywords: ['花', '花朵', '鲜花', '花园', '花瓣', '玫瑰', '花海', '花丛'],
    color: '#FF69B4',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['美丽', '芬芳', '甜蜜']
  },
  {
    keywords: ['山', '山峰', '山脉', '高山', '山谷', '山峦', '雪山', '青山'],
    color: '#708090',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['巍峨', '沉稳', '壮阔']
  },
  {
    keywords: ['雨', '雨水', '下雨', '雨滴', '春雨', '细雨', '暴雨'],
    color: '#87CEEB',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['清凉', '惆怅', '洗涤']
  },
  {
    keywords: ['雪', '雪花', '雪地', '白雪', '冰雪', '下雪', '冬雪'],
    color: '#FFFAFA',
    motion: { amplitude: 0.5, periodMin: 3, periodMax: 5 },
    emotions: ['纯洁', '寒冷', '宁静']
  },
  {
    keywords: ['风', '微风', '清风', '大风', '狂风', '春风'],
    color: '#98FB98',
    motion: { amplitude: 0.6, periodMin: 2.5, periodMax: 4 },
    emotions: ['自由', '轻盈', '流动']
  },
  {
    keywords: ['云', '云朵', '云彩', '白云', '乌云', '云海'],
    color: '#DDA0DD',
    motion: { amplitude: 0.55, periodMin: 4, periodMax: 6 },
    emotions: ['飘逸', '梦幻', '柔软']
  },
  {
    keywords: ['火', '火焰', '火光', '烈火', '篝火', '烟火', '火花'],
    color: '#FF4500',
    motion: { amplitude: 0.6, periodMin: 2, periodMax: 3.5 },
    emotions: ['热烈', '激情', '光明']
  },
  {
    keywords: ['梦', '梦境', '幻想', '幻影', '幻境', '虚幻'],
    color: '#9370DB',
    motion: { amplitude: 0.55, periodMin: 3.5, periodMax: 5.5 },
    emotions: ['虚幻', '神奇', '迷离']
  },
  {
    keywords: ['回忆', '记忆', '往事', '过去', '小时候', '童年', '旧时光'],
    color: '#DEB887',
    motion: { amplitude: 0.45, periodMin: 4, periodMax: 6 },
    emotions: ['怀旧', '温馨', '感慨']
  }
];

const fallbackColors = [
  '#6B8E23', '#8B4513', '#4169E1', '#9932CC', '#20B2AA',
  '#DC143C', '#00CED1', '#FF1493', '#7FFF00', '#BA55D3'
];

function generateId(): string {
  return 'img_' + Math.random().toString(36).substr(2, 9);
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 100, g: 100, b: 100 };
}

export function getColorHex(color: string): number {
  return parseInt(color.replace('#', ''), 16);
}

export function getColorRgb(color: string): { r: number; g: number; b: number } {
  return hexToRgb(color);
}

export function parseInputText(inputText: string): ImageryData[] {
  const results: ImageryData[] = [];
  const usedPositions: { x: number; z: number }[] = [];
  const foundKeywords = new Set<string>();

  const sentences = inputText.split(/[。！？.!?，,;；]/).filter(s => s.trim().length > 0);

  for (const mapping of keywordMappings) {
    for (const keyword of mapping.keywords) {
      if (inputText.includes(keyword) && !foundKeywords.has(mapping.color)) {
        foundKeywords.add(mapping.color);

        let textSnippet = '';
        for (const sentence of sentences) {
          if (sentence.includes(keyword)) {
            textSnippet = sentence.trim();
            break;
          }
        }
        if (!textSnippet) {
          const idx = inputText.indexOf(keyword);
          const start = Math.max(0, idx - 10);
          const end = Math.min(inputText.length, idx + keyword.length + 10);
          textSnippet = (start > 0 ? '...' : '') + inputText.slice(start, end) + (end < inputText.length ? '...' : '');
        }

        const pos = generateNonOverlappingPosition(usedPositions);
        usedPositions.push({ x: pos.x, z: pos.z });

        results.push({
          id: generateId(),
          keyword,
          color: mapping.color,
          position: {
            x: pos.x,
            y: randomRange(1, 4),
            z: pos.z
          },
          particleCount: Math.floor(randomRange(1000, 5001)),
          motionParams: {
            amplitude: mapping.motion.amplitude,
            periodMin: mapping.motion.periodMin,
            periodMax: mapping.motion.periodMax
          },
          emotionTags: mapping.emotions,
          textSnippet
        });

        break;
      }
    }
  }

  if (results.length === 0 && inputText.trim().length > 0) {
    const fallbackColor = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
    const pos = generateNonOverlappingPosition(usedPositions);

    results.push({
      id: generateId(),
      keyword: '梦境',
      color: fallbackColor,
      position: {
        x: pos.x,
        y: randomRange(1, 4),
        z: pos.z
      },
      particleCount: Math.floor(randomRange(1500, 4001)),
      motionParams: {
        amplitude: 0.5,
        periodMin: 3,
        periodMax: 5
      },
      emotionTags: ['独特', '私密', '内心'],
      textSnippet: inputText.length > 40 ? inputText.slice(0, 40) + '...' : inputText
    });
  }

  let totalParticles = results.reduce((sum, r) => sum + r.particleCount, 0);
  const maxTotal = 30000;
  if (totalParticles > maxTotal) {
    const ratio = maxTotal / totalParticles;
    for (const r of results) {
      r.particleCount = Math.max(500, Math.floor(r.particleCount * ratio));
    }
  }

  return results;
}

function generateNonOverlappingPosition(
  used: { x: number; z: number }[]
): { x: number; z: number } {
  const minDistance = 12;
  const maxAttempts = 50;
  const range = 18;

  for (let i = 0; i < maxAttempts; i++) {
    const x = randomRange(-range, range);
    const z = randomRange(-range, range);

    let valid = true;
    for (const p of used) {
      const dx = x - p.x;
      const dz = z - p.z;
      if (Math.sqrt(dx * dx + dz * dz) < minDistance) {
        valid = false;
        break;
      }
    }

    if (valid) {
      return { x, z };
    }
  }

  const angle = (used.length * 2 * Math.PI) / Math.max(8, used.length);
  const radius = minDistance + used.length * 2;
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius
  };
}
