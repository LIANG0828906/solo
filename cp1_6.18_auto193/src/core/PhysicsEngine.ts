import type { Vector2D, Planet, Asteroid, GameState, ControlState } from '../types';
import { MathUtils } from '../utils/MathUtils';
import { GravityWellEngine } from './GravityWellEngine';

const FRICTION = 0.98;
const THRUST_POWER = 0.15;
const TURN_SPEED = Math.PI / 12;
const TRAIL_MAX_LENGTH = 50;

export class PhysicsEngine {
  private gravityWellEngine: GravityWellEngine;

  constructor() {
    this.gravityWellEngine = new GravityWellEngine();
  }

  update(
    gameState: GameState,
    controlState: ControlState,
    deltaTime: number,
    currentTime: number
  ): void {
    if (gameState.status !== 'playing') {
      return;
    }

    this.updatePlanets(gameState.planets, deltaTime);
    this.updateAsteroids(gameState.asteroids, deltaTime);
    this.updateSpaceship(gameState, controlState, deltaTime, currentTime);
    this.checkCollisions(gameState);
    this.checkFinishLine(gameState);
  }

  private updatePlanets(planets: Planet[], deltaTime: number): void {
    for (const planet of planets) {
      planet.orbit.angle += planet.orbit.speed * deltaTime * 60;
      planet.position.x = planet.orbit.centerX + Math.cos(planet.orbit.angle) * planet.orbit.semiMajor;
      planet.position.y = planet.orbit.centerY + Math.sin(planet.orbit.angle) * planet.orbit.semiMinor;
      planet.rotation += 0.5 * Math.PI / 180 * deltaTime * 60;
    }
  }

  private updateAsteroids(asteroids: Asteroid[], deltaTime: number): void {
    for (const asteroid of asteroids) {
      MathUtils.addInPlace(asteroid.position, MathUtils.mul(asteroid.velocity, deltaTime * 60));
    }
  }

  private updateSpaceship(
    gameState: GameState,
    controlState: ControlState,
    deltaTime: number,
    currentTime: number
  ): void {
    const spaceship = gameState.spaceship;

    if (controlState.turnLeft) {
      spaceship.angle -= TURN_SPEED * deltaTime * 60;
    }
    if (controlState.turnRight) {
      spaceship.angle += TURN_SPEED * deltaTime * 60;
    }

    if (controlState.accelerate) {
      spaceship.thrust = Math.min(1, spaceship.thrust + 0.05 * deltaTime * 60);
    } else if (controlState.decelerate) {
      spaceship.thrust = Math.max(0, spaceship.thrust - 0.05 * deltaTime * 60);
    } else {
      spaceship.thrust *= Math.pow(FRICTION, deltaTime * 60);
    }

    const thrustDirection = MathUtils.fromAngle(spaceship.angle);
    const thrustAcceleration = MathUtils.mul(thrustDirection, spaceship.thrust * THRUST_POWER * deltaTime * 60);
    MathUtils.addInPlace(spaceship.velocity, thrustAcceleration);

    const gravityResult = this.gravityWellEngine.update(
      spaceship,
      gameState.planets,
      deltaTime,
      currentTime
    );

    if (gravityResult.events.length > 0) {
      gameState.slingshotEvents.push(...gravityResult.events);
    }

    MathUtils.addInPlace(spaceship.velocity, MathUtils.mul(gravityResult.acceleration, deltaTime * 60));

    if (spaceship.thrust < 0.01 && !spaceship.isInGravityWell) {
      MathUtils.mulInPlace(spaceship.velocity, Math.pow(FRICTION, deltaTime * 60));
    }

    MathUtils.addInPlace(spaceship.position, MathUtils.mul(spaceship.velocity, deltaTime * 60));

    spaceship.trail.push({ ...spaceship.position });
    if (spaceship.trail.length > TRAIL_MAX_LENGTH) {
      spaceship.trail.shift();
    }

    this.wrapAround(spaceship.position, 0, 0, window.innerWidth, window.innerHeight);
  }

  private wrapAround(position: Vector2D, minX: number, minY: number, maxX: number, maxY: number): void {
    if (position.x < minX) position.x = maxX;
    if (position.x > maxX) position.x = minX;
    if (position.y < minY) position.y = maxY;
    if (position.y > maxY) position.y = minY;
  }

  private checkCollisions(gameState: GameState): void {
    const spaceship = gameState.spaceship;
    const shipRadius = 20;

    for (const asteroid of gameState.asteroids) {
      const distSq = MathUtils.distanceSq(spaceship.position, asteroid.position);
      const minDist = shipRadius + asteroid.radius;
      if (distSq < minDist * minDist) {
        gameState.status = 'failed';
        return;
      }
    }
  }

  private checkFinishLine(gameState: GameState): void {
    if (gameState.spaceship.position.x >= gameState.finishLineX) {
      gameState.status = 'victory';
      const speed = MathUtils.length(gameState.spaceship.velocity);
      gameState.score = Math.floor(speed * 10);
    }
  }

  reset(): void {
    this.gravityWellEngine.reset();
  }
}
