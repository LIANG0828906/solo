import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ClassId = 'warrior' | 'mage' | 'assassin';
export type SkillType = 'damage' | 'heal' | 'buff' | 'debuff';

export interface Skill {
  id: string;
  classId: ClassId;
  name: string;
  description: string;
  type: SkillType;
  damage: number;
  healAmount: number;
  cooldown: number;
  prerequisiteId: string | null;
  tier: number;
  position: { x: number; y: number };
  isBase: boolean;
}

export interface Character {
  id: string;
  name: string;
  classId: ClassId;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  skillPoints: number;
  unlockedSkillIds: string[];
  equippedSkillIds: string[];
}

export interface BattleLog {
  round: number;
  actorId: string;
  actorName: string;
  skillId: string;
  skillName: string;
  damage: number;
  hit: boolean;
  isPlayer: boolean;
  healAmount: number;
}

export interface BattleRecord {
  id: string;
  player: Character;
  enemy: Character;
  logs: BattleLog[];
  totalRounds: number;
  playerTotalDamage: number;
  enemyTotalDamage: number;
  playerHitCount: number;
  playerTotalAttacks: number;
  enemyHitCount: number;
  enemyTotalAttacks: number;
  mvpSkillId: string;
  playerSkillUsage: Record<string, number>;
  enemySkillUsage: Record<string, number>;
  winner: 'player' | 'enemy';
}

export interface ClassData {
  id: ClassId;
  name: string;
  color: string;
  colorLight: string;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  icon: string;
}

export const CLASS_DATA: Record<ClassId, ClassData> = {
  warrior: {
    id: 'warrior',
    name: '战士',
    color: '#c0392b',
    colorLight: '#e74c3c',
    baseHp: 120,
    baseAtk: 18,
    baseDef: 15,
    baseSpd: 8,
    icon: '⚔️',
  },
  mage: {
    id: 'mage',
    name: '法师',
    color: '#8e44ad',
    colorLight: '#a855f7',
    baseHp: 80,
    baseAtk: 25,
    baseDef: 6,
    baseSpd: 12,
    icon: '🔮',
  },
  assassin: {
    id: 'assassin',
    name: '刺客',
    color: '#1a6b3c',
    colorLight: '#2ecc71',
    baseHp: 90,
    baseAtk: 22,
    baseDef: 8,
    baseSpd: 18,
    icon: '🗡️',
  },
};

