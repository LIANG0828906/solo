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
  healthBar: Phaser.GameObjects.Graphics;
  health: number;
  maxHealth: number;
  speed: number;
  pathIndex: number;
  progress: number;
  isHit: boolean;
  hitTimer: number;
}

interface Tower {
  id: string;
  sprite: Phaser.GameObjects.Shape;
  range: number;
  x: number;
  y: number;
  lastShotTime: number;
  attackCooldown: number;
}

interface Arrow {
  id: string;
  sprite: Phaser.GameObjects.Shape;
  trail: Phaser.GameObjects.Graphics;
  target: Monster | null;
  startX: number;
  startY: number;
  progress: number;
  duration: number;
  trailPoints: Array<{ x: number; y: number }>;
}

interface Particle {
  sprite: Phaser.GameObjects.Shape;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
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
  private particles: Particle[] = [];
  
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
  private healthIcon!: Phaser.GameObjects.Shape;
  private goldIcon!: Phaser.GameObjects.Shape;
  
  private lastGestureType: string = 'none';
  private gestureCooldown: number = 0;
  private arrowCooldown: number = 0;
  
  private gridSize: number = 60;
  
  private explosionParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private arrowTrailParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

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
    this.particles = [];
    
    this.isAiming = false;
    this.lastGestureType = 'none';
    this.gestureCooldown = 0;
    this.arrowCooldown = 0;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.createBackground(width, height);
    this.createGrid(width, height);
    this.createPath(width, height);
    this.createUI(width, height);
    this.createAimingRing();
    this.createParticleEmitters();
    
    this.time.delayedCall(2000, () => {
      this.startNextWave();
    });
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;
    
    if (this.gestureCooldown > 0) {
      this.gestureCooldown -= delta;
    }
    
    if (this.arrowCooldown > 0) {
      this.arrowCooldown -= delta;
    }
    
    if (this.isAiming) {
      this.updateAimingRing();
    }
    
    if (!this.isWaveActive && this.currentWave < (this.levelConfig?.waves.length || 0)) {
      this.waveTimer += delta;
      if (this.waveTimer >= this.waveInterval) {
        this.startNextWave();
      }
    }
    
    this.updateMonsters(delta);
    this.updateTowers();
    this.updateArrows(delta);
    this.updateParticles(delta);
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

