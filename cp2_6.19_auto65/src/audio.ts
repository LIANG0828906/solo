export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _muted: boolean = false;
  private _volume: number = 0.3;
  private _initialized: boolean = false;

  constructor() {
  }

  private _ensureInitialized(): void {
    if (this._initialized) return;
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
      this.masterGain.connect(this.ctx.destination);
      this._initialized = true;
    } catch (_e) {
      this.ctx = null;
      this.masterGain = null;
    }
  }

  resume(): void {
    this._ensureInitialized();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  get muted(): boolean {
    return this._muted;
  }

  toggleMute(): boolean {
    this._muted = !this._muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : this._volume;
    }
    return this._muted;
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.value = this._volume;
    }
  }

  private _makeOsc(type: OscillatorType, startFreq: number, endFreq: number, duration: number, startTime: number, volume: number = 1): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), startTime + duration);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + duration * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private _makeNoise(duration: number, startTime: number, filterFreq: number = 800, volume: number = 0.6): void {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.frequency.exponentialRampToValueAtTime(50, startTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + duration * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(startTime);
    source.stop(startTime + duration + 0.02);
  }

  playLaser(): void {
    this._ensureInitialized();
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    this._makeOsc('sawtooth', 800, 200, 0.10, now, 0.5);
    this._makeNoise(0.04, now, 3000, 0.15);
  }

  playHit(): void {
    this._ensureInitialized();
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    this._makeNoise(0.12, now, 1500, 0.45);
    this._makeOsc('sine', 120, 40, 0.15, now, 0.6);
    this._makeOsc('square', 200, 60, 0.08, now, 0.2);
  }

  playCollect(): void {
    this._ensureInitialized();
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    this._makeOsc('sine', 1200, 1200, 0.04, now, 0.5);
    this._makeOsc('sine', 600, 600, 0.04, now + 0.04, 0.5);
    this._makeOsc('triangle', 1800, 1800, 0.03, now + 0.02, 0.25);
  }

  playUpgrade(): void {
    this._ensureInitialized();
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    this._makeOsc('sine', 400, 1200, 0.30, now, 0.5);
    this._makeOsc('triangle', 200, 600, 0.30, now, 0.3);
    this._makeOsc('sine', 600, 1800, 0.25, now + 0.05, 0.25);
  }

  playBlackHole(): void {
    this._ensureInitialized();
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    this._makeOsc('sawtooth', 300, 60, 0.50, now, 0.55);
    this._makeOsc('sine', 200, 40, 0.50, now, 0.4);
    this._makeNoise(0.45, now, 600, 0.25);
  }
}
