import { Card, Deck, DeckStats, computeDeckStats } from '../domain/cardData';
import { resolveCardSkill } from '../domain/skillEngine';
import { eventBus, EventType } from '../eventBus';

export interface BattleResult {
  leftWins: number;
  rightWins: number;
  avgTurns: number;
  totalDamageLeft: number;
  totalDamageRight: number;
  totalHealLeft: number;
  totalHealRight: number;
  winRateCurve: number[];
  leftDeckStats: DeckStats;
  rightDeckStats: DeckStats;
}

export interface BalanceSuggestion {
  cardId: string;
  deckSide: 'left' | 'right';
  field: 'cost' | 'attack' | 'defense' | 'skillValue';
  from: number;
  to: number;
  reason: string;
}

interface BattleState {
  leftHp: number;
  rightHp: number;
  leftHand: Card[];
  rightHand: Card[];
  leftDeck: Card[];
  rightDeck: Card[];
  leftMana: number;
  rightMana: number;
  turn: 'left' | 'right';
  turnCount: number;
  rightAttackHalveTurns: number;
  leftAttackHalveTurns: number;
  leftDoubleAttack: boolean;
  rightDoubleAttack: boolean;
  damageDealtLeft: number;
  damageDealtRight: number;
  healLeft: number;
  healRight: number;
}

const MAX_HP = 30;
const START_HAND = 5;
const MAX_MANA = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCard(state: BattleState, side: 'left' | 'right'): void {
  const deck = side === 'left' ? state.leftDeck : state.rightDeck;
  const hand = side === 'left' ? state.leftHand : state.rightHand;
  if (deck.length > 0 && hand.length < 10) {
    hand.push(deck.shift()!);
  }
}

function pickBestCard(hand: Card[], mana: number): Card | null {
  const affordable = hand.filter((c) => c.cost <= mana);
  if (affordable.length === 0) return null;
  affordable.sort((a, b) => b.attack - a.attack);
  return affordable[0];
}

function removeCardFromHand(hand: Card[], card: Card): void {
  const idx = hand.findIndex((c) => c.id === card.id);
  if (idx >= 0) hand.splice(idx, 1);
}

function playCard(
  state: BattleState,
  card: Card,
  attacker: 'left' | 'right',
): void {
  const defender = attacker === 'left' ? 'right' : 'left';
  const effect = resolveCardSkill(card);

  let attackValue = card.attack;
  if (attacker === 'left' && state.leftAttackHalveTurns > 0) {
    attackValue = Math.floor(attackValue / 2);
  }
  if (attacker === 'right' && state.rightAttackHalveTurns > 0) {
    attackValue = Math.floor(attackValue / 2);
  }
  if (attacker === 'left' && state.leftDoubleAttack) {
    attackValue = attackValue * 2;
  }
  if (attacker === 'right' && state.rightDoubleAttack) {
    attackValue = attackValue * 2;
  }

  let rawDamage = attackValue + effect.extraDamage;
  if (defender === 'left') {
    state.damageDealtRight += rawDamage;
  } else {
    state.damageDealtLeft += rawDamage;
  }
  if (defender === 'left') {
    state.leftHp -= rawDamage;
  } else {
    state.rightHp -= rawDamage;
  }

  if (effect.healAmount > 0) {
    if (attacker === 'left') {
      state.leftHp = Math.min(MAX_HP, state.leftHp + effect.healAmount);
      state.healLeft += effect.healAmount;
    } else {
      state.rightHp = Math.min(MAX_HP, state.rightHp + effect.healAmount);
      state.healRight += effect.healAmount;
    }
  }

  if (effect.attackHalveTurns > 0) {
    if (defender === 'left') {
      state.leftAttackHalveTurns = Math.max(state.leftAttackHalveTurns, effect.attackHalveTurns);
    } else {
      state.rightAttackHalveTurns = Math.max(state.rightAttackHalveTurns, effect.attackHalveTurns);
    }
  }

  if (effect.drawCards > 0) {
    for (let i = 0; i < effect.drawCards; i += 1) {
      drawCard(state, attacker);
    }
  }

  if (effect.doubleAttackPercent > 0) {
    if (attacker === 'left') {
      state.leftDoubleAttack = true;
    } else {
      state.rightDoubleAttack = true;
    }
  }
}

