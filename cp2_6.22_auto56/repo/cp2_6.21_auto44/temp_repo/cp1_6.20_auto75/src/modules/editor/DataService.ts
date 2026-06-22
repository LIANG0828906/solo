import { v4 as uuidv4 } from 'uuid';
import type { Dragon, ElementType, RarityType, Skill } from '../../shared/types';

const ELEMENT_ADVANTAGE: Record<ElementType, ElementType | null> = {
  fire: 'wind',
  wind: 'earth',
  earth: 'water',
  water: 'fire',
  light: null,
};

const ELEMENT_COLORS: Record<ElementType, { primary: string; secondary: string; glow: string }> = {
  fire: { primary: '#ff6b35', secondary: '#ff9f1c', glow: 'rgba(255, 107, 53, 0.5)' },
  water: { primary: '#4ecdc4', secondary: '#45b7d1', glow: 'rgba(78, 205, 196, 0.5)' },
  wind: { primary: '#95d5b2', secondary: '#74c69d', glow: 'rgba(149, 213, 178, 0.5)' },
  earth: { primary: '#dda15e', secondary: '#bc6c25', glow: 'rgba(221, 161, 94, 0.5)' },
  light: { primary: '#fff3b0', secondary: '#ffd60a', glow: 'rgba(255, 243, 176, 0.5)' },
};

const RARITY_GRADIENTS: Record<RarityType, string> = {
  common: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
  rare: 'linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%)',
  epic: 'linear-gradient(135deg, #b5179e 0%, #7209b7 100%)',
  legendary: 'linear-gradient(135deg, #ffd60a 0%, #ff8500 100%)',
};

const RARITY_NAMES: Record<RarityType, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const ELEMENT_NAMES: Record<ElementType, string> = {
  fire: '火',
  water: '水',
  wind: '风',
  earth: '土',
  light: '光',
};

function createSkill(
  name: string,
  damageMultiplier: number,
  cooldown: number,
  description: string,
  effect?: { type: 'burn' | 'freeze' | 'stun' | 'heal' | 'shield'; duration: number; value: number }
): Skill {
  return {
    id: uuidv4(),
    name,
    damageMultiplier,
    cooldown,
    description,
    effect,
  };
}

