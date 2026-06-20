export type SkillType = 'aoe' | 'heal' | 'shield' | 'single' | 'lifesteal';
export type ParticleType = 'fire' | 'ice' | 'lightning' | 'heal' | 'shield';
export type Team = 'blue' | 'red';
export type Role = 'warrior' | 'mage' | 'assassin' | 'ranger' | 'tank' | 'support';
export type Race = 'human' | 'beast' | 'elf' | 'undead' | 'dragon' | 'mech';

export interface SkillDef {
  name: string;
  type: SkillType;
  damage: number;
  healAmount: number;
  shieldAmount: number;
  range: number;
  rageCost: number;
  particleType: ParticleType;
}

export interface SynergyTier {
  count: number;
  effect: string;
  value: number;
}

export interface SynergyDef {
  name: string;
  type: 'role' | 'race';
  key: string;
  tiers: SynergyTier[];
  color: string;
}

export interface HeroDef {
  id: string;
  name: string;
  cost: number;
  role: Role;
  race: Race;
  maxHp: number;
  attack: number;
  attackSpeed: number;
  attackRange: number;
  moveSpeed: number;
  skill: SkillDef;
  emoji: string;
}

export const SYNERGY_DEFS: SynergyDef[] = [
  { name: '战士', type: 'role', key: 'warrior', tiers: [{ count: 2, effect: 'armor', value: 0.15 }, { count: 4, effect: 'armor', value: 0.30 }], color: '#ffd700' },
  { name: '法师', type: 'role', key: 'mage', tiers: [{ count: 2, effect: 'sp', value: 0.20 }, { count: 4, effect: 'sp', value: 0.40 }], color: '#9b59b6' },
  { name: '刺客', type: 'role', key: 'assassin', tiers: [{ count: 2, effect: 'crit', value: 0.20 }, { count: 3, effect: 'crit', value: 0.40 }], color: '#e74c3c' },
  { name: '射手', type: 'role', key: 'ranger', tiers: [{ count: 2, effect: 'range', value: 0.15 }, { count: 4, effect: 'range', value: 0.30 }], color: '#2ecc71' },
  { name: '坦克', type: 'role', key: 'tank', tiers: [{ count: 2, effect: 'hp', value: 200 }, { count: 4, effect: 'hp', value: 400 }], color: '#3498db' },
  { name: '辅助', type: 'role', key: 'support', tiers: [{ count: 2, effect: 'healBoost', value: 0.15 }, { count: 3, effect: 'healBoost', value: 0.30 }], color: '#e91e8c' },
  { name: '人族', type: 'race', key: 'human', tiers: [{ count: 2, effect: 'atk', value: 0.10 }, { count: 4, effect: 'atk', value: 0.20 }], color: '#f39c12' },
  { name: '兽族', type: 'race', key: 'beast', tiers: [{ count: 2, effect: 'hp', value: 200 }, { count: 4, effect: 'hp', value: 400 }], color: '#e67e22' },
  { name: '精灵', type: 'race', key: 'elf', tiers: [{ count: 2, effect: 'dodge', value: 0.15 }, { count: 3, effect: 'dodge', value: 0.30 }], color: '#1abc9c' },
  { name: '亡灵', type: 'race', key: 'undead', tiers: [{ count: 2, effect: 'enemyArmorReduce', value: 0.10 }, { count: 3, effect: 'enemyArmorReduce', value: 0.20 }], color: '#95a5a6' },
  { name: '龙族', type: 'race', key: 'dragon', tiers: [{ count: 2, effect: 'startRage', value: 50 }], color: '#8e44ad' },
  { name: '机械', type: 'race', key: 'mech', tiers: [{ count: 2, effect: 'atkspd', value: 0.15 }, { count: 3, effect: 'atkspd', value: 0.30 }], color: '#7f8c8d' },
];