export const SKILLS: Skill[] = [
  // Warrior base skills
  { id: 'w_base_1', classId: 'warrior', name: '猛击', description: '全力挥出重击，对单体造成高额伤害', type: 'damage', damage: 30, healAmount: 0, cooldown: 0, prerequisiteId: null, tier: 0, position: { x: 0, y: 0 }, isBase: true },
  { id: 'w_base_2', classId: 'warrior', name: '盾击', description: '用盾牌猛击敌人，造成伤害并降低对方攻击力', type: 'debuff', damage: 18, healAmount: 0, cooldown: 2, prerequisiteId: null, tier: 0, position: { x: 0, y: 2 }, isBase: true },
  { id: 'w_base_3', classId: 'warrior', name: '战吼', description: '发出震天战吼，提升自身攻击力', type: 'buff', damage: 0, healAmount: 0, cooldown: 3, prerequisiteId: null, tier: 0, position: { x: 0, y: 4 }, isBase: true },

  // Warrior tier 1
  { id: 'w_t1_1', classId: 'warrior', name: '劈砍', description: '挥动武器进行横劈，造成范围伤害', type: 'damage', damage: 40, healAmount: 0, cooldown: 1, prerequisiteId: 'w_base_1', tier: 1, position: { x: 1, y: 0 }, isBase: false },
  { id: 'w_t1_2', classId: 'warrior', name: '铁壁', description: '坚如磐石的防御姿态，大幅提升防御力', type: 'buff', damage: 0, healAmount: 0, cooldown: 3, prerequisiteId: 'w_base_2', tier: 1, position: { x: 1, y: 2 }, isBase: false },

  // Warrior tier 2
  { id: 'w_t2_1', classId: 'warrior', name: '旋风斩', description: '旋转攻击周围所有敌人，造成大量伤害', type: 'damage', damage: 55, healAmount: 0, cooldown: 2, prerequisiteId: 'w_t1_1', tier: 2, position: { x: 2, y: 0 }, isBase: false },
  { id: 'w_t2_2', classId: 'warrior', name: '不屈', description: '意志坚定的战斗状态，恢复部分生命值', type: 'heal', damage: 0, healAmount: 25, cooldown: 4, prerequisiteId: 'w_t1_2', tier: 2, position: { x: 2, y: 2 }, isBase: false },

  // Warrior tier 3
  { id: 'w_t3_1', classId: 'warrior', name: '天崩地裂', description: '猛击大地引发震荡，对敌方造成毁灭性伤害', type: 'damage', damage: 80, healAmount: 0, cooldown: 4, prerequisiteId: 'w_t2_1', tier: 3, position: { x: 3, y: 0 }, isBase: false },
  { id: 'w_t3_2', classId: 'warrior', name: '战神之躯', description: '化身战神，大幅恢复生命并提升全属性', type: 'heal', damage: 0, healAmount: 50, cooldown: 5, prerequisiteId: 'w_t2_2', tier: 3, position: { x: 3, y: 2 }, isBase: false },

  // Mage base skills
  { id: 'm_base_1', classId: 'mage', name: '火球术', description: '凝聚火焰之力投掷火球，造成灼烧伤害', type: 'damage', damage: 35, healAmount: 0, cooldown: 0, prerequisiteId: null, tier: 0, position: { x: 0, y: 0 }, isBase: true },
  { id: 'm_base_2', classId: 'mage', name: '冰霜新星', description: '释放寒冰冲击波，降低敌方速度', type: 'debuff', damage: 20, healAmount: 0, cooldown: 2, prerequisiteId: null, tier: 0, position: { x: 0, y: 2 }, isBase: true },
  { id: 'm_base_3', classId: 'mage', name: '魔力护盾', description: '编织魔力形成护盾，减少受到的伤害', type: 'buff', damage: 0, healAmount: 0, cooldown: 3, prerequisiteId: null, tier: 0, position: { x: 0, y: 4 }, isBase: true },

  // Mage tier 1
  { id: 'm_t1_1', classId: 'mage', name: '雷电', description: '召唤闪电劈向敌人，造成高额雷属性伤害', type: 'damage', damage: 45, healAmount: 0, cooldown: 1, prerequisiteId: 'm_base_1', tier: 1, position: { x: 1, y: 0 }, isBase: false },
  { id: 'm_t1_2', classId: 'mage', name: '治愈', description: '使用自然之力恢复少量生命值', type: 'heal', damage: 0, healAmount: 20, cooldown: 2, prerequisiteId: 'm_base_3', tier: 1, position: { x: 1, y: 4 }, isBase: false },

  // Mage tier 2
  { id: 'm_t2_1', classId: 'mage', name: '连锁闪电', description: '释放弹跳的闪电链，造成连续伤害', type: 'damage', damage: 60, healAmount: 0, cooldown: 2, prerequisiteId: 'm_t1_1', tier: 2, position: { x: 2, y: 0 }, isBase: false },
  { id: 'm_t2_2', classId: 'mage', name: '群体治愈', description: '释放大面积治愈光环，恢复可观生命', type: 'heal', damage: 0, healAmount: 35, cooldown: 3, prerequisiteId: 'm_t1_2', tier: 2, position: { x: 2, y: 4 }, isBase: false },

  // Mage tier 3
  { id: 'm_t3_1', classId: 'mage', name: '雷霆风暴', description: '召唤毁灭性雷暴，对敌方造成极端伤害', type: 'damage', damage: 90, healAmount: 0, cooldown: 5, prerequisiteId: 'm_t2_1', tier: 3, position: { x: 3, y: 0 }, isBase: false },
  { id: 'm_t3_2', classId: 'mage', name: '神圣之光', description: '祈祷神圣之力，极大恢复生命值', type: 'heal', damage: 0, healAmount: 60, cooldown: 5, prerequisiteId: 'm_t2_2', tier: 3, position: { x: 3, y: 4 }, isBase: false },

  // Assassin base skills
  { id: 'a_base_1', classId: 'assassin', name: '匕首连击', description: '快速双段连击，造成两次伤害', type: 'damage', damage: 15, healAmount: 0, cooldown: 0, prerequisiteId: null, tier: 0, position: { x: 0, y: 0 }, isBase: true },
  { id: 'a_base_2', classId: 'assassin', name: '隐身', description: '潜入阴影隐去身形，大幅提升闪避', type: 'buff', damage: 0, healAmount: 0, cooldown: 3, prerequisiteId: null, tier: 0, position: { x: 0, y: 2 }, isBase: true },
  { id: 'a_base_3', classId: 'assassin', name: '毒刃', description: '涂抹剧毒的刀刃，造成持续伤害', type: 'debuff', damage: 22, healAmount: 0, cooldown: 1, prerequisiteId: null, tier: 0, position: { x: 0, y: 4 }, isBase: true },

  // Assassin tier 1
  { id: 'a_t1_1', classId: 'assassin', name: '背刺', description: '从背后偷袭，造成暴击伤害', type: 'damage', damage: 45, healAmount: 0, cooldown: 1, prerequisiteId: 'a_base_1', tier: 1, position: { x: 1, y: 0 }, isBase: false },
  { id: 'a_t1_2', classId: 'assassin', name: '疾步', description: '瞬移闪避，极大提升速度', type: 'buff', damage: 0, healAmount: 0, cooldown: 2, prerequisiteId: 'a_base_2', tier: 1, position: { x: 1, y: 2 }, isBase: false },

  // Assassin tier 2
  { id: 'a_t2_1', classId: 'assassin', name: '暗影突袭', description: '从暗影中突袭，造成巨额伤害', type: 'damage', damage: 65, healAmount: 0, cooldown: 2, prerequisiteId: 'a_t1_1', tier: 2, position: { x: 2, y: 0 }, isBase: false },
  { id: 'a_t2_2', classId: 'assassin', name: '幻影', description: '制造幻影分身，提升闪避和速度', type: 'buff', damage: 0, healAmount: 0, cooldown: 3, prerequisiteId: 'a_t1_2', tier: 2, position: { x: 2, y: 2 }, isBase: false },

  // Assassin tier 3
  { id: 'a_t3_1', classId: 'assassin', name: '死亡标记', description: '标记目标为死，发动致命终结一击', type: 'damage', damage: 95, healAmount: 0, cooldown: 5, prerequisiteId: 'a_t2_1', tier: 3, position: { x: 3, y: 0 }, isBase: false },
  { id: 'a_t3_2', classId: 'assassin', name: '无影无踪', description: '完全消失于暗影中，下次攻击必定暴击', type: 'buff', damage: 0, healAmount: 0, cooldown: 5, prerequisiteId: 'a_t2_2', tier: 3, position: { x: 3, y: 2 }, isBase: false },
];

