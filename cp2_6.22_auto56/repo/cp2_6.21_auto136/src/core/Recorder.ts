import type { Score } from './MusicEngine';
import { midiToPitch } from './MusicEngine';

export interface RecordedNote {
  midi: number;
  pitch: string;
  timestamp: number;
}

export interface DeviationPoint {
  noteIndex: number;
  deviation: number;
  isCorrect: boolean;
}

export interface EvaluationResult {
  totalNotes: number;
  correctNotes: number;
  wrongNotes: number;
  missedNotes: number;
  accuracy: number;
  deviations: DeviationPoint[];
  meanDeviation: number;
  stdDeviation: number;
}

export class Recorder {
  private recordedNotes: RecordedNote[] = [];
  private recordingStartTime: number = 0;
  private isRecording: boolean = false;
  private readonly TIME_TOLERANCE_MS = 150;

  startRecording(): void {
    this.recordedNotes = [];
    this.isRecording = true;
    this.recordingStartTime = performance.now();
  }

  stopRecording(): void {
    this.isRecording = false;
  }

  recordNote(midi: number): void {
    if (!this.isRecording) return;
    const timestamp = performance.now() - this.recordingStartTime;
    this.recordedNotes.push({
      midi,
      pitch: midiToPitch(midi),
      timestamp,
    });
  }

  clear(): void {
    this.recordedNotes = [];
    this.isRecording = false;
  }

  getRecordedNotes(): RecordedNote[] {
    return [...this.recordedNotes];
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  evaluate(score: Score): EvaluationResult {
    const scoreNotes = score.notes;
    const totalNotes = scoreNotes.length;
    const usedRecordedIndices = new Set<number>();
    const deviations: DeviationPoint[] = [];
    let correctNotes = 0;

    for (let i = 0; i < scoreNotes.length; i++) {
      const scoreNote = scoreNotes[i];
      const expectedTimeMs = scoreNote.startTime * 1000;
      let bestMatchIdx = -1;
      let bestDiffMs = Infinity;

      for (let j = 0; j < this.recordedNotes.length; j++) {
        if (usedRecordedIndices.has(j)) continue;
        const recNote = this.recordedNotes[j];
        if (recNote.midi !== scoreNote.midi) continue;
        const diffMs = recNote.timestamp - expectedTimeMs;
        const absDiff = Math.abs(diffMs);
        if (absDiff <= this.TIME_TOLERANCE_MS && absDiff < bestDiffMs) {
          bestDiffMs = absDiff;
          bestMatchIdx = j;
        }
      }

      if (bestMatchIdx !== -1) {
        usedRecordedIndices.add(bestMatchIdx);
        correctNotes++;
        const diffMs = this.recordedNotes[bestMatchIdx].timestamp - expectedTimeMs;
        deviations.push({ noteIndex: i, deviation: diffMs, isCorrect: true });
      } else {
        deviations.push({ noteIndex: i, deviation: 0, isCorrect: false });
      }
    }

    const missedNotes = totalNotes - correctNotes;
    const wrongNotes = Math.max(0, this.recordedNotes.length - correctNotes);
    const accuracy = totalNotes > 0 ? (correctNotes / totalNotes) * 100 : 0;

    const correctDeviations = deviations
      .filter((d) => d.isCorrect)
      .map((d) => d.deviation);
    const meanDeviation =
      correctDeviations.length > 0
        ? correctDeviations.reduce((a, b) => a + b, 0) / correctDeviations.length
        : 0;
    const variance =
      correctDeviations.length > 0
        ? correctDeviations.reduce((a, b) => a + Math.pow(b - meanDeviation, 2), 0) /
          correctDeviations.length
        : 0;
    const stdDeviation = Math.sqrt(variance);

    return {
      totalNotes,
      correctNotes,
      wrongNotes,
      missedNotes,
      accuracy,
      deviations,
      meanDeviation,
      stdDeviation,
    };
  }
}
