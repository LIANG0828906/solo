export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: Map<number, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private frequencyData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.ctx.destination);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.connect(this.masterGain);

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize);
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  playNote(noteIndex: number, frequency: number, velocity: number = 0.7, type: OscillatorType = 'sawtooth') {
    if (!this.ctx || !this.analyser) return;
    if (this.activeOscillators.has(noteIndex)) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    const baseVolume = velocity * 0.35;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(baseVolume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(baseVolume * 0.7, now + 0.15);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(baseVolume * 0.15, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(this.analyser);
    gain2.connect(this.analyser);

    osc.start(now);
    osc2.start(now);

    this.activeOscillators.set(noteIndex, { osc, gain });
  }

  stopNote(noteIndex: number) {
    if (!this.ctx) return;
    const entry = this.activeOscillators.get(noteIndex);
    if (!entry) return;

    const { osc, gain } = entry;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.stop(now + 0.4);
    this.activeOscillators.delete(noteIndex);
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser && this.frequencyData) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData || new Uint8Array(0);
  }

  getTimeData(): Uint8Array {
    if (this.analyser && this.timeData) {
      this.analyser.getByteTimeDomainData(this.timeData);
    }
    return this.timeData || new Uint8Array(0);
  }

  getAverageAmplitude(): number {
    const data = this.getFrequencyData();
    if (data.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length / 255;
  }

  getBandEnergy(lowFreq: number, highFreq: number): number {
    if (!this.ctx || !this.analyser || !this.frequencyData) return 0;
    const nyquist = this.ctx.sampleRate / 2;
    const lowBin = Math.floor((lowFreq / nyquist) * this.analyser.frequencyBinCount);
    const highBin = Math.floor((highFreq / nyquist) * this.analyser.frequencyBinCount);
    let sum = 0;
    const count = Math.max(1, highBin - lowBin);
    for (let i = lowBin; i < highBin && i < this.frequencyData.length; i++) {
      sum += this.frequencyData[i];
    }
    return sum / count / 255;
  }

  stopAll() {
    for (const idx of Array.from(this.activeOscillators.keys())) {
      this.stopNote(idx);
    }
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }
}
