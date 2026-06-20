export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private startTimestamp: number = 0;
  private _duration: number = 0;
  private _isPlaying: boolean = false;
  private onTimeUpdate: ((currentTime: number) => void) | null = null;
  private animFrameId: number | null = null;

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get duration(): number {
    return this._duration;
  }

  get currentTime(): number {
    if (!this._isPlaying || !this.audioContext) return 0;
    const elapsed = this.audioContext.currentTime - this.startTimestamp;
    return Math.min(elapsed, this._duration);
  }

  get sampleRate(): number {
    return this.audioContext?.sampleRate ?? 44100;
  }

  private ensureContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 44100 });
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  play(
    buffer: Float32Array,
    sampleRate: number = 44100,
    onTimeUpdate?: (currentTime: number) => void
  ): void {
    this.stop();

    const ctx = this.ensureContext();
    this.onTimeUpdate = onTimeUpdate ?? null;

    const numSamples = buffer.length;
    this._duration = numSamples / sampleRate;

    const normalizedBuffer = AudioEngine.normalizeBuffer(buffer);

    const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    channelData.set(normalizedBuffer);

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 1.0;
    this.gainNode.connect(ctx.destination);

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = audioBuffer;
    this.sourceNode.connect(this.gainNode);

    this.sourceNode.onended = () => {
      this._isPlaying = false;
      if (this.animFrameId !== null) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
    };

    this.startTimestamp = ctx.currentTime;
    this.sourceNode.start(0);
    this._isPlaying = true;

    this.startTimeUpdateLoop();
  }

  private startTimeUpdateLoop(): void {
    const update = () => {
      if (!this._isPlaying) return;
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.currentTime);
      }
      this.animFrameId = requestAnimationFrame(update);
    };
    this.animFrameId = requestAnimationFrame(update);
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (_) { /* ignore */ }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this._isPlaying = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private static normalizeBuffer(buffer: Float32Array): Float32Array {
    let maxAbs = 0;
    const n = buffer.length;
    for (let i = 0; i < n; i++) {
      const abs = Math.abs(buffer[i]);
      if (abs > maxAbs) maxAbs = abs;
    }

    const result = new Float32Array(n);
    const scale = maxAbs > 1.0 ? 1.0 / maxAbs : 0.95 / Math.max(maxAbs, 0.0001);

    for (let i = 0; i < n; i++) {
      let sample = buffer[i] * scale;
      if (sample > 1) sample = 1;
      else if (sample < -1) sample = -1;
      result[i] = sample;
    }

    return result;
  }

  private static floatToInt16(sample: number): number {
    const clamped = Math.max(-1, Math.min(1, sample));
    if (clamped >= 0) {
      return Math.round(clamped * 0x7FFF);
    } else {
      return Math.round(clamped * 0x8000);
    }
  }

  exportWav(buffer: Float32Array, sampleRate: number = 44100): Blob {
    const numChannels = 1;
    const bitsPerSample = 16;
    const numSamples = buffer.length;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = numSamples * blockAlign;

    const normalized = AudioEngine.normalizeBuffer(buffer);

    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const int16 = AudioEngine.floatToInt16(normalized[i]);
      view.setInt16(offset, int16, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  getBufferUsage(): number {
    if (!this.audioContext) return 0;
    const baseLatency = this.audioContext.baseLatency || 0;
    const outputLatency = (this.audioContext as any).outputLatency || 0;
    const totalLatency = baseLatency + outputLatency;
    return Math.min(totalLatency / 0.05, 1);
  }

  dispose(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
