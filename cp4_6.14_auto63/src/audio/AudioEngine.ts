import { Track } from './Track.js';
import { EffectType, AudioEngineState, PlaybackState, TrackState } from '@types/index';
import { v4 as uuidv4 } from 'uuid';

type StateListener = (state: AudioEngineState) => void;

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private context: AudioContext | null = null;
  private tracks: Map<string, Track> = new Map();
  private masterGain: GainNode | null = null;
  private masterVolume: number = 80;

  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private bpm: number = 120;

  private stateListeners: Set<StateListener> = new Set();
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private trackCounter: number = 1;

  private soloTracks: Set<string> = new Set();
  private clipboards: Map<string, AudioBuffer> = new Map();

  private constructor() {}

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  async init(): Promise<void> {
    if (this.context) return;

    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = this.masterVolume / 100;
    this.masterGain.connect(this.context.destination);
  }

  getContext(): AudioContext {
    if (!this.context) {
      throw new Error('AudioEngine not initialized');
    }
    return this.context;
  }

  async resumeContext(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.stateListeners.forEach((listener) => listener(state));
  }

  getState(): AudioEngineState {
    const tracks: TrackState[] = [];
    this.tracks.forEach((track) => {
      tracks.push(track.getState());
    });

    return {
      tracks,
      playback: {
        isPlaying: this.isPlaying,
        currentTime: this.currentTime,
        duration: this.duration,
        bpm: this.bpm,
      },
      masterVolume: this.masterVolume,
    };
  }

  getPlaybackState(): PlaybackState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      bpm: this.bpm,
    };
  }

  addTrack(name?: string): Track {
    if (!this.context) {
      throw new Error('AudioEngine not initialized');
    }

    const trackName = name || `轨道 ${this.trackCounter++}`;
    const track = new Track(this.context, trackName);

    if (this.masterGain) {
      track.connect(this.masterGain);
    }

    this.tracks.set(track.id, track);
    this.updateDuration();
    this.notifyListeners();

    return track;
  }

  removeTrack(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.stop();
    track.disconnect();
    track.destroy();
    this.tracks.delete(trackId);
    this.soloTracks.delete(trackId);
    this.updateSoloMute();
    this.updateDuration();
    this.notifyListeners();

    return true;
  }

  getTrack(trackId: string): Track | undefined {
    return this.tracks.get(trackId);
  }

  getTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  renameTrack(trackId: string, name: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.name = name;
    this.notifyListeners();
    return true;
  }

  setTrackVolume(trackId: string, volume: number): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.setVolume(volume);
    this.notifyListeners();
    return true;
  }

  setTrackPan(trackId: string, pan: number): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.setPan(pan);
    this.notifyListeners();
    return true;
  }

  toggleTrackMute(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    const muted = track.toggleMute();
    this.notifyListeners();
    return muted;
  }

  toggleTrackSolo(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    const solo = track.toggleSolo();
    if (solo) {
      this.soloTracks.add(trackId);
    } else {
      this.soloTracks.delete(trackId);
    }
    this.updateSoloMute();
    this.notifyListeners();
    return solo;
  }

  private updateSoloMute(): void {
    const hasSolo = this.soloTracks.size > 0;
    this.tracks.forEach((track) => {
      if (hasSolo) {
        track.setSoloMuted(!this.soloTracks.has(track.id));
      } else {
        track.setSoloMuted(false);
      }
    });
  }

  addEffect(trackId: string, effectType: EffectType, slotIndex: number): string | null {
    const track = this.tracks.get(trackId);
    if (!track) return null;

    const effect = track.addEffect(effectType, slotIndex);
    if (effect) {
      this.notifyListeners();
      return effect.id;
    }
    return null;
  }

  removeEffect(trackId: string, effectId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    const result = track.removeEffect(effectId);
    if (result) {
      this.notifyListeners();
    }
    return result;
  }

  setEffectParam(trackId: string, effectId: string, paramName: string, value: number): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    const effect = track.getEffect(effectId);
    if (!effect) return false;

    effect.setParam(paramName, value);
    this.notifyListeners();
    return true;
  }

  toggleEffectBypass(trackId: string, effectId: string): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    const effect = track.getEffect(effectId);
    if (!effect) return false;

    const bypassed = effect.toggleBypass();
    this.notifyListeners();
    return bypassed;
  }

  async importAudioFile(trackId: string, file: File): Promise<boolean> {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    try {
      await track.importAudioFile(file);
      this.updateDuration();
      this.notifyListeners();
      return true;
    } catch (e) {
      console.error('Failed to import audio file:', e);
      return false;
    }
  }

  async addTrackWithFile(file: File): Promise<Track | null> {
    try {
      const track = this.addTrack();
      const success = await this.importAudioFile(track.id, file);
      if (!success) {
        this.removeTrack(track.id);
        return null;
      }
      if (this.duration > 0 && this.currentTime === 0) {
        this.seek(this.duration / 2);
      }
      return track;
    } catch (e) {
      console.error('Failed to add track with file:', e);
      return null;
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(100, volume));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.masterVolume / 100,
        this.context!.currentTime,
        0.01,
      );
    }
    this.notifyListeners();
  }

  setBPM(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
    this.notifyListeners();
  }

  play(): void {
    if (this.isPlaying) return;
    if (!this.context || this.tracks.size === 0) return;

    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    this.tracks.forEach((track) => {
      track.play(this.currentTime);
    });

    this.isPlaying = true;
    this.lastUpdateTime = this.context.currentTime;
    this.startAnimationFrame();
    this.notifyListeners();
  }

  pause(): void {
    if (!this.isPlaying) return;

    this.tracks.forEach((track) => {
      this.currentTime = track.getCurrentTime();
      track.pause();
    });

    this.isPlaying = false;
    this.stopAnimationFrame();
    this.notifyListeners();
  }

  stop(): void {
    this.tracks.forEach((track) => {
      track.stop();
    });

    this.isPlaying = false;
    this.currentTime = 0;
    this.stopAnimationFrame();
    this.notifyListeners();
  }

  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(this.duration, time));

    if (this.isPlaying) {
      this.tracks.forEach((track) => {
        track.seek(this.currentTime);
      });
    }

    this.notifyListeners();
  }

  private startAnimationFrame(): void {
    const update = () => {
      if (!this.isPlaying || !this.context) return;

      const now = this.context.currentTime;
      const delta = now - this.lastUpdateTime;
      this.lastUpdateTime = now;

      if (this.tracks.size > 0) {
        const firstTrack = this.tracks.values().next().value;
        if (firstTrack) {
          this.currentTime = firstTrack.getCurrentTime();
        }
      }

      if (this.currentTime >= this.duration && this.duration > 0) {
        this.currentTime = this.duration;
        this.pause();
        return;
      }

      this.notifyListeners();
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  private stopAnimationFrame(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private updateDuration(): void {
    let maxDuration = 0;
    this.tracks.forEach((track) => {
      if (track.duration > maxDuration) {
        maxDuration = track.duration;
      }
    });
    this.duration = maxDuration;
  }

  cutSelection(trackId: string, startTime: number, endTime: number): AudioBuffer | null {
    const track = this.tracks.get(trackId);
    if (!track) return null;

    const clip = track.cutSelection(startTime, endTime);
    if (clip) {
      this.clipboards.set(trackId, clip);
      track.deleteSelection(startTime, endTime);
      this.updateDuration();
      this.notifyListeners();
    }
    return clip;
  }

  copySelection(trackId: string, startTime: number, endTime: number): AudioBuffer | null {
    const track = this.tracks.get(trackId);
    if (!track) return null;

    const clip = track.cutSelection(startTime, endTime);
    if (clip) {
      this.clipboards.set(trackId, clip);
    }
    return clip;
  }

  pasteToTrack(trackId: string, insertTime: number): boolean {
    const track = this.tracks.get(trackId);
    const clip = this.clipboards.get(trackId);
    if (!track || !clip) return false;

    track.pasteBuffer(clip, insertTime);
    this.updateDuration();
    this.notifyListeners();
    return true;
  }

  pasteToNewTrack(insertTime: number): Track | null {
    if (this.clipboards.size === 0) return null;

    const firstClip = this.clipboards.values().next().value;
    if (!firstClip) return null;

    const track = this.addTrack();
    track.setBuffer(firstClip);
    this.updateDuration();
    this.notifyListeners();
    return track;
  }

  deleteSelection(trackId: string, startTime: number, endTime: number): boolean {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    track.deleteSelection(startTime, endTime);
    this.updateDuration();
    this.notifyListeners();
    return true;
  }

  destroy(): void {
    this.stopAnimationFrame();
    this.tracks.forEach((track) => {
      track.destroy();
    });
    this.tracks.clear();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    AudioEngine.instance = null;
  }
}
