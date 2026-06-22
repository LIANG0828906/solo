import { getRelatedIcon } from './svgIcons';

export interface CardContent {
  id: string;
  text: string;
  iconId: string;
  themeColor: string;
}

const THEME_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
];

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function getHueDifference(hex1: string, hex2: string): number {
  const h1 = hexToHsl(hex1).h;
  const h2 = hexToHsl(hex2).h;
  let diff = Math.abs(h1 - h2);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function assignColors(count: number): string[] {
  const colors: string[] = [];
  const shuffled = shuffleArray(THEME_COLORS);
  
  if (count <= THEME_COLORS.length) {
    return shuffled.slice(0, count);
  }
  
  for (let i = 0; i < count; i++) {
    if (i < shuffled.length) {
      colors.push(shuffled[i]);
    } else {
      const prevColor = colors[i - 1];
      let bestColor = THEME_COLORS[0];
      let maxDiff = 0;
      
      for (const color of THEME_COLORS) {
        const diff = getHueDifference(prevColor, color);
        if (diff > maxDiff) {
          maxDiff = diff;
          bestColor = color;
        }
      }
      
      if (maxDiff < 90) {
        bestColor = THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)];
      }
      
      colors.push(bestColor);
    }
  }
  
  return colors;
}

function extractFirstHeading(text: string): string {
  const headingMatch = text.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  const secondMatch = text.match(/^##\s+(.+)$/m);
  if (secondMatch) {
    return secondMatch[1].trim();
  }
  
  const firstLine = text.split('\n').find(line => line.trim().length > 0);
  return firstLine ? firstLine.trim().slice(0, 20) : '内容';
}

function splitBySentences(text: string, maxChars: number): string[] {
  const sentences = text.match(/[^。！？.!?]+[。！？.!?]+/g) || [text];
  const pages: string[] = [];
  let currentPage = '';
  
  for (const sentence of sentences) {
    if (currentPage.length + sentence.length <= maxChars) {
      currentPage += sentence;
    } else {
      if (currentPage.length > 0) {
        pages.push(currentPage.trim());
      }
      currentPage = sentence;
    }
  }
  
  if (currentPage.length > 0) {
    pages.push(currentPage.trim());
  }
  
  return pages.length > 0 ? pages : [text];
}

function splitByParagraphs(text: string, maxChars: number): string[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const pages: string[] = [];
  let currentPage = '';
  
  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    
    if (trimmedPara.startsWith('#')) {
      if (currentPage.length > 0) {
        pages.push(currentPage.trim());
        currentPage = '';
      }
      
      if (trimmedPara.length > maxChars) {
        const subPages = splitBySentences(trimmedPara, maxChars);
        pages.push(...subPages);
      } else if (currentPage.length + trimmedPara.length <= maxChars) {
        currentPage += (currentPage ? '\n\n' : '') + trimmedPara;
      } else {
        pages.push(currentPage.trim());
        currentPage = trimmedPara;
      }
    } else if (currentPage.length + trimmedPara.length + 2 <= maxChars) {
      currentPage += (currentPage ? '\n\n' : '') + trimmedPara;
    } else {
      if (currentPage.length > 0) {
        pages.push(currentPage.trim());
      }
      
      if (trimmedPara.length > maxChars) {
        const subPages = splitBySentences(trimmedPara, maxChars);
        pages.push(...subPages);
        currentPage = '';
      } else {
        currentPage = trimmedPara;
      }
    }
  }
  
  if (currentPage.length > 0) {
    pages.push(currentPage.trim());
  }
  
  return pages.length > 0 ? pages : [text];
}

export function splitContent(markdown: string): CardContent[] {
  if (!markdown.trim()) {
    return [];
  }
  
  const maxCharsPerPage = 280;
  const pages = splitByParagraphs(markdown, maxCharsPerPage);
  const colors = assignColors(pages.length);
  
  const cards: CardContent[] = pages.map((text, index) => {
    const heading = extractFirstHeading(text);
    const iconId = getRelatedIcon(heading);
    
    return {
      id: `card-${index}-${Date.now()}`,
      text,
      iconId,
      themeColor: colors[index % colors.length],
    };
  });
  
  return cards;
}

export function getComplementaryColor(hex: string): string {
  const hsl = hexToHsl(hex);
  const compHue = (hsl.h + 180) % 360;
  
  const h = compHue / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
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
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
