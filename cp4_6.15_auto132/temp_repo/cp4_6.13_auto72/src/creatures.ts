export interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'passive';
  damage: number;
  cooldown: number;
  range: number;
  effect?: 'burn' | 'freeze' | 'poison' | 'heal' | 'buff' | 'debuff' | 'thunder' | 'light' | 'earth' | 'water' | 'wind';
  effectValue?: number;
  effectDuration?: number;
  animationType: 'fire' | 'ice' | 'thunder' | 'dark' | 'light' | 'wind' | 'earth' | 'water' | 'poison';
}

export interface Creature {
  id: string;
  name: string;
  element: 'fire' | 'ice' | 'thunder' | 'dark' | 'light' | 'wind' | 'earth' | 'water' | 'poison';
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
  mainSkill: Skill;
  passiveSkill: Skill;
  equippedSkills: Skill[];
  position?: number;
  isEnemy?: boolean;
  emoji: string;
  cost: number;
}

export const allCreatures: Omit<Creature, 'position' | 'isEnemy' | 'equippedSkills' | 'level'>[] = [
  {
    id: 'fire-spirit',
    name: '火焰精灵',
    element: 'fire',
    maxHp: 100,
    currentHp: 100,
    attack: 25,
    defense: 8,
    speed: 12,
    emoji: '🔥',
    cost: 100,
    mainSkill: {
      id: 'fireball',
      name: '烈焰火球',
      description: '发射炽热的火球，造成火焰伤害并附加灼烧效果',
      type: 'active',
      damage: 35,
      cooldown: 2,
      range: 3,
      effect: 'burn',
      effectValue: 5,
      effectDuration: 3,
      animationType: 'fire',
    },
    passiveSkill: {
      id: 'burn-aura',
      name: '灼烧光环',
      description: '攻击时有30%概率使目标灼烧',
      type: 'passive',
      damage: 0,
      cooldown: 0,
      range: 0,
      effect: 'burn',
      effectValue: 3,
      effectDuration: 2,
      animationType: 'fire',
    },
  },
  {
    id: 'ice-lizard',
    name: '冰霜巨蜥',
    element: 'ice',
    maxHp: 150,
    currentHp: 150,
    attack: 18,
    defense: 15,
    speed: 6,
    emoji: '🦎',
    cost: 120,
    mainSkill: {
      id: 'frost-bite',
      name: '寒冰撕咬',
      description: '近战攻击并冻结目标，降低其速度',
      type: 'active',
      damage: 25,
      cooldown: 3,
      range: 1,
      effect: 'freeze',
      effectValue: 30,
      effectDuration: 2,
      animationType: 'ice',
    },
    passiveSkill: {
      id: 'ice-armor',
      name: '冰晶护甲',
      description: '受到攻击时有20%概率冻结攻击者',
      type: 'passive',
      damage: 0,
      cooldown: 0,
      range: 0,
      effect: 'freeze',
      effectValue: 20,
      effectDuration: 1,
      animationType: 'ice',
    },
  },
  {
    id: 'thunder-eagle',
    name: '雷霆神鹰',
    element: 'thunder',
    maxHp: 90,
    currentHp: 90,
    attack: 30,
    defense: 6,
    speed: 18,
    emoji: '🦅',
    cost: 130,
    mainSkill: {
      id: 'lightning-strike',
      name: '雷霆一击',
      description: '召唤雷电劈向目标，造成高额伤害',
      type: 'active',
      damage: 45,
      cooldown: 3,
      range: 4,
      effect: 'thunder',
      animationType: 'thunder',
    },
    passiveSkill: {
      id: 'swift-wings',
      name: '疾风之翼',
      description: '提升自身速度，优先行动',
      type: 'passive',
      damage: 0,
      cooldown: 0,
      range: 0,
      effect: 'buff',
      effectValue: 5,
      animationType: 'thunder',
    },
  },
  {
    id: 'shadow-bat',
    name: '暗影蝙蝠',
    element: 'dark',
    maxHp: 85,
    currentHp: 85,
    attack: 22,
    defense: 5,
    speed: 15,
    emoji: '🦇',
    cost: 110,
    mainSkill: {
      id: 'shadow-wave',
      name: '暗影冲击',
      description: '释放暗影能量波，造成伤害并降低防御',
      type: 'active',
      damage: 30,
      cooldown: 2,
      range: 2,
      effect: 'debuff',
      effectValue: 5,
      effectDuration: 3,
      animationType: 'dark',
    },
    passiveSkill: {
      id: 'life-drain',
      name: '生命汲取',
      description: '攻击时回复造成伤害的15%生命值',
      type: 'passive',
      damage: 0,
      cooldown: 0,
      range: 0,
      effect: 'heal',
      effectValue: 15,
      animationType: 'dark',
    },
  },
  {
    id: 'light-angel',
    name: '光明天使',
    element: 'light',
    maxHp: 110,
    currentHp: 110,
    attack: 20,
    defense: 10,
    speed: 10,
    emoji: '👼',
    cost: 150,
    mainSkill: {
      id: 'holy-light',
      name: '圣光术',
      description: '释放神圣光芒，治疗己方最虚弱的单位',
      type: 'active',
      damage: 0,
      cooldown: 3,
      range: 5,
      effect: 'heal',
      effectValue: 40,
      animationType: 'light',
    },
    passiveSkill: {
      id: 'divine-shield',
      name: '神圣护盾',
      description: '每回合开始时，为己方全体提供5点护甲',
      type: 'passive',
      damage: 0,
      cooldown: 0,
      range: 0,
      effect: 'buff',
      effectValue: 5,
      animationType: 'light',
    },
  },
  {
    id: 'wind-sprite',
    name: '风元素精灵',
    element: 'wind',
    maxHp: 80,
    currentHp: 80,
    attack: 24,
    defense: 4,
    speed: 20,
    emoji: '🌪️',
    cost: 105,
    mainSkill: {
      id: 'tornado',
      name: '龙卷风',
      description: '召唤龙卷风横扫战场，对多个目标造成伤害',
      type: 'active',
      damage: 28,
      cooldown: 3,
      range: 3,
      effect: 'wind',
      animationType: 'wind',
    },
    passiveSkill: {
      id: 'agile-breeze',
      name: '敏捷微风',
      description: '提升己方全体速度',
      type: 'passive',
      damage: 0,
      cooldown: 0,
      range: 0,
      effect: 'buff',
      effectValue: 3,
      animationType: 'wind',
    },
  },
  {
    id: 'earth-golem',
    name: '岩石巨像',
    element: 'earth',
    maxHp: 200,
    currentHp: 200,
    attack: 15,
    defense: 25,
    speed: 3,
    emoji: '🗿',
    cost: 140,
    mainSkill: {
      id: 'earthquake',
      name: '大地震颤',
      description: '猛击地面造成地震，对范围内敌人造成伤害',
      type: 'active',
      damage: 35,
      cooldown: 4,
      range: 2,
      effect: 'earth',
      animationType: 'earth',
    },
    passiveSkill: {
      id: 'stone-skin',
      name: '石肤术',
      description: '受到的物理伤害降低20%',
      type: 'passive',
      damage: 0,
      cooldown: 0,
      range: 0,
      effect: 'buff',
      effectValue: 20,
      animationType: 'earth',
    },
  },
  {
    id: 'water-serpent',
    name: '深海巨蟒',
    element: 'water',
    maxHp: 130,
    currentHp: 130,
    attack: 20,
    defense: 12,
    speed: 9,
    emoji: '🐍',
    cost: 115,
    mainSkill: {
      id: 'tidal-wave',
      name: '潮汐巨浪',
      description: '召唤巨浪冲击敌人，造成伤害并减速',
      type: 'active',
      damage: 30,
      cooldown: 3,
      range: 3,
      effect: 'debuff',
      effectValue: 25,
      effectDuration: 2,
      animationType: 'water',
    },
    passiveSkill: {
      id: 'regen-water',
      name: '生命之泉',
      description: '每回合恢复少量生命值',
      type: 'passive',
      damage: 0,
      cooldown: 0,
      range: 0,
      effect: 'heal',
      effectValue: 8,
      animationType: 'water',
    },
  },
  {
    id: 'poison-spider',
    name: '剧毒蜘蛛',
    element: 'poison',
    maxHp: 95,
    currentHp: 95,
    attack: 22,
    defense: 7,
    speed: 11,
    emoji: '🕷️',
    cost: 125,
    mainSkill: {
      id: 'venom-spit',
      name: '剧毒吐息',
      description: '喷射剧毒，造成持续毒素伤害',
      type: 'active',
      damage: 20,
      cooldown: 2,
      range: 2,
      effect: 'poison',
      effectValue: 10,
      effectDuration: 4,
      animationType: 'poison',
    },
    passiveSkill: {
      id: 'toxic-body',
      name: '剧毒之体',
      description: '受到攻击时使攻击者中毒',
      type: 'passive',
      damage: 0,
      cooldown: 0,
      range: 0,
      effect: 'poison',
      effectValue: 5,
      effectDuration: 3,
      animationType: 'poison',
    },
  },
];

