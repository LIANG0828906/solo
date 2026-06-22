import { FaultType } from './terrainModel';
import { FAULT_DESCRIPTIONS } from './faultController';

export interface UIEventHandlers {
  onFaultSelect: (type: FaultType) => void;
  onDipChange: (value: number) => void;
  onDisplacementChange: (value: number) => void;
  onSlipSpeedChange: (value: number) => void;
}

export class UIPanel {
  private handlers: UIEventHandlers;

  private dipSlider: HTMLInputElement;
  private displacementSlider: HTMLInputElement;
  private slipspeedSlider: HTMLInputElement;
  private dipValue: HTMLSpanElement;
  private displacementValue: HTMLSpanElement;
  private slipspeedValue: HTMLSpanElement;
  private faultButtons: HTMLButtonElement[];
  private descriptionContainer: HTMLElement;
  private stressDiagram: HTMLElement;
  private fpsCounter: HTMLElement;

  private targetDipValue: number;
  private targetDisplacementValue: number;
  private targetSlipSpeedValue: number;
  private displayedDipValue: number;
  private displayedDisplacementValue: number;
  private displayedSlipSpeedValue: number;

  private activeType: FaultType | null = null;

  constructor(handlers: UIEventHandlers) {
    this.handlers = handlers;

    this.dipSlider = document.getElementById('dip-slider') as HTMLInputElement;
    this.displacementSlider = document.getElementById('displacement-slider') as HTMLInputElement;
    this.slipspeedSlider = document.getElementById('slipspeed-slider') as HTMLInputElement;
    this.dipValue = document.getElementById('dip-value') as HTMLSpanElement;
    this.displacementValue = document.getElementById('displacement-value') as HTMLSpanElement;
    this.slipspeedValue = document.getElementById('slipspeed-value') as HTMLSpanElement;
    this.faultButtons = Array.from(document.querySelectorAll('.fault-btn')) as HTMLButtonElement[];
    this.descriptionContainer = document.getElementById('fault-description') as HTMLElement;
    this.stressDiagram = document.getElementById('stress-diagram') as HTMLElement;
    this.fpsCounter = document.getElementById('fps-counter') as HTMLElement;

    this.targetDipValue = parseFloat(this.dipSlider.value);
    this.targetDisplacementValue = parseFloat(this.displacementSlider.value) / 100;
    this.targetSlipSpeedValue = parseFloat(this.slipspeedSlider.value) / 100;
    this.displayedDipValue = this.targetDipValue;
    this.displayedDisplacementValue = this.targetDisplacementValue;
    this.displayedSlipSpeedValue = this.targetSlipSpeedValue;

    this.bindEvents();
    this.updateValueDisplays(true);
  }

