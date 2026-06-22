export interface BeatEvent {
  time: number;
  intensity: number;
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private dataArray: Float32Array = new Float32Array(0);
  private beatThreshold: number = 0.3;
  private lastBeatTime: number = 0;
  private minBeatInterval: number = 150;
  private isPlaying: boolean = false;
  private onBeatCallback: ((beat: BeatEvent) => void) | null = null;
  private buffer: AudioBuffer | null = null;

  constructor(threshold: number = 0.3) {
    this.beatThreshold = threshold;
  }

  setThreshold(threshold: number): void {
    this.beatThreshold = Math.max(0.1, Math.min(0.8, threshold));
  }

  getThreshold(): number {
    return this.beatThreshold;
  }

  onBeat(callback: (beat: BeatEvent) => void): void {
    this.onBeatCallback = callback;
  }

  async init(): Promise<void> {
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.3;
    this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.connect(this.audioContext.destination);
  }

  async loadAndPlay(audioBuffer: AudioBuffer): Promise<void> {
    if (!this.audioContext || !this.analyser) {
      await this.init();
    }

    this.stop();

    this.buffer = audioBuffer;
    this.source = this.audioContext!.createBufferSource();
    this.source.buffer = audioBuffer;
    this.source.connect(this.analyser!);
    this.source.start(0);
    this.isPlaying = true;

    this.source.onended = () => {
      this.isPlaying = false;
    };
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch (_e) {
        // already stopped
      }
      this.source.disconnect();
      this.source = null;
    }
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  detectBeat(): BeatEvent | null {
    if (!this.analyser || !this.dataArray || !this.isPlaying) {
      return null;
    }

    this.analyser.getFloatFrequencyData(this.dataArray);

    const sampleRate = this.audioContext!.sampleRate;
    const binSize = sampleRate / this.analyser.fftSize;
    const lowBin = Math.floor(80 / binSize);
    const highBin = Math.ceil(200 / binSize);

    let energy = 0;
    let count = 0;
    for (let i = lowBin; i <= highBin && i < this.dataArray.length; i++) {
      const linear = Math.pow(10, this.dataArray[i] / 10);
      energy += linear;
      count++;
    }

    if (count === 0) return null;

    const avgEnergy = energy / count;
    const now = performance.now();

    if (
      avgEnergy > this.beatThreshold &&
      now - this.lastBeatTime > this.minBeatInterval
    ) {
      this.lastBeatTime = now;
      const beat: BeatEvent = {
        time: now,
        intensity: avgEnergy,
      };
      if (this.onBeatCallback) {
        this.onBeatCallback(beat);
      }
      return beat;
    }

    return null;
  }

  getFrequencyData(): Float32Array {
    if (!this.analyser) return new Float32Array(0);
    const data = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(data);
    return data;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.dataArray = new Float32Array(0);
  }
}

export function generateTestBeatAudio(
  audioContext: AudioContext,
  bpm: number = 150,
  durationSeconds: number = 120
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate);
  const beatInterval = 60 / bpm;

  for (let channel = 0; channel < 2; channel++) {
    const channelData = buffer.getChannelData(channel);

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const beatPhase = (t % beatInterval) / beatInterval;

      let kick = 0;
      if (beatPhase < 0.1) {
        const env = Math.exp(-beatPhase * 40);
        kick = Math.sin(2 * Math.PI * 150 * t * (1 - beatPhase * 5)) * env * 0.6;
      }

      let hihat = 0;
      const halfBeat = beatInterval / 2;
      const halfPhase = (t % halfBeat) / halfBeat;
      if (halfPhase < 0.02) {
        hihat = (Math.random() * 2 - 1) * Math.exp(-halfPhase * 200) * 0.15;
      }

      let bass = 0;
      const bassFreq = 80 + Math.sin(2 * Math.PI * t / 4) * 20;
      bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.2;

      let pad = 0;
      pad =
        (Math.sin(2 * Math.PI * 220 * t) * 0.05 +
          Math.sin(2 * Math.PI * 277 * t) * 0.04 +
          Math.sin(2 * Math.PI * 330 * t) * 0.03) *
        (0.5 + 0.5 * Math.sin(2 * Math.PI * t / 8));

      channelData[i] = kick + hihat + bass + pad;
    }
  }

  return buffer;
}
