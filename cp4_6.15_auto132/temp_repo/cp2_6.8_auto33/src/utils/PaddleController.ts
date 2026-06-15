import Phaser from 'phaser';

export class PaddleController {
  private scene: Phaser.Scene;
  public paddle!: Phaser.Physics.Arcade.Sprite;
  private currentWidth: number = 180;
  private targetWidth: number = 180;
  private readonly minWidth: number = 120;
  private readonly maxWidth: number = 280;
  private readonly height: number = 18;
  private readonly followSpeed: number = 0.8;
  private originalY: number = 0;
  private squeezeAmount: number = 0;
  private isGlowing: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(x: number, y: number): Phaser.Physics.Arcade.Sprite {
    this.originalY = y;
    this.createPaddleTexture(this.currentWidth);

    this.paddle = this.scene.physics.add.sprite(x, y, 'paddle');
    this.paddle.setImmovable(true);
    this.paddle.setCollideWorldBounds(true);
    this.paddle.setDisplaySize(this.currentWidth, this.height);
    this.paddle.body.setSize(this.currentWidth, this.height);

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.updatePosition(pointer.x);
    });

    return this.paddle;
  }

  private createPaddleTexture(width: number): void {
    const key = 'paddle';
    const textureHeight = this.height + 20;
    const texture = this.scene.textures.createCanvas(key, width, textureHeight);
    const ctx = texture.getContext();

    ctx.clearRect(0, 0, width, textureHeight);

    const bodyGradient = ctx.createLinearGradient(0, 10, 0, 10 + this.height);
    bodyGradient.addColorStop(0, '#2a1a4a');
    bodyGradient.addColorStop(0.5, '#3d2a6a');
    bodyGradient.addColorStop(1, '#1a0f33');

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.roundRect(0, 10, width, this.height, 8);
    ctx.fill();

    const bottomGradient = ctx.createLinearGradient(0, 10 + this.height - 5, 0, 10 + this.height);
    bottomGradient.addColorStop(0, '#ff6f00');
    bottomGradient.addColorStop(1, '#ffee58');

    ctx.fillStyle = bottomGradient;
    ctx.beginPath();
    ctx.roundRect(5, 10 + this.height - 5, width - 10, 5, [0, 0, 4, 4]);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(0.5, 10.5, width - 1, this.height - 1, 8);
    ctx.stroke();

    if (this.isGlowing) {
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0.5, 10.5, width - 1, this.height - 1, 8);
      ctx.stroke();
    }

    texture.refresh();
  }

  private updatePosition(targetX: number): void {
    if (!this.paddle) return;

    const newX = this.paddle.x + (targetX - this.paddle.x) * this.followSpeed;
    const halfWidth = this.currentWidth / 2;
    const clampedX = Phaser.Math.Clamp(
      newX,
      halfWidth,
      this.scene.cameras.main.width - halfWidth
    );
    this.paddle.x = clampedX;
  }

  update(time: number, delta: number): void {
    if (Math.abs(this.currentWidth - this.targetWidth) > 1) {
      const diff = this.targetWidth - this.currentWidth;
      const step = (diff / 200) * delta;
      this.currentWidth += step;
      this.updatePaddleSize();
    }

    if (this.squeezeAmount > 0) {
      this.squeezeAmount = Math.max(0, this.squeezeAmount - delta * 0.01);
      const squeezeScale = 1 - this.squeezeAmount * 0.2;
      const stretchScale = 1 + this.squeezeAmount * 0.1;
      this.paddle.setScale(stretchScale, squeezeScale);
      this.paddle.y = this.originalY + this.squeezeAmount * 5;
    } else {
      this.paddle.setScale(1, 1);
      this.paddle.y = this.originalY;
    }
  }

  private updatePaddleSize(): void {
    if (!this.paddle) return;
    this.createPaddleTexture(this.currentWidth);
    this.paddle.setDisplaySize(this.currentWidth, this.height);
    this.paddle.body.setSize(this.currentWidth, this.height);
    this.paddle.body.updateFromGameObject();
  }

  expand(duration: number = 5000): void {
    this.targetWidth = this.maxWidth;
    this.isGlowing = true;
    this.updatePaddleSize();

    this.scene.time.delayedCall(duration, () => {
      this.targetWidth = 180;
      this.isGlowing = false;
      this.updatePaddleSize();
    });
  }

  triggerBounce(): void {
    this.squeezeAmount = 1;
  }

  flashRed(): void {
    if (!this.paddle) return;

    const originalTexture = this.paddle.texture;
    const flashKey = 'paddle-flash';
    const textureHeight = this.height + 20;
    const texture = this.scene.textures.createCanvas(flashKey, this.currentWidth, textureHeight);
    const ctx = texture.getContext();

    const gradient = ctx.createLinearGradient(0, 10, 0, 10 + this.height);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(1, '#990000');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(0, 10, this.currentWidth, this.height, 8);
    ctx.fill();

    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(0.5, 10.5, this.currentWidth - 1, this.height - 1, 8);
    ctx.stroke();

    texture.refresh();
    this.paddle.setTexture(flashKey);

    this.scene.time.delayedCall(500, () => {
      if (this.paddle && this.paddle.active) {
        this.createPaddleTexture(this.currentWidth);
        this.paddle.setTexture('paddle');
      }
      if (this.scene.textures.exists(flashKey)) {
        try { this.scene.textures.remove(flashKey); } catch {}
      }
    });
  }

  getWidth(): number {
    return this.currentWidth;
  }

  reset(): void {
    this.targetWidth = 180;
    this.currentWidth = 180;
    this.isGlowing = false;
    this.squeezeAmount = 0;
    this.updatePaddleSize();
  }
}
