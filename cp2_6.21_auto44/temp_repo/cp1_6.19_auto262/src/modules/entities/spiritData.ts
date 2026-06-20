import type { ElementType } from '../board/hexUtils';

export interface SpiritStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  range: number;
  special: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  damage: number;
  range: number;
  element: ElementType;
}

export interface SpiritTemplate {
  id: string;
  name: string;
  element: ElementType;
  baseStats: SpiritStats;
  passiveSkill: string;
  passiveDescription: string;
  activeSkills: Omit<Skill, 'currentCooldown'>[];
  growthCurve: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
    range: number;
    special: number;
  };
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#FF4500',
  water: '#1E90FF',
  wind: '#32CD32',
  earth: '#D2691E',
  light: '#FFD700',
  dark: '#8A2BE2'
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  fire: '火',
  water: '水',
  wind: '风',
  earth: '土',
  light: '光',
  dark: '暗'
};

export const ELEMENT_ICONS: Record<ElementType, string> = {
  fire: '🔥',
  water: '💧',
  wind: '🌪️',
  earth: '🪨',
  light: '✨',
  dark: '🌑'
};

export const ELEMENT_ADVANTAGE: Record<ElementType, ElementType> = {
  fire: 'wind',
  water: 'fire',
  wind: 'earth',
  earth: 'light',
  light: 'dark',
  dark: 'water'
};

