import { AudioEngine } from './audioEngine';
import { GeometryGenerator } from './geometryGenerator';
import { SceneRenderer } from './sceneRenderer';
import type { PresetType, SculptParams } from './types';
import { DEFAULT_PARAMS } from './types';

export class Controller {
  private audioEngine: AudioEngine;
  private geoGenerator: GeometryGenerator;
  private renderer: SceneRenderer;
  private params: SculptParams = { ...DEFAULT_PARAMS };
  private bands: Float32Array = new Float32Array(32);
  private isRecording = false;

  constructor(
    audioEngine: AudioEngine,
    geoGenerator: GeometryGenerator,
    renderer: SceneRenderer,
  ) {
    this.audioEngine = audioEngine;
    this.geoGenerator = geoGenerator;
    this.renderer = renderer;

    this.audioEngine.onFrame((bands) => {
      this.bands = bands;
    });

    this.renderer.setSculptGeometry(this.geoGenerator.getGeometry());

    this.renderer.startLoop();
    this.startUpdateLoop();
  }

  private updateLoopId = 0;
  private startUpdateLoop(): void {
    const update = () => {
      this.updateLoopId = requestAnimationFrame(update);
      const cfg = this.renderer.getCurrentPresetConfig();
      this.geoGenerator.update(this.bands, this.params.maxDisplacement, cfg);
    };
    this.updateLoopId = requestAnimationFrame(update);
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) return;
    this.isRecording = true;
    await this.audioEngine.start();
  }

  stopRecording(): void {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.audioEngine.stop();
    this.bands.fill(0);
  }

  setParameter(name: keyof SculptParams, value: number): void {
    switch (name) {
      case 'maxDisplacement':
        this.params.maxDisplacement = value;
        break;
      case 'rotationSpeed':
        this.params.rotationSpeed = value;
        this.renderer.setRotationSpeed(value);
        break;
      case 'trailLength':
        this.params.trailLength = Math.round(value);
        this.renderer.setTrailLength(Math.round(value));
        break;
    }
  }

  setPreset(preset: PresetType): void {
    this.params.preset = preset;
    this.renderer.applyPreset(preset);
  }

  takeSnapshot(): void {
    this.renderer.takeSnapshot();
  }

  reset(): void {
    this.stopRecording();
    this.renderer.reset(() => {
      this.geoGenerator.reset();
    });
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  dispose(): void {
    cancelAnimationFrame(this.updateLoopId);
    this.audioEngine.stop();
    this.renderer.dispose();
  }
}
