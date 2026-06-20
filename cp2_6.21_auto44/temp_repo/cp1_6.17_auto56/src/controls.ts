import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Terrain, TerrainMode } from './terrain';

export class ControlsManager {
  public controls: OrbitControls;
  private terrain: Terrain;
  private debounceTimers: { [key: string]: number | null } = {};
  private readonly DEBOUNCE_DELAY = 500;

  constructor(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer, terrain: Terrain) {
    this.terrain = terrain;
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.setupControls();
  }

  private setupControls(): void {
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1000;
    this.controls.minPolarAngle = Math.PI / 6;
    this.controls.maxPolarAngle = Math.PI / 2 + Math.PI / 6;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private debounce(key: string, callback: () => void): void {
    if (this.debounceTimers[key]) {
      window.clearTimeout(this.debounceTimers[key]!);
    }
    this.debounceTimers[key] = window.setTimeout(() => {
      callback();
      this.debounceTimers[key] = null;
    }, this.DEBOUNCE_DELAY);
  }

  public setHeightScale(value: number): void {
    this.debounce('heightScale', () => {
      this.terrain.setHeightScale(value);
    });
  }

  public setNoiseFrequency(value: number): void {
    this.debounce('noiseFrequency', () => {
      this.terrain.setNoiseFrequency(value);
    });
  }

  public setResolution(value: number): void {
    this.debounce('resolution', () => {
      this.terrain.setResolution(value);
    });
  }

  public setMode(mode: TerrainMode): void {
    this.terrain.setMode(mode);
  }

  public reset(): void {
    this.terrain.reset();
  }

  public update(): void {
    this.controls.update();
  }

  public dispose(): void {
    this.controls.dispose();
    Object.values(this.debounceTimers).forEach((timer) => {
      if (timer) window.clearTimeout(timer);
    });
  }
}
