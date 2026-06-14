import type { Platform } from './LevelGenerator';
import { AudioManager } from './AudioManager';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  color: string;
  onGround: boolean;
  lastPlatformId: number | null;
  tiltAngle: number;
  squashStretch: number;
  jumpAnimationTime: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 40;
const GRAVITY = 0.5;
const MOVE_SPEED = 4;
const JUMP_FORCE = -11;
const PLAYER_SIZE = 16;
const MAX_FALL_SPEED = 12;

export class PlayerController {
  player: Player;
  particles: Particle[] = [];
  ripples: Ripple[] = [];
  score: number = 0;
  screenShake: { offsetX: number; offsetY: number; duration: number; frequency: number; time: number } = {
    offsetX: 0,
    offsetY: 0,
    duration: 0,
    frequency: 0,
    time: 0,
  };

  private keys: { left: boolean; right: boolean; jump: boolean } = {
    left: false,
    right: false,
    jump: false,
  };
  private audioManager: AudioManager;
  private canJump: boolean = true;
  private wasInAir: boolean = false;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
    this.player = {
      x: 100,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE - 80,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      vx: 0,
      vy: 0,
      color: '#fbbf24',
      onGround: false,
      lastPlatformId: null,
      tiltAngle: 0,
      squashStretch: 1,
      jumpAnimationTime: 0,
    };
  }

  handleKeyDown(key: string): void {
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.keys.left = true;
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.keys.right = true;
    }
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      if (this.canJump && this.player.onGround) {
        this.keys.jump = true;
        this.player.vy = JUMP_FORCE;
        this.player.onGround = false;
        this.canJump = false;
        this.player.jumpAnimationTime = 0.2;
        this.audioManager.playJumpSound();
      }
    }
  }

  handleKeyUp(key: string): void {
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this.keys.left = false;
    }
    if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this.keys.right = false;
    }
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.keys.jump = false;
      this.canJump = true;
    }
  }

  update(deltaTime: number, platforms: Platform[], currentTime: number): void {
    const dt = deltaTime / 16.67;

    if (this.keys.left) {
      this.player.vx = -MOVE_SPEED;
    } else if (this.keys.right) {
      this.player.vx = MOVE_SPEED;
    } else {
      this.player.vx *= 0.8;
      if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
    }

    const targetTilt = this.player.vx * 2 / MOVE_SPEED;
    this.player.tiltAngle += (targetTilt - this.player.tiltAngle) * 0.2;

    this.player.vy += GRAVITY * dt;
    if (this.player.vy > MAX_FALL_SPEED) this.player.vy = MAX_FALL_SPEED;

    if (this.player.jumpAnimationTime > 0) {
      this.player.jumpAnimationTime -= deltaTime / 1000;
      const t = 1 - this.player.jumpAnimationTime / 0.2;
      if (t < 0.5) {
        this.player.squashStretch = 1 - 0.2 * Math.sin(t * Math.PI);
      } else {
        this.player.squashStretch = 1 + 0.15 * Math.sin((t - 0.5) * Math.PI);
      }
    } else {
      this.player.squashStretch += (1 - this.player.squashStretch) * 0.2;
    }

    const prevX = this.player.x;
    const prevY = this.player.y;
    const prevBottom = prevY + this.player.height;

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    if (this.player.x < 0) {
      this.player.x = 0;
      this.player.vx = 0;
      this.addRipple(0, this.player.y + this.player.height / 2, currentTime);
      this.triggerScreenShake(currentTime);
    }
    if (this.player.x + this.player.width > CANVAS_WIDTH) {
      this.player.x = CANVAS_WIDTH - this.player.width;
      this.player.vx = 0;
      this.addRipple(CANVAS_WIDTH, this.player.y + this.player.height / 2, currentTime);
      this.triggerScreenShake(currentTime);
    }

    this.wasInAir = !this.player.onGround;
    this.player.onGround = false;

    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
    if (this.player.y + this.player.height >= groundY) {
      this.player.y = groundY - this.player.height;
      if (this.player.vy > 0) {
        if (this.wasInAir && this.player.vy > 2) {
          this.spawnLandParticles();
          this.audioManager.playLandSound();
        }
        this.player.vy = 0;
        this.player.onGround = true;
      }
    }

    for (const platform of platforms) {
      if (platform.fadeOut) continue;

      const wasAbove = prevBottom <= platform.y + 2;
      const isFalling = this.player.vy >= 0;

      if (
        this.player.x + this.player.width > platform.x &&
        this.player.x < platform.x + platform.width &&
        this.player.y + this.player.height >= platform.y &&
        this.player.y + this.player.height <= platform.y + platform.height &&
        wasAbove &&
        isFalling
      ) {
        this.player.y = platform.y - this.player.height;
        this.player.vy = 0;
        this.player.onGround = true;

        if (this.wasInAir) {
          this.spawnLandParticles();
          this.audioManager.playLandSound();

          if (this.player.lastPlatformId !== platform.id) {
            this.player.lastPlatformId = platform.id;
            this.score += 10;
            this.audioManager.playScoreSound();
          }
        }
      }

      if (
        this.player.y + this.player.height > platform.y + 4 &&
        this.player.y < platform.y + platform.height - 4
      ) {
        if (
          prevX + this.player.width <= platform.x &&
          this.player.x + this.player.width > platform.x
        ) {
          this.player.x = platform.x - this.player.width;
          this.player.vx = 0;
          this.addRipple(platform.x, this.player.y + this.player.height / 2, currentTime);
          this.triggerScreenShake(currentTime);
          this.audioManager.playHitSound();
        }

        if (
          prevX >= platform.x + platform.width &&
          this.player.x < platform.x + platform.width
        ) {
          this.player.x = platform.x + platform.width;
          this.player.vx = 0;
          this.addRipple(platform.x + platform.width, this.player.y + this.player.height / 2, currentTime);
          this.triggerScreenShake(currentTime);
          this.audioManager.playHitSound();
        }
      }
    }

    this.updateParticles(deltaTime);
    this.updateRipples(deltaTime);
    this.updateScreenShake(deltaTime);
  }

  private spawnLandParticles(): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 0.3,
        maxLife: 0.3,
        color: '#94a3b8',
        size: 2,
      });
    }
  }

  private addRipple(x: number, y: number, _currentTime: number): void {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 20,
      life: 0.4,
      maxLife: 0.4,
      color: '#fef3c7',
    });
  }

  private triggerScreenShake(_currentTime: number): void {
    this.screenShake.duration = 0.1;
    this.screenShake.frequency = 15;
    this.screenShake.time = 0;
  }

  private updateParticles(deltaTime: number): void {
    const dt = deltaTime / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateRipples(deltaTime: number): void {
    const dt = deltaTime / 1000;
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.life -= dt;
      const t = 1 - r.life / r.maxLife;
      r.radius = r.maxRadius * t;
      if (r.life <= 0) {
        this.ripples.splice(i, 1);
      }
    }
  }

  private updateScreenShake(deltaTime: number): void {
    if (this.screenShake.duration > 0) {
      const dt = deltaTime / 1000;
      this.screenShake.time += dt;
      this.screenShake.duration -= dt;

      if (this.screenShake.duration <= 0) {
        this.screenShake.offsetX = 0;
        this.screenShake.offsetY = 0;
      } else {
        const amplitude = 2 * (this.screenShake.duration / 0.1);
        this.screenShake.offsetX = (Math.random() - 0.5) * 2 * amplitude;
        this.screenShake.offsetY = (Math.random() - 0.5) * 2 * amplitude;
      }
    }
  }

  reset(): void {
    this.player.x = 100;
    this.player.y = CANVAS_HEIGHT - GROUND_HEIGHT - PLAYER_SIZE - 80;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onGround = false;
    this.player.lastPlatformId = null;
    this.player.tiltAngle = 0;
    this.player.squashStretch = 1;
    this.player.jumpAnimationTime = 0;
    this.score = 0;
    this.particles = [];
    this.ripples = [];
    this.screenShake.offsetX = 0;
    this.screenShake.offsetY = 0;
    this.screenShake.duration = 0;
  }
}