function runSingleBattle(leftDeck: Deck, rightDeck: Deck): {
  winner: 'left' | 'right' | 'draw';
  turns: number;
  damageLeft: number;
  damageRight: number;
  healLeft: number;
  healRight: number;
} {
  const state: BattleState = {
    leftHp: MAX_HP,
    rightHp: MAX_HP,
    leftHand: [],
    rightHand: [],
    leftDeck: shuffle(leftDeck),
    rightDeck: shuffle(rightDeck),
    leftMana: 1,
    rightMana: 1,
    turn: 'left',
    turnCount: 1,
    leftAttackHalveTurns: 0,
    rightAttackHalveTurns: 0,
    leftDoubleAttack: false,
    rightDoubleAttack: false,
    damageDealtLeft: 0,
    damageDealtRight: 0,
    healLeft: 0,
    healRight: 0,
  };

  for (let i = 0; i < START_HAND; i += 1) {
    drawCard(state, 'left');
    drawCard(state, 'right');
  }

  let safety = 500;
  while (safety > 0) {
    safety -= 1;
    if (state.leftHp <= 0 && state.rightHp <= 0) {
      return {
        winner: 'draw',
        turns: state.turnCount,
        damageLeft: state.damageDealtLeft,
        damageRight: state.damageDealtRight,
        healLeft: state.healLeft,
        healRight: state.healRight,
      };
    }
    if (state.leftHp <= 0) {
      return {
        winner: 'right',
        turns: state.turnCount,
        damageLeft: state.damageDealtLeft,
        damageRight: state.damageDealtRight,
        healLeft: state.healLeft,
        healRight: state.healRight,
      };
    }
    if (state.rightHp <= 0) {
      return {
        winner: 'left',
        turns: state.turnCount,
        damageLeft: state.damageDealtLeft,
        damageRight: state.damageDealtRight,
        healLeft: state.healLeft,
        healRight: state.healRight,
      };
    }

    const side = state.turn;
    const hand = side === 'left' ? state.leftHand : state.rightHand;
    const mana = side === 'left' ? state.leftMana : state.rightMana;

    let played = true;
    let playedCount = 0;
    while (played && playedCount < 5) {
      played = false;
      const card = pickBestCard(hand, mana - playedCount * 0);
      if (card) {
        playCard(state, card, side);
        removeCardFromHand(hand, card);
        played = true;
        playedCount += 1;
        if (state.leftHp <= 0 || state.rightHp <= 0) break;
      }
    }

    if (side === 'left') {
      state.leftDoubleAttack = false;
      if (state.leftAttackHalveTurns > 0) state.leftAttackHalveTurns -= 1;
      state.turn = 'right';
    } else {
      state.rightDoubleAttack = false;
      if (state.rightAttackHalveTurns > 0) state.rightAttackHalveTurns -= 1;
      state.turn = 'left';
      state.turnCount += 1;
      state.leftMana = Math.min(MAX_MANA, state.leftMana + 1);
      state.rightMana = Math.min(MAX_MANA, state.rightMana + 1);
      drawCard(state, 'left');
      drawCard(state, 'right');
    }
  }

  return {
    winner: state.leftHp >= state.rightHp ? 'left' : 'right',
    turns: state.turnCount,
    damageLeft: state.damageDealtLeft,
    damageRight: state.damageDealtRight,
    healLeft: state.healLeft,
    healRight: state.healRight,
  };
}

const TOTAL_BATTLES = 100;