  private bindEvents(): void {
    for (const btn of this.faultButtons) {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type as FaultType;
        if (!type) return;

        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 500);

        this.setActiveFault(type);
        this.handlers.onFaultSelect(type);
      });
    }

    this.dipSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.targetDipValue = val;
      this.handlers.onDipChange(val);
    });

    this.displacementSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value) / 100;
      this.targetDisplacementValue = val;
      this.handlers.onDisplacementChange(val);
    });

    this.slipspeedSlider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value) / 100;
      this.targetSlipSpeedValue = val;
      this.handlers.onSlipSpeedChange(val);
    });
  }

  public setActiveFault(type: FaultType): void {
    this.activeType = type;

    for (const btn of this.faultButtons) {
      btn.classList.toggle('active', btn.dataset.type === type);
    }

    this.setFaultDescription(type);
    this.setStressDiagram(type);
  }

  private setFaultDescription(type: FaultType): void {
    const desc = FAULT_DESCRIPTIONS[type];
    this.descriptionContainer.innerHTML = `
      <div class="desc-title">${desc.title}</div>
      <div class="desc-stress">${desc.stress}</div>
      <div class="desc-text">${desc.text}</div>
    `;
  }

  private setStressDiagram(type: FaultType): void {
    let svgContent = '';

    if (type === 'normal') {
      svgContent = `
        <defs>
          <linearGradient id="arrow1" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" style="stop-color:#ff6644;stop-opacity:0.3"/>
            <stop offset="100%" style="stop-color:#ff6644;stop-opacity:1"/>
          </linearGradient>
          <linearGradient id="arrow2" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" style="stop-color:#ff6644;stop-opacity:0.3"/>
            <stop offset="100%" style="stop-color:#ff6644;stop-opacity:1"/>
          </linearGradient>
        </defs>
        <rect x="20" y="30" width="70" height="45" fill="#c97b4b" stroke="#5a3e25" stroke-width="1.5" rx="2"/>
        <rect x="110" y="42" width="70" height="45" fill="#8b6140" stroke="#5a3e25" stroke-width="1.5" rx="2"/>
        <line x1="85" y1="20" x2="115" y2="95" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="4,2" opacity="0.9"/>
        <path d="M 100 15 L 100 35 L 95 30 L 100 35 L 105 30" fill="none" stroke="#ff8855" stroke-width="2"/>
        <path d="M 100 105 L 100 85 L 95 90 L 100 90 L 105 90" fill="none" stroke="#ff8855" stroke-width="2"/>
        <text x="100" y="110" text-anchor="middle" fill="#a8d888" font-size="10" font-family="Georgia">拉张应力 ↑ ↓</text>
      `;
    } else if (type === 'reverse') {
      svgContent = `
        <defs>
          <linearGradient id="arrow1" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" style="stop-color:#ff6644;stop-opacity:0.3"/>
            <stop offset="100%" style="stop-color:#ff6644;stop-opacity:1"/>
          </linearGradient>
          <linearGradient id="arrow2" x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" style="stop-color:#ff6644;stop-opacity:0.3"/>
            <stop offset="100%" style="stop-color:#ff6644;stop-opacity:1"/>
          </linearGradient>
        </defs>
        <rect x="20" y="38" width="70" height="45" fill="#c97b4b" stroke="#5a3e25" stroke-width="1.5" rx="2"/>
        <rect x="95" y="25" width="70" height="45" fill="#8b6140" stroke="#5a3e25" stroke-width="1.5" rx="2"/>
        <line x1="80" y1="95" x2="110" y2="15" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="4,2" opacity="0.9"/>
        <path d="M 35 55 L 55 55 L 50 50 L 55 55 L 50 60" fill="none" stroke="#ff8855" stroke-width="2"/>
        <path d="M 165 55 L 145 55 L 150 50 L 145 55 L 150 60" fill="none" stroke="#ff8855" stroke-width="2"/>
        <text x="100" y="110" text-anchor="middle" fill="#a8d888" font-size="10" font-family="Georgia">挤压应力 → ←</text>
      `;
    } else if (type === 'strike-slip') {
      svgContent = `
        <defs>
          <linearGradient id="arrow1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ff6644;stop-opacity:0.3"/>
            <stop offset="100%" style="stop-color:#ff6644;stop-opacity:1"/>
          </linearGradient>
        </defs>
        <rect x="20" y="25" width="75" height="30" fill="#c97b4b" stroke="#5a3e25" stroke-width="1.5" rx="2"/>
        <rect x="105" y="45" width="75" height="30" fill="#8b6140" stroke="#5a3e25" stroke-width="1.5" rx="2"/>
        <line x1="100" y1="10" x2="100" y2="105" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="4,2" opacity="0.9"/>
        <path d="M 30 55 L 60 35 L 55 30 L 60 35 L 55 40" fill="none" stroke="#ff8855" stroke-width="2"/>
        <path d="M 170 55 L 140 75 L 145 80 L 140 75 L 145 70" fill="none" stroke="#ff8855" stroke-width="2"/>
        <text x="100" y="110" text-anchor="middle" fill="#a8d888" font-size="10" font-family="Georgia">剪切应力 ⇄</text>
      `;
    }

    this.stressDiagram.innerHTML = `
      <svg viewBox="0 0 200 120" width="100%" height="100%">
        ${svgContent}
      </svg>
    `;
  }

  public updateValueDisplays(force = false): void {
    const smoothSpeed = force ? 1 : 0.15;

    this.displayedDipValue += (this.targetDipValue - this.displayedDipValue) * smoothSpeed;
    this.displayedDisplacementValue += (this.targetDisplacementValue - this.displayedDisplacementValue) * smoothSpeed;
    this.displayedSlipSpeedValue += (this.targetSlipSpeedValue - this.displayedSlipSpeedValue) * smoothSpeed;

    if (force) {
      this.displayedDipValue = this.targetDipValue;
      this.displayedDisplacementValue = this.targetDisplacementValue;
      this.displayedSlipSpeedValue = this.targetSlipSpeedValue;
    }

    this.dipValue.textContent = `${Math.round(this.displayedDipValue)}°`;
    this.displacementValue.textContent = this.displayedDisplacementValue.toFixed(2);
    this.slipspeedValue.textContent = `${this.displayedSlipSpeedValue.toFixed(2)}x`;
  }

  public updateFPS(fps: number): void {
    this.fpsCounter.textContent = `FPS: ${fps.toFixed(0)}`;
    if (fps >= 30) {
      this.fpsCounter.style.color = '#7a9b6a';
    } else if (fps >= 20) {
      this.fpsCounter.style.color = '#c9a85a';
    } else {
      this.fpsCounter.style.color = '#c96a5a';
    }
  }

  public getActiveType(): FaultType | null {
    return this.activeType;
  }

  public update(dt: number): void {
    this.updateValueDisplays();
  }
}
