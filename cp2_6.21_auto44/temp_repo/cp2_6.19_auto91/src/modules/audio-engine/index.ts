import { Mixer } from './Mixer';

export interface AudioEngineOptions {
  sampleRate?: number;
  bufferSize?: number;
  fftSize?: number;
}

export interface TrackInfo {
  id: string;
  name: string;
  color: string;
  volume: number;
  muted: boolean;
  level: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private mixer: Mixer | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private localTrackId: string | null = null;
  private isPlaying: boolean = false;
  private options: Required<AudioEngineOptions>;
  private spectrumData: Uint8Array | null = null;
  private waveformData: Uint8Array | null = null;
  private animationFrameId: number | null = null;
  private onSpectrumUpdate: ((data: Uint8Array) => void) | null = null;
  private onTrackLevelsUpdate: ((tracks: TrackInfo[]) => void) | null = null;

  constructor(options: AudioEngineOptions = {}) {
    this.options = {
      sampleRate: options.sampleRate || 44100,
      bufferSize: options.bufferSize || 512,
      fftSize: options.fftSize || 2048,
    };
  }

  async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: this.options.sampleRate,
      latencyHint: 'interactive',
    });

    this.mixer = new Mixer(this.audioContext);
    
    const buffer = this.options.fftSize;
    this.spectrumData = new Uint8Array(new ArrayBuffer(buffer / 2));
    this.waveformData = new Uint8Array(new ArrayBuffer(buffer));
  }

  async startLocalAudio(trackId: string, color: string): Promise<void> {
    if (!this.audioContext || !this.mixer) {
      await this.init();
    }

    if (!this.audioContext || !this.mixer) {
      throw new Error('Audio context not initialized');
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.options.sampleRate,
          channelCount: 1,
        },
        video: false,
      });

      this.sourceNode = this.audioContext!.createMediaStreamSource(this.mediaStream);
      
      this.mixer!.addTrack(trackId, color);
      
      const gainNode = this.mixer!.getTrackGainNode(trackId);
      if (gainNode) {
        this.sourceNode.connect(gainNode);
      }

      this.localTrackId = trackId;
      this.isPlaying = true;

      this.startAnalysisLoop();
    } catch (error) {
      console.error('Failed to start local audio:', error);
      throw error;
    }
  }

  stopLocalAudio(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.localTrackId && this.mixer) {
      this.mixer.removeTrack(this.localTrackId);
    }

    this.localTrackId = null;
    this.isPlaying = false;
    this.stopAnalysisLoop();
  }

  addRemoteTrack(trackId: string, color: string): void {
    if (!this.mixer) return;
    this.mixer.addTrack(trackId, color);
  }

  removeRemoteTrack(trackId: string): void {
    if (!this.mixer) return;
    this.mixer.removeTrack(trackId);
  }

  setTrackVolume(trackId: string, volume: number): void {
    if (!this.mixer) return;
    this.mixer.setTrackVolume(trackId, volume);
  }

  setTrackMuted(trackId: string, muted: boolean): void {
    if (!this.mixer) return;
    this.mixer.setTrackMuted(trackId, muted);
  }

  setMasterVolume(volume: number): void {
    if (!this.mixer) return;
    this.mixer.setMasterVolume(volume);
  }

  getMasterVolume(): number {
    if (!this.mixer) return 80;
    return this.mixer.getMasterVolume();
  }

  getSpectrumData(): Uint8Array | null {
    if (!this.mixer || !this.spectrumData) return null;
    
    const analyser = this.mixer.getMasterAnalyser();
    if (analyser) {
      analyser.getByteFrequencyData(this.spectrumData as Uint8Array<ArrayBuffer>);
    }
    
    return this.spectrumData;
  }

  getWaveformData(): Uint8Array | null {
    if (!this.mixer || !this.waveformData) return null;
    
    const analyser = this.mixer.getMasterAnalyser();
    if (analyser) {
      analyser.getByteTimeDomainData(this.waveformData as Uint8Array<ArrayBuffer>);
    }
    
    return this.waveformData;
  }

  getTracks(): TrackInfo[] {
    if (!this.mixer) return [];
    return this.mixer.getTracks().map((t) => ({
      id: t.id,
      name: t.id,
      color: t.color,
      volume: t.volume,
      muted: t.muted,
      level: t.level,
    }));
  }

  getTrackLevel(trackId: string): number {
    if (!this.mixer) return 0;
    const track = this.mixer.getTrack(trackId);
    return track?.level || 0;
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate || this.options.sampleRate;
  }

  getEstimatedLatency(): number {
    if (!this.mixer) return 0;
    return this.mixer.getEstimatedLatency();
  }

  getConnectionQuality(): 'good' | 'medium' | 'poor' {
    if (!this.mixer) return 'good';
    return this.mixer.getConnectionQuality();
  }

  reportUnderrun(): void {
    this.mixer?.reportUnderrun();
  }

  resetUnderrunCount(): void {
    this.mixer?.resetUnderrunCount();
  }

  setOnSpectrumUpdate(callback: (data: Uint8Array) => void): void {
    this.onSpectrumUpdate = callback;
  }

  setOnTrackLevelsUpdate(callback: (tracks: TrackInfo[]) => void): void {
    this.onTrackLevelsUpdate = callback;
  }

  private startAnalysisLoop(): void {
    if (this.animationFrameId !== null) return;

    let lastUpdate = 0;
    const updateInterval = 1000 / 30;

    const loop = (timestamp: number) => {
      if (!this.isPlaying) return;

      if (timestamp - lastUpdate >= updateInterval) {
        this.mixer?.updateTrackLevels();
        
        const spectrumData = this.getSpectrumData();
        if (spectrumData && this.onSpectrumUpdate) {
          this.onSpectrumUpdate(spectrumData);
        }

        if (this.onTrackLevelsUpdate && this.mixer) {
          this.onTrackLevelsUpdate(this.getTracks());
        }

        lastUpdate = timestamp;
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  private stopAnalysisLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  isAudioActive(): boolean {
    return this.isPlaying;
  }

  getLocalTrackId(): string | null {
    return this.localTrackId;
  }

  async destroy(): Promise<void> {
    this.stopLocalAudio();
    this.stopAnalysisLoop();
    
    if (this.mixer) {
      this.mixer.destroy();
      this.mixer = null;
    }
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
  }
}
