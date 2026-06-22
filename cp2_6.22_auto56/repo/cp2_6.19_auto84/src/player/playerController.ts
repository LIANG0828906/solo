import type { Cell } from '../maze/mazeGenerator';
import { MazeGenerator } from '../maze/mazeGenerator';
import { EventSystem, type ParticleEffect, type EventResult } from './events';
import type { BeatEvent } from '../audio/beatDetector';

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerData {
  x: number;
  y: number;
  energy: number;
  maxEnergy: number;
  combo: number;
  isMoving: boolean;
  lastMoveTime: number;
  bounceProgress: number;
  flashTimer: number;
  beatFlash: boolean;
}

export interface QueuedMove {
  direction: Direction;
  timestamp: number;
}

export class PlayerController {
  private maze: MazeGenerator;
  private events: EventSystem;
  private player: PlayerData;
  private moveQueue: QueuedMove[];
  private maxQueueSize: number;
  private beatWindow: number;
  private hasPressedSinceLastBeat: boolean;
  private onStateChange: (() => void) | null = null;
  private onParticleEffect: ((effect: ParticleEffect) => void) | null = null;
  private onMessage: ((msg: string) => void) | null = null;
  private onComboChange: ((combo: number) => void) | null = null;

  constructor(maze: MazeGenerator) {
    this.maze = maze;
    this.events = new EventSystem();
    this.player = {
      x: 0,
      y: 0,
      energy: 50,
      maxEnergy: 100,
      combo: 0,
      isMoving: false,
      lastMoveTime: 0,
      bounceProgress: 0,
      flashTimer: 0,
      beatFlash: false
    };
    this.moveQueue = [];
    this.maxQueueSize = 8;
    this.beatWindow = 500;
    this.hasPressedSinceLastBeat = false;
  }

  setStateChangeCallback(cb: () => void): void {
    this.onStateChange = cb;
  }

  setParticleEffectCallback(cb: (effect: ParticleEffect) => void): void {
    this.onParticleEffect = cb;
  }

  setMessageCallback(cb: (msg: string) => void): void {
    this.onMessage = cb;
  }

  setComboChangeCallback(cb: (combo: number) => void): void {
    this.onComboChange = cb;
  }

  getPlayer(): PlayerData {
    return { ...this.player };
  }

  queueMove(direction: Direction): void {
    if (this.player.isMoving) return;
    const now = performance.now();

    if (this.moveQueue.length >= this.maxQueueSize) {
      this.moveQueue.shift();
    }
    this.moveQueue.push({ direction, timestamp: now });
    this.hasPressedSinceLastBeat = true;
  }

  onBeat(event: BeatEvent): void {
    if (event.isStrongBeat) {
      this.onStrongBeat(event);
    }
  }

  private onStrongBeat(event: BeatEvent): void {
    this.player.beatFlash = true;
    this.player.flashTimer = 150;

    this.purgeExpiredMoves(event.timestamp);

    let moveConsumed = false;
    while (this.moveQueue.length > 0 && !moveConsumed) {
      const candidate = this.moveQueue.shift()!;
      const timeDiff = event.timestamp - candidate.timestamp;
      if (timeDiff >= 0 && timeDiff <= this.beatWindow) {
        if (!this.player.isMoving) {
          this.executeMove(candidate.direction);
          moveConsumed = true;
        } else {
          this.moveQueue.unshift(candidate);
          break;
        }
      }
    }

    if (!moveConsumed) {
      if (this.hasPressedSinceLastBeat === false && this.player.combo > 0) {
        this.player.combo = Math.max(0, this.player.combo - 1);
        this.player.energy = Math.max(0, this.player.energy - 2);
        if (this.onComboChange) this.onComboChange(this.player.combo);
        if (this.onStateChange) this.onStateChange();
      } else if (this.hasPressedSinceLastBeat && this.moveQueue.length === 0) {
        // user pressed keys but they were all expired
        this.resetCombo('超时!');
      }
    }

    this.hasPressedSinceLastBeat = false;
  }

