import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public shield: number = 0;
  public isInvincible: boolean = false;
  public isJumping: boolean = false;
  public jumpVelocity: number = -600;
  public moveSpeed: number = 400;

  private lanes: number[];
  private currentLane: number = 1;
  private targetLane: number = 1;
  private laneTween: Phaser.Tweens.Tween | null = null;

  private keys: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    jump: Phaser.Input.Keyboard.Key;
    starBurst: Phaser.Input.Keyboard.Key;
    arrowLeft: Phaser.Input.Keyboard.Key;
    arrowRight: Phaser.Input.Keyboard.Key;
    arrowUp: Phaser.Input.Keyboard.Key;
  };

  private engineParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private shieldGlow!: Phaser.GameObjects.Graphics;
  private shieldPulseTween: Phaser.Tweens.Tween | null = null;

  private gravity: number = 1800;
  private groundY: number;
  private verticalVelocity: number = 0;

  private hitFlashTween: Phaser.Tweens.Tween | null = null;

  private smoothX: number;
  private smoothY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);

    this.groundY = y;
    this.smoothX = x;
    this.smoothY = y;

    const laneWidth = 180;
    this.lanes = [
      x - laneWidth,
      x,
      x + laneWidth
    ];

    this.setCollideWorldBounds(true);
    this.setSize(this.width * 0.65, this.height * 0.75);
    this.setOffset(this.width * 0.175, this.height * 0.125);

    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      this.keys = {
        left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        jump: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        starBurst: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        arrowLeft: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        arrowRight: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        arrowUp: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)
      };
    } else {
      throw new Error('Keyboard input is not available');
    }

    this.createEngineParticles();
    this.createShieldGlow();
  }

  private createEngineParticles(): void {
    const particleManager = this.scene.add.particles(0, 0, this.texture);

    this.engineParticles = particleManager.createEmitter() as unknown as Phaser.GameObjects.Particles.ParticleEmitter;
    this.engineParticles.setConfig({
      lifespan: 350,
      speedY: { min: 60, max: 180 },
      speedX: { min: -25, max: 25 },
      angle: { min: 85, max: 95 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0xff8800,
      blendMode: 'ADD',
      follow: this,
      followOffset: { x: 0, y: this.height * 0.45 },
      quantity: 2,
      frequency: 50
    });

    this.engineParticles.start();
  }

  private createShieldGlow(): void {
    this.shieldGlow = this.scene.add.graphics();
    this.shieldGlow.setVisible(false);
    this.shieldGlow.setDepth(this.depth - 1);
  }

  private updateShieldGlow(): void {
    if (this.shield >= 100) {
      this.shieldGlow.setVisible(true);
      this.shieldGlow.clear();

      const radius = Math.max(this.width, this.height) * 0.75;
      this.shieldGlow.fillGradientStyle(
        0x00d4ff, 0x00d4ff, 0x0088ff, 0x0088ff,
        0.5, 0.3, 0.3, 0.5
      );
      this.shieldGlow.beginPath();
      this.shieldGlow.arc(0, 0, radius, 0, Math.PI * 2);
      this.shieldGlow.fillPath();

      if (!this.shieldPulseTween) {
        this.shieldPulseTween = this.scene.tweens.add({
          targets: this.shieldGlow,
          alpha: { from: 0.3, to: 0.7 },
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      this.shieldGlow.setVisible(false);
      if (this.shieldPulseTween) {
        this.shieldPulseTween.stop();
        this.shieldPulseTween = null;
      }
    }
  }

  private moveToLane(laneIndex: number): void {
    if (this.laneTween && this.laneTween.isPlaying()) {
      return;
    }

    const clampedLane = Phaser.Math.Clamp(laneIndex, 0, 2) as 0 | 1 | 2;
    if (clampedLane === this.currentLane) {
      return;
    }

    this.targetLane = clampedLane;
    const targetX = this.lanes[this.targetLane];

    this.laneTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.currentLane = this.targetLane;
        this.laneTween = null;
      }
    });
  }

  private jump(): void {
    if (this.isJumping) {
      return;
    }

    this.isJumping = true;
    this.verticalVelocity = this.jumpVelocity;
  }

  public takeDamage(amount: number = 20): void {
    if (this.isInvincible) {
      return;
    }

    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, amount);
      this.shield -= shieldDamage;
      amount -= shieldDamage;
    }

    if (amount > 0) {
      console.log(`Player took ${amount} damage!`);
    }

    this.updateShieldGlow();

    this.isInvincible = true;

    if (this.hitFlashTween) {
      this.hitFlashTween.stop();
    }

    this.hitFlashTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      repeat: 6,
      ease: 'Linear',
      onComplete: () => {
        this.alpha = 1;
        this.isInvincible = false;
        this.hitFlashTween = null;
      }
    });
  }

  public addShield(amount: number): void {
    this.shield = Phaser.Math.Clamp(this.shield + amount, 0, 100);
    this.updateShieldGlow();
  }

  public activateStarBurst(): void {
    this.scene.cameras.main.flash(500, 255, 255, 255);
    this.scene.cameras.main.shake(200, 0.02);

    this.isInvincible = true;
    this.scene.time.delayedCall(1500, () => {
      this.isInvincible = false;
    });

    console.log('StarBurst activated!');
  }

  public update(_time: number, delta: number): void {
    const dt = delta / 1000;

    if (Phaser.Input.Keyboard.JustDown(this.keys.left) || Phaser.Input.Keyboard.JustDown(this.keys.arrowLeft)) {
      this.moveToLane(this.currentLane - 1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.right) || Phaser.Input.Keyboard.JustDown(this.keys.arrowRight)) {
      this.moveToLane(this.currentLane + 1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.jump) || Phaser.Input.Keyboard.JustDown(this.keys.arrowUp)) {
      this.jump();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.starBurst)) {
      this.activateStarBurst();
    }

    if (this.isJumping) {
      this.verticalVelocity += this.gravity * dt;
      this.y += this.verticalVelocity * dt;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.isJumping = false;
        this.verticalVelocity = 0;
      }
    }

    const lerpFactor = 0.2;
    this.smoothX = Phaser.Math.Linear(this.smoothX, this.x, lerpFactor);
    this.smoothY = Phaser.Math.Linear(this.smoothY, this.y, lerpFactor);

    if (this.shieldGlow.visible) {
      this.shieldGlow.setPosition(this.x, this.y);
    }

    if (this.engineParticles) {
      const intensity = this.isJumping ? 1.5 : 1;
      this.engineParticles.quantity = 2 * intensity;
      this.engineParticles.speedY = { min: 60 * intensity, max: 180 * intensity };
    }
  }
}
