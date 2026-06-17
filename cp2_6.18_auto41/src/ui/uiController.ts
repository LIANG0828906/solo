import { eventBus } from '../eventBus';

export interface UIColor {
  r: number;
  g: number;
  b: number;
  hex: string;
}

const PRESET_COLORS: UIColor[] = [
  { r: 255, g: 255, b: 255, hex: '#FFFFFF' },
  { r: 255, g: 80, b: 80, hex: '#FF5050' },
  { r: 80, g: 255, b: 120, hex: '#50FF78' },
  { r: 80, g: 140, b: 255, hex: '#508CFF' },
  { r: 255, g: 200, b: 50, hex: '#FFC832' },
  { r: 200, g: 80, b: 255, hex: '#C850FF' },
  { r: 50, g: 255, b: 255, hex: '#32FFFF' },
  { r: 255, g: 140, b: 50, hex: '#FF8C32' },
];

export class UIController {
  panel: HTMLDivElement;
  selectedColor: UIColor = PRESET_COLORS[0];
  densityStrength: number = 0.5;
  viscosity: number = 1.0;
  particleCount: number = 2000;

  constructor() {
    this.panel = this.createPanel();
    document.body.appendChild(this.panel);
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.id = 'fluid-ui-panel';
    Object.assign(panel.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '260px',
      background: 'rgba(10,10,20,0.85)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '20px',
      zIndex: '1000',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#ccc',
      fontSize: '13px',
      backdropFilter: 'blur(8px)',
      userSelect: 'none',
    });

    const title = document.createElement('div');
    title.textContent = 'FluidCanvas';
    Object.assign(title.style, {
      fontSize: '18px',
      fontWeight: '600',
      color: '#fff',
      marginBottom: '16px',
      letterSpacing: '1px',
    });
    panel.appendChild(title);

    this.addSlider(panel, 'Viscosity', 0.1, 10, 1, 0.1, (val) => {
      this.viscosity = val;
      eventBus.emit('viscosityChange', val);
    });

    this.addSlider(panel, 'Density Strength', 0.1, 1.0, 0.5, 0.1, (val) => {
      this.densityStrength = val;
    });

    this.addSlider(panel, 'Particle Count', 500, 5000, 2000, 100, (val) => {
      this.particleCount = val;
      eventBus.emit('particleCountChange', val);
    });

    this.addColorPicker(panel);

    this.addClearButton(panel);

    const style = document.createElement('style');
    style.textContent = `
      #fluid-ui-panel input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 4px;
        border-radius: 2px;
        background: rgba(255,255,255,0.2);
        outline: none;
        cursor: pointer;
      }
      #fluid-ui-panel input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #4A90D9;
        cursor: pointer;
        transition: background 0.2s;
      }
      #fluid-ui-panel input[type="range"]::-webkit-slider-thumb:hover {
        background: #5BA3E6;
      }
      #fluid-ui-panel input[type="range"]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #4A90D9;
        cursor: pointer;
        border: none;
        transition: background 0.2s;
      }
      #fluid-ui-panel input[type="range"]::-moz-range-thumb:hover {
        background: #5BA3E6;
      }
      #fluid-ui-panel input[type="range"]::-moz-range-track {
        height: 4px;
        border-radius: 2px;
        background: rgba(255,255,255,0.2);
      }
    `;
    document.head.appendChild(style);

