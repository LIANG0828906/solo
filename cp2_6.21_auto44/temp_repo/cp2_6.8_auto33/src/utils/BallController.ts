import Phaser from 'phaser';

export class BallController {
  private scene: Phaser.Scene;
  public balls!: Phaser.Physics.Arcade.Group;
  private readonly baseSpeed: number = 450;
  private readonly ballRadius: number = 10;
  private isFireballActive: boolean = false;
  private fireballTimer: Phaser.Time.TimerEvent | null = null;
  private fireballEmitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(x: number, y: number): Phaser.Physics.Arcade.Group {
    this.balls = this.scene.physics.add.group({
      bounceX: 1,
      bounceY: 1,
      collideWorldBounds: true
    });

    this.createBallTexture();
    this.createFireballTexture();
    this.spawnBall(x, y);
    return this.balls;
  }

  private createBallTexture(): void {
    const key = 'ball';
    if (this.scene.textures.exists(key)) return;

    const size = this.ballRadius * 2 + 8;
    const texture = this.scene.textures.createCanvas(key, size, size);
    if (!texture) return;
    const ctx = texture.getContext();
    if (!ctx) return;
    const center = size / 2;

    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 15;

    const gradient = ctx.createRadialGradient(center - 3, center - 3, 0, center, center, this.ballRadius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#88ffff');
    gradient.addColorStop(1, '#00aaff');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    texture.refresh();
  }

  private createFireballTexture(): void {
    const key = 'fireball';
    if (this.scene.textures.exists(key)) return;

    const size = this.ballRadius * 2 + 20;
    const texture = this.scene.textures.createCanvas(key, size, size);
    if (!texture) return;
    const ctx = texture.getContext();
    if (!ctx) return;
    const center = size / 2;

    ctx.shadowColor = '#ff6600';
    ctx.shadowBlur = 25;

    const gradient = ctx.createRadialGradient(center - 3, center - 3, 0, center, center, this.ballRadius + 3);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#ffff00');
    gradient.addColorStop(0.5, '#ff6600');
    gradient.addColorStop(1, '#ff0000');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, this.ballRadius + 3, 0, Math.PI * 2);
    ctx.fill();

    texture.refresh();
  }

  private spawnBall(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    const ball = this.balls.create(x, y, this.isFireballActive ? 'fireball' : 'ball') as Phaser.Physics.Arcade.Sprite;
    const uniqueId = Phaser.Utils.String.UUID();
    ball.setData('ballId', uniqueId);
    ball.setCircle(this.ballRadius);
    ball.setCollideWorldBounds(true);
    ball.setBounce(1, 1);
    ball.setDisplaySize(this.ballRadius * 2, this.ballRadius * 2);
    ball.setData('isFireball', this.isFireballActive);

    const angle = Phaser.Math.Between(-70, -110);
    const rad = Phaser.Math.DegToRad(angle);
    ball.setVelocity(
      Math.cos(rad) * this.baseSpeed,
      Math.sin(rad) * this.baseSpeed
    );

    if (this.isFireballActive) {
      this.attachFireballEffect(ball);
    }

    return ball;
  }

  private attachFireballEffect(ball: Phaser.Physics.Arcade.Sprite): void {
    const ballId = ball.getData('ballId') as string;
    const emitter = this.scene.add.particles(0, 0, 'fireball', {
      speed: 50,
      lifespan: 300,
      scale: { start: 0.8, end: 0 },
      tint: [0xffff00, 0xff6600, 0xff0000],
      alpha: { start: 1, end: 0 },
      blendMode: 'ADD',
      follow: ball,
      quantity: 2,
      frequency: 30
    });
    this.fireballEmitters.set(ballId, emitter);
  }

  handlePaddleCollision(ball: Phaser.Physics.Arcade.Sprite, paddle: Phaser.GameObjects.GameObject): void {
    const paddleSprite = paddle as Phaser.Physics.Arcade.Sprite;
    const hitPos = (ball.x - paddleSprite.x) / (paddleSprite.displayWidth / 2);
    const angle = hitPos * 70;
    const rad = Phaser.Math.DegToRad(angle - 90);

    const speed = this.baseSpeed;
    ball.setVelocity(Math.cos(rad) * speed, Math.sin(rad) * speed);

    const ballBody = ball.body as Phaser.Physics.Arcade.Body;
    if (ballBody) {
      ball.setVelocityY(Math.min(ballBody.velocity.y, -100));
    }
  }

