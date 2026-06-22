export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _muted: boolean = false;
  private _volume: number = 0.3;
  private _initialized: boolean = false;
  private _activeNodes: Set<AudioNode> = new Set();

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

  private _registerNode(node: AudioNode): void {
    this._activeNodes.add(node);
  }

  private _unregisterNode(node: AudioNode): void {
    this._activeNodes.delete(node);
    try {
      node.disconnect();
    } catch (_e) {}
  }

  private _makeOsc(type: OscillatorType, startFreq: number, endFreq: number, duration: number, startTime: number, volume: number = 1): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    this._registerNode(osc);
    this._registerNode(gain);

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    if (startFreq !== endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), startTime + duration);
    }

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + Math.min(duration * 0.05, duration));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    const stopTime = startTime + duration + 0.05;
    osc.onended = () => {
      this._unregisterNode(osc);
      this._unregisterNode(gain);
    };

    osc.start(startTime);
    osc.stop(stopTime);
  }

  private _makeNoise(duration: number, startTime: number, filterFreq: number = 800, volume: number = 0.6): void {
    if (!this.ctx || !this.masterGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize * 0.3);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(50, filterFreq * 0.05), startTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + Math.min(duration * 0.05, duration));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    this._registerNode(source);
    this._registerNode(filter);
    this._registerNode(gain);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    const stopTime = startTime + duration + 0.05;
    source.onended = () => {
      this._unregisterNode(source);
      this._unregisterNode(filter);
      this._unregisterNode(gain);
    };

    source.start(startTime);
    source.stop(stopTime);
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
