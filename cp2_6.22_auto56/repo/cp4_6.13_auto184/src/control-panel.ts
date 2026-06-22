export type LayoutType = 'force' | 'concentric' | 'tree';

export interface ControlPanelCallbacks {
  onLayoutChange(layout: LayoutType): void;
  onLabelToggle(show: boolean): void;
  onForceStrengthChange(strength: number): void;
}

export class ControlPanel {
  private callbacks: ControlPanelCallbacks;
  private panel: HTMLElement;
  private toggle: HTMLElement;
  private layoutSelect: HTMLSelectElement;
  private labelToggle: HTMLElement;
  private forceSlider: HTMLInputElement;
  private forceValue: HTMLElement;

  constructor(callbacks: ControlPanelCallbacks) {
    this.callbacks = callbacks;
    this.panel = document.getElementById('control-panel')!;
    this.toggle = document.getElementById('panel-toggle')!;
    this.layoutSelect = document.getElementById('layout-select') as HTMLSelectElement;
    this.labelToggle = document.getElementById('label-toggle')!;
    this.forceSlider = document.getElementById('force-slider') as HTMLInputElement;
    this.forceValue = document.getElementById('force-value')!;
  }

  init(): void {
    this.toggle.addEventListener('click', () => {
      this.panel.classList.toggle('collapsed');
      this.toggle.classList.toggle('collapsed');
      this.toggle.textContent = this.panel.classList.contains('collapsed') ? '▶' : '◀';
    });

    this.layoutSelect.addEventListener('change', () => {
      this.callbacks.onLayoutChange(this.layoutSelect.value as LayoutType);
    });

    this.labelToggle.addEventListener('click', () => {
      this.labelToggle.classList.toggle('active');
      this.callbacks.onLabelToggle(this.labelToggle.classList.contains('active'));
    });

    this.forceSlider.addEventListener('input', () => {
      this.forceValue.textContent = this.forceSlider.value;
      this.forceValue.classList.add('shake');
      setTimeout(() => {
        this.forceValue.classList.remove('shake');
      }, 50);
      this.callbacks.onForceStrengthChange(parseFloat(this.forceSlider.value));
    });
  }
}
