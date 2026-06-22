import * as PIXI from 'pixi.js';
import { MapManager } from './MapManager';

export interface PlayerEvents {
  onTreasureCollected?: (gx: number, gy: number) => void;
  onBlocked?: (gx: number, gy: number) => void;
  onMove?: () => void;
}

export class Player {
  public gridX: number;
  public gridY: number;
  public targetGridX: number;
  public targetGridY: number;
  public renderX: number = 0;
  public renderY: number = 0;
  public viewRadius: number = 2;
  public treasureCount: number = 0;
  public isMoving: boolean = false;

  private readonly moveDuration: number = 0.3;
  private moveTimer: number = 0;
  private moveStartX: number = 0;
  private moveStartY: number = 0;
  private mountainExtraDelay: number = 0;

  private sprite: PIXI.Sprite;
  private glow: PIXI.Graphics;
  private container: PIXI.Container;
  private mapManager: MapManager;
  private app: PIXI.Application;
  private events: PlayerEvents;

  private particles: PIXI.ParticleContainer | null = null;
  private particlePool: PIXI.Sprite[] = [];
  private activeParticles: Array<{
    sprite: PIXI.Sprite;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
  }> = [];

  constructor(app: PIXI.Application, mapManager: MapManager, events: PlayerEvents = {}) {
    this.app = app;
    this.mapManager = mapManager;
    this.events = events;

    this.gridX = Math.floor(mapManager.gridWidth / 2);
    this.gridY = Math.floor(mapManager.gridHeight / 2);
    this.targetGridX = this.gridX;
    this.targetGridY = this.gridY;

    this.container = new PIXI.Container();
    app.stage.addChild(this.container);

    this.glow = new PIXI.Graphics();
    this.container.addChild(this.glow);

    this.sprite = new PIXI.Sprite(this.createPlayerTexture());
    this.sprite.anchor.set(0.5);
    this.container.addChild(this.sprite);

    this.particles = new PIXI.ParticleContainer(200, {
      position: true,
      alpha: true,
      scale: true,
      rotation: true
    });
    app.stage.addChild(this.particles);

    this.updatePosition();
  }

  private createPlayerTexture(): PIXI.Texture {
    const size = 64;
    const g = new PIXI.Graphics();
    g.beginFill(0x2a1a0e, 0.5);
    g.drawEllipse(size / 2, size - 6, 14, 4);
    g.endFill();
    g.lineStyle(2, 0x5a3d1e, 1);
    g.beginFill(0xb8860b);
    g.moveTo(size / 2, 8);
    g.lineTo(size / 2 + 14, 22);
    g.lineTo(size / 2 + 14, 30);
    g.lineTo(size / 2 + 10, 32);
    g.lineTo(size / 2 + 10, 26);
    g.lineTo(size / 2 - 10, 26);
    g.lineTo(size / 2 - 10, 32);
    g.lineTo(size / 2 - 14, 30);
    g.lineTo(size / 2 - 14, 22);
    g.closePath();
    g.endFill();
    g.lineStyle(2, 0x8b6914, 1);
    g.beginFill(0xd4a01a);
    g.moveTo(size / 2, 12);
    g.lineTo(size / 2 + 10, 22);
    g.lineTo(size / 2 - 10, 22);
    g.closePath();
    g.endFill();
    g.lineStyle(1.5, 0x3d2817, 1);
    g.beginFill(0xe8c8a0);
    g.drawCircle(size / 2, 36, 8);
    g.endFill();
    g.beginFill(0x2a1a0e);
    g.drawCircle(size / 2 - 3, 35, 1.5);
    g.drawCircle(size / 2 + 3, 35, 1.5);
    g.endFill();
    g.lineStyle(1, 0x8b4513, 0.7);
    g.moveTo(size / 2 - 3, 40);
    g.quadraticCurveTo(size / 2, 42, size / 2 + 3, 40);
    g.lineStyle(2, 0x5a3d1e, 1);
    g.beginFill(0x8b5a2b);
    g.drawRoundedRect(size / 2 - 10, 44, 20, 14, 2);
    g.endFill();
    g.lineStyle(1, 0xd4a01a, 0.8);
    g.moveTo(size / 2 - 8, 49);
    g.lineTo(size / 2 + 8, 49);
    return this.app.renderer.generateTexture(g, PIXI.SCALE_MODES.LINEAR, 1, new PIXI.Rectangle(0, 0, size, size));
  }

