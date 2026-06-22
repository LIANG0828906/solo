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
  private progressAtBpmChange: number = 0;
  private isPlaying: boolean = false;
  private beatDuration: number = 0;

  constructor(initialState: AudioEngineState) {
    this.state = initialState;
    this.beatDuration = 60 / this.state.bpm;
  }

  public async init(): Promise<void> {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.waveformAnalyzer = new WaveformAnalyzer(this.audioContext);

    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.gain.value = this.state.volume / 100;

    this.dryGainNode = this.audioContext.createGain();
    this.dryGainNode.gain.value = 1.0;

    this.reverbGainNode = this.audioContext.createGain();
    this.reverbGainNode.gain.value = this.state.reverbEnabled ? 0.6 : 0;

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
    if (!this.audioContext || !this.dryGainNode) return;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1;
    gainNode.connect(this.dryGainNode);

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
    const duration = 2.5;
    const numSamples = Math.floor(sampleRate * duration);
    const impulseResponse = this.audioContext.createBuffer(2, numSamples, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulseResponse.getChannelData(channel);
      const delay = channel === 0 ? 0 : Math.floor(sampleRate * 0.015);

      for (let i = 0; i < delay && i < numSamples; i++) {
        channelData[i] = 0;
      }

      for (let i = delay; i < numSamples; i++) {
        const t = (i - delay) / (numSamples - delay);
        const earlyReflections = Math.exp(-t * 8) * 0.6;
        const lateReverb = Math.exp(-t * 2.5) * 0.4;
        const noise = (Math.random() * 2 - 1);
        channelData[i] = noise * (earlyReflections + lateReverb);
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
    const oldBpm = this.state.bpm;
    const oldTimbre = this.state.timbre;
    const wasPlaying = this.isPlaying;
    const currentProgress = this.getCurrentProgress();

    this.state = { ...this.state, ...newState };

    if (newState.volume !== undefined && this.masterGainNode && this.audioContext) {
      this.masterGainNode.gain.setValueAtTime(newState.volume / 100, this.audioContext.currentTime);
    }

    if (newState.reverbEnabled !== undefined && this.reverbGainNode && this.audioContext) {
      this.reverbGainNode.gain.setValueAtTime(
        newState.reverbEnabled ? 0.6 : 0,
        this.audioContext.currentTime
      );
    }

    if (newState.bpm !== undefined && newState.bpm !== oldBpm) {
      this.beatDuration = 60 / newState.bpm;
      this.progressAtBpmChange = currentProgress;
      if (this.audioContext) {
        this.startTime = this.audioContext.currentTime;
      }
      if (wasPlaying) {
        this.stopAllTracks();
        this.regenerateAllTrackBuffers();
        this.scheduleAllTracks(currentProgress);
      } else {
        this.regenerateAllTrackBuffers();
      }
    }

    if (newState.timbre !== undefined && newState.timbre !== oldTimbre) {
      if (wasPlaying) {
        this.stopAllTracks();
        this.regenerateAllTrackBuffers();
        this.scheduleAllTracks(currentProgress);
      } else {
        this.regenerateAllTrackBuffers();
      }
    }

    if (newState.tracks !== undefined) {
      newState.tracks.forEach((track) => {
        if (!this.trackAudioStates.has(track.id)) {
          this.createTrackAudioState(track.id);
        }
        const trackState = this.trackAudioStates.get(track.id);
        if (trackState && this.audioContext) {
          trackState.gainNode.gain.setValueAtTime(
            track.muted ? 0 : 1,
            this.audioContext.currentTime
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

  private getCurrentProgress(): number {
    if (!this.audioContext || !this.isPlaying) {
      return this.progressAtBpmChange;
    }
    const elapsed = this.audioContext.currentTime - this.startTime;
    const loopDuration = this.beatDuration * 4;
    return (this.progressAtBpmChange + elapsed / loopDuration) % 1;
  }

  private regenerateAllTrackBuffers(): void {
    this.state.tracks.forEach((track) => {
      if (track.waveformPoints.length > 0) {
        this.updateTrackBuffer(track.id, track.waveformPoints, false);
      }
    });
  }

  public updateTrackBuffer(
    trackId: string,
    waveformPoints: WaveformPoint[],
    reschedule: boolean = true
  ): void {
    if (!this.waveformAnalyzer || !this.audioContext) return;

    const trackState = this.trackAudioStates.get(trackId);
    if (!trackState) return;

    const loopDuration = this.beatDuration * 4;
    const audioBuffer = this.waveformAnalyzer.analyze(
      waveformPoints,
      loopDuration,
      this.state.timbre
    );
    trackState.audioBuffer = audioBuffer;

    if (this.isPlaying && reschedule) {
      this.scheduleTrackPlayback(trackId, this.getCurrentProgress());
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
        try {
          trackState.bufferSource.stop();
        } catch (e) {
          // noop
        }
        trackState.bufferSource.disconnect();
      }
      trackState.gainNode.disconnect();
      this.trackAudioStates.delete(trackId);
    }
    this.state.tracks = this.state.tracks.filter((t) => t.id !== trackId);
  }

  private stopAllTracks(): void {
    this.trackAudioStates.forEach((trackState) => {
      if (trackState.bufferSource) {
        try {
          trackState.bufferSource.stop();
        } catch (e) {
          // noop
        }
        trackState.bufferSource.disconnect();
        trackState.bufferSource = null;
      }
    });
  }

  public async startPlayback(): Promise<void> {
    if (!this.audioContext) {
      await this.init();
    }

    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (this.isPlaying) return;

    this.state.tracks.forEach((track) => {
      if (track.waveformPoints.length > 0) {
        this.updateTrackBuffer(track.id, track.waveformPoints, false);
      }
    });

    this.isPlaying = true;
    this.progressAtBpmChange = 0;
    if (this.audioContext) {
      this.startTime = this.audioContext.currentTime;
    }
    this.onIsPlayingChange?.(true);

    this.scheduleAllTracks(0);
    this.startProgressUpdate();
  }

  private scheduleAllTracks(progress: number): void {
    this.state.tracks.forEach((track) => {
      if (track.waveformPoints.length > 0) {
        this.scheduleTrackPlayback(track.id, progress);
      }
    });
  }

  private scheduleTrackPlayback(trackId: string, startProgress: number): void {
    if (!this.audioContext || !this.isPlaying) return;

    const trackState = this.trackAudioStates.get(trackId);
    if (!trackState || !trackState.audioBuffer) return;

    if (trackState.bufferSource) {
      try {
        trackState.bufferSource.stop();
      } catch (e) {
        // noop
      }
      trackState.bufferSource.disconnect();
    }

    const bufferSource = this.audioContext.createBufferSource();
    bufferSource.buffer = trackState.audioBuffer;
    bufferSource.loop = true;

    const loopDuration = this.beatDuration * 4;
    bufferSource.loopStart = 0;
    bufferSource.loopEnd = loopDuration;

    bufferSource.connect(trackState.gainNode);

    const offset = startProgress * loopDuration;
    bufferSource.start(this.audioContext.currentTime, offset);

    trackState.bufferSource = bufferSource;
  }

  private startProgressUpdate(): void {
    const updateProgress = () => {
      if (!this.isPlaying) return;

      const progress = this.getCurrentProgress();
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

    this.stopAllTracks();
    this.progressAtBpmChange = 0;
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
