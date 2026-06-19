import { StarData } from './starField';

export interface UIHandlers {
  onResetView: () => void;
  onToggleAutoRotate: () => boolean;
}

export class UI {
  private handlers: UIHandlers;

  private controlPanel: HTMLElement;
  private resetBtn: HTMLButtonElement;
  private rotateBtn: HTMLButtonElement;
  private fpsValue: HTMLElement;

  private infoCard: HTMLElement;
  private closeInfoBtn: HTMLButtonElement;
  private starNameEl: HTMLElement;
  private starConstellationEl: HTMLElement;
  private starBrightnessEl: HTMLElement;
  private starDistanceEl: HTMLElement;

  private currentHighlightedIndex: number | null = null;
  private onHighlightStar: ((index: number | null) => void) | null = null;

  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private fps: number = 60;

  constructor(handlers: UIHandlers) {
    this.handlers = handlers;

    this.controlPanel = document.getElementById('control-panel')!;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.rotateBtn = document.getElementById('rotate-btn') as HTMLButtonElement;
    this.fpsValue = document.getElementById('fps-value')!;

    this.infoCard = document.getElementById('star-info-card')!;
    this.closeInfoBtn = document.getElementById('close-info-btn') as HTMLButtonElement;
    this.starNameEl = document.getElementById('star-name')!;
    this.starConstellationEl = document.getElementById('star-constellation')!;
    this.starBrightnessEl = document.getElementById('star-brightness')!;
    this.starDistanceEl = document.getElementById('star-distance')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.resetBtn.addEventListener('click', (e) => {
      this.createRipple(e, this.resetBtn);
      this.handlers.onResetView();
    });

    this.rotateBtn.addEventListener('click', (e) => {
      this.createRipple(e, this.rotateBtn);
      const isActive = this.handlers.onToggleAutoRotate();
      this.updateRotateButton(isActive);
    });

    this.closeInfoBtn.addEventListener('click', () => {
      this.hideStarInfo();
    });

    document.addEventListener('click', (e) => {
      if (
        this.infoCard.classList.contains('visible') &&
        !this.infoCard.contains(e.target as Node) &&
        !this.controlPanel.contains(e.target as Node)
      ) {
        this.hideStarInfo();
      }
    });

    [this.resetBtn, this.rotateBtn].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-1px) scale(1.02)';
      });

      btn.addEventListener('mouseleave', () => {
        if (!btn.matches(':active')) {
          btn.style.transform = '';
        }
      });

      btn.addEventListener('mousedown', () => {
        btn.style.transform = 'scale(0.92)';
      });

      btn.addEventListener('mouseup', () => {
        btn.style.transform = 'translateY(-1px) scale(1.02)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 150);
      });
    });
  }

  private createRipple(event: MouseEvent, button: HTMLElement): void {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  private updateRotateButton(isActive: boolean): void {
    if (isActive) {
      this.rotateBtn.classList.add('active');
      this.rotateBtn.textContent = '停止旋转';
    } else {
      this.rotateBtn.classList.remove('active');
      this.rotateBtn.textContent = '自动旋转';
    }
  }

  public showStarInfo(
    starData: StarData,
    screenX: number,
    screenY: number,
    starIndex: number
  ): void {
    this.hideStarInfo();

    this.starNameEl.textContent = starData.name;
    this.starConstellationEl.textContent = starData.constellation;
    this.starBrightnessEl.textContent = `${starData.brightness.toFixed(2)} 等`;
    this.starDistanceEl.textContent = `${starData.distance.toFixed(1)} 光年`;

    const cardWidth = this.infoCard.offsetWidth || 300;
    const cardHeight = 220;

    const padding = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = screenX + 24;
    let top = screenY - cardHeight / 2;

    if (left + cardWidth + padding > viewportWidth) {
      left = screenX - cardWidth - 24;
    }

    if (top < padding) {
      top = padding;
    }

    if (top + cardHeight + padding > viewportHeight) {
      top = viewportHeight - cardHeight - padding;
    }

    this.infoCard.style.left = `${left}px`;
    this.infoCard.style.top = `${top}px`;

    requestAnimationFrame(() => {
      this.infoCard.classList.add('visible');
    });

    if (this.currentHighlightedIndex !== starIndex && this.onHighlightStar) {
      this.onHighlightStar(starIndex);
      this.currentHighlightedIndex = starIndex;
    }
  }

  public hideStarInfo(): void {
    this.infoCard.classList.remove('visible');

    if (this.currentHighlightedIndex !== null && this.onHighlightStar) {
      this.onHighlightStar(null);
      this.currentHighlightedIndex = null;
    }
  }

  public setOnHighlightStar(callback: (index: number | null) => void): void {
    this.onHighlightStar = callback;
  }

  public updateFPS(currentTime: number): void {
    this.frameCount++;

    if (currentTime - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;

      this.fpsValue.textContent = this.fps.toString();

      this.fpsValue.classList.remove('low', 'medium');
      if (this.fps < 30) {
        this.fpsValue.classList.add('low');
      } else if (this.fps < 50) {
        this.fpsValue.classList.add('medium');
      }
    }
  }

  public setAutoRotateState(isActive: boolean): void {
    this.updateRotateButton(isActive);
  }

  public dispose(): void {
    this.resetBtn.replaceWith(this.resetBtn.cloneNode(true));
    this.rotateBtn.replaceWith(this.rotateBtn.cloneNode(true));
    this.closeInfoBtn.replaceWith(this.closeInfoBtn.cloneNode(true));
  }
}
