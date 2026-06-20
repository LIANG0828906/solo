import { EffectType, hslToHex } from './effects';

export type BgPreset = 'night' | 'sunset' | 'ocean' | 'aurora';

export interface UICallbacks {
  onEffectChange: (effect: EffectType) => void;
  onColorChange: (color: string) => void;
  onBgChange: (preset: BgPreset) => void;
  onClear: () => void;
  onSave: () => void;
}

export class UIController {
  private hueRing: HTMLCanvasElement;
  private hueCtx: CanvasRenderingContext2D;
  private brightnessSlider: HTMLInputElement;
  private brightnessValue: HTMLSpanElement;
  private colorPreviewBox: HTMLDivElement;
  private canvasWrapper: HTMLDivElement;
  private cursorPreview: HTMLDivElement;
  private effectButtons: NodeListOf<HTMLButtonElement>;
  private bgRadios: NodeListOf<HTMLInputElement>;
  private clearBtn: HTMLButtonElement;
  private saveBtn: HTMLButtonElement;
  private callbacks: UICallbacks;

  private hue: number = 0;
  private saturation: number = 1;
  private brightness: number = 1;
  private selectedHue: number = 0;
  private isDraggingHue: boolean = false;
  private currentColor: string = '#ff0000';
  private minBrightness: number = 50;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    const hueRing = document.getElementById('hueRing') as HTMLCanvasElement | null;
    const brightnessSlider = document.getElementById('brightnessSlider') as HTMLInputElement | null;
    const brightnessValue = document.getElementById('brightnessValue') as HTMLSpanElement | null;
    const colorPreviewBox = document.getElementById('colorPreviewBox') as HTMLDivElement | null;
    const canvasWrapper = document.querySelector('.canvas-wrapper') as HTMLDivElement | null;
    const cursorPreview = document.getElementById('cursorPreview') as HTMLDivElement | null;
    const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement | null;
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement | null;

    if (!hueRing || !brightnessSlider || !brightnessValue || !colorPreviewBox ||
        !canvasWrapper || !cursorPreview || !clearBtn || !saveBtn) {
      throw new Error('UI元素初始化失败：缺少必要的DOM元素');
    }

    const hueCtx = hueRing.getContext('2d');
    if (!hueCtx) {
      throw new Error('无法获取色环Canvas上下文');
    }

    this.hueRing = hueRing;
    this.hueCtx = hueCtx;
    this.brightnessSlider = brightnessSlider;
    this.brightnessValue = brightnessValue;
    this.colorPreviewBox = colorPreviewBox;
    this.canvasWrapper = canvasWrapper;
    this.cursorPreview = cursorPreview;
    this.clearBtn = clearBtn;
    this.saveBtn = saveBtn;

    this.effectButtons = document.querySelectorAll<HTMLButtonElement>('.effect-btn');
    this.bgRadios = document.querySelectorAll<HTMLInputElement>('input[name="bgPreset"]');

    this.brightnessSlider.min = String(this.minBrightness);

