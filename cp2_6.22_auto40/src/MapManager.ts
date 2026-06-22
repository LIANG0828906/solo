import * as PIXI from 'pixi.js';

export enum TerrainType {
  FOREST = 'forest',
  MOUNTAIN = 'mountain',
  WATER = 'water',
  DESERT = 'desert',
  GRASSLAND = 'grassland'
}

export interface TerrainConfig {
  color: number;
  passable: boolean;
  moveCost: number;
  name: string;
}

export interface Cell {
  terrain: TerrainType;
  hasTreasure: boolean;
  explored: boolean;
  visible: boolean;
  fogAlpha: number;
  targetFogAlpha: number;
}

export const TERRAIN_CONFIGS: Record<TerrainType, TerrainConfig> = {
  [TerrainType.FOREST]: {
    color: 0x2d5a27,
    passable: true,
    moveCost: 1,
    name: '森林'
  },
  [TerrainType.MOUNTAIN]: {
    color: 0x6b5b4f,
    passable: true,
    moveCost: 2,
    name: '山地'
  },
  [TerrainType.WATER]: {
    color: 0x2a4a6b,
    passable: false,
    moveCost: 999,
    name: '水域'
  },
  [TerrainType.DESERT]: {
    color: 0xc9a96a,
    passable: true,
    moveCost: 1,
    name: '沙漠'
  },
  [TerrainType.GRASSLAND]: {
    color: 0x6b8e3d,
    passable: true,
    moveCost: 1,
    name: '草地'
  }
};

export class MapManager {
  public readonly gridWidth: number = 30;
  public readonly gridHeight: number = 30;
  public readonly totalTreasures: number = 3;

  public cellSize: number = 20;
  public offsetX: number = 0;
  public offsetY: number = 0;

  private grid: Cell[][] = [];
  public terrainContainer: PIXI.Container;
  public fogContainer: PIXI.Container;
  public treasureContainer: PIXI.Container;
  private terrainSprites: PIXI.Sprite[][] = [];
  private fogSprites: PIXI.Sprite[][] = [];
  private treasureSprites: Map<string, PIXI.Sprite> = new Map();
  private app: PIXI.Application;

  private exploredCount: number = 0;
  private treasurePositions: { x: number; y: number }[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
    this.terrainContainer = new PIXI.Container();
    this.fogContainer = new PIXI.Container();
    this.treasureContainer = new PIXI.Container();

    app.stage.addChild(this.terrainContainer);
    app.stage.addChild(this.treasureContainer);
    app.stage.addChild(this.fogContainer);

    this.resize();
    this.generateMap();
    this.buildTerrainSprites();
    this.buildFogSprites();
    this.placeTreasures();
    this.revealArea(Math.floor(this.gridWidth / 2), Math.floor(this.gridHeight / 2), 2);
  }

  public resize(): void {
    const frameEl = document.getElementById('game-frame');
    if (!frameEl) return;
    const rect = frameEl.getBoundingClientRect();
    const availW = rect.width;
    const availH = rect.height;
    this.cellSize = Math.floor(Math.min(availW / this.gridWidth, availH / this.gridHeight));
    const mapW = this.cellSize * this.gridWidth;
    const mapH = this.cellSize * this.gridHeight;
    this.offsetX = Math.floor((availW - mapW) / 2);
    this.offsetY = Math.floor((availH - mapH) / 2);

    this.terrainContainer.x = this.offsetX;
    this.terrainContainer.y = this.offsetY;
    this.fogContainer.x = this.offsetX;
    this.fogContainer.y = this.offsetY;
    this.treasureContainer.x = this.offsetX;
    this.treasureContainer.y = this.offsetY;

    this.rebuildSpritePositions();
  }

