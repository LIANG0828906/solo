import * as THREE from 'three';
import { FireParticleSystem, AirflowMode, ColorStop, ParticleParams } from './FireParticle';

interface SliderConfig {
  label: string;
  key: keyof ParticleParams;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export class UIControl {
  private container: HTMLElement;
  private particleSystem: FireParticleSystem;

  private leftPanel!: HTMLDivElement;
  private rightPanel!: HTMLDivElement;
  private topRightPanel!: HTMLDivElement;
  private colorPickerOverlay!: HTMLDivElement;
  private colorPickerPopup!: HTMLDivElement;
  private activeColorStopIndex: number = -1;

  private sliderConfigs: SliderConfig[] = [
    { label: '粒子发射速率', key: 'emissionRate', min: 50, max: 300, step: 1, unit: '/秒' },
    { label: '初始速度', key: 'initialSpeed', min: 0.5, max: 5, step: 0.1 },
    { label: '生命周期', key: 'lifetime', min: 1, max: 8, step: 0.1, unit: '秒' },
    { label: '粒子大小', key: 'particleSize', min: 2, max: 12, step: 0.5, unit: '像素' }
  ];

  private sliderElements: Map<keyof ParticleParams, { input: HTMLInputElement; value: HTMLSpanElement }> = new Map();
  private colorStopHandles: HTMLDivElement[] = [];
  private gradientBar!: HTMLDivElement;
  private isDraggingColorStop: boolean = false;
  private draggedStopIndex: number = -1;
  private dragOffsetX: number = 0;

  private vortexSlider!: HTMLInputElement;
  private vortexValue!: HTMLSpanElement;
  private gustOffsetSlider!: HTMLInputElement;
  private gustOffsetValue!: HTMLSpanElement;
  private gustIntervalSlider!: HTMLInputElement;
  private gustIntervalValue!: HTMLSpanElement;
  private airflowSubPanels!: {
    none: HTMLDivElement;
    vortex: HTMLDivElement;
    gust: HTMLDivElement;
  };

  constructor(container: HTMLElement, particleSystem: FireParticleSystem) {
    this.container = container;
    this.particleSystem = particleSystem;
    this.injectStyles();
    this.createLeftPanel();
    this.createRightPanel();
    this.createTopRightPanel();
    this.createColorPicker();
    this.bindWindowEvents();
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .panel {
        position: absolute;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        backdrop-filter: blur(8px);
        z-index: 10;
      }
      .panel-title {
        font-size: 14px;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 16px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        letter-spacing: 0.5px;
      }
      .control-group {
        margin-bottom: 16px;
      }
      .control-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #b0b0b0;
        margin-bottom: 8px;
      }
      .control-value {
        color: #ff7700;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }
      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 6px;
        background: #1a1a1a;
        outline: none;
        cursor: pointer;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ff7700;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(255,119,0,0.5);
        transition: transform 0.15s;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }
      input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ff7700;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 8px rgba(255,119,0,0.5);
      }
      input[type="range"]:focus {
        outline: none;
      }
      .text-input {
        width: 100%;
        padding: 8px 12px;
        background: #1a1a1a;
        border: 1px solid #555;
        border-radius: 6px;
        color: #e0e0e0;
        font-size: 12px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
      }
      .text-input:focus {
        border-color: #ff7700;
      }
      .mode-buttons {
        display: flex;
        gap: 6px;
        margin-bottom: 16px;
      }
      .mode-btn {
        flex: 1;
        padding: 8px 6px;
        background: #1a1a1a;
        border: 1px solid #555;
        border-radius: 6px;
        color: #b0b0b0;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      .mode-btn:hover {
        border-color: #888;
        color: #fff;
      }
      .mode-btn.active {
        background: rgba(255,119,0,0.15);
        border-color: #ff7700;
        color: #ff7700;
      }
      .gradient-bar-wrapper {
        position: relative;
        width: 100%;
        padding: 10px 0 30px 0;
      }
      .gradient-bar {
        width: 100%;
        height: 20px;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
      }
      .color-stop-handle {
        position: absolute;
        top: -4px;
        width: 14px;
        height: 28px;
        border-radius: 4px;
        transform: translateX(-50%);
        cursor: grab;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        transition: box-shadow 0.2s;
        z-index: 2;
      }
      .color-stop-handle:hover {
        box-shadow: 0 2px 12px rgba(255,119,0,0.6);
      }
      .color-stop-handle:active {
        cursor: grabbing;
      }
      .color-stop-handle::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid rgba(255,255,255,0.8);
      }
      .color-stop-label {
        position: absolute;
        bottom: -22px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 9px;
        color: #888;
        white-space: nowrap;
      }
      .color-picker-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        z-index: 100;
        display: none;
        align-items: center;
        justify-content: center;
      }
      .color-picker-overlay.active {
        display: flex;
      }
      .color-picker-popup {
        background: #2d2d2d;
        border-radius: 12px;
        padding: 24px;
        width: 320px;
        box-shadow: 0 16px 48px rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .picker-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
        color: #fff;
      }
      .color-preview {
        width: 100%;
        height: 60px;
        border-radius: 8px;
        margin-bottom: 16px;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
      }
      .picker-row {
        display: flex;
        gap: 10px;
        margin-bottom: 12px;
        align-items: center;
      }
      .picker-label {
        font-size: 11px;
        color: #888;
        width: 36px;
        flex-shrink: 0;
      }
      .picker-input {
        flex: 1;
        padding: 8px 10px;
        background: #1a1a1a;
        border: 1px solid #555;
        border-radius: 6px;
        color: #e0e0e0;
        font-size: 12px;
        font-family: 'Consolas', monospace;
        outline: none;
        transition: border-color 0.2s;
      }
      .picker-input:focus {
        border-color: #ff7700;
      }
      .picker-buttons {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      .picker-btn {
        flex: 1;
        padding: 10px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        border: 1px solid #555;
        background: #1a1a1a;
        color: #e0e0e0;
        font-family: inherit;
        transition: all 0.2s;
      }
      .picker-btn:hover {
        border-color: #888;
      }
      .picker-btn.primary {
        background: #ff7700;
        border-color: #ff7700;
        color: #fff;
      }
      .picker-btn.primary:hover {
        background: #ff8833;
        border-color: #ff8833;
      }
      input[type="color"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 40px;
        border: 1px solid #555;
        border-radius: 6px;
        background: #1a1a1a;
        padding: 2px;
        cursor: pointer;
        outline: none;
      }
      input[type="color"]::-webkit-color-swatch-wrapper {
        padding: 0;
      }
      input[type="color"]::-webkit-color-swatch {
        border: none;
        border-radius: 4px;
      }
      .sub-panel {
        padding: 12px;
        background: rgba(0,0,0,0.2);
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      .fps-counter {
        position: absolute;
        top: 16px;
        left: 264px;
        font-size: 11px;
        color: #888;
        font-family: 'Consolas', monospace;
        z-index: 5;
        background: rgba(0,0,0,0.3);
        padding: 4px 8px;
        border-radius: 4px;
      }
      .particle-count {
        color: #6a6;
      }
    `;
    document.head.appendChild(style);
  }

  private createLeftPanel(): void {
    this.leftPanel = document.createElement('div');
    this.leftPanel.className = 'panel';
    this.leftPanel.style.cssText = `
      left: 16px;
      top: 16px;
      width: 240px;
      background: #2d2d2d;
    `;

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '🔥 粒子参数';
    this.leftPanel.appendChild(title);

    const defaults = this.particleSystem.getCurrentParams();
    this.sliderConfigs.forEach(config => {
      const group = document.createElement('div');
      group.className = 'control-group';

      const labelRow = document.createElement('div');
      labelRow.className = 'control-label';

      const label = document.createElement('span');
      label.textContent = config.label;

      const valueSpan = document.createElement('span');
      valueSpan.className = 'control-value';
      valueSpan.textContent = `${defaults[config.key].toFixed(config.step < 1 ? 1 : 0)}${config.unit || ''}`;

      labelRow.appendChild(label);
      labelRow.appendChild(valueSpan);

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = String(config.min);
      slider.max = String(config.max);
      slider.step = String(config.step);
      slider.value = String(defaults[config.key]);

      slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        const display = `${val.toFixed(config.step < 1 ? 1 : 0)}${config.unit || ''}`;
        valueSpan.textContent = display;
        this.particleSystem.setParams({ [config.key]: val } as Partial<ParticleParams>);
      });

      group.appendChild(labelRow);
      group.appendChild(slider);
      this.leftPanel.appendChild(group);

      this.sliderElements.set(config.key, { input: slider, value: valueSpan });
    });

    this.container.appendChild(this.leftPanel);
  }

  private createRightPanel(): void {
    this.rightPanel = document.createElement('div');
    this.rightPanel.className = 'panel';
    this.rightPanel.style.cssText = `
      right: 16px;
      top: 16px;
      width: 280px;
      background: #333333;
    `;

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '🎨 火焰颜色';
    this.rightPanel.appendChild(title);

    const gradWrapper = document.createElement('div');
    gradWrapper.className = 'gradient-bar-wrapper';

    this.gradientBar = document.createElement('div');
    this.gradientBar.className = 'gradient-bar';
    this.updateGradientBar();

    gradWrapper.appendChild(this.gradientBar);

    const labels = ['起始', '中间', '终止'];
    const stops = this.particleSystem.getColorStops();
    stops.forEach((stop, i) => {
      const handle = document.createElement('div');
      handle.className = 'color-stop-handle';
      handle.style.left = `${stop.position * 100}%`;
      handle.style.background = `#${stop.color.getHexString()}`;
      handle.dataset.index = String(i);
      handle.title = `点击编辑${labels[i]}色 (${labels[i]})`;

      const label = document.createElement('div');
      label.className = 'color-stop-label';
      label.textContent = labels[i];
      handle.appendChild(label);

      handle.addEventListener('mousedown', (e) => this.onColorStopMouseDown(e, i));
      handle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openColorPicker(i);
      });

      this.gradientBar.appendChild(handle);
      this.colorStopHandles.push(handle);
    });

    this.rightPanel.appendChild(gradWrapper);

    const presetsTitle = document.createElement('div');
    presetsTitle.className = 'control-label';
    presetsTitle.style.marginTop = '20px';
    const presetsLabel = document.createElement('span');
    presetsLabel.textContent = '颜色预设';
    presetsTitle.appendChild(presetsLabel);
    this.rightPanel.appendChild(presetsTitle);

    const presetButtons = document.createElement('div');
    presetButtons.style.display = 'grid';
    presetButtons.style.gridTemplateColumns = 'repeat(3, 1fr)';
    presetButtons.style.gap = '6px';

    const presets = [
      { name: '经典火焰', colors: ['#ffffff', '#ff7700', '#330000'] },
      { name: '蓝焰', colors: ['#ffffff', '#00aaff', '#001133'] },
      { name: '翠绿', colors: ['#ffffff', '#00ff88', '#003311'] },
      { name: '紫色', colors: ['#ffffff', '#aa44ff', '#220033'] },
      { name: '金色', colors: ['#ffffff', '#ffdd00', '#332200'] },
      { name: '粉紫', colors: ['#ffffff', '#ff66aa', '#330022'] }
    ];

    presets.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.style.padding = '14px 6px';
      btn.style.background = `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]}, ${preset.colors[2]})`;
      btn.style.color = '#fff';
      btn.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
      btn.style.borderColor = 'rgba(255,255,255,0.2)';
      btn.title = preset.name;
      btn.textContent = preset.name;

      btn.addEventListener('click', () => {
        const colors = preset.colors.map(c => new THREE.Color(c));
        const newStops: ColorStop[] = [
          { position: 0, color: colors[0] },
          { position: 0.5, color: colors[1] },
          { position: 1, color: colors[2] }
        ];
        this.particleSystem.setColorStops(newStops);
        this.updateColorStopsUI(newStops);
        this.updateGradientBar();
      });

      presetButtons.appendChild(btn);
    });

    this.rightPanel.appendChild(presetButtons);
    this.container.appendChild(this.rightPanel);
  }

  private createTopRightPanel(): void {
    this.topRightPanel = document.createElement('div');
    this.topRightPanel.className = 'panel';
    this.topRightPanel.style.cssText = `
      right: 16px;
      top: calc(16px + 420px);
      width: 280px;
      background: #333333;
    `;

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '🌬️ 气流扰动';
    this.topRightPanel.appendChild(title);

    const modeButtons = document.createElement('div');
    modeButtons.className = 'mode-buttons';

    const modes: { key: AirflowMode; label: string; icon: string }[] = [
      { key: 'none', label: '无扰动', icon: '⭕' },
      { key: 'vortex', label: '涡旋', icon: '🌀' },
      { key: 'gust', label: '阵风', icon: '💨' }
    ];

    modes.forEach(mode => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.dataset.mode = mode.key;
      btn.innerHTML = `${mode.icon}<br>${mode.label}`;
      if (mode.key === this.particleSystem.getAirflowMode()) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        this.particleSystem.setAirflowMode(mode.key);
        document.querySelectorAll('.mode-btn[data-mode]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateAirflowSubPanels(mode.key);
      });
      modeButtons.appendChild(btn);
    });

    this.topRightPanel.appendChild(modeButtons);

    this.airflowSubPanels = {
      none: document.createElement('div'),
      vortex: document.createElement('div'),
      gust: document.createElement('div')
    };

    const noneSub = this.airflowSubPanels.none;
    noneSub.className = 'sub-panel';
    noneSub.style.display = 'block';
    const noneInfo = document.createElement('div');
    noneInfo.style.fontSize = '11px';
    noneInfo.style.color = '#888';
    noneInfo.style.textAlign = 'center';
    noneInfo.style.padding = '8px';
    noneInfo.textContent = '粒子沿自然对流上升';
    noneSub.appendChild(noneInfo);
    this.topRightPanel.appendChild(noneSub);

    const vortexSub = this.airflowSubPanels.vortex;
    vortexSub.className = 'sub-panel';
    vortexSub.style.display = 'none';

    const vortexGroup = document.createElement('div');
    vortexGroup.className = 'control-group';
    vortexGroup.style.marginBottom = '0';

    const vortexLabel = document.createElement('div');
    vortexLabel.className = 'control-label';
    const vl1 = document.createElement('span');
    vl1.textContent = '涡旋半径';
    this.vortexValue = document.createElement('span');
    this.vortexValue.className = 'control-value';
    this.vortexValue.textContent = '17.5px';
    vortexLabel.appendChild(vl1);
    vortexLabel.appendChild(this.vortexValue);

    this.vortexSlider = document.createElement('input');
    this.vortexSlider.type = 'range';
    this.vortexSlider.min = '10';
    this.vortexSlider.max = '25';
    this.vortexSlider.step = '0.5';
    this.vortexSlider.value = '17.5';
    this.vortexSlider.addEventListener('input', () => {
      const val = parseFloat(this.vortexSlider.value);
      this.vortexValue.textContent = `${val.toFixed(1)}px`;
      this.particleSystem.setVortexRadius(val);
    });

    vortexGroup.appendChild(vortexLabel);
    vortexGroup.appendChild(this.vortexSlider);
    vortexSub.appendChild(vortexGroup);
    this.topRightPanel.appendChild(vortexSub);

    const gustSub = this.airflowSubPanels.gust;
    gustSub.className = 'sub-panel';
    gustSub.style.display = 'none';

    const gustOffsetGroup = document.createElement('div');
    gustOffsetGroup.className = 'control-group';
    const goLabel = document.createElement('div');
    goLabel.className = 'control-label';
    const gol1 = document.createElement('span');
    gol1.textContent = '阵风偏移量';
    this.gustOffsetValue = document.createElement('span');
    this.gustOffsetValue.className = 'control-value';
    this.gustOffsetValue.textContent = '10px';
    goLabel.appendChild(gol1);
    goLabel.appendChild(this.gustOffsetValue);

    this.gustOffsetSlider = document.createElement('input');
    this.gustOffsetSlider.type = 'range';
    this.gustOffsetSlider.min = '5';
    this.gustOffsetSlider.max = '15';
    this.gustOffsetSlider.step = '0.5';
    this.gustOffsetSlider.value = '10';
    this.gustOffsetSlider.addEventListener('input', () => {
      const offset = parseFloat(this.gustOffsetSlider.value);
      const interval = parseFloat(this.gustIntervalSlider.value);
      this.gustOffsetValue.textContent = `${offset.toFixed(1)}px`;
      this.particleSystem.setGustParams(offset, interval);
    });

    gustOffsetGroup.appendChild(goLabel);
    gustOffsetGroup.appendChild(this.gustOffsetSlider);
    gustSub.appendChild(gustOffsetGroup);

    const gustIntervalGroup = document.createElement('div');
    gustIntervalGroup.className = 'control-group';
    gustIntervalGroup.style.marginBottom = '0';
    const giLabel = document.createElement('div');
    giLabel.className = 'control-label';
    const gil1 = document.createElement('span');
    gil1.textContent = '阵风间隔';
    this.gustIntervalValue = document.createElement('span');
    this.gustIntervalValue.className = 'control-value';
    this.gustIntervalValue.textContent = '2.0秒';
    giLabel.appendChild(gil1);
    giLabel.appendChild(this.gustIntervalValue);

    this.gustIntervalSlider = document.createElement('input');
    this.gustIntervalSlider.type = 'range';
    this.gustIntervalSlider.min = '1';
    this.gustIntervalSlider.max = '3';
    this.gustIntervalSlider.step = '0.1';
    this.gustIntervalSlider.value = '2';
    this.gustIntervalSlider.addEventListener('input', () => {
      const offset = parseFloat(this.gustOffsetSlider.value);
      const interval = parseFloat(this.gustIntervalSlider.value);
      this.gustIntervalValue.textContent = `${interval.toFixed(1)}秒`;
      this.particleSystem.setGustParams(offset, interval);
    });

    gustIntervalGroup.appendChild(giLabel);
    gustIntervalGroup.appendChild(this.gustIntervalSlider);
    gustSub.appendChild(gustIntervalGroup);
    this.topRightPanel.appendChild(gustSub);

    this.container.appendChild(this.topRightPanel);

    const fpsCounter = document.createElement('div');
    fpsCounter.className = 'fps-counter';
    fpsCounter.id = 'fps-counter';
    fpsCounter.innerHTML = 'FPS: -- | <span class="particle-count">粒子: 0</span>';
    this.container.appendChild(fpsCounter);
  }

  private updateAirflowSubPanels(activeMode: AirflowMode): void {
    Object.entries(this.airflowSubPanels).forEach(([key, panel]) => {
      panel.style.display = key === activeMode ? 'block' : 'none';
    });
  }

  private createColorPicker(): void {
    this.colorPickerOverlay = document.createElement('div');
    this.colorPickerOverlay.className = 'color-picker-overlay';
    this.colorPickerOverlay.addEventListener('click', (e) => {
      if (e.target === this.colorPickerOverlay) {
        this.closeColorPicker(false);
      }
    });

    this.colorPickerPopup = document.createElement('div');
    this.colorPickerPopup.className = 'color-picker-popup';

    const title = document.createElement('div');
    title.className = 'picker-title';
    title.id = 'picker-title';
    title.textContent = '选择颜色';
    this.colorPickerPopup.appendChild(title);

    const preview = document.createElement('div');
    preview.className = 'color-preview';
    preview.id = 'color-preview';
    this.colorPickerPopup.appendChild(preview);

    const nativePickerRow = document.createElement('div');
    nativePickerRow.style.marginBottom = '16px';
    const nativePicker = document.createElement('input');
    nativePicker.type = 'color';
    nativePicker.id = 'native-color-picker';
    nativePicker.addEventListener('input', () => {
      const hex = nativePicker.value;
      this.syncColorInputs(hex);
    });
    nativePickerRow.appendChild(nativePicker);
    this.colorPickerPopup.appendChild(nativePickerRow);

    const hexRow = document.createElement('div');
    hexRow.className = 'picker-row';
    const hexLabel = document.createElement('div');
    hexLabel.className = 'picker-label';
    hexLabel.textContent = 'HEX';
    const hexInput = document.createElement('input');
    hexInput.className = 'picker-input';
    hexInput.id = 'hex-input';
    hexInput.maxLength = 7;
    hexInput.placeholder = '#ff7700';
    hexInput.addEventListener('input', () => {
      let val = hexInput.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        this.syncColorInputs(val, false);
      }
    });
    hexRow.appendChild(hexLabel);
    hexRow.appendChild(hexInput);
    this.colorPickerPopup.appendChild(hexRow);

    const rgbRow = document.createElement('div');
    rgbRow.className = 'picker-row';
    rgbRow.style.gap = '6px';
    const rgbLabel = document.createElement('div');
    rgbLabel.className = 'picker-label';
    rgbLabel.textContent = 'RGB';

    const rInput = document.createElement('input');
    rInput.className = 'picker-input';
    rInput.id = 'rgb-r';
    rInput.type = 'number';
    rInput.min = '0';
    rInput.max = '255';
    rInput.placeholder = 'R';

    const gInput = document.createElement('input');
    gInput.className = 'picker-input';
    gInput.id = 'rgb-g';
    gInput.type = 'number';
    gInput.min = '0';
    gInput.max = '255';
    gInput.placeholder = 'G';

    const bInput = document.createElement('input');
    bInput.className = 'picker-input';
    bInput.id = 'rgb-b';
    bInput.type = 'number';
    bInput.min = '0';
    bInput.max = '255';
    bInput.placeholder = 'B';

    [rInput, gInput, bInput].forEach(inp => {
      inp.addEventListener('input', () => {
        const r = Math.max(0, Math.min(255, parseInt(rInput.value) || 0));
        const g = Math.max(0, Math.min(255, parseInt(gInput.value) || 0));
        const b = Math.max(0, Math.min(255, parseInt(bInput.value) || 0));
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        this.syncColorInputs(hex, true);
      });
    });

    rgbRow.appendChild(rgbLabel);
    rgbRow.appendChild(rInput);
    rgbRow.appendChild(gInput);
    rgbRow.appendChild(bInput);
    this.colorPickerPopup.appendChild(rgbRow);

    const buttonsRow = document.createElement('div');
    buttonsRow.className = 'picker-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'picker-btn';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => this.closeColorPicker(false));

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'picker-btn primary';
    confirmBtn.textContent = '确认';
    confirmBtn.addEventListener('click', () => this.closeColorPicker(true));

    buttonsRow.appendChild(cancelBtn);
    buttonsRow.appendChild(confirmBtn);
    this.colorPickerPopup.appendChild(buttonsRow);

    this.colorPickerOverlay.appendChild(this.colorPickerPopup);
    document.body.appendChild(this.colorPickerOverlay);
  }

  private syncColorInputs(hex: string, skipRGB: boolean = false): void {
    const color = new THREE.Color(hex);
    const hexStr = '#' + color.getHexString();

    const nativePicker = document.getElementById('native-color-picker') as HTMLInputElement;
    const hexInput = document.getElementById('hex-input') as HTMLInputElement;
    const preview = document.getElementById('color-preview') as HTMLDivElement;

    if (nativePicker) nativePicker.value = hexStr;
    if (hexInput) hexInput.value = hexStr.toUpperCase();
    if (preview) preview.style.background = hexStr;

    if (!skipRGB) {
      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);
      (document.getElementById('rgb-r') as HTMLInputElement).value = String(r);
      (document.getElementById('rgb-g') as HTMLInputElement).value = String(g);
      (document.getElementById('rgb-b') as HTMLInputElement).value = String(b);
    }
  }

  private openColorPicker(stopIndex: number): void {
    this.activeColorStopIndex = stopIndex;
    const labels = ['起始色', '中间色', '终止色'];
    const title = document.getElementById('picker-title') as HTMLElement;
    if (title) title.textContent = `编辑${labels[stopIndex]}`;

    const stops = this.particleSystem.getColorStops();
    const color = stops[stopIndex].color;
    this.syncColorInputs('#' + color.getHexString());

    this.colorPickerOverlay.classList.add('active');
  }

  private closeColorPicker(apply: boolean): void {
    if (apply && this.activeColorStopIndex >= 0) {
      const hexInput = document.getElementById('hex-input') as HTMLInputElement;
      let hex = hexInput.value.trim();
      if (!hex.startsWith('#')) hex = '#' + hex;
      if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
        const stops = this.particleSystem.getColorStops();
        const newStops: ColorStop[] = stops.map((s, i) => ({
          position: s.position,
          color: i === this.activeColorStopIndex ? new THREE.Color(hex) : s.color.clone()
        }));
        this.particleSystem.setColorStops(newStops);
        this.updateColorStopsUI(newStops);
        this.updateGradientBar();
      }
    }
    this.activeColorStopIndex = -1;
    this.colorPickerOverlay.classList.remove('active');
  }

  private onColorStopMouseDown(e: MouseEvent, index: number): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDraggingColorStop = true;
    this.draggedStopIndex = index;

    const handleRect = this.colorStopHandles[index].getBoundingClientRect();
    this.dragOffsetX = e.clientX - handleRect.left - handleRect.width / 2;
  }

  private bindWindowEvents(): void {
    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingColorStop || this.draggedStopIndex < 0) return;

      const rect = this.gradientBar.getBoundingClientRect();
      let x = e.clientX - rect.left - this.dragOffsetX;
      x = Math.max(0, Math.min(rect.width, x));
      const position = x / rect.width;

      const stops = this.particleSystem.getColorStops();
      const newStops: ColorStop[] = stops.map((s, i) => {
        if (i !== this.draggedStopIndex) return { position: s.position, color: s.color.clone() };

        let newPos = position;
        if (i === 0) newPos = Math.min(newPos, stops[1].position - 0.01);
        else if (i === 2) newPos = Math.max(newPos, stops[1].position + 0.01);
        else {
          newPos = Math.max(stops[0].position + 0.01, Math.min(stops[2].position - 0.01, newPos));
        }
        return { position: newPos, color: s.color.clone() };
      });

      this.particleSystem.setColorStops(newStops);
      this.updateColorStopsUI(newStops);
      this.updateGradientBar();
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingColorStop = false;
      this.draggedStopIndex = -1;
    });
  }

  private updateColorStopsUI(stops: ColorStop[]): void {
    stops.forEach((stop, i) => {
      const handle = this.colorStopHandles[i];
      if (handle) {
        handle.style.left = `${stop.position * 100}%`;
        handle.style.background = `#${stop.color.getHexString()}`;
      }
    });
  }

  private updateGradientBar(): void {
    const stops = this.particleSystem.getColorStops();
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const gradientStops = sorted.map(s => `#${s.color.getHexString()} ${s.position * 100}%`).join(', ');
    this.gradientBar.style.background = `linear-gradient(to right, ${gradientStops})`;
  }

  public updateFPS(fps: number, particleCount: number): void {
    const el = document.getElementById('fps-counter');
    if (el) {
      const fpsColor = fps >= 55 ? '#6a6' : fps >= 40 ? '#aa6' : '#a66';
      el.innerHTML = `<span style="color:${fpsColor}">FPS: ${fps.toFixed(0)}</span> | <span class="particle-count">粒子: ${particleCount}</span>`;
    }
  }

  public updateParamsDisplay(): void {
    const params = this.particleSystem.getCurrentParams();
    this.sliderConfigs.forEach(config => {
      const els = this.sliderElements.get(config.key);
      if (els) {
        els.input.value = String(params[config.key]);
        els.value.textContent = `${params[config.key].toFixed(config.step < 1 ? 1 : 0)}${config.unit || ''}`;
      }
    });
  }
}
