import type { LevelEntity } from '../../shared/types';
import type { EntityManager } from './EntityManager';

interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  color: string;
}

interface EnemyRuntime {
  id: string;
  originX: number;
  direction: 1 | -1;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private entityManager: EntityManager;

  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private mode: 'editor' | 'test' = 'editor';
  private running = false;

  private readonly GRID_SIZE = 32;
  private readonly GRAVITY = 980;
  private readonly JUMP_VELOCITY = -420;
  private readonly MOVE_SPEED = 200;
  private readonly FADE_IN_DURATION = 0.2;
  private readonly INVINCIBILITY_DURATION = 1.5;
  private readonly ENEMY_PATROL_RANGE = 64;
  private readonly ENEMY_PATROL_SPEED = 60;

  private player: PlayerState;
  private playerStartX: number;
  private playerStartY: number;

  private score = 0;
  private lives = 3;
  private invincibleTimer = 0;
  private enemyRuntimes: EnemyRuntime[] = [];
  private entityTimestamps: Map<string, number> = new Map();

  private keys: Set<string> = new Set();

  private selectedEntityId: string | null = null;
  private draggingEntityId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  private entityPlacedCallback: ((entity: LevelEntity) => void) | null = null;
  private entitySelectedCallback: ((entity: LevelEntity | null) => void) | null = null;
  private scoreChangeCallback: ((score: number) => void) | null = null;
  private livesChangeCallback: ((lives: number) => void) | null = null;
  private gameOverCallback: (() => void) | null = null;
  private victoryCallback: (() => void) | null = null;

  private collectibleIds: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement, entityManager: EntityManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.entityManager = entityManager;

    this.playerStartX = 64;
    this.playerStartY = canvas.height - 96;

