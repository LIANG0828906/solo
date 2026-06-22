import Phaser from 'phaser';
import { HUD } from '../ui/HUD';
import { SoundManager } from '../audio/SoundManager';

interface Turret {
  type: number;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  frequency: number;
  damage: number;
  shootInterval: number;
  lastShootTime: number;
  range: number;
  graphics: Phaser.GameObjects.Container;
  pulseGraphics: Phaser.GameObjects.Graphics;
}

interface Enemy {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  health: number;
  maxHealth: number;
  type: number;
  frequency: number;
  graphics: Phaser.GameObjects.Container;
  healthBar: Phaser.GameObjects.Graphics;
  angle: number;
  movePattern: number;
  spawnBeat: number;
  reachedCenter: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  frequency: number;
  graphics: Phaser.GameObjects.Graphics;
  trail: Phaser.GameObjects.Graphics;
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
  graphics: Phaser.GameObjects.Graphics;
}

interface HaloEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: number;
  graphics: Phaser.GameObjects.Graphics;
}

export class GameScene extends Phaser.Scene {
  private hud!: HUD;
  private soundManager!: SoundManager;
  
  private gridCols: number = 12;
  private gridRows: number = 8;
  private cellSize: number = 60;
  private gridOffsetX: number = 0;
  private gridOffsetY: number = 0;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private occupiedCells: boolean[][] = [];
  
  private turrets: Turret[] = [];
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private haloEffects: HaloEffect[] = [];
  
  private score: number = 0;
  private wave: number = 1;
  private health: number = 100;
  private maxHealth: number = 100;
  private combo: number = 0;
  private maxCombo: number = 0;
  private comboTimer: number = 0;
  private comboTimeout: number = 2000;
  private energy: number = 0;
  private maxEnergy: number = 100;
  private energyPerHit: number = 2;
  
  private selectedTurretType: number | null = null;
  
  private colors = {
    background: 0x0d0221,
    grid: 0x00ffff,
    treble: 0xaaff00,
    mid: 0xff8800,
    bass: 0xaa00ff
  };
  
  private turretConfig = [
    { frequency: 880, damage: 15, shootInterval: 400, range: 200, color: '#aaff00', name: '高音' },
    { frequency: 440, damage: 25, shootInterval: 600, range: 180, color: '#ff8800', name: '中音' },
    { frequency: 220, damage: 40, shootInterval: 900, range: 160, color: '#aa00ff', name: '低音' }
  ];
  
  private enemyConfig = [
    { health: 30, speed: 1.2, frequency: 523, color: 0xff6666, size: 18, points: 10 },
    { health: 60, speed: 0.9, frequency: 392, color: 0x66ff66, size: 24, points: 25 },
    { health: 120, speed: 0.6, frequency: 261, color: 0x6666ff, size: 32, points: 50 },
    { health: 200, speed: 0.4, frequency: 196, color: 0xffff00, size: 40, points: 100 }
  ];
  
  private waveEnemiesSpawned: number = 0;
  private waveEnemiesPerBeat: number = 1;
  private waveEnemyCount: number = 0;
  private waveEnemyMaxCount: number = 10;
  private waveInProgress: boolean = false;
  private waveDelay: number = 3000;
  private waveStartTime: number = 0;
  private currentBeat: number = 0;
  
  private centerX: number = 0;
  private centerY: number = 0;
  
  private stars!: Phaser.GameObjects.Graphics;
  private starPositions: { x: number; y: number; size: number; twinkle: number }[] = [];
  
  private chordWaveActive: boolean = false;
  private chordWaveRadius: number = 0;
  private chordWaveMaxRadius: number = 800;
  private chordWaveGraphics!: Phaser.GameObjects.Graphics;
  
  private gameOver: boolean = false;
  private gameOverContainer!: Phaser.GameObjects.Container;
  
  private maxEnemies: number = 50;
  
  constructor() {
    super('GameScene');
  }
  
  preload(): void {
  }
  
