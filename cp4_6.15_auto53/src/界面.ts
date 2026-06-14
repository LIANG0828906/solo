import { FaultType } from './断层';

export interface LayerParams {
  thickness: number;
  texture: number;
}

export interface UICallbacks {
  onLayerParamChange: (layerIndex: number, param: 'thickness' | 'texture', value: number) => void;
  onFaultTypeChange: (type: FaultType) => void;
  onTriggerFault: () => void;
  onReset: () => void;
}

export class UIManager {
  private container: HTMLElement;
  private callbacks: UICallbacks;
  
  private layerSliders: Array<{
    thicknessSlider: HTMLInputElement;
    thicknessValue: HTMLSpanElement;
    textureSlider: HTMLInputElement;
    textureValue: HTMLSpanElement;
  }> = [];
  
  private faultSelect: HTMLSelectElement | null = null;
  private triggerBtn: HTMLButtonElement | null = null;
  private resetBtn: HTMLButtonElement | null = null;
  
  private progressBarFill: HTMLElement | null = null;
  private fpsDisplay: HTMLElement | null = null;
  
  private layerNames = ['沉积层', '花岗岩层', '变质岩层'];
  private layerColors = ['#8B4513', '#696969', '#2F4F2F'];
  
  private defaultThickness = [2, 3, 4];
  private defaultTexture = [0.5, 0.7, 0.9];

  constructor(container: HTMLElement, callbacks: UICallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.createUI();
  }

  private createUI(): void {
    this.container.innerHTML = '';
    
    this.createTitle();
    this.createControlPanel();
    this.createFaultControls();
    this.createProgressBar();
    this.addStyles();
  }

  private createTitle(): void {
    const title = document.createElement('div');
    title.className = 'fault-title';
    title.innerHTML = `
      <h1>地质断层3D可视化演示</h1>
      <p>Geological Fault 3D Visualization</p>
    `;
    this.container.appendChild(title);
  }

  private createControlPanel(): void {
    const panel = document.createElement('div');
    panel.className = 'control-panel';
    
    const title = document.createElement('h3');
    title.textContent = '岩层参数';
    title.className = 'panel-title';
    panel.appendChild(title);
    
    const layersContainer = document.createElement('div');
    layersContainer.className = 'layers-container';
    
    for (let i = 0; i < 3; i++) {
      const layerControl = this.createLayerControl(i);
      layersContainer.appendChild(layerControl);
    }
    
    panel.appendChild(layersContainer);
    this.container.appendChild(panel);
  }

  private createLayerControl(index: number): HTMLElement {
    const layerDiv = document.createElement('div');
    layerDiv.className = 'layer-control';
    layerDiv.style.borderLeftColor = this.layerColors[index];
    
    const header = document.createElement('div');
    header.className = 'layer-header';
    
    const colorDot = document.createElement('span');
    colorDot.className = 'layer-color-dot';
    colorDot.style.backgroundColor = this.layerColors[index];
    
    const name = document.createElement('span');
    name.className = 'layer-name';
    name.textContent = this.layerNames[index];
    
    header.appendChild(colorDot);
    header.appendChild(name);
    layerDiv.appendChild(header);
    
    const thicknessControl = this.createSliderControl(
      '厚度',
      this.defaultThickness[index],
      0.5,
      6,
      0.1,
      'thickness',
      index
    );
    
    const textureControl = this.createSliderControl(
      '纹理强度',
      this.defaultTexture[index],
      0,
      1,
      0.05,
      'texture',
      index
    );
    
    layerDiv.appendChild(thicknessControl);
    layerDiv.appendChild(textureControl);
    
    return layerDiv;
  }

