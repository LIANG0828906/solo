import type { Unit, HexCoord, Skill } from '../types';
import { GridEngine } from './GridEngine';

export interface AIAction {
  enemyId: string;
  moveTarget: HexCoord | null;
  attackTargetId: string | null;
  skillId: string | null;
}

export class AIEngine {
  private gridEngine: GridEngine;

  constructor(gridEngine: GridEngine) {
    this.gridEngine = gridEngine;
  }

  evaluateThreat(hero: Unit): number {
    const hpWeight = 0.4;
    const atkWeight = 0.6;
    const hpRatio = hero.hp / hero.maxHp;
    return (1 - hpRatio) * hpWeight * 100 + (hero.atk / 50) * atkWeight * 100;
  }

  findHighestThreatHero(heroes: Unit[]): Unit | null {
    const aliveHeroes = heroes.filter(h => !h.isDead);
    if (aliveHeroes.length === 0) return null;
    aliveHeroes.sort((a, b) => this.evaluateThreat(b) - this.evaluateThreat(a));
    return aliveHeroes[0];
  }

  getBlockedCoords(allUnits: Unit[], excludeId?: string): Set<string> {
    const blocked = new Set<string>();
    for (const unit of allUnits) {
      if (unit.id === excludeId) continue;
      if (!unit.isDead) {
        blocked.add(this.gridEngine.hexKey(unit.position));
      }
    }
    return blocked;
  }

  findAttackTargetInRange(
    enemy: Unit,
    heroes: Unit[],
    skillRange: number
  ): Unit | null {
    const aliveHeroes = heroes.filter(h => !h.isDead);
    const inRange = aliveHeroes.filter(h => {
      const dist = this.gridEngine.hexDistance(enemy.position, h.position);
      return dist <= skillRange;
    });
    if (inRange.length === 0) return null;
    inRange.sort((a, b) => this.evaluateThreat(b) - this.evaluateThreat(a));
    return inRange[0];
  }

  findBestMoveTowards(
    enemy: Unit,
    target: Unit,
    allUnits: Unit[]
  ): HexCoord | null {
    const blocked = this.getBlockedCoords(allUnits, enemy.id);
    const reachable = this.gridEngine.getReachableCells(enemy.position, enemy.move, blocked);

    if (reachable.length === 0) return null;

    reachable.sort((a, b) => {
      const distA = this.gridEngine.hexDistance(a, target.position);
      const distB = this.gridEngine.hexDistance(b, target.position);
      return distA - distB;
    });

    return reachable[0];
  }

  getBestSkill(enemy: Unit): Skill | null {
    const availableSkills = enemy.skills.filter(s => s.currentCooldown === 0);
    if (availableSkills.length === 0) return null;
    availableSkills.sort((a, b) => b.damageMultiplier - a.damageMultiplier);
    return availableSkills[0];
  }

  decideAction(
    enemy: Unit,
    heroes: Unit[],
    allUnits: Unit[]
  ): AIAction {
    const target = this.findHighestThreatHero(heroes);
    if (!target) {
      return {
        enemyId: enemy.id,
        moveTarget: null,
        attackTargetId: null,
        skillId: null,
      };
    }

    const skill = this.getBestSkill(enemy);
    const attackRange = skill ? skill.range : 1;

    let attackTarget = this.findAttackTargetInRange(enemy, heroes, attackRange);

    if (attackTarget) {
      return {
        enemyId: enemy.id,
        moveTarget: null,
        attackTargetId: attackTarget.id,
        skillId: skill ? skill.id : null,
      };
    }

    const moveTarget = this.findBestMoveTowards(enemy, target, allUnits);

    if (moveTarget) {
      const newEnemy = { ...enemy, position: moveTarget };
      const inRangeAfterMove = this.findAttackTargetInRange(newEnemy, heroes, attackRange);
      if (inRangeAfterMove) {
        return {
          enemyId: enemy.id,
          moveTarget,
          attackTargetId: inRangeAfterMove.id,
          skillId: skill ? skill.id : null,
        };
      }
    }

    return {
      enemyId: enemy.id,
      moveTarget,
      attackTargetId: null,
      skillId: null,
    };
  }

  decideAllActions(
    enemies: Unit[],
    heroes: Unit[],
    allUnits: Unit[]
  ): AIAction[] {
    const actions: AIAction[] = [];
    const aliveEnemies = enemies.filter(e => !e.isDead);
    const updatedUnits = [...allUnits];

    for (const enemy of aliveEnemies) {
      const action = this.decideAction(enemy, heroes, updatedUnits);
      actions.push(action);

      if (action.moveTarget) {
        const idx = updatedUnits.findIndex(u => u.id === enemy.id);
        if (idx >= 0) {
          updatedUnits[idx] = { ...updatedUnits[idx], position: action.moveTarget };
        }
      }
    }

    return actions;
  }
}
