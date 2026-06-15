import Phaser from 'phaser';
import { UI } from './UI';

interface Ship {
  sprite: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Sprite;
  pathGraphics: Phaser.GameObjects.Graphics;
  pathPoints: Phaser.Math.Vector2[];
  currentPathIndex: number;
  speed: number;
  isStunned: boolean;
  stunTimer: number;
  active: boolean;
}

interface Particle {
  sprite: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Sprite;
  active: boolean;
}

interface Storm {
  sprite: Phaser.GameObjects.Container;
  core: Phaser.GameObjects.Sprite;
  rings: Phaser.GameObjects.Arc[];
  velocity: Phaser.Math.Vector2;
  radius: number;
  warningTimer: number;
  isWarning: boolean;
  active: boolean;
  pulsePhase: number;
}

interface CameraKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
}

export class GameScene extends Phaser.Scene {
  private ui!: UI;
  private stardust: number = 0;
  private shipPool: Ship[] = [];
  private particlePool: Particle[] = [];
  private stormPool: Storm[] = [];
  private activeParticles: Particle[] = [];
  private activeShips: Ship[] = [];
  private activeStorms: Storm[] = [];

  private worldWidth: number = 4000;
  private worldHeight: number = 3000;

  private isDrawingPath: boolean = false;
  private currentPathPoints: Phaser.Math.Vector2[] = [];
  private pathPreviewGraphics!: Phaser.GameObjects.Graphics;
  private selectedShip: Ship | null = null;

  private nebulaGraphics!: Phaser.GameObjects.Graphics;
  private stars: Phaser.GameObjects.PointLight[] = [];

  private shipMaxPool: number = 20;
  private particleMaxPool: number = 2000;
  private stormMaxPool: number = 15;

  private stormSpawnTimer: number = 0;
  private stormSpawnInterval: number = 8000;
  private particleSpawnTimer: number = 0;
  private particleSpawnInterval: number = 200;

  private collectParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private cameraKeys!: CameraKeys;

  private shipTexture!: Phaser.Textures.CanvasTexture;
  private particleTexture!: Phaser.Textures.CanvasTexture;

  constructor() {
    super('GameScene');
  }

  public preload(): void {
    this.createProceduralTextures();
  }

