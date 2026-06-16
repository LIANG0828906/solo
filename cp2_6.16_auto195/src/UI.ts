import { Garden } from './Garden';

export class UI {
  private garden: Garden;
  private container: HTMLElement;
  private toolbar: HTMLDivElement;

  constructor(garden: Garden, container: HTMLElement) {
    this.garden = garden;
    this.container = container;
    this.toolbar = this.createToolbar();
    this.container.appendChild(this.toolbar);
  }

  private createToolbar(): HTMLDivElement {
    const toolbar = document.createElement('div');
    this.applyFrostedGlassStyle(toolbar);

    toolbar.style.cssText += `
      position: absolute;
      top: 24px;
      right: 24px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 220px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 1000;
      user-select: none;
    `;

    const title = document.createElement('div');
    title.textContent = 'CrystalGarden';
    title.style.cssText = `
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    `;
    toolbar.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.textContent = '水晶花园控制台';
    subtitle.style.cssText = `
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      font-weight: 400;
      margin-top: -8px;
      margin-bottom: 8px;
    `;
    toolbar.appendChild(subtitle);

    const regrowButton = this.createRegrowButton();
    toolbar.appendChild(regrowButton);

    const sliderContainer = this.createTerrainSlider();
    toolbar.appendChild(sliderContainer);

    const hint = document.createElement('div');
    hint.innerHTML = '💡 悬停发光 · 点击绽放<br>拖拽旋转 · 滚轮缩放';
    hint.style.cssText = `
      color: rgba(255, 255, 255, 0.4);
      font-size: 11px;
      line-height: 1.6;
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    `;
    toolbar.appendChild(hint);

    return toolbar;
  }

  private applyFrostedGlassStyle(element: HTMLElement): void {
    element.style.background = 'rgba(255, 255, 255, 0.1)';
    element.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    element.style.borderRadius = '12px';
    element.style.boxShadow = `
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `;
  }

  private createRegrowButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = '✨ 重新生长全部';
    button.type = 'button';

    button.style.cssText = `
      padding: 12px 16px;
      background: linear-gradient(135deg, rgba(155, 89, 182, 0.3), rgba(52, 152, 219, 0.3));
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    `;

    button.addEventListener('mouseenter', () => {
      button.style.background = 'linear-gradient(135deg, rgba(155, 89, 182, 0.5), rgba(52, 152, 219, 0.5))';
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 4px 20px rgba(155, 89, 182, 0.3)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'linear-gradient(135deg, rgba(155, 89, 182, 0.3), rgba(52, 152, 219, 0.3))';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });

    let isRegrowing = false;
    button.addEventListener('click', async () => {
      if (isRegrowing) return;
      isRegrowing = true;
      button.textContent = '⏳ 生长中...';
      button.style.opacity = '0.7';
      button.style.cursor = 'not-allowed';

      try {
        await this.garden.resetAllCrystals();
      } finally {
        isRegrowing = false;
        button.textContent = '✨ 重新生长全部';
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      }
    });

    return button;
  }

  private createTerrainSlider(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    const label = document.createElement('label');
    label.textContent = '地形起伏';
    label.style.cssText = `
      color: rgba(255, 255, 255, 0.7);
      font-size: 12px;
      font-weight: 500;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = '1.00';
    valueDisplay.style.cssText = `
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    `;
    label.appendChild(valueDisplay);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '2';
    slider.step = '0.01';
    slider.value = '1';

    slider.style.cssText = `
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.15);
      outline: none;
      cursor: pointer;
    `;

    const style = document.createElement('style');
    style.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, #9B59B6, #3498DB);
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 2px 10px rgba(155, 89, 182, 0.5);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 15px rgba(155, 89, 182, 0.7);
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, #9B59B6, #3498DB);
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 2px 10px rgba(155, 89, 182, 0.5);
      }
    `;
    document.head.appendChild(style);

    let updateTimeout: ReturnType<typeof setTimeout>;
    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      valueDisplay.textContent = value.toFixed(2);

      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        this.garden.updateTerrainAmplitude(value);
      }, 50);
    });

    container.appendChild(label);
    container.appendChild(slider);

    return container;
  }

  public dispose(): void {
    if (this.toolbar && this.toolbar.parentNode) {
      this.toolbar.parentNode.removeChild(this.toolbar);
    }
  }
}
