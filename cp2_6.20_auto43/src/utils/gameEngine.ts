import { v4 as uuidv4 } from 'uuid';
import type { Card, BoardCard, GameState, TurnLog, ActionLog, BattleRecord } from '../types';

export const PRESET_CARDS: Card[] = [
  { id: 'c1', name: '新兵', cost: 1, attack: 1, health: 2, skill: '普通近战单位', rarity: 'common' },
  { id: 'c2', name: '精灵弓手', cost: 1, attack: 2, health: 1, skill: '优先攻击敌方随从', rarity: 'common' },
  { id: 'c3', name: '持盾卫士', cost: 2, attack: 1, health: 4, skill: '嘲讽：必须优先被攻击', rarity: 'common' },
  { id: 'c4', name: '火焰法师', cost: 2, attack: 2, health: 3, skill: '入场时对敌方英雄造成1点伤害', rarity: 'common' },
  { id: 'c5', name: '剑士', cost: 3, attack: 3, health: 3, skill: '标准作战单位', rarity: 'common' },
  { id: 'c6', name: '治疗牧师', cost: 3, attack: 2, health: 3, skill: '入场回复己方英雄2点HP', rarity: 'rare' },
  { id: 'c7', name: '狂战士', cost: 3, attack: 4, health: 2, skill: '高攻低防', rarity: 'common' },
  { id: 'c8', name: '暗影刺客', cost: 4, attack: 5, health: 2, skill: '入场可直接攻击英雄', rarity: 'rare' },
  { id: 'c9', name: '重装骑士', cost: 4, attack: 3, health: 5, skill: '嘲讽', rarity: 'rare' },
  { id: 'c10', name: '雷鸣战士', cost: 4, attack: 4, health: 4, skill: '均衡型强力单位', rarity: 'rare' },
  { id: 'c11', name: '龙鹰', cost: 5, attack: 5, health: 4, skill: '出场对随机敌方随从造成2点伤害', rarity: 'epic' },
  { id: 'c12', name: '圣光守护', cost: 5, attack: 4, health: 6, skill: '嘲讽，回合结束回复1HP', rarity: 'epic' },
  { id: 'c13', name: '寒冰法师', cost: 5, attack: 4, health: 4, skill: '冻结攻击力最高的敌方随从1回合', rarity: 'epic' },
  { id: 'c14', name: '战争巨人', cost: 6, attack: 6, health: 7, skill: '高费强力单位', rarity: 'epic' },
  { id: 'c15', name: '远古龙', cost: 7, attack: 7, health: 8, skill: '入场对全体敌方随从造成2点伤害', rarity: 'legendary' },
  { id: 'c16', name: '圣光龙', cost: 8, attack: 8, health: 8, skill: '入场恢复己方英雄5HP并抽1张牌', rarity: 'legendary' },
  { id: 'c17', name: '泰坦', cost: 9, attack: 9, health: 9, skill: '毁天灭地', rarity: 'legendary' },
  { id: 'c18', name: '创世之神', cost: 10, attack: 10, health: 10, skill: '入场消灭所有敌方随从', rarity: 'legendary' },
  { id: 'c19', name: '小型石像鬼', cost: 1, attack: 1, health: 1, skill: '敏捷', rarity: 'common' },
  { id: 'c20', name: '嗜血兽人', cost: 2, attack: 3, health: 2, skill: '入场获得+1攻击力', rarity: 'common' },
  { id: 'c21', name: '秘术师', cost: 2, attack: 1, health: 2, skill: '入场抽1张牌', rarity: 'rare' },
  { id: 'c22', name: '赏金猎人', cost: 3, attack: 2, health: 4, skill: '优先攻击英雄', rarity: 'common' },
  { id: 'c23', name: '圣骑士', cost: 5, attack: 5, health: 5, skill: '圣盾：免疫首次伤害', rarity: 'epic' },
  { id: 'c24', name: '元素领主', cost: 6, attack: 5, health: 6, skill: '入场对敌方英雄造成3点伤害', rarity: 'epic' },
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cardToBoardCard(card: Card, canAttack = false): BoardCard {
  return {
    ...card,
    instanceId: uuidv4(),
    currentHealth: card.health,
    canAttack,
    hasAttacked: false,
  };
}

export function createActionLog(
  type: ActionLog['type'],
  actor: 'player' | 'enemy',
  extra: Partial<ActionLog> = {}
): ActionLog {
  return {
    type,
    actor,
    timestamp: Date.now(),
    ...extra,
  };
}

export function drawCards(deck: Card[], count: number): { drawn: Card[]; remaining: Card[] } {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
}

export function initBattleState(playerDeck: Card[], enemyDeck: Card[]): GameState {
  const shuffledPlayer = shuffle([...playerDeck]);
  const shuffledEnemy = shuffle([...enemyDeck]);
  const { drawn: playerHand, remaining: playerRemaining } = drawCards(shuffledPlayer, 3);
  const { drawn: enemyHand, remaining: enemyRemaining } = drawCards(shuffledEnemy, 3);

  return {
    playerHp: 30,
    enemyHp: 30,
    playerMaxHp: 30,
    enemyMaxHp: 30,
    playerMana: 1,
    playerMaxMana: 1,
    enemyMana: 1,
    enemyMaxMana: 1,
    playerHand,
    enemyHand,
    playerDeck: playerRemaining,
    enemyDeck: enemyRemaining,
    playerBoard: [],
    enemyBoard: [],
    currentTurn: 1,
    phase: 'playerTurn',
    result: null,
    currentTurnLog: {
      turnNumber: 1,
      actions: [],
      playerHpAfter: 30,
      enemyHpAfter: 30,
      playerManaAfter: 1,
      enemyManaAfter: 1,
    },
    allLogs: [],
    battleStartTime: Date.now(),
  };
}

export function canPlayCard(state: GameState, card: Card, side: 'player' | 'enemy'): boolean {
  const mana = side === 'player' ? state.playerMana : state.enemyMana;
  const board = side === 'player' ? state.playerBoard : state.enemyBoard;
  return card.cost <= mana && board.length < 7;
}

export function generateEnemyDeck(): Card[] {
  const deck: Card[] = [];
  while (deck.length < 30) {
    const card = PRESET_CARDS[Math.floor(Math.random() * PRESET_CARDS.length)];
    const count = deck.filter((c) => c.id === card.id).length;
    if (count < 2 || (card.rarity === 'legendary' && count < 1)) {
      deck.push({ ...card });
    }
  }
  return deck;
}

export function playCard(state: GameState, cardIndex: number, side: 'player' | 'enemy'): GameState {
  const hand = side === 'player' ? [...state.playerHand] : [...state.enemyHand];
  const board = side === 'player' ? [...state.playerBoard] : [...state.enemyBoard];
  const card = hand[cardIndex];
  if (!card) return state;
  if (!canPlayCard(state, card, side)) return state;

  hand.splice(cardIndex, 1);
  const boardCard = cardToBoardCard(card, false);
  board.push(boardCard);

  let newState: GameState = {
    ...state,
    playerBoard: side === 'player' ? board : state.playerBoard,
    enemyBoard: side === 'enemy' ? board : state.enemyBoard,
    playerHand: side === 'player' ? hand : state.playerHand,
    enemyHand: side === 'enemy' ? hand : state.enemyHand,
    playerMana: side === 'player' ? state.playerMana - card.cost : state.playerMana,
    enemyMana: side === 'enemy' ? state.enemyMana - card.cost : state.enemyMana,
  };

  newState = applyBattlecry(newState, boardCard, side);

  const action = createActionLog('play', side, { cardName: card.name });
  newState.currentTurnLog = {
    ...newState.currentTurnLog,
    actions: [...newState.currentTurnLog.actions, action],
    playerHpAfter: newState.playerHp,
    enemyHpAfter: newState.enemyHp,
    playerManaAfter: newState.playerMana,
    enemyManaAfter: newState.enemyMana,
  };

  return checkGameEnd(newState);
}

export function applyBattlecry(state: GameState, card: BoardCard, side: 'player' | 'enemy'): GameState {
  let s = { ...state };
  const enemyBoardSide = side === 'player' ? 'enemyBoard' : 'playerBoard';
  const hpKey = side === 'player' ? 'playerHp' : 'enemyHp';
  const enemyHpKey = side === 'player' ? 'enemyHp' : 'playerHp';
  const handSide = side === 'player' ? 'playerHand' : 'enemyHand';
  const deckSide = side === 'player' ? 'playerDeck' : 'enemyDeck';

  switch (card.id) {
    case 'c4':
      s[enemyHpKey] = Math.max(0, s[enemyHpKey] - 1);
      break;
    case 'c6':
      s[hpKey] = Math.min(s[hpKey] + 2, 30);
      break;
    case 'c11': {
      const targets = s[enemyBoardSide];
      if (targets.length > 0) {
        const idx = Math.floor(Math.random() * targets.length);
        const newBoard = [...targets];
        newBoard[idx] = { ...newBoard[idx], currentHealth: newBoard[idx].currentHealth - 2 };
        s[enemyBoardSide] = newBoard.filter((c) => c.currentHealth > 0);
      }
      break;
    }
    case 'c15': {
      s[enemyBoardSide] = s[enemyBoardSide]
        .map((c) => ({ ...c, currentHealth: c.currentHealth - 2 }))
        .filter((c) => c.currentHealth > 0);
      break;
    }
    case 'c16': {
      s[hpKey] = Math.min(s[hpKey] + 5, 30);
      const { drawn, remaining } = drawCards(s[deckSide], 1);
      s[handSide] = [...s[handSide], ...drawn];
      s[deckSide] = remaining;
      break;
    }
    case 'c18': {
      s[enemyBoardSide] = [];
      break;
    }
    case 'c21': {
      const { drawn, remaining } = drawCards(s[deckSide], 1);
      s[handSide] = [...s[handSide], ...drawn];
      s[deckSide] = remaining;
      break;
    }
    case 'c24':
      s[enemyHpKey] = Math.max(0, s[enemyHpKey] - 3);
      break;
  }
  return s;
}

export function attack(
  state: GameState,
  attackerInstanceId: string,
  target: { type: 'hero' } | { type: 'minion'; instanceId: string },
  side: 'player' | 'enemy'
): GameState {
  const attackerBoard = side === 'player' ? state.playerBoard : state.enemyBoard;
  const defenderBoard = side === 'player' ? state.enemyBoard : state.playerBoard;
  const attacker = attackerBoard.find((c) => c.instanceId === attackerInstanceId);
  if (!attacker || attacker.hasAttacked || !attacker.canAttack) return state;

  let newState = { ...state };

  const attackerHpKey = side === 'player' ? 'playerHp' : 'enemyHp';
  const defenderHpKey = side === 'player' ? 'enemyHp' : 'playerHp';

  if (target.type === 'hero') {
    newState[defenderHpKey] = Math.max(0, newState[defenderHpKey] - attacker.attack);
  } else {
    const defender = defenderBoard.find((c) => c.instanceId === target.instanceId);
    if (!defender) return state;

    const newAttackerBoard = attackerBoard.map((c) =>
      c.instanceId === attackerInstanceId
        ? { ...c, currentHealth: c.currentHealth - defender.attack, hasAttacked: true }
        : c
    );
    const newDefenderBoard = defenderBoard.map((c) =>
      c.instanceId === target.instanceId
        ? { ...c, currentHealth: c.currentHealth - attacker.attack }
        : c
    );

    newState = {
      ...newState,
      [side === 'player' ? 'playerBoard' : 'enemyBoard']: newAttackerBoard.filter(
        (c) => c.currentHealth > 0
      ),
      [side === 'player' ? 'enemyBoard' : 'playerBoard']: newDefenderBoard.filter(
        (c) => c.currentHealth > 0
      ),
    };
  }

  const updatedAttackerBoard = side === 'player' ? newState.playerBoard : newState.enemyBoard;
  newState = {
    ...newState,
    [side === 'player' ? 'playerBoard' : 'enemyBoard']: updatedAttackerBoard.map((c) =>
      c.instanceId === attackerInstanceId ? { ...c, hasAttacked: true } : c
    ),
  };

  const action = createActionLog('attack', side, {
    cardName: attacker.name,
    targetName: target.type === 'hero' ? (side === 'player' ? '敌方英雄' : '玩家英雄') : undefined,
    damage: attacker.attack,
  });
  newState.currentTurnLog = {
    ...newState.currentTurnLog,
    actions: [...newState.currentTurnLog.actions, action],
    playerHpAfter: newState.playerHp,
    enemyHpAfter: newState.enemyHp,
  };

  return checkGameEnd(newState);
}

export function endPlayerTurn(state: GameState): GameState {
  const newAllLogs = [...state.allLogs, state.currentTurnLog];
  const newTurn = state.currentTurn + 1;
  const newEnemyMaxMana = Math.min(10, state.enemyMaxMana + 1);

  const { drawn, remaining } = drawCards(state.enemyDeck, 1);
  const newEnemyHand = [...state.enemyHand, ...drawn].slice(0, 10);

  const resetEnemyBoard = state.enemyBoard.map((c) => ({ ...c, canAttack: true, hasAttacked: false }));

  const ns: GameState = {
    ...state,
    currentTurn: newTurn,
    phase: 'enemyTurn',
    enemyMaxMana: newEnemyMaxMana,
    enemyMana: newEnemyMaxMana,
    enemyHand: newEnemyHand,
    enemyDeck: remaining,
    enemyBoard: resetEnemyBoard,
    allLogs: newAllLogs,
    currentTurnLog: {
      turnNumber: newTurn,
      actions: [],
      playerHpAfter: state.playerHp,
      enemyHpAfter: state.enemyHp,
      playerManaAfter: state.playerMana,
      enemyManaAfter: newEnemyMaxMana,
    },
  };

  return checkGameEnd(ns);
}

export function endEnemyTurn(state: GameState): GameState {
  const newAllLogs = [...state.allLogs, state.currentTurnLog];
  const newTurn = state.currentTurn + 1;
  const newPlayerMaxMana = Math.min(10, state.playerMaxMana + 1);

  const { drawn, remaining } = drawCards(state.playerDeck, 1);
  const newPlayerHand = [...state.playerHand, ...drawn].slice(0, 10);

  const resetPlayerBoard = state.playerBoard.map((c) => ({ ...c, canAttack: true, hasAttacked: false }));

  const ns: GameState = {
    ...state,
    currentTurn: newTurn,
    phase: 'playerTurn',
    playerMaxMana: newPlayerMaxMana,
    playerMana: newPlayerMaxMana,
    playerHand: newPlayerHand,
    playerDeck: remaining,
    playerBoard: resetPlayerBoard,
    allLogs: newAllLogs,
    currentTurnLog: {
      turnNumber: newTurn,
      actions: [],
      playerHpAfter: state.playerHp,
      enemyHpAfter: state.enemyHp,
      playerManaAfter: newPlayerMaxMana,
      enemyManaAfter: state.enemyMana,
    },
  };

  return checkGameEnd(ns);
}

export function checkGameEnd(state: GameState): GameState {
  if (state.enemyHp <= 0 && state.playerHp <= 0) {
    return { ...state, phase: 'ended', result: 'lose' };
  }
  if (state.enemyHp <= 0) {
    return { ...state, phase: 'ended', result: 'win' };
  }
  if (state.playerHp <= 0) {
    return { ...state, phase: 'ended', result: 'lose' };
  }
  return state;
}

export function runEnemyTurn(state: GameState): GameState[] {
  const states: GameState[] = [];
  let s = state;

  let played = true;
  while (played) {
    played = false;
    const playable = s.enemyHand
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card }) => canPlayCard(s, card, 'enemy'))
      .sort((a, b) => b.card.cost - a.card.cost);
    if (playable.length > 0 && s.enemyBoard.length < 7) {
      s = playCard(s, playable[0].index, 'enemy');
      states.push(s);
      played = true;
    }
  }

  const attackers = s.enemyBoard.filter((c) => c.canAttack && !c.hasAttacked);
  for (const atk of attackers) {
    if (s.phase === 'ended') break;
    const tauntMinions = s.playerBoard.filter((c) => c.id === 'c3' || c.id === 'c9' || c.id === 'c12');
    if (tauntMinions.length > 0) {
      const target = tauntMinions[0];
      s = attack(s, atk.instanceId, { type: 'minion', instanceId: target.instanceId }, 'enemy');
    } else if (s.playerBoard.length > 0 && Math.random() < 0.4) {
      const target = s.playerBoard[Math.floor(Math.random() * s.playerBoard.length)];
      s = attack(s, atk.instanceId, { type: 'minion', instanceId: target.instanceId }, 'enemy');
    } else {
      s = attack(s, atk.instanceId, { type: 'hero' }, 'enemy');
    }
    states.push(s);
  }

  return states;
}

export function createBattleRecord(
  state: GameState,
  playerDeckName: string,
  enemyDeckName: string
): BattleRecord {
  const finalLogs = state.result
    ? [...state.allLogs, state.currentTurnLog]
    : [...state.allLogs, state.currentTurnLog];
  return {
    id: uuidv4(),
    playerDeckName,
    enemyDeckName,
    result: state.result || 'lose',
    turns: state.currentTurn,
    duration: Date.now() - state.battleStartTime,
    timestamp: Date.now(),
    logs: finalLogs,
  };
}
