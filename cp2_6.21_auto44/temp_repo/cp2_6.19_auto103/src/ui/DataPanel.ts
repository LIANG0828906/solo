import type { PlanetData } from '../planets/PlanetSystem';

export class DataPanel {
  private container: HTMLElement;
  private panel: HTMLElement;
  private isVisible = false;
  private animationFrame: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.panel = document.createElement('div');
    this.setupPanel();
    this.setupStyles();
    this.container.appendChild(this.panel);
  }

  private setupPanel(): void {
    this.panel.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 40px;
      transform: translateX(-50%) translateY(200%);
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 20px 28px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      min-width: 320px;
      max-width: 90vw;
      opacity: 0;
      transition: none;
      z-index: 100;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;
  }

  private setupStyles(): void {
    this.panel.innerHTML = '';
  }

  public show(data: PlanetData): void {
    this.isVisible = true;
    this.renderContent(data);
    this.animateIn();
  }

  public hide(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.animateOut();
  }

  private renderContent(data: PlanetData): void {
    this.panel.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h2 style="
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #fff;
        ">${data.name}</h2>
      </div>
      <ul style="
        list-style: none;
        padding: 0;
        margin: 0;
      ">
        ${this.renderItem('质量', `${data.mass} kg`)}
        ${this.renderItem('半径', `${data.realRadius.toLocaleString()} km`)}
        ${this.renderItem('公转周期', `${data.orbitalPeriod.toLocaleString()} 天`)}
        ${this.renderItem('自转周期', `${data.rotationPeriod.toLocaleString()} 小时`)}
        ${this.renderItem('卫星数量', `${data.satellites} 颗`)}
      </ul>
    `;
  }

  private renderItem(label: string, value: string): string {
    return `
      <li style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      ">
        <span style="
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        ">${label}</span>
        <span style="
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        ">${value}</span>
      </li>
    `;
  }

  private animateIn(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    const duration = 300;
    const startTime = performance.now();
    this.panel.style.display = 'block';

    const easeOutElastic = (t: number): number => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutElastic(progress);

      const translateY = 200 * (1 - eased);
      this.panel.style.transform = `translateX(-50%) translateY(${translateY}%)`;
      this.panel.style.opacity = String(eased);

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private animateOut(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    const duration = 200;
    const startTime = performance.now();
    const startOpacity = parseFloat(this.panel.style.opacity) || 1;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.panel.style.opacity = String(startOpacity * (1 - progress));

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.panel.style.display = 'none';
        this.panel.style.transform = 'translateX(-50%) translateY(200%)';
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  public isClickedInside(target: EventTarget | null): boolean {
    return this.panel.contains(target as Node);
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public dispose(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.panel.remove();
  }
}
