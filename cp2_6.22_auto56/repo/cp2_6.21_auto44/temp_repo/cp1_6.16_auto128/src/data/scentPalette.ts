import type { ScentEntry, ColorTexture, ScentCategory, EmotionTag } from '../types';

export const SCENT_PALETTE: string[] = [
  '#FF6B6B', '#FF8E72', '#FFA07A', '#FFB347', '#FFCC5C',
  '#F4A261', '#E9C46A', '#D4A574', '#C9A86C', '#B8860B',
  '#00D2FF', '#4ECDC4', '#7FDBDA', '#98D8C8', '#A8E6CF',
  '#88D8B0', '#6BCB77', '#4D96FF', '#6C5B7B', '#9B59B6',
  '#C06C84', '#E94560', '#FFB6C1', '#DDA0DD', '#DDA0DD',
  '#F8B500', '#FFD93D', '#6BCB77', '#95E1D3', '#AA96DA',
];

export const PATTERNS: Record<string, string> = {
  stripes: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)',
  dots: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
  horizontal: 'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 12px)',
  vertical: 'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 12px)',
  diagonal: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 10px)',
  radial: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 50%)',
  crosshatch: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 8px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 8px)',
};

const pickColors = (count: number, seed?: number): string[] => {
  const result: string[] = [];
  const shuffled = [...SCENT_PALETTE];
  const s = seed || Date.now();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor((Math.sin(s + i) * 0.5 + 0.5) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  for (let i = 0; i < count && i < shuffled.length; i++) {
    result.push(shuffled[i]);
  }
  return result;
};

const makeTexture = (patternKey: string, seed?: number): ColorTexture => {
  const count = 4 + Math.floor(((seed || Date.now()) % 100) / 34);
  return {
    colors: pickColors(count, seed),
    pattern: PATTERNS[patternKey] || PATTERNS.stripes,
  };
};

export const SCENT_DICTIONARY: ScentEntry[] = [
  { keywords: ['泥土', '土壤', '雨后', '潮湿'], category: 'environment', emotionTag: 'fresh', colorTexture: makeTexture('horizontal', 1) },
  { keywords: ['草', '草地', '青草'], category: 'environment', emotionTag: 'fresh', colorTexture: makeTexture('stripes', 2) },
  { keywords: ['海', '海风', '咸', '海洋'], category: 'environment', emotionTag: 'fresh', colorTexture: makeTexture('radial', 3) },
  { keywords: ['雨', '下雨', '湿润'], category: 'environment', emotionTag: 'nostalgic', colorTexture: makeTexture('dots', 4) },
  { keywords: ['雪', '寒冷', '冬天'], category: 'environment', emotionTag: 'fresh', colorTexture: makeTexture('diagonal', 5) },
  { keywords: ['森林', '树', '树叶'], category: 'environment', emotionTag: 'fresh', colorTexture: makeTexture('crosshatch', 6) },
  { keywords: ['烟', '火', '壁炉'], category: 'environment', emotionTag: 'nostalgic', colorTexture: makeTexture('radial', 7) },
  { keywords: ['灰尘', '旧', '老'], category: 'environment', emotionTag: 'nostalgic', colorTexture: makeTexture('horizontal', 8) },

  { keywords: ['玫瑰', '月季'], category: 'floral', emotionTag: 'joyful', colorTexture: makeTexture('dots', 9) },
  { keywords: ['茉莉', '素馨'], category: 'floral', emotionTag: 'joyful', colorTexture: makeTexture('stripes', 10) },
  { keywords: ['桂花', '木犀'], category: 'floral', emotionTag: 'nostalgic', colorTexture: makeTexture('radial', 11) },
  { keywords: ['薰衣草', '紫'], category: 'floral', emotionTag: 'oppressive', colorTexture: makeTexture('diagonal', 12) },
  { keywords: ['樱花', '樱'], category: 'floral', emotionTag: 'joyful', colorTexture: makeTexture('crosshatch', 13) },
  { keywords: ['百合', '莲花'], category: 'floral', emotionTag: 'fresh', colorTexture: makeTexture('vertical', 14) },
  { keywords: ['丁香', '紫丁香'], category: 'floral', emotionTag: 'nostalgic', colorTexture: makeTexture('dots', 15) },
  { keywords: ['梅花', '腊梅'], category: 'floral', emotionTag: 'nostalgic', colorTexture: makeTexture('stripes', 16) },

  { keywords: ['面包', '烘焙', '吐司'], category: 'food', emotionTag: 'joyful', colorTexture: makeTexture('horizontal', 17) },
  { keywords: ['黄油', '奶油'], category: 'food', emotionTag: 'joyful', colorTexture: makeTexture('radial', 18) },
  { keywords: ['咖啡', '咖啡因', 'espresso'], category: 'food', emotionTag: 'nostalgic', colorTexture: makeTexture('crosshatch', 19) },
  { keywords: ['巧克力', '可可'], category: 'food', emotionTag: 'joyful', colorTexture: makeTexture('diagonal', 20) },
  { keywords: ['糖', '甜', '蜂蜜'], category: 'food', emotionTag: 'joyful', colorTexture: makeTexture('dots', 21) },
  { keywords: ['焦糖', '太妃'], category: 'food', emotionTag: 'nostalgic', colorTexture: makeTexture('stripes', 22) },
  { keywords: ['水果', '苹果', '橙'], category: 'food', emotionTag: 'fresh', colorTexture: makeTexture('vertical', 23) },
  { keywords: ['香料', '肉桂', '八角'], category: 'food', emotionTag: 'nostalgic', colorTexture: makeTexture('radial', 24) },

  { keywords: ['木', '木头', '雪松', '松木'], category: 'woody', emotionTag: 'nostalgic', colorTexture: makeTexture('horizontal', 25) },
  { keywords: ['檀香', '沉香'], category: 'woody', emotionTag: 'oppressive', colorTexture: makeTexture('crosshatch', 26) },
  { keywords: ['竹子', '竹'], category: 'woody', emotionTag: 'fresh', colorTexture: makeTexture('vertical', 27) },
  { keywords: ['皮革', '皮'], category: 'woody', emotionTag: 'nostalgic', colorTexture: makeTexture('diagonal', 28) },
  { keywords: ['琥珀', '树脂'], category: 'woody', emotionTag: 'nostalgic', colorTexture: makeTexture('dots', 29) },
  { keywords: ['广藿香', '藿香'], category: 'woody', emotionTag: 'oppressive', colorTexture: makeTexture('stripes', 30) },
];

export const POEMS: string[] = [
  '风穿过旧巷，带来桂花酿的甜香，那是祖母在的秋天。',
  '雨后泥土的呼吸，像童年某个被遗忘的午后。',
  '海风中咸涩的味道，是那年夏天说不出口的告别。',
  '烘焙店里飘出的黄油香，温暖了整个冬天的清晨。',
  '雪落下来的时候，世界安静得像一首未完成的诗。',
  '老书的油墨味，藏着祖父读过的整个世纪。',
  '玫瑰开在六月的黄昏，空气里全是欲言又止的温柔。',
  '咖啡的苦味里，有深夜独自清醒的清醒。',
  '森林深处的松针气息，是大地最古老的呼吸。',
  '糖炒栗子的香气飘来时，我就知道年关近了。',
  '薰衣草田的紫色梦境，让人想起遥远的普罗旺斯。',
  '雨水打在青石板上，混合着青苔的味道，是江南。',
  '焦糖融化的甜，像极了初恋时笨拙的吻。',
  '皮革和旧木头的香气，是父亲书房里的时光。',
  '茉莉在夜里悄悄开放，花香潜入梦的缝隙。',
  '篝火噼啪作响，烟雾中是青春最放肆的笑声。',
  '刚晒过的被子，有阳光和妈妈的味道。',
  '冷冽的空气里有雪的味道，新年要来了。',
  '巧克力融化在舌尖，甜和苦都刚刚好。',
  '樱花飘落的速度，是秒速五厘米的温柔。',
  '檀香缭绕，时间在佛前慢了下来。',
  '水果摊的西瓜味，切开了整个盛夏。',
  '旧皮箱的味道，装满了远行的故事。',
  '丁香花的四角天空，是十八岁的忧愁。',
  '刚出炉的面包香，是街角最幸福的等候。',
  '竹林深处的清风，带着竹叶的淡淡苦涩。',
  '琥珀色的酒里，有岁月沉淀的香。',
  '梅子黄时雨，空气里全是潮湿的想念。',
  '广藿香的沉郁，是秋天最后的叹息。',
  '所有气味都是一把钥匙，打开某扇被遗忘的门。',
];

export const SCENE_IMAGES: string[] = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=misty%20mountain%20landscape%20at%20sunrise%20with%20pine%20trees%20and%20soft%20golden%20light&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=autumn%20park%20with%20fallen%20leaves%20golden%20orange%20trees%20cozy%20atmosphere&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rainy%20city%20street%20at%20night%20neon%20lights%20reflection%20on%20wet%20pavement&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cherry%20blossom%20garden%20in%20spring%20soft%20pink%20petals%20serene%20japanese&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cozy%20bakery%20shop%20window%20warm%20light%20fresh%20bread%20pastries&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=winter%20forest%20snow%20covered%20trees%20frosty%20blue%20morning%20light&image_size=landscape_16_9',
];

