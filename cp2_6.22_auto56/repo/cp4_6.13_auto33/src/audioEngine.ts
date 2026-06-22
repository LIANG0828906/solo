import { useStore } from './store';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.analyser.connect(this.gainNode);
      this.isInitialized = true;
    }
  }

  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    if (!this.isInitialized) {
      this.initAudioContext();
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
    this.audioBuffer = audioBuffer;

    useStore.getState().setAudioBuffer(audioBuffer);
    useStore.getState().setPlaybackState({
      duration: audioBuffer.duration,
      currentTime: 0,
      isLoaded: true,
      isPlaying: false,
    });

    this.extractWaveformData(audioBuffer);

    return audioBuffer;
  }

  private extractWaveformData(buffer: AudioBuffer): void {
    const channelData = buffer.getChannelData(0);
    const samples = 1024;
    const blockSize = Math.floor(channelData.length / samples);
    const waveform = new Float32Array(samples);

    for (let i = 0; i < samples; i++) {
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[i * blockSize + j]);
      }
      waveform[i] = sum / blockSize;
    }

    useStore.getState().setSpectrumData({ waveform });
  }

  public play(startTime: number = 0): void {
    if (!this.audioBuffer || !this.audioContext || !this.analyser || !this.gainNode) {
      return;
    }

    this.stop();

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.analyser);

    const volume = useStore.getState().playbackState.volume;
    this.gainNode.gain.value = volume;

    this.startTime = this.audioContext.currentTime - startTime;
    this.pausedAt = 0;
    this.sourceNode.start(0, startTime);

    useStore.getState().setPlaybackState({
      isPlaying: true,
      currentTime: startTime,
    });

    this.sourceNode.onended = () => {
      if (this.pausedAt === 0) {
        useStore.getState().setPlaybackState({
          isPlaying: false,
          currentTime: 0,
        });
        this.stopAnalysis();
      }
    };

    this.startAnalysis();
  }

  public pause(): void {
    if (this.sourceNode && this.audioContext) {
      this.pausedAt = this.audioContext.currentTime - this.startTime;
      this.sourceNode.stop();
      this.sourceNode = null;
      useStore.getState().setPlaybackState({ isPlaying: false });
      this.stopAnalysis();
    }
  }

  public togglePlay(): void {
    const { isPlaying, currentTime } = useStore.getState().playbackState;
    if (isPlaying) {
      this.pause();
    } else {
      this.play(this.pausedAt > 0 ? this.pausedAt : currentTime);
    }
  }

  public seek(time: number): void {
    const { isPlaying, duration } = useStore.getState().playbackState;
    const clampedTime = Math.max(0, Math.min(time, duration));
    
    useStore.getState().setPlaybackState({ currentTime: clampedTime });
    useStore.getState().setCursorPosition(clampedTime);

    if (isPlaying) {
      this.pausedAt = clampedTime;
      this.play(clampedTime);
    } else {
      this.pausedAt = clampedTime;
    }
  }

  public setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = clampedVolume;
    }
    useStore.getState().setPlaybackState({ volume: clampedVolume });
  }

  private startAnalysis(): void {
    if (!this.analyser) return;

    const timeDomainData = new Uint8Array(this.analyser.fftSize);
    const freqDomainData = new Uint8Array(this.analyser.frequencyBinCount);
    const frequencies = new Float32Array(128);

    const analyze = () => {
      if (!this.analyser || !this.audioContext) return;

      this.analyser.getByteTimeDomainData(timeDomainData);
      this.analyser.getByteFrequencyData(freqDomainData);

      const binsPerBar = Math.floor(this.analyser.frequencyBinCount / 128);

      for (let i = 0; i < 128; i++) {
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) {
          sum += freqDomainData[i * binsPerBar + j] || 0;
        }
        frequencies[i] = sum / binsPerBar / 255;
      }

      const currentTime = this.audioContext.currentTime - this.startTime;
      const { duration } = useStore.getState().playbackState;

      if (currentTime < duration) {
        useStore.getState().setPlaybackState({ currentTime });
      }

      useStore.getState().setSpectrumData({
        frequencies,
        timeDomainData,
        freqDomainData,
      });

      this.animationFrameId = requestAnimationFrame(analyze);
    };

    analyze();
  }

  private stopAnalysis(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (e) {}
      this.sourceNode = null;
    }
    this.stopAnalysis();
  }

  public getWaveform(): Float32Array {
    return useStore.getState().spectrumData.waveform;
  }

  public getFrequency(): Float32Array {
    return useStore.getState().spectrumData.frequencies;
  }

  public destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioBuffer = null;
    this.analyser = null;
    this.gainNode = null;
  }
}

export const audioEngine = new AudioEngine();
