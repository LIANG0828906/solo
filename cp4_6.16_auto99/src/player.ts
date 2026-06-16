import { eventBus } from './eventBus';

export type PowerupType = 'speed' | 'shield' | 'magnet';

export interface PowerupState {
  type: PowerupType;
  remainingTime: number;
  duration: number;
}

export interface PlayerState {
  lane: number;
  targetLane: number;
  laneChangeProgress: number;
  y: number;
  vy: number;
  isJumping: boolean;
  isAlive: boolean;
  width: number;
  height: number;
  powerups: Map<PowerupType, PowerupState>;
  energy: number;
  score: number;
  speedMultiplier: number;
  baseSpeed: number;
  isSpeedPhase: boolean;
  speedPhaseTimer: number;
  blinkTimer: number;
}

const LANE_COUNT = 3;
const GRAVITY = 2500;
const JUMP_VELOCITY = 900;
const LANE_CHANGE_SPEED = 8;
const GROUND_Y = 0;

export class PlayerModule {
  public state: PlayerState;
  private laneWidth: number;

  constructor(laneWidth: number) {
    this.laneWidth = laneWidth;
    this.state = this.createInitialState();
  }

  private createInitialState(): PlayerState {
    return {
      lane: 1,
      targetLane: 1,
      laneChangeProgress: 1,
      y: GROUND_Y,
      vy: 0,
      isJumping: false,
      isAlive: true,
      width: 40,
      height: 50,
      powerups: new Map(),
      energy: 0,
      score: 0,
      speedMultiplier: 1,
      baseSpeed: 400,
      isSpeedPhase: false,
      speedPhaseTimer: 0,
      blinkTimer: 0
    };
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  moveLeft(): void {
    if (!this.state.isAlive) return;
    if (this.state.targetLane > 0) {
      this.state.targetLane -= 1;
      this.state.laneChangeProgress = 0;
    }
  }

  moveRight(): void {
    if (!this.state.isAlive) return;
    if (this.state.targetLane < LANE_COUNT - 1) {
      this.state.targetLane += 1;
      this.state.laneChangeProgress = 0;
    }
  }

  jump(): void {
    if (!this.state.isAlive) return;
    if (!this.state.isJumping) {
      this.state.isJumping = true;
      this.state.vy = JUMP_VELOCITY;
    }
  }

  activateSkill(): void {
    if (!this.state.isAlive) return;
    if (this.state.energy >= 100) {
      this.state.energy = 0;
      eventBus.emit('skill_activate');
    }
  }

  addPowerup(type: PowerupType, duration: number): void {
    const existing = this.state.powerups.get(type);
    if (existing) {
      existing.remainingTime = Math.max(existing.remainingTime, duration);
    } else {
      this.state.powerups.set(type, {
        type,
        remainingTime: duration,
        duration
      });
    }
    eventBus.emit('powerup_pickup', type);
  }

  hasPowerup(type: PowerupType): boolean {
    return this.state.powerups.has(type);
  }

  getEffectiveSpeed(): number {
    let speed = this.state.baseSpeed * this.state.speedMultiplier;
    if (this.hasPowerup('speed')) {
      speed *= 1.3;
    }
    return speed;
  }

  getCollisionBox(): { x: number; y: number; w: number; h: number; lane: number } {
    const laneX = this.getCurrentLaneX();
    return {
      x: laneX - this.state.width / 2,
      y: this.state.y,
      w: this.state.width,
      h: this.state.height,
      lane: Math.round(this.state.lane + (this.state.targetLane - this.state.lane) * this.state.laneChangeProgress)
    };
  }

  getCurrentLaneX(): number {
    const t = this.state.laneChangeProgress;
    const currentLane = this.state.lane + (this.state.targetLane - this.state.lane) * t;
    return (currentLane - 1) * this.laneWidth;
  }

  update(dt: number): void {
    if (!this.state.isAlive) return;

    if (this.state.laneChangeProgress < 1) {
      this.state.laneChangeProgress = Math.min(1, this.state.laneChangeProgress + LANE_CHANGE_SPEED * dt);
      if (this.state.laneChangeProgress >= 1) {
        this.state.lane = this.state.targetLane;
      }
    }

    if (this.state.isJumping) {
      this.state.vy -= GRAVITY * dt;
      this.state.y += this.state.vy * dt;
      if (this.state.y <= GROUND_Y) {
        this.state.y = GROUND_Y;
        this.state.vy = 0;
        this.state.isJumping = false;
      }
    }

    this.state.powerups.forEach((p, key) => {
      p.remainingTime -= dt;
      if (p.remainingTime <= 0) {
        this.state.powerups.delete(key);
      }
    });

    if (this.state.isSpeedPhase) {
      this.state.speedPhaseTimer -= dt;
      this.state.blinkTimer += dt;
      if (this.state.speedPhaseTimer <= 0) {
        this.state.isSpeedPhase = false;
        this.state.speedMultiplier = 1;
        eventBus.emit('speed_phase_end');
      }
    }

    const scoreGain = this.getEffectiveSpeed() * dt * 0.1;
    const oldScore = this.state.score;
    this.state.score += scoreGain;

    const oldThreshold = Math.floor(oldScore / 1000);
    const newThreshold = Math.floor(this.state.score / 1000);
    if (newThreshold > oldThreshold && !this.state.isSpeedPhase) {
      this.triggerSpeedPhase();
    }

    this.state.energy = Math.min(100, this.state.energy + dt * 3);
  }

  private triggerSpeedPhase(): void {
    this.state.isSpeedPhase = true;
    this.state.speedMultiplier = 1.15;
    this.state.speedPhaseTimer = 10;
    this.state.blinkTimer = 0;
    eventBus.emit('speed_phase_start');
  }

  kill(): void {
    if (!this.state.isAlive) return;
    this.state.isAlive = false;
    eventBus.emit('game_over', Math.floor(this.state.score));
  }

  getScore(): number {
    return Math.floor(this.state.score);
  }
}
