import {
  UnitData,
  HexCell,
  TerrainType,
  SHIP_TEMPLATES,
  createUnit,
  hexDistance,
  hexNeighbors,
  ShipType,
} from './UnitData';
import { eventBus } from '../rendering/EventBus';

export interface GameEvents {
  'unit-moved': { unitId: string; from: { q: number; r: number }; to: { q: number; r: number } };
  'unit-attacked': { attackerId: string; targetId: string; damage: number; weaponType: string };
  'unit-selected': { unitId: string | null };
  'turn-changed': { turn: number; faction: 'player' | 'enemy' };
  'unit-destroyed': { unitId: string };
  'game-over': { winner: 'player' | 'enemy' };
  'terrain-interacted': { unitId: string; terrain: TerrainType; effect: string };
  'move-range-calculated': { unitId: string; cells: HexCell[] };
  'attack-range-calculated': { unitId: string; cells: HexCell[] };
  'fleet-status-tick': { timestamp: number };
}

type TypedEventBus = typeof eventBus & { emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void };

const GRID_COLS = 10;
const GRID_ROWS = 8;

export class GameEngine {
  grid: Map<string, HexCell> = new Map();
  units: Map<string, UnitData> = new Map();
  currentTurn: number = 1;
  currentFaction: 'player' | 'enemy' = 'player';
  selectedUnitId: string | null = null;
  moveRangeCells: string[] = [];
  attackRangeCells: string[] = [];
  gameOver: boolean = false;
  winner: 'player' | 'enemy' | null = null;
  private statusTimer: ReturnType<typeof setInterval> | null = null;

