import Phaser from 'phaser';
import {
  Debris,
  OrbitGroup,
  StarParticle,
  LaserBeam,
  Particle,
  PowerUpAnimation,
  generatePolygon,
  generateOrbitPositions,
  getOrbitPosition,
  checkOrbitGroupClear,
  getDebrisColor,
  generateId,
  lerp,
  clamp,
  distance,
  calculateRating,
  getRatingColor,
  getShieldColor,
  hexToPhaserColor
} from '../utils/Utils';

type GameMode = 'timed' | 'infinite';

interface GameState {
  mode: GameMode;
  score: number;
  shield: number;
  maxShield: number;
  timeLeft: number;
  collisions: number;
  debrisCleared: number;
  totalDebris: number;
  isPaused: boolean;
  isGameOver: boolean;
  timeScale: number;
  slowMotionTimer: number;
  gravityWaveActive: boolean;
  gravityWaveTimer: number;
  shieldRegenTimer: number;
  infiniteSpawnTimer: number;
  orbitGroupSpawnTimer: number;
}

interface PowerUpItem {
  key: string;
  name: string;
  cost: number;
  icon: string;
  description: string;
  hotkey: string;
}

const POWER_UPS: PowerUpItem[] = [
  { key: 'shield', name: '护盾回满', cost: 50, icon: '●', description: '瞬间恢复所有护盾', hotkey: 'Q' },
  { key: 'gravity', name: '引力波', cost: 100, icon: '◎', description: '全屏垃圾吸向中心', hotkey: 'W' },
  { key: 'slow', name: '时间减缓', cost: 30, icon: '◷', description: '游戏速度降至0.3倍', hotkey: 'E' }
];

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private debrisMap: Map<string, Debris> = new Map();
  private orbitGroups: Map<string, OrbitGroup> = new Map();
  private starParticles: StarParticle[] = [];
  private laserBeams: LaserBeam[] = [];
  private particles: Particle[] = [];
  private powerUpAnimations: Map<string, PowerUpAnimation> = new Map();

  private ship!: { x: number; y: number; angle: number; vx: number; vy: number };
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private mousePos!: { x: number; y: number };
  private isMouseDown: boolean = false;
  private lastShotTime: number = 0;
  private shotCooldown: number = 150;

  private gameWidth: number = 0;
  private gameHeight: number = 0;
  private playAreaWidth: number = 0;
  private playAreaHeight: number = 0;
  private playAreaOffsetX: number = 0;
  private playAreaOffsetY: number = 0;

  private graphics!: Phaser.GameObjects.Graphics;
  private uiGraphics!: Phaser.GameObjects.Graphics;
  private textObjects!: Record<string, Phaser.GameObjects.Text>;
  private powerUpListTexts: Phaser.GameObjects.Text[] = [];
  private powerUpIconTexts: Phaser.GameObjects.Text[] = [];
  private powerUpHotkeyTexts: Phaser.GameObjects.Text[] = [];
  private powerUpTooltipTexts: Phaser.GameObjects.Text[] = [];

  private warningFlashTimer: number = 0;
  private warningFlashActive: boolean = false;
  private lowShieldWarning: boolean = false;

  private resultPanelData!: {
    visible: boolean;
    rating: string;
    score: number;
    cleared: number;
    total: number;
    collisions: number;
    clearRate: number;
  };

  private powerUpButtonStates: Map<string, { hover: boolean; flashTimer: number; scale: number }> = new Map();

  constructor() {
    super({ key: 'GameScene' });
  }

  init(): void {
    this.gameWidth = this.game.config.width as number;
    this.gameHeight = this.game.config.height as number;
    this.updatePlayArea();
    this.initGameState();
  }

  private updatePlayArea(): void {
    const panelWidth = 220;
    const bottomBarHeight = 100;
    this.playAreaWidth = this.gameWidth - panelWidth - 20;
    this.playAreaHeight = this.gameHeight - bottomBarHeight - 20;
    this.playAreaOffsetX = 10;
    this.playAreaOffsetY = 10;
  }

  private initGameState(): void {
    this.gameState = {
      mode: 'timed',
      score: 0,
      shield: 10,
      maxShield: 10,
      timeLeft: 60,
      collisions: 0,
      debrisCleared: 0,
      totalDebris: 50,
      isPaused: false,
      isGameOver: false,
      timeScale: 1.0,
      slowMotionTimer: 0,
      gravityWaveActive: false,
      gravityWaveTimer: 0,
      shieldRegenTimer: 10,
      infiniteSpawnTimer: 30,
      orbitGroupSpawnTimer: 20
    };

    this.ship = {
      x: this.playAreaOffsetX + this.playAreaWidth / 2,
      y: this.playAreaOffsetY + this.playAreaHeight / 2,
      angle: -Math.PI / 2,
      vx: 0,
      vy: 0
    };

    this.resultPanelData = {
      visible: false,
      rating: 'C',
      score: 0,
      cleared: 0,
      total: 0,
      collisions: 0,
      clearRate: 0
    };
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();

    this.initInput();
    this.initTextObjects();
    this.initStarParticles();
    this.initDebris();
    this.initPowerUpButtons();
    this.initPowerUpAnimations();

    this.scale.on('resize', this.handleResize, this);
  }

  private initInput(): void {
    this.keys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      Q: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      E: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      ESC: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      ONE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      TWO: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      THREE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.THREE)
    };

    this.mousePos = { x: 0, y: 0 };

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.mousePos.x = pointer.x;
      this.mousePos.y = pointer.y;
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isMouseDown = true;
        this.checkPowerUpClick(pointer.x, pointer.y);
        this.checkResultPanelClick(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) {
        this.isMouseDown = false;
      }
    });

    this.keys.Q.on('down', () => this.activatePowerUp('shield'));
    this.keys.W.on('down', () => this.activatePowerUp('gravity'));
    this.keys.E.on('down', () => this.activatePowerUp('slow'));
    this.keys.ONE.on('down', () => this.activatePowerUp('shield'));
    this.keys.TWO.on('down', () => this.activatePowerUp('gravity'));
    this.keys.THREE.on('down', () => this.activatePowerUp('slow'));
  }

  private initTextObjects(): void {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Courier New, Consolas, monospace',
      fontSize: '14px',
      color: '#ffffff',
      align: 'left'
    };

    this.textObjects = {
      mode: this.add.text(0, 0, '', textStyle),
      time: this.add.text(0, 0, '', textStyle),
      shield: this.add.text(0, 0, '', textStyle),
      score: this.add.text(0, 0, '', textStyle),
      collisions: this.add.text(0, 0, '', textStyle),
      debrisCount: this.add.text(0, 0, '', textStyle),
      powerUpLabels: this.add.text(0, 0, '', textStyle),
      resultTitle: this.add.text(0, 0, '', { ...textStyle, fontSize: '32px', align: 'center' }),
      resultRating: this.add.text(0, 0, '', { ...textStyle, fontSize: '48px', align: 'center' }),
      resultStats: this.add.text(0, 0, '', { ...textStyle, fontSize: '18px', align: 'center' }),
      resultButton: this.add.text(0, 0, '', { ...textStyle, fontSize: '20px', align: 'center' }),
      modeToggle: this.add.text(0, 0, '', { ...textStyle, fontSize: '12px', align: 'center' })
    };

    this.powerUpListTexts = [];
    for (let i = 0; i < 3; i++) {
      this.powerUpListTexts.push(this.add.text(0, 0, '', {
        fontFamily: 'Courier New, Consolas, monospace',
        fontSize: '12px',
        color: '#ffffff'
      }).setDepth(100).setVisible(false));
    }

    this.powerUpIconTexts = [];
    this.powerUpHotkeyTexts = [];
    this.powerUpTooltipTexts = [];
    for (let i = 0; i < 3; i++) {
      this.powerUpIconTexts.push(this.add.text(0, 0, '', {
        fontFamily: 'Courier New, Consolas, monospace',
        fontSize: '20px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5).setDepth(200));

      this.powerUpHotkeyTexts.push(this.add.text(0, 0, '', {
        fontFamily: 'Courier New, Consolas, monospace',
        fontSize: '10px',
        color: '#aaaaaa',
        align: 'center'
      }).setOrigin(0.5).setDepth(200));

      this.powerUpTooltipTexts.push(this.add.text(0, 0, '', {
        fontFamily: 'Courier New, Consolas, monospace',
        fontSize: '11px',
        color: '#00e5ff',
        align: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5).setDepth(300).setVisible(false));
    }
  }

  private initStarParticles(): void {
    this.starParticles = [];
    for (let i = 0; i < 200; i++) {
      this.starParticles.push({
        x: this.playAreaOffsetX + Math.random() * this.playAreaWidth,
        y: this.playAreaOffsetY + Math.random() * this.playAreaHeight,
        size: 1 + Math.random(),
        alpha: 0.2 + Math.random() * 0.6,
        alphaPhase: Math.random() * Math.PI * 2,
        alphaSpeed: (Math.PI * 2) / (4000 + Math.random() * 4000),
        minAlpha: 0.2,
        maxAlpha: 0.8
      });
    }
  }

  private initDebris(): void {
    this.debrisMap.clear();
    this.orbitGroups.clear();

    for (let i = 0; i < 50; i++) {
      this.spawnDebris();
    }

    this.gameState.totalDebris = 50;
  }

  private spawnDebris(orbitGroupId: string | null = null, orbitX?: number, orbitY?: number): Debris {
    const size = 6 + Math.random() * 12;
    const isHighRisk = size > 15;
    const speed = (0.1 + Math.random() * 0.4);
    const angle = Math.random() * Math.PI * 2;

    let x: number, y: number;
    if (orbitX !== undefined && orbitY !== undefined) {
      x = orbitX;
      y = orbitY;
    } else {
      x = this.playAreaOffsetX + 50 + Math.random() * (this.playAreaWidth - 100);
      y = this.playAreaOffsetY + 50 + Math.random() * (this.playAreaHeight - 100);
      while (distance(x, y, this.ship.x, this.ship.y) < 100) {
        x = this.playAreaOffsetX + 50 + Math.random() * (this.playAreaWidth - 100);
        y = this.playAreaOffsetY + 50 + Math.random() * (this.playAreaHeight - 100);
      }
    }

    const debris: Debris = {
      id: generateId(),
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: size,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      isHighRisk: isHighRisk,
      points: isHighRisk ? 20 : 10,
      isClearing: false,
      clearPhase: null,
      clearTimer: 0,
      scale: 1,
      orbitGroup: orbitGroupId,
      polygonPoints: generatePolygon(size),
      color: getDebrisColor(isHighRisk),
      alpha: 1
    };

    this.debrisMap.set(debris.id, debris);
    return debris;
  }

  private spawnOrbitGroup(): void {
    const groupId = generateId();
    const centerX = this.playAreaOffsetX + 100 + Math.random() * (this.playAreaWidth - 200);
    const centerY = this.playAreaOffsetY + 100 + Math.random() * (this.playAreaHeight - 200);
    const radius = 60 + Math.random() * 40;
    const count = 3 + Math.floor(Math.random() * 3);
    const ellipseRatio = 0.6 + Math.random() * 0.2;

    const positions = generateOrbitPositions(centerX, centerY, radius, count, ellipseRatio, Math.random() * Math.PI * 2);
    const debrisIds: string[] = [];

    positions.forEach(pos => {
      const debris = this.spawnDebris(groupId, pos.x, pos.y);
      debrisIds.push(debris.id);
    });

    const group: OrbitGroup = {
      id: groupId,
      centerX: centerX,
      centerY: centerY,
      radius: radius,
      angle: 0,
      speed: 0.003 + Math.random() * 0.003,
      debrisIds: debrisIds,
      ellipseRatio: ellipseRatio,
      cleared: false
    };

    this.orbitGroups.set(groupId, group);
    this.gameState.totalDebris += count;
  }

  private initPowerUpButtons(): void {
    POWER_UPS.forEach(powerUp => {
      this.powerUpButtonStates.set(powerUp.key, {
        hover: false,
        flashTimer: 0,
        scale: 1
      });
    });
  }

  private initPowerUpAnimations(): void {
    POWER_UPS.forEach(powerUp => {
      this.powerUpAnimations.set(powerUp.key, {
        type: powerUp.key as 'shield' | 'gravity' | 'slow',
        timer: 0,
        maxTime: 0,
        active: false
      });
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.gameWidth = gameSize.width;
    this.gameHeight = gameSize.height;
    this.updatePlayArea();
  }

  update(time: number, delta: number): void {
    if (this.gameState.isPaused || this.gameState.isGameOver) {
      this.render();
      return;
    }

    const scaledDelta = delta * this.gameState.timeScale;

    this.updateStarParticles(scaledDelta);
    this.updateShip(scaledDelta);
    this.updateDebris(scaledDelta);
    this.updateOrbitGroups(scaledDelta);
    this.updateLasers(scaledDelta);
    this.updateParticles(scaledDelta);
    this.updatePowerUpAnimations(scaledDelta);
    this.updateGameState(time, scaledDelta);
    this.updateCollisions();
    this.updateWarningFlash(scaledDelta);
    this.updatePowerUpButtonStates(scaledDelta);

    if (this.isMouseDown && time - this.lastShotTime > this.shotCooldown) {
      this.shootLaser();
      this.lastShotTime = time;
    }

    this.render();
  }

  private updateStarParticles(delta: number): void {
    this.starParticles.forEach(star => {
      star.alphaPhase += star.alphaSpeed * delta;
      star.alpha = star.minAlpha + (Math.sin(star.alphaPhase) + 1) / 2 * (star.maxAlpha - star.minAlpha);
    });
  }

  private updateShip(delta: number): void {
    const acceleration = 0.015;
    const friction = 0.98;
    const maxSpeed = 8;

    if (this.keys.W.isDown) this.ship.vy -= acceleration * delta;
    if (this.keys.S.isDown) this.ship.vy += acceleration * delta;
    if (this.keys.A.isDown) this.ship.vx -= acceleration * delta;
    if (this.keys.D.isDown) this.ship.vx += acceleration * delta;

    this.ship.vx *= Math.pow(friction, delta / 16.67);
    this.ship.vy *= Math.pow(friction, delta / 16.67);

    const speed = Math.sqrt(this.ship.vx * this.ship.vx + this.ship.vy * this.ship.vy);
    if (speed > maxSpeed) {
      this.ship.vx = (this.ship.vx / speed) * maxSpeed;
      this.ship.vy = (this.ship.vy / speed) * maxSpeed;
    }

    this.ship.x += this.ship.vx * delta / 16.67;
    this.ship.y += this.ship.vy * delta / 16.67;

    this.ship.x = clamp(this.ship.x, this.playAreaOffsetX + 20, this.playAreaOffsetX + this.playAreaWidth - 20);
    this.ship.y = clamp(this.ship.y, this.playAreaOffsetY + 20, this.playAreaOffsetY + this.playAreaHeight - 20);

    this.ship.angle = Math.atan2(this.mousePos.y - this.ship.y, this.mousePos.x - this.ship.x);
  }

  private updateDebris(delta: number): void {
    const toRemove: string[] = [];

    this.debrisMap.forEach(debris => {
      if (debris.isClearing) {
        this.updateClearingDebris(debris, delta);
        if (debris.scale <= 0) {
          toRemove.push(debris.id);
        }
        return;
      }

      if (debris.orbitGroup) {
        return;
      }

      if (this.gameState.gravityWaveActive) {
        const centerX = this.playAreaOffsetX + this.playAreaWidth / 2;
        const centerY = this.playAreaOffsetY + this.playAreaHeight / 2;
        const dx = centerX - debris.x;
        const dy = centerY - debris.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
          const pullStrength = 0.05 * delta;
          debris.vx += (dx / dist) * pullStrength;
          debris.vy += (dy / dist) * pullStrength;
        } else {
          debris.isClearing = true;
          debris.clearPhase = 'shrinking';
          debris.clearTimer = 0.3;
          debris.scale = 0;
          return;
        }
      }

      debris.x += debris.vx * delta / 16.67;
      debris.y += debris.vy * delta / 16.67;
      debris.rotation += debris.rotationSpeed * delta / 16.67;

      if (debris.x < this.playAreaOffsetX + debris.size) {
        debris.x = this.playAreaOffsetX + debris.size;
        debris.vx = Math.abs(debris.vx);
      } else if (debris.x > this.playAreaOffsetX + this.playAreaWidth - debris.size) {
        debris.x = this.playAreaOffsetX + this.playAreaWidth - debris.size;
        debris.vx = -Math.abs(debris.vx);
      }

      if (debris.y < this.playAreaOffsetY + debris.size) {
        debris.y = this.playAreaOffsetY + debris.size;
        debris.vy = Math.abs(debris.vy);
      } else if (debris.y > this.playAreaOffsetY + this.playAreaHeight - debris.size) {
        debris.y = this.playAreaOffsetY + this.playAreaHeight - debris.size;
        debris.vy = -Math.abs(debris.vy);
      }
    });

    toRemove.forEach(id => this.debrisMap.delete(id));
  }

  private updateClearingDebris(debris: Debris, delta: number): void {
    debris.clearTimer -= delta / 1000;

    if (debris.clearPhase === 'rotating') {
      const totalTime = 0.5;
      const progress = 1 - (debris.clearTimer / totalTime);
      debris.rotationSpeed = lerp(0, Math.PI * 2, progress) * delta / 1000;
      debris.rotation += debris.rotationSpeed;

      if (debris.clearTimer <= 0) {
        debris.clearPhase = 'shrinking';
        debris.clearTimer = 0.3;
      }
    } else if (debris.clearPhase === 'shrinking') {
      const totalTime = 0.3;
      const progress = 1 - (debris.clearTimer / totalTime);
      debris.scale = lerp(1, 0, progress);
      debris.alpha = lerp(1, 0, progress);
    }
  }

  private updateOrbitGroups(delta: number): void {
    this.orbitGroups.forEach(group => {
      if (group.cleared) return;

      group.angle += group.speed * delta / 16.67;

      group.debrisIds.forEach((debrisId, index) => {
        const debris = this.debrisMap.get(debrisId);
        if (!debris || debris.isClearing) return;

        const debrisAngle = group.angle + (index / group.debrisIds.length) * Math.PI * 2;
        const pos = getOrbitPosition(group.centerX, group.centerY, group.radius, debrisAngle, group.ellipseRatio);

        debris.x = pos.x;
        debris.y = pos.y;
        debris.rotation += debris.rotationSpeed * delta / 16.67;
      });

      if (checkOrbitGroupClear(group, this.debrisMap)) {
        group.cleared = true;
        this.gameState.score += 30;
        this.spawnChainExplosion(group.centerX, group.centerY);
      }
    });
  }

  private updateLasers(delta: number): void {
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const laser = this.laserBeams[i];
      laser.timer -= delta;

      if (laser.timer <= 0) {
        this.laserBeams.splice(i, 1);
      }
    }
  }

  private updateParticles(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= delta;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      particle.x += particle.vx * delta / 16.67;
      particle.y += particle.vy * delta / 16.67;
      particle.alpha = particle.life / particle.maxLife;
      particle.vx *= 0.98;
      particle.vy *= 0.98;
    }
  }

  private updatePowerUpAnimations(delta: number): void {
    this.powerUpAnimations.forEach(anim => {
      if (anim.active) {
        anim.timer -= delta / 1000;
        if (anim.timer <= 0) {
          anim.active = false;
        }
      }
    });
  }

  private updateGameState(time: number, delta: number): void {
    if (this.gameState.mode === 'timed') {
      this.gameState.timeLeft -= delta / 1000;
      if (this.gameState.timeLeft <= 0) {
        this.gameState.timeLeft = 0;
        this.endGame();
      }
    } else {
      this.gameState.infiniteSpawnTimer -= delta / 1000;
      if (this.gameState.infiniteSpawnTimer <= 0) {
        for (let i = 0; i < 5; i++) {
          this.spawnDebris();
        }
        this.gameState.totalDebris += 5;
        this.gameState.infiniteSpawnTimer = 30;
      }
    }

    this.gameState.orbitGroupSpawnTimer -= delta / 1000;
    if (this.gameState.orbitGroupSpawnTimer <= 0 && this.orbitGroups.size < 3) {
      this.spawnOrbitGroup();
      this.gameState.orbitGroupSpawnTimer = 25 + Math.random() * 15;
    }

    this.gameState.shieldRegenTimer -= delta / 1000;
    if (this.gameState.shieldRegenTimer <= 0 && this.gameState.shield < this.gameState.maxShield) {
      this.gameState.shield = Math.min(this.gameState.maxShield, this.gameState.shield + 1);
      this.gameState.shieldRegenTimer = 10;
    }

    if (this.gameState.slowMotionTimer > 0) {
      this.gameState.slowMotionTimer -= delta / 1000;
      if (this.gameState.slowMotionTimer <= 0) {
        this.gameState.timeScale = 1.0;
      }
    }

    if (this.gameState.gravityWaveTimer > 0) {
      this.gameState.gravityWaveTimer -= delta / 1000;
      if (this.gameState.gravityWaveTimer <= 0) {
        this.gameState.gravityWaveActive = false;
      }
    }

    this.lowShieldWarning = this.gameState.shield <= 3;
  }

  private updateCollisions(): void {
    const shipRadius = 15;

    this.debrisMap.forEach(debris => {
      if (debris.isClearing) return;
      if (debris.scale <= 0) return;

      const debrisRadius = debris.size * debris.scale / 2;
      const dist = distance(this.ship.x, this.ship.y, debris.x, debris.y);

      if (dist < shipRadius + debrisRadius) {
        this.handleCollision(debris);
      }
    });
  }

  private handleCollision(debris: Debris): void {
    const damage = debris.isHighRisk ? 3 : 1;
    this.gameState.shield -= damage;
    this.gameState.collisions++;

    this.warningFlashActive = true;
    this.warningFlashTimer = 0.3;

    const angle = Math.atan2(this.ship.y - debris.y, this.ship.x - debris.x);
    this.ship.vx += Math.cos(angle) * 3;
    this.ship.vy += Math.sin(angle) * 3;

    debris.isClearing = true;
    debris.clearPhase = 'shrinking';
    debris.clearTimer = 0.3;

    if (this.gameState.shield <= 0) {
      this.gameState.shield = 0;
      this.endGame();
    }
  }

  private updateWarningFlash(delta: number): void {
    if (this.warningFlashActive) {
      this.warningFlashTimer -= delta / 1000;
      if (this.warningFlashTimer <= 0) {
        this.warningFlashActive = false;
      }
    }
  }

  private updatePowerUpButtonStates(delta: number): void {
    this.powerUpButtonStates.forEach((state, key) => {
      if (state.flashTimer > 0) {
        state.flashTimer -= delta / 1000;
        state.scale = 0.8 + Math.sin(state.flashTimer * 50) * 0.2;
        if (state.flashTimer <= 0) {
          state.scale = 1;
        }
      }

      const powerUp = POWER_UPS.find(p => p.key === key);
      if (!powerUp) return;

      const buttonX = this.getPowerUpButtonX(key);
      const buttonY = this.gameHeight - 50;
      const buttonRadius = 20;

      const dist = distance(this.mousePos.x, this.mousePos.y, buttonX, buttonY);
      state.hover = dist < buttonRadius && !this.gameState.isGameOver;
    });
  }

  private shootLaser(): void {
    if (this.gameState.isGameOver) return;

    const targetDebris = this.findClosestDebrisToMouse();

    let endX: number, endY: number;
    let targetId: string | null = null;

    if (targetDebris) {
      endX = targetDebris.x;
      endY = targetDebris.y;
      targetId = targetDebris.id;

      if (!targetDebris.isClearing && !this.gameState.gravityWaveActive) {
        targetDebris.isClearing = true;
        targetDebris.clearPhase = 'rotating';
        targetDebris.clearTimer = 0.5;
        this.gameState.score += targetDebris.points;
        this.gameState.debrisCleared++;
        this.spawnClearParticles(targetDebris.x, targetDebris.y);
      }
    } else {
      const length = 300;
      endX = this.ship.x + Math.cos(this.ship.angle) * length;
      endY = this.ship.y + Math.sin(this.ship.angle) * length;
    }

    this.laserBeams.push({
      startX: this.ship.x,
      startY: this.ship.y,
      endX: endX,
      endY: endY,
      timer: 300,
      maxTime: 300,
      targetDebrisId: targetId
    });
  }

  private findClosestDebrisToMouse(): Debris | null {
    const maxDistance = 30;
    let closestDebris: Debris | null = null;
    let closestDist = Infinity;

    this.debrisMap.forEach(debris => {
      if (debris.isClearing || debris.scale <= 0) return;

      const dist = distance(this.mousePos.x, this.mousePos.y, debris.x, debris.y);
      if (dist < maxDistance && dist < closestDist) {
        closestDist = dist;
        closestDebris = debris;
      }
    });

    return closestDebris;
  }

  private activatePowerUp(key: string): void {
    if (this.gameState.isGameOver) return;

    const powerUp = POWER_UPS.find(p => p.key === key);
    if (!powerUp) return;
    if (this.gameState.score < powerUp.cost) return;

    const state = this.powerUpButtonStates.get(key);
    if (state) {
      state.flashTimer = 0.15;
    }

    this.gameState.score -= powerUp.cost;

    switch (key) {
      case 'shield':
        this.gameState.shield = this.gameState.maxShield;
        const shieldAnim = this.powerUpAnimations.get('shield');
        if (shieldAnim) {
          shieldAnim.active = true;
          shieldAnim.timer = 0.5;
          shieldAnim.maxTime = 0.5;
        }
        break;

      case 'gravity':
        this.gameState.gravityWaveActive = true;
        this.gameState.gravityWaveTimer = 3;
        const gravityAnim = this.powerUpAnimations.get('gravity');
        if (gravityAnim) {
          gravityAnim.active = true;
          gravityAnim.timer = 3;
          gravityAnim.maxTime = 3;
        }
        break;

      case 'slow':
        this.gameState.timeScale = 0.3;
        this.gameState.slowMotionTimer = 5;
        const slowAnim = this.powerUpAnimations.get('slow');
        if (slowAnim) {
          slowAnim.active = true;
          slowAnim.timer = 5;
          slowAnim.maxTime = 5;
        }
        break;
    }
  }

  private checkPowerUpClick(x: number, y: number): void {
    if (this.gameState.isGameOver) return;

    POWER_UPS.forEach(powerUp => {
      const buttonX = this.getPowerUpButtonX(powerUp.key);
      const buttonY = this.gameHeight - 50;
      const buttonRadius = 20;

      if (distance(x, y, buttonX, buttonY) < buttonRadius) {
        this.activatePowerUp(powerUp.key);
      }
    });

    const toggleX = this.gameWidth - 110;
    const toggleY = this.gameHeight - 50;
    const toggleWidth = 100;
    const toggleHeight = 30;

    if (x >= toggleX - toggleWidth / 2 && x <= toggleX + toggleWidth / 2 &&
        y >= toggleY - toggleHeight / 2 && y <= toggleY + toggleHeight / 2) {
      this.toggleGameMode();
    }
  }

  private checkResultPanelClick(x: number, y: number): void {
    if (!this.resultPanelData.visible) return;

    const centerX = this.gameWidth / 2;
    const centerY = this.gameHeight / 2;
    const buttonX = centerX;
    const buttonY = centerY + 120;
    const buttonWidth = 200;
    const buttonHeight = 50;

    if (x >= buttonX - buttonWidth / 2 && x <= buttonX + buttonWidth / 2 &&
        y >= buttonY - buttonHeight / 2 && y <= buttonY + buttonHeight / 2) {
      this.restartGame();
    }
  }

  private getPowerUpButtonX(key: string): number {
    const index = POWER_UPS.findIndex(p => p.key === key);
    const spacing = 80;
    const startX = this.gameWidth / 2 - spacing;
    return startX + index * spacing;
  }

  private toggleGameMode(): void {
    this.gameState.mode = this.gameState.mode === 'timed' ? 'infinite' : 'timed';
    if (this.gameState.mode === 'timed') {
      this.gameState.timeLeft = 60;
    }
  }

  private spawnClearParticles(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
        color: 0xffff00,
        size: 2 + Math.random() * 2,
        alpha: 1
      });
    }
  }

  private spawnChainExplosion(x: number, y: number): void {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 800,
        maxLife: 800,
        color: Math.random() > 0.5 ? 0xff8800 : 0xff4400,
        size: 3 + Math.random() * 4,
        alpha: 1
      });
    }
  }

  private endGame(): void {
    this.gameState.isGameOver = true;

    const clearRate = this.gameState.totalDebris > 0
      ? this.gameState.debrisCleared / this.gameState.totalDebris
      : 0;

    const rating = calculateRating(clearRate, this.gameState.collisions);

    this.resultPanelData = {
      visible: true,
      rating: rating,
      score: this.gameState.score,
      cleared: this.gameState.debrisCleared,
      total: this.gameState.totalDebris,
      collisions: this.gameState.collisions,
      clearRate: clearRate
    };
  }

  private restartGame(): void {
    this.debrisMap.clear();
    this.orbitGroups.clear();
    this.laserBeams = [];
    this.particles = [];

    this.initGameState();
    this.initStarParticles();
    this.initDebris();
    this.initPowerUpAnimations();
  }

  private render(): void {
    this.graphics.clear();
    this.uiGraphics.clear();

    this.renderStarfield();
    this.renderStarParticles();
    this.renderPlayAreaBorder();
    this.renderDebris();
    this.renderLasers();
    this.renderShip();
    this.renderParticles();
    this.renderPowerUpEffects();
    this.renderWarningFlash();
    this.renderUI();
    this.renderPowerUpBar();
    this.renderResultPanel();
  }

  private renderStarfield(): void {
    this.graphics.fillStyle(hexToPhaserColor('#0a0e27'));
    this.graphics.fillRect(0, 0, this.gameWidth, this.gameHeight);
  }

  private renderStarParticles(): void {
    this.starParticles.forEach(star => {
      this.graphics.fillStyle(0xffffff, star.alpha);
      this.graphics.fillPoint(star.x, star.y, star.size);
    });
  }

  private renderPlayAreaBorder(): void {
    this.graphics.lineStyle(1, 0xffffff, 0.1);
    this.graphics.strokeRect(
      this.playAreaOffsetX,
      this.playAreaOffsetY,
      this.playAreaWidth,
      this.playAreaHeight
    );
  }

  private renderDebris(): void {
    this.debrisMap.forEach(debris => {
      if (debris.scale <= 0) return;

      this.graphics.save();
      this.graphics.translateCanvas(debris.x, debris.y);
      this.graphics.rotateCanvas(debris.rotation);
      this.graphics.scaleCanvas(debris.scale, debris.scale);

      let color = debris.color;
      let alpha = debris.alpha;

      if (debris.isHighRisk && !debris.isClearing) {
        const flash = Math.sin(this.time.now / 100) * 0.3 + 0.7;
        alpha *= flash;
      }

      if (debris.polygonPoints.length > 0) {
        this.graphics.fillStyle(color, alpha);
        this.graphics.beginPath();

        const firstPoint = debris.polygonPoints[0];
        this.graphics.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < debris.polygonPoints.length; i++) {
          const point = debris.polygonPoints[i];
          this.graphics.lineTo(point.x, point.y);
        }

        this.graphics.closePath();
        this.graphics.fillPath();

        this.graphics.lineStyle(1, 0xffffff, alpha * 0.5);
        this.graphics.strokePath();
      }

      this.graphics.restore();
    });
  }

  private renderLasers(): void {
    this.laserBeams.forEach(laser => {
      const alpha = laser.timer / laser.maxTime;
      this.graphics.lineStyle(2, 0xffff00, alpha * 0.7);
      this.graphics.beginPath();
      this.graphics.moveTo(laser.startX, laser.startY);
      this.graphics.lineTo(laser.endX, laser.endY);
      this.graphics.strokePath();

      this.graphics.lineStyle(4, 0xffff00, alpha * 0.3);
      this.graphics.beginPath();
      this.graphics.moveTo(laser.startX, laser.startY);
      this.graphics.lineTo(laser.endX, laser.endY);
      this.graphics.strokePath();
    });
  }

  private renderShip(): void {
    this.graphics.save();
    this.graphics.translateCanvas(this.ship.x, this.ship.y);
    this.graphics.rotateCanvas(this.ship.angle);

    if (this.lowShieldWarning) {
      const flash = Math.sin(this.time.now / 100) * 0.5 + 0.5;
      this.graphics.lineStyle(2, 0xff0000, flash);
      this.graphics.beginPath();
      this.graphics.arc(0, 0, 25, 0, Math.PI * 2);
      this.graphics.strokePath();
    }

    this.graphics.fillStyle(hexToPhaserColor('#00e5ff'));
    this.graphics.beginPath();
    this.graphics.moveTo(20, 0);
    this.graphics.lineTo(-12, -12);
    this.graphics.lineTo(-6, 0);
    this.graphics.lineTo(-12, 12);
    this.graphics.closePath();
    this.graphics.fillPath();

    this.graphics.lineStyle(1, 0xffffff, 0.8);
    this.graphics.strokePath();

    this.graphics.fillStyle(0xffffff, 0.8);
    this.graphics.beginPath();
    this.graphics.arc(2, 0, 3, 0, Math.PI * 2);
    this.graphics.fillPath();

    this.graphics.restore();
  }

  private renderParticles(): void {
    this.particles.forEach(particle => {
      this.graphics.fillStyle(particle.color, particle.alpha);
      this.graphics.fillPoint(particle.x, particle.y, particle.size);
    });
  }

  private renderPowerUpEffects(): void {
    const shieldAnim = this.powerUpAnimations.get('shield');
    if (shieldAnim && shieldAnim.active) {
      const progress = 1 - (shieldAnim.timer / shieldAnim.maxTime);
      const radius = lerp(20, 60, progress);
      const alpha = lerp(0.8, 0, progress);
      this.graphics.lineStyle(3, 0x00ff00, alpha);
      this.graphics.beginPath();
      this.graphics.arc(this.ship.x, this.ship.y, radius, 0, Math.PI * 2);
      this.graphics.strokePath();
    }

    const gravityAnim = this.powerUpAnimations.get('gravity');
    if (gravityAnim && gravityAnim.active) {
      const centerX = this.playAreaOffsetX + this.playAreaWidth / 2;
      const centerY = this.playAreaOffsetY + this.playAreaHeight / 2;
      const alpha = 0.3;
      const maxRadius = 300;

      for (let i = 0; i < 3; i++) {
        const radius = (maxRadius * (this.time.now % 2000) / 2000 + i * 100) % maxRadius;
        this.graphics.lineStyle(2, 0x00e5ff, alpha * (1 - radius / maxRadius));
        this.graphics.beginPath();
        this.graphics.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.graphics.strokePath();
      }
    }

    const slowAnim = this.powerUpAnimations.get('slow');
    if (slowAnim && slowAnim.active) {
      this.graphics.fillStyle(0x0000ff, 0.05);
      this.graphics.fillRect(
        this.playAreaOffsetX,
        this.playAreaOffsetY,
        this.playAreaWidth,
        this.playAreaHeight
      );
    }
  }

  private renderWarningFlash(): void {
    if (this.warningFlashActive) {
      const alpha = this.warningFlashTimer / 0.3 * 0.3;
      this.graphics.fillStyle(0xff0000, alpha);
      this.graphics.fillRect(
        this.playAreaOffsetX,
        this.playAreaOffsetY,
        this.playAreaWidth,
        this.playAreaHeight
      );
    }
  }

  private renderUI(): void {
    const panelX = this.gameWidth - 210;
    const panelY = 10;
    const panelWidth = 200;
    const panelHeight = 280;

    this.uiGraphics.fillStyle(0xffffff, 0.125);
    this.uiGraphics.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    this.uiGraphics.lineStyle(1, 0xffffff, 0.2);
    this.uiGraphics.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    const modeText = this.gameState.mode === 'timed' ? '限时模式' : '无限模式';
    this.textObjects.mode.setText(`模式: ${modeText}`);
    this.textObjects.mode.setPosition(panelX + 15, panelY + 15);

    let timeText = '';
    if (this.gameState.mode === 'timed') {
      const timeLeft = Math.ceil(this.gameState.timeLeft);
      timeText = `时间: ${timeLeft}s`;
      if (timeLeft <= 10) {
        const flash = Math.sin(this.time.now / 200) * 0.5 + 0.5;
        this.textObjects.time.setColor(`rgba(255, ${Math.floor(100 * flash)}, ${Math.floor(100 * flash)}, 1)`);
      } else {
        this.textObjects.time.setColor('#ffffff');
      }
    } else {
      const nextSpawn = Math.ceil(this.gameState.infiniteSpawnTimer);
      timeText = `下批生成: ${nextSpawn}s`;
    }
    this.textObjects.time.setText(timeText);
    this.textObjects.time.setPosition(panelX + 15, panelY + 40);

    const shieldText = `护盾: ${this.gameState.shield}/${this.gameState.maxShield}`;
    this.textObjects.shield.setText(shieldText);
    this.textObjects.shield.setPosition(panelX + 15, panelY + 65);

    const shieldBarX = panelX + 15;
    const shieldBarY = panelY + 85;
    const shieldBarWidth = panelWidth - 30;
    const shieldBarHeight = 12;

    this.uiGraphics.fillStyle(0x000000, 0.5);
    this.uiGraphics.fillRoundedRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight, 3);

    const shieldRatio = this.gameState.shield / this.gameState.maxShield;
    const shieldFillWidth = shieldBarWidth * shieldRatio;
    const shieldColor = getShieldColor(this.gameState.shield, this.gameState.maxShield);

    this.uiGraphics.fillStyle(shieldColor, 1);
    this.uiGraphics.fillRoundedRect(shieldBarX, shieldBarY, shieldFillWidth, shieldBarHeight, 3);

    this.uiGraphics.lineStyle(1, 0xffffff, 0.3);
    this.uiGraphics.strokeRoundedRect(shieldBarX, shieldBarY, shieldBarWidth, shieldBarHeight, 3);

    const scoreText = `积分: ${this.gameState.score}`;
    this.textObjects.score.setText(scoreText);
    this.textObjects.score.setPosition(panelX + 15, panelY + 110);

    const collisionsText = `碰撞: ${this.gameState.collisions}`;
    this.textObjects.collisions.setText(collisionsText);
    this.textObjects.collisions.setPosition(panelX + 15, panelY + 135);

    const debrisRemaining = this.debrisMap.size;
    const debrisText = `剩余: ${debrisRemaining}/${this.gameState.totalDebris}`;
    this.textObjects.debrisCount.setText(debrisText);
    this.textObjects.debrisCount.setPosition(panelX + 15, panelY + 160);

    this.textObjects.powerUpLabels.setText('道具快捷键:');
    this.textObjects.powerUpLabels.setPosition(panelX + 15, panelY + 195);

    POWER_UPS.forEach((powerUp, index) => {
      const canAfford = this.gameState.score >= powerUp.cost;
      const color = canAfford ? '#ffffff' : '#666666';
      const text = `  ${powerUp.hotkey}: ${powerUp.name} (${powerUp.cost}分)`;
      const lineY = panelY + 215 + index * 20;
      this.powerUpListTexts[index].setText(text);
      this.powerUpListTexts[index].setPosition(panelX + 15, lineY);
      this.powerUpListTexts[index].setColor(color);
      this.powerUpListTexts[index].setAlpha(canAfford ? 1 : 0.5);
      this.powerUpListTexts[index].setVisible(true);
    });
  }

  private renderPowerUpBar(): void {
    const barY = this.gameHeight - 50;

    this.uiGraphics.fillStyle(0xffffff, 0.1875);
    this.uiGraphics.fillRoundedRect(
      this.gameWidth / 2 - 150,
      barY - 35,
      300,
      70,
      8
    );

    POWER_UPS.forEach((powerUp, index) => {
      const state = this.powerUpButtonStates.get(powerUp.key);
      if (!state) return;

      const buttonX = this.getPowerUpButtonX(powerUp.key);
      const baseRadius = 20;
      const radius = baseRadius * state.scale * (state.hover ? 1.2 : 1);
      const canAfford = this.gameState.score >= powerUp.cost;

      this.uiGraphics.fillStyle(0xffffff, canAfford ? 0.3 : 0.1);
      this.uiGraphics.beginPath();
      this.uiGraphics.arc(buttonX, barY, radius, 0, Math.PI * 2);
      this.uiGraphics.fillPath();

      if (state.hover && canAfford) {
        this.uiGraphics.lineStyle(2, 0x00e5ff, 0.8);
        this.uiGraphics.beginPath();
        this.uiGraphics.arc(buttonX, barY, radius, 0, Math.PI * 2);
        this.uiGraphics.strokePath();
      }

      const iconColor = canAfford ? '#ffffff' : '#666666';
      this.powerUpIconTexts[index].setText(powerUp.icon);
      this.powerUpIconTexts[index].setPosition(buttonX, barY);
      this.powerUpIconTexts[index].setColor(iconColor);
      this.powerUpIconTexts[index].setVisible(true);

      this.powerUpHotkeyTexts[index].setText(`[${powerUp.hotkey}]`);
      this.powerUpHotkeyTexts[index].setPosition(buttonX, barY + 30);
      this.powerUpHotkeyTexts[index].setVisible(true);

      if (state.hover) {
        this.powerUpTooltipTexts[index].setText(`${powerUp.name} (${powerUp.cost}分)`);
        this.powerUpTooltipTexts[index].setPosition(buttonX, barY - 45);
        this.powerUpTooltipTexts[index].setVisible(true);
      } else {
        this.powerUpTooltipTexts[index].setVisible(false);
      }
    });

    const toggleX = this.gameWidth - 110;
    const toggleWidth = 100;
    const toggleHeight = 30;

    this.uiGraphics.fillStyle(0xffffff, 0.2);
    this.uiGraphics.fillRoundedRect(toggleX - toggleWidth / 2, barY - toggleHeight / 2, toggleWidth, toggleHeight, 4);

    const toggleText = this.gameState.mode === 'timed' ? '切换: 无限模式' : '切换: 限时模式';
    this.textObjects.modeToggle.setText(toggleText);
    this.textObjects.modeToggle.setPosition(toggleX, barY);
    this.textObjects.modeToggle.setOrigin(0.5);
  }

  private renderResultPanel(): void {
    if (!this.resultPanelData.visible) return;

    const centerX = this.gameWidth / 2;
    const centerY = this.gameHeight / 2;
    const panelWidth = 500;
    const panelHeight = 400;

    this.uiGraphics.fillStyle(0x000000, 0.7);
    this.uiGraphics.fillRect(0, 0, this.gameWidth, this.gameHeight);

    this.uiGraphics.fillStyle(0xffffff, 0.15);
    this.uiGraphics.fillRoundedRect(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      panelWidth,
      panelHeight,
      16
    );

    this.uiGraphics.lineStyle(1, 0xffffff, 0.3);
    this.uiGraphics.strokeRoundedRect(
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      panelWidth,
      panelHeight,
      16
    );

    this.textObjects.resultTitle.setText('游戏结束');
    this.textObjects.resultTitle.setPosition(centerX, centerY - 150);
    this.textObjects.resultTitle.setOrigin(0.5);
    this.textObjects.resultTitle.setColor('#ffffff');

    const ratingColor = getRatingColor(this.resultPanelData.rating);
    this.textObjects.resultRating.setText(`${this.resultPanelData.rating}级`);
    this.textObjects.resultRating.setPosition(centerX, centerY - 80);
    this.textObjects.resultRating.setOrigin(0.5);
    this.textObjects.resultRating.setColor(`#${ratingColor.toString(16).padStart(6, '0')}`);

    const statsText = [
      `总分: ${this.resultPanelData.score}`,
      `清理数量: ${this.resultPanelData.cleared}/${this.resultPanelData.total}`,
      `清理率: ${(this.resultPanelData.clearRate * 100).toFixed(1)}%`,
      `碰撞次数: ${this.resultPanelData.collisions}`
    ].join('\n');

    this.textObjects.resultStats.setText(statsText);
    this.textObjects.resultStats.setPosition(centerX, centerY + 20);
    this.textObjects.resultStats.setOrigin(0.5);
    this.textObjects.resultStats.setColor('#ffffff');

    const buttonX = centerX;
    const buttonY = centerY + 120;
    const buttonWidth = 200;
    const buttonHeight = 50;

    const buttonGrad = this.uiGraphics.createLinearGradient(
      buttonX - buttonWidth / 2, buttonY,
      buttonX + buttonWidth / 2, buttonY
    );
    buttonGrad.addColorStop(0, hexToPhaserColor('#ff1744'));
    buttonGrad.addColorStop(1, hexToPhaserColor('#b71c1c'));

    this.uiGraphics.fillGradientStyle(
      hexToPhaserColor('#ff1744'),
      hexToPhaserColor('#b71c1c'),
      hexToPhaserColor('#b71c1c'),
      hexToPhaserColor('#ff1744'),
      1
    );
    this.uiGraphics.fillRoundedRect(
      buttonX - buttonWidth / 2,
      buttonY - buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      8
    );

    const mouseDist = distance(this.mousePos.x, this.mousePos.y, buttonX, buttonY);
    if (mouseDist < buttonWidth / 2 && Math.abs(this.mousePos.y - buttonY) < buttonHeight / 2) {
      this.uiGraphics.lineStyle(3, 0xff5252, 0.8);
      this.uiGraphics.strokeRoundedRect(
        buttonX - buttonWidth / 2,
        buttonY - buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        8
      );
    }

    this.textObjects.resultButton.setText('再来一局');
    this.textObjects.resultButton.setPosition(buttonX, buttonY);
    this.textObjects.resultButton.setOrigin(0.5);
    this.textObjects.resultButton.setColor('#ffffff');
  }
}
