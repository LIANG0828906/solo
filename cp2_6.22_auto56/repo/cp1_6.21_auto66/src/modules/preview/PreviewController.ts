import * as THREE from 'three';
import type { Brick, PreviewState, PartsListItem } from '../../utils/types';
import { getColorName, GLOW_START, GLOW_END } from '../../utils/colors';

export class PreviewController {
  private state: PreviewState = {
    isActive: false,
    rotationAngle: 0,
    rotationSpeed: (2 * Math.PI) / 8,
    zoomLevel: 1
  };

  private readonly ZOOM_MIN = 0.5;
  private readonly ZOOM_MAX = 3;
  private bricks: Brick[] = [];
  private glowMaterials: Map<string, THREE.MeshStandardMaterial> = new Map();

  public startPreview(scene: THREE.Scene, bricks: Brick[]): PreviewState {
    this.state.isActive = true;
    this.state.rotationAngle = 0;
    this.bricks = [...bricks];
    this.setupGlowEffects(scene);
    return { ...this.state };
  }

  public stopPreview(): void {
    this.state.isActive = false;
    this.glowMaterials.clear();
  }

  private setupGlowEffects(scene: THREE.Scene): void {
    this.glowMaterials.clear();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.name.startsWith('brick-')) {
        const material = new THREE.MeshStandardMaterial({
          color: (object.material as THREE.MeshStandardMaterial).color,
          metalness: 0.1,
          roughness: 0.5,
          emissive: new THREE.Color(GLOW_START),
          emissiveIntensity: 0
        });
        object.material = material;
        this.glowMaterials.set(object.name, material);
      }
    });
  }

  public updateRotation(delta: number, camera: THREE.PerspectiveCamera, target: THREE.Vector3): void {
    if (!this.state.isActive) return;
    this.state.rotationAngle += this.state.rotationSpeed * delta;
    const radius = camera.position.length();
    camera.position.x = target.x + radius * Math.sin(this.state.rotationAngle);
    camera.position.z = target.z + radius * Math.cos(this.state.rotationAngle);
    camera.lookAt(target);
  }

  public updateGlowEffects(delta: number): void {
    if (!this.state.isActive) return;
    this.bricks.forEach(brick => {
      if (brick.glowPhase === undefined || brick.glowPeriod === undefined) return;
      brick.glowPhase += (delta * 2 * Math.PI) / brick.glowPeriod;
      const intensity = 0.2 + 0.4 * (0.5 + 0.5 * Math.sin(brick.glowPhase));
      const material = this.glowMaterials.get(`brick-${brick.id}`);
      if (material) {
        material.emissiveIntensity = intensity;
        const t = (0.5 + 0.5 * Math.sin(brick.glowPhase));
        material.emissive.lerpColors(
          new THREE.Color(GLOW_START),
          new THREE.Color(GLOW_END),
          t
        );
      }
    });
  }

  public generatePartsList(bricks: Brick[]): PartsListItem[] {
    const map = new Map<string, PartsListItem>();
    bricks.forEach(brick => {
      const key = `${brick.type}-${brick.color}`;
      if (!map.has(key)) {
        map.set(key, {
          type: brick.type,
          color: brick.color,
          colorName: getColorName(brick.color),
          count: 0
        });
      }
      const item = map.get(key)!;
      item.count++;
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.colorName !== b.colorName) {
        return a.colorName.localeCompare(b.colorName);
      }
      return a.type.localeCompare(b.type);
    });
  }

  public setZoom(scale: number): void {
    this.state.zoomLevel = Math.max(this.ZOOM_MIN, Math.min(this.ZOOM_MAX, scale));
  }

  public adjustZoom(delta: number): void {
    this.state.zoomLevel = Math.max(
      this.ZOOM_MIN,
      Math.min(this.ZOOM_MAX, this.state.zoomLevel + delta)
    );
  }

  public getZoomRange(): { min: number; max: number } {
    return { min: this.ZOOM_MIN, max: this.ZOOM_MAX };
  }

  public isActive(): boolean {
    return this.state.isActive;
  }

  public getState(): PreviewState {
    return { ...this.state };
  }

  public getZoomLevel(): number {
    return this.state.zoomLevel;
  }

  public reset(): void {
    this.state = {
      isActive: false,
      rotationAngle: 0,
      rotationSpeed: (2 * Math.PI) / 8,
      zoomLevel: 1
    };
    this.bricks = [];
    this.glowMaterials.clear();
  }
}