  handleBrickCollision(ball: Phaser.Physics.Arcade.Sprite): boolean {
    const isFireball = ball.getData('isFireball') as boolean;
    return isFireball;
  }

  splitIntoThree(sourceBall: Phaser.Physics.Arcade.Sprite): void {
    const x = sourceBall.x;
    const y = sourceBall.y;
    const sourceBody = sourceBall.body as Phaser.Physics.Arcade.Body;
    if (!sourceBody) return;
    const baseVelocity = new Phaser.Math.Vector2(
      sourceBody.velocity.x,
      sourceBody.velocity.y
    );
    const baseAngle = Math.atan2(baseVelocity.y, baseVelocity.x);

    for (let i = 0; i < 2; i++) {
      const offsetAngle = i === 0 ? -15 : 15;
      const rad = Phaser.Math.DegToRad(Phaser.Math.RadToDeg(baseAngle) + offsetAngle);
      const newBall = this.spawnBall(x, y);
      newBall.setVelocity(
        Math.cos(rad) * this.baseSpeed,
        Math.sin(rad) * this.baseSpeed
      );
    }
  }

  activateFireball(duration: number = 8000): void {
    this.isFireballActive = true;

    this.balls.getChildren().forEach(child => {
      const ball = child as Phaser.Physics.Arcade.Sprite;
      ball.setTexture('fireball');
      ball.setDisplaySize(this.ballRadius * 2 + 6, this.ballRadius * 2 + 6);
      ball.setData('isFireball', true);
      this.attachFireballEffect(ball);
    });

    if (this.fireballTimer) {
      this.fireballTimer.remove();
    }
    this.fireballTimer = this.scene.time.delayedCall(duration, () => {
      this.deactivateFireball();
    });
  }

  private deactivateFireball(): void {
    this.isFireballActive = false;

    this.balls.getChildren().forEach(child => {
      const ball = child as Phaser.Physics.Arcade.Sprite;
      ball.setTexture('ball');
      ball.setDisplaySize(this.ballRadius * 2, this.ballRadius * 2);
      ball.setData('isFireball', false);
    });

    this.fireballEmitters.forEach(emitter => emitter.stop());
    this.fireballEmitters.clear();
  }

  checkLostBalls(): Phaser.Physics.Arcade.Sprite[] {
    const lostBalls: Phaser.Physics.Arcade.Sprite[] = [];
    const height = this.scene.cameras.main.height;

    this.balls.getChildren().forEach(child => {
      const ball = child as Phaser.Physics.Arcade.Sprite;
      if (ball.y > height + 50) {
        lostBalls.push(ball);
      }
    });

    return lostBalls;
  }

  removeBall(ball: Phaser.Physics.Arcade.Sprite): void {
    const ballId = ball.getData('ballId') as string | undefined;
    if (ballId) {
      const emitter = this.fireballEmitters.get(ballId);
      if (emitter) {
        emitter.stop();
        this.fireballEmitters.delete(ballId);
      }
    }
    this.balls.remove(ball, true, true);
  }

  resetBall(x: number, y: number): void {
    this.balls.clear(true, true);
    this.fireballEmitters.forEach(emitter => emitter.stop());
    this.fireballEmitters.clear();
    this.deactivateFireball();
    this.spawnBall(x, y);
  }

  getBallCount(): number {
    return this.balls?.countActive() || 0;
  }

  clear(): void {
    if (this.balls) {
      this.balls.clear(true, true);
    }
    this.fireballEmitters.forEach(emitter => emitter.stop());
    this.fireballEmitters.clear();
    this.isFireballActive = false;
    if (this.fireballTimer) {
      this.fireballTimer.remove();
      this.fireballTimer = null;
    }
  }
}
