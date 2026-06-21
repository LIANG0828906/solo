import Phaser from 'phaser';
import { Player, PlayerState } from '../objects/Player';
import { GAME_WIDTH, GAME_HEIGHT, MAX_REWIND_CHARGES, MAX_PARTICLES } from '../main';

interface Gem {
  id: number;
  sprite: Phaser.Physics.Arcade.Sprite;
  collected: boolean;
  originalX: number;
  originalY: number;
  glow: Phaser.GameObjects.Graphics;
}

interface Platform {
  sprite: Phaser.Physics.Arcade.Sprite;
  isMoving: boolean;
  moveAxis: 'x' | 'y';
  moveRange: number;
  moveSpeed: number;
  startX: number;
  startY: number;
  phase: number;
  gfx: Phaser.GameObjects.Graphics;
  edgeGlow: Phaser.GameObjects.Graphics;
}

interface Checkpoint {
  x: number;
  y: number;
  active: boolean;
}

interface ParticleRecord {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
  createdAt: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private platforms: Platform[] = [];
  private gems: Gem[] = [];
  private checkpoints: Checkpoint[] = [];
  private portal!: {
    x: number;
    y: number;
    active: boolean;
    swirl: Phaser.GameObjects.Graphics;
    rings: Phaser.GameObjects.Graphics;
    container: Phaser.GameObjects.Container;
  };
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private rewindCharges = MAX_REWIND_CHARGES;
  private rewindActive = false;
  private levelTime = 0;
  private totalGems = 0;
  private collectedGems = 0;
  private currentLevel = 1;

  private uiGemsText!: Phaser.GameObjects.Text;
  private uiGemsIcon!: Phaser.GameObjects.Graphics;
  private uiChargesIcons: Phaser.GameObjects.Graphics[] = [];
  private uiTimerText!: Phaser.GameObjects.Text;
  private uiRewindBar!: Phaser.GameObjects.Graphics;
  private uiRewindLabel!: Phaser.GameObjects.Text;
  private uiScanLines!: Phaser.GameObjects.Graphics;

  private rewindRipple!: Phaser.GameObjects.Graphics;
  private rewindMask!: Phaser.GameObjects.Graphics;
  private bgStars: { gfx: Phaser.GameObjects.Graphics; x: number; y: number; vx: number; vy: number; size: number }[] = [];
  private particlesRecord: ParticleRecord[] = [];
  private particleIdCounter = 0;
  private particleGfx!: Phaser.GameObjects.Graphics;

  private gemReturnQueue: { gem: Gem; progress: number; startX: number; startY: number }[] = [];
  private gemReturnTimer = 0;
  private lastGemReturnInterval = 200;
  private gemRestoreList: number[] = [];

  private scanlinePulseTimer = 0;
  private isTransitioning = false;

