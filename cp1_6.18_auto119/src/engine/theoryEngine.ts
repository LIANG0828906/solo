import { NoteName, ScaleRule, ChordRule, SCALES, CHORDS, createNote, getNoteFrequency } from '../data/noteData';

export interface PlacedNote {
  id: string;
  name: NoteName;
  octave: number;
  duration: string;
  x: number;
  y: number;
}

export function validateScale(userNotes: NoteName[], scale: ScaleRule): boolean {
  if (userNotes.length !== scale.notes.length) return false;
  return userNotes.every((note, i) => note === scale.notes[i]);
}

export function getChordNotes(chordName: string): NoteName[] {
  const chord = CHORDS.find((c) => c.name === chordName);
  return chord ? chord.notes : [];
}

export function exportChords(): ChordRule[] {
  return [...CHORDS];
}

export function getRandomScale(): ScaleRule {
  const idx = Math.floor(Math.random() * SCALES.length);
  return SCALES[idx];
}

export function getRandomChords(count: number): ChordRule[] {
  const shuffled = [...CHORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function snapToStaff(y: number, lineSpacing: number, topPadding: number): number {
  const relativeY = y - topPadding;
  const halfStep = lineSpacing / 2;
  const snapped = Math.round(relativeY / halfStep) * halfStep + topPadding;
  return snapped;
}

export function yToNoteName(y: number, lineSpacing: number, topPadding: number): NoteName {
  const halfStep = lineSpacing / 2;
  const relativeY = y - topPadding;
  const stepIndex = Math.round(relativeY / halfStep);
  const noteNames: NoteName[] = ['B', 'A', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'G', 'F', 'E', 'D', 'C'];
  const idx = Math.max(0, Math.min(noteNames.length - 1, stepIndex));
  return noteNames[idx];
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playNote(name: NoteName, octave: number = 4, duration: number = 0.5): void {
  const ctx = getAudioContext();
  const freq = getNoteFrequency(name, octave);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playArpeggio(names: NoteName[], octave: number = 4): void {
  names.forEach((name, i) => {
    setTimeout(() => playNote(name, octave, 0.4), i * 150);
  });
}

export function playErrorSound(): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, ctx.currentTime);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

export function playSuccessSound(): void {
  const ctx = getAudioContext();
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.3);
  });
}
