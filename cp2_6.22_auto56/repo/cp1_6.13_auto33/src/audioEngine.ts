export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number = 0;
  private callback: ((bands: Float32Array) => void) | null = null;
  private bands: Float32Array = new Float32Array(32);
  private running = false;

  onFrame(cb: (bands: Float32Array) => void): void {
    this.callback = cb;
  }

  async start(): Promise<void> {
    if (this.running) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      console.warn('Microphone access denied');
      return;
    }

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyser.minDecibels = -90;
    this.analyser.maxDecibels = -10;

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.source.connect(this.analyser);

    this.running = true;
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyser = null;
    this.bands.fill(0);
    if (this.callback) {
      this.callback(this.bands);
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private loop(): void {
    if (!this.running || !this.analyser) return;

    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);

    for (let i = 0; i < 32; i++) {
      this.bands[i] = data[i]! / 255;
    }

    if (this.callback) {
      this.callback(this.bands);
    }

    this.animFrameId = requestAnimationFrame(() => this.loop());
  }
}
