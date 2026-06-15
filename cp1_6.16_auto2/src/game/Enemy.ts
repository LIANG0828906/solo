import { Scene } from 'phaser';
import { EnemyTemplate } from '../configs/enemyTemplates';

export interface EnemyRuntimeData extends EnemyTemplate {
  instanceId: string;
}

export interface OnHitCallback {
  (damage: number, fromEnemy: Enemy): void;
}

export class Enemy extends Phaser.GameObjects.Container {
  private enemyData: EnemyRuntimeData;
  private currentHealth: number;
  private maxHealth: number;
  private isAlive: boolean = true;
  private lastAttackTime: number = 0;
  private graphics: Phaser.GameObjects.Graphics | null = null;
  private healthBar: Phaser.GameObjects.Graphics;
  private bodyVisual: Phaser.GameObjects.Arc;
  private eyeVisual: Phaser.GameObjects.Arc;
  private isHitFlashing: boolean = false;
  private hitFlashTimer: Phaser.Time.TimerEvent | null = null;
  private onDeathCallback: (() => void) | null = null;
  private onHitPlayerCallback: OnHitCallback | null = null;
  private bullets: Phaser.Physics.Arcade.Group | null = null;
  private targetAngle: number = 0;
  private currentAngle: number = 0;
  private explosionTriggered: boolean = false;
  private physicsBody: Phaser.Physics.Arcade.Body | null = null;

