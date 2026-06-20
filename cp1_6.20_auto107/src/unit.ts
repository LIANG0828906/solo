export interface Skill {
  id: string;
  name: string;
  type: 'damage' | 'heal' | 'shield';
  value: number;
  range: number;
  aoeType: 'single' | 'circle' | 'fan';
  aoeRadius: number;
  hitRate: number;
  description: string;
}

export interface UnitData {
  id: string;
  name: string;
  team: 'player' | 'enemy';
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  moveRange: number;
  skills: Skill[];
  col: number;
  row: number;
  shield: number;
  icon: string;
}

export const SKILL_FIREBALL: Skill = {
  id: 'fireball',
  name: '火焰弹',
  type: 'damage',
  value: 35,
  range: 4,
  aoeType: 'circle',
  aoeRadius: 1,
  hitRate: 0.85,
  description: '对目标区域造成35点伤害，范围2格，命中率85%'
};

export const SKILL_HEAL: Skill = {
  id: 'heal',
  name: '治疗波',
  type: 'heal',
  value: 30,
  range: 3,
  aoeType: 'circle',
  aoeRadius: 1,
  hitRate: 1.0,
  description: '治疗友方单位30点生命，范围2格，必定命中'
};

export const SKILL_SHIELD: Skill = {
  id: 'shield',
  name: '护盾',
  type: 'shield',
  value: 25,
  range: 3,
  aoeType: 'single',
  aoeRadius: 0,
  hitRate: 1.0,
  description: '为友方单位提供25点护盾，持续1回合，必定命中'
};

export const UNIT_TEMPLATES: Record<string, Partial<UnitData>> = {
  warrior: {
    name: '战士',
    hp: 120,
    maxHp: 120,
    atk: 25,
    def: 20,
    spd: 5,
    moveRange: 3,
    icon: '⚔',
    skills: [
      { ...SKILL_FIREBALL, id: 'warrior_fireball', name: '重击', value: 30, range: 1, aoeType: 'single', aoeRadius: 0, hitRate: 0.9, description: '对目标造成30点伤害，命中率90%' },
      { ...SKILL_SHIELD },
      { ...SKILL_HEAL, id: 'warrior_rally', name: '激励', value: 15, range: 1, aoeType: 'single', aoeRadius: 0, hitRate: 1.0, description: '恢复友方15点生命' }
    ]
  },
  mage: {
    name: '法师',
    hp: 80,
    maxHp: 80,
    atk: 15,
    def: 8,
    spd: 7,
    moveRange: 2,
    icon: '🔥',
    skills: [
      { ...SKILL_FIREBALL },
      { ...SKILL_HEAL, id: 'mage_heal', name: '治疗波', value: 25, range: 3, aoeType: 'circle', aoeRadius: 1, hitRate: 1.0, description: '治疗区域友方25点生命' },
      { ...SKILL_SHIELD }
    ]
  },
  healer: {
    name: '治疗师',
    hp: 90,
    maxHp: 90,
    atk: 10,
    def: 12,
    spd: 6,
    moveRange: 2,
    icon: '💚',
    skills: [
      { ...SKILL_HEAL, value: 40, description: '治疗区域友方40点生命' },
      { ...SKILL_SHIELD, value: 30, description: '为友方提供30点护盾' },
      { ...SKILL_FIREBALL, id: 'healer_smite', name: '惩戒', value: 20, range: 3, aoeType: 'single', aoeRadius: 0, hitRate: 0.8, description: '对目标造成20点伤害，命中率80%' }
    ]
  }
};

let unitIdCounter = 0;

export function createUnit(team: 'player' | 'enemy', template: string, col: number, row: number): UnitData {
  const tmpl = UNIT_TEMPLATES[template];
  if (!tmpl) throw new Error(`Unknown template: ${template}`);
  const id = `unit_${++unitIdCounter}`;
  return {
    id,
    name: tmpl.name || template,
    team,
    hp: tmpl.hp || 100,
    maxHp: tmpl.maxHp || 100,
    atk: tmpl.atk || 10,
    def: tmpl.def || 10,
    spd: tmpl.spd || 5,
    moveRange: tmpl.moveRange || 2,
    skills: tmpl.skills ? tmpl.skills.map(s => ({ ...s, id: `${id}_${s.id}` })) : [],
    col,
    row,
    shield: 0,
    icon: tmpl.icon || '?'
  };
}

export function calculateDamage(skillValue: number, defenderDef: number): number {
  return Math.max(1, Math.round(skillValue * (1 - defenderDef / (defenderDef + 100))));
}

export function rollHit(hitRate: number): boolean {
  return Math.random() < hitRate;
}

export function applyDamage(unit: UnitData, rawDamage: number): { damage: number; shieldAbsorbed: number } {
  let shieldAbsorbed = 0;
  let damage = rawDamage;
  if (unit.shield > 0) {
    shieldAbsorbed = Math.min(unit.shield, damage);
    unit.shield -= shieldAbsorbed;
    damage -= shieldAbsorbed;
  }
  unit.hp = Math.max(0, unit.hp - damage);
  return { damage, shieldAbsorbed };
}

export function applyHeal(unit: UnitData, amount: number): number {
  const healed = Math.min(amount, unit.maxHp - unit.hp);
  unit.hp += healed;
  return healed;
}

export function applyShield(unit: UnitData, amount: number): number {
  unit.shield += amount;
  return amount;
}

export function isAlive(unit: UnitData): boolean {
  return unit.hp > 0;
}