  private purgeExpiredMoves(now: number): void {
    while (this.moveQueue.length > 0) {
      const head = this.moveQueue[0];
      const age = now - head.timestamp;
      if (age > this.beatWindow) {
        this.moveQueue.shift();
      } else {
        break;
      }
    }
  }

  private executeMove(direction: Direction): void {
    let newX = this.player.x;
    let newY = this.player.y;

    switch (direction) {
      case 'up': newY--; break;
      case 'down': newY++; break;
      case 'left': newX--; break;
      case 'right': newX++; break;
    }

    if (!this.maze.isWalkable(newX, newY)) {
      this.resetCombo('边界!');
      return;
    }

    this.player.isMoving = true;
    this.player.lastMoveTime = performance.now();
    this.player.bounceProgress = 0;

    setTimeout(() => {
      this.player.x = newX;
      this.player.y = newY;
      this.player.isMoving = false;
      this.maze.setVisited(newX, newY);
      this.handleCellEvent(newX, newY);
    }, 200);

    if (this.onStateChange) this.onStateChange();
  }

  private handleCellEvent(x: number, y: number): void {
    const cell: Cell | null = this.maze.getCell(x, y);
    if (!cell) return;

    const state = {
      energy: this.player.energy,
      combo: this.player.combo,
      x: this.player.x,
      y: this.player.y,
      maxEnergy: this.player.maxEnergy,
      speed: 1
    };

    const result: EventResult = this.events.trigger(cell.color, state);
    this.applyEventResult(result);
  }

  private applyEventResult(result: EventResult): void {
    this.player.energy = Math.max(0, Math.min(
      this.player.maxEnergy,
      this.player.energy + result.energyDelta
    ));

    if (result.comboDelta > 0) {
      this.player.combo += result.comboDelta;
      if (this.onComboChange) this.onComboChange(this.player.combo);
    }

    if (result.teleport) {
      this.player.x = result.teleport.x;
      this.player.y = result.teleport.y;
      this.maze.setVisited(result.teleport.x, result.teleport.y);
    }

    if (result.effect && this.onParticleEffect) {
      this.onParticleEffect(result.effect);
    }

    if (result.message && this.onMessage) {
      this.onMessage(result.message);
    }

    if (this.onStateChange) this.onStateChange();
  }

  private resetCombo(message: string): void {
    this.player.combo = 0;
    if (this.onComboChange) this.onComboChange(0);
    if (this.onMessage) this.onMessage(message);
    if (this.onStateChange) this.onStateChange();
  }

  update(deltaTime: number): void {
    if (this.player.flashTimer > 0) {
      this.player.flashTimer -= deltaTime;
      if (this.player.flashTimer <= 0) {
        this.player.beatFlash = false;
      }
    }

    if (this.player.isMoving) {
      const elapsed = performance.now() - this.player.lastMoveTime;
      this.player.bounceProgress = Math.min(1, elapsed / 200);
    }
  }

  checkMissedBeat(): void {
    const now = performance.now();
    while (this.moveQueue.length > 0) {
      const head = this.moveQueue[0];
      if (now - head.timestamp > this.beatWindow + 700) {
        this.moveQueue.shift();
      } else {
        break;
      }
    }
    if (this.moveQueue.length === 0) return;
    const oldest = this.moveQueue[0];
    if (now - oldest.timestamp > this.beatWindow + 900) {
      this.resetCombo('节拍错过!');
      this.moveQueue.length = 0;
    }
  }

  hasPendingMove(): boolean {
    return this.moveQueue.length > 0;
  }

  getPendingDirection(): Direction | null {
    return this.moveQueue.length > 0 ? this.moveQueue[0].direction : null;
  }

  getQueueSize(): number {
    return this.moveQueue.length;
  }
}
