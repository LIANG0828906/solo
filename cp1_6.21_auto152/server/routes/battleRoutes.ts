import { Router, type Request, type Response } from 'express';
import { v4 } from 'uuid';
import { rooms } from '../index.js';
import type {
  Card,
  CardType,
  Enemy,
  EnemyType,
  BattleState,
  BattleActionRequest,
  BattleActionResponse,
  BattleResultResponse,
  RoomState,
} from '../../shared/types.js';

const router = Router();

const ENEMY_DEFS: Record<EnemyType, { name: string; hp: number; attack: number }> = {
  goblin: { name: '哥布林', hp: 50, attack: 8 },
  skeleton: { name: '骷髅兵', hp: 40, attack: 12 },
  darkMage: { name: '暗黑法师', hp: 30, attack: 15 },
};

const ENEMY_TYPES: EnemyType[] = ['goblin', 'skeleton', 'darkMage'];

function createCard(type: CardType, value: number): Card {
  const id = v4();
  const defs: Record<CardType, { name: string; description: string }> = {
    attack: { name: `打击${value}`, description: `造成 ${value} 点伤害` },
    defense: { name: `防御${value}`, description: `获得 ${value} 点护盾` },
    skill: { name: `抽牌${value}`, description: `抽 ${value} 张牌` },
  };
  return { id, name: defs[type].name, type, value, description: defs[type].description };
}

function createStartingDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < 6; i++) deck.push(createCard('attack', 10));
  for (let i = 0; i < 4; i++) deck.push(createCard('defense', 15));
  for (let i = 0; i < 2; i++) deck.push(createCard('skill', 2));
  return shuffle(deck);
}

function generateEnemies(): Enemy[] {
  const count = Math.floor(Math.random() * 4) + 1;
  const enemies: Enemy[] = [];
  for (let i = 0; i < count; i++) {
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const def = ENEMY_DEFS[type];
    enemies.push({
      id: v4(),
      name: def.name,
      type,
      hp: def.hp,
      maxHP: def.hp,
      shield: 0,
      attack: def.attack,
      specialTimer: type === 'darkMage' ? 3 : undefined,
    });
  }
  return enemies;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCards(state: BattleState, count: number): void {
  for (let i = 0; i < count; i++) {
    if (state.hand.length >= 10) break;
    if (state.deck.length === 0) break;
    state.hand.push(state.deck.pop()!);
  }
  while (state.hand.length > 10) {
    state.hand.pop();
  }
}

export function initBattleState(): BattleState {
  const deck = createStartingDeck();
  const hand = deck.splice(0, 5);
  return {
    round: 1,
    playerHP: 100,
    playerMaxHP: 100,
    playerShield: 0,
    hand,
    deck,
    enemies: generateEnemies(),
    phase: 'playerTurn',
    stats: { rounds: 1, totalDamage: 0, totalShield: 0, cardsDrawn: 5 },
  };
}

function processPlayCard(state: BattleState, action: BattleActionRequest): BattleActionResponse {
  const { cardIndex, targetEnemyIndex } = action.action;
  if (cardIndex === undefined || cardIndex < 0 || cardIndex >= state.hand.length) {
    return { success: false, battleState: state };
  }

  const card = state.hand[cardIndex];
  state.hand.splice(cardIndex, 1);

  let damageDealt = 0;
  let shieldGained = 0;
  let cardsDrawn = 0;

  if (card.type === 'attack') {
    const targetIdx = targetEnemyIndex ?? 0;
    if (targetIdx < 0 || targetIdx >= state.enemies.length) {
      state.hand.splice(cardIndex, 0, card);
      return { success: false, battleState: state };
    }
    const enemy = state.enemies[targetIdx];
    const absorbed = Math.min(enemy.shield, card.value);
    enemy.shield -= absorbed;
    const remaining = card.value - absorbed;
    enemy.hp -= remaining;
    damageDealt = card.value;
    state.stats.totalDamage += card.value;
    if (enemy.hp <= 0) {
      state.enemies.splice(targetIdx, 1);
    }
  } else if (card.type === 'defense') {
    state.playerShield += card.value;
    shieldGained = card.value;
    state.stats.totalShield += card.value;
  } else if (card.type === 'skill') {
    const drawCount = card.value;
    drawCards(state, drawCount);
    cardsDrawn = drawCount;
    state.stats.cardsDrawn += drawCount;
  }

  if (state.enemies.length === 0) {
    state.phase = 'victory';
  }

  return { success: true, battleState: state, damageDealt, shieldGained, cardsDrawn };
}

function processEndTurn(state: BattleState): BattleActionResponse {
  state.phase = 'enemyTurn';

  for (const enemy of state.enemies) {
    let damage = enemy.attack;

    if (enemy.type === 'darkMage' && enemy.specialTimer !== undefined) {
      enemy.specialTimer--;
      if (enemy.specialTimer <= 0) {
        damage = Math.floor(enemy.attack * 1.8);
        enemy.specialTimer = 3;
      }
    }

    const absorbed = Math.min(state.playerShield, damage);
    state.playerShield -= absorbed;
    const remaining = damage - absorbed;
    state.playerHP -= remaining;

    if (state.playerHP <= 0) {
      state.playerHP = 0;
      state.phase = 'defeat';
      return { success: true, battleState: state };
    }
  }

  state.round++;
  state.stats.rounds = state.round;
  state.playerShield = 0;
  state.phase = 'playerTurn';

  if (state.deck.length < 2) {
    const recycled = shuffle(state.hand);
    state.deck = recycled.concat(state.deck);
    state.hand = [];
  }

  drawCards(state, 2);
  state.stats.cardsDrawn += Math.min(2, 10 - state.hand.length + 2);

  if (state.round % 3 === 0 && state.enemies.length > 0) {
    const newEnemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const def = ENEMY_DEFS[newEnemyType];
    state.enemies.push({
      id: v4(),
      name: def.name,
      type: newEnemyType,
      hp: def.hp,
      maxHP: def.hp,
      shield: 0,
      attack: def.attack,
      specialTimer: newEnemyType === 'darkMage' ? 3 : undefined,
    });
  }

  return { success: true, battleState: state };
}

router.post('/action', (req: Request, res: Response): void => {
  const actionReq: BattleActionRequest = req.body;

  if (!actionReq.playerId || !actionReq.action) {
    res.status(400).json({ success: false, error: 'Invalid request' });
    return;
  }

  const room = actionReq.roomId ? rooms.get(actionReq.roomId) : null;
  let battleState: BattleState;

  if (room && room.battleState) {
    battleState = room.battleState;
  } else {
    battleState = initBattleState();
  }

  if (battleState.phase !== 'playerTurn') {
    res.status(400).json({ success: false, error: 'Not player turn' });
    return;
  }

  let result: BattleActionResponse;

  if (actionReq.action.type === 'playCard') {
    result = processPlayCard(battleState, actionReq);
  } else if (actionReq.action.type === 'endTurn') {
    result = processEndTurn(battleState);
  } else {
    res.status(400).json({ success: false, error: 'Unknown action type' });
    return;
  }

  if (room) {
    room.battleState = result.battleState;
  }

  res.json(result);
});

router.get('/result/:roomId', (req: Request, res: Response): void => {
  const room = rooms.get(req.params.roomId);
  if (!room || !room.battleState) {
    res.status(404).json({ success: false, error: 'Room or battle not found' });
    return;
  }

  const state = room.battleState;
  const victory = state.phase === 'victory';
  const result: BattleResultResponse = {
    victory,
    stats: state.stats,
  };

  res.json(result);
});

export default router;
