export type FontCategory = 'serif' | 'sans-serif' | 'handwriting' | 'decorative';

export interface FontItem {
  id: string;
  name: string;
  nameCN: string;
  family: string;
  fallback: string;
  category: FontCategory;
  weights: Array<300 | 400 | 700>;
  isWebFont: boolean;
}

export const FONT_LIBRARY: FontItem[] = [
  {
    id: 'noto-serif-sc',
    name: 'Noto Serif SC',
    nameCN: '思源宋体',
    family: '"Noto Serif SC"',
    fallback: 'Georgia, "Times New Roman", serif',
    category: 'serif',
    weights: [300, 400, 700],
    isWebFont: true,
  },
  {
    id: 'songti-sc',
    name: 'SimSun',
    nameCN: '宋体',
    family: '"SimSun", "宋体"',
    fallback: 'Georgia, "Times New Roman", serif',
    category: 'serif',
    weights: [400, 700],
    isWebFont: false,
  },
  {
    id: 'fangsong-sc',
    name: 'FangSong',
    nameCN: '仿宋',
    family: '"FangSong", "仿宋"',
    fallback: 'Georgia, "Times New Roman", serif',
    category: 'serif',
    weights: [400],
    isWebFont: false,
  },
  {
    id: 'kaiti-sc',
    name: 'KaiTi',
    nameCN: '楷体',
    family: '"KaiTi", "楷体"',
    fallback: 'Georgia, "Times New Roman", serif',
    category: 'serif',
    weights: [400, 700],
    isWebFont: false,
  },
  {
    id: 'noto-sans-sc',
    name: 'Noto Sans SC',
    nameCN: '思源黑体',
    family: '"Noto Sans SC"',
    fallback: '"Microsoft YaHei", "微软雅黑", Arial, sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 700],
    isWebFont: true,
  },
  {
    id: 'yahei-sc',
    name: 'Microsoft YaHei',
    nameCN: '微软雅黑',
    family: '"Microsoft YaHei", "微软雅黑"',
    fallback: 'Arial, sans-serif',
    category: 'sans-serif',
    weights: [400, 700],
    isWebFont: false,
  },
  {
    id: 'pingfang-sc',
    name: 'PingFang SC',
    nameCN: '苹方',
    family: '"PingFang SC"',
    fallback: '"Microsoft YaHei", "微软雅黑", sans-serif',
    category: 'sans-serif',
    weights: [300, 400, 700],
    isWebFont: false,
  },
  {
    id: 'heiti-sc',
    name: 'SimHei',
    nameCN: '黑体',
    family: '"SimHei", "黑体"',
    fallback: 'Arial, sans-serif',
    category: 'sans-serif',
    weights: [400, 700],
    isWebFont: false,
  },
  {
    id: 'zcool-xiaowei',
    name: 'ZCOOL XiaoWei',
    nameCN: '站酷小薇体',
    family: '"ZCOOL XiaoWei"',
    fallback: '"KaiTi", "楷体", serif',
    category: 'handwriting',
    weights: [400],
    isWebFont: true,
  },
  {
    id: 'ma-shan-zheng',
    name: 'Ma Shan Zheng',
    nameCN: '马善政楷',
    family: '"Ma Shan Zheng"',
    fallback: '"KaiTi", "楷体", serif',
    category: 'handwriting',
    weights: [400],
    isWebFont: true,
  },
  {
    id: 'long-cang',
    name: 'Long Cang',
    nameCN: '龙藏体',
    family: '"Long Cang"',
    fallback: '"KaiTi", "楷体", serif',
    category: 'handwriting',
    weights: [400],
    isWebFont: true,
  },
  {
    id: 'liu-jian-mao-cao',
    name: 'Liu Jian Mao Cao',
    nameCN: '刘建毛草体',
    family: '"Liu Jian Mao Cao"',
    fallback: '"KaiTi", "楷体", serif',
    category: 'decorative',
    weights: [400],
    isWebFont: true,
  },
];

export const CONTRAST_MODES = {
  high: {
    id: 'high',
    label: '高对比度',
    percentage: 80,
    textColor: '#1A1A1A',
    bgColor: '#F5F0E0',
  },
  medium: {
    id: 'medium',
    label: '中对比度',
    percentage: 50,
    textColor: '#4A4A4A',
    bgColor: '#D4C9A8',
  },
  low: {
    id: 'low',
    label: '低对比度',
    percentage: 20,
    textColor: '#8B7D6B',
    bgColor: '#B8A99A',
  },
} as const;

export type ContrastModeId = keyof typeof CONTRAST_MODES;

export function getFontStack(font: FontItem): string {
  return `${font.family}, ${font.fallback}`;
}

export function findFontById(id: string): FontItem | undefined {
  return FONT_LIBRARY.find((f) => f.id === id);
}

export function getWeightValue(weight: 'light' | 'regular' | 'bold'): 300 | 400 | 700 {
  switch (weight) {
    case 'light':
      return 300;
    case 'bold':
      return 700;
    default:
      return 400;
  }
}

export function checkFontAvailability(fontFamily: string): Promise<boolean> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve(true);
  }
  return document.fonts.load(`16px ${fontFamily}`).then(
    (fonts) => fonts.length > 0,
    () => false
  );
}

export async function preloadAllWebFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return;
  }

  const webFonts = FONT_LIBRARY.filter((f) => f.isWebFont);
  const promises = webFonts.map((font) =>
    document.fonts.load(`16px ${font.family}`).catch(() => {})
  );

  await Promise.all(promises);
}
