import Phaser from 'phaser';

export interface EnemyConfig {
  gridX: number;
  gridY: number;
  tileSize: number;
  health?: number;
  damage?: number;
  type?: 'slime' | 'skeleton' | 'ghost';
}

export class Enemy {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Arc;
  private glow: Phaser.GameObjects.Arc;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBar: Phaser.GameObjects.Rectangle;

  public gridX: number;
  public gridY: number;
  public tileSize: number;
  public health: number;
  public maxHealth: number;
  public damage: number;
  public type: string;
  public isDead: boolean = false;
  public isMoving: boolean = false;

  private readonly MOVE_DURATION = 150;

  constructor(scene: Phaser.Scene, config: EnemyConfig) {
    this.scene = scene;
    this.gridX = config.gridX;
    this.gridY = config.gridY;
    this.tileSize = config.tileSize;
    this.maxHealth = config.health ?? 50;
    this.health = config.health ?? 50;
    this.damage = config.damage ?? 10;
    this.type = config.type ?? 'slime';

    this.sprite = scene.add.container(0, 0);
    this.sprite.setDepth(40);

    const colors = this.getTypeColors();

    this.glow = scene.add.circle(0, 0, this.tileSize * 0.5, colors.glow, 0.15);
    this.glow.setStrokeStyle(2, colors.glow, 0.4);

    this.body = scene.add.circle(0, 0, this.tileSize * 0.35, colors.body, 0.9);
    this.body.setStrokeStyle(3, colors.stroke, 1);

    const eyeOffset = this.tileSize * 0.08;
    const eyeSize = this.tileSize * 0.07;
    const leftEye = scene.add.circle(-eyeOffset, -this.tileSize * 0.05, eyeSize, 0xffffff, 1);
    const rightEye = scene.add.circle(eyeOffset, -this.tileSize * 0.05, eyeSize, 0xffffff, 1);
    const leftPupil = scene.add.circle(-eyeOffset, -this.tileSize * 0.05, eyeSize * 0.5, 0x000000, 1);
    const rightPupil = scene.add.circle(eyeOffset, -this.tileSize * 0.05, eyeSize * 0.5, 0x000000, 1);

    const barWidth = this.tileSize * 0.6;
    const barHeight = 4;
    const barY = -this.tileSize * 0.45;

    this.healthBarBg = scene.add.rectangle(0, barY, barWidth, barHeight, 0x330000, 0.8);
    this.healthBar = scene.add.rectangle(-barWidth / 2, barY, barWidth, barHeight, 0xff4444, 1);
    this.healthBar.setOrigin(0, 0.5);

    this.sprite.add([this.glow, this.body, leftEye, rightEye, leftPupil, rightPupil, this.healthBarBg, this.healthBar]);

    this.updatePosition();
    this.breathe();
  }

  private getTypeColors(): { body: number; glow: number; stroke: number } {
    switch (this.type) {
      case 'skeleton':
        return { body: 0xe8e8e8, glow: 0x8888ff, stroke: 0xaaaaaa };
      case 'ghost':
        return { body: 0xaa88ff, glow: 0x6633aa, stroke: 0xcc99ff };
      case 'slime':
      default:
        return { body: 0x883366, glow: 0x442255, stroke: 0xaa4488 };
    }
  }

  private breathe(): void {
    this.scene.tweens.add({
      targets: this.body,
      scale: { from: 1, to: 1.05 },
      duration: 1000 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut
    });
  }

  private updatePosition(animate: boolean = false, duration: number = this.MOVE_DURATION): Promise<void> {
    const x = this.gridX * this.tileSize + this.tileSize / 2;
    const y = this.gridY * this.tileSize + this.tileSize / 2;

    return new Promise((resolve) => {
      if (animate) {
        this.scene.tweens.add({
          targets: this.sprite,
          x,
          y,
          duration,
          ease: Phaser.Math.Easing.Quadratic.Out,
          onComplete: () => resolve()
        });
      } else {
        this.sprite.setPosition(x, y);
        resolve();
      }
    });
  }

  getWorldX(): number {
    return this.sprite.x;
  }

  getWorldY(): number {
    return this.sprite.y;
  }

  moveTowardsPlayer(
    playerGridX: number,
    playerGridY: number,
    canMoveTo: (x: number, y: number, enemy: Enemy) => boolean
  ): void {
    if (this.isDead || this.isMoving) return;

    const dx = playerGridX - this.gridX;
    const dy = playerGridY - this.gridY;

    if (Math.abs(dx) + Math.abs(dy) <= 1) {
      return;
    }

    let newX = this.gridX;
    let newY = this.gridY;

    if (Math.abs(dx) > Math.abs(dy)) {
      newX += Math.sign(dx);
      if (!canMoveTo(newX, newY, this)) {
        newX = this.gridX;
        newY += Math.sign(dy);
      }
    } else {
      newY += Math.sign(dy);
      if (!canMoveTo(newX, newY, this)) {
        newY = this.gridY;
        newX += Math.sign(dx);
      }
    }

    if (newX !== this.gridX || newY !== this.gridY) {
      if (canMoveTo(newX, newY, this)) {
        this.isMoving = true;
        this.gridX = newX;
        this.gridY = newY;
        this.updatePosition(true).then(() => {
          this.isMoving = false;
        });
      }
    }
  }

  isAdjacentToPlayer(playerGridX: number, playerGridY: number): boolean {
    const dx = Math.abs(this.gridX - playerGridX);
    const dy = Math.abs(this.gridY - playerGridY);
    return dx + dy === 1;
  }

  takeDamage(amount: number): boolean {
    if (this.isDead) return true;

    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();

    this.scene.tweens.add({
      targets: this.body,
      scale: { from: 1, to: 0.85 },
      duration: 80,
      yoyo: true,
      ease: Phaser.Math.Easing.Back.Out
    });

    this.scene.tweens.add({
      targets: this.body,
      fillColor: { from: 0xffffff, to: this.getTypeColors().body },
      duration: 80,
      yoyo: true,
      repeat: 1
    });

    if (this.health <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  private updateHealthBar(): void {
    const barWidth = this.tileSize * 0.6;
    const healthPercent = this.health / this.maxHealth;
    this.healthBar.width = barWidth * healthPercent;

    if (healthPercent > 0.5) {
      this.healthBar.setFillStyle(0x44ff44, 1);
    } else if (healthPercent > 0.25) {
      this.healthBar.setFillStyle(0xffff44, 1);
    } else {
      this.healthBar.setFillStyle(0xff4444, 1);
    }
  }

  private die(): void {
    this.isDead = true;

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 1.5,
      duration: 300,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        this.onDeath();
      }
    });
  }

  onDeath(): void {
    this.destroy();
  }

  fadeIn(duration: number = 500, delay: number = 0): void {
    this.sprite.setAlpha(0);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      duration,
      delay,
      ease: Phaser.Math.Easing.Quadratic.Out
    });
  }

  setVisible(visible: boolean): void {
    this.sprite.setVisible(visible);
  }

  setDepth(depth: number): void {
    this.sprite.setDepth(depth);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
