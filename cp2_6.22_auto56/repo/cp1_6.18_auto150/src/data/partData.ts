import type { PartTemplate } from '../types';

export const PART_TEMPLATES: PartTemplate[] = [
  {
    id: 'wood-square-s',
    name: '小木方块',
    material: 'wood',
    width: 40,
    height: 40,
    price: 2.5,
    color: '#8B5E3C',
  },
  {
    id: 'wood-rect-h',
    name: '木横条',
    material: 'wood',
    width: 80,
    height: 30,
    price: 3.8,
    color: '#8B5E3C',
  },
  {
    id: 'wood-rect-v',
    name: '木竖条',
    material: 'wood',
    width: 30,
    height: 80,
    price: 3.8,
    color: '#8B5E3C',
  },
  {
    id: 'wood-square-l',
    name: '大木方块',
    material: 'wood',
    width: 60,
    height: 60,
    price: 5.0,
    color: '#8B5E3C',
  },
  {
    id: 'wood-triangle',
    name: '木三角',
    material: 'wood',
    width: 60,
    height: 52,
    price: 4.2,
    color: '#8B5E3C',
  },
  {
    id: 'fabric-square-s',
    name: '小布方块',
    material: 'fabric',
    width: 40,
    height: 40,
    price: 1.8,
    color: '#B565A7',
  },
  {
    id: 'fabric-rect-h',
    name: '布横条',
    material: 'fabric',
    width: 100,
    height: 30,
    price: 2.8,
    color: '#B565A7',
  },
  {
    id: 'fabric-circle',
    name: '布圆片',
    material: 'fabric',
    width: 50,
    height: 50,
    price: 2.2,
    color: '#B565A7',
  },
  {
    id: 'fabric-square-l',
    name: '大布方块',
    material: 'fabric',
    width: 70,
    height: 70,
    price: 4.0,
    color: '#B565A7',
  },
  {
    id: 'metal-square-s',
    name: '小金属片',
    material: 'metal',
    width: 30,
    height: 30,
    price: 4.5,
    color: '#708090',
  },
  {
    id: 'metal-rect-h',
    name: '金属横条',
    material: 'metal',
    width: 90,
    height: 20,
    price: 5.2,
    color: '#708090',
  },
  {
    id: 'metal-circle',
    name: '金属圆片',
    material: 'metal',
    width: 40,
    height: 40,
    price: 4.8,
    color: '#708090',
  },
  {
    id: 'metal-ring',
    name: '金属圆环',
    material: 'metal',
    width: 50,
    height: 50,
    price: 6.0,
    color: '#708090',
  },
];

export const MATERIAL_LABELS: Record<string, string> = {
  wood: '木质零件',
  fabric: '布艺零件',
  metal: '金属零件',
};

export function getTemplateById(id: string): PartTemplate | undefined {
  return PART_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByMaterial(material: string): PartTemplate[] {
  return PART_TEMPLATES.filter((t) => t.material === material);
}
