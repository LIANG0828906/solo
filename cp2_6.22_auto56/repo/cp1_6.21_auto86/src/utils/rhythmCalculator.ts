import type { Chord } from './chordParser';

export interface RhythmPattern {
  id: string;
  name: string;
  timeSignature: '4/4' | '3/4' | '6/8' | '12/8';
  beatPattern: boolean[];
  description: string;
}

export interface RhythmBlock {
  startTime: number;
  duration: number;
  chordId: string | null;
  color: string;
}

export const RHYTHM_PATTERNS: RhythmPattern[] = [
  {
    id: 'pop-4-4',
    name: '4/4拍流行',
    timeSignature: '4/4',
    beatPattern: [true, true, true, true],
    description: '标准流行节奏，每拍均匀弹奏',
  },
  {
    id: 'waltz-3-4',
    name: '3/4拍华尔兹',
    timeSignature: '3/4',
    beatPattern: [true, false, true, false, true, false],
    description: '华尔兹节奏，强弱弱',
  },
  {
    id: 'folk-6-8',
    name: '6/8拍民谣',
    timeSignature: '6/8',
    beatPattern: [true, false, true, true, false, true],
    description: '民谣分解和弦节奏',
  },
  {
    id: 'blues-12-8',
    name: '12/8拍布鲁斯',
    timeSignature: '12/8',
    beatPattern: [true, false, false, true, false, false, true, false, false, true, false, false],
    description: '布鲁斯 shuffle 节奏',
  },
];

export function generateTimeline(
  chords: Chord[],
  pattern: RhythmPattern,
  totalBeats: number
): RhythmBlock[] {
  const blocks: RhythmBlock[] = [];
  const beatsPerMeasure = parseInt(pattern.timeSignature.split('/')[0]);
  const beatUnit = parseInt(pattern.timeSignature.split('/')[1]);
  const subBeatCount = pattern.beatPattern.length;
  const subBeatDuration = (beatsPerMeasure / beatUnit) * 4 / subBeatCount;

  let currentTime = 0;
  let chordIndex = 0;

  while (currentTime < totalBeats && chordIndex < chords.length) {
    const chord = chords[chordIndex];
    const chordBeats = chord.duration;
    const subBeatsInChord = Math.ceil(chordBeats / subBeatDuration);

    for (let i = 0; i < subBeatsInChord && currentTime < totalBeats; i++) {
      const patternIndex = i % subBeatCount;
      const isPlayed = pattern.beatPattern[patternIndex];
      const blockDuration = Math.min(subBeatDuration, totalBeats - currentTime);

      blocks.push({
        startTime: currentTime,
        duration: blockDuration,
        chordId: isPlayed ? chord.id : null,
        color: isPlayed ? chord.color : 'transparent',
      });

      currentTime += blockDuration;
    }

    chordIndex++;
  }

  while (currentTime < totalBeats) {
    const blockDuration = Math.min(subBeatDuration, totalBeats - currentTime);
    blocks.push({
      startTime: currentTime,
      duration: blockDuration,
      chordId: null,
      color: 'transparent',
    });
    currentTime += blockDuration;
  }

  return blocks;
}

export function getBeatAtTime(time: number, pattern: RhythmPattern): number {
  const beatsPerMeasure = parseInt(pattern.timeSignature.split('/')[0]);
  return Math.floor(time % beatsPerMeasure);
}

export function getMeasureAtTime(time: number, pattern: RhythmPattern): number {
  const beatsPerMeasure = parseInt(pattern.timeSignature.split('/')[0]);
  return Math.floor(time / beatsPerMeasure);
}
