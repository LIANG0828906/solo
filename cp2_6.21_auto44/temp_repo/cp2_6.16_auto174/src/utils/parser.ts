export interface ParsedNote {
  note: string;
  duration: number;
  octave: number;
  pitch: string;
  isSharp: boolean;
  midiNumber: number;
}

export interface ParseResult {
  notes: ParsedNote[];
  error: string | null;
}

const NOTE_PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteToMidiNumber(pitch: string, octave: number, isSharp: boolean): number {
  const pitchIndex = NOTE_PITCHES.indexOf(pitch + (isSharp ? '#' : ''));
  if (pitchIndex === -1) return -1;
  return (octave + 1) * 12 + pitchIndex;
}

export function parseScore(scoreText: string): ParseResult {
  const notes: ParsedNote[] = [];
  
  if (!scoreText || scoreText.trim().length === 0) {
    return { notes: [], error: null };
  }

  const tokens = scoreText.trim().split(/\s+/);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const match = token.match(/^([A-Ga-g])(#|b)?(\d),(\d+(?:\.\d+)?)$/);
    
    if (!match) {
      return {
        notes: [],
        error: `解析错误：第 ${i + 1} 个标记 "${token}" 格式不正确。正确格式如：C4,1 或 D#5,0.5`
      };
    }

    const [, pitchChar, accidental, octaveStr, durationStr] = match;
    const pitch = pitchChar.toUpperCase();
    const octave = parseInt(octaveStr, 10);
    const duration = parseFloat(durationStr);
    const isSharp = accidental === '#';
    const isFlat = accidental === 'b';

    if (octave < 0 || octave > 8) {
      return {
        notes: [],
        error: `解析错误：八度 ${octave} 超出范围 (0-8)`
      };
    }

    if (duration <= 0) {
      return {
        notes: [],
        error: `解析错误：时值必须大于 0`
      };
    }

    let actualPitch = pitch;
    let actualIsSharp = isSharp;
    
    if (isFlat) {
      const flatMap: Record<string, { pitch: string; isSharp: boolean }> = {
        'D': { pitch: 'C', isSharp: true },
        'E': { pitch: 'D', isSharp: true },
        'G': { pitch: 'F', isSharp: true },
        'A': { pitch: 'G', isSharp: true },
        'B': { pitch: 'A', isSharp: true },
      };
      if (flatMap[pitch]) {
        actualPitch = flatMap[pitch].pitch;
        actualIsSharp = flatMap[pitch].isSharp;
      }
    }

    if (actualPitch === 'E' && actualIsSharp) {
      actualPitch = 'F';
      actualIsSharp = false;
    }
    if (actualPitch === 'B' && actualIsSharp) {
      actualPitch = 'C';
      actualIsSharp = false;
    }

    const midiNumber = noteToMidiNumber(actualPitch, octave, actualIsSharp);
    
    if (midiNumber < 21 || midiNumber > 108) {
      return {
        notes: [],
        error: `解析错误：音高 ${pitch}${accidental || ''}${octave} 超出钢琴范围 (A0-C8)`
      };
    }

    const noteStr = actualPitch + (actualIsSharp ? '#' : '') + octave;

    notes.push({
      note: noteStr,
      duration,
      octave,
      pitch: actualPitch,
      isSharp: actualIsSharp,
      midiNumber,
    });
  }

  return { notes, error: null };
}

export function midiNumberToFrequency(midiNumber: number): number {
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
}

export function getNoteName(midiNumber: number): string {
  const pitchIndex = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  return NOTE_PITCHES[pitchIndex] + octave;
}
