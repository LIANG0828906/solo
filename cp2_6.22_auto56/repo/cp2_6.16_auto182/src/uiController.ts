import { CloudSystem } from './cloudSystem';
import { CloudType, SystemParams, CLOUD_TYPE_CONFIGS } from './types';

export class UIController {
  private cloudSystem: CloudSystem;
  private params: SystemParams;

  private controlPanel: HTMLElement;
  private toggleButton: HTMLElement;
  private panelContent: HTMLElement;
  private tabs: HTMLElement[];
  private tabPanes: HTMLElement[];
  private cloudButtons: HTMLElement[];

  private particleCountEl: HTMLElement;
  private cloudTypeEl: HTMLElement;
  private windSpeedEl: HTMLElement;
  private precipitationEl: HTMLElement;

  private windSpeedSlider: HTMLInputElement;
  private windSpeedValue: HTMLElement;
  private precipitationSlider: HTMLInputElement;
  private precipitationValue: HTMLElement;
  private windDirectionValue: HTMLElement;
  private knob: HTMLElement;
  private knobPointer: HTMLElement;

  private isDraggingKnob: boolean = false;

  constructor(cloudSystem: CloudSystem, initialParams: SystemParams) {
    this.cloudSystem = cloudSystem;
    this.params = { ...initialParams };

    this.controlPanel = document.querySelector('.control-panel') as HTMLElement;
    this.toggleButton = document.getElementById('panel-toggle') as HTMLElement;
    this.panelContent = document.getElementById('panel-content') as HTMLElement;
    this.tabs = Array.from(document.querySelectorAll('.tab-btn')) as HTMLElement[];
    this.tabPanes = Array.from(document.querySelectorAll('.tab-pane')) as HTMLElement[];
    this.cloudButtons = Array.from(document.querySelectorAll('.cloud-btn')) as HTMLElement[];

    this.particleCountEl = document.getElementById('stat-particles') as HTMLElement;
    this.cloudTypeEl = document.getElementById('stat-cloud-type') as HTMLElement;
    this.windSpeedEl = document.getElementById('stat-wind-speed') as HTMLElement;
    this.precipitationEl = document.getElementById('stat-precipitation') as HTMLElement;

    this.windSpeedSlider = document.getElementById('wind-speed') as HTMLInputElement;
    this.windSpeedValue = document.getElementById('wind-speed-value') as HTMLElement;
    this.precipitationSlider = document.getElementById('precipitation') as HTMLInputElement;
    this.precipitationValue = document.getElementById('precipitation-value') as HTMLElement;
    this.windDirectionValue = document.getElementById('wind-direction-value') as HTMLElement;
    this.knob = document.getElementById('knob') as HTMLElement;
    this.knobPointer = document.getElementById('knob-pointer') as HTMLElement;

    this.initKnobTicks();
    this.bindEvents();
    this.updateUI();
  }

  private initKnobTicks(): void {
    const ticksContainer = document.getElementById('knob-ticks') as HTMLElement;
    for (let i = 0; i < 36; i++) {
      const tick = document.createElement('div');
      tick.className = 'knob-tick' + (i % 9 === 0 ? ' major' : '');
      tick.style.transform = `translateX(-50%) rotate(${i * 10}deg)`;
      ticksContainer.appendChild(tick);
    }
  }

  private bindEvents(): void {
    this.toggleButton.addEventListener('click', () => this.togglePanel());

    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.switchTab(index));
    });

    this.cloudButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cloudType = btn.dataset.cloud as CloudType;
        this.onCloudTypeChange(cloudType);
      });
    });

    this.windSpeedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.onWindSpeedChange(value);
    });

    this.precipitationSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.onPrecipitationChange(value);
    });

    this.knob.addEventListener('mousedown', (e) => this.startKnobDrag(e));
    document.addEventListener('mousemove', (e) => this.handleKnobDrag(e));
    document.addEventListener('mouseup', () => this.stopKnobDrag());

    this.knob.addEventListener('touchstart', (e) => this.startKnobDrag(e as unknown as MouseEvent));
    document.addEventListener('touchmove', (e) => this.handleKnobDrag(e.touches[0] as unknown as MouseEvent));
    document.addEventListener('touchend', () => this.stopKnobDrag());
  }

  private togglePanel(): void {
    const isActive = this.panelContent.classList.toggle('active');
    this.toggleButton.classList.toggle('active', isActive);
    this.toggleButton.dataset.tooltip = isActive ? '关闭控制面板' : '打开控制面板';
  }

  private switchTab(index: number): void {
    this.tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });
    this.tabPanes.forEach((pane, i) => {
      pane.classList.toggle('active', i === index);
    });
  }

  private onCloudTypeChange(type: CloudType): void {
    this.params.cloudType = type;
    this.cloudButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.cloud === type);
    });
    this.cloudSystem.updateParams({ cloudType: type });
    this.updateUI();
  }

  private onWindSpeedChange(value: number): void {
    this.params.windSpeed = value;
    this.windSpeedValue.textContent = `${value.toFixed(1)} m/s`;
    this.cloudSystem.updateParams({ windSpeed: value });
    this.updateUI();
  }

  private onPrecipitationChange(value: number): void {
    this.params.precipitationIntensity = value;
    this.precipitationValue.textContent = `${Math.round(value)}%`;
    this.cloudSystem.updateParams({ precipitationIntensity: value });
    this.updateUI();
  }

  private startKnobDrag(e: MouseEvent): void {
    e.preventDefault();
    this.isDraggingKnob = true;
  }

  private handleKnobDrag(e: MouseEvent): void {
    if (!this.isDraggingKnob) return;

    const rect = this.knob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    this.params.windDirection = Math.round(angle);
    this.knobPointer.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
    this.windDirectionValue.textContent = `${Math.round(angle)}`;
    this.cloudSystem.updateParams({ windDirection: this.params.windDirection });
    this.updateUI();
  }

  private stopKnobDrag(): void {
    this.isDraggingKnob = false;
  }

  private updateUI(): void {
    this.windSpeedEl.textContent = `${this.params.windSpeed.toFixed(1)} m/s`;
    this.precipitationEl.textContent = `${Math.round(this.params.precipitationIntensity)}%`;
    
    const config = CLOUD_TYPE_CONFIGS[this.params.cloudType];
    this.cloudTypeEl.textContent = config.name;
  }

  public updateStats(): void {
    const totalParticles = this.cloudSystem.getParticleCount();
    this.particleCountEl.textContent = totalParticles.toLocaleString();
  }

  public dispose(): void {
    document.removeEventListener('mousemove', (e) => this.handleKnobDrag(e));
    document.removeEventListener('mouseup', () => this.stopKnobDrag());
    document.removeEventListener('touchmove', (e) => this.handleKnobDrag(e.touches[0] as unknown as MouseEvent));
    document.removeEventListener('touchend', () => this.stopKnobDrag());
  }
}
