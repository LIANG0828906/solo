import { MapGrid, Unit, HexCoord } from './MapGrid';
import { PathFinder } from './PathFinder';

export interface AIDecision {
  type: 'attack' | 'move' | 'wait';
  target?: Unit;
  path?: HexCoord[];
  moveTarget?: HexCoord;
}

export class AI {
  private grid: MapGrid;
  private pathFinder: PathFinder;

  constructor(grid: MapGrid, pathFinder: PathFinder) {
    this.grid = grid;
    this.pathFinder = pathFinder;
  }

  public makeDecision(unit: Unit): AIDecision {
    if (unit.hasActed && unit.hasMoved) {
      return { type: 'wait' };
    }

    const playerTeam: 'player' | 'enemy' = unit.team === 'player' ? 'enemy' : 'player';

    if (!unit.hasActed) {
      const enemiesInRange = this.pathFinder.getEnemiesInRange(unit, playerTeam);
      if (enemiesInRange.length > 0) {
        const target = this.selectTarget(enemiesInRange);
        return {
          type: 'attack',
          target,
        };
      }
    }

    if (!unit.hasMoved) {
      const moveDecision = this.findMoveTowardsEnemy(unit, playerTeam);
      if (moveDecision) {
        return moveDecision;
      }
    }

    return { type: 'wait' };
  }

  private selectTarget(enemies: Unit[]): Unit {
    let lowestHpEnemy = enemies[0]!;
    for (const enemy of enemies) {
      if (enemy.hp < lowestHpEnemy.hp) {
        lowestHpEnemy = enemy;
      }
    }
    return lowestHpEnemy;
  }

  private findMoveTowardsEnemy(unit: Unit, playerTeam: 'player' | 'enemy'): AIDecision | null {
    const closestEnemy = this.pathFinder.findClosestEnemy(unit, playerTeam);
    if (!closestEnemy) return null;

    const reachable = this.pathFinder.getReachableRange(unit);
    
    let bestPosition: HexCoord | null = null;
    let bestDistance = Infinity;
    let bestPath: HexCoord[] | null = null;

    for (const node of reachable.values()) {
      if (node.distance === 0) continue;

      const distance = this.grid.getDistance(
        { q: node.q, r: node.r },
        { q: closestEnemy.q, r: closestEnemy.r }
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestPosition = { q: node.q, r: node.r };
        
        const path = this.pathFinder.findPath(
          { q: unit.q, r: unit.r },
          { q: node.q, r: node.r },
          unit.moveRange
        );
        bestPath = path;
      }
    }

    if (bestPosition && bestPath && bestPath.length > 1) {
      const stepPath = bestPath.slice(0, 2);
      return {
        type: 'move',
        moveTarget: bestPosition,
        path: stepPath,
      };
    }

    return null;
  }

  public executeDecision(unit: Unit, decision: AIDecision): void {
    switch (decision.type) {
      case 'attack':
        if (decision.target) {
          this.attack(unit, decision.target);
        }
        break;
      case 'move':
        if (decision.moveTarget) {
          this.move(unit, decision.moveTarget);
        }
        break;
      case 'wait':
        unit.hasActed = true;
        unit.hasMoved = true;
        break;
    }
  }

  private attack(attacker: Unit, target: Unit): void {
    target.hp -= attacker.attack;
    attacker.hasActed = true;
    
    if (target.hp <= 0) {
      this.grid.removeUnit(target.id);
    }
  }

  private move(unit: Unit, target: HexCoord): void {
    unit.q = target.q;
    unit.r = target.r;
    unit.hasMoved = true;
  }
}