  constructor(scene: Scene, x: number, y: number, data: EnemyRuntimeData) {
    super(scene, x, y);
    this.enemyData = data;
    this.currentHealth = data.health;
    this.maxHealth = data.health;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.physicsBody = this.body as Phaser.Physics.Arcade.Body;
    if (this.physicsBody) {
      this.physicsBody.setCollideWorldBounds(true);
      this.physicsBody.setCircle(data.size);
      this.physicsBody.setBounce(0.2, 0.2);
    }

    this.setSize(data.size * 2, data.size * 2);

    this.createVisuals();
    this.bullets = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: 10,
      runChildUpdate: true
    });
  }

  private createVisuals(): void {
    const size = this.enemyData.size;

    this.bodyVisual = this.scene.add.circle(0, 0, size, this.enemyData.color, 1);
    this.bodyVisual.setStrokeStyle(2, this.darkenColor(this.enemyData.color, 0.6));
    this.add(this.bodyVisual);

    this.eyeVisual = this.scene.add.circle(size * 0.3, -size * 0.2, size * 0.15, 0xffffff, 1);
    this.eyeVisual.name = 'eye';
    this.add(this.eyeVisual);

    if (this.enemyData.type === 'melee') {
      const ear1 = this.scene.add.circle(-size * 0.5, -size * 0.7, size * 0.2, this.darkenColor(this.enemyData.color, 0.5), 1);
      const ear2 = this.scene.add.circle(size * 0.5, -size * 0.7, size * 0.2, this.darkenColor(this.enemyData.color, 0.5), 1);
      this.add([ear1, ear2]);
    } else if (this.enemyData.type === 'ranged') {
      const hood = this.scene.add.triangle(0, -size * 0.6, -size * 0.8, -size * 0.3, 0, -size * 1.2, size * 0.8, -size * 0.3, this.darkenColor(this.enemyData.color, 0.7), 1);
      this.add(hood);
    } else if (this.enemyData.type === 'explosive') {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const spike = this.scene.add.triangle(
          Math.cos(angle) * size,
          Math.sin(angle) * size,
          Math.cos(angle - 0.2) * size,
          Math.sin(angle - 0.2) * size,
          Math.cos(angle) * size * 1.5,
          Math.sin(angle) * size * 1.5,
          this.darkenColor(this.enemyData.color, 0.7),
          1
        );
        this.add(spike);
      }

      const warning = this.scene.add.text(0, 0, '!', {
        fontSize: `${size}px`,
        color: '#ffff00',
        fontFamily: 'Arial Black',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.add(warning);
    }

    this.healthBar = this.scene.add.graphics();
    this.healthBar.y = -size - 10;
    this.add(this.healthBar);
    this.updateHealthBar();

    this.graphics = this.scene.add.graphics();
    this.add(this.graphics);
  }

  private darkenColor(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }

  private updateHealthBar(): void {
    const barWidth = this.enemyData.size * 2;
    const barHeight = 4;
    const ratio = Math.max(0, this.currentHealth / this.maxHealth);

    this.healthBar.clear();
    this.healthBar.fillStyle(0x000000, 0.6);
    this.healthBar.fillRoundedRect(-barWidth / 2, -barHeight, barWidth, barHeight, 2);

    const healthColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 100 },
      100,
      Math.floor(ratio * 100)
    );
    const colorInt = (healthColor.r << 16) | (healthColor.g << 8) | healthColor.b;

    this.healthBar.fillStyle(colorInt, 1);
    this.healthBar.fillRoundedRect(-barWidth / 2, -barHeight, barWidth * ratio, barHeight, 2);
  }

  update(time: number, delta: number, playerX: number, playerY: number): void {
    if (!this.isAlive) return;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.hypot(dx, dy);

    this.targetAngle = Math.atan2(dy, dx);
    this.currentAngle = Phaser.Math.Angle.RotateTo(this.currentAngle, this.targetAngle, 0.1);
    this.rotation = this.currentAngle + Math.PI / 2;

    switch (this.enemyData.type) {
      case 'melee':
        this.updateMelee(dx, dy, distance);
        break;
      case 'ranged':
        this.updateRanged(dx, dy, distance, time);
        break;
      case 'explosive':
        this.updateExplosive(dx, dy, distance, time);
        break;
    }

    if (this.physicsBody) {
      this.physicsBody.velocity.x = Phaser.Math.Clamp(this.physicsBody.velocity.x, -this.enemyData.speed, this.enemyData.speed);
      this.physicsBody.velocity.y = Phaser.Math.Clamp(this.physicsBody.velocity.y, -this.enemyData.speed, this.enemyData.speed);
    }
  }

  private updateMelee(dx: number, dy: number, distance: number): void {
    const speed = this.enemyData.speed;
    if (distance > this.enemyData.attackRange) {
      const nx = dx / distance;
      const ny = dy / distance;
      if (this.physicsBody) {
        this.physicsBody.velocity.x = nx * speed;
        this.physicsBody.velocity.y = ny * speed;
      }
    } else {
      if (this.physicsBody) {
        this.physicsBody.velocity.x *= 0.5;
        this.physicsBody.velocity.y *= 0.5;
      }
      const now = Date.now();
      if (now - this.lastAttackTime >= this.enemyData.attackCooldown) {
        this.attackPlayer();
        this.lastAttackTime = now;
      }
    }
  }

  private updateRanged(dx: number, dy: number, distance: number, time: number): void {
    const speed = this.enemyData.speed;
    const idealMin = this.enemyData.attackRange * 0.6;
    const idealMax = this.enemyData.attackRange * 0.9;

    if (distance < idealMin) {
      const nx = -dx / distance;
      const ny = -dy / distance;
      if (this.physicsBody) {
        this.physicsBody.velocity.x = nx * speed;
        this.physicsBody.velocity.y = ny * speed;
      }
    } else if (distance > idealMax) {
      const nx = dx / distance;
      const ny = dy / distance;
      if (this.physicsBody) {
        this.physicsBody.velocity.x = nx * speed;
        this.physicsBody.velocity.y = ny * speed;
      }
    } else {
      const perpX = -dy / distance;
      const perpY = dx / distance;
      const direction = (Math.floor(time / 2000) % 2 === 0) ? 1 : -1;
      if (this.physicsBody) {
        this.physicsBody.velocity.x = perpX * speed * 0.5 * direction;
        this.physicsBody.velocity.y = perpY * speed * 0.5 * direction;
      }
    }

    if (distance <= this.enemyData.attackRange) {
      const now = Date.now();
      if (now - this.lastAttackTime >= this.enemyData.attackCooldown) {
        this.fireBullet(dx, dy, distance);
        this.lastAttackTime = now;
      }
    }
  }

  private updateExplosive(dx: number, dy: number, distance: number, time: number): void {
    const speed = this.enemyData.speed;
    if (distance > this.enemyData.attackRange * 0.8) {
      const nx = dx / distance;
      const ny = dy / distance;
      if (this.physicsBody) {
        this.physicsBody.velocity.x = nx * speed;
        this.physicsBody.velocity.y = ny * speed;
      }
    } else {
      this.explode();
    }
  }

  private attackPlayer(): void {
    if (this.onHitPlayerCallback) {
      this.onHitPlayerCallback(this.enemyData.attack, this);
    }
  }

  private fireBullet(dx: number, dy: number, distance: number): void {
    if (!this.bullets) return;

    const bullet = this.bullets.get(this.x, this.y, 'enemy_bullet');
    if (!bullet) return;

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.body.reset(this.x, this.y);

    const nx = dx / distance;
    const ny = dy / distance;
    const bulletSpeed = this.enemyData.bulletSpeed || 200;
    const bulletBody = bullet.body as Phaser.Physics.Arcade.Body;
    bulletBody.velocity.x = nx * bulletSpeed;
    bulletBody.velocity.y = ny * bulletSpeed;

    this.scene.time.delayedCall(3000, () => {
      bullet.setActive(false);
      bullet.setVisible(false);
    });
  }

  private explode(): void {
    if (this.explosionTriggered) return;
    this.explosionTriggered = true;

    if (this.onHitPlayerCallback) {
      this.onHitPlayerCallback(this.enemyData.attack, this);
    }

    this.createExplosionEffect();
    this.takeDamage(this.currentHealth);
  }

  takeDamage(amount: number): boolean {
    if (!this.isAlive) return false;

    this.currentHealth -= amount;
    this.updateHealthBar();
    this.triggerHitFlash();

    if (this.currentHealth <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private triggerHitFlash(): void {
    if (this.isHitFlashing) {
      if (this.hitFlashTimer) this.hitFlashTimer.destroy();
    }

    this.isHitFlashing = true;
    this.bodyVisual.setFillStyle(0xff0000, 1);

    this.hitFlashTimer = this.scene.time.delayedCall(200, () => {
      this.bodyVisual.setFillStyle(this.enemyData.color, 1);
      this.isHitFlashing = false;
    });
  }

  private die(): void {
    if (!this.isAlive) return;
    this.isAlive = false;

    this.createDeathParticles();

    this.scene.time.delayedCall(100, () => {
      if (this.onDeathCallback) {
        this.onDeathCallback();
      }
      this.destroy();
    });
  }

  private createDeathParticles(): void {
    const particleNames = ['particle_orange', 'particle_yellow', 'particle_white', 'particle_red'];
    const colors = [0xff6b35, 0xffd93d, 0xffffff, 0xff0000];

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 100 + Math.random() * 150;
      const idx = Math.floor(Math.random() * colors.length);

      const particle = this.scene.add.circle(
        this.x,
        this.y,
        3 + Math.random() * 3,
        colors[idx],
        1
      );

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * (40 + Math.random() * 60),
        y: this.y + Math.sin(angle) * (40 + Math.random() * 60),
        alpha: 0,
        scale: 0.5,
        duration: 500 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  private createExplosionEffect(): void {
    const radius = this.enemyData.explosionRadius || 80;

    const ring = this.scene.add.circle(this.x, this.y, 5, 0xff6b35, 0.8);
    this.scene.tweens.add({
      targets: ring,
      scale: radius / 5,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        ring.destroy();
      }
    });

    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * Math.PI * 2;
      const particle = this.scene.add.circle(
        this.x,
        this.y,
        4 + Math.random() * 4,
        i % 2 === 0 ? 0xff6b35 : 0xffd93d,
        1
      );

      this.scene.tweens.add({
        targets: particle,
        x: this.x + Math.cos(angle) * radius,
        y: this.y + Math.sin(angle) * radius,
        alpha: 0,
        duration: 450,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        }
      });
    }
  }

  setOnDeathCallback(callback: () => void): void {
    this.onDeathCallback = callback;
  }

  setOnHitPlayerCallback(callback: OnHitCallback): void {
    this.onHitPlayerCallback = callback;
  }

  isActive(): boolean {
    return this.isAlive && this.active;
  }

  getType(): string {
    return this.enemyData.type;
  }

  getAttackRange(): number {
    return this.enemyData.attackRange;
  }

  getExplosionRadius(): number {
    return this.enemyData.explosionRadius || 0;
  }

  getAttack(): number {
    return this.enemyData.attack;
  }

  getBullets(): Phaser.Physics.Arcade.Group | null {
    return this.bullets;
  }

  destroy(): void {
    if (this.bullets) {
      this.bullets.clear(true, true);
    }
    if (this.hitFlashTimer) {
      this.hitFlashTimer.destroy();
    }
    super.destroy();
  }
}
