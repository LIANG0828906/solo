type PlaybackStateCallback = (state: { isPlaying: boolean; currentTime: number; duration: number }) => void;

export class AudioEngine {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private source: AudioBufferSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private startTime = 0;
  private pauseOffset = 0;
  private _isPlaying = false;
  private _duration = 0;
  private onPlaybackState: PlaybackStateCallback | null = null;
  private rafId: number | null = null;

  get isPlaying() {
    return this._isPlaying;
  }

  get duration() {
    return this._duration;
  }

  get currentTime() {
    if (!this.context || !this._isPlaying) return this.pauseOffset;
    return this.context.currentTime - this.startTime + this.pauseOffset;
  }

  setOnPlaybackState(cb: PlaybackStateCallback) {
    this.onPlaybackState = cb;
  }

  private ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.analyser.connect(this.gainNode);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  async loadFile(blob: Blob): Promise<void> {
    this.ensureContext();
    this.stop();
    const arrayBuffer = await blob.arrayBuffer();
    this.buffer = await this.context!.decodeAudioData(arrayBuffer);
    this._duration = this.buffer.duration;
    this.pauseOffset = 0;
    this.emitState();
  }

  play(): void {
    if (!this.buffer || !this.context || !this.analyser) return;
    if (this._isPlaying) return;

    this.ensureContext();

    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.analyser);
    this.source.start(0, this.pauseOffset);
    this.startTime = this.context.currentTime;
    this._isPlaying = true;

    this.source.onended = () => {
      if (this._isPlaying) {
        this._isPlaying = false;
        this.pauseOffset = 0;
        this.emitState();
      }
    };

    this.startTick();
    this.emitState();
  }

  pause(): void {
    if (!this._isPlaying || !this.context) return;
    this.pauseOffset = this.currentTime;
    this.stop();
    this.emitState();
  }

  private stop() {
    if (this.source) {
      try { this.source.stop(); } catch {}
      this.source.disconnect();
      this.source = null;
    }
    this._isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  seek(time: number): void {
    if (!this.buffer) return;
    const wasPlaying = this._isPlaying;
    this.stop();
    this.pauseOffset = Math.max(0, Math.min(time, this._duration));
    if (wasPlaying) {
      this.play();
    } else {
      this.emitState();
    }
  }

  setVolume(vol: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = vol;
    }
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  getTimeDomainData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  getStream(): MediaStream | null {
    if (!this.context || !this.analyser) return null;
    const dest = this.context.createMediaStreamDestination();
    this.analyser.connect(dest);
    return dest.stream;
  }

  private startTick() {
    const tick = () => {
      if (!this._isPlaying) return;
      this.emitState();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private emitState() {
    this.onPlaybackState?.({
      isPlaying: this._isPlaying,
      currentTime: this.currentTime,
      duration: this._duration,
    });
  }

  destroy(): void {
    this.stop();
    if (this.context) {
      this.context.close();
      this.context = null;
      this.analyser = null;
      this.gainNode = null;
    }
  }
}
