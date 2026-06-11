import { PaintingCanvas } from './canvas';
import type { BrushType } from './brush';

export class UIManager {
  private painting: PaintingCanvas;

  private brushButtons: NodeListOf<HTMLButtonElement>;
  private inkSlider: HTMLInputElement;
  private inkValue: HTMLElement;
  private sizeSlider: HTMLInputElement;
  private undoBtn: HTMLButtonElement;
  private redoBtn: HTMLButtonElement;
  private stepIndicator: HTMLElement;
  private clearBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;
  private confirmDialog: HTMLElement;
  private confirmOk: HTMLButtonElement;
  private confirmCancel: HTMLButtonElement;

  constructor(painting: PaintingCanvas) {
    this.painting = painting;

    this.brushButtons = document.querySelectorAll('.brush-btn') as NodeListOf<HTMLButtonElement>;
    this.inkSlider = document.getElementById('inkSlider') as HTMLInputElement;
    this.inkValue = document.getElementById('inkValue') as HTMLElement;
    this.sizeSlider = document.getElementById('sizeSlider') as HTMLInputElement;
    this.undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;
    this.redoBtn = document.getElementById('redoBtn') as HTMLButtonElement;
    this.stepIndicator = document.getElementById('stepIndicator') as HTMLElement;
    this.clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    this.exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    this.confirmDialog = document.getElementById('confirmDialog') as HTMLElement;
    this.confirmOk = document.getElementById('confirmOk') as HTMLButtonElement;
    this.confirmCancel = document.getElementById('confirmCancel') as HTMLButtonElement;

    this.bindEvents();
    this.updateUI();
  }

  private bindEvents(): void {
    this.brushButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.brush as BrushType;
        if (type) {
          this.painting.setBrushType(type);
          this.updateBrushButtons(type);
        }
      });
    });

    this.inkSlider.addEventListener('input', () => {
      const value = parseInt(this.inkSlider.value, 10);
      this.painting.setInkDensity(value / 100);
      this.inkValue.textContent = `${value}%`;
    });

    this.sizeSlider.addEventListener('input', () => {
      const value = parseInt(this.sizeSlider.value, 10);
      this.painting.setBrushSize(value);
    });

    this.undoBtn.addEventListener('click', () => {
      this.painting.undo();
    });

    this.redoBtn.addEventListener('click', () => {
      this.painting.redo();
    });

    this.clearBtn.addEventListener('click', () => {
      this.showConfirmDialog();
    });

    this.exportBtn.addEventListener('click', () => {
      this.painting.downloadPNG();
    });

    this.confirmOk.addEventListener('click', () => {
      this.hideConfirmDialog();
      this.painting.clear();
    });

    this.confirmCancel.addEventListener('click', () => {
      this.hideConfirmDialog();
    });

    this.confirmDialog.addEventListener('click', (e) => {
      if (e.target === this.confirmDialog) {
        this.hideConfirmDialog();
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.painting.redo();
        } else {
          this.painting.undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        this.painting.redo();
      }
    });

    this.painting.setStateChangeCallback(() => {
      this.updateUI();
    });
  }

  private updateBrushButtons(activeType: BrushType): void {
    this.brushButtons.forEach(btn => {
      const type = btn.dataset.brush;
      if (type === activeType) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private updateUI(): void {
    this.undoBtn.disabled = !this.painting.canUndo();
    this.redoBtn.disabled = !this.painting.canRedo();

    const currentStep = this.painting.getCurrentStep();
    const maxStep = this.painting.getMaxHistory();
    this.stepIndicator.textContent = `第 ${currentStep}/${maxStep} 步`;
  }

  private showConfirmDialog(): void {
    this.confirmDialog.classList.add('show');
  }

  private hideConfirmDialog(): void {
    this.confirmDialog.classList.remove('show');
  }
}