  private worldBounds = { width: 2400, height: 1400 };

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { level?: number }): void {
    this.currentLevel = data.level || 1;
  }

  preload(): void {
    if (!this.textures.exists('particle')) {
      const gfx = this.make.graphics();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(16, 16, 16);
      gfx.generateTexture('particle', 32, 32);
      gfx.destroy();
    }
  }

  create(): void {
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.physics.world.setBounds(0, 0, this.worldBounds.width, this.worldBounds.height);
    this.createBackground();
    this.particleGfx = this.add.graphics();
    this.particleGfx.setDepth(100);

    this.buildLevel(this.currentLevel);

    const firstCp = this.checkpoints[0];
    this.player = new Player(this, firstCp ? firstCp.x : 100, firstCp ? firstCp.y : 500);
    this.setupCollisions();
    this.createPortal();
    this.createUI();
    this.setupCamera();

    this.levelTime = 0;
    this.rewindCharges = MAX_REWIND_CHARGES;

    this.shiftKey.on('down', () => this.tryStartRewind());
    this.shiftKey.on('up', () => this.stopRewindIfActive());

    this.playLevelIntro();
  }

  private createBackground(): void {
    const gradient = this.add.graphics();
    gradient.setScrollFactor(0);
    gradient.setDepth(-100);
    for (let y = 0; y < GAME_HEIGHT; y += 4) {
      const t = y / GAME_HEIGHT;
      const r = Phaser.Math.Linear(10, 25, t);
      const g = Phaser.Math.Linear(10, 20, t);
      const b = Phaser.Math.Linear(60, 90, t);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      gradient.fillStyle(color, 1);
      gradient.fillRect(0, y, GAME_WIDTH, 4);
    }

    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, this.worldBounds.width);
      const y = Phaser.Math.Between(0, this.worldBounds.height);
      const size = Phaser.Math.FloatBetween(0.6, 2.8);
      const g = this.add.graphics();
      const colors = [0xffffff, 0x88aaff, 0xffaaff, 0xaaffff, 0xffffaa];
      const c = Phaser.Utils.Array.GetRandom(colors);
      g.fillStyle(c, Phaser.Math.FloatBetween(0.35, 0.95));
      g.fillCircle(x, y, size);
      this.bgStars.push({
        gfx: g, x, y,
        vx: Phaser.Math.FloatBetween(-0.03, 0.03),
        vy: Phaser.Math.FloatBetween(-0.02, 0.02),
        size
      });
    }
  }

  private buildLevel(level: number): void {
    this.platforms = [];
    this.gems = [];
    this.checkpoints = [];

    const levelLayouts = this.getLevelLayouts();
    const layout = levelLayouts[Math.min(level - 1, levelLayouts.length - 1)];

    layout.platforms.forEach(p => {
      this.createPlatform(p.x, p.y, p.w, p.h, p.moving, p.axis, p.range, p.speed);
    });

    layout.checkpoints.forEach(c => {
      this.createCheckpoint(c.x, c.y);
    });

    let gid = 0;
    layout.gems.forEach(g => {
      this.createGem(gid++, g.x, g.y);
    });
    this.totalGems = this.gems.length;
  }

  private getLevelLayouts() {
    return [
      {
        platforms: [
          { x: 0, y: 1200, w: 600, h: 60, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 700, y: 1100, w: 300, h: 40, moving: true, axis: 'y' as const, range: 120, speed: 1.0 },
          { x: 1100, y: 1000, w: 280, h: 40, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 1500, y: 900, w: 220, h: 40, moving: true, axis: 'x' as const, range: 180, speed: 1.3 },
          { x: 1850, y: 800, w: 300, h: 40, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 200, y: 950, w: 200, h: 40, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 450, y: 780, w: 200, h: 40, moving: true, axis: 'y' as const, range: 100, speed: 0.8 },
          { x: 1200, y: 700, w: 220, h: 40, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 1500, y: 550, w: 200, h: 40, moving: true, axis: 'x' as const, range: 200, speed: 1.5 },
          { x: 2000, y: 450, w: 350, h: 60, moving: false, axis: 'x' as const, range: 0, speed: 1.0 }
        ],
        gems: [
          { x: 150, y: 1140 }, { x: 300, y: 1140 }, { x: 450, y: 1140 },
          { x: 820, y: 1030 },
          { x: 1180, y: 940 }, { x: 1300, y: 940 },
          { x: 260, y: 890 },
          { x: 540, y: 710 },
          { x: 1600, y: 830 },
          { x: 1930, y: 730 }, { x: 2050, y: 730 },
          { x: 1280, y: 640 },
          { x: 1580, y: 490 },
          { x: 2100, y: 390 }, { x: 2250, y: 390 }
        ],
        checkpoints: [
          { x: 120, y: 1150 },
          { x: 1200, y: 950 },
          { x: 2080, y: 400 }
        ]
      },
      {
        platforms: [
          { x: 0, y: 1250, w: 400, h: 50, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 500, y: 1180, w: 180, h: 36, moving: true, axis: 'x' as const, range: 250, speed: 1.4 },
          { x: 950, y: 1100, w: 220, h: 40, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 1280, y: 1000, w: 180, h: 36, moving: true, axis: 'y' as const, range: 160, speed: 1.1 },
          { x: 1600, y: 920, w: 260, h: 40, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 1980, y: 820, w: 180, h: 36, moving: true, axis: 'x' as const, range: 160, speed: 0.9 },
          { x: 200, y: 1000, w: 180, h: 36, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 80, y: 780, w: 220, h: 40, moving: true, axis: 'y' as const, range: 120, speed: 0.7 },
          { x: 450, y: 620, w: 200, h: 36, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 780, y: 720, w: 200, h: 36, moving: true, axis: 'x' as const, range: 160, speed: 1.2 },
          { x: 1120, y: 600, w: 200, h: 36, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 1450, y: 480, w: 220, h: 36, moving: true, axis: 'y' as const, range: 140, speed: 1.3 },
          { x: 1820, y: 380, w: 200, h: 36, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 2150, y: 280, w: 250, h: 50, moving: false, axis: 'x' as const, range: 0, speed: 1.0 }
        ],
        gems: [
          { x: 120, y: 1190 }, { x: 280, y: 1190 },
          { x: 580, y: 1120 },
          { x: 1020, y: 1040 }, { x: 1130, y: 1040 },
          { x: 1360, y: 930 },
          { x: 1680, y: 860 }, { x: 1800, y: 860 },
          { x: 270, y: 940 },
          { x: 170, y: 710 },
          { x: 530, y: 560 },
          { x: 2060, y: 760 },
          { x: 870, y: 660 },
          { x: 1200, y: 540 },
          { x: 1540, y: 420 },
          { x: 1900, y: 320 },
          { x: 2220, y: 220 }, { x: 2350, y: 220 }
        ],
        checkpoints: [
          { x: 100, y: 1200 },
          { x: 1050, y: 1050 },
          { x: 1160, y: 550 },
          { x: 2220, y: 230 }
        ]
      },
      {
        platforms: [
          { x: 0, y: 1300, w: 320, h: 45, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 420, y: 1200, w: 140, h: 32, moving: true, axis: 'y' as const, range: 180, speed: 1.5 },
          { x: 680, y: 1100, w: 140, h: 32, moving: true, axis: 'x' as const, range: 220, speed: 1.4 },
          { x: 1080, y: 1020, w: 160, h: 32, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 1350, y: 920, w: 140, h: 32, moving: true, axis: 'y' as const, range: 180, speed: 1.2 },
          { x: 1620, y: 820, w: 180, h: 36, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 1920, y: 720, w: 140, h: 32, moving: true, axis: 'x' as const, range: 180, speed: 1.5 },
          { x: 2200, y: 620, w: 200, h: 40, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 100, y: 1000, w: 160, h: 32, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 50, y: 800, w: 160, h: 32, moving: true, axis: 'y' as const, range: 140, speed: 1.0 },
          { x: 280, y: 640, w: 160, h: 32, moving: true, axis: 'x' as const, range: 180, speed: 1.3 },
          { x: 560, y: 520, w: 160, h: 32, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 830, y: 420, w: 160, h: 32, moving: true, axis: 'y' as const, range: 120, speed: 1.1 },
          { x: 1100, y: 320, w: 180, h: 36, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 1400, y: 220, w: 160, h: 32, moving: true, axis: 'x' as const, range: 180, speed: 1.4 },
          { x: 1720, y: 120, w: 220, h: 45, moving: false, axis: 'x' as const, range: 0, speed: 1.0 },
          { x: 2050, y: 400, w: 160, h: 32, moving: true, axis: 'y' as const, range: 200, speed: 1.2 },
          { x: 700, y: 860, w: 140, h: 32, moving: false, axis: 'x' as const, range: 0, speed: 1.0 }
        ],
        gems: [
          { x: 100, y: 1240 }, { x: 220, y: 1240 },
          { x: 480, y: 1140 },
          { x: 750, y: 1040 },
          { x: 1130, y: 960 }, { x: 1200, y: 960 },
          { x: 1410, y: 860 },
          { x: 1680, y: 760 }, { x: 1760, y: 760 },
          { x: 1980, y: 660 },
          { x: 2280, y: 560 }, { x: 2360, y: 560 },
          { x: 170, y: 940 },
          { x: 120, y: 740 },
          { x: 360, y: 580 },
          { x: 620, y: 460 },
          { x: 890, y: 360 },
          { x: 1170, y: 260 }, { x: 1240, y: 260 },
          { x: 1480, y: 160 },
          { x: 1780, y: 60 }, { x: 1870, y: 60 }, { x: 1920, y: 60 },
          { x: 2120, y: 340 },
          { x: 750, y: 800 }
        ],
        checkpoints: [
          { x: 80, y: 1250 },
          { x: 1120, y: 970 },
          { x: 600, y: 470 },
          { x: 1140, y: 270 },
          { x: 1800, y: 70 }
        ]
      }
    ];
  }

  private createPlatform(x: number, y: number, w: number, h: number,
    moving = false, axis: 'x' | 'y' = 'x', range = 0, speed = 1.0): void {

    const gfx = this.add.graphics();
    const edgeGlow = this.add.graphics();

    const draw = (pulse: number) => {
      gfx.clear();
      gfx.fillGradientStyle(
        0x4a2a8a, 0x3a1a6a,
        0x2a0a5a, 0x5a3aaa, 1);
      gfx.fillRoundedRect(0, 0, w, h, 8);
      gfx.lineStyle(2, 0x00ffff, 0.4 + pulse * 0.4);
      gfx.strokeRoundedRect(0, 0, w, h, 8);
      gfx.fillStyle(0x88ffff, 0.06 + pulse * 0.06);
      gfx.fillRect(4, 4, w - 8, Math.min(6, h / 4));

      edgeGlow.clear();
      edgeGlow.lineStyle(1, 0x00ffff, 0.18 + pulse * 0.25);
      edgeGlow.strokeRoundedRect(-3, -3, w + 6, h + 6, 10);
    };
    draw(0);

    const container = this.add.container(x, y, [gfx, edgeGlow]);
    const key = `plat_${x}_${y}_${w}_${h}`;
    if (!this.textures.exists(key)) {
      const tg = this.make.graphics();
      tg.fillStyle(0xffffff, 1);
      tg.fillRoundedRect(0, 0, w, h, 8);
      tg.generateTexture(key, w, h);
      tg.destroy();
    }

    const sprite = this.physics.add.staticSprite(x + w / 2, y + h / 2, key);
    sprite.setAlpha(0.001);
    sprite.setDisplaySize(w, h);
    sprite.setOffset(w / 2, h / 2);
    const sbody = sprite.body as Phaser.Physics.Arcade.StaticBody;
    sbody.setSize(w, h);

    let t = Math.random() * Math.PI * 2;
    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        t += 0.06 * speed;
        const pulse = (Math.sin(t) + 1) * 0.5;
        draw(pulse);

        if (moving && !this.rewindActive) {
          const offset = Math.sin(t * 0.5) * range;
          const nx = axis === 'x' ? x + offset : x;
          const ny = axis === 'y' ? y + offset : y;
          container.setPosition(nx, ny);
          sprite.setPosition(nx + w / 2, ny + h / 2);
          sbody.updateFromGameObject();
        }
      }
    });

    container.setDepth(5);
    edgeGlow.setDepth(4);

    this.platforms.push({
      sprite, isMoving: moving, moveAxis: axis, moveRange: range,
      moveSpeed: speed, startX: x, startY: y, phase: t, gfx, edgeGlow
    });
  }

  private createGem(id: number, x: number, y: number): void {
    const g = this.add.graphics();
    const draw = (rot: number, pulse: number) => {
      g.clear();
      const pts: Phaser.Geom.Point[] = [];
      for (let i = 0; i < 6; i++) {
        const a = rot + (i * Math.PI) / 3;
        pts.push(new Phaser.Geom.Point(
          Math.cos(a) * 16,
          Math.sin(a) * 16
        ));
      }
      g.fillGradientStyle(0xffe066, 0xffd700, 0xffaa00, 0xffcc33, 1);
      g.fillPoints(pts, true);
      g.lineStyle(2, 0xffffff, 0.6 + pulse * 0.3);
      g.strokePoints(pts, true);
    };
    draw(0, 0);

    const key = `gem_${id}`;
    if (!this.textures.exists(key)) {
      const tg = this.make.graphics();
      const pts: Phaser.Geom.Point[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        pts.push(new Phaser.Geom.Point(Math.cos(a) * 16 + 16, Math.sin(a) * 16 + 16));
      }
      tg.fillStyle(0xffd700, 1);
      tg.fillPoints(pts, true);
      tg.generateTexture(key, 32, 32);
      tg.destroy();
    }

    const sprite = this.physics.add.staticSprite(x, y, key);
    sprite.setAlpha(0.001);
    sprite.setSize(22, 22);
    sprite.setDisplaySize(32, 32);
    const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
    body.setCircle(14, 5, 5);

    const glow = this.add.graphics();
    const container = this.add.container(x, y, [glow, g]);
    container.setDepth(8);
    (container as any)._gemId = id;

    let tt = Math.random() * Math.PI * 2;
    this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        tt += 0.04;
        draw(tt, (Math.sin(tt * 2) + 1) * 0.5);
        glow.clear();
        const gr = 20 + Math.sin(tt * 1.5) * 8;
        for (let r = gr; r > 4; r -= 4) {
          glow.fillStyle(0xffd700, (r / gr) * 0.08);
          glow.fillCircle(0, 0, r);
        }
      }
    });

    const gem: Gem = { id, sprite, collected: false, originalX: x, originalY: y, glow: g };
    (sprite as any)._gemRef = gem;
    this.gems.push(gem);
  }

  private createCheckpoint(x: number, y: number): void {
    const sprite = this.add.graphics();
    const cpContainer = this.add.container(x, y - 50);
    cpContainer.add(sprite);
    cpContainer.setDepth(6);

    const draw = (pulse: number) => {
      sprite.clear();
      sprite.lineStyle(3, 0x39ff14, 0.5 + pulse * 0.4);
      sprite.fillStyle(0x00ff88, 0.1 + pulse * 0.2);
      sprite.fillTriangle(0, -40, -14, 0, 14, 0);
      sprite.strokeTriangle(0, -40, -14, 0, 14, 0);
      sprite.lineStyle(2, 0x39ff14, 0.7);
      sprite.lineBetween(0, 10, 0, 30);
      sprite.fillCircle(0, 10, 4);
    };
    draw(0);

    let tt = 0;
    this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        tt += 0.08;
        draw((Math.sin(tt) + 1) * 0.5);
      }
    });

    const cp: Checkpoint = { x, y: y - 50, active: false };
    (cpContainer as any)._cpRef = cp;
    this.checkpoints.push(cp);

    const trig = this.physics.add.staticSprite(x, y - 50, 'particle');
    trig.setCircle(30);
    trig.setAlpha(0.001);
    (trig as any)._cp = cp;
    this.physics.add.overlap(this.player, trig, (_p, _t) => {
      const c = (_t as any)._cp as Checkpoint;
      if (c && !c.active) {
        this.activateCheckpoint(c);
      }
    });
  }

  private createPortal(): void {
    const lastPlat = this.platforms[this.platforms.length - 1];
    const cx = lastPlat.sprite.x;
    const cy = lastPlat.sprite.y - 80;

    const swirl = this.add.graphics();
    const rings = this.add.graphics();

    let t = 0;
    let active = false;

    const container = this.add.container(cx, cy, [swirl, rings]);
    container.setDepth(11);

    this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        t += 0.08;
        swirl.clear();
        rings.clear();
        const col = active ? 0xffd700 : 0x8a2be2;
        const col2 = active ? 0xffaa00 : 0x6a0dad;
        for (let r = 44; r > 8; r -= 4) {
          const a = 0.5 - r / 100;
          swirl.fillStyle(r % 8 === 0 ? col : col2, Math.max(0.05, a));
          swirl.beginPath();
          swirl.arc(0, 0, r, t + r * 0.1, t + r * 0.1 + Math.PI * 1.4);
          swirl.closePath();
          swirl.fill();
        }
        swirl.lineStyle(2, col, 0.9);
        swirl.strokeCircle(0, 0, 48);
        swirl.lineStyle(1, col2, 0.5);
        swirl.strokeCircle(0, 0, 44);

        if (active) {
          for (let i = 0; i < 3; i++) {
            const ang = t * 1.5 + i * (Math.PI * 2) / 3;
            const rr = 58 + i * 6;
            rings.lineStyle(2, 0xffd700, 0.6 - i * 0.15);
            rings.beginPath();
            rings.arc(0, 0, rr, ang, ang + Math.PI * 0.9);
            rings.stroke();
          }
          if (this.particlesRecord.length < MAX_PARTICLES - 4) {
            for (let i = 0; i < 2; i++) {
              this.spawnParticle(cx, cy,
                Math.cos(t + i * 3) * 80,
                Math.sin(t + i * 3) * 80 - 20,
                500, 0xffd700, Phaser.Math.FloatBetween(2, 4));
            }
          }
        }
      }
    });

    const portalSprite = this.physics.add.staticSprite(cx, cy, 'particle');
    portalSprite.setCircle(52);
    portalSprite.setAlpha(0.001);

    this.portal = { x: cx, y: cy, active: false, swirl, rings, container };

    this.physics.add.overlap(this.player, portalSprite, () => {
      if (this.portal.active && !this.isTransitioning && this.collectedGems >= this.totalGems) {
        this.enterNextLevel();
      }
    });
  }

  private setupCollisions(): void {
    const platformSprites = this.platforms.map(p => p.sprite);
    this.physics.add.collider(this.player, platformSprites);

    const gemSprites = this.gems.map(g => g.sprite);
    this.physics.add.overlap(this.player, gemSprites, (_p, gs) => {
      const gem = (gs as any)._gemRef as Gem;
      if (gem && !gem.collected && !this.rewindActive) {
        this.collectGem(gem);
      }
    });
  }

  private activateCheckpoint(cp: Checkpoint): void {
    cp.active = true;
    this.player.setCheckpoint(cp.x, cp.y + 50);
    this.screenPulse(0x39ff14, 180);
    this.spawnParticle(cp.x, cp.y, 0, -80, 500, 0x39ff14, 5);
  }

  private collectGem(gem: Gem): void {
    gem.collected = true;
    gem.sprite.disableBody(true, true);

    const cont = this.children.list.find(c => (c as any)._gemId === gem.id) as Phaser.GameObjects.Container;
    if (cont) cont.setVisible(false);

    this.collectedGems++;
    this.player.collectGem();

    for (let i = 0; i < 6; i++) {
      this.spawnParticle(gem.originalX, gem.originalY,
        Phaser.Math.Between(-80, 80),
        Phaser.Math.Between(-120, -40),
        500, 0xffd700, Phaser.Math.FloatBetween(2, 4));
    }

    this.screenPulse(0xffd700, 200);
    this.animateGemCounter();
    this.playGemSound();

    if (this.collectedGems >= this.totalGems) {
      this.activatePortal();
    }
  }

  private animateGemCounter(): void {
    this.tweens.add({
      targets: this.uiGemsText,
      scale: 1.35,
      duration: 150,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  }

  private playGemSound(): void {
    try {
      const ctx = (this.game as any).sound?.context as AudioContext || new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(988, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1568, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      o.start();
      o.stop(ctx.currentTime + 0.23);
    } catch (e) { }
  }

  private playRewindSound(): void {
    try {
      const ctx = (this.game as any).sound?.context as AudioContext || new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(180, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      o.start();
      o.stop(ctx.currentTime + 0.36);
    } catch (e) { }
  }

  private activatePortal(): void {
    this.portal.active = true;
    this.screenPulse(0xffd700, 400);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      this.spawnParticle(this.portal.x, this.portal.y,
        Math.cos(a) * 120,
        Math.sin(a) * 120,
        700, 0xffd700, Phaser.Math.FloatBetween(3, 5));
    }
  }

  private tryStartRewind(): void {
    if (this.rewindCharges <= 0 || this.rewindActive || this.isTransitioning) return;
    this.rewindActive = true;
    this.rewindCharges--;
    this.updateChargeIcons();
    this.player.startRewind();
    this.gemRestoreList = [];
    this.playRewindSound();
    this.screenPulse(0x8a2be2, 300);

    const targetCount = this.collectedGems;
    const sortedGems = [...this.gems]
      .filter(g => g.collected)
      .sort((a, b) => b.originalY - a.originalY);
    this.gemRestoreList = sortedGems.map(g => g.id);
    const restoreCount = Math.min(targetCount, this.gemRestoreList.length);
    this.gemRestoreList = this.gemRestoreList.slice(0, restoreCount);
  }

  private stopRewindIfActive(): void {
    if (!this.rewindActive) return;
    this.rewindActive = false;

    const state = this.player.stopRewind();
    if (state) {
      this.applyRewindState(state);
    }
    this.processGemReturns();
  }

  private applyRewindState(state: PlayerState): void {
    this.collectedGems = state.gemCount;

    const targetRestoredCount = this.gemRestoreList.length > 0
      ? Math.max(0, Math.min(this.gemRestoreList.length, this.totalGems - state.gemCount))
      : 0;

    let restored = 0;
    for (const gid of this.gemRestoreList) {
      const gem = this.gems.find(gg => gg.id === gid);
      if (!gem || !gem.collected) continue;
      if (restored >= targetRestoredCount) break;
      gem.collected = false;
      restored++;
    }
  }

  private processGemReturns(): void {
    const toRestore = this.gems.filter(g => !g.collected && !g.sprite.body?.enable && this.gemRestoreList.includes(g.id));
    this.gemReturnQueue = toRestore.map(g => ({
      gem: g,
      progress: 0,
      startX: this.player.x,
      startY: this.player.y
    }));
    this.gemReturnTimer = 0;
  }

  private setupCamera(): void {
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.worldBounds.width, this.worldBounds.height);
    this.cameras.main.setBackgroundColor('#0a0a2e');
    this.cameras.main.setDeadzone(GAME_WIDTH * 0.25, GAME_HEIGHT * 0.25);

    this.rewindRipple = this.add.graphics();
    this.rewindRipple.setScrollFactor(0);
    this.rewindRipple.setDepth(200);

    this.rewindMask = this.add.graphics();
    this.rewindMask.setScrollFactor(0);
    this.rewindMask.setDepth(195);

    this.uiScanLines = this.add.graphics();
    this.uiScanLines.setScrollFactor(0);
    this.uiScanLines.setDepth(180);
  }

  private createUI(): void {
    this.uiGemsIcon = this.add.graphics();
    this.uiGemsIcon.setScrollFactor(0);
    this.uiGemsIcon.setDepth(500);
    this.uiGemsIcon.setPosition(35, 38);
    this.drawGemIcon(0);

    this.uiGemsText = this.add.text(65, 22, `${this.collectedGems}/${this.totalGems}`, {
      fontFamily: 'Segoe UI, Arial',
      fontSize: '30px',
      color: '#ffd700'
    }).setFontStyle('bold');
    this.uiGemsText.setStroke('#8b5a00', 3);
    this.uiGemsText.setScrollFactor(0);
    this.uiGemsText.setDepth(501);

    for (let i = 0; i < MAX_REWIND_CHARGES; i++) {
      const g = this.add.graphics();
      g.setScrollFactor(0);
      g.setDepth(500);
      g.setPosition(50 + i * 42, 80);
      this.uiChargesIcons.push(g);
    }
    this.updateChargeIcons();

    this.uiTimerText = this.add.text(GAME_WIDTH - 30, 22, '0.0s', {
      fontFamily: 'Consolas, monospace',
      fontSize: '30px',
      color: '#39ff14'
    }).setOrigin(1, 0);
    this.uiTimerText.setFontStyle('bold');
    this.uiTimerText.setScrollFactor(0);
    this.uiTimerText.setDepth(501);
    this.uiTimerText.setStroke('#000000', 3);

    this.uiRewindBar = this.add.graphics();
    this.uiRewindBar.setScrollFactor(0);
    this.uiRewindBar.setDepth(500);
    this.uiRewindBar.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 40);

    this.uiRewindLabel = this.add.text(GAME_WIDTH / 2 - 165, GAME_HEIGHT - 45, '', {
      fontFamily: 'Segoe UI, Arial',
      fontSize: '12px',
      color: '#cccfff'
    });
    this.uiRewindLabel.setScrollFactor(0);
    this.uiRewindLabel.setDepth(501);

    const levelTag = this.add.text(GAME_WIDTH / 2, 24, `第 ${this.currentLevel} 关`, {
      fontFamily: 'Segoe UI, Arial',
      fontSize: '22px',
      color: '#aaccff'
    }).setOrigin(0.5, 0);
    levelTag.setFontStyle('bold');
    levelTag.setScrollFactor(0);
    levelTag.setDepth(500);
    levelTag.setStroke('#000066', 2);
  }

  private drawGemIcon(t: number): void {
    this.uiGemsIcon.clear();
    const pts: Phaser.Geom.Point[] = [];
    for (let i = 0; i < 6; i++) {
      const a = t + (i * Math.PI) / 3;
      pts.push(new Phaser.Geom.Point(Math.cos(a) * 16, Math.sin(a) * 16));
    }
    this.uiGemsIcon.fillGradientStyle(0xffe066, 0xffd700, 0xffaa00, 0xffcc33, 1);
    this.uiGemsIcon.fillPoints(pts, true);
    this.uiGemsIcon.lineStyle(2, 0xffffff, 0.8);
    this.uiGemsIcon.strokePoints(pts, true);
  }

  private updateChargeIcons(): void {
    this.uiChargesIcons.forEach((g, i) => {
      g.clear();
      const act = i < this.rewindCharges;
      const fillCol = act ? 0x00ffff : 0x444466;
      const lineCol = act ? 0xffffff : 0x666688;
      g.fillStyle(fillCol, act ? 0.95 : 0.35);
      g.lineStyle(2, lineCol, act ? 1 : 0.6);
      g.beginPath();
      g.moveTo(0, -14);
      g.lineTo(14, 0);
      g.lineTo(0, 14);
      g.lineTo(-14, 0);
      g.closePath();
      g.fillPath();
      g.strokePath();
      if (act) {
        g.fillStyle(0xffffff, 0.25);
        g.beginPath();
        g.moveTo(-5, -6);
        g.lineTo(2, -12);
        g.lineTo(6, -4);
        g.lineTo(-1, 2);
        g.closePath();
        g.fillPath();
      }
    });
  }

  private drawRewindBar(progress: number, isRewinding: boolean): void {
    this.uiRewindBar.clear();
    const w = 260;
    const h = 18;

    this.uiRewindBar.lineStyle(1, 0x6a5acd, 0.6);
    this.uiRewindBar.fillStyle(0x1a1a4a, 0.6);

    this.uiRewindBar.beginPath();
    this.uiRewindBar.moveTo(-w / 2, 0);
    this.uiRewindBar.lineTo(-w / 4, -h * 0.7);
    this.uiRewindBar.lineTo(0, -h);
    this.uiRewindBar.lineTo(w / 4, -h * 0.7);
    this.uiRewindBar.lineTo(w / 2, 0);
    this.uiRewindBar.lineTo(w / 4, h * 0.3);
    this.uiRewindBar.lineTo(0, h * 0.5);
    this.uiRewindBar.lineTo(-w / 4, h * 0.3);
    this.uiRewindBar.closePath();
    this.uiRewindBar.fillPath();
    this.uiRewindBar.strokePath();

    const p = Math.max(0, Math.min(1, progress));
    const color = isRewinding ? 0x00ffff : 0xff4444;
    this.uiRewindBar.fillStyle(color, isRewinding ? 0.85 : 0.7);

    const hw = w / 2;
    const segs = 32;
    this.uiRewindBar.beginPath();
    for (let i = 0; i <= segs * p; i++) {
      const tt = i / segs;
      const xx = -hw + tt * w;
      const arcShape = Math.sin(tt * Math.PI);
      const yy = -arcShape * (h - 4) + 2;
      if (i === 0) this.uiRewindBar.moveTo(xx, yy);
      else this.uiRewindBar.lineTo(xx, yy);
    }
    for (let i = Math.floor(segs * p); i >= 0; i--) {
      const tt = i / segs;
      const xx = -hw + tt * w;
      const arcShape = Math.sin(tt * Math.PI);
      const yy = -arcShape * (h / 2) + h * 0.2;
      this.uiRewindBar.lineTo(xx, yy);
    }
    this.uiRewindBar.closePath();
    this.uiRewindBar.fillPath();

    this.uiRewindLabel.setText(isRewinding ? '倒流中' : '倒流条');
    this.uiRewindLabel.setColor(isRewinding ? '#00ffff' : '#aabbcc');
  }

  private screenPulse(color: number, duration: number): void {
    this.scanlinePulseTimer = duration;
    for (let i = 0; i < 4; i++) {
      this.spawnParticle(
        this.player.x + Phaser.Math.Between(-30, 30),
        this.player.y + Phaser.Math.Between(-30, 30),
        Phaser.Math.Between(-100, 100),
        Phaser.Math.Between(-100, 100),
        300,
        color,
        Phaser.Math.FloatBetween(2, 4)
      );
    }
  }

  private spawnParticle(x: number, y: number, vx: number, vy: number, life: number, color: number, size: number): void {
    if (this.particlesRecord.length >= MAX_PARTICLES) return;
    this.particlesRecord.push({
      id: this.particleIdCounter++,
      x, y, vx, vy,
      life, maxLife: life, color, size,
      createdAt: this.time.now
    });
  }

  private enterNextLevel(): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.doWipeTransition(true, () => {
      if (this.currentLevel >= 3) {
        this.scene.start('MenuScene');
      } else {
        this.scene.start('GameScene', { level: this.currentLevel + 1 });
      }
    });
  }

  private doWipeTransition(out: boolean, done: () => void): void {
    const g = this.add.graphics();
    g.setScrollFactor(0);
    g.setDepth(9999);
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const startT = this.time.now;
    const dur = 650;
    let stopped = false;

    const ev = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        const t = Math.min(1, (this.time.now - startT) / dur);
        const r = out ? Math.min(1, t) : Math.max(0, 1 - t);
        g.clear();
        g.fillStyle(0x050015, 0.95);
        g.beginPath();
        g.moveTo(cx, cy);
        for (let a = 0; a <= 360; a += 3) {
          const rr = maxR * r + Math.sin(a * 0.05 + t * 8) * 20;
          const rad = Phaser.Math.DegToRad(a);
          g.lineTo(cx + Math.cos(rad) * rr, cy + Math.sin(rad) * rr);
        }
        g.closePath();
        g.fillPath();
        g.lineStyle(3, 0x00ffff, 0.8 * (1 - Math.abs(r - 0.5) * 2));
        g.beginPath();
        for (let a = 0; a <= 360; a += 3) {
          const rr = maxR * r + Math.sin(a * 0.05 + t * 8) * 20;
          const rad = Phaser.Math.DegToRad(a);
          if (a === 0) g.moveTo(cx + Math.cos(rad) * rr, cy + Math.sin(rad) * rr);
          else g.lineTo(cx + Math.cos(rad) * rr, cy + Math.sin(rad) * rr);
        }
        g.strokePath();

        if (t >= 1 && !stopped) {
          stopped = true;
          ev.remove();
          done();
        }
      }
    });
  }

  private playLevelIntro(): void {
    const g = this.add.graphics();
    g.setScrollFactor(0);
    g.setDepth(9998);
    g.fillStyle(0x050015, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({
      targets: g,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => g.destroy()
    });
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);

    this.bgStars.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < -20) s.x = this.worldBounds.width + 20;
      if (s.x > this.worldBounds.width + 20) s.x = -20;
      if (s.y < -20) s.y = this.worldBounds.height + 20;
      if (s.y > this.worldBounds.height + 20) s.y = -20;
      s.gfx.setPosition(s.x, s.y);
    });

    this.updateParticles(delta);
    this.updateGemReturns(delta);
    this.updateRewindEffects();
    this.updateUI(time, delta);

    if (this.player.y > this.worldBounds.height + 100) {
      this.player.die(() => {
        this.gems.forEach(g => {
          if (g.collected) {
            g.collected = false;
            const cont = this.children.list.find(c => (c as any)._gemId === g.id) as Phaser.GameObjects.Container;
            if (cont) {
              cont.setVisible(true);
              cont.setPosition(g.originalX, g.originalY);
              cont.setAlpha(1);
              cont.setScale(1);
            }
            g.sprite.enableBody(true, g.originalX, g.originalY, true, true);
          }
        });
        this.collectedGems = 0;
        this.player.setGemCount(0);
      });
    }

    if (this.scanlinePulseTimer > 0) {
      this.scanlinePulseTimer = Math.max(0, this.scanlinePulseTimer - delta);
    }
  }

  private updateParticles(delta: number): void {
    this.particleGfx.clear();
    this.particlesRecord = this.particlesRecord.filter(p => {
      p.life -= delta;
      if (p.life <= 0) return false;
      p.x += p.vx * delta / 1000;
      p.y += p.vy * delta / 1000;
      p.vy += 180 * delta / 1000;
      const a = p.life / p.maxLife;
      this.particleGfx.fillStyle(p.color, a);
      this.particleGfx.fillCircle(p.x, p.y, p.size * (0.6 + a * 0.4));
      return true;
    });
  }

  private updateGemReturns(delta: number): void {
    if (this.gemReturnQueue.length === 0) return;
    this.gemReturnTimer += delta;

    for (let i = 0; i < this.gemReturnQueue.length; i++) {
      const item = this.gemReturnQueue[i];
      if (i * this.lastGemReturnInterval > this.gemReturnTimer) continue;

      item.progress = Math.min(1, item.progress + delta / 650);
      const t = item.progress;
      const sx = item.startX, sy = item.startY;
      const ex = item.gem.originalX, ey = item.gem.originalY;
      const arcH = -120;
      const x = Phaser.Math.Linear(sx, ex, t);
      const y = Phaser.Math.Linear(sy, ey, t) + arcH * Math.sin(Math.PI * t);

      const cont = this.children.list.find(c => (c as any)._gemId === item.gem.id) as Phaser.GameObjects.Container;
      if (cont) {
        cont.setVisible(true);
        cont.setPosition(x, y);
        cont.setAlpha(Math.min(1, t * 1.5));
        cont.setScale(0.7 + t * 0.3);
      }

      if (t >= 1) {
        item.gem.sprite.enableBody(true, item.gem.originalX, item.gem.originalY, true, true);
        if (cont) {
          cont.setPosition(item.gem.originalX, item.gem.originalY);
          cont.setAlpha(1);
          cont.setScale(1);
        }
      }
    }

    this.gemReturnQueue = this.gemReturnQueue.filter(q => q.progress < 1);
    if (this.gemReturnQueue.length === 0) this.gemReturnTimer = 0;
  }

  private updateRewindEffects(): void {
    this.rewindRipple.clear();
    this.rewindMask.clear();

    if (this.rewindActive) {
      const cx = GAME_WIDTH / 2;
      const cy = GAME_HEIGHT / 2;
      const t = this.time.now * 0.004;

      for (let wave = 0; wave < 4; wave++) {
        const phase = (t + wave * 0.25) % 1;
        const r = phase * Math.max(GAME_WIDTH, GAME_HEIGHT) * 0.8;
        const alpha = (1 - phase) * 0.35;
        this.rewindRipple.lineStyle(3, wave % 2 === 0 ? 0x8a2be2 : 0x00ffff, alpha);
        this.rewindRipple.strokeCircle(cx, cy, r);
        this.rewindRipple.lineStyle(1, 0xff00ff, alpha * 0.4);
        this.rewindRipple.strokeCircle(cx, cy, r * 0.95);
      }

      for (let band = 0; band < 8; band++) {
        const phase = (t * 1.5 + band * 0.12) % 1;
        const r1 = phase * Math.max(GAME_WIDTH, GAME_HEIGHT) * 0.6;
        const r2 = r1 + 15;
        this.rewindMask.fillStyle(band % 2 === 0 ? 0x00ffff : 0x8a2be2, (1 - phase) * 0.035);
        this.rewindMask.beginPath();
        this.rewindMask.arc(cx, cy, r2, 0, Math.PI * 2);
        this.rewindMask.arc(cx, cy, r1, 0, Math.PI * 2, true);
        this.rewindMask.fillPath();
      }

      const cam = this.cameras.main as any;
      cam.rotation = Math.sin(this.time.now * 0.004) * 0.005;
      cam.zoom = 1 + Math.sin(this.time.now * 0.006) * 0.008;
    } else {
      const mainCam = this.cameras.main as any;
      mainCam.rotation = 0;
      mainCam.zoom = 1;
    }

    this.uiScanLines.clear();
    const pulseAlpha = Math.min(1, this.scanlinePulseTimer / 200);
    if (this.rewindActive || pulseAlpha > 0.05) {
      const alpha = this.rewindActive ? 0.08 : pulseAlpha * 0.08;
      const colors = this.rewindActive ? [0x00ffff, 0x8a2be2, 0xff00ff] : [0xffd700, 0x39ff14];
      for (let y = 0; y < GAME_HEIGHT; y += 6) {
        const c = colors[(y / 6) % colors.length | 0];
        this.uiScanLines.fillStyle(c, alpha);
        this.uiScanLines.fillRect(0, y, GAME_WIDTH, 2);
      }
      this.uiScanLines.lineStyle(2, 0x00ffff, alpha * 4);
      this.uiScanLines.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  private updateUI(time: number, delta: number): void {
    if (!this.rewindActive) {
      this.levelTime += delta;
    }
    const secs = this.levelTime / 1000;
    this.uiTimerText.setText(secs.toFixed(1) + 's');

    const tRatio = Math.min(1, secs / 180);
    const r = Math.round(Phaser.Math.Linear(57, 255, tRatio));
    const g = Math.round(Phaser.Math.Linear(255, 50, tRatio));
    const b = Math.round(Phaser.Math.Linear(20, 80, tRatio * 0.5));
    const cssColor = `rgb(${r},${g},${b})`;
    this.uiTimerText.setColor(cssColor);

    this.uiGemsText.setText(`${this.collectedGems}/${this.totalGems}`);
    this.drawGemIcon(time * 0.001);

    let progress = 0;
    if (this.rewindActive) {
      progress = this.player.getRewindProgress();
    } else {
      progress = this.rewindCharges / MAX_REWIND_CHARGES;
    }
    this.drawRewindBar(progress, this.rewindActive);
  }
}
