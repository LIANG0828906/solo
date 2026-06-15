import type { Material } from '@/types';

export const MATERIALS: Material[] = [
  {
    id: 'nature-leaf',
    category: 'nature',
    name: '树叶',
    svgPath: 'M50 10 C30 30, 10 60, 50 90 C90 60, 70 30, 50 10 M50 20 L50 80',
    defaultColor: '#4A7C59',
    viewBox: '0 0 100 100',
  },
  {
    id: 'nature-flower',
    category: 'nature',
    name: '花朵',
    svgPath: 'M50 30 Q45 15, 30 20 Q15 25, 20 40 Q25 55, 40 50 Q55 55, 70 50 Q85 45, 80 30 Q75 15, 60 20 Q50 15, 50 30 M50 40 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0',
    defaultColor: '#E8B4B8',
    viewBox: '0 0 100 100',
  },
  {
    id: 'nature-mountain',
    category: 'nature',
    name: '山脉',
    svgPath: 'M10 80 L35 35 L55 60 L75 25 L95 80 Z',
    defaultColor: '#6B8E9F',
    viewBox: '0 0 100 100',
  },
  {
    id: 'nature-cloud',
    category: 'nature',
    name: '云朵',
    svgPath: 'M25 60 Q10 60, 10 45 Q10 30, 30 30 Q35 15, 55 20 Q75 15, 80 35 Q95 35, 95 50 Q95 65, 75 65 Z',
    defaultColor: '#B8C5D6',
    viewBox: '0 0 100 100',
  },
  {
    id: 'nature-sun',
    category: 'nature',
    name: '太阳',
    svgPath: 'M50 50 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0 M50 15 V5 M50 85 V95 M15 50 H5 M85 50 H95 M25 25 L18 18 M75 75 L82 82 M25 75 L18 82 M75 25 L82 18',
    defaultColor: '#F5B971',
    viewBox: '0 0 100 100',
  },
  {
    id: 'nature-drop',
    category: 'nature',
    name: '水滴',
    svgPath: 'M50 10 Q25 50, 25 65 Q25 85, 50 85 Q75 85, 75 65 Q75 50, 50 10',
    defaultColor: '#7EC8E3',
    viewBox: '0 0 100 100',
  },
  {
    id: 'nature-tree',
    category: 'nature',
    name: '树木',
    svgPath: 'M45 90 H55 V60 M50 15 Q20 30, 25 55 Q30 75, 50 70 Q70 75, 75 55 Q80 30, 50 15',
    defaultColor: '#8B7355',
    viewBox: '0 0 100 100',
  },
  {
    id: 'geo-circle',
    category: 'geometry',
    name: '圆形',
    svgPath: 'M50 20 m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0',
    defaultColor: '#D4A574',
    viewBox: '0 0 100 100',
  },
  {
    id: 'geo-triangle',
    category: 'geometry',
    name: '三角形',
    svgPath: 'M50 15 L85 80 L15 80 Z',
    defaultColor: '#C9A959',
    viewBox: '0 0 100 100',
  },
  {
    id: 'geo-square',
    category: 'geometry',
    name: '正方形',
    svgPath: 'M20 20 H80 V80 H20 Z',
    defaultColor: '#B8860B',
    viewBox: '0 0 100 100',
  },
  {
    id: 'geo-hexagon',
    category: 'geometry',
    name: '六边形',
    svgPath: 'M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z',
    defaultColor: '#CD853F',
    viewBox: '0 0 100 100',
  },
  {
    id: 'geo-star',
    category: 'geometry',
    name: '星形',
    svgPath: 'M50 5 L61 38 L97 38 L68 58 L79 92 L50 72 L21 92 L32 58 L3 38 L39 38 Z',
    defaultColor: '#DAA520',
    viewBox: '0 0 100 100',
  },
  {
    id: 'geo-diamond',
    category: 'geometry',
    name: '菱形',
    svgPath: 'M50 10 L85 50 L50 90 L15 50 Z',
    defaultColor: '#BC8F8F',
    viewBox: '0 0 100 100',
  },
  {
    id: 'geo-donut',
    category: 'geometry',
    name: '圆环',
    svgPath: 'M50 50 m-35 0 a35 35 0 1 0 70 0 a35 35 0 1 0 -70 0 M50 50 m-15 0 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0',
    defaultColor: '#A0522D',
    viewBox: '0 0 100 100',
  },
  {
    id: 'animal-bird',
    category: 'animal',
    name: '小鸟',
    svgPath: 'M20 50 Q30 35, 50 40 Q70 35, 80 50 Q70 45, 60 50 Q50 45, 40 50 Q30 45, 20 50 M50 40 L45 30 M50 40 L55 30 M80 50 L90 48 M80 50 L90 52',
    defaultColor: '#5D4E6D',
    viewBox: '0 0 100 100',
  },
  {
    id: 'animal-fish',
    category: 'animal',
    name: '鱼',
    svgPath: 'M80 50 Q60 20, 25 50 Q60 80, 80 50 M80 50 L95 35 L90 50 L95 65 Z M40 45 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M50 55 Q55 50, 60 55',
    defaultColor: '#4A6FA5',
    viewBox: '0 0 100 100',
  },
  {
    id: 'animal-butterfly',
    category: 'animal',
    name: '蝴蝶',
    svgPath: 'M50 30 L50 70 M50 35 Q25 20, 15 45 Q15 65, 40 60 Q50 55, 50 40 M50 35 Q75 20, 85 45 Q85 65, 60 60 Q50 55, 50 40 M50 25 Q48 15, 45 10 M50 25 Q52 15, 55 10',
    defaultColor: '#9B5DE5',
    viewBox: '0 0 100 100',
  },
  {
    id: 'animal-cat',
    category: 'animal',
    name: '猫咪',
    svgPath: 'M25 30 L35 50 L65 50 L75 30 M35 50 Q25 75, 50 80 Q75 75, 65 50 M35 55 L30 70 M65 55 L70 70 M40 60 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M60 60 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M50 68 Q48 72, 50 72 Q52 72, 50 68',
    defaultColor: '#6B4423',
    viewBox: '0 0 100 100',
  },
  {
    id: 'animal-rabbit',
    category: 'animal',
    name: '兔子',
    svgPath: 'M40 20 Q35 5, 30 15 L35 40 M60 20 Q65 5, 70 15 L65 40 M35 40 Q30 55, 35 70 Q50 80, 65 70 Q70 55, 65 40 Q50 35, 35 40 M42 55 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M58 55 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M50 62 Q48 66, 50 66 Q52 66, 50 62',
    defaultColor: '#C4A484',
    viewBox: '0 0 100 100',
  },
  {
    id: 'animal-deer',
    category: 'animal',
    name: '小鹿',
    svgPath: 'M45 40 Q30 20, 20 30 M55 40 Q70 20, 80 30 M45 40 L35 15 M45 40 L25 20 M55 40 L65 15 M55 40 L75 20 M50 40 Q35 50, 40 75 L45 90 L50 75 L55 90 L60 75 Q65 50, 50 40 M40 55 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M60 55 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
    defaultColor: '#8B4513',
    viewBox: '0 0 100 100',
  },
  {
    id: 'animal-fox',
    category: 'animal',
    name: '狐狸',
    svgPath: 'M20 25 L35 45 L65 45 L80 25 M35 45 Q25 70, 50 75 Q75 70, 65 45 M35 45 L20 60 M65 45 L80 60 M42 55 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M58 55 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M50 65 Q45 60, 50 60 Q55 60, 50 65',
    defaultColor: '#D2691E',
    viewBox: '0 0 100 100',
  },
  {
    id: 'abs-wave',
    category: 'abstract',
    name: '波浪',
    svgPath: 'M10 50 Q25 30, 40 50 Q55 70, 70 50 Q85 30, 95 50',
    defaultColor: '#00A896',
    viewBox: '0 0 100 100',
  },
  {
    id: 'abs-spiral',
    category: 'abstract',
    name: '螺旋',
    svgPath: 'M50 50 m0 0 q15 -5, 15 15 q-5 20, -25 20 q-30 0, -30 -30 q0 -35, 35 -35 q40 0, 40 40 q0 45, -45 45 q-50 0, -50 -50',
    defaultColor: '#7209B7',
    viewBox: '0 0 100 100',
  },
  {
    id: 'abs-dots',
    category: 'abstract',
    name: '斑点',
    svgPath: 'M25 25 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M70 20 m-6 0 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M75 70 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0 M25 75 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M50 50 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0',
    defaultColor: '#F72585',
    viewBox: '0 0 100 100',
  },
  {
    id: 'abs-lines',
    category: 'abstract',
    name: '线条',
    svgPath: 'M20 20 L80 20 M20 35 L80 35 M20 50 L80 50 M20 65 L80 65 M20 80 L80 80',
    defaultColor: '#3A86FF',
    viewBox: '0 0 100 100',
  },
  {
    id: 'abs-splash',
    category: 'abstract',
    name: '泼墨',
    svgPath: 'M50 50 Q35 40, 30 55 Q25 70, 40 70 Q55 75, 60 65 Q70 55, 65 45 Q55 35, 50 50 M55 30 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M75 35 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 M80 60 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M25 35 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0',
    defaultColor: '#2B2D42',
    viewBox: '0 0 100 100',
  },
  {
    id: 'abs-grid',
    category: 'abstract',
    name: '网格',
    svgPath: 'M20 10 V90 M40 10 V90 M60 10 V90 M80 10 V90 M10 20 H90 M10 40 H90 M10 60 H90 M10 80 H90',
    defaultColor: '#5C677D',
    viewBox: '0 0 100 100',
  },
  {
    id: 'abs-zen',
    category: 'abstract',
    name: '禅意圆',
    svgPath: 'M50 50 m-35 0 a35 35 0 1 0 70 0 a35 35 0 1 0 -70 0 M50 50 m-20 0 a20 20 0 0 1 40 0 a20 20 0 0 1 -40 0',
    defaultColor: '#1D3557',
    viewBox: '0 0 100 100',
  },
];

export const CATEGORY_INFO: Record<string, { label: string; icon: string }> = {
  nature: { label: '自然', icon: '🌿' },
  geometry: { label: '几何', icon: '◇' },
  animal: { label: '动物', icon: '🦊' },
  abstract: { label: '抽象', icon: '◐' },
};

export const getMaterialsByCategory = (category: string): Material[] => {
  return MATERIALS.filter((m) => m.category === category);
};

export const getMaterialById = (id: string): Material | undefined => {
  return MATERIALS.find((m) => m.id === id);
};

export const getRandomMaterial = (category: string): Material => {
  const categoryMaterials = getMaterialsByCategory(category);
  const randomIndex = Math.floor(Math.random() * categoryMaterials.length);
  return categoryMaterials[randomIndex];
};
