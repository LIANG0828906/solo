import type { PlantType, PlantData } from '@/types';

export const PLANT_DATA: Record<PlantType, PlantData> = {
  mushroom: {
    type: 'mushroom',
    name: '蘑菇战士',
    cost: 50,
    attack: 25,
    health: 200,
    range: 1.5,
    attackSpeed: 1500,
    description: '近战高血量，适合前排防御',
    color: '#9b59b6',
  },
  thorn: {
    type: 'thorn',
    name: '荆棘射手',
    cost: 75,
    attack: 35,
    health: 100,
    range: 4,
    attackSpeed: 1000,
    description: '远程高伤害，后排输出',
    color: '#e67e22',
  },
  sunflower: {
    type: 'sunflower',
    name: '向日葵补给',
    cost: 40,
    attack: 10,
    health: 80,
    range: 2,
    attackSpeed: 2000,
    description: '每3秒为周围友军恢复20生命',
    color: '#f1c40f',
  },
  cherry: {
    type: 'cherry',
    name: '樱桃炸弹',
    cost: 100,
    attack: 150,
    health: 50,
    range: 0.5,
    attackSpeed: 3000,
    description: '范围爆炸，对3x3区域造成伤害',
    color: '#e74c3c',
  },
};

export function getPlantData(type: PlantType): PlantData {
  return PLANT_DATA[type];
}
