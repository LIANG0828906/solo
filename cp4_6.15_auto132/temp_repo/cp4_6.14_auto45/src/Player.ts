import { Entity, Laser } from './Entity';
import { Terrain } from './Terrain';

export interface ShipState {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  shieldActive: boolean;
  shieldTimer: number;
  lastShootTime: number;
}

export class Player extends Entity {
  public id: number;
  public isPlayer: boolean;
  public color: string;
  public name: string;
  private state: ShipState;
  private baseSpeed: number = 200;
  private shootCooldown: number = 500;
  private laserSpeed: number = 800;
  private shipVertices: number[] = [20, 0, -12, -12, -6, 0, -12, 12];
  private radius: number = 20;
  private aiTargetAngle: number = 0;
  private aiShootTimer: number = 0;

  constructor(
    id: number,
    x: number,
    y: number,
    color: string,
    isPlayer: boolean = false,
    name: string = ''
  ) {
    super(x, y);
    this.id = id;
    this.isPlayer = isPlayer;
    this.color = color;
    this.name = name;
    this.state = {
      hp: 100,
      maxHp: 100,
      shield: 100,
      maxShield: 100,
      energy: 100,
      maxEnergy: 100,
      shieldActive: false,
      shieldTimer: 0,
      lastShootTime: 0
    };
  }

  public getState(): ShipState {
    return this.state;
  }

  public getRadius(): number {
    return this.radius;
  }

  public takeDamage(amount: number): boolean {
    if (this.state.shieldActive) {
      const absorbed = Math.min(this.state.shield, amount);
      this.state.shield -= absorbed;
      amount -= absorbed;
      if (this.state.shield <= 0) {
        this.state.shieldActive = false;
      }
    }
    if (amount > 0) {
      this.state.hp = Math.max(0, this.state.hp - amount);
    }
    return this.state.hp <= 0;
  }

  public activateShield(): boolean {
    if (this.state.shieldActive) return false;
    if (this.state.energy < 30) return false;
    this.state.energy -= 30;
    this.state.shieldActive = true;
    this.state.shieldTimer = 2;
    this.state.shield = this.state.maxShield;
    return true;
  }

  public shoot(currentTime: number): Laser | null {
    if (currentTime - this.state.lastShootTime < this.shootCooldown) return null;
    this.state.lastShootTime = currentTime;

    const noseX = this.x + Math.cos(this.rotation) * 20;
    const noseY = this.y + Math.sin(this.rotation) * 20;

    return new Laser(
      noseX,
      noseY,
      this.rotation,
      this.laserSpeed,
      this.id,
      200,
      4,
      20,
      this.isPlayer ? '#00ffff' : '#ff4444'
    );
  }

  public updateAI(
    dt: number,
    currentTime: number,
    allPlayers: Player[],
    worldWidth: number,
    worldHeight: number
  ): Laser | null {
    if (!this.alive || this.isPlayer) return null;

    let nearestPlayer: Player | null = null;
    let nearestDist = Infinity;

    for (const p of allPlayers) {
      if (p.id === this.id || !p.isAlive()) continue;
      const dx = p.getX() - this.x;
      const dy = p.getY() - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestPlayer = p;
      }
    }

    if (nearestPlayer) {
      const targetAngle = Math.atan2(
        nearestPlayer.getY() - this.y,
        nearestPlayer.getX() - this.x
      );
      this.aiTargetAngle = targetAngle;

      let angleDiff = targetAngle - this.rotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.rotation += angleDiff * Math.min(1, dt * 4);

      if (nearestDist > 250) {
        this.vx = Math.cos(this.rotation) * this.baseSpeed * 0.7;
        this.vy = Math.sin(this.rotation) * this.baseSpeed * 0.7;
      } else if (nearestDist < 150) {
        this.vx = -Math.cos(this.rotation) * this.baseSpeed * 0.4;
        this.vy = -Math.sin(this.rotation) * this.baseSpeed * 0.4;
      } else {
        const perpAngle = this.rotation + Math.PI / 2;
        const strafe = Math.sin(currentTime * 0.001) * 0.5;
        this.vx = Math.cos(perpAngle) * this.baseSpeed * strafe;
        this.vy = Math.sin(perpAngle) * this.baseSpeed * strafe;
      }

      this.aiShootTimer -= dt;
      if (this.aiShootTimer <= 0 && Math.abs(angleDiff) < 0.2 && nearestDist < 400) {
        this.aiShootTimer = 0.3;
        return this.shoot(currentTime);
      }
    } else {
      this.vx *= 0.95;
      this.vy *= 0.95;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = Math.max(50, Math.min(worldWidth - 50, this.x));
    this.y = Math.max(50, Math.min(worldHeight - 50, this.y));

    this.updateTimers(dt);
    return null;
  }

