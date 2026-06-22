export interface UIState {
  color: string;
  particleSize: number;
  lifespanSeconds: number;
}

export type UIChangeHandler = (state: UIState) => void;
export type UIClearHandler = () => void;
export type UISaveHandler = () => void;

export class UIController {
  private colorPicker: HTMLInputElement;
  private colorPreview: HTMLElement;
  private sizeSlider: HTMLInputElement;
  private lifespanSlider: HTMLInputElement;
  private clearBtn: HTMLButtonElement;
  private saveBtn: HTMLButtonElement;

  private state: UIState;
  private onChange: UIChangeHandler;
  private onClear: UIClearHandler;
  private onSave: UISaveHandler;

  constructor(
    initialState: UIState,
    onChange: UIChangeHandler,
    onClear: UIClearHandler,
    onSave: UISaveHandler
  ) {
    this.state = { ...initialState };
    this.onChange = onChange;
    this.onClear = onClear;
    this.onSave = onSave;

    const colorPickerEl = document.getElementById('color-picker');
    const colorPreviewEl = document.getElementById('color-preview');
    const sizeSliderEl = document.getElementById('size-slider');
    const lifespanSliderEl = document.getElementById('lifespan-slider');
    const clearBtnEl = document.getElementById('clear-btn');
    const saveBtnEl = document.getElementById('save-btn');

    if (!colorPickerEl || !colorPreviewEl || !sizeSliderEl ||
        !lifespanSliderEl || !clearBtnEl || !saveBtnEl) {
      throw new Error('UI elements not found');
    }

    this.colorPicker = colorPickerEl as HTMLInputElement;
    this.colorPreview = colorPreviewEl as HTMLElement;
    this.sizeSlider = sizeSliderEl as HTMLInputElement;
    this.lifespanSlider = lifespanSliderEl as HTMLInputElement;
    this.clearBtn = clearBtnEl as HTMLButtonElement;
    this.saveBtn = saveBtnEl as HTMLButtonElement;

    this.bindEvents();
    this.syncState();
  }

  private bindEvents(): void {
    this.colorPicker.addEventListener('input', () => {
      this.state.color = this.colorPicker.value;
      this.updateColorPreview();
      this.onChange({ ...this.state });
    });

    this.sizeSlider.addEventListener('input', () => {
      this.state.particleSize = parseFloat(this.sizeSlider.value);
      this.onChange({ ...this.state });
    });

    this.lifespanSlider.addEventListener('input', () => {
      this.state.lifespanSeconds = parseFloat(this.lifespanSlider.value);
      this.onChange({ ...this.state });
    });

    this.clearBtn.addEventListener('click', () => {
      this.onClear();
    });

    this.saveBtn.addEventListener('click', () => {
      this.onSave();
    });
  }

  private updateColorPreview(): void {
    this.colorPreview.style.background = `radial-gradient(circle, ${this.state.color} 0%, ${this.state.color} 40%, conic-gradient(red, yellow, lime, aqua, blue, magenta, red) 41%)`;
  }

  private syncState(): void {
    this.colorPicker.value = this.state.color;
    this.sizeSlider.value = this.state.particleSize.toString();
    this.lifespanSlider.value = this.state.lifespanSeconds.toString();
    this.updateColorPreview();
  }

  getState(): UIState {
    return { ...this.state };
  }
}
