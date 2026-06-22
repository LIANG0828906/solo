import { BrushController } from './brush';
import { Terrain } from './terrain';
import { BrushPosition } from './module_a/shared_types';

export class UIController {
  private container: HTMLElement;
  private brushController: BrushController;
  private terrain: Terrain;
  private toolbar!: HTMLElement;
  private infoPanel!: HTMLElement;
  private raiseBtn!: HTMLElement;
  private lowerBtn!: HTMLElement;
  private radiusSlider!: HTMLInputElement;
  private strengthSlider!: HTMLInputElement;
  private radiusValue!: HTMLElement;
  private strengthValue!: HTMLElement;
  private posXEl!: HTMLElement;
  private posZEl!: HTMLElement;
  private fpsEl!: HTMLElement;
  private verticesEl!: HTMLElement;
  private trianglesEl!: HTMLElement;
  private fpsBlinkState: boolean;
  private lastFpsUpdateTime: number;

  constructor(container: HTMLElement, brushController: BrushController, terrain: Terrain) {
    this.container = container;
    this.brushController = brushController;
    this.terrain = terrain;
    this.fpsBlinkState = false;
    this.lastFpsUpdateTime = 0;

    this.injectGlobalStyles();
    this.createToolbar();
    this.createInfoPanel();
    this.setupEventListeners();

    this.brushController.onBrushPositionChange = (pos: BrushPosition) => {
      this.updateBrushPosition(pos);
    };
  }

