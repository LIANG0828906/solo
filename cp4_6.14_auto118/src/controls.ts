import { RotorAngles } from './drone';

export interface ControlEvents {
  onAngleChange: (angles: RotorAngles) => void;
  onStart: () => void;
  onReset: () => void;
}

export class ControlPanel {
  private sliders: {
    frontLeft: HTMLInputElement;
    frontRight: HTMLInputElement;
    rearLeft: HTMLInputElement;
    rearRight: HTMLInputElement;
  };
  
  private valueDisplays: {
    frontLeft: HTMLElement;
    frontRight: HTMLElement;
    rearLeft: HTMLElement;
    rearRight: HTMLElement;
  };
  
  private startButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private pitchValue: HTMLElement;
  private yawValue: HTMLElement;
  private flightStatus: HTMLElement;
  
  private events: ControlEvents;
  private isFlying: boolean = false;

  constructor(events: ControlEvents) {
    this.events = events;
    
    this.sliders = {
      frontLeft: document.getElementById('slider-fl') as HTMLInputElement,
      frontRight: document.getElementById('slider-fr') as HTMLInputElement,
      rearLeft: document.getElementById('slider-rl') as HTMLInputElement,
      rearRight: document.getElementById('slider-rr') as HTMLInputElement
    };
    
    this.valueDisplays = {
      frontLeft: document.getElementById('fl-value') as HTMLElement,
      frontRight: document.getElementById('fr-value') as HTMLElement,
      rearLeft: document.getElementById('rl-value') as HTMLElement,
      rearRight: document.getElementById('rr-value') as HTMLElement
    };
    
    this.startButton = document.getElementById('btn-start') as HTMLButtonElement;
    this.resetButton = document.getElementById('btn-reset') as HTMLButtonElement;
    this.pitchValue = document.getElementById('pitch-value') as HTMLElement;
    this.yawValue = document.getElementById('yaw-value') as HTMLElement;
    this.flightStatus = document.getElementById('flight-status') as HTMLElement;
    
    this.bindEvents();
  }

  private bindEvents(): void {
    const handleSliderChange = () => {
      const angles = this.getAngles();
      this.updateValueDisplays();
      this.events.onAngleChange(angles);
    };
    
    Object.values(this.sliders).forEach(slider => {
      slider.addEventListener('input', handleSliderChange);
      slider.addEventListener('change', handleSliderChange);
    });
    
    this.startButton.addEventListener('click', () => {
      if (!this.isFlying) {
        this.isFlying = true;
        this.startButton.textContent = '⏸ 飞行中...';
        this.startButton.disabled = true;
        this.flightStatus.textContent = '飞行中';
        this.flightStatus.style.color = '#22c55e';
        this.events.onStart();
      }
    });
    
    this.resetButton.addEventListener('click', () => {
      this.isFlying = false;
      this.startButton.textContent = '▶ 开始飞行';
      this.startButton.disabled = false;
      this.flightStatus.textContent = '待命';
      this.flightStatus.style.color = '#facc15';
      
      Object.keys(this.sliders).forEach(key => {
        const k = key as keyof RotorAngles;
        this.sliders[k].value = '15';
      });
      this.updateValueDisplays();
      
      this.pitchValue.textContent = '0.0°';
      this.yawValue.textContent = '0.0°';
      
      this.events.onReset();
    });
  }

  private updateValueDisplays(): void {
    Object.keys(this.sliders).forEach(key => {
      const k = key as keyof RotorAngles;
      this.valueDisplays[k].textContent = `${this.sliders[k].value}°`;
    });
  }

  public getAngles(): RotorAngles {
    return {
      frontLeft: parseFloat(this.sliders.frontLeft.value),
      frontRight: parseFloat(this.sliders.frontRight.value),
      rearLeft: parseFloat(this.sliders.rearLeft.value),
      rearRight: parseFloat(this.sliders.rearRight.value)
    };
  }

  public updateAttitude(pitch: number, yaw: number): void {
    this.pitchValue.textContent = `${pitch.toFixed(1)}°`;
    this.yawValue.textContent = `${yaw.toFixed(1)}°`;
  }

  public setFlyingState(flying: boolean): void {
    this.isFlying = flying;
    if (flying) {
      this.startButton.textContent = '⏸ 飞行中...';
      this.startButton.disabled = true;
      this.flightStatus.textContent = '飞行中';
      this.flightStatus.style.color = '#22c55e';
    } else {
      this.startButton.textContent = '▶ 开始飞行';
      this.startButton.disabled = false;
      this.flightStatus.textContent = '待命';
      this.flightStatus.style.color = '#facc15';
    }
  }
}
