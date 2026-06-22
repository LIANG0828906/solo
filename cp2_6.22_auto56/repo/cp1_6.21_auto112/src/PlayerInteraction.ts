import {
  GameWorld,
  GRID_SIZE,
  TILE_SIZE,
  TileType,
  Treasure
} from './GameWorld';
import { eventBus, GameEvents, ExploreUpdateData } from './EventBus';
import { ScoreAnimState, WinAnimState, PlayerShakeState } from './animations';

class PlayerInteraction {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: GameWorld;
  private playerGridX: number = 0;
  private playerGridY: number = 0;
  private playerX: number = 0;
  private playerY: number = 0;
  private keys: Set<string> = new Set();
  private lastMoveTime: number = 0;
  private readonly MOVE_COOLDOWN: number = 120;
  private rafId: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  private scoreAnim: ScoreAnimState = new ScoreAnimState();
  private winAnim: WinAnimState = new WinAnimState();
  private shakeState: PlayerShakeState = { offset: 0, active: false, startTime: 0, duration: 200 };
  private exploredPercent: number = 0;
  private riverOffset: number = 0;
  private lastRiverTime: number = 0;
  private winOverlayShown: boolean = false;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;
    if (!canvas) throw new Error('Canvas element not found');
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;

    this.world = new GameWorld();
    this.initPlayer();
    this.setupEventListeners();
    this.setupCanvasSize();
    this.updateExploreInfo();
    eventBus.emit(GameEvents.WORLD_INITIALIZED);
    this.startLoop();
  }

  private initPlayer(): void {
    const start = this.world.getPlayerStart();
    this.playerGridX = start.gridX;
    this.playerGridY = start.gridY;
    this.updatePlayerPixelPos();
  }

  private updatePlayerPixelPos(): void {
    this.playerX = this.playerGridX * TILE_SIZE + TILE_SIZE / 2;
    this.playerY = this.playerGridY * TILE_SIZE + TILE_SIZE / 2;
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('resize', this.setupCanvasSize.bind(this));
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));

    eventBus.on(GameEvents.SCORE_UPDATED, () => {
      this.scoreAnim.trigger();
    });

    eventBus.on(GameEvents.EXPLORE_UPDATED, (data: ExploreUpdateData) => {
      this.exploredPercent = (data.exploredCount / data.totalTiles) * 100;
    });

    eventBus.on(GameEvents.GAME_WIN, () => {
      this.winAnim.trigger();
      this.winOverlayShown = true;
    });

    eventBus.on(GameEvents.PLAYER_BLOCKED, () => {
      this.shakeState.active = true;
      this.shakeState.startTime = performance.now();
      this.shakeState.offset = 0;
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
      this.keys.add(key);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
  }

  private handleCanvasClick(): void {
    if (this.winOverlayShown && this.winAnim.isComplete(performance.now())) {
      this.resetGame();
    }
  }

  private resetGame(): void {
    this.world = new GameWorld();
    this.initPlayer();
    this.scoreAnim = new ScoreAnimState();
    this.winAnim = new WinAnimState();
    this.winOverlayShown = false;
    this.updateExploreInfo();
    eventBus.emit(GameEvents.WORLD_INITIALIZED);
  }

  private setupCanvasSize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private updateExploreInfo(): void {
    this.exploredPercent = this.world.getExplorePercent();
  }

  private tryMove(): void {
    const now = performance.now();
    if (now - this.lastMoveTime < this.MOVE_COOLDOWN) return;

    let dx = 0;
    let dy = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy = -1;
    else if (this.keys.has('s') || this.keys.has('arrowdown')) dy = 1;
    else if (this.keys.has('a') || this.keys.has('arrowleft')) dx = -1;
    else if (this.keys.has('d') || this.keys.has('arrowright')) dx = 1;

    if (dx === 0 && dy === 0) return;

    const targetX = this.playerGridX + dx;
    const targetY = this.playerGridY + dy;

    if (this.world.isWalkable(targetX, targetY)) {
      this.playerGridX = targetX;
      this.playerGridY = targetY;
      this.updatePlayerPixelPos();
      this.lastMoveTime = now;

      eventBus.emit(GameEvents.PLAYER_MOVE, {
        x: this.playerX,
        y: this.playerY,
        gridX: this.playerGridX,
        gridY: this.playerGridY
      });

      this.world.revealArea(this.playerGridX, this.playerGridY, false);

      const treasure = this.world.checkTreasureAt(this.playerGridX, this.playerGridY);
      if (treasure) {
        this.world.collectTreasure(treasure);
      }
    } else {
      eventBus.emit(GameEvents.PLAYER_BLOCKED);
    }
  }

  private updateShake(now: number): void {
    if (!this.shakeState.active) return;
    const t = (now - this.shakeState.startTime) / this.shakeState.duration;
    if (t >= 1) {
      this.shakeState.active = false;
      this.shakeState.offset = 0;
    } else {
      this.shakeState.offset = Math.sin(t * Math.PI * 5) * 4 * (1 - t);
    }
  }

  private updateRiver(now: number): void {
    if (now - this.lastRiverTime >= 300) {
      this.riverOffset = (this.riverOffset + 1) % 8;
      this.lastRiverTime = now;
    }
  }

  private calculateOffset(): void {
    const worldWidth = GRID_SIZE * TILE_SIZE;
    const worldHeight = GRID_SIZE * TILE_SIZE;
    const viewW = this.canvas.clientWidth;
    const viewH = this.canvas.clientHeight;
    this.offsetX = (viewW - worldWidth) / 2;
    this.offsetY = (viewH - worldHeight) / 2;
  }

  private startLoop(): void {
    const loop = () => {
      const now = performance.now();
      this.tryMove();
      this.world.updateFogAnimations(now);
      this.updateShake(now);
      this.updateRiver(now);
      this.render(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private render(now: number): void {
    const ctx = this.ctx;
    const viewW = this.canvas.clientWidth;
    const viewH = this.canvas.clientHeight;

    ctx.clearRect(0, 0, viewW, viewH);
    this.renderBackground(ctx, viewW, viewH);

    this.calculateOffset();
    ctx.save();
    ctx.translate(this.offsetX + this.shakeState.offset, this.offsetY);

    this.renderTiles(ctx, now);
    this.renderTreasures(ctx, now);
    this.renderPlayer(ctx);
    this.renderFog(ctx);

    ctx.restore();

    this.renderUI(ctx, viewW, viewH, now);
    this.renderMinimap(ctx, viewW, viewH);
    this.renderWinEffect(ctx, viewW, viewH, now);
  }

  private renderBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1B4D3E');
    grad.addColorStop(1, '#0D2818');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  private renderTiles(ctx: CanvasRenderingContext2D, now: number): void {
    const tiles = this.world.getAllTiles();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        const groundGrad = ctx.createLinearGradient(px, py, px, py + TILE_SIZE);
        groundGrad.addColorStop(0, '#243B2E');
        groundGrad.addColorStop(1, '#1A3325');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        if (tile.type === TileType.GROUND) {
          for (const deco of tile.decorations) {
            const dx = px + deco.offsetX;
            const dy = py + deco.offsetY;
            if (deco.type === 'rock') {
              ctx.fillStyle = '#5C5C5C';
              ctx.beginPath();
              ctx.arc(dx, dy, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#7A7A7A';
              ctx.beginPath();
              ctx.arc(dx - 1.5, dy - 1.5, 2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = '#3E2723';
              ctx.beginPath();
              ctx.moveTo(dx, dy - 10);
              ctx.lineTo(dx - 7.5, dy + 10);
              ctx.lineTo(dx + 7.5, dy + 10);
              ctx.closePath();
              ctx.fill();
            }
          }
        } else if (tile.type === TileType.TREE) {
          const cx = px + TILE_SIZE / 2;
          const cy = py + TILE_SIZE / 2;
          ctx.fillStyle = '#3E2723';
          ctx.beginPath();
          ctx.moveTo(cx, cy - 20);
          ctx.lineTo(cx - 15, cy + 12);
          ctx.lineTo(cx + 15, cy + 12);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#2B1A16';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#5D4037';
          ctx.fillRect(cx - 3, cy + 10, 6, 8);
        } else if (tile.type === TileType.RIVER) {
          const riverGrad = ctx.createLinearGradient(px, py, px, py + TILE_SIZE);
          riverGrad.addColorStop(0, '#1976D2');
          riverGrad.addColorStop(1, '#1565C0');
          ctx.fillStyle = riverGrad;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          ctx.strokeStyle = '#64B5F6';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          for (let ly = 12; ly < TILE_SIZE; ly += 16) {
            const off = this.riverOffset;
            for (let lx = -8; lx < TILE_SIZE + 8; lx += 16) {
              const startX = px + lx + off;
              ctx.beginPath();
              ctx.moveTo(startX, py + ly);
              ctx.lineTo(startX + 10, py + ly);
              ctx.stroke();
            }
          }
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
  }

  private renderTreasures(ctx: CanvasRenderingContext2D, now: number): void {
    const treasures = this.world.getTreasures();
    for (const t of treasures) {
      if (t.collected && !t.anim.active) continue;
      const tile = this.world.getTile(t.gridX, t.gridY);
      if (!tile || tile.fog.opacity >= 0.6) continue;

      const cx = t.gridX * TILE_SIZE + TILE_SIZE / 2;
      const cy = t.gridY * TILE_SIZE + TILE_SIZE / 2;
      const pulseVal = 0.5 + 0.5 * Math.sin(now / 500 + t.pulsePhase);

      ctx.save();
      ctx.translate(cx, cy);
      if (t.anim.active) {
        ctx.rotate(t.anim.rotation);
        ctx.scale(t.anim.scale, t.anim.scale);
        ctx.globalAlpha = t.anim.opacity;
      }

      const glowColor = this.lerpColorHex('#FFD700', '#FFA000', pulseVal);
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12 + pulseVal * 8;

      const bodyColor = glowColor;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(-10, -8, 20, 16, 3);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-10, -8, 20, 16, 3);
      ctx.stroke();

      ctx.fillStyle = '#B8860B';
      ctx.fillRect(-10, -2, 20, 2);
      ctx.fillRect(-1, -8, 2, 16);

      ctx.fillStyle = '#8B6914';
      ctx.fillRect(-3, -4, 6, 6);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-1.5, -2.5, 3, 3);

      ctx.restore();
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 16;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY, 10, 0, Math.PI * 2);
    ctx.fill();

    const innerGrad = ctx.createRadialGradient(
      this.playerX - 3, this.playerY - 3, 1,
      this.playerX, this.playerY, 10
    );
    innerGrad.addColorStop(0, '#FFFFFF');
    innerGrad.addColorStop(1, '#E8F5E9');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(this.playerX, this.playerY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderFog(ctx: CanvasRenderingContext2D): void {
    const tiles = this.world.getAllTiles();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = tiles[y][x];
        if (tile.fog.opacity <= 0.001) continue;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        const fogGrad = ctx.createRadialGradient(
          px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE * 0.1,
          px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE * 0.75
        );
        const alpha = tile.fog.opacity;
        fogGrad.addColorStop(0, `rgba(200, 220, 210, ${alpha * 0.7})`);
        fogGrad.addColorStop(1, `rgba(180, 200, 190, ${alpha})`);
        ctx.fillStyle = fogGrad;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  private renderUI(ctx: CanvasRenderingContext2D, w: number, h: number, now: number): void {
    const scoreColor = this.scoreAnim.update(now);
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(20, 20, 180, 70, 12);
    ctx.fill();

    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.fillStyle = '#9E9E9E';
    ctx.textBaseline = 'top';
    ctx.fillText('得分', 36, 30);

    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.fillStyle = scoreColor;
    ctx.textAlign = 'right';
    const scoreText = `${this.world.score} / ${this.world.getTreasures().length}`;
    ctx.fillText(scoreText, 180, 55);
    ctx.textAlign = 'left';

    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillStyle = '#9E9E9E';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`种子: ${this.world.seed}`, w - 24, 24);
    ctx.textAlign = 'left';
    ctx.restore();

    ctx.save();
    const panelX = w - 220;
    const panelY = h - 100;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, 200, 80, 12);
    ctx.fill();

    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'top';
    ctx.fillText(`已探索: ${this.exploredPercent.toFixed(1)}%`, panelX + 140, panelY + 18);
    ctx.fillText(`宝箱: ${this.world.score}/${this.world.getTreasures().length}`, panelX + 140, panelY + 44);
    ctx.restore();
  }

  private renderMinimap(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const mapSize = 120;
    const cellSize = mapSize / GRID_SIZE;
    const mapX = w - 220 + 10;
    const mapY = h - 100 + 10;
    const tiles = this.world.getAllTiles();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX - 2, mapY - 2, mapSize + 4, mapSize + 4);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = tiles[y][x];
        const px = mapX + x * cellSize;
        const py = mapY + y * cellSize;
        const size = Math.ceil(cellSize);

        if (!tile.explored) {
          ctx.fillStyle = '#000000';
        } else if (tile.fog.opacity > 0.01) {
          ctx.fillStyle = '#333333';
        } else {
          switch (tile.type) {
            case TileType.GROUND:
              ctx.fillStyle = '#2E7D32';
              break;
            case TileType.TREE:
              ctx.fillStyle = '#3E2723';
              break;
            case TileType.RIVER:
              ctx.fillStyle = '#1565C0';
              break;
            default:
              ctx.fillStyle = '#2E7D32';
          }
        }
        ctx.fillRect(Math.floor(px), Math.floor(py), size, size);
      }
    }

    const treasures = this.world.getTreasures();
    for (const t of treasures) {
      if (t.collected) continue;
      const tile = this.world.getTile(t.gridX, t.gridY);
      if (!tile || tile.fog.opacity >= 0.5) continue;
      const px = mapX + t.gridX * cellSize + cellSize / 2;
      const py = mapY + t.gridY * cellSize + cellSize / 2;
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(Math.floor(px - 1), Math.floor(py - 1), 2, 2);
    }

    const pMx = mapX + this.playerGridX * cellSize + cellSize / 2;
    const pMy = mapY + this.playerGridY * cellSize + cellSize / 2;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(pMx, pMy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  private renderWinEffect(ctx: CanvasRenderingContext2D, w: number, h: number, now: number): void {
    if (!this.winAnim.active && !this.winOverlayShown) return;

    const alpha = this.winAnim.getBgAlpha(now);
    if (alpha <= 0) {
      if (this.winAnim.isComplete(now)) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, w, h);
        this.drawWinText(ctx, w, h, now);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.font = '18px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('点击任意位置重新开始', w / 2, h / 2 + 80);
        ctx.textAlign = 'left';
        ctx.restore();
      }
      return;
    }

    ctx.save();
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.7})`;
    ctx.fillRect(0, 0, w, h);

    this.calculateOffset();
    const tiles = this.world.getAllTiles();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = tiles[y][x];
        if (tile.fog.opacity >= 0.5) continue;
        const px = this.offsetX + x * TILE_SIZE;
        const py = this.offsetY + y * TILE_SIZE;
        const corners = [
          { x: px, y: py },
          { x: px + TILE_SIZE, y: py },
          { x: px, y: py + TILE_SIZE },
          { x: px + TILE_SIZE, y: py + TILE_SIZE }
        ];
        const phase = ((x * 7 + y * 13) * 0.15 + now / 180) % (Math.PI * 2);
        const sparkle = 0.5 + 0.5 * Math.sin(phase);
        ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * alpha})`;
        for (const c of corners) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 2.5 + sparkle * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const textProgress = Math.min(this.winAnim.getProgress(now) / 0.5, 1);
    if (textProgress > 0) {
      ctx.globalAlpha = textProgress;
      this.drawWinText(ctx, w, h, now);
    }
    ctx.restore();
  }

  private drawWinText(ctx: CanvasRenderingContext2D, w: number, h: number, now: number): void {
    ctx.save();
    ctx.font = 'bold 48px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000000';
    ctx.strokeText('🎉 恭喜通关！', w / 2, h / 2);

    const pulse = 0.7 + 0.3 * Math.sin(now / 300);
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.fillText('🎉 恭喜通关！', w / 2, h / 2);

    ctx.textAlign = 'left';
    ctx.restore();
  }

  private lerpColorHex(hex1: string, hex2: string, t: number): string {
    const h1 = hex1.replace('#', '');
    const h2 = hex2.replace('#', '');
    const r1 = parseInt(h1.substring(0, 2), 16);
    const g1 = parseInt(h1.substring(2, 4), 16);
    const b1 = parseInt(h1.substring(4, 6), 16);
    const r2 = parseInt(h2.substring(0, 2), 16);
    const g2 = parseInt(h2.substring(2, 4), 16);
    const b2 = parseInt(h2.substring(4, 6), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

if (typeof CanvasRenderingContext2D !== 'undefined' &&
    !(CanvasRenderingContext2D.prototype as any).roundRect) {
  (CanvasRenderingContext2D.prototype as any).roundRect = function(
    x: number, y: number, w: number, h: number, r: number
  ) {
    const radius = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.lineTo(x + w, y + h - radius);
    this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.lineTo(x + radius, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
    return this;
  };
}

window.addEventListener('DOMContentLoaded', () => {
  new PlayerInteraction();
});
