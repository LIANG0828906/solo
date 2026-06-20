import type { Unit, HeroClass } from '../types';

const HERO_CONFIGS: Record<HeroClass, Omit<Unit, 'id' | 'position' | 'team'>> = {
  warrior: {
    name: '战士',
    heroClass: 'warrior',
    hp: 120,
    maxHp: 120,
    atk: 25,
    def: 15,
    move: 3,
    critChance: 0.15,
    color: '#FF6B6B',
    skills: [
      {
        id: 'warrior_smash',
        name: '猛击',
        description: '造成1.5倍伤害，冷却1回合',
        damageMultiplier: 1.5,
        cooldown: 1,
        currentCooldown: 0,
        ignoreDefensePercent: 0,
        burnDamagePerTurn: 0,
        burnDuration: 0,
        range: 1,
      },
      {
        id: 'warrior_basic',
        name: '普通攻击',
        description: '造成1倍伤害',
        damageMultiplier: 1,
        cooldown: 0,
        currentCooldown: 0,
        ignoreDefensePercent: 0,
        burnDamagePerTurn: 0,
        burnDuration: 0,
        range: 1,
      },
    ],
    statusEffects: [],
    hasMoved: false,
    hasActed: false,
    isDead: false,
  },
  mage: {
    name: '法师',
    heroClass: 'mage',
    hp: 70,
    maxHp: 70,
    atk: 40,
    def: 8,
    move: 2,
    critChance: 0.10,
    color: '#4ECDC4',
    skills: [
      {
        id: 'mage_fireball',
        name: '火球',
        description: '造成2倍伤害并灼烧3回合，每回合5伤害，冷却2回合',
        damageMultiplier: 2,
        cooldown: 2,
        currentCooldown: 0,
        ignoreDefensePercent: 0,
        burnDamagePerTurn: 5,
        burnDuration: 3,
        range: 3,
      },
      {
        id: 'mage_basic',
        name: '普通攻击',
        description: '造成1倍伤害',
        damageMultiplier: 1,
        cooldown: 0,
        currentCooldown: 0,
        ignoreDefensePercent: 0,
        burnDamagePerTurn: 0,
        burnDuration: 0,
        range: 3,
      },
    ],
    statusEffects: [],
    hasMoved: false,
    hasActed: false,
    isDead: false,
  },
  archer: {
    name: '射手',
    heroClass: 'archer',
    hp: 90,
    maxHp: 90,
    atk: 30,
    def: 10,
    move: 4,
    critChance: 0.20,
    color: '#FFD93D',
    skills: [
      {
        id: 'archer_precise',
        name: '精准射击',
        description: '无视30%防御，冷却1回合',
        damageMultiplier: 1,
        cooldown: 1,
        currentCooldown: 0,
        ignoreDefensePercent: 30,
        burnDamagePerTurn: 0,
        burnDuration: 0,
        range: 4,
      },
      {
        id: 'archer_basic',
        name: '普通攻击',
        description: '造成1倍伤害',
        damageMultiplier: 1,
        cooldown: 0,
        currentCooldown: 0,
        ignoreDefensePercent: 0,
        burnDamagePerTurn: 0,
        burnDuration: 0,
        range: 4,
      },
    ],
    statusEffects: [],
    hasMoved: false,
    hasActed: false,
    isDead: false,
  },
};

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

let idCounter = 0;
function genId(prefix: string): string {
  idCounter++;
  return `${prefix}_${idCounter}_${Date.now()}`;
}

export function createHeroes(): Unit[] {
  idCounter = 0;
  return [
    {
      ...deepClone(HERO_CONFIGS.warrior),
      id: genId('hero'),
      team: 'player',
      position: { q: 1, r: 3 },
    },
    {
      ...deepClone(HERO_CONFIGS.mage),
      id: genId('hero'),
      team: 'player',
      position: { q: 1, r: 4 },
    },
    {
      ...deepClone(HERO_CONFIGS.archer),
      id: genId('hero'),
      team: 'player',
      position: { q: 1, r: 5 },
    },
  ];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createEnemySkill(range: number) {
  return {
    id: genId('skill'),
    name: '攻击',
    description: '基础攻击',
    damageMultiplier: 1,
    cooldown: 0,
    currentCooldown: 0,
    ignoreDefensePercent: 0,
    burnDamagePerTurn: 0,
    burnDuration: 0,
    range,
  };
}

export function createEnemies(): Unit[] {
  const classes: HeroClass[] = ['warrior', 'mage', 'archer'];
  const positions = [
    { q: 9, r: 1 },
    { q: 9, r: 3 },
    { q: 9, r: 4 },
    { q: 9, r: 5 },
    { q: 9, r: 7 },
  ];

  return positions.map((pos, idx) => {
    const hp = randInt(70, 100);
    const atk = randInt(15, 30);
    const def = randInt(5, 12);
    const move = randInt(2, 3);
    const cls = classes[idx % 3];
    const range = cls === 'warrior' ? 1 : cls === 'mage' ? 3 : 4;

    return {
      id: genId('enemy'),
      name: `敌人${idx + 1}`,
      heroClass: cls,
      team: 'enemy' as const,
      position: pos,
      hp,
      maxHp: hp,
      atk,
      def,
      move,
      critChance: 0.1,
      color: cls === 'warrior' ? '#C0392B' : cls === 'mage' ? '#8E44AD' : '#D35400',
      skills: [createEnemySkill(range)],
      statusEffects: [],
      hasMoved: false,
      hasActed: false,
      isDead: false,
    };
  });
}
