import { v4 as uuidv4 } from 'uuid';
import type {
  Unit,
  GridPosition,
  AttackResult,
  BattleLogEntry,
  TerrainType,
  UnitClass,
  UnitStats,
} from './types';
import { CLASS_BASE_STATS, TERRAIN_INFO } from './types';
import { GridSystem } from '../grid/GridSystem';

export class BattleEngine {
  private gridSystem: GridSystem;

  constructor(gridSystem: GridSystem) {
    this.gridSystem = gridSystem;
  }

  calculateTurnOrder(units: Unit[]): string[] {
    const aliveUnits = units.filter((u) => u.currentHp > 0);
    return aliveUnits
      .sort((a, b) => {
        if (b.stats.agility !== a.stats.agility) {
          return b.stats.agility - a.stats.agility;
        }
        return Math.random() - 0.5;
      })
      .map((u) => u.id);
  }

  calculateMoveRange(
    unit: Unit,
    allUnits: Unit[]
  ): GridPosition[] {
    const occupied = new Set<string>();
    allUnits
      .filter((u) => u.currentHp > 0 && u.id !== unit.id)
      .forEach((u) => {
        occupied.add(`${u.position.q},${u.position.r}`);
      });

    return this.gridSystem.getReachableCells(
      unit.position,
      unit.moveRange,
      occupied
    );
  }

  calculateAttackRange(
    unit: Unit,
    allUnits: Unit[]
  ): Unit[] {
    const enemies = allUnits.filter(
      (u) => u.currentHp > 0 && u.isPlayer !== unit.isPlayer
    );

    return enemies.filter((enemy) => {
      const distance = this.gridSystem.getDistance(
        unit.position,
        enemy.position
      );
      return distance <= unit.attackRange && distance > 0;
    });
  }

  getAttackablePositions(
    unit: Unit,
    allUnits: Unit[]
  ): GridPosition[] {
    const attackableUnits = this.calculateAttackRange(unit, allUnits);
    return attackableUnits.map((u) => u.position);
  }

  calculateDamage(
    attacker: Unit,
    defender: Unit,
    defenderTerrain: TerrainType
  ): AttackResult {
    const baseDamage = this.getBaseAttack(attacker);
    const defense = this.getDefense(defender);
    const terrainBonus = TERRAIN_INFO[defenderTerrain].defenseBonus;
    const effectiveDefense = defense * (1 + terrainBonus);

    let damage = Math.max(1, Math.round(baseDamage - effectiveDefense * 0.5));

    const isCritical = Math.random() < 0.1 + attacker.stats.intelligence * 0.02;
    if (isCritical) {
      damage = Math.round(damage * 1.5);
    }

    const targetDied = defender.currentHp - damage <= 0;

    return { damage, isCritical, targetDied };
  }

  private getBaseAttack(unit: Unit): number {
    const base = CLASS_BASE_STATS[unit.unitClass].hp * 0.1;
    const strBonus = unit.stats.strength * 2;
    const intBonus = unit.stats.intelligence * 1.5;
    return base + strBonus + intBonus;
  }

  private getDefense(unit: Unit): number {
    return unit.stats.strength * 1.5 + unit.stats.agility * 0.5;
  }

  applyDamage(unit: Unit, damage: number): Unit {
    return {
      ...unit,
      currentHp: Math.max(0, unit.currentHp - damage),
    };
  }

  moveUnit(unit: Unit, targetPos: GridPosition): Unit {
    return {
      ...unit,
      position: targetPos,
    };
  }

  createUnit(
    unitClass: UnitClass,
    position: GridPosition,
    isPlayer: boolean,
    name: string,
    stats: UnitStats = { strength: 5, agility: 5, intelligence: 5 }
  ): Unit {
    const baseStats = CLASS_BASE_STATS[unitClass];
    const maxHp = baseStats.hp + stats.strength * 10;

    return {
      id: uuidv4(),
      name,
      unitClass,
      position,
      stats,
      maxHp,
      currentHp: maxHp,
      moveRange: baseStats.move,
      attackRange: baseStats.attack,
      isPlayer,
      hasActed: false,
    };
  }

  updateUnitStats(unit: Unit, stats: Partial<UnitStats>): Unit {
    const newStats = { ...unit.stats, ...stats };
    const baseStats = CLASS_BASE_STATS[unit.unitClass];
    const maxHp = baseStats.hp + newStats.strength * 10;
    const hpRatio = unit.currentHp / unit.maxHp;

    return {
      ...unit,
      stats: newStats,
      maxHp,
      currentHp: Math.min(maxHp, Math.round(maxHp * hpRatio)),
    };
  }

  createLogEntry(
    message: string,
    type: BattleLogEntry['type']
  ): BattleLogEntry {
    return {
      id: uuidv4(),
      timestamp: Date.now(),
      message,
      type,
    };
  }

  isBattleEnded(units: Unit[]): boolean {
    const playerUnits = units.filter((u) => u.isPlayer && u.currentHp > 0);
    const enemyUnits = units.filter((u) => !u.isPlayer && u.currentHp > 0);
    return playerUnits.length === 0 || enemyUnits.length === 0;
  }

  resetUnitsForNewTurn(units: Unit[]): Unit[] {
    return units.map((u) => ({ ...u, hasActed: false }));
  }
}
