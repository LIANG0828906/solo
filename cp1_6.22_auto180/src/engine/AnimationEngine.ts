import type { AnimationType, AnimationConfig } from '../types';

interface Keyframe {
  offset: number;
  [property: string]: string | number;
}

export interface AnimationStyles {
  animationName: string;
  animationDuration: string;
  animationDelay: string;
  animationFillMode: string;
  animationTimingFunction: string;
}

const animationKeyframes: Record<AnimationType, Keyframe[]> = {
  fadeIn: [
    { offset: 0, opacity: 0 },
    { offset: 1, opacity: 1 },
  ],
  fadeOut: [
    { offset: 0, opacity: 1 },
    { offset: 1, opacity: 0 },
  ],
  flip: [
    { offset: 0, transform: 'perspective(400px) rotateY(-90deg)', opacity: 0 },
    { offset: 0.4, transform: 'perspective(400px) rotateY(10deg)' },
    { offset: 0.7, transform: 'perspective(400px) rotateY(-10deg)' },
    { offset: 1, transform: 'perspective(400px) rotateY(0deg)', opacity: 1 },
  ],
  zoom: [
    { offset: 0, transform: 'scale(0.3)', opacity: 0 },
    { offset: 0.5, transform: 'scale(1.05)', opacity: 1 },
    { offset: 0.7, transform: 'scale(0.9)' },
    { offset: 1, transform: 'scale(1)' },
  ],
  slideInLeft: [
    { offset: 0, transform: 'translateX(-100%)', opacity: 0 },
    { offset: 1, transform: 'translateX(0)', opacity: 1 },
  ],
  slideInRight: [
    { offset: 0, transform: 'translateX(100%)', opacity: 0 },
    { offset: 1, transform: 'translateX(0)', opacity: 1 },
  ],
  slideInUp: [
    { offset: 0, transform: 'translateY(100%)', opacity: 0 },
    { offset: 1, transform: 'translateY(0)', opacity: 1 },
  ],
  slideInDown: [
    { offset: 0, transform: 'translateY(-100%)', opacity: 0 },
    { offset: 1, transform: 'translateY(0)', opacity: 1 },
  ],
};

let styleSheet: CSSStyleSheet | null = null;
const registeredKeyframes = new Set<string>();

function getStyleSheet(): CSSStyleSheet {
  if (!styleSheet) {
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);
    styleSheet = styleEl.sheet as CSSStyleSheet;
  }
  return styleSheet;
}

function keyframesToCSS(name: string, keyframes: Keyframe[]): string {
  const steps = keyframes
    .map((kf) => {
      const props = Object.entries(kf)
        .filter(([key]) => key !== 'offset')
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      return `${(kf.offset * 100).toFixed(0)}% { ${props} }`;
    })
    .join('\n  ');
  return `@keyframes ${name} {\n  ${steps}\n}`;
}

export function ensureKeyframeRegistered(type: AnimationType): string {
  const name = `anim-${type}`;
  if (!registeredKeyframes.has(name)) {
    const keyframes = animationKeyframes[type];
    if (keyframes) {
      const sheet = getStyleSheet();
      sheet.insertRule(keyframesToCSS(name, keyframes), sheet.cssRules.length);
      registeredKeyframes.add(name);
    }
  }
  return name;
}

export function getAnimationStyles(config: AnimationConfig): AnimationStyles {
  const name = ensureKeyframeRegistered(config.type);
  return {
    animationName: name,
    animationDuration: `${config.duration}ms`,
    animationDelay: `${config.delay}ms`,
    animationFillMode: 'forwards',
    animationTimingFunction: 'ease-out',
  };
}

export class AnimationEngine {
  private playingAnimations: Map<string, number> = new Map();
  private rafId: number | null = null;
  private lastTime: number = 0;

  playAnimation(
    elementId: string,
    config: AnimationConfig,
    onUpdate: (styles: AnimationStyles) => void,
    onComplete: () => void
  ): void {
    ensureKeyframeRegistered(config.type);
    const styles = getAnimationStyles(config);
    onUpdate(styles);

    const totalTime = config.duration + config.delay;
    const timeoutId = window.setTimeout(() => {
      this.playingAnimations.delete(elementId);
      onComplete();
    }, totalTime);

    this.playingAnimations.set(elementId, timeoutId);
  }

  stopAnimation(elementId: string): void {
    const timeoutId = this.playingAnimations.get(elementId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      this.playingAnimations.delete(elementId);
    }
  }

  stopAll(): void {
    this.playingAnimations.forEach((id) => window.clearTimeout(id));
    this.playingAnimations.clear();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy(): void {
    this.stopAll();
  }
}

export const animationEngine = new AnimationEngine();
