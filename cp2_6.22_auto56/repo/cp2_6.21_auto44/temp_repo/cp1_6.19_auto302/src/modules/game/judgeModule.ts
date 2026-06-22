import { Note, JudgeGrade, JudgeResult, TrackIndex, PERFECT_WINDOW, GOOD_WINDOW, KEY_MAP } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';

export class JudgeModule {
  private pendingSlides: Map<number, { startTime: number; track: TrackIndex; direction: 'up' | 'down' }> = new Map();
  private pressedKeys: Set<string> = new Set();
  private pressedTracks: Set<TrackIndex> = new Set();

  private getTrackNotes(track: TrackIndex): Note[] {
    return useGameStore
      .getState()
      .notes.filter(
        (n) =>
          n.track === track &&
          !n.judged &&
          n.type !== 'hold',
      )
      .sort((a, b) => a.hitTime - b.hitTime);
  }

  private getHoldNotes(track: TrackIndex): Note[] {
    return useGameStore
      .getState()
      .notes.filter((n) => n.track === track && !n.judged && n.type === 'hold')
      .sort((a, b) => a.hitTime - b.hitTime);
  }

  private calcGrade(timeDiff: number): JudgeGrade {
    const abs = Math.abs(timeDiff);
    if (abs <= PERFECT_WINDOW) return 'perfect';
    if (abs <= GOOD_WINDOW) return 'good';
    return null;
  }

  private applyJudge(noteId: number, grade: 'perfect' | 'good' | 'miss', track: TrackIndex) {
    const result: JudgeResult = {
      noteId,
      grade,
      timestamp: performance.now(),
      track,
    };
    useGameStore.getState().applyJudge(result);
    useGameStore.getState().updateNote(noteId, { judged: true, judgeGrade: grade });
  }

  handleKeyDown(code: string, track: TrackIndex, currentTime: number): void {
    if (this.pressedKeys.has(code)) return;
    this.pressedKeys.add(code);
    this.pressedTracks.add(track);

    const notes = this.getTrackNotes(track);
    if (notes.length === 0) return;

    const note = notes[0];
    const timeDiff = currentTime - note.hitTime;

    if (note.type === 'slide') {
      this.pendingSlides.set(note.id, {
        startTime: performance.now(),
        track,
        direction: note.slideDirection || 'up',
      });
      return;
    }

    if (note.type === 'tap') {
      const grade = this.calcGrade(timeDiff);
      if (grade === 'perfect' || grade === 'good') {
        this.applyJudge(note.id, grade, track);
      }
      return;
    }

    if (note.type === 'hold') {
      const grade = this.calcGrade(timeDiff);
      if (grade === 'perfect' || grade === 'good') {
        useGameStore.getState().updateNote(note.id, { isHolding: true, judgeGrade: grade });
      }
    }
  }

  handleKeyUp(code: string, track: TrackIndex, currentTime: number): void {
    this.pressedKeys.delete(code);

    let trackStillPressed = false;
    for (const key of this.pressedKeys) {
      if (KEY_MAP[key] === track) {
        trackStillPressed = true;
        break;
      }
    }
    if (!trackStillPressed) {
      this.pressedTracks.delete(track);
    }

    const holdNotes = this.getHoldNotes(track);
    for (const note of holdNotes) {
      if (note.isHolding && note.holdEndTime !== undefined) {
        const expectedEnd = note.holdEndTime;
        const diff = currentTime - expectedEnd;
        const abs = Math.abs(diff);
        let finalGrade: 'perfect' | 'good' | 'miss';
        if (abs <= 80 || (diff < 0 && -diff <= GOOD_WINDOW)) {
          finalGrade = note.judgeGrade === 'perfect' ? 'perfect' : 'good';
        } else {
          finalGrade = 'miss';
        }
        this.applyJudge(note.id, finalGrade, track);
      }
    }
  }

  handleArrowKey(code: string, currentTime: number): void {
    const direction = code === 'ArrowUp' ? 'up' : code === 'ArrowDown' ? 'down' : null;
    if (!direction) return;

    for (const [noteId, info] of this.pendingSlides.entries()) {
      if (info.direction === direction && performance.now() - info.startTime < 500) {
        const note = useGameStore.getState().notes.find((n) => n.id === noteId);
        if (note && !note.judged) {
          const timeDiff = currentTime - note.hitTime;
          const grade = this.calcGrade(timeDiff);
          if (grade === 'perfect' || grade === 'good') {
            this.applyJudge(noteId, grade, info.track);
          } else {
            this.applyJudge(noteId, 'miss', info.track);
          }
        }
        this.pendingSlides.delete(noteId);
        break;
      }
    }
  }

  update(currentTime: number): void {
    const state = useGameStore.getState();
    for (const note of state.notes) {
      if (note.judged) continue;
      const timeDiff = currentTime - note.hitTime;

      if (note.type === 'hold' && note.isHolding && note.holdEndTime !== undefined) {
        const holdDuration = note.holdEndTime - note.hitTime;
        const elapsed = currentTime - note.hitTime;
        const progress = Math.min(1, Math.max(0, elapsed / holdDuration));
        useGameStore.getState().updateNote(note.id, { holdProgress: progress });
        if (currentTime >= note.holdEndTime && this.pressedTracks.has(note.track)) {
          const finalGrade = note.judgeGrade === 'perfect' ? 'perfect' : 'good';
          this.applyJudge(note.id, finalGrade, note.track);
        }
      }

      if (timeDiff > GOOD_WINDOW) {
        if (note.type === 'tap' || note.type === 'slide') {
          this.applyJudge(note.id, 'miss', note.track);
        } else if (note.type === 'hold' && !note.isHolding) {
          this.applyJudge(note.id, 'miss', note.track);
        }
      }
    }

    const now = performance.now();
    for (const [noteId, info] of this.pendingSlides.entries()) {
      if (now - info.startTime > 500) {
        this.pendingSlides.delete(noteId);
      }
    }
  }

  reset(): void {
    this.pressedKeys.clear();
    this.pressedTracks.clear();
    this.pendingSlides.clear();
  }
}

export const judgeModule = new JudgeModule();
