import {
  NUM_POINTS,
  NUM_MODES,
  PICKUP_POSITION,
  MAX_AMPLITUDE,
  type HarmonicInfo,
} from './constants';

export class StringPhysicsEngine {
  private numPoints = NUM_POINTS;
  private numModes = NUM_MODES;
  private modeAmplitudes: Float32Array;
  private modePhases: Float32Array;
  private modeDecays: Float32Array;
  private time = 0;
  private _isVibrating = false;

  private _tension = 50;
  private _linearDensity = 1.0;
  private _stringLength = 100;
  private _damping = 0.5;

  private cachedDisplacements = new Float32Array(NUM_POINTS);
  private cachedWaveform = new Float32Array(2048);

  constructor() {
    this.modeAmplitudes = new Float32Array(this.numModes);
    this.modePhases = new Float32Array(this.numModes);
    this.modeDecays = new Float32Array(this.numModes);
  }

  get tension() { return this._tension; }
  get linearDensity() { return this._linearDensity; }
  get stringLength() { return this._stringLength; }
  get damping() { return this._damping; }
  get isVibrating() { return this._isVibrating; }

  setTension(v: number) { this._tension = v; }
  setLinearDensity(v: number) { this._linearDensity = v; }
  setStringLength(v: number) { this._stringLength = v; }
  setDamping(v: number) { this._damping = v; }

  getFundamentalFreq(): number {
    const L = this._stringLength / 100;
    const c = Math.sqrt(this._tension / this._linearDensity);
    return c / (2 * L);
  }

  pluck(position: number, force: number) {
    const f1 = this.getFundamentalFreq();
    if (f1 <= 0 || !isFinite(f1)) return;

    for (let n = 0; n < this.numModes; n++) {
      const mode = n + 1;
      this.modeAmplitudes[n] =
        (2 * force / (mode * Math.PI) ** 2) *
        Math.sin(mode * Math.PI * position);
      this.modePhases[n] = 0;
      this.modeDecays[n] = this._damping * (1 + (mode - 1) * 0.4);
    }

    this.time = 0;
    this._isVibrating = true;
  }

  update(dt: number): Float32Array {
    if (!this._isVibrating) {
      this.cachedDisplacements.fill(0);
      return this.cachedDisplacements;
    }

    this.time += dt;
    const f1 = this.getFundamentalFreq();
    let maxAmp = 0;

    for (let i = 0; i < this.numPoints; i++) {
      const x = i / (this.numPoints - 1);
      let y = 0;

      for (let n = 0; n < this.numModes; n++) {
        const mode = n + 1;
        const fn = mode * f1;
        const amp =
          this.modeAmplitudes[n] *
          Math.exp(-this.modeDecays[n] * this.time);
        const phase = 2 * Math.PI * fn * this.time + this.modePhases[n];
        y += amp * Math.sin(mode * Math.PI * x) * Math.cos(phase);
      }

      this.cachedDisplacements[i] = y;
      if (Math.abs(y) > maxAmp) maxAmp = Math.abs(y);
    }

    if (maxAmp < 0.0005) {
      this._isVibrating = false;
      this.cachedDisplacements.fill(0);
    }

    return this.cachedDisplacements;
  }

  getWaveformData(sampleCount: number): Float32Array {
    if (this.cachedWaveform.length !== sampleCount) {
      this.cachedWaveform = new Float32Array(sampleCount);
    }

    if (!this._isVibrating) {
      this.cachedWaveform.fill(0);
      return this.cachedWaveform;
    }

    const f1 = this.getFundamentalFreq();
    const x = PICKUP_POSITION;

    for (let s = 0; s < sampleCount; s++) {
      const t = this.time - (sampleCount - s) / 44100;
      if (t < 0) {
        this.cachedWaveform[s] = 0;
        continue;
      }

      let y = 0;
      for (let n = 0; n < this.numModes; n++) {
        const mode = n + 1;
        const fn = mode * f1;
        const amp =
          this.modeAmplitudes[n] *
          Math.exp(-this.modeDecays[n] * t);
        const phase = 2 * Math.PI * fn * t + this.modePhases[n];
        y += amp * Math.sin(mode * Math.PI * x) * Math.cos(phase);
      }

      this.cachedWaveform[s] = y;
    }

    return this.cachedWaveform;
  }

  getHarmonics(): HarmonicInfo[] {
    const f1 = this.getFundamentalFreq();
    const harmonics: HarmonicInfo[] = [];

    for (let n = 0; n < 3; n++) {
      const mode = n + 1;
      const amp =
        this.modeAmplitudes[n] *
        Math.exp(-this.modeDecays[n] * this.time);
      harmonics.push({
        freq: Math.round(mode * f1 * 100) / 100,
        amplitude: Math.round(Math.abs(amp) * 10000) / 10000,
      });
    }

    return harmonics;
  }

  getMaxAmplitude(): number {
    let maxAmp = 0;
    for (let i = 0; i < this.cachedDisplacements.length; i++) {
      const a = Math.abs(this.cachedDisplacements[i]);
      if (a > maxAmp) maxAmp = a;
    }
    return maxAmp / MAX_AMPLITUDE;
  }

  reset() {
    this.modeAmplitudes.fill(0);
    this.modePhases.fill(0);
    this.modeDecays.fill(0);
    this.time = 0;
    this._isVibrating = false;
    this.cachedDisplacements.fill(0);
  }
}

export const stringPhysics = new StringPhysicsEngine();
