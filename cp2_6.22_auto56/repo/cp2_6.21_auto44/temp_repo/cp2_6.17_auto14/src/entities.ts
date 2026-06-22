import type { Player as IPlayer, Enemy as IEnemy, Hitbox } from './rendering';

export class Player implements IPlayer {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  width: number = 40;
  height: number = 60;
  health: number = 100;
  maxHealth: number = 100;
  facingRight: boolean = true;
  onGround: boolean = false;
  jumpCount: number = 0;
  jumpPressed: boolean = false;
  attackPressed: boolean = false;
  isAttacking: boolean = false;
  attackStage: number = 0;
  attackFrame: number = 0;
  attackCooldown: number = 0;
  comboTimer: number = 0;
  attackRecovery: number = 0;
  invincible: boolean = false;
  invincibleTimer: number = 0;
  invincibleFlash: boolean = false;
  knockbackX: number = 0;
  knockbackTimer: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, keys: Set<string>, canvasWidth: number, groundY: number, pillarWidth: number): void {
    this.vy += 1200 * dt;

    if (this.attackRecovery > 0) {
      this.attackRecovery -= dt;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.attackStage = 0;
      }
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.invincibleFlash = !this.invincibleFlash;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.invincibleFlash = false;
      }
    }

    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
      this.x += this.knockbackX * dt;
    }

    if (this.isAttacking) {
      this.attackFrame += dt * 60;
      if (this.attackFrame >= 10) {
        this.isAttacking = false;
        this.attackFrame = 0;
      }
    }

    if (this.attackRecovery <= 0 && this.knockbackTimer <= 0) {
      if (keys.has('a') || keys.has('A')) {
        this.vx = -200;
        this.facingRight = false;
      } else if (keys.has('d') || keys.has('D')) {
        this.vx = 200;
        this.facingRight = true;
      } else {
        this.vx = 0;
      }

      const wPressed = keys.has('w') || keys.has('W');
      if (wPressed && !this.jumpPressed && this.jumpCount < 2) {
        this.vy = -450;
        this.jumpCount++;
        this.onGround = false;
      }
      this.jumpPressed = wPressed;

      const jPressed = keys.has('j') || keys.has('J');
      if (jPressed && !this.attackPressed && this.attackCooldown <= 0) {
        if (this.comboTimer > 0 && this.attackStage > 0) {
          this.attackStage = (this.attackStage % 3) + 1;
        } else {
          this.attackStage = 1;
        }
        this.isAttacking = true;
        this.attackFrame = 0;
        this.attackCooldown = 0.6;
        this.comboTimer = 0.6;
        this.attackRecovery = 0.2;
      }
      this.attackPressed = jPressed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const leftBound = pillarWidth;
    const rightBound = canvasWidth - pillarWidth - this.width;
    if (this.x < leftBound) {
      this.x = leftBound;
    }
    if (this.x > rightBound) {
      this.x = rightBound;
    }

    if (this.y >= groundY - this.height) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.onGround = true;
      this.jumpCount = 0;
    }
  }

  getAttackHitbox(): Hitbox | null {
    if (!this.isAttacking || this.attackFrame < 3 || this.attackFrame > 7) {
      return null;
    }

    let width: number;
    let height: number;
    let offsetX: number;
    let offsetY: number;

    switch (this.attackStage) {
      case 1:
        width = 80;
        height = 30;
        offsetX = this.facingRight ? this.width : -width;
        offsetY = this.height / 2 - height / 2;
        break;
      case 2:
        width = 50;
        height = 60;
        offsetX = this.facingRight ? this.width - 10 : -width + 10;
        offsetY = -height + 10;
        break;
      case 3:
        width = 60;
        height = 80;
        offsetX = this.facingRight ? this.width - 10 : -width + 10;
        offsetY = this.height / 2;
        break;
      default:
        return null;
    }

    return {
      x: this.x + offsetX,
      y: this.y + offsetY,
      width,
      height
    };
  }

  getHitbox(): Hitbox {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  takeDamage(damage: number): void {
    if (this.invincible) return;
    this.health = Math.max(0, this.health - damage);
    this.invincible = true;
    this.invincibleTimer = 0.2;
    this.invincibleFlash = false;
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.facingRight = true;
    this.onGround = false;
    this.jumpCount = 0;
    this.jumpPressed = false;
    this.attackPressed = false;
    this.isAttacking = false;
    this.attackStage = 0;
    this.attackFrame = 0;
    this.attackCooldown = 0;
    this.comboTimer = 0;
    this.attackRecovery = 0;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleFlash = false;
    this.knockbackX = 0;
    this.knockbackTimer = 0;
  }

  getAttackDamage(): number {
    switch (this.attackStage) {
      case 1: return 10;
      case 2: return 15;
      case 3: return 20;
      default: return 0;
    }
  }

  getKnockbackDuration(): number {
    return this.attackStage === 3 ? 0.3 : 0;
  }
}

