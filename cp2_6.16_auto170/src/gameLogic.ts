import { v4 as uuidv4 } from 'uuid';
import type {
  RuneType,
  Rune,
  Spell,
  Monster,
  MonsterShape,
  Player,
  BattleState,
  BattleLogEntry,
  StatusEffect,
  CraftResult,
  SpellElement,
  BossSkill,
} from './types';

export const RUNE_CONFIG: Record<RuneType, { name: string; color: string; icon: string }> = {
  fire: { name: '烈焰符文', color: '#FF4500', icon: '🔥' },
  water: { name: '寒冰符文', color: '#1E90FF', icon: '💧' },
  earth: { name: '厚土符文', color: '#8B4513', icon: '🪨' },
  wind: { name: '疾风符文', color: '#98FB98', icon: '🌪️' },
  light: { name: '圣光符文', color: '#FFD700', icon: '✨' },
  dark: { name: '暗影符文', color: '#4B0082', icon: '🌑' },
};

export const MAX_RUNE_STACK = 9;

interface SpellRecipe {
  recipe: RuneType[];
  name: string;
  icon: string;
  description: string;
  baseDamage: number;
  element: SpellElement;
  cooldown: number;
  isAoe?: boolean;
  animationType: Spell['animationType'];
  effects?: StatusEffect[];
}

const normalizeRecipe = (recipe: RuneType[]): string => {
  return [...recipe].sort().join(',');
};

const SPELL_RECIPES: SpellRecipe[] = [
  {
    recipe: ['fire', 'fire', 'fire', 'fire'],
    name: '炽焰风暴',
    icon: '🌋',
    description: '召唤地狱之火，造成巨额火焰伤害',
    baseDamage: 45,
    element: 'fire',
    cooldown: 3,
    isAoe: true,
    animationType: 'fireball',
    effects: [{ type: 'burn', duration: 2, value: 8 }],
  },
  {
    recipe: ['fire', 'fire', 'water', 'wind'],
    name: '暴风雪',
    icon: '❄️',
    description: 'AOE冰冻伤害，有几率冻结敌人',
    baseDamage: 28,
    element: 'water',
    cooldown: 2,
    isAoe: true,
    animationType: 'ice',
    effects: [{ type: 'freeze', duration: 1, value: 0 }],
  },
  {
    recipe: ['fire', 'fire', 'earth', 'earth'],
    name: '陨石术',
    icon: '☄️',
    description: '召唤陨石砸向敌人',
    baseDamage: 38,
    element: 'combo',
    cooldown: 3,
    animationType: 'explosion',
  },
  {
    recipe: ['water', 'water', 'water', 'water'],
    name: '海啸',
    icon: '🌊',
    description: '滔天巨浪席卷一切',
    baseDamage: 40,
    element: 'water',
    cooldown: 3,
    isAoe: true,
    animationType: 'ice',
  },
  {
    recipe: ['water', 'water', 'earth', 'earth'],
    name: '泥沼陷阱',
    icon: '🏞️',
    description: '生成泥沼减速并造成伤害',
    baseDamage: 22,
    element: 'earth',
    cooldown: 2,
    animationType: 'earth',
    effects: [{ type: 'freeze', duration: 1, value: 0 }],
  },
  {
    recipe: ['earth', 'earth', 'earth', 'earth'],
    name: '山崩地裂',
    icon: '⛰️',
    description: '大地震荡造成毁灭伤害',
    baseDamage: 42,
    element: 'earth',
    cooldown: 3,
    isAoe: true,
    animationType: 'earth',
  },
  {
    recipe: ['wind', 'wind', 'wind', 'wind'],
    name: '飓风撕裂',
    icon: '🌀',
    description: '风暴之刃撕碎敌人',
    baseDamage: 35,
    element: 'wind',
    cooldown: 2,
    isAoe: true,
    animationType: 'wind',
  },
  {
    recipe: ['wind', 'wind', 'fire', 'fire'],
    name: '烈焰旋风',
    icon: '🔥',
    description: '火与风的结合，燃烧风暴',
    baseDamage: 32,
    element: 'combo',
    cooldown: 2,
    animationType: 'fireball',
    effects: [{ type: 'burn', duration: 2, value: 6 }],
  },
  {
    recipe: ['light', 'light', 'light', 'light'],
    name: '神圣裁决',
    icon: '⚡',
    description: '圣光审判邪恶',
    baseDamage: 45,
    element: 'light',
    cooldown: 3,
    animationType: 'light',
    effects: [{ type: 'heal', duration: 0, value: 15 }],
  },
  {
    recipe: ['dark', 'dark', 'dark', 'dark'],
    name: '虚空吞噬',
    icon: '🕳️',
    description: '暗影吞噬一切生命',
    baseDamage: 48,
    element: 'dark',
    cooldown: 3,
    animationType: 'dark',
    effects: [{ type: 'poison', duration: 3, value: 5 }],
  },
  {
    recipe: ['light', 'light', 'dark', 'dark'],
    name: '混沌之力',
    icon: '🌓',
    description: '光与暗的融合，混沌爆发',
    baseDamage: 50,
    element: 'chaos',
    cooldown: 4,
    animationType: 'explosion',
  },
  {
    recipe: ['fire', 'water', 'earth', 'wind'],
    name: '元素爆发',
    icon: '💫',
    description: '四元素共鸣，终极爆发',
    baseDamage: 55,
    element: 'combo',
    cooldown: 4,
    isAoe: true,
    animationType: 'explosion',
  },
  {
    recipe: ['fire', 'fire', 'light', 'light'],
    name: '圣火术',
    icon: '☀️',
    description: '神圣火焰净化敌人',
    baseDamage: 36,
    element: 'light',
    cooldown: 2,
    animationType: 'light',
    effects: [{ type: 'burn', duration: 2, value: 6 }, { type: 'heal', duration: 0, value: 8 }],
  },
  {
    recipe: ['dark', 'dark', 'water', 'water'],
    name: '腐蚀之雨',
    icon: '🌧️',
    description: '毒雨倾泻，腐蚀万物',
    baseDamage: 28,
    element: 'dark',
    cooldown: 2,
    isAoe: true,
    animationType: 'dark',
    effects: [{ type: 'poison', duration: 3, value: 6 }],
  },
  {
    recipe: ['wind', 'wind', 'light', 'light'],
    name: '圣光风行',
    icon: '💨',
    description: '风之速度+圣光之盾',
    baseDamage: 25,
    element: 'light',
    cooldown: 2,
    animationType: 'wind',
    effects: [{ type: 'shield', duration: 2, value: 15 }],
  },
  {
    recipe: ['earth', 'earth', 'dark', 'dark'],
    name: '地脉侵蚀',
    icon: '🖤',
    description: '黑暗大地的腐蚀',
    baseDamage: 30,
    element: 'dark',
    cooldown: 2,
    animationType: 'earth',
    effects: [{ type: 'poison', duration: 2, value: 8 }],
  },
];

