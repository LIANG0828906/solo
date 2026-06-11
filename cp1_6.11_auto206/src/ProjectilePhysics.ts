import * as THREE from 'three';

export class ProjectilePhysics {
  weight: number = 300;
  leverRatio: number = 0.5;
  angle: number = 45;
  gravity: number = 9.8;

  private readonly LEVER_LENGTH = 8;
  private readonly PROJECTILE_MASS = 10;
  private readonly ENERGY_TRANSFER_EFFICIENCY = 0.35;

  setWeight(kg: number): void {
    this.weight = Math.max(100, Math.min(500, kg));
  }

  setLeverPosition(ratio: number): void {
    this.leverRatio = Math.max(0.4, Math.min(0.7, ratio));
  }

  setAngle(deg: number): void {
    this.angle = Math.max(30, Math.min(75, deg));
  }

  calculateInitialVelocity(): THREE.Vector3 {
    const shortArm = this.LEVER_LENGTH * this.leverRatio;
    const longArm = this.LEVER_LENGTH * (1 - this.leverRatio);

    const heightDrop = shortArm * (1 - Math.cos((this.angle * Math.PI) / 180));
    const potentialEnergy = this.weight * this.gravity * heightDrop;

    const transferedEnergy = potentialEnergy * this.ENERGY_TRANSFER_EFFICIENCY;
    const speed = Math.sqrt((2 * transferedEnergy) / this.PROJECTILE_MASS);

    const launchAngleRad = (this.angle * Math.PI) / 180;
    const vx = speed * Math.cos(launchAngleRad);
    const vy = speed * Math.sin(launchAngleRad);

    return new THREE.Vector3(0, vy, -vx);
  }

  getTrajectoryPoints(
    startPos: THREE.Vector3,
    timeStep: number = 0.02
  ): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const velocity = this.calculateInitialVelocity();
    let t = 0;
    const maxTime = 15;

    while (t < maxTime) {
      const x = startPos.x + velocity.x * t;
      const y = startPos.y + velocity.y * t - 0.5 * this.gravity * t * t;
      const z = startPos.z + velocity.z * t;

      points.push(new THREE.Vector3(x, y, z));

      if (y <= 0 && t > 0.1) {
        break;
      }

      t += timeStep;
    }

    if (points.length > 0 && points[points.length - 1].y > 0) {
      const last = points[points.length - 1];
      points.push(new THREE.Vector3(last.x, 0, last.z));
    }

    return points;
  }

  getImpactPoint(startPos: THREE.Vector3): THREE.Vector3 {
    const velocity = this.calculateInitialVelocity();
    const vy0 = velocity.y;
    const y0 = startPos.y;

    const discriminant = vy0 * vy0 + 2 * this.gravity * y0;
    if (discriminant < 0) {
      return new THREE.Vector3(startPos.x, 0, startPos.z);
    }

    const t = (vy0 + Math.sqrt(discriminant)) / this.gravity;

    const x = startPos.x + velocity.x * t;
    const z = startPos.z + velocity.z * t;

    return new THREE.Vector3(x, 0, z);
  }

  getImpactDistance(startPos: THREE.Vector3): number {
    const impact = this.getImpactPoint(startPos);
    const dx = impact.x - startPos.x;
    const dz = impact.z - startPos.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
