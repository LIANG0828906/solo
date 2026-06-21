import * as THREE from 'three';
import { sceneConfig } from './scene';

const CAR_COLORS = [0xff4444, 0x4488ff, 0x44cc44, 0xffdd44, 0xffffff];
const DOWNGRADE_THRESHOLD = 60;
const DEFAULT_TRAIL_POINTS = 20;
const DOWNGRADE_TRAIL_POINTS = 10;
const FPS_TARGET = 30;
const UPGRADE_HYSTERESIS = 5;

class LightTrail {
  private line: THREE.Line;
  private positions: Float32Array;
  private colors: Float32Array;
  private maxPoints: number;
  private currentCount: number = 0;
  private color: THREE.Color;

  constructor(maxPoints: number, color: THREE.Color) {
    this.maxPoints = maxPoints;
    this.color = color.clone();
    this.positions = new Float32Array(maxPoints * 3);
    this.colors = new Float32Array(maxPoints * 3);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.line = new THREE.Line(geometry, material);
    this.line.frustumCulled = false;
  }

  getMesh(): THREE.Line {
    return this.line;
  }

  addPoint(position: THREE.Vector3): void {
    for (let i = this.maxPoints - 1; i > 0; i--) {
      this.positions[i * 3] = this.positions[(i - 1) * 3];
      this.positions[i * 3 + 1] = this.positions[(i - 1) * 3 + 1];
      this.positions[i * 3 + 2] = this.positions[(i - 1) * 3 + 2];
    }

    this.positions[0] = position.x;
    this.positions[1] = position.y;
    this.positions[2] = position.z;

    this.currentCount = Math.min(this.currentCount + 1, this.maxPoints);
    this.updateColors();

    const geometry = this.line.geometry as THREE.BufferGeometry;
    (geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    geometry.setDrawRange(0, this.currentCount);
  }

  private updateColors(): void {
    for (let i = 0; i < this.currentCount; i++) {
      const alpha = 1 - i / this.maxPoints;
      this.colors[i * 3] = this.color.r * alpha;
      this.colors[i * 3 + 1] = this.color.g * alpha;
      this.colors[i * 3 + 2] = this.color.b * alpha;
    }
  }

  setMaxPoints(points: number): void {
    if (points === this.maxPoints) return;

    this.maxPoints = points;
    this.positions = new Float32Array(points * 3);
    this.colors = new Float32Array(points * 3);
    this.currentCount = 0;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setDrawRange(0, 0);
    this.line.geometry.dispose();
    this.line.geometry = geometry;
  }

  getMaxPoints(): number {
    return this.maxPoints;
  }

  setColor(color: THREE.Color): void {
    this.color = color.clone();
  }

  reset(): void {
    this.currentCount = 0;
    const geometry = this.line.geometry as THREE.BufferGeometry;
    geometry.setDrawRange(0, 0);
  }

  dispose(): void {
    this.line.geometry.dispose();
    (this.line.material as THREE.Material).dispose();
  }
}

class Car {
  public mesh: THREE.Group;
  public speed: number;
  public lane: number;
  public direction: 1 | -1;
  private headlight: THREE.PointLight;
  private taillight: THREE.PointLight;
  public headlightTrail: LightTrail;
  public taillightTrail: LightTrail;
  private headlightColor: THREE.Color;
  private trailPoints: number;
  private trailCounter: number = 0;
  private streetLength: number;
  private carLength: number = 1.5;
  private carWidth: number = 0.8;
  private carHeight: number = 0.8;
  private headlightMesh: THREE.Mesh;
  private taillightMesh: THREE.Mesh;
  private _headlightWorldPos = new THREE.Vector3();
  private _taillightWorldPos = new THREE.Vector3();

