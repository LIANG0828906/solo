import type { Unit, Hero, Monster, Skill, BattleResult, Position } from '../types';

const CRIT_CHANCE = 0.15;
const CRIT_MULTIPLIER = 1.5;
const MIN_DAMAGE = 1;

export class BattleSystem {
  static resolveHeroAttack(attacker: Hero, defender: Monster): BattleResult {
    const isCritical = Math.random() < CRIT_CHANCE;
    const attackerAttack = this.getEffectiveStat(attacker, 'attack');
    const defenderDefense = this.getEffectiveStat(defender, 'defense');

    let baseDamage = attackerAttack - defenderDefense;

    if (isCritical) {
      baseDamage = Math.floor(baseDamage * CRIT_MULTIPLIER);
    }

    const damage = Math.max(MIN_DAMAGE, baseDamage);
    const targetHp = Math.max(0, defender.hp - damage);
    const targetDefeated = targetHp <= 0;

    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      damageDealt: damage,
      damage: damage,
      isCritical,
      defenderDied: targetDefeated,
      targetDefeated,
      targetHp,
    };
  }

  static resolveMonsterAttack(attacker: Monster, defender: Hero): BattleResult {
    const isCritical = Math.random() < CRIT_CHANCE;
    const attackerAttack = this.getEffectiveStat(attacker, 'attack');
    const defenderDefense = this.getEffectiveStat(defender, 'defense');

    let baseDamage = attackerAttack - defenderDefense;

    if (isCritical) {
      baseDamage = Math.floor(baseDamage * CRIT_MULTIPLIER);
    }

    const damage = Math.max(MIN_DAMAGE, baseDamage);
    const targetHp = Math.max(0, defender.hp - damage);
    const targetDefeated = targetHp <= 0;

    return {
      attackerId: attacker.id,
      defenderId: defender.id,
      damageDealt: damage,
      damage: damage,
      isCritical,
      defenderDied: targetDefeated,
      targetDefeated,
      targetHp,
    };
  }

  public calculateDamage(attacker: Unit, defender: Unit): { damage: number; isCritical: boolean } {
    const isCritical = Math.random() < CRIT_CHANCE;
    const attackerAttack = BattleSystem.getEffectiveStat(attacker, 'attack');
    const defenderDefense = BattleSystem.getEffectiveStat(defender, 'defense');

    let baseDamage = attackerAttack - defenderDefense;

    if (isCritical) {
      baseDamage = Math.floor(baseDamage * CRIT_MULTIPLIER);
    }

    const damage = Math.max(MIN_DAMAGE, baseDamage);

    return { damage, isCritical };
  }

  public resolveCombat(attacker: Unit, defender: Unit): BattleResult {
    const { damage, isCritical } = this.calculateDamage(attacker, defender);

    defender.hp = Math.max(0, defender.hp - damage);
    const defenderDied = defender.hp <= 0;

    const result: BattleResult = {
      attackerId: attacker.id,
      defenderId: defender.id,
      damageDealt: damage,
      damage: damage,
      isCritical,
      defenderDied,
      targetDefeated: defenderDied,
      targetHp: defender.hp,
    };

    if (defenderDied && this.isHero(attacker) && this.isMonster(defender)) {
      result.expGained = defender.expReward;
      result.goldGained = defender.goldReward;
      result.loot = defender.loot;

      attacker.experience += defender.expReward;
      attacker.gold += defender.goldReward;
      if (defender.loot.length > 0) {
        attacker.inventory.push(...defender.loot);
      }
    }

    this.decrementCooldowns(attacker);

    return result;
  }

  public getTurnOrder(units: Unit[]): Unit[] {
    return [...units].sort((a, b) => {
      const speedA = BattleSystem.getEffectiveStat(a, 'speed');
      const speedB = BattleSystem.getEffectiveStat(b, 'speed');
      return speedB - speedA;
    });
  }

  public useSkill(attacker: Unit, skill: Skill, target: Unit): BattleResult | null {
    if (skill.currentCooldown > 0) {
      return null;
    }

    skill.currentCooldown = skill.cooldown;

    switch (skill.type) {
      case 'damage': {
        const baseDamage = Math.max(MIN_DAMAGE, skill.power - BattleSystem.getEffectiveStat(target, 'defense'));
        const finalDamage = Math.max(MIN_DAMAGE, baseDamage);
        target.hp = Math.max(0, target.hp - finalDamage);

        return {
          attackerId: attacker.id,
          defenderId: target.id,
          damageDealt: finalDamage,
          damage: finalDamage,
          isCritical: false,
          defenderDied: target.hp <= 0,
          targetDefeated: target.hp <= 0,
          targetHp: target.hp,
        };
      }
      case 'heal': {
        const healAmount = skill.power;
        target.hp = Math.min(target.maxHp, target.hp + healAmount);

        return {
          attackerId: attacker.id,
          defenderId: target.id,
          damageDealt: -healAmount,
          damage: -healAmount,
          isCritical: false,
          defenderDied: false,
          targetDefeated: false,
          targetHp: target.hp,
        };
      }
      case 'buff': {
        const buffValue = skill.power;
        const existingBuff = target.buffs.find((b) => b.name === skill.name);
        if (existingBuff) {
          existingBuff.duration = 3;
          existingBuff.remainingTurns = 3;
        } else {
          target.buffs.push({
            id: `buff-${Date.now()}`,
            name: skill.name,
            stat: 'attack',
            type: 'attack',
            value: buffValue,
            remainingTurns: 3,
            duration: 3,
          });
        }

        return {
          attackerId: attacker.id,
          defenderId: target.id,
          damageDealt: 0,
          damage: 0,
          isCritical: false,
          defenderDied: false,
          targetDefeated: false,
          targetHp: target.hp,
        };
      }
      default:
        return null;
    }
  }

  public shouldAutoAttack(attacker: Unit, defender: Unit): boolean {
    const distance = this.getManhattanDistance(attacker.position, defender.position);
    return distance === 1;
  }

  public updateBuffs(unit: Unit): void {
    unit.buffs = unit.buffs
      .map((buff) => ({ ...buff, duration: buff.duration - 1, remainingTurns: buff.remainingTurns - 1 }))
      .filter((buff) => buff.duration > 0);
  }

  private static getEffectiveStat(unit: Unit, stat: keyof Pick<Unit, 'attack' | 'defense' | 'speed'>): number {
    let base = unit[stat];
    for (const buff of unit.buffs) {
      if (buff.stat === stat) {
        base += buff.value;
      }
    }
    return Math.max(0, base);
  }

  private decrementCooldowns(unit: Unit): void {
    for (const skill of unit.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--;
      }
    }
  }

  private getManhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private isHero(unit: Unit): unit is Hero {
    return 'level' in unit && 'experience' in unit;
  }

  private isMonster(unit: Unit): unit is Monster {
    return 'expReward' in unit;
  }
}
