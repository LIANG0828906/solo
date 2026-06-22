import {
  FogAnimation,
  LightPillarAnimation,
  SecretEntranceAnimation,
} from '../types';

export interface ActiveAnimations {
  fog: FogAnimation[];
  pillars: LightPillarAnimation[];
  entrances: SecretEntranceAnimation[];
}

export class RuneAnimationManager {
  private rafId: number | null = null;
  private onFrame: ((now: number) => void) | null = null;

  pillars: LightPillarAnimation[] = [];
  secretEntrances: SecretEntranceAnimation[] = [];

  start(loop: (now: number) => void) {
    this.onFrame = loop;
    const tick = (now: number) => {
      this.onFrame?.(now);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  addPillar(anim: LightPillarAnimation) {
    this.pillars.push(anim);
  }

  addSecretEntrance(anim: SecretEntranceAnimation) {
    this.secretEntrances.push(anim);
  }

  updatePillars(now: number): LightPillarAnimation[] {
    const active: LightPillarAnimation[] = [];
    for (const p of this.pillars) {
      if (now - p.startTime < p.duration) {
        active.push(p);
      }
    }
    this.pillars = active;
    return active;
  }

  getActiveSecretEntrances(now: number): SecretEntranceAnimation[] {
    return this.secretEntrances;
  }
}
