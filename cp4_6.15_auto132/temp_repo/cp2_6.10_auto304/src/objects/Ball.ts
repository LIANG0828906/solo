export class Ball {
  public scene: Phaser.Scene;
  public sprite!: Phaser.Physics.Matter.Image;
  public body!: MatterJS.BodyType;
  private trail: Phaser.GameObjects.Graphics;
  private trailPoints: { x: number; y: number; alpha: number }[] = [];
  private maxTrailLength: number = 30;
  private isLaunched: boolean = false;
  private particles: Phaser.GameObjects.Particles.ParticleEmitterManager | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.trail = scene.add.graphics();
    this.create(x, y);
  }

  private create(x: number, y: number): void {
    const textureKey = this.createBallTexture();

    this.sprite = this.scene.matter.add.image(x, y, textureKey, undefined, {
      shape: 'circle',
      circleRadius: 15,
      friction: 0.01,
      frictionAir: 0.01,
      restitution: 0.8,
      density: 0.002
    }) as Phaser.Physics.Matter.Image;

    this.body = this.sprite.body as MatterJS.BodyType;
    this.sprite.setIgnoreGravity(true);
    this.sprite.setData('ball', this);

    this.particles = this.scene.add.particles(0, 0, undefined, {
      color: [0x7b2ff7, 0xff4b8b, 0xffffff],
      speed: { min: 20, max: 50 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      quantity: 2,
      blendMode: 'ADD',
      follow: this.sprite
    });
  }

  private createBallTexture(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const size = 50;
    canvas.width = size;
    canvas.height = size;
    const radius = size / 2;

    const gradient = ctx.createRadialGradient(radius - 5, radius - 5, 0, radius, radius, radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#ff4b8b');
    gradient.addColorStop(0.7, '#7b2ff7');
    gradient.addColorStop(1, '#4a148c');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(radius, radius, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(radius - 5, radius - 5, radius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#ff4b8b';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#ff4b8b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(radius, radius, radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();

    const key = `ball_texture_${Date.now()}`;
    this.scene.textures.addCanvas(key, canvas);
    return key;
  }

  public launch(velocityX: number, velocityY: number): void {
    this.isLaunched = true;
    this.sprite.setVelocity(velocityX, velocityY);
    this.sprite.setIgnoreGravity(false);
  }

  public reset(x: number, y: number): void {
    this.isLaunched = false;
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setIgnoreGravity(true);
    this.trailPoints = [];
    this.trail.clear();
  }

  public update(_time: number, _delta: number): void {
    if (this.isLaunched) {
      const vel = this.body.velocity;
      const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

      if (speed > 1) {
        this.trailPoints.push({
          x: this.sprite.x,
          y: this.sprite.y,
          alpha: 1
        });

        if (this.trailPoints.length > this.maxTrailLength) {
          this.trailPoints.shift();
        }
      }

      this.trail.clear();

      if (this.trailPoints.length > 1) {
        for (let i = 1; i < this.trailPoints.length; i++) {
          const prev = this.trailPoints[i - 1];
          const curr = this.trailPoints[i];
          const alpha = (i / this.trailPoints.length) * 0.6;
          const width = (i / this.trailPoints.length) * 8 + 2;

          this.trail.lineStyle(width, 0xff4b8b, alpha);
          this.trail.beginPath();
          this.trail.moveTo(prev.x, prev.y);
          this.trail.lineTo(curr.x, curr.y);
          this.trail.strokePath();

          this.trail.lineStyle(width * 0.5, 0x7b2ff7, alpha * 0.5);
          this.trail.beginPath();
          this.trail.moveTo(prev.x, prev.y);
          this.trail.lineTo(curr.x, curr.y);
          this.trail.strokePath();
        }
      }

      const { width, height } = this.scene.scale;
      if (
        this.sprite.x < -50 ||
        this.sprite.x > width + 50 ||
        this.sprite.y < -50 ||
        this.sprite.y > height + 50
      ) {
        this.reset(width / 2, height / 2);
        this.scene.events.emit('ballOutOfBounds');
      }
    }
  }

  public createCollisionParticles(x: number, y: number, color: number): void {
    const particles = this.scene.add.particles(x, y, undefined, {
      color: [color, 0xffffff, 0xff4b8b],
      speed: { min: 40, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 15,
      blendMode: 'ADD'
    });
    particles.explode();
    this.scene.time.delayedCall(800, () => particles.destroy());
  }

  public getIsLaunched(): boolean {
    return this.isLaunched;
  }

  public destroy(): void {
    this.sprite?.destroy();
    this.trail?.destroy();
    this.particles?.destroy();
  }
}