    return panel;
  }

  private addSlider(
    container: HTMLDivElement,
    label: string,
    min: number,
    max: number,
    value: number,
    step: number,
    onChange: (val: number) => void
  ): void {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      marginBottom: '14px',
    });

    const labelRow = document.createElement('div');
    Object.assign(labelRow.style, {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
    });

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    Object.assign(labelEl.style, { fontSize: '12px', color: '#aaa' });

    const valueEl = document.createElement('span');
    valueEl.textContent = String(value);
    Object.assign(valueEl.style, { fontSize: '12px', color: '#4A90D9' });

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valueEl);
    wrapper.appendChild(labelRow);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    slider.addEventListener('input', () => {
      const v = parseFloat(slider.value);
      valueEl.textContent = String(v);
      onChange(v);
    });

    wrapper.appendChild(slider);
    container.appendChild(wrapper);
  }

  private addColorPicker(container: HTMLDivElement): void {
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, { marginBottom: '14px' });

    const labelEl = document.createElement('div');
    labelEl.textContent = 'Color';
    Object.assign(labelEl.style, { fontSize: '12px', color: '#aaa', marginBottom: '8px' });
    wrapper.appendChild(labelEl);

    const colorGrid = document.createElement('div');
    Object.assign(colorGrid.style, {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
    });

    PRESET_COLORS.forEach((color, idx) => {
      const swatch = document.createElement('div');
      Object.assign(swatch.style, {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: color.hex,
        cursor: 'pointer',
        border: idx === 0 ? '2px solid #4A90D9' : '2px solid transparent',
        transition: 'border-color 0.2s, transform 0.2s',
      });
      swatch.addEventListener('click', () => {
        this.selectedColor = color;
        colorGrid.querySelectorAll('div').forEach(s => {
          (s as HTMLElement).style.borderColor = 'transparent';
        });
        swatch.style.borderColor = '#4A90D9';
      });
      swatch.addEventListener('mouseenter', () => {
        swatch.style.transform = 'scale(1.15)';
      });
      swatch.addEventListener('mouseleave', () => {
        swatch.style.transform = 'scale(1)';
      });
      colorGrid.appendChild(swatch);
    });

    const customLabel = document.createElement('label');
    Object.assign(customLabel.style, {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      overflow: 'hidden',
      cursor: 'pointer',
      border: '2px dashed rgba(255,255,255,0.3)',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    const customInput = document.createElement('input');
    customInput.type = 'color';
    customInput.value = '#ffffff';
    Object.assign(customInput.style, {
      position: 'absolute',
      opacity: '0',
      width: '100%',
      height: '100%',
      cursor: 'pointer',
    });

    const plusSign = document.createElement('span');
    plusSign.textContent = '+';
    Object.assign(plusSign.style, {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '14px',
      pointerEvents: 'none',
    });

    customLabel.appendChild(customInput);
    customLabel.appendChild(plusSign);

    customInput.addEventListener('input', () => {
      const hex = customInput.value;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      this.selectedColor = { r, g, b, hex };
      colorGrid.querySelectorAll('div').forEach(s => {
        (s as HTMLElement).style.borderColor = 'transparent';
      });
      customLabel.style.borderColor = '#4A90D9';
      customLabel.style.background = hex;
      plusSign.style.display = 'none';
    });

    colorGrid.appendChild(customLabel);
    wrapper.appendChild(colorGrid);
    container.appendChild(wrapper);
  }

  private addClearButton(container: HTMLDivElement): void {
    const btn = document.createElement('button');
    btn.textContent = 'Clear';
    Object.assign(btn.style, {
      width: '100%',
      padding: '8px 0',
      marginTop: '6px',
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '6px',
      color: '#ccc',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: 'inherit',
    });
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255,80,80,0.25)';
      btn.style.borderColor = 'rgba(255,80,80,0.4)';
      btn.style.color = '#ff8888';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(255,255,255,0.08)';
      btn.style.borderColor = 'rgba(255,255,255,0.15)';
      btn.style.color = '#ccc';
    });
    btn.addEventListener('click', () => {
      btn.style.background = 'rgba(255,80,80,0.5)';
      eventBus.emit('clearFluid');
      setTimeout(() => {
        btn.style.background = 'rgba(255,255,255,0.08)';
      }, 300);
    });
    container.appendChild(btn);
  }

  getSelectedColor(): UIColor {
    return this.selectedColor;
  }

  getDensityStrength(): number {
    return this.densityStrength;
  }
}