export const CLASS_NAMES: Record<ClassId, string> = {
  warrior: '战士',
  mage: '法师',
  assassin: '刺客',
};

export function getSkillsForClass(classId: ClassId): Skill[] {
  return SKILLS.filter(s => s.classId === classId);
}

export function getClassColor(classId: ClassId): string {
  return CLASS_DATA[classId].color;
}

export function getClassColorLight(classId: ClassId): string {
  return CLASS_DATA[classId].colorLight;
}

function createCharacter(classId: ClassId): Character {
  const cd = CLASS_DATA[classId];
  const baseSkills = SKILLS.filter(s => s.classId === classId && s.isBase);
  return {
    id: uuidv4(),
    name: cd.name,
    classId,
    hp: cd.baseHp,
    maxHp: cd.baseHp,
    atk: cd.baseAtk,
    def: cd.baseDef,
    spd: cd.baseSpd,
    skillPoints: 5,
    unlockedSkillIds: baseSkills.map(s => s.id),
    equippedSkillIds: baseSkills.slice(0, 4).map(s => s.id),
  };
}

function generateEnemy(): Character {
  const classes: ClassId[] = ['warrior', 'mage', 'assassin'];
  const classId = classes[Math.floor(Math.random() * classes.length)];
  const cd = CLASS_DATA[classId];
  const classSkills = SKILLS.filter(s => s.classId === classId);
  const allUnlocked = classSkills.map(s => s.id);
  const equipped = allUnlocked.slice(0, Math.min(4, allUnlocked.length));
  return {
    id: uuidv4(),
    name: `AI${cd.name}`,
    classId,
    hp: cd.baseHp,
    maxHp: cd.baseHp,
    atk: cd.baseAtk,
    spd: cd.baseSpd,
    def: cd.baseDef,
    skillPoints: 0,
    unlockedSkillIds: allUnlocked,
    equippedSkillIds: equipped,
  };
}

