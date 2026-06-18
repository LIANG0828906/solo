import { ClothingItem, FabricType } from '../types';

export const clothingItems: ClothingItem[] = [
  {
    id: 'sg-001',
    name: '樱花礼服',
    designer: '林雨薇',
    designerAvatar: 'https://i.pravatar.cc/150?img=1',
    collectionId: 'spring-garden',
    baseCarbonScore: 3.2,
    modelUrl: 'dress-1',
    complexity: 1.2,
    parts: [
      { id: 'bodice', name: '上身', meshName: 'bodice' },
      { id: 'skirt', name: '裙摆', meshName: 'skirt' }
    ],
    defaultFabric: 'organicCotton',
    defaultColors: {
      bodice: '#FFB6C1',
      skirt: '#FFC0CB'
    }
  },
  {
    id: 'sg-002',
    name: '翠叶长裙',
    designer: '陈思远',
    designerAvatar: 'https://i.pravatar.cc/150?img=2',
    collectionId: 'spring-garden',
    baseCarbonScore: 2.8,
    modelUrl: 'dress-2',
    complexity: 1.0,
    parts: [
      { id: 'top', name: '上衣', meshName: 'top' },
      { id: 'skirt', name: '长裙', meshName: 'skirt' }
    ],
    defaultFabric: 'tencel',
    defaultColors: {
      top: '#98FB98',
      skirt: '#90EE90'
    }
  },
  {
    id: 'sg-003',
    name: '花语套装',
    designer: '林雨薇',
    designerAvatar: 'https://i.pravatar.cc/150?img=1',
    collectionId: 'spring-garden',
    baseCarbonScore: 4.1,
    modelUrl: 'dress-3',
    complexity: 1.5,
    parts: [
      { id: 'jacket', name: '外套', meshName: 'jacket' },
      { id: 'dress', name: '连衣裙', meshName: 'dress' }
    ],
    defaultFabric: 'organicCotton',
    defaultColors: {
      jacket: '#FFE4E1',
      dress: '#FF69B4'
    }
  },
  {
    id: 'sg-004',
    name: '晨曦婚纱',
    designer: '王明月',
    designerAvatar: 'https://i.pravatar.cc/150?img=3',
    collectionId: 'spring-garden',
    baseCarbonScore: 5.5,
    modelUrl: 'dress-4',
    complexity: 2.0,
    parts: [
      { id: 'bodice', name: '上身', meshName: 'bodice' },
      { id: 'train', name: '拖尾', meshName: 'train' },
      { id: 'veil', name: '头纱', meshName: 'veil' }
    ],
    defaultFabric: 'hemp',
    defaultColors: {
      bodice: '#FFFAF0',
      train: '#FFFAF0',
      veil: '#FFF0F5'
    }
  },
  {
    id: 'um-001',
    name: '灰白西装裙',
    designer: '张浩然',
    designerAvatar: 'https://i.pravatar.cc/150?img=4',
    collectionId: 'urban-minimal',
    baseCarbonScore: 3.8,
    modelUrl: 'dress-5',
    complexity: 1.3,
    parts: [
      { id: 'blazer', name: '西装', meshName: 'blazer' },
      { id: 'skirt', name: '半裙', meshName: 'skirt' }
    ],
    defaultFabric: 'recycledPolyester',
    defaultColors: {
      blazer: '#A9A9A9',
      skirt: '#696969'
    }
  },
  {
    id: 'um-002',
    name: '深灰连体裤',
    designer: '李雅琳',
    designerAvatar: 'https://i.pravatar.cc/150?img=5',
    collectionId: 'urban-minimal',
    baseCarbonScore: 3.5,
    modelUrl: 'dress-6',
    complexity: 1.1,
    parts: [
      { id: 'top', name: '上衣', meshName: 'top' },
      { id: 'pants', name: '裤装', meshName: 'pants' }
    ],
    defaultFabric: 'recycledPolyester',
    defaultColors: {
      top: '#2F4F4F',
      pants: '#1C1C1C'
    }
  },
  {
    id: 'um-003',
    name: '米白衬衫裙',
    designer: '张浩然',
    designerAvatar: 'https://i.pravatar.cc/150?img=4',
    collectionId: 'urban-minimal',
    baseCarbonScore: 2.9,
    modelUrl: 'dress-7',
    complexity: 0.9,
    parts: [
      { id: 'dress', name: '连衣裙', meshName: 'dress' },
      { id: 'belt', name: '腰带', meshName: 'belt' }
    ],
    defaultFabric: 'organicCotton',
    defaultColors: {
      dress: '#FAF0E6',
      belt: '#8B7355'
    }
  },
  {
    id: 'um-004',
    name: '银灰晚礼服',
    designer: '李雅琳',
    designerAvatar: 'https://i.pravatar.cc/150?img=5',
    collectionId: 'urban-minimal',
    baseCarbonScore: 4.8,
    modelUrl: 'dress-8',
    complexity: 1.8,
    parts: [
      { id: 'bodice', name: '上身', meshName: 'bodice' },
      { id: 'skirt', name: '裙摆', meshName: 'skirt' }
    ],
    defaultFabric: 'recycledPolyester',
    defaultColors: {
      bodice: '#C0C0C0',
      skirt: '#808080'
    }
  },
  {
    id: 'cb-001',
    name: '海蓝鱼尾裙',
    designer: '周晓燕',
    designerAvatar: 'https://i.pravatar.cc/150?img=6',
    collectionId: 'coastal-breeze',
    baseCarbonScore: 4.2,
    modelUrl: 'dress-9',
    complexity: 1.6,
    parts: [
      { id: 'bodice', name: '上身', meshName: 'bodice' },
      { id: 'skirt', name: '鱼尾裙', meshName: 'skirt' }
    ],
    defaultFabric: 'tencel',
    defaultColors: {
      bodice: '#4169E1',
      skirt: '#000080'
    }
  },
  {
    id: 'cb-002',
    name: '薰衣草长裙',
    designer: '周晓燕',
    designerAvatar: 'https://i.pravatar.cc/150?img=6',
    collectionId: 'coastal-breeze',
    baseCarbonScore: 3.4,
    modelUrl: 'dress-10',
    complexity: 1.2,
    parts: [
      { id: 'top', name: '吊带', meshName: 'top' },
      { id: 'skirt', name: '长裙', meshName: 'skirt' }
    ],
    defaultFabric: 'hemp',
    defaultColors: {
      top: '#E6E6FA',
      skirt: '#9370DB'
    }
  },
  {
    id: 'cb-003',
    name: '日落橙礼服',
    designer: '黄伟明',
    designerAvatar: 'https://i.pravatar.cc/150?img=7',
    collectionId: 'coastal-breeze',
    baseCarbonScore: 3.9,
    modelUrl: 'dress-11',
    complexity: 1.4,
    parts: [
      { id: 'dress', name: '连衣裙', meshName: 'dress' }
    ],
    defaultFabric: 'tencel',
    defaultColors: {
      dress: '#FF7F50'
    }
  },
  {
    id: 'cb-004',
    name: '星空蓝拖尾',
    designer: '黄伟明',
    designerAvatar: 'https://i.pravatar.cc/150?img=7',
    collectionId: 'coastal-breeze',
    baseCarbonScore: 5.8,
    modelUrl: 'dress-12',
    complexity: 2.2,
    parts: [
      { id: 'bodice', name: '上身', meshName: 'bodice' },
      { id: 'skirt', name: '主裙', meshName: 'skirt' },
      { id: 'train', name: '拖尾', meshName: 'train' }
    ],
    defaultFabric: 'tencel',
    defaultColors: {
      bodice: '#191970',
      skirt: '#000080',
      train: '#0000CD'
    }
  }
];

