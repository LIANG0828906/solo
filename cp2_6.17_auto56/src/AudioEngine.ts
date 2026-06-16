type OscillatorType = 'sine' | 'square' | 'sawtooth';

export interface NoteData {
  frequency: number;
  type: OscillatorType;
  duration: number;
  startTime?: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  public playNote(frequency: number, type: OscillatorType, duration: number, startTime?: number): void {
    const ctx = this.getContext();
    if (!this.masterGain) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    const start = startTime !== undefined ? startTime : ctx.currentTime;

    const attackTime = 0.01;
    const releaseTime = Math.min(0.05, duration * 0.5);
    const sustainTime = Math.max(0, duration - attackTime - releaseTime);

    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(0.8, start + attackTime);
    gainNode.gain.setValueAtTime(0.8, start + attackTime + sustainTime);
    gainNode.gain.linearRampToValueAtTime(0, start + attackTime + sustainTime + releaseTime);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);

    setTimeout(() => {
      oscillator.disconnect();
      gainNode.disconnect();
    }, (duration + 0.1) * 1000);
  }

  public playNoteSequence(
    notes: NoteData[],
    columnCallback: (colIndex: number | null) => void,
    bpm: number,
    cols: number
  ): () => void {
    const ctx = this.getContext();
    const beatDuration = 60 / bpm / 2;
    const noteDuration = beatDuration * 0.5;
    let stopped = false;

    const notesByCol: NoteData[][] = Array.from({ length: cols }, () => []);
    notes.forEach((note) => {
      const colIndex = Math.floor((note.startTime || 0) / beatDuration);
      if (colIndex >= 0 && colIndex < cols) {
        notesByCol[colIndex].push(note);
      }
    });

    const baseTime = ctx.currentTime + 0.05;

    const timeouts: number[] = [];

    for (let col = 0; col < cols; col++) {
      const colStart = baseTime + col * beatDuration;

      const highlightTimeout = window.setTimeout(() => {
        if (!stopped) {
          columnCallback(col);
        }
      }, (colStart - ctx.currentTime) * 1000);
      timeouts.push(highlightTimeout);

      notesByCol[col].forEach((note) => {
        this.playNote(note.frequency, note.type, noteDuration, colStart);
      });
    }

    const clearTimeout = window.setTimeout(() => {
      if (!stopped) {
        columnCallback(null);
      }
    }, (baseTime + cols * beatDuration - ctx.currentTime) * 1000);
    timeouts.push(clearTimeout);

    return () => {
      stopped = true;
      timeouts.forEach((t) => window.clearTimeout(t));
      columnCallback(null);
    };
  }

  public getFrequencyForPosition(col: number, row: number): number {
    const baseFrequencies = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
    const octaveOffsets = [0, 12, 24];
    const baseFreq = baseFrequencies[col % baseFrequencies.length];
    const semitoneOffset = octaveOffsets[row] || 0;
    return baseFreq * Math.pow(2, semitoneOffset / 12);
  }

  public getOscillatorType(row: number): OscillatorType {
    const types: OscillatorType[] = ['sine', 'square', 'sawtooth'];
    return types[row] || 'sine';
  }
}

export const audioEngine = new AudioEngine();