export const extraSkills: Skill[] = [
  {
    id: 'power-strike',
    name: '力量打击',
    description: '提升攻击力15%',
    type: 'passive',
    damage: 0,
    cooldown: 0,
    range: 0,
    effect: 'buff',
    effectValue: 15,
    animationType: 'fire',
  },
  {
    id: 'iron-skin',
    name: '铁皮术',
    description: '提升防御力10点',
    type: 'passive',
    damage: 0,
    cooldown: 0,
    range: 0,
    effect: 'buff',
    effectValue: 10,
    animationType: 'earth',
  },
  {
    id: 'swift-move',
    name: '迅捷步法',
    description: '提升速度5点',
    type: 'passive',
    damage: 0,
    cooldown: 0,
    range: 0,
    effect: 'buff',
    effectValue: 5,
    animationType: 'wind',
  },
  {
    id: 'vampiric',
    name: '吸血打击',
    description: '攻击时恢复10%伤害的生命',
    type: 'passive',
    damage: 0,
    cooldown: 0,
    range: 0,
    effect: 'heal',
    effectValue: 10,
    animationType: 'dark',
  },
];

export function createCreatureInstance(creatureId: string, level: number = 1, isEnemy: boolean = false): Creature {
  const template = allCreatures.find(c => c.id === creatureId);
  if (!template) throw new Error(`Creature not found: ${creatureId}`);
  
  const levelMultiplier = 1 + (level - 1) * 0.15;
  
  return {
    ...template,
    id: `${template.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    level,
    maxHp: Math.floor(template.maxHp * levelMultiplier),
    currentHp: Math.floor(template.maxHp * levelMultiplier),
    attack: Math.floor(template.attack * levelMultiplier),
    defense: Math.floor(template.defense * levelMultiplier),
    speed: template.speed,
    equippedSkills: [],
    isEnemy,
  };
}

export function upgradeCreature(creature: Creature): Creature {
  const newLevel = creature.level + 1;
  const levelMultiplier = 1 + (newLevel - 1) * 0.15;
  const template = allCreatures.find(c => c.id === creature.id.split('-')[0] + '-' + creature.id.split('-')[1]) || allCreatures.find(c => creature.name.includes(c.name));
  
  if (!template) return creature;
  
  return {
    ...creature,
    level: newLevel,
    maxHp: Math.floor(template.maxHp * levelMultiplier),
    currentHp: Math.floor(template.maxHp * levelMultiplier),
    attack: Math.floor(template.attack * levelMultiplier),
    defense: Math.floor(template.defense * levelMultiplier),
  };
}

export function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    fire: '#ff6b35',
    ice: '#4fc3f7',
    thunder: '#ffd93d',
    dark: '#7c3aed',
    light: '#fbbf24',
    wind: '#34d399',
    earth: '#a16207',
    water: '#3b82f6',
    poison: '#22c55e',
  };
  return colors[element] || '#6b7280';
}
