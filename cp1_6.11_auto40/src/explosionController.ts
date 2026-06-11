import * as THREE from 'three';
import type { GroupInfo, AnimationState } from './types';

const ANIMATION_DURATION = 1500;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export class ExplosionController {
  private groups: GroupInfo[] = [];
  private animationState: AnimationState = {
    progress: 0,
    isAnimating: false,
    isExploding: false,
    startTime: 0
  };
  private explosionDistance: number = 2;
  private isExploded: boolean = false;
  private onAnimationComplete?: () => void;

  setGroups(groups: GroupInfo[]): void {
    this.groups = groups;
    this.isExploded = false;
    this.animationState.progress = 0;
    this.animationState.isAnimating = false;
  }

  setExplosionDistance(distance: number): void {
    this.explosionDistance = distance;
    if (this.isExploded && !this.animationState.isAnimating) {
      this.applyExplosionProgress(1);
    }
  }

  explode(onComplete?: () => void): void {
    if (this.animationState.isAnimating || this.isExploded) return;
    this.onAnimationComplete = onComplete;
    this.animationState.isAnimating = true;
    this.animationState.isExploding = true;
    this.animationState.startTime = performance.now();
    this.animationState.progress = 0;
  }

  reset(onComplete?: () => void): void {
    if (this.animationState.isAnimating || !this.isExploded) return;
    this.onAnimationComplete = onComplete;
    this.animationState.isAnimating = true;
    this.animationState.isExploding = false;
    this.animationState.startTime = performance.now();
    this.animationState.progress = 1;
  }

  update(): void {
    if (!this.animationState.isAnimating) return;

    const now = performance.now();
    const elapsed = now - this.animationState.startTime;
    let rawProgress = Math.min(elapsed / ANIMATION_DURATION, 1);

    if (this.animationState.isExploding) {
      this.animationState.progress = easeOutCubic(rawProgress);
    } else {
      this.animationState.progress = 1 - easeOutCubic(rawProgress);
    }

    this.applyExplosionProgress(this.animationState.progress);

    if (rawProgress >= 1) {
      this.animationState.isAnimating = false;
      this.isExploded = this.animationState.isExploding;
      if (this.onAnimationComplete) {
        const cb = this.onAnimationComplete;
        this.onAnimationComplete = undefined;
        cb();
      }
    }
  }

  private applyExplosionProgress(progress: number): void {
    for (const group of this.groups) {
      if (!group.selected) continue;

      const offset = group.explodeOffset.clone();
      const angleAxis = new THREE.Vector3(
        Math.sin(group.randomAngle),
        Math.cos(group.randomAngle),
        Math.sin(group.randomAngle * 0.7)
      ).normalize();
      offset.applyAxisAngle(angleAxis, group.randomAngle);

      const scaledOffset = offset.multiplyScalar(this.explosionDistance * progress);
      const targetPos = group.initialPosition.clone().add(scaledOffset);
      group.mesh.position.copy(targetPos);
      group.mesh.updateMatrix();
    }
  }

  isAnimating(): boolean {
    return this.animationState.isAnimating;
  }

  isModelExploded(): boolean {
    return this.isExploded;
  }

  getProgress(): number {
    return this.animationState.progress;
  }
}
