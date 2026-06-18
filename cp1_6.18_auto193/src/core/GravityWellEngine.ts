import type { Vector2D, Planet, Spaceship, SlingshotEvent } from '../types';
import { MathUtils } from '../utils/MathUtils';

export class GravityWellEngine {
  private currentWellId: number | null = null;
  private enterVelocity: Vector2D | null = null;

  update(
    spaceship: Spaceship,
    planets: Planet[],
    deltaTime: number,
    currentTime: number
  ): { acceleration: Vector2D; events: SlingshotEvent[] } {
    let totalAcceleration: Vector2D = { x: 0, y: 0 };
    const events: SlingshotEvent[] = [];
    let inAnyWell = false;

    for (const planet of planets) {
      const distSq = MathUtils.distanceSq(spaceship.position, planet.position);
      const wellRadiusSq = planet.gravityWell.radius * planet.gravityWell.radius;

      if (distSq < wellRadiusSq) {
        inAnyWell = true;
        
        const direction = MathUtils.normalize(
          MathUtils.sub(planet.position, spaceship.position)
        );
        
        const accelerationMagnitude = (planet.gravityWell.strength * planet.radius) / (distSq / 100);
        const acceleration = MathUtils.mul(direction, accelerationMagnitude);
        MathUtils.addInPlace(totalAcceleration, acceleration);

        if (!spaceship.isInGravityWell && this.currentWellId === null) {
          this.currentWellId = planet.id;
          this.enterVelocity = { ...spaceship.velocity };
          events.push({
            planetId: planet.id,
            enterTime: currentTime,
            enterVelocity: { ...spaceship.velocity },
            velocityBoost: { x: 0, y: 0 }
          });
        }
      }
    }

    if (!inAnyWell && spaceship.isInGravityWell && this.currentWellId !== null) {
      if (this.enterVelocity) {
        const exitVelocity = { ...spaceship.velocity };
        const velocityBoost = MathUtils.sub(exitVelocity, this.enterVelocity);
        
        MathUtils.addInPlace(spaceship.velocity, velocityBoost);
        
        events.push({
          planetId: this.currentWellId,
          enterTime: currentTime - deltaTime,
          enterVelocity: this.enterVelocity,
          exitTime: currentTime,
          velocityBoost
        });
      }
      this.currentWellId = null;
      this.enterVelocity = null;
    }

    spaceship.isInGravityWell = inAnyWell;

    return { acceleration: totalAcceleration, events };
  }

  reset(): void {
    this.currentWellId = null;
    this.enterVelocity = null;
  }
}
