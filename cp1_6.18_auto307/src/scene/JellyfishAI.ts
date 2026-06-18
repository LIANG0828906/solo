import * as THREE from 'three';

const TENTACLE_COUNT = 10;
const TENTACLE_SEGMENTS = 20;
const TENTACLE_LENGTH = 2.5;
const WAVE_FREQUENCY = 0.5;
const WAVE_AMPLITUDE = 0.2;
const MIN_SPEED = 0.05;
const MAX_SPEED = 0.1;
const MIN_DISTANCE = 1.5;
const TURN_SPEED = 0.3;
const COLOR_TRANSITION_DURATION = 3;
const BURST_DURATION = 1;
const BURST_SPEED_MULTIPLIER = 4;

export class JellyfishAI {
  private position: THREE.Vector3;
  private velocity: THREE.Vector3;
  private targetDirection: THREE.Vector3;
  private speed: number;
  private color: THREE.Color;
  private previousColor: THREE.Color;
  private colorTransitionProgress: number;
  private age: number;
  private burstPhase: boolean;
  private burstDirection: THREE.Vector3;
  private tentacleBaseAngles: number[];
  private tentaclePhases: number[];
  private wanderTimer: number;
  private wanderDirection: THREE.Vector3;

  constructor(initialPosition?: THREE.Vector3, initialColor?: string) {
    this.position = initialPosition?.clone() || new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.targetDirection = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 2
    ).normalize();
    this.speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    this.color = new THREE.Color(initialColor || '#00BCD4');
    this.previousColor = this.color.clone();
    this.colorTransitionProgress = 1;
    this.age = 0;
    this.burstPhase = true;
    this.burstDirection = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    this.tentacleBaseAngles = [];
    this.tentaclePhases = [];
    for (let i = 0; i < TENTACLE_COUNT; i++) {
      this.tentacleBaseAngles.push((i / TENTACLE_COUNT) * Math.PI * 2);
      this.tentaclePhases.push(Math.random() * Math.PI * 2);
    }
    this.wanderTimer = 0;
    this.wanderDirection = this.targetDirection.clone();
  }

  setTargetColor(newColor: string): void {
    this.previousColor = this.color.clone();
    this.color.set(newColor);
    this.colorTransitionProgress = 0;
  }

  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  getColor(): THREE.Color {
    if (this.colorTransitionProgress >= 1) {
      return this.color.clone();
    }
    const t = this.colorTransitionProgress;
    const r = this.previousColor.r + (this.color.r - this.previousColor.r) * t;
    const g = this.previousColor.g + (this.color.g - this.previousColor.g) * t;
    const b = this.previousColor.b + (this.color.b - this.previousColor.b) * t;
    return new THREE.Color(r, g, b);
  }

  getTentaclePoints(): THREE.Vector3[][] {
    const tentacles: THREE.Vector3[][] = [];
    const time = this.age;

    for (let i = 0; i < TENTACLE_COUNT; i++) {
      const points: THREE.Vector3[] = [];
      const baseAngle = this.tentacleBaseAngles[i];
      const phase = this.tentaclePhases[i];

      for (let j = 0; j <= TENTACLE_SEGMENTS; j++) {
        const t = j / TENTACLE_SEGMENTS;
        const length = t * TENTACLE_LENGTH;
        const wave = Math.sin(time * WAVE_FREQUENCY * Math.PI * 2 + phase + t * 3) * WAVE_AMPLITUDE * t;
        const wave2 = Math.cos(time * WAVE_FREQUENCY * Math.PI * 2 * 0.7 + phase * 1.3 + t * 2) * WAVE_AMPLITUDE * 0.5 * t;

        const x = Math.cos(baseAngle) * 0.3 * (1 - t * 0.5) + wave * Math.cos(baseAngle + Math.PI / 2);
        const y = -length - Math.abs(wave) * 0.3;
        const z = Math.sin(baseAngle) * 0.3 * (1 - t * 0.5) + wave * Math.sin(baseAngle + Math.PI / 2) + wave2;

        const point = new THREE.Vector3(
          this.position.x + x,
          this.position.y + y,
          this.position.z + z
        );
        points.push(point);
      }

      tentacles.push(points);
    }

    return tentacles;
  }

  getTentacleCurves(): THREE.CatmullRomCurve3[] {
    const tentaclePoints = this.getTentaclePoints();
    return tentaclePoints.map(
      (points) => new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
    );
  }

  update(
    deltaTime: number,
    allJellyfish: JellyfishAI[],
    lightTrailPoints: THREE.Vector3[]
  ): void {
    this.age += deltaTime;

    if (this.colorTransitionProgress < 1) {
      this.colorTransitionProgress = Math.min(
        1,
        this.colorTransitionProgress + deltaTime / COLOR_TRANSITION_DURATION
      );
    }

    if (this.burstPhase && this.age < BURST_DURATION) {
      const burstProgress = this.age / BURST_DURATION;
      const speedMultiplier = BURST_SPEED_MULTIPLIER * (1 - burstProgress) + 1;
      this.velocity.copy(this.burstDirection).multiplyScalar(this.speed * speedMultiplier);
      this.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
      return;
    }
    this.burstPhase = false;

    this.wanderTimer -= deltaTime;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 2 + Math.random() * 3;
      this.wanderDirection.set(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 2
      ).normalize();
    }

    const desiredDirection = new THREE.Vector3();
    let weightSum = 0;

    const wanderWeight = 0.3;
    desiredDirection.add(this.wanderDirection.clone().multiplyScalar(wanderWeight));
    weightSum += wanderWeight;

    if (lightTrailPoints && lightTrailPoints.length > 0) {
      const nearestTrail = this.findNearestPoint(lightTrailPoints);
      if (nearestTrail) {
        const toTrail = nearestTrail.clone().sub(this.position);
        const dist = toTrail.length();
        if (dist > 0.1) {
          toTrail.normalize();
          const trailWeight = Math.min(0.6, 3 / Math.max(dist, 1));
          desiredDirection.add(toTrail.multiplyScalar(trailWeight));
          weightSum += trailWeight;
        }
      }
    }

    for (const other of allJellyfish) {
      if (other === this) continue;
      const toOther = other.position.clone().sub(this.position);
      const dist = toOther.length();
      if (dist < MIN_DISTANCE && dist > 0.001) {
        const repelStrength = (MIN_DISTANCE - dist) / MIN_DISTANCE;
        toOther.normalize().multiplyScalar(-repelStrength * 0.8);
        desiredDirection.add(toOther);
        weightSum += 0.8;
      }
    }

    if (weightSum > 0) {
      desiredDirection.divideScalar(weightSum).normalize();
    } else {
      desiredDirection.copy(this.wanderDirection);
    }

    this.targetDirection.lerp(desiredDirection, TURN_SPEED * deltaTime * 60).normalize();

    this.velocity.copy(this.targetDirection).multiplyScalar(this.speed);
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));

    this.position.x = Math.max(-20, Math.min(20, this.position.x));
    this.position.y = Math.max(-6, Math.min(6, this.position.y));
    this.position.z = Math.max(-20, Math.min(20, this.position.z));

    if (Math.abs(this.position.x) >= 19.5) {
      this.targetDirection.x *= -1;
      this.wanderDirection.x *= -1;
    }
    if (Math.abs(this.position.y) >= 5.5) {
      this.targetDirection.y *= -1;
      this.wanderDirection.y *= -1;
    }
    if (Math.abs(this.position.z) >= 19.5) {
      this.targetDirection.z *= -1;
      this.wanderDirection.z *= -1;
    }
  }

  private findNearestPoint(points: THREE.Vector3[]): THREE.Vector3 | null {
    if (points.length === 0) return null;
    let nearest = points[0];
    let minDist = this.position.distanceTo(nearest);
    for (let i = 1; i < points.length; i++) {
      const dist = this.position.distanceTo(points[i]);
      if (dist < minDist) {
        minDist = dist;
        nearest = points[i];
      }
    }
    return nearest;
  }
}
