import abcjs from 'abcjs';

export interface RenderResult {
  success: boolean;
  warnings?: Array<{ message: string; lineNumber?: number }>;
  errors?: Array<{ message: string; lineNumber?: number }>;
  visualObj?: any;
}

export interface TransposeResult {
  content: string;
  semitones: number;
}

const NOTE_MAP: Record<string, number> = {
  'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
  'c': 12, 'd': 14, 'e': 16, 'f': 17, 'g': 19, 'a': 21, 'b': 23,
};

const REVERSE_NOTE_MAP: Record<number, string> = {
  0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B',
  12: 'c', 14: 'd', 16: 'e', 17: 'f', 19: 'g', 21: 'a', 23: 'b',
};

const KEY_NAMES = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
                   'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];

export function renderAbc(
  element: HTMLElement,
  abcText: string,
  options: any = {}
): RenderResult {
  try {
    element.innerHTML = '';
    const result = abcjs.renderAbc(element, abcText, {
      responsive: 'resize',
      staffwidth: 740,
      paddingleft: 20,
      paddingright: 20,
      paddingtop: 10,
      paddingbottom: 10,
      add_classes: true,
      ...options,
    });

    const warnings: Array<{ message: string; lineNumber?: number }> = [];
    const errors: Array<{ message: string; lineNumber?: number }> = [];

    if (result && result[0]) {
      const tune = result[0];
      if (tune.warnings) {
        tune.warnings.forEach((w: any) => {
          const msg = typeof w === 'string' ? w : w.message;
          const match = msg?.match(/line\s+(\d+)/i);
          const lineNumber = match ? parseInt(match[1], 10) - 1 : undefined;
          warnings.push({ message: msg, lineNumber });
        });
      }
    }

    return {
      success: errors.length === 0,
      warnings,
      errors,
      visualObj: result,
    };
  } catch (e: any) {
    const msg = e?.message || '未知错误';
    const match = msg?.match(/line\s+(\d+)/i);
    const lineNumber = match ? parseInt(match[1], 10) - 1 : undefined;
    return {
      success: false,
      errors: [{ message: msg, lineNumber }],
    };
  }
}

export function transposeAbc(content: string, semitones: number): string {
  if (semitones === 0) return content;

  const lines = content.split('\n');
  let result: string[] = [];

  for (let line of lines) {
    if (line.match(/^K:\s*/i)) {
      const keyMatch = line.match(/^K:\s*([A-G][#b]?)(.*)/i);
      if (keyMatch) {
        const currentKey = keyMatch[1];
        const rest = keyMatch[2];
        const keyIdx = KEY_NAMES.findIndex(k => k.toLowerCase() === currentKey.toLowerCase());
        if (keyIdx !== -1) {
          let newIdx = (keyIdx + semitones + KEY_NAMES.length * 3) % KEY_NAMES.length;
          const newKey = KEY_NAMES[newIdx];
          result.push(`K:${newKey}${rest}`);
          continue;
        }
      }
    }

    if (line.match(/^[A-Z]:\s*/)) {
      result.push(line);
      continue;
    }

    result.push(transposeNotesInLine(line, semitones));
  }

  return result.join('\n');
}

function transposeNotesInLine(line: string, semitones: number): string {
  let result = '';
  let i = 0;

  while (i < line.length) {
    const ch = line[i];

    if ((ch >= 'A' && ch <= 'G') || (ch >= 'a' && ch <= 'g')) {
      let accidental = '';
      let j = i + 1;
      while (j < line.length && (line[j] === '^' || line[j] === '_' || line[j] === '=')) {
        accidental += line[j];
        j++;
      }

      let pitchOffset = 0;
      for (const a of accidental) {
        if (a === '^') pitchOffset += 1;
        else if (a === '_') pitchOffset -= 1;
      }

      const basePitch = NOTE_MAP[ch];
      if (basePitch !== undefined) {
        let newPitch = basePitch + pitchOffset + semitones;
        let octave = newPitch >= 0 ? Math.floor(newPitch / 12) : Math.floor((newPitch - 11) / 12);
        let pitchInOctave = ((newPitch % 12) + 12) % 12;

        if (octave >= 2) {
          pitchInOctave += 12;
          octave--;
        }

        let newNote = null;
        let newAccidental = '';
        const candidates = [pitchInOctave, pitchInOctave - 1, pitchInOctave + 1];
        for (const cand of candidates) {
          if (REVERSE_NOTE_MAP[cand] !== undefined) {
            newNote = REVERSE_NOTE_MAP[cand];
            const diff = pitchInOctave - cand;
            if (diff === 1) newAccidental = '^';
            else if (diff === -1) newAccidental = '_';
            break;
          }
        }

        if (newNote) {
          result += newAccidental + newNote;
          i = j;
          continue;
        }
      }

      result += ch + accidental;
      i = j;
      continue;
    }

    if (ch === "'" || ch === ',') {
      result += ch;
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

export function exportMidi(abcText: string, filename: string = 'score.mid'): void {
  try {
    const midi = abcjs.synth.getMidiFile(abcText, {
      midiOutputType: 'encoded',
    });

    const byteChars = atob(midi);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      bytes[i] = byteChars.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('MIDI导出失败:', e);
    throw new Error('MIDI导出失败: ' + (e as Error).message);
  }
}

export function exportPdf(): void {
  window.print();
}

export function getErrorLines(result: RenderResult): number[] {
  const lines = new Set<number>();
  if (result.errors) {
    result.errors.forEach(e => {
      if (e.lineNumber !== undefined) lines.add(e.lineNumber);
    });
  }
  if (result.warnings) {
    result.warnings.forEach(w => {
      if (w.lineNumber !== undefined) lines.add(w.lineNumber);
    });
  }
  return Array.from(lines);
}
