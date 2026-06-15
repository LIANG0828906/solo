import { WaveformParams } from './types';

export interface ControlPanelCallbacks {
  onWaveformChange: (type: OscillatorType) => void;
  onFrequencyChange: (freq: number) => void;
  onAttackChange: (value: number) => void;
  onDecayChange: (value: number) => void;
  onSustainChange: (value: number) => void;
  onReleaseChange: (value: number) => void;
  onSpectrumToggle: (enabled: boolean) => void;
  onPlayToggle: () => void;
}

export class ControlPanel {
  private callbacks: ControlPanelCallbacks;
  private params: WaveformParams;
  
  private waveformButtons: NodeListOf<HTMLButtonElement>;
  private frequencySlider: HTMLInputElement;
  private attackSlider: HTMLInputElement;
  private decaySlider: HTMLInputElement;
  private sustainSlider: HTMLInputElement;
  private releaseSlider: HTMLInputElement;
  private spectrumToggle: HTMLButtonElement;
  private playButton: HTMLButtonElement;
  private drawerToggle: HTMLButtonElement;
  private controlPanel: HTMLElement;
  
  private freqValue: HTMLElement;
  private attackValue: HTMLElement;
  private decayValue: HTMLElement;
  private sustainValue: HTMLElement;
  private releaseValue: HTMLElement;
  
  private spectrumEnabled: boolean = false;
  private isPlaying: boolean = false;
  
  private targetFrequency: number = 440;
  private displayFrequency: number = 440;
  private dampingTime: number = 0.1;
  private lastUpdateTime: number = 0;

  constructor(params: WaveformParams, callbacks: ControlPanelCallbacks) {
    this.params = params;
    this.callbacks = callbacks;
    
    this.waveformButtons = document.querySelectorAll('.waveform-btn');
    this.frequencySlider = document.getElementById('frequency-slider') as HTMLInputElement;
    this.attackSlider = document.getElementById('attack-slider') as HTMLInputElement;
    this.decaySlider = document.getElementById('decay-slider') as HTMLInputElement;
    this.sustainSlider = document.getElementById('sustain-slider') as HTMLInputElement;
    this.releaseSlider = document.getElementById('release-slider') as HTMLInputElement;
    this.spectrumToggle = document.getElementById('spectrum-toggle') as HTMLButtonElement;
    this.playButton = document.getElementById('play-btn') as HTMLButtonElement;
    this.drawerToggle = document.getElementById('drawer-toggle') as HTMLButtonElement;
    this.controlPanel = document.getElementById('control-panel') as HTMLElement;
    
    this.freqValue = document.getElementById('freq-value') as HTMLElement;
    this.attackValue = document.getElementById('attack-value') as HTMLElement;
    this.decayValue = document.getElementById('decay-value') as HTMLElement;
    this.sustainValue = document.getElementById('sustain-value') as HTMLElement;
    this.releaseValue = document.getElementById('release-value') as HTMLElement;

    this.bindEvents();
    this.updateDisplayValues();
  }

  private bindEvents(): void {
    this.waveformButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const waveType = btn.dataset.wave as OscillatorType;
        if (waveType) {
          this.setActiveWaveform(waveType);
          this.callbacks.onWaveformChange(waveType);
        }
      });
    });

    this.frequencySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.targetFrequency = value;
      this.updateFrequencyDisplay(value);
    });

    this.frequencySlider.addEventListener('change', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.targetFrequency = value;
      this.displayFrequency = value;
      this.callbacks.onFrequencyChange(value);
    });

    this.attackSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.params.attack = value;
      this.attackValue.textContent = value.toFixed(2) + 's';
      this.callbacks.onAttackChange(value);
    });

    this.decaySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.params.decay = value;
      this.decayValue.textContent = value.toFixed(2) + 's';
      this.callbacks.onDecayChange(value);
    });

    this.sustainSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.params.sustain = value;
      this.sustainValue.textContent = Math.round(value) + '%';
      this.callbacks.onSustainChange(value / 100);
    });

    this.releaseSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.params.release = value;
      this.releaseValue.textContent = value.toFixed(2) + 's';
      this.callbacks.onReleaseChange(value);
    });

    this.spectrumToggle.addEventListener('click', () => {
      this.spectrumEnabled = !this.spectrumEnabled;
      this.spectrumToggle.classList.toggle('active', this.spectrumEnabled);
      this.callbacks.onSpectrumToggle(this.spectrumEnabled);
    });

    this.playButton.addEventListener('click', () => {
      this.togglePlay();
    });

    this.drawerToggle.addEventListener('click', () => {
      this.controlPanel.classList.toggle('drawer-open');
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        this.togglePlay();
      }
    });
  }

  private setActiveWaveform(type: OscillatorType): void {
    this.waveformButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.wave === type);
    });
    this.params.type = type;
  }

  private updateFrequencyDisplay(value: number): void {
    if (value >= 1000) {
      this.freqValue.textContent = (value / 1000).toFixed(1) + ' kHz';
    } else {
      this.freqValue.textContent = Math.round(value) + ' Hz';
    }
  }

  private updateDisplayValues(): void {
    this.updateFrequencyDisplay(this.params.frequency);
    this.attackValue.textContent = this.params.attack.toFixed(2) + 's';
    this.decayValue.textContent = this.params.decay.toFixed(2) + 's';
    this.sustainValue.textContent = Math.round(this.params.sustain) + '%';
    this.releaseValue.textContent = this.params.release.toFixed(2) + 's';
  }

  private togglePlay(): void {
    this.isPlaying = !this.isPlaying;
    this.playButton.classList.toggle('playing', this.isPlaying);
    this.callbacks.onPlayToggle();
  }

  public update(deltaTime: number): void {
    const now = performance.now();
    
    if (Math.abs(this.targetFrequency - this.displayFrequency) > 0.5) {
      const alpha = 1 - Math.exp(-deltaTime / this.dampingTime);
      this.displayFrequency += (this.targetFrequency - this.displayFrequency) * alpha;
      
      if (now - this.lastUpdateTime > 16) {
        this.updateFrequencyDisplay(this.displayFrequency);
        this.callbacks.onFrequencyChange(this.displayFrequency);
        this.lastUpdateTime = now;
      }
    }
  }

  public setPlaying(playing: boolean): void {
    this.isPlaying = playing;
    this.playButton.classList.toggle('playing', playing);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getSpectrumEnabled(): boolean {
    return this.spectrumEnabled;
  }

  public getParams(): WaveformParams {
    return { ...this.params };
  }
}
