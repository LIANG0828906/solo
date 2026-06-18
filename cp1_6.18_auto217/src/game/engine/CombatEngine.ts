import {
  BattleCard,
  BattleLogEntry,
  DamageResult,
  ActionResult,
  Skill,
} from '../../types/game';
import { getCardStats } from '../../data/cards';

const generateLogId = (): string => Math.random().toString(36).slice(2, 10);

export class CombatEngine {
  private round: number = 1;

  setRound(round: number): void {
    this.round = round;
  }

  createLogEntry(
    type: BattleLogEntry['type'],
    message: string,
    attacker?: string,
    target?: string,
    damage?: number
  ): BattleLogEntry {
    return {
      id: generateLogId(),
      round: this.round,
      timestamp: Date.now(),
      type,
      attacker,
      target,
      damage,
      message,
    };
  }

  calculateDamage(
    attacker: BattleCard,
    target: BattleCard,
    multiplier: number = 1.0
  ): DamageResult {
    const attackerStats = getCardStats(attacker);
    const targetStats = getCardStats(target);

    let critBonus = 1.0;
    const isCritical = Math.random() < 0.1;
    if (isCritical) {
      critBonus = 1.5;
    }

    const baseDamage = attackerStats.attack * multiplier - targetStats.defense * 0.5;
    let finalDamage = Math.max(1, Math.floor(baseDamage * critBonus));

    const logType: BattleLogEntry['type'] = isCritical ? 'critical' : 'attack';
    const message = isCritical
      ? `${attacker.name} 暴击 ${target.name}，造成 ${finalDamage} 点伤害！`
      : `${attacker.name} 攻击 ${target.name}，造成 ${finalDamage} 点伤害`;

    return {
      damage: finalDamage,
      isCritical,
      isSkill: multiplier > 1.0,
      logEntry: this.createLogEntry(logType, message, attacker.name, target.name, finalDamage),
    };
  }

  aiSelectAction(
    attacker: BattleCard,
    enemyTeam: BattleCard[]
  ): { skill: Skill | null; target: BattleCard } {
    const aliveEnemies = enemyTeam.filter((e) => e.isAlive);
    if (aliveEnemies.length === 0) {
      return { skill: null, target: enemyTeam[0] };
    }

    const sortedEnemies = [...aliveEnemies].sort((a, b) => a.currentHp - b.currentHp);
    const lowestHpTarget = sortedEnemies[0];

    const activeSkill = attacker.skills.find(
      (s) => s.type === 'active' && attacker.cooldowns[s.name] === 0
    );

    if (
      activeSkill &&
      attacker.currentEnergy >= activeSkill.energyCost &&
      lowestHpTarget
    ) {
      return { skill: activeSkill, target: lowestHpTarget };
    }

    return { skill: null, target: lowestHpTarget };
  }

  executeTurn(
    attacker: BattleCard,
    target: BattleCard,
    skill: Skill | null
  ): ActionResult {
    const logs: BattleLogEntry[] = [];
    let updatedAttacker = { ...attacker };
    let updatedTarget = { ...target };
    let multiplier = 1.0;
    let isSkill = false;

    if (skill) {
      isSkill = true;
      multiplier = skill.multiplier;
      updatedAttacker.currentEnergy -= skill.energyCost;
      updatedAttacker.cooldowns = {
        ...updatedAttacker.cooldowns,
        [skill.name]: skill.cooldown,
      };
      logs.push(
        this.createLogEntry(
          'skill',
          `${attacker.name} 释放技能【${skill.name}】！`,
          attacker.name
        )
      );
    }

    const damageResult = this.calculateDamage(
      updatedAttacker,
      updatedTarget,
      multiplier
    );

    if (isSkill) {
      damageResult.isSkill = true;
      damageResult.skillName = skill?.name;
    }

    logs.push(damageResult.logEntry);

    updatedTarget.currentHp = Math.max(0, updatedTarget.currentHp - damageResult.damage);
    if (updatedTarget.currentHp <= 0) {
      updatedTarget.isAlive = false;
      logs.push(
        this.createLogEntry(
          'death',
          `${target.name} 被击败！`,
          undefined,
          target.name
        )
      );
    }

    updatedAttacker.currentEnergy = Math.min(
      updatedAttacker.maxEnergy,
      updatedAttacker.currentEnergy + 1
    );

    return {
      attacker,
      target,
      damageResult,
      updatedAttacker,
      updatedTarget,
      logs,
    };
  }

  checkBattleEnd(
    playerTeam: BattleCard[],
    enemyTeam: BattleCard[]
  ): 'win' | 'lose' | null {
    const playerAlive = playerTeam.some((c) => c.isAlive);
    const enemyAlive = enemyTeam.some((c) => c.isAlive);

    if (!enemyAlive) return 'win';
    if (!playerAlive) return 'lose';
    return null;
  }

  tickCooldowns(card: BattleCard): BattleCard {
    const newCooldowns: Record<string, number> = {};
    for (const [skillName, cd] of Object.entries(card.cooldowns)) {
      newCooldowns[skillName] = Math.max(0, cd - 1);
    }
    return { ...card, cooldowns: newCooldowns };
  }

  sortBySpeed(cards: BattleCard[]): BattleCard[] {
    return [...cards].sort((a, b) => b.speed - a.speed);
  }
}
