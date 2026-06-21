export interface ColorData {
  hex: string;
  percentage: number;
  name: string;
}

export interface ImageData {
  id: string;
  url: string;
  title: string;
  avgColor: string;
  mainColors: ColorData[];
}

const generateId = (): string => Math.random().toString(36).substring(2, 11);

export const sampleImages: ImageData[] = [
  {
    id: generateId(),
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    title: '山景日落',
    avgColor: '#8B6F5E',
    mainColors: [
      { hex: '#FF6B4A', percentage: 28, name: '橙红色' },
      { hex: '#FFD93D', percentage: 22, name: '金黄色' },
      { hex: '#4A5568', percentage: 19, name: '深灰色' },
      { hex: '#2D3748', percentage: 16, name: '炭黑色' },
      { hex: '#F6AD55', percentage: 15, name: '橘黄色' }
    ]
  },
  {
    id: generateId(),
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    title: '海边沙滩',
    avgColor: '#4DB8D4',
    mainColors: [
      { hex: '#4ECDC4', percentage: 32, name: '青蓝色' },
      { hex: '#F7F7F7', percentage: 25, name: '米白色' },
      { hex: '#2E86DE', percentage: 20, name: '海蓝色' },
      { hex: '#FFEAA7', percentage: 13, name: '浅沙色' },
      { hex: '#54A0FF', percentage: 10, name: '天蓝色' }
    ]
  },
  {
    id: generateId(),
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    title: '森林小径',
    avgColor: '#3D6B47',
    mainColors: [
      { hex: '#228B22', percentage: 30, name: '森林绿' },
      { hex: '#2E7D32', percentage: 24, name: '深绿色' },
      { hex: '#8B4513', percentage: 19, name: '棕褐色' },
      { hex: '#81C784', percentage: 15, name: '浅绿色' },
      { hex: '#5D4037', percentage: 12, name: '咖啡色' }
    ]
  },
  {
    id: generateId(),
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    title: '星空夜景',
    avgColor: '#1A237E',
    mainColors: [
      { hex: '#0D47A1', percentage: 35, name: '深蓝色' },
      { hex: '#1A237E', percentage: 28, name: '靛蓝色' },
      { hex: '#283593', percentage: 18, name: '深靛蓝' },
      { hex: '#FFFFFF', percentage: 12, name: '纯白色' },
      { hex: '#3F51B5', percentage: 7, name: '靛青色' }
    ]
  },
  {
    id: generateId(),
    url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',
    title: '秋日田野',
    avgColor: '#D4A574',
    mainColors: [
      { hex: '#D4A017', percentage: 32, name: '金黄色' },
      { hex: '#8B7355', percentage: 24, name: '土棕色' },
      { hex: '#CD853F', percentage: 20, name: '秘鲁色' },
      { hex: '#F4A460', percentage: 14, name: '沙褐色' },
      { hex: '#A0522D', percentage: 10, name: '赭石色' }
    ]
  },
  {
    id: generateId(),
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    title: '雾中雪山',
    avgColor: '#B8C5D6',
    mainColors: [
      { hex: '#E8ECEF', percentage: 30, name: '雪白' },
      { hex: '#A9B4C2', percentage: 26, name: '银灰色' },
      { hex: '#6B7B8D', percentage: 20, name: '蓝灰色' },
      { hex: '#C5D0DC', percentage: 15, name: '浅灰蓝' },
      { hex: '#4A5568', percentage: 9, name: '深灰蓝' }
    ]
  }
];