    this.player = {
      x: this.playerStartX,
      y: this.playerStartY,
      vx: 0,
      vy: 0,
      width: 32,
      height: 32,
      onGround: false,
      color: '#3B82F6',
    };

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.gameLoop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.keys.clear();
  }

  setMode(mode: 'editor' | 'test'): void {
    this.mode = mode;
    if (mode === 'test') {
      this.resetPlayer();
      this.score = 0;
      this.lives = 3;
      this.invincibleTimer = 0;
      this.collectibleIds.clear();
      this.initEnemyRuntimes();
      this.initCollectibleIds();
      this.emitScoreChange();
      this.emitLivesChange();
    } else {
      this.keys.clear();
    }
  }

  resetPlayer(): void {
    this.player.x = this.playerStartX;
    this.player.y = this.playerStartY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onGround = false;
  }

  onEntityPlaced(callback: (entity: LevelEntity) => void): void {
    this.entityPlacedCallback = callback;
  }

  onEntitySelected(callback: (entity: LevelEntity | null) => void): void {
    this.entitySelectedCallback = callback;
  }

  onScoreChange(callback: (score: number) => void): void {
    this.scoreChangeCallback = callback;
  }

  onLivesChange(callback: (lives: number) => void): void {
    this.livesChangeCallback = callback;
  }

  onGameOver(callback: () => void): void {
    this.gameOverCallback = callback;
  }

  onVictory(callback: () => void): void {
    this.victoryCallback = callback;
  }

  getScore(): number {
    return this.score;
  }

  getLives(): number {
    return this.lives;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Space') {
      e.preventDefault();
    }
    this.keys.add(e.code);
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
  }

  private getCanvasPos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private snapToGrid(val: number): number {
    return Math.floor(val / this.GRID_SIZE) * this.GRID_SIZE;
  }

  private findEntityAtPos(x: number, y: number): LevelEntity | null {
    const entities = this.entityManager.getEntities();
    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      if (x >= e.x && x <= e.x + e.width && y >= e.y && y <= e.y + e.height) {
        return e;
      }
    }
    return null;
  }

  private handleMouseDown(e: MouseEvent): void {
    if (this.mode !== 'editor') return;
    const pos = this.getCanvasPos(e);
    const entity = this.findEntityAtPos(pos.x, pos.y);

    if (entity) {
      this.selectedEntityId = entity.id;
      this.draggingEntityId = entity.id;
      this.dragOffsetX = pos.x - entity.x;
      this.dragOffsetY = pos.y - entity.y;
      if (this.entitySelectedCallback) {
        this.entitySelectedCallback(entity);
      }
    } else {
      this.selectedEntityId = null;
      if (this.entitySelectedCallback) {
        this.entitySelectedCallback(null);
      }
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.mode !== 'editor' || !this.draggingEntityId) return;
    const pos = this.getCanvasPos(e);
    const snappedX = this.snapToGrid(pos.x - this.dragOffsetX);
    const snappedY = this.snapToGrid(pos.y - this.dragOffsetY);
    this.entityManager.updateEntity(this.draggingEntityId, { x: snappedX, y: snappedY });
  }

  private handleMouseUp(): void {
    this.draggingEntityId = null;
  }

  private initEnemyRuntimes(): void {
    this.enemyRuntimes = [];
    const entities = this.entityManager.getEntities();
    for (const entity of entities) {
      if (entity.type === 'enemy') {
        this.enemyRuntimes.push({
          id: entity.id,
          originX: entity.x,
          direction: 1,
        });
      }
    }
  }

  private initCollectibleIds(): void {
    this.collectibleIds.clear();
    const entities = this.entityManager.getEntities();
    for (const entity of entities) {
      if (entity.type === 'collectible') {
        this.collectibleIds.add(entity.id);
      }
    }
  }

  private emitScoreChange(): void {
    if (this.scoreChangeCallback) {
      this.scoreChangeCallback(this.score);
    }
  }

  private emitLivesChange(): void {
    if (this.livesChangeCallback) {
      this.livesChangeCallback(this.lives);
    }
  }

  private gameLoop(timestamp: number): void {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (this.mode === 'test') {
      this.updateTest(dt);
    }

    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  }

  private updateTest(dt: number): void {
    this.updatePlayerInput();
    this.updatePlayerPhysics(dt);
    this.updateEnemyPatrol(dt);
    this.checkCollisions();
    this.checkFallOffScreen();

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }
  }

  private updatePlayerInput(): void {
    this.player.vx = 0;
    if (this.keys.has('ArrowLeft')) {
      this.player.vx = -this.MOVE_SPEED;
    }
    if (this.keys.has('ArrowRight')) {
      this.player.vx = this.MOVE_SPEED;
    }
    if (this.keys.has('Space') && this.player.onGround) {
      this.player.vy = this.JUMP_VELOCITY;
      this.player.onGround = false;
    }
  }

  private updatePlayerPhysics(dt: number): void {
    this.player.vy += this.GRAVITY * dt;

    this.player.x += this.player.vx * dt;
    this.resolveHorizontalCollisions();

    this.player.y += this.player.vy * dt;
    this.resolveVerticalCollisions();

    if (this.player.x < 0) {
      this.player.x = 0;
    }
    if (this.player.x + this.player.width > this.canvas.width) {
      this.player.x = this.canvas.width - this.player.width;
    }
  }

  private getPlatforms(): LevelEntity[] {
    return this.entityManager.getEntities().filter(e => e.type === 'platform');
  }

  private getEnemies(): LevelEntity[] {
    return this.entityManager.getEntities().filter(e => e.type === 'enemy');
  }

  private getCollectibles(): LevelEntity[] {
    return this.entityManager.getEntities().filter(e => e.type === 'collectible' && this.collectibleIds.has(e.id));
  }

  private aabbOverlap(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number,
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  private resolveHorizontalCollisions(): void {
    const platforms = this.getPlatforms();
    for (const p of platforms) {
      if (this.aabbOverlap(this.player.x, this.player.y, this.player.width, this.player.height, p.x, p.y, p.width, p.height)) {
        if (this.player.vx > 0) {
          this.player.x = p.x - this.player.width;
        } else if (this.player.vx < 0) {
          this.player.x = p.x + p.width;
        }
        this.player.vx = 0;
      }
    }
  }

  private resolveVerticalCollisions(): void {
    this.player.onGround = false;
    const platforms = this.getPlatforms();
    for (const p of platforms) {
      if (this.aabbOverlap(this.player.x, this.player.y, this.player.width, this.player.height, p.x, p.y, p.width, p.height)) {
        if (this.player.vy > 0) {
          this.player.y = p.y - this.player.height;
          this.player.vy = 0;
          this.player.onGround = true;
        } else if (this.player.vy < 0) {
          this.player.y = p.y + p.height;
          this.player.vy = 0;
        }
      }
    }
  }

  private updateEnemyPatrol(dt: number): void {
    for (const runtime of this.enemyRuntimes) {
      const entity = this.entityManager.getEntityById(runtime.id);
      if (!entity) continue;
      const props = entity.properties as { movementType: 'fixed' | 'patrol' };
      if (props.movementType !== 'patrol') continue;

      const newX = entity.x + runtime.direction * this.ENEMY_PATROL_SPEED * dt;
      if (newX > runtime.originX + this.ENEMY_PATROL_RANGE) {
        runtime.direction = -1;
        this.entityManager.updateEntity(runtime.id, { x: runtime.originX + this.ENEMY_PATROL_RANGE });
      } else if (newX < runtime.originX - this.ENEMY_PATROL_RANGE) {
        runtime.direction = 1;
        this.entityManager.updateEntity(runtime.id, { x: runtime.originX - this.ENEMY_PATROL_RANGE });
      } else {
        this.entityManager.updateEntity(runtime.id, { x: newX });
      }
    }
  }

  private checkCollisions(): void {
    this.checkEnemyCollisions();
    this.checkCollectibleCollisions();
  }

  private checkEnemyCollisions(): void {
    if (this.invincibleTimer > 0) return;

    const enemies = this.getEnemies();
    for (const enemy of enemies) {
      if (this.aabbOverlap(this.player.x, this.player.y, this.player.width, this.player.height, enemy.x, enemy.y, enemy.width, enemy.height)) {
        this.lives--;
        this.invincibleTimer = this.INVINCIBILITY_DURATION;
        this.resetPlayer();
        this.emitLivesChange();

        if (this.lives <= 0 && this.gameOverCallback) {
          this.gameOverCallback();
        }
        return;
      }
    }
  }

  private checkCollectibleCollisions(): void {
    const collectibles = this.getCollectibles();
    for (const col of collectibles) {
      if (this.aabbOverlap(this.player.x, this.player.y, this.player.width, this.player.height, col.x, col.y, col.width, col.height)) {
        const props = col.properties as { score: number };
        this.score += props.score;
        this.collectibleIds.delete(col.id);
        this.emitScoreChange();

        if (this.collectibleIds.size === 0 && this.victoryCallback) {
          this.victoryCallback();
        }
        return;
      }
    }
  }

  private checkFallOffScreen(): void {
    if (this.invincibleTimer > 0) return;

    if (this.player.y > this.canvas.height) {
      this.lives--;
      this.invincibleTimer = this.INVINCIBILITY_DURATION;
      this.resetPlayer();
      this.emitLivesChange();

      if (this.lives <= 0 && this.gameOverCallback) {
        this.gameOverCallback();
      }
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    this.renderGrid();

    if (this.mode === 'editor') {
      this.renderEntities();
      this.renderSelection();
    } else {
      this.renderEntities();
      this.renderPlayer();
    }
  }

  private renderGrid(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= w; x += this.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y += this.GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private getEntityOpacity(id: string): number {
    const timestamp = this.entityTimestamps.get(id);
    if (timestamp === undefined) return 1;
    const elapsed = (performance.now() - timestamp) / 1000;
    return Math.min(elapsed / this.FADE_IN_DURATION, 1);
  }

  private renderEntities(): void {
    const entities = this.entityManager.getEntities();
    const now = performance.now();

    for (const entity of entities) {
      const opacity = this.getEntityOpacity(entity.id);
      ctx_saveAlpha(this.ctx, opacity, () => {
        switch (entity.type) {
          case 'platform':
            this.renderPlatform(entity);
            break;
          case 'enemy':
            this.renderEnemy(entity);
            break;
          case 'collectible':
            this.renderCollectible(entity);
            break;
        }
      });
    }
  }

  private renderPlatform(entity: LevelEntity): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#64748B';
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.strokeRect(entity.x, entity.y, entity.width, entity.height);
  }

  private renderEnemy(entity: LevelEntity): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height);

    const eyeSize = 4;
    const eyeY = entity.y + entity.height * 0.3;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(entity.x + entity.width * 0.25 - eyeSize / 2, eyeY, eyeSize, eyeSize);
    ctx.fillRect(entity.x + entity.width * 0.75 - eyeSize / 2, eyeY, eyeSize, eyeSize);
  }

  private renderCollectible(entity: LevelEntity): void {
    const ctx = this.ctx;
    const cx = entity.x + entity.width / 2;
    const cy = entity.y + entity.height / 2;
    const r = Math.min(entity.width, entity.height) / 2 - 2;

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FDE68A';
    const sparkleAngle = (performance.now() / 300) % (Math.PI * 2);
    const sparkleX = cx + Math.cos(sparkleAngle) * r * 0.4;
    const sparkleY = cy + Math.sin(sparkleAngle) * r * 0.4;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderSelection(): void {
    if (!this.selectedEntityId) return;
    const entity = this.entityManager.getEntityById(this.selectedEntityId);
    if (!entity) return;

    const ctx = this.ctx;
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(entity.x - 2, entity.y - 2, entity.width + 4, entity.height + 4);
    ctx.setLineDash([]);
  }

  private renderPlayer(): void {
    const ctx = this.ctx;

    if (this.invincibleTimer > 0) {
      const flashRate = 8;
      const visible = Math.floor(this.invincibleTimer * flashRate) % 2 === 0;
      if (!visible) return;
    }

    ctx.fillStyle = this.player.color;
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    ctx.fillStyle = '#FFFFFF';
    const eyeSize = 4;
    const eyeY = this.player.y + this.player.height * 0.3;
    ctx.fillRect(this.player.x + this.player.width * 0.25 - eyeSize / 2, eyeY, eyeSize, eyeSize);
    ctx.fillRect(this.player.x + this.player.width * 0.75 - eyeSize / 2, eyeY, eyeSize, eyeSize);
  }

  trackEntityPlacement(id: string): void {
    this.entityTimestamps.set(id, performance.now());
  }

  clearEntityTimestamps(): void {
    this.entityTimestamps.clear();
  }
}

function ctx_saveAlpha(ctx: CanvasRenderingContext2D, opacity: number, fn: () => void): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  fn();
  ctx.restore();
}
