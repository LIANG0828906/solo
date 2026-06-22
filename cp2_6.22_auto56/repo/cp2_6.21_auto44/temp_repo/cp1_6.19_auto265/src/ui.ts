import type { Crease } from './scene';
import type { FoldProgressEvent } from './foldEngine';

export interface UIHandlers {
  onFold: () => void;
  onReset: () => void;
  onScreenshot: () => void;
}

export class UIManager {
  private creaseListEl: HTMLElement;
  private foldBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private screenshotBtn: HTMLButtonElement;
  private creaseCountEl: HTMLElement;
  private faceCountEl: HTMLElement;
  private foldedCreasesEl: HTMLElement;
  private progressFillEl: HTMLElement;
  private progressTextEl: HTMLElement;

  private handlers: UIHandlers;
  private creases: Crease[] = [];
  private totalCreases: number = 0;
  private maxCreases: number = 8;

  constructor(handlers: UIHandlers) {
    this.handlers = handlers;

    this.creaseListEl = document.getElementById('crease-list')!;
    this.foldBtn = document.getElementById('fold-btn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;
    this.screenshotBtn = document.getElementById('screenshot-btn') as HTMLButtonElement;
    this.creaseCountEl = document.getElementById('crease-count')!;
    this.faceCountEl = document.getElementById('face-count')!;
    this.foldedCreasesEl = document.getElementById('folded-creases')!;
    this.progressFillEl = document.getElementById('progress-fill')!;
    this.progressTextEl = document.getElementById('progress-text')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.foldBtn.addEventListener('click', () => {
      this.handlers.onFold();
    });

    this.resetBtn.addEventListener('click', () => {
      this.handlers.onReset();
    });

    this.screenshotBtn.addEventListener('click', () => {
      this.handlers.onScreenshot();
    });
  }

  public setMaxCreases(max: number): void {
    this.maxCreases = max;
    this.updateCreaseCount();
  }

  public setCreases(creases: Crease[]): void {
    this.creases = creases;
    this.totalCreases = creases.length;
    this.renderCreaseList();
    this.updateCreaseCount();
    this.updateFoldButtonState();
  }

  public addCrease(crease: Crease): void {
    this.creases.push(crease);
    this.totalCreases = this.creases.length;
    this.renderCreaseList();
    this.updateCreaseCount();
    this.updateFoldButtonState();
  }

  private renderCreaseList(): void {
    if (this.creases.length === 0) {
      this.creaseListEl.innerHTML = '<div class="hint-text">点击纸面上的两点添加折痕</div>';
      return;
    }

    let html = '';
    for (let i = 0; i < this.creases.length; i++) {
      const crease = this.creases[i];
      const angleDeg = Math.round(Math.abs(crease.angle) * 180 / Math.PI);
      const targetAngleDeg = Math.round(Math.abs(crease.targetAngle) * 180 / Math.PI) || 90;
      const direction = crease.foldDirection > 0 ? '上' : '下';

      html += `
        <div class="crease-item">
          <span class="crease-index">折痕 ${i + 1}</span>
          <span class="crease-angle">${direction}折 ${targetAngleDeg}°</span>
        </div>
      `;
    }
    this.creaseListEl.innerHTML = html;
  }

  private updateCreaseCount(): void {
    this.creaseCountEl.textContent = `${this.totalCreases} / ${this.maxCreases}`;
  }

  private updateFoldButtonState(): void {
    this.foldBtn.disabled = this.totalCreases === 0;
  }

  public setFaceCount(count: number): void {
    this.faceCountEl.textContent = count.toString();
  }

  public updateProgress(event: FoldProgressEvent): void {
    const percent = Math.round(event.progress * 100);
    this.progressFillEl.style.width = `${percent}%`;
    this.progressTextEl.textContent = `${percent}%`;

    const foldedCount = event.state === 'complete'
      ? event.totalCreases
      : event.currentCreaseIndex;
    this.foldedCreasesEl.textContent = `${foldedCount} / ${event.totalCreases}`;

    if (event.state === 'folding') {
      this.foldBtn.disabled = true;
      this.screenshotBtn.disabled = true;
    } else if (event.state === 'complete' || event.state === 'unfolding') {
      this.screenshotBtn.disabled = false;
    } else if (event.state === 'idle') {
      this.foldBtn.disabled = this.totalCreases === 0;
      this.screenshotBtn.disabled = true;
    }
  }

  public setFoldingEnabled(enabled: boolean): void {
    this.foldBtn.disabled = !enabled || this.totalCreases === 0;
  }

  public setScreenshotEnabled(enabled: boolean): void {
    this.screenshotBtn.disabled = !enabled;
  }

  public reset(): void {
    this.creases = [];
    this.totalCreases = 0;
    this.renderCreaseList();
    this.updateCreaseCount();
    this.updateFoldButtonState();
    this.progressFillEl.style.width = '0%';
    this.progressTextEl.textContent = '0%';
    this.foldedCreasesEl.textContent = '0 / 0';
    this.screenshotBtn.disabled = true;
  }
}
