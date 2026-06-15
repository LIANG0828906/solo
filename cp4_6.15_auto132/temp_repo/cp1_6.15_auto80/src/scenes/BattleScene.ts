import Phaser from 'phaser';
import { GestureData } from '../handGesture';

interface LevelConfig {
  waves: Array<{
    normalCount: number;
    armoredCount: number;
    speed: number;
  }>;
  path: Array<{ x: number; y: number }>;
}

interface Monster {
  id: string;
  type: 'normal' | 'armored';
  sprite: Phaser.GameObjects.Shape;
  glowSprite: Phaser.GameObjects.Shape;
  healthBar: Phaser.GameObjects.Graphics;
  health: number;
  maxHealth: number;
  speed: number;
  totalDistance: number;
  isHit: boolean;
  hitTimer: number;
}

interface Tower {
  id: string;
  x: number;
  y: number;
  range: number;
  lastShotTime: number;
  attackCooldown: number;
  container: Phaser.GameObjects.Container;
}

interface Arrow {
  id: string;
  sprite: Phaser.GameObjects.Rectangle;
  glowSprite: Phaser.GameObjects.Rectangle;
  emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  target: Monster | null;
  startX: number;
  startY: number;
  progress: number;
  duration: number;
}

export class BattleScene extends Phaser.Scene {
  private levelConfig: LevelConfig | null = null;
  private highScores: Array<{ score: number; name: string; date: string }> = [];

  private health: number = 100;
  private gold: number = 100;
  private score: number = 0;
  private killCount: number = 0;
  private currentWave: number = 0;
  private waveTimer: number = 0;
  private waveInterval: number = 8000;
  private isWaveActive: boolean = false;
  private isGameOver: boolean = false;

  private monsters: Monster[] = [];
  private towers: Tower[] = [];
  private arrows: Arrow[] = [];
  private deathParticles: Array<{
    sprite: Phaser.GameObjects.Shape;
    vx: number; vy: number; life: number; maxLife: number;
  }> = [];

  private pathSegmentLengths: number[] = [];
  private pathTotalLength: number = 0;

  private aimingRing!: Phaser.GameObjects.Arc;
  private aimingRingGlow!: Phaser.GameObjects.Arc;
  private isAiming: boolean = false;
  private targetAimX: number = 0;
  private targetAimY: number = 0;
  private currentAimX: number = 0;
  private currentAimY: number = 0;

  private healthText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;

  private lastGestureType: string = 'none';
  private gestureCooldown: number = 0;
  private arrowCooldown: number = 0;

  private gridSize: number = 60;

  private gameOverContainer!: Phaser.GameObjects.Container;
  private blurFilter!: Phaser.Filters.Blur;
  private renderTexture!: Phaser.GameObjects.RenderTexture;

  constructor() {
    super('BattleScene');
  }

  init(data: { levelConfig: LevelConfig; highScores: Array<{ score: number; name: string; date: string }> }): void {
    this.levelConfig = data.levelConfig || this.getDefaultLevelConfig();
    this.highScores = data.highScores || [];

    this.health = 100;
    this.gold = 100;
    this.score = 0;
    this.killCount = 0;
    this.currentWave = 0;
    this.waveTimer = 0;
    this.isWaveActive = false;
    this.isGameOver = false;

    this.monsters = [];
    this.towers = [];
    this.arrows = [];
    this.deathParticles = [];

    this.isAiming = false;
    this.lastGestureType = 'none';
    this.gestureCooldown = 0;
    this.arrowCooldown = 0;

    this.computePathLengths();
  }

  private computePathLengths(): void {
    this.pathSegmentLengths = [];
    this.pathTotalLength = 0;
    if (!this.levelConfig) return;
    if (!this.levelConfig.path || !Array.isArray(this.levelConfig.path) || this.levelConfig.path.length < 2) {
      this.levelConfig.path = this.getDefaultLevelConfig().path;
    }
    const path = this.levelConfig.path;
    for (let i = 0; i < path.length - 1; i++) {
      const len = Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
      this.pathSegmentLengths.push(len);
      this.pathTotalLength += len;
    }
  }

  private getPositionAtDistance(dist: number): { x: number; y: number } | null {
    if (!this.levelConfig) return null;
    const path = this.levelConfig.path;
    let remaining = dist;
    for (let i = 0; i < this.pathSegmentLengths.length; i++) {
      const segLen = this.pathSegmentLengths[i];
      if (remaining <= segLen) {
        const t = segLen > 0 ? remaining / segLen : 0;
        return {
          x: path[i].x + (path[i + 1].x - path[i].x) * t,
          y: path[i].y + (path[i + 1].y - path[i].y) * t
        };
      }
      remaining -= segLen;
    }
    return { x: path[path.length - 1].x, y: path[path.length - 1].y };
  }

