import {
  Tile,
  TileType,
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  ResourceNode,
  BUILDING_BLUEPRINTS,
  BuildingType,
} from '../data/worldData';
import { Enemy } from '../ai/enemyAI';

export interface Building {
  id: string;
  type: BuildingType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  spawnAnimation: number;
  lastAttackTime?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface PlayerState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  isGathering: boolean;
  gatherProgress: number;
  gatherTargetId?: string;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export class WorldRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  public camera: Camera = { x: 0, y: 0, zoom: 2 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (wx - this.camera.x) * this.camera.zoom + rect.width / 2,
      y: (wy - this.camera.y) * this.camera.zoom + rect.height / 2,
    };
  }

  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (sx - rect.width / 2) / this.camera.zoom + this.camera.x,
      y: (sy - rect.height / 2) / this.camera.zoom + this.camera.y,
    };
  }

  centerCameraOn(x: number, y: number) {
    this.camera.x = x;
    this.camera.y = y;
  }

  clear() {
    this.ctx.fillStyle = '#1a1a2e';
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  renderMap(map: Tile[][]) {
    const rect = this.canvas.getBoundingClientRect();
    const zoom = this.camera.zoom;

    const tl = this.screenToWorld(0, 0);
    const br = this.screenToWorld(rect.width, rect.height);

    const startTileX = Math.max(0, Math.floor(tl.x / TILE_SIZE) - 1);
    const startTileY = Math.max(0, Math.floor(tl.y / TILE_SIZE) - 1);
    const endTileX = Math.min(MAP_WIDTH, Math.ceil(br.x / TILE_SIZE) + 1);
    const endTileY = Math.min(MAP_HEIGHT, Math.ceil(br.y / TILE_SIZE) + 1);

    for (let ty = startTileY; ty < endTileY; ty++) {
      for (let tx = startTileX; tx < endTileX; tx++) {
        const tile = map[ty][tx];
        const screenPos = this.worldToScreen(tx * TILE_SIZE, ty * TILE_SIZE);
        const size = TILE_SIZE * zoom;

        let baseColor = '#4a7c3e';
        if (tile.type === TileType.DIRT) {
          baseColor = '#6b5344';
        } else if (tile.type === TileType.ROCK) {
          baseColor = '#6c6c72';
        }

        this.ctx.fillStyle = baseColor;
        this.ctx.fillRect(
          Math.floor(screenPos.x),
          Math.floor(screenPos.y),
          Math.ceil(size),
          Math.ceil(size)
        );

        const detailColor = this.getTileDetailColor(tile.type);
        if (detailColor) {
          this.ctx.fillStyle = detailColor;
          const detailSize = Math.max(1, Math.floor(2 * zoom));
          const ox = Math.floor(screenPos.x + size * 0.2);
          const oy = Math.floor(screenPos.y + size * 0.3);
          this.ctx.fillRect(ox, oy, detailSize, detailSize);
          const ox2 = Math.floor(screenPos.x + size * 0.6);
          const oy2 = Math.floor(screenPos.y + size * 0.7);
          this.ctx.fillRect(ox2, oy2, detailSize, detailSize);
        }
      }
    }
  }

  private getTileDetailColor(type: TileType): string | null {
    if (type === TileType.GRASS) return '#3d6b33';
    if (type === TileType.DIRT) return '#5a4436';
    if (type === TileType.ROCK) return '#555558';
    return null;
  }

  renderResourceNodes(nodes: ResourceNode[], gatheringTargetId?: string, gatherProgress: number = 0) {
    const zoom = this.camera.zoom;
    const time = Date.now() / 1000;

    for (const node of nodes) {
      if (node.amount <= 0) continue;
      const screenPos = this.worldToScreen(node.x, node.y);
      const pulse = 1 + Math.sin(time * (Math.PI * 2 / 1.5)) * 0.1;
      const size = 12 * zoom * pulse;

      let color = '#2d5a2d';
      if (node.type === 'wood') {
        this.drawTree(screenPos.x, screenPos.y, size, zoom);
      } else if (node.type === 'stone') {
        this.drawStone(screenPos.x, screenPos.y, size, zoom);
      } else if (node.type === 'food') {
        this.drawBush(screenPos.x, screenPos.y, size, zoom);
      }

      if (node.id === gatheringTargetId) {
        const barW = 40;
        const barH = 6;
        const bx = screenPos.x - barW / 2;
        const by = screenPos.y - size - 10;
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(bx, by, barW, barH);
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillRect(bx, by, barW * Math.min(1, gatherProgress), barH);
        this.ctx.strokeStyle = '#222222';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(bx + 0.5, by + 0.5, barW, barH);
      }
    }
  }

  private drawTree(cx: number, cy: number, size: number, zoom: number) {
    const ctx = this.ctx;
    const trunkW = Math.max(2, 3 * zoom);
    const trunkH = size * 0.5;
    ctx.fillStyle = '#5a3d1a';
    ctx.fillRect(cx - trunkW / 2, cy, trunkW, trunkH);

    ctx.fillStyle = '#2d6b2d';
    const leafSize = size;
    ctx.fillRect(cx - leafSize / 2, cy - leafSize * 0.7, leafSize, leafSize * 0.7);
    ctx.fillStyle = '#3d7b3d';
    ctx.fillRect(cx - leafSize / 2 + 2 * zoom, cy - leafSize * 0.7 + 2 * zoom, leafSize * 0.4, leafSize * 0.3);
  }

  private drawStone(cx: number, cy: number, size: number, zoom: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.moveTo(cx - size / 2, cy + size * 0.3);
    ctx.lineTo(cx - size * 0.3, cy - size * 0.5);
    ctx.lineTo(cx + size * 0.2, cy - size * 0.4);
    ctx.lineTo(cx + size * 0.5, cy + size * 0.1);
    ctx.lineTo(cx + size * 0.3, cy + size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(cx - size * 0.1, cy - size * 0.1, 2 * zoom, 2 * zoom);
  }

  private drawBush(cx: number, cy: number, size: number, zoom: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#3d7b3d';
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(cx - size * 0.2, cy - size * 0.1, 2 * zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + size * 0.15, cy + size * 0.1, 2 * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  renderBuildings(buildings: Building[]) {
    const zoom = this.camera.zoom;

    for (const building of buildings) {
      const wx = building.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = building.y * TILE_SIZE + TILE_SIZE / 2;
      const screenPos = this.worldToScreen(wx, wy);
      const bp = BUILDING_BLUEPRINTS[building.type];

      const scale = building.spawnAnimation < 1
        ? 0.2 + 0.8 * building.spawnAnimation
        : 1;

      const size = TILE_SIZE * zoom * scale;

      const shadowH = bp.height * zoom * scale * 0.6;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      this.ctx.fillRect(
        screenPos.x - size / 2 + 2 * zoom,
        screenPos.y - size / 2 + 2 * zoom,
        size,
        size + shadowH
      );

      this.ctx.fillStyle = bp.color;
      this.ctx.fillRect(
        screenPos.x - size / 2,
        screenPos.y - size / 2,
        size,
        size
      );

      if (building.type === 'tower') {
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(
          screenPos.x - size * 0.15,
          screenPos.y - size / 2 - size * 0.3,
          size * 0.3,
          size * 0.3
        );
      } else if (building.type === 'warehouse') {
        this.ctx.fillStyle = '#5a3d1a';
        this.ctx.fillRect(
          screenPos.x - size * 0.1,
          screenPos.y - size * 0.1,
          size * 0.2,
          size * 0.3
        );
      } else if (building.type === 'woodWall') {
        this.ctx.strokeStyle = '#3a2410';
        this.ctx.lineWidth = Math.max(1, zoom);
        this.ctx.beginPath();
        this.ctx.moveTo(screenPos.x, screenPos.y - size / 2);
        this.ctx.lineTo(screenPos.x, screenPos.y + size / 2);
        this.ctx.stroke();
      } else if (building.type === 'stoneWall') {
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = Math.max(1, zoom);
        this.ctx.strokeRect(
          screenPos.x - size / 2 + zoom,
          screenPos.y - size / 2 + zoom,
          size / 2 - zoom,
          size / 2 - zoom
        );
      }

      if (building.health < building.maxHealth) {
        const barW = size;
        const barH = Math.max(2, 2 * zoom);
        const bx = screenPos.x - barW / 2;
        const by = screenPos.y - size / 2 - barH - 2 * zoom;
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(bx, by, barW, barH);
        this.ctx.fillStyle = '#44dd66';
        this.ctx.fillRect(bx, by, barW * (building.health / building.maxHealth), barH);
      }
    }
  }

  renderEnemies(enemies: Enemy[]) {
    const zoom = this.camera.zoom;

    for (const enemy of enemies) {
      const screenPos = this.worldToScreen(enemy.x, enemy.y);
      const size = 12 * zoom;
      const bobY = Math.floor(enemy.animationFrame) === 1 ? zoom : 0;

      this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
      this.ctx.beginPath();
      this.ctx.ellipse(screenPos.x, screenPos.y + size * 0.5, size * 0.5, size * 0.2, 0, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#6b2d5c';
      this.ctx.fillRect(
        screenPos.x - size / 2,
        screenPos.y - size / 2 + bobY,
        size,
        size
      );

      this.ctx.fillStyle = '#ff2222';
      const eyeOffset = enemy.facing === 'right' ? size * 0.15 : -size * 0.15;
      this.ctx.fillRect(screenPos.x - size * 0.2 + eyeOffset, screenPos.y - size * 0.15 + bobY, 2 * zoom, 2 * zoom);
      this.ctx.fillRect(screenPos.x + size * 0.05 + eyeOffset, screenPos.y - size * 0.15 + bobY, 2 * zoom, 2 * zoom);

      if (enemy.health < enemy.maxHealth) {
        const barW = size * 1.3;
        const barH = Math.max(2, 2 * zoom);
        const bx = screenPos.x - barW / 2;
        const by = screenPos.y - size / 2 - barH - 3 * zoom;
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(bx, by, barW, barH);
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(bx, by, barW * (enemy.health / enemy.maxHealth), barH);
      }
    }
  }

  renderPlayer(player: PlayerState) {
    const zoom = this.camera.zoom;
    const screenPos = this.worldToScreen(player.x, player.y);
    const size = 12 * zoom;

    this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.ctx.beginPath();
    this.ctx.ellipse(screenPos.x, screenPos.y + size * 0.5, size * 0.5, size * 0.2, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.fillRect(screenPos.x - size / 2, screenPos.y - size / 2, size, size);

    this.ctx.fillStyle = '#f4d35e';
    this.ctx.fillRect(screenPos.x - size * 0.35, screenPos.y - size * 0.35, size * 0.7, size * 0.35);

    this.ctx.fillStyle = '#222222';
    this.ctx.fillRect(screenPos.x - size * 0.18, screenPos.y - size * 0.25, Math.max(1, zoom), Math.max(1, zoom));
    this.ctx.fillRect(screenPos.x + size * 0.08, screenPos.y - size * 0.25, Math.max(1, zoom), Math.max(1, zoom));
  }

  renderProjectiles(projectiles: Projectile[]) {
    const zoom = this.camera.zoom;
    for (const p of projectiles) {
      const screenPos = this.worldToScreen(p.x, p.y);
      this.ctx.fillStyle = '#f4d35e';
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, 2 * zoom, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  renderParticles(particles: Particle[]) {
    const zoom = this.camera.zoom;
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const screenPos = this.worldToScreen(p.x, p.y);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha;
      const psize = Math.max(1, 2 * zoom);
      this.ctx.fillRect(screenPos.x - psize / 2, screenPos.y - psize / 2, psize, psize);
      this.ctx.globalAlpha = 1;
    }
  }

  renderBuildPreview(tileX: number, tileY: number, buildable: boolean) {
    const zoom = this.camera.zoom;
    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;
    const screenPos = this.worldToScreen(wx, wy);
    const size = TILE_SIZE * zoom;

    this.ctx.fillStyle = buildable ? 'rgba(78, 205, 196, 0.4)' : 'rgba(255, 68, 68, 0.4)';
    this.ctx.fillRect(
      screenPos.x - size / 2,
      screenPos.y - size / 2,
      size,
      size
    );
    this.ctx.strokeStyle = buildable ? '#4ecdc4' : '#ff4444';
    this.ctx.lineWidth = Math.max(1, zoom);
    this.ctx.strokeRect(
      screenPos.x - size / 2 + 0.5,
      screenPos.y - size / 2 + 0.5,
      size,
      size
    );
  }

  renderTowerRanges(buildings: Building[]) {
    const zoom = this.camera.zoom;
    for (const b of buildings) {
      if (b.type !== 'tower') continue;
      const wx = b.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = b.y * TILE_SIZE + TILE_SIZE / 2;
      const screenPos = this.worldToScreen(wx, wy);
      const rangePx = 120 * zoom;

      this.ctx.strokeStyle = 'rgba(244, 211, 94, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.arc(screenPos.x, screenPos.y, rangePx, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }
}
