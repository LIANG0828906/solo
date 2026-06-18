import type { Unit, Skill, HexCoord, DamagePopup, StatusEffect } from '../types';

export interface AttackResult {
  attackerId: string;
  targetId: string;
  damage: number;
  isCrit: boolean;
  targetDied: boolean;
  newBurnEffect: StatusEffect | null;
}

export interface AnimationEvent {
  type: 'flash' | 'damagePopup' | 'fade';
  unitId?: string;
  position?: HexCoord;
  damage?: number;
  isCrit?: boolean;
  duration: number;
  timestamp: number;
}

export class CombatEngine {
  private animationQueue: AnimationEvent[] = [];

  calculateDamage(
    attacker: Unit,
    target: Unit,
    skill: Skill
  ): { damage: number; isCrit: boolean } {
    const isCrit = Math.random() < attacker.critChance;
    const baseDamage = attacker.atk * skill.damageMultiplier;
    const effectiveDef = target.def * (1 - skill.ignoreDefensePercent / 100);
    let damage = Math.max(1, Math.round(baseDamage - effectiveDef));
    if (isCrit) {
      damage = Math.round(damage * 1.5);
    }
    return { damage, isCrit };
  }

  executeSkill(
    attacker: Unit,
    target: Unit,
    skill: Skill
  ): AttackResult {
    const { damage, isCrit } = this.calculateDamage(attacker, target, skill);

    target.hp = Math.max(0, target.hp - damage);

    let newBurnEffect: StatusEffect | null = null;
    if (skill.burnDamagePerTurn > 0 && skill.burnDuration > 0) {
      newBurnEffect = {
        type: 'burn',
        damagePerTurn: skill.burnDamagePerTurn,
        remainingTurns: skill.burnDuration,
      };
      const existingBurn = target.statusEffects.find(e => e.type === 'burn');
      if (existingBurn) {
        existingBurn.remainingTurns = Math.max(existingBurn.remainingTurns, skill.burnDuration);
        existingBurn.damagePerTurn = Math.max(existingBurn.damagePerTurn, skill.burnDamagePerTurn);
        newBurnEffect = null;
      } else {
        target.statusEffects.push({ ...newBurnEffect });
      }
    }

    const targetDied = target.hp <= 0;
    if (targetDied) {
      target.isDead = true;
    }

    skill.currentCooldown = skill.cooldown;

    return {
      attackerId: attacker.id,
      targetId: target.id,
      damage,
      isCrit,
      targetDied,
      newBurnEffect,
    };
  }

  generateAnimationEvents(result: AttackResult, targetPosition: HexCoord): AnimationEvent[] {
    const now = Date.now();
    const events: AnimationEvent[] = [];

    events.push({
      type: 'flash',
      unitId: result.targetId,
      duration: 400,
      timestamp: now,
    });

    events.push({
      type: 'damagePopup',
      position: targetPosition,
      damage: result.damage,
      isCrit: result.isCrit,
      duration: 1500,
      timestamp: now,
    });

    if (result.targetDied) {
      events.push({
        type: 'fade',
        unitId: result.targetId,
        duration: 500,
        timestamp: now + 400,
      });
    }

    return events;
  }

  addAnimationEvents(events: AnimationEvent[]): void {
    this.animationQueue.push(...events);
  }

  getPendingAnimations(): AnimationEvent[] {
    const now = Date.now();
    return this.animationQueue.filter(e => e.timestamp <= now + 50);
  }

  getAnimationsForRender(): AnimationEvent[] {
    const now = Date.now();
    return this.animationQueue.filter(e => {
      const age = now - e.timestamp;
      return age >= 0 && age < e.duration;
    });
  }

  cleanupExpiredAnimations(): void {
    const now = Date.now();
    this.animationQueue = this.animationQueue.filter(e => {
      const age = now - e.timestamp;
      return age < e.duration;
    });
  }

  processStatusEffects(unit: Unit): { damage: number; died: boolean }[] {
    const results: { damage: number; died: boolean }[] = [];
    for (let i = unit.statusEffects.length - 1; i >= 0; i--) {
      const effect = unit.statusEffects[i];
      if (effect.type === 'burn') {
        const burnDamage = Math.min(unit.hp, effect.damagePerTurn);
        unit.hp = Math.max(0, unit.hp - effect.damagePerTurn);
        const died = unit.hp <= 0;
        if (died) unit.isDead = true;
        results.push({ damage: burnDamage, died });
        effect.remainingTurns--;
        if (effect.remainingTurns <= 0) {
          unit.statusEffects.splice(i, 1);
        }
      }
    }
    return results;
  }

  decrementCooldowns(unit: Unit): void {
    for (const skill of unit.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--;
      }
    }
  }
}