export const SPIRIT_TEMPLATES: SpiritTemplate[] = [
  {
    id: 'fire_spirit',
    name: '炎灵',
    element: 'fire',
    baseStats: {
      hp: 80,
      maxHp: 80,
      attack: 25,
      defense: 8,
      speed: 7,
      range: 2,
      special: 90
    },
    passiveSkill: '烈焰之心',
    passiveDescription: '攻击时有30%几率造成灼烧，每回合额外造成3点伤害，持续2回合',
    activeSkills: [
      {
        id: 'fire_ball',
        name: '火球术',
        description: '发射火球造成150%攻击力伤害',
        cooldown: 2,
        damage: 1.5,
        range: 3,
        element: 'fire'
      },
      {
        id: 'flame_burst',
        name: '烈焰爆发',
        description: '对周围1格内所有敌人造成120%攻击力伤害',
        cooldown: 4,
        damage: 1.2,
        range: 1,
        element: 'fire'
      }
    ],
    growthCurve: { hp: 15, attack: 5, defense: 2, speed: 1, range: 0, special: 10 }
  },
  {
    id: 'water_spirit',
    name: '水灵',
    element: 'water',
    baseStats: {
      hp: 100,
      maxHp: 100,
      attack: 18,
      defense: 12,
      speed: 5,
      range: 2,
      special: 85
    },
    passiveSkill: '治愈之水',
    passiveDescription: '每回合结束时恢复自身及相邻友军5点生命',
    activeSkills: [
      {
        id: 'water_wave',
        name: '水浪冲击',
        description: '造成130%攻击力伤害并击退目标1格',
        cooldown: 2,
        damage: 1.3,
        range: 2,
        element: 'water'
      },
      {
        id: 'healing_rain',
        name: '治愈之雨',
        description: '恢复范围内友军30点生命',
        cooldown: 3,
        damage: -30,
        range: 2,
        element: 'water'
      }
    ],
    growthCurve: { hp: 20, attack: 3, defense: 3, speed: 1, range: 0, special: 8 }
  },
  {
    id: 'wind_spirit',
    name: '风灵',
    element: 'wind',
    baseStats: {
      hp: 70,
      maxHp: 70,
      attack: 22,
      defense: 6,
      speed: 10,
      range: 3,
      special: 95
    },
    passiveSkill: '疾风步',
    passiveDescription: '移动消耗降低50%，闪避率提升15%',
    activeSkills: [
      {
        id: 'wind_blade',
        name: '风刃',
        description: '发射风刃造成140%攻击力伤害，可穿透2格',
        cooldown: 2,
        damage: 1.4,
        range: 4,
        element: 'wind'
      },
      {
        id: 'hurricane',
        name: '飓风',
        description: '将范围内敌人击退2格并造成100%攻击力伤害',
        cooldown: 4,
        damage: 1.0,
        range: 2,
        element: 'wind'
      }
    ],
    growthCurve: { hp: 10, attack: 4, defense: 1, speed: 2, range: 1, special: 12 }
  },
  {
    id: 'earth_spirit',
    name: '土灵',
    element: 'earth',
    baseStats: {
      hp: 120,
      maxHp: 120,
      attack: 20,
      defense: 18,
      speed: 3,
      range: 1,
      special: 75
    },
    passiveSkill: '岩石护甲',
    passiveDescription: '受到的物理伤害减少20%，免疫击退效果',
    activeSkills: [
      {
        id: 'rock_throw',
        name: '投石',
        description: '投掷巨石造成160%攻击力伤害',
        cooldown: 2,
        damage: 1.6,
        range: 2,
        element: 'earth'
      },
      {
        id: 'earthquake',
        name: '地震',
        description: '对周围2格内所有敌人造成110%攻击力伤害并使其眩晕1回合',
        cooldown: 5,
        damage: 1.1,
        range: 2,
        element: 'earth'
      }
    ],
    growthCurve: { hp: 25, attack: 4, defense: 5, speed: 0, range: 0, special: 5 }
  },
  {
    id: 'light_spirit',
    name: '光灵',
    element: 'light',
    baseStats: {
      hp: 85,
      maxHp: 85,
      attack: 20,
      defense: 10,
      speed: 6,
      range: 2,
      special: 100
    },
    passiveSkill: '圣光庇护',
    passiveDescription: '友方灵体受到致命伤害时有20%几率保留1点生命',
    activeSkills: [
      {
        id: 'holy_light',
        name: '圣光术',
        description: '造成140%攻击力伤害，对暗属性额外造成50%伤害',
        cooldown: 2,
        damage: 1.4,
        range: 3,
        element: 'light'
      },
      {
        id: 'divine_shield',
        name: '神圣护盾',
        description: '为目标施加护盾，吸收50点伤害，持续2回合',
        cooldown: 3,
        damage: 0,
        range: 2,
        element: 'light'
      }
    ],
    growthCurve: { hp: 15, attack: 4, defense: 2, speed: 1, range: 0, special: 15 }
  },
  {
    id: 'dark_spirit',
    name: '暗灵',
    element: 'dark',
    baseStats: {
      hp: 75,
      maxHp: 75,
      attack: 28,
      defense: 8,
      speed: 8,
      range: 2,
      special: 90
    },
    passiveSkill: '暗影收割',
    passiveDescription: '击杀敌人后恢复造成伤害的30%生命，并获得1层暗影之力（攻击+3）',
    activeSkills: [
      {
        id: 'shadow_strike',
        name: '暗影突袭',
        description: '造成150%攻击力伤害，有30%几率使目标恐惧1回合',
        cooldown: 2,
        damage: 1.5,
        range: 2,
        element: 'dark'
      },
      {
        id: 'soul_drain',
        name: '灵魂汲取',
        description: '造成120%攻击力伤害，并恢复伤害的50%生命',
        cooldown: 3,
        damage: 1.2,
        range: 1,
        element: 'dark'
      }
    ],
    growthCurve: { hp: 12, attack: 6, defense: 2, speed: 1, range: 0, special: 10 }
  }
];

export function getSpiritTemplate(element: ElementType): SpiritTemplate {
  const template = SPIRIT_TEMPLATES.find(t => t.element === element);
  if (!template) {
    throw new Error(`No spirit template found for element: ${element}`);
  }
  return template;
}

export function createSkillsFromTemplate(template: SpiritTemplate): Skill[] {
  return template.activeSkills.map(skill => ({
    ...skill,
    currentCooldown: 0
  }));
}