export const findScentEntry = (text: string): ScentEntry | null => {
  const lowerText = text.toLowerCase();
  for (const entry of SCENT_DICTIONARY) {
    for (const keyword of entry.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return entry;
      }
    }
  }
  return null;
};

export const getLastKeyword = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const separators = /[，。、\s,.;:]+/;
  const parts = trimmed.split(separators).filter(Boolean);
  return parts[parts.length - 1] || '';
};

export const getRandomPoem = (): string => {
  return POEMS[Math.floor(Math.random() * POEMS.length)];
};

export const getRandomSceneImage = (): string => {
  return SCENE_IMAGES[Math.floor(Math.random() * SCENE_IMAGES.length)];
};

export const getRandomColorTexture = (emotionTag?: EmotionTag): ColorTexture => {
  const patternKeys = Object.keys(PATTERNS);
  const pattern = PATTERNS[patternKeys[Math.floor(Math.random() * patternKeys.length)]];
  const count = 4 + Math.floor(Math.random() * 2);
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(SCENT_PALETTE[Math.floor(Math.random() * SCENT_PALETTE.length)]);
  }
  return { colors, pattern };
};

export const getDefaultCategory = (): ScentCategory => 'environment';
export const getDefaultEmotion = (): EmotionTag => 'nostalgic';
