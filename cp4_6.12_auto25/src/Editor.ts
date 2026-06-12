import {
  TileType,
  ToolType,
  Position,
  EnemyConfig,
  CoinConfig,
  HealthConfig,
  LevelConfig,
  EditorStateSnapshot
} from './types';

const GRID_WIDTH = 30;
const GRID_HEIGHT = 20;
const TILE_SIZE = 40;
const MAX_HISTORY = 10;

export class Editor {
  private tiles: TileType[][];
  private enemies: EnemyConfig[] = [];
  private coins: CoinConfig[] = [];
  private healthPickups: HealthConfig[] = [];
  private currentTool: ToolType = ToolType.SELECT;
  private selectedEnemyId: string | null = null;
  private updateListeners: (() => void)[] = [];
  private history: EditorStateSnapshot[] = [];
  private historyIndex: number = -1;
  private hoveredTile: Position | null = null;
  private notification: string | null = null;
  private notificationTimeout: number | null = null;

  constructor() {
    this.tiles = this.createEmptyGrid();
  }

  private createEmptyGrid(): TileType[][] {
    const grid: TileType[][] = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        grid[y][x] = TileType.EMPTY;
      }
    }
    return grid;
  }

  getGridWidth(): number { return GRID_WIDTH; }
  getGridHeight(): number { return GRID_HEIGHT; }
  getTileSize(): number { return TILE_SIZE; }
  getTiles(): TileType[][] { return this.tiles; }
  getEnemies(): EnemyConfig[] { return this.enemies; }
  getCoins(): CoinConfig[] { return this.coins; }
  getHealthPickups(): HealthConfig[] { return this.healthPickups; }
  getCurrentTool(): ToolType { return this.currentTool; }
  getHoveredTile(): Position | null { return this.hoveredTile; }
  getSelectedEnemyId(): string | null { return this.selectedEnemyId; }
  getNotification(): string | null { return this.notification; }

  setTool(tool: ToolType): void {
    this.currentTool = tool;
    this.selectedEnemyId = null;
    this.notifyUpdate();
  }

  setHoveredTile(tile: Position | null): void {
    this.hoveredTile = tile;
    this.notifyUpdate();
  }

  onUpdate(callback: () => void): void {
    this.updateListeners.push(callback);
  }

  private notifyUpdate(): void {
    this.updateListeners.forEach(cb => cb());
  }

  private saveSnapshot(): void {
    const snapshot: EditorStateSnapshot = {
      tiles: this.tiles.map(row => [...row]),
      enemies: this.enemies.map(e => ({ ...e, path: e.path.map(p => ({ ...p })) })),
      coins: this.coins.map(c => ({ ...c })),
      healthPickups: this.healthPickups.map(h => ({ ...h }))
    };

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo(): void {
    if (this.historyIndex <= 0) return;

    this.historyIndex--;
    const snapshot = this.history[this.historyIndex];
    this.tiles = snapshot.tiles.map(row => [...row]);
    this.enemies = snapshot.enemies.map(e => ({ ...e, path: e.path.map(p => ({ ...p })) }));
    this.coins = snapshot.coins.map(c => ({ ...c }));
    this.healthPickups = snapshot.healthPickups.map(h => ({ ...h }));
    this.notifyUpdate();
  }

  private showNotification(message: string): void {
    this.notification = message;
    if (this.notificationTimeout) {
      window.clearTimeout(this.notificationTimeout);
    }
    this.notificationTimeout = window.setTimeout(() => {
      this.notification = null;
      this.notifyUpdate();
    }, 2000);
    this.notifyUpdate();
  }

  handleClick(gridX: number, gridY: number): void {
    if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) return;

    const tool = this.currentTool;

    if (tool === ToolType.SELECT) {
      this.handleSelect(gridX, gridY);
      return;
    }

    if (tool === ToolType.ENEMY) {
      this.handleEnemyClick(gridX, gridY);
      return;
    }

    if (tool === ToolType.COIN) {
      this.placeCoin(gridX, gridY);
      return;
    }

    if (tool === ToolType.HEALTH) {
      this.placeHealth(gridX, gridY);
      return;
    }

    this.placeTile(gridX, gridY, this.toolToTileType(tool));
  }

  handleRightClick(gridX: number, gridY: number): void {
    if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) return;

    this.saveSnapshot();

    const tile = this.tiles[gridY][gridX];
    if (tile !== TileType.EMPTY) {
      this.tiles[gridY][gridX] = TileType.EMPTY;
      this.notifyUpdate();
      return;
    }

    const coinIndex = this.coins.findIndex(c => c.gridX === gridX && c.gridY === gridY);
    if (coinIndex !== -1) {
      this.coins.splice(coinIndex, 1);
      this.notifyUpdate();
      return;
    }

    const healthIndex = this.healthPickups.findIndex(h => h.gridX === gridX && h.gridY === gridY);
    if (healthIndex !== -1) {
      this.healthPickups.splice(healthIndex, 1);
      this.notifyUpdate();
      return;
    }

    const enemyIndex = this.enemies.findIndex(e => e.gridX === gridX && e.gridY === gridY);
    if (enemyIndex !== -1) {
      if (this.selectedEnemyId === this.enemies[enemyIndex].id) {
        this.selectedEnemyId = null;
      }
      this.enemies.splice(enemyIndex, 1);
      this.notifyUpdate();
      return;
    }
  }

  private handleSelect(gridX: number, gridY: number): void {
    const enemy = this.enemies.find(e => e.gridX === gridX && e.gridY === gridY);
    if (enemy) {
      this.selectedEnemyId = enemy.id;
      this.notifyUpdate();
    } else {
      this.selectedEnemyId = null;
      this.notifyUpdate();
    }
  }

  private handleEnemyClick(gridX: number, gridY: number): void {
    if (!this.selectedEnemyId) {
      if (this.isPositionOccupied(gridX, gridY)) {
        this.showNotification('该位置已被占用！');
        return;
      }
      this.saveSnapshot();
      const newEnemy: EnemyConfig = {
        id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'mushroom',
        path: [{ x: gridX, y: gridY }],
        gridX,
        gridY
      };
      this.enemies.push(newEnemy);
      this.selectedEnemyId = newEnemy.id;
      this.notifyUpdate();
    } else {
      const enemy = this.enemies.find(e => e.id === this.selectedEnemyId);
      if (enemy) {
        this.saveSnapshot();
        const lastPoint = enemy.path[enemy.path.length - 1];
        if (lastPoint.x === gridX && lastPoint.y === gridY) {
          this.showNotification('不能在同一位置添加路径点！');
          return;
        }
        enemy.path.push({ x: gridX, y: gridY });
        this.notifyUpdate();
      }
    }
  }

  private isPositionOccupied(gridX: number, gridY: number): boolean {
    if (this.tiles[gridY][gridX] !== TileType.EMPTY) return true;
    if (this.coins.some(c => c.gridX === gridX && c.gridY === gridY)) return true;
    if (this.healthPickups.some(h => h.gridX === gridX && h.gridY === gridY)) return true;
    if (this.enemies.some(e => e.gridX === gridX && e.gridY === gridY)) return true;
    return false;
  }

  private placeTile(gridX: number, gridY: number, tileType: TileType): void {
    if (this.tiles[gridY][gridX] !== TileType.EMPTY) {
      this.showNotification('该格子已有内容，无法覆盖！');
      return;
    }
    if (this.isEntityAtPosition(gridX, gridY)) {
      this.showNotification('该位置有实体，无法放置！');
      return;
    }

    this.saveSnapshot();
    this.tiles[gridY][gridX] = tileType;
    this.notifyUpdate();
  }

  private isEntityAtPosition(gridX: number, gridY: number): boolean {
    return this.coins.some(c => c.gridX === gridX && c.gridY === gridY) ||
           this.healthPickups.some(h => h.gridX === gridX && h.gridY === gridY) ||
           this.enemies.some(e => e.gridX === gridX && e.gridY === gridY);
  }

  private placeCoin(gridX: number, gridY: number): void {
    if (this.tiles[gridY][gridX] !== TileType.EMPTY) {
      this.showNotification('该格子已有内容，无法覆盖！');
      return;
    }
    if (this.coins.some(c => c.gridX === gridX && c.gridY === gridY)) {
      this.showNotification('该位置已有金币！');
      return;
    }
    if (this.coins.length >= 50) {
      this.showNotification('金币数量已达上限(50枚)！');
      return;
    }

    this.saveSnapshot();
    this.coins.push({
      id: `coin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gridX,
      gridY
    });
    this.notifyUpdate();
  }

  private placeHealth(gridX: number, gridY: number): void {
    if (this.tiles[gridY][gridX] !== TileType.EMPTY) {
      this.showNotification('该格子已有内容，无法覆盖！');
      return;
    }
    if (this.healthPickups.some(h => h.gridX === gridX && h.gridY === gridY)) {
      this.showNotification('该位置已有生命补给！');
      return;
    }

    this.saveSnapshot();
    this.healthPickups.push({
      id: `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      gridX,
      gridY
    });
    this.notifyUpdate();
  }

  private toolToTileType(tool: ToolType): TileType {
    switch (tool) {
      case ToolType.GRASS: return TileType.GRASS;
      case ToolType.DIRT: return TileType.DIRT;
      case ToolType.STONE: return TileType.STONE;
      default: return TileType.EMPTY;
    }
  }

  exportLevel(): LevelConfig {
    return {
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      tileSize: TILE_SIZE,
      tiles: this.tiles.map(row => [...row]),
      enemies: this.enemies.map(e => ({ ...e, path: e.path.map(p => ({ ...p })) })),
      coins: this.coins.map(c => ({ ...c })),
      healthPickups: this.healthPickups.map(h => ({ ...h }))
    };
  }

  loadLevel(level: LevelConfig): void {
    this.saveSnapshot();
    this.tiles = level.tiles.map(row => [...row]);
    this.enemies = level.enemies.map(e => ({ ...e, path: e.path.map(p => ({ ...p })) }));
    this.coins = level.coins.map(c => ({ ...c }));
    this.healthPickups = level.healthPickups.map(h => ({ ...h }));
    this.history = [];
    this.historyIndex = -1;
    this.selectedEnemyId = null;
    this.notifyUpdate();
  }

  saveToLocalStorage(): void {
    const level = this.exportLevel();
    localStorage.setItem('level_editor_save', JSON.stringify(level));
    this.showNotification('关卡已保存！');
  }

  loadFromLocalStorage(): void {
    const data = localStorage.getItem('level_editor_save');
    if (!data) {
      this.showNotification('没有找到保存的关卡！');
      return;
    }
    try {
      const level = JSON.parse(data) as LevelConfig;
      this.loadLevel(level);
      this.showNotification('关卡已加载！');
    } catch {
      this.showNotification('加载失败，数据格式错误！');
    }
  }

  canSaveEnemy(enemyId: string): boolean {
    const enemy = this.enemies.find(e => e.id === enemyId);
    return enemy ? enemy.path.length >= 3 : false;
  }

  canPreview(): boolean {
    for (const enemy of this.enemies) {
      if (enemy.path.length < 3) return false;
    }
    return true;
  }
}
