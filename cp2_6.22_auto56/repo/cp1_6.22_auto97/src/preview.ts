import type { Effect } from './effects';

const DYNAMIC_STYLE_ID = 'dynamic-styles';
const FADE_DURATION = 300;

export class PreviewManager {
  private element: HTMLElement;
  private dynamicStyle: HTMLStyleElement;
  private currentEffectId: string | null = null;

  constructor(elementId: string) {
    const el = document.getElementById(elementId);
    if (!el) {
      throw new Error(`Preview element with id "${elementId}" not found`);
    }
    this.element = el;

    let styleEl = document.getElementById(DYNAMIC_STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = DYNAMIC_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    this.dynamicStyle = styleEl;

    this.setupRippleHandler();
  }

  private setupRippleHandler(): void {
    this.element.addEventListener('click', (e) => {
      if (this.currentEffectId === 'ripple') {
        this.createRipple(e as MouseEvent);
      }
    });
  }

  private createRipple(e: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-wave';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    this.element.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }

  private clearAllEffectClasses(): void {
    const classList = this.element.classList;
    const toRemove: string[] = [];
    classList.forEach((cls) => {
      if (cls.startsWith('effect-')) {
        toRemove.push(cls);
      }
    });
    toRemove.forEach((cls) => classList.remove(cls));
  }

  applyEffect(effect: Effect, onComplete?: () => void): void {
    if (this.currentEffectId === effect.id && !this.dynamicStyle.textContent) {
      onComplete?.();
      return;
    }

    this.element.classList.add('fading');

    window.setTimeout(() => {
      this.clearAllEffectClasses();
      this.element.classList.add(effect.className);
      this.currentEffectId = effect.id;

      this.dynamicStyle.textContent = '';

      window.setTimeout(() => {
        this.element.classList.remove('fading');
        onComplete?.();
      }, 50);
    }, FADE_DURATION);
  }

  applyCustomCSS(css: string): void {
    this.dynamicStyle.textContent = css;
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
