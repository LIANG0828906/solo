import { ColorSwatch } from '@/types';

export const mineralPalette: ColorSwatch[] = [
  { name: '腮红', value: '#fad6b4', category: '肤色' },
  { name: '朱砂', value: '#c62828', category: '红色系' },
  { name: '赭石', value: '#8d6e63', category: '棕色系' },
  { name: '石黄', value: '#fdd835', category: '黄色系' },
  { name: '靛蓝', value: '#1e88e5', category: '青色系' },
  { name: '石绿', value: '#43a047', category: '绿色系' },
  { name: '紫砂', value: '#6d4c41', category: '棕色系' },
  { name: '胭脂', value: '#ad1457', category: '红色系' },
  { name: '天青', value: '#4fc3f7', category: '青色系' },
  { name: '翡翠', value: '#26a69a', category: '绿色系' },
  { name: '象牙白', value: '#f5f0e8', category: '白色系' },
  { name: '墨黑', value: '#212121', category: '黑色系' },
];

export const defaultBaseColors = {
  skin: '#fad6b4',
  skirt: '#1e88e5',
  shawl: '#c62828',
};

export const patternTypes = [
  { id: 'scroll', name: '卷草纹', description: '连绵不绝的卷草纹样' },
  { id: 'cloud', name: '云纹', description: '飘逸灵动的祥云纹样' },
  { id: 'flame', name: '火焰纹', description: '熊熊燃烧的火焰纹样' },
];

export const goldLeafPositions = [
  { id: 'halo', name: '头光', description: '神像头部的光环' },
  { id: 'edge', name: '衣缘', description: '衣服边缘的装饰' },
  { id: 'ribbon', name: '飘带', description: '身上的飘带装饰' },
];