  public update(
    dt: number,
    keys: Set<string>,
    mouseAngle: number,
    terrain: Terrain
  ): void {
    if (!this.alive) return;

    if (this.isPlayer) {
      this.rotation = mouseAngle;

      let ax = 0, ay = 0;
      if (keys.has('w') || keys.has('W') || keys.has('ArrowUp')) ay -= 1;
      if (keys.has('s') || keys.has('S') || keys.has('ArrowDown')) ay += 1;
      if (keys.has('a') || keys.has('A') || keys.has('ArrowLeft')) ax -= 1;
      if (keys.has('d') || keys.has('D') || keys.has('ArrowRight')) ax += 1;

      const len = Math.sqrt(ax * ax + ay * ay);
      if (len > 0) {
        ax /= len;
        ay /= len;
        this.vx = ax * this.baseSpeed;
        this.vy = ay * this.baseSpeed;
      } else {
        this.vx *= 0.9;
        this.vy *= 0.9;
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      if (len > 0 && Math.random() < 0.8) {
        terrain.addThrustParticle(this.x, this.y, this.rotation);
      }
    }

    this.updateTimers(dt);
  }

  private updateTimers(dt: number): void {
    if (this.state.shieldActive) {
      this.state.shieldTimer -= dt;
      if (this.state.shieldTimer <= 0) {
        this.state.shieldActive = false;
      }
    }

    if (this.state.energy < this.state.maxEnergy) {
      this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + 8 * dt);
    }
  }

  public getTransformedVertices(): number[] {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    const result: number[] = [];
    for (let i = 0; i < this.shipVertices.length; i += 2) {
      const vx = this.shipVertices[i];
      const vy = this.shipVertices[i + 1];
      result.push(vx * cos - vy * sin + this.x);
      result.push(vx * sin + vy * cos + this.y);
    }
    return result;
  }

  public checkSATCollision(laser: Laser): boolean {
    if (!this.alive) return false;

    const laserX1 = laser.getX();
    const laserY1 = laser.getY();
    const laserX2 = laser.getEndX();
    const laserY2 = laser.getEndY();

    const dx = laserX2 - laserX1;
    const dy = laserY2 - laserY1;
    const dist = Math.sqrt(
      (this.x - laserX1) * (this.x - laserX1) +
      (this.y - laserY1) * (this.y - laserY1)
    );
    if (dist > laser.getLength() + this.radius) return false;

    const vertices = this.getTransformedVertices();
    const laserAngle = Math.atan2(dy, dx);
    const perpAngle = laserAngle + Math.PI / 2;

    const axes: number[][] = [];
    axes.push([Math.cos(laserAngle), Math.sin(laserAngle)]);
    axes.push([Math.cos(perpAngle), Math.sin(perpAngle)]);

    for (let i = 0; i < vertices.length; i += 2) {
      const x1 = vertices[i];
      const y1 = vertices[i + 1];
      const x2 = vertices[(i + 2) % vertices.length];
      const y2 = vertices[(i + 3) % vertices.length];
      const edgeX = x2 - x1;
      const edgeY = y2 - y1;
      axes.push([-edgeY, edgeX]);
    }

    for (const axis of axes) {
      const len = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1]);
      if (len === 0) continue;
      const ax = axis[0] / len;
      const ay = axis[1] / len;

      let polyMin = Infinity, polyMax = -Infinity;
      for (let i = 0; i < vertices.length; i += 2) {
        const proj = vertices[i] * ax + vertices[i + 1] * ay;
        polyMin = Math.min(polyMin, proj);
        polyMax = Math.max(polyMax, proj);
      }

      const p1 = laserX1 * ax + laserY1 * ay;
      const p2 = laserX2 * ax + laserY2 * ay;
      const lineMin = Math.min(p1, p2);
      const lineMax = Math.max(p1, p2);

      if (polyMax < lineMin || lineMax < polyMin) {
        return false;
      }
    }

    return true;
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number): void {
    if (!this.alive) return;

    const sx = this.x - cameraX;
    const sy = this.y - cameraY;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.rotation);

    if (this.state.shieldActive) {
      const alpha = 0.3 + 0.3 * Math.sin(performance.now() * 0.01);
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = '#66ddff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = 'rgba(100, 200, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let i = 0; i < this.shipVertices.length; i += 2) {
      if (i === 0) {
        ctx.moveTo(this.shipVertices[i], this.shipVertices[i + 1]);
      } else {
        ctx.lineTo(this.shipVertices[i], this.shipVertices[i + 1]);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(2, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();

    if (!this.isPlayer) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.name, sx, sy - 35);
      ctx.restore();
    }
  }

  public renderShieldRing(
    ctx: CanvasRenderingContext2D,
    cameraX: number,
    cameraY: number
  ): void {
    if (!this.alive || !this.isPlayer) return;

    const sx = this.x - cameraX;
    const sy = this.y - cameraY;
    const shieldPercent = this.state.shield / this.state.maxShield;

    ctx.save();
    ctx.strokeStyle = '#66ddff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ccff';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(sx, sy, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldPercent);
    ctx.stroke();
    ctx.restore();
  }
}
