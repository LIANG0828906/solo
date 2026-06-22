'use strict';

import {
  Microbe,
  MicrobeType,
  EventType,
  SIMULATION_SIZE,
  MAX_MICROBES,
} from './types';
import { eventBus } from './EventBus';

interface SpawnData {
  type?: MicrobeType;
  x?: number;
  y?: number;
  count?: number;
}

class MicrobeEngine {
  microbes: Microbe[] = [];

  constructor() {
    eventBus.on(EventType.SPAWN_MICROBE, (data) => this.handleSpawn(data));
    eventBus.on(EventType.RESET_SIMULATION, () => this.handleReset());
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }

  private randomRadius(): number {
    return Math.random() * 7 + 8;
  }

  private randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private clampSpeed(speed: number, min: number, max: number): number {
    const mag = Math.abs(speed);
    if (mag < min) {
      return speed === 0 ? min : (speed / mag) * min;
    }
    if (mag > max) {
      return (speed / mag) * max;
    }
    return speed;
  }

  createMicrobe(
    type: MicrobeType,
    x?: number,
    y?: number,
    radius?: number,
  ): Microbe {
    const actualX = x ?? Math.random() * SIMULATION_SIZE;
    const actualY = y ?? Math.random() * SIMULATION_SIZE;
    const actualRadius = radius ?? this.randomRadius();

    const base: Microbe = {
      id: this.generateId(),
      type,
      x: actualX,
      y: actualY,
      vx: 0,
      vy: 0,
      radius: actualRadius,
      age: 0,
      flashing: false,
      flashTimer: 0,
    };

    switch (type) {
      case MicrobeType.COCCUS: {
        const angle = Math.random() * Math.PI * 2;
        const speed = this.randomInRange(0.3, 0.8);
        base.vx = Math.cos(angle) * speed;
        base.vy = Math.sin(angle) * speed;
        break;
      }
      case MicrobeType.BACILLUS: {
        const direction = Math.random() * Math.PI * 2;
        const speed = this.randomInRange(0.5, 1.0);
        base.vx = Math.cos(direction) * speed;
        base.vy = Math.sin(direction) * speed;
        base.direction = direction;
        base.turnTimer = 0;
        base.turnInterval = this.randomInRange(120, 240);
        break;
      }
      case MicrobeType.SPIRILLUM: {
        const spiralAngle = Math.random() * Math.PI * 2;
        const speed = this.randomInRange(1.0, 1.5);
        base.vx = Math.cos(spiralAngle) * speed;
        base.vy = Math.sin(spiralAngle) * speed;
        base.spiralPhase = Math.random() * Math.PI * 2;
        base.spiralRadius = this.randomInRange(10, 20);
        base.spiralAngle = spiralAngle;
        break;
      }
    }

    return base;
  }

  initRandom(count: number = 20): void {
    this.microbes = [];
    for (let i = 0; i < count; i++) {
      if (this.microbes.length >= MAX_MICROBES) break;

      const rand = Math.random();
      let type: MicrobeType;
      if (rand < 0.3) {
        type = MicrobeType.COCCUS;
      } else if (rand < 0.6) {
        type = MicrobeType.BACILLUS;
      } else {
        type = MicrobeType.SPIRILLUM;
      }

      this.microbes.push(this.createMicrobe(type));
    }
  }

  private updateCoccus(microbe: Microbe): void {
    microbe.vx += (Math.random() - 0.5) * 0.1;
    microbe.vy += (Math.random() - 0.5) * 0.1;

    microbe.vx = this.clampSpeed(microbe.vx, 0.3, 0.8);
    microbe.vy = this.clampSpeed(microbe.vy, 0.3, 0.8);
  }

  private updateBacillus(microbe: Microbe): void {
    microbe.turnTimer = (microbe.turnTimer ?? 0) + 1;

    if (microbe.turnTimer >= (microbe.turnInterval ?? 180)) {
      microbe.direction = (microbe.direction ?? 0) + (Math.random() - 0.5) * Math.PI;
      microbe.turnTimer = 0;
      microbe.turnInterval = this.randomInRange(120, 240);

      const speed = this.randomInRange(0.5, 1.0);
      microbe.vx = Math.cos(microbe.direction) * speed;
      microbe.vy = Math.sin(microbe.direction) * speed;
    }
  }

