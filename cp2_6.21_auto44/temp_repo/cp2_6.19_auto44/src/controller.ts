import * as THREE from 'three';
import type { SculptureParams, SliderConfig, Preset, AnimationState } from './types';
import { DEFAULT_PARAMS, SLIDER_CONFIGS, PRESETS } from './types';

export type UpdateCallback = (params: SculptureParams, animationState: AnimationState | null) => void;
export type ExportCallback = () => void;
export type InfoPanelCallback = (show: boolean) => void;

export class Controller {
  private params: SculptureParams;
  private targetParams: SculptureParams;
  private animatedParams: SculptureParams;
  private listeners: UpdateCallback[] = [];
  private exportListeners: ExportCallback[] = [];
  private infoPanelListeners: InfoPanelCallback[] = [];
  private animationState: AnimationState | null = null;
  private colorWheelElement: HTMLElement | null = null;
  private isDraggingColor: boolean = false;

  constructor() {
    this.params = { ...DEFAULT_PARAMS };
    this.targetParams = { ...DEFAULT_PARAMS };
    this.animatedParams = { ...DEFAULT_PARAMS };
  }

  public init(): void {
    this.createSliders();
    this.createPresetButtons();
    this.setupColorWheel();
    this.setupColorInputs();
    this.setupLightToggles();
    this.setupActionButtons();
    this.setupSidebarToggle();
    this.setupInfoPanel();
    this.setupEmissiveControls();
    this.setupColorModeToggle();
    this.updateUI();
  }

  private createSliders(): void {
    const morphologyContainer = document.getElementById('morphology-sliders');
    const materialContainer = document.getElementById('material-sliders');

    if (!morphologyContainer || !materialContainer) return;

    SLIDER_CONFIGS.forEach((config) => {
      const wrapper = this.createSlider(config);
      if (config.category === 'morphology') {
        morphologyContainer.appendChild(wrapper);
      } else {
        materialContainer.appendChild(wrapper);
      }
    });
  }

  private createSlider(config: SliderConfig): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'slider-wrapper';

    const sliderWithValue = document.createElement('div');
    sliderWithValue.className = 'slider-with-value';

    const label = document.createElement('span');
    label.className = 'slider-label';
    label.textContent = config.label;

    const valueSpan = document.createElement('span');
    valueSpan.className = 'slider-value';
    valueSpan.id = `${config.key}-value`;
    const displayValue = config.displayFormat ? config.displayFormat(this.params[config.key] as number) : (this.params[config.key] as number).toFixed(2);
    valueSpan.textContent = displayValue;

    sliderWithValue.appendChild(label);
    sliderWithValue.appendChild(valueSpan);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'custom-slider';
    slider.id = config.key;
    slider.min = config.min.toString();
    slider.max = config.max.toString();
    slider.step = config.step.toString();
    slider.value = (this.params[config.key] as number).toString();

    slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.setParam(config.key, value);
      const displayValue = config.displayFormat ? config.displayFormat(value) : value.toFixed(2);
      valueSpan.textContent = displayValue;
    });

    wrapper.appendChild(sliderWithValue);
    wrapper.appendChild(slider);
    return wrapper;
  }

  private createPresetButtons(): void {
    const container = document.getElementById('preset-buttons');
    if (!container) return;

    PRESETS.forEach((preset) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.dataset.presetId = preset.id;

      const icon = document.createElement('span');
      icon.className = 'preset-icon';
      icon.textContent = preset.icon;

      const name = document.createElement('span');
      name.className = 'preset-name';
      name.textContent = preset.name;

      btn.appendChild(icon);
      btn.appendChild(name);

      btn.addEventListener('click', () => {
        this.applyPreset(preset);
      });

      container.appendChild(btn);
    });
  }

  private setupColorWheel(): void {
    this.colorWheelElement = document.getElementById('color-wheel');
    if (!this.colorWheelElement) return;

    const pointer = document.createElement('div');
    pointer.className = 'color-wheel-pointer';
    pointer.id = 'color-wheel-pointer';
    this.colorWheelElement.appendChild(pointer);

    const updateColor = (clientX: number, clientY: number) => {
      if (!this.colorWheelElement) return;
      const rect = this.colorWheelElement.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = rect.width / 2 - 8;

      if (dist > maxDist) {
        const angle = Math.atan2(dy, dx);
        pointer.style.left = `${centerX + Math.cos(angle) * maxDist}px`;
        pointer.style.top = `${centerY + Math.sin(angle) * maxDist}px`;
      } else {
        pointer.style.left = `${x}px`;
        pointer.style.top = `${y}px`;
      }

      const hue = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
      const saturation = Math.min(100, (dist / maxDist) * 100);
      const lightness = 50;

      const color = new THREE.Color().setHSL(hue / 360, saturation / 100, lightness / 100);
      const hex = '#' + color.getHexString();
      this.setParam('baseColor', hex);
      pointer.style.background = hex;
    };

    this.colorWheelElement.addEventListener('mousedown', (e) => {
      this.isDraggingColor = true;
      updateColor(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDraggingColor) {
        updateColor(e.clientX, e.clientY);
      }
    });

    document.addEventListener('mouseup', () => {
      this.isDraggingColor = false;
    });

    this.colorWheelElement.addEventListener('click', (e) => {
      updateColor(e.clientX, e.clientY);
    });

    const initialColor = new THREE.Color(this.params.baseColor);
    const hsl = { h: 0, s: 0, l: 0 };
    initialColor.getHSL(hsl);
    const hue = hsl.h * 360;
    const saturation = hsl.s * 100;
    const rect = this.colorWheelElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxDist = rect.width / 2 - 8;
    const angle = (hue * Math.PI) / 180 - Math.PI;
    const dist = (saturation / 100) * maxDist;

    pointer.style.left = `${centerX + Math.cos(angle) * dist}px`;
    pointer.style.top = `${centerY + Math.sin(angle) * dist}px`;
    pointer.style.background = this.params.baseColor;
  }

  private setupColorInputs(): void {
    const baseColorInput = document.getElementById('base-color') as HTMLInputElement;
    const gradientStartInput = document.getElementById('gradient-start') as HTMLInputElement;
    const gradientEndInput = document.getElementById('gradient-end') as HTMLInputElement;

    if (baseColorInput) {
      baseColorInput.value = this.params.baseColor;
      baseColorInput.addEventListener('input', (e) => {
        this.setParam('baseColor', (e.target as HTMLInputElement).value);
        const pointer = document.getElementById('color-wheel-pointer');
        if (pointer) pointer.style.background = (e.target as HTMLInputElement).value;
      });
    }

    if (gradientStartInput) {
      gradientStartInput.value = this.params.gradientStart;
      gradientStartInput.addEventListener('input', (e) => {
        this.setParam('gradientStart', (e.target as HTMLInputElement).value);
      });
    }

    if (gradientEndInput) {
      gradientEndInput.value = this.params.gradientEnd;
      gradientEndInput.addEventListener('input', (e) => {
        this.setParam('gradientEnd', (e.target as HTMLInputElement).value);
      });
    }
  }

  private setupEmissiveControls(): void {
    const emissiveColorInput = document.getElementById('emissive-color') as HTMLInputElement;
    const emissiveIntensitySlider = document.getElementById('emissive-intensity') as HTMLInputElement;
    const emissiveIntensityValue = document.getElementById('emissive-intensity-value');

    if (emissiveColorInput) {
      emissiveColorInput.value = this.params.emissiveColor;
      emissiveColorInput.addEventListener('input', (e) => {
        this.setParam('emissiveColor', (e.target as HTMLInputElement).value);
      });
    }

    if (emissiveIntensitySlider) {
      emissiveIntensitySlider.value = this.params.emissiveIntensity.toString();
      emissiveIntensitySlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.setParam('emissiveIntensity', value);
        if (emissiveIntensityValue) {
          emissiveIntensityValue.textContent = value.toFixed(2);
        }
      });
    }
  }

  private setupColorModeToggle(): void {
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        modeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = (btn as HTMLElement).dataset.mode as 'solid' | 'gradient';
        this.setParam('colorMode', mode);

        const colorPickerWrapper = document.getElementById('color-picker-wrapper');
        const gradientWrapper = document.getElementById('gradient-color-wrapper');
        if (mode === 'solid') {
          colorPickerWrapper?.classList.remove('hidden');
          gradientWrapper?.classList.add('hidden');
        } else {
          colorPickerWrapper?.classList.add('hidden');
          gradientWrapper?.classList.remove('hidden');
        }
      });
    });
  }

  private setupLightToggles(): void {
    const ambientToggle = document.getElementById('ambient-toggle') as HTMLInputElement;
    const pointToggle = document.getElementById('point-toggle') as HTMLInputElement;

    if (ambientToggle) {
      ambientToggle.checked = this.params.ambientLightOn;
      ambientToggle.addEventListener('change', (e) => {
        this.setParam('ambientLightOn', (e.target as HTMLInputElement).checked);
      });
    }

    if (pointToggle) {
      pointToggle.checked = this.params.pointLightOn;
      pointToggle.addEventListener('change', (e) => {
        this.setParam('pointLightOn', (e.target as HTMLInputElement).checked);
      });
    }
  }

  private setupActionButtons(): void {
    const randomBtn = document.getElementById('random-btn');
    const exportBtn = document.getElementById('export-btn');

    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        this.randomize();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.notifyExport();
      });
    }
  }

  private setupSidebarToggle(): void {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const panel = document.getElementById('control-panel');

    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('open');
      });
    }
  }

  private setupInfoPanel(): void {
    const closeBtn = document.getElementById('close-info');
    const infoPanel = document.getElementById('info-panel');
    const copyBtn = document.getElementById('copy-params-btn');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hideInfoPanel();
      });
    }

    if (infoPanel) {
      infoPanel.addEventListener('click', (e) => {
        if (e.target === infoPanel) {
          this.hideInfoPanel();
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        await this.copyParams();
      });
    }
  }

  public showInfoPanel(): void {
    const infoPanel = document.getElementById('info-panel');
    const paramsDisplay = document.getElementById('params-display');

    if (!infoPanel || !paramsDisplay) return;

    infoPanel.classList.remove('hidden');
    this.notifyInfoPanel(true);

    const paramLabels: Record<string, string> = {
      subdivision: '细分程度',
      twistIntensity: '扭曲强度',
      expansionRadius: '扩张半径',
      verticalStretch: '垂直拉伸',
      topContraction: '顶部收缩',
      rotationOffset: '旋转偏移',
      baseColor: '基础颜色',
      metalness: '金属质感',
      roughness: '粗糙度',
      emissiveColor: '自发光颜色',
      emissiveIntensity: '自发光强度',
      colorMode: '颜色模式',
      gradientStart: '渐变起始色',
      gradientEnd: '渐变结束色',
    };

    paramsDisplay.innerHTML = '';
    const numericKeys: (keyof SculptureParams)[] = [
      'subdivision', 'twistIntensity', 'expansionRadius', 'verticalStretch',
      'topContraction', 'rotationOffset', 'metalness', 'roughness', 'emissiveIntensity'
    ];
    const colorKeys: (keyof SculptureParams)[] = [
      'baseColor', 'emissiveColor', 'gradientStart', 'gradientEnd'
    ];

    numericKeys.forEach((key) => {
      const row = document.createElement('div');
      row.className = 'param-row';
      const name = document.createElement('span');
      name.className = 'param-name';
      name.textContent = paramLabels[key] || key;
      const value = document.createElement('span');
      value.className = 'param-value';
      value.textContent = (this.params[key] as number).toFixed(2);
      row.appendChild(name);
      row.appendChild(value);
      paramsDisplay.appendChild(row);
    });

    colorKeys.forEach((key) => {
      if (key === 'baseColor' && this.params.colorMode === 'gradient') return;
      if ((key === 'gradientStart' || key === 'gradientEnd') && this.params.colorMode === 'solid') return;
      
      const row = document.createElement('div');
      row.className = 'param-row';
      const name = document.createElement('span');
      name.className = 'param-name';
      name.textContent = paramLabels[key] || key;
      const value = document.createElement('span');
      value.className = 'param-value';
      value.textContent = this.params[key] as string;
      value.style.color = this.params[key] as string;
      row.appendChild(name);
      row.appendChild(value);
      paramsDisplay.appendChild(row);
    });

    const modeRow = document.createElement('div');
    modeRow.className = 'param-row';
    const modeName = document.createElement('span');
    modeName.className = 'param-name';
    modeName.textContent = paramLabels.colorMode;
    const modeValue = document.createElement('span');
    modeValue.className = 'param-value';
    modeValue.textContent = this.params.colorMode === 'solid' ? '单色' : '渐变';
    modeRow.appendChild(modeName);
    modeRow.appendChild(modeValue);
    paramsDisplay.appendChild(modeRow);
  }

  public hideInfoPanel(): void {
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel) {
      infoPanel.classList.add('hidden');
      this.notifyInfoPanel(false);
    }
  }

  private async copyParams(): Promise<void> {
    const paramsStr = JSON.stringify(this.params, null, 2);
    try {
      await navigator.clipboard.writeText(paramsStr);
      const copyBtn = document.getElementById('copy-params-btn');
      if (copyBtn) {
        copyBtn.classList.add('copied');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          已复制
        `;
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.innerHTML = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
  }

  private setParam<K extends keyof SculptureParams>(key: K, value: SculptureParams[K]): void {
    this.params[key] = value;
    this.targetParams[key] = value;
    this.notifyListeners();
  }

  private applyPreset(preset: Preset): void {
    const startParams = { ...this.params };
    const targetParams = { ...this.params, ...preset.params };

    this.animationState = {
      type: 'preset',
      progress: 0,
      duration: 800,
      startTime: performance.now(),
      startParams,
      targetParams,
      explosionScale: 1,
    };

    this.targetParams = { ...targetParams };
    this.updateUI();
  }

  private randomize(): void {
    const startParams = { ...this.params };
    const targetParams = { ...this.params };

    SLIDER_CONFIGS.forEach((config) => {
      const range = config.max - config.min;
      const value = config.min + Math.random() * range;
      (targetParams as unknown as Record<string, number>)[config.key] = value;
    });

    targetParams.baseColor = this.randomColor();
    targetParams.gradientStart = this.randomColor();
    targetParams.gradientEnd = this.randomColor();
    
    if (Math.random() > 0.5) {
      targetParams.emissiveColor = this.randomColor();
      targetParams.emissiveIntensity = Math.random() * 0.5;
    } else {
      targetParams.emissiveColor = '#000000';
      targetParams.emissiveIntensity = 0;
    }

    targetParams.colorMode = Math.random() > 0.5 ? 'solid' : 'gradient';

    this.animationState = {
      type: 'random',
      progress: 0,
      duration: 1200,
      startTime: performance.now(),
      startParams,
      targetParams,
      explosionScale: 1,
    };

    this.targetParams = { ...targetParams };
    this.updateUI();
  }

  private randomColor(): string {
    const hue = Math.random();
    const saturation = 0.6 + Math.random() * 0.4;
    const lightness = 0.4 + Math.random() * 0.3;
    const color = new THREE.Color().setHSL(hue, saturation, lightness);
    return '#' + color.getHexString();
  }

  public update(deltaTime: number): void {
    if (!this.animationState) {
      this.interpolateParams(this.params, this.targetParams, 0.1);
      this.notifyListeners();
      return;
    }

    const elapsed = performance.now() - this.animationState.startTime;
    const rawProgress = Math.min(1, elapsed / this.animationState.duration);

    if (this.animationState.type === 'preset') {
      this.animationState.progress = this.elasticOut(rawProgress);
      this.animationState.explosionScale = 1;
    } else if (this.animationState.type === 'random') {
      this.animationState.progress = this.easeOutCubic(rawProgress);
      if (rawProgress < 0.3) {
        this.animationState.explosionScale = 1 + Math.sin((rawProgress / 0.3) * Math.PI) * 0.5;
      } else {
        this.animationState.explosionScale = 1 + (1 - (rawProgress - 0.3) / 0.7) * 0.5;
      }
    }

    this.interpolateParams(
      this.animationState.startParams,
      this.animationState.targetParams,
      1
    );
    this.params = { ...this.animatedParams };

    if (rawProgress >= 1) {
      this.params = { ...this.animationState.targetParams };
      this.targetParams = { ...this.animationState.targetParams };
      this.animationState = null;
      this.updateUI();
    }

    this.notifyListeners();
  }

  private elasticOut(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private interpolateParams(start: SculptureParams, end: SculptureParams, t: number): void {
    const numericKeys: (keyof SculptureParams)[] = [
      'subdivision', 'twistIntensity', 'expansionRadius', 'verticalStretch',
      'topContraction', 'rotationOffset', 'metalness', 'roughness', 'emissiveIntensity'
    ];

    numericKeys.forEach((key) => {
      const startVal = start[key] as number;
      const endVal = end[key] as number;
      const lerpedValue = THREE.MathUtils.lerp(startVal, endVal, t);
      (this.animatedParams as unknown as Record<string, number>)[key] = lerpedValue;
    });

    if (t >= 0.5) {
      this.animatedParams.baseColor = end.baseColor;
      this.animatedParams.gradientStart = end.gradientStart;
      this.animatedParams.gradientEnd = end.gradientEnd;
      this.animatedParams.emissiveColor = end.emissiveColor;
      this.animatedParams.colorMode = end.colorMode;
    } else {
      this.animatedParams.baseColor = start.baseColor;
      this.animatedParams.gradientStart = start.gradientStart;
      this.animatedParams.gradientEnd = end.gradientEnd;
      this.animatedParams.emissiveColor = start.emissiveColor;
      this.animatedParams.colorMode = start.colorMode;
    }

    this.animatedParams.ambientLightOn = end.ambientLightOn;
    this.animatedParams.pointLightOn = end.pointLightOn;
  }

  private updateUI(): void {
    SLIDER_CONFIGS.forEach((config) => {
      const slider = document.getElementById(config.key) as HTMLInputElement;
      const valueSpan = document.getElementById(`${config.key}-value`);
      if (slider) slider.value = (this.targetParams[config.key] as number).toString();
      if (valueSpan) {
        const displayValue = config.displayFormat ? config.displayFormat(this.targetParams[config.key] as number) : (this.targetParams[config.key] as number).toFixed(2);
        valueSpan.textContent = displayValue;
      }
    });

    const baseColorInput = document.getElementById('base-color') as HTMLInputElement;
    const gradientStartInput = document.getElementById('gradient-start') as HTMLInputElement;
    const gradientEndInput = document.getElementById('gradient-end') as HTMLInputElement;
    const emissiveColorInput = document.getElementById('emissive-color') as HTMLInputElement;
    const emissiveIntensitySlider = document.getElementById('emissive-intensity') as HTMLInputElement;
    const emissiveIntensityValue = document.getElementById('emissive-intensity-value');

    if (baseColorInput) baseColorInput.value = this.targetParams.baseColor;
    if (gradientStartInput) gradientStartInput.value = this.targetParams.gradientStart;
    if (gradientEndInput) gradientEndInput.value = this.targetParams.gradientEnd;
    if (emissiveColorInput) emissiveColorInput.value = this.targetParams.emissiveColor;
    if (emissiveIntensitySlider) emissiveIntensitySlider.value = this.targetParams.emissiveIntensity.toString();
    if (emissiveIntensityValue) emissiveIntensityValue.textContent = this.targetParams.emissiveIntensity.toFixed(2);

    const pointer = document.getElementById('color-wheel-pointer');
    if (pointer) pointer.style.background = this.targetParams.baseColor;

    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach((btn) => {
      const mode = (btn as HTMLElement).dataset.mode;
      if (mode === this.targetParams.colorMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const colorPickerWrapper = document.getElementById('color-picker-wrapper');
    const gradientWrapper = document.getElementById('gradient-color-wrapper');
    if (this.targetParams.colorMode === 'solid') {
      colorPickerWrapper?.classList.remove('hidden');
      gradientWrapper?.classList.add('hidden');
    } else {
      colorPickerWrapper?.classList.add('hidden');
      gradientWrapper?.classList.remove('hidden');
    }
  }

  public getParams(): SculptureParams {
    return this.animationState ? { ...this.animatedParams } : { ...this.params };
  }

  public getAnimationState(): AnimationState | null {
    return this.animationState;
  }

  public isRandomAnimationActive(): boolean {
    return this.animationState?.type === 'random';
  }

  public onUpdate(callback: UpdateCallback): void {
    this.listeners.push(callback);
  }

  public onExport(callback: ExportCallback): void {
    this.exportListeners.push(callback);
  }

  public onInfoPanel(callback: InfoPanelCallback): void {
    this.infoPanelListeners.push(callback);
  }

  private notifyListeners(): void {
    const params = this.getParams();
    this.listeners.forEach((cb) => cb(params, this.animationState));
  }

  private notifyExport(): void {
    this.exportListeners.forEach((cb) => cb());
  }

  private notifyInfoPanel(show: boolean): void {
    this.infoPanelListeners.forEach((cb) => cb(show));
  }
}
