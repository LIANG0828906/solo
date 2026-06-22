export type EasingFunction = 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';

export interface Keyframe {
  offset: number;
  [property: string]: number | string;
}

export interface AnimationConfig {
  duration?: number;
  easing?: EasingFunction;
  delay?: number;
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fill?: 'none' | 'forwards' | 'backwards' | 'both';
}

export class AnimationManager {
  private styleElement: HTMLStyleElement | null = null;
  private keyframeCounter = 0;

  private getStyleSheet(): CSSStyleSheet {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.setAttribute('data-animation-manager', 'true');
      document.head.appendChild(this.styleElement);
    }
    return this.styleElement.sheet as CSSStyleSheet;
  }

  public createKeyframes(name: string, keyframes: Keyframe[]): string {
    const sheet = this.getStyleSheet();
    const rules = keyframes
      .map((kf) => {
        const props = Object.entries(kf)
          .filter(([key]) => key !== 'offset')
          .map(([key, value]) => `${this.camelToKebab(key)}: ${value}`)
          .join('; ');
        return `  ${kf.offset * 100}% { ${props}; }`;
      })
      .join('\n');
    const rule = `@keyframes ${name} {\n${rules}\n}`;
    sheet.insertRule(rule, sheet.cssRules.length);
    return name;
  }

  public createUniqueKeyframes(keyframes: Keyframe[]): string {
    const name = `anim-${this.keyframeCounter++}`;
    return this.createKeyframes(name, keyframes);
  }

  public applyAnimation(
    element: HTMLElement,
    keyframes: Keyframe[],
    config: AnimationConfig = {}
  ): Animation {
    const {
      duration = 300,
      easing = 'ease',
      delay = 0,
      iterations = 1,
      direction = 'normal',
      fill = 'forwards',
    } = config;

    return element.animate(
      keyframes.map(({ offset, ...rest }) => ({
        offset,
        ...rest,
      })),
      {
        duration,
        easing,
        delay,
        iterations: iterations === 'infinite' ? Infinity : iterations,
        direction,
        fill,
      }
    );
  }

  public createFadeIn(_duration = 200): Keyframe[] {
    return [
      { offset: 0, opacity: 0 },
      { offset: 1, opacity: 1 },
    ];
  }

  public createFadeOut(_duration = 200): Keyframe[] {
    return [
      { offset: 0, opacity: 1 },
      { offset: 1, opacity: 0 },
    ];
  }

  public createSlideUp(distance = 20, _duration = 200): Keyframe[] {
    return [
      { offset: 0, opacity: 0, transform: `translateY(${distance}px)` },
      { offset: 1, opacity: 1, transform: 'translateY(0)' },
    ];
  }

  public createScale(from = 0.8, to = 1, _duration = 200): Keyframe[] {
    return [
      { offset: 0, opacity: 0, transform: `scale(${from})` },
      { offset: 1, opacity: 1, transform: `scale(${to})` },
    ];
  }

  public createPulse(intensity = 1.05, _duration = 500): Keyframe[] {
    return [
      { offset: 0, transform: 'scale(1)' },
      { offset: 0.5, transform: `scale(${intensity})` },
      { offset: 1, transform: 'scale(1)' },
    ];
  }

  public createShake(intensity = 4, _duration = 300): Keyframe[] {
    return [
      { offset: 0, transform: 'translateX(0)' },
      { offset: 0.25, transform: `translateX(-${intensity}px)` },
      { offset: 0.5, transform: `translateX(${intensity}px)` },
      { offset: 0.75, transform: `translateX(-${intensity}px)` },
      { offset: 1, transform: 'translateX(0)' },
    ];
  }

  public createFloat(yOffset = -10, _duration = 2000): Keyframe[] {
    return [
      { offset: 0, transform: 'translateY(0)' },
      { offset: 0.5, transform: `translateY(${yOffset}px)` },
      { offset: 1, transform: 'translateY(0)' },
    ];
  }

  public createGlow(color = '#6C63FF', intensity = 10, _duration = 1500): Keyframe[] {
    return [
      { offset: 0, boxShadow: `0 0 5px ${color}` },
      { offset: 0.5, boxShadow: `0 0 ${intensity}px ${color}, 0 0 ${intensity * 2}px ${color}` },
      { offset: 1, boxShadow: `0 0 5px ${color}` },
    ];
  }

  public createMistAnimation(colors: string[], _duration = 3000): Keyframe[] {
    const color1 = colors[0] || '#6C63FF';
    const color2 = colors[1] || '#FF6584';
    const color3 = colors[2] || '#36D399';
    return [
      {
        offset: 0,
        opacity: 0,
        transform: 'translateY(0) scale(0.5)',
        background: `radial-gradient(circle, ${color1}40 0%, transparent 70%)`,
      },
      {
        offset: 0.5,
        opacity: 0.7,
        transform: 'translateY(-30px) scale(1)',
        background: `radial-gradient(circle, ${color2}60 0%, transparent 70%)`,
      },
      {
        offset: 1,
        opacity: 0,
        transform: 'translateY(-60px) scale(1.5)',
        background: `radial-gradient(circle, ${color3}40 0%, transparent 70%)`,
      },
    ];
  }

  public delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  public destroy(): void {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }
}

export const animationManager = new AnimationManager();

export default AnimationManager;

export const easeTransition = (properties: string | string[] = 'all', duration = 200) => {
  const props = Array.isArray(properties) ? properties.join(', ') : properties;
  return {
    transition: `${props} ${duration}ms ease`,
  };
};
