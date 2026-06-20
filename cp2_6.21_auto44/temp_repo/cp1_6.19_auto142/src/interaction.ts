import { SoundWave, WaveformType } from './soundWave';

export class InteractionManager {
  private soundWave: SoundWave;
  private isDragging: boolean = false;
  private startX: number = 0;
  private startY: number = 0;
  private startFreq: number = 440;
  private startAmp: number = 0.5;
  private mouseX: number = 0;
  private mouseY: number = 0;

  private controlRing: HTMLElement;
  private ringFreq: HTMLElement;
  private ringAmp: HTMLElement;
  private controlBar: HTMLElement;
  private waveformIcon: HTMLElement;
  private freqDisplay: HTMLElement;
  private ampDisplay: HTMLElement;

  private hideTimeout: number | null = null;

  private waveformIndex: number = 0;
  private waveformTypes: WaveformType[] = ['sine', 'square', 'sawtooth', 'triangle'];
  private waveformKeys: { [key: string]: number } = {
    'q': 0,
    'w': 1,
    'e': 2,
    'r': 3
  };

  constructor(soundWave: SoundWave) {
    this.soundWave = soundWave;

    this.controlRing = document.getElementById('control-ring')!;
    this.ringFreq = document.getElementById('ring-freq')!;
    this.ringAmp = document.getElementById('ring-amp')!;
    this.controlBar = document.getElementById('control-bar')!;
    this.waveformIcon = document.getElementById('waveform-icon')!;
    this.freqDisplay = document.getElementById('freq-display')!;
    this.ampDisplay = document.getElementById('amp-display')!;

    this.init();
  }

  private init(): void {
    window.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));

    this.controlBar.addEventListener('mouseenter', this.onControlBarEnter.bind(this));
    this.controlBar.addEventListener('mouseleave', this.onControlBarLeave.bind(this));

    document.addEventListener('mousemove', this.onTopAreaMove.bind(this));

    this.updateUI();
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startFreq = this.soundWave.getFrequency();
    this.startAmp = this.soundWave.getAmplitude();
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.showControlRing();
  }

  private onMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    if (this.isDragging) {
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;

      const freqDelta = dx * 2;
      const newFreq = Math.max(20, Math.min(2000, this.startFreq + freqDelta));
      this.soundWave.setFrequency(newFreq);

      const ampDelta = -dy / 200;
      const newAmp = Math.max(0, Math.min(1, this.startAmp + ampDelta));
      this.soundWave.setAmp(newAmp);

      this.updateControlRingPosition();
      this.updateUI();
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.isDragging = false;
    this.hideControlRing();
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (key in this.waveformKeys) {
      this.waveformIndex = this.waveformKeys[key];
      this.soundWave.setWaveform(this.waveformTypes[this.waveformIndex]);
      this.updateUI();
    }
  }

  private onControlBarEnter(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.showControlBar();
  }

  private onControlBarLeave(): void {
    this.scheduleHideControlBar();
  }

  private onTopAreaMove(e: MouseEvent): void {
    if (e.clientY < 80) {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      this.showControlBar();
    } else if (!this.isMouseOnControlBar(e.clientX, e.clientY)) {
      if (!this.hideTimeout) {
        this.scheduleHideControlBar();
      }
    }
  }

  private isMouseOnControlBar(x: number, y: number): boolean {
    const barRect = this.controlBar.getBoundingClientRect();
    return x >= barRect.left && x <= barRect.right && y >= barRect.top && y <= barRect.bottom;
  }

  private showControlBar(): void {
    this.controlBar.classList.remove('hidden');
  }

  private scheduleHideControlBar(): void {
    this.hideTimeout = window.setTimeout(() => {
      this.controlBar.classList.add('hidden');
      this.hideTimeout = null;
    }, 500);
  }

  private showControlRing(): void {
    this.controlRing.classList.add('visible');
    this.updateControlRingPosition();
  }

  private hideControlRing(): void {
    this.controlRing.classList.remove('visible');
  }

  private updateControlRingPosition(): void {
    this.controlRing.style.left = `${this.mouseX}px`;
    this.controlRing.style.top = `${this.mouseY}px`;

    const freq = this.soundWave.getFrequency();
    const amp = this.soundWave.getAmplitude();
    this.ringFreq.textContent = `${Math.round(freq)}Hz`;
    this.ringAmp.textContent = amp.toFixed(2);
  }

  private updateUI(): void {
    const freq = this.soundWave.getFrequency();
    const amp = this.soundWave.getAmplitude();
    const waveform = this.soundWave.getWaveform();
    const color = this.soundWave.getWaveformColor();
    const symbol = this.soundWave.getWaveformSymbol();

    this.freqDisplay.textContent = `频率: ${Math.round(freq)}Hz`;
    this.ampDisplay.textContent = `振幅: ${amp.toFixed(2)}`;
    this.waveformIcon.style.backgroundColor = color;
    this.waveformIcon.textContent = symbol;
  }

  dispose(): void {
    window.removeEventListener('mousedown', this.onMouseDown.bind(this));
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
  }
}
