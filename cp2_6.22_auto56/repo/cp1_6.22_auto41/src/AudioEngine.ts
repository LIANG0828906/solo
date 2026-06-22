export class AudioEngine {
  private audioContext: AudioContext;
  private sourceNode: AudioBufferSourceNode;
  private gainNode: GainNode;
  private analyserNode: AnalyserNode;
  private convolverNode: ConvolverNode;
  private dryGainNode: GainNode;
  private wetGainNode: GainNode;
  private audioBuffer: AudioBuffer | null;
  private isPlaying: boolean;
  private pitch: number = 0;
  private reverb: number = 0;
  private volume: number = 1;
  private playbackRate: number;
  private startTime: number = 0;

  public frequencyData: Uint8Array;
  public waveformData: Uint8Array;

  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.analyserNode = this.audioContext.createAnalyser();
    this.convolverNode = this.audioContext.createConvolver();
    this.dryGainNode = this.audioContext.createGain();
    this.wetGainNode = this.audioContext.createGain();
    this.sourceNode = this.audioContext.createBufferSource();
    this.audioBuffer = null;
    this.isPlaying = false;
    this.playbackRate = 1;

    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    this.frequencyData = new Uint8Array(128);
    this.waveformData = new Uint8Array(1024);

    this.gainNode.connect(this.dryGainNode);
    this.dryGainNode.connect(this.analyserNode);
    this.gainNode.connect(this.wetGainNode);
    this.wetGainNode.connect(this.convolverNode);
    this.convolverNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    this.gainNode.gain.value = this.volume;
    this.dryGainNode.gain.value = 1;
    this.wetGainNode.gain.value = 0;
  }

  async loadAudio(arrayBuffer: ArrayBuffer): Promise<void> {
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.convolverNode.buffer = this.generateImpulseResponse(2, 2);
  }

  play(): void {
    if (this.isPlaying) {
      this.stop();
    }
    if (!this.audioBuffer) return;

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.playbackRate = Math.pow(2, this.pitch / 12);
    this.sourceNode.playbackRate.value = this.playbackRate;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.start();
    this.startTime = this.audioContext.currentTime;
    this.isPlaying = true;
  }

  stop(): void {
    try {
      this.sourceNode.stop();
    } catch {}
    this.isPlaying = false;
  }

  togglePlay(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  setPitch(semitones: number): void {
    this.pitch = semitones;
    this.playbackRate = Math.pow(2, semitones / 12);
    if (this.isPlaying) {
      this.sourceNode.playbackRate.value = this.playbackRate;
    }
  }

  setReverb(value: number): void {
    this.reverb = Math.max(0, Math.min(1, value));
    this.dryGainNode.gain.value = 1 - this.reverb;
    this.wetGainNode.gain.value = this.reverb;
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(2, value));
    this.gainNode.gain.value = this.volume;
  }

  getFrequencyData(): Uint8Array {
    this.analyserNode.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  getWaveformData(): Uint8Array {
    this.analyserNode.getByteTimeDomainData(this.waveformData);
    return this.waveformData;
  }

  getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  getCurrentTime(): number {
    if (!this.isPlaying) return 0;
    return this.audioContext.currentTime - this.startTime;
  }

  async exportWav(): Promise<ArrayBuffer> {
    if (!this.audioBuffer) return new ArrayBuffer(0);

    const duration = this.audioBuffer.duration + 2;
    const sampleRate = this.audioBuffer.sampleRate;
    const offlineCtx = new OfflineAudioContext(
      this.audioBuffer.numberOfChannels,
      Math.ceil(duration * sampleRate),
      sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = this.audioBuffer;
    source.playbackRate.value = this.playbackRate;

    const gain = offlineCtx.createGain();
    gain.gain.value = this.volume;

    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 1 - this.reverb;

    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = this.reverb;

    const convolver = offlineCtx.createConvolver();
    convolver.buffer = this.generateImpulseResponse(2, 2);

    source.connect(gain);
    gain.connect(dryGain);
    dryGain.connect(offlineCtx.destination);
    gain.connect(wetGain);
    wetGain.connect(convolver);
    convolver.connect(offlineCtx.destination);

    source.start();

    const renderedBuffer = await offlineCtx.startRendering();
    const samples = renderedBuffer.getChannelData(0);
    return this.encodeWav(samples, renderedBuffer.sampleRate);
  }

  private generateImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.ceil(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    return buffer;
  }

  private encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const bufferLength = 44 + samples.length * 2;
    const buffer = new ArrayBuffer(bufferLength);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
  }
}
