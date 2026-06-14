import { Vector2, Vector2Utils, PhysicsBody, PhysicsEngine } from './physics';

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  startColor: string;
  endColor: string;
}

export interface RippleEffect {
  position: Vector2;
  radius: number;
  maxRadius: number;
  alpha: number;
  life: number;
}

export const ResourceTypes = {
  CRYSTAL: 'crystal',
  METAL: 'metal',
  GAS: 'gas',
  ENERGY: 'energy'
} as const;

export type ResourceType = typeof ResourceTypes[keyof typeof ResourceTypes];

export interface ResourceCollection {
  type: ResourceType;
  amount: number;
}

export class Ship implements PhysicsBody {
  position: Vector2;
  velocity: Vector2;
  angle: number;
  mass: number;
  radius: number;

  fuel: number;
  maxFuel: number;
  resources: Map<ResourceType, number>;
  cargoCapacity: number;

  targetPoint: Vector2 | null;
  waypoints: Vector2[];
  currentWaypointIndex: number;

  isAccelerating: boolean;
  isTurning: boolean;
  isRefueling: boolean;

  maxAcceleration: number;
  maxTurnSpeed: number;

  accelerationConsumption: number;
  turnConsumption: number;
  refuelRate: number;

  private particles: Particle[];
  private maxParticles: number;
  private rippleEffects: RippleEffect[];

  constructor(position: Vector2) {
    this.position = Vector2Utils.clone(position);
    this.velocity = Vector2Utils.create();
    this.angle = -Math.PI / 2;
    this.mass = 1;
    this.radius = 9;

    this.fuel = 100;
    this.maxFuel = 100;
    this.resources = new Map();
    this.cargoCapacity = 1000;

    this.targetPoint = null;
    this.waypoints = [];
    this.currentWaypointIndex = 0;

    this.isAccelerating = false;
    this.isTurning = false;
    this.isRefueling = false;

    this.maxAcceleration = 80;
    this.maxTurnSpeed = (120 * Math.PI) / 180;

    this.accelerationConsumption = 5;
    this.turnConsumption = 2;
    this.refuelRate = 10;

    this.particles = [];
    this.maxParticles = 200;
    this.rippleEffects = [];

    this.resources.set(ResourceTypes.CRYSTAL, 0);
    this.resources.set(ResourceTypes.METAL, 0);
    this.resources.set(ResourceTypes.GAS, 0);
    this.resources.set(ResourceTypes.ENERGY, 0);
  }

  getCurrentTarget(): Vector2 | null {
    if (this.waypoints.length > 0 && this.currentWaypointIndex < this.waypoints.length) {
      return this.waypoints[this.currentWaypointIndex];
    }
    return this.targetPoint;
  }

  setTarget(point: Vector2): void {
    this.targetPoint = Vector2Utils.clone(point);
    this.waypoints = [];
    this.currentWaypointIndex = 0;
  }

  setWaypoints(points: Vector2[]): void {
    this.waypoints = points.map(p => Vector2Utils.clone(p));
    this.currentWaypointIndex = 0;
    if (points.length > 0) {
      this.targetPoint = null;
    }
  }

  addWaypoint(point: Vector2): void {
    this.waypoints.push(Vector2Utils.clone(point));
  }

  clearWaypoints(): void {
    this.waypoints = [];
    this.currentWaypointIndex = 0;
  }

  update(dt: number, worldWidth: number, worldHeight: number): { acceleration: Vector2 } {
    const target = this.getCurrentTarget();
    let acceleration = Vector2Utils.create();

    let wantsTurn = false;
    let wantsAccelerate = false;
    let turnDirection = 0;
    let turnAmount = 0;
    let accelDirection: Vector2 | null = null;

    if (target) {
      const toTarget = Vector2Utils.sub(target, this.position);
      const distanceToTarget = Vector2Utils.length(toTarget);
      const targetAngle = Vector2Utils.angle(toTarget);

      const angleDiff = PhysicsEngine.getShortestAngle(this.angle, targetAngle);
      const absAngleDiff = Math.abs(angleDiff);

      if (absAngleDiff > 0.05) {
        wantsTurn = true;
        turnDirection = Math.sign(angleDiff);
        turnAmount = Math.min(this.maxTurnSpeed * dt, absAngleDiff);
      }

      if (distanceToTarget > 5) {
        wantsAccelerate = true;
        accelDirection = Vector2Utils.fromAngle(this.angle);
      } else {
        if (this.waypoints.length > 0 && this.currentWaypointIndex < this.waypoints.length - 1) {
          this.currentWaypointIndex++;
        } else if (distanceToTarget <= 5) {
          this.targetPoint = null;
          this.waypoints = [];
          this.currentWaypointIndex = 0;
        }
      }
    }

    this.isTurning = wantsTurn && this.fuel > 0;
    this.isAccelerating = wantsAccelerate && this.fuel > 0;

    if (this.isTurning) {
      this.angle += turnDirection * turnAmount;
    }

    if (this.isAccelerating && accelDirection) {
      acceleration = Vector2Utils.mul(accelDirection, this.maxAcceleration);
    }

    this.deductFuel(dt);
    this.updateParticles(dt);
    this.updateRipples(dt);
    this.boundaryCheck(worldWidth, worldHeight);

    if (this.fuel <= 0) {
      this.isAccelerating = false;
      this.isTurning = false;
    }

    return { acceleration };
  }

