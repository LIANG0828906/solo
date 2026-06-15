import { LightConfig, ViewMode, PRESETS } from './scene';

export interface UIControls {
  onLightChange: (config: Partial<LightConfig>) => void;
  onPresetChange: (presetKey: string) => void;
  onViewChange: (mode: ViewMode) => void;
}

export class UIManager {
  private panel: HTMLElement;
  private controls: UIControls;
  private sliders: Record<string, HTMLInputElement> = {};
  private valueDisplays: Record<string, HTMLElement> = {};
  private presetBtns: Record<string, HTMLElement> = {};
  private viewBtns: Record<string, HTMLElement> = {};
  private colorPicker: HTMLInputElement | null = null;
  private colorHex: HTMLElement | null = null;
  private sidebarToggle: HTMLElement | null = null;
  private isCollapsed: boolean = false;

  constructor(controls: UIControls) {
    this.controls = controls;
    const panel = document.getElementById('control-panel');
    if (!panel) throw new Error('Control panel element not found');
    this.panel = panel;

    this.sidebarToggle = document.getElementById('sidebar-toggle');

    this.buildPanel();
    this.setupResponsive();
  }

  private buildPanel(): void {
    const frag = document.createDocumentFragment();

    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '光线控制';
    frag.appendChild(title);

    frag.appendChild(this.createPositionSection());
    frag.appendChild(this.createColorSection());
    frag.appendChild(this.createPresetSection());
    frag.appendChild(this.createViewSection());
    frag.appendChild(this.createHintSection());

    this.panel.appendChild(frag);
  }

  private createPositionSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'control-section';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '光源位置';
    section.appendChild(label);

    section.appendChild(this.createSlider('x', 'X 轴', -4, 4, 0, 0.1));
    section.appendChild(this.createSlider('y', 'Y 轴 (高度)', 0.5, 4.5, 3, 0.1));
    section.appendChild(this.createSlider('z', 'Z 轴', -3.5, 3.5, 0, 0.1));

