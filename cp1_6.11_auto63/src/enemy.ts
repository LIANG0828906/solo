export const ENEMY_CONFIG = {
  PATROL_SPEED: 60,
  CHASE_SPEED: 120,
  DETECTION_RANGE: 150,
  COUNT_MIN: 3,
  COUNT_MAX: 5,
  RADIUS: 15,
  KNOCKBACK_DURATION: 500,
  KNOCKBACK_MULTIPLIER: 2,
  PATROL_DIRECTION_CHANGE_INTERVAL: 3000,
} as const;

type EnemyState = 'patrol' | 'chase';

export class Enemy {
  x: number;
  y: number;
  state: EnemyState;
  velocityX: number;
  velocityY: number;
  isKnockback: boolean;
  knockbackTimer: number;
  knockbackVelocityX: number;
  knockbackVelocityY: number;
  private radius: number;
  private patrolDirectionTimer: number;
  private patrolDirectionX: number;
  private patrolDirectionY: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.state = 'patrol';
    this.velocityX = 0;
    this.velocityY = 0;
    this.isKnockback = false;
    this.knockbackTimer = 0;
    this.knockbackVelocityX = 0;
    this.knockbackVelocityY = 0;
    this.radius = ENEMY_CONFIG.RADIUS;
    this.patrolDirectionTimer = 0;
    this.patrolDirectionX = 0;
    this.patrolDirectionY = 0;
    this.setRandomPatrolDirection();
  }

  private setRandomPatrolDirection(): void {
    const angle = Math.random() * Math.PI * 2;
    this.patrolDirectionX = Math.cos(angle);
    this.patrolDirectionY = Math.sin(angle);
    this.patrolDirectionTimer = ENEMY_CONFIG.PATROL_DIRECTION_CHANGE_INTERVAL;
  }

  update(playerX: number, playerY: number, dt: number, canvasWidth: number, canvasHeight: number): void {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= ENEMY_CONFIG.DETECTION_RANGE) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }

    if (this.isKnockback) {
      this.knockbackTimer -= dt * 1000;
      if (this.knockbackTimer <= 0) {
        this.isKnockback = false;
        this.knockbackTimer = 0;
      } else {
        this.x += this.knockbackVelocityX * dt;
        this.y += this.knockbackVelocityY * dt;
        this.enforceBounds(canvasWidth, canvasHeight);
        return;
      }
    }

    if (this.state === 'chase') {
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        this.velocityX = (dx / length) * ENEMY_CONFIG.CHASE_SPEED;
        this.velocityY = (dy / length) * ENEMY_CONFIG.CHASE_SPEED;
      }
    } else {
      this.patrolDirectionTimer -= dt * 1000;
      if (this.patrolDirectionTimer <= 0) {
        this.setRandomPatrolDirection();
      }
      this.velocityX = this.patrolDirectionX * ENEMY_CONFIG.PATROL_SPEED;
      this.velocityY = this.patrolDirectionY * ENEMY_CONFIG.PATROL_SPEED;
    }

    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    this.enforceBounds(canvasWidth, canvasHeight);
  }

  private enforceBounds(canvasWidth: number, canvasHeight: number): void {
    if (this.x <= this.radius || this.x >= canvasWidth - this.radius) {
      this.velocityX *= -1;
      this.patrolDirectionX *= -1;
      this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
    }
    if (this.y <= this.radius || this.y >= canvasHeight - this.radius) {
      this.velocityY *= -1;
      this.patrolDirectionY *= -1;
      this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    const sides = 8;
    const radius = this.radius;

    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();

    ctx.fillStyle = '#ff3333';
    ctx.fill();

    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    const eyeRadius = radius * 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#22cc22';
    ctx.fill();
    ctx.strokeStyle = '#66ff66';
    ctx.lineWidth = 1;
    ctx.stroke();

    const pupilRadius = eyeRadius * 0.4;
    ctx.beginPath();
    ctx.arc(0, 0, pupilRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    ctx.restore();
  }

  bounceFrom(otherX: number, otherY: number): void {
    const dx = this.x - otherX;
    const dy = this.y - otherY;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      const nx = dx / length;
      const ny = dy / length;
      const bounceSpeed = ENEMY_CONFIG.PATROL_SPEED * ENEMY_CONFIG.KNOCKBACK_MULTIPLIER;
      this.velocityX = nx * bounceSpeed;
      this.velocityY = ny * bounceSpeed;
    }
  }

  applyKnockback(fromX: number, fromY: number): void {
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      const nx = dx / length;
      const ny = dy / length;
      const knockbackSpeed = ENEMY_CONFIG.CHASE_SPEED * ENEMY_CONFIG.KNOCKBACK_MULTIPLIER;
      this.knockbackVelocityX = nx * knockbackSpeed;
      this.knockbackVelocityY = ny * knockbackSpeed;
      this.isKnockback = true;
      this.knockbackTimer = ENEMY_CONFIG.KNOCKBACK_DURATION;
    }
  }

  getRadius(): number {
    return this.radius;
  }
}

export class EnemyManager {
  enemies: Enemy[];

  constructor() {
    this.enemies = [];
  }

  spawnEnemies(count: number, canvasWidth: number, canvasHeight: number, playerX: number, playerY: number): void {
    this.enemies = [];
    const minDistanceFromPlayer = 200;

    for (let i = 0; i < count; i++) {
      let x: number, y: number;
      let attempts = 0;
      do {
        x = Math.random() * (canvasWidth - 100) + 50;
        y = Math.random() * (canvasHeight - 100) + 50;
        attempts++;
      } while (
        Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2) < minDistanceFromPlayer &&
        attempts < 50
      );

      this.enemies.push(new Enemy(x, y));
    }
  }

  update(playerX: number, playerY: number, dt: number, canvasWidth: number, canvasHeight: number): void {
    for (const enemy of this.enemies) {
      enemy.update(playerX, playerY, dt, canvasWidth, canvasHeight);
    }

    this.checkEnemyCollisions();
  }

  private checkEnemyCollisions(): void {
    for (let i = 0; i < this.enemies.length; i++) {
      for (let j = i + 1; j < this.enemies.length; j++) {
        const e1 = this.enemies[i];
        const e2 = this.enemies[j];

        const dx = e2.x - e1.x;
        const dy = e2.y - e1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = e1.getRadius() + e2.getRadius();

        if (distance < minDistance && distance > 0) {
          const overlap = (minDistance - distance) / 2;
          const nx = dx / distance;
          const ny = dy / distance;

          e1.x -= nx * overlap;
          e1.y -= ny * overlap;
          e2.x += nx * overlap;
          e2.y += ny * overlap;

          e1.bounceFrom(e2.x, e2.y);
          e2.bounceFrom(e1.x, e1.y);
        }
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }
  }

  reset(): void {
    this.enemies = [];
  }
}
