import type { Note, NoteType, TrackIndex, Beatmap, TimeSignature } from './types';

const BEATMAP_VERSION = '1.0';

export class NoteEditor {
  private beatmap: Beatmap;
  private listeners: Set<() => void> = new Set();

  constructor(initialBeatmap?: Partial<Beatmap>) {
    this.beatmap = {
      version: BEATMAP_VERSION,
      title: initialBeatmap?.title || '未命名谱面',
      bpm: initialBeatmap?.bpm ?? 120,
      timeSignature: initialBeatmap?.timeSignature ?? '4/4',
      offset: initialBeatmap?.offset ?? 0,
      notes: initialBeatmap?.notes ? [...initialBeatmap.notes] : [],
      audioFileName: initialBeatmap?.audioFileName,
    };
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  getBeatmap(): Beatmap {
    return { ...this.beatmap, notes: [...this.beatmap.notes] };
  }

  getNotes(): Note[] {
    return [...this.beatmap.notes].sort((a, b) => a.time - b.time);
  }

  getBpm(): number {
    return this.beatmap.bpm;
  }

  setBpm(bpm: number): void {
    const clamped = Math.max(60, Math.min(200, Math.round(bpm)));
    this.beatmap.bpm = clamped;
    this.notify();
  }

  getTimeSignature(): TimeSignature {
    return this.beatmap.timeSignature;
  }

  setTimeSignature(sig: TimeSignature): void {
    this.beatmap.timeSignature = sig;
    this.notify();
  }

  getOffset(): number {
    return this.beatmap.offset;
  }

  setOffset(offset: number): void {
    this.beatmap.offset = offset;
    this.notify();
  }

  getTitle(): string {
    return this.beatmap.title;
  }

  setTitle(title: string): void {
    this.beatmap.title = title;
    this.notify();
  }

  getAudioFileName(): string | undefined {
    return this.beatmap.audioFileName;
  }

  setAudioFileName(name: string | undefined): void {
    this.beatmap.audioFileName = name;
    this.notify();
  }

  getMsPerBeat(): number {
    return 60000 / this.beatmap.bpm;
  }

  getBeatsPerMeasure(): number {
    switch (this.beatmap.timeSignature) {
      case '3/4':
        return 3;
      case '6/8':
        return 6;
      case '4/4':
      default:
        return 4;
    }
  }

  getBeatGrid(snapDivision: number = 4): number[] {
    const msPerBeat = this.getMsPerBeat();
    const msPerSnap = msPerBeat / snapDivision;
    const duration = this.getDuration();
    const snaps: number[] = [];
    for (let t = 0; t <= duration + msPerBeat * 4; t += msPerSnap) {
      snaps.push(Math.round(t));
    }
    return snaps;
  }

  snapToGrid(time: number, snapDivision: number = 4): number {
    const msPerBeat = this.getMsPerBeat();
    const msPerSnap = msPerBeat / snapDivision;
    return Math.round(Math.round(time / msPerSnap) * msPerSnap);
  }

  getMeasureBeats(): Array<{ time: number; measure: number; isMeasureStart: boolean }> {
    const msPerBeat = this.getMsPerBeat();
    const beatsPerMeasure = this.getBeatsPerMeasure();
    const duration = this.getDuration();
    const result: Array<{ time: number; measure: number; isMeasureStart: boolean }> = [];
    let beat = 0;
    for (let t = 0; t <= duration + msPerBeat * 8; t += msPerBeat) {
      const measure = Math.floor(beat / beatsPerMeasure);
      result.push({
        time: Math.round(t),
        measure,
        isMeasureStart: beat % beatsPerMeasure === 0,
      });
      beat++;
    }
    return result;
  }

  getDuration(): number {
    if (this.beatmap.notes.length === 0) return 60000;
    let max = 0;
    for (const note of this.beatmap.notes) {
      const end = note.type === 'hold' && note.duration ? note.time + note.duration : note.time;
      if (end > max) max = end;
    }
    return max + 2000;
  }

  addNote(
    time: number,
    track: TrackIndex,
    type: NoteType = 'tap',
    duration?: number,
    snap: boolean = true
  ): Note {
    const finalTime = snap ? this.snapToGrid(time) : Math.round(time);
    const note: Note = {
      id: this.generateId(),
      time: finalTime,
      track,
      type,
      duration: type === 'hold' ? duration ?? 500 : undefined,
    };
    this.beatmap.notes.push(note);
    this.notify();
    return note;
  }

  updateNote(id: string, updates: Partial<Pick<Note, 'time' | 'track' | 'type' | 'duration'>>): boolean {
    const idx = this.beatmap.notes.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    const note = this.beatmap.notes[idx];
    if (updates.time !== undefined) {
      updates.time = Math.round(updates.time);
    }
    this.beatmap.notes[idx] = { ...note, ...updates };
    this.notify();
    return true;
  }

  removeNote(id: string): boolean {
    const before = this.beatmap.notes.length;
    this.beatmap.notes = this.beatmap.notes.filter((n) => n.id !== id);
    if (this.beatmap.notes.length !== before) {
      this.notify();
      return true;
    }
    return false;
  }

  clearNotes(): void {
    this.beatmap.notes = [];
    this.notify();
  }

  getNoteById(id: string): Note | undefined {
    return this.beatmap.notes.find((n) => n.id === id);
  }

  getNotesInRange(start: number, end: number): Note[] {
    return this.beatmap.notes.filter((n) => n.time >= start && n.time <= end);
  }

  exportToJSON(): string {
    const data = this.getBeatmap();
    return JSON.stringify(data, null, 2);
  }

  downloadJSON(): void {
    const json = this.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.beatmap.title || 'beatmap'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importFromJSON(json: string): Beatmap | null {
    try {
      const parsed = JSON.parse(json) as Beatmap;
      if (!parsed || typeof parsed !== 'object') return null;
      if (!Array.isArray(parsed.notes)) return null;
      this.beatmap = {
        version: parsed.version || BEATMAP_VERSION,
        title: parsed.title || '导入谱面',
        bpm: Math.max(60, Math.min(200, parsed.bpm || 120)),
        timeSignature: ['4/4', '3/4', '6/8'].includes(parsed.timeSignature)
          ? (parsed.timeSignature as TimeSignature)
          : '4/4',
        offset: parsed.offset || 0,
        notes: parsed.notes.map((n, i) => ({
          id: n.id || this.generateId() + i,
          time: Math.max(0, Math.round(n.time || 0)),
          track: (Math.max(0, Math.min(3, n.track ?? 0)) as TrackIndex),
          type: ['tap', 'hold', 'swipe'].includes(n.type) ? (n.type as NoteType) : 'tap',
          duration: n.type === 'hold' ? n.duration ?? 500 : undefined,
        })),
        audioFileName: parsed.audioFileName,
      };
      this.notify();
      return this.getBeatmap();
    } catch {
      return null;
    }
  }

  loadFromFile(file: File): Promise<Beatmap | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(this.importFromJSON(text));
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  }

  private generateId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
