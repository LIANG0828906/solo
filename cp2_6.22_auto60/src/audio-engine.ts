export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private buffer: AudioBuffer | null = null;
  private _isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;
  private progressCallbacks: ((time: number) => void)[] = [];
  private freqData: Uint8Array = new Uint8Array(0);
  private timeData: Uint8Array = new Uint8Array(0);
  private rafId: number | null = null;
  private channelData: Float32Array = new Float32Array(0);

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get duration(): number {
    return this.buffer ? this.buffer.duration : 0;
  }

  get audioBuffer(): AudioBuffer | null {
    return this.buffer;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private setupAnalyser(): void {
    const ctx = this.ensureContext();
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    this.gainNode = ctx.createGain();
    this.gainNode.connect(this.analyser);
    this.analyser.connect(ctx.destination);
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async loadAudio(file: File): Promise<AudioBuffer> {
    const ctx = this.ensureContext();
    this.stop();

    const arrayBuffer = await file.arrayBuffer();
    this.buffer = await ctx.decodeAudioData(arrayBuffer);

    if (this.buffer.numberOfChannels > 0) {
      this.channelData = this.buffer.getChannelData(0);
    }

    this.setupAnalyser();
    this.pauseOffset = 0;
    return this.buffer;
  }

  play(): void {
    if (!this.buffer || this._isPlaying) return;
    const ctx = this.ensureContext();
    if (!this.analyser || !this.gainNode) return;

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.buffer;
    this.sourceNode.connect(this.gainNode);

    this.sourceNode.onended = () => {
      if (this._isPlaying) {
        this._isPlaying = false;
        this.pauseOffset = 0;
        this.notifyProgress(0);
      }
    };

    this.sourceNode.start(0, this.pauseOffset);
    this.startTime = ctx.currentTime - this.pauseOffset;
    this._isPlaying = true;
    this.startProgressLoop();
  }

  pause(): void {
    if (!this._isPlaying || !this.sourceNode) return;
    this.pauseOffset = this.getCurrentTime();
    this.sourceNode.onended = null;
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this._isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  stop(): void {
    if (this.sourceNode) {
      this.sourceNode.onended = null;
      try { this.sourceNode.stop(); } catch (_) { /* ignore */ }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this._isPlaying = false;
    this.pauseOffset = 0;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.notifyProgress(0);
  }

  seekTo(time: number): void {
    if (!this.buffer) return;
    const wasPlaying = this._isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    this.pauseOffset = Math.max(0, Math.min(time, this.duration));
    this.notifyProgress(this.pauseOffset);
    if (wasPlaying) {
      this.play();
    }
  }

  getCurrentTime(): number {
    if (!this._isPlaying || !this.ctx) return this.pauseOffset;
    return this.ctx.currentTime - this.startTime;
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser && this._isPlaying) {
      this.analyser.getByteFrequencyData(this.freqData);
    }
    return this.freqData;
  }

  getTimeDomainData(): Uint8Array {
    if (this.analyser && this._isPlaying) {
      this.analyser.getByteTimeDomainData(this.timeData);
    }
    return this.timeData;
  }

  getWaveformData(): Float32Array {
    return this.channelData;
  }

  onProgress(callback: (time: number) => void): void {
    this.progressCallbacks.push(callback);
  }

  private notifyProgress(time: number): void {
    for (const cb of this.progressCallbacks) {
      cb(time);
    }
  }

  private startProgressLoop(): void {
    const tick = () => {
      if (!this._isPlaying) return;
      this.notifyProgress(this.getCurrentTime());
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }
}
