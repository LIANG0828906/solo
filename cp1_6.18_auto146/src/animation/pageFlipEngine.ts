import type { FlipDirection, FlipEngineOptions, FlipTransform } from '../types';

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export class PageFlipEngine {
  private duration: number;
  private pageWidth: number;
  private pageHeight: number;
  private rafId: number | null = null;
  private startTime: number = 0;
  private isCancelled: boolean = false;

  constructor(options: FlipEngineOptions) {
    this.duration = options.duration ?? 400;
    this.pageWidth = options.pageWidth;
    this.pageHeight = options.pageHeight;
  }

  setDimensions(width: number, height: number): void {
    this.pageWidth = width;
    this.pageHeight = height;
  }

  getTransformAtProgress(
    progress: number,
    direction: FlipDirection,
    mouseX?: number,
    mouseY?: number
  ): FlipTransform {
    const eased = easeInOutCubic(Math.max(0, Math.min(1, progress)));
    const angle = direction === 'next' ? eased * 180 : -eased * 180;
    const angleRad = (angle * Math.PI) / 180;

    let shadowIntensity: number;
    let offsetX = 0;
    let offsetY = 0;
    let scaleY = 1;

    if (mouseX !== undefined && mouseY !== undefined && eased < 0.9) {
      const relX = (mouseX / this.pageWidth - 0.5) * 2;
      const relY = (mouseY / this.pageHeight - 0.5) * 2;
      offsetX = relX * 8 * (1 - eased);
      offsetY = relY * 5 * (1 - eased);
      scaleY = 1 - Math.abs(relX) * 0.02 * (1 - eased);
      shadowIntensity = 0.3 + (1 - eased) * 0.5 * (0.5 + Math.abs(relX) * 0.5);
    } else {
      shadowIntensity = 0.3 + (1 - eased) * 0.5;
    }

    const shadowBlur = 20 + (1 - eased) * 30;
    const shadowSpread = (1 - eased) * 5;
    const shadowX = direction === 'next' ? -10 * (1 - eased) : 10 * (1 - eased);

    const bendFactor = Math.sin(angleRad) * 0.15;
    const skewY = bendFactor * (1 - eased) * 5;

    return {
      transform: `perspective(1500px) rotateY(${angle}deg) translateY(${offsetY}px) translateX(${offsetX}px) scaleY(${scaleY}) skewY(${skewY}deg)`,
      boxShadow: `${shadowX}px 5px ${shadowBlur}px ${shadowSpread}px rgba(0, 0, 0, ${shadowIntensity * 0.35}), inset 0 0 40px rgba(0,0,0,${shadowIntensity * 0.15})`,
      opacity: eased > 0.95 ? Math.max(0, 1 - (eased - 0.95) * 20) : 1,
      zIndex: Math.round((1 - eased) * 100),
      filter: `brightness(${1 - shadowIntensity * 0.25}) contrast(${1 + shadowIntensity * 0.05})`
    };
  }

  getBackFaceTransform(
    progress: number,
    direction: FlipDirection
  ): FlipTransform {
    const eased = easeInOutCubic(Math.max(0, Math.min(1, progress)));
    const startAngle = direction === 'next' ? -180 : 180;
    const angle = startAngle + (direction === 'next' ? eased * 180 : -eased * 180);

    const shadowIntensity = 0.4 + eased * 0.4;
    const shadowBlur = 15 + eased * 25;
    const shadowX = direction === 'next' ? 5 * eased : -5 * eased;

    return {
      transform: `perspective(1500px) rotateY(${angle}deg)`,
      boxShadow: `${shadowX}px 5px ${shadowBlur}px rgba(0, 0, 0, ${shadowIntensity * 0.3}), inset 0 0 30px rgba(0,0,0,${shadowIntensity * 0.1})`,
      opacity: eased < 0.05 ? eased * 20 : 1,
      zIndex: Math.round(eased * 100 + 1),
      filter: `brightness(${1 - (1 - eased) * 0.2})`
    };
  }

  startFlip(
    direction: FlipDirection,
    onProgress: (front: FlipTransform, back: FlipTransform, progress: number) => void
  ): Promise<void> {
    this.cancel();
    this.isCancelled = false;

    return new Promise((resolve) => {
      const animate = (timestamp: number) => {
        if (this.isCancelled) {
          resolve();
          return;
        }

        if (!this.startTime) this.startTime = timestamp;
        const elapsed = timestamp - this.startTime;
        const rawProgress = Math.min(elapsed / this.duration, 1);

        const front = this.getTransformAtProgress(rawProgress, direction);
        const back = this.getBackFaceTransform(rawProgress, direction);

        onProgress(front, back, rawProgress);

        if (rawProgress < 1) {
          this.rafId = requestAnimationFrame(animate);
        } else {
          this.startTime = 0;
          this.rafId = null;
          resolve();
        }
      };

      this.rafId = requestAnimationFrame(animate);
    });
  }

  cancel(): void {
    this.isCancelled = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.startTime = 0;
  }
}
