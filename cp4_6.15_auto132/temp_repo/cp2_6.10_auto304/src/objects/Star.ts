export enum StarType {
  DUST = 'dust',
  METEOR = 'meteor',
  CRYSTAL = 'crystal'
}

const STAR_COLORS = {
  [StarType.DUST]: 0xffd700,
  [StarType.METEOR]: 0xcc0000,
  [StarType.CRYSTAL]: 0x00e5ff
};

const STAR_SCORES = {
  [StarType.DUST]: 10,
  [StarType.METEOR]: -5,
  [StarType.CRYSTAL]: 50
};

export class Star {
  public scene: Phaser.Scene;
  public type: StarType;
  public sprite!: Phaser.Physics.Matter.Image;
  public body!: MatterJS.BodyType;
  public particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  public isAlive: boolean = true;
  private rotationSpeed: number = 0;
  private glow: Phaser.GameObjects.Graphics | null = null;
  private particleManager: Phaser.GameObjects.Particles.ParticleEmitterManager | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, type: StarType) {
    this.scene = scene;
    this.type = type;
    this.create(x, y);
  }

  private create(x: number, y: number): void {
    const radius = this.type === StarType.CRYSTAL ? 28 : this.type === StarType.METEOR ? 32 : 22;
    const color = STAR_COLORS[this.type];

    this.createGlow(x, y, radius, color);

    this.sprite = this.scene.matter.add.image(x, y, this.getTextureKey(), undefined, {
      shape: 'circle',
      circleRadius: radius,
      friction: 0.1,
      restitution: this.type === StarType.METEOR ? 0.8 : 0.3,
      density: this.type === StarType.METEOR ? 0.01 : 0.001
    }) as Phaser.Physics.Matter.Image;

    this.body = this.sprite.body as MatterJS.BodyType;

    this.sprite.setData('star', this);
    this.sprite.setData('type', this.type);

    if (this.type === StarType.CRYSTAL) {
      this.rotationSpeed = 0.02;
      this.sprite.setIgnoreGravity(true);
      this.createCrystalParticles();
    } else if (this.type === StarType.DUST) {
      this.rotationSpeed = 0.005;
      this.sprite.setIgnoreGravity(true);
    } else {
      this.rotationSpeed = 0.01;
      this.sprite.setIgnoreGravity(true);
    }
  }

  private getTextureKey(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const size = 80;
    canvas.width = size;
    canvas.height = size;
    const radius = size / 2;
    const color = STAR_COLORS[this.type];
    const hexColor = '#' + color.toString(16).padStart(6, '0');

    if (this.type === StarType.CRYSTAL) {
      ctx.save();
      ctx.translate(radius, radius);
      ctx.rotate(Math.PI / 4);
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.8);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, hexColor);
      gradient.addColorStop(1, 'rgba(0, 229, 255, 0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(-radius * 0.7, -radius * 0.7, radius * 1.4, radius * 1.4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-radius * 0.7, -radius * 0.7, radius * 1.4, radius * 1.4);
      ctx.restore();
    } else if (this.type === StarType.METEOR) {
      const gradient = ctx.createRadialGradient(radius - 5, radius - 5, 0, radius, radius, radius);
      gradient.addColorStop(0, '#ff4444');
      gradient.addColorStop(0.5, hexColor);
      gradient.addColorStop(1, '#660000');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = radius * (0.85 + Math.random() * 0.3);
        const px = radius + Math.cos(angle) * r;
        const py = radius + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.stroke();
    } else {
      const gradient = ctx.createRadialGradient(radius - 3, radius - 3, 0, radius, radius, radius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.4, hexColor);
      gradient.addColorStop(1, '#b8860b');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(radius, radius, radius * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(radius - 5, radius - 5, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    const key = `star_${this.type}_${Date.now()}_${Math.random()}`;
    this.scene.textures.addCanvas(key, canvas);
    return key;
  }

  private createGlow(x: number, y: number, radius: number, color: number): void {
    this.glow = this.scene.add.graphics();
    this.glow.fillStyle(color, 0.3);
    this.glow.fillCircle(x, y, radius * 2);
  }

  private createCrystalParticles(): void {
    this.particleManager = this.scene.add.particles(0, 0, undefined, {
      lifespan: 500,
      speed: { min: 20, max: 50 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, 35),
        quantity: 10
      }
    });

    this.particleManager.startFollow(this.sprite);
    this.particles = this.particleManager.emitters.first;
  }

  public hit(): { score: number; shouldBounce: boolean; waveComplete: boolean } {
    if (!this.isAlive) return { score: 0, shouldBounce: false, waveComplete: false };

    this.isAlive = false;

    if (this.type === StarType.DUST) {
      this.createDustExplosion();
    } else if (this.type === StarType.METEOR) {
      this.createMeteorExplosion();
    } else {
      this.createCrystalExplosion();
    }

    this.glow?.destroy();
    this.sprite.destroy();
    this.particleManager?.destroy();

    return {
      score: STAR_SCORES[this.type],
      shouldBounce: this.type === StarType.METEOR,
      waveComplete: this.type === StarType.CRYSTAL
    };
  }

  private createDustExplosion(): void {
    const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, undefined, {
      color: [0xffd700, 0xffaa00, 0xffffff],
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 25,
      blendMode: 'ADD'
    });
    particles.explode();
    this.scene.time.delayedCall(1000, () => particles.destroy());
  }

  private createMeteorExplosion(): void {
    const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, undefined, {
      color: [0xcc0000, 0xff4444, 0x880000],
      speed: { min: 30, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      quantity: 15,
      blendMode: 'ADD'
    });
    particles.explode();
    this.scene.time.delayedCall(1200, () => particles.destroy());
  }

  private createCrystalExplosion(): void {
    const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, undefined, {
      color: [0x00e5ff, 0x00ffff, 0xffffff],
      speed: { min: 100, max: 300 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 1200,
      quantity: 40,
      blendMode: 'ADD'
    });
    particles.explode();
    this.scene.time.delayedCall(1500, () => particles.destroy());
  }

  public update(): void {
    if (!this.isAlive) return;

    this.sprite.rotation += this.rotationSpeed;

    if (this.glow) {
      this.glow.clear();
      const pulse = 1 + Math.sin(this.scene.time.now / 300) * 0.1;
      const radius = (this.type === StarType.CRYSTAL ? 28 : this.type === StarType.METEOR ? 32 : 22) * 2 * pulse;
      this.glow.fillStyle(STAR_COLORS[this.type], 0.2 * pulse);
      this.glow.fillCircle(this.sprite.x, this.sprite.y, radius);
    }

    if (this.type === StarType.CRYSTAL && this.particleManager) {
      this.particleManager.emitParticleAt(this.sprite.x, this.sprite.y, 1);
    }
  }

  public destroy(): void {
    this.glow?.destroy();
    this.sprite?.destroy();
    this.particleManager?.destroy();
  }
}
