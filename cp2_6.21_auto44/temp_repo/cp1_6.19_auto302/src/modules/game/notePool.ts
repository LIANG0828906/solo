import { Note, NoteType, TrackIndex, NOTE_FALL_DURATION } from '../../types/game';
import { getNextNoteId } from '../../store/useGameStore';

interface NotePoolConfig {
  initialSize?: number;
}

class NotePool {
  private pool: Note[] = [];
  private inUse: Set<number> = new Set();

  constructor(config: NotePoolConfig = {}) {
    const { initialSize = 50 } = config;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createEmptyNote());
    }
  }

  private createEmptyNote(): Note {
    return {
      id: 0,
      type: 'tap',
      track: 0,
      spawnTime: 0,
      hitTime: 0,
      y: -100,
      judged: false,
    };
  }

  acquire(params: {
    type: NoteType;
    track: TrackIndex;
    hitTime: number;
    holdEndTime?: number;
    slideDirection?: 'up' | 'down';
  }): Note {
    const { type, track, hitTime, holdEndTime, slideDirection } = params;
    let note = this.pool.find((n) => !this.inUse.has(n.id));

    if (!note) {
      note = this.createEmptyNote();
      this.pool.push(note);
    }

    const newId = getNextNoteId();
    note.id = newId;
    note.type = type;
    note.track = track;
    note.hitTime = hitTime;
    note.spawnTime = hitTime - NOTE_FALL_DURATION;
    note.holdEndTime = holdEndTime;
    note.slideDirection = slideDirection;
    note.y = -100;
    note.judged = false;
    note.judgeGrade = undefined;
    note.holdProgress = 0;
    note.isHolding = false;

    this.inUse.add(newId);
    return note;
  }

  release(id: number): void {
    this.inUse.delete(id);
    const note = this.pool.find((n) => n.id === id);
    if (note) {
      note.judged = true;
    }
  }

  reset(): void {
    this.inUse.clear();
    for (const note of this.pool) {
      note.judged = true;
      note.judgeGrade = undefined;
    }
  }

  getPoolStats() {
    return { total: this.pool.length, inUse: this.inUse.size };
  }
}

export const notePool = new NotePool({ initialSize: 80 });
