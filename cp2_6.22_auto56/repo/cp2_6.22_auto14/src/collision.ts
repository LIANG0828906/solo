import * as THREE from 'three';
import { Galaxy, StarData } from './galaxy';

export interface CollisionParams {
  gravitationalConstant: number;
  softeningFactor: number;
  damping: number;
}

export class CollisionSystem {
  public galaxy1: Galaxy;
  public galaxy2: Galaxy;
  public params: CollisionParams;
  public time: number = 0;
  
  private _allStars: StarData[] = [];

  constructor(galaxy1: Galaxy, galaxy2: Galaxy, params?: Partial<CollisionParams>) {
    this.galaxy1 = galaxy1;
    this.galaxy2 = galaxy2;
    this.params = {
      gravitationalConstant: 50,
      softeningFactor: 5,
      damping: 0.001,
      ...params
    };

    this._updateAllStars();
  }

  private _updateAllStars(): void {
    this._allStars = [...this.galaxy1.stars, ...this.galaxy2.stars];
  }

  public setGalaxies(galaxy1: Galaxy, galaxy2: Galaxy): void {
    this.galaxy1 = galaxy1;
    this.galaxy2 = galaxy2;
    this._updateAllStars();
  }

  public update(dt: number): void {
    this.time += dt;

    this.updateGalaxyCenters(dt);
    this.updateStars(dt);
    
    this.galaxy1.updateGeometry();
    this.galaxy2.updateGeometry();
    
    this.galaxy1.updateHeatmap();
    this.galaxy2.updateHeatmap();
  }

  private updateGalaxyCenters(dt: number): void {
    const { gravitationalConstant } = this.params;
    
    const diff = new THREE.Vector3().subVectors(this.galaxy2.center, this.galaxy1.center);
    const distance = diff.length();
    
    if (distance < 1) return;

    const forceMagnitude = gravitationalConstant * this.galaxy1.mass * this.galaxy2.mass / (distance * distance);
    const forceDir = diff.normalize();

    const acceleration1 = forceMagnitude / this.galaxy1.mass;
    const acceleration2 = forceMagnitude / this.galaxy2.mass;

    this.galaxy1.velocity.add(forceDir.clone().multiplyScalar(acceleration1 * dt));
    this.galaxy2.velocity.add(forceDir.clone().multiplyScalar(-acceleration2 * dt));

    this.galaxy1.center.add(this.galaxy1.velocity.clone().multiplyScalar(dt));
    this.galaxy2.center.add(this.galaxy2.velocity.clone().multiplyScalar(dt));
  }

  private updateStars(dt: number): void {
    const { gravitationalConstant, softeningFactor, damping } = this.params;

    for (const star of this.galaxy1.stars) {
      this.applyGravityFromGalaxy(star, this.galaxy2, dt, gravitationalConstant, softeningFactor);
    }

    for (const star of this.galaxy2.stars) {
      this.applyGravityFromGalaxy(star, this.galaxy1, dt, gravitationalConstant, softeningFactor);
    }

    for (const star of this.galaxy1.stars) {
      star.position.add(star.velocity.clone().multiplyScalar(dt));
      star.velocity.multiplyScalar(1 - damping);
    }

    for (const star of this.galaxy2.stars) {
      star.position.add(star.velocity.clone().multiplyScalar(dt));
      star.velocity.multiplyScalar(1 - damping);
    }
  }

  private applyGravityFromGalaxy(
    star: StarData,
    otherGalaxy: Galaxy,
    dt: number,
    G: number,
    softening: number
  ): void {
    const starWorldPos = star.position.clone().add(
      star === this.galaxy1.stars.find(s => s === star) ? this.galaxy1.center : this.galaxy2.center
    );

    const diff = new THREE.Vector3().subVectors(otherGalaxy.center, starWorldPos);
    const distance = diff.length();
    const softenedDistance = Math.sqrt(distance * distance + softening * softening);

    const forceMagnitude = G * otherGalaxy.mass * star.mass / (softenedDistance * softenedDistance);
    const acceleration = forceMagnitude / star.mass;
    const forceDir = diff.normalize();

    star.velocity.add(forceDir.multiplyScalar(acceleration * dt));
  }

  public calculateTotalEnergy(): { kinetic: number; potential: number; total: number } {
    const kinetic1 = this.galaxy1.calculateKineticEnergy();
    const kinetic2 = this.galaxy2.calculateKineticEnergy();
    const kinetic = kinetic1 + kinetic2;

    const { gravitationalConstant } = this.params;
    const distance = this.galaxy1.center.distanceTo(this.galaxy2.center);
    const potential = -gravitationalConstant * this.galaxy1.mass * this.galaxy2.mass / Math.max(distance, 1);

    return {
      kinetic,
      potential,
      total: kinetic + potential
    };
  }

  public reset(): void {
    this.time = 0;
  }
}
