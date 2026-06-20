import ColorThief from 'colorthief';
import type { ColorInfo } from '@/types';

declare module 'colorthief' {
  class ColorThief {
    constructor();
    getPalette(image: HTMLImageElement, colorCount?: number, quality?: number): [number, number, number][];
    getColor(image: HTMLImageElement, quality?: number): [number, number, number];
  }
  export default ColorThief;
}

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (l1: number, l2: number): number => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const extractColors = async (imageUrl: string): Promise<ColorInfo[]> => {
  try {
    const img = await loadImage(imageUrl);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    
    const maxWidth = 200;
    const scale = maxWidth / img.width;
    canvas.width = maxWidth;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const resizedUrl = canvas.toDataURL();
    const resizedImg = await loadImage(resizedUrl);
    
    const colorThief = new ColorThief();
    const palette = colorThief.getPalette(resizedImg, 5) as [number, number, number][];
    
    const colors: ColorInfo[] = palette.map(([r, g, b]) => {
      const luminance = getLuminance(r, g, b);
      const contrastWithWhite = getContrastRatio(luminance, getLuminance(255, 255, 255));
      const contrastWithBlack = getContrastRatio(luminance, getLuminance(0, 0, 0));
      const isReadable = Math.max(contrastWithWhite, contrastWithBlack) >= 3;
      
      return {
        hex: rgbToHex(r, g, b),
        isReadable,
      };
    });
    
    return colors;
  } catch (error) {
    console.error('Failed to extract colors:', error);
    return [
      { hex: '#667eea', isReadable: true },
      { hex: '#764ba2', isReadable: true },
      { hex: '#f093fb', isReadable: false },
      { hex: '#f5576c', isReadable: true },
      { hex: '#4facfe', isReadable: true },
    ];
  }
};
