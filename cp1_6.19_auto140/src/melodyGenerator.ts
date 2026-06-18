import type { EmotionType } from './emotionAnalyzer';

export interface Note {
  note: number;
  startTime: number;
  duration: number;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MIN_NOTE = 48;
export const MAX_NOTE = 84;
export const NOTE_RANGE = MAX_NOTE - MIN_NOTE + 1;

const SCALES: Record<EmotionType, number[]> = {
  happy: [0, 2, 4, 5, 7, 9, 11, 12],
  sad: [0, 2, 3, 5, 7, 8, 10, 12],
  calm: [0, 2, 4, 7, 9, 12, 14, 16],
  anxious: [0, 1, 3, 4, 6, 7, 9, 10]
};

const BASE_OCTAVE: Record<EmotionType, number> = {
  happy: 5,
  sad: 4,
  calm: 4,
  anxious: 5
};

function noteToMidi(octave: number, degree: number, scale: number[]): number {
  const octaveOffset = Math.floor(degree / scale.length);
  const noteInScale = degree % scale.length;
  return (octave + octaveOffset) * 12 + scale[noteInScale];
}

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const note = midi % 12;
  return `${NOTE_NAMES[note]}${octave}`;
}

export { midiToNoteName };

function createSeededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function generateMelody(
  emotion: EmotionType,
  intensity: number,
  seedText: string = ''
): Note[] {
  const seed = seedText ? hashString(seedText) : Date.now();
  const random = createSeededRandom(seed);

  const scale = SCALES[emotion];
  const baseOctave = BASE_OCTAVE[emotion];

  const notes: Note[] = [];
  const beatsPerBar = 4;
  const bars = 8;
  const totalBeats = beatsPerBar * bars;

  const beatDuration = 0.5;

  const noteDensity = emotion === 'anxious'
    ? 0.85 + intensity * 0.1
    : emotion === 'happy'
    ? 0.7 + intensity * 0.2
    : emotion === 'sad'
    ? 0.45 + intensity * 0.15
    : 0.35 + intensity * 0.2;

  const pitchRange = Math.floor(3 + intensity * 5);
  const centerDegree = Math.floor(scale.length / 2);

  let lastDegree = centerDegree;

  for (let beat = 0; beat < totalBeats; beat++) {
    const subdivisions = beat % 2 === 0 ? 2 : 1;
    const subDuration = beatDuration / subdivisions;

    for (let sub = 0; sub < subdivisions; sub++) {
      const time = beat * beatDuration + sub * subDuration;

      if (random() < noteDensity / subdivisions) {
        let degreeChange = 0;
        const direction = random();

        if (emotion === 'happy') {
          if (direction < 0.6) {
            degreeChange = Math.floor(random() * pitchRange) + 1;
          } else {
            degreeChange = -Math.floor(random() * pitchRange);
          }
        } else if (emotion === 'sad') {
          if (direction < 0.6) {
            degreeChange = -Math.floor(random() * pitchRange) - 1;
          } else {
            degreeChange = Math.floor(random() * pitchRange);
          }
        } else if (emotion === 'anxious') {
          degreeChange = (random() < 0.5 ? -1 : 1) * Math.floor(random() * pitchRange + 1);
          if (random() < 0.3) {
            degreeChange *= 2;
          }
        } else {
          if (direction < 0.5) {
            degreeChange = Math.floor(random() * pitchRange * 0.6);
          } else {
            degreeChange = -Math.floor(random() * pitchRange * 0.6);
          }
        }

        let newDegree = lastDegree + degreeChange;
        newDegree = Math.max(0, Math.min(scale.length * 2 - 1, newDegree));

        const midi = noteToMidi(baseOctave, newDegree, scale);
        const clampedMidi = Math.max(MIN_NOTE, Math.min(MAX_NOTE, midi));

        let duration: number;
        if (emotion === 'calm') {
          duration = subDuration * (1.5 + random() * 1.5);
        } else if (emotion === 'sad') {
          duration = subDuration * (1 + random() * 1.5);
        } else if (emotion === 'happy') {
          duration = subDuration * (0.8 + random() * 0.8);
        } else {
          duration = subDuration * (0.5 + random() * 0.5);
        }

        notes.push({
          note: clampedMidi,
          startTime: Math.round(time * 1000) / 1000,
          duration: Math.round(duration * 1000) / 1000
        });

        lastDegree = newDegree;
      }
    }
  }

  if (notes.length === 0) {
    notes.push({
      note: noteToMidi(baseOctave, centerDegree, scale),
      startTime: 0,
      duration: beatDuration
    });
  }

  return notes;
}
