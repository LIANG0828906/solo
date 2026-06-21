import type { Unit, Card, StatusEffect, LogEntry, PlayerSide } from '../types/game';

export class CardEngine {
  private logIdCounter = 0;

  applyCardEffect(
    card: Card,
    caster: PlayerSide,
    targetIds: string[],
    units: Unit[],
  ): { updatedUnits: Unit[]; logs: LogEntry[] } {
    const updatedUnits = units.map((u) => ({ ...u, effects: [...u.effects] }));
    const logs: LogEntry[] = [];

    for (const targetId of targetIds) {
      const targetIndex = updatedUnits.findIndex((u) => u.id === targetId);
      if (targetIndex === -1) continue;

      const target = updatedUnits[targetIndex];
      const effect = card.effect;

      if (effect.damage !== undefined) {
        this.applyDamage(target, effect.damage, effect.ignoreShield || false, logs, card);
      }

      if (effect.heal !== undefined) {
        this.applyHeal(target, effect.heal, logs, card);
      }

      if (effect.shield !== undefined && effect.duration !== undefined) {
        this.applyShieldEffect(target, effect.shield, effect.duration, logs, card);
      }

      if (effect.attackModifier !== undefined && effect.duration !== undefined) {
        this.applyAttackModifier(target, effect.attackModifier, effect.duration, logs, card);
      }

      updatedUnits[targetIndex] = target;
    }

    return { updatedUnits, logs };
  }

  applyEnergyRestore(card: Card, currentEnergy: number, maxEnergy: number): number {
    if (card.effect.energyRestore) {
      return Math.min(currentEnergy + card.effect.energyRestore, maxEnergy);
    }
    return currentEnergy;
  }

  processEndOfTurnEffects(units: Unit[], side: PlayerSide): { updatedUnits: Unit[]; logs: LogEntry[] } {
    const updatedUnits = units.map((u) => ({ ...u, effects: [...u.effects] }));
    const logs: LogEntry[] = [];

    for (const unit of updatedUnits) {
      if (unit.owner !== side) continue;

      const newEffects: StatusEffect[] = [];

      for (const effect of unit.effects) {
        const remainingTurns = effect.remainingTurns - 1;

        if (remainingTurns <= 0) {
          if (effect.type === 'weakness') {
            unit.attack = unit.baseAttack;
            logs.push(this.createLog(
              `${unit.name}的虚弱效果已消散`,
              'system',
            ));
          } else if (effect.type === 'shield') {
            unit.shield = Math.max(0, unit.shield - effect.value);
            logs.push(this.createLog(
              `${unit.name}的护盾效果已消散`,
              'system',
            ));
          }
        } else {
          newEffects.push({ ...effect, remainingTurns });
        }
      }

      unit.effects = newEffects;
    }

    return { updatedUnits, logs };
  }

  private applyDamage(target: Unit, damage: number, ignoreShield: boolean, logs: LogEntry[], card: Card) {
    let actualDamage = damage;

    if (!ignoreShield && target.shield > 0) {
      const shieldAbsorb = Math.min(target.shield, damage);
      target.shield -= shieldAbsorb;
      actualDamage -= shieldAbsorb;
    }

    target.hp = Math.max(0, target.hp - actualDamage);

    logs.push(this.createLog(
      `${card.name}对${target.name}造成${damage}点伤害${ignoreShield ? '(无视护盾)' : ''}`,
      'attack',
    ));

    if (target.hp <= 0) {
      logs.push(this.createLog(
        `${target.name}已被击败！`,
        'system',
      ));
    }
  }

  private applyHeal(target: Unit, heal: number, logs: LogEntry[], card: Card) {
    const actualHeal = Math.min(heal, target.maxHp - target.hp);
    target.hp += actualHeal;

    logs.push(this.createLog(
      `${card.name}为${target.name}恢复${actualHeal}点生命`,
      'heal',
    ));
  }

  private applyShieldEffect(target: Unit, shield: number, duration: number, logs: LogEntry[], card: Card) {
    const existingShield = target.effects.find((e) => e.type === 'shield');

    if (existingShield) {
      existingShield.value = Math.max(existingShield.value, shield);
      existingShield.remainingTurns = Math.max(existingShield.remainingTurns, duration);
    } else {
      target.effects.push({
        id: `shield_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'shield',
        value: shield,
        remainingTurns: duration,
      });
    }

    target.shield = Math.max(target.shield, shield);

    logs.push(this.createLog(
      `${card.name}为${target.name}增加${shield}点护盾，持续${duration}回合`,
      'shield',
    ));
  }

  private applyAttackModifier(
    target: Unit,
    modifier: number,
    duration: number,
    logs: LogEntry[],
    card: Card,
  ) {
    target.attack = Math.max(0, target.attack + modifier);

    const existingEffect = target.effects.find((e) => e.type === 'weakness');

    if (existingEffect) {
      existingEffect.value = Math.min(existingEffect.value, Math.abs(modifier));
      existingEffect.remainingTurns = Math.max(existingEffect.remainingTurns, duration);
    } else {
      target.effects.push({
        id: `weakness_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'weakness',
        value: Math.abs(modifier),
        remainingTurns: duration,
      });
    }

    logs.push(this.createLog(
      `${card.name}使${target.name}攻击力${modifier > 0 ? '+' : ''}${modifier}，持续${duration}回合`,
      'debuff',
    ));
  }

  private createLog(message: string, type: LogEntry['type']): LogEntry {
    return {
      id: `log_${Date.now()}_${this.logIdCounter++}`,
      timestamp: Date.now(),
      message,
      type,
    };
  }

  getRandomEnemyTargets(
    units: Unit[],
    caster: PlayerSide,
    count: number,
  ): string[] {
    const enemies = units.filter((u) => u.owner !== caster && u.hp > 0);
    const shuffled = [...enemies].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length)).map((u) => u.id);
  }

  getAllFriendlyTargets(units: Unit[], caster: PlayerSide): string[] {
    return units.filter((u) => u.owner === caster && u.hp > 0).map((u) => u.id);
  }

  getAllEnemyTargets(units: Unit[], caster: PlayerSide): string[] {
    return units.filter((u) => u.owner !== caster && u.hp > 0).map((u) => u.id);
  }
}
