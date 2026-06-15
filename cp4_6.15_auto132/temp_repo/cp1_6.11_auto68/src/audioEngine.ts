export interface AudioRegion {
  start: number;
  end: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private fullWaveformPeaks: Float32Array | null = null;
  private timeDataArray: Uint8Array | null = null;
  private freqDataArray: Uint8Array | null = null;

  public region: AudioRegion | null = null;
  public isLooping: boolean = false;
  public duration: number = 0;
  public sampleRate: number = 0;
  public numberOfChannels: number = 0;
  public fileName: string = '';
  public fileSize: number = 0;

  private fftSize: number = 128;
  private loopCheckInterval: number | null = null;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
  }

  async loadFile(file: File): Promise<void> {
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('文件大小不能超过 50MB');
    }

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav'];
    const validExtensions = ['.mp3', '.wav'];
    const fileNameLower = file.name.toLowerCase();
    const isValidType = validTypes.includes(file.type) ||
      validExtensions.some(ext => fileNameLower.endsWith(ext));

    if (!isValidType) {
      throw new Error('仅支持 MP3 和 WAV 格式');
    }

    this.fileName = file.name;
    this.fileSize = file.size;

    const url = URL.createObjectURL(file);

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));

    this.duration = this.audioBuffer.duration;
    this.sampleRate = this.audioBuffer.sampleRate;
    this.numberOfChannels = this.audioBuffer.numberOfChannels;

    this.computeFullWaveform();

    if (this.audioElement) {
      this.audioElement.src = url;
      this.audioElement.playbackRate = 1;
    }

    if (!this.sourceNode && this.audioElement) {
      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.7;

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0.7;

      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      const bufferLength = this.analyser.frequencyBinCount;
      this.timeDataArray = new Uint8Array(bufferLength);
      this.freqDataArray = new Uint8Array(bufferLength);
    }

    this.region = null;
    this.isLooping = false;

    await new Promise<void>((resolve, reject) => {
      if (!this.audioElement) return reject(new Error('No audio element'));
      this.audioElement.onloadedmetadata = () => resolve();
      this.audioElement.onerror = () => reject(new Error('音频加载失败'));
    });
  }

  private computeFullWaveform(): void {
    if (!this.audioBuffer) return;

    const samples = 1000;
    const channelData = this.audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    const peaks = new Float32Array(samples * 2);

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      let min = 1;
      let max = -1;

      for (let j = 0; j < blockSize; j++) {
        const sample = channelData[start + j];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }

      peaks[i * 2] = min;
      peaks[i * 2 + 1] = max;
    }

    this.fullWaveformPeaks = peaks;
  }

  getFullWaveformPeaks(): Float32Array | null {
    return this.fullWaveformPeaks;
  }

  play(): void {
    if (this.audioElement && this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      this.audioElement.play();
      this.startLoopCheck();
    }
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.stopLoopCheck();
    }
  }

  togglePlay(): boolean {
    if (this.audioElement) {
      if (this.audioElement.paused) {
        this.play();
        return true;
      } else {
        this.pause();
        return false;
      }
    }
    return false;
  }

  isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false;
  }

  setVolume(v: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = v;
    }
  }

  setSpeed(s: number): void {
    if (this.audioElement) {
      this.audioElement.playbackRate = s;
    }
  }

  getCurrentTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  setCurrentTime(time: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
  }

  getDuration(): number {
    return this.duration;
  }

  getWaveform(): Uint8Array | null {
    if (!this.analyser || !this.timeDataArray) return null;
    this.analyser.getByteTimeDomainData(this.timeDataArray as Uint8Array<ArrayBuffer>);
    return this.timeDataArray;
  }

  getSpectrum(): Uint8Array | null {
    if (!this.analyser || !this.freqDataArray) return null;
    this.analyser.getByteFrequencyData(this.freqDataArray as Uint8Array<ArrayBuffer>);
    return this.freqDataArray;
  }

  getFrequencyBinCount(): number {
    return this.analyser ? this.analyser.frequencyBinCount : 0;
  }

  selectRegion(start: number, end: number): void {
    const s = Math.min(start, end);
    const e = Math.max(start, end);
    this.region = {
      start: Math.max(0, s),
      end: Math.min(this.duration, e)
    };
  }

  clearRegion(): void {
    this.region = null;
    this.isLooping = false;
    this.stopLoopCheck();
  }

  hasRegion(): boolean {
    return this.region !== null;
  }

  getRegion(): AudioRegion | null {
    return this.region;
  }

  setLooping(loop: boolean): void {
    this.isLooping = loop;
    if (loop && this.region) {
      this.setCurrentTime(this.region.start);
      this.startLoopCheck();
    } else {
      this.stopLoopCheck();
    }
  }

  private startLoopCheck(): void {
    this.stopLoopCheck();
    this.loopCheckInterval = window.setInterval(() => {
      if (this.isLooping && this.region && this.audioElement) {
        if (this.audioElement.currentTime >= this.region.end) {
          this.audioElement.currentTime = this.region.start;
        }
      }
    }, 16);
  }

  private stopLoopCheck(): void {
    if (this.loopCheckInterval !== null) {
      clearInterval(this.loopCheckInterval);
      this.loopCheckInterval = null;
    }
  }

  async exportSelectedRegion(): Promise<Blob> {
    if (!this.audioBuffer || !this.region) {
      throw new Error('没有音频或选区');
    }

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const { start, end } = this.region;
    const startSample = Math.floor(start * this.audioBuffer.sampleRate);
    const endSample = Math.floor(end * this.audioBuffer.sampleRate);
    const length = endSample - startSample;

    const offlineContext = new OfflineAudioContext(
      this.audioBuffer.numberOfChannels,
      length,
      this.audioBuffer.sampleRate
    );

    const newBuffer = offlineContext.createBuffer(
      this.audioBuffer.numberOfChannels,
      length,
      this.audioBuffer.sampleRate
    );

    for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
      const oldData = this.audioBuffer.getChannelData(channel);
      const newData = newBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        newData[i] = oldData[startSample + i];
      }
    }

    const source = offlineContext.createBufferSource();
    source.buffer = newBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    return this.audioBufferToWav(renderedBuffer);
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channels[ch][i];
        sample = Math.max(-1, Math.min(1, sample));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  reset(): void {
    this.pause();
    this.clearRegion();
    if (this.audioElement) {
      this.audioElement.currentTime = 0;
      this.audioElement.playbackRate = 1;
    }
    if (this.gainNode) {
      this.gainNode.gain.value = 0.7;
    }
  }

  destroy(): void {
    this.stopLoopCheck();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }
}
