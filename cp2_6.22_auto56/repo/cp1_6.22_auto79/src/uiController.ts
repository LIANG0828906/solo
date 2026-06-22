export interface UICallbacks {
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onClear: () => void;
}

const PRESET_COLORS = [
  '#00d4ff',
  '#a855f7',
  '#ff00ea',
  '#ff6b35',
  '#00ff88',
  '#ffd700',
  '#ff4444',
  '#ff8800',
  '#44ffff',
  '#ff66aa',
  '#88ff44',
  '#ffffff',
];

export class UIController {
  private panel: HTMLElement;
  private callbacks: UICallbacks;
  private colorGrid: HTMLElement;
  private customColorInput: HTMLInputElement;
  private sizeSlider: HTMLInputElement;
  private sizeValue: HTMLElement;
  private brushPreview: HTMLElement;
  private clearBtn: HTMLElement;
  private panelToggle: HTMLElement;
  private loadingOverlay: HTMLElement;
  private loadingText: HTMLElement;
  private permissionPrompt: HTMLElement;
  private permissionBtn: HTMLElement;
  private statusDot: HTMLElement;
  private gestureIndicator: HTMLElement;
  private currentColor = '#00d4ff';
  private currentSize = 6;
  private panelCollapsed = false;

  constructor(panelElement: HTMLElement, callbacks: UICallbacks) {
    this.panel = panelElement;
    this.callbacks = callbacks;
    this.colorGrid = document.getElementById('color-grid') as HTMLElement;
    this.customColorInput = document.getElementById('custom-color') as HTMLInputElement;
    this.sizeSlider = document.getElementById('size-slider') as HTMLInputElement;
    this.sizeValue = document.getElementById('size-value') as HTMLElement;
    this.brushPreview = document.getElementById('brush-preview') as HTMLElement;
    this.clearBtn = document.getElementById('clear-btn') as HTMLElement;
    this.panelToggle = document.getElementById('panel-toggle') as HTMLElement;
    this.loadingOverlay = document.getElementById('loading-overlay') as HTMLElement;
    this.loadingText = document.getElementById('loading-text') as HTMLElement;
    this.permissionPrompt = document.getElementById('permission-prompt') as HTMLElement;
    this.permissionBtn = document.getElementById('permission-btn') as HTMLElement;
    this.statusDot = document.getElementById('status-dot') as HTMLElement;
    this.gestureIndicator = document.getElementById('gesture-indicator') as HTMLElement;
  }

  init(): void {
    this.buildColorGrid();
    this.bindEvents();
    this.updateBrushPreview();
    this.selectColor(this.currentColor);
    this.updateSizeDisplay();
  }

  private buildColorGrid(): void {
    this.colorGrid.innerHTML = '';
    PRESET_COLORS.forEach((color) => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.background = color;
      swatch.style.color = color;
      swatch.dataset.color = color;
      swatch.title = color;
      swatch.addEventListener('click', () => this.selectColor(color));
      this.colorGrid.appendChild(swatch);
    });
  }

  private bindEvents(): void {
    this.customColorInput.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      this.selectColor(color);
    });
    this.sizeSlider.addEventListener('input', (e) => {
      const size = parseInt((e.target as HTMLInputElement).value, 10);
      this.setSize(size);
    });
    this.clearBtn.addEventListener('click', () => {
      this.callbacks.onClear();
    });
    this.panelToggle.addEventListener('click', () => {
      this.setPanelCollapsed(!this.panelCollapsed);
    });
    this.permissionBtn.addEventListener('click', () => {
      this.hidePermissionPrompt();
    });
  }

  private selectColor(color: string): void {
    this.currentColor = color;
    const swatches = this.colorGrid.querySelectorAll('.color-swatch');
    swatches.forEach((s) => {
      if ((s as HTMLElement).dataset.color === color) {
        s.classList.add('selected');
      } else {
        s.classList.remove('selected');
      }
    });
    this.customColorInput.value = color;
    this.brushPreview.style.background = `radial-gradient(circle, ${this.hexToRgba(color, 0.85)} 0%, ${this.hexToRgba(color, 0.3)} 60%, transparent 100%)`;
    this.brushPreview.style.boxShadow = `0 0 15px ${this.hexToRgba(color, 0.6)}`;
    this.callbacks.onColorChange(color);
  }

  private setSize(size: number): void {
    this.currentSize = size;
    this.sizeSlider.value = String(size);
    this.updateSizeDisplay();
    this.updateBrushPreview();
    this.callbacks.onSizeChange(size);
  }

  private updateSizeDisplay(): void {
    this.sizeValue.textContent = `${this.currentSize}px`;
  }

  private updateBrushPreview(): void {
    const px = 10 + this.currentSize * 2.5;
    this.brushPreview.style.width = `${px}px`;
    this.brushPreview.style.height = `${px}px`;
  }

  private hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getColor(): string {
    return this.currentColor;
  }

  getSize(): number {
    return this.currentSize;
  }

  setPanelCollapsed(collapsed: boolean): void {
    this.panelCollapsed = collapsed;
    if (collapsed) {
      this.panel.classList.add('collapsed');
    } else {
      this.panel.classList.remove('collapsed');
    }
  }

  showLoading(message: string): void {
    this.loadingText.textContent = message;
    this.loadingOverlay.classList.remove('hidden');
  }

  hideLoading(): void {
    this.loadingOverlay.classList.add('hidden');
  }

  updateLoading(message: string): void {
    this.loadingText.textContent = message;
  }

  showPermissionPrompt(): Promise<boolean> {
    return new Promise((resolve) => {
      this.permissionPrompt.classList.add('visible');
      const handler = () => {
        this.permissionPrompt.classList.remove('visible');
        this.permissionBtn.removeEventListener('click', handler);
        resolve(true);
      };
      this.permissionBtn.addEventListener('click', handler);
    });
  }

  hidePermissionPrompt(): void {
    this.permissionPrompt.classList.remove('visible');
  }

  updateStatus(active: boolean, gesture: string): void {
    if (active) {
      this.statusDot.classList.add('active');
    } else {
      this.statusDot.classList.remove('active');
    }
    const gestureLabel: Record<string, string> = {
      open: '绘制中',
      fist: '已暂停',
      pinch: '清空',
      drag: '旋转场景',
      none: '等待手势',
    };
    this.gestureIndicator.textContent = gestureLabel[gesture] || '等待手势';
  }
}
