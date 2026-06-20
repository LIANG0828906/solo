import * as THREE from 'three';
import {
  RefractionEngine,
  RefractionResult,
  RaySegment,
} from '../refraction/RefractionEngine';
import { MATERIALS, PRISM_DEFAULTS } from '../utils/constants';

export type ShapeType = 'prism' | 'sphere';
export type MaterialKey = 'glass' | 'water' | 'ice' | 'diamond';

export interface SceneConfig {
  shape: ShapeType;
  material: MaterialKey;
  incidentAngle: number;
  lightDistance: number;
  prismRotation: THREE.Euler;
}

export interface SelectedRayInfo {
  color: string;
  wavelength: number;
  name: string;
  exitAngle: number;
  position: THREE.Vector3;
}

export class SceneManager {
  private config: SceneConfig = {
    shape: 'prism',
    material: 'glass',
    incidentAngle: 45,
    lightDistance: 5,
    prismRotation: new THREE.Euler(0, 0, 0),
  };

  private prismPosition = new THREE.Vector3(0, 0, 0);
  private listeners: Array<() => void> = [];
  private selectedRayIndex: number | null = null;
  private raySelectionListeners: Array<
    (info: SelectedRayInfo | null) => void
  > = [];

  onChange(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  onRaySelected(
    callback: (info: SelectedRayInfo | null) => void
  ): () => void {
    this.raySelectionListeners.push(callback);
    return () => {
      this.raySelectionListeners = this.raySelectionListeners.filter(
        (l) => l !== callback
      );
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  getConfig(): SceneConfig {
    return { ...this.config };
  }

  setShape(shape: ShapeType): void {
    this.config.shape = shape;
    this.notify();
  }

  setMaterial(material: MaterialKey): void {
    this.config.material = material;
    this.notify();
  }

  setIncidentAngle(angle: number): void {
    this.config.incidentAngle = Math.max(0, Math.min(90, angle));
    this.notify();
  }

  setLightDistance(distance: number): void {
    this.config.lightDistance = Math.max(2, Math.min(8, distance));
    this.notify();
  }

  setPrismRotation(rotation: THREE.Euler): void {
    this.config.prismRotation = rotation.clone();
    this.notify();
  }

  selectRay(index: number | null, segments: RaySegment[]): void {
    this.selectedRayIndex = index;
    if (index !== null && segments[index]) {
      const seg = segments[index];
      const midPoint = seg.start.clone().add(seg.end).multiplyScalar(0.5);
      this.raySelectionListeners.forEach((l) =>
        l({
          color: seg.color,
          wavelength: seg.wavelength,
          name: seg.name,
          exitAngle: seg.exitAngle,
          position: midPoint,
        })
      );
    } else {
      this.raySelectionListeners.forEach((l) => l(null));
    }
  }

  getSelectedRayIndex(): number | null {
    return this.selectedRayIndex;
  }

  getLightSourcePosition(): THREE.Vector3 {
    const angleRad = (this.config.incidentAngle * Math.PI) / 180;
    const d = this.config.lightDistance;
    const x = -d * Math.sin(angleRad);
    const y = d * Math.cos(angleRad);
    return new THREE.Vector3(x, y, 0);
  }

  getLightDirection(): THREE.Vector3 {
    const angleRad = (this.config.incidentAngle * Math.PI) / 180;
    const x = Math.sin(angleRad);
    const y = -Math.cos(angleRad);
    return new THREE.Vector3(x, y, 0).normalize();
  }

  getPrismPosition(): THREE.Vector3 {
    return this.prismPosition.clone();
  }

  calculateRefraction(): RefractionResult {
    const origin = this.getLightSourcePosition();
    const dir = this.getLightDirection();
    const refractiveIndex = MATERIALS[this.config.material].refractiveIndex;

    if (this.config.shape === 'sphere') {
      return RefractionEngine.calculateSphereRefraction(
        origin,
        dir,
        this.prismPosition,
        refractiveIndex,
        PRISM_DEFAULTS.sphereRadius
      );
    }

    return RefractionEngine.calculatePrismRefraction(
      origin,
      dir,
      this.prismPosition,
      this.config.prismRotation,
      refractiveIndex,
      PRISM_DEFAULTS.prismSize
    );
  }
}

export const sceneManager = new SceneManager();
