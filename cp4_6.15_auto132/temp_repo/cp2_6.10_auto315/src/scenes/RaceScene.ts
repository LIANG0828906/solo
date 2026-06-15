import Phaser from 'phaser';

const COLORS = {
  BG_DARK: 0x0a0a0f,
  NEON_GREEN: 0x00ffaa,
  NEON_MAGENTA: 0xff00aa,
  NEON_BLUE: 0x00aaff,
  NEON_RED: 0xff3366,
  TRACK_GRAY: 0x1a1a2e,
  ROAD_MARKING: 0x3a3a5e,
  DARK_GREEN: 0x0a2a1a
};

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const TRACK_WIDTH = 520;
const TRACK_LEFT = (GAME_WIDTH - TRACK_WIDTH) / 2;
const TRACK_RIGHT = TRACK_LEFT + TRACK_WIDTH;
const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 72;
const LANE_COUNT = 5;
const LANE_WIDTH = TRACK_WIDTH / LANE_COUNT;

interface TrackSegment {
  y: number;
  height: number;
  offset: number;
  obstacles: ObstacleData[];
  hasEnergy: boolean;
  energyX?: number;
}

interface ObstacleData {
  x: number;
  type: 'static' | 'laser';
  width: number;
  height: number;
  moveRange?: number;
  moveSpeed?: number;
}

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
  life: number;
}

