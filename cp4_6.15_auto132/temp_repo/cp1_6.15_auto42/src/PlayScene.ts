import Phaser from 'phaser';

interface DebrisData {
  type: 'small' | 'medium' | 'large';
  score: number;
  pullTime: number;
  locked: boolean;
  pullTimer: number;
  beingPulled: boolean;
}

interface SatelliteData {
  speed: number;
  angle: number;
  wobbleFreq: number;
  wobbleAmp: number;
  baseAngle: number;
  elapsed: number;
}

export class PlayScene extends Phaser.Scene {
  private ship!: Phaser.GameObjects.Container;
  private shipBody!: Phaser.GameObjects.Arc;
  private shipGlow!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private debrisGroup!: Phaser.Physics.Arcade.Group;
  private satelliteGroup!: Phaser.Physics.Arcade.Group;
  private tractorBeam!: Phaser.GameObjects.Graphics | null;
  private beamTarget: Phaser.GameObjects.Arc | null = null;
  private beamActive: boolean = false;
  private score: number = 0;
  private lives: number = 3;
  private collected: number = 0;
  private startTime: number = 0;
  private gameOver: boolean = false;
  private stars!: Phaser.GameObjects.Graphics;
  private particleGraphics!: Phaser.GameObjects.Graphics;
  private particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }> = [];
  private warningArrows: Phaser.GameObjects.Container[] = [];
  private shipShakeOffset: { x: number; y: number } = { x: 0, y: 0 };
  private shakeIntensity: number = 0;
  private pullLocked: boolean = false;
  private largePullActive: boolean = false;
  private bgGradient!: Phaser.GameObjects.Graphics;
  private debrisSpawnTimer: number = 0;
  private satelliteSpawnTimer: number = 0;
  private invulnerable: boolean = false;
  private invulnTimer: number = 0;
  private energyRipples: Array<{ x: number; y: number; radius: number; maxRadius: number; alpha: number }> = [];

  constructor() {
    super({ key: 'PlayScene' });
  }

  create(): void {
    this.score = 0;
    this.lives = 3;
    this.collected = 0;
    this.gameOver = false;
    this.startTime = this.time.now;
    this.beamActive = false;
    this.beamTarget = null;
    this.tractorBeam = null;
    this.particles = [];
    this.energyRipples = [];
    this.shakeIntensity = 0;
    this.pullLocked = false;
    this.largePullActive = false;
    this.invulnerable = false;
    this.invulnTimer = 0;
    this.debrisSpawnTimer = 0;
    this.satelliteSpawnTimer = 0;
    this.warningArrows = [];

    this.drawBackground();
    this.drawStars();
    this.createShip();
    this.setupInput();
    this.createGroups();

    this.events.emit('update-lives', this.lives);
    this.events.emit('update-score', this.score);
    this.events.emit('update-collected', this.collected);

    this.particleGraphics = this.add.graphics();
    this.particleGraphics.setDepth(100);

    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
  }

  private drawBackground(): void {
    this.bgGradient = this.add.graphics();
    this.bgGradient.setDepth(0);
    const w = this.scale.width;
    const h = this.scale.height;
    const steps = 64;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const r = Math.floor(10 + t * 15);
      const g = Math.floor(6 + t * 8);
      const b = Math.floor(30 + t * 40);
      this.bgGradient.fillStyle(Phaser.Display.Color.GetColor(r, g, b), 1);
      this.bgGradient.fillRect(0, (h / steps) * i, w, h / steps + 1);
    }
  }

  private drawStars(): void {
    this.stars = this.add.graphics();
    this.stars.setDepth(1);
    const w = this.scale.width;
    const h = this.scale.height;
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const brightness = Phaser.Math.Between(100, 255);
      const size = Math.random() < 0.1 ? 2 : 1;
      this.stars.fillStyle(Phaser.Display.Color.GetColor(brightness, brightness, brightness + Phaser.Math.Between(0, 30)), Math.random() * 0.5 + 0.5);
      this.stars.fillCircle(x, y, size);
    }
  }

  private createShip(): void {
    this.ship = this.add.container(this.scale.width / 2, this.scale.height / 2);
    this.ship.setDepth(50);

    this.shipGlow = this.add.circle(0, 0, 24, 0x4488ff, 0.15);
    this.ship.add(this.shipGlow);

    this.shipBody = this.add.circle(0, 0, 12, 0x88ccff, 1);
    this.ship.add(this.shipBody);

    const core = this.add.circle(0, 0, 5, 0xffffff, 0.9);
    this.ship.add(core);

    const nose = this.add.triangle(0, -16, 0, -8, -6, 4, 6, 4, 0x88ccff, 1);
    this.ship.add(nose);

    const leftWing = this.add.triangle(-12, 4, 0, -6, -10, 6, 0, 6, 0x5599dd, 0.9);
    this.ship.add(leftWing);

    const rightWing = this.add.triangle(12, 4, 0, -6, 10, 6, 0, 6, 0x5599dd, 0.9);
    this.ship.add(rightWing);

    this.physics.world.enable(this.ship);
    const body = this.ship.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setCircle(14, -14 + 12, -14 + 12);
    body.setDrag(400);
    body.setMaxVelocity(300);
  }

  private setupInput(): void {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  private createGroups(): void {
    this.debrisGroup = this.physics.add.group({ runChildUpdate: true });
    this.satelliteGroup = this.physics.add.group({ runChildUpdate: true });

    this.physics.add.overlap(this.ship as unknown as Phaser.GameObjects.GameObject, this.debrisGroup, this.handleDebrisCollect, undefined, this);
    this.physics.add.overlap(this.ship as unknown as Phaser.GameObjects.GameObject, this.satelliteGroup, this.handleSatelliteHit, undefined, this);
  }

  private spawnDebris(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const roll = Math.random();
    let type: 'small' | 'medium' | 'large';
    if (roll < 0.6) type = 'small';
    else if (roll < 0.9) type = 'medium';
    else type = 'large';

    const side = Phaser.Math.Between(0, 3);
    let x = 0, y = 0;
    switch (side) {
      case 0: x = Phaser.Math.Between(0, w); y = -30; break;
      case 1: x = w + 30; y = Phaser.Math.Between(0, h); break;
      case 2: x = Phaser.Math.Between(0, w); y = h + 30; break;
      default: x = -30; y = Phaser.Math.Between(0, h); break;
    }

    let radius: number, color: number, speed: number, score: number, pullTime: number;

    switch (type) {
      case 'small':
        radius = 6; color = 0xaabbcc; speed = Phaser.Math.Between(60, 120); score = 10; pullTime = 0;
        break;
      case 'medium':
        radius = 12; color = 0xcc5544; speed = Phaser.Math.Between(30, 60); score = 30; pullTime = 2;
        break;
      case 'large':
        radius = 22; color = 0xccaa44; speed = 0; score = 50; pullTime = 3;
        break;
    }

    const glowColor = type === 'small' ? 0x6688aa : type === 'medium' ? 0xaa4433 : 0xaa8833;
    const glow = this.add.circle(0, 0, radius + 8, glowColor, 0.2);
    const body = this.add.circle(0, 0, radius, color, 0.9);

    const container = this.add.container(x, y, [glow, body]);
    container.setDepth(20);
    this.physics.world.enable(container);
    const physBody = container.body as Phaser.Physics.Arcade.Body;
    physBody.setCircle(radius, -radius, -radius);

    if (type === 'large') {
      this.tweens.add({
        targets: container,
        angle: 360,
        duration: 8000,
        repeat: -1,
      });
      physBody.setVelocity(0, 0);
      physBody.setImmovable(true);
    } else {
      const targetX = Phaser.Math.Between(w * 0.2, w * 0.8);
      const targetY = Phaser.Math.Between(h * 0.2, h * 0.8);
      const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
      physBody.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }

    const data: DebrisData = { type, score, pullTime, locked: false, pullTimer: 0, beingPulled: false };
    container.setData('debrisData', data);
    container.setData('glow', glow);
    container.setData('body', body);
    container.setData('radius', radius);

    this.debrisGroup.add(container);
  }

  private spawnSatellite(): void {
    const w = this.scale.width;
    const h = this.scale.height;

    const side = Phaser.Math.Between(0, 3);
    let x = 0, y = 0, angle = 0;
    switch (side) {
      case 0:
        x = Phaser.Math.Between(0, w); y = -40;
        angle = Phaser.Math.FloatBetween(Math.PI * 0.15, Math.PI * 0.85);
        break;
      case 1:
        x = w + 40; y = Phaser.Math.Between(0, h);
        angle = Phaser.Math.FloatBetween(Math.PI * 0.65, Math.PI * 1.35);
        break;
      case 2:
        x = Phaser.Math.Between(0, w); y = h + 40;
        angle = Phaser.Math.FloatBetween(-Math.PI * 0.85, -Math.PI * 0.15);
        break;
      default:
        x = -40; y = Phaser.Math.Between(0, h);
        angle = Phaser.Math.FloatBetween(-Math.PI * 0.35, Math.PI * 0.35);
        break;
    }

    const speed = Phaser.Math.Between(250, 400);
    const wobbleFreq = Phaser.Math.FloatBetween(2, 5);
    const wobbleAmp = Phaser.Math.FloatBetween(0.3, 1.0);

    const satBody = this.add.rectangle(0, 0, 28, 14, 0xdd3333, 0.9);
    const satPanel = this.add.rectangle(0, 0, 40, 6, 0x995544, 0.8);
    const satGlow = this.add.circle(0, 0, 22, 0xff2222, 0.12);

    const container = this.add.container(x, y, [satGlow, satPanel, satBody]);
    container.setDepth(30);
    container.angle = Phaser.Math.RadToDeg(angle) + 90;
    this.physics.world.enable(container);
    const physBody = container.body as Phaser.Physics.Arcade.Body;
    physBody.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    physBody.setCircle(18, -18, -18);

    const satData: SatelliteData = {
      speed,
      angle,
      wobbleFreq,
      wobbleAmp,
      baseAngle: angle,
      elapsed: 0,
    };
    container.setData('satData', satData);

    this.satelliteGroup.add(container);

    this.createWarningArrow(side, container);
  }

  private createWarningArrow(side: number, _satellite: Phaser.GameObjects.Container): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const margin = 30;

    const arrow = this.add.graphics();
    arrow.fillStyle(0xff3333, 0.8);
    arrow.setDepth(90);

    const arrowContainer = this.add.container(0, 0, [arrow]);
    arrowContainer.setDepth(90);

    switch (side) {
      case 0:
        arrowContainer.setPosition(Phaser.Math.Between(margin, w - margin), margin);
        arrow.slice(0, 0, 8, Math.PI * 0.5, Math.PI * 1.5, true);
        arrow.fillPath();
        break;
      case 1:
        arrowContainer.setPosition(w - margin, Phaser.Math.Between(margin, h - margin));
        arrow.slice(0, 0, 8, Math.PI, Math.PI * 2, true);
        arrow.fillPath();
        break;
      case 2:
        arrowContainer.setPosition(Phaser.Math.Between(margin, w - margin), h - margin);
        arrow.slice(0, 0, 8, 0, Math.PI, true);
        arrow.fillPath();
        break;
      default:
        arrowContainer.setPosition(margin, Phaser.Math.Between(margin, h - margin));
        arrow.slice(0, 0, 8, -Math.PI * 0.5, Math.PI * 0.5, true);
        arrow.fillPath();
        break;
    }

    this.tweens.add({
      targets: arrowContainer,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        arrowContainer.destroy();
      },
    });

    this.warningArrows.push(arrowContainer);
  }

  private handleDebrisCollect(_ship: Phaser.GameObjects.GameObject, debrisObj: Phaser.GameObjects.GameObject): void {
    const container = debrisObj as Phaser.GameObjects.Container;
    const data = container.getData('debrisData') as DebrisData;
    if (!data || !data.beingPulled) return;

    this.score += data.score;
    this.collected++;
    this.events.emit('update-score', this.score);
    this.events.emit('update-collected', this.collected);

    const px = container.x;
    const py = container.y;
    this.spawnCollectParticles(px, py);
    this.spawnEnergyRipple(this.ship.x, this.ship.y);

    this.releaseBeam();
    container.destroy();
  }

  private handleSatelliteHit(_ship: Phaser.GameObjects.GameObject, _satellite: Phaser.GameObjects.GameObject): void {
    if (this.invulnerable || this.gameOver) return;

    this.lives--;
    this.events.emit('update-lives', this.lives);
    this.shakeIntensity = 15;
    this.invulnerable = true;
    this.invulnTimer = 1500;

    this.releaseBeam();

    this.tweens.add({
      targets: this.shipBody,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 7,
    });

    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  private spawnCollectParticles(x: number, y: number): void {
    const count = 20;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= 200) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(40, 140);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: Phaser.Math.FloatBetween(0.4, 0.9),
        maxLife: Phaser.Math.FloatBetween(0.4, 0.9),
        size: Phaser.Math.FloatBetween(1.5, 4),
      });
    }
  }

  private spawnEnergyRipple(x: number, y: number): void {
    this.energyRipples.push({
      x, y,
      radius: 5,
      maxRadius: 60,
      alpha: 0.8,
    });
  }

  private fireBeam(): void {
    if (this.beamActive || this.gameOver) return;

    const pointer = this.input.activePointer;
    const shipX = this.ship.x;
    const shipY = this.ship.y;
    const beamAngle = Phaser.Math.Angle.Between(shipX, shipY, pointer.worldX, pointer.worldY);
    const maxDist = 350;

    let closest: Phaser.GameObjects.Arc | null = null;
    let closestDist = maxDist;

    this.debrisGroup.getChildren().forEach((child) => {
      const container = child as Phaser.GameObjects.Container;
      const data = container.getData('debrisData') as DebrisData;
      if (!data || data.locked) return;

      const dist = Phaser.Math.Distance.Between(shipX, shipY, container.x, container.y);
      if (dist > maxDist) return;

      const angleToDebris = Phaser.Math.Angle.Between(shipX, shipY, container.x, container.y);
      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToDebris - beamAngle));

      if (angleDiff < 0.25 && dist < closestDist) {
        closestDist = dist;
        closest = container as unknown as Phaser.GameObjects.Arc;
      }
    });

    this.beamActive = true;
    this.beamTarget = closest;

    if (closest) {
      const container = closest as unknown as Phaser.GameObjects.Container;
      const data = container.getData('debrisData') as DebrisData;
      data.beingPulled = true;
      data.pullTimer = 0;

      if (data.type === 'large') {
        this.largePullActive = true;
        this.pullLocked = true;
      }
    }
  }

  private releaseBeam(): void {
    if (this.beamTarget) {
      const container = this.beamTarget as unknown as Phaser.GameObjects.Container;
      if (container && container.active) {
        const data = container.getData('debrisData') as DebrisData;
        if (data) {
          data.beingPulled = false;
          data.pullTimer = 0;
        }
      }
    }
    this.beamActive = false;
    this.beamTarget = null;
    this.pullLocked = false;
    this.largePullActive = false;
  }

  private updateBeamGraphics(): void {
    if (this.tractorBeam) {
      this.tractorBeam.destroy();
      this.tractorBeam = null;
    }

    if (!this.beamActive) return;

    const pointer = this.input.activePointer;
    const shipX = this.ship.x;
    const shipY = this.ship.y;

    const gfx = this.add.graphics();
    gfx.setDepth(40);

    if (this.beamTarget) {
      const container = this.beamTarget as unknown as Phaser.GameObjects.Container;
      if (!container.active) {
        this.releaseBeam();
        return;
      }

      const targetX = container.x;
      const targetY = container.y;

      gfx.lineStyle(2, 0x4488ff, 0.6);
      gfx.lineBetween(shipX, shipY, targetX, targetY);

      gfx.lineStyle(6, 0x2266cc, 0.15);
      gfx.lineBetween(shipX, shipY, targetX, targetY);

      const segments = 8;
      for (let i = 0; i < segments; i++) {
        const t = i / segments;
        const px = Phaser.Math.Linear(shipX, targetX, t);
        const py = Phaser.Math.Linear(shipY, targetY, t);
        const offset = Math.sin(this.time.now / 80 + i * 1.5) * 4;
        gfx.fillStyle(0x88bbff, 0.4);
        gfx.fillCircle(px + offset, py + offset, 2);
      }
    } else {
      const beamAngle = Phaser.Math.Angle.Between(shipX, shipY, pointer.worldX, pointer.worldY);
      const endX = shipX + Math.cos(beamAngle) * 350;
      const endY = shipY + Math.sin(beamAngle) * 350;

      gfx.lineStyle(1, 0x4488ff, 0.3);
      gfx.lineBetween(shipX, shipY, endX, endY);
    }

    this.tractorBeam = gfx;
  }

  private updatePull(delta: number): void {
    if (!this.beamActive || !this.beamTarget) return;

    const container = this.beamTarget as unknown as Phaser.GameObjects.Container;
    if (!container.active) {
      this.releaseBeam();
      return;
    }

    const data = container.getData('debrisData') as DebrisData;

    if (data.type === 'large' && this.pullLocked) {
      const body = this.ship.body as Phaser.Physics.Arcade.Body;
      const speed = body.speed;
      if (speed > 20) {
        this.releaseBeam();
        return;
      }
    }

    if (data.pullTime > 0) {
      data.pullTimer += delta / 1000;
      if (data.pullTimer < data.pullTime) {
        const pullSpeed = 30 + (data.pullTimer / data.pullTime) * 80;
        const angle = Phaser.Math.Angle.Between(container.x, container.y, this.ship.x, this.ship.y);
        const physBody = container.body as Phaser.Physics.Arcade.Body;
        physBody.setVelocity(Math.cos(angle) * pullSpeed, Math.sin(angle) * pullSpeed);
        physBody.setImmovable(false);
        return;
      }
    }

    const pullSpeed = 150;
    const angle = Phaser.Math.Angle.Between(container.x, container.y, this.ship.x, this.ship.y);
    const physBody = container.body as Phaser.Physics.Arcade.Body;
    physBody.setVelocity(Math.cos(angle) * pullSpeed, Math.sin(angle) * pullSpeed);
    physBody.setImmovable(false);
  }

  private updateParticles(delta: number): void {
    const dt = delta / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawParticles(): void {
    this.particleGraphics.clear();
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      const alpha = t * 0.8;
      const r = Phaser.Math.Interpolation.Linear([200, 150], 1 - t);
      const g = Phaser.Math.Interpolation.Linear([220, 200], 1 - t);
      const b = 255;
      this.particleGraphics.fillStyle(Phaser.Display.Color.GetColor(Math.floor(r), Math.floor(g), b), alpha);
      this.particleGraphics.fillCircle(p.x, p.y, p.size * t);
    }
  }

  private updateEnergyRipples(delta: number): void {
    const dt = delta / 1000;
    for (let i = this.energyRipples.length - 1; i >= 0; i--) {
      const r = this.energyRipples[i];
      r.radius += 120 * dt;
      r.alpha -= 1.2 * dt;
      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.energyRipples.splice(i, 1);
      }
    }
  }

  private drawEnergyRipples(): void {
    for (const r of this.energyRipples) {
      this.particleGraphics.lineStyle(2, 0x4488ff, r.alpha);
      this.particleGraphics.strokeCircle(r.x, r.y, r.radius);
    }
  }

  private updateSatellites(delta: number): void {
    const w = this.scale.width;
    const h = this.scale.height;

    this.satelliteGroup.getChildren().forEach((child) => {
      const container = child as Phaser.GameObjects.Container;
      const satData = container.getData('satData') as SatelliteData;
      if (!satData) return;

      satData.elapsed += delta / 1000;
      const wobble = Math.sin(satData.elapsed * satData.wobbleFreq) * satData.wobbleAmp;
      const currentAngle = satData.baseAngle + wobble;
      const physBody = container.body as Phaser.Physics.Arcade.Body;
      physBody.setVelocity(
        Math.cos(currentAngle) * satData.speed,
        Math.sin(currentAngle) * satData.speed,
      );
      container.angle = Phaser.Math.RadToDeg(currentAngle) + 90;

      if (container.x < -100 || container.x > w + 100 || container.y < -100 || container.y > h + 100) {
        container.destroy();
      }
    });
  }

  private cleanupDebris(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const margin = 100;

    this.debrisGroup.getChildren().forEach((child) => {
      const container = child as Phaser.GameObjects.Container;
      const data = container.getData('debrisData') as DebrisData;
      if (data && data.type === 'large') return;
      if (container.x < -margin || container.x > w + margin || container.y < -margin || container.y > h + margin) {
        container.destroy();
      }
    });
  }

  private updateShipShake(delta: number): void {
    if (this.shakeIntensity > 0) {
      this.shipShakeOffset.x = Phaser.Math.FloatBetween(-this.shakeIntensity, this.shakeIntensity);
      this.shipShakeOffset.y = Phaser.Math.FloatBetween(-this.shakeIntensity, this.shakeIntensity);
      this.shakeIntensity *= 0.92;
      if (this.shakeIntensity < 0.5) {
        this.shakeIntensity = 0;
        this.shipShakeOffset.x = 0;
        this.shipShakeOffset.y = 0;
      }
    }

    this.ship.x += this.shipShakeOffset.x;
    this.ship.y += this.shipShakeOffset.y;

    if (this.invulnerable) {
      this.invulnTimer -= delta;
      if (this.invulnTimer <= 0) {
        this.invulnerable = false;
        this.shipBody.setAlpha(1);
      }
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    this.releaseBeam();

    const elapsed = (this.time.now - this.startTime) / 1000;
    this.events.emit('game-over', {
      score: this.score,
      collected: this.collected,
      time: elapsed,
    });

    this.physics.pause();
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    const body = this.ship.body as Phaser.Physics.Arcade.Body;
    const accel = 600;

    if (!this.pullLocked) {
      body.setAcceleration(0, 0);
      if (this.wasd.W.isDown || this.cursors.up.isDown) body.setAccelerationY(-accel);
      if (this.wasd.S.isDown || this.cursors.down.isDown) body.setAccelerationY(accel);
      if (this.wasd.A.isDown || this.cursors.left.isDown) body.setAccelerationX(-accel);
      if (this.wasd.D.isDown || this.cursors.right.isDown) body.setAccelerationX(accel);
    } else {
      body.setAcceleration(0, 0);
      body.setVelocity(0, 0);
    }

    const pointer = this.input.activePointer;
    const angle = Phaser.Math.Angle.Between(this.ship.x, this.ship.y, pointer.worldX, pointer.worldY);
    this.ship.angle = Phaser.Math.RadToDeg(angle) + 90;

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.fireBeam();
    }

    if (!this.spaceKey.isDown && this.beamActive && !this.beamTarget) {
      this.releaseBeam();
    }

    this.updateBeamGraphics();
    this.updatePull(delta);
    this.updateShipShake(delta);
    this.updateParticles(delta);
    this.updateEnergyRipples(delta);
    this.updateSatellites(delta);

    this.drawParticles();
    this.drawEnergyRipples();

    this.debrisSpawnTimer += delta;
    if (this.debrisSpawnTimer > 1500) {
      this.debrisSpawnTimer = 0;
      this.spawnDebris();
    }

    this.satelliteSpawnTimer += delta;
    if (this.satelliteSpawnTimer > 5000) {
      this.satelliteSpawnTimer = 0;
      this.spawnSatellite();
    }

    this.cleanupDebris();
  }
}