  private updateSpirillum(microbe: Microbe, _deltaTime: number): void {
    microbe.spiralPhase = (microbe.spiralPhase ?? 0) + 0.1;
    const phase = microbe.spiralPhase ?? 0;
    const spiralRadius = microbe.spiralRadius ?? 15;
    const spiralAngle = microbe.spiralAngle ?? 0;

    const speed = Math.sqrt(microbe.vx ** 2 + microbe.vy ** 2);
    const actualSpeed = this.clampSpeed(speed, 1.0, 1.5);

    microbe.vx =
      Math.cos(spiralAngle) * actualSpeed +
      Math.cos(spiralAngle + Math.PI / 2) * Math.sin(phase) * spiralRadius * 0.02;
    microbe.vy =
      Math.sin(spiralAngle) * actualSpeed +
      Math.sin(spiralAngle + Math.PI / 2) * Math.sin(phase) * spiralRadius * 0.02;
  }

  private handleBoundary(microbe: Microbe): void {
    const offsetAngle = (Math.random() * 20 + 10) * (Math.PI / 180);
    const dir = Math.random() > 0.5 ? 1 : -1;
    const cos = Math.cos(offsetAngle * dir);
    const sin = Math.sin(offsetAngle * dir);

    const bounceX = microbe.vx * cos - microbe.vy * sin;
    const bounceY = microbe.vx * sin + microbe.vy * cos;

    let bounced = false;

    if (microbe.x - microbe.radius <= 0) {
      microbe.x = microbe.radius;
      if (microbe.vx < 0) {
        microbe.vx = -bounceX;
        microbe.vy = bounceY;
        bounced = true;
      }
    } else if (microbe.x + microbe.radius >= SIMULATION_SIZE) {
      microbe.x = SIMULATION_SIZE - microbe.radius;
      if (microbe.vx > 0) {
        microbe.vx = -bounceX;
        microbe.vy = bounceY;
        bounced = true;
      }
    }

    if (microbe.y - microbe.radius <= 0) {
      microbe.y = microbe.radius;
      if (microbe.vy < 0) {
        if (!bounced) {
          microbe.vx = bounceX;
        }
        microbe.vy = -bounceY;
      }
    } else if (microbe.y + microbe.radius >= SIMULATION_SIZE) {
      microbe.y = SIMULATION_SIZE - microbe.radius;
      if (microbe.vy > 0) {
        if (!bounced) {
          microbe.vx = bounceX;
        }
        microbe.vy = -bounceY;
      }
    }
  }

  private checkCollisions(): void {
    for (let i = 0; i < this.microbes.length; i++) {
      for (let j = i + 1; j < this.microbes.length; j++) {
        const a = this.microbes[i];
        const b = this.microbes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          const totalMass = a.radius + b.radius;
          const moveA = (b.radius / totalMass) * overlap;
          const moveB = (a.radius / totalMass) * overlap;

          a.x -= nx * moveA;
          a.y -= ny * moveA;
          b.x += nx * moveB;
          b.y += ny * moveB;

          const dvx = a.vx - b.vx;
          const dvy = a.vy - b.vy;
          const dvDotN = dvx * nx + dvy * ny;

          if (dvDotN > 0) {
            const impulse = (2 * dvDotN) / totalMass;
            a.vx -= impulse * b.radius * nx;
            a.vy -= impulse * b.radius * ny;
            b.vx += impulse * a.radius * nx;
            b.vy += impulse * a.radius * ny;
          }
        }
      }
    }
  }

  update(deltaTime: number): void {
    for (const microbe of this.microbes) {
      switch (microbe.type) {
        case MicrobeType.COCCUS:
          this.updateCoccus(microbe);
          break;
        case MicrobeType.BACILLUS:
          this.updateBacillus(microbe);
          break;
        case MicrobeType.SPIRILLUM:
          this.updateSpirillum(microbe, deltaTime);
          break;
      }

      microbe.x += microbe.vx;
      microbe.y += microbe.vy;

      this.handleBoundary(microbe);

      microbe.age += deltaTime;

      if (microbe.flashTimer > 0) {
        microbe.flashTimer -= deltaTime;
        if (microbe.flashTimer <= 0) {
          microbe.flashing = false;
        }
      }
    }

    this.checkCollisions();

    eventBus.emit(EventType.FRAME_POSITIONS, this.microbes);
  }

  handleSpawn(data: unknown): void {
    const spawnData = data as SpawnData;
    const type = spawnData?.type ?? MicrobeType.COCCUS;
    const count = spawnData?.count ?? 1;

    for (let i = 0; i < count; i++) {
      if (this.microbes.length >= MAX_MICROBES) break;
      this.microbes.push(
        this.createMicrobe(type, spawnData?.x, spawnData?.y),
      );
    }
  }

  handleReset(): void {
    this.microbes = [];
    this.initRandom(20);
  }
}

export const microbeEngine = new MicrobeEngine();
