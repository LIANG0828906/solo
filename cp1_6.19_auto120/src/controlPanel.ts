export interface ControlPanelState {
  audioEnabled: boolean;
  particleCount: number;
}

export class ControlPanel {
  private container: HTMLElement;
  private audioEnabled: boolean = true;
  private particleCount: number = 32;
  private onStateChange: ((state: ControlPanelState) => void) | null = null;
  private collapseTimer: number | null = null;
  private readonly COLLAPSE_DELAY = 5000;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'control-panel';
    this.buildUI();
    this.setupCollapseTimer();
    this.setupInteractionListeners();
  }

  setOnStateChange(callback: (state: ControlPanelState) => void): void {
    this.onStateChange = callback;
  }

  getState(): ControlPanelState {
    return {
      audioEnabled: this.audioEnabled,
      particleCount: this.particleCount
    };
  }

  getElement(): HTMLElement {
    return this.container;
  }

  private buildUI(): void {
    const toggleRow = document.createElement('div');
    toggleRow.className = 'control-row';

    const toggleLabel = document.createElement('span');
    toggleLabel.className = 'control-label';
    toggleLabel.textContent = '音调开关';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn on';
    toggleBtn.addEventListener('click', () => {
      this.audioEnabled = !this.audioEnabled;
      toggleBtn.className = `toggle-btn ${this.audioEnabled ? 'on' : 'off'}`;
      this.notifyStateChange();
      this.resetCollapseTimer();
    });

    toggleRow.appendChild(toggleLabel);
    toggleRow.appendChild(toggleBtn);

    const sliderRow = document.createElement('div');
    sliderRow.className = 'control-row';

    const sliderLabel = document.createElement('span');
    sliderLabel.className = 'control-label';
    sliderLabel.textContent = '粒子数量';

    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '16';
    slider.max = '64';
    slider.value = '32';
    slider.step = '1';
    slider.className = 'particle-slider';

    const sliderValue = document.createElement('span');
    sliderValue.className = 'slider-value';
    sliderValue.textContent = '32';

    slider.addEventListener('input', () => {
      this.particleCount = parseInt(slider.value, 10);
      sliderValue.textContent = slider.value;
      this.notifyStateChange();
      this.resetCollapseTimer();
    });

    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(sliderValue);

    sliderRow.appendChild(sliderLabel);
    sliderRow.appendChild(sliderContainer);

    this.container.appendChild(toggleRow);
    this.container.appendChild(sliderRow);
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  private setupCollapseTimer(): void {
    this.resetCollapseTimer();
  }

  private resetCollapseTimer(): void {
    if (this.collapseTimer !== null) {
      window.clearTimeout(this.collapseTimer);
    }
    this.container.classList.remove('collapsed');
    this.collapseTimer = window.setTimeout(() => {
      this.container.classList.add('collapsed');
    }, this.COLLAPSE_DELAY);
  }

  private setupInteractionListeners(): void {
    this.container.addEventListener('mouseenter', () => {
      if (this.collapseTimer !== null) {
        window.clearTimeout(this.collapseTimer);
        this.collapseTimer = null;
      }
    });

    this.container.addEventListener('mouseleave', () => {
      this.resetCollapseTimer();
    });

    this.container.addEventListener('click', () => {
      this.resetCollapseTimer();
    });
  }
}