  private createSliderControl(
    label: string,
    defaultValue: number,
    min: number,
    max: number,
    step: number,
    paramType: 'thickness' | 'texture',
    layerIndex: number
  ): HTMLElement {
    const control = document.createElement('div');
    control.className = 'slider-control';
    
    const labelRow = document.createElement('div');
    labelRow.className = 'slider-label-row';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'slider-label';
    labelSpan.textContent = label;
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'slider-value';
    valueSpan.textContent = defaultValue.toFixed(step < 0.1 ? 2 : 1);
    
    labelRow.appendChild(labelSpan);
    labelRow.appendChild(valueSpan);
    control.appendChild(labelRow);
    
    const sliderWrapper = document.createElement('div');
    sliderWrapper.className = 'slider-wrapper';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step.toString();
    slider.value = defaultValue.toString();
    slider.className = 'gradient-slider';
    
    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      valueSpan.textContent = value.toFixed(step < 0.1 ? 2 : 1);
      this.callbacks.onLayerParamChange(layerIndex, paramType, value);
    });
    
    sliderWrapper.appendChild(slider);
    control.appendChild(sliderWrapper);
    
    if (paramType === 'thickness') {
      if (!this.layerSliders[layerIndex]) {
        this.layerSliders[layerIndex] = {} as any;
      }
      this.layerSliders[layerIndex].thicknessSlider = slider;
      this.layerSliders[layerIndex].thicknessValue = valueSpan;
    } else {
      if (!this.layerSliders[layerIndex]) {
        this.layerSliders[layerIndex] = {} as any;
      }
      this.layerSliders[layerIndex].textureSlider = slider;
      this.layerSliders[layerIndex].textureValue = valueSpan;
    }
    
    return control;
  }

  private createFaultControls(): void {
    const panel = document.createElement('div');
    panel.className = 'fault-panel';
    
    const title = document.createElement('h3');
    title.textContent = '断层控制';
    title.className = 'panel-title';
    panel.appendChild(title);
    
    const selectContainer = document.createElement('div');
    selectContainer.className = 'select-container';
    
    const label = document.createElement('label');
    label.textContent = '断层类型';
    label.className = 'select-label';
    
    const select = document.createElement('select');
    select.className = 'fault-select';
    
    const options = [
      { value: 'normal', label: '正断层 (Normal Fault)' },
      { value: 'reverse', label: '逆断层 (Reverse Fault)' },
      { value: 'strike-slip', label: '平移断层 (Strike-slip Fault)' }
    ];
    
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    });
    
    select.addEventListener('change', () => {
      this.callbacks.onFaultTypeChange(select.value as FaultType);
    });
    
    this.faultSelect = select;
    
    selectContainer.appendChild(label);
    selectContainer.appendChild(select);
    panel.appendChild(selectContainer);
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'btn-container';
    
    const triggerBtn = document.createElement('button');
    triggerBtn.className = 'btn btn-primary';
    triggerBtn.textContent = '⚡ 激发断层';
    triggerBtn.addEventListener('click', () => {
      this.callbacks.onTriggerFault();
    });
    this.triggerBtn = triggerBtn;
    
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = '↺ 重置';
    resetBtn.addEventListener('click', () => {
      this.callbacks.onReset();
    });
    this.resetBtn = resetBtn;
    
    btnContainer.appendChild(triggerBtn);
    btnContainer.appendChild(resetBtn);
    panel.appendChild(btnContainer);
    
    this.container.appendChild(panel);
  }

  private createProgressBar(): void {
    const container = document.createElement('div');
    container.className = 'progress-container';
    
    const infoRow = document.createElement('div');
    infoRow.className = 'progress-info';
    
    const label = document.createElement('span');
    label.className = 'progress-label';
    label.textContent = '动画进度';
    
    const fps = document.createElement('span');
    fps.className = 'fps-display';
    fps.textContent = 'FPS: 60';
    this.fpsDisplay = fps;
    
    infoRow.appendChild(label);
    infoRow.appendChild(fps);
    container.appendChild(infoRow);
    
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    this.progressBarFill = fill;
    
    bar.appendChild(fill);
    container.appendChild(bar);
    
    this.container.appendChild(container);
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', sans-serif;
        background: radial-gradient(ellipse at center, #1a237e 0%, #0d0d1a 50%, #000000 100%);
        color: #ffffff;
        overflow: hidden;
        width: 100vw;
        height: 100vh;
      }
      
      #app {
        position: relative;
        width: 100%;
        height: 100%;
      }
      
      #canvas-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      
      .ui-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      }
      
      .ui-overlay > * {
        pointer-events: auto;
      }
      
      .fault-title {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
      }
      
      .fault-title h1 {
        font-size: 24px;
        font-weight: 300;
        letter-spacing: 8px;
        color: #ffffff;
        text-shadow: 0 0 20px rgba(100, 150, 255, 0.5);
      }
      
      .fault-title p {
        font-size: 12px;
        font-weight: 200;
        letter-spacing: 4px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 4px;
      }
      
      .control-panel,
      .fault-panel {
        position: absolute;
        top: 80px;
        background: rgba(20, 25, 40, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 10px;
        padding: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        width: 260px;
      }
      
      .control-panel {
        left: 20px;
      }
      
      .fault-panel {
        right: 20px;
      }
      
      .panel-title {
        font-size: 14px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        letter-spacing: 2px;
      }
      
      .layers-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .layer-control {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        padding: 12px;
        border-left: 3px solid;
      }
      
      .layer-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }
      
      .layer-color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        box-shadow: 0 0 8px currentColor;
      }
      
      .layer-name {
        font-size: 13px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.9);
      }
      
      .slider-control {
        margin-bottom: 8px;
      }
      
      .slider-control:last-child {
        margin-bottom: 0;
      }
      
      .slider-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      
      .slider-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        letter-spacing: 1px;
      }
      
      .slider-value {
        font-size: 12px;
        font-weight: 500;
        color: #64b5f6;
        min-width: 40px;
        text-align: right;
      }
      
      .slider-wrapper {
        position: relative;
      }
      
      .gradient-slider {
        width: 100%;
        height: 6px;
        -webkit-appearance: none;
        appearance: none;
        background: linear-gradient(90deg, #1a237e, #4a90d9, #64b5f6);
        border-radius: 3px;
        outline: none;
        cursor: pointer;
      }
      
      .gradient-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(100, 181, 246, 0.8);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .gradient-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 15px rgba(100, 181, 246, 1);
      }
      
      .gradient-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ffffff;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 10px rgba(100, 181, 246, 0.8);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .select-container {
        margin-bottom: 16px;
      }
      
      .select-label {
        display: block;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        letter-spacing: 1px;
        margin-bottom: 6px;
      }
      
      .fault-select {
        width: 100%;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        color: #ffffff;
        font-size: 13px;
        font-family: 'Inter', sans-serif;
        cursor: pointer;
        outline: none;
        transition: border-color 0.3s ease, box-shadow 0.3s ease;
      }
      
      .fault-select:hover {
        border-color: rgba(100, 181, 246, 0.5);
      }
      
      .fault-select:focus {
        border-color: #64b5f6;
        box-shadow: 0 0 10px rgba(100, 181, 246, 0.3);
      }
      
      .fault-select option {
        background: #1a2035;
        color: #ffffff;
      }
      
      .btn-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .btn {
        width: 100%;
        padding: 12px 20px;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        font-family: 'Inter', sans-serif;
        cursor: pointer;
        transition: all 0.3s ease;
        letter-spacing: 2px;
      }
      
      .btn-primary {
        background: linear-gradient(135deg, #4a90d9 0%, #2962ff 100%);
        color: #ffffff;
        box-shadow: 0 4px 15px rgba(74, 144, 217, 0.4);
      }
      
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(100, 181, 246, 0.6);
      }
      
      .btn-primary:active {
        transform: translateY(0);
      }
      
      .btn-secondary {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(100, 181, 246, 0.3);
        border-color: rgba(100, 181, 246, 0.4);
      }
      
      .progress-container {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 400px;
        background: rgba(20, 25, 40, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 10px;
        padding: 12px 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      
      .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .progress-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        letter-spacing: 1px;
      }
      
      .fps-display {
        font-size: 11px;
        font-weight: 500;
        color: #64b5f6;
        font-family: monospace;
      }
      
      .progress-bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #4a90d9, #64b5f6, #81d4fa);
        border-radius: 3px;
        transition: width 0.1s linear;
        box-shadow: 0 0 10px rgba(100, 181, 246, 0.5);
      }
      
      @media (max-width: 900px) {
        .control-panel,
        .fault-panel {
          position: relative;
          top: auto;
          left: auto;
          right: auto;
          width: calc(100% - 40px);
          margin: 10px 20px;
        }
        
        .ui-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
          padding-top: 70px;
          padding-bottom: 100px;
        }
        
        .progress-container {
          width: calc(100% - 40px);
          max-width: 400px;
        }
        
        .fault-title h1 {
          font-size: 18px;
          letter-spacing: 4px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  public updateProgress(progress: number): void {
    if (this.progressBarFill) {
      this.progressBarFill.style.width = `${progress * 100}%`;
    }
  }

  public updateFPS(fps: number): void {
    if (this.fpsDisplay) {
      this.fpsDisplay.textContent = `FPS: ${fps.toFixed(0)}`;
    }
  }

  public setTriggerButtonEnabled(enabled: boolean): void {
    if (this.triggerBtn) {
      this.triggerBtn.disabled = !enabled;
      this.triggerBtn.style.opacity = enabled ? '1' : '0.5';
      this.triggerBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }
  }
}
