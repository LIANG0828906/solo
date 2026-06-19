export interface TrackState {
  id: string;
  volume: number;
  muted: boolean;
  color: string;
  level: number;
}

export class Mixer {
  private tracks: Map<string, TrackState> = new Map();
  private masterVolume: number = 0.8;
  private sampleRate: number = 44100;
  private bufferSize: number = 512;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private trackGains: Map<string, GainNode> = new Map();
  private trackAnalysers: Map<string, AnalyserNode> = new Map();
  private underrunCount: number = 0;
  private lastUnderrunCheck: number = 0;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.sampleRate = audioContext.sampleRate;
    
    this.masterGain = audioContext.createGain();
    this.masterGain.gain.value = this.masterVolume;
    
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    this.masterGain.connect(this.analyser);
    this.analyser.connect(audioContext.destination);
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  getBufferSize(): number {
    return this.bufferSize;
  }

  getMasterVolume(): number {
    return this.masterVolume * 100;
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume / 100));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.masterVolume,
        this.audioContext?.currentTime || 0
      );
    }
  }

  addTrack(trackId: string, color: string): void {
    if (this.tracks.has(trackId) || !this.audioContext) return;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0.8;
    gainNode.connect(this.masterGain!);

    const analyserNode = this.audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.9;

    this.trackGains.set(trackId, gainNode);
    this.trackAnalysers.set(trackId, analyserNode);

    this.tracks.set(trackId, {
      id: trackId,
      volume: 80,
      muted: false,
      color,
      level: 0,
    });
  }

  removeTrack(trackId: string): void {
    const gainNode = this.trackGains.get(trackId);
    if (gainNode) {
      gainNode.disconnect();
      this.trackGains.delete(trackId);
    }
    
    const analyserNode = this.trackAnalysers.get(trackId);
    if (analyserNode) {
      analyserNode.disconnect();
      this.trackAnalysers.delete(trackId);
    }
    
    this.tracks.delete(trackId);
  }

  setTrackVolume(trackId: string, volume: number): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    track.volume = Math.max(0, Math.min(100, volume));
    const gainNode = this.trackGains.get(trackId);
    if (gainNode && !track.muted) {
      gainNode.gain.setValueAtTime(
        track.volume / 100,
        this.audioContext?.currentTime || 0
      );
    }
  }

  setTrackMuted(trackId: string, muted: boolean): void {
    const track = this.tracks.get(trackId);
    if (!track) return;

    track.muted = muted;
    const gainNode = this.trackGains.get(trackId);
    if (gainNode) {
      gainNode.gain.setValueAtTime(
        muted ? 0 : track.volume / 100,
        this.audioContext?.currentTime || 0
      );
    }
  }

  getTrackGainNode(trackId: string): GainNode | undefined {
    return this.trackGains.get(trackId);
  }

  getTrackAnalyser(trackId: string): AnalyserNode | undefined {
    return this.trackAnalysers.get(trackId);
  }

  getMasterAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getTracks(): TrackState[] {
    return Array.from(this.tracks.values());
  }

  getTrack(trackId: string): TrackState | undefined {
    return this.tracks.get(trackId);
  }

  updateTrackLevels(): void {
    this.trackAnalysers.forEach((analyser, trackId) => {
      const track = this.tracks.get(trackId);
      if (!track) return;

      const dataArray = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
      
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      track.level = average / 255;
    });
  }

  getEstimatedLatency(): number {
    if (!this.audioContext) return 0;
    const baseLatency = this.audioContext.baseLatency || 0;
    const outputLatency = this.audioContext.outputLatency || 0;
    return (baseLatency + outputLatency) * 1000;
  }

  reportUnderrun(): void {
    this.underrunCount++;
    this.lastUnderrunCheck = Date.now();
  }

  getConnectionQuality(): 'good' | 'medium' | 'poor' {
    const now = Date.now();
    const windowMs = 5000;
    
    if (now - this.lastUnderrunCheck > windowMs) {
      return 'good';
    }
    
    if (this.underrunCount === 0) return 'good';
    if (this.underrunCount <= 3) return 'medium';
    return 'poor';
  }

  resetUnderrunCount(): void {
    this.underrunCount = 0;
    this.lastUnderrunCheck = Date.now();
  }

  destroy(): void {
    this.trackGains.forEach((gain) => gain.disconnect());
    this.trackAnalysers.forEach((analyser) => analyser.disconnect());
    this.trackGains.clear();
    this.trackAnalysers.clear();
    this.tracks.clear();
    
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    this.audioContext = null;
  }
}
