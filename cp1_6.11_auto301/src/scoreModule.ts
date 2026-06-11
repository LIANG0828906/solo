export interface ScoreNote {
  bellId: number;
  symbol: string;
  expectedTime: number;
  actualHitTime: number | null;
  isHit: boolean;
  isCorrect: boolean;
  rhythmDeviation: number | null;
}

export interface PerformanceResult {
  accuracy: number;
  avgRhythmDeviation: number;
  grade: '甲' | '乙' | '丙';
  title: string;
  score: number;
}

const GUQIN_SYMBOLS = ['勾', '剔', '抹', '挑', '打', '摘', '擘', '托'];

const TITLES = [
  { minScore: 90, titles: ['乐府掌钟', '雅乐博士', '司乐郎中'] },
  { minScore: 70, titles: ['乐师丞', '协律郎', '典乐事'] },
  { minScore: 0, titles: ['待诏乐工', '习乐生', '后备乐师'] },
];

export function generateScore(bellCount: number, noteCount: number, startTime: number, beatInterval: number = 1200): ScoreNote[] {
  const notes: ScoreNote[] = [];
  const usedSymbols = new Set<number>();

  for (let i = 0; i < noteCount; i++) {
    let bellId: number;
    if (i === 0 || i === noteCount - 1) {
      bellId = Math.floor(Math.random() * 8);
    } else {
      bellId = Math.floor(Math.random() * bellCount);
    }

    let symbolIndex: number;
    do {
      symbolIndex = Math.floor(Math.random() * GUQIN_SYMBOLS.length);
    } while (usedSymbols.has(symbolIndex) && usedSymbols.size < GUQIN_SYMBOLS.length);
    usedSymbols.add(symbolIndex);
    if (usedSymbols.size >= GUQIN_SYMBOLS.length) {
      usedSymbols.clear();
    }

    notes.push({
      bellId,
      symbol: GUQIN_SYMBOLS[symbolIndex],
      expectedTime: startTime + i * beatInterval,
      actualHitTime: null,
      isHit: false,
      isCorrect: false,
      rhythmDeviation: null,
    });
  }

  return notes;
}

export function checkNoteHit(
  notes: ScoreNote[],
  currentIndex: number,
  bellId: number,
  hitTime: number
): { correct: boolean; shouldAdvance: boolean; noteIndex: number } {
  if (currentIndex >= notes.length) {
    return { correct: false, shouldAdvance: false, noteIndex: -1 };
  }

  const currentNote = notes[currentIndex];
  const timeDeviation = hitTime - currentNote.expectedTime;
  const isCorrectBell = bellId === currentNote.bellId;
  const isCorrectTiming = Math.abs(timeDeviation) <= 500;

  const correct = isCorrectBell && isCorrectTiming;

  currentNote.actualHitTime = hitTime;
  currentNote.isHit = true;
  currentNote.isCorrect = correct;
  currentNote.rhythmDeviation = timeDeviation;

  return {
    correct,
    shouldAdvance: true,
    noteIndex: currentIndex,
  };
}

export function evaluatePerformance(notes: ScoreNote[]): PerformanceResult {
  const hitNotes = notes.filter(n => n.isHit);
  const correctNotes = hitNotes.filter(n => n.isCorrect);

  const accuracy = hitNotes.length > 0 ? correctNotes.length / notes.length : 0;

  const deviations = correctNotes
    .filter(n => n.rhythmDeviation !== null)
    .map(n => Math.abs(n.rhythmDeviation as number));

  const avgRhythmDeviation = deviations.length > 0
    ? deviations.reduce((a, b) => a + b, 0) / deviations.length
    : 999;

  let rhythmScore = 100;
  if (avgRhythmDeviation > 100) {
    rhythmScore = Math.max(0, 100 - (avgRhythmDeviation - 100) * 0.5);
  }

  const accuracyScore = accuracy * 100;
  const finalScore = Math.round(accuracyScore * 0.7 + rhythmScore * 0.3);

  let grade: '甲' | '乙' | '丙';
  if (finalScore >= 90) {
    grade = '甲';
  } else if (finalScore >= 70) {
    grade = '乙';
  } else {
    grade = '丙';
  }

  const titleGroup = TITLES.find(t => finalScore >= t.minScore) || TITLES[TITLES.length - 1];
  const title = titleGroup.titles[Math.floor(Math.random() * titleGroup.titles.length)];

  return {
    accuracy: Math.round(accuracy * 100) / 100,
    avgRhythmDeviation: Math.round(avgRhythmDeviation),
    grade,
    title,
    score: finalScore,
  };
}

export function getTimeWindowProgress(
  note: ScoreNote,
  currentTime: number,
  windowSize: number = 800
): number {
  const timeUntilHit = note.expectedTime - currentTime;
  if (timeUntilHit > windowSize) return 0;
  if (timeUntilHit < -windowSize / 2) return 1;
  return Math.max(0, Math.min(1, 1 - timeUntilHit / windowSize));
}
