import * as THREE from 'three';
import { dataManager } from './dataManager';
import { ScatterCube } from './scatterCube';

const MAX_WORLD_STEP_PER_FRAME = 0.02;

export class TimeSlider {
  private scene: THREE.Scene;
  private scatterCube: ScatterCube;
  private planeGroup: THREE.Group;
  private slicePlane!: THREE.Mesh;
  private planeBorder!: THREE.LineSegments;
  private currentDayIndex: number = 0;
  private targetDayIndex: number = 0;
  private totalDays: number;
  private isDragging: boolean = false;
  private raycaster: THREE.Raycaster;
  private onDateChangeCallback: ((dayIndex: number, date: string) => void) | null = null;
  private bbox: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  private lastNotifiedDay: number = -1;

  constructor(scene: THREE.Scene, scatterCube: ScatterCube) {
    this.scene = scene;
    this.scatterCube = scatterCube;
    this.totalDays = dataManager.getTotalDays();
    this.raycaster = new THREE.Raycaster();
    this.bbox = scatterCube.getBoundingBox();

    this.planeGroup = new THREE.Group();
    this.planeGroup.name = 'timeSlider';
    this.scene.add(this.planeGroup);

    this.createSlicePlane();
    this.updatePlanePosition(0);
  }

  private createSlicePlane(): void {
    const width = this.bbox.maxZ - this.bbox.minZ;
    const height = this.bbox.maxY - this.bbox.minY;

    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.slicePlane = new THREE.Mesh(geometry, material);
    this.slicePlane.name = 'slicePlane';
    this.planeGroup.add(this.slicePlane);

    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.8,
    });
    this.planeBorder = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    this.planeBorder.name = 'slicePlaneBorder';
    this.planeGroup.add(this.planeBorder);

    this.slicePlane.rotation.y = Math.PI / 2;
    this.planeBorder.rotation.y = Math.PI / 2;
  }

  private dayIndexToWorldX(dayIndex: number): number {
    return ScatterCube.mapDayToWorldX(Math.max(0, Math.min(this.totalDays - 1, dayIndex)), this.totalDays);
  }

  private updatePlanePosition(dayIndex: number): void {
    const clamped = Math.max(0, Math.min(this.totalDays - 1, dayIndex));
    const x = this.dayIndexToWorldX(clamped);
    const centerY = (this.bbox.minY + this.bbox.maxY) / 2;
    const centerZ = (this.bbox.minZ + this.bbox.maxZ) / 2;

    this.slicePlane.position.set(x, centerY, centerZ);
    this.planeBorder.position.set(x, centerY, centerZ);
  }

  public setDayIndex(dayIndex: number, animate: boolean = true): void {
    this.targetDayIndex = Math.max(0, Math.min(this.totalDays - 1, dayIndex));
    if (!animate) {
      this.currentDayIndex = this.targetDayIndex;
      this.updatePlanePosition(this.currentDayIndex);
      this.notifyChange();
    }
  }

  public getDayIndex(): number {
    return Math.round(this.currentDayIndex);
  }

  public onDateChange(callback: (dayIndex: number, date: string) => void): void {
    this.onDateChangeCallback = callback;
  }

  private notifyChange(): void {
    const rounded = Math.round(this.currentDayIndex);
    if (rounded === this.lastNotifiedDay) return;
    this.lastNotifiedDay = rounded;

    const date = dataManager.getDateByIndex(rounded);
    this.scatterCube.updateSliceHighlight(rounded);
    if (this.onDateChangeCallback) {
      this.onDateChangeCallback(rounded, date);
    }
  }

  public update(delta: number): void {
    const diff = this.targetDayIndex - this.currentDayIndex;
    if (Math.abs(diff) < 0.001) return;

    const worldRange = this.bbox.maxX - this.bbox.minX;
    const dayToWorld = worldRange / (this.totalDays - 1);
    const maxDayStep = MAX_WORLD_STEP_PER_FRAME / dayToWorld;
    const step = Math.max(-maxDayStep, Math.min(maxDayStep, diff));

    this.currentDayIndex += step;

    if (Math.abs(this.targetDayIndex - this.currentDayIndex) < 0.01) {
      this.currentDayIndex = this.targetDayIndex;
    }

    this.updatePlanePosition(this.currentDayIndex);
    this.notifyChange();
  }

  public setDragging(dragging: boolean): void {
    this.isDragging = dragging;
    const mat = this.slicePlane.material as THREE.MeshStandardMaterial;
    const borderMat = this.planeBorder.material as THREE.LineBasicMaterial;
    if (dragging) {
      mat.opacity = 0.25;
      borderMat.opacity = 1;
      (borderMat.color as THREE.Color).set('#ffffff');
    } else {
      mat.opacity = 0.15;
      borderMat.opacity = 0.8;
      (borderMat.color as THREE.Color).set('#3b82f6');
    }
  }

  public isPlaneIntersect(camera: THREE.Camera, mouse: THREE.Vector2): boolean {
    this.raycaster.setFromCamera(mouse, camera);
    const hits = this.raycaster.intersectObject(this.slicePlane, false);
    return hits.length > 0;
  }

  public projectMouseToDayIndex(camera: THREE.Camera, mouse: THREE.Vector2): number | null {
    this.raycaster.setFromCamera(mouse, camera);
    const planeNormal = new THREE.Vector3(1, 0, 0);
    const planeCenter = new THREE.Vector3(this.dayIndexToWorldX(this.currentDayIndex), 0, 0);
    const plane = new THREE.Plane(planeNormal, -planeCenter.dot(planeNormal));

    const intersection = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, intersection);
    if (!intersection) return null;

    const t = (intersection.x - this.bbox.minX) / (this.bbox.maxX - this.bbox.minX);
    const dayIndex = t * (this.totalDays - 1);
    return Math.max(0, Math.min(this.totalDays - 1, dayIndex));
  }

  public dispose(): void {
    this.scene.remove(this.planeGroup);
    (this.slicePlane.geometry as THREE.BufferGeometry).dispose();
    (this.slicePlane.material as THREE.Material).dispose();
    (this.planeBorder.geometry as THREE.BufferGeometry).dispose();
    (this.planeBorder.material as THREE.Material).dispose();
  }
}
