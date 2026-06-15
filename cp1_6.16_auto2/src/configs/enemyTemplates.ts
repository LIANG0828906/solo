export interface EnemyTemplate {
  id: string;
  type: 'melee' | 'ranged' | 'explosive';
  name: string;
  health: number;
  speed: number;
  attack: number;
  attackRange: number;
  attackCooldown: number;
  color: number;
  size: number;
  bulletSpeed?: number;
  explosionRadius?: number;
  weight: number;
}

export const enemyTemplates: EnemyTemplate[] = [
  {
    id: 'melee_1',
    type: 'melee',
    name: '森林野狼',
    health: 60,
    speed: 140,
    attack: 10,
    attackRange: 30,
    attackCooldown: 800,
    color: 0x8B4513,
    size: 18,
    weight: 60
  },
  {
    id: 'ranged_1',
    type: 'ranged',
    name: '毒箭弓手',
    health: 40,
    speed: 60,
    attack: 15,
    attackRange: 250,
    attackCooldown: 1500,
    color: 0x556B2F,
    size: 16,
    bulletSpeed: 200,
    weight: 30
  },
  {
    id: 'explosive_1',
    type: 'explosive',
    name: '自爆蜘蛛',
    health: 30,
    speed: 100,
    attack: 35,
    attackRange: 60,
    attackCooldown: 2000,
    color: 0x8B0000,
    size: 20,
    explosionRadius: 80,
    weight: 10
  },
  {
    id: 'melee_2',
    type: 'melee',
    name: '狂暴熊',
    health: 120,
    speed: 110,
    attack: 18,
    attackRange: 35,
    attackCooldown: 1000,
    color: 0x654321,
    size: 24,
    weight: 20
  },
  {
    id: 'ranged_2',
    type: 'ranged',
    name: '暗影法师',
    health: 70,
    speed: 50,
    attack: 25,
    attackRange: 300,
    attackCooldown: 1800,
    color: 0x4B0082,
    size: 17,
    bulletSpeed: 260,
    weight: 15
  },
  {
    id: 'explosive_2',
    type: 'explosive',
    name: '爆炎史莱姆',
    health: 50,
    speed: 85,
    attack: 50,
    attackRange: 70,
    attackCooldown: 1500,
    color: 0xFF4500,
    size: 22,
    explosionRadius: 100,
    weight: 8
  }
];

export const getEnemyById = (id: string): EnemyTemplate | undefined => {
  return enemyTemplates.find(t => t.id === id);
};

export const getEnemiesByType = (type: EnemyTemplate['type']): EnemyTemplate[] => {
  return enemyTemplates.filter(t => t.type === type);
};
