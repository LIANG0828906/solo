import { Rect, aabbIntersect, Obstacle } from './obstacle';

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}

export class Player implements Rect {
  public x: number;
  public y: number;
  public w: number = 20;
  public h: number = 30;
  public vx: number = 0;
  public vy: number = 0;
  public onGround: boolean = false;
  public canDoubleJump: boolean = false;
  public id: 'A' | 'B';
  public color: string;
  public colorDark: string;
  public colorLight: string;

  private gravity: number = 0.5;
  private baseSpeed: number = 3;
  private jumpVel: number = -10;
  private maxJumpCharge: number = 0.3;
  private jumpChargeTime: number = 0;
  private isChargingJump: boolean = false;
  private jumpReleaseBonus: number = 0;

  public speedMultiplier: number = 1;
  public boostTimer: number = 0;

  public lastCheckpoint: { x: number; y: number } = { x: 0, y: 0 };
  public checkpointIndex: number = -1;

  public isDead: boolean = false;
  public deathTimer: number = 0;
  public respawnTimer: number = 0;
  public fadeInTimer: number = 0;

  public hasFinished: boolean = false;
  public finishTime: number = 0;

  private coyoteTime: number = 0;
  private jumpBuffer: number = 0;

  private facing: 1 | -1 = 1;
  private animTime: number = 0;

  public activeCheckpointsHit: Set<number> = new Set();

  constructor(id: 'A' | 'B', startX: number, startY: number) {
    this.id = id;
    this.x = startX;
    this.y = startY;
    this.lastCheckpoint = { x: startX, y: startY };

    if (id === 'A') {
      this.color = '#00A8FF';
      this.colorDark = '#0077AA';
      this.colorLight = '#66D9FF';
    } else {
      this.color = '#FF3366';
      this.colorDark = '#CC2255';
      this.colorLight = '#FF88AA';
    }
  }

  public reset(startX: number, startY: number): void {
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.canDoubleJump = false;
    this.speedMultiplier = 1;
    this.boostTimer = 0;
    this.lastCheckpoint = { x: startX, y: startY };
    this.checkpointIndex = -1;
    this.isDead = false;
    this.deathTimer = 0;
    this.respawnTimer = 0;
    this.fadeInTimer = 0;
    this.hasFinished = false;
    this.finishTime = 0;
    this.jumpChargeTime = 0;
    this.isChargingJump = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
    this.activeCheckpointsHit = new Set();
    this.animTime = 0;
  }

  public respawn(): void {
    this.x = this.lastCheckpoint.x;
    this.y = this.lastCheckpoint.y;
    this.vx = 0;
    this.vy = 0;
    this.isDead = false;
    this.boostTimer = 0;
    this.speedMultiplier = 1;
    this.fadeInTimer = 0.3;
    this.deathTimer = 0;
    this.canDoubleJump = false;
  }

  public die(): void {
    if (this.isDead || this.hasFinished) return;
    this.isDead = true;
    this.deathTimer = 0.4;
    this.vx = 0;
    this.vy = -5;
  }

  public applyBoost(duration: number = 0.5): void {
    this.boostTimer = Math.max(this.boostTimer, duration);
    this.speedMultiplier = 2;
  }

