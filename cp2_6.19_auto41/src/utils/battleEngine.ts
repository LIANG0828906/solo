import { v4 as uuidv4 } from 'uuid';

export type SkillType = 'none' | 'combo' | 'lifesteal' | 'shield' | 'burn';

export interface Card {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  skill: SkillType;
  side: 'red' | 'blue';
}

export interface BattleRound {
  id: string;
  round: number;
  attacker: 'red' | 'blue';
  attackerName: string;
  defenderName: string;
  damage: number;
  defenderHpBefore: number;
  defenderHpAfter: number;
  attackerHpBefore: number;
  attackerHpAfter: number;
  skillTriggered?: SkillType;
  skillEffect?: string;
  burnDamage?: number;
}

export const SKILL_LIST: { value: SkillType; label: string; desc: string }[] = [
  { value: 'none', label: '无技能', desc: '普通卡牌，无特殊效果' },
  { value: 'combo', label: '连击', desc: '50% 概率触发第二次攻击（伤害为 60%）' },
  { value: 'lifesteal', label: '吸血', desc: '每次攻击回复 30% 造成伤害的生命' },
  { value: 'shield', label: '护盾', desc: '首次受到的伤害减少 50%' },
  { value: 'burn', label: '灼烧', desc: '命中后使目标每回合额外受到攻击力 20% 的灼烧伤害（持续2回合）' },
];

interface SimulationResult {
  rounds: BattleRound[];
  winner: 'red' | 'blue';
}

function triggerSkill(attacker: Card, _defender: Card): {
  skillTriggered?: SkillType;
  skillEffect?: string;
  extraDamage?: number;
  healAmount?: number;
  shieldUsed?: boolean;
  burnApply?: boolean;
} {
  const result: ReturnType<typeof triggerSkill> = {};
  switch (attacker.skill) {
    case 'combo': {
      if (Math.random() < 0.5) {
        result.skillTriggered = 'combo';
        result.extraDamage = Math.floor(attacker.attack * 0.6);
        result.skillEffect = `⚡ 连击触发！追加 ${result.extraDamage} 伤害`;
      }
      break;
    }
    case 'lifesteal': {
      const heal = Math.floor(attacker.attack * 0.3);
      if (heal > 0) {
        result.skillTriggered = 'lifesteal';
        result.healAmount = heal;
        result.skillEffect = `🩸 吸血触发！回复 ${heal} 生命`;
      }
      break;
    }
    case 'shield':
    case 'burn': {
      if (attacker.skill === 'burn') {
        result.skillTriggered = 'burn';
        result.burnApply = true;
        result.skillEffect = '🔥 灼烧命中！目标将受到持续灼烧伤害';
      }
      break;
    }
  }
  return result;
}

export function simulateBattle(redInput: Card, blueInput: Card): SimulationResult {
  const red: Card = { ...redInput, hp: redInput.maxHp };
  const blue: Card = { ...blueInput, hp: blueInput.maxHp };
  const rounds: BattleRound[] = [];
  let roundNum = 1;
  const maxRounds = 200;

  const shieldUsed: Record<'red' | 'blue', boolean> = { red: false, blue: false };
  const burn: Record<'red' | 'blue', { remaining: number; damagePerTurn: number }> = {
    red: { remaining: 0, damagePerTurn: 0 },
    blue: { remaining: 0, damagePerTurn: 0 },
  };

  while (red.hp > 0 && blue.hp > 0 && roundNum <= maxRounds) {
    const attackerSide: 'red' | 'blue' = roundNum % 2 === 1 ? 'red' : 'blue';
    const defenderSide: 'red' | 'blue' = attackerSide === 'red' ? 'blue' : 'red';
    const attacker = attackerSide === 'red' ? red : blue;
    const defender = defenderSide === 'red' ? red : blue;

    const attackerHpBefore = attacker.hp;
    const defenderHpBefore = defender.hp;

    let damage = attacker.attack;
    const skill = triggerSkill(attacker, defender);
    let burnDamage = 0;

    if (defender.skill === 'shield' && !shieldUsed[defenderSide]) {
      damage = Math.floor(damage * 0.5);
      shieldUsed[defenderSide] = true;
      skill.skillTriggered = 'shield';
      skill.skillEffect = `🛡 护盾触发！伤害减半为 ${damage}`;
    }

    if (skill.extraDamage) {
      damage += skill.extraDamage;
    }

    defender.hp = Math.max(0, defender.hp - damage);

    if (skill.healAmount) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + skill.healAmount);
    }

    if (skill.burnApply) {
      burn[defenderSide].remaining = 2;
      burn[defenderSide].damagePerTurn = Math.floor(attacker.attack * 0.2);
    }

    rounds.push({
      id: uuidv4(),
      round: roundNum,
      attacker: attackerSide,
      attackerName: attacker.name,
      defenderName: defender.name,
      damage,
      defenderHpBefore,
      defenderHpAfter: defender.hp,
      attackerHpBefore,
      attackerHpAfter: attacker.hp,
      skillTriggered: skill.skillTriggered,
      skillEffect: skill.skillEffect,
    });

    if (defender.hp <= 0) break;

    roundNum++;

    const burnTarget: 'red' | 'blue' = roundNum % 2 === 1 ? 'red' : 'blue';
    const victim = burnTarget === 'red' ? red : blue;
    if (burn[burnTarget].remaining > 0 && victim.hp > 0) {
      burnDamage = burn[burnTarget].damagePerTurn;
      const victimHpBefore = victim.hp;
      victim.hp = Math.max(0, victim.hp - burnDamage);
      burn[burnTarget].remaining--;
      rounds.push({
        id: uuidv4(),
        round: roundNum - 0.5,
        attacker: burnTarget === 'red' ? 'blue' : 'red',
        attackerName: '灼烧',
        defenderName: victim.name,
        damage: burnDamage,
        defenderHpBefore: victimHpBefore,
        defenderHpAfter: victim.hp,
        attackerHpBefore: 0,
        attackerHpAfter: 0,
        skillTriggered: 'burn',
        skillEffect: `🔥 ${victim.name} 受到 ${burnDamage} 点灼烧伤害（剩余 ${burn[burnTarget].remaining} 回合）`,
        burnDamage,
      });
      if (victim.hp <= 0) break;
    }
  }

  const winner: 'red' | 'blue' = red.hp <= 0 ? 'blue' : 'red';
  return { rounds, winner };
}
