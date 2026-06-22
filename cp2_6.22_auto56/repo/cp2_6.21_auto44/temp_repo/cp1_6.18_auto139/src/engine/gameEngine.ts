import {
  GameState, HeroUnit, AxialCoord, PlayerType, HexCell, TerrainType,
  AnimationState, MoveAction, AttackAction
} from '../types';
import {
  MapGenerator, GRID_WIDTH, GRID_HEIGHT, getHexNeighbors,
  isHexInBounds, isAdjacent, getHexDistance
} from '../map/mapGenerator';

type StateChangeListener = (state: GameState) => void;
type AnimationStartListener = (anim: AnimationState) => void;
type GameOverListener = (winner: PlayerType) => void;

export class GameEngine {
  private state: GameState;
  private mapGenerator: MapGenerator;
  private stateListeners: StateChangeListener[] = [];
  private animationListeners: AnimationStartListener[] = [];
  private gameOverListeners: GameOverListener[] = [];
  private moveHistory: Map<string, AxialCoord[]> = new Map();

  constructor(seed?: number) {
    this.mapGenerator = new MapGenerator(seed);
    this.state = this.initializeState();
  }

  private initializeState(): GameState {
    const grid = this.mapGenerator.generateGrid();
    const units = this.mapGenerator.generateUnits(grid);

    return {
      grid,
      units,
      currentPlayer: PlayerType.BLUE,
      turnNumber: 1,
      selectedUnitId: null,
      highlightedHexes: [],
      gameOver: false,
      winner: null
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  getGrid(): HexCell[][] {
    return this.state.grid;
  }

  getUnits(): HeroUnit[] {
    return [...this.state.units];
  }

  getUnitById(id: string): HeroUnit | undefined {
    return this.state.units.find(u => u.id === id);
  }

  getUnitAtPosition(coord: AxialCoord): HeroUnit | undefined {
    return this.state.units.find(u => u.position.q === coord.q && u.position.r === coord.r && u.hp > 0);
  }

  getCurrentPlayer(): PlayerType {
    return this.state.currentPlayer;
  }

  getSelectedUnit(): HeroUnit | undefined {
    if (!this.state.selectedUnitId) return undefined;
    return this.getUnitById(this.state.selectedUnitId);
  }

  onStateChange(listener: StateChangeListener): void {
    this.stateListeners.push(listener);
  }

  onAnimationStart(listener: AnimationStartListener): void {
    this.animationListeners.push(listener);
  }

  onGameOver(listener: GameOverListener): void {
    this.gameOverListeners.push(listener);
  }

  private notifyStateChange(): void {
    this.stateListeners.forEach(l => l(this.getState()));
  }

  private notifyAnimationStart(anim: AnimationState): void {
    this.animationListeners.forEach(l => l(anim));
  }

  private notifyGameOver(winner: PlayerType): void {
    this.gameOverListeners.forEach(l => l(winner));
  }

  selectUnit(unitId: string | null): void {
    if (this.state.gameOver) return;

    this.state.selectedUnitId = unitId;

    if (unitId) {
      const unit = this.getUnitById(unitId);
      if (unit && unit.player === this.state.currentPlayer && !unit.hasActed) {
        this.state.highlightedHexes = this.getValidMoveHexes(unit);
      } else {
        this.state.highlightedHexes = [];
      }
    } else {
      this.state.highlightedHexes = [];
    }

    this.notifyStateChange();
  }

  getValidMoveHexes(unit: HeroUnit): AxialCoord[] {
    if (unit.moveSteps <= 0 || unit.hasActed) return [];

    const result: AxialCoord[] = [];
    const visited = new Set<string>();
    const queue: { coord: AxialCoord; steps: number }[] = [
      { coord: unit.position, steps: 0 }
    ];
    visited.add(`${unit.position.q},${unit.position.r}`);

    while (queue.length > 0) {
      const { coord, steps } = queue.shift()!;

      if (steps > 0 && steps <= unit.moveSteps) {
        const occupyingUnit = this.getUnitAtPosition(coord);
        if (!occupyingUnit) {
          result.push(coord);
        }
      }

      if (steps < unit.moveSteps) {
        const neighbors = getHexNeighbors(coord);
        for (const neighbor of neighbors) {
          const key = `${neighbor.q},${neighbor.r}`;
          if (!visited.has(key) && isHexInBounds(neighbor)) {
            const cell = this.state.grid[neighbor.r]?.[neighbor.q];
            if (cell && cell.terrain !== TerrainType.ROCK) {
              visited.add(key);
              queue.push({ coord: neighbor, steps: steps + 1 });
            }
          }
        }
      }
    }

    return result;
  }

  getAdjacentEnemyUnits(unit: HeroUnit): HeroUnit[] {
    const neighbors = getHexNeighbors(unit.position);
    const enemies: HeroUnit[] = [];

    for (const neighbor of neighbors) {
      const occupyingUnit = this.getUnitAtPosition(neighbor);
      if (occupyingUnit && occupyingUnit.player !== unit.player && occupyingUnit.hp > 0) {
        enemies.push(occupyingUnit);
      }
    }

    return enemies;
  }

  moveUnit(unitId: string, target: AxialCoord): boolean {
    const unit = this.getUnitById(unitId);
    if (!unit || unit.player !== this.state.currentPlayer) return false;
    if (unit.hasActed || unit.moveSteps <= 0) return false;
    if (this.state.gameOver) return false;

    const validMoves = this.getValidMoveHexes(unit);
    const isValid = validMoves.some(m => m.q === target.q && m.r === target.r);

    if (!isValid) return false;

    if (!this.moveHistory.has(unitId)) {
      this.moveHistory.set(unitId, []);
    }
    this.moveHistory.get(unitId)!.push(unit.position);

    unit.previousPosition = { ...unit.position };
    unit.position = { ...target };
    unit.moveSteps--;

    this.state.highlightedHexes = this.getValidMoveHexes(unit);
    this.notifyStateChange();

    return true;
  }

  undoMove(unitId: string): boolean {
    const unit = this.getUnitById(unitId);
    if (!unit || unit.player !== this.state.currentPlayer) return false;
    if (unit.hasActed) return false;

    const history = this.moveHistory.get(unitId);
    if (!history || history.length === 0) return false;

    const previousPos = history.pop()!;
    unit.position = previousPos;
    unit.previousPosition = history.length > 0 ? history[history.length - 1] : null;
    unit.moveSteps++;

    this.state.highlightedHexes = this.getValidMoveHexes(unit);
    this.notifyStateChange();

    return true;
  }

  canUndoMove(unitId: string): boolean {
    const history = this.moveHistory.get(unitId);
    return !!(history && history.length > 0);
  }

  attackUnit(attackerId: string, targetId: string): boolean {
    const attacker = this.getUnitById(attackerId);
    const target = this.getUnitById(targetId);

    if (!attacker || !target) return false;
    if (attacker.player === target.player) return false;
    if (attacker.player !== this.state.currentPlayer) return false;
    if (attacker.hasActed) return false;
    if (this.state.gameOver) return false;
    if (target.hp <= 0) return false;

    if (!isAdjacent(attacker.position, target.position)) return false;

    const targetCell = this.state.grid[target.position.r]?.[target.position.q];
    const terrainBonus = targetCell ? this.mapGenerator.getTerrainDefenseBonus(targetCell.terrain) : 0;
    const effectiveDefense = Math.floor(target.defense * (1 + terrainBonus));
    const damage = Math.max(1, attacker.attack - effectiveDefense);

    target.hp = Math.max(0, target.hp - damage);
    attacker.hasActed = true;
    attacker.moveSteps = 0;

    if (this.state.highlightedHexes.length > 0) {
      this.state.highlightedHexes = [];
    }

    this.notifyStateChange();

    if (target.hp <= 0) {
      this.checkGameOver();
    }

    return true;
  }

  calculateDamage(attackerId: string, targetId: string): number {
    const attacker = this.getUnitById(attackerId);
    const target = this.getUnitById(targetId);

    if (!attacker || !target) return 0;

    const targetCell = this.state.grid[target.position.r]?.[target.position.q];
    const terrainBonus = targetCell ? this.mapGenerator.getTerrainDefenseBonus(targetCell.terrain) : 0;
    const effectiveDefense = Math.floor(target.defense * (1 + terrainBonus));

    return Math.max(1, attacker.attack - effectiveDefense);
  }

  endTurn(): void {
    if (this.state.gameOver) return;

    const currentPlayerUnits = this.state.units.filter(u => u.player === this.state.currentPlayer);
    const allActed = currentPlayerUnits.every(u => u.hasActed || u.hp <= 0);

    if (!allActed) {
      currentPlayerUnits.forEach(u => {
        if (!u.hasActed && u.hp > 0) {
          u.hasActed = true;
        }
      });
    }

    this.state.currentPlayer = this.state.currentPlayer === PlayerType.BLUE ? PlayerType.RED : PlayerType.BLUE;

    if (this.state.currentPlayer === PlayerType.BLUE) {
      this.state.turnNumber++;
    }

    const newCurrentUnits = this.state.units.filter(u => u.player === this.state.currentPlayer);
    newCurrentUnits.forEach(u => {
      if (u.hp > 0) {
        u.hasActed = false;
        u.moveSteps = u.maxMoveSteps;
        u.previousPosition = null;
      }
    });

    this.state.selectedUnitId = null;
    this.state.highlightedHexes = [];
    this.moveHistory.clear();

    this.notifyStateChange();
  }

  private checkGameOver(): void {
    const blueAlive = this.state.units.filter(u => u.player === PlayerType.BLUE && u.hp > 0);
    const redAlive = this.state.units.filter(u => u.player === PlayerType.RED && u.hp > 0);

    if (blueAlive.length === 0 || redAlive.length === 0) {
      this.state.gameOver = true;
      this.state.winner = blueAlive.length > 0 ? PlayerType.BLUE : PlayerType.RED;
      this.notifyGameOver(this.state.winner);
      this.notifyStateChange();
    }
  }

  reset(seed?: number): void {
    this.mapGenerator = new MapGenerator(seed);
    this.state = this.initializeState();
    this.moveHistory.clear();
    this.notifyStateChange();
  }

  getAllUnitsOfPlayer(player: PlayerType): HeroUnit[] {
    return this.state.units.filter(u => u.player === player && u.hp > 0);
  }

  isHexWalkable(coord: AxialCoord): boolean {
    if (!isHexInBounds(coord)) return false;
    const cell = this.state.grid[coord.r]?.[coord.q];
    if (!cell || cell.terrain === TerrainType.ROCK) return false;
    const unit = this.getUnitAtPosition(coord);
    return !unit;
  }
}