    this.drawHueRing();
    this.attachEventListeners();
    this.updateColor();
  }

  private drawHueRing(): void {
    const ctx = this.hueCtx;
    const canvas = this.hueRing;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 4;
    const innerRadius = outerRadius - 30;

    ctx.clearRect(0, 0, width, height);

    for (let angle = 0; angle < 360; angle++) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;

      const color = hslToHex(angle, 1, this.brightness);

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }

    const selectedAngle = (this.selectedHue * Math.PI) / 180;
    const indicatorRadius = (outerRadius + innerRadius) / 2;
    const indicatorX = centerX + Math.cos(selectedAngle) * indicatorRadius;
    const indicatorY = centerY + Math.sin(selectedAngle) * indicatorRadius;

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius - 6, 0, Math.PI * 2);
    ctx.fillStyle = this.currentColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private attachEventListeners(): void {
    this.hueRing.addEventListener('mousedown', this.handleHueMouseDown.bind(this));
    window.addEventListener('mousemove', this.handleHueMouseMove.bind(this));
    window.addEventListener('mouseup', this.handleHueMouseUp.bind(this));

    this.hueRing.addEventListener('touchstart', this.handleHueTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.handleHueTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.handleHueTouchEnd.bind(this));

    this.brightnessSlider.addEventListener('input', this.handleBrightnessChange.bind(this));

    this.effectButtons.forEach(btn => {
      btn.addEventListener('click', this.handleEffectClick.bind(this, btn));
    });

    this.bgRadios.forEach(radio => {
      radio.addEventListener('change', this.handleBgChange.bind(this, radio));
    });

    this.clearBtn.addEventListener('click', () => {
      this.callbacks.onClear();
    });

    this.saveBtn.addEventListener('click', () => {
      this.callbacks.onSave();
    });

    const paintCanvas = document.getElementById('paintCanvas');
    if (paintCanvas) {
      paintCanvas.addEventListener('mousemove', this.handleCanvasMouseMove.bind(this));
      paintCanvas.addEventListener('mouseenter', this.handleCanvasMouseEnter.bind(this));
      paintCanvas.addEventListener('mouseleave', this.handleCanvasMouseLeave.bind(this));
    }
  }

  private getHueFromPosition(clientX: number, clientY: number): boolean {
    const rect = this.hueRing.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;

    const distance = Math.sqrt(x * x + y * y);
    const outerRadius = Math.min(rect.width, rect.height) / 2 - 4;
    const innerRadius = outerRadius - 30;

    if (distance < innerRadius - 15 || distance > outerRadius + 15) {
      return false;
    }

    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    this.selectedHue = angle;
    this.hue = angle;
    return true;
  }

  private handleHueMouseDown(e: MouseEvent): void {
    if (this.getHueFromPosition(e.clientX, e.clientY)) {
      this.isDraggingHue = true;
      this.updateColor();
    }
  }

  private handleHueMouseMove(e: MouseEvent): void {
    if (this.isDraggingHue) {
      this.getHueFromPosition(e.clientX, e.clientY);
      this.updateColor();
    }
  }

  private handleHueMouseUp(): void {
    this.isDraggingHue = false;
  }

  private handleHueTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      if (this.getHueFromPosition(touch.clientX, touch.clientY)) {
        this.isDraggingHue = true;
        this.updateColor();
      }
    }
  }

  private handleHueTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (this.isDraggingHue && e.touches.length > 0) {
      const touch = e.touches[0];
      this.getHueFromPosition(touch.clientX, touch.clientY);
      this.updateColor();
    }
  }

  private handleHueTouchEnd(): void {
    this.isDraggingHue = false;
  }

  private handleBrightnessChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    let value = parseInt(target.value, 10);

    if (value < this.minBrightness) {
      value = this.minBrightness;
      target.value = String(value);
    }

    this.brightness = value / 100;
    this.brightnessValue.textContent = `${value}%`;
    this.updateColor();
  }

  private updateColor(): void {
    this.currentColor = hslToHex(this.selectedHue, this.saturation, this.brightness);
    this.colorPreviewBox.style.background = this.currentColor;
    this.colorPreviewBox.style.boxShadow = `0 0 15px ${this.currentColor}50`;
    this.cursorPreview.style.background = this.currentColor;
    this.callbacks.onColorChange(this.currentColor);
    this.drawHueRing();
  }

  private handleEffectClick(btn: HTMLButtonElement): void {
    const effect = btn.dataset.effect as EffectType;
    if (!effect) return;

    this.effectButtons.forEach(b => {
      b.classList.remove('active');
      b.classList.remove('flipped');
    });

    btn.classList.add('flipped');
    btn.classList.add('active');

    this.callbacks.onEffectChange(effect);
  }

  private handleBgChange(radio: HTMLInputElement): void {
    const preset = radio.value as BgPreset;
    this.callbacks.onBgChange(preset);
  }

  private handleCanvasMouseMove(e: MouseEvent): void {
    const rect = this.canvasWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.cursorPreview.style.left = `${x}px`;
    this.cursorPreview.style.top = `${y}px`;
  }

  private handleCanvasMouseEnter(): void {
    this.cursorPreview.style.display = 'block';
  }

  private handleCanvasMouseLeave(): void {
    this.cursorPreview.style.display = 'none';
  }

  public getCurrentColor(): string {
    return this.currentColor;
  }

  public setCanvasWrapperBg(gradientCss: string): void {
    this.canvasWrapper.style.background = gradientCss;
  }
}
