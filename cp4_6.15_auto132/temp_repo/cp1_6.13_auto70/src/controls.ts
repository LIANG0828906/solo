import { SpreadMode } from './gridEngine';

export interface ControlConfig {
  spreadDecay: number;
  spreadMode: SpreadMode;
  onSpreadDecayChange: (value: number) => void;
  onSpreadModeChange: (mode: SpreadMode) => void;
  onReset: () => void;
}

export class Controls {
  private container: HTMLElement;
  private config: ControlConfig;

  constructor(container: HTMLElement, config: ControlConfig) {
    this.container = container;
    this.config = config;
    this.build();
  }

  private build(): void {
    const panel = document.createElement('div');
    panel.className = 'control-panel';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'control-group';
    
    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = 'GridTide';
    
    const subtitle = document.createElement('div');
    subtitle.className = 'panel-subtitle';
    subtitle.textContent = '水波网格交互工具';
    
    titleGroup.appendChild(title);
    titleGroup.appendChild(subtitle);
    panel.appendChild(titleGroup);

    panel.appendChild(this.createSliderControl());
    panel.appendChild(this.createDropdownControl());
    panel.appendChild(this.createResetButton());

    this.container.appendChild(panel);
  }

  private createSliderControl(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '波纹衰减系数';

    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider';
    slider.min = '0.2';
    slider.max = '1.0';
    slider.step = '0.1';
    slider.value = this.config.spreadDecay.toString();

    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = this.config.spreadDecay.toFixed(1);

    slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      valueDisplay.textContent = value.toFixed(1);
      this.config.onSpreadDecayChange(value);
    });

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(valueDisplay);

    group.appendChild(label);
    group.appendChild(sliderContainer);

    return group;
  }

  private createDropdownControl(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '波纹扩散模式';

    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'dropdown-container';

    const dropdown = document.createElement('select');
    dropdown.className = 'dropdown';

    const options: { value: SpreadMode; label: string }[] = [
      { value: 'circular', label: '圆形扩散' },
      { value: 'cross', label: '十字扩散' },
      { value: 'random', label: '随机扩散' }
    ];

    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (opt.value === this.config.spreadMode) {
        option.selected = true;
      }
      dropdown.appendChild(option);
    }

    dropdown.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value as SpreadMode;
      this.config.onSpreadModeChange(value);
    });

    dropdown.addEventListener('focus', () => {
      dropdownContainer.classList.add('open');
    });

    dropdown.addEventListener('blur', () => {
      dropdownContainer.classList.remove('open');
    });

    dropdownContainer.appendChild(dropdown);

    group.appendChild(label);
    group.appendChild(dropdownContainer);

    return group;
  }

  private createResetButton(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('div');
    label.className = 'control-label';
    label.textContent = '操作';

    const button = document.createElement('button');
    button.className = 'reset-btn';
    button.textContent = '重置网格';

    button.addEventListener('click', () => {
      button.classList.add('pressed');
      setTimeout(() => {
        button.classList.remove('pressed');
      }, 200);
      this.config.onReset();
    });

    group.appendChild(label);
    group.appendChild(button);

    return group;
  }
}