  private createBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0a2e, 0x2a1a4e, 0x1a0a2e, 0x0a051e, 1);
    bg.fillRect(0, 0, width, height);
  }

  private createGrid(width: number, height: number): void {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x4a7acf, 0.2);
    
    for (let x = 0; x <= width; x += this.gridSize) {
      grid.beginPath();
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
      grid.strokePath();
    }
    
    for (let y = 0; y <= height; y += this.gridSize) {
      grid.beginPath();
      grid.moveTo(0, y);
      grid.lineTo(width, y);
      grid.strokePath();
    }
  }

  private createPath(_width: number, _height: number): void {
    if (!this.levelConfig) return;
    
    const path = this.levelConfig.path;
    
    const glow = this.add.graphics();
    glow.lineStyle(10, 0x3a7a5f, 0.2);
    glow.beginPath();
    glow.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      glow.lineTo(path[i].x, path[i].y);
    }
    glow.strokePath();
    
    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0x3a7a5f, 0.8);
    graphics.beginPath();
    graphics.moveTo(path[0].x, path[0].y);
    
    for (let i = 1; i < path.length; i++) {
      graphics.lineTo(path[i].x, path[i].y);
    }
    
    graphics.strokePath();
    
    const entranceGlow = this.add.circle(path[0].x, path[0].y, 25, 0x3a7a5f, 0.3);
    const entrance = this.add.circle(path[0].x, path[0].y, 20, 0x3a7a5f, 0.6);
    
    this.tweens.add({
      targets: [entrance, entranceGlow],
      alpha: { from: 0.6, to: 0.3 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });
    
    const exitGlow = this.add.circle(path[path.length - 1].x, path[path.length - 1].y, 25, 0xff4444, 0.3);
    const exit = this.add.circle(path[path.length - 1].x, path[path.length - 1].y, 20, 0xff4444, 0.6);
    
    this.tweens.add({
      targets: [exit, exitGlow],
      alpha: { from: 0.6, to: 0.3 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });
  }

  private createUI(width: number, height: number): void {
    const panelX = 20;
    const panelY = height - 70;
    const panelWidth = 200;
    const panelHeight = 50;
    
    const panelShadow = this.add.graphics();
    panelShadow.fillStyle(0x000000, 0.3);
    panelShadow.fillRoundedRect(panelX + 2, panelY + 2, panelWidth, panelHeight, 4);
    
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4e, 0.8);
    panel.lineStyle(2, 0x4a7acf, 0.8);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 4);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 4);
    
    this.healthIcon = this.add.circle(panelX + 25, panelY + 25, 14, 0xff4444, 0.3);
    this.add.circle(panelX + 25, panelY + 25, 12, 0xff4444);
    this.drawHeart(panelX + 25, panelY + 25, 10);
    
    this.healthText = this.add.text(panelX + 45, panelY + 15, '100', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    
    this.goldIcon = this.add.circle(panelX + 110, panelY + 25, 14, 0xffd700, 0.3);
    this.add.circle(panelX + 110, panelY + 25, 12, 0xffd700);
    
    this.goldText = this.add.text(panelX + 130, panelY + 15, '100', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    
    this.waveText = this.add.text(width / 2, 60, `波次: 0 / ${this.levelConfig?.waves.length || 5}`, {
      fontSize: '20px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#a0c4ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    this.scoreText = this.add.text(width - 20, height - 55, '得分: 0', {
      fontSize: '18px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(1, 0);
  }

  private drawHeart(x: number, y: number, size: number): void {
    const heart = this.add.graphics();
    heart.fillStyle(0xff4444, 1);
    
    const points: Phaser.Types.Math.Vector2Like[] = [];
    const segments = 20;
    
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const px = 16 * Math.pow(Math.sin(t), 3);
      const py = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      points.push({ x: x + (px * size / 16), y: y + (py * size / 16) });
    }
    
    heart.beginPath();
    heart.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      heart.lineTo(points[i].x, points[i].y);
    }
    heart.closePath();
    heart.fillPath();
  }

  private createAimingRing(): void {
    this.aimingRingGlow = this.add.arc(0, 0, 38, 0, 360, false, 0x4a9aff, 0.2);
    this.aimingRingGlow.setVisible(false);
    this.aimingRingGlow.setDepth(99);
    
    this.aimingRing = this.add.arc(0, 0, 30, 0, 360, false, 0x4a9aff, 0.5);
    this.aimingRing.setStrokeStyle(2, 0x4a9aff, 0.8);
    this.aimingRing.setVisible(false);
    this.aimingRing.setDepth(100);
    
    this.tweens.add({
      targets: [this.aimingRing, this.aimingRingGlow],
      alpha: { from: 0.5, to: 0.8 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
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
    const lerpFactor = 0.1;
    this.currentAimX += (this.targetAimX - this.currentAimX) * lerpFactor;
    this.currentAimY += (this.targetAimY - this.currentAimY) * lerpFactor;
    
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
    
    const existingTower = this.towers.find(t => 
      Math.abs(t.x - snapX) < this.gridSize / 2 && Math.abs(t.y - snapY) < this.gridSize / 2
    );
    
    if (existingTower) {
      this.showFloatingText(x, y, '此处已有箭塔!', 0xff4444);
      return;
    }
    
    this.gold -= 30;
    this.updateGoldDisplay();
    
    const towerBase = this.add.rectangle(snapX, snapY + 10, 40, 15, 0x4a3a2a);
    towerBase.setStrokeStyle(2, 0x6a5a4a);
    
    const tower = this.add.rectangle(snapX, snapY - 10, 30, 50, 0x5a6a8a);
    tower.setStrokeStyle(2, 0x7a8aaa);
    
    const towerTop = this.add.triangle(snapX, snapY - 45, -20, 10, 20, 10, 0, -20, 0x8a5aaa);
    towerTop.setStrokeStyle(2, 0xaa7aca);
    
    const towerGroup = this.add.container(snapX, snapY, [towerBase, tower, towerTop]);
    towerGroup.setScale(0);
    
    const flash = this.add.rectangle(snapX, snapY, 50, 60, 0xffffff, 0);
    
    this.tweens.add({
      targets: towerGroup,
      scale: { from: 0, to: 1 },
      y: { from: snapY + 30, to: snapY },
      duration: 300,
      ease: 'Back.easeOut'
    });
    
    this.tweens.add({
      targets: flash,
      alpha: { from: 0.8, to: 0 },
      duration: 300,
      ease: 'Power2.easeOut',
      onComplete: () => flash.destroy()
    });
    
    const towerShape = this.add.rectangle(snapX, snapY, 30, 50, 0x5a6a8a);
    towerShape.setVisible(false);
    
    this.towers.push({
      id: `tower_${Date.now()}_${Math.random()}`,
      sprite: towerShape,
      range: 200,
      x: snapX,
      y: snapY,
      lastShotTime: 0,
      attackCooldown: 1500
    });
    
    this.showFloatingText(x, y, '-30 金币', 0xffd700);
  }

  private isOnPath(x: number, y: number): boolean {
    if (!this.levelConfig) return false;
    
    const path = this.levelConfig.path;
    const threshold = 40;
    
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      
      const dist = this.pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dist < threshold) return true;
    }
    
    return false;
  }

  private pointToLineDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private castSpell(): void {
    if (this.arrowCooldown > 0) return;
    if (this.towers.length === 0) {
      this.showFloatingText(this.cameras.main.width / 2, this.cameras.main.height / 2, '需要先建造箭塔!', 0xff4444);
      return;
    }
    
    const nearestMonster = this.findNearestMonster();
    if (!nearestMonster) {
      this.showFloatingText(this.cameras.main.width / 2, this.cameras.main.height / 2, '没有可攻击的目标!', 0xffaa00);
      return;
    }
    
    const nearestTower = this.findNearestTowerTo(nearestMonster.sprite.x, nearestMonster.sprite.y);
    if (!nearestTower) return;
    
    this.fireArrow(nearestTower, nearestMonster);
    this.arrowCooldown = 200;
  }

  private findNearestTowerTo(x: number, y: number): Tower | null {
    let nearest: Tower | null = null;
    let minDist = Infinity;
    
    for (const tower of this.towers) {
      const dist = Math.hypot(tower.x - x, tower.y - y);
      if (dist < minDist && dist <= tower.range) {
        minDist = dist;
        nearest = tower;
      }
    }
    
    if (!nearest && this.towers.length > 0) {
      for (const tower of this.towers) {
        const dist = Math.hypot(tower.x - x, tower.y - y);
        if (dist < minDist) {
          minDist = dist;
          nearest = tower;
        }
      }
    }
    
    return nearest;
  }

  private findNearestMonster(): Monster | null {
    let nearest: Monster | null = null;
    let minDist = Infinity;
    
    for (const monster of this.monsters) {
      if (monster.health <= 0) continue;
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;
      const dist = Math.hypot(monster.sprite.x - centerX, monster.sprite.y - centerY);
      if (dist < minDist) {
        minDist = dist;
        nearest = monster;
      }
    }
    
    return nearest;
  }

  private fireArrow(tower: Tower, monster: Monster): void {
    const arrowGlow = this.add.rectangle(tower.x, tower.y - 20, 18, 5, 0x4a9aff, 0.3);
    const arrow = this.add.rectangle(tower.x, tower.y - 20, 15, 3, 0x4a9aff);
    arrow.setDepth(50);
    arrowGlow.setDepth(49);
    
    const trail = this.add.graphics();
    trail.setDepth(48);
    
    const arrowObj: Arrow = {
      id: `arrow_${Date.now()}_${Math.random()}`,
      sprite: arrow,
      trail,
      target: monster,
      startX: tower.x,
      startY: tower.y - 20,
      progress: 0,
      duration: 200,
      trailPoints: []
    };
    
    (arrow as any).glow = arrowGlow;
    this.arrows.push(arrowObj);
    
    this.arrowTrailParticles.emitParticleAt(tower.x, tower.y - 20);
  }

  private createParticleEmitters(): void {
    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0xffffff);
    graphics.fillRect(-2, -2, 4, 4);
    graphics.generateTexture('particle_dot', 4, 4);
    graphics.destroy();
    
    this.explosionParticles = this.add.particles('particle_dot').createEmitter({
      lifespan: 500,
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 0,
      emitting: false
    });
    
    this.arrowTrailParticles = this.add.particles('particle_dot').createEmitter({
      lifespan: 300,
      speed: 0,
      scale: { start: 3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: 0x4a9aff,
      quantity: 0,
      emitting: false
    });
  }

  private startNextWave(): void {
    if (!this.levelConfig || this.currentWave >= this.levelConfig.waves.length) {
      return;
    }
    
    const wave = this.levelConfig.waves[this.currentWave];
    this.currentWave++;
    this.isWaveActive = true;
    this.waveTimer = 0;
    
    this.waveText.setText(`波次: ${this.currentWave} / ${this.levelConfig.waves.length}`);
    this.showWaveAnnouncement();
    
    const totalMonsters = wave.normalCount + wave.armoredCount;
    let spawned = 0;
    
    const spawnInterval = 800;
    
    const spawnMonster = () => {
      if (spawned >= totalMonsters) return;
      
      const isArmored = spawned < wave.armoredCount;
      this.spawnMonster(isArmored ? 'armored' : 'normal', wave.speed);
      spawned++;
      
      if (spawned < totalMonsters) {
        this.time.delayedCall(spawnInterval, spawnMonster);
      }
    };
    
    this.time.delayedCall(1000, spawnMonster);
  }

  private showWaveAnnouncement(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const textGlow = this.add.text(width / 2, height / 2, `第 ${this.currentWave} 波来袭!`, {
      fontSize: '52px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ff6644',
      fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0.3);
    
    const text = this.add.text(width / 2, height / 2, `第 ${this.currentWave} 波来袭!`, {
      fontSize: '48px',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#ff6644',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    text.setShadow(4, 4, '#000000', 0, true, true);
    
    this.tweens.add({
      targets: [text, textGlow],
      scale: { from: 0.5, to: 1.2 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: [text, textGlow],
          scale: { from: 1.2, to: 0.8 },
          alpha: { from: 1, to: 0 },
          duration: 500,
          delay: 1000,
          ease: 'Power2.easeIn',
          onComplete: () => {
            text.destroy();
            textGlow.destroy();
          }
        });
      }
    });
  }

  private spawnMonster(type: 'normal' | 'armored', baseSpeed: number): void {
    if (!this.levelConfig) return;
    
    const path = this.levelConfig.path;
    const startX = path[0].x;
    const startY = path[0].y;
    
    let sprite: Phaser.GameObjects.Shape;
    let health: number;
    let speed: number;
    let color: number;
    
    if (type === 'normal') {
      const glow = this.add.circle(startX, startY, 18, 0x44dd44, 0.3);
      sprite = this.add.circle(startX, startY, 15, 0x44dd44);
      sprite.setStrokeStyle(2, 0x22aa22);
      (sprite as any).glow = glow;
      health = 30;
      speed = baseSpeed;
      color = 0x44dd44;
    } else {
      const glow = this.add.rectangle(startX, startY, 29, 29, 0x224488, 0.3);
      sprite = this.add.rectangle(startX, startY, 25, 25, 0x224488);
      sprite.setStrokeStyle(3, 0x4466aa);
      (sprite as any).glow = glow;
      health = 60;
      speed = baseSpeed * 0.7;
      color = 0x224488;
    }
    
    const healthBar = this.add.graphics();
    healthBar.setDepth(10);
    
    const monster: Monster = {
      id: `monster_${Date.now()}_${Math.random()}`,
      type,
      sprite,
      healthBar,
      health,
      maxHealth: health,
      speed,
      pathIndex: 0,
      progress: 0,
      isHit: false,
      hitTimer: 0
    };
    
    (sprite as any).monsterData = monster;
    (sprite as any).monsterColor = color;
    
    this.monsters.push(monster);
    this.updateMonsterHealthBar(monster);
  }

  private updateMonsters(delta: number): void {
    if (!this.levelConfig) return;
    
    const path = this.levelConfig.path;
    
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      
      if (monster.health <= 0) {
        this.killMonster(monster);
        this.monsters.splice(i, 1);
        continue;
      }
      
      if (monster.isHit) {
        monster.hitTimer -= delta;
        if (monster.hitTimer <= 0) {
          monster.isHit = false;
          const color = monster.type === 'normal' ? 0x44dd44 : 0x224488;
          if (monster.type === 'normal') {
            (monster.sprite as Phaser.GameObjects.Arc).setFillStyle(color);
          } else {
            (monster.sprite as Phaser.GameObjects.Rectangle).setFillStyle(color);
          }
        }
      }
      
      if (monster.pathIndex >= path.length - 1) {
        this.monsterReachedEnd(monster);
        this.monsters.splice(i, 1);
        continue;
      }
      
      const currentPoint = path[monster.pathIndex];
      const nextPoint = path[monster.pathIndex + 1];
      
      const dx = nextPoint.x - currentPoint.x;
      const dy = nextPoint.y - currentPoint.y;
      const segmentLength = Math.hypot(dx, dy);
      
      const moveAmount = (monster.speed * delta) / 1000;
      monster.progress += moveAmount / segmentLength;
      
      if (monster.progress >= 1) {
        monster.pathIndex++;
        monster.progress = 0;
      } else {
        const x = currentPoint.x + dx * monster.progress;
        const y = currentPoint.y + dy * monster.progress;
        monster.sprite.setPosition(x, y);
        monster.healthBar.setPosition(x, y - 25);
        
        const glow = (monster.sprite as any).glow;
        if (glow) {
          glow.setPosition(x, y);
        }
        
        const angle = Math.atan2(dy, dx);
        monster.sprite.setRotation(angle);
        if (glow) {
          glow.setRotation(angle);
        }
      }
    }
  }

  private updateTowers(): void {
    const now = Date.now();
    
    for (const tower of this.towers) {
      if (now - tower.lastShotTime < tower.attackCooldown) continue;
      
      let target: Monster | null = null;
      let minDist = Infinity;
      
      for (const monster of this.monsters) {
        if (monster.health <= 0) continue;
        const dist = Math.hypot(tower.x - monster.sprite.x, tower.y - monster.sprite.y);
        if (dist <= tower.range && dist < minDist) {
          minDist = dist;
          target = monster;
        }
      }
      
      if (target) {
        this.fireArrow(tower, target);
        tower.lastShotTime = now;
      }
    }
  }

  private updateArrows(delta: number): void {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arrow = this.arrows[i];
      
      if (!arrow.target || arrow.target.health <= 0) {
        arrow.sprite.destroy();
        arrow.trail.destroy();
        const glow = (arrow.sprite as any).glow;
        if (glow) glow.destroy();
        this.arrows.splice(i, 1);
        continue;
      }
      
      arrow.progress += delta / arrow.duration;
      
      if (arrow.progress >= 1) {
        this.hitMonster(arrow.target, 10);
        arrow.sprite.destroy();
        arrow.trail.destroy();
        const glow = (arrow.sprite as any).glow;
        if (glow) glow.destroy();
        this.arrows.splice(i, 1);
        
        this.explosionParticles.emitParticleAt(
          arrow.target.sprite.x,
          arrow.target.sprite.y,
          8
        );
      } else {
        const t = arrow.progress;
        const x = Phaser.Math.Linear(arrow.startX, arrow.target.sprite.x, t);
        const y = Phaser.Math.Linear(arrow.startY, arrow.target.sprite.y, t);
        
        arrow.sprite.setPosition(x, y);
        const glow = (arrow.sprite as any).glow;
        if (glow) {
          glow.setPosition(x, y);
        }
        
        const angle = Math.atan2(
          arrow.target.sprite.y - arrow.startY,
          arrow.target.sprite.x - arrow.startX
        );
        arrow.sprite.setRotation(angle);
        if (glow) {
          glow.setRotation(angle);
        }
        
        arrow.trailPoints.push({ x, y });
        if (arrow.trailPoints.length > 10) {
          arrow.trailPoints.shift();
        }
        
        this.updateArrowTrail(arrow);
      }
    }
  }

  private updateArrowTrail(arrow: Arrow): void {
    arrow.trail.clear();
    
    if (arrow.trailPoints.length < 2) return;
    
    for (let i = 1; i < arrow.trailPoints.length; i++) {
      const p1 = arrow.trailPoints[i - 1];
      const p2 = arrow.trailPoints[i];
      const alpha = i / arrow.trailPoints.length;
      
      arrow.trail.lineStyle(3, 0x4a9aff, alpha * 0.6);
      arrow.trail.beginPath();
      arrow.trail.moveTo(p1.x, p1.y);
      arrow.trail.lineTo(p2.x, p2.y);
      arrow.trail.strokePath();
    }
  }

  private updateParticles(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle =