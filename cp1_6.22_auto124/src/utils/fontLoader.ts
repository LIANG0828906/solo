export interface FontInfo {
  family: string;
  label: string;
  weights: number[];
  category: 'sans-serif' | 'serif' | 'handwriting' | 'display';
}

const FONT_LIST: FontInfo[] = [
  { family: 'Noto Sans SC', label: 'Noto Sans SC (思源黑体)', weights: [300, 400, 700], category: 'sans-serif' },
  { family: 'Noto Serif SC', label: 'Noto Serif SC (思源宋体)', weights: [300, 400, 700], category: 'serif' },
  { family: 'Roboto', label: 'Roboto', weights: [300, 400, 700], category: 'sans-serif' },
  { family: 'Open Sans', label: 'Open Sans', weights: [300, 400, 700], category: 'sans-serif' },
  { family: 'Lato', label: 'Lato', weights: [300, 400, 700], category: 'sans-serif' },
  { family: 'Montserrat', label: 'Montserrat', weights: [300, 400, 700], category: 'sans-serif' },
  { family: 'Noto Sans TC', label: 'Noto Sans TC (繁体黑体)', weights: [300, 400, 700], category: 'sans-serif' },
  { family: 'Noto Serif TC', label: 'Noto Serif TC (繁体宋体)', weights: [300, 400, 700], category: 'serif' },
  { family: 'LXGW WenKai', label: 'LXGW WenKai (霞鹜文楷)', weights: [300, 400, 700], category: 'handwriting' },
  { family: 'ZCOOL XiaoWei', label: 'ZCOOL XiaoWei (站酷小薇)', weights: [400], category: 'display' },
  { family: 'ZCOOL QingKe HuangYou', label: 'ZCOOL QingKe HuangYou (站酷庆科黄油)', weights: [400], category: 'display' },
  { family: 'Ma Shan Zheng', label: 'Ma Shan Zheng (马善政楷体)', weights: [400], category: 'handwriting' },
];

let loadedFonts: Set<string> = new Set();

function buildGoogleFontsUrl(fonts: FontInfo[]): string {
  const params = fonts.map(f => {
    const weights = f.weights.join(';');
    return `family=${f.family.replace(/ /g, '+')}:wght@${weights}`;
  });
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}

export async function loadAllFonts(): Promise<void> {
  const url = buildGoogleFontsUrl(FONT_LIST);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);

  return new Promise((resolve) => {
    link.onload = () => {
      FONT_LIST.forEach(f => loadedFonts.add(f.family));
      resolve();
    };
    link.onerror = () => {
      FONT_LIST.forEach(f => loadedFonts.add(f.family));
      resolve();
    };
    setTimeout(() => {
      FONT_LIST.forEach(f => loadedFonts.add(f.family));
      resolve();
    }, 2000);
  });
}

export function getFontList(): FontInfo[] {
  return FONT_LIST;
}

export function isFontLoaded(family: string): boolean {
  return loadedFonts.has(family);
}