export const ROLE_NAMES: Record<Role, string> = {
  warrior: '战士', mage: '法师', assassin: '刺客',
  ranger: '射手', tank: '坦克', support: '辅助',
};

export const RACE_NAMES: Record<Race, string> = {
  human: '人族', beast: '兽族', elf: '精灵',
  undead: '亡灵', dragon: '龙族', mech: '机械',
};

export const HERO_DEFS: HeroDef[] = [
  {
    id: 'sword_shield', name: '剑盾卫士', cost: 1, role: 'warrior', race: 'human',
    maxHp: 600, attack: 50, attackSpeed: 1200, attackRange: 1, moveSpeed: 200,
    skill: { name: '旋风斩', type: 'aoe', damage: 120, healAmount: 0, shieldAmount: 0, range: 1, rageCost: 100, particleType: 'fire' },
    emoji: '⚔️',
  },
  {
    id: 'magic_apprentice', name: '魔法学徒', cost: 1, role: 'mage', race: 'human',
    maxHp: 400, attack: 60, attackSpeed: 1400, attackRange: 3, moveSpeed: 150,
    skill: { name: '火球术', type: 'single', damage: 180, healAmount: 0, shieldAmount: 0, range: 3, rageCost: 100, particleType: 'fire' },
    emoji: '🔮',
  },
  {
    id: 'shadow_assassin', name: '暗影刺客', cost: 2, role: 'assassin', race: 'elf',
    maxHp: 450, attack: 70, attackSpeed: 900, attackRange: 1, moveSpeed: 300,
    skill: { name: '暗影突袭', type: 'single', damage: 200, healAmount: 0, shieldAmount: 0, range: 1, rageCost: 100, particleType: 'ice' },
    emoji: '🗡️',
  },
  {
    id: 'divine_archer', name: '神射手', cost: 2, role: 'ranger', race: 'human',
    maxHp: 420, attack: 65, attackSpeed: 1000, attackRange: 4, moveSpeed: 160,
    skill: { name: '穿云箭', type: 'aoe', damage: 100, healAmount: 0, shieldAmount: 0, range: 3, rageCost: 100, particleType: 'lightning' },
    emoji: '🏹',
  },
  {
    id: 'iron_guard', name: '铁壁守卫', cost: 2, role: 'tank', race: 'beast',
    maxHp: 900, attack: 35, attackSpeed: 1500, attackRange: 1, moveSpeed: 130,
    skill: { name: '坚固护盾', type: 'shield', damage: 0, healAmount: 0, shieldAmount: 250, range: 2, rageCost: 100, particleType: 'shield' },
    emoji: '🛡️',
  },
  {
    id: 'holy_priest', name: '圣光牧师', cost: 3, role: 'support', race: 'human',
    maxHp: 500, attack: 40, attackSpeed: 1600, attackRange: 3, moveSpeed: 140,
    skill: { name: '治愈之光', type: 'heal', damage: 0, healAmount: 200, shieldAmount: 0, range: 3, rageCost: 100, particleType: 'heal' },
    emoji: '✨',
  },
  {
    id: 'thunder_mage', name: '雷霆法师', cost: 3, role: 'mage', race: 'dragon',
    maxHp: 480, attack: 75, attackSpeed: 1300, attackRange: 3, moveSpeed: 150,
    skill: { name: '闪电链', type: 'aoe', damage: 150, healAmount: 0, shieldAmount: 0, range: 2, rageCost: 100, particleType: 'lightning' },
    emoji: '⚡',
  },
  {
    id: 'berserker', name: '狂战之斧', cost: 3, role: 'warrior', race: 'beast',
    maxHp: 700, attack: 80, attackSpeed: 1000, attackRange: 1, moveSpeed: 220,
    skill: { name: '狂暴打击', type: 'single', damage: 250, healAmount: 0, shieldAmount: 0, range: 1, rageCost: 100, particleType: 'fire' },
    emoji: '🪓',
  },
  {
    id: 'necromancer', name: '幽冥巫师', cost: 4, role: 'mage', race: 'undead',
    maxHp: 520, attack: 70, attackSpeed: 1400, attackRange: 3, moveSpeed: 150,
    skill: { name: '灵魂汲取', type: 'lifesteal', damage: 200, healAmount: 100, shieldAmount: 0, range: 3, rageCost: 100, particleType: 'ice' },
    emoji: '💀',
  },
  {
    id: 'dragon_knight', name: '龙骑将军', cost: 4, role: 'warrior', race: 'dragon',
    maxHp: 800, attack: 85, attackSpeed: 1100, attackRange: 1, moveSpeed: 200,
    skill: { name: '龙息吐息', type: 'aoe', damage: 180, healAmount: 0, shieldAmount: 0, range: 2, rageCost: 100, particleType: 'fire' },
    emoji: '🐉',
  },
  {
    id: 'mech_armor', name: '机械战甲', cost: 4, role: 'tank', race: 'mech',
    maxHp: 1000, attack: 45, attackSpeed: 1600, attackRange: 1, moveSpeed: 120,
    skill: { name: '自爆机器人', type: 'aoe', damage: 200, healAmount: 0, shieldAmount: 0, range: 2, rageCost: 100, particleType: 'lightning' },
    emoji: '🤖',
  },
  {
    id: 'void_lord', name: '虚空领主', cost: 5, role: 'mage', race: 'undead',
    maxHp: 550, attack: 90, attackSpeed: 1200, attackRange: 3, moveSpeed: 160,
    skill: { name: '虚空裂隙', type: 'aoe', damage: 280, healAmount: 0, shieldAmount: 0, range: 3, rageCost: 100, particleType: 'ice' },
    emoji: '🌀',
  },
];

