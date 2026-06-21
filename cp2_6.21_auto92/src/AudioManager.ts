export interface AudioManagerOptions {
  onLoaded?: (duration: number) => void;
  onError?: (error: Error) => void;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

export class AudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private waveformData: number[] = [];
  private audioDuration: number = 0;
  private objectUrl: string | null = null;
  private fileName: string | null = null;
  private fileSize: number = 0;
  private MAX_DURATION_MS = 180000;
  private timeUpdateInterval: number | null = null;
  private options: AudioManagerOptions;

  constructor(options: AudioManagerOptions = {}) {
    this.options = options;
  }

  async loadFromFile(file: File): Promise<boolean> {
    this.cleanup();

    if (!file.type.startsWith('audio/')) {
      this.options.onError?.(new Error('请上传音频文件（mp3/wav格式）'));
      return false;
    }

    this.fileSize = file.size;
    this.fileName = file.name;

    this.objectUrl = URL.createObjectURL(file);
    this.audioElement = new Audio(this.objectUrl);
    this.audioElement.preload = 'auto';
    this.audioElement.crossOrigin = 'anonymous';

    return new Promise((resolve) => {
      const onLoadedMetadata = () => {
        const duration = this.audioElement?.duration || 0;
        this.audioDuration = duration * 1000;

        if (duration * 1000 > this.MAX_DURATION_MS) {
          this.cleanup();
          this.options.onError?.(new Error('音频文件时长不能超过3分钟'));
          resolve(false);
          return;
        }

        try {
          this.initAudioContext();
          this.extractWaveform();
        } catch (e) {
          console.warn('音频分析初始化失败，但播放功能仍可用', e);
        }

        this.options.onLoaded?.(this.audioDuration);
        resolve(true);
      };

      const onError = () => {
        this.cleanup();
        this.options.onError?.(new Error('音频文件加载失败'));
        resolve(false);
      };

      if (this.audioElement) {
        this.audioElement.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
        this.audioElement.addEventListener('error', onError, { once: true });
      }
    });
  }

  private initAudioContext(): void {
    if (!this.audioElement) return;

    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new Ctx();
      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('AudioContext初始化失败', e);
    }
  }

  private async extractWaveform(): Promise<void> {
    if (!this.objectUrl) return;

    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const tempCtx = new Ctx();
      const response = await fetch(this.objectUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);

      const rawData = audioBuffer.getChannelData(0);
      const samples = 1000;
      const blockSize = Math.floor(rawData.length / samples);
      const filtered: number[] = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j]);
        }
        filtered.push(sum / blockSize);
      }

      const maxVal = Math.max(...filtered);
      this.waveformData = filtered.map((v) => (maxVal > 0 ? v / maxVal : 0));
      tempCtx.close();
    } catch (e) {
      console.warn('波形提取失败', e);
    }
  }

  getWaveformData(): number[] {
    return [...this.waveformData];
  }

  getWaveformForRange(startMs: number, endMs: number, samples: number = 500): number[] {
    if (this.waveformData.length === 0 || this.audioDuration === 0) return [];

    const totalSamples = this.waveformData.length;
    const startIdx = Math.floor((startMs / this.audioDuration) * totalSamples);
    const endIdx = Math.ceil((endMs / this.audioDuration) * totalSamples);
    const clampedStart = Math.max(0, startIdx);
    const clampedEnd = Math.min(totalSamples, endIdx);
    const rangeData = this.waveformData.slice(clampedStart, clampedEnd);

    if (rangeData.length <= samples) return rangeData;

    const result: number[] = [];
    const block = Math.floor(rangeData.length / samples);

    for (let i = 0; i < samples; i++) {
      let max = 0;
      for (let j = 0; j < block; j++) {
        const val = rangeData[i * block + j] || 0;
        if (val > max) max = val;
      }
      result.push(max);
    }

    return result;
  }

  getDuration(): number {
    return this.audioDuration;
  }

  getFileName(): string | null {
    return this.fileName;
  }

  getFileSize(): number {
    return this.fileSize;
  }

  play(playbackRate: number = 1.0): boolean {
    if (!this.audioElement) return false;
    try {
      this.audioElement.playbackRate = playbackRate;
      const promise = this.audioElement.play();
      if (promise) {
        promise.catch((e) => console.warn('播放失败', e));
      }
      this.startTimeUpdates();
      return true;
    } catch (e) {
      console.warn('播放异常', e);
      return false;
    }
  }

  pause(): boolean {
    if (!this.audioElement) return false;
    try {
      this.audioElement.pause();
      this.stopTimeUpdates();
      return true;
    } catch {
      return false;
    }
  }

  stop(): boolean {
    if (!this.audioElement) return false;
    try {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.stopTimeUpdates();
      this.options.onTimeUpdate?.(0);
      return true;
    } catch {
      return false;
    }
  }

  seek(ms: number): boolean {
    if (!this.audioElement) return false;
    try {
      const seconds = Math.max(0, Math.min(this.audioDuration / 1000, ms / 1000));
      this.audioElement.currentTime = seconds;
      this.options.onTimeUpdate?.(seconds * 1000);
      return true;
    } catch {
      return false;
    }
  }

  getCurrentTime(): number {
    if (!this.audioElement) return 0;
    return this.audioElement.currentTime * 1000;
  }

  setVolume(volume: number): boolean {
    if (!this.audioElement) return false;
    try {
      this.audioElement.volume = Math.max(0, Math.min(1, volume));
      return true;
    } catch {
      return false;
    }
  }

  setPlaybackRate(rate: number): boolean {
    if (!this.audioElement) return false;
    try {
      this.audioElement.playbackRate = Math.max(0.25, Math.min(2, rate));
      return true;
    } catch {
      return false;
    }
  }

  isPlaying(): boolean {
    if (!this.audioElement) return false;
    return !this.audioElement.paused && !this.audioElement.ended;
  }

  private startTimeUpdates(): void {
    this.stopTimeUpdates();
    this.timeUpdateInterval = window.setInterval(() => {
      this.options.onTimeUpdate?.(this.getCurrentTime());
    }, 16);
  }

  private stopTimeUpdates(): void {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  playHitSound(type: 'perfect' | 'good' | 'miss' | 'combo10' | 'combo30' | 'combo50' | 'combo100'): void {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const soundMap: Record<string, { freq: number; duration: number; type: OscillatorType; volume: number }> = {
        perfect: { freq: 880, duration: 0.08, type: 'sine', volume: 0.15 },
        good: { freq: 660, duration: 0.08, type: 'sine', volume: 0.12 },
        miss: { freq: 220, duration: 0.12, type: 'sawtooth', volume: 0.1 },
        combo10: { freq: 1200, duration: 0.15, type: 'triangle', volume: 0.2 },
        combo30: { freq: 1400, duration: 0.18, type: 'triangle', volume: 0.22 },
        combo50: { freq: 1600, duration: 0.22, type: 'triangle', volume: 0.25 },
        combo100: { freq: 1800, duration: 0.3, type: 'triangle', volume: 0.3 },
      };

      const cfg = soundMap[type] || soundMap.perfect;
      osc.type = cfg.type;
      osc.frequency.setValueAtTime(cfg.freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(cfg.volume, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + cfg.duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + cfg.duration + 0.02);

      setTimeout(() => ctx.close(), (cfg.duration + 0.05) * 1000);
    } catch (e) {
      console.warn('音效播放失败', e);
    }
  }

  cleanup(): void {
    this.stopTimeUpdates();
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.removeAttribute('src');
        this.audioElement.load();
      } catch {}
      this.audioElement = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
    }
    if (this.analyser) {
      try { this.analyser.disconnect(); } catch {}
      this.analyser = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.waveformData = [];
    this.audioDuration = 0;
    this.fileName = null;
    this.fileSize = 0;
  }
}