  private createProceduralTextures(): void {
    const shipCanvas = this.textures.createCanvas('ship-base', 32, 32);
    if (shipCanvas) {
      const ctx = shipCanvas.getContext();
      ctx.clearRect(0, 0, 32, 32);
      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(3, 26);
      ctx.lineTo(16, 20);
      ctx.lineTo(29, 26);
      ctx.closePath();
      ctx.fill();
      shipCanvas.refresh();
      this.shipTexture = shipCanvas;
    }

    const particleCanvas = this.textures.createCanvas('particle-base', 12, 12);
    if (particleCanvas) {
      const ctx = particleCanvas.getContext();
      ctx.clearRect(0, 0, 12, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(6, 6, 5, 0, Math.PI * 2);
      ctx.fill();
      particleCanvas.refresh();
      this.particleTexture = particleCanvas;
    }
  }

  public create(): void {
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    this.createNebula();
    this.createStars();
    this.initializePools();

    this.pathPreviewGraphics = this.add.graphics().setDepth(500);

    this.ui = new UI(this);

    this.setupInputHandlers();
    this.spawnInitialParticles();
    this.spawnInitialStorms();

    this.collectParticles = this.add.particles(0, 0, 'particle-base', {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      quantity: 8,
      emitting: false,
      tint: 0xfbbf24
    }).setDepth(800);

    this.cameraKeys = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as CameraKeys;

    this.events.on('resume', () => {
      this.input.manager.enabled = true;
    });

    this.events.on('pause', () => {
      this.input.manager.enabled = false;
    });
  }

  private createNebula(): void {
    this.nebulaGraphics = this.add.graphics().setDepth(-10);

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, this.worldWidth);
      const y = Phaser.Math.Between(0, this.worldHeight);
      const radius = Phaser.Math.Between(100, 400);

      const gradientSteps = 20;
      for (let j = gradientSteps; j >= 0; j--) {
        const t = j / gradientSteps;
        const r = radius * t;
        const alpha = (1 - t) * 0.15;

        const color1 = Phaser.Display.Color.HexStringToColor('#8b5cf6');
        const color2 = Phaser.Display.Color.HexStringToColor('#ec4899');
        const blended = Phaser.Display.Color.Interpolate.ColorWithColor(
          color1,
          color2,
          gradientSteps,
          j
        );
        const hexColor = Phaser.Display.Color.GetColor(blended.r, blended.g, blended.b);

        this.nebulaGraphics.fillStyle(hexColor, alpha);
        this.nebulaGraphics.beginPath();
        this.nebulaGraphics.arc(x, y, r, 0, Math.PI * 2);
        this.nebulaGraphics.fillPath();
      }
    }
  }

  private createStars(): void {
    for (let i = 0; i < 500; i++) {
      const x = Phaser.Math.Between(0, this.worldWidth);
      const y = Phaser.Math.Between(0, this.worldHeight);
      const radius = Phaser.Math.FloatBetween(0.5, 2);
      const color = Phaser.Utils.Array.GetRandom([0xffffff, 0x8b5cf6, 0x00d4ff, 0xfbbf24]);
      const intensity = Phaser.Math.FloatBetween(0.3, 1);

      const star = this.add.pointlight(x, y, color, radius * 10, intensity, 0.1).setDepth(-5);
      this.stars.push(star);
    }
  }

  private initializePools(): void {
    for (let i = 0; i < this.shipMaxPool; i++) {
      this.shipPool.push(this.createShipObject());
    }

    for (let i = 0; i < this.particleMaxPool; i++) {
      this.particlePool.push(this.createParticleObject());
    }

    for (let i = 0; i < this.stormMaxPool; i++) {
      this.stormPool.push(this.createStormObject());
    }
  }

  private createShipObject(): Ship {
    const container = this.add.container(-1000, -1000).setDepth(100).setActive(false).setVisible(false);

    const glow = this.add.sprite(0, 0, 'ship-base').setScale(1.5).setAlpha(0.3).setTint(0x00d4ff);
    const body = this.add.sprite(0, 0, 'ship-base').setScale(1).setTint(0x00d4ff);

    container.add([glow, body]);

    const pathGraphics = this.add.graphics().setDepth(90);

    return {
      sprite: container,
      body,
      glow,
      pathGraphics,
      pathPoints: [],
      currentPathIndex: 0,
      speed: 3,
      isStunned: false,
      stunTimer: 0,
      active: false
    };
  }

  private createParticleObject(): Particle {
    const glow = this.add.sprite(-1000, -1000, 'particle-base').setScale(2).setAlpha(0.4).setTint(0xfbbf24).setDepth(50);
    const sprite = this.add.sprite(-1000, -1000, 'particle-base').setScale(1).setTint(0xfbbf24).setDepth(50);

    sprite.setActive(false).setVisible(false);
    glow.setActive(false).setVisible(false);

    return { sprite, glow, active: false };
  }

  private createStormObject(): Storm {
    const container = this.add.container(-1000, -1000).setDepth(200).setActive(false).setVisible(false);

    const core = this.add.sprite(0, 0, 'particle-base').setScale(5).setTint(0x991b1b);
    const rings: Phaser.GameObjects.Arc[] = [];

    for (let i = 0; i < 3; i++) {
      const ring = this.add.arc(0, 0, 40 + i * 20, 0, 360, false, undefined, 0).setStrokeStyle(3, 0x991b1b, 0.6);
      rings.push(ring);
      container.add(ring);
    }

    container.add(core);

    return {
      sprite: container,
      core,
      rings,
      velocity: new Phaser.Math.Vector2(),
      radius: 80,
      warningTimer: 0,
      isWarning: false,
      active: false,
      pulsePhase: 0
    };
  }

  private spawnShip(x: number, y: number): void {
    const ship = this.shipPool.find(s => !s.active);
    if (!ship) return;

    ship.active = true;
    ship.sprite.setPosition(x, y).setActive(true).setVisible(true);
    ship.pathPoints = [];
    ship.currentPathIndex = 0;
    ship.isStunned = false;
    ship.stunTimer = 0;
    ship.pathGraphics.clear();

    this.activeShips.push(ship);
    this.ui.updateShipCount(this.activeShips.length);
  }

  private spawnParticle(): void {
    if (this.activeParticles.length >= this.particleMaxPool * 0.8) return;

    const particle = this.particlePool.find(p => !p.active);
    if (!particle) return;

    const x = Phaser.Math.Between(50, this.worldWidth - 50);
    const y = Phaser.Math.Between(50, this.worldHeight - 50);

    particle.sprite.setPosition(x, y).setActive(true).setVisible(true);
    particle.glow.setPosition(x, y).setActive(true).setVisible(true);
    particle.active = true;

    this.tweens.add({
      targets: [particle.sprite, particle.glow],
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.out'
    });

    this.activeParticles.push(particle);
  }

  private spawnInitialParticles(): void {
    for (let i = 0; i < 500; i++) {
      this.spawnParticle();
    }
  }

  private spawnStorm(): void {
    const storm = this.stormPool.find(s => !s.active);
    if (!storm) return;

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const speed = Phaser.Math.FloatBetween(0.5, 2);

    let x: number, y: number;
    const margin = 200;
    const side = Phaser.Math.Between(0, 3);
    switch (side) {
      case 0: x = -margin; y = Phaser.Math.Between(0, this.worldHeight); break;
      case 1: x = this.worldWidth + margin; y = Phaser.Math.Between(0, this.worldHeight); break;
      case 2: x = Phaser.Math.Between(0, this.worldWidth); y = -margin; break;
      default: x = Phaser.Math.Between(0, this.worldWidth); y = this.worldHeight + margin; break;
    }

    storm.active = true;
    storm.isWarning = true;
    storm.warningTimer = 3000;
    storm.sprite.setPosition(x, y).setActive(true).setVisible(false);
    storm.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed);
    storm.radius = 80;
    storm.pulsePhase = 0;

    storm.core.setAlpha(0);
    storm.rings.forEach(ring => ring.setAlpha(0));

    this.activeStorms.push(storm);
    this.ui.showWarning(true);
  }

  private spawnInitialStorms(): void {
    for (let i = 0; i < 3; i++) {
      this.spawnStorm();
    }
  }

  private setupInputHandlers(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.ui.getIsPaused()) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      const clickedShip = this.activeShips.find(ship => {
        const dist = Phaser.Math.Distance.Between(
          worldPoint.x, worldPoint.y,
          ship.sprite.x, ship.sprite.y
        );
        return dist < 30;
      });

      if (clickedShip) {
        this.selectedShip = clickedShip;
        this.isDrawingPath = true;
        this.currentPathPoints = [new Phaser.Math.Vector2(clickedShip.sprite.x, clickedShip.sprite.y)];
        this.updatePathPreview();
      } else if (!this.isDrawingPath) {
        this.spawnShip(worldPoint.x, worldPoint.y);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDrawingPath || !this.selectedShip) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const lastPoint = this.currentPathPoints[this.currentPathPoints.length - 1];

      if (lastPoint && Phaser.Math.Distance.Between(
        worldPoint.x, worldPoint.y,
        lastPoint.x, lastPoint.y
      ) > 15) {
        this.currentPathPoints.push(new Phaser.Math.Vector2(worldPoint.x, worldPoint.y));
        this.updatePathPreview();
      }
    });

    this.input.on('pointerup', () => {
      if (this.isDrawingPath && this.selectedShip && this.currentPathPoints.length > 1) {
        this.applyPathToShip(this.selectedShip, this.currentPathPoints);
      }
      this.isDrawingPath = false;
      this.selectedShip = null;
      this.currentPathPoints = [];
      this.pathPreviewGraphics.clear();
    });

    this.input.on('wheel', (pointer: unknown, gameObjects: unknown, deltaX: number, deltaY: number) => {
      const camera = this.cameras.main;
      const zoom = camera.zoom;
      const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.3, 2);
      camera.setZoom(newZoom);
    });
  }

  private updateCamera(delta: number): void {
    const camera = this.cameras.main;
    const camSpeed = 10 / camera.zoom * (delta / 16);

    if (this.cameraKeys.up.isDown) camera.scrollY -= camSpeed;
    if (this.cameraKeys.down.isDown) camera.scrollY += camSpeed;
    if (this.cameraKeys.left.isDown) camera.scrollX -= camSpeed;
    if (this.cameraKeys.right.isDown) camera.scrollX += camSpeed;
  }

  private drawDashedLine(graphics: Phaser.GameObjects.Graphics, points: Phaser.Math.Vector2[], dashLength: number, gapLength: number): void {
    if (points.length < 2) return;

    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      if (!start || !end) continue;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const segments = Math.floor(dist / (dashLength + gapLength));

      for (let j = 0; j <= segments; j++) {
        const t1 = j * (dashLength + gapLength) / dist;
        const t2 = Math.min((j * (dashLength + gapLength) + dashLength) / dist, 1);

        const x1 = start.x + dx * t1;
        const y1 = start.y + dy * t1;
        const x2 = start.x + dx * t2;
        const y2 = start.y + dy * t2;

        graphics.beginPath();
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.strokePath();
      }
    }
  }

  private updatePathPreview(): void {
    this.pathPreviewGraphics.clear();

    if (this.currentPathPoints.length < 2) return;

    this.pathPreviewGraphics.lineStyle(3, 0x00d4ff, 0.8);
    this.drawDashedLine(this.pathPreviewGraphics, this.currentPathPoints, 10, 10);

    this.pathPreviewGraphics.fillStyle(0x00d4ff, 0.8);
    for (const point of this.currentPathPoints) {
      this.pathPreviewGraphics.fillCircle(point.x, point.y, 4);
    }
  }

  private applyPathToShip(ship: Ship, points: Phaser.Math.Vector2[]): void {
    ship.pathPoints = [...points];
    ship.currentPathIndex = 0;

    ship.pathGraphics.clear();
    ship.pathGraphics.lineStyle(2, 0x00d4ff, 0.4);
    this.drawDashedLine(ship.pathGraphics, points, 5, 5);
  }

  public override update(time: number, delta: number): void {
    if (this.ui.getIsPaused()) return;

    this.updateCamera(delta);

    this.particleSpawnTimer += delta;
    if (this.particleSpawnTimer >= this.particleSpawnInterval) {
      this.particleSpawnTimer = 0;
      if (this.activeParticles.length < 1500) {
        this.spawnParticle();
      }
    }

    this.stormSpawnTimer += delta;
    if (this.stormSpawnTimer >= this.stormSpawnInterval) {
      this.stormSpawnTimer = 0;
      if (this.activeStorms.length < 8) {
        this.spawnStorm();
      }
    }

    this.updateShips(delta);
    this.updateStorms(delta);
    this.checkCollisions();
    this.updateMinimap();
    this.updateStars();
  }

  private updateStars(): void {
    const now = performance.now();
    for (const star of this.stars) {
      star.intensity = 0.3 + Math.sin(now * 0.002 + star.x) * 0.3;
    }
  }

  private updateShips(delta: number): void {
    const now = performance.now();
    for (let i = this.activeShips.length - 1; i >= 0; i--) {
      const ship = this.activeShips[i];
      if (!ship || !ship.active) continue;

      if (ship.isStunned) {
        ship.stunTimer -= delta;
        ship.sprite.setAlpha(0.3 + Math.sin(now * 0.02) * 0.3);
        if (ship.stunTimer <= 0) {
          ship.isStunned = false;
          ship.sprite.setAlpha(1);
        }
        continue;
      }

      if (ship.pathPoints.length < 2) continue;

      const targetIndex = ship.currentPathIndex + 1;
      const target = ship.pathPoints[targetIndex];

      if (!target) {
        ship.pathPoints = ship.pathPoints.slice().reverse();
        ship.currentPathIndex = 0;
        continue;
      }

      const currentPos = new Phaser.Math.Vector2(ship.sprite.x, ship.sprite.y);
      const direction = target.clone().subtract(currentPos);
      const distance = direction.length();

      if (distance < 5) {
        ship.currentPathIndex = targetIndex;
      } else {
        direction.normalize().scale(ship.speed * (delta / 16));
        const newPos = currentPos.add(direction);
        ship.sprite.setPosition(newPos.x, newPos.y);

        const angle = Math.atan2(direction.y, direction.x) * Phaser.Math.RAD_TO_DEG + 90;
        ship.sprite.setAngle(angle);
      }

      const glowScale = 1.5 + Math.sin(now * 0.005) * 0.2;
      ship.glow.setScale(glowScale);
    }
  }

  private updateStorms(delta: number): void {
    let hasWarning = false;
    const now = performance.now();

    for (let i = this.activeStorms.length - 1; i >= 0; i--) {
      const storm = this.activeStorms[i];
      if (!storm || !storm.active) continue;

      if (storm.isWarning) {
        hasWarning = true;
        storm.warningTimer -= delta;

        const flashAlpha = Math.sin(now * 0.01) * 0.5 + 0.5;
        storm.sprite.setVisible(true);
        storm.core.setAlpha(flashAlpha * 0.5);
        storm.rings.forEach((ring, idx) => {
          ring.setAlpha(flashAlpha * 0.3 * (1 - idx * 0.2));
          ring.setRadius(40 + idx * 20 + Math.sin(now * 0.008) * 10);
        });

        if (storm.warningTimer <= 0) {
          storm.isWarning = false;
          storm.core.setAlpha(1);
          storm.rings.forEach(ring => ring.setAlpha(0.8));
        }
        continue;
      }

      const newX = storm.sprite.x + storm.velocity.x * (delta / 16);
      const newY = storm.sprite.y + storm.velocity.y * (delta / 16);

      if (newX < 0 || newX > this.worldWidth) {
        storm.velocity.x *= -1;
      }
      if (newY < 0 || newY > this.worldHeight) {
        storm.velocity.y *= -1;
      }

      storm.sprite.setPosition(
        Phaser.Math.Clamp(newX, 0, this.worldWidth),
        Phaser.Math.Clamp(newY, 0, this.worldHeight)
      );

      storm.pulsePhase += delta * 0.003;
      const pulseScale = 1 + Math.sin(storm.pulsePhase) * 0.2;
      storm.core.setScale(5 * pulseScale);

      storm.rings.forEach((ring, idx) => {
        const ringPhase = storm.pulsePhase + idx * 0.5;
        ring.setRadius((40 + idx * 20) * (1 + Math.sin(ringPhase) * 0.3));
        ring.setAlpha(0.6 + Math.sin(ringPhase) * 0.2);
      });

      if (storm.sprite.x < -300 || storm.sprite.x > this.worldWidth + 300 ||
          storm.sprite.y < -300 || storm.sprite.y > this.worldHeight + 300) {
        this.despawnStorm(storm);
      }
    }

    if (!hasWarning) {
      this.ui.showWarning(false);
    }
  }

  private despawnStorm(storm: Storm): void {
    storm.active = false;
    storm.sprite.setActive(false).setVisible(false);
    storm.sprite.setPosition(-1000, -1000);

    const idx = this.activeStorms.indexOf(storm);
    if (idx !== -1) {
      this.activeStorms.splice(idx, 1);
    }
  }

  private checkCollisions(): void {
    for (const ship of this.activeShips) {
      if (!ship.active || ship.isStunned) continue;

      for (let i = this.activeParticles.length - 1; i >= 0; i--) {
        const particle = this.activeParticles[i];
        if (!particle || !particle.active) continue;

        const dist = Phaser.Math.Distance.Between(
          ship.sprite.x, ship.sprite.y,
          particle.sprite.x, particle.sprite.y
        );

        if (dist < 25) {
          this.collectParticle(particle);
        }
      }

      for (const storm of this.activeStorms) {
        if (!storm.active || storm.isWarning) continue;

        const dist = Phaser.Math.Distance.Between(
          ship.sprite.x, ship.sprite.y,
          storm.sprite.x, storm.sprite.y
        );

        if (dist < storm.radius) {
          this.handleStormCollision(ship);
        }
      }
    }
  }

  private collectParticle(particle: Particle): void {
    const px = particle.sprite.x;
    const py = particle.sprite.y;

    this.collectParticles.emitParticleAt(px, py);

    this.cameras.main.shake(100, 0.002);

    particle.active = false;
    particle.sprite.setActive(false).setVisible(false);
    particle.glow.setActive(false).setVisible(false);
    particle.sprite.setPosition(-1000, -1000);
    particle.glow.setPosition(-1000, -1000);

    const idx = this.activeParticles.indexOf(particle);
    if (idx !== -1) {
      this.activeParticles.splice(idx, 1);
    }

    this.stardust += 1;
    this.ui.updateStardust(this.stardust);
  }

  private handleStormCollision(ship: Ship): void {
    ship.isStunned = true;
    ship.stunTimer = 2000;

    const loss = Math.min(10, Math.floor(this.stardust * 0.1));
    this.stardust = Math.max(0, this.stardust - loss);
    this.ui.updateStardust(this.stardust);

    this.cameras.main.shake(300, 0.01);

    this.tweens.add({
      targets: ship.sprite,
      scaleX: 0.5,
      scaleY: 0.5,
      yoyo: true,
      duration: 200,
      ease: 'Quad.out'
    });
  }

  private updateMinimap(): void {
    const shipPositions = this.activeShips
      .filter(s => s.active)
      .map(s => ({ x: s.sprite.x, y: s.sprite.y }));

    const stormPositions = this.activeStorms
      .filter(s => s.active)
      .map(s => ({ x: s.sprite.x, y: s.sprite.y, radius: s.radius }));

    const particlePositions = this.activeParticles
      .filter(p => p.active)
      .map(p => ({ x: p.sprite.x, y: p.sprite.y }));

    this.ui.updateMinimap(
      shipPositions,
      stormPositions,
      particlePositions,
      this.worldWidth,
      this.worldHeight
    );
  }
}
