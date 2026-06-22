export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private sampleSource: AudioBufferSourceNode | null = null;
  private oscNode: OscillatorNode | null = null;
  private freqData: Uint8Array = new Uint8Array(0);
  isRecording = false;
  isPlaying = false;

  private ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 16384;
      this.analyser.smoothingTimeConstant = 0.8;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  async startMic(): Promise<boolean> {
    try {
      this.ensureCtx();
      this.stopSample();
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micSource = this.ctx!.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser!);
      this.isRecording = true;
      return true;
    } catch { return false; }
  }

  stopMic() {
    if (this.micSource) { this.micSource.disconnect(); this.micSource = null; }
    if (this.micStream) { this.micStream.getTracks().forEach(t => t.stop()); this.micStream = null; }
    this.isRecording = false;
  }

  playSample(type: 'whiteNoise' | 'sineSequence') {
    this.ensureCtx();
    this.stopMic();
    this.stopSample();
    const ctx = this.ctx!;
    const an = this.analyser!;
    if (type === 'whiteNoise') {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      this.sampleSource = ctx.createBufferSource();
      this.sampleSource.buffer = buf;
      this.sampleSource.loop = true;
      this.sampleSource.connect(an);
      an.connect(ctx.destination);
      this.sampleSource.start();
    } else {
      this.oscNode = ctx.createOscillator();
      this.oscNode.type = 'sine';
      const now = ctx.currentTime;
      this.oscNode.frequency.setValueAtTime(220, now);
      this.oscNode.frequency.linearRampToValueAtTime(880, now + 2);
      this.oscNode.frequency.linearRampToValueAtTime(220, now + 4);
      this.oscNode.connect(an);
      an.connect(ctx.destination);
      this.oscNode.start();
    }
    this.isPlaying = true;
  }

  stopSample() {
    if (this.sampleSource) {
      try { this.sampleSource.stop(); } catch { /* */ }
      this.sampleSource.disconnect();
      this.sampleSource = null;
    }
    if (this.oscNode) {
      try { this.oscNode.stop(); } catch { /* */ }
      this.oscNode.disconnect();
      this.oscNode = null;
    }
    if (this.analyser) {
      try { this.analyser.disconnect(); } catch { /* */ }
    }
    this.isPlaying = false;
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser) this.analyser.getByteFrequencyData(this.freqData);
    return this.freqData;
  }
}
