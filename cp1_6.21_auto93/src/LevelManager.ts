import type { LevelConfig, Position, WaveConfig, EnemyType } from './types';

export class LevelManager {
  private levelConfig: LevelConfig | null = null;
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }

  async loadLevel(levelId: string): Promise<LevelConfig> {
    try {
      const response = await fetch(`/api/level/${levelId}`);
      if (!response.ok) {
        throw new Error('加载关卡失败');
      }
      const config = await response.json() as LevelConfig;
      this.levelConfig = config;
      this.emit('levelLoaded', this.levelConfig);
      return config;
    } catch (error) {
      console.error('加载关卡失败:', error);
      throw error;
    }
  }

  getLevelConfig(): LevelConfig | null {
    return this.levelConfig;
  }

  getWaveConfig(waveNumber: number): WaveConfig | null {
    if (!this.levelConfig || waveNumber < 1 || waveNumber > this.levelConfig.totalWaves) {
      return null;
    }
    return this.levelConfig.waves[waveNumber - 1] || null;
  }

  getPath(): Position[] {
    if (!this.levelConfig) return [];
    return this.levelConfig.path;
  }

  getTotalWaves(): number {
    return this.levelConfig?.totalWaves || 0;
  }

  getGridSize(): { cols: number; rows: number } {
    if (!this.levelConfig) return { cols: 12, rows: 8 };
    return { cols: this.levelConfig.gridCols, rows: this.levelConfig.gridRows };
  }

  generateEnemySpawnInfo(waveNumber: number): { type: EnemyType; delay: number }[] {
    const waveConfig = this.getWaveConfig(waveNumber);
    if (!waveConfig) return [];

    const spawnInfo: { type: EnemyType; delay: number }[] = [];
    let cumulativeDelay = 0;

    waveConfig.enemies.forEach(enemyGroup => {
      for (let i = 0; i < enemyGroup.count; i++) {
        spawnInfo.push({
          type: enemyGroup.type,
          delay: cumulativeDelay
        });
        cumulativeDelay += enemyGroup.delay;
      }
    });

    return spawnInfo;
  }

  static hexToPixel(gridX: number, gridY: number, hexSize: number): Position {
    const x = hexSize * 1.5 * gridX + 60;
    const y = hexSize * Math.sqrt(3) * (gridY + 0.5 * (gridX & 1)) + 60;
    return { x, y };
  }

  static pixelToHex(x: number, y: number, hexSize: number): { gridX: number; gridY: number } {
    const adjustedX = x - 60;
    const adjustedY = y - 60;
    
    const q = (2/3 * adjustedX) / hexSize;
    const r = (-1/3 * adjustedX + Math.sqrt(3)/3 * adjustedY) / hexSize;
    
    return LevelManager.hexRound(q, r);
  }

  private static hexRound(q: number, r: number): { gridX: number; gridY: number } {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    }

    return { gridX: rq, gridY: rr };
  }

  isOnPath(gridX: number, gridY: number, hexSize: number): boolean {
    const path = this.getPath();
    if (path.length < 2) return false;

    const pos = LevelManager.hexToPixel(gridX, gridY, hexSize);
    const threshold = hexSize * 0.8;

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      const dist = this.pointToLineDistance(pos, p1, p2);
      if (dist < threshold) {
        return true;
      }
    }

    return false;
  }

  private pointToLineDistance(point: Position, lineStart: Position, lineEnd: Position): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
