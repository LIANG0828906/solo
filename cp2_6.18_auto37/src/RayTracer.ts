import * as THREE from 'three';
import { eventBus } from './EventBus';

export interface RaySegment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  startColor: THREE.Color;
  endColor: THREE.Color;
  intensity: number;
  bounce: number;
}

export interface LightConfig {
  position: THREE.Vector3;
  rayCount: number;
  maxBounces: number;
  maxDistance: number;
  warmColor: THREE.Color;
  coolColor: THREE.Color;
  reflectionDecay: number;
}

export interface ObstacleConfig {
  position: THREE.Vector3;
  size: THREE.Vector3;
}

class RayTracer {
  private lightConfig: LightConfig;
  private obstacleConfig: ObstacleConfig;
  private raySegments: RaySegment[] = [];

  constructor() {
    this.lightConfig = {
      position: new THREE.Vector3(5, 8, 5),
      rayCount: 8,
      maxBounces: 1,
      maxDistance: 15,
      warmColor: new THREE.Color(0xffaa00),
      coolColor: new THREE.Color(0x4488ff),
      reflectionDecay: 0.6,
    };

    this.obstacleConfig = {
      position: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(2, 2, 2),
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on('lightPositionChanged', (x: number, y: number, z: number) => {
      this.lightConfig.position.set(x, y, z);
      this.calculateRays();
    });

    eventBus.on('obstaclePositionChanged', (x: number, y: number, z: number) => {
      this.obstacleConfig.position.set(x, y, z);
      this.calculateRays();
    });

    eventBus.on('rayCountChanged', (count: number) => {
      this.lightConfig.rayCount = count;
      this.calculateRays();
    });

    eventBus.on('bounceCountChanged', (count: number) => {
      this.lightConfig.maxBounces = count;
      this.calculateRays();
    });

    eventBus.on('requestRayRecalculation', () => {
      this.calculateRays();
    });
  }

  calculateRays(): RaySegment[] {
    this.raySegments = [];
    const { position: lightPos, rayCount, maxBounces, maxDistance } = this.lightConfig;

    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const tiltAngle = (i % 3 === 0) ? 0.3 : (i % 3 === 1) ? -0.2 : 0.1;

      const direction = new THREE.Vector3(
        Math.cos(angle) * Math.cos(tiltAngle),
        Math.sin(tiltAngle),
        Math.sin(angle) * Math.cos(tiltAngle)
      ).normalize();

      this.traceRay(lightPos.clone(), direction, 0, 1.0);
    }

    eventBus.emit('raysUpdated', this.raySegments);
    return this.raySegments;
  }

  private traceRay(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    bounce: number,
    intensity: number
  ): void {
    if (bounce > this.lightConfig.maxBounces) return;

    const hitResult = this.intersectBox(
      origin,
      direction,
      this.obstacleConfig.position,
      this.obstacleConfig.size
    );

    const maxDist = this.lightConfig.maxDistance;
    let endPoint: THREE.Vector3;
    let hitObstacle = false;
    let hitNormal = new THREE.Vector3();
    let hitDistance = maxDist;

    if (hitResult && hitResult.distance < maxDist && hitResult.distance > 0.001) {
      endPoint = hitResult.point;
      hitNormal = hitResult.normal;
      hitDistance = hitResult.distance;
      hitObstacle = true;
    } else {
      endPoint = origin.clone().add(direction.clone().multiplyScalar(maxDist));
    }

    const segment = this.createRaySegment(
      origin,
      endPoint,
      intensity,
      bounce,
      hitObstacle
    );
    this.raySegments.push(segment);

    if (hitObstacle && bounce < this.lightConfig.maxBounces) {
      const reflectedDir = direction.clone().reflect(hitNormal).normalize();
      const secondaryIntensity = intensity * this.lightConfig.reflectionDecay;

      for (let j = 0; j < 3; j++) {
        const spreadAngle = (j - 1) * 0.25;
        const spreadDir = this.spreadDirection(reflectedDir, hitNormal, spreadAngle);
        const rayOrigin = endPoint.clone().add(hitNormal.clone().multiplyScalar(0.01));

        this.traceRay(rayOrigin, spreadDir, bounce + 1, secondaryIntensity);
      }
    }
  }

