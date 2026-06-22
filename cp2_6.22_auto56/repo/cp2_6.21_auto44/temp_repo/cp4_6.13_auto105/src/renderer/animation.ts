export type EasingFn = (t: number) => number;

export interface TweenAnimation {
  duration: number;
  easing: EasingFn;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

interface ActiveAnimation extends TweenAnimation {
  elapsed: number;
}

class AnimationQueueImpl {
  private animations: ActiveAnimation[] = [];
  private chainedAnimations: TweenAnimation[][] = [];
  private currentChainIndex = 0;
  private currentChainAnimIndex = 0;

  easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  easeInCubic(t: number): number {
    return t * t * t;
  }

  linear(t: number): number {
    return t;
  }

  add(animation: TweenAnimation): void {
    this.animations.push({ ...animation, elapsed: 0 });
  }

  chain(animations: TweenAnimation[]): void {
    if (animations.length > 0) {
      this.chainedAnimations.push(animations);
    }
  }

  update(dt: number): void {
    const deltaMs = dt * 1000;

    for (let i = this.animations.length - 1; i >= 0; i--) {
      const anim = this.animations[i];
      anim.elapsed += deltaMs;
      const progress = Math.min(anim.elapsed / anim.duration, 1);
      const easedValue = anim.easing(progress);
      anim.onUpdate(easedValue);

      if (progress >= 1) {
        if (anim.onComplete) {
          anim.onComplete();
        }
        this.animations.splice(i, 1);
      }
    }

    if (this.chainedAnimations.length > 0) {
      const currentChain = this.chainedAnimations[0];
      if (this.currentChainAnimIndex < currentChain.length) {
        const anim = currentChain[this.currentChainAnimIndex];
        if (!this.animations.some(a => 
          a.onUpdate === anim.onUpdate && a.duration === anim.duration
        )) {
          this.add({
            ...anim,
            onComplete: () => {
              if (anim.onComplete) anim.onComplete();
              this.currentChainAnimIndex++;
              if (this.currentChainAnimIndex >= currentChain.length) {
                this.chainedAnimations.shift();
                this.currentChainAnimIndex = 0;
                this.currentChainIndex++;
              }
            }
          });
        }
      }
    }
  }

  isRunning(): boolean {
    return this.animations.length > 0 || this.chainedAnimations.length > 0;
  }

  clear(): void {
    this.animations = [];
    this.chainedAnimations = [];
    this.currentChainIndex = 0;
    this.currentChainAnimIndex = 0;
  }
}

export const animationQueue = new AnimationQueueImpl();
export const easeInOutCubic: EasingFn = animationQueue.easeInOutCubic.bind(animationQueue);
export const easeOutCubic: EasingFn = animationQueue.easeOutCubic.bind(animationQueue);
export const easeInCubic: EasingFn = animationQueue.easeInCubic.bind(animationQueue);
export const linear: EasingFn = animationQueue.linear.bind(animationQueue);
