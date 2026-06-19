import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  Fighter,
  FloatingNumber,
  HistoryPoint,
  CARD_DEFINITIONS,
  STATUS_CONFIG,
  StatusEffectType,
  SkillEffect,
} from './types';
import { useBattleStore } from '../store/battleStore';

function createFighter(): Fighter {
  return {
    hp: 100,
    maxHp: 100,
    mp: 20,
    maxMp: 20,
    shield: 0,
    baseAttack: 10,
    attack: 10,
    statusEffects: [],
    isFrozen: false,
  };
}

function generateHand(): Card[] {
  return CARD_DEFINITIONS.map((def) => ({
    ...def,
    id: uuidv4(),
  }));
}

function getBuffStacks(fighter: Fighter): number {
  return fighter.statusEffects
    .filter((s) => s.type === 'rage')
    .reduce((sum, s) => sum + s.stacks, 0);
}

function getDebuffStacks(fighter: Fighter, stackType?: StatusEffectType): number {
  if (stackType) {
    return fighter.statusEffects
      .filter((s) => s.type === stackType)
      .reduce((sum, s) => sum + s.stacks, 0);
  }
  return fighter.statusEffects
    .filter((s) => s.type === 'poison' || s.type === 'burn' || s.type === 'freeze')
    .reduce((sum, s) => sum + s.stacks, 0);
}

function applyDamage(target: Fighter, rawDamage: number): number {
  let damage = rawDamage;
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, damage);
    target.shield -= absorbed;
    damage -= absorbed;
  }
  target.hp = Math.max(0, target.hp - damage);
  return rawDamage;
}

function applyHeal(target: Fighter, amount: number): number {
  const healed = Math.min(amount, target.maxHp - target.hp);
  target.hp = Math.min(target.maxHp, target.hp + amount);
  return healed;
}

function applyShield(target: Fighter, amount: number): number {
  target.shield += amount;
  return amount;
}

function applyStatusEffect(target: Fighter, type: StatusEffectType, duration: number): void {
  const existing = target.statusEffects.find((s) => s.type === type);
  if (existing) {
    existing.stacks += 1;
    existing.duration = Math.max(existing.duration, duration);
  } else {
    target.statusEffects.push({ type, duration, stacks: 1 });
  }
}

function recalculateAttack(fighter: Fighter): void {
  const rageEffect = fighter.statusEffects.find((s) => s.type === 'rage');
  fighter.attack = fighter.baseAttack * (rageEffect ? 1.5 : 1);
}

function processStatusEffects(fighter: Fighter, label: 'player' | 'enemy'): FloatingNumber[] {
  const floats: FloatingNumber[] = [];
  const toRemove: number[] = [];

  fighter.isFrozen = false;

  fighter.statusEffects.forEach((effect, index) => {
    switch (effect.type) {
      case 'poison': {
        const dmg = (STATUS_CONFIG.poison.dotDamage ?? 5) * effect.stacks;
        fighter.hp = Math.max(0, fighter.hp - dmg);
        floats.push({
          id: uuidv4(),
          value: dmg,
          type: 'damage',
          target: label,
          timestamp: Date.now(),
        });
        break;
      }
      case 'burn': {
        const dmg = (STATUS_CONFIG.burn.dotDamage ?? 8) * effect.stacks;
        fighter.hp = Math.max(0, fighter.hp - dmg);
        floats.push({
          id: uuidv4(),
          value: dmg,
          type: 'damage',
          target: label,
          timestamp: Date.now(),
        });
        break;
      }
      case 'freeze': {
        fighter.isFrozen = true;
        break;
      }
      case 'rage': {
        break;
      }
    }

    effect.duration -= 1;
    if (effect.duration <= 0) {
      toRemove.push(index);
    }
  });

  for (let i = toRemove.length - 1; i >= 0; i--) {
    fighter.statusEffects.splice(toRemove[i], 1);
  }

  recalculateAttack(fighter);
  return floats;
}

function executeSkill(
  card: Card,
  attacker: Fighter,
  defender: Fighter,
  isPlayerAttacker: boolean
): FloatingNumber[] {
  const floats: FloatingNumber[] = [];
  const effect: SkillEffect = card.effect;
  const targetLabel: 'player' | 'enemy' = isPlayerAttacker ? 'enemy' : 'player';
  const selfLabel: 'player' | 'enemy' = isPlayerAttacker ? 'player' : 'enemy';

  if (effect.damage !== undefined) {
    const stacks = getDebuffStacks(defender, card.stackType);
    let totalDamage = effect.damage + (effect.damagePerStack ?? 0) * stacks;
    totalDamage = Math.round(totalDamage * (attacker.attack / attacker.baseAttack));
    const actualDmg = applyDamage(defender, totalDamage);
    floats.push({
      id: uuidv4(),
      value: actualDmg,
      type: 'damage',
      target: targetLabel,
      timestamp: Date.now(),
    });

    if (effect.lifeDrain) {
      const healed = applyHeal(attacker, actualDmg);
      if (healed > 0) {
        floats.push({
          id: uuidv4(),
          value: healed,
          type: 'heal',
          target: selfLabel,
          timestamp: Date.now(),
        });
      }
    }
  }

  if (effect.heal !== undefined) {
    const stacks = getBuffStacks(attacker);
    const totalHeal = effect.heal + (effect.healPerStack ?? 0) * stacks;
    const healed = applyHeal(attacker, totalHeal);
    if (healed > 0) {
      floats.push({
        id: uuidv4(),
        value: healed,
        type: 'heal',
        target: selfLabel,
        timestamp: Date.now(),
      });
    }
  }

  if (effect.shield !== undefined) {
    const stacks = getBuffStacks(attacker);
    const totalShield = effect.shield + (effect.shieldPerStack ?? 0) * stacks;
    const applied = applyShield(attacker, totalShield);
    floats.push({
      id: uuidv4(),
      value: applied,
      type: 'shield',
      target: selfLabel,
      timestamp: Date.now(),
    });
  }

  if (effect.statusEffect && effect.statusDuration) {
    if (effect.statusEffect === 'rage') {
      applyStatusEffect(attacker, effect.statusEffect, effect.statusDuration);
      recalculateAttack(attacker);
    } else {
      applyStatusEffect(defender, effect.statusEffect, effect.statusDuration);
    }
    if (effect.statusEffect === 'freeze') {
      defender.isFrozen = true;
    }
  }

  return floats;
}

