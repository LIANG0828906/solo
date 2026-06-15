export type BeatSignal = {
  time: number;
  intensity: number;
};

type BeatCallback = (beat: BeatSignal) => void;

const FFT_SIZE = 2048;
const BEAT_THRESHOLD = 1.3;
const BEAT_COOLDOWN_MS = 200;
const WAVEFORM_REFRESH_MS = 20;
const ANALYSIS_INTERVAL_MS = 10;

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private frequencyData: Uint8Array = new Uint8Array(0);
  private timeDomainData: Uint8Array = new Uint8Array(0);
  private beatCallbacks: BeatCallback[] = [];
  private isPlaying = false;
  private startTime = 0;
  private pauseTime = 0;
  private lastBeatTime = 0;
  private energyHistory: number[] = [];
  private energyHistorySize = 43;
  private animationFrameId = 0;
  private analysisIntervalId: number | null = null;
  private waveformCallback: ((data: Uint8Array) => void) | null = null;
  private lastWaveformTime = 0;
  private onEndedCallback: (() => void) | null = null;
  private duration = 0;

  get currentAudioContext() { return this.audioContext; }

  onBeat(cb: BeatCallback) {
    this.beatCallbacks.push(cb);
  }

  onWaveform(cb: (data: Uint8Array) => void) {
    this.waveformCallback = cb;
  }

  onEnded(cb: () => void) {
    this.onEndedCallback = cb;
  }

  async loadFile(file: File): Promise<void> {
    this.dispose();

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0.3;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    this.analyser.connect(this.gainNode);

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.duration = this.audioBuffer.duration;

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  play() {
    if (!this.audioContext || !this.audioBuffer || !this.analyser) return;

    if (this.source) {
      try { this.source.stop(); } catch (_) { /* ignore */ }
    }

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(this.analyser);

    const offset = this.pauseTime;
    this.source.start(0, offset);
    this.startTime = this.audioContext.currentTime - offset;
    this.isPlaying = true;
    this.lastBeatTime = 0;
    this.energyHistory = [];

    this.source.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.onEndedCallback?.();
      }
    };

    this.startAnalysis();
  }

  pause() {
    if (!this.isPlaying || !this.audioContext) return;
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.isPlaying = false;
    try { this.source?.stop(); } catch (_) { /* ignore */ }
    cancelAnimationFrame(this.animationFrameId);
    if (this.analysisIntervalId !== null) {
      clearInterval(this.analysisIntervalId);
      this.analysisIntervalId = null;
    }
  }

  stop() {
    this.isPlaying = false;
    this.pauseTime = 0;
    try { this.source?.stop(); } catch (_) { /* ignore */ }
    cancelAnimationFrame(this.animationFrameId);
    if (this.analysisIntervalId !== null) {
      clearInterval(this.analysisIntervalId);
      this.analysisIntervalId = null;
    }
  }

  get currentTime(): number {
    if (!this.audioContext || !this.isPlaying) return this.pauseTime;
    return this.audioContext.currentTime - this.startTime;
  }

  getDuration(): number {
    return this.duration;
  }

  getFrequencyData(): Uint8Array {
    return this.frequencyData;
  }

  private startAnalysis() {
    const analyze = () => {
      if (!this.isPlaying || !this.analyser) return;

      this.analyser.getByteFrequencyData(this.frequencyData);
      this.analyser.getByteTimeDomainData(this.timeDomainData);

      const now = performance.now();
      if (this.waveformCallback && now - this.lastWaveformTime >= WAVEFORM_REFRESH_MS) {
        this.waveformCallback(new Uint8Array(this.timeDomainData));
        this.lastWaveformTime = now;
      }

      this.detectBeat();
    };
    this.analysisIntervalId = window.setInterval(analyze, ANALYSIS_INTERVAL_MS);
  }

  private detectBeat() {
    if (!this.analyser) return;

    let energy = 0;
    const len = this.frequencyData.length;
    for (let i = 0; i < len; i++) {
      energy += this.frequencyData[i] * this.frequencyData[i];
    }
    energy = Math.sqrt(energy / len);

    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.energyHistorySize) {
      this.energyHistory.shift();
    }

    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    const now = performance.now();
    if (energy > avgEnergy * BEAT_THRESHOLD && now - this.lastBeatTime > BEAT_COOLDOWN_MS) {
      this.lastBeatTime = now;
      const intensity = Math.min(1, energy / (avgEnergy * 2));

      const beat: BeatSignal = {
        time: this.currentTime,
        intensity
      };

      for (const cb of this.beatCallbacks) {
        cb(beat);
      }
    }
  }

  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.gainNode = null;
    this.source = null;
    this.audioBuffer = null;
    this.beatCallbacks = [];
    this.energyHistory = [];
  }
}
