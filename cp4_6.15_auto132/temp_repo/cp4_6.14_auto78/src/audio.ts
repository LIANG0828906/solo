export interface WaveformData {
  samples: Float32Array;
  length: number;
  duration: number;
  sampleRate: number;
}

export class AudioModule {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private fileName: string = '';

  async loadFromFile(file: File): Promise<void> {
    this.fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
  }

  getWaveform(targetSamples: number = 4096): WaveformData {
    if (!this.audioBuffer) {
      return {
        samples: new Float32Array(0),
        length: 0,
        duration: 0,
        sampleRate: 0,
      };
    }

    const rawData = this.audioBuffer.getChannelData(0);
    const totalSamples = rawData.length;
    const blockSize = Math.floor(totalSamples / targetSamples);
    const samples = new Float32Array(targetSamples);

    for (let i = 0; i < targetSamples; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, totalSamples);
      let sum = 0;
      for (let j = start; j < end; j++) {
        sum += Math.abs(rawData[j]);
      }
      samples[i] = sum / (end - start);
    }

    let max = 0;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i] > max) max = samples[i];
    }
    if (max > 0) {
      for (let i = 0; i < samples.length; i++) {
        samples[i] /= max;
      }
    }

    return {
      samples,
      length: samples.length,
      duration: this.audioBuffer.duration,
      sampleRate: this.audioBuffer.sampleRate,
    };
  }

  getDuration(): number {
    return this.audioBuffer?.duration ?? 0;
  }

  getSampleRate(): number {
    return this.audioBuffer?.sampleRate ?? 0;
  }

  getFileName(): string {
    return this.fileName;
  }

  isLoaded(): boolean {
    return this.audioBuffer !== null;
  }
}
