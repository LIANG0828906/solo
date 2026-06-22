import { PatternParams, getThemes } from './generator';

export type ControlChangeCallback = (params: PatternParams) => void;

export class Controls {
  private container: HTMLElement;
  private params: PatternParams;
  private onChange: ControlChangeCallback;
  private isDragging: boolean = false;
  private startAngle: number = 0;
  private knobRotation: number = 0;

  constructor(container: HTMLElement, initialParams: PatternParams, onChange: ControlChangeCallback) {
    this.container = container;
    this.params = { ...initialParams };
    this.onChange = onChange;
    this.render();
  }

  private render(): void {
    const themes = getThemes();

    this.container.innerHTML = `
      <div class="control-group">
        <label class="control-label">递归深度</label>
        <div class="slider-wrapper">
          <input type="range" id="depth-slider" min="2" max="6" step="1" value="${this.params.depth}">
          <div class="slider-value" id="depth-value">${this.params.depth}</div>
        </div>
      </div>

      <div class="control-group">
        <label class="control-label">旋转角度</label>
        <div class="knob-wrapper">
          <div class="knob-container" id="knob-container">
            <svg class="knob-svg" viewBox="0 0 60 60" id="knob-svg">
              ${this.renderKnobTicks()}
              <circle cx="30" cy="30" r="22" fill="#0F3460" stroke="#1A1A2E" stroke-width="2"/>
              <line x1="30" y1="12" x2="30" y2="20" stroke="#E94560" stroke-width="2" stroke-linecap="round" id="knob-indicator"/>
            </svg>
            <div class="knob-value" id="knob-value">${this.params.angle}°</div>
          </div>
        </div>
      </div>

      <div class="control-group">
        <label class="control-label">缩放比例</label>
        <div class="slider-wrapper">
          <input type="range" id="scale-slider" min="0.5" max="1.5" step="0.1" value="${this.params.scale}">
          <div class="slider-value" id="scale-value">${this.params.scale.toFixed(1)}</div>
        </div>
      </div>

      <div class="control-group">
        <label class="control-label">颜色主题</label>
        <select id="theme-select">
          ${themes.map(t => `<option value="${t.key}" ${t.key === this.params.theme ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
      </div>
    `;

    this.bindEvents();
    this.updateKnobRotation(this.params.angle);
  }

  private renderKnobTicks(): string {
    let ticks = '';
    const cx = 30;
    const cy = 30;
    const outerR = 28;
    const innerR = 25;

    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180 - Math.PI / 2;
      const x1 = cx + Math.cos(rad) * innerR;
      const y1 = cy + Math.sin(rad) * innerR;
      const x2 = cx + Math.cos(rad) * outerR;
      const y2 = cy + Math.sin(rad) * outerR;
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0F3460" stroke-width="1"/>`;
    }

    return ticks;
  }

  private bindEvents(): void {
    const depthSlider = document.getElementById('depth-slider') as HTMLInputElement;
    const scaleSlider = document.getElementById('scale-slider') as HTMLInputElement;
    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    const knobContainer = document.getElementById('knob-container') as HTMLElement;

    depthSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.params.depth = value;
      document.getElementById('depth-value')!.textContent = String(value);
      this.onChange({ ...this.params });
    });

    scaleSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.params.scale = value;
      document.getElementById('scale-value')!.textContent = value.toFixed(1);
      this.onChange({ ...this.params });
    });

    themeSelect.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.params.theme = value;
      this.onChange({ ...this.params });
    });

    knobContainer.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    knobContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startDrag(e.touches[0]);
    });
    document.addEventListener('touchmove', (e) => {
      if (this.isDragging) {
        e.preventDefault();
        this.onDrag(e.touches[0]);
      }
    }, { passive: false });
    document.addEventListener('touchend', () => this.endDrag());
  }

  private startDrag(e: MouseEvent | Touch): void {
    this.isDragging = true;
    const knobContainer = document.getElementById('knob-container')!;
    const rect = knobContainer.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    this.startAngle = Math.atan2(dy, dx) * (180 / Math.PI) - this.knobRotation;
  }

  private onDrag(e: MouseEvent | Touch): void {
    if (!this.isDragging) return;

    const knobContainer = document.getElementById('knob-container')!;
    const rect = knobContainer.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI) - this.startAngle;
    angle = ((angle % 360) + 360) % 360;

    const snappedAngle = Math.round(angle / 5) * 5;
    const finalAngle = snappedAngle % 360;

    this.params.angle = finalAngle;
    this.updateKnobRotation(finalAngle);
    document.getElementById('knob-value')!.textContent = `${finalAngle}°`;
    this.onChange({ ...this.params });
  }

  private endDrag(): void {
    this.isDragging = false;
  }

  private updateKnobRotation(angle: number): void {
    this.knobRotation = angle;
    const indicator = document.getElementById('knob-indicator');
    const knobSvg = document.getElementById('knob-svg');
    if (indicator && knobSvg) {
      (indicator as unknown as SVGLineElement).style.transformOrigin = '30px 30px';
      (indicator as unknown as SVGLineElement).style.transform = `rotate(${angle}deg)`;
      (knobSvg as unknown as SVGSVGElement).style.transform = `rotate(${angle}deg)`;
    }
  }

  public updateParams(params: PatternParams): void {
    this.params = { ...params };

    const depthSlider = document.getElementById('depth-slider') as HTMLInputElement;
    const scaleSlider = document.getElementById('scale-slider') as HTMLInputElement;
    const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

    if (depthSlider) depthSlider.value = String(params.depth);
    if (scaleSlider) scaleSlider.value = String(params.scale);
    if (themeSelect) themeSelect.value = params.theme;

    const depthValue = document.getElementById('depth-value');
    const scaleValue = document.getElementById('scale-value');
    if (depthValue) depthValue.textContent = String(params.depth);
    if (scaleValue) scaleValue.textContent = params.scale.toFixed(1);

    const knobValue = document.getElementById('knob-value');
    if (knobValue) knobValue.textContent = `${params.angle}°`;
    this.updateKnobRotation(params.angle);
  }

  public getParams(): PatternParams {
    return { ...this.params };
  }
}