  private spreadDirection(
    baseDir: THREE.Vector3,
    normal: THREE.Vector3,
    angle: number
  ): THREE.Vector3 {
    const tangent = new THREE.Vector3();
    if (Math.abs(normal.x) < 0.9) {
      tangent.set(1, 0, 0);
    } else {
      tangent.set(0, 1, 0);
    }
    tangent.cross(normal).normalize();

    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    const spreadDir = baseDir.clone();
    const rotationMatrix = new THREE.Matrix4().makeRotationAxis(tangent, angle);
    spreadDir.applyMatrix4(rotationMatrix).normalize();

    if (spreadDir.dot(normal) < 0) {
      spreadDir.reflect(normal);
    }

    return spreadDir.normalize();
  }

  private createRaySegment(
    start: THREE.Vector3,
    end: THREE.Vector3,
    intensity: number,
    bounce: number,
    hitsObstacle: boolean
  ): RaySegment {
    let startColor: THREE.Color;
    let endColor: THREE.Color;

    if (bounce === 0) {
      startColor = this.lightConfig.warmColor.clone();
      const coolMix = hitsObstacle ? 0.3 : 0.5;
      endColor = this.lightConfig.warmColor.clone().lerp(
        this.lightConfig.coolColor,
        coolMix * (1 - intensity * 0.5)
      );
    } else {
      startColor = this.lightConfig.coolColor.clone().lerp(
        this.lightConfig.warmColor,
        0.2 * intensity
      );
      endColor = this.lightConfig.coolColor.clone().multiplyScalar(0.5 + intensity * 0.5);
    }

    startColor.multiplyScalar(intensity);
    endColor.multiplyScalar(intensity * 0.6);

    return {
      start: start.clone(),
      end: end.clone(),
      startColor,
      endColor,
      intensity,
      bounce,
    };
  }

  private intersectBox(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    boxCenter: THREE.Vector3,
    boxSize: THREE.Vector3
  ): { point: THREE.Vector3; normal: THREE.Vector3; distance: number } | null {
    const halfSize = boxSize.clone().multiplyScalar(0.5);
    const min = boxCenter.clone().sub(halfSize);
    const max = boxCenter.clone().add(halfSize);

    let tmin = -Infinity;
    let tmax = Infinity;
    let normalMin = new THREE.Vector3();

    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
    for (const axis of axes) {
      if (Math.abs(direction[axis]) < 0.0001) {
        if (origin[axis] < min[axis] || origin[axis] > max[axis]) {
          return null;
        }
      } else {
        let t1 = (min[axis] - origin[axis]) / direction[axis];
        let t2 = (max[axis] - origin[axis]) / direction[axis];

        let normal1 = new THREE.Vector3();
        let normal2 = new THREE.Vector3();

        if (axis === 'x') {
          normal1.set(-1, 0, 0);
          normal2.set(1, 0, 0);
        } else if (axis === 'y') {
          normal1.set(0, -1, 0);
          normal2.set(0, 1, 0);
        } else {
          normal1.set(0, 0, -1);
          normal2.set(0, 0, 1);
        }

        if (t1 > t2) {
          [t1, t2] = [t2, t1];
          [normal1, normal2] = [normal2, normal1];
        }

        if (t1 > tmin) {
          tmin = t1;
          normalMin = direction[axis] < 0 ? normal2.clone() : normal1.clone();
        }
        if (t2 < tmax) {
          tmax = t2;
        }

        if (tmin > tmax) return null;
      }
    }

    if (tmin < 0) return null;

    const hitPoint = origin.clone().add(direction.clone().multiplyScalar(tmin));
    return {
      point: hitPoint,
      normal: normalMin.normalize(),
      distance: tmin,
    };
  }

  getRaySegments(): RaySegment[] {
    return this.raySegments;
  }

  getLightConfig(): LightConfig {
    return { ...this.lightConfig, position: this.lightConfig.position.clone() };
  }

  getObstacleConfig(): ObstacleConfig {
    return {
      position: this.obstacleConfig.position.clone(),
      size: this.obstacleConfig.size.clone(),
    };
  }
}

export const rayTracer = new RayTracer();
export default RayTracer;
