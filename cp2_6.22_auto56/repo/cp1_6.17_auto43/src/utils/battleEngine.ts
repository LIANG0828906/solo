import { BattleState, Card, BattleAction, BattleStrategy } from '../stores/gameStore';

export interface TurnResult {
  newState: BattleState;
  actions: BattleAction[];
  turnEnded: boolean;
  battleEnded: boolean;
  winner: 'player' | 'enemy' | null;
}

export const computeDamage = (
  attacker: Card,
  defender: Card,
  strategy: BattleStrategy,
  attackIndex: number
): number => {
  let baseDamage = Math.max(1, attacker.attack - defender.defense * 0.5);

  const strategyMultiplier =
    attacker.type === 'attack'
      ? strategy === 'aggressive' ? 1.3 : strategy === 'defensive' ? 0.9 : 1.0
      : attacker.type === 'defense'
      ? strategy === 'defensive' ? 1.3 : strategy === 'aggressive' ? 0.9 : 1.0
      : strategy === 'energy' ? 1.3 : strategy === 'aggressive' ? 1.1 : 0.95;

  baseDamage *= strategyMultiplier;

  if (attackIndex === 3) baseDamage *= 1.2;

  const variance = 0.9 + Math.random() * 0.2;
  baseDamage *= variance;

  return Math.round(baseDamage);
};

export const pickActiveCard = (
  cards: Card[],
  strategy: BattleStrategy
): Card | null => {
  const alive = cards.filter((c) => c.hp > 0);
  if (alive.length === 0) return null;

  const typePriority =
    strategy === 'aggressive'
      ? ['attack', 'energy', 'defense']
      : strategy === 'defensive'
      ? ['defense', 'energy', 'attack']
      : ['energy', 'attack', 'defense'];

  for (const type of typePriority) {
    const match = alive.find((c) => c.type === type);
    if (match) return match;
  }
  return alive[0];
};

export const checkBattleEnd = (
  playerCards: Card[],
  enemyCards: Card[]
): 'player' | 'enemy' | null => {
  const playerAlive = playerCards.some((c) => c.hp > 0);
  const enemyAlive = enemyCards.some((c) => c.hp > 0);
  if (!enemyAlive && playerAlive) return 'player';
  if (!playerAlive && enemyAlive) return 'enemy';
  if (!playerAlive && !enemyAlive) return 'player';
  return null;
};

export const processAttackSequence = (
  state: BattleState
): { actions: BattleAction[]; updatedPlayerCards: Card[]; updatedEnemyCards: Card[] } => {
  const actions: BattleAction[] = [];
  const playerCards = state.playerCards.map((c) => ({ ...c }));
  const enemyCards = state.enemyCards.map((c) => ({ ...c }));

  const playerCard = pickActiveCard(playerCards, state.strategy);
  const enemyCard = pickActiveCard(
    enemyCards,
    state.strategy === 'aggressive' ? 'defensive' : state.strategy === 'defensive' ? 'aggressive' : 'energy'
  );

  if (!playerCard || !enemyCard) {
    return { actions, updatedPlayerCards: playerCards, updatedEnemyCards: enemyCards };
  }

  for (let i = 1; i <= 3; i++) {
    if (enemyCard.hp <= 0 || playerCard.hp <= 0) break;

    const playerDamage = computeDamage(playerCard, enemyCard, state.strategy, i);
    enemyCard.hp = Math.max(0, enemyCard.hp - playerDamage);
    actions.push({
      turn: state.currentTurn + 1,
      attacker: 'player',
      attackIndex: i,
      damage: playerDamage,
      defenderHpAfter: enemyCard.hp,
      timestamp: Date.now() + i * 100,
    });

    if (enemyCard.hp <= 0) break;
  }

  for (let i = 1; i <= 3; i++) {
    if (playerCard.hp <= 0 || enemyCard.hp <= 0) break;

    const enemyStrategy =
      state.strategy === 'aggressive' ? 'defensive' : state.strategy === 'defensive' ? 'aggressive' : 'energy';
    const enemyDamage = computeDamage(enemyCard, playerCard, enemyStrategy, i);
    playerCard.hp = Math.max(0, playerCard.hp - enemyDamage);
    actions.push({
      turn: state.currentTurn + 1,
      attacker: 'enemy',
      attackIndex: i,
      damage: enemyDamage,
      defenderHpAfter: playerCard.hp,
      timestamp: Date.now() + 1000 + i * 100,
    });

    if (playerCard.hp <= 0) break;
  }

  return { actions, updatedPlayerCards: playerCards, updatedEnemyCards: enemyCards };
};

export const runBattleTurn = (state: BattleState): TurnResult => {
  const { actions, updatedPlayerCards, updatedEnemyCards } = processAttackSequence(state);
  const winner = checkBattleEnd(updatedPlayerCards, updatedEnemyCards);
  const battleEnded = winner !== null;

  const activePlayerCard = pickActiveCard(updatedPlayerCards, state.strategy);
  const activeEnemyCard = pickActiveCard(
    updatedEnemyCards,
    state.strategy === 'aggressive' ? 'defensive' : state.strategy === 'defensive' ? 'aggressive' : 'energy'
  );

  const newState: BattleState = {
    ...state,
    currentTurn: state.currentTurn + 1,
    playerCards: updatedPlayerCards,
    enemyCards: updatedEnemyCards,
    activePlayerCard,
    activeEnemyCard,
    battleLog: [...state.battleLog, ...actions],
    winner,
    phase: battleEnded ? 'finished' : 'fighting',
  };

  return {
    newState,
    actions,
    turnEnded: true,
    battleEnded,
    winner,
  };
};