  private generateGrid(): void {
    this.grid.clear();

    const nebulaCount = 5;
    const asteroidCount = 4;
    const stationCount = 2;

    const terrainTargets: { terrain: TerrainType; count: number }[] = [
      { terrain: 'nebula', count: nebulaCount },
      { terrain: 'asteroid', count: asteroidCount },
      { terrain: 'station', count: stationCount },
    ];

    const reservedKeys = new Set<string>();
    for (let q = 0; q <= 2; q++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        reservedKeys.add(this.getGridKey(q, r));
      }
    }
    for (let q = GRID_COLS - 3; q < GRID_COLS; q++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        reservedKeys.add(this.getGridKey(q, r));
      }
    }

    for (let q = 0; q < GRID_COLS; q++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        const key = this.getGridKey(q, r);
        this.grid.set(key, { q, r, terrain: 'empty', occupant: null });
      }
    }

    for (const { terrain, count } of terrainTargets) {
      let placed = 0;
      let attempts = 0;
      while (placed < count && attempts < 200) {
        const q = Math.floor(Math.random() * GRID_COLS);
        const r = Math.floor(Math.random() * GRID_ROWS);
        const key = this.getGridKey(q, r);
        const cell = this.grid.get(key);
        if (cell && cell.terrain === 'empty' && !reservedKeys.has(key)) {
          cell.terrain = terrain;
          placed++;
        }
        attempts++;
      }
    }
  }

  init(
    playerFleet: { type: ShipType; slot: number }[],
    enemyFleet: { type: ShipType; slot: number }[],
  ): void {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }

    this.grid.clear();
    this.units.clear();
    this.currentTurn = 1;
    this.currentFaction = 'player';
    this.selectedUnitId = null;
    this.moveRangeCells = [];
    this.attackRangeCells = [];
    this.gameOver = false;
    this.winner = null;

    this.generateGrid();

    const playerRows = this.distributeRows(playerFleet.length, GRID_ROWS);
    for (let i = 0; i < playerFleet.length; i++) {
      const entry = playerFleet[i];
      const q = i % 3;
      const r = playerRows[i];
      const unit = createUnit(crypto.randomUUID(), entry.type, 'player', { q, r });
      this.units.set(unit.id, unit);
      const cell = this.grid.get(this.getGridKey(q, r));
      if (cell) cell.occupant = unit.id;
    }

    const enemyRows = this.distributeRows(enemyFleet.length, GRID_ROWS);
    for (let i = 0; i < enemyFleet.length; i++) {
      const entry = enemyFleet[i];
      const q = GRID_COLS - 1 - (i % 3);
      const r = enemyRows[i];
      const unit = createUnit(crypto.randomUUID(), entry.type, 'enemy', { q, r });
      this.units.set(unit.id, unit);
      const cell = this.grid.get(this.getGridKey(q, r));
      if (cell) cell.occupant = unit.id;
    }

    this.statusTimer = setInterval(() => this.calculateFleetStatus(), 1000);
  }

  private distributeRows(count: number, totalRows: number): number[] {
    if (count === 0) return [];
    const rows: number[] = [];
    const step = totalRows / (count + 1);
    for (let i = 1; i <= count; i++) {
      rows.push(Math.min(Math.floor(step * i), totalRows - 1));
    }
    return rows;
  }

  calculateMoveRange(unitId: string): void {
    this.moveRangeCells = [];
    const unit = this.units.get(unitId);
    if (!unit || unit.hasActed) return;

    const visited = new Map<string, number>();
    const queue: { key: string; cost: number }[] = [];
    const startKey = this.getGridKey(unit.gridPos.q, unit.gridPos.r);
    visited.set(startKey, 0);
    queue.push({ key: startKey, cost: 0 });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const cell = this.grid.get(current.key);
      if (!cell) continue;

      const neighbors = hexNeighbors(cell.q, cell.r);
      for (const { q, r } of neighbors) {
        const nKey = this.getGridKey(q, r);
        const nCell = this.grid.get(nKey);
        if (!nCell) continue;

        if (nCell.occupant !== null) continue;

        const moveCost = nCell.terrain === 'nebula' ? 2 : 1;
        const newCost = current.cost + moveCost;

        if (newCost > unit.speed) continue;

        const existingCost = visited.get(nKey);
        if (existingCost !== undefined && existingCost <= newCost) continue;

        visited.set(nKey, newCost);
        queue.push({ key: nKey, cost: newCost });
      }
    }

    visited.delete(startKey);
    this.moveRangeCells = Array.from(visited.keys());

    const cells = this.moveRangeCells
      .map((k) => this.grid.get(k)!)
      .filter(Boolean);

    (eventBus as TypedEventBus).emit('move-range-calculated', { unitId, cells });
  }

  calculateAttackRange(unitId: string): void {
    this.attackRangeCells = [];
    const unit = this.units.get(unitId);
    if (!unit || unit.hasActed) return;

    const attackableCells: string[] = [];

    for (const weapon of unit.weapons) {
      for (const [targetId, target] of this.units) {
        if (target.faction === unit.faction) continue;
        const dist = hexDistance(
          unit.gridPos.q,
          unit.gridPos.r,
          target.gridPos.q,
          target.gridPos.r,
        );
        if (dist <= weapon.range) {
          const key = this.getGridKey(target.gridPos.q, target.gridPos.r);
          if (!attackableCells.includes(key)) {
            attackableCells.push(key);
          }
        }
      }
    }

    this.attackRangeCells = attackableCells;

    const cells = attackableCells
      .map((k) => this.grid.get(k)!)
      .filter(Boolean);

    (eventBus as TypedEventBus).emit('attack-range-calculated', { unitId, cells });
  }

  moveUnit(unitId: string, targetQ: number, targetR: number): void {
    const unit = this.units.get(unitId);
    if (!unit) return;

    const targetKey = this.getGridKey(targetQ, targetR);
    if (!this.moveRangeCells.includes(targetKey)) return;

    const oldPos = { ...unit.gridPos };
    const oldCell = this.grid.get(this.getGridKey(oldPos.q, oldPos.r));
    if (oldCell) oldCell.occupant = null;

    unit.gridPos.q = targetQ;
    unit.gridPos.r = targetR;

    const newCell = this.grid.get(targetKey);
    if (newCell) newCell.occupant = unitId;

    if (newCell?.terrain === 'asteroid') {
      unit.armor = Math.max(0, unit.armor - 10);
      (eventBus as TypedEventBus).emit('terrain-interacted', {
        unitId,
        terrain: 'asteroid',
        effect: 'Took 10 armor damage from asteroid field',
      });
      if (unit.armor <= 0) {
        this.destroyUnit(unitId);
      }
    }

    if (newCell?.terrain === 'station' && unit.faction === 'player') {
      const healed = Math.min(unit.maxShield - unit.shield, 15);
      unit.shield += healed;
      (eventBus as TypedEventBus).emit('terrain-interacted', {
        unitId,
        terrain: 'station',
        effect: `Recovered ${healed} shield at station`,
      });
    }

    unit.hasActed = true;
    this.moveRangeCells = [];
    this.attackRangeCells = [];

    (eventBus as TypedEventBus).emit('unit-moved', {
      unitId,
      from: oldPos,
      to: { q: targetQ, r: targetR },
    });
  }

  attackUnit(attackerId: string, targetId: string): void {
    const attacker = this.units.get(attackerId);
    const target = this.units.get(targetId);
    if (!attacker || !target) return;
    if (attacker.faction === target.faction) return;

    const targetKey = this.getGridKey(target.gridPos.q, target.gridPos.r);
    if (!this.attackRangeCells.includes(targetKey)) return;

    let totalDamage = 0;
    let weaponType = '';

    for (const weapon of attacker.weapons) {
      const dist = hexDistance(
        attacker.gridPos.q,
        attacker.gridPos.r,
        target.gridPos.q,
        target.gridPos.r,
      );
      if (dist <= weapon.range) {
        totalDamage += weapon.damage;
        weaponType = weapon.type;
      }
    }

    if (totalDamage === 0) return;

    let remaining = totalDamage;
    if (target.shield > 0) {
      const shieldAbsorb = Math.min(target.shield, remaining);
      target.shield -= shieldAbsorb;
      remaining -= shieldAbsorb;
    }
    if (remaining > 0) {
      target.armor -= remaining;
    }

    attacker.hasActed = true;
    this.moveRangeCells = [];
    this.attackRangeCells = [];

    (eventBus as TypedEventBus).emit('unit-attacked', {
      attackerId,
      targetId,
      damage: totalDamage,
      weaponType,
    });

    if (target.armor <= 0) {
      this.destroyUnit(targetId);
    }

    this.checkWinCondition();
  }

  private destroyUnit(unitId: string): void {
    const unit = this.units.get(unitId);
    if (!unit) return;

    const cell = this.grid.get(this.getGridKey(unit.gridPos.q, unit.gridPos.r));
    if (cell) cell.occupant = null;

    this.units.delete(unitId);

    (eventBus as TypedEventBus).emit('unit-destroyed', { unitId });
  }

  private calculateFleetStatus(): void {
    for (const unit of this.units.values()) {
      for (const skill of unit.skills) {
        if (skill.currentCooldown > 0) {
          skill.currentCooldown--;
        }
      }
      unit.shield = Math.max(0, Math.min(unit.maxShield, unit.shield));
      unit.armor = Math.max(0, Math.min(unit.maxArmor, unit.armor));
    }
    (eventBus as TypedEventBus).emit('fleet-status-tick', { timestamp: Date.now() });
  }

  private checkWinCondition(): void {
    if (this.gameOver) return;

    const playerAlive = Array.from(this.units.values()).some((u) => u.faction === 'player');
    const enemyAlive = Array.from(this.units.values()).some((u) => u.faction === 'enemy');

    if (!playerAlive) {
      this.gameOver = true;
      this.winner = 'enemy';
      if (this.statusTimer) {
        clearInterval(this.statusTimer);
        this.statusTimer = null;
      }
      (eventBus as TypedEventBus).emit('game-over', { winner: 'enemy' });
    } else if (!enemyAlive) {
      this.gameOver = true;
      this.winner = 'player';
      if (this.statusTimer) {
        clearInterval(this.statusTimer);
        this.statusTimer = null;
      }
      (eventBus as TypedEventBus).emit('game-over', { winner: 'player' });
    }
  }

  selectUnit(unitId: string | null): void {
    this.selectedUnitId = unitId;
    this.moveRangeCells = [];
    this.attackRangeCells = [];

    if (unitId) {
      const unit = this.units.get(unitId);
      if (unit && unit.faction === this.currentFaction && !unit.hasActed) {
        this.calculateMoveRange(unitId);
        this.calculateAttackRange(unitId);
      }
    }

    (eventBus as TypedEventBus).emit('unit-selected', { unitId });
  }

  endTurn(): void {
    this.selectUnit(null);

    const nextFaction = this.currentFaction === 'player' ? 'enemy' : 'player';

    if (nextFaction === 'player') {
      this.currentTurn++;
    }

    this.currentFaction = nextFaction;

    for (const unit of this.units.values()) {
      if (unit.faction === this.currentFaction) {
        unit.hasActed = false;

        const cell = this.grid.get(this.getGridKey(unit.gridPos.q, unit.gridPos.r));
        if (cell) {
          if (cell.terrain === 'station' && unit.faction === 'player') {
            const healed = Math.min(unit.maxShield - unit.shield, 15);
            if (healed > 0) {
              unit.shield += healed;
              (eventBus as TypedEventBus).emit('terrain-interacted', {
                unitId: unit.id,
                terrain: 'station',
                effect: `Recovered ${healed} shield at station`,
              });
            }
          }
          if (cell.terrain === 'asteroid') {
            unit.armor = Math.max(0, unit.armor - 10);
            (eventBus as TypedEventBus).emit('terrain-interacted', {
              unitId: unit.id,
              terrain: 'asteroid',
              effect: 'Took 10 armor damage from asteroid field',
            });
            if (unit.armor <= 0) {
              this.destroyUnit(unit.id);
              this.checkWinCondition();
            }
          }
        }
      }
    }

    (eventBus as TypedEventBus).emit('turn-changed', {
      turn: this.currentTurn,
      faction: this.currentFaction,
    });

    if (this.currentFaction === 'enemy' && !this.gameOver) {
      setTimeout(() => this.runAITurn(), 800);
    }
  }

  runAITurn(): void {
    if (this.gameOver) return;

    const enemyUnits = Array.from(this.units.values()).filter(
      (u) => u.faction === 'enemy' && !u.hasActed,
    );

    for (const enemy of enemyUnits) {
      if (!this.units.has(enemy.id)) continue;
      if (this.gameOver) break;

      let nearestPlayer: UnitData | null = null;
      let nearestDist = Infinity;

      for (const player of this.units.values()) {
        if (player.faction !== 'player') continue;
        const dist = hexDistance(
          enemy.gridPos.q,
          enemy.gridPos.r,
          player.gridPos.q,
          player.gridPos.r,
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestPlayer = player;
        }
      }

      if (!nearestPlayer) continue;

      this.selectUnit(enemy.id);

      if (nearestDist <= enemy.weapons[0].range) {
        const targetKey = this.getGridKey(nearestPlayer.gridPos.q, nearestPlayer.gridPos.r);
        if (this.attackRangeCells.includes(targetKey)) {
          this.attackUnit(enemy.id, nearestPlayer.id);
          continue;
        }
      }

      if (this.moveRangeCells.length > 0) {
        let bestKey = this.moveRangeCells[0];
        let bestDist = Infinity;

        for (const key of this.moveRangeCells) {
          const cell = this.grid.get(key);
          if (!cell) continue;
          const dist = hexDistance(cell.q, cell.r, nearestPlayer.gridPos.q, nearestPlayer.gridPos.r);
          if (dist < bestDist) {
            bestDist = dist;
            bestKey = key;
          }
        }

        const bestCell = this.grid.get(bestKey);
        if (bestCell) {
          this.moveUnit(enemy.id, bestCell.q, bestCell.r);

          if (!this.gameOver) {
            const updatedEnemy = this.units.get(enemy.id);
            if (updatedEnemy) {
              this.calculateAttackRange(updatedEnemy.id);
              for (const player of this.units.values()) {
                if (player.faction !== 'player') continue;
                const pKey = this.getGridKey(player.gridPos.q, player.gridPos.r);
                if (this.attackRangeCells.includes(pKey)) {
                  this.attackUnit(updatedEnemy.id, player.id);
                  break;
                }
              }
            }
          }
        }
      }

      this.selectUnit(null);
    }

    if (!this.gameOver) {
      this.endTurn();
    }
  }

  getGridKey(q: number, r: number): string {
    return `${q},${r}`;
  }

  getUnitAt(q: number, r: number): UnitData | null {
    const cell = this.grid.get(this.getGridKey(q, r));
    if (!cell || !cell.occupant) return null;
    return this.units.get(cell.occupant) ?? null;
  }

  getState(): {
    grid: HexCell[];
    units: UnitData[];
    currentTurn: number;
    currentFaction: 'player' | 'enemy';
    selectedUnitId: string | null;
    moveRangeCells: string[];
    attackRangeCells: string[];
    gameOver: boolean;
    winner: 'player' | 'enemy' | null;
  } {
    return {
      grid: Array.from(this.grid.values()),
      units: Array.from(this.units.values()),
      currentTurn: this.currentTurn,
      currentFaction: this.currentFaction,
      selectedUnitId: this.selectedUnitId,
      moveRangeCells: [...this.moveRangeCells],
      attackRangeCells: [...this.attackRangeCells],
      gameOver: this.gameOver,
      winner: this.winner,
    };
  }

  destroy(): void {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
  }
}
