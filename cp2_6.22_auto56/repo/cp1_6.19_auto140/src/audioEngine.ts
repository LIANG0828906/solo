import type { Note } from './melodyGenerator';

type PlaybackState = 'idle' | 'playing' | 'paused';

interface AudioEngineOptions {
  bpm?: number;
  onNoteStart?: (noteIndex: number) => void;
  onComplete?: () => void;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private scheduledNodes: { oscillator: OscillatorNode; gain: GainNode; stopTime: number }[] = [];
  private playbackState: PlaybackState = 'idle';
  private startTime: number = 0;
  private pausedAt: number = 0;
  private notes: Note[] = [];
  private bpm: number;
  private animationFrameId: number | null = null;
  private onNoteStart: ((noteIndex: number) => void) | null;
  private onComplete: (() => void) | null;
  private lastTriggeredNote: number = -1;

  constructor(options: AudioEngineOptions = {}) {
    this.bpm = options.bpm ?? 100;
    this.onNoteStart = options.onNoteStart ?? null;
    this.onComplete = options.onComplete ?? null;
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new Ctx();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.25;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  private midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  setOnNoteStart(callback: (noteIndex: number) => void): void {
    this.onNoteStart = callback;
  }

  setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  async play(notes: Note[]): Promise<void> {
    await this.ensureContext();
    this.stop();

    this.notes = notes;
    this.scheduledNodes = [];
    this.lastTriggeredNote = -1;

    const ctx = this.audioContext!;
    const master = this.masterGain!;
    const beatDuration = 60 / this.bpm;

    this.startTime = ctx.currentTime + 0.05;
    this.pausedAt = 0;
    this.playbackState = 'playing';

    const totalDuration = 8 * 4 * beatDuration + 1;

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = this.midiToFrequency(note.note);

      const noteStart = this.startTime + note.startTime * beatDuration;
      const noteDuration = note.duration * beatDuration;
      const noteEnd = noteStart + noteDuration;

      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.6, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.3, noteStart + noteDuration * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, noteEnd - 0.02);

      osc.connect(gain);
      gain.connect(master);

      osc.start(noteStart);
      osc.stop(noteEnd);

      this.scheduledNodes.push({ oscillator: osc, gain, stopTime: noteEnd });
    }

    this.startNoteTracking(totalDuration);
  }

  private startNoteTracking(totalDuration: number): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const beatDuration = 60 / this.bpm;

    const track = () => {
      if (this.playbackState !== 'playing' || !this.audioContext) return;

      const currentTime = this.audioContext.currentTime - this.startTime;
      const currentBeat = currentTime / beatDuration;

      for (let i = this.lastTriggeredNote + 1; i < this.notes.length; i++) {
        if (currentBeat >= this.notes[i].startTime) {
          this.lastTriggeredNote = i;
          if (this.onNoteStart) {
            this.onNoteStart(i);
          }
        } else {
          break;
        }
      }

      if (currentTime >= totalDuration) {
        this.playbackState = 'idle';
        if (this.onComplete) {
          this.onComplete();
        }
        return;
      }

      this.animationFrameId = requestAnimationFrame(track);
    };

    this.animationFrameId = requestAnimationFrame(track);
  }

  pause(): void {
    if (this.playbackState !== 'playing' || !this.audioContext) return;

    const ctx = this.audioContext;
    this.pausedAt = ctx.currentTime - this.startTime;
    this.playbackState = 'paused';

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    for (const { oscillator, gain, stopTime } of this.scheduledNodes) {
      try {
        const now = ctx.currentTime;
        if (now < stopTime) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          oscillator.stop(now + 0.06);
        }
      } catch {
        // ignore
      }
    }
    this.scheduledNodes = [];
  }

  async resume(): Promise<void> {
    if (this.playbackState !== 'paused' || !this.audioContext) return;

    const ctx = await this.ensureContext();
    const master = this.masterGain!;
    const beatDuration = 60 / this.bpm;

    this.scheduledNodes = [];
    this.startTime = ctx.currentTime - this.pausedAt;
    this.pausedAt = 0;
    this.playbackState = 'playing';

    const totalDuration = 8 * 4 * beatDuration + 1;

    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];
      const noteStart = this.startTime + note.startTime * beatDuration;
      const noteEnd = noteStart + note.duration * beatDuration;

      if (noteEnd <= ctx.currentTime + 0.01) continue;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = this.midiToFrequency(note.note);

      const effectiveStart = Math.max(noteStart, ctx.currentTime + 0.01);
      gain.gain.setValueAtTime(0, effectiveStart);
      gain.gain.linearRampToValueAtTime(0.5, effectiveStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, Math.max(noteEnd, effectiveStart + 0.05) - 0.02);

      osc.connect(gain);
      gain.connect(master);
      osc.start(effectiveStart);
      osc.stop(Math.max(noteEnd, effectiveStart + 0.05));

      this.scheduledNodes.push({ oscillator: osc, gain, stopTime: noteEnd });
    }

    this.startNoteTracking(totalDuration);
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.audioContext) {
      for (const { oscillator, gain } of this.scheduledNodes) {
        try {
          gain.gain.cancelScheduledValues(this.audioContext.currentTime);
          gain.gain.setValueAtTime(0, this.audioContext.currentTime);
          oscillator.stop();
        } catch {
          // ignore
        }
      }
    }

    this.scheduledNodes = [];
    this.playbackState = 'idle';
    this.pausedAt = 0;
    this.lastTriggeredNote = -1;
  }

  getState(): PlaybackState {
    return this.playbackState;
  }

  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