  private injectGlobalStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fpsBlink {
        0%, 100% { color: #ef4444; text-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }
        50% { color: #fca5a5; text-shadow: 0 0 16px rgba(239, 68, 68, 0.8); }
      }
      @keyframes brushSpinIn {
        0% { transform: rotate(0deg) scale(0.6); opacity: 0.3; }
        60% { transform: rotate(260deg) scale(1.1); opacity: 1; }
        100% { transform: rotate(360deg) scale(1); opacity: 1; }
      }
      .tool-btn {
        transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
      }
      .tool-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 0 16px rgba(110, 231, 183, 0.25);
      }
      .slider-container {
        transition: transform 0.15s ease, background 0.15s ease;
        border-radius: 6px;
        padding: 4px;
        margin: -4px;
      }
      .slider-container:hover {
        transform: scale(1.04);
        background: rgba(110, 231, 183, 0.06);
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        background: #6ee7b7;
        border-radius: 50%;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        box-shadow: 0 0 8px rgba(110, 231, 183, 0.4);
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.3);
        box-shadow: 0 0 14px rgba(110, 231, 183, 0.7);
      }
      input[type="range"]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        background: #6ee7b7;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .fps-warning {
        animation: fpsBlink 0.8s ease-in-out infinite !important;
      }
      .info-row-value {
        transition: color 0.15s ease, text-shadow 0.15s ease;
      }
    `;
    document.head.appendChild(style);
  }

  private createToolbar(): void {
    this.toolbar = document.createElement('div');
    this.toolbar.style.cssText = `
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(110, 231, 183, 0.2);
      border-radius: 12px;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 100;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('div');
    title.textContent = '工具';
    title.style.cssText = `
      color: #6ee7b7;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
      text-align: center;
    `;
    this.toolbar.appendChild(title);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    this.raiseBtn = this.createToolButton(
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      '隆起',
      'raise',
      true
    );
    this.lowerBtn = this.createToolButton(
      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z',
      '凹陷',
      'lower',
      false
    );

    btnContainer.appendChild(this.raiseBtn);
    btnContainer.appendChild(this.lowerBtn);
    this.toolbar.appendChild(btnContainer);

    const divider = document.createElement('div');
    divider.style.cssText = `
      height: 1px;
      background: rgba(110, 231, 183, 0.15);
      margin: 4px 0;
    `;
    this.toolbar.appendChild(divider);

    const radiusControl = this.createSliderControl('半径', 2, 8, 4, 'radius');
    this.radiusSlider = radiusControl.slider;
    this.radiusValue = radiusControl.value;
    this.toolbar.appendChild(radiusControl.container);

    const strengthControl = this.createSliderControl('力度', 0.1, 1.0, 0.5, 'strength');
    this.strengthSlider = strengthControl.slider;
    this.strengthValue = strengthControl.value;
    this.toolbar.appendChild(strengthControl.container);

    this.container.appendChild(this.toolbar);
  }

  private createToolButton(
    svgPath: string,
    tooltip: string,
    type: 'raise' | 'lower',
    isActive: boolean
  ): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.dataset.toolType = type;
    btn.title = tooltip;
    btn.style.cssText = `
      width: 48px;
      height: 48px;
      background: ${isActive ? 'rgba(110, 231, 183, 0.2)' : 'rgba(30, 41, 59, 0.8)'};
      border: 2px solid ${isActive ? '#6ee7b7' : 'rgba(110, 231, 183, 0.3)'};
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    `;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.dataset.toolType = type;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', svgPath);
    path.setAttribute('fill', isActive ? '#6ee7b7' : 'rgba(110, 231, 183, 0.7)');
    path.setAttribute('stroke', isActive ? '#6ee7b7' : 'rgba(110, 231, 183, 0.5)');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);

    if (isActive) {
      svg.style.animation = 'none';
      svg.style.transform = 'rotate(0deg) scale(1)';
      svg.style.opacity = '1';
    }

    btn.appendChild(svg);

    btn.addEventListener('click', () => {
      this.setActiveTool(type);
    });

    if (isActive) {
      btn.dataset.active = 'true';
    }

    return btn;
  }

  private createSliderControl(
    label: string,
    min: number,
    max: number,
    value: number,
    type: 'radius' | 'strength'
  ): { container: HTMLElement; slider: HTMLInputElement; value: HTMLElement } {
    const wrapper = document.createElement('div');
    wrapper.className = 'slider-container';

    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 6px;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: rgba(110, 231, 183, 0.8);
      font-size: 11px;
      font-weight: 500;
    `;

    const valueEl = document.createElement('span');
    valueEl.textContent = type === 'radius' ? value.toString() : value.toFixed(2);
    valueEl.style.cssText = `
      color: #6ee7b7;
      font-size: 11px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    `;

    header.appendChild(labelEl);
    header.appendChild(valueEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = type === 'radius' ? '1' : '0.05';
    slider.value = value.toString();

    const percent = ((value - min) / (max - min)) * 100;
    slider.style.cssText = `
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      background: linear-gradient(to right, #6ee7b7 0%, #6ee7b7 ${percent}%, rgba(30, 41, 59, 0.9) ${percent}%, rgba(30, 41, 59, 0.9) 100%);
    `;

    container.appendChild(header);
    container.appendChild(slider);
    wrapper.appendChild(container);

    return { container: wrapper, slider, value: valueEl };
  }

  private createInfoPanel(): void {
    this.infoPanel = document.createElement('div');
    this.infoPanel.style.cssText = `
      position: absolute;
      right: 20px;
      top: 20px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(110, 231, 183, 0.2);
      border-radius: 12px;
      padding: 16px;
      min-width: 200px;
      z-index: 100;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const title = document.createElement('div');
    title.textContent = '实时信息';
    title.style.cssText = `
      color: #6ee7b7;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(110, 231, 183, 0.15);
    `;
    this.infoPanel.appendChild(title);

    const posXRow = this.createInfoRow('X 坐标', '--');
    const posZRow = this.createInfoRow('Z 坐标', '--');
    const fpsRow = this.createInfoRow('帧率', '--');
    const verticesRow = this.createInfoRow('顶点数', this.terrain.getVertexCount().toLocaleString());
    const trianglesRow = this.createInfoRow('三角形数', Math.floor(this.terrain.getTriangleCount()).toLocaleString());

    this.posXEl = posXRow.value;
    this.posZEl = posZRow.value;
    this.fpsEl = fpsRow.value;
    this.verticesEl = verticesRow.value;
    this.trianglesEl = trianglesRow.value;

    this.fpsEl.style.fontWeight = '700';

    this.infoPanel.appendChild(posXRow.row);
    this.infoPanel.appendChild(posZRow.row);
    this.infoPanel.appendChild(fpsRow.row);
    this.infoPanel.appendChild(verticesRow.row);
    this.infoPanel.appendChild(trianglesRow.row);

    this.container.appendChild(this.infoPanel);
  }

  private createInfoRow(label: string, value: string): { row: HTMLElement; value: HTMLElement } {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    `;

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.cssText = `
      color: rgba(148, 163, 184, 0.9);
      font-size: 12px;
    `;

    const valueEl = document.createElement('span');
    valueEl.className = 'info-row-value';
    valueEl.textContent = value;
    valueEl.style.cssText = `
      color: #6ee7b7;
      font-size: 12px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    `;

    row.appendChild(labelEl);
    row.appendChild(valueEl);

    return { row, value: valueEl };
  }

  private setupEventListeners(): void {
    this.radiusSlider.addEventListener('input', () => {
      const value = parseInt(this.radiusSlider.value);
      this.brushController.setBrushRadius(value);
      this.radiusValue.textContent = value.toString();
      this.updateSliderFill(this.radiusSlider);
    });

    this.strengthSlider.addEventListener('input', () => {
      const value = parseFloat(this.strengthSlider.value);
      this.brushController.setBrushStrength(value);
      this.strengthValue.textContent = value.toFixed(2);
      this.updateSliderFill(this.strengthSlider);
    });
  }

  private updateSliderFill(slider: HTMLInputElement): void {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const percent = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #6ee7b7 0%, #6ee7b7 ${percent}%, rgba(30, 41, 59, 0.9) ${percent}%, rgba(30, 41, 59, 0.9) 100%)`;
  }

  private setActiveTool(type: 'raise' | 'lower'): void {
    this.brushController.setBrushType(type);

    const buttons = [this.raiseBtn, this.lowerBtn];
    buttons.forEach((btn) => {
      const isActive = btn.dataset.toolType === type;
      btn.dataset.active = isActive ? 'true' : 'false';
      btn.style.background = isActive ? 'rgba(110, 231, 183, 0.2)' : 'rgba(30, 41, 59, 0.8)';
      btn.style.borderColor = isActive ? '#6ee7b7' : 'rgba(110, 231, 183, 0.3)';

      const svg = btn.querySelector('svg');
      const path = btn.querySelector('path');
      if (svg) {
        if (isActive) {
          svg.style.animation = 'none';
          void svg.offsetWidth;
          svg.style.animation = 'brushSpinIn 0.2s ease forwards';
        } else {
          svg.style.animation = 'none';
          svg.style.transform = 'rotate(0deg) scale(1)';
          svg.style.opacity = '1';
        }
      }
      if (path) {
        path.setAttribute('fill', isActive ? '#6ee7b7' : 'rgba(110, 231, 183, 0.7)');
        path.setAttribute('stroke', isActive ? '#6ee7b7' : 'rgba(110, 231, 183, 0.5)');
      }
    });
  }

  private updateBrushPosition(pos: BrushPosition): void {
    if (pos.visible) {
      this.posXEl.textContent = pos.worldX.toFixed(2);
      this.posZEl.textContent = pos.worldZ.toFixed(2);
    } else {
      this.posXEl.textContent = '--';
      this.posZEl.textContent = '--';
    }
  }

  public updateFPS(fps: number): void {
    const now = performance.now();
    if (now - this.lastFpsUpdateTime < 250) return;
    this.lastFpsUpdateTime = now;

    this.fpsEl.textContent = `${fps.toFixed(0)} FPS`;

    if (fps < 25) {
      this.fpsEl.classList.add('fps-warning');
      this.fpsEl.style.color = '';
    } else {
      this.fpsEl.classList.remove('fps-warning');
      this.fpsEl.style.color = '#6ee7b7';
    }
  }
}
