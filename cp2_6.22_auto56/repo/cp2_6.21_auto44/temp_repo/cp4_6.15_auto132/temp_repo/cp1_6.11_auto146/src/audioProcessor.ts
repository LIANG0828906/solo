export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000];
export const EQ_MIN_DB = -12;
export const EQ_MAX_DB = 12;
export const EQ_STEP = 0.5;
export const SMOOTHING_DURATION = 0.3;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  bitDepth: number;
  peakLevel: number;
}

export type AudioStateCallback = (state: Partial<AudioState>) => void;
export type TimeDomainCallback = (data: Float32Array) => void;
export type FrequencyCallback = (data: Uint8Array) => void;

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private outputGain: GainNode | null = null;

  private state: AudioState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    sampleRate: 0,
    numberOfChannels: 0,
    bitDepth: 16,
    peakLevel: 0,
  };

  private startTime = 0;
  private pausedAt = 0;
  private rafId: number | null = null;
  private timeDomainData: Float32Array | null = null;
  private frequencyData: Uint8Array | null = null;
  private vuRafId: number | null = null;

  private onStateChange: AudioStateCallback | null = null;
  private onTimeDomain: TimeDomainCallback | null = null;
  private onFrequency: FrequencyCallback | null = null;
  private onEnded: (() => void) | null = null;

  private detectBitDepth(buffer: ArrayBuffer, file: File): number {
    const name = file.name.toLowerCase();
    if (name.endsWith('.wav')) {
      try {
        const view = new DataView(buffer, 0, Math.min(100, buffer.byteLength));
        let offset = 12;
        while (offset < view.byteLength - 8) {
          const chunkId = view.getUint32(offset, true);
          if (chunkId === 0x20746d66) {
            const audioFormat = view.getUint16(offset + 8, true);
            if (audioFormat === 1) {
              return view.getUint16(offset + 22, true);
            }
            return 16;
          }
          offset += 8 + view.getUint32(offset + 4, true);
        }
      } catch {
        return 16;
      }
    }
    return 16;
  }

  async decodeAudioFile(file: File): Promise<void> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('文件大小超过 20MB 限制');
    }

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.setupNodes();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const arrayBuffer = await file.arrayBuffer();
    const bitDepth = this.detectBitDepth(arrayBuffer, file);

    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));

    this.audioBuffer = audioBuffer;
    this.state = {
      ...this.state,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      bitDepth,
      currentTime: 0,
      isPlaying: false,
      peakLevel: 0,
    };

    this.pausedAt = 0;
    this.notifyStateChange();
  }

  private setupNodes(): void {
    if (!this.audioContext) return;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.6;

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 1.0;

    this.outputGain = this.audioContext.createGain();
    this.outputGain.gain.value = 1.0;

    this.filters = EQ_FREQUENCIES.map((freq, i) => {
      const filter = this.audioContext!.createBiquadFilter();
      if (i === 0) {
        filter.type = 'lowshelf';
      } else if (i === EQ_FREQUENCIES.length - 1) {
        filter.type = 'highshelf';
      } else {
        filter.type = 'peaking';
      }
      filter.frequency.value = freq;
      filter.Q.value = 1.0;
      filter.gain.value = 0;
      return filter;
    });

    this.timeDomainData = new Float32Array(this.analyser.fftSize);
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  private connectGraph(): void {
    if (!this.audioContext || !this.source || !this.masterGain || !this.outputGain || !this.analyser) {
      return;
    }

    let prev: AudioNode = this.source;
    for (const filter of this.filters) {
      prev.connect(filter);
      prev = filter;
    }

    prev.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.outputGain);
    this.outputGain.connect(this.audioContext.destination);
  }

  private disconnectGraph(): void {
    try {
      if (this.source) {
        this.source.onended = null;
        try { this.source.disconnect(); } catch { /* noop */ }
      }
      for (const filter of this.filters) {
        try { filter.disconnect(); } catch { /* noop */ }
      }
      if (this.masterGain) try { this.masterGain.disconnect(); } catch { /* noop */ }
      if (this.analyser) try { this.analyser.disconnect(); } catch { /* noop */ }
      if (this.outputGain) try { this.outputGain.disconnect(); } catch { /* noop */ }
    } catch {
      /* noop */
    }
  }

  play(): void {
    if (!this.audioContext || !this.audioBuffer) return;
    if (this.state.isPlaying) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopSourceInternal();

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.playbackRate.value = 1.0;

    this.connectGraph();

    const offset = Math.min(this.pausedAt, this.audioBuffer.duration - 0.01);
    this.source.start(0, Math.max(0, offset));
    this.startTime = this.audioContext.currentTime - offset;

    this.source.onended = () => {
      if (this.state.currentTime >= this.state.duration - 0.02) {
        this.stopInternal(true);
      }
    };

    this.state.isPlaying = true;
    this.notifyStateChange();
    this.startRenderLoop();
    this.startVULoop();
  }

  pause(): void {
    if (!this.state.isPlaying || !this.audioContext) return;

    this.pausedAt = this.audioContext.currentTime - this.startTime;
    this.stopSourceInternal();
    this.state.isPlaying = false;
    this.notifyStateChange();
    this.stopRenderLoop();
  }

  stop(): void {
    this.stopInternal(false);
  }

  private stopInternal(reachedEnd: boolean): void {
    this.stopSourceInternal();
    this.state.isPlaying = false;
    this.pausedAt = reachedEnd ? 0 : this.pausedAt;
    if (reachedEnd) {
      this.state.currentTime = this.state.duration;
    }
    this.notifyStateChange();
    this.stopRenderLoop();
    if (reachedEnd && this.onEnded) {
      this.onEnded();
    }
  }

  private stopSourceInternal(): void {
    if (this.source) {
      try {
        this.source.onended = null;
        this.source.stop();
      } catch {
        /* noop */
      }
      this.disconnectGraph();
      this.source = null;
    }
  }

  seek(time: number): void {
    if (!this.audioBuffer) return;
    const wasPlaying = this.state.isPlaying;
    time = Math.max(0, Math.min(time, this.audioBuffer.duration));

    this.stopSourceInternal();
    this.pausedAt = time;
    this.state.currentTime = time;

    if (wasPlaying) {
      this.state.isPlaying = false;
      this.play();
    } else {
      this.notifyStateChange();
    }
  }

  setBandGain(index: number, gainDb: number, smooth = true): void {
    if (!this.filters[index] || !this.audioContext) return;
    gainDb = Math.max(EQ_MIN_DB, Math.min(EQ_MAX_DB, gainDb));

    const filter = this.filters[index];
    if (smooth) {
      filter.gain.cancelScheduledValues(this.audioContext.currentTime);
      filter.gain.setValueAtTime(filter.gain.value, this.audioContext.currentTime);
      filter.gain.linearRampToValueAtTime(
        gainDb,
        this.audioContext.currentTime + SMOOTHING_DURATION
      );
    } else {
      filter.gain.value = gainDb;
    }
  }

  setAllGains(gains: number[], animate = false): void {
    gains.forEach((g, i) => this.setBandGain(i, g, animate));
  }

  getGains(): number[] {
    return this.filters.map(f => f.gain.value);
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (!this.analyser || !this.timeDomainData || !this.frequencyData || !this.audioContext) return;

      this.analyser.getFloatTimeDomainData(this.timeDomainData as Float32Array<ArrayBuffer>);
      this.analyser.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);

      const t = this.audioContext.currentTime - this.startTime;
      this.state.currentTime = Math.max(0, Math.min(t, this.state.duration));

      if (this.onTimeDomain) this.onTimeDomain(this.timeDomainData);
      if (this.onFrequency) this.onFrequency(this.frequencyData);
      this.notifyStateChange();

      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopRenderLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private startVULoop(): void {
    let lastUpdate = 0;
    const update = (t: number) => {
      if (t - lastUpdate >= 1000 / 30) {
        lastUpdate = t;
        if (this.analyser && this.timeDomainData) {
          this.analyser.getFloatTimeDomainData(this.timeDomainData as Float32Array<ArrayBuffer>);
          let peak = 0;
          for (let i = 0; i < this.timeDomainData.length; i++) {
            const v = Math.abs(this.timeDomainData[i]);
            if (v > peak) peak = v;
          }
          this.state.peakLevel = peak;
        }
      }
      this.vuRafId = requestAnimationFrame(update);
    };
    this.vuRafId = requestAnimationFrame(update);
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }

  getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }

  getCurrentSampleOffset(): number {
    return Math.floor(this.state.currentTime * this.state.sampleRate);
  }

  hasAudio(): boolean {
    return !!this.audioBuffer;
  }

  setOnStateChange(cb: AudioStateCallback | null): void {
    this.onStateChange = cb;
  }

  setOnTimeDomain(cb: TimeDomainCallback | null): void {
    this.onTimeDomain = cb;
  }

  setOnFrequency(cb: FrequencyCallback | null): void {
    this.onFrequency = cb;
  }

  setOnEnded(cb: (() => void) | null): void {
    this.onEnded = cb;
  }

  dispose(): void {
    this.stopRenderLoop();
    if (this.vuRafId !== null) cancelAnimationFrame(this.vuRafId);
    this.stopSourceInternal();
    if (this.audioContext) {
      try { this.audioContext.close(); } catch { /* noop */ }
      this.audioContext = null;
    }
  }
}
