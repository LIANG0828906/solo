import type { Note } from '../pianoRoll';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();
  private bpm: number = 120;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private startBeat: number = 0;
  private scheduledNotes: Set<string> = new Set();
  private animationFrameId: number | null = null;
  private onProgress?: (currentBeat: number) => void;
  private onNotePlay?: (noteId: string, playing: boolean) => void;
  private onStop?: () => void;
  private notes: Note[] = [];
  private totalBeats: number = 0;

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setCallbacks(callbacks: {
    onProgress?: (currentBeat: number) => void;
    onNotePlay?: (noteId: string, playing: boolean) => void;
    onStop?: () => void;
  }) {
    this.onProgress = callbacks.onProgress;
    this.onNotePlay = callbacks.onNotePlay;
    this.onStop = callbacks.onStop;
  }

  setBPM(bpm: number) {
    this.bpm = bpm;
  }

  setNotes(notes: Note[]) {
    this.notes = notes;
    this.totalBeats = notes.length > 0 ? Math.max(...notes.map(n => n.start + n.duration)) + 1 : 4;
  }

  play(startBeat: number = 0) {
    if (!this.audioContext) this.init();
    if (!this.audioContext || !this.masterGain) return;

    this.stopAllOscillators();
    this.scheduledNotes.clear();

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;
    this.startBeat = startBeat;

    this.scheduleNotes();
    this.animateProgress();
  }

  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.stopAllOscillators();
  }

  stop() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.stopAllOscillators();
    this.onProgress?.(0);
    this.onStop?.();
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getCurrentBeat(): number {
    if (!this.audioContext) return 0;
    const elapsed = this.audioContext.currentTime - this.startTime;
    const beatsPerSecond = this.bpm / 60;
    return this.startBeat + elapsed * beatsPerSecond;
  }

  private beatToSeconds(beat: number): number {
    return beat * (60 / this.bpm);
  }

  private scheduleNotes() {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const lookAhead = 0.1;

    this.notes.forEach(note => {
      if (note.start + note.duration < this.startBeat) return;
      if (this.scheduledNotes.has(note.id)) return;

      const noteStartBeat = note.start - this.startBeat;
      const noteStartSec = this.beatToSeconds(Math.max(0, noteStartBeat));
      const noteDurationSec = this.beatToSeconds(note.duration);
      const playAt = now + noteStartSec;

      if (playAt < now + lookAhead) {
        this.scheduledNotes.add(note.id);
        this.scheduleNote(note, playAt, noteDurationSec);
      }
    });
  }

  private scheduleNote(note: Note, startTime: number, duration: number) {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    const freq = 440 * Math.pow(2, (note.pitch - 69) / 12);
    osc.frequency.value = freq;

    const attack = 0.01;
    const decay = 0.1;
    const sustain = 0.6;
    const release = 0.2;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.5, startTime + attack);
    gain.gain.linearRampToValueAtTime(0.5 * sustain, startTime + attack + decay);
    gain.gain.setValueAtTime(0.5 * sustain, startTime + duration - release);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    this.activeOscillators.set(note.id, { osc, gain });

    setTimeout(() => {
      this.onNotePlay?.(note.id, true);
    }, Math.max(0, (startTime - this.audioContext!.currentTime) * 1000));

    setTimeout(() => {
      this.onNotePlay?.(note.id, false);
      this.activeOscillators.delete(note.id);
    }, (startTime - this.audioContext!.currentTime + duration) * 1000);
  }

  private stopAllOscillators() {
    this.activeOscillators.forEach(({ osc, gain }, id) => {
      try {
        gain.gain.cancelScheduledValues(this.audioContext?.currentTime || 0);
        gain.gain.linearRampToValueAtTime(0, (this.audioContext?.currentTime || 0) + 0.05);
        osc.stop((this.audioContext?.currentTime || 0) + 0.05);
        this.onNotePlay?.(id, false);
      } catch (e) {}
    });
    this.activeOscillators.clear();
  }

  private animateProgress = () => {
    if (!this.isPlaying) return;

    const currentBeat = this.getCurrentBeat();
    this.onProgress?.(currentBeat);

    const lookAhead = 0.1;
    this.notes.forEach(note => {
      if (note.start + note.duration < this.startBeat) return;
      if (this.scheduledNotes.has(note.id)) return;

      const noteStartBeat = note.start;
      if (noteStartBeat <= currentBeat + lookAhead * (this.bpm / 60)) {
        this.scheduledNotes.add(note.id);
        const offset = (noteStartBeat - currentBeat) * (60 / this.bpm);
        this.scheduleNote(note, (this.audioContext?.currentTime || 0) + Math.max(0, offset), this.beatToSeconds(note.duration));
      }
    });

    if (currentBeat >= this.totalBeats) {
      this.stop();
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.animateProgress);
  };

  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
