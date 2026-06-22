export interface Vector2 {
  x: number;
  y: number;
}

export interface AABB {
  min: Vector2;
  max: Vector2;
}

export interface Projectile {
  position: Vector2;
  velocity: Vector2;
  radius: number;
}

export interface Fragment {
  position: Vector2;
  velocity: Vector2;
  rotation: number;
  angularVelocity: number;
  mass: number;
}

export class PhysicsEngine {
  public static readonly GRAVITY: number = 9.8;

  public static calculateTrajectory(
    angle: number,
    power: number,
    startPos: Vector2
  ): Vector2[] {
    const points: Vector2[] = [];
    const rad: number = (angle * Math.PI) / 180;
    const v0x: number = power * Math.cos(rad);
    const v0y: number = power * Math.sin(rad);
    const totalTime: number = (2 * v0y) / PhysicsEngine.GRAVITY;
    const timeStep: number = totalTime / 29;

    for (let i: number = 0; i < 30; i++) {
      const t: number = i * timeStep;
      const x: number = startPos.x + v0x * t;
      const y: number = startPos.y + v0y * t - 0.5 * PhysicsEngine.GRAVITY * t * t;
      points.push({ x, y });
    }

    return points;
  }

  public static updateProjectile(projectile: Projectile, deltaTime: number): void {
    projectile.velocity.y += PhysicsEngine.GRAVITY * deltaTime;
    projectile.position.x += projectile.velocity.x * deltaTime;
    projectile.position.y += projectile.velocity.y * deltaTime;
  }

  public static checkAABBCollision(a: AABB, b: AABB): boolean {
    return (
      a.min.x <= b.max.x &&
      a.max.x >= b.min.x &&
      a.min.y <= b.max.y &&
      a.max.y >= b.min.y
    );
  }

  public static applyExplosionForce(
    center: Vector2,
    radius: number,
    force: number,
    fragments: Fragment[]
  ): void {
    for (const fragment of fragments) {
      const dx: number = fragment.position.x - center.x;
      const dy: number = fragment.position.y - center.y;
      const distance: number = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius && distance > 0) {
        const attenuation: number = 1 - distance / radius;
        const nx: number = dx / distance;
        const ny: number = dy / distance;
        const explosionForce: number = force * attenuation;

        fragment.velocity.x += (explosionForce * nx) / fragment.mass;
        fragment.velocity.y += (explosionForce * ny) / fragment.mass;
        fragment.angularVelocity += explosionForce * (Math.random() - 0.5) * 2;
      }
    }
  }

  public static updateFragment(fragment: Fragment, deltaTime: number): void {
    fragment.velocity.y += PhysicsEngine.GRAVITY * deltaTime;
    fragment.velocity.x *= 0.99;
    fragment.velocity.y *= 0.99;
    fragment.position.x += fragment.velocity.x * deltaTime;
    fragment.position.y += fragment.velocity.y * deltaTime;
    fragment.rotation += fragment.angularVelocity * deltaTime;
    fragment.angularVelocity *= 0.95;
  }
}
