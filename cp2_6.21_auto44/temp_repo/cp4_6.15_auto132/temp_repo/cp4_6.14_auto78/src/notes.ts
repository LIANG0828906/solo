export interface Note {
  id: string;
  trackIndex: number;
  timestamp: number;
  xOffset: number;
  createdAt: number;
}

export class NotesManager {
  static readonly MAX_NOTES = 200;
  private notes: Note[] = [];

  private generateId(): string {
    return `note_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  addNote(trackIndex: number, timestamp: number, xOffset: number): Note | null {
    if (this.notes.length >= NotesManager.MAX_NOTES) {
      return null;
    }
    const note: Note = {
      id: this.generateId(),
      trackIndex,
      timestamp: Math.max(0, timestamp),
      xOffset: Math.max(0, Math.min(1, xOffset)),
      createdAt: performance.now(),
    };
    this.notes.push(note);
    return note;
  }

  removeNote(id: string): boolean {
    const idx = this.notes.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.notes.splice(idx, 1);
    return true;
  }

  moveNote(id: string, newTrackIndex: number, newTimestamp: number): boolean {
    const note = this.notes.find((n) => n.id === id);
    if (!note) return false;
    note.trackIndex = newTrackIndex;
    note.timestamp = Math.max(0, newTimestamp);
    return true;
  }

  getNoteById(id: string): Note | undefined {
    return this.notes.find((n) => n.id === id);
  }

  getAllNotes(): Note[] {
    return [...this.notes];
  }

  getNotesByTrack(trackIndex: number): Note[] {
    return this.notes.filter((n) => n.trackIndex === trackIndex);
  }

  getNoteCount(): number {
    return this.notes.length;
  }

  clearAll(): void {
    this.notes = [];
  }

  toJSON(duration: number): {
    index: number;
    notes: { trackIndex: number; timestamp: number; xOffset: number }[];
  }[] {
    const trackMap = new Map<number, Note[]>();
    for (const note of this.notes) {
      if (!trackMap.has(note.trackIndex)) {
        trackMap.set(note.trackIndex, []);
      }
      trackMap.get(note.trackIndex)!.push(note);
    }

    const tracks: {
      index: number;
      notes: { trackIndex: number; timestamp: number; xOffset: number }[];
    }[] = [];

    for (const [idx, notes] of trackMap.entries()) {
      notes.sort((a, b) => a.timestamp - b.timestamp);
      tracks.push({
        index: idx,
        notes: notes.map((n) => ({
          trackIndex: n.trackIndex,
          timestamp: Math.min(n.timestamp, duration),
          xOffset: n.xOffset,
        })),
      });
    }

    tracks.sort((a, b) => a.index - b.index);
    return tracks;
  }
}
