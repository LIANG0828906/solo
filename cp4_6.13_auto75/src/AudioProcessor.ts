export interface WaveformPoint {
  x: number;
  y: number;
  amplitude: number;
}

export interface SpectrumBand {
  frequency: number;
  magnitude: number;
}

export type WaveformData = {
  peaks: number[];
  rms: number[];
  duration: number;
  sampleRate: number;
};

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordChunks: Blob[] = [];
  private isRecording = false;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    } catch (e) {
      console.error('Web Audio API is not supported', e);
    }
  }

  public resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  async loadFromFile(file: File): Promise<WaveformData> {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    this.resumeContext();

    const maxDuration = 300;
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer.slice(0));

    if (audioBuffer.duration > maxDuration) {
      throw new Error(`音频文件不能超过${maxDuration / 60}分钟`);
    }

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;

    const targetSamples = 400;
    const blockSize = Math.floor(channelData.length / targetSamples);
    const peaks: number[] = [];
    const rms: number[] = [];

    for (let i = 0; i < targetSamples; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      let peak = 0;
      let sumSq = 0;

      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > peak) peak = val;
        sumSq += channelData[j] * channelData[j];
      }

      peaks.push(peak);
      rms.push(Math.sqrt(sumSq / (end - start)));
    }

    const normalizePeaks = this.normalizeArray(peaks);
    const normalizeRms = this.normalizeArray(rms);

    return {
      peaks: normalizePeaks,
      rms: normalizeRms,
      duration,
      sampleRate
    };
  }

  async startRecording(): Promise<void> {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    this.resumeContext();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.recordChunks = [];
    this.isRecording = true;

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100);

    const stopAfter = () => {
      if (this.isRecording && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        const elapsed = this.mediaRecorder.stream.getAudioTracks()[0].muted ? 0 : 0;
        if (this.recordChunks.length >= 3000) {
          this.stopRecording();
        }
      }
    };

    const interval = setInterval(() => {
      if (!this.isRecording) {
        clearInterval(interval);
        return;
      }
      stopAfter();
    }, 1000);
  }

  stopRecording(): Promise<WaveformData> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.isRecording = false;
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordChunks, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });

        this.mediaRecorder!.stream.getTracks().forEach(t => t.stop());

        try {
          const data = await this.loadFromFile(file);
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  getRecordingTime(): number {
    return this.recordChunks.length * 0.1;
  }

  isRecordingActive(): boolean {
    return this.isRecording;
  }

  private normalizeArray(arr: number[]): number[] {
    const max = Math.max(...arr, 0.01);
    return arr.map(v => v / max);
  }

  computeFFT(data: WaveformData, fftSize: number = 256): SpectrumBand[] {
    const bands: SpectrumBand[] = [];
    const bandsCount = 32;

    for (let i = 0; i < bandsCount; i++) {
      const freq = (i / bandsCount) * (data.sampleRate / 2);
      let magnitude = 0;
      const startIdx = Math.floor(i * data.peaks.length / bandsCount);
      const endIdx = Math.floor((i + 1) * data.peaks.length / bandsCount);

      for (let j = startIdx; j < endIdx; j++) {
        magnitude += data.peaks[j];
      }
      magnitude = magnitude / (endIdx - startIdx || 1);

      bands.push({
        frequency: freq,
        magnitude: Math.min(magnitude * 1.2, 1)
      });
    }

    return bands;
  }

  static getSupportedFormats(): string[] {
    return ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg'];
  }

  static validateFile(file: File): boolean {
    const valid = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg', ''];
    const isAudio = file.type.startsWith('audio/') || valid.includes(file.type);
    const hasValidExt = /\.(mp3|wav|ogg|webm)$/i.test(file.name);
    return isAudio || hasValidExt;
  }

  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
