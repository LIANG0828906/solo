import * as THREE from 'three';

export class WindField {
  private direction: number = 0;
  private strength: number = 5;
  private targetDirection: number = 0;
  private transitionSpeed: number = 2.0;

  setDirection(angleDeg: number): void {
    this.targetDirection = angleDeg;
  }

  setStrength(s: number): void {
    this.strength = s;
  }

  getDirection(): number {
    return this.direction;
  }

  getStrength(): number {
    return this.strength;
  }

  update(dt: number): void {
    let diff = this.targetDirection - this.direction;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    const step = this.transitionSpeed * dt * 60;
    if (Math.abs(diff) < step) {
      this.direction = this.targetDirection;
    } else {
      this.direction += Math.sign(diff) * step;
    }
    while (this.direction < 0) this.direction += 360;
    while (this.direction >= 360) this.direction -= 360;
  }

  getWindVector(): THREE.Vector3 {
    const rad = THREE.MathUtils.degToRad(this.direction);
    return new THREE.Vector3(
      Math.sin(rad) * this.strength * 0.05,
      0,
      Math.cos(rad) * this.strength * 0.05
    );
  }

  getTiltAngles(): { x: number; z: number } {
    const rad = THREE.MathUtils.degToRad(this.direction);
    const maxTilt = THREE.MathUtils.degToRad(20);
    const tiltFactor = Math.min(this.strength / 10, 1);
    const tiltAmount = maxTilt * tiltFactor;
    return {
      x: -Math.cos(rad) * tiltAmount,
      z: Math.sin(rad) * tiltAmount,
    };
  }
}