  private rebuildSpritePositions(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.terrainSprites[y] && this.terrainSprites[y][x]) {
          this.terrainSprites[y][x].x = x * this.cellSize;
          this.terrainSprites[y][x].y = y * this.cellSize;
          this.terrainSprites[y][x].width = this.cellSize;
          this.terrainSprites[y][x].height = this.cellSize;
        }
        if (this.fogSprites[y] && this.fogSprites[y][x]) {
          this.fogSprites[y][x].x = x * this.cellSize;
          this.fogSprites[y][x].y = y * this.cellSize;
          this.fogSprites[y][x].width = this.cellSize;
          this.fogSprites[y][x].height = this.cellSize;
        }
      }
    }
    for (const [key, sprite] of this.treasureSprites) {
      const [gx, gy] = key.split(',').map(Number);
      sprite.x = gx * this.cellSize + this.cellSize / 2;
      sprite.y = gy * this.cellSize + this.cellSize / 2;
      sprite.width = this.cellSize * 0.7;
      sprite.height = this.cellSize * 0.7;
    }
  }

  private generateMap(): void {
    const seed = Math.floor(Math.random() * 2147483647);

    const hash = (x: number, y: number): number => {
      let h = seed + x * 374761393 + y * 668265263;
      h = (h ^ (h >> 13)) * 1274126177;
      h = h ^ (h >> 16);
      return (h & 0x7fffffff) / 0x7fffffff;
    };

    const lerp = (a: number, b: number, t: number): number => a + t * (b - a);
    const smoothstep = (t: number): number => t * t * (3 - 2 * t);

    const valueNoise = (x: number, y: number): number => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      const fx = smoothstep(x - ix);
      const fy = smoothstep(y - iy);
      const n00 = hash(ix, iy);
      const n10 = hash(ix + 1, iy);
      const n01 = hash(ix, iy + 1);
      const n11 = hash(ix + 1, iy + 1);
      return lerp(lerp(n00, n10, fx), lerp(n01, n11, fx), fy);
    };

    const fbm = (x: number, y: number, octaves: number, lacunarity: number, gain: number): number => {
      let sum = 0;
      let amp = 1;
      let freq = 1;
      let maxAmp = 0;
      for (let i = 0; i < octaves; i++) {
        sum += valueNoise(x * freq, y * freq) * amp;
        maxAmp += amp;
        amp *= gain;
        freq *= lacunarity;
      }
      return sum / maxAmp;
    };

    const elevScale = 0.08;
    const moistScale = 0.1;
    const elevOctaves = 5;
    const moistOctaves = 4;

    const elevMap: number[][] = [];
    const moistMap: number[][] = [];
    for (let y = 0; y < this.gridHeight; y++) {
      elevMap[y] = [];
      moistMap[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        const rawElev = fbm(x * elevScale, y * elevScale, elevOctaves, 2.0, 0.5);
        const rawMoist = fbm(x * moistScale + 500, y * moistScale + 500, moistOctaves, 2.0, 0.5);
        const dx = (x - this.gridWidth / 2) / (this.gridWidth / 2);
        const dy = (y - this.gridHeight / 2) / (this.gridHeight / 2);
        const edgeDist = 1 - Math.sqrt(dx * dx + dy * dy) * 0.8;
        const edgeFactor = Math.max(0, Math.min(1, edgeDist));
        elevMap[y][x] = rawElev * 0.65 + edgeFactor * 0.35;
        moistMap[y][x] = rawMoist;
      }
    }

    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        const e = elevMap[y][x];
        const m = moistMap[y][x];
        let terrain: TerrainType;

        if (e < 0.28) {
          terrain = TerrainType.WATER;
        } else if (e < 0.35) {
          terrain = m > 0.5 ? TerrainType.GRASSLAND : TerrainType.WATER;
        } else if (e > 0.75) {
          terrain = TerrainType.MOUNTAIN;
        } else if (e > 0.65) {
          terrain = m > 0.55 ? TerrainType.FOREST : TerrainType.MOUNTAIN;
        } else if (m < 0.32) {
          terrain = TerrainType.DESERT;
        } else if (m > 0.62 && e < 0.55) {
          terrain = TerrainType.FOREST;
        } else {
          terrain = TerrainType.GRASSLAND;
        }

        this.grid[y][x] = {
          terrain,
          hasTreasure: false,
          explored: false,
          visible: false,
          fogAlpha: 1,
          targetFogAlpha: 1
        };
      }
    }

    const cx = Math.floor(this.gridWidth / 2);
    const cy = Math.floor(this.gridHeight / 2);
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const gx = cx + dx;
        const gy = cy + dy;
        if (!this.isInBounds(gx, gy)) continue;
        if (this.grid[gy][gx].terrain === TerrainType.WATER) {
          this.grid[gy][gx].terrain = TerrainType.GRASSLAND;
        }
        if (this.grid[gy][gx].terrain === TerrainType.MOUNTAIN) {
          this.grid[gy][gx].terrain = TerrainType.GRASSLAND;
        }
      }
    }

    const visited: boolean[][] = Array.from({ length: this.gridHeight }, () =>
      Array(this.gridWidth).fill(false)
    );
    const queue: { x: number; y: number }[] = [{ x: cx, y: cy }];
    visited[cy][cx] = true;
    const minPassableArea = Math.floor(this.gridWidth * this.gridHeight * 0.3);
    let connectedCount = 0;
    const dirs = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ];

    while (queue.length > 0) {
      const cur = queue.shift()!;
      connectedCount++;
      for (const d of dirs) {
        const nx = cur.x + d.dx;
        const ny = cur.y + d.dy;
        if (!this.isInBounds(nx, ny)) continue;
        if (visited[ny][nx]) continue;
        if (!TERRAIN_CONFIGS[this.grid[ny][nx].terrain].passable) continue;
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny });
      }
    }

    if (connectedCount < minPassableArea) {
      const waterCells: { x: number; y: number }[] = [];
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          if (this.grid[y][x].terrain === TerrainType.WATER) {
            let adjPassable = false;
            for (const d of dirs) {
              const nx = x + d.dx;
              const ny = y + d.dy;
              if (this.isInBounds(nx, ny) && TERRAIN_CONFIGS[this.grid[ny][nx].terrain].passable) {
                adjPassable = true;
                break;
              }
            }
            if (adjPassable) waterCells.push({ x, y });
          }
        }
      }
      for (let i = 0; i < waterCells.length && connectedCount < minPassableArea; i++) {
        const idx = Math.floor(Math.random() * waterCells.length);
        const wc = waterCells.splice(idx, 1)[0];
        this.grid[wc.y][wc.x].terrain = TerrainType.GRASSLAND;
        connectedCount++;
      }
    }
  }

  private buildTerrainSprites(): void {
    this.terrainContainer.removeChildren();
    this.terrainSprites = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.terrainSprites[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        const cfg = TERRAIN_CONFIGS[cell.terrain];
        const tex = this.createTerrainTexture(cell.terrain, cfg.color);
        const sprite = new PIXI.Sprite(tex);
        sprite.x = x * this.cellSize;
        sprite.y = y * this.cellSize;
        sprite.width = this.cellSize;
        sprite.height = this.cellSize;
        this.terrainContainer.addChild(sprite);
        this.terrainSprites[y][x] = sprite;
      }
    }
    const gridLines = new PIXI.Graphics();
    gridLines.lineStyle(1, 0x1a0f08, 0.25);
    for (let y = 0; y <= this.gridHeight; y++) {
      gridLines.moveTo(0, y * this.cellSize);
      gridLines.lineTo(this.gridWidth * this.cellSize, y * this.cellSize);
    }
    for (let x = 0; x <= this.gridWidth; x++) {
      gridLines.moveTo(x * this.cellSize, 0);
      gridLines.lineTo(x * this.cellSize, this.gridHeight * this.cellSize);
    }
    this.terrainContainer.addChild(gridLines);
  }

  private shadeColor(color: number, amount: number): number {
    const r = Math.max(0, Math.min(255, ((color >> 16) & 0xff) + Math.round(amount * 255)));
    const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + Math.round(amount * 255)));
    const b = Math.max(0, Math.min(255, (color & 0xff) + Math.round(amount * 255)));
    return (r << 16) | (g << 8) | b;
  }

  private createTerrainTexture(terrain: TerrainType, baseColor: number): PIXI.Texture {
    const size = 64;
    const g = new PIXI.Graphics();
    g.beginFill(baseColor);
    g.drawRect(0, 0, size, size);
    g.endFill();
    for (let i = 0; i < 30; i++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const ds = Math.random() * 3 + 1;
      const shade = Math.random() * 0.3 - 0.15;
      const c = this.shadeColor(baseColor, shade);
      g.beginFill(c, 0.6);
      g.drawCircle(px, py, ds);
      g.endFill();
    }
    if (terrain === TerrainType.WATER) {
      g.lineStyle(1, 0x4a7a9a, 0.5);
      for (let i = 0; i < 4; i++) {
        const wy = Math.random() * size;
        g.moveTo(0, wy);
        g.quadraticCurveTo(size / 2, wy + (Math.random() - 0.5) * 6, size, wy);
      }
    }
    if (terrain === TerrainType.MOUNTAIN) {
      g.beginFill(0x4a3d33, 0.7);
      for (let i = 0; i < 3; i++) {
        const mx = 8 + i * 20;
        g.moveTo(mx, size - 4);
        g.lineTo(mx + 10, 10 + Math.random() * 8);
        g.lineTo(mx + 20, size - 4);
      }
      g.endFill();
    }
    if (terrain === TerrainType.FOREST) {
      for (let i = 0; i < 4; i++) {
        const tx = Math.random() * size;
        const ty = Math.random() * size;
        g.beginFill(0x1a3a15, 0.8);
        g.drawCircle(tx, ty - 3, 5);
        g.endFill();
        g.beginFill(0x5c3d1e, 0.9);
        g.drawRect(tx - 1, ty, 2, 4);
        g.endFill();
      }
    }
    if (terrain === TerrainType.DESERT) {
      g.lineStyle(1, 0xa08040, 0.4);
      for (let i = 0; i < 3; i++) {
        const sy = 15 + i * 15;
        g.moveTo(0, sy);
        g.quadraticCurveTo(size / 3, sy + 4, size / 2, sy);
        g.quadraticCurveTo((size * 2) / 3, sy - 4, size, sy);
      }
    }
    return this.app.renderer.generateTexture(g, PIXI.SCALE_MODES.LINEAR, 1, new PIXI.Rectangle(0, 0, size, size));
  }

  private buildFogSprites(): void {
    this.fogContainer.removeChildren();
    this.fogSprites = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.fogSprites[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        const sprite = new PIXI.Sprite(this.createFogTexture());
        sprite.x = x * this.cellSize;
        sprite.y = y * this.cellSize;
        sprite.width = this.cellSize;
        sprite.height = this.cellSize;
        sprite.alpha = 1;
        this.fogContainer.addChild(sprite);
        this.fogSprites[y][x] = sprite;
      }
    }
  }

  private createFogTexture(): PIXI.Texture {
    const size = 32;
    const g = new PIXI.Graphics();
    g.beginFill(0x1a1a24);
    g.drawRect(0, 0, size, size);
    g.endFill();
    for (let i = 0; i < 15; i++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const ds = Math.random() * 6 + 2;
      const shade = Math.random() * 0.2;
      const fogR = Math.round((0.1 + shade) * 255);
      const fogG = Math.round((0.1 + shade) * 255);
      const fogB = Math.round((0.14 + shade) * 255);
      g.beginFill((fogR << 16) | (fogG << 8) | fogB, 0.6);
      g.drawCircle(px, py, ds);
      g.endFill();
    }
    return this.app.renderer.generateTexture(g, PIXI.SCALE_MODES.LINEAR, 1, new PIXI.Rectangle(0, 0, size, size));
  }

  private placeTreasures(): void {
    const cx = Math.floor(this.gridWidth / 2);
    const cy = Math.floor(this.gridHeight / 2);
    const dirs = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
    ];

    const visited: boolean[][] = Array.from({ length: this.gridHeight }, () =>
      Array(this.gridWidth).fill(false)
    );
    const bfsDist: number[][] = Array.from({ length: this.gridHeight }, () =>
      Array(this.gridWidth).fill(-1)
    );
    const queue: { x: number; y: number }[] = [{ x: cx, y: cy }];
    visited[cy][cx] = true;
    bfsDist[cy][cx] = 0;

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const d of dirs) {
        const nx = cur.x + d.dx;
        const ny = cur.y + d.dy;
        if (!this.isInBounds(nx, ny)) continue;
        if (visited[ny][nx]) continue;
        visited[ny][nx] = true;
        bfsDist[ny][nx] = bfsDist[cur.y][cur.x] + 1;
        if (TERRAIN_CONFIGS[this.grid[ny][nx].terrain].passable) {
          queue.push({ x: nx, y: ny });
        }
      }
    }

    const treasureTerrainPriority: TerrainType[] = [
      TerrainType.MOUNTAIN,
      TerrainType.FOREST,
      TerrainType.DESERT,
      TerrainType.GRASSLAND
    ];

    const candidates: { x: number; y: number; score: number; terrain: TerrainType }[] = [];
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        if (!TERRAIN_CONFIGS[cell.terrain].passable) continue;
        if (bfsDist[y][x] < 0) continue;
        if (bfsDist[y][x] < 4) continue;

        const terrainIdx = treasureTerrainPriority.indexOf(cell.terrain);
        if (terrainIdx < 0) continue;

        const terrainWeight = (treasureTerrainPriority.length - terrainIdx) * 3;
        const distWeight = bfsDist[y][x] * 0.3;
        let neighborBonus = 0;
        for (const d of dirs) {
          const nx = x + d.dx;
          const ny = y + d.dy;
          if (this.isInBounds(nx, ny)) {
            const nt = this.grid[ny][nx].terrain;
            if (nt !== cell.terrain && TERRAIN_CONFIGS[nt].passable) {
              neighborBonus += 2;
            }
          }
        }
        const score = terrainWeight + distWeight + neighborBonus + Math.random() * 2;
        candidates.push({ x, y, score, terrain: cell.terrain });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    const usedTerrains = new Set<TerrainType>();
    const placed: { x: number; y: number; terrain: TerrainType }[] = [];
    const minTreasureDist = 6;

    for (const c of candidates) {
      if (placed.length >= this.totalTreasures) break;

      const tooClose = placed.some(p => {
        const d = Math.abs(p.x - c.x) + Math.abs(p.y - c.y);
        return d < minTreasureDist;
      });
      if (tooClose) continue;

      const sameTerrainCount = placed.filter(p => p.terrain === c.terrain).length;
      if (sameTerrainCount >= 1 && usedTerrains.size < 3) continue;

      this.grid[c.y][c.x].hasTreasure = true;
      this.treasurePositions.push({ x: c.x, y: c.y });
      this.addTreasureSprite(c.x, c.y);
      usedTerrains.add(c.terrain);
      placed.push(c);
    }

    if (placed.length < this.totalTreasures) {
      const remaining = candidates.filter(c =>
        !placed.some(p => Math.abs(p.x - c.x) + Math.abs(p.y - c.y) < 3)
      );
      for (const c of remaining) {
        if (placed.length >= this.totalTreasures) break;
        this.grid[c.y][c.x].hasTreasure = true;
        this.treasurePositions.push({ x: c.x, y: c.y });
        this.addTreasureSprite(c.x, c.y);
        placed.push(c);
      }
    }
  }

  private addTreasureSprite(gx: number, gy: number): void {
    const tex = this.createTreasureTexture();
    const sprite = new PIXI.Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.x = gx * this.cellSize + this.cellSize / 2;
    sprite.y = gy * this.cellSize + this.cellSize / 2;
    sprite.width = this.cellSize * 0.7;
    sprite.height = this.cellSize * 0.7;
    this.treasureContainer.addChild(sprite);
    this.treasureSprites.set(`${gx},${gy}`, sprite);
  }

  private createTreasureTexture(): PIXI.Texture {
    const size = 64;
    const g = new PIXI.Graphics();
    g.lineStyle(3, 0x5a3d1e, 1);
    g.beginFill(0xb8860b);
    g.drawRoundedRect(4, 16, size - 8, size - 24, 6);
    g.endFill();
    g.beginFill(0xd4a01a);
    g.drawRoundedRect(8, 20, size - 16, size - 32, 4);
    g.endFill();
    g.lineStyle(2, 0x8b6914, 1);
    g.moveTo(4, size / 2);
    g.lineTo(size - 4, size / 2);
    g.beginFill(0xffe066);
    g.drawCircle(size / 2, size / 2, 6);
    g.endFill();
    g.lineStyle(1, 0xffffff, 0.8);
    g.beginFill(0xffffaa, 0.9);
    g.drawCircle(size / 2 - 3, size / 2 - 2, 2);
    g.endFill();
    return this.app.renderer.generateTexture(g, PIXI.SCALE_MODES.LINEAR, 1, new PIXI.Rectangle(0, 0, size, size));
  }

  public removeTreasureAt(gx: number, gy: number): void {
    const key = `${gx},${gy}`;
    const sprite = this.treasureSprites.get(key);
    if (sprite) {
      this.treasureContainer.removeChild(sprite);
      this.treasureSprites.delete(key);
    }
    this.grid[gy][gx].hasTreasure = false;
    this.treasurePositions = this.treasurePositions.filter(p => !(p.x === gx && p.y === gy));
  }

  public isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight;
  }

  public getCell(gx: number, gy: number): Cell | null {
    if (!this.isInBounds(gx, gy)) return null;
    return this.grid[gy][gx];
  }

  public isPassable(gx: number, gy: number): boolean {
    const cell = this.getCell(gx, gy);
    if (!cell) return false;
    return TERRAIN_CONFIGS[cell.terrain].passable;
  }

  public getMoveCost(gx: number, gy: number): number {
    const cell = this.getCell(gx, gy);
    if (!cell) return 999;
    return TERRAIN_CONFIGS[cell.terrain].moveCost;
  }

  public gridToWorld(gx: number, gy: number): { x: number; y: number } {
    return {
      x: this.offsetX + gx * this.cellSize + this.cellSize / 2,
      y: this.offsetY + gy * this.cellSize + this.cellSize / 2
    };
  }

  public worldToGrid(wx: number, wy: number): { x: number; y: number } {
    return {
      x: Math.floor((wx - this.offsetX) / this.cellSize),
      y: Math.floor((wy - this.offsetY) / this.cellSize)
    };
  }

  public revealArea(centerX: number, centerY: number, radius: number): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x].visible = false;
      }
    }
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const gx = centerX + dx;
        const gy = centerY + dy;
        if (!this.isInBounds(gx, gy)) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius + 0.01) continue;
        this.grid[gy][gx].visible = true;
        if (!this.grid[gy][gx].explored) {
          this.grid[gy][gx].explored = true;
          this.exploredCount++;
        }
        const targetAlpha = dist <= radius - 0.5 ? 0 : Math.max(0, (dist - (radius - 0.5)) / 0.5 * 0.5);
        this.grid[gy][gx].targetFogAlpha = targetAlpha;
      }
    }
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        if (!cell.visible && cell.explored) {
          cell.targetFogAlpha = 0.55;
        } else if (!cell.visible && !cell.explored) {
          cell.targetFogAlpha = 1;
        }
      }
    }
  }

  public update(delta: number): void {
    const fadeSpeed = 2.0 * delta;
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x];
        const sprite = this.fogSprites[y][x];
        if (!sprite) continue;
        if (cell.fogAlpha < cell.targetFogAlpha) {
          cell.fogAlpha = Math.min(cell.targetFogAlpha, cell.fogAlpha + fadeSpeed);
        } else if (cell.fogAlpha > cell.targetFogAlpha) {
          cell.fogAlpha = Math.max(cell.targetFogAlpha, cell.fogAlpha - fadeSpeed);
        }
        sprite.alpha = cell.fogAlpha;
        const treasureSprite = this.treasureSprites.get(`${x},${y}`);
        if (treasureSprite) {
          treasureSprite.visible = cell.explored;
          treasureSprite.alpha = Math.max(0, 1 - cell.fogAlpha);
        }
      }
    }
  }

  public getExploredPercent(): number {
    return this.exploredCount / (this.gridWidth * this.gridHeight);
  }

  public getExploredCount(): number {
    return this.exploredCount;
  }

  public getTotalCells(): number {
    return this.gridWidth * this.gridHeight;
  }

  public getTreasurePositions(): { x: number; y: number }[] {
    return [...this.treasurePositions];
  }
}
