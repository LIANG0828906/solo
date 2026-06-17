import { DataService } from './DataService';
import type { NarrationState } from './types/artifact';

export class NarrationManager {
  private currentNarration: string = '';
  private isPlaying: boolean = false;
  private scrollPosition: number = 0;
  private currentArtifactId: string | null = null;
  
  private triggerAngleThreshold: number = 30;
  private triggerZoomThreshold: number = 1.8;
  private scrollSpeed: number = 30;
  
  private listeners: Set<(state: NarrationState) => void> = new Set();
  private fadeInProgress: boolean = false;
  private fadeStartTime: number = 0;
  private fadeDuration: number = 0.3;
  private opacity: number = 0;

  constructor() {}

  subscribe(callback: (state: NarrationState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    const state: NarrationState = {
      isPlaying: this.isPlaying,
      text: this.currentNarration,
      scrollPosition: this.scrollPosition,
    };
    this.listeners.forEach((cb) => cb(state));
  }

  getOpacity(): number {
    return this.opacity;
  }

  checkTrigger(cameraAngle: number, zoomLevel: number): boolean {
    const angleOk = Math.abs(cameraAngle) < this.triggerAngleThreshold;
    const zoomOk = zoomLevel > this.triggerZoomThreshold;
    return angleOk && zoomOk;
  }

  async loadNarration(artifactId: string): Promise<void> {
    if (this.currentArtifactId === artifactId && this.currentNarration) {
      return;
    }
    this.currentArtifactId = artifactId;
    try {
      const narration = await DataService.getNarration(artifactId);
      this.currentNarration = narration;
      this.scrollPosition = 0;
      this.notify();
    } catch (error) {
      console.error('Failed to load narration:', error);
    }
  }

  startNarration(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.fadeInProgress = true;
    this.fadeStartTime = performance.now();
    this.notify();
  }

  stopNarration(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.fadeInProgress = false;
    this.opacity = 0;
    this.notify();
  }

  resetScroll(): void {
    this.scrollPosition = 0;
    this.notify();
  }

  update(deltaTime: number): void {
    if (this.fadeInProgress) {
      const elapsed = (performance.now() - this.fadeStartTime) / 1000;
      this.opacity = Math.min(1, elapsed / this.fadeDuration);
      if (elapsed >= this.fadeDuration) {
        this.fadeInProgress = false;
        this.opacity = 1;
      }
    }

    if (this.isPlaying && this.currentNarration) {
      this.scrollPosition += this.scrollSpeed * deltaTime;
      this.notify();
    }
  }

  getState(): NarrationState {
    return {
      isPlaying: this.isPlaying,
      text: this.currentNarration,
      scrollPosition: this.scrollPosition,
    };
  }
}
