import type { WaveformPoint, OscillatorType, Track } from '../store';
import { WaveformAnalyzer } from './WaveformAnalyzer';

type AudioEngineState = {
  timbre: OscillatorType;
  volume: number;
  bpm: number;
  reverbEnabled: boolean;
  tracks: Track[];
};

type TrackAudioState = {
  trackId: string;
  bufferSource: AudioBufferSourceNode | null;
  gainNode: GainNode;
  audioBuffer: AudioBuffer | null;
};

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGainNode: GainNode | null = null;
  private dryGainNode: GainNode | null = null;
  private waveformAnalyzer: WaveformAnalyzer | null = null;
  private state: AudioEngineState;
  private trackAudioStates: Map<string, TrackAudioState> = new Map();
  private onPlaybackProgress: ((progress: number) => void) | null = null;
  private onIsPlayingChange: ((isPlaying: boolean) => void) | null = null;
  private animationFrameId: number | null = null;
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private beatDuration: number = 0;

  constructor(initialState: AudioEngineState) {
    this.state = initialState;
    this.beatDuration = 60 / this.state.bpm;
  }

  public async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.waveformAnalyzer = new WaveformAnalyzer(this.audioContext);

    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.gain.value = this.state.volume / 100;

    this.dryGainNode = this.audioContext.createGain();
    this.dryGainNode.gain.value = 1;

    this.reverbGainNode = this.audioContext.createGain();
    this.reverbGainNode.gain.value = this.state.reverbEnabled ? 0.3 : 0;

    this.reverbNode = this.audioContext.createConvolver();
    this.reverbNode.buffer = this.createReverbImpulseResponse();

    this.dryGainNode.connect(this.masterGainNode);
    this.reverbNode.connect(this.reverbGainNode);
    this.reverbGainNode.connect(this.masterGainNode);
    this.dryGainNode.connect(this.reverbNode);

    this.masterGainNode.connect(this.audioContext.destination);

    this.state.tracks.forEach((track) => {
      this.createTrackAudioState(track.id);
    });
  }

  private createTrackAudioState(trackId: string): void {
    if (!this.audioContext) return;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1;

    if (this.dryGainNode) {
      gainNode.connect(this.dryGainNode);
    }

    this.trackAudioStates.set(trackId, {
      trackId,
      bufferSource: null,
      gainNode,
      audioBuffer: null,
    });
  }

  private createReverbImpulseResponse(): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    const sampleRate = this.audioContext.sampleRate;
    const duration = 2;
    const numSamples = sampleRate * duration;
    const impulseResponse = this.audioContext.createBuffer(2, numSamples, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulseResponse.getChannelData(channel);
      for (let i = 0; i < numSamples; i++) {
        const t = i / numSamples;
        const decay = Math.pow(1 - t, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.5;
      }
    }

    return impulseResponse;
  }

  public setOnPlaybackProgress(callback: (progress: number) => void): void {
    this.onPlaybackProgress = callback;
  }

  public setOnIsPlayingChange(callback: (isPlaying: boolean) => void): void {
    this.onIsPlayingChange = callback;
  }

  public updateState(newState: Partial<AudioEngineState>): void {
    this.state = { ...this.state, ...newState };

    if (newState.volume !== undefined && this.masterGainNode) {
      this.masterGainNode.gain.setValueAtTime(
        newState.volume / 100,
        this.audioContext?.currentTime || 0
      );
    }

    if (newState.reverbEnabled !== undefined && this.reverbGainNode) {
      this.reverbGainNode.gain.setValueAtTime(
        newState.reverbEnabled ? 0.3 : 0,
        this.audioContext?.currentTime || 0
      );
    }

    if (newState.bpm !== undefined) {
      this.beatDuration = 60 / newState.bpm;
    }

    if (newState.timbre !== undefined) {
      this.regenerateAllTrackBuffers();
    }

    if (newState.tracks !== undefined) {
      newState.tracks.forEach((track) => {
        if (!this.trackAudioStates.has(track.id)) {
          this.createTrackAudioState(track.id);
        }
        const trackState = this.trackAudioStates.get(track.id);
        if (trackState) {
          trackState.gainNode.gain.setValueAtTime(
            track.muted ? 0 : 1,
            this.audioContext?.currentTime || 0
          );
        }
      });

      const currentTrackIds = new Set(newState.tracks.map((t) => t.id));
      this.trackAudioStates.forEach((_, trackId) => {
        if (!currentTrackIds.has(trackId)) {
          this.removeTrack(trackId);
        }
      });
    }
  }

  private regenerateAllTrackBuffers(): void {
    this.state.tracks.forEach((track) => {
      if (track.waveformPoints.length > 0) {
        this.updateTrackBuffer(track.id, track.waveformPoints);
      }
    });
  }

  public updateTrackBuffer(trackId: string, waveformPoints: WaveformPoint[]): void {
    if (!this.waveformAnalyzer || !this.audioContext) return;

    const trackState = this.trackAudioStates.get(trackId);
    if (!trackState) return;

    const audioBuffer = this.waveformAnalyzer.analyze(waveformPoints, this.beatDuration * 4);
    trackState.audioBuffer = audioBuffer;

    if (this.isPlaying) {
      this.scheduleTrackPlayback(trackId);
    }
  }

  public addTrack(track: Track): void {
    if (!this.state.tracks.find((t) => t.id === track.id)) {
      this.state.tracks = [...this.state.tracks, track];
      this.createTrackAudioState(track.id);
    }
  }

  public removeTrack(trackId: string): void {
    const trackState = this.trackAudioStates.get(trackId);
    if (trackState) {
      if (trackState.bufferSource) {
        trackState.bufferSource.stop();
        trackState.bufferSource.disconnect();
      }
      trackState.gainNode.disconnect();
      this.trackAudioStates.delete(trackId);
    }
    this.state.tracks = this.state.tracks.filter((t) => t.id !== trackId);
  }

  public async startPlayback(): Promise<void> {
    if (!this.audioContext) {
      await this.init();
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.startTime = this.audioContext?.currentTime || 0;
    this.onIsPlayingChange?.(true);

    this.state.tracks.forEach((track) => {
      if (track.waveformPoints.length > 0) {
        this.updateTrackBuffer(track.id, track.waveformPoints);
      }
      this.scheduleTrackPlayback(track.id);
    });

    this.startProgressUpdate();
  }

  private scheduleTrackPlayback(trackId: string): void {
    if (!this.audioContext || !this.isPlaying) return;

    const trackState = this.trackAudioStates.get(trackId);
    if (!trackState || !trackState.audioBuffer) return;

    if (trackState.bufferSource) {
      try {
        trackState.bufferSource.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      trackState.bufferSource.disconnect();
    }

    const bufferSource = this.audioContext.createBufferSource();
    bufferSource.buffer = trackState.audioBuffer;
    bufferSource.loop = true;
    bufferSource.loopStart = 0;
    bufferSource.loopEnd = this.beatDuration * 4;

    if (this.state.timbre === 'square' || this.state.timbre === 'sawtooth') {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = this.state.timbre;
      const oscillatorGain = this.audioContext.createGain();
      oscillatorGain.gain.value = 0.3;
      oscillator.connect(oscillatorGain);
      oscillatorGain.connect(trackState.gainNode);
      oscillator.frequency.value = 220;
      oscillator.start();
    }

    bufferSource.connect(trackState.gainNode);

    const currentTime = this.audioContext.currentTime;
    const elapsed = currentTime - this.startTime;
    const loopDuration = this.beatDuration * 4;
    const offset = elapsed % loopDuration;

    bufferSource.start(currentTime, offset);

    trackState.bufferSource = bufferSource;
  }

  private startProgressUpdate(): void {
    const updateProgress = () => {
      if (!this.isPlaying || !this.audioContext) return;

      const currentTime = this.audioContext.currentTime;
      const elapsed = currentTime - this.startTime;
      const loopDuration = this.beatDuration * 4;
      const progress = (elapsed % loopDuration) / loopDuration;

      this.onPlaybackProgress?.(progress);

      this.animationFrameId = requestAnimationFrame(updateProgress);
    };

    this.animationFrameId = requestAnimationFrame(updateProgress);
  }

  public stopPlayback(): void {
    this.isPlaying = false;
    this.onIsPlayingChange?.(false);

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.trackAudioStates.forEach((trackState) => {
      if (trackState.bufferSource) {
        try {
          trackState.bufferSource.stop();
        } catch (e) {
          // Ignore if already stopped
        }
        trackState.bufferSource.disconnect();
        trackState.bufferSource = null;
      }
    });

    this.onPlaybackProgress?.(0);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  public destroy(): void {
    this.stopPlayback();

    this.trackAudioStates.forEach((trackState) => {
      trackState.gainNode.disconnect();
    });
    this.trackAudioStates.clear();

    if (this.masterGainNode) {
      this.masterGainNode.disconnect();
      this.masterGainNode = null;
    }
    if (this.reverbNode) {
      this.reverbNode.disconnect();
      this.reverbNode = null;
    }
    if (this.reverbGainNode) {
      this.reverbGainNode.disconnect();
      this.reverbGainNode = null;
    }
    if (this.dryGainNode) {
      this.dryGainNode.disconnect();
      this.dryGainNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
