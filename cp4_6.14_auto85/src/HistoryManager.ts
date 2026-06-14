import * as THREE from 'three';
import type { GeometryData, GeometryObject } from './GeometryFactory';
import { createGeometryObject, updateScale, updatePosition, updateRotation } from './GeometryFactory';

export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  geometries: GeometryData[];
  thumbnail: string;
}

type RestoreCallback = (objects: GeometryObject[]) => void;

export class HistoryManager {
  private snapshots: Snapshot[] = [];
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private onRestoreCallback: RestoreCallback | null = null;
  private onUpdateCallback: (() => void) | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
  }

  setRestoreCallback(cb: RestoreCallback): void {
    this.onRestoreCallback = cb;
  }

  setUpdateCallback(cb: () => void): void {
    this.onUpdateCallback = cb;
  }

  getSnapshots(): Snapshot[] {
    return this.snapshots;
  }

  saveSnapshot(geometryObjects: GeometryObject[]): Snapshot | null {
    if (geometryObjects.length === 0) {
      return null;
    }

    const geometries: GeometryData[] = geometryObjects.map((obj) => ({
      ...obj.data,
      position: { ...obj.data.position },
      rotation: { ...obj.data.rotation },
    }));

    const thumbnail = this.captureThumbnail();

    const snapshot: Snapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: `雕塑 #${this.snapshots.length + 1}`,
      timestamp: Date.now(),
      geometries,
      thumbnail,
    };

    this.snapshots.unshift(snapshot);
    this.onUpdateCallback?.();
    return snapshot;
  }

  deleteSnapshot(id: string): void {
    this.snapshots = this.snapshots.filter((s) => s.id !== id);
    this.onUpdateCallback?.();
  }

  restoreSnapshot(id: string, clearScene: () => void): void {
    const snapshot = this.snapshots.find((s) => s.id === id);
    if (!snapshot) return;

    clearScene();

    const restoredObjects: GeometryObject[] = snapshot.geometries.map((geoData) => {
      const obj = createGeometryObject(
        geoData.type,
        geoData.position,
        geoData.scale,
        geoData.color
      );
      obj.data.id = geoData.id;
      obj.mesh.userData.geometryId = geoData.id;
      updatePosition(obj, geoData.position.x, geoData.position.y, geoData.position.z);
      updateRotation(obj, geoData.rotation.x, geoData.rotation.y, geoData.rotation.z);
      updateScale(obj, geoData.scale);
      if (geoData.isBooleanResult) {
        obj.data.isBooleanResult = true;
      }
      return obj;
    });

    this.onRestoreCallback?.(restoredObjects);
  }

  clearAll(): void {
    this.snapshots = [];
    this.onUpdateCallback?.();
  }

  private captureThumbnail(): string {
    this.renderer.render(this.scene, this.camera);
    const raw = this.renderer.domElement.toDataURL('image/png');
    return this.squareCropDataUrl(raw);
  }

  private squareCropDataUrl(dataUrl: string): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    const img = new Image();
    img.src = dataUrl;

    const targetSize = 240;
    canvas.width = targetSize;
    canvas.height = targetSize;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, targetSize, targetSize);

    const srcCanvas = this.renderer.domElement;
    const sw = srcCanvas.width;
    const sh = srcCanvas.height;
    const size = Math.min(sw, sh);
    const sx = (sw - size) / 2;
    const sy = (sh - size) / 2;

    ctx.drawImage(srcCanvas, sx, sy, size, size, 0, 0, targetSize, targetSize);
    return canvas.toDataURL('image/jpeg', 0.85);
  }
}