function calculateDamage(attacker: Character, skill: Skill, defender: Character): { damage: number; hit: boolean } {
  const spdDiff = attacker.spd - defender.spd;
  const hitChance = Math.min(0.99, Math.max(0.5, 0.9 + spdDiff * 0.005));
  const hit = Math.random() < hitChance;

  if (!hit) return { damage: 0, hit: false };

  const baseDmg = skill.damage + attacker.atk * 0.5 - defender.def * 0.3;
  const multiplier = 0.85 + Math.random() * 0.3;
  const damage = Math.max(1, Math.round(baseDmg * multiplier));

  return { damage, hit: true };
}

function selectAiSkill(enemy: Character): Skill {
  const skills = enemy.equippedSkillIds
    .map(id => SKILLS.find(s => s.id === id))
    .filter((s): s is Skill => s !== undefined);

  if (skills.length === 0) {
    return SKILLS[0];
  }

  const damageSkills = skills.filter(s => s.type === 'damage' || s.type === 'debuff');
  if (damageSkills.length > 0 && Math.random() < 0.6) {
    return damageSkills[Math.floor(Math.random() * damageSkills.length)];
  }

  return skills[Math.floor(Math.random() * skills.length)];
}

export interface GameState {
  phase: 'creation' | 'skill-tree' | 'battle' | 'report';
  character: Character | null;
  enemy: Character | null;
  battleRecord: BattleRecord | null;
  highlightedLogRound: number | null;
  setPhase: (phase: GameState['phase']) => void;
  createCharacter: (classId: ClassId) => void;
  unlockSkill: (skillId: string) => void;
  equipSkill: (skillId: string, slotIndex: number) => void;
  resetSkills: () => void;
  startBattle: () => void;
  generateEnemyAndStart: () => void;
  setHighlightedLogRound: (round: number | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'creation',
  character: null,
  enemy: null,
  battleRecord: null,
  highlightedLogRound: null,

  setPhase: (phase) => set({ phase }),

  createCharacter: (classId) => {
    const character = createCharacter(classId);
    set({ character, phase: 'skill-tree' });
  },

  unlockSkill: (skillId) => {
    const { character } = get();
    if (!character) return;
    if (character.skillPoints <= 0) return;
    if (character.unlockedSkillIds.includes(skillId)) return;

    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;

    if (skill.prerequisiteId && !character.unlockedSkillIds.includes(skill.prerequisiteId)) return;

    const newUnlocked = [...character.unlockedSkillIds, skillId];
    const newEquipped = character.equippedSkillIds.length < 4
      ? [...character.equippedSkillIds, skillId]
      : character.equippedSkillIds;

    set({
      character: {
        ...character,
        skillPoints: character.skillPoints - 1,
        unlockedSkillIds: newUnlocked,
        equippedSkillIds: newEquipped,
      },
    });
  },

  equipSkill: (skillId, slotIndex) => {
    const { character } = get();
    if (!character) return;
    if (!character.unlockedSkillIds.includes(skillId)) return;

    const newEquipped = [...character.equippedSkillIds];
    newEquipped[slotIndex] = skillId;

    const unique = [...new Set(newEquipped)];
    set({
      character: {
        ...character,
        equippedSkillIds: unique.length < newEquipped.length ? unique : newEquipped,
      },
    });
  },

  resetSkills: () => {
    const { character } = get();
    if (!character) return;
    const baseSkills = SKILLS.filter(s => s.classId === character.classId && s.isBase);
    const spentPoints = character.unlockedSkillIds.filter(
      id => !baseSkills.find(b => b.id === id)
    ).length;
    set({
      character: {
        ...character,
        skillPoints: character.skillPoints + spentPoints,
        unlockedSkillIds: baseSkills.map(s => s.id),
        equippedSkillIds: baseSkills.slice(0, 4).map(s => s.id),
      },
    });
  },

  generateEnemyAndStart: () => {
    const enemy = generateEnemy();
    set({ enemy, phase: 'battle' });
  },

  startBattle: () => {
    const { character, enemy } = get();
    if (!character || !enemy) return;

    const player = { ...character, hp: character.maxHp };
    const enemyChar = { ...enemy, hp: enemy.maxHp };

    const logs: BattleLog[] = [];
    let round = 0;
    const maxRounds = 50;
    const playerSkillUsage: Record<string, number> = {};
    const enemySkillUsage: Record<string, number> = {};
    let playerTotalDamage = 0;
    let enemyTotalDamage = 0;
    let playerHitCount = 0;
    let playerTotalAttacks = 0;
    let enemyHitCount = 0;
    let enemyTotalAttacks = 0;

    const playerCooldowns: Record<string, number> = {};
    const enemyCooldowns: Record<string, number> = {};

    while (player.hp > 0 && enemyChar.hp > 0 && round < maxRounds) {
      round++;

      const playerFirst = player.spd >= enemyChar.spd;
      const actors = playerFirst
        ? [
            { char: player, isPlayer: true, opponent: enemyChar },
            { char: enemyChar, isPlayer: false, opponent: player },
          ]
        : [
            { char: enemyChar, isPlayer: false, opponent: player },
            { char: player, isPlayer: true, opponent: enemyChar },
          ];

      for (const actor of actors) {
        if (actor.char.hp <= 0 || actor.opponent.hp <= 0) break;

        const availableSkills = actor.char.equippedSkillIds
          .map(id => SKILLS.find(s => s.id === id)!)
          .filter(s => {
            const cd = actor.isPlayer ? playerCooldowns[s.id] : enemyCooldowns[s.id];
            return !cd || cd <= 0;
          });

        if (availableSkills.length === 0) continue;

        let skill: Skill;
        if (actor.isPlayer) {
          skill = availableSkills[round % availableSkills.length];
        } else {
          skill = selectAiSkill(actor.char);
          if (!availableSkills.find(s => s.id === skill.id)) {
            skill = availableSkills[0];
          }
        }

        if (actor.isPlayer) {
          playerSkillUsage[skill.id] = (playerSkillUsage[skill.id] || 0) + 1;
          playerTotalAttacks++;
        } else {
          enemySkillUsage[skill.id] = (enemySkillUsage[skill.id] || 0) + 1;
          enemyTotalAttacks++;
        }

        const cooldowns = actor.isPlayer ? playerCooldowns : enemyCooldowns;
        cooldowns[skill.id] = skill.cooldown;

        if (skill.type === 'heal') {
          const healAmt = skill.healAmount;
          actor.char.hp = Math.min(actor.char.maxHp, actor.char.hp + healAmt);
          logs.push({
            round,
            actorId: actor.char.id,
            actorName: actor.isPlayer ? '你' : actor.char.name,
            skillId: skill.id,
            skillName: skill.name,
            damage: 0,
            hit: true,
            isPlayer: actor.isPlayer,
            healAmount: healAmt,
          });
        } else {
          const result = calculateDamage(actor.char, skill, actor.opponent);
          if (result.hit) {
            actor.opponent.hp = Math.max(0, actor.opponent.hp - result.damage);
            if (actor.isPlayer) {
              playerTotalDamage += result.damage;
              playerHitCount++;
            } else {
              enemyTotalDamage += result.damage;
              enemyHitCount++;
            }
          }
          logs.push({
            round,
            actorId: actor.char.id,
            actorName: actor.isPlayer ? '你' : actor.char.name,
            skillId: skill.id,
            skillName: skill.name,
            damage: result.damage,
            hit: result.hit,
            isPlayer: actor.isPlayer,
            healAmount: 0,
          });
        }

        if (actor.opponent.hp <= 0) break;
      }

      for (const key of Object.keys(playerCooldowns)) {
        if (playerCooldowns[key] > 0) playerCooldowns[key]--;
      }
      for (const key of Object.keys(enemyCooldowns)) {
        if (enemyCooldowns[key] > 0) enemyCooldowns[key]--;
      }
    }

    const winner: 'player' | 'enemy' = player.hp > 0 ? 'player' : 'enemy';

    const allDamageSkills = Object.entries(playerSkillUsage)
      .map(([id, count]) => {
        const s = SKILLS.find(sk => sk.id === id);
        return s ? { id, totalDmg: s.damage * count } : { id, totalDmg: 0 };
      })
      .sort((a, b) => b.totalDmg - a.totalDmg);

    const mvpSkillId = allDamageSkills.length > 0 ? allDamageSkills[0].id : player.equippedSkillIds[0];

    const record: BattleRecord = {
      id: uuidv4(),
      player,
      enemy: enemyChar,
      logs,
      totalRounds: round,
      playerTotalDamage,
      enemyTotalDamage,
      playerHitCount,
      playerTotalAttacks,
      enemyHitCount,
      enemyTotalAttacks,
      mvpSkillId,
      playerSkillUsage,
      enemySkillUsage,
      winner,
    };

    set({ battleRecord: record, phase: 'report' });
  },

  setHighlightedLogRound: (round) => set({ highlightedLogRound: round }),

  resetGame: () => set({
    phase: 'creation',
    character: null,
    enemy: null,
    battleRecord: null,
    highlightedLogRound: null,
  }),
}));
