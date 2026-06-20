import { GameState, BoardCard, Position, Card, SkillType } from '../card/CardTypes';
import {
  playCard,
  attack,
  endTurn,
} from '../battle/BattleEngine';
import { getEmptyPositions, hasTauntEnemies, getTauntEnemies } from '../card/CardDeck';

export interface AIAction {
  type: 'play_card' | 'attack' | 'end_turn';
  cardIndex?: number;
  position?: Position;
  attackerId?: string;
  targetId?: string | null;
}

export function makeAIDecision(state: GameState): AIAction | null {
  const hand = state.ai.hand;
  const mana = state.ai.mana;

  const playableCards = hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.cost <= mana)
    .sort((a, b) => b.card.cost - a.card.cost);

  const emptyPositions = getEmptyPositions(
    [...state.player.board, ...state.ai.board],
    'ai'
  );

  if (playableCards.length > 0 && emptyPositions.length > 0) {
    for (const { card, index } of playableCards) {
      const position = selectBestPosition(state, card);
      if (position) {
        return {
          type: 'play_card',
          cardIndex: index,
          position,
        };
      }
    }
  }

  const attackResult = selectAttackTarget(state);
  if (attackResult) {
    return {
      type: 'attack',
      attackerId: attackResult.attackerId,
      targetId: attackResult.targetId,
    };
  }

  return { type: 'end_turn' };
}

function selectBestPosition(state: GameState, card: Card): Position | null {
  const emptyPositions = getEmptyPositions(
    [...state.player.board, ...state.ai.board],
    'ai'
  );

  if (emptyPositions.length === 0) return null;

  if (state.player.board.length > 0) {
    const lowestDefEnemy = [...state.player.board].sort(
      (a, b) => a.currentDefense - b.currentDefense
    )[0];

    const col = lowestDefEnemy.position.col;
    const validPositions = emptyPositions.filter((p) => p.col === col);
    if (validPositions.length > 0) {
      return validPositions[validPositions.length - 1];
    }
  }

  return emptyPositions[Math.floor(emptyPositions.length / 2)];
}

function selectAttackTarget(
  state: GameState
): { attackerId: string; targetId: string | null } | null {
  const aiBoard = state.ai.board;
  const playerBoard = state.player.board;

  const attackers = aiBoard.filter(
    (card) => card.canAttack && !card.hasAttacked && !card.isFrozen
  );

  if (attackers.length === 0) return null;

  if (hasTauntEnemies([...aiBoard, ...playerBoard], 'ai')) {
    const tauntEnemies = getTauntEnemies(
      [...aiBoard, ...playerBoard],
      'ai'
    );

    for (const attacker of attackers) {
      const target = findLowestHealthTarget(tauntEnemies);
      if (target) {
        return {
          attackerId: attacker.instanceId,
          targetId: target.instanceId,
        };
      }
    }
  }

  if (playerBoard.length === 0) {
    const attacker = attackers.sort(
      (a, b) => b.currentAttack - a.currentAttack
    )[0];
    return {
      attackerId: attacker.instanceId,
      targetId: null,
    };
  }

  const sortedEnemies = [...playerBoard].sort(
    (a, b) => a.currentDefense - b.currentDefense
  );

  for (const attacker of attackers.sort((a, b) => b.currentAttack - a.currentAttack)) {
    for (const target of sortedEnemies) {
      if (attacker.currentAttack >= target.currentDefense) {
        return {
          attackerId: attacker.instanceId,
          targetId: target.instanceId,
        };
      }
    }
  }

  for (const attacker of attackers.sort((a, b) => b.currentAttack - a.currentAttack)) {
    const target = findLowestHealthTarget(playerBoard);
    if (target) {
      return {
        attackerId: attacker.instanceId,
        targetId: target.instanceId,
      };
    }
  }

  return null;
}

function findLowestHealthTarget(enemies: BoardCard[]): BoardCard | null {
  if (enemies.length === 0) return null;
  return [...enemies].sort((a, b) => a.currentDefense - b.currentDefense)[0];
}

export function executeAITurn(state: GameState): {
  states: GameState[];
  finalState: GameState;
  actions: AIAction[];
} {
  const states: GameState[] = [];
  const actions: AIAction[] = [];
  let currentState = state;
  let maxIterations = 20;
  let iterations = 0;
  let failedActions = 0;

  while (iterations < maxIterations && failedActions < 3) {
    iterations++;
    const action = makeAIDecision(currentState);

    if (!action) break;

    if (action.type === 'end_turn') {
      actions.push(action);
      currentState = endTurn(currentState);
      states.push(currentState);
      break;
    }

    if (action.type === 'play_card' && action.cardIndex !== undefined && action.position) {
      const result = playCard(
        currentState,
        action.cardIndex,
        action.position,
        'ai'
      );
      if (result.success) {
        actions.push(action);
        currentState = result.state;
        states.push(currentState);
        failedActions = 0;
        continue;
      }
      failedActions++;
      continue;
    }

    if (action.type === 'attack' && action.attackerId) {
      const result = attack(
        currentState,
        action.attackerId,
        action.targetId || null,
        'ai'
      );
      if (result.success) {
        actions.push(action);
        currentState = result.state;
        states.push(currentState);
        failedActions = 0;
        continue;
      }
      failedActions++;
      continue;
    }

    break;
  }

  return { states, finalState: currentState, actions };
}

export function evaluateBoardState(state: GameState, player: 'player' | 'ai'): number {
  const playerState = player === 'player' ? state.player : state.ai;
  const enemyState = player === 'player' ? state.ai : state.player;

  let score = 0;

  score += playerState.health * 2;
  score -= enemyState.health * 2;

  for (const card of playerState.board) {
    score += card.currentAttack * 3;
    score += card.currentDefense * 2;
    if (card.hasTaunt) score += 2;
    if (card.hasCharge) score += 1;
    if (card.isFrozen) score -= 2;
    if (card.skillType === SkillType.PASSIVE_GLOBAL) score += 3;
  }

  for (const card of enemyState.board) {
    score -= card.currentAttack * 3;
    score -= card.currentDefense * 2;
  }

  score += playerState.hand.length;
  score += playerState.mana;
  score += playerState.deck.length * 0.5;

  return score;
}
