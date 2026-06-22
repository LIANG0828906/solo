import * as THREE from 'three';
import { TrajectoryPoint, TrajectoryFeatures } from './types';
import { eventBus } from './EventBus';

class GestureTracker {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private controls: { enabled: boolean } | null;
  private raycaster: THREE.Raycaster;
  private plane: THREE.Plane;
  private points: TrajectoryPoint[];
  private isDrawing: boolean;
  private trajectoryCounter: number;
  private currentTrajectoryId: string;
  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    domElement: HTMLElement,
    controls: { enabled: boolean } | null = null,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.controls = controls;
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.points = [];
    this.isDrawing = false;
    this.trajectoryCounter = 0;
    this.currentTrajectoryId = '';
    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
  }

  start(): void {
    this.domElement.addEventListener('mousedown', this.boundMouseDown);
    this.domElement.addEventListener('mousemove', this.boundMouseMove);
    this.domElement.addEventListener('mouseup', this.boundMouseUp);
  }

  stop(): void {
    this.domElement.removeEventListener('mousedown', this.boundMouseDown);
    this.domElement.removeEventListener('mousemove', this.boundMouseMove);
    this.domElement.removeEventListener('mouseup', this.boundMouseUp);
    if (this.isDrawing) {
      this.isDrawing = false;
      if (this.controls) {
        this.controls.enabled = true;
      }
    }
  }

  getCurrentPoints(): TrajectoryPoint[] {
    return this.points;
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDrawing = true;
    this.points = [];
    this.trajectoryCounter++;
    this.currentTrajectoryId = `trajectory-${this.trajectoryCounter}`;
    if (this.controls) {
      this.controls.enabled = false;
    }
    const point = this.getPointFromEvent(e);
    if (point) {
      this.points.push(point);
      eventBus.emit('gesture:start', { point, trajectoryId: this.currentTrajectoryId });
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDrawing) return;
    const point = this.getPointFromEvent(e);
    if (!point) return;
    if (this.points.length > 0) {
      const last = this.points[this.points.length - 1];
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      const dz = point.z - last.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < 0.1) return;
    }
    this.points.push(point);
    eventBus.emit('gesture:move', { point, trajectoryId: this.currentTrajectoryId });
  }

  private onMouseUp(e: MouseEvent): void {
    if (!this.isDrawing || e.button !== 0) return;
    this.isDrawing = false;
    if (this.controls) {
      this.controls.enabled = true;
    }
    const features = this.calculateFeatures();
    eventBus.emit('gesture:end', {
      points: [...this.points],
      features,
      trajectoryId: this.currentTrajectoryId,
    });
  }

  private getPointFromEvent(e: MouseEvent): TrajectoryPoint | null {
    const rect = this.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
    const intersection = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.plane, intersection);
    if (!hit) return null;
    return { x: intersection.x, y: intersection.y, z: intersection.z };
  }

  private calculateFeatures(): TrajectoryFeatures {
    const pts = this.points;
    const length = this.calculateLength(pts);
    const curvatures = this.calculateCurvatures(pts);
    const avgCurvature = curvatures.length > 0
      ? curvatures.reduce((sum, c) => sum + c, 0) / curvatures.length
      : 0;
    const directions = this.calculateDirections(pts);
    const directionDistribution = this.calculateDirectionDistribution(directions);
    return { length, curvatures, avgCurvature, directions, directionDistribution };
  }

  private calculateLength(pts: TrajectoryPoint[]): number {
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      const dz = pts[i].z - pts[i - 1].z;
      total += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return total;
  }

  private calculateCurvatures(pts: TrajectoryPoint[]): number[] {
    const result: number[] = [];
    for (let i = 0; i <= pts.length - 3; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2];
      const v1 = new THREE.Vector3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
      const v2 = new THREE.Vector3(p3.x - p2.x, p3.y - p2.y, p3.z - p2.z);
      const cross = new THREE.Vector3().crossVectors(v1, v2);
      const area = cross.length() / 2;
      const d12 = v1.length();
      const d23 = v2.length();
      const d13 = new THREE.Vector3(p3.x - p1.x, p3.y - p1.y, p3.z - p1.z).length();
      const denominator = d12 * d23 * d13;
      if (denominator < 1e-10) {
        result.push(0);
      } else {
        result.push((2 * area) / denominator);
      }
    }
    return result;
  }

  private calculateDirections(pts: TrajectoryPoint[]): number[] {
    const result: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dz = pts[i].z - pts[i - 1].z;
      let angle = Math.atan2(dz, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      result.push(angle);
    }
    return result;
  }

  private calculateDirectionDistribution(directions: number[]): number[] {
    const bins = [0, 0, 0, 0, 0, 0, 0, 0];
    for (const angle of directions) {
      const idx = Math.min(Math.floor(angle / 45), 7);
      bins[idx]++;
    }
    const max = Math.max(...bins, 1);
    return bins.map(count => count / max);
  }
}

export default GestureTracker;