  create(): void {
    this.hud = new HUD(this);
    this.soundManager = new SoundManager(this);
    
    this.soundManager.init();
    
    this.calculateGridPosition();
    this.createStarfield();
    this.createGrid();
    this.hud.create();
    
    this.chordWaveGraphics = this.add.graphics().setDepth(80);
    
    this.occupiedCells = Array(this.gridCols).fill(null).map(() => Array(this.gridRows).fill(false));
    
    this.centerX = this.gridOffsetX + (this.gridCols * this.cellSize) / 2;
    this.centerY = this.gridOffsetY + (this.gridRows * this.cellSize) / 2;
    
    this.events.on('turret-selected', (type: number | null) => {
      this.selectedTurretType = type;
    });
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.soundManager.resume();
      
      if (this.gameOver) return;
      
      if (this.energy >= this.maxEnergy && !this.chordWaveActive) {
        this.triggerChordWave(pointer.x, pointer.y);
        return;
      }
      
      if (this.selectedTurretType !== null) {
        this.tryPlaceTurret(pointer.x, pointer.y);
      }
    });
    
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.selectedTurretType !== null && !this.gameOver) {
        this.updateGridHighlight(pointer.x, pointer.y);
      }
    });
    
    this.soundManager.onBeat((beat: number) => {
      this.currentBeat = beat;
      this.spawnEnemiesOnBeat(beat);
      this.turretsPulse(beat);
    });
    
    this.soundManager.startBackgroundMusic();
    
    this.startWave();
    
    this.scale.on('resize', this.resize, this);
    
    this.createGameOverScreen();
  }
  
  private calculateGridPosition(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const maxGridWidth = width * 0.85;
    const maxGridHeight = height * 0.6;
    
    this.cellSize = Math.min(
      Math.floor(maxGridWidth / this.gridCols),
      Math.floor(maxGridHeight / this.gridRows)
    );
    
    this.gridOffsetX = (width - this.gridCols * this.cellSize) / 2;
    this.gridOffsetY = (height - this.gridRows * this.cellSize) / 2 - 30;
  }
  
  private createStarfield(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.stars = this.add.graphics().setDepth(-1);
    
    for (let i = 0; i < 150; i++) {
      this.starPositions.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2
      });
    }
    
    this.updateStarfield();
  }
  
  private updateStarfield(): void {
    this.stars.clear();
    
    const time = this.time.now * 0.001;
    
    this.starPositions.forEach(star => {
      const alpha = 0.3 + Math.sin(time * 2 + star.twinkle) * 0.3;
      this.stars.fillStyle(0xffffff, alpha);
      this.stars.fillCircle(star.x, star.y, star.size);
    });
  }
  
  private createGrid(): void {
    this.gridGraphics = this.add.graphics().setDepth(1);
    this.drawGrid();
  }
  
  private drawGrid(): void {
    this.gridGraphics.clear();
    
    this.gridGraphics.lineStyle(1, this.colors.grid, 0.3);
    
    for (let col = 0; col <= this.gridCols; col++) {
      const x = this.gridOffsetX + col * this.cellSize;
      this.gridGraphics.beginPath();
      this.gridGraphics.moveTo(x, this.gridOffsetY);
      this.gridGraphics.lineTo(x, this.gridOffsetY + this.gridRows * this.cellSize);
      this.gridGraphics.strokePath();
    }
    
    for (let row = 0; row <= this.gridRows; row++) {
      const y = this.gridOffsetY + row * this.cellSize;
      this.gridGraphics.beginPath();
      this.gridGraphics.moveTo(this.gridOffsetX, y);
      this.gridGraphics.lineTo(this.gridOffsetX + this.gridCols * this.cellSize, y);
      this.gridGraphics.strokePath();
    }
    
    this.gridGraphics.lineStyle(3, this.colors.grid, 0.8);
    this.gridGraphics.strokeRoundedRect(
      this.gridOffsetX - 2,
      this.gridOffsetY - 2,
      this.gridCols * this.cellSize + 4,
      this.gridRows * this.cellSize + 4,
      8
    );
    
    const centerCellX = Math.floor(this.gridCols / 2);
    const centerCellY = Math.floor(this.gridRows / 2);
    const coreX = this.gridOffsetX + centerCellX * this.cellSize + this.cellSize / 2;
    const coreY = this.gridOffsetY + centerCellY * this.cellSize + this.cellSize / 2;
    
    const coreRadius = this.cellSize * 0.7;
    const layers = 8;
    for (let i = layers; i >= 0; i--) {
      const t = i / layers;
      const radius = coreRadius * (0.3 + t * 0.7);
      const alpha = 1 - t * 0.8;
      
      let color: number;
      if (t < 0.33) {
        color = 0xff00ff;
      } else if (t < 0.66) {
        color = 0x00ffff;
      } else {
        color = 0x2a0a5c;
      }
      
      this.gridGraphics.fillStyle(color, alpha);
      this.gridGraphics.fillCircle(coreX, coreY, radius);
    }
    
    this.gridGraphics.lineStyle(2, 0xffffff, 0.8);
    this.gridGraphics.strokeCircle(coreX, coreY, this.cellSize * 0.5 + Math.sin(this.time.now * 0.003) * 5);
  }
  
  private updateGridHighlight(pointerX: number, pointerY: number): void {
    this.drawGrid();
    
    const gridX = Math.floor((pointerX - this.gridOffsetX) / this.cellSize);
    const gridY = Math.floor((pointerY - this.gridOffsetY) / this.cellSize);
    
    if (this.isValidPlacement(gridX, gridY)) {
      const x = this.gridOffsetX + gridX * this.cellSize;
      const y = this.gridOffsetY + gridY * this.cellSize;
      
      const color = Phaser.Display.Color.HexStringToColor(this.turretConfig[this.selectedTurretType!].color).color;
      this.gridGraphics.fillStyle(color, 0.3);
      this.gridGraphics.fillRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 4);
      this.gridGraphics.lineStyle(2, color, 0.8);
      this.gridGraphics.strokeRoundedRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4, 4);
      
      const range = this.turretConfig[this.selectedTurretType!].range;
      const centerX = x + this.cellSize / 2;
      const centerY = y + this.cellSize / 2;
      
      this.gridGraphics.lineStyle(1, color, 0.2);
      this.gridGraphics.strokeCircle(centerX, centerY, range);
    }
  }
  
  private isValidPlacement(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= this.gridCols || gridY < 0 || gridY >= this.gridRows) {
      return false;
    }
    
    const centerCellX = Math.floor(this.gridCols / 2);
    const centerCellY = Math.floor(this.gridRows / 2);
    if (gridX === centerCellX && gridY === centerCellY) {
      return false;
    }
    
    return !this.occupiedCells[gridX][gridY];
  }
  
  private tryPlaceTurret(pointerX: number, pointerY: number): void {
    const gridX = Math.floor((pointerX - this.gridOffsetX) / this.cellSize);
    const gridY = Math.floor((pointerY - this.gridOffsetY) / this.cellSize);
    
    if (!this.isValidPlacement(gridX, gridY)) {
      return;
    }
    
    const x = this.gridOffsetX + gridX * this.cellSize + this.cellSize / 2;
    const y = this.gridOffsetY + gridY * this.cellSize + this.cellSize / 2;
    
    this.createTurret(gridX, gridY, x, y, this.selectedTurretType!);
    this.occupiedCells[gridX][gridY] = true;
    
    this.soundManager.playDeploySound();
    this.createHaloEffect(x, y, Phaser.Display.Color.HexStringToColor(this.turretConfig[this.selectedTurretType!].color).color);
    this.createParticles(x, y, Phaser.Display.Color.HexStringToColor(this.turretConfig[this.selectedTurretType!].color).color, 10);
    
    this.drawGrid();
  }
  
  private createTurret(gridX: number, gridY: number, x: number, y: number, type: number): void {
    const config = this.turretConfig[type];
    const container = this.add.container(x, y).setDepth(10);
    
    const graphics = this.add.graphics();
    const color = Phaser.Display.Color.HexStringToColor(config.color).color;
    
    graphics.fillStyle(0x0d0221, 0.9);
    graphics.fillCircle(0, 0, this.cellSize * 0.4);
    
    const turretRadius = this.cellSize * 0.35;
    const turretLayers = 6;
    for (let i = turretLayers; i >= 0; i--) {
      const t = i / turretLayers;
      const radius = turretRadius * (0.2 + t * 0.8);
      const alpha = 1 - t * 0.7;
      
      let layerColor: number;
      if (t < 0.5) {
        layerColor = color;
      } else {
        const darken = 1 - (t - 0.5) * 1.5;
        const r = Math.floor(((color >> 16) & 255) * darken);
        const g = Math.floor(((color >> 8) & 255) * darken);
        const b = Math.floor((color & 255) * darken);
        layerColor = (r << 16) | (g << 8) | b;
      }
      
      graphics.fillStyle(layerColor, alpha);
      graphics.fillCircle(0, 0, radius);
    }
    
    graphics.lineStyle(2, color, 1);
    graphics.strokeCircle(0, 0, this.cellSize * 0.4);
    
    if (type === 0) {
      for (let i = 0; i < 3; i++) {
        graphics.fillStyle(0xffffff, 0.9);
        graphics.fillCircle(-8 + i * 8, 0, 4 - i);
      }
    } else if (type === 1) {
      graphics.fillStyle(0xffffff, 0.9);
      graphics.fillCircle(0, 0, 8);
    } else {
      graphics.fillStyle(0xffffff, 0.9);
      graphics.fillCircle(0, 0, 12);
    }
    
    const pulseGraphics = this.add.graphics().setAlpha(0);
    container.add([graphics, pulseGraphics]);
    
    const turret: Turret = {
      type,
      x,
      y,
      gridX,
      gridY,
      frequency: config.frequency,
      damage: config.damage,
      shootInterval: config.shootInterval,
      lastShootTime: 0,
      range: config.range,
      graphics: container,
      pulseGraphics
    };
    
    this.turrets.push(turret);
  }
  
  private turretsPulse(beat: number): void {
    this.turrets.forEach(turret => {
      const pulseGraphics = turret.pulseGraphics;
      const color = Phaser.Display.Color.HexStringToColor(this.turretConfig[turret.type].color).color;
      
      pulseGraphics.clear();
      pulseGraphics.lineStyle(3, color, 0.6);
      pulseGraphics.strokeCircle(0, 0, this.cellSize * 0.45);
      
      this.tweens.add({
        targets: pulseGraphics,
        alpha: { from: 0.8, to: 0 },
        scale: { from: 1, to: 1.5 },
        duration: 300,
        ease: 'Quad.easeOut'
      });
    });
  }
  
  private startWave(): void {
    this.waveInProgress = true;
    this.waveStartTime = this.time.now;
    this.waveEnemiesSpawned = 0;
    this.waveEnemyCount = 0;
    this.waveEnemyMaxCount = 10 + this.wave * 5;
    this.waveEnemiesPerBeat = Math.min(1 + Math.floor(this.wave / 3), 4);
    
    this.hud.updateWave(this.wave);
    
    const newBPM = 120 + this.wave * 5;
    this.soundManager.setBPM(Math.min(newBPM, 180));
  }
  
  private spawnEnemiesOnBeat(beat: number): void {
    if (!this.waveInProgress || this.gameOver) return;
    if (this.waveEnemyCount >= this.waveEnemyMaxCount) return;
    if (this.enemies.length >= this.maxEnemies) return;
    
    if (beat % 2 === 0) {
      for (let i = 0; i < this.waveEnemiesPerBeat; i++) {
        if (this.waveEnemyCount < this.waveEnemyMaxCount && this.enemies.length < this.maxEnemies) {
          this.spawnEnemy(beat);
          this.waveEnemyCount++;
        }
      }
    }
  }
  
  private spawnEnemy(spawnBeat: number): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    let x: number, y: number;
    const side = Math.floor(Math.random() * 4);
    
    const margin = 50;
    switch (side) {
      case 0:
        x = Math.random() * width;
        y = -margin;
        break;
      case 1:
        x = width + margin;
        y = Math.random() * height;
        break;
      case 2:
        x = Math.random() * width;
        y = height + margin;
        break;
      default:
        x = -margin;
        y = Math.random() * height;
        break;
    }
    
    const typeRoll = Math.random();
    let type: number;
    
    if (this.wave >= 10 && typeRoll < 0.1) {
      type = 3;
    } else if (this.wave >= 5 && typeRoll < 0.25) {
      type = 2;
    } else if (this.wave >= 2 && typeRoll < 0.5) {
      type = 1;
    } else {
      type = 0;
    }
    
    const config = this.enemyConfig[type];
    const speedMultiplier = 1 + (this.wave - 1) * 0.08;
    
    const container = this.add.container(x, y).setDepth(20);
    const graphics = this.add.graphics();
    const healthBar = this.add.graphics();
    
    const size = config.size;
    
    graphics.fillStyle(config.color, 1);
    
    if (type === 0) {
      graphics.fillCircle(0, 0, size);
    } else if (type === 1) {
      graphics.fillTriangle(0, -size, -size * 0.866, size * 0.5, size * 0.866, size * 0.5);
    } else if (type === 2) {
      graphics.fillRect(-size, -size, size * 2, size * 2);
    } else {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) {
          graphics.beginPath();
          graphics.moveTo(px, py);
        } else {
          graphics.lineTo(px, py);
        }
      }
      graphics.closePath();
      graphics.fillPath();
    }
    
    graphics.lineStyle(2, 0xffffff, 0.8);
    if (type === 0) {
      graphics.strokeCircle(0, 0, size);
    } else if (type === 1) {
      graphics.strokeTriangle(0, -size, -size * 0.866, size * 0.5, size * 0.866, size * 0.5);
    } else if (type === 2) {
      graphics.strokeRect(-size, -size, size * 2, size * 2);
    } else {
      graphics.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) {
          graphics.moveTo(px, py);
        } else {
          graphics.lineTo(px, py);
        }
      }
      graphics.closePath();
      graphics.strokePath();
    }
    
    graphics.fillStyle(0xffffff, 0.3);
    graphics.fillCircle(-size * 0.3, -size * 0.3, size * 0.3);
    
    container.add([graphics, healthBar]);
    
    const enemy: Enemy = {
      x,
      y,
      targetX: this.centerX,
      targetY: this.centerY,
      speed: config.speed * speedMultiplier,
      health: config.health * (1 + (this.wave - 1) * 0.15),
      maxHealth: config.health * (1 + (this.wave - 1) * 0.15),
      type,
      frequency: config.frequency,
      graphics: container,
      healthBar,
      angle: Math.atan2(this.centerY - y, this.centerX - x),
      movePattern: Math.floor(Math.random() * 3),
      spawnBeat,
      reachedCenter: false
    };
    
    this.enemies.push(enemy);
  }
  
  update(time: number, delta: number): void {
    if (this.gameOver) return;
    
    this.soundManager.update(time, delta);
    
    this.updateStarfield();
    this.drawGrid();
    
    this.updateTurrets(time, delta);
    this.updateEnemies(time, delta);
    this.updateBullets(time, delta);
    this.updateParticles(time, delta);
    this.updateHaloEffects(time, delta);
    this.updateCombo(time, delta);
    this.updateChordWave(time, delta);
    
    this.checkWaveComplete();
    this.hud.updateEnergy(this.energy, this.maxEnergy);
    
    if (this.selectedTurretType !== null) {
      const pointer = this.input.activePointer;
      this.updateGridHighlight(pointer.x, pointer.y);
    }
  }
  
  private updateTurrets(time: number, delta: number): void {
    this.turrets.forEach(turret => {
      if (time - turret.lastShootTime >= turret.shootInterval) {
        const target = this.findNearestEnemy(turret.x, turret.y, turret.range);
        
        if (target) {
          this.shootBullet(turret, target);
          turret.lastShootTime = time;
        }
      }
    });
  }
  
  private findNearestEnemy(x: number, y: number, range: number): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = range;
    
    this.enemies.forEach(enemy => {
      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    });
    
    return nearest;
  }
  
  private shootBullet(turret: Turret, target: Enemy): void {
    const angle = Math.atan2(target.y - turret.y, target.x - turret.x);
    const speed = 8;
    
    const graphics = this.add.graphics().setDepth(15);
    const trail = this.add.graphics().setDepth(14);
    const color = Phaser.Display.Color.HexStringToColor(this.turretConfig[turret.type].color).color;
    
    graphics.fillStyle(color, 1);
    graphics.fillCircle(0, 0, 6);
    graphics.lineStyle(2, 0xffffff, 0.8);
    graphics.strokeCircle(0, 0, 6);
    
    const bullet: Bullet = {
      x: turret.x,
      y: turret.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: turret.damage,
      frequency: turret.frequency,
      graphics,
      trail,
      life: 2000
    };
    
    this.bullets.push(bullet);
    this.soundManager.playShootSound(turret.frequency);
  }
  
  private updateBullets(time: number, delta: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life -= delta;
      
      bullet.graphics.setPosition(bullet.x, bullet.y);
      
      bullet.trail.clear();
      bullet.trail.lineStyle(3, Phaser.Display.Color.HexStringToColor(this.turretConfig[0].color).color, 0.4);
      bullet.trail.beginPath();
      bullet.trail.moveTo(bullet.x - bullet.vx * 2, bullet.y - bullet.vy * 2);
      bullet.trail.lineTo(bullet.x, bullet.y);
      bullet.trail.strokePath();
      
      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y);
        const hitRadius = this.enemyConfig[enemy.type].size + 6;
        
        if (dist < hitRadius) {
          this.hitEnemy(enemy, bullet, j);
          hit = true;
          break;
        }
      }
      
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;
      
      if (hit || bullet.life <= 0 || bullet.x < -50 || bullet.x > width + 50 || bullet.y < -50 || bullet.y > height + 50) {
        bullet.graphics.destroy();
        bullet.trail.destroy();
        this.bullets.splice(i, 1);
      }
    }
  }
  
  private hitEnemy(enemy: Enemy, bullet: Bullet, enemyIndex: number): void {
    enemy.health -= bullet.damage;
    
    this.updateEnemyHealthBar(enemy);
    
    const color = Phaser.Display.Color.HexStringToColor(this.turretConfig[0].color).color;
    this.createParticles(enemy.x, enemy.y, color, 5);
    this.createHaloEffect(enemy.x, enemy.y, color, 40);
    
    this.soundManager.playHitSound();
    
    enemy.graphics.setScale(1.2);
    this.tweens.add({
      targets: enemy.graphics,
      scale: 1,
      duration: 100,
      ease: 'Quad.easeOut'
    });
    
    if (enemy.health <= 0) {
      this.killEnemy(enemy, enemyIndex);
    }
    
    this.combo++;
    this.comboTimer = this.comboTimeout;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }
    
    const comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.2;
    const points = Math.floor(this.enemyConfig[enemy.type].points * comboMultiplier);
    this.score += points;
    
    this.energy = Math.min(this.energy + this.energyPerHit, this.maxEnergy);
    
    this.hud.updateScore(this.score);
    this.hud.updateCombo(this.combo);
  }
  
  private updateEnemyHealthBar(enemy: Enemy): void {
    enemy.healthBar.clear();
    
    const size = this.enemyConfig[enemy.type].size;
    const barWidth = size * 2;
    const barHeight = 4;
    const healthPercent = Phaser.Math.Clamp(enemy.health / enemy.maxHealth, 0, 1);
    
    enemy.healthBar.fillStyle(0x333333, 0.8);
    enemy.healthBar.fillRoundedRect(-barWidth / 2, -size - 12, barWidth, barHeight, 2);
    
    const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
    enemy.healthBar.fillStyle(healthColor, 1);
    enemy.healthBar.fillRoundedRect(-barWidth / 2, -size - 12, barWidth * healthPercent, barHeight, 2);
  }
  
  private killEnemy(enemy: Enemy, index: number): void {
    const color = this.enemyConfig[enemy.type].color;
    this.createParticles(enemy.x, enemy.y, color, 15);
    this.createHaloEffect(enemy.x, enemy.y, color, 80);
    
    enemy.graphics.destroy();
    this.enemies.splice(index, 1);
  }
  
  private updateEnemies(time: number, delta: number): void {
    const centerCellX = Math.floor(this.gridCols / 2);
    const centerCellY = Math.floor(this.gridRows / 2);
    const coreRadius = this.cellSize * 0.6;
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      const distToCenter = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.centerX, this.centerY);
      
      if (distToCenter < coreRadius && !enemy.reachedCenter) {
        enemy.reachedCenter = true;
        this.enemyReachedCenter(enemy, i);
        continue;
      }
      
      let moveX = enemy.targetX - enemy.x;
      let moveY = enemy.targetY - enemy.y;
      const dist = Math.sqrt(moveX * moveX + moveY * moveY);
      
      if (dist > 0) {
        moveX /= dist;
        moveY /= dist;
      }
      
      if (enemy.movePattern === 1) {
        const perpX = -moveY;
        const perpY = moveX;
        const wobble = Math.sin(time * 0.005 + enemy.spawnBeat) * 0.5;
        moveX += perpX * wobble;
        moveY += perpY * wobble;
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= len;
        moveY /= len;
      } else if (enemy.movePattern === 2) {
        const spiralFactor = 0.3;
        const angle = Math.atan2(enemy.y - this.centerY, enemy.x - this.centerX);
        const newAngle = angle + spiralFactor * delta * 0.001;
        const newDist = Math.max(dist - enemy.speed * delta * 0.1, coreRadius);
        moveX = Math.cos(newAngle) * newDist - enemy.x;
        moveY = Math.sin(newAngle) * newDist - enemy.y;
        const len = Math.sqrt(moveX * moveX + moveY * moveY);
        if (len > 0) {
          moveX /= len;
          moveY /= len;
        }
      }
      
      enemy.x += moveX * enemy.speed * delta * 0.06;
      enemy.y += moveY * enemy.speed * delta * 0.06;
      enemy.angle = Math.atan2(moveY, moveX);
      
      enemy.graphics.setPosition(enemy.x, enemy.y);
      enemy.graphics.setRotation(enemy.angle);
      
      if (enemy.health < enemy.maxHealth) {
        this.updateEnemyHealthBar(enemy);
      }
    }
  }
  
  private enemyReachedCenter(enemy: Enemy, index: number): void {
    const damage = 10 + enemy.type * 10;
    this.health = Math.max(0, this.health - damage);
    this.combo = 0;
    
    this.hud.updateHealth(this.health);
    this.hud.updateCombo(this.combo);
    
    this.soundManager.playMissSound();
    this.hud.triggerScreenFlash(200, 0xff0000);
    this.hud.triggerScreenShake(0.03, 200);
    
    this.createParticles(this.centerX, this.centerY, 0xff0000, 20);
    this.createHaloEffect(this.centerX, this.centerY, 0xff0000, 100);
    
    enemy.graphics.destroy();
    this.enemies.splice(index, 1);
    
    if (this.health <= 0) {
      this.triggerGameOver();
    }
  }
  
  private updateCombo(time: number, delta: number): void {
    if (this.combo > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.hud.updateCombo(this.combo);
      }
    }
  }
  
  private createParticles(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const life = Math.random() * 500 + 300;
      
      const graphics = this.add.graphics().setDepth(50);
      graphics.fillStyle(color, 1);
      graphics.fillCircle(0, 0, Math.random() * 4 + 2);
      
      const particle: Particle = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        color,
        size: Math.random() * 4 + 2,
        graphics
      };
      
      this.particles.push(particle);
    }
  }
  
  private updateParticles(time: number, delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= delta;
      
      const alpha = particle.life / particle.maxLife;
      particle.graphics.setPosition(particle.x, particle.y);
      particle.graphics.setAlpha(alpha);
      
      if (particle.life <= 0) {
        particle.graphics.destroy();
        this.particles.splice(i, 1);
      }
    }
  }
  
  private createHaloEffect(x: number, y: number, color: number, maxRadius: number = 60): void {
    const graphics = this.add.graphics().setDepth(60);
    
    const halo: HaloEffect = {
      x,
      y,
      radius: 5,
      maxRadius,
      alpha: 1,
      color,
      graphics
    };
    
    this.haloEffects.push(halo);
  }
  
  private updateHaloEffects(time: number, delta: number): void {
    for (let i = this.haloEffects.length - 1; i >= 0; i--) {
      const halo = this.haloEffects[i];
      
      halo.radius += delta * 0.2;
      halo.alpha = 1 - (halo.radius / halo.maxRadius);
      
      halo.graphics.clear();
      halo.graphics.lineStyle(3, halo.color, halo.alpha);
      halo.graphics.strokeCircle(halo.x, halo.y, halo.radius);
      
      if (halo.radius >= halo.maxRadius || halo.alpha <= 0) {
        halo.graphics.destroy();
        this.haloEffects.splice(i, 1);
      }
    }
  }
  
  private triggerChordWave(x: number, y: number): void {
    this.chordWaveActive = true;
    this.chordWaveRadius = 0;
    this.energy = 0;
    
    this.hud.triggerScreenFlash(300, 0xffffff);
    this.hud.triggerScreenShake(0.05, 500);
    this.soundManager.playChordWaveSound();
    
    this.createHaloEffect(x, y, 0xffffff, this.chordWaveMaxRadius);
    this.createParticles(x, y, 0xffffff, 30);
  }
  
  private updateChordWave(time: number, delta: number): void {
    if (!this.chordWaveActive) return;
    
    this.chordWaveRadius += delta * 1.5;
    
    this.chordWaveGraphics.clear();
    this.chordWaveGraphics.lineStyle(4, 0xffffff, 0.8);
    this.chordWaveGraphics.strokeCircle(this.centerX, this.centerY, this.chordWaveRadius);
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const dist = Phaser.Math.Distance.Between(this.centerX, this.centerY, enemy.x, enemy.y);
      
      if (Math.abs(dist - this.chordWaveRadius) < 20) {
        enemy.health -= 100;
        this.updateEnemyHealthBar(enemy);
        
        if (enemy.health <= 0) {
          this.killEnemy(enemy, i);
          this.score += this.enemyConfig[enemy.type].points * 2;
          this.hud.updateScore(this.score);
        }
      }
    }
    
    if (this.chordWaveRadius >= this.chordWaveMaxRadius) {
      this.chordWaveActive = false;
      this.chordWaveGraphics.clear();
    }
  }
  
  private checkWaveComplete(): void {
    if (this.waveInProgress && 
        this.waveEnemyCount >= this.waveEnemyMaxCount && 
        this.enemies.length === 0) {
      this.waveInProgress = false;
      this.wave++;
      
      this.time.delayedCall(this.waveDelay, () => {
        if (!this.gameOver) {
          this.startWave();
        }
      });
    }
  }
  
  private createGameOverScreen(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.gameOverContainer = this.add.container(width / 2, height / 2).setDepth(1000);
    this.gameOverContainer.setVisible(false);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x0d0221, 0.9);
    bg.lineStyle(3, 0xff00ff, 1);
    bg.strokeRoundedRect(-250, -150, 500, 300, 20);
    bg.fillRoundedRect(-250, -150, 500, 300, 20);
    
    const title = this.add.text(0, -80, '游戏结束', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '48px',
      color: '#ff00ff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    const finalScore = this.add.text(0, -10, '', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#00ffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    const finalWave = this.add.text(0, 25, '', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#ff8800',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    const finalCombo = this.add.text(0, 60, '', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '24px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    const restartBtn = this.add.text(0, 110, '点击重新开始', {
      fontFamily: 'Segoe UI, Microsoft YaHei, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#00ffff',
      strokeThickness: 2
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    restartBtn.on('pointerover', () => {
      restartBtn.setScale(1.1);
    });
    
    restartBtn.on('pointerout', () => {
      restartBtn.setScale(1);
    });
    
    restartBtn.on('pointerdown', () => {
      this.restartGame();
    });
    
    this.gameOverContainer.add([bg, title, finalScore, finalWave, finalCombo, restartBtn]);
    this.gameOverContainer.setData('scoreText', finalScore);
    this.gameOverContainer.setData('waveText', finalWave);
    this.gameOverContainer.setData('comboText', finalCombo);
  }
  
  private triggerGameOver(): void {
    this.gameOver = true;
    this.soundManager.stopBackgroundMusic();
    
    const scoreText = this.gameOverContainer.getData('scoreText') as Phaser.GameObjects.Text;
    const waveText = this.gameOverContainer.getData('waveText') as Phaser.GameObjects.Text;
    const comboText = this.gameOverContainer.getData('comboText') as Phaser.GameObjects.Text;
    
    scoreText.setText(`最终得分: ${this.score}`);
    waveText.setText(`到达波次: ${this.wave}`);
    comboText.setText(`最高连击: ${this.maxCombo}`);
    
    this.gameOverContainer.setVisible(true);
    this.gameOverContainer.setScale(0.5);
    this.gameOverContainer.setAlpha(0);
    
    this.tweens.add({
      targets: this.gameOverContainer,
      scale: 1,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }
  
  private restartGame(): void {
    this.score = 0;
    this.wave = 1;
    this.health = this.maxHealth;
    this.combo = 0;
    this.maxCombo = 0;
    this.energy = 0;
    this.gameOver = false;
    
    this.turrets.forEach(t => t.graphics.destroy());
    this.enemies.forEach(e => e.graphics.destroy());
    this.bullets.forEach(b => { b.graphics.destroy(); b.trail.destroy(); });
    this.particles.forEach(p => p.graphics.destroy());
    this.haloEffects.forEach(h => h.graphics.destroy());
    
    this.turrets = [];
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.haloEffects = [];
    
    this.occupiedCells = Array(this.gridCols).fill(null).map(() => Array(this.gridRows).fill(false));
    
    this.hud.updateScore(this.score);
    this.hud.updateHealth(this.health);
    this.hud.updateCombo(this.combo);
    this.hud.updateEnergy(this.energy, this.maxEnergy);
    
    this.gameOverContainer.setVisible(false);
    
    this.soundManager.setBPM(120);
    this.soundManager.startBackgroundMusic();
    
    this.startWave();
  }
  
  private resize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width;
    const height = gameSize.height;
    
    this.cameras.main.setSize(width, height);
    
    this.calculateGridPosition();
    this.centerX = this.gridOffsetX + (this.gridCols * this.cellSize) / 2;
    this.centerY = this.gridOffsetY + (this.gridRows * this.cellSize) / 2;
    
    this.starPositions = [];
    for (let i = 0; i < 150; i++) {
      this.starPositions.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2
      });
    }
    
    this.hud.resize(width, height);
    this.drawGrid();
    
    this.gameOverContainer.setPosition(width / 2, height / 2);
  }
}