export class Hero {
  id: string;
  name: string;
  defId: string;
  cost: number;
  role: Role;
  race: Race;
  maxHp: number;
  hp: number;
  attack: number;
  attackSpeed: number;
  attackRange: number;
  moveSpeed: number;
  skill: SkillDef;
  emoji: string;
  rage: number = 0;
  x: number = 0;
  y: number = 0;
  team: Team = 'blue';
  isAlive: boolean = true;
  shield: number = 0;
  armor: number = 0;
  spellPower: number = 1.0;
  critChance: number = 0;
  dodgeChance: number = 0;
  damageDealt: number = 0;
  damageTaken: number = 0;
  healingDone: number = 0;
  kills: number = 0;
  lastAttackTime: number = 0;
  lastMoveTime: number = 0;
  placeAnimTime: number = 0;
  hitFlashTime: number = 0;
  skillAnimTime: number = 0;
  pixelX: number = 0;
  pixelY: number = 0;
  targetPixelX: number = 0;
  targetPixelY: number = 0;

  constructor(def: HeroDef, team: Team) {
    this.id = `${def.id}_${team}_${Math.random().toString(36).slice(2, 6)}`;
    this.defId = def.id;
    this.name = def.name;
    this.cost = def.cost;
    this.role = def.role;
    this.race = def.race;
    this.maxHp = def.maxHp;
    this.hp = def.maxHp;
    this.attack = def.attack;
    this.attackSpeed = def.attackSpeed;
    this.attackRange = def.attackRange;
    this.moveSpeed = def.moveSpeed;
    this.skill = { ...def.skill };
    this.emoji = def.emoji;
    this.team = team;
  }

  static fromDef(defId: string, team: Team): Hero | null {
    const def = HERO_DEFS.find(d => d.id === defId);
    if (!def) return null;
    return new Hero(def, team);
  }

  takeDamage(amount: number): number {
    let dmg = amount;
    const effectiveArmor = this.armor;
    dmg = Math.max(1, Math.floor(dmg * (1 - effectiveArmor)));
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, dmg);
      this.shield -= absorbed;
      dmg -= absorbed;
    }
    this.hp = Math.max(0, this.hp - dmg);
    this.damageTaken += dmg;
    if (this.hp <= 0) {
      this.isAlive = false;
    }
    this.hitFlashTime = 200;
    return dmg;
  }

  heal(amount: number): number {
    const actual = Math.min(amount, this.maxHp - this.hp);
    this.hp += actual;
    this.healingDone += actual;
    return actual;
  }

  addShield(amount: number) {
    this.shield += amount;
  }

  addRage(amount: number) {
    this.rage = Math.min(100, this.rage + amount);
  }

  resetForBattle() {
    this.hp = this.maxHp;
    this.rage = 0;
    this.shield = 0;
    this.isAlive = true;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.healingDone = 0;
    this.kills = 0;
    this.lastAttackTime = 0;
    this.lastMoveTime = 0;
    this.hitFlashTime = 0;
    this.skillAnimTime = 0;
    this.armor = 0;
    this.spellPower = 1.0;
    this.critChance = 0;
    this.dodgeChance = 0;
  }

  applySynergyBonuses(bonuses: Map<string, number>) {
    this.armor = bonuses.get('armor') ?? 0;
    this.spellPower = 1.0 + (bonuses.get('sp') ?? 0);
    this.critChance = bonuses.get('crit') ?? 0;
    this.attackRange = Math.ceil(this.attackRange * (1 + (bonuses.get('range') ?? 0)));
    const hpBonus = bonuses.get('hp') ?? 0;
    this.maxHp += hpBonus;
    this.hp += hpBonus;
    this.dodgeChance = bonuses.get('dodge') ?? 0;
    this.attackSpeed = Math.floor(this.attackSpeed / (1 + (bonuses.get('atkspd') ?? 0)));
    this.attack = Math.floor(this.attack * (1 + (bonuses.get('atk') ?? 0)));
    const startRage = bonuses.get('startRage') ?? 0;
    this.rage = startRage;
  }
}

export function computeSynergies(heroes: Hero[]): Map<string, number> {
  const bonuses = new Map<string, number>();
  const roleCounts = new Map<string, number>();
  const raceCounts = new Map<string, number>();

  for (const h of heroes) {
    roleCounts.set(h.role, (roleCounts.get(h.role) ?? 0) + 1);
    raceCounts.set(h.race, (raceCounts.get(h.race) ?? 0) + 1);
  }

  for (const syn of SYNERGY_DEFS) {
    const counts = syn.type === 'role' ? roleCounts : raceCounts;
    const count = counts.get(syn.key) ?? 0;
    let bestTier: SynergyTier | null = null;
    for (const tier of syn.tiers) {
      if (count >= tier.count) bestTier = tier;
    }
    if (bestTier) {
      const existing = bonuses.get(bestTier.effect) ?? 0;
      bonuses.set(bestTier.effect, existing + bestTier.value);
    }
  }

  return bonuses;
}

export function getActiveSynergies(heroes: Hero[]): { synergy: SynergyDef; tier: SynergyTier; count: number }[] {
  const result: { synergy: SynergyDef; tier: SynergyTier; count: number }[] = [];
  const roleCounts = new Map<string, number>();
  const raceCounts = new Map<string, number>();

  for (const h of heroes) {
    roleCounts.set(h.role, (roleCounts.get(h.role) ?? 0) + 1);
    raceCounts.set(h.race, (raceCounts.get(h.race) ?? 0) + 1);
  }

  for (const syn of SYNERGY_DEFS) {
    const counts = syn.type === 'role' ? roleCounts : raceCounts;
    const count = counts.get(syn.key) ?? 0;
    let bestTier: SynergyTier | null = null;
    for (const tier of syn.tiers) {
      if (count >= tier.count) bestTier = tier;
    }
    if (bestTier) {
      result.push({ synergy: syn, tier: bestTier, count });
    }
  }

  return result;
}
