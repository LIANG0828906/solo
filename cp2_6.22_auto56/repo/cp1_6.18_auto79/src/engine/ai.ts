import type { Unit, HexCoord } from '../types';
import { hexDistance, getMoveRange, getAttackRange, GRID_COLS, GRID_ROWS } from './grid';

export interface AIAction {
  type: 'move' | 'attack' | 'end';
  unitId: string;
  targetCoord?: HexCoord;
  targetUnitId?: string;
}

export function evaluateThreat(target: Unit, attacker: Unit): number {
  const distance = hexDistance(
    { col: attacker.col, row: attacker.row },
    { col: target.col, row: target.row }
  );

  let score = 0;

  score += (target.maxHp - target.hp) * 10;

  score += target.attack * 5;

  if (target.hp <= attacker.attack) {
    score += 50;
  }

  score -= distance * 2;

  return Math.max(0, score);
}

export function evaluatePosition(unit: Unit, col: number, row: number, enemies: Unit[]): number {
  let score = 0;

  let minDistance = Infinity;
  let nearestEnemy: Unit | null = null;

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const dist = hexDistance({ col, row }, { col: enemy.col, row: enemy.row });
    if (dist < minDistance) {
      minDistance = dist;
      nearestEnemy = enemy;
    }
  }

  if (nearestEnemy) {
    if (minDistance <= unit.range) {
      score += 30;
    }
    score += (10 - minDistance) * 3;
  }

  score += col * 0.5;

  if (row === 0 || row === GRID_ROWS - 1) {
    score -= 2;
  }

  return score;
}

export function findBestMove(unit: Unit, enemies: Unit[], allUnits: Unit[], randomFactor: number): HexCoord | null {
  const moveRange = getMoveRange(unit, allUnits);
  if (moveRange.length === 0) return null;

  const scoredPositions = moveRange.map(coord => {
    const baseScore = evaluatePosition(unit, coord.col, coord.row, enemies);
    const randomBonus = (Math.random() - 0.5) * randomFactor;
    return { coord, score: baseScore + randomBonus };
  });

  scoredPositions.sort((a, b) => b.score - a.score);

  return scoredPositions[0]?.coord || null;
}

export function findBestTarget(unit: Unit, enemies: Unit[], randomFactor: number): Unit | null {
  const attackable = getAttackRange(unit, enemies);
  if (attackable.length === 0) return null;

  const scoredTargets = attackable.map(enemy => {
    const baseScore = evaluateThreat(enemy, unit);
    const randomBonus = (Math.random() - 0.5) * randomFactor;
    return { enemy, score: baseScore + randomBonus };
  });

  scoredTargets.sort((a, b) => b.score - a.score);

  return scoredTargets[0]?.enemy || null;
}

export function decideAction(unit: Unit, allUnits: Unit[], randomFactor: number): AIAction {
  const enemies = allUnits.filter(u => u.team !== unit.team && u.hp > 0);

  const currentTarget = findBestTarget(unit, allUnits, randomFactor);
  if (currentTarget && !unit.hasAttacked) {
    return {
      type: 'attack',
      unitId: unit.id,
      targetUnitId: currentTarget.id,
    };
  }

  if (!unit.hasMoved) {
    const bestMove = findBestMove(unit, enemies, allUnits, randomFactor);
    if (bestMove) {
      return {
        type: 'move',
        unitId: unit.id,
        targetCoord: bestMove,
      };
    }
  }

  return { type: 'end', unitId: unit.id };
}

export function getAIActionQueue(units: Unit[], randomFactor: number): AIAction[] {
  const aiUnits = units.filter(u => u.team === 'ai' && u.hp > 0 && (!u.hasMoved || !u.hasAttacked));

  const sortedUnits = [...aiUnits].sort((a, b) => {
    const aEnemiesNearby = units.filter(u =>
      u.team === 'player' && u.hp > 0 &&
      hexDistance({ col: a.col, row: a.row }, { col: u.col, row: u.row }) <= a.range + 1
    ).length;
    const bEnemiesNearby = units.filter(u =>
      u.team === 'player' && u.hp > 0 &&
      hexDistance({ col: b.col, row: b.row }, { col: u.col, row: u.row }) <= b.range + 1
    ).length;
    return bEnemiesNearby - aEnemiesNearby || b.attack - a.attack;
  });

  const actions: AIAction[] = [];

  for (const unit of sortedUnits) {
    if (!unit.hasAttacked) {
      const target = findBestTarget(unit, units, randomFactor);
      if (target) {
        actions.push({ type: 'attack', unitId: unit.id, targetUnitId: target.id });
        continue;
      }
    }

    if (!unit.hasMoved) {
      const bestMove = findBestMove(unit, units.filter(u => u.team === 'player'), units, randomFactor);
      if (bestMove) {
        actions.push({ type: 'move', unitId: unit.id, targetCoord: bestMove });

        const movedUnit = { ...unit, col: bestMove.col, row: bestMove.row, hasMoved: true };
        const target = findBestTarget(movedUnit, units, randomFactor);
        if (target && !unit.hasAttacked) {
          actions.push({ type: 'attack', unitId: unit.id, targetUnitId: target.id });
        }
      }
    }
  }

  return actions;
}
