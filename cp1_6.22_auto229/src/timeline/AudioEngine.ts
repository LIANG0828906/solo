import type { Clip, Track } from '../types';

interface ActiveSource {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  clipId: string;
  startTime: number;
  duration: number;
  clipStart: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, ActiveSource> = new Map();
  private isPlaying = false;
  private startTime = 0;
  private startOffset = 0;
  private animationFrameId: number | null = null;
  private onPlayheadUpdate: ((time: number) => void) | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 1;
    } catch (e) {
      console.error('Web Audio API not supported:', e);
    }
  }

  public async ensureContextRunning(): Promise<void> {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public async loadSample(sampleId: string, url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(sampleId)) {
      return this.bufferCache.get(sampleId)!;
    }

    if (!this.audioContext) return null;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.bufferCache.set(sampleId, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.error('Failed to load sample:', e);
      return null;
    }
  }

  public setOnPlayheadUpdate(callback: (time: number) => void) {
    this.onPlayheadUpdate = callback;
  }

  public play(clips: Clip[], tracks: Track[], startTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    this.stopAllSources();
    this.ensureContextRunning();

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;
    this.startOffset = startTime;

    const hasSolo = tracks.some((t) => t.solo);

    clips.forEach((clip) => {
      const track = tracks.find((t) => t.id === clip.trackId);
      if (!track) return;
      if (track.muted) return;
      if (hasSolo && !track.solo) return;
      if (clip.start + clip.duration < startTime) return;

      this.scheduleClip(clip, track, startTime);
    });

    this.updatePlayhead();
  }

  private scheduleClip(clip: Clip, track: Track, playStartTime: number) {
    if (!this.audioContext || !this.masterGain) return;

    const buffer = this.bufferCache.get(clip.sampleId);
    if (!buffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    const trackVolume = track.volume;
    const clipVolume = clip.volume;
    const baseVolume = trackVolume * clipVolume;

    const clipStartInBuffer = Math.max(0, playStartTime - clip.start);
    const when = this.audioContext.currentTime;
    const offset = clipStartInBuffer;
    const duration = clip.duration - clipStartInBuffer;

    if (duration <= 0) return;

    const fadeInStart = 0;
    const fadeInEnd = Math.min(clip.fadeIn, duration);
    const fadeOutStart = Math.max(0, duration - clip.fadeOut);
    const fadeOutEnd = duration;

    gainNode.gain.setValueAtTime(0, when);

    if (fadeInEnd > 0) {
      gainNode.gain.linearRampToValueAtTime(baseVolume, when + fadeInEnd);
    } else {
      gainNode.gain.setValueAtTime(baseVolume, when);
    }

    if (fadeOutStart < duration && clip.fadeOut > 0) {
      gainNode.gain.setValueAtTime(baseVolume, when + fadeOutStart);
      gainNode.gain.linearRampToValueAtTime(0, when + fadeOutEnd);
    }

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(when, offset, duration);

    source.onended = () => {
      this.activeSources.delete(clip.id);
      source.disconnect();
      gainNode.disconnect();
    };

    this.activeSources.set(clip.id, {
      source,
      gainNode,
      clipId: clip.id,
      startTime: when,
      duration,
      clipStart: clip.start,
    });
  }

  public pause() {
    this.isPlaying = false;
    this.stopAllSources();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public stop() {
    this.pause();
    this.startOffset = 0;
    if (this.onPlayheadUpdate) {
      this.onPlayheadUpdate(0);
    }
  }

  public seek(time: number) {
    this.startOffset = time;
    if (this.onPlayheadUpdate) {
      this.onPlayheadUpdate(time);
    }
  }

  private stopAllSources() {
    this.activeSources.forEach(({ source, gainNode }) => {
      try {
        source.stop();
      } catch (e) {}
      source.disconnect();
      gainNode.disconnect();
    });
    this.activeSources.clear();
  }

  private updatePlayhead = () => {
    if (!this.isPlaying || !this.audioContext) return;

    const elapsed = this.audioContext.currentTime - this.startTime;
    const currentTime = this.startOffset + elapsed;

    if (this.onPlayheadUpdate) {
      this.onPlayheadUpdate(currentTime);
    }

    this.animationFrameId = requestAnimationFrame(this.updatePlayhead);
  };

  public setVolume(trackId: string, volume: number, clips: Clip[], tracks: Track[]) {
    if (!this.isPlaying) return;

    clips.forEach((clip) => {
      if (clip.trackId !== trackId) return;
      const active = this.activeSources.get(clip.id);
      if (active) {
        const track = tracks.find((t) => t.id === trackId);
        if (track) {
          active.gainNode.gain.value = volume * clip.volume * track.volume;
        }
      }
    });
  }

  public setFade(clipId: string, fadeIn: number, fadeOut: number, clips: Clip[], tracks: Track[]) {
    if (!this.isPlaying || !this.audioContext) return;

    const clip = clips.find((c) => c.id === clipId);
    const active = this.activeSources.get(clipId);
    if (!clip || !active) return;

    const track = tracks.find((t) => t.id === clip.trackId);
    if (!track) return;

    const baseVolume = track.volume * clip.volume;
    const now = this.audioContext.currentTime;
    const elapsed = now - active.startTime;
    const remaining = active.duration - elapsed;

    if (remaining <= 0) return;

    active.gainNode.gain.cancelScheduledValues(now);
    active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, now);

    if (fadeIn > 0 && elapsed < fadeIn) {
      active.gainNode.gain.linearRampToValueAtTime(baseVolume, active.startTime + fadeIn);
    }

    if (fadeOut > 0 && remaining > 0) {
      const fadeOutStart = active.startTime + active.duration - fadeOut;
      if (now < fadeOutStart) {
        active.gainNode.gain.setValueAtTime(baseVolume, fadeOutStart);
      }
      active.gainNode.gain.linearRampToValueAtTime(0, active.startTime + active.duration);
    }
  }

  public getCurrentTime(): number {
    if (!this.audioContext || !this.isPlaying) {
      return this.startOffset;
    }
    return this.startOffset + (this.audioContext.currentTime - this.startTime);
  }

  public clearCache() {
    this.bufferCache.clear();
  }
}

export const audioEngine = new AudioEngine();