export const getClothingById = (id: string): ClothingItem | undefined => {
  return clothingItems.find(c => c.id === id);
};

export const getClothingByCollection = (collectionId: string): ClothingItem[] => {
  return clothingItems.filter(c => c.collectionId === collectionId);
};

export const fabricData: Record<FabricType, { name: string; carbonFactor: number; colorPalette: string[]; roughness: number; metalness: number; description: string }> = {
  organicCotton: {
    name: '有机棉',
    carbonFactor: 1.0,
    colorPalette: ['#FFB6C1', '#98FB98', '#FAF0E6', '#FFE4E1', '#FFF0F5', '#E6E6FA', '#DDA0DD', '#F0E68C'],
    roughness: 0.8,
    metalness: 0.0,
    description: '不使用农药和化学肥料，比普通棉节省91%的水资源'
  },
  recycledPolyester: {
    name: '再生聚酯',
    carbonFactor: 0.7,
    colorPalette: ['#A9A9A9', '#696969', '#2F4F4F', '#C0C0C0', '#808080', '#1C1C1C', '#708090', '#778899'],
    roughness: 0.4,
    metalness: 0.1,
    description: '由回收塑料瓶制成，每件服装可回收约10个塑料瓶'
  },
  tencel: {
    name: '天丝',
    carbonFactor: 0.85,
    colorPalette: ['#4169E1', '#000080', '#FF7F50', '#191970', '#0000CD', '#87CEEB', '#9370DB', '#4682B4'],
    roughness: 0.6,
    metalness: 0.05,
    description: '从桉树中提取，可生物降解，生产过程闭环无浪费'
  },
  hemp: {
    name: '大麻纤维',
    carbonFactor: 0.95,
    colorPalette: ['#E6E6FA', '#9370DB', '#FFFAF0', '#FFF0F5', '#D8BFD8', '#DDA0DD', '#EE82EE', '#DA70D6'],
    roughness: 0.9,
    metalness: 0.0,
    description: '无需农药，生长快速，比棉花少用50%的水'
  }
};

export const getFabricList = () => {
  return Object.entries(fabricData).map(([type, data]) => ({
    type: type as FabricType,
    ...data
  }));
};