  public updatePosition(): void {
    const pos = this.mapManager.gridToWorld(this.gridX, this.gridY);
    this.renderX = pos.x;
    this.renderY = pos.y;
    this.sprite.x = this.renderX;
    this.sprite.y = this.renderY;
    const s = this.mapManager.cellSize / 64 * 1.3;
    this.sprite.scale.set(s);
    this.updateGlow();
  }

  private updateGlow(): void {
    this.glow.clear();
    const cs = this.mapManager.cellSize;
    const radius = (this.viewRadius + 0.5) * cs;
    const cx = this.sprite.width / 2;
    const cy = this.sprite.height / 2;
    for (let i = 3; i >= 0; i--) {
      const r = radius * (0.4 + i * 0.2);
      const alpha = 0.04 * (4 - i);
      this.glow.beginFill(0xffe066, alpha);
      this.glow.drawCircle(cx, cy, r);
      this.glow.endFill();
    }
  }

  public tryMove(dx: number, dy: number): void {
    if (this.isMoving) return;
    if (dx === 0 && dy === 0) return;
    const nx = this.gridX + dx;
    const ny = this.gridY + dy;
    if (!this.mapManager.isInBounds(nx, ny)) return;
    if (!this.mapManager.isPassable(nx, ny)) {
      this.showBlockedFeedback(nx, ny);
      if (this.events.onBlocked) this.events.onBlocked(nx, ny);
      return;
    }
    this.startMove(nx, ny);
  }

  private startMove(nx: number, ny: number): void {
    this.targetGridX = nx;
    this.targetGridY = ny;
    this.isMoving = true;
    this.moveTimer = 0;
    const startPos = this.mapManager.gridToWorld(this.gridX, this.gridY);
    this.moveStartX = startPos.x;
    this.moveStartY = startPos.y;
    const cost = this.mapManager.getMoveCost(nx, ny);
    this.mountainExtraDelay = cost > 1 ? (cost - 1) * this.moveDuration : 0;
    if (this.events.onMove) this.events.onMove();
  }

  private finishMove(): void {
    this.gridX = this.targetGridX;
    this.gridY = this.targetGridY;
    this.isMoving = false;
    this.mapManager.revealArea(this.gridX, this.gridY, this.viewRadius);
    const cell = this.mapManager.getCell(this.gridX, this.gridY);
    if (cell && cell.hasTreasure) {
      this.collectTreasure();
    }
  }

  private collectTreasure(): void {
    const gx = this.gridX;
    const gy = this.gridY;
    this.treasureCount++;
    this.mapManager.removeTreasureAt(gx, gy);
    this.spawnTreasureParticles();
    if (this.events.onTreasureCollected) this.events.onTreasureCollected(gx, gy);
  }

  public spawnTreasureParticles(): void {
    if (!this.particles) return;
    const pos = this.mapManager.gridToWorld(this.gridX, this.gridY);
    for (let i = 0; i < 40; i++) {
      this.emitParticle(pos.x, pos.y);
    }
  }

  private emitParticle(x: number, y: number): void {
    if (!this.particles) return;
    let sprite: PIXI.Sprite;
    if (this.particlePool.length > 0) {
      sprite = this.particlePool.pop()!;
      sprite.visible = true;
    } else {
      sprite = new PIXI.Sprite(this.createParticleTexture());
      sprite.anchor.set(0.5);
      this.particles.addChild(sprite);
    }
    sprite.x = x;
    sprite.y = y;
    sprite.alpha = 1;
    sprite.scale.set(0.6 + Math.random() * 0.8);
    sprite.rotation = Math.random() * Math.PI * 2;
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 160;
    const life = 0.8 + Math.random() * 0.6;
    this.activeParticles.push({
      sprite,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life
    });
  }