  create(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.createBackground(w, h);
    this.createGrid(w, h);
    this.createPath();
    this.createUI();
    this.createAimingRing();

    this.time.delayedCall(2000, () => {
      this.startNextWave();
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    if (this.gestureCooldown > 0) this.gestureCooldown -= delta;
    if (this.arrowCooldown > 0) this.arrowCooldown -= delta;

    if (this.isAiming) this.updateAimingRing();

    if (!this.isWaveActive && this.currentWave < (this.levelConfig?.waves.length || 0)) {
      this.waveTimer += delta;
      if (this.waveTimer >= this.waveInterval) this.startNextWave();
    }

    this.updateMonsters(delta);
    this.updateTowers();
    this.updateArrows(delta);
    this.updateDeathParticles(delta);
    this.checkWaveComplete();
  }

  handleGesture(data: GestureData): void {
    if (this.isGameOver) return;

    const { type, palmX, palmY } = data;

    if (type === 'open') {
      this.isAiming = true;
      this.targetAimX = palmX;
      this.targetAimY = palmY;
      this.showAimingRing();
    } else {
      this.hideAimingRing();
      this.isAiming = false;
    }

    if (this.gestureCooldown <= 0) {
      if (type === 'fist' && this.lastGestureType !== 'fist') {
        this.buildTower(palmX, palmY);
        this.gestureCooldown = 500;
      } else if (type === 'pointing' && this.lastGestureType !== 'pointing') {
        this.castSpell();
        this.gestureCooldown = 300;
      }
    }

    this.lastGestureType = type;
  }

  private createBackground(w: number, h: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x2a1a4e, 0x1a0a2e, 0x0a051e, 1);
    bg.fillRect(0, 0, w, h);
  }

  private createGrid(w: number, h: number): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x4a7acf, 0.2);
    for (let x = 0; x <= w; x += this.gridSize) {
      grid.beginPath();
      grid.moveTo(x, 0);
      grid.lineTo(x, h);
      grid.strokePath();
    }
    for (let y = 0; y <= h; y += this.gridSize) {
      grid.beginPath();
      grid.moveTo(0, y);
      grid.lineTo(w, y);
      grid.strokePath();
    }
  }

  private createPath(): void {
    if (!this.levelConfig) return;
    const path = this.levelConfig.path;

    const glow = this.add.graphics();
    glow.lineStyle(10, 0x3a7a5f, 0.2);
    glow.beginPath();
    glow.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) glow.lineTo(path[i].x, path[i].y);
    glow.strokePath();

    const line = this.add.graphics();
    line.lineStyle(4, 0x3a7a5f, 0.8);
    line.beginPath();
    line.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) line.lineTo(path[i].x, path[i].y);
    line.strokePath();

    const dashLen = 15;
    const gapLen = 10;
    const dash = this.add.graphics();
    dash.lineStyle(2, 0x5aba7f, 0.5);
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const dx = (p2.x - p1.x) / segLen;
      const dy = (p2.y - p1.y) / segLen;
      let d = 0;
      while (d < segLen) {
        const endD = Math.min(d + dashLen, segLen);
        dash.beginPath();
        dash.moveTo(p1.x + dx * d, p1.y + dy * d);
        dash.lineTo(p1.x + dx * endD, p1.y + dy * endD);
        dash.strokePath();
        d = endD + gapLen;
      }
    }

    const entranceGlow = this.add.circle(path[0].x, path[0].y, 25, 0x3a7a5f, 0.3);
    const entrance = this.add.circle(path[0].x, path[0].y, 20, 0x3a7a5f, 0.6);
    this.tweens.add({
      targets: [entrance, entranceGlow],
      alpha: { from: 0.6, to: 0.3 },
      duration: 1500, yoyo: true, repeat: -1
    });

    const exitGlow = this.add.circle(path[path.length - 1].x, path[path.length - 1].y, 25, 0xff4444, 0.3);
    const exit = this.add.circle(path[path.length - 1].x, path[path.length - 1].y, 20, 0xff4444, 0.6);
    this.tweens.add({
      targets: [exit, exitGlow],
      alpha: { from: 0.6, to: 0.3 },
      duration: 1500, yoyo: true, repeat: -1
    });
  }

  private createUI(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const px = w * 0.015;
    const py = h - h * 0.065;
    const pw = Math.max(200, w * 0.15);
    const ph = Math.max(50, h * 0.05);

    const panelShadow = this.add.graphics();
    panelShadow.fillStyle(0x000000, 0.3);
    panelShadow.fillRoundedRect(px + 2, py + 2, pw, ph, 4);

    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4e, 0.8);
    panel.lineStyle(2, 0x4a7acf, 0.8);
    panel.strokeRoundedRect(px, py, pw, ph, 4);
    panel.fillRoundedRect(px, py, pw, ph, 4);

    const heartX = px + pw * 0.12;
    const heartY = py + ph * 0.5;
    this.add.circle(heartX, heartY, 14, 0xff4444, 0.3);
    this.add.circle(heartX, heartY, 12, 0xff4444);
    this.drawHeart(heartX, heartY, 10);

    this.healthText = this.add.text(px + pw * 0.24, py + ph * 0.25, '100', {
      fontSize: `${Math.max(16, h * 0.02)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffffff', fontStyle: 'bold'
    });

    const goldX = px + pw * 0.58;
    this.add.circle(goldX, heartY, 14, 0xffd700, 0.3);
    this.add.circle(goldX, heartY, 12, 0xffd700);

    this.goldText = this.add.text(px + pw * 0.7, py + ph * 0.25, '100', {
      fontSize: `${Math.max(16, h * 0.02)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffffff', fontStyle: 'bold'
    });

    this.waveText = this.add.text(w * 0.5, h * 0.055, `波次: 0 / ${this.levelConfig?.waves.length || 5}`, {
      fontSize: `${Math.max(18, h * 0.022)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#a0c4ff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.scoreText = this.add.text(w * 0.985, h * 0.92, '得分: 0', {
      fontSize: `${Math.max(16, h * 0.02)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(1, 0);
  }

  private drawHeart(x: number, y: number, size: number): void {
    const heart = this.add.graphics();
    heart.fillStyle(0xff4444, 1);
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    const seg = 20;
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      const px = 16 * Math.pow(Math.sin(t), 3);
      const py = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      pts.push({ x: x + (px * size / 16), y: y + (py * size / 16) });
    }
    heart.beginPath();
    heart.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) heart.lineTo(pts[i].x, pts[i].y);
    heart.closePath();
    heart.fillPath();
  }

  private createAimingRing(): void {
    this.aimingRingGlow = this.add.arc(0, 0, 38, 0, 360, false, 0x4a9aff, 0.2);
    this.aimingRingGlow.setVisible(false).setDepth(99);

    this.aimingRing = this.add.arc(0, 0, 30, 0, 360, false, 0x4a9aff, 0.5);
    this.aimingRing.setStrokeStyle(2, 0x4a9aff, 0.8);
    this.aimingRing.setVisible(false).setDepth(100);

    this.tweens.add({
      targets: [this.aimingRing, this.aimingRingGlow],
      alpha: { from: 0.5, to: 0.8 },
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  private showAimingRing(): void {
    this.aimingRing.setVisible(true);
    this.aimingRingGlow.setVisible(true);
  }

  private hideAimingRing(): void {
    this.aimingRing.setVisible(false);
    this.aimingRingGlow.setVisible(false);
  }

  private updateAimingRing(): void {
    const lf = 0.1;
    this.currentAimX += (this.targetAimX - this.currentAimX) * lf;
    this.currentAimY += (this.targetAimY - this.currentAimY) * lf;
    this.aimingRing.setPosition(this.currentAimX, this.currentAimY);
    this.aimingRingGlow.setPosition(this.currentAimX, this.currentAimY);
    const pulse = Math.sin(Date.now() / 500) * 5;
    this.aimingRing.setRadius(30 + pulse);
    this.aimingRingGlow.setRadius(38 + pulse);
  }

  private buildTower(x: number, y: number): void {
    if (this.gold < 30) {
      this.showFloatingText(x, y, '金币不足!', 0xff4444);
      return;
    }
    const snapX = Math.round(x / this.gridSize) * this.gridSize;
    const snapY = Math.round(y / this.gridSize) * this.gridSize;
    if (this.isOnPath(snapX, snapY)) {
      this.showFloatingText(x, y, '不能在路径上建造!', 0xff4444);
      return;
    }
    if (this.towers.find(t => Math.abs(t.x - snapX) < this.gridSize / 2 && Math.abs(t.y - snapY) < this.gridSize / 2)) {
      this.showFloatingText(x, y, '此处已有箭塔!', 0xff4444);
      return;
    }

    this.gold -= 30;
    this.updateGoldDisplay();

    const base = this.add.rectangle(0, 10, 40, 15, 0x4a3a2a).setStrokeStyle(2, 0x6a5a4a);
    const body = this.add.rectangle(0, -10, 30, 50, 0x5a6a8a).setStrokeStyle(2, 0x7a8aaa);
    const top = this.add.triangle(0, -45, -20, 10, 20, 10, 0, -20, 0x8a5aaa).setStrokeStyle(2, 0xaa7aca);

    const container = this.add.container(snapX, snapY + 30, [base, body, top]);
    container.setScale(0);

    const flash = this.add.rectangle(snapX, snapY, 50, 60, 0xffffff, 0);

    this.tweens.add({
      targets: container,
      scale: { from: 0, to: 1 },
      y: { from: snapY + 30, to: snapY },
      duration: 300, ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: flash,
      alpha: { from: 0.8, to: 0 },
      duration: 300, ease: 'Power2.easeOut',
      onComplete: () => flash.destroy()
    });

    this.towers.push({
      id: `tower_${Date.now()}`,
      x: snapX, y: snapY,
      range: 200,
      lastShotTime: 0,
      attackCooldown: 1500,
      container
    });

    this.showFloatingText(x, y, '-30 金币', 0xffd700);
  }

  private isOnPath(x: number, y: number): boolean {
    if (!this.levelConfig) return false;
    const path = this.levelConfig.path;
    for (let i = 0; i < path.length - 1; i++) {
      if (this.pointToSegDist(x, y, path[i].x, path[i].y, path[i + 1].x, path[i + 1].y) < 40) return true;
    }
    return false;
  }

  private pointToSegDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((px - x1) * dx + (py - y1) * dy) / lenSq : -1;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  private castSpell(): void {
    if (this.arrowCooldown > 0) return;
    if (this.towers.length === 0) {
      this.showFloatingText(this.cameras.main.width * 0.5, this.cameras.main.height * 0.5, '需要先建造箭塔!', 0xff4444);
      return;
    }
    const nearestMonster = this.findNearestMonster();
    if (!nearestMonster) {
      this.showFloatingText(this.cameras.main.width * 0.5, this.cameras.main.height * 0.5, '没有可攻击的目标!', 0xffaa00);
      return;
    }
    const tower = this.findNearestTowerInRange(nearestMonster);
    if (!tower) {
      const anyTower = this.towers[0];
      this.fireArrow(anyTower, nearestMonster);
    } else {
      this.fireArrow(tower, nearestMonster);
    }
    this.arrowCooldown = 200;
  }

  private findNearestMonster(): Monster | null {
    let nearest: Monster | null = null;
    let minDist = Infinity;
    for (const m of this.monsters) {
      if (m.health <= 0) continue;
      const d = m.totalDistance;
      if (d > 0 && d < minDist) {
        minDist = d;
        nearest = m;
      }
    }
    if (!nearest) {
      for (const m of this.monsters) {
        if (m.health <= 0) continue;
        const cx = this.cameras.main.width * 0.5;
        const cy = this.cameras.main.height * 0.5;
        const d = Math.hypot(m.sprite.x - cx, m.sprite.y - cy);
        if (d < minDist) { minDist = d; nearest = m; }
      }
    }
    return nearest;
  }

  private findNearestTowerInRange(monster: Monster): Tower | null {
    let nearest: Tower | null = null;
    let minDist = Infinity;
    for (const t of this.towers) {
      const d = Math.hypot(t.x - monster.sprite.x, t.y - monster.sprite.y);
      if (d <= t.range && d < minDist) { minDist = d; nearest = t; }
    }
    return nearest;
  }

  private fireArrow(tower: Tower, monster: Monster): void {
    const startX = tower.x;
    const startY = tower.y - 20;

    const arrowGlow = this.add.rectangle(startX, startY, 18, 5, 0x4a9aff, 0.3).setDepth(49);
    const arrow = this.add.rectangle(startX, startY, 15, 3, 0x4a9aff).setDepth(50);

    const trailEmitter = this.add.particles(startX, startY, '', {
      lifespan: 300,
      speed: { min: 10, max: 30 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: 0x4a9aff,
      quantity: 2,
      frequency: 16
    });
    trailEmitter.startFollow(arrow);

    this.arrows.push({
      id: `arrow_${Date.now()}`,
      sprite: arrow,
      glowSprite: arrowGlow,
      emitter: trailEmitter,
      target: monster,
      startX, startY,
      progress: 0,
      duration: 200
    });
  }

  private startNextWave(): void {
    if (!this.levelConfig || this.currentWave >= this.levelConfig.waves.length) return;
    const wave = this.levelConfig.waves[this.currentWave];
    this.currentWave++;
    this.isWaveActive = true;
    this.waveTimer = 0;

    this.waveText.setText(`波次: ${this.currentWave} / ${this.levelConfig.waves.length}`);
    this.showWaveAnnouncement();

    const total = wave.normalCount + wave.armoredCount;
    let spawned = 0;
    const spawnInterval = 800;

    const doSpawn = () => {
      if (spawned >= total) return;
      const isArmored = spawned < wave.armoredCount;
      this.spawnMonster(isArmored ? 'armored' : 'normal', wave.speed);
      spawned++;
      if (spawned < total) this.time.delayedCall(spawnInterval, doSpawn);
    };
    this.time.delayedCall(1000, doSpawn);
  }

  private showWaveAnnouncement(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const glowTxt = this.add.text(w * 0.5, h * 0.5, `第 ${this.currentWave} 波来袭!`, {
      fontSize: '52px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ff6644', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.3);
    const txt = this.add.text(w * 0.5, h * 0.5, `第 ${this.currentWave} 波来袭!`, {
      fontSize: '48px', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ff6644', fontStyle: 'bold'
    }).setOrigin(0.5);
    txt.setShadow(4, 4, '#000000', 0, true, true);
    this.tweens.add({
      targets: [txt, glowTxt],
      scale: { from: 0.5, to: 1.2 }, alpha: { from: 0, to: 1 },
      duration: 500, ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: [txt, glowTxt],
          scale: { from: 1.2, to: 0.8 }, alpha: { from: 1, to: 0 },
          duration: 500, delay: 1000, ease: 'Power2.easeIn',
          onComplete: () => { txt.destroy(); glowTxt.destroy(); }
        });
      }
    });
  }

  private spawnMonster(type: 'normal' | 'armored', baseSpeed: number): void {
    if (!this.levelConfig) return;
    const path = this.levelConfig.path;
    const sx = path[0].x;
    const sy = path[0].y;

    let sprite: Phaser.GameObjects.Shape;
    let glowSprite: Phaser.GameObjects.Shape;
    let health: number;
    let speed: number;

    if (type === 'normal') {
      glowSprite = this.add.circle(sx, sy, 18, 0x44dd44, 0.3);
      sprite = this.add.circle(sx, sy, 15, 0x44dd44);
      sprite.setStrokeStyle(2, 0x22aa22);
      health = 30; speed = baseSpeed;
    } else {
      glowSprite = this.add.rectangle(sx, sy, 29, 29, 0x224488, 0.3);
      sprite = this.add.rectangle(sx, sy, 25, 25, 0x224488);
      sprite.setStrokeStyle(3, 0x4466aa);
      health = 60; speed = baseSpeed * 0.7;
    }

    const healthBar = this.add.graphics().setDepth(10);

    this.monsters.push({
      id: `m_${Date.now()}`,
      type, sprite, glowSprite, healthBar,
      health, maxHealth: health, speed,
      totalDistance: 0, isHit: false, hitTimer: 0
    });
    this.updateMonsterHealthBar(this.monsters[this.monsters.length - 1]);
  }

  private updateMonsters(delta: number): void {
    if (!this.levelConfig) return;

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];

      if (m.health <= 0) {
        this.killMonster(m);
        this.monsters.splice(i, 1);
        continue;
      }

      if (m.isHit) {
        m.hitTimer -= delta;
        if (m.hitTimer <= 0) {
          m.isHit = false;
          const c = m.type === 'normal' ? 0x44dd44 : 0x224488;
          if (m.type === 'normal') (m.sprite as Phaser.GameObjects.Arc).setFillStyle(c);
          else (m.sprite as Phaser.GameObjects.Rectangle).setFillStyle(c);
        }
      }

      const moveAmount = (m.speed * delta) / 1000;
      m.totalDistance += moveAmount;

      const pos = this.getPositionAtDistance(m.totalDistance);
      if (!pos || m.totalDistance >= this.pathTotalLength) {
        this.monsterReachedEnd(m);
        this.monsters.splice(i, 1);
        continue;
      }

      m.sprite.setPosition(pos.x, pos.y);
      m.glowSprite.setPosition(pos.x, pos.y);
      m.healthBar.setPosition(pos.x, pos.y - 25);

      const nextPos = this.getPositionAtDistance(m.totalDistance + 1);
      if (nextPos) {
        const angle = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x);
        m.sprite.setRotation(angle);
        m.glowSprite.setRotation(angle);
      }

      this.updateMonsterHealthBar(m);
    }
  }

  private updateTowers(): void {
    const now = Date.now();
    for (const tower of this.towers) {
      if (now - tower.lastShotTime < tower.attackCooldown) continue;
      let target: Monster | null = null;
      let minDist = Infinity;
      for (const m of this.monsters) {
        if (m.health <= 0) continue;
        const d = Math.hypot(tower.x - m.sprite.x, tower.y - m.sprite.y);
        if (d <= tower.range && d < minDist) { minDist = d; target = m; }
      }
      if (target) {
        this.fireArrow(tower, target);
        tower.lastShotTime = now;
      }
    }
  }

  private updateArrows(delta: number): void {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];

      if (!a.target || a.target.health <= 0) {
        this.destroyArrow(a);
        this.arrows.splice(i, 1);
        continue;
      }

      a.progress += delta / a.duration;

      if (a.progress >= 1) {
        this.hitMonster(a.target, 10);
        this.destroyArrow(a);
        this.arrows.splice(i, 1);
      } else {
        const t = a.progress;
        const tx = a.target.sprite.x;
        const ty = a.target.sprite.y;
        const x = Phaser.Math.Linear(a.startX, tx, t);
        const y = Phaser.Math.Linear(a.startY, ty, t);

        a.sprite.setPosition(x, y);
        a.glowSprite.setPosition(x, y);

        const angle = Math.atan2(ty - a.startY, tx - a.startX);
        a.sprite.setRotation(angle);
        a.glowSprite.setRotation(angle);
      }
    }
  }

  private destroyArrow(a: Arrow): void {
    a.emitter.killAll();
    a.emitter.stop();
    this.time.delayedCall(350, () => {
      a.emitter.destroy();
    });
    a.sprite.destroy();
    a.glowSprite.destroy();
  }

  private updateDeathParticles(delta: number): void {
    for (let i = this.deathParticles.length - 1; i >= 0; i--) {
      const p = this.deathParticles[i];
      p.life -= delta;
      if (p.life <= 0) {
        p.sprite.destroy();
        this.deathParticles.splice(i, 1);
        continue;
      }
      p.sprite.x += p.vx * delta / 1000;
      p.sprite.y += p.vy * delta / 1000;
      p.vy += 200 * delta / 1000;
      p.sprite.setAlpha(p.life / p.maxLife);
    }
  }

  private hitMonster(monster: Monster, damage: number): void {
    monster.health -= damage;
    monster.isHit = true;
    monster.hitTimer = 150;
    if (monster.type === 'normal') (monster.sprite as Phaser.GameObjects.Arc).setFillStyle(0xff4444);
    else (monster.sprite as Phaser.GameObjects.Rectangle).setFillStyle(0xff4444);
    this.updateMonsterHealthBar(monster);
    this.showFloatingText(monster.sprite.x, monster.sprite.y - 30, `-${damage}`, 0xff4444);
  }

  private updateMonsterHealthBar(m: Monster): void {
    m.healthBar.clear();
    const bw = 30, bh = 4;
    const pct = Math.max(0, m.health / m.maxHealth);
    m.healthBar.fillStyle(0x333333, 0.8);
    m.healthBar.fillRect(-bw / 2, 0, bw, bh);
    const c = pct > 0.5 ? 0x44dd44 : pct > 0.25 ? 0xffaa00 : 0xff4444;
    m.healthBar.fillStyle(c, 1);
    m.healthBar.fillRect(-bw / 2, 0, bw * pct, bh);
    m.healthBar.lineStyle(1, 0x000000, 0.5);
    m.healthBar.strokeRect(-bw / 2, 0, bw, bh);
  }

  private killMonster(monster: Monster): void {
    const color = monster.type === 'normal' ? 0x44dd44 : 0x224488;
    const goldReward = monster.type === 'normal' ? 15 : 30;
    this.gold += goldReward;
    this.score += (monster.type === 'normal' ? 100 : 200);
    this.killCount++;
    this.updateGoldDisplay();
    this.updateScoreDisplay();
    this.showFloatingText(monster.sprite.x, monster.sprite.y, `+${goldReward}`, 0xffd700);
    this.createDeathParticles(monster.sprite.x, monster.sprite.y, color);
    monster.sprite.destroy();
    monster.glowSprite.destroy();
    monster.healthBar.destroy();
  }

  private createDeathParticles(x: number, y: number, color: number): void {
    const count = Phaser.Math.Between(5, 8);
    for (let i = 0; i < count; i++) {
      const size = Phaser.Math.Between(4, 8);
      const p = this.add.rectangle(x, y, size, size, color);
      const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));
      const speed = Phaser.Math.Between(100, 200);
      this.deathParticles.push({
        sprite: p,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500, maxLife: 500
      });
    }
  }

  private monsterReachedEnd(monster: Monster): void {
    this.health -= 10;
    this.updateHealthDisplay();
    this.showFloatingText(monster.sprite.x, monster.sprite.y, '-10 HP', 0xff4444);
    monster.sprite.destroy();
    monster.glowSprite.destroy();
    monster.healthBar.destroy();
    this.cameras.main.shake(200, 0.005);
    if (this.health <= 0) this.gameOver();
  }

  private updateHealthDisplay(): void {
    this.healthText.setText(`${this.health}`);
    this.tweens.add({
      targets: this.healthText,
      scale: { from: 1.3, to: 1 }, duration: 150, ease: 'Back.easeOut'
    });
  }

  private updateGoldDisplay(): void {
    this.goldText.setText(`${this.gold}`);
    this.tweens.add({
      targets: this.goldText,
      scale: { from: 1.3, to: 1 }, duration: 150, ease: 'Back.easeOut'
    });
  }

  private updateScoreDisplay(): void {
    this.scoreText.setText(`得分: ${this.score}`);
  }

  private showFloatingText(x: number, y: number, text: string, color: number): void {
    const ft = this.add.text(x, y, text, {
      fontSize: '16px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    ft.setShadow(2, 2, '#000000', 0, true, true);
    this.tweens.add({
      targets: ft,
      y: y - 40, alpha: { from: 1, to: 0 },
      duration: 800, ease: 'Power2.easeOut',
      onComplete: () => ft.destroy()
    });
  }

  private checkWaveComplete(): void {
    if (!this.isWaveActive) return;
    if (this.monsters.length === 0) {
      this.isWaveActive = false;
      if (this.currentWave >= (this.levelConfig?.waves.length || 0)) {
        this.time.delayedCall(2000, () => this.gameOver(true));
      } else {
        this.waveTimer = 0;
        this.showFloatingText(
          this.cameras.main.width * 0.5, this.cameras.main.height * 0.5,
          '波次完成! 准备下一波...', 0x44ff44
        );
      }
    }
  }

  private async gameOver(victory: boolean = false): Promise<void> {
    if (this.isGameOver) return;
    this.isGameOver = true;

    const finalScore = this.killCount * 100 + this.health * 10;
    this.score = finalScore;
    this.updateScoreDisplay();

    try {
      await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore, name: 'Player', date: new Date().toISOString() })
      });
    } catch { /* ignore */ }

    let hs = this.highScores;
    try {
      const r = await fetch('/api/highscores');
      if (r.ok) hs = await r.json();
    } catch { /* ignore */ }

    const highestScore = hs.length > 0 ? hs[0].score : 0;
    this.showGameOverPanel(finalScore, highestScore, finalScore > highestScore, victory);
  }

  private showGameOverPanel(score: number, highScore: number, isNewHigh: boolean, victory: boolean): void {
    const existing = document.getElementById('game-over-panel');
    if (existing) existing.remove();

    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const panelW = Math.min(500, w * 0.8);
    const panelH = Math.min(400, h * 0.6);

    this.renderTexture = this.add.renderTexture(0, 0, w, h);
    this.renderTexture.setOrigin(0, 0);
    this.renderTexture.fill(0x000000, 0.4);
    this.renderTexture.draw(this.children, 0, 0);
    this.renderTexture.setDepth(1000);

    const blurFX = this.renderTexture.postFX.addBlur(1, 4, 4, 1, 0xffffff, 4);
    blurFX.active = true;

    const overlay = this.add.rectangle(0, 0, w * 2, h * 2, 0x000000, 0.5)
      .setOrigin(0, 0).setDepth(1001);

    this.gameOverContainer = this.add.container(w / 2, h + panelH);
    this.gameOverContainer.setDepth(1002);

    const panelShadow = this.add.graphics();
    panelShadow.fillStyle(0x000000, 0.4);
    panelShadow.fillRoundedRect(-panelW / 2 + 3, -panelH / 2 + 3, panelW, panelH, 8);
    this.gameOverContainer.add(panelShadow);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a0a2e, 0.92);
    panelBg.lineStyle(2, 0x4a7acf, 0.9);
    panelBg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
    panelBg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
    this.gameOverContainer.add(panelBg);

    const panelGlow = this.add.graphics();
    panelGlow.lineStyle(6, 0x4a7acf, 0.15);
    panelGlow.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
    this.gameOverContainer.add(panelGlow);

    const titleColor = victory ? '#44ff44' : '#ff4444';
    const titleText = victory ? '🎉 胜利!' : '💀 游戏结束';

    const title = this.add.text(0, -panelH * 0.32, titleText, {
      fontSize: `${Math.max(28, h * 0.04)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: titleColor, fontStyle: 'bold'
    }).setOrigin(0.5);
    title.setShadow(4, 4, '#000000', 0, true, true);
    this.gameOverContainer.add(title);

    let yOffset = -panelH * 0.18;

    if (isNewHigh) {
      const newHigh = this.add.text(0, yOffset, '🏆 新纪录!', {
        fontSize: `${Math.max(18, h * 0.022)}px`,
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        color: '#ffd700', fontStyle: 'bold'
      }).setOrigin(0.5);
      this.gameOverContainer.add(newHigh);
      this.tweens.add({
        targets: newHigh,
        scale: { from: 1, to: 1.1 },
        duration: 500, yoyo: true, repeat: -1
      });
      yOffset += panelH * 0.08;
    }

    const scoreLabel = this.add.text(0, yOffset, '本次得分', {
      fontSize: `${Math.max(14, h * 0.018)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#a0c4ff'
    }).setOrigin(0.5);
    this.gameOverContainer.add(scoreLabel);
    yOffset += panelH * 0.08;

    const scoreValue = this.add.text(0, yOffset, score.toLocaleString(), {
      fontSize: `${Math.max(32, h * 0.04)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.gameOverContainer.add(scoreValue);
    yOffset += panelH * 0.08;

    const highLabel = this.add.text(0, yOffset, '最高纪录', {
      fontSize: `${Math.max(14, h * 0.016)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#6a8abf'
    }).setOrigin(0.5);
    this.gameOverContainer.add(highLabel);
    yOffset += panelH * 0.05;

    const highValue = this.add.text(0, yOffset, highScore.toLocaleString(), {
      fontSize: `${Math.max(18, h * 0.02)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.gameOverContainer.add(highValue);
    yOffset += panelH * 0.06;

    const statsText = this.add.text(0, yOffset, `击杀数: ${this.killCount} | 剩余生命: ${this.health}`, {
      fontSize: `${Math.max(12, h * 0.014)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#a0c4ff'
    }).setOrigin(0.5);
    this.gameOverContainer.add(statsText);
    yOffset += panelH * 0.08;

    const btnW = Math.max(160, w * 0.15);
    const btnH = Math.max(40, h * 0.05);
    const backButton = this.add.rectangle(0, yOffset, btnW, btnH, 0x2a4a7f)
      .setStrokeStyle(2, 0x4a7acf).setInteractive({ useHandCursor: true });
    this.gameOverContainer.add(backButton);

    const backText = this.add.text(0, yOffset, '返回菜单', {
      fontSize: `${Math.max(16, h * 0.018)}px`,
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.gameOverContainer.add(backText);

    backButton.on('pointerover', () => {
      this.tweens.add({
        targets: backButton,
        fillColor: 0x3a5aaf,
        duration: 200, ease: 'Power2.easeOut'
      });
    });
    backButton.on('pointerout', () => {
      this.tweens.add({
        targets: backButton,
        fillColor: 0x2a4a7f,
        duration: 200, ease: 'Power2.easeOut'
      });
    });
    backButton.on('pointerdown', () => {
      this.tweens.add({
        targets: this.gameOverContainer,
        y: h + panelH,
        alpha: 0,
        duration: 300,
        ease: 'Elastic.easeIn',
        onComplete: () => {
          this.renderTexture.destroy();
          overlay.destroy();
          this.gameOverContainer.destroy();
          this.scene.start('MenuScene');
        }
      });
    });

    this.gameOverContainer.setScale(1.2);
    this.gameOverContainer.setAlpha(0);

    this.tweens.add({
      targets: this.gameOverContainer,
      y: h / 2,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Elastic.easeOut'
    });

    this.tweens.add({
      targets: this.renderTexture,
      alpha: { from: 0.6, to: 1 },
      duration: 400,
      ease: 'Power2.easeOut'
    });

    this.tweens.add({
      targets: overlay,
      alpha: { from: 0.3, to: 0.5 },
      duration: 400,
      ease: 'Power2.easeOut'
    });
  }

  private getDefaultLevelConfig(): LevelConfig {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      path: [
        { x: 0, y: h * 0.2 }, { x: w * 0.25, y: h * 0.2 },
        { x: w * 0.25, y: h * 0.5 }, { x: w * 0.5, y: h * 0.5 },
        { x: w * 0.5, y: h * 0.3 }, { x: w * 0.75, y: h * 0.3 },
        { x: w * 0.75, y: h * 0.6 }, { x: w, y: h * 0.6 }
      ],
      waves: [
        { normalCount: 5, armoredCount: 0, speed: 70 },
        { normalCount: 6, armoredCount: 1, speed: 70 },
        { normalCount: 6, armoredCount: 2, speed: 75 },
        { normalCount: 7, armoredCount: 2, speed: 75 },
        { normalCount: 8, armoredCount: 3, speed: 80 }
      ]
    };
  }
}
