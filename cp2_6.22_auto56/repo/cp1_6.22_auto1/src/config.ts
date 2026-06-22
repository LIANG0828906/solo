export type Race = 'human' | 'orc' | 'elf' | 'undead';
export type HeroClass = 'warrior' | 'mage' | 'archer' | 'healer';
export type SkillEffect = 'fire' | 'heal' | 'shield' | 'lightning';
export type SkillType = 'damage' | 'buff' | 'aoe';

export interface SkillConfig {
  name: string;
  type: SkillType;
  damage: number;
  cooldown: number;
  range: number;
  effect: SkillEffect;
  description: string;
}

export interface HeroConfig {
  id: string;
  name: string;
  race: Race;
  class: HeroClass;
  maxHp: number;
  attack: number;
  attackRange: number;
  skill: SkillConfig;
  pixelColor: string;
  description: string;
}

export const BOARD_COLS = 6;
export const BOARD_ROWS = 4;
export const ATTACK_INTERVAL = 1000;
export const CELL_SIZE = 80;
export const CARD_WIDTH = 100;
export const CARD_HEIGHT = 140;

export const RACE_COLORS: Record<Race, string> = {
  human: '#4a9eff',
  orc: '#50c878',
  elf: '#9370db',
  undead: '#8b0000'
};

export const CLASS_ICONS: Record<HeroClass, string> = {
  warrior: '⚔',
  mage: '✦',
  archer: '➹',
  healer: '♥'
};

export const CLASS_COLORS: Record<HeroClass, string> = {
  warrior: '#cd7f32',
  mage: '#9932cc',
  archer: '#228b22',
  healer: '#ff69b4'
};

export const HERO_CONFIGS: HeroConfig[] = [
  {
    id: 'human_warrior',
    name: '人族战士',
    race: 'human',
    class: 'warrior',
    maxHp: 120,
    attack: 25,
    attackRange: 1,
    pixelColor: '#4a9eff',
    description: '高生命值近战单位',
    skill: {
      name: '猛击',
      type: 'damage',
      damage: 40,
      cooldown: 3000,
      range: 1,
      effect: 'fire',
      description: '对单个敌人造成大量伤害'
    }
  },
  {
    id: 'human_mage',
    name: '人族法师',
    race: 'human',
    class: 'mage',
    maxHp: 70,
    attack: 35,
    attackRange: 3,
    pixelColor: '#6495ed',
    description: '远程魔法输出',
    skill: {
      name: '火球术',
      type: 'aoe',
      damage: 30,
      cooldown: 4000,
      range: 3,
      effect: 'fire',
      description: '对范围内敌人造成火焰伤害'
    }
  },
  {
    id: 'human_archer',
    name: '人族弓箭手',
    race: 'human',
    class: 'archer',
    maxHp: 80,
    attack: 30,
    attackRange: 4,
    pixelColor: '#87ceeb',
    description: '远程物理输出',
    skill: {
      name: '穿透箭',
      type: 'damage',
      damage: 50,
      cooldown: 3500,
      range: 5,
      effect: 'lightning',
      description: '发射穿透性箭矢'
    }
  },
  {
    id: 'orc_warrior',
    name: '兽族战士',
    race: 'orc',
    class: 'warrior',
    maxHp: 150,
    attack: 30,
    attackRange: 1,
    pixelColor: '#50c878',
    description: '超高生命值坦克',
    skill: {
      name: '狂暴',
      type: 'buff',
      damage: 0,
      cooldown: 5000,
      range: 0,
      effect: 'shield',
      description: '提升自身攻击力50%'
    }
  },
  {
    id: 'orc_archer',
    name: '兽族猎手',
    race: 'orc',
    class: 'archer',
    maxHp: 90,
    attack: 35,
    attackRange: 3,
    pixelColor: '#3cb371',
    description: '远程高伤害',
    skill: {
      name: '毒箭',
      type: 'damage',
      damage: 25,
      cooldown: 2500,
      range: 4,
      effect: 'fire',
      description: '造成持续毒素伤害'
    }
  },
  {
    id: 'elf_mage',
    name: '精灵法师',
    race: 'elf',
    class: 'mage',
    maxHp: 65,
    attack: 40,
    attackRange: 4,
    pixelColor: '#9370db',
    description: '高爆发魔法输出',
    skill: {
      name: '闪电链',
      type: 'aoe',
      damage: 35,
      cooldown: 4500,
      range: 4,
      effect: 'lightning',
      description: '闪电在敌人间跳跃'
    }
  },
  {
    id: 'elf_healer',
    name: '精灵祭司',
    race: 'elf',
    class: 'healer',
    maxHp: 75,
    attack: 15,
    attackRange: 3,
    pixelColor: '#ba55d3',
    description: '治疗友方单位',
    skill: {
      name: '治愈之光',
      type: 'buff',
      damage: 45,
      cooldown: 3000,
      range: 3,
      effect: 'heal',
      description: '恢复友方单位生命值'
    }
  },
  {
    id: 'undead_warrior',
    name: '亡灵骑士',
    race: 'undead',
    class: 'warrior',
    maxHp: 130,
    attack: 28,
    attackRange: 1,
    pixelColor: '#8b0000',
    description: '吸血近战单位',
    skill: {
      name: '生命汲取',
      type: 'damage',
      damage: 35,
      cooldown: 3000,
      range: 1,
      effect: 'fire',
      description: '造成伤害并回复生命'
    }
  },
  {
    id: 'undead_mage',
    name: '亡灵法师',
    race: 'undead',
    class: 'mage',
    maxHp: 75,
    attack: 38,
    attackRange: 3,
    pixelColor: '#a52a2a',
    description: '黑暗魔法输出',
    skill: {
      name: '死亡凋零',
      type: 'aoe',
      damage: 28,
      cooldown: 4000,
      range: 3,
      effect: 'fire',
      description: '对区域造成持续伤害'
    }
  },
  {
    id: 'undead_healer',
    name: '亡灵祭司',
    race: 'undead',
    class: 'healer',
    maxHp: 85,
    attack: 20,
    attackRange: 2,
    pixelColor: '#b22222',
    description: '召唤亡灵辅助',
    skill: {
      name: '黑暗治愈',
      type: 'buff',
      damage: 40,
      cooldown: 3500,
      range: 3,
      effect: 'heal',
      description: '治愈亡灵友军'
    }
  }
];

export const ENEMY_HERO_IDS = [
  'orc_warrior',
  'orc_archer',
  'undead_warrior',
  'undead_mage',
  'human_mage',
  'elf_mage'
];
