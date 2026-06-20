import { AudioEngine } from './audioEngine';
import { GeometryGenerator } from './geometryGenerator';
import { SceneRenderer } from './sceneRenderer';
import type { PresetType, SculptParams } from './types';
import { DEFAULT_PARAMS } from './types';

const RING_BUFFER_SIZE = 4;

class AudioRingBuffer {
  private buffer: Float32Array[] = [];
  private head = 0;
  private tail = 0;
  private size = 0;

  constructor() {
    for (let i = 0; i < RING_BUFFER_SIZE; i++) {
      this.buffer.push(new Float32Array(32));
    }
  }

  push(bands: Float32Array): void {
    this.buffer[this.head]!.set(bands);
    this.head = (this.head + 1) % RING_BUFFER_SIZE;
    if (this.size < RING_BUFFER_SIZE) {
      this.size++;
    } else {
      this.tail = (this.tail + 1) % RING_BUFFER_SIZE;
    }
  }

  getLatest(out: Float32Array): boolean {
    if (this.size === 0) return false;
    const idx = (this.head - 1 + RING_BUFFER_SIZE) % RING_BUFFER_SIZE;
    out.set(this.buffer[idx]!);
    return true;
  }

  clear(): void {
    for (let i = 0; i < RING_BUFFER_SIZE; i++) {
      this.buffer[i]!.fill(0);
    }
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }
}

export class Controller {
  private audioEngine: AudioEngine;
  private geometryGenerator: GeometryGenerator;
  private sceneRenderer: SceneRenderer;
  private params: SculptParams = { ...DEFAULT_PARAMS };
  private audioBuffer: AudioRingBuffer;
  private currentBands: Float32Array = new Float32Array(32);
  private interpolatedBands: Float32Array = new Float32Array(32);
  private animFrameId = 0;
  private lastAudioTime = 0;
  private audioInterval = 50;
  private animCallback: (() => void) | null = null;

  constructor(canvasContainer: HTMLElement) {
    this.audioEngine = new AudioEngine();
    this.geometryGenerator = new GeometryGenerator();
    this.sceneRenderer = new SceneRenderer(canvasContainer);
    this.audioBuffer = new AudioRingBuffer();

    this.audioEngine.onFrame((bands) => {
      this.audioBuffer.push(bands);
      this.lastAudioTime = performance.now();
    });

    this.sceneRenderer.setSculptGeometry(this.geometryGenerator.getGeometry());
  }

  init(): void {
    this.sceneRenderer.applyPreset(this.params.preset);
    this.sceneRenderer.setRotationSpeed(this.params.rotationSpeed);
    this.sceneRenderer.setTrailLength(this.params.trailLength);
    this.sceneRenderer.startLoop();
    this.startRenderLoop();
  }

  private startRenderLoop(): void {
    const loop = () => {
      this.animFrameId = requestAnimationFrame(loop);

      const hasNewData = this.audioBuffer.getLatest(this.currentBands);

      if (hasNewData) {
        for (let i = 0; i < 32; i++) {
          this.interpolatedBands[i] = this.interpolatedBands[i]! + (this.currentBands[i]! - this.interpolatedBands[i]!) * 0.3;
        }
      }

      this.geometryGenerator.update(
        this.interpolatedBands,
        this.params.maxDisplacement,
        this.sceneRenderer.getCurrentPresetConfig()
      );

      if (this.animCallback) {
        this.animCallback();
      }
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  onRenderFrame(cb: () => void): void {
    this.animCallback = cb;
  }

  async startRecording(): Promise<void> {
    await this.audioEngine.start();
  }

  stopRecording(): void {
    this.audioEngine.stop();
    this.audioBuffer.clear();
    this.interpolatedBands.fill(0);
  }

  isRecording(): boolean {
    return this.audioEngine.isRunning();
  }

  setParameter(name: keyof SculptParams, value: number | PresetType): void {
    if (name === 'maxDisplacement') {
      this.params.maxDisplacement = value as number;
    } else if (name === 'rotationSpeed') {
      this.params.rotationSpeed = value as number;
      this.sceneRenderer.setRotationSpeed(value as number);
    } else if (name === 'trailLength') {
      this.params.trailLength = value as number;
      this.sceneRenderer.setTrailLength(value as number);
    } else if (name === 'preset') {
      this.params.preset = value as PresetType;
      this.sceneRenderer.applyPreset(value as PresetType);
    }
  }

  getParameter(name: keyof SculptParams): number | PresetType {
    return this.params[name];
  }

  takeSnapshot(onComplete?: () => void): void {
    this.sceneRenderer.takeSnapshot(onComplete);
  }

  reset(): Promise<void> {
    return new Promise((resolve) => {
      this.sceneRenderer.reset(() => {
        this.geometryGenerator.reset();
        this.audioBuffer.clear();
        this.interpolatedBands.fill(0);
        for (let i = 0; i < 32; i++) {
          this.interpolatedBands[i] = 0;
        }
        resolve();
      });
    });
  }

  dispose(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.stopRecording();
    this.sceneRenderer.dispose();
  }
}