export default class RaceScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private playerGroup!: Phaser.GameObjects.Group;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private energyBlocks!: Phaser.Physics.Arcade.Group;
  private laserBeams!: Phaser.GameObjects.Group;

  private trackSegments: TrackSegment[] = [];
  private trackGraphics!: Phaser.GameObjects.Graphics;
  private sideLightLeft!: Phaser.GameObjects.Graphics;
  private sideLightRight!: Phaser.GameObjects.Graphics;

  private trailPoints: TrailPoint[] = [];
  private trailGraphics!: Phaser.GameObjects.Graphics;

  private tireSparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private explosionParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private energyRings!: Phaser.GameObjects.Particles.ParticleEmitter;

  private scoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private livesBars: Phaser.GameObjects.Graphics[] = [];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;

  private speed = 280;
  private baseSpeed = 280;
  private maxSpeed = 650;
  private score = 0;
  private lives = 3;
  private distance = 0;
  private scoreMultiplier = 1;
  private multiplierTimer = 0;

  private isInvincible = false;
  private invincibleTimer = 0;
  private isScreenFlashing = false;
  private flashTimer = 0;

  private lightPulse = 0;
  private currentBgHue = 220;

  private particleCount = 0;
  private readonly MAX_PARTICLES = 50;

  private spawnTimer = 0;
  private segmentY = -GAME_HEIGHT;

  constructor() {
    super('RaceScene');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);
    this.initInput();
    this.initGraphics();
    this.initPlayer();
    this.initGroups();
    this.initParticles();
    this.initUI();
    this.initTrack();
  }

  private initInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.leftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
  }

  private initGraphics() {
    this.trackGraphics = this.add.graphics();
    this.sideLightLeft = this.add.graphics();
    this.sideLightRight = this.add.graphics();
    this.trailGraphics = this.add.graphics();
  }

  private initPlayer() {
    this.playerGroup = this.add.group();
    this.createPixelCar();
  }

  private createPixelCar() {
    const playerX = GAME_WIDTH / 2;
    const playerY = GAME_HEIGHT - 120;

    const carContainer = this.add.container(playerX, playerY);
    const pixelSize = 6;

    const carPattern = [
      '    XX    ',
      '   XMMX   ',
      '  XMMMMX  ',
      ' XGGGGGGX ',
      'XGGGGG  GX',
      'XGGGGGGGGX',
      'XGGGGGGGGX',
      'XGGGGGGGGX',
      'XXGGGGGGXX',
      'X X    X X',
      'X        X',
      'XX      XX'
    ];

    carPattern.forEach((row, ry) => {
      row.split('').forEach((pixel, rx) => {
        if (pixel !== ' ') {
          let color: number = COLORS.NEON_GREEN;
          if (pixel === 'M') color = COLORS.NEON_MAGENTA;
          if (pixel === 'X') color = COLORS.DARK_GREEN;

          const block = this.add.rectangle(
            (rx - 4.5) * pixelSize,
            (ry - 5.5) * pixelSize,
            pixelSize,
            pixelSize,
            color
          ).setOrigin(0);

          if (pixel === 'G') {
            block.setStrokeStyle(1, COLORS.NEON_GREEN, 0.5);
          }

          carContainer.add(block);
        }
      });
    });

    const engineGlow = this.add.rectangle(0, 28, 20, 8, COLORS.NEON_MAGENTA, 0.8);
    engineGlow.setAlpha(0.6);
    carContainer.add(engineGlow);

    const playerBody = this.physics.add.image(playerX, playerY, '')
      .setSize(PLAYER_WIDTH * 0.7, PLAYER_HEIGHT * 0.8)
      .setImmovable(true)
      .setVisible(false);

    this.player = playerBody;
    carContainer.setData('body', playerBody);
    this.playerGroup.add(carContainer);
    this.playerGroup.add(playerBody);
  }

  private initGroups() {
    this.obstacles = this.physics.add.group({
      immovable: true,
      allowGravity: false
    });

    this.energyBlocks = this.physics.add.group({
      immovable: true,
      allowGravity: false
    });

    this.laserBeams = this.add.group();
  }

  private initParticles() {
    this.createPixelTexture('spark', 0xffaa00, 4);
    this.createPixelTexture('explosion', 0xff6600, 6);
    this.createPixelTexture('ring', COLORS.NEON_BLUE, 8);

    const sparkManager = this.add.particles(0, 0, 'spark', {
      lifespan: 300,
      speed: { min: 20, max: 60 },
      angle: { min: 70, max: 110 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 0,
      emitting: false,
      follow: this.player,
      followOffset: { x: 16, y: 30 }
    });
    this.tireSparks = sparkManager;

    const explosionManager = this.add.particles(0, 0, 'explosion', {
      lifespan: 600,
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 0,
      emitting: false
    });
    this.explosionParticles = explosionManager;

    const ringManager = this.add.particles(0, 0, 'ring', {
      lifespan: 500,
      speed: 0,
      scale: { start: 0.5, end: 3 },
      alpha: { start: 0.8, end: 0 },
      quantity: 0,
      emitting: false
    });
    this.energyRings = ringManager;
  }

  private createPixelTexture(key: string, color: number, size: number): void {
    const graphics = this.make.graphics(undefined);
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, size, size);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  private initUI() {
    this.scoreText = this.add.text(30, 25, '000000', {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      color: '#00ffaa',
      fontStyle: 'bold'
    }).setOrigin(0);

    this.speedText = this.add.text(GAME_WIDTH - 30, 25, '000 km/h', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#ff00aa',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    for (let i = 0; i < 3; i++) {
      const bar = this.add.graphics();
      this.livesBars.push(bar);
    }
    this.updateLivesUI();
  }

  private initTrack() {
    this.segmentY = -GAME_HEIGHT;
    for (let i = 0; i < 4; i++) {
      this.createTrackSegment(this.segmentY + i * GAME_HEIGHT);
    }
  }

  private createTrackSegment(y: number) {
    const offset = Phaser.Math.Between(-60, 60);
    const height = GAME_HEIGHT;

    const obstacles: ObstacleData[] = [];
    const obstacleCount = Phaser.Math.Between(1, 3);

    for (let i = 0; i < obstacleCount; i++) {
      const lane = Phaser.Math.Between(0, LANE_COUNT - 1);
      const obsX = TRACK_LEFT + LANE_WIDTH / 2 + lane * LANE_WIDTH + offset;
      const isLaser = Math.random() < 0.3;

      obstacles.push({
        x: obsX,
        type: isLaser ? 'laser' : 'static',
        width: isLaser ? LANE_WIDTH * 0.9 : 40,
        height: isLaser ? 8 : 40,
        moveRange: isLaser ? Phaser.Math.Between(40, 80) : 0,
        moveSpeed: isLaser ? Phaser.Math.Between(1.5, 3) : 0
      });
    }

    const hasEnergy = Math.random() < 0.4;
    const energyLane = Phaser.Math.Between(0, LANE_COUNT - 1);

    this.trackSegments.push({
      y,
      height,
      offset,
      obstacles,
      hasEnergy,
      energyX: hasEnergy ? TRACK_LEFT + LANE_WIDTH / 2 + energyLane * LANE_WIDTH + offset : undefined
    });
  }

  update(_: number, delta: number) {
    const dt = Math.min(delta / 16.67, 2);

    this.updatePlayer(dt);
    this.updateTrack(dt);
    this.updateObstacles(dt);
    this.updateEnergyBlocks(dt);
    this.updateTrail(dt);
    this.updateParticles(dt);
    this.updateUI(dt);
    this.updateEffects(dt);
    this.checkCollisions();

    this.distance += this.speed * dt * 0.01;
    this.score += Math.floor(this.speed * dt * 0.01 * this.scoreMultiplier);

    if (this.scoreMultiplier > 1) {
      this.multiplierTimer -= dt;
      if (this.multiplierTimer <= 0) {
        this.scoreMultiplier = 1;
      }
    }

    if (this.isInvincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
      }
    }

    if (this.isScreenFlashing) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.isScreenFlashing = false;
        this.cameras.main.flashEffect.reset();
      }
    }
  }

  private updatePlayer(dt: number) {
    const moveSpeed = 420 * dt;
    const body = this.player;

    if (this.leftKey.isDown || this.cursors.left?.isDown) {
      body.x -= moveSpeed;
    }
    if (this.rightKey.isDown || this.cursors.right?.isDown) {
      body.x += moveSpeed;
    }

    body.x = Phaser.Math.Clamp(body.x, TRACK_LEFT + PLAYER_WIDTH / 2, TRACK_RIGHT - PLAYER_WIDTH / 2);

    const container = this.playerGroup.getChildren()[0] as Phaser.GameObjects.Container;
    if (container) {
      container.x = body.x;
      container.y = body.y;

      if (this.leftKey.isDown || this.cursors.left?.isDown) {
        container.rotation = -0.15;
      } else if (this.rightKey.isDown || this.cursors.right?.isDown) {
        container.rotation = 0.15;
      } else {
        container.rotation = Phaser.Math.Linear(container.rotation, 0, 0.15);
      }

      const engineGlow = container.getAt(container.length - 1) as Phaser.GameObjects.Rectangle;
      if (engineGlow) {
        const glowIntensity = 0.4 + (this.speed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed) * 0.6;
        engineGlow.setAlpha(glowIntensity);
        engineGlow.setScale(1 + glowIntensity * 0.5, 1);
      }

      if (this.isInvincible) {
        container.visible = Math.floor(this.invincibleTimer * 10) % 2 === 0;
      } else {
        container.visible = true;
      }
    }
  }

  private updateTrack(dt: number) {
    const moveAmount = this.speed * dt;

    this.trackSegments.forEach(seg => {
      seg.y += moveAmount;
    });

    this.trackSegments = this.trackSegments.filter(seg => {
      if (seg.y > GAME_HEIGHT + 200) {
        return false;
      }
      return true;
    });

    const lastSeg = this.trackSegments[this.trackSegments.length - 1];
    if (lastSeg && lastSeg.y > 0) {
      this.createTrackSegment(lastSeg.y - GAME_HEIGHT);
    }

    this.drawTrack();
    this.updateBackground();
  }

  private drawTrack() {
    this.trackGraphics.clear();
    this.sideLightLeft.clear();
    this.sideLightRight.clear();

    this.lightPulse += 0.1;
    const pulseAlpha = 0.6 + Math.sin(this.lightPulse) * 0.4;

    this.trackSegments.forEach(seg => {
      const centerX = GAME_WIDTH / 2 + seg.offset;
      const trackX = centerX - TRACK_WIDTH / 2;

      this.trackGraphics.fillStyle(COLORS.TRACK_GRAY, 1);
      this.trackGraphics.fillRect(trackX, seg.y, TRACK_WIDTH, seg.height);

      this.trackGraphics.lineStyle(2, COLORS.NEON_GREEN, 0.3);
      this.trackGraphics.strokeRect(trackX, seg.y, TRACK_WIDTH, seg.height);

      this.trackGraphics.fillStyle(COLORS.ROAD_MARKING, 1);
      for (let lane = 1; lane < LANE_COUNT; lane++) {
        const dashX = trackX + lane * LANE_WIDTH - 2;
        for (let dashY = seg.y; dashY < seg.y + seg.height; dashY += 40) {
          const offset = (this.distance * 3) % 40;
          this.trackGraphics.fillRect(dashX, dashY + offset, 4, 20);
        }
      }

      this.sideLightLeft.fillGradientStyle(
        COLORS.NEON_GREEN, COLORS.NEON_GREEN,
        COLORS.BG_DARK, COLORS.BG_DARK,
        pulseAlpha, pulseAlpha, 0, 0
      );
      this.sideLightLeft.fillRect(trackX - 15, seg.y, 15, seg.height);

      this.sideLightRight.fillGradientStyle(
        COLORS.NEON_MAGENTA, COLORS.NEON_MAGENTA,
        COLORS.BG_DARK, COLORS.BG_DARK,
        pulseAlpha, pulseAlpha, 0, 0
      );
      this.sideLightRight.fillRect(trackX + TRACK_WIDTH, seg.y, 15, seg.height);
    });
  }

  private updateBackground() {
    const speedRatio = (this.speed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed);
    const targetHue = 220 + speedRatio * 120;
    this.currentBgHue = Phaser.Math.Linear(this.currentBgHue, targetHue, 0.02);

    const bgColor = Phaser.Display.Color.HSVToRGB(this.currentBgHue / 360, 0.6, 0.08);
    this.cameras.main.setBackgroundColor(bgColor.color);
  }

  private updateObstacles(dt: number) {
    const moveAmount = this.speed * dt;

    this.obstacles.getChildren().forEach(child => {
      const obs = child as Phaser.Physics.Arcade.Image;
      obs.y += moveAmount;

      const data = obs.getData('data') as ObstacleData;
      if (data && data.type === 'laser' && data.moveRange && data.moveSpeed) {
        const time = this.time.now / 1000;
        const baseX = obs.getData('baseX') as number;
        obs.x = baseX + Math.sin(time * data.moveSpeed) * data.moveRange;
      }

      const laser = obs.getData('laser') as Phaser.GameObjects.Graphics;
      if (laser) {
        laser.x = obs.x;
        laser.y = obs.y;
        laser.clear();
        const alpha = 0.5 + Math.sin(this.time.now / 100) * 0.5;
        laser.fillStyle(COLORS.NEON_MAGENTA, alpha);
        laser.fillRect(-data.width / 2, -4, data.width, 8);
        laser.lineStyle(2, COLORS.NEON_MAGENTA, alpha);
        laser.strokeRect(-data.width / 2, -4, data.width, 8);
      }

      if (obs.y > GAME_HEIGHT + 100) {
        obs.destroy();
      }
    });

    this.spawnTimer += dt;
    if (this.spawnTimer > 40) {
      this.spawnObstaclesFromSegments();
      this.spawnTimer = 0;
    }
  }

  private spawnObstaclesFromSegments() {
    this.trackSegments.forEach(seg => {
      if (seg.y > -100 && seg.y < 50 && !seg.obstacles.length) return;

      seg.obstacles.forEach(obsData => {
        const obsY = seg.y + 150;
        const existing = this.obstacles.getChildren().some((c: any) =>
          c.getData('segY') === seg.y && c.getData('obsX') === obsData.x
        );

        if (!existing && obsY > -50 && obsY < 100) {
          this.spawnObstacle(obsData, obsY, seg.y);
        }
      });

      if (seg.hasEnergy && seg.energyX) {
        const energyY = seg.y + 300;
        const existingEnergy = this.energyBlocks.getChildren().some((c: any) =>
          c.getData('segY') === seg.y
        );

        if (!existingEnergy && energyY > -50 && energyY < 100) {
          this.spawnEnergyBlock(seg.energyX, energyY, seg.y);
        }
      }
    });
  }

  private spawnObstacle(data: ObstacleData, y: number, segY: number) {
    if (this.particleCount >= this.MAX_PARTICLES) return;

    const obs = this.obstacles.create(data.x, y, '')
      .setSize(data.width, data.height)
      .setVisible(false);

    obs.setData('data', data);
    obs.setData('segY', segY);
    obs.setData('obsX', data.x);
    obs.setData('baseX', data.x);

    if (data.type === 'static') {
      const graphics = this.add.graphics();
      graphics.fillStyle(COLORS.NEON_RED, 0.8);
      graphics.fillRect(-data.width / 2, -data.height / 2, data.width, data.height);
      graphics.lineStyle(3, COLORS.NEON_RED, 1);
      graphics.strokeRect(-data.width / 2, -data.height / 2, data.width, data.height);

      const container = this.add.container(data.x, y);
      container.add(graphics);
      obs.setData('graphics', container);

      this.tweens.add({
        targets: graphics,
        scaleX: { from: 1, to: 1.05 },
        scaleY: { from: 1, to: 1.05 },
        yoyo: true,
        repeat: -1,
        duration: 600
      });
    } else {
      const laser = this.add.graphics();
      this.laserBeams.add(laser);
      obs.setData('laser', laser);
    }
  }

  private spawnEnergyBlock(x: number, y: number, segY: number) {
    if (this.particleCount >= this.MAX_PARTICLES) return;

    const energy = this.energyBlocks.create(x, y, '')
      .setSize(32, 32)
      .setVisible(false);

    energy.setData('segY', segY);

    const container = this.add.container(x, y);

    for (let i = 0; i < 8; i++) {
      const block = this.add.rectangle(-12 + (i % 4) * 8, -12 + Math.floor(i / 4) * 8, 6, 6, COLORS.NEON_BLUE);
      block.setStrokeStyle(1, COLORS.NEON_BLUE, 0.6);
      container.add(block);
    }

    const pulse = this.add.rectangle(0, 0, 40, 40);
    pulse.setStrokeStyle(2, COLORS.NEON_BLUE, 0.4);
    container.add(pulse);

    this.tweens.add({
      targets: container,
      rotation: { from: 0, to: Math.PI * 2 },
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    });

    this.tweens.add({
      targets: pulse,
      scale: { from: 0.8, to: 1.5 },
      alpha: { from: 0.6, to: 0 },
      yoyo: true,
      repeat: -1,
      duration: 1200
    });

    energy.setData('graphics', container);
  }

  private updateEnergyBlocks(dt: number) {
    const moveAmount = this.speed * dt;

    this.energyBlocks.getChildren().forEach(child => {
      const energy = child as Phaser.Physics.Arcade.Image;
      energy.y += moveAmount;

      const graphics = energy.getData('graphics') as Phaser.GameObjects.Container;
      if (graphics) {
        graphics.x = energy.x;
        graphics.y = energy.y;
      }

      if (energy.y > GAME_HEIGHT + 100) {
        graphics?.destroy();
        energy.destroy();
      }
    });
  }

  private updateTrail(dt: number) {
    this.trailPoints.forEach(point => {
      point.life -= dt * 2;
      point.alpha = Math.max(0, point.life);
    });

    this.trailPoints = this.trailPoints.filter(p => p.alpha > 0);

    if (this.trailPoints.length < 15 && (this.leftKey.isDown || this.rightKey.isDown || this.cursors.left?.isDown || this.cursors.right?.isDown)) {
      this.trailPoints.push({
        x: this.player.x,
        y: this.player.y + 20,
        alpha: 0.6,
        life: 1
      });
    }

    this.trailGraphics.clear();
    this.trailPoints.forEach(point => {
      this.trailGraphics.fillStyle(COLORS.NEON_GREEN, point.alpha * 0.5);
      this.trailGraphics.fillRect(point.x - 8, point.y, 16, 4);
    });

    if (this.speed > this.baseSpeed * 1.2) {
      const sparkCount = Math.floor((this.speed - this.baseSpeed * 1.2) / 50);
      if (this.particleCount < this.MAX_PARTICLES - sparkCount) {
        this.tireSparks.setQuantity(sparkCount);
        this.tireSparks.emitParticle();
        this.particleCount += sparkCount;
      }
    }
  }

  private updateParticles(dt: number) {
    this.particleCount = Math.max(0, this.particleCount - Math.floor(dt * 5));
  }

  private updateUI(dt: number) {
    this.scoreText.setText(this.score.toString().padStart(6, '0'));

    const displaySpeed = Math.floor(this.speed * 1.2);
    this.speedText.setText(`${displaySpeed.toString().padStart(3, '0')} km/h`);

    if (this.scoreMultiplier > 1) {
      this.speedText.setColor('#00aaff');
      this.scoreText.setColor('#00aaff');
    } else {
      this.speedText.setColor('#ff00aa');
      this.scoreText.setColor('#00ffaa');
    }

    this.speed = Math.min(this.speed + dt * 0.8, this.maxSpeed);
  }

  private updateLivesUI() {
    this.livesBars.forEach((bar, i) => {
      bar.clear();
      const x = 30 + i * 110;
      const y = GAME_HEIGHT - 50;

      bar.fillStyle(0x0a0a0f, 1);
      bar.fillRect(x, y, 100, 20);
      bar.lineStyle(2, COLORS.NEON_GREEN, 1);
      bar.strokeRect(x, y, 100, 20);

      if (i < this.lives) {
        bar.fillGradientStyle(
          COLORS.NEON_GREEN, COLORS.NEON_BLUE,
          COLORS.NEON_GREEN, COLORS.NEON_BLUE,
          1, 1, 1, 1
        );
        bar.fillRect(x + 2, y + 2, 96, 16);
      }
    });
  }

  private updateEffects(_dt: number) {
    const speedRatio = (this.speed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed);
    if (speedRatio > 0.3 && Math.random() < speedRatio * 0.3) {
      this.cameras.main.shake(100, 0.002);
    }
  }

  private checkCollisions() {
    this.physics.overlap(this.player, this.obstacles, (_p, o) => {
      if (!this.isInvincible) {
        this.onHitObstacle(o as Phaser.Physics.Arcade.Image);
      }
    });

    this.physics.overlap(this.player, this.energyBlocks, (_p, e) => {
      this.onCollectEnergy(e as Phaser.Physics.Arcade.Image);
    });
  }

  private onHitObstacle(obs: Phaser.Physics.Arcade.Image) {
    this.lives--;
    this.updateLivesUI();
    this.speed = Math.max(this.baseSpeed * 0.8, this.speed * 0.5);
    this.isInvincible = true;
    this.invincibleTimer = 120;

    const graphics = obs.getData('graphics');
    const laser = obs.getData('laser');
    if (graphics) graphics.destroy();
    if (laser) laser.destroy();
    obs.destroy();

    if (this.particleCount < this.MAX_PARTICLES - 15) {
      this.explosionParticles.setPosition(this.player.x, this.player.y);
      this.explosionParticles.setQuantity(15);
      this.explosionParticles.explode();
      this.particleCount += 15;
    }

    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(200, 255, 50, 50);

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  private onCollectEnergy(energy: Phaser.Physics.Arcade.Image) {
    const graphics = energy.getData('graphics') as Phaser.GameObjects.Container;
    const x = energy.x;
    const y = energy.y;

    if (graphics) graphics.destroy();
    energy.destroy();

    this.score += 500 * this.scoreMultiplier;
    this.scoreMultiplier = Math.min(this.scoreMultiplier + 0.5, 3);
    this.multiplierTimer = 180;
    this.speed = Math.min(this.speed + 80, this.maxSpeed);

    if (this.particleCount < this.MAX_PARTICLES - 8) {
      this.energyRings.setPosition(x, y);
      this.energyRings.setQuantity(8);
      this.energyRings.explode();
      this.particleCount += 8;
    }

    this.cameras.main.flash(150, 0, 170, 255);
    this.isScreenFlashing = true;
    this.flashTimer = 10;
  }

  private gameOver() {
    this.scene.start('GameOverScene', { score: this.score });
  }
}