export class Enemy implements IEnemy {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  width: number;
  height: number;
  type: 'skeleton' | 'bat';
  health: number;
  maxHealth: number;
  facingRight: boolean = true;
  attackCooldown: number = 0;
  hitFlash: boolean = false;
  hitFlashTimer: number = 0;
  knockbackX: number = 0;
  knockbackTimer: number = 0;
  sinOffset: number = 0;
  attackDamage: number;
  attackInterval: number;
  moveSpeed: number;

  private attackTimer: number = 0;
  private isAttackingFlag: boolean = false;

  constructor(type: 'skeleton' | 'bat', x: number, y: number) {
    this.type = type;
    this.x = x;
    this.y = y;

    if (type === 'skeleton') {
      this.width = 40;
      this.height = 50;
      this.health = 50;
      this.maxHealth = 50;
      this.attackDamage = 8;
      this.attackInterval = 1.5;
      this.moveSpeed = 60;
    } else {
      this.width = 40;
      this.height = 30;
      this.health = 20;
      this.maxHealth = 20;
      this.attackDamage = 5;
      this.attackInterval = 2;
      this.moveSpeed = 120;
    }
  }

  update(dt: number, playerX: number, playerY: number, groundY: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) {
        this.hitFlash = false;
      }
    }

    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= dt;
      this.x += this.knockbackX * dt;
    }

    if (this.isAttackingFlag) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttackingFlag = false;
      }
    }

    const dx = playerX - this.x;
    this.facingRight = dx > 0;

    if (this.knockbackTimer <= 0) {
      if (this.type === 'skeleton') {
        const distance = Math.abs(dx);
        if (distance > 50) {
          this.vx = dx > 0 ? this.moveSpeed : -this.moveSpeed;
        } else {
          this.vx = 0;
          if (this.attackCooldown <= 0 && !this.isAttackingFlag) {
            this.isAttackingFlag = true;
            this.attackTimer = 0.5;
            this.attackCooldown = this.attackInterval;
          }
        }

        this.x += this.vx * dt;

        if (this.y < groundY - this.height) {
          this.vy += 1200 * dt;
          this.y += this.vy * dt;
        }
        if (this.y >= groundY - this.height) {
          this.y = groundY - this.height;
          this.vy = 0;
        }
      } else {
        this.sinOffset += dt * 3;

        const targetX = playerX + Math.sin(this.sinOffset) * 80;
        const targetY = playerY - 50 + Math.cos(this.sinOffset * 2) * 30;

        const dxBat = targetX - this.x;
        const dyBat = targetY - this.y;
        const dist = Math.sqrt(dxBat * dxBat + dyBat * dyBat);

        if (dist > 5) {
          this.vx = (dxBat / dist) * this.moveSpeed;
          this.vy = (dyBat / dist) * this.moveSpeed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        const playerDist = Math.sqrt(
          Math.pow(this.x + this.width / 2 - playerX - 20, 2) +
          Math.pow(this.y + this.height / 2 - playerY - 30, 2)
        );
        if (playerDist < 40 && this.attackCooldown <= 0 && !this.isAttackingFlag) {
          this.isAttackingFlag = true;
          this.attackTimer = 0.3;
          this.attackCooldown = this.attackInterval;
        }
      }
    }
  }

  getHitbox(): Hitbox {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  getAttackHitbox(): Hitbox | null {
    if (!this.isAttackingFlag) {
      return null;
    }

    if (this.type === 'skeleton') {
      const attackWidth = 40;
      const attackHeight = 30;
      const offsetX = this.facingRight ? this.width : -attackWidth;
      return {
        x: this.x + offsetX,
        y: this.y + this.height / 2 - attackHeight / 2,
        width: attackWidth,
        height: attackHeight
      };
    } else {
      return {
        x: this.x - 5,
        y: this.y - 5,
        width: this.width + 10,
        height: this.height + 10
      };
    }
  }

  takeDamage(damage: number, knockbackDir: number): boolean {
    this.health -= damage;
    this.hitFlash = true;
    this.hitFlashTimer = 0.1;
    if (this.type === 'skeleton') {
      this.knockbackX = knockbackDir * 200;
      this.knockbackTimer = 0.15;
    } else {
      this.knockbackX = knockbackDir * 100;
      this.knockbackTimer = 0.15;
    }
    return this.health <= 0;
  }

  isAttacking(): boolean {
    return this.isAttackingFlag;
  }

  getAttackDamage(): number {
    return this.attackDamage;
  }

  getHitKnockback(): number {
    return this.type === 'bat' ? 0.1 : 0.2;
  }
}
