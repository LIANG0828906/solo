export interface Note {
  note: string;
  duration: number;
}

export function parseScore(scoreStr: string): Note[] {
  const parts = scoreStr.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.map((part) => {
    const [note, dur] = part.split(/\s+/);
    return {
      note,
      duration: parseInt(dur, 10) || 4,
    };
  });
}

export const DURATION_NAMES: Record<number, string> = {
  1: '全音符',
  2: '二分音符',
  4: '四分音符',
  8: '八分音符',
  16: '十六分音符',
};

export const PRESET_SCORES: Record<string, string> = {
  '小星星': 'C4 4, C4 4, G4 4, G4 4, A4 4, A4 4, G4 2, F4 4, F4 4, E4 4, E4 4, D4 4, D4 4, C4 2',
  '欢乐颂': 'E4 4, E4 4, F4 4, G4 4, G4 4, F4 4, E4 4, D4 4, C4 4, C4 4, D4 4, E4 4, E4 4, D4 2, D4 2',
  '生日快乐': 'C4 4, C4 4, D4 4, C4 4, F4 4, E4 2, C4 4, C4 4, D4 4, C4 4, G4 4, F4 2',
  '两只老虎': 'C4 4, D4 4, E4 4, C4 4, C4 4, D4 4, E4 4, C4 4, E4 4, F4 4, G4 2, E4 4, F4 4, G4 2',
};
