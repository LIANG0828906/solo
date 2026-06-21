import type { Unit, Card, StatusEffect, LogEntry, PlayerSide, EffectType } from '../types/game';

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

  processEndOfTurnEffects(units: Unit[]): { updatedUnits: Unit[]; logs: LogEntry[] } {
    const updatedUnits = units.map((u) => ({ ...u, effects: [...u.effects] }));
    const logs: LogEntry[] = [];

    for (const unit of updatedUnits) {
      if (unit.hp <= 0) continue;

      const newEffects: StatusEffect[] = [];
      const expiredEffects: StatusEffect[] = [];

      for (const effect of unit.effects) {
        const remainingTurns = effect.remainingTurns - 1;

        if (remainingTurns <= 0) {
          expiredEffects.push(effect);
          logs.push(this.createLog(
            `${unit.name}的${this.getEffectName(effect.type)}效果已消散`,
            'effect',
          ));
        } else {
          newEffects.push({ ...effect, remainingTurns });
          logs.push(this.createLog(
            `${unit.name}的${this.getEffectName(effect.type)}效果剩余${remainingTurns}回合`,
            'effect',
          ));
        }
      }

      unit.effects = newEffects;

      if (expiredEffects.length > 0) {
        this.recalculateAttack(unit);
        this.recalculateShield(unit, expiredEffects);
      }
    }

    return { updatedUnits, logs };
  }

  private getEffectName(type: string): string {
    const names: Record<string, string> = {
      shield: '护盾',
      weakness: '虚弱',
      attack_buff: '攻击强化',
    };
    return names[type] || type;
  }

  private recalculateAttack(unit: Unit) {
    let attack = unit.baseAttack;
    for (const effect of unit.effects) {
      if (effect.type === 'weakness') {
        attack -= effect.value;
      } else if (effect.type === 'attack_buff') {
        attack += effect.value;
      }
    }
    unit.attack = Math.max(0, attack);
  }

  private recalculateShield(unit: Unit, expiredEffects: StatusEffect[]) {
    for (const effect of expiredEffects) {
      if (effect.type === 'shield') {
        unit.shield = Math.max(0, unit.shield - effect.value);
      }
    }
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
      const oldValue = existingShield.value;
      const oldDuration = existingShield.remainingTurns;
      existingShield.value = Math.max(existingShield.value, shield);
      existingShield.remainingTurns = Math.max(existingShield.remainingTurns, duration);
      target.shield = Math.max(target.shield, shield);

      logs.push(this.createLog(
        `${target.name}的护盾效果刷新：${oldValue}/${oldDuration}回合 → ${existingShield.value}/${existingShield.remainingTurns}回合`,
        'effect',
      ));
    } else {
      target.effects.push({
        id: `shield_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'shield',
        value: shield,
        remainingTurns: duration,
      });
      target.shield = Math.max(target.shield, shield);

      logs.push(this.createLog(
        `${target.name}获得护盾效果：${shield}点，持续${duration}回合`,
        'effect',
      ));
    }

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
    const effectType: EffectType = modifier >= 0 ? 'attack_buff' : 'weakness';
    const absValue = Math.abs(modifier);
    const effectName = this.getEffectName(effectType);
    const logType = modifier >= 0 ? 'utility' : 'debuff';

    const existingEffect = target.effects.find((e) => e.type === effectType);

    if (existingEffect) {
      const oldValue = existingEffect.value;
      const oldDuration = existingEffect.remainingTurns;
      existingEffect.value = Math.max(existingEffect.value, absValue);
      existingEffect.remainingTurns = Math.max(existingEffect.remainingTurns, duration);

      logs.push(this.createLog(
        `${target.name}的${effectName}效果刷新：${oldValue}/${oldDuration}回合 → ${existingEffect.value}/${existingEffect.remainingTurns}回合`,
        'effect',
      ));
    } else {
      target.effects.push({
        id: `${effectType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: effectType,
        value: absValue,
        remainingTurns: duration,
      });

      logs.push(this.createLog(
        `${target.name}获得${effectName}效果：${absValue}点，持续${duration}回合`,
        'effect',
      ));
    }

    this.recalculateAttack(target);

    logs.push(this.createLog(
      `${card.name}使${target.name}攻击力${modifier > 0 ? '+' : ''}${modifier}，持续${duration}回合`,
      logType,
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