export function startSimulation(leftDeck: Deck, rightDeck: Deck): void {
  eventBus.emit(EventType.BATTLE_START);

  let leftWins = 0;
  let rightWins = 0;
  let totalTurns = 0;
  let totalDamageLeft = 0;
  let totalDamageRight = 0;
  let totalHealLeft = 0;
  let totalHealRight = 0;
  const winRateCurve: number[] = [];
  let completed = 0;

  const batchSize = 20;

  const runBatch = () => {
    const end = Math.min(completed + batchSize, TOTAL_BATTLES);
    for (let i = completed; i < end; i += 1) {
      const result = runSingleBattle(leftDeck, rightDeck);
      if (result.winner === 'left') leftWins += 1;
      else if (result.winner === 'right') rightWins += 1;
      totalTurns += result.turns;
      totalDamageLeft += result.damageLeft;
      totalDamageRight += result.damageRight;
      totalHealLeft += result.healLeft;
      totalHealRight += result.healRight;
      winRateCurve.push(Number(((leftWins / (i + 1)) * 100).toFixed(1)));
    }
    completed = end;
    eventBus.emit(EventType.BATTLE_PROGRESS, {
      progress: completed / TOTAL_BATTLES,
      completed,
      total: TOTAL_BATTLES,
    });

    if (completed < TOTAL_BATTLES) {
      setTimeout(runBatch, 0);
    } else {
      const battleResult: BattleResult = {
        leftWins,
        rightWins,
        avgTurns: Number((totalTurns / TOTAL_BATTLES).toFixed(1)),
        totalDamageLeft,
        totalDamageRight,
        totalHealLeft,
        totalHealRight,
        winRateCurve,
        leftDeckStats: computeDeckStats(leftDeck),
        rightDeckStats: computeDeckStats(rightDeck),
      };
      eventBus.emit(EventType.BATTLE_COMPLETE, battleResult);
    }
  };

  setTimeout(runBatch, 0);
}

export function generateBalanceSuggestions(
  leftDeck: Deck,
  rightDeck: Deck,
  result: BattleResult,
): BalanceSuggestion[] {
  const suggestions: BalanceSuggestion[] = [];
  const leftWinRate = (result.leftWins / (result.leftWins + result.rightWins)) * 100;
  const targetWinRate = 50;

  if (Math.abs(leftWinRate - targetWinRate) < 5) {
    return suggestions;
  }

  const adjustSide: 'left' | 'right' = leftWinRate > targetWinRate ? 'left' : 'right';
  const deck = adjustSide === 'left' ? leftDeck : rightDeck;
  const weaken = leftWinRate > targetWinRate;
  const deviation = Math.abs(leftWinRate - targetWinRate);

  const sorted = [...deck].sort((a, b) => (b.attack + b.defense) - (a.attack + a.defense));
  const target = sorted[0] ?? sorted[sorted.length - 1];
  if (!target) return suggestions;

  if (deviation > 25) {
    suggestions.push({
      cardId: target.id,
      deckSide: adjustSide,
      field: 'cost',
      from: target.cost,
      to: weaken ? Math.min(10, target.cost + 2) : Math.max(1, target.cost - 2),
      reason: `胜率偏差${deviation.toFixed(0)}%，建议${weaken ? '提高' : '降低'}最强卡费用`,
    });
  } else if (deviation > 15) {
    suggestions.push({
      cardId: target.id,
      deckSide: adjustSide,
      field: 'cost',
      from: target.cost,
      to: weaken ? Math.min(10, target.cost + 1) : Math.max(1, target.cost - 1),
      reason: `胜率偏差${deviation.toFixed(0)}%，建议${weaken ? '提高' : '降低'}最强卡费用`,
    });
    suggestions.push({
      cardId: target.id,
      deckSide: adjustSide,
      field: 'attack',
      from: target.attack,
      to: weaken ? Math.max(0, target.attack - 2) : Math.min(20, target.attack + 2),
      reason: `胜率偏差${deviation.toFixed(0)}%，建议${weaken ? '降低' : '提高'}最强卡攻击力`,
    });
  } else {
    suggestions.push({
      cardId: target.id,
      deckSide: adjustSide,
      field: 'attack',
      from: target.attack,
      to: weaken ? Math.max(0, target.attack - 1) : Math.min(20, target.attack + 1),
      reason: `胜率偏差${deviation.toFixed(0)}%，建议${weaken ? '微调降低' : '微调提高'}攻击力`,
    });
    if (target.skillId) {
      suggestions.push({
        cardId: target.id,
        deckSide: adjustSide,
        field: 'skillValue',
        from: target.skillValue,
        to: weaken ? Math.max(1, target.skillValue - 1) : Math.min(10, target.skillValue + 1),
        reason: `建议${weaken ? '降低' : '提高'}技能数值参数`,
      });
    }
  }

  return suggestions;
}