    return section;
  }

  private createColorSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'control-section';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '光源属性';
    section.appendChild(label);

    const colorWrapper = document.createElement('div');
    colorWrapper.className = 'color-picker-wrapper';
    colorWrapper.style.marginBottom = '14px';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#ffb06a';
    colorInput.id = 'light-color-picker';
    colorInput.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      if (this.colorHex) {
        this.colorHex.textContent = val.toUpperCase();
      }
      this.controls.onLightChange({ color: val });
    });
    this.colorPicker = colorInput;

    const hexDisplay = document.createElement('span');
    hexDisplay.className = 'color-hex';
    hexDisplay.textContent = '#FFB06A';
    this.colorHex = hexDisplay;

    const colorLabel = document.createElement('span');
    colorLabel.className = 'slider-label';
    colorLabel.textContent = '颜色';
    colorLabel.style.flex = '1';

    colorWrapper.appendChild(colorLabel);
    colorWrapper.appendChild(colorInput);
    colorWrapper.appendChild(hexDisplay);
    section.appendChild(colorWrapper);

    section.appendChild(this.createSlider('intensity', '强度', 0.5, 6, 2.5, 0.1));

    return section;
  }

  private createPresetSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'control-section';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '预设模式';
    section.appendChild(label);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'preset-buttons';

    Object.entries(PRESETS).forEach(([key, preset]) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = preset.name;
      btn.dataset.preset = key;
      btn.addEventListener('click', () => {
        this.setActivePreset(key);
        this.controls.onPresetChange(key);
      });
      this.presetBtns[key] = btn;
      btnGroup.appendChild(btn);
    });

    section.appendChild(btnGroup);
    return section;
  }

  private createViewSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'control-section';

    const label = document.createElement('div');
    label.className = 'section-label';
    label.textContent = '视角模式';
    section.appendChild(label);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'view-buttons';

    const topBtn = document.createElement('button');
    topBtn.className = 'view-btn active';
    topBtn.innerHTML = '⬇ 俯视图';
    topBtn.dataset.view = 'top';
    topBtn.addEventListener('click', () => {
      this.setActiveView('top');
      this.controls.onViewChange('top');
    });
    this.viewBtns.top = topBtn;
    btnGroup.appendChild(topBtn);

    const fpBtn = document.createElement('button');
    fpBtn.className = 'view-btn';
    fpBtn.innerHTML = '👁 第一人称';
    fpBtn.dataset.view = 'firstPerson';
    fpBtn.addEventListener('click', () => {
      this.setActiveView('firstPerson');
      this.controls.onViewChange('firstPerson');
    });
    this.viewBtns.firstPerson = fpBtn;
    btnGroup.appendChild(fpBtn);

    section.appendChild(btnGroup);
    return section;
  }

  private createHintSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'control-section';
    section.style.borderBottom = 'none';
    section.style.marginBottom = '0';
    section.style.paddingBottom = '0';

    const hint = document.createElement('p');
    hint.className = 'hint-text';
    hint.innerHTML = '💡 提示：在俯视图模式下，可直接拖拽光源球体移动位置';
    section.appendChild(hint);

    return section;
  }

  private createSlider(
    key: string,
    label: string,
    min: number,
    max: number,
    value: number,
    step: number
  ): HTMLElement {
    const group = document.createElement('div');
    group.className = 'slider-group';

    const header = document.createElement('div');
    header.className = 'slider-header';

    const labelEl = document.createElement('span');
    labelEl.className = 'slider-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = 'slider-value';
    valueEl.id = `slider-value-${key}`;
    valueEl.textContent = value.toFixed(1);
    this.valueDisplays[key] = valueEl;

    header.appendChild(labelEl);
    header.appendChild(valueEl);
    group.appendChild(header);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `slider-${key}`;
    slider.min = min.toString();
    slider.max = max.toString();
    slider.value = value.toString();
    slider.step = step.toString();
    slider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.valueDisplays[key].textContent = val.toFixed(1);
      this.emitSliderChange(key, val);
    });
    this.sliders[key] = slider;
    group.appendChild(slider);

    return group;
  }

  private emitSliderChange(key: string, value: number): void {
    const config: Partial<LightConfig> = {};
    if (key === 'x' || key === 'y' || key === 'z') {
      config[key] = value;
    } else if (key === 'intensity') {
      config.intensity = value;
    }
    this.controls.onLightChange(config);
  }

  updateLightConfig(config: LightConfig): void {
    if (this.sliders.x && this.sliders.x.value !== config.x.toString()) {
      this.sliders.x.value = config.x.toFixed(1);
      this.valueDisplays.x.textContent = config.x.toFixed(1);
    }
    if (this.sliders.y && parseFloat(this.sliders.y.value) !== config.y) {
      this.sliders.y.value = config.y.toFixed(1);
      this.valueDisplays.y.textContent = config.y.toFixed(1);
    }
    if (this.sliders.z && parseFloat(this.sliders.z.value) !== config.z) {
      this.sliders.z.value = config.z.toFixed(1);
      this.valueDisplays.z.textContent = config.z.toFixed(1);
    }
    if (this.sliders.intensity && parseFloat(this.sliders.intensity.value) !== config.intensity) {
      this.sliders.intensity.value = config.intensity.toFixed(1);
      this.valueDisplays.intensity.textContent = config.intensity.toFixed(1);
    }
    if (this.colorPicker && this.colorPicker.value.toLowerCase() !== config.color.toLowerCase()) {
      this.colorPicker.value = config.color;
      if (this.colorHex) {
        this.colorHex.textContent = config.color.toUpperCase();
      }
    }
  }

  setActivePreset(presetKey: string): void {
    Object.entries(this.presetBtns).forEach(([key, btn]) => {
      btn.classList.toggle('active', key === presetKey);
    });
  }

  setActiveView(mode: ViewMode): void {
    Object.entries(this.viewBtns).forEach(([key, btn]) => {
      btn.classList.toggle('active', key === mode);
    });
  }

  private setupResponsive(): void {
    if (this.sidebarToggle) {
      this.sidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePanel();
      });
    }

    let lastIsNarrow = window.innerWidth <= 768;

    const checkWidth = () => {
      const isNarrow = window.innerWidth <= 768;
      
      if (isNarrow !== lastIsNarrow) {
        if (isNarrow) {
          this.panel.classList.add('collapsed');
          this.isCollapsed = true;
        } else {
          this.panel.classList.remove('collapsed');
          this.isCollapsed = false;
        }
        lastIsNarrow = isNarrow;
      }
    };

    window.addEventListener('resize', checkWidth);
    
    if (lastIsNarrow) {
      this.panel.classList.add('collapsed');
      this.isCollapsed = true;
    }
  }

  private togglePanel(): void {
    this.isCollapsed = !this.isCollapsed;
    this.panel.classList.toggle('collapsed', this.isCollapsed);
  }

  setFps(fps: number): void {
    const fpsEl = document.getElementById('fps-value');
    if (fpsEl) {
      fpsEl.textContent = fps.toString();
    }
  }
}
