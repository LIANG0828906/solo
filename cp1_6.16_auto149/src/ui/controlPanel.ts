export type ClearCallback = () => void;
export type SaveCallback = () => void;
export type ModeChangeCallback = (mode: 'gesture' | 'mouse') => void;

export class ControlPanel {
  private btnClear: HTMLButtonElement;
  private btnSave: HTMLButtonElement;
  private btnMode: HTMLButtonElement;
  private container: HTMLElement;
  private currentMode: 'gesture' | 'mouse' = 'gesture';
  private onClear?: ClearCallback;
  private onSave?: SaveCallback;
  private onModeChange?: ModeChangeCallback;

  constructor(
    container: HTMLElement,
    callbacks: {
      onClear?: ClearCallback;
      onSave?: SaveCallback;
      onModeChange?: ModeChangeCallback;
    } = {}
  ) {
    this.container = container;
    this.onClear = callbacks.onClear;
    this.onSave = callbacks.onSave;
    this.onModeChange = callbacks.onModeChange;

    this.btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
    this.btnSave = document.getElementById('btn-save') as HTMLButtonElement;
    this.btnMode = document.getElementById('btn-mode') as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.btnClear.addEventListener('click', () => {
      this.onClear?.();
    });

    this.btnSave.addEventListener('click', () => {
      this.onSave?.();
    });

    this.btnMode.addEventListener('click', () => {
      this.toggleMode();
    });
  }

  private toggleMode(): void {
    this.container.classList.add('fade-transition');
    this.container.style.opacity = '0.3';

    setTimeout(() => {
      this.currentMode = this.currentMode === 'gesture' ? 'mouse' : 'gesture';
      const label = this.currentMode === 'gesture' ? '手势' : '鼠标';
      this.btnMode.textContent = '切换模式: ' + label;
      this.onModeChange?.(this.currentMode);
      this.container.style.opacity = '1';
      setTimeout(() => {
        this.container.classList.remove('fade-transition');
      }, 300);
    }, 150);
  }

  public getMode(): 'gesture' | 'mouse' {
    return this.currentMode;
  }

  public setMode(mode: 'gesture' | 'mouse'): void {
    if (this.currentMode !== mode) {
      this.toggleMode();
    }
  }
}
