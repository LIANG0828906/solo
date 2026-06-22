import type { VisualMode, VisualizerParams } from './types';

export class EffectPanel {
  private paramCallbacks: ((params: Partial<VisualizerParams>) => void)[] = [];
  private modeCallbacks: ((mode: VisualMode) => void)[] = [];
  private mouseColorMode = false;

  constructor() {
    this.bindModeButtons();
    this.bindSliders();
    this.bindTransport();
    this.bindColorModeSwitcher();
  }

  onParamChange(cb: (params: Partial<VisualizerParams>) => void): void {
    this.paramCallbacks.push(cb);
  }

  onModeChange(cb: (mode: VisualMode) => void): void {
    this.modeCallbacks.push(cb);
  }

  private emitParamChange(params: Partial<VisualizerParams>): void {
    for (const cb of this.paramCallbacks) cb(params);
  }

  private emitModeChange(mode: VisualMode): void {
    for (const cb of this.modeCallbacks) cb(mode);
  }

  private bindModeButtons(): void {
    const btns = document.querySelectorAll('.mode-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.mode as VisualMode;
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.emitModeChange(mode);
      });
    });
  }

  private bindSliders(): void {
    this.bindSlider('paramCount', 'valCount', (v) => {
      this.emitParamChange({ particleCount: parseInt(v) });
    });
    this.bindSlider('paramSize', 'valSize', (v) => {
      this.emitParamChange({ particleSize: parseFloat(v) });
    });
    this.bindSlider('paramSpeed', 'valSpeed', (v) => {
      this.emitParamChange({ speed: parseFloat(v) });
    });
    this.bindSlider('paramSat', 'valSat', (v) => {
      this.emitParamChange({ colorSaturation: parseInt(v) });
    });
    this.bindSlider('paramBlur', 'valBlur', (v) => {
      this.emitParamChange({ backgroundBlur: parseInt(v) });
    });
  }

  private bindSlider(sliderId: string, valueId: string, onChange: (v: string) => void): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    const display = document.getElementById(valueId);
    if (!slider || !display) return;

    slider.addEventListener('input', () => {
      display.textContent = slider.value;
      onChange(slider.value);
    });
  }

  private bindTransport(): void {

  }

  private bindColorModeSwitcher(): void {
    const btns = document.querySelectorAll('.color-mode-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const colorMode = (btn as HTMLElement).dataset.colormode;
        const isMouseMode = colorMode === 'mouse';
        this.mouseColorMode = isMouseMode;
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.emitParamChange({ mouseColorMode: isMouseMode });
      });
    });
  }

  getMouseColorMode(): boolean {
    return this.mouseColorMode;
  }
}