const RECIPE_MAP: Map<string, SpellRecipe> = new Map(
  SPELL_RECIPES.map((r) => [normalizeRecipe(r.recipe), r])
);

export const createInitialRunes = (): Record<RuneType, Rune> => {
  const types: RuneType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
  const runes: Record<string, Rune> = {};
  for (const t of types) {
    runes[t] = {
      id: uuidv4(),
      type: t,
      name: RUNE_CONFIG[t].name,
      color: RUNE_CONFIG[t].color,
      count: 3,
      icon: RUNE_CONFIG[t].icon,
    };
  }
  return runes as Record<RuneType, Rune>;
};

export const tryCraftRunes = (slots: (RuneType | null)[]): CraftResult => {
  if (slots.some((s) => s === null)) {
    return { success: false, reason: '合成槽未填满' };
  }
  const filledSlots = slots.filter((s): s is RuneType => s !== null);
  const key = normalizeRecipe(filledSlots);
  const recipe = RECIPE_MAP.get(key);

  if (!recipe) {
    return { success: false, reason: '未知的符文组合' };
  }

  const spell: Spell = {
    id: uuidv4(),
    name: recipe.name,
    icon: recipe.icon,
    description: recipe.description,
    baseDamage: recipe.baseDamage,
    element: recipe.element,
    cooldown: recipe.cooldown,
    currentCooldown: 0,
    recipe: [...filledSlots],
    isAoe: recipe.isAoe,
    animationType: recipe.animationType,
    effects: recipe.effects ? [...recipe.effects] : undefined,
  };

  return { success: true, spell };
};

export const calculateSpellDamage = (
  spell: Spell,
  monster: Monster,
  playerLevel: number
): { damage: number; effects: StatusEffect[] } => {
  const levelMultiplier = 1 + (playerLevel - 1) * 0.1;
  let baseDamage = Math.floor(spell.baseDamage * levelMultiplier);

  const isElementStrong =
    (spell.element === 'fire' && monster.shape === 'slime') ||
    (spell.element === 'water' && monster.shape === 'bat') ||
    (spell.element === 'earth' && monster.shape === 'skeleton') ||
    (spell.element === 'wind' && monster.shape === 'spider') ||
    (spell.element === 'light' && monster.isBoss) ||
    (spell.element === 'dark' && !monster.isBoss);

  if (isElementStrong) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }

  if (monster.isBoss) {
    baseDamage = Math.floor(baseDamage * 0.85);
  }

  return {
    damage: Math.max(1, baseDamage),
    effects: spell.effects ? spell.effects.map((e) => ({ ...e })) : [],
  };
};