const DRAGONS_DATA: Omit<Dragon, 'id'>[] = [
  {
    name: '烈焰龙',
    element: 'fire',
    rarity: 'rare',
    baseStats: { hp: 120, attack: 85, defense: 60, speed: 75 },
    skills: [
      createSkill('烈焰吐息', 1.2, 0, '喷出炽热火焰，造成火焰伤害'),
      createSkill('焚烧', 0.8, 2, '点燃目标，每回合造成灼烧伤害', { type: 'burn', duration: 3, value: 15 }),
    ],
    avatarColor: '#ff6b35',
    description: '擅长火焰攻击的龙族，灼烧效果使其在持久战中表现出色。',
  },
  {
    name: '玄冰龙',
    element: 'water',
    rarity: 'rare',
    baseStats: { hp: 130, attack: 70, defense: 75, speed: 70 },
    skills: [
      createSkill('寒冰冲击', 1.0, 0, '释放寒冰之力攻击敌人'),
      createSkill('冰封', 0.6, 3, '冰冻目标，使其下回合无法行动', { type: 'freeze', duration: 1, value: 0 }),
    ],
    avatarColor: '#4ecdc4',
    description: '拥有冰冻能力的龙族，控制能力极强。',
  },
  {
    name: '疾风龙',
    element: 'wind',
    rarity: 'common',
    baseStats: { hp: 100, attack: 75, defense: 55, speed: 95 },
    skills: [
      createSkill('风刃', 1.1, 0, '召唤锋利的风刃攻击敌人'),
      createSkill('极速突袭', 1.5, 2, '以极速冲向目标，造成高额伤害'),
    ],
    avatarColor: '#95d5b2',
    description: '速度极快的龙族，先手优势明显。',
  },
  {
    name: '岩石龙',
    element: 'earth',
    rarity: 'common',
    baseStats: { hp: 150, attack: 65, defense: 90, speed: 50 },
    skills: [
      createSkill('岩石砸击', 1.0, 0, '召唤巨石砸向敌人'),
      createSkill('岩盾', 0, 2, '召唤岩石护盾，减少受到的伤害', { type: 'shield', duration: 2, value: 30 }),
    ],
    avatarColor: '#dda15e',
    description: '防御力极高的龙族，坚如磐石。',
  },
  {
    name: '圣光龙',
    element: 'light',
    rarity: 'epic',
    baseStats: { hp: 140, attack: 80, defense: 70, speed: 80 },
    skills: [
      createSkill('圣光冲击', 1.1, 0, '释放神圣光芒攻击敌人'),
      createSkill('治愈之光', 0, 2, '治疗己方单位，恢复生命值', { type: 'heal', duration: 0, value: 40 }),
    ],
    avatarColor: '#fff3b0',
    description: '拥有治愈能力的神圣龙族，团队的中流砥柱。',
  },
  {
    name: '炎狱龙',
    element: 'fire',
    rarity: 'legendary',
    baseStats: { hp: 160, attack: 100, defense: 70, speed: 85 },
    skills: [
      createSkill('地狱烈焰', 1.4, 0, '释放来自地狱的烈焰，造成毁灭性伤害'),
      createSkill('熔岩喷发', 1.0, 3, '引发熔岩喷发，对所有敌人造成灼烧', { type: 'burn', duration: 3, value: 20 }),
    ],
    avatarColor: '#ff4500',
    description: '传说中的炎狱霸主，火焰之力毁天灭地。',
  },
  {
    name: '深海龙王',
    element: 'water',
    rarity: 'legendary',
    baseStats: { hp: 170, attack: 90, defense: 85, speed: 75 },
    skills: [
      createSkill('海啸', 1.3, 0, '召唤海啸席卷敌人'),
      createSkill('深渊冻结', 0.7, 3, '释放极寒之力，冰冻所有敌人', { type: 'freeze', duration: 1, value: 0 }),
    ],
    avatarColor: '#0077b6',
    description: '深海中的霸主，掌控着海洋的力量。',
  },
  {
    name: '雷霆龙',
    element: 'light',
    rarity: 'epic',
    baseStats: { hp: 130, attack: 95, defense: 60, speed: 90 },
    skills: [
      createSkill('闪电链', 1.2, 0, '释放闪电链攻击敌人'),
      createSkill('雷霆一击', 1.8, 3, '召唤雷霆轰击目标，有几率眩晕', { type: 'stun', duration: 1, value: 0 }),
    ],
    avatarColor: '#ffd60a',
    description: '速度与力量兼备的雷电之子。',
  },
  {
    name: '毒藤龙',
    element: 'wind',
    rarity: 'rare',
    baseStats: { hp: 110, attack: 80, defense: 65, speed: 80 },
    skills: [
      createSkill('藤蔓缠绕', 0.9, 0, '用藤蔓缠绕攻击敌人'),
      createSkill('毒孢子', 0.5, 2, '释放毒孢子，持续造成伤害并降低速度', { type: 'burn', duration: 3, value: 12 }),
    ],
    avatarColor: '#2d6a4f',
    description: '植物系龙族，擅长持续伤害。',
  },
  {
    name: '水晶龙',
    element: 'earth',
    rarity: 'epic',
    baseStats: { hp: 160, attack: 75, defense: 95, speed: 60 },
    skills: [
      createSkill('水晶穿刺', 1.1, 0, '召唤水晶尖刺攻击敌人'),
      createSkill('晶壁', 0, 2, '召唤水晶屏障，大幅提升防御', { type: 'shield', duration: 2, value: 50 }),
    ],
    avatarColor: '#9f86c0',
    description: '身体由水晶构成，防御力惊人。',
  },
];

class DataService {
  private dragons: Dragon[] = [];

  constructor() {
    this.dragons = DRAGONS_DATA.map((dragon) => ({
      ...dragon,
      id: uuidv4(),
    }));
  }

  getAllDragons(): Dragon[] {
    return [...this.dragons];
  }

  getDragonById(id: string): Dragon | undefined {
    return this.dragons.find((d) => d.id === id);
  }

  getDragonsByElement(element: ElementType): Dragon[] {
    return this.dragons.filter((d) => d.element === element);
  }

  getDragonsByRarity(rarity: RarityType): Dragon[] {
    return this.dragons.filter((d) => d.rarity === rarity);
  }

  getRandomDragons(count: number): Dragon[] {
    const shuffled = [...this.dragons].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  getElementAdvantage(attacker: ElementType, defender: ElementType): number {
    if (attacker === 'light' || defender === 'light') {
      return 1.0;
    }
    if (ELEMENT_ADVANTAGE[attacker] === defender) {
      return 1.25;
    }
    if (ELEMENT_ADVANTAGE[defender] === attacker) {
      return 0.8;
    }
    return 1.0;
  }

  getElementColors(element: ElementType) {
    return ELEMENT_COLORS[element];
  }

  getRarityGradient(rarity: RarityType) {
    return RARITY_GRADIENTS[rarity];
  }

  getRarityName(rarity: RarityType) {
    return RARITY_NAMES[rarity];
  }

  getElementName(element: ElementType) {
    return ELEMENT_NAMES[element];
  }

  hasElementAdvantage(attacker: ElementType, defender: ElementType): boolean {
    return ELEMENT_ADVANTAGE[attacker] === defender;
  }

  hasElementDisadvantage(attacker: ElementType, defender: ElementType): boolean {
    return ELEMENT_ADVANTAGE[defender] === attacker;
  }
}

export const dataService = new DataService();
export { ELEMENT_COLORS, RARITY_GRADIENTS, RARITY_NAMES, ELEMENT_NAMES };
