import type { ShapeName, ShapeInfo } from './shapeManager';

interface ShapeButtonConfig {
  name: ShapeName;
  label: string;
  color: string;
}

export interface UIControllerOptions {
  shapes: ShapeButtonConfig[];
  initialShape: ShapeName;
  onShapeChange: (name: ShapeName) => void;
}

export class UIController {
  private container: HTMLDivElement;
  private panel: HTMLDivElement;
  private buttons: Map<ShapeName, HTMLButtonElement> = new Map();
  private indicator: HTMLDivElement;
  private activeShape: ShapeName;
  private options: UIControllerOptions;
  private shapeInfos: Map<ShapeName, ShapeButtonConfig> = new Map();

  private onShapeChangeBound: (e: Event) => void;
  private isAnimating: boolean = false;

  constructor(options: UIControllerOptions) {
    this.options = options;
    this.activeShape = options.initialShape;
    this.onShapeChangeBound = this.handleShapeChange.bind(this);

    options.shapes.forEach(s => this.shapeInfos.set(s.name, s));

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      left: 24px;
      bottom: 24px;
      z-index: 100;
      pointer-events: none;
    `;

    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      width: 240px;
      padding: 18px 16px 14px;
      background: rgba(26, 26, 46, 0.85);
      border: 1px solid #3A3A5E;
      border-radius: 12px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
    `;

    const title = document.createElement('div');
    title.textContent = '粒子雕塑形状';
    title.style.cssText = `
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 1px;
      margin-bottom: 12px;
      text-transform: uppercase;
    `;
    this.panel.appendChild(title);

    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.cssText = `
      position: relative;
      display: flex;
      gap: 8px;
      padding-bottom: 4px;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
      width: 100%;
    `;

    options.shapes.forEach((config) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.shape = config.name;
      btn.textContent = config.label;
      btn.style.cssText = `
        flex: 1;
        padding: 10px 8px;
        border: none;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.75);
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.25s ease, color 0.25s ease, transform 0.2s ease;
        outline: none;
        font-family: inherit;
        user-select: none;
      `;

      btn.addEventListener('mouseenter', () => {
        if (btn.dataset.shape !== this.activeShape) {
          btn.style.background = 'rgba(255, 255, 255, 0.1)';
          btn.style.color = '#ffffff';
        }
      });
      btn.addEventListener('mouseleave', () => {
        if (btn.dataset.shape !== this.activeShape) {
          btn.style.background = 'rgba(255, 255, 255, 0.05)';
          btn.style.color = 'rgba(255, 255, 255, 0.75)';
        }
      });
      btn.addEventListener('mousedown', () => {
        btn.style.transform = 'scale(0.96)';
      });
      btn.addEventListener('mouseup', () => {
        btn.style.transform = 'scale(1)';
      });

      btn.addEventListener('click', this.onShapeChangeBound);

      this.buttons.set(config.name, btn);
      buttonContainer.appendChild(btn);
    });

    this.indicator = document.createElement('div');
    this.indicator.style.cssText = `
      position: absolute;
      bottom: 0;
      height: 3px;
      border-radius: 2px;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
      pointer-events: none;
    `;

    buttonWrapper.appendChild(buttonContainer);
    buttonWrapper.appendChild(this.indicator);
    this.panel.appendChild(buttonWrapper);

    const hint = document.createElement('div');
    hint.textContent = '拖拽旋转 · 滚轮缩放';
    hint.style.cssText = `
      color: rgba(255, 255, 255, 0.3);
      font-size: 11px;
      text-align: center;
      margin-top: 12px;
      letter-spacing: 0.5px;
    `;
    this.panel.appendChild(hint);

    this.container.appendChild(this.panel);
    document.body.appendChild(this.container);

    requestAnimationFrame(() => {
      this.setActiveShape(this.activeShape, true);
    });
  }

  private handleShapeChange(e: Event): void {
    const btn = e.currentTarget as HTMLButtonElement;
    const shapeName = btn.dataset.shape as ShapeName;
    if (!shapeName || shapeName === this.activeShape || this.isAnimating) return;

    this.isAnimating = true;
    this.setActiveShape(shapeName, false);
    this.options.onShapeChange(shapeName);

    setTimeout(() => {
      this.isAnimating = false;
    }, 300);
  }

  setActiveShape(name: ShapeName, immediate: boolean = false): void {
    const info = this.shapeInfos.get(name);
    if (!info) return;

    this.activeShape = name;

    this.buttons.forEach((btn, btnName) => {
      if (btnName === name) {
        btn.style.background = `${info.color}22`;
        btn.style.color = info.color;
        btn.style.boxShadow = `0 0 0 1px ${info.color}55 inset`;
      } else {
        const btnInfo = this.shapeInfos.get(btnName)!;
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        btn.style.color = 'rgba(255, 255, 255, 0.75)';
        btn.style.boxShadow = 'none';
      }
    });

    const activeBtn = this.buttons.get(name)!;
    const containerRect = activeBtn.parentElement!.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const left = btnRect.left - containerRect.left;
    const width = btnRect.width;

    if (immediate) {
      this.indicator.style.transition = 'none';
    }
    this.indicator.style.left = `${left}px`;
    this.indicator.style.width = `${width}px`;
    this.indicator.style.backgroundColor = info.color;

    if (immediate) {
      requestAnimationFrame(() => {
        this.indicator.style.transition = '';
      });
    }
  }

  dispose(): void {
    this.buttons.forEach(btn => {
      btn.removeEventListener('click', this.onShapeChangeBound);
    });
    this.container.remove();
  }
}
