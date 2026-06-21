import chroma from 'chroma-js';
import { ImageData, ColorData, sampleImages } from '../data/sampleImages';

export const analyzeColors = (imageId: string): ColorData[] => {
  const image = sampleImages.find((img) => img.id === imageId);
  if (image) {
    return image.mainColors;
  }
  return [
    { hex: '#808080', percentage: 40, name: '灰色' },
    { hex: '#A9A9A9', percentage: 25, name: '暗灰色' },
    { hex: '#C0C0C0', percentage: 20, name: '银色' },
    { hex: '#D3D3D3', percentage: 10, name: '浅灰色' },
    { hex: '#696969', percentage: 5, name: '暗淡灰' }
  ];
};

export const getAverageColor = (imageId: string): string => {
  const image = sampleImages.find((img) => img.id === imageId);
  return image ? image.avgColor : '#808080';
};

export const getContrastColor = (hexColor: string): string => {
  try {
    const [r, g, b] = chroma(hexColor).rgb();
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#333333' : '#FFFFFF';
  } catch {
    return '#333333';
  }
};

export const getAllImagesWithAnalysis = (images: ImageData[]): ImageData[] => {
  return images.map((img) => {
    const existing = sampleImages.find((s) => s.id === img.id);
    if (existing) {
      return existing;
    }
    return {
      ...img,
      avgColor: img.avgColor || '#808080',
      mainColors: img.mainColors || analyzeColors(img.id)
    };
  });
};