  public update(
    dt: number,
    input: PlayerInput,
    obstacles: Obstacle[],
    canvasHeight: number,
    checkpoints: { x: number; y: number; w: number; h: number }[]
  ): { died: boolean; hitCheckpoint: number | null; hitBoost: boolean; hitFinish: boolean } {
    const result = { died: false, hitCheckpoint: null as number | null, hitBoost: false, hitFinish: false };

    this.animTime += dt;

    if (this.fadeInTimer > 0) {
      this.fadeInTimer -= dt;
    }

    if (this.hasFinished) {
      return result;
    }

    if (this.isDead) {
      this.deathTimer -= dt;
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.deathTimer <= 0) {
        this.respawn();
      }
      return result;
    }

    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.speedMultiplier = 1;
      }
    }

    const speed = this.baseSpeed * this.speedMultiplier;
    if (input.left && !input.right) {
      this.vx = -speed;
      this.facing = -1;
    } else if (input.right && !input.left) {
      this.vx = speed;
      this.facing = 1;
    } else {
      this.vx *= 0.75;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    if (this.coyoteTime > 0) this.coyoteTime -= dt;
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;

    if (input.jumpPressed) {
      this.jumpBuffer = 0.12;
    }

    const canJump = this.onGround || this.coyoteTime > 0;

    if (this.jumpBuffer > 0) {
      if (canJump) {
        this.vy = this.jumpVel;
        this.onGround = false;
        this.coyoteTime = 0;
        this.jumpBuffer = 0;
        this.isChargingJump = true;
        this.jumpChargeTime = 0;
        this.canDoubleJump = true;
      } else if (this.canDoubleJump) {
        this.vy = this.jumpVel * 0.7;
        this.canDoubleJump = false;
        this.jumpBuffer = 0;
        this.isChargingJump = true;
        this.jumpChargeTime = 0;
      }
    }

    if (this.isChargingJump && input.jump && this.vy < 0) {
      this.jumpChargeTime += dt;
      if (this.jumpChargeTime < this.maxJumpCharge) {
        this.vy -= 0.35;
      } else {
        this.isChargingJump = false;
      }
    } else {
      this.isChargingJump = false;
    }

    if (!input.jump && this.vy < -4 && !this.isChargingJump) {
      this.vy += 0.5;
    }

    this.vy += this.gravity;
    if (this.vy > 14) this.vy = 14;

    this.x += this.vx;
    this.resolveHorizontalCollisions(obstacles);

    const wasOnGround = this.onGround;
    this.onGround = false;
    this.y += this.vy;
    this.resolveVerticalCollisions(obstacles);

    if (wasOnGround && !this.onGround && this.vy >= 0) {
      this.coyoteTime = 0.1;
    }
    if (this.onGround) {
      this.canDoubleJump = true;
    }

    if (this.y > canvasHeight + 100) {
      this.die();
      result.died = true;
      return result;
    }
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (!obs.active) continue;

      if (obs.type === 'spike') {
        if (aabbIntersect(this.getAABB(), obs.getSpikeHitbox())) {
          this.die();
          result.died = true;
          return result;
        }
      } else if (obs.type === 'boost') {
        const boostHitbox = { x: obs.x, y: obs.y - 4, w: obs.w, h: obs.h + 8 };
        if (aabbIntersect(this.getAABB(), boostHitbox)) {
          if (this.boostTimer <= 0) {
            this.applyBoost(0.5);
            result.hitBoost = true;
          }
        }
      } else if (obs.type === 'checkpoint') {
        const idx = checkpoints.findIndex(cp =>
          cp.x === obs.x && cp.y === obs.y && cp.w === obs.w && cp.h === obs.h
        );
        if (idx >= 0 && !this.activeCheckpointsHit.has(idx)) {
          if (aabbIntersect(this.getAABB(), obs.getAABB())) {
            if (idx > this.checkpointIndex) {
              this.checkpointIndex = idx;
              const cp = checkpoints[idx];
              this.lastCheckpoint = { x: cp.x + cp.w / 2 - this.w / 2, y: cp.y + cp.h - 50 };
              this.activeCheckpointsHit.add(idx);
              result.hitCheckpoint = idx;
            }
          }
        }
      } else if (obs.type === 'finish') {
        const finishTrigger = { x: obs.x + obs.w * 0.3, y: obs.y + obs.h * 0.2, w: obs.w * 0.4, h: obs.h * 0.8 };
        if (aabbIntersect(this.getAABB(), finishTrigger)) {
          this.hasFinished = true;
          result.hitFinish = true;
          this.vx = 0;
          this.vy = 0;
        }
      }
    }

    return result;
  }

  private resolveHorizontalCollisions(obstacles: Obstacle[]): void {
    for (const obs of obstacles) {
      if (!obs.active) continue;
      if (obs.type !== 'platform') continue;
      const ob = obs.getAABB();
      if (aabbIntersect(this.getAABB(), ob)) {
        if (this.vx > 0) {
          this.x = ob.x - this.w;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = ob.x + ob.w;
          this.vx = 0;
        }
      }
    }
  }

  private resolveVerticalCollisions(obstacles: Obstacle[]): void {
    for (const obs of obstacles) {
      if (!obs.active) continue;
      if (obs.type !== 'platform') continue;
      const ob = obs.getAABB();
      if (aabbIntersect(this.getAABB(), ob)) {
        if (this.vy > 0) {
          this.y = ob.y - this.h;
          this.vy = 0;
          this.onGround = true;
        } else if (this.vy < 0) {
          this.y = ob.y + ob.h;
          this.vy = 0;
        }
      }
    }
  }

  public getAABB(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  public draw(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const sx = Math.round(this.x - cameraX);
    const sy = Math.round(this.y);

    let alpha = 1;
    if (this.fadeInTimer > 0) {
      alpha = 1 - this.fadeInTimer / 0.3;
      alpha = Math.max(0, Math.min(1, alpha));
    }
    if (this.isDead) {
      alpha = 0.4;
    }

    ctx.globalAlpha = alpha;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx - 2, sy + this.h - 2, this.w + 4, 4);

    const grad = ctx.createLinearGradient(0, sy, 0, sy + this.h);
    grad.addColorStop(0, this.colorLight);
    grad.addColorStop(0.5, this.color);
    grad.addColorStop(1, this.colorDark);
    ctx.fillStyle = grad;
    ctx.fillRect(sx, sy, this.w, this.h);

    ctx.strokeStyle = this.id === 'A' ? '#005577' : '#991133';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 0.5, sy + 0.5, this.w - 1, this.h - 1);

    const eyeY = sy + 9;
    const eyeOffsetX = this.facing > 0 ? 1 : -1;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(sx + 4, eyeY, 4, 4);
    ctx.fillRect(sx + 12, eyeY, 4, 4);

    ctx.fillStyle = '#000000';
    ctx.fillRect(sx + 5 + eyeOffsetX, eyeY + 1, 2, 2);
    ctx.fillRect(sx + 13 + eyeOffsetX, eyeY + 1, 2, 2);

    ctx.fillStyle = '#000000';
    const mouthY = sy + 19;
    if (this.isDead) {
      ctx.fillRect(sx + 7, mouthY + 1, 6, 1);
      ctx.fillRect(sx + 8, mouthY, 1, 1);
      ctx.fillRect(sx + 11, mouthY, 1, 1);
      ctx.fillRect(sx + 8, mouthY + 2, 1, 1);
      ctx.fillRect(sx + 11, mouthY + 2, 1, 1);
    } else if (!this.onGround) {
      ctx.fillRect(sx + 8, mouthY, 4, 2);
    } else if (Math.abs(this.vx) > 0.5) {
      const runAnim = Math.floor(this.animTime * 15) % 2;
      if (runAnim === 0) {
        ctx.fillRect(sx + 7, mouthY + 1, 6, 2);
      } else {
        ctx.fillRect(sx + 8, mouthY, 4, 2);
      }
    } else {
      ctx.fillRect(sx + 7, mouthY + 1, 6, 1);
    }

    if (this.boostTimer > 0) {
      const boostAlpha = 0.5 + 0.3 * Math.sin(this.animTime * 25);
      ctx.globalAlpha = alpha * boostAlpha;
      ctx.fillStyle = '#FFEB3B';
      for (let i = 0; i < 3; i++) {
        const bx = sx - 4 - i * 5;
        const by = sy + 6 + i * 8;
        ctx.fillRect(bx, by, 4 + Math.random() * 3, 2 + Math.random() * 2);
      }
      for (let i = 0; i < 2; i++) {
        const bx = sx - 3 - i * 6;
        const by = sy + 18 + i * 4;
        ctx.fillRect(bx, by, 3 + Math.random() * 2, 2);
      }
    }

    ctx.globalAlpha = 1;
  }
}