export const calculateMonsterDamage = (monster: Monster, playerDefense: number): number => {
  const base = monster.attack;
  const reduced = Math.floor(base * (1 - playerDefense / (playerDefense + 50)));
  return Math.max(1, reduced);
};

const MONSTER_NAMES = ['史莱姆', '蝙蝠', '毒蛛', '骷髅兵', '幽灵', '地精', '石像鬼'];
const BOSS_NAMES = ['独眼巨人', '深渊领主', '混沌巨龙', '堕落天使', '虚空君王'];
const SHAPES: MonsterShape[] = ['slime', 'bat', 'spider', 'skeleton'];
const MONSTER_COLORS = ['#22C55E', '#A855F7', '#EC4899', '#64748B', '#14B8A6', '#F97316'];
const BOSS_COLOR = '#1A1A1A';

export const generateMonster = (level: number, isBoss: boolean): Monster => {
  const multiplier = Math.pow(1.1, level - 1);
  const baseHp = isBoss ? 120 : 50;
  const baseAtk = isBoss ? 18 : 8;

  const shape: MonsterShape = isBoss ? 'cyclops' : SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const color = isBoss ? BOSS_COLOR : MONSTER_COLORS[Math.floor(Math.random() * MONSTER_COLORS.length)];
  const namePool = isBoss ? BOSS_NAMES : MONSTER_NAMES;
  const name = (isBoss ? 'BOSS·' : '') + namePool[Math.floor(Math.random() * namePool.length)] + (level > 3 ? ` Lv.${level}` : '');

  const skills: BossSkill[] = isBoss ? ['stun_all', 'heavy_smash'] : [];

  return {
    id: uuidv4(),
    name,
    hp: Math.floor(baseHp * multiplier),
    maxHp: Math.floor(baseHp * multiplier),
    attack: Math.floor(baseAtk * multiplier),
    level,
    isBoss,
    color,
    shape,
    specialSkills: skills,
    statusEffects: [],
  };
};

export const createInitialPlayer = (): Player => ({
  hp: 100,
  maxHp: 100,
  defense: 10,
  level: 1,
  currentStage: 1,
  statusEffects: [],
});

export const createInitialBattleState = (): BattleState => ({
  player: createInitialPlayer(),
  monster: generateMonster(1, false),
  turn: 1,
  phase: 'player_turn',
  isPlayerStunned: false,
  bossSkillCooldown: 0,
});

export const generateRuneDrops = (monsterLevel: number, isBoss: boolean): RuneType[] => {
  const types: RuneType[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
  const count = isBoss ? 3 : 1 + Math.floor(Math.random() * 3);
  const drops: RuneType[] = [];
  for (let i = 0; i < count; i++) {
    drops.push(types[Math.floor(Math.random() * types.length)]);
  }
  return drops;
};

export const tickStatusEffects = (
  target: { hp: number; maxHp: number; statusEffects: StatusEffect[] }
): { hp: number; statusEffects: StatusEffect[]; tickDamage: number; healAmount: number } => {
  let tickDamage = 0;
  let healAmount = 0;
  const newEffects: StatusEffect[] = [];

  for (const eff of target.statusEffects) {
    if (eff.type === 'burn' || eff.type === 'poison') {
      tickDamage += eff.value;
    }
    if (eff.type === 'heal') {
      healAmount += eff.value;
    }
    if (eff.duration > 1) {
      newEffects.push({ ...eff, duration: eff.duration - 1 });
    } else if (eff.duration === 0 && eff.type === 'shield') {
      newEffects.push({ ...eff });
    } else if (eff.duration > 0) {
      // duration 1: last tick applied, now removed
    }
  }

  let newHp = target.hp - tickDamage + healAmount;
  newHp = Math.min(target.maxHp, Math.max(0, newHp));

  return { hp: newHp, statusEffects: newEffects, tickDamage, healAmount };
};

export const decrementSpellCooldowns = (spells: Spell[]): Spell[] => {
  return spells.map((s) => ({
    ...s,
    currentCooldown: Math.max(0, s.currentCooldown - 1),
  }));
};

export const createBattleLog = (
  turn: number,
  actor: 'player' | 'monster' | 'system',
  message: string,
  damage?: number
): BattleLogEntry => ({
  id: uuidv4(),
  turn,
  actor,
  message,
  damage,
  timestamp: Date.now(),
});

export const hasStunEffect = (effects: StatusEffect[]): boolean => {
  return effects.some((e) => e.type === 'stun' && e.duration > 0);
};

export const getShieldValue = (effects: StatusEffect[]): number => {
  return effects.filter((e) => e.type === 'shield').reduce((sum, e) => sum + e.value, 0);
};
