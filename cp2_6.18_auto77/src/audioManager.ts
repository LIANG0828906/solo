export type AudioSourceType = 'microphone' | 'file' | 'none';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private frequencyData: Uint8Array;
  private waveformData: Uint8Array;
  private currentSourceName: string = '未选择音频源';
  private currentSourceType: AudioSourceType = 'none';

  constructor() {
    this.frequencyData = new Uint8Array(256);
    this.waveformData = new Uint8Array(256);
  }

  async init(): Promise<void> {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    const bufferLength = this.analyser.frequencyBinCount;
    this.frequencyData = new Uint8Array(bufferLength);
    this.waveformData = new Uint8Array(bufferLength);
  }

  async startMicrophone(): Promise<void> {
    this.stop();
    if (!this.audioContext) await this.init();
    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume();
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.audioContext!.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser!);
    this.currentSourceType = 'microphone';
    this.currentSourceName = '麦克风输入';
  }

  async startFile(file: File): Promise<void> {
    this.stop();
    if (!this.audioContext) await this.init();
    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume();
    }
    this.audioElement = document.createElement('audio');
    this.audioElement.src = URL.createObjectURL(file);
    this.audioElement.loop = true;
    this.audioElement.crossOrigin = 'anonymous';
    this.source = this.audioContext!.createMediaElementSource(this.audioElement);
    this.source.connect(this.analyser!);
    this.analyser!.connect(this.audioContext!.destination);
    await this.audioElement.play();
    this.currentSourceType = 'file';
    this.currentSourceName = file.name;
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    this.currentSourceType = 'none';
    this.currentSourceName = '未选择音频源';
    this.frequencyData.fill(0);
    this.waveformData.fill(0);
  }

  getFrequencyData(): Uint8Array {
    if (this.analyser && this.currentSourceType !== 'none') {
      this.analyser.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>);
    }
    return this.frequencyData;
  }

  getWaveformData(): Uint8Array {
    if (this.analyser && this.currentSourceType !== 'none') {
      this.analyser.getByteTimeDomainData(this.waveformData as Uint8Array<ArrayBuffer>);
    }
    return this.waveformData;
  }

  getCurrentSourceName(): string {
    return this.currentSourceName;
  }

  getCurrentSourceType(): AudioSourceType {
    return this.currentSourceType;
  }

  get isPlaying(): boolean {
    return this.currentSourceType !== 'none';
  }
}
