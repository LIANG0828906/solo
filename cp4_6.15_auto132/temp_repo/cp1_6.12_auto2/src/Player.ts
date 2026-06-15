import Phaser from 'phaser';

export interface PlayerConfig {
  gridX: number;
  gridY: number;
  tileSize: number;
  health?: number;
  attackPower?: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export class Player {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Arc;
  private glow: Phaser.GameObjects.Arc;
  private attackFlash: Phaser.GameObjects.Arc;

  public gridX: number;
  public gridY: number;
  public tileSize: number;
  public health: number;
  public maxHealth: number;
  public attackPower: number;
  public isMoving: boolean = false;
  public isAttacking: boolean = false;

  private readonly MOVE_DURATION = 120;

  constructor(scene: Phaser.Scene, config: PlayerConfig) {
    this.scene = scene;
    this.gridX = config.gridX;
    this.gridY = config.gridY;
    this.tileSize = config.tileSize;
    this.maxHealth = config.health ?? 100;
    this.health = config.health ?? 100;
    this.attackPower = config.attackPower ?? 25;

    this.sprite = scene.add.container(0, 0);
    this.sprite.setDepth(50);

    this.glow = scene.add.circle(0, 0, this.tileSize * 0.55, 0xffd700, 0.2);
    this.glow.setStrokeStyle(2, 0xffd700, 0.6);

    this.body = scene.add.circle(0, 0, this.tileSize * 0.38, 0xffd700, 0.9);
    this.body.setStrokeStyle(3, 0xffb347, 1);

    this.attackFlash = scene.add.circle(0, 0, this.tileSize * 0.5, 0xffffff, 0);

    this.sprite.add([this.glow, this.body, this.attackFlash]);

    this.updatePosition();
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

  move(direction: Direction, canMoveTo: (x: number, y: number) => boolean): boolean {
    if (this.isMoving) return false;

    let newX = this.gridX;
    let newY = this.gridY;

    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }

    if (!canMoveTo(newX, newY)) {
      this.playMissEffect();
      return false;
    }

    this.isMoving = true;
    this.gridX = newX;
    this.gridY = newY;

    this.scene.tweens.add({
      targets: this.glow,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.2, to: 0.5 },
      duration: 80,
      yoyo: true,
      ease: Phaser.Math.Easing.Sine.InOut
    });

    this.updatePosition(true).then(() => {
      this.isMoving = false;
    });

    return true;
  }

  attack(beatHit: boolean): number {
    if (this.isAttacking) return 0;

    this.isAttacking = true;

    const damage = beatHit ? this.attackPower : Math.floor(this.attackPower * 0.2);

    this.scene.tweens.add({
      targets: this.attackFlash,
      alpha: { from: 0.8, to: 0 },
      scale: { from: 1, to: 2 },
      duration: 250,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        this.isAttacking = false;
      }
    });

    this.scene.tweens.add({
      targets: this.body,
      scale: { from: 1, to: 1.2 },
      duration: 80,
      yoyo: true,
      ease: Phaser.Math.Easing.Back.Out
    });

    if (!beatHit) {
      this.playMissEffect();
    }

    return damage;
  }

  takeDamage(damage: number): boolean {
    this.health = Math.max(0, this.health - damage);

    this.scene.tweens.add({
      targets: this.body,
      fillColor: { from: 0xffd700, to: 0xff4444 },
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.body.setFillStyle(0xffd700, 0.9);
      }
    });

    this.scene.cameras.main.shake(150, 0.01);

    return this.health <= 0;
  }

  onBeatHit(): void {
    this.scene.tweens.add({
      targets: this.glow,
      scale: { from: 1, to: 1.5 },
      alpha: { from: 0.2, to: 0.7 },
      duration: 100,
      yoyo: true,
      ease: Phaser.Math.Easing.Sine.InOut
    });
  }

  onBeatMiss(): void {
    this.playMissEffect();
  }

  private playMissEffect(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x - 5,
      duration: 50,
      yoyo: true,
      repeat: 2,
      ease: Phaser.Math.Easing.Linear
    });
  }

  fadeIn(duration: number = 500): void {
    this.sprite.setAlpha(0);
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 1,
      duration,
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