  private deductFuel(dt: number): void {
    if (this.isRefueling) {
      this.fuel = Math.min(this.maxFuel, this.fuel + this.refuelRate * dt);
      this.isRefueling = false;
      return;
    }

    if (this.fuel <= 0) return;

    let consumption = 0;
    if (this.isAccelerating) {
      consumption += this.accelerationConsumption * dt;
    }
    if (this.isTurning) {
      consumption += this.turnConsumption * dt;
    }

    if (consumption > 0) {
      this.fuel = Math.max(0, this.fuel - consumption);
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= dt;
      particle.position = Vector2Utils.add(
        particle.position,
        Vector2Utils.mul(particle.velocity, dt)
      );
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.isAccelerating) {
      this.emitEngineParticles();
    }
  }

  private emitEngineParticles(): void {
    const particleCount = Math.floor(Math.random() * 4) + 5;

    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const backAngle = this.angle + Math.PI;
      const spread = (Math.random() - 0.5) * 0.5;
      const particleAngle = backAngle + spread;

      const speed = 30 + Math.random() * 40;
      const velocity = Vector2Utils.fromAngle(particleAngle, speed);

      const offset = Vector2Utils.fromAngle(backAngle, this.radius + 2);
      const position = Vector2Utils.add(this.position, offset);

      const accelRatio = 1;
      const color = this.interpolateColor('#3b82f6', '#f97316', accelRatio);

      this.particles.push({
        position,
        velocity,
        life: 0.3,
        maxLife: 0.3,
        size: 3 + Math.random() * 2,
        startColor: color,
        endColor: '#ffffff'
      });
    }
  }

  private interpolateColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);

    return `rgb(${r}, ${g}, ${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  private updateRipples(dt: number): void {
    for (let i = this.rippleEffects.length - 1; i >= 0; i--) {
      const ripple = this.rippleEffects[i];
      ripple.life -= dt;
      const t = 1 - ripple.life / 0.5;
      ripple.radius = 10 + 30 * t;
      ripple.alpha = 0.8 * (1 - t);
      if (ripple.life <= 0) {
        this.rippleEffects.splice(i, 1);
      }
    }
  }

  addRipple(position: Vector2): void {
    this.rippleEffects.push({
      position: Vector2Utils.clone(position),
      radius: 10,
      maxRadius: 40,
      alpha: 0.8,
      life: 0.5
    });
  }

  private boundaryCheck(width: number, height: number): void {
    const margin = 20;
    if (this.position.x < margin) {
      this.position.x = margin;
      this.velocity.x = Math.abs(this.velocity.x) * 0.5;
    }
    if (this.position.x > width - margin) {
      this.position.x = width - margin;
      this.velocity.x = -Math.abs(this.velocity.x) * 0.5;
    }
    if (this.position.y < margin) {
      this.position.y = margin;
      this.velocity.y = Math.abs(this.velocity.y) * 0.5;
    }
    if (this.position.y > height - margin) {
      this.position.y = height - margin;
      this.velocity.y = -Math.abs(this.velocity.y) * 0.5;
    }
  }

  addResource(type: ResourceType, amount: number): void {
    const current = this.resources.get(type) || 0;
    this.resources.set(type, current + amount);
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getRipples(): RippleEffect[] {
    return this.rippleEffects;
  }

  getSpeed(): number {
    return Vector2Utils.length(this.velocity);
  }

  getDistanceToTarget(): number {
    const target = this.getCurrentTarget();
    if (!target) return 0;
    return Vector2Utils.distance(this.position, target);
  }

  getFuelPercentage(): number {
    return (this.fuel / this.maxFuel) * 100;
  }

  getTotalResources(): number {
    let total = 0;
    this.resources.forEach(amount => total += amount);
    return total;
  }
}
