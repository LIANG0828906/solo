import * as THREE from 'three';
import { plateBoundaries, plateDriftKeyframes, PlateDriftKeyframe } from '../data';
import { EARTH_RADIUS } from './SceneManager';
import { interpolateNumber } from 'd3-interpolate';

export class PlateMotion {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private earthGroup: THREE.Group;
  private plateLines: Map<string, THREE.Line> = new Map();
  private plateGlows: Map<string, THREE.Line> = new Map();
  private playing: boolean = false;
  private speed: number = 1.0;
  private currentTime: number = 0;
  private maxTime: number = 200;
  private animationDirection: number = 1;
  private keyframes: PlateDriftKeyframe[];
  private originalBoundaryPoints: Map<string, [number, number][]> = new Map();

  constructor(scene: THREE.Scene, camera: THREE.Camera, earthGroup: THREE.Group) {
    this.scene = scene;
    this.camera = camera;
    this.earthGroup = earthGroup;
    this.keyframes = plateDriftKeyframes;

    for (const plate of plateBoundaries) {
      this.originalBoundaryPoints.set(plate.name, [...plate.points]);
    }
  }

  start(): void {
    this.playing = true;
    this.animationDirection = 1;
  }

  stop(): void {
    this.playing = false;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  setCurrentTime(time: number): void {
    this.currentTime = Math.max(0, Math.min(this.maxTime, time));
    this.updatePlatePositions();
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getCurrentTime(): number {
    return this.currentTime;
  }

  update(dt: number): void {
    if (!this.playing) return;

    this.currentTime += dt * this.speed * 15 * this.animationDirection;

    if (this.currentTime >= this.maxTime) {
      this.currentTime = this.maxTime;
      this.animationDirection = -1;
    } else if (this.currentTime <= 0) {
      this.currentTime = 0;
      this.animationDirection = 1;
    }

    this.updatePlatePositions();
  }

  private updatePlatePositions(): void {
    for (const plate of plateBoundaries) {
      const original = this.originalBoundaryPoints.get(plate.name);
      if (!original) continue;

      const offset = this.interpolateOffset(plate.name, this.currentTime);

      const movedPoints = original.map(([lat, lng]) => {
        return this.latLngToVector3(lat + offset.lat, lng + offset.lng, EARTH_RADIUS * 1.005);
      });

      const lineName = `plate_${plate.name}`;
      const glowName = `plate_glow_${plate.name}`;

      const line = this.earthGroup.getObjectByName(lineName) as THREE.Line;
      const glow = this.earthGroup.getObjectByName(glowName) as THREE.Line;

      if (line && movedPoints.length >= 2) {
        const newGeom = new THREE.BufferGeometry().setFromPoints(movedPoints);
        line.geometry.dispose();
        line.geometry = newGeom;
      }
      if (glow && movedPoints.length >= 2) {
        const newGeom = new THREE.BufferGeometry().setFromPoints(movedPoints);
        glow.geometry.dispose();
        glow.geometry = newGeom;
      }
    }
  }

  private interpolateOffset(plateName: string, time: number): { lat: number; lng: number } {
    const kf = this.keyframes;
    if (kf.length === 0) return { lat: 0, lng: 0 };

    if (time <= kf[0].time) {
      return kf[0].offsets[plateName] || { lat: 0, lng: 0 };
    }
    if (time >= kf[kf.length - 1].time) {
      return kf[kf.length - 1].offsets[plateName] || { lat: 0, lng: 0 };
    }

    let prev = kf[0];
    let next = kf[1];
    for (let i = 0; i < kf.length - 1; i++) {
      if (time >= kf[i].time && time <= kf[i + 1].time) {
        prev = kf[i];
        next = kf[i + 1];
        break;
      }
    }

    const t = (time - prev.time) / (next.time - prev.time);
    const prevOff = prev.offsets[plateName] || { lat: 0, lng: 0 };
    const nextOff = next.offsets[plateName] || { lat: 0, lng: 0 };

    return {
      lat: interpolateNumber(prevOff.lat, nextOff.lat)(t),
      lng: interpolateNumber(prevOff.lng, nextOff.lng)(t),
    };
  }

  private latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  dispose(): void {
    this.plateLines.forEach((line) => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.plateGlows.forEach((line) => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    this.plateLines.clear();
    this.plateGlows.clear();
  }
}
