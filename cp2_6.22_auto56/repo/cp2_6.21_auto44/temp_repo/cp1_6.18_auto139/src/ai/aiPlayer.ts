import { GameEngine } from '../engine/gameEngine';
import { HeroUnit, AxialCoord, PlayerType, TerrainType } from '../types';
import { getHexDistance, isAdjacent } from '../map/mapGenerator';

interface ScoredMove {
  unit: HeroUnit;
  target: AxialCoord | null;
  attackTarget: HeroUnit | null;
  score: number;
}

export class AIPlayer {
  private engine: GameEngine;
  private player: PlayerType;

  constructor(engine: GameEngine, player: PlayerType = PlayerType.RED) {
    this.engine = engine;
    this.player = player;
  }

  async takeTurn(): Promise<void> {
    const startTime = Date.now();
    const maxThinkTime = 2000;

    const units = this.engine.getAllUnitsOfPlayer(this.player);
    const availableUnits = units.filter(u => !u.hasActed && u.hp > 0);

    for (const unit of availableUnits) {
      if (Date.now() - startTime > maxThinkTime) break;

      const action = this.evaluateBestAction(unit);
      if (!action) continue;

      if (action.target && (action.target.q !== unit.position.q || action.target.r !== unit.position.r)) {
        this.engine.moveUnit(unit.id, action.target);
        await this.delay(50);
      }

      if (action.attackTarget) {
        this.engine.attackUnit(unit.id, action.attackTarget.id);
        await this.delay(50);
      }

      if (Date.now() - startTime > maxThinkTime) break;
    }

    await this.delay(100);
    this.engine.endTurn();
  }

  private evaluateBestAction(unit: HeroUnit): ScoredMove | null {
    const validMoves = this.engine.getValidMoveHexes(unit);
    validMoves.push({ ...unit.position });

    let bestAction: ScoredMove | null = null;

    for (const moveTarget of validMoves) {
      const adjacentEnemies = this.getEnemiesAdjacentTo(moveTarget);

      if (adjacentEnemies.length > 0) {
        for (const enemy of adjacentEnemies) {
          const score = this.calculateActionScore(unit, moveTarget, enemy);
          if (!bestAction || score > bestAction.score) {
            bestAction = {
              unit,
              target: moveTarget,
              attackTarget: enemy,
              score
            };
          }
        }
      } else {
        const score = this.calculateActionScore(unit, moveTarget, null);
        if (!bestAction || score > bestAction.score) {
          bestAction = {
            unit,
            target: moveTarget,
            attackTarget: null,
            score
          };
        }
      }
    }

    return bestAction;
  }

  private calculateActionScore(
    unit: HeroUnit,
    moveTarget: AxialCoord,
    attackTarget: HeroUnit | null
  ): number {
    let score = 0;

    if (attackTarget) {
      const damage = this.engine.calculateDamage(unit.id, attackTarget.id);
      score += damage * 0.5;

      if (damage >= attackTarget.hp) {
        score += 50;
      }

      const grid = this.engine.getGrid();
      const enemiesInRange = this.countEnemiesInRange(moveTarget, grid);
      score += Math.max(0, enemiesInRange - 1) * 15;
    }

    const grid = this.engine.getGrid();
    const cell = grid[moveTarget.r]?.[moveTarget.q];
    if (cell?.terrain === TerrainType.FOREST) {
      score += 10;
    }

    if (!attackTarget) {
      const nearestEnemy = this.findNearestEnemy(moveTarget);
      if (nearestEnemy) {
        const distance = getHexDistance(moveTarget, nearestEnemy.position);
        score += (10 - distance) * 2;
      }
    }

    if (cell?.terrain === TerrainType.FOREST && attackTarget) {
      score += 5;
    }

    return score;
  }

  private getEnemiesAdjacentTo(coord: AxialCoord): HeroUnit[] {
    const enemyPlayer = this.player === PlayerType.BLUE ? PlayerType.RED : PlayerType.BLUE;
    const allEnemies = this.engine.getAllUnitsOfPlayer(enemyPlayer);
    return allEnemies.filter(e => isAdjacent(coord, e.position));
  }

  private countEnemiesInRange(coord: AxialCoord, grid: any[][]): number {
    const enemyPlayer = this.player === PlayerType.BLUE ? PlayerType.RED : PlayerType.BLUE;
    const allEnemies = this.engine.getAllUnitsOfPlayer(enemyPlayer);
    let count = 0;

    for (const enemy of allEnemies) {
      if (getHexDistance(coord, enemy.position) <= 2) {
        count++;
      }
    }

    return count;
  }

  private findNearestEnemy(coord: AxialCoord): HeroUnit | null {
    const enemyPlayer = this.player === PlayerType.BLUE ? PlayerType.RED : PlayerType.BLUE;
    const allEnemies = this.engine.getAllUnitsOfPlayer(enemyPlayer);

    if (allEnemies.length === 0) return null;

    let nearest = allEnemies[0];
    let minDistance = getHexDistance(coord, nearest.position);

    for (let i = 1; i < allEnemies.length; i++) {
      const dist = getHexDistance(coord, allEnemies[i].position);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = allEnemies[i];
      }
    }

    return nearest;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
