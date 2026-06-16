import { AUDIO } from '../../utils/constants';
import { generateMelodyBuffer } from '../../utils/audioUtils';
import type { AudioPlayerState } from '../../types';

export type AudioListener = (state: AudioPlayerState) => void;

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private currentWorkId: string | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pausedAt = 0;
  private duration = 0;
  private animationFrameId: number | null = null;
  private listeners = new Set<AudioListener>();
  private fadeTimeout: number | null = null;

  private ensureAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: AUDIO.sampleRate,
      });
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = 0;
      this.gainNode.connect(this.audioContext.destination);
    }
    return this.audioContext;
  }

  subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  getState(): AudioPlayerState {
    const currentTime = this.isPlaying
      ? this.pausedAt + (this.audioContext?.currentTime ?? 0) - this.startTime
      : this.pausedAt;
    return {
      isPlaying: this.isPlaying,
      currentTime: Math.min(currentTime, this.duration),
      duration: this.duration,
      currentWorkId: this.currentWorkId,
      progress: this.duration > 0 ? Math.min(currentTime / this.duration, 1) : 0,
    };
  }

  async loadFromNotes(
    workId: string,
    notes: { freq: number; duration: number }[],
  ): Promise<void> {
    const ctx = this.ensureAudioContext();
    const buffer = generateMelodyBuffer(ctx, notes);
    this.audioBuffer = buffer;
    this.duration = buffer.duration;
    this.currentWorkId = workId;
    this.pausedAt = 0;
    this.notifyListeners();
  }

  async loadFromBase64(workId: string, base64: string): Promise<void> {
    const ctx = this.ensureAudioContext();
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const buffer = await ctx.decodeAudioData(bytes.buffer);
    this.audioBuffer = buffer;
    this.duration = buffer.duration;
    this.currentWorkId = workId;
    this.pausedAt = 0;
    this.notifyListeners();
  }

  async play(): Promise<void> {
    if (!this.audioBuffer || !this.audioContext || !this.gainNode) return;

    if (this.isPlaying) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.stopCurrentSource();

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);

    const offset = this.pausedAt;
    this.startTime = this.audioContext.currentTime;
    this.pausedAt = offset;

    this.sourceNode.onended = () => {
      if (this.isPlaying && this.pausedAt + (this.audioContext!.currentTime - this.startTime) >= this.duration - 0.05) {
        this.isPlaying = false;
        this.pausedAt = 0;
        this.stopProgressTracking();
        this.notifyListeners();
      }
    };

    this.sourceNode.start(0, offset);
    this.isPlaying = true;

    this.fadeIn();
    this.startProgressTracking();
    this.notifyListeners();
  }

  pause(): void {
    if (!this.isPlaying || !this.audioContext || !this.sourceNode) return;

    this.fadeOut(() => {
      if (this.audioContext && this.sourceNode) {
        const currentTime = this.pausedAt + (this.audioContext.currentTime - this.startTime);
        this.pausedAt = Math.min(currentTime, this.duration);
        this.stopCurrentSource();
        this.isPlaying = false;
        this.stopProgressTracking();
        this.notifyListeners();
      }
    });
  }

  stop(): void {
    this.fadeOut(() => {
      this.stopCurrentSource();
      this.isPlaying = false;
      this.pausedAt = 0;
      this.stopProgressTracking();
      this.notifyListeners();
    });
  }

  seek(progress: number): void {
    if (!this.audioBuffer) return;

    const newTime = Math.max(0, Math.min(progress, 1)) * this.duration;
    const wasPlaying = this.isPlaying;

    if (wasPlaying) {
      this.stopCurrentSource();
      this.isPlaying = false;
    }

    this.pausedAt = newTime;

    if (wasPlaying) {
      this.play();
    } else {
      this.notifyListeners();
    }
  }

  async switchTrack(workId: string, notes: { freq: number; duration: number }[]): Promise<void> {
    if (this.isPlaying) {
      await new Promise<void>((resolve) => {
        this.fadeOut(() => {
          this.stopCurrentSource();
          this.isPlaying = false;
          this.stopProgressTracking();
          resolve();
        });
      });
    }

    await this.loadFromNotes(workId, notes);
    this.play();
  }

  private fadeIn(): void {
    if (!this.gainNode || !this.audioContext) return;

    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    const fadeDuration = AUDIO.fadeDuration;
    this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.5, this.audioContext.currentTime + fadeDuration);
  }

  private fadeOut(callback?: () => void): void {
    if (!this.gainNode || !this.audioContext) {
      callback?.();
      return;
    }

    const fadeDuration = AUDIO.fadeDuration;
    this.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeDuration);

    if (callback) {
      this.fadeTimeout = window.setTimeout(() => {
        this.fadeTimeout = null;
        callback();
      }, fadeDuration * 1000);
    }
  }

  private stopCurrentSource(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.onended = null;
        this.sourceNode.stop();
      } catch (e) {
        // ignore
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }

  private startProgressTracking(): void {
    const update = () => {
      this.notifyListeners();
      this.animationFrameId = requestAnimationFrame(update);
    };
    this.animationFrameId = requestAnimationFrame(update);
  }

  private stopProgressTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  destroy(): void {
    this.stopProgressTracking();
    this.stopCurrentSource();
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.listeners.clear();
  }
}

export const audioPlayer = new AudioPlayer();