  private createParticleTexture(): PIXI.Texture {
    const size = 16;
    const g = new PIXI.Graphics();
    g.beginFill(0xffd700);
    g.drawStar(size / 2, size / 2, 5, size / 2 - 1, size / 4);
    g.endFill();
    g.beginFill(0xffffaa);
    g.drawStar(size / 2, size / 2, 4, size / 3, size / 6);
    g.endFill();
    return this.app.renderer.generateTexture(g, PIXI.SCALE_MODES.LINEAR, 1, new PIXI.Rectangle(0, 0, size, size));
  }

  private showBlockedFeedback(gx: number, gy: number): void {
    if (!this.particles) return;
    const pos = this.mapManager.gridToWorld(gx, gy);
    for (let i = 0; i < 12; i++) {
      this.emitBlockedParticle(pos.x, pos.y);
    }
  }

  private emitBlockedParticle(x: number, y: number): void {
    if (!this.particles) return;
    let sprite: PIXI.Sprite;
    if (this.particlePool.length > 0) {
      sprite = this.particlePool.pop()!;
      sprite.visible = true;
    } else {
      sprite = new PIXI.Sprite(this.createBlockedParticleTexture());
      sprite.anchor.set(0.5);
      this.particles.addChild(sprite);
    }
    sprite.x = x;
    sprite.y = y;
    sprite.alpha = 1;
    sprite.scale.set(0.8 + Math.random() * 0.5);
    sprite.rotation = Math.random() * Math.PI * 2;
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 80;
    const life = 0.4 + Math.random() * 0.3;
    this.activeParticles.push({
      sprite,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life
    });
  }

  private createBlockedParticleTexture(): PIXI.Texture {
    const size = 16;
    const g = new PIXI.Graphics();
    g.lineStyle(2, 0xff4444, 1);
    g.beginFill(0xff6666, 0.9);
    g.drawCircle(size / 2, size / 2, size / 2 - 1);
    g.endFill();
    g.lineStyle(2, 0xffffff, 1);
    g.moveTo(size / 2 - 4, size / 2 - 4);
    g.lineTo(size / 2 + 4, size / 2 + 4);
    g.moveTo(size / 2 + 4, size / 2 - 4);
    g.lineTo(size / 2 - 4, size / 2 + 4);
    return this.app.renderer.generateTexture(g, PIXI.SCALE_MODES.LINEAR, 1, new PIXI.Rectangle(0, 0, size, size));
  }

  public update(delta: number): void {
    const dt = delta / 60;
    if (this.isMoving) {
      this.moveTimer += dt;
      const totalDur = this.moveDuration + this.mountainExtraDelay;
      if (this.moveTimer >= totalDur) {
        this.moveTimer = totalDur;
        this.isMoving = false;
        this.finishMove();
      }
      const t = Math.min(1, this.moveTimer / this.moveDuration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const endPos = this.mapManager.gridToWorld(this.targetGridX, this.targetGridY);
      this.renderX = this.moveStartX + (endPos.x - this.moveStartX) * ease;
      this.renderY = this.moveStartY + (endPos.y - this.moveStartY) * ease;
      this.sprite.x = this.renderX;
      this.sprite.y = this.renderY;
    } else {
      this.updatePosition();
    }
    this.sprite.y += Math.sin(performance.now() / 300) * 0.5;
    this.updateParticles(dt);
  }

  private updateParticles(dt: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.sprite.visible = false;
        this.particlePool.push(p.sprite);
        this.activeParticles.splice(i, 1);
        continue;
      }
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;
      p.vy += 200 * dt;
      p.sprite.alpha = p.life / p.maxLife;
      p.sprite.rotation += dt * 4;
      p.sprite.scale.set(p.sprite.scale.x * 0.98);
    }
  }

  public resize(): void {
    this.updatePosition();
  }

  public destroy(): void {
    this.app.stage.removeChild(this.container);
    if (this.particles) this.app.stage.removeChild(this.particles);
  }
}
