class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private vuData: Uint8Array<ArrayBuffer> | null = null;

  async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new AudioContext({
      latencyHint: 'interactive',
      sampleRate: 44100,
    });

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8;

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.vuData = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  getContext(): AudioContext {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized. Call init() first.');
    }
    return this.audioContext;
  }

  async decodeAudio(buffer: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = this.getContext();
    return await ctx.decodeAudioData(buffer.slice(0));
  }

  createEchoNode(
    delayTime: number = 0.3,
    feedback: number = 0.3,
    mix: number = 0.5
  ): { input: GainNode; output: GainNode } {
    const ctx = this.getContext();

    const input = ctx.createGain();
    const output = ctx.createGain();
    const delay = ctx.createDelay(5);
    const feedbackGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const dryGain = ctx.createGain();

    delay.delayTime.value = delayTime;
    feedbackGain.gain.value = feedback;
    wetGain.gain.value = mix;
    dryGain.gain.value = 1 - mix;

    input.connect(dryGain);
    dryGain.connect(output);

    input.connect(delay);
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(output);

    return { input, output };
  }

  createCompressorNode(
    threshold: number = -24,
    ratio: number = 12,
    attack: number = 0.003,
    release: number = 0.25
  ): DynamicsCompressorNode {
    const ctx = this.getContext();
    const compressor = ctx.createDynamicsCompressor();

    compressor.threshold.value = threshold;
    compressor.ratio.value = ratio;
    compressor.attack.value = attack;
    compressor.release.value = release;

    return compressor;
  }

  createFilterNode(
    type: BiquadFilterType = 'lowpass',
    frequency: number = 1000,
    Q: number = 1,
    gain: number = 0
  ): BiquadFilterNode {
    const ctx = this.getContext();
    const filter = ctx.createBiquadFilter();

    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    filter.gain.value = gain;

    return filter;
  }

  getMasterBus(): { gain: GainNode; analyser: AnalyserNode } {
    if (!this.masterGain || !this.analyser) {
      throw new Error('AudioEngine not initialized. Call init() first.');
    }
    return { gain: this.masterGain, analyser: this.analyser };
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      const ctx = this.getContext();
      this.masterGain.gain.setTargetAtTime(
        Math.max(0, Math.min(1, volume)),
        ctx.currentTime,
        0.01
      );
    }
  }

  getVULevel(): number {
    if (!this.analyser || !this.vuData) return 0;

    this.analyser.getByteTimeDomainData(this.vuData);

    let sum = 0;
    for (let i = 0; i < this.vuData.length; i++) {
      const normalized = (this.vuData[i] - 128) / 128;
      sum += normalized * normalized;
    }

    return Math.sqrt(sum / this.vuData.length);
  }

  async renderToWAV(audioBuffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;

    const wavBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    const channels: Float32Array[] = [];
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numberOfChannels; ch++) {
        let sample = Math.max(-1, Math.min(1, channels[ch][i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  scheduleStart(source: AudioBufferSourceNode, startTime: number): void {
    const ctx = this.getContext();
    const time = Math.max(ctx.currentTime + 0.05, startTime);
    source.start(time);
  }

  suspend(): Promise<void> {
    if (this.audioContext) {
      return this.audioContext.suspend();
    }
    return Promise.resolve();
  }

  resume(): Promise<void> {
    if (this.audioContext) {
      return this.audioContext.resume();
    }
    return Promise.resolve();
  }

  close(): Promise<void> {
    if (this.audioContext) {
      return this.audioContext.close();
    }
    return Promise.resolve();
  }
}

export const audioEngine = new AudioEngine();
