import type { Vector2, Ship, Asteroid, EnergyOrb, ThrustInput } from '../types';

const GRAVITY_STRENGTH = 0.0008;
const MAX_THRUST = 0.35;
const FRICTION_DAMPING = 0.999;
const ANGULAR_DAMPING = 0.98;
const ROTATION_SPEED = 0.003;
const SHIP_RADIUS = 15;

export class PhysicsEngine {
  private canvasWidth: number;
  private canvasHeight: number;
  private gravityCenter: Vector2;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.gravityCenter = { x: width / 2, y: height / 2 };
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.gravityCenter = { x: width / 2, y: height / 2 };
  }

  createShip(): Ship {
    return {
      position: { x: this.canvasWidth * 0.3, y: this.canvasHeight * 0.6 },
      velocity: { x: 0, y: 0 },
      angle: -Math.PI / 2,
      angularVelocity: 0,
      armor: 100,
      maxArmor: 100,
      energy: 0,
      maxEnergy: 100,
      shieldActive: false,
      shieldTimer: 0,
      radius: SHIP_RADIUS,
    };
  }

  updateShip(ship: Ship, thrust: ThrustInput, deltaTime: number): void {
    const dt = deltaTime / 16.67;

    if (thrust.magnitude > 0) {
      const targetAngle = thrust.angle;
      let angleDiff = targetAngle - ship.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      ship.angularVelocity = angleDiff * ROTATION_SPEED * thrust.magnitude * dt;
    } else {
      ship.angularVelocity *= ANGULAR_DAMPING;
    }
    ship.angle += ship.angularVelocity * dt;

    const gravityAccel = this.calculateGravity(ship.position);
    const thrustAccel = this.calculateThrust(ship.angle, thrust.magnitude);

    ship.velocity.x += (gravityAccel.x + thrustAccel.x) * dt;
    ship.velocity.y += (gravityAccel.y + thrustAccel.y) * dt;

    ship.velocity.x *= FRICTION_DAMPING;
    ship.velocity.y *= FRICTION_DAMPING;

    ship.position.x += ship.velocity.x * dt;
    ship.position.y += ship.velocity.y * dt;

    this.wrapPosition(ship.position);

    if (ship.shieldActive) {
      ship.shieldTimer -= deltaTime;
      if (ship.shieldTimer <= 0) {
        ship.shieldActive = false;
      }
    }
  }

  private calculateGravity(position: Vector2): Vector2 {
    const dx = this.gravityCenter.x - position.x;
    const dy = this.gravityCenter.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) return { x: 0, y: 0 };

    const strength = distance * GRAVITY_STRENGTH;
    return {
      x: (dx / distance) * strength,
      y: (dy / distance) * strength,
    };
  }

  private calculateThrust(angle: number, magnitude: number): Vector2 {
    return {
      x: Math.cos(angle) * MAX_THRUST * magnitude,
      y: Math.sin(angle) * MAX_THRUST * magnitude,
    };
  }

  private wrapPosition(position: Vector2): void {
    const margin = 50;
    if (position.x < -margin) position.x = this.canvasWidth + margin;
    if (position.x > this.canvasWidth + margin) position.x = -margin;
    if (position.y < -margin) position.y = this.canvasHeight + margin;
    if (position.y > this.canvasHeight + margin) position.y = -margin;
  }

  updateAsteroids(asteroids: Asteroid[], deltaTime: number): void {
    const dt = deltaTime / 16.67;
    for (const asteroid of asteroids) {
      const gravity = this.calculateGravity(asteroid.position);
      asteroid.velocity.x += gravity.x * dt * 0.3;
      asteroid.velocity.y += gravity.y * dt * 0.3;

      asteroid.position.x += asteroid.velocity.x * dt;
      asteroid.position.y += asteroid.velocity.y * dt;
      asteroid.rotation += asteroid.rotationSpeed * dt;

      this.wrapPosition(asteroid.position);
    }
  }

  checkShipAsteroidCollision(ship: Ship, asteroids: Asteroid[]): { hit: boolean; damage: number; asteroid: Asteroid | null } {
    if (ship.shieldActive) return { hit: false, damage: 0, asteroid: null };

    for (const asteroid of asteroids) {
      const dx = ship.position.x - asteroid.position.x;
      const dy = ship.position.y - asteroid.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = ship.radius + asteroid.radius;

      if (distance < minDistance) {
        const relVelocity = Math.sqrt(
          Math.pow(ship.velocity.x - asteroid.velocity.x, 2) +
          Math.pow(ship.velocity.y - asteroid.velocity.y, 2)
        );
        const damage = Math.min(30, Math.max(5, relVelocity * 2));
        return { hit: true, damage, asteroid };
      }
    }
    return { hit: false, damage: 0, asteroid: null };
  }

  checkShipEnergyOrbCollision(ship: Ship, orbs: EnergyOrb[]): EnergyOrb | null {
    for (const orb of orbs) {
      if (orb.collected) continue;

      const dx = ship.position.x - orb.position.x;
      const dy = ship.position.y - orb.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = ship.radius + orb.radius;

      if (distance < minDistance) {
        return orb;
      }
    }
    return null;
  }

  checkShipStationCollision(ship: Ship, stationPos: Vector2, stationRadius: number): boolean {
    const dx = ship.position.x - stationPos.x;
    const dy = ship.position.y - stationPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < stationRadius + ship.radius;
  }
}