  constructor(
    lane: number,
    direction: 1 | -1,
    speed: number,
    headlightColor: THREE.Color,
    trailPoints: number,
    streetLength: number
  ) {
    this.lane = lane;
    this.direction = direction;
    this.speed = speed;
    this.headlightColor = headlightColor.clone();
    this.trailPoints = trailPoints;
    this.streetLength = streetLength;

    this.mesh = new THREE.Group();

    const carColor = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    const bodyGeo = new THREE.BoxGeometry(this.carWidth, this.carHeight, this.carLength);
    const bodyMat = new THREE.MeshStandardMaterial({ color: carColor, metalness: 0.3, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = this.carHeight / 2;
    body.castShadow = true;
    this.mesh.add(body);

    const roofGeo = new THREE.BoxGeometry(this.carWidth * 0.8, this.carHeight * 0.4, this.carLength * 0.5);
    const roofMat = new THREE.MeshStandardMaterial({ color: carColor, metalness: 0.4, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = this.carHeight * 1.1;
    roof.position.z = -this.carLength * 0.1;
    this.mesh.add(roof);

    this.headlight = new THREE.PointLight(headlightColor, 1.5, 20);
    this.headlight.position.set(0, this.carHeight * 0.6, this.carLength / 2 + 0.1);
    this.mesh.add(this.headlight);

    this.taillight = new THREE.PointLight(0xff0000, 1, 15);
    this.taillight.position.set(0, this.carHeight * 0.6, -this.carLength / 2 - 0.1);
    this.mesh.add(this.taillight);

    this.headlightMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      new THREE.MeshBasicMaterial({ color: headlightColor })
    );
    this.headlightMesh.position.copy(this.headlight.position);
    this.mesh.add(this.headlightMesh);

    this.taillightMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    this.taillightMesh.position.copy(this.taillight.position);
    this.mesh.add(this.taillightMesh);

    this.headlightTrail = new LightTrail(trailPoints, headlightColor);
    this.taillightTrail = new LightTrail(trailPoints, new THREE.Color(0xff0000));

    const laneWidth = sceneConfig.streetWidth / sceneConfig.laneCount;
    const xPos = -sceneConfig.streetWidth / 2 + (lane + 0.5) * laneWidth;
    const zStart = direction === 1
      ? -streetLength / 2 - Math.random() * streetLength
      : streetLength / 2 + Math.random() * streetLength;

    this.mesh.position.set(xPos, 0, zStart);
    this.mesh.rotation.y = direction === 1 ? 0 : Math.PI;
  }

  update(delta: number, speedMultiplier: number): void {
    const moveDistance = this.speed * speedMultiplier * delta * 60;
    this.mesh.position.z += moveDistance * this.direction;

    const boundary = this.streetLength / 2 + 10;
    if (this.direction === 1 && this.mesh.position.z > boundary) {
      this.mesh.position.z = -boundary;
      this.headlightTrail.reset();
      this.taillightTrail.reset();
    } else if (this.direction === -1 && this.mesh.position.z < -boundary) {
      this.mesh.position.z = boundary;
      this.headlightTrail.reset();
      this.taillightTrail.reset();
    }

    this.trailCounter++;
    const skipFrames = speedMultiplier < 1.0 ? 2 : 1;
    if (this.trailCounter >= skipFrames) {
      this.trailCounter = 0;

      this.headlight.getWorldPosition(this._headlightWorldPos);
      this.taillight.getWorldPosition(this._taillightWorldPos);

      this.headlightTrail.addPoint(this._headlightWorldPos);
      this.taillightTrail.addPoint(this._taillightWorldPos);
    }
  }

  setHeadlightColor(color: THREE.Color): void {
    this.headlightColor = color.clone();
    this.headlight.color = color;
    (this.headlightMesh.material as THREE.MeshBasicMaterial).color = color;
    this.headlightTrail.setColor(color);
  }

  setTrailPoints(points: number): void {
    if (points === this.trailPoints) return;
    this.trailPoints = points;
    this.headlightTrail.setMaxPoints(points);
    this.taillightTrail.setMaxPoints(points);
  }

  getTrailPoints(): number {
    return this.headlightTrail.getMaxPoints();
  }

  dispose(): void {
    this.headlightTrail.dispose();
    this.taillightTrail.dispose();
    this.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}

export class TrafficSystem {
  private scene: THREE.Scene;
  private cars: Car[] = [];
  private speed: number = 1.5;
  private density: number = 40;
  private headlightColor: THREE.Color = new THREE.Color(0xffffff);
  private isRunning: boolean = false;
  private streetLength: number;
  private trailPoints: number = DEFAULT_TRAIL_POINTS;
  private trailGroup: THREE.Group;
  private currentFps: number = 60;
  private lowFpsFrames: number = 0;
  private highFpsFrames: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.streetLength = sceneConfig.streetLength;
    this.trailGroup = new THREE.Group();
    this.scene.add(this.trailGroup);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.createCars();
    this.updateTrailQualityByDensity();
  }

  stop(): void {
    this.isRunning = false;
  }

  setDensity(density: number): void {
    if (density === this.density) return;
    this.density = density;
    this.recreateCars();
    this.updateTrailQualityByDensity();
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  setHeadlightColor(color: string): void {
    const newColor = new THREE.Color(color);
    this.headlightColor = newColor;
    for (const car of this.cars) {
      car.setHeadlightColor(newColor);
    }
  }

  reportFps(fps: number): void {
    this.currentFps = fps;
  }

  update(delta: number): void {
    if (!this.isRunning) return;

    for (const car of this.cars) {
      car.update(delta, this.speed);
    }

    this.adaptiveQualityAdjustment();
  }

  private adaptiveQualityAdjustment(): void {
    const desiredPoints = this.computeDesiredTrailPoints();

    if (desiredPoints !== this.trailPoints) {
      if (desiredPoints < this.trailPoints) {
        this.lowFpsFrames++;
        if (this.lowFpsFrames >= 10) {
          this.trailPoints = desiredPoints;
          this.applyTrailPointsToAllCars(this.trailPoints);
          this.lowFpsFrames = 0;
          this.highFpsFrames = 0;
        }
      } else {
        this.highFpsFrames++;
        if (this.highFpsFrames >= 60) {
          this.trailPoints = desiredPoints;
          this.applyTrailPointsToAllCars(this.trailPoints);
          this.lowFpsFrames = 0;
          this.highFpsFrames = 0;
        }
      }
    } else {
      this.lowFpsFrames = 0;
      this.highFpsFrames = 0;
    }
  }

  private computeDesiredTrailPoints(): number {
    if (this.density > DOWNGRADE_THRESHOLD) {
      return DOWNGRADE_TRAIL_POINTS;
    }
    if (this.currentFps < FPS_TARGET) {
      return DOWNGRADE_TRAIL_POINTS;
    }
    if (this.currentFps >= FPS_TARGET + UPGRADE_HYSTERESIS) {
      return DEFAULT_TRAIL_POINTS;
    }
    return this.trailPoints;
  }

  private updateTrailQualityByDensity(): void {
    const newPoints = this.density > DOWNGRADE_THRESHOLD ? DOWNGRADE_TRAIL_POINTS : DEFAULT_TRAIL_POINTS;
    if (newPoints !== this.trailPoints) {
      this.trailPoints = newPoints;
      this.applyTrailPointsToAllCars(newPoints);
    }
  }

  private applyTrailPointsToAllCars(points: number): void {
    for (const car of this.cars) {
      car.setTrailPoints(points);
    }
  }

  private createCars(): void {
    const lanesPerDirection = sceneConfig.laneCount / 2;

    for (let i = 0; i < this.density; i++) {
      const direction: 1 | -1 = i % 2 === 0 ? 1 : -1;
      const laneGroup = direction === 1 ? 0 : 1;
      const lane = laneGroup * lanesPerDirection + (i % Math.floor(lanesPerDirection));
      const baseSpeed = 0.7 + Math.random() * 0.6;

      const car = new Car(
        lane,
        direction,
        baseSpeed,
        this.headlightColor,
        this.trailPoints,
        this.streetLength
      );

      this.cars.push(car);
      this.scene.add(car.mesh);
      this.trailGroup.add(car.headlightTrail.getMesh());
      this.trailGroup.add(car.taillightTrail.getMesh());
    }
  }

  private recreateCars(): void {
    for (const car of this.cars) {
      this.scene.remove(car.mesh);
      this.trailGroup.remove(car.headlightTrail.getMesh());
      this.trailGroup.remove(car.taillightTrail.getMesh());
      car.dispose();
    }
    this.cars = [];
    this.createCars();
  }

  getCarCount(): number {
    return this.cars.length;
  }

  getCurrentTrailPoints(): number {
    return this.trailPoints;
  }

  dispose(): void {
    for (const car of this.cars) {
      this.scene.remove(car.mesh);
      this.trailGroup.remove(car.headlightTrail.getMesh());
      this.trailGroup.remove(car.taillightTrail.getMesh());
      car.dispose();
    }
    this.cars = [];
    this.scene.remove(this.trailGroup);
  }
}
