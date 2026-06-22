import type { GameState, Hero, Position, PlayerId } from '../types';
import {
  GRID_SIZE,
  getDistance,
  isAdjacent,
  isStraightLine,
  canUseSkill,
  canMoveTo,
  getReachableCells,
  findPathBFS,
} from './gameEngine';

export interface AIAction {
  type: 'move' | 'attack' | 'skill' | 'end_turn';
  target?: Position;
  skillId?: string;
}

function getOtherHeroPosition(
  state: GameState,
  currentId: PlayerId
): Position {
  const otherId = currentId === 'player' ? 'ai' : 'player';
  return state.heroes[otherId].position;
}

function getOtherHero(state: GameState, currentId: PlayerId): Hero {
  const otherId = currentId === 'player' ? 'ai' : 'player';
  return state.heroes[otherId];
}

function findBestMoveTowards(
  aiHero: Hero,
  target: Position,
  obstacles: Position[]
): Position | null {
  const reachable = getReachableCells(aiHero.position, obstacles, aiHero.moveRange);
  if (reachable.length === 0) return null;

  let bestPos: Position | null = null;
  let bestDist = Infinity;

  for (const pos of reachable) {
    const dist = getDistance(pos, target);
    if (dist < bestDist) {
      bestDist = dist;
      bestPos = pos;
    }
  }

  return bestPos;
}

function canReachPositionForAttack(
  state: GameState,
  aiHero: Hero,
  targetPos: Position
): Position | null {
  const adjacentPositions: Position[] = [
    { x: targetPos.x, y: targetPos.y - 1 },
    { x: targetPos.x, y: targetPos.y + 1 },
    { x: targetPos.x - 1, y: targetPos.y },
    { x: targetPos.x + 1, y: targetPos.y },
  ];

  const obstacles = [state.heroes.player.position];
  let best: { pos: Position; dist: number } | null = null;

  for (const adj of adjacentPositions) {
    if (adj.x < 0 || adj.x >= GRID_SIZE || adj.y < 0 || adj.y >= GRID_SIZE) continue;
    if (adj.x === aiHero.position.x && adj.y === aiHero.position.y) {
      return { x: aiHero.position.x, y: aiHero.position.y };
    }
    const path = findPathBFS(aiHero.position, adj, obstacles, aiHero.moveRange);
    if (path) {
      const dist = getDistance(aiHero.position, adj);
      if (!best || dist < best.dist) {
        best = { pos: adj, dist };
      }
    }
  }

  return best ? best.pos : null;
}

export function getAIAction(state: GameState): AIAction {
  const aiHero = state.heroes.ai;
  const playerHero = getOtherHero(state, 'ai');
  const obstacles = [playerHero.position];

  if (aiHero.stunned > 0) {
    return { type: 'end_turn' };
  }

  if (!aiHero.hasActed) {
    const controlSkill = aiHero.skills.find((s) => s.type === 'control');
    if (controlSkill && controlSkill.currentCooldown === 0) {
      const check = canUseSkill(aiHero, playerHero, controlSkill.id);
      if (check.valid) {
        return { type: 'skill', skillId: controlSkill.id, target: playerHero.position };
      }
    }

    const damageSkill = aiHero.skills.find((s) => s.type === 'damage');
    if (damageSkill && damageSkill.currentCooldown === 0) {
      const dist = getDistance(aiHero.position, playerHero.position);
      if (dist <= damageSkill.range && isStraightLine(aiHero.position, playerHero.position)) {
        return { type: 'skill', skillId: damageSkill.id, target: playerHero.position };
      }
    }

    if (isAdjacent(aiHero.position, playerHero.position)) {
      return { type: 'attack', target: playerHero.position };
    }
  }

  if (!aiHero.hasMoved) {
    if (!aiHero.hasActed) {
      const attackPos = canReachPositionForAttack(state, aiHero, playerHero.position);
      if (attackPos && !(attackPos.x === aiHero.position.x && attackPos.y === aiHero.position.y)) {
        if (canMoveTo(aiHero, attackPos, playerHero.position)) {
          return { type: 'move', target: attackPos };
        }
      }
    }

    const bestMove = findBestMoveTowards(aiHero, playerHero.position, obstacles);
    if (bestMove) {
      return { type: 'move', target: bestMove };
    }
  }

  return { type: 'end_turn' };
}
