import { GeometryInfo } from './extrusionManager.js';

type DepthChangeCallback = (depth: number) => void;
type ShadingToggleCallback = (smooth: boolean) => void;
type ResetViewCallback = () => void;
type ClearCallback = () => void;

export class UIManager {
  private container: HTMLElement;
  private depthSlider: HTMLInputElement | null = null;
  private smoothToggle: HTMLInputElement | null = null;
  private statusFps: HTMLSpanElement | null = null;
  private statusPoints: HTMLSpanElement | null = null;
  private infoVertices: HTMLSpanElement | null = null;
  private infoFaces: HTMLSpanElement | null = null;
  private infoVolume: HTMLSpanElement | null = null;
  private infoTimestamp: HTMLSpanElement | null = null;

  private onDepthChangeCb: DepthChangeCallback | null = null;
  private onShadingToggleCb: ShadingToggleCallback | null = null;
  private onResetViewCb: ResetViewCallback | null = null;
  private onClearCb: ClearCallback | null = null;

  private fpsHistory: number[] = [];
  private lastFpsUpdate: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.buildUI();
  }

  private buildUI(): void {
    const mainLayout = document.createElement('div');
    mainLayout.className = 'main-layout';

    const canvasArea = this.createCanvasArea();
    const panelArea = this.createPanelArea();
    const statusBar = this.createStatusBar();

    mainLayout.appendChild(canvasArea);
    mainLayout.appendChild(panelArea);

    this.container.appendChild(mainLayout);
    this.container.appendChild(statusBar);
  }

  private createCanvasArea(): HTMLElement {
    const area = document.createElement('div');
    area.className = 'canvas-area';

    const stage = document.createElement('div');
    stage.className = 'canvas-stage';

    const threeContainer = document.createElement('div');
    threeContainer.id = 'threeContainer';

    const drawCanvas = document.createElement('canvas');
    drawCanvas.id = 'drawCanvas';

    const hint = document.createElement('div');
    hint.className = 'canvas-hint';
    hint.innerHTML = '🖌️ 在画布上拖动鼠标绘制轮廓<br>双击闭合路径生成3D模型';

    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'slider-wrapper';

    const sliderLabel = document.createElement('span');
    sliderLabel.className = 'slider-label';
    sliderLabel.innerHTML = '<svg class="slider-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>拉伸深度';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'glass-slider';
    slider.min = '0.5';
    slider.max = '10';
    slider.step = '0.1';
    slider.value = '3';
    this.depthSlider = slider;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'slider-value';
    valueSpan.textContent = '3.0';

    slider.addEventListener('input', () => {
      const val = parseFloat(slider.value);
      valueSpan.textContent = val.toFixed(1);
      if (this.onDepthChangeCb) {
        this.onDepthChangeCb(val);
      }
    });

    sliderWrapper.appendChild(sliderLabel);
    sliderWrapper.appendChild(slider);
    sliderWrapper.appendChild(valueSpan);

    stage.appendChild(threeContainer);
    stage.appendChild(drawCanvas);
    stage.appendChild(hint);
    stage.appendChild(sliderWrapper);
    area.appendChild(stage);

    return area;
  }

  private createPanelArea(): HTMLElement {
    const area = document.createElement('div');
    area.className = 'panel-area';

    const titleCard = document.createElement('div');
    titleCard.className = 'panel-title-card';
    titleCard.innerHTML = `
      <svg class="panel-title-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 15.5a4.5 4.5 0 0 1-4.5 4.5H7a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4h10a4.5 4.5 0 0 1 4.5 4.5v9z"/>
        <path d="M9 9h6M9 13h6M9 17h4"/>
      </svg>
      <span class="panel-title-text">属性</span>
    `;

    const infoCard = this.createInfoCard();
    const toggleCard = this.createToggleCard();
    const actionButtons = this.createActionButtons();

    area.appendChild(titleCard);
    area.appendChild(infoCard);
    area.appendChild(toggleCard);
    area.appendChild(actionButtons);

    return area;
  }

  private createInfoCard(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'info-card';

    const title = document.createElement('div');
    title.className = 'info-card-title';
    title.textContent = '几何体信息';

    const list = document.createElement('div');
    list.className = 'info-list';

    const verticesItem = this.createInfoItem(
      '顶点数',
      '<svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>',
      '--'
    );
    this.infoVertices = verticesItem.querySelector('.info-value') as HTMLSpanElement;

    const facesItem = this.createInfoItem(
      '三角面数',
      '<svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 22h20L12 2z"/></svg>',
      '--'
    );
    this.infoFaces = facesItem.querySelector('.info-value') as HTMLSpanElement;

    const volumeItem = this.createInfoItem(
      '体积近似',
      '<svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
      '--'
    );
    this.infoVolume = volumeItem.querySelector('.info-value') as HTMLSpanElement;

    const timeItem = this.createInfoItem(
      '生成时间',
      '<svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      '--'
    );
    this.infoTimestamp = timeItem.querySelector('.info-value') as HTMLSpanElement;

    list.appendChild(verticesItem);
    list.appendChild(facesItem);
    list.appendChild(volumeItem);
    list.appendChild(timeItem);

    card.appendChild(title);
    card.appendChild(list);

    return card;
  }

  private createInfoItem(label: string, iconSvg: string, value: string): HTMLElement {
    const item = document.createElement('div');
    item.className = 'info-item';

    const labelEl = document.createElement('span');
    labelEl.className = 'info-label';
    labelEl.innerHTML = iconSvg + label;

    const valueEl = document.createElement('span');
    valueEl.className = 'info-value';
    valueEl.textContent = value;

    item.appendChild(labelEl);
    item.appendChild(valueEl);

    return item;
  }

  private createToggleCard(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'toggle-card';

    const row = document.createElement('div');
    row.className = 'toggle-row';

    const labelGroup = document.createElement('div');
    labelGroup.className = 'toggle-label-group';

    const title = document.createElement('span');
    title.className = 'toggle-title';
    title.innerHTML = '<svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>光滑着色';

    const desc = document.createElement('span');
    desc.className = 'toggle-desc';
    desc.textContent = '开启后产生抛光塑料高光效果';

    labelGroup.appendChild(title);
    labelGroup.appendChild(desc);

    const switchEl = document.createElement('label');
    switchEl.className = 'switch';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = false;
    this.smoothToggle = checkbox;

    const sliderEl = document.createElement('span');
    sliderEl.className = 'switch-slider';

    checkbox.addEventListener('change', () => {
      if (this.onShadingToggleCb) {
        this.onShadingToggleCb(checkbox.checked);
      }
    });

    switchEl.appendChild(checkbox);
    switchEl.appendChild(sliderEl);

    row.appendChild(labelGroup);
    row.appendChild(switchEl);
    card.appendChild(row);

    return card;
  }

  private createActionButtons(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'action-buttons';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'glass-btn';
    resetBtn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>重置视角';
    resetBtn.addEventListener('click', () => {
      if (this.onResetViewCb) this.onResetViewCb();
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'glass-btn';
    clearBtn.innerHTML = '<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>清除画布';
    clearBtn.addEventListener('click', () => {
      if (this.onClearCb) this.onClearCb();
    });

    container.appendChild(resetBtn);
    container.appendChild(clearBtn);

    return container;
  }

  private createStatusBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'status-bar';

    const leftGroup = document.createElement('div');
    leftGroup.className = 'status-group';

    const fpsItem = document.createElement('div');
    fpsItem.className = 'status-item';
    fpsItem.innerHTML = '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>FPS: <span class="status-fps-value">--</span>';
    this.statusFps = fpsItem.querySelector('.status-fps-value') as HTMLSpanElement;

    const pointsItem = document.createElement('div');
    pointsItem.className = 'status-item';
    pointsItem.innerHTML = '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/></svg>绘制点数: <span class="status-points-value">0</span>';
    this.statusPoints = pointsItem.querySelector('.status-points-value') as HTMLSpanElement;

    leftGroup.appendChild(fpsItem);
    leftGroup.appendChild(pointsItem);

    const rightGroup = document.createElement('div');
    rightGroup.className = 'status-group';
    rightGroup.textContent = 'Sketch2Model v1.0';

    bar.appendChild(leftGroup);
    bar.appendChild(rightGroup);

    return bar;
  }

  public onDepthChange(callback: DepthChangeCallback): void {
    this.onDepthChangeCb = callback;
  }

  public onShadingToggle(callback: ShadingToggleCallback): void {
    this.onShadingToggleCb = callback;
  }

  public onResetView(callback: ResetViewCallback): void {
    this.onResetViewCb = callback;
  }

  public onClear(callback: ClearCallback): void {
    this.onClearCb = callback;
  }

  public updateGeometryInfo(info: GeometryInfo | null): void {
    if (this.infoVertices) {
      this.infoVertices.textContent = info ? info.vertices.toString() : '--';
    }
    if (this.infoFaces) {
      this.infoFaces.textContent = info ? Math.round(info.faces).toString() : '--';
    }
    if (this.infoVolume) {
      this.infoVolume.textContent = info ? info.volume.toFixed(2) : '--';
    }
    if (this.infoTimestamp) {
      if (info) {
        const ts = info.timestamp;
        const h = ts.getHours().toString().padStart(2, '0');
        const m = ts.getMinutes().toString().padStart(2, '0');
        const s = ts.getSeconds().toString().padStart(2, '0');
        this.infoTimestamp.textContent = `${h}:${m}:${s}`;
      } else {
        this.infoTimestamp.textContent = '--';
      }
    }
  }

  public updateStatus(fps: number, drawPoints: number): void {
    const now = performance.now();

    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 30) {
      this.fpsHistory.shift();
    }

    if (now - this.lastFpsUpdate > 500) {
      const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      if (this.statusFps) {
        this.statusFps.textContent = Math.round(avgFps).toString();
      }
      this.lastFpsUpdate = now;
    }

    if (this.statusPoints) {
      this.statusPoints.textContent = drawPoints.toString();
    }
  }

  public setSmoothToggleState(smooth: boolean): void {
    if (this.smoothToggle) {
      this.smoothToggle.checked = smooth;
    }
  }

  public getDepthSliderValue(): number {
    return this.depthSlider ? parseFloat(this.depthSlider.value) : 3;
  }

  public dispose(): void {
    this.onDepthChangeCb = null;
    this.onShadingToggleCb = null;
    this.onResetViewCb = null;
    this.onClearCb = null;
  }
}