function recoverMP(fighter: Fighter): void {
  fighter.mp = Math.min(fighter.maxMp, fighter.mp + 3);
}

export function startBattle(): void {
  const player = createFighter();
  const enemy = createFighter();
  const playerHand = generateHand();
  const enemyHand = generateHand();

  const initialHP: HistoryPoint = { turn: 0, playerValue: player.hp, enemyValue: enemy.hp };
  const initialMP: HistoryPoint = { turn: 0, playerValue: player.mp, enemyValue: enemy.mp };
  const initialATK: HistoryPoint = { turn: 0, playerValue: player.attack, enemyValue: enemy.attack };

  useBattleStore.getState().initBattle(player, enemy, playerHand, enemyHand, initialHP, initialMP, initialATK);
}

export async function executeTurn(playerCard: Card): Promise<void> {
  const store = useBattleStore.getState();
  if (store.isOver) return;
  if (playerCard.mpCost > store.player.mp) return;

  const player = structuredClone(store.player);
  const enemy = structuredClone(store.enemy);
  const allFloats: FloatingNumber[] = [];
  const skillUsage = { ...store.skillUsage };

  player.mp -= playerCard.mpCost;

  const playerFloats = executeSkill(playerCard, player, enemy, true);
  allFloats.push(...playerFloats);
  skillUsage[playerCard.name] = (skillUsage[playerCard.name] || 0) + 1;

  store.updateFighters(player, enemy);
  store.addFloatingNumbers(playerFloats);
  store.updateSkillUsage(skillUsage);

  if (enemy.hp <= 0) {
    store.endBattle('player', allFloats);
    return;
  }

  let enemyCardIndex = -1;
  try {
    const response = await fetch('/api/ai-decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aiHP: enemy.hp,
        aiMP: enemy.mp,
        aiShield: enemy.shield,
        aiStatusEffects: enemy.statusEffects,
        playerHP: player.hp,
        hand: store.enemyHand,
      }),
    });
    const data = await response.json();
    enemyCardIndex = data.cardIndex;
  } catch {
    const availableCards = store.enemyHand
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card }) => card.mpCost <= enemy.mp);
    if (availableCards.length > 0) {
      const isLowHP = enemy.hp < 30;
      const preferred = isLowHP
        ? availableCards.filter(({ card }) => card.type === 'heal' || card.type === 'defense')
        : availableCards.filter(({ card }) => card.type === 'attack' || card.type === 'debuff');
      const pool = preferred.length > 0 ? preferred : availableCards;
      enemyCardIndex = pool[Math.floor(Math.random() * pool.length)].index;
    }
  }

  if (enemyCardIndex >= 0 && !enemy.isFrozen) {
    const enemyCard = store.enemyHand[enemyCardIndex];
    if (enemyCard && enemyCard.mpCost <= enemy.mp) {
      enemy.mp -= enemyCard.mpCost;
      const enemyFloats = executeSkill(enemyCard, enemy, player, false);
      allFloats.push(...enemyFloats);
      skillUsage[enemyCard.name] = (skillUsage[enemyCard.name] || 0) + 1;
      store.addFloatingNumbers(enemyFloats);
      store.updateSkillUsage(skillUsage);
    }
  } else if (enemy.isFrozen) {
    enemy.isFrozen = false;
    const freezeIdx = enemy.statusEffects.findIndex((s) => s.type === 'freeze');
    if (freezeIdx >= 0) {
      enemy.statusEffects.splice(freezeIdx, 1);
    }
  }

  const playerStatusFloats = processStatusEffects(player, 'player');
  const enemyStatusFloats = processStatusEffects(enemy, 'enemy');
  allFloats.push(...playerStatusFloats, ...enemyStatusFloats);

  recoverMP(player);
  recoverMP(enemy);

  const turnCount = store.turnCount + 1;

  store.updateFighters(player, enemy);
  store.addFloatingNumbers([...playerStatusFloats, ...enemyStatusFloats]);
  store.incrementTurn(
    { turn: turnCount, playerValue: player.hp, enemyValue: enemy.hp },
    { turn: turnCount, playerValue: player.mp, enemyValue: enemy.mp },
    { turn: turnCount, playerValue: player.attack, enemyValue: enemy.attack }
  );

  if (player.hp <= 0) {
    store.endBattle('enemy', allFloats);
  } else if (enemy.hp <= 0) {
    store.endBattle('player', allFloats);
  }
}

export function getBattleState() {
  return useBattleStore.getState();
}
