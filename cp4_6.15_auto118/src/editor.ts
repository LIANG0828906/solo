export interface EditorNote {
  id: string;
  time: number;
  track: number;
  y: number;
  snappingTarget?: number;
  isDragging?: boolean;
}

export interface EditorState {
  notes: EditorNote[];
  currentTime: number;
  bpm: number;
  pixelsPerSecond: number;
  scrollLeft: number;
  selectedNoteId: string | null;
  isDragging: boolean;
}

export interface SnapResult {
  snappedTime: number;
  snappedBeat: number;
}

export interface GridLine {
  pixel: number;
  time: number;
  type: 'beat' | 'quarter' | 'sixteenth';
  height: number;
}

export interface DragState {
  noteId: string;
  offsetX: number;
  startX: number;
  startScrollLeft: number;
  originalTime: number;
}

export interface AnimationState {
  noteId: string;
  startTime: number;
  startValue: number;
  endValue: number;
  duration: number;
}

const ANIMATION_DURATION = 0.2;

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function spring(t: number): number {
  return 1 - Math.pow(1 - t, 3) * (1 + 3 * t);
}

export class TimelineEditor {
  private _notes: EditorNote[];
  private _bpm: number;
  private _pixelsPerSecond: number;
  private _scrollLeft: number;
  private _selectedNoteId: string | null;
  private _draggingNote: DragState | null;
  private _animations: Map<string, AnimationState>;
  private _currentTime: number;
  private _animationFrameId: number | null;

  constructor(bpm: number = 120, pixelsPerSecond: number = 100, notes: EditorNote[] = []) {
    this._notes = [...notes];
    this._bpm = bpm;
    this._pixelsPerSecond = pixelsPerSecond;
    this._scrollLeft = 0;
    this._selectedNoteId = null;
    this._draggingNote = null;
    this._animations = new Map();
    this._currentTime = 0;
    this._animationFrameId = null;
  }

  getNotes(): EditorNote[] {
    return this._notes.map(note => ({ ...note }));
  }

  getState(): EditorState {
    return {
      notes: this.getNotes(),
      currentTime: this._currentTime,
      bpm: this._bpm,
      pixelsPerSecond: this._pixelsPerSecond,
      scrollLeft: this._scrollLeft,
      selectedNoteId: this._selectedNoteId,
      isDragging: this._draggingNote !== null,
    };
  }

  addNote(time: number, track: number, y: number): EditorNote {
    const snapped = this.snapTo16th(time);
    const note: EditorNote = {
      id: generateId(),
      time: snapped.snappedTime,
      track,
      y: Math.max(0, Math.min(100, y)),
    };
    this._notes.push(note);
    return { ...note };
  }

  removeNote(id: string): boolean {
    const index = this._notes.findIndex(n => n.id === id);
    if (index === -1) return false;
    this._notes.splice(index, 1);
    if (this._selectedNoteId === id) {
      this._selectedNoteId = null;
    }
    return true;
  }

  startDrag(id: string, offsetX: number): void {
    const note = this._notes.find(n => n.id === id);
    if (!note) return;

    this._selectedNoteId = id;
    this._draggingNote = {
      noteId: id,
      offsetX,
      startX: this.timeToPixel(note.time),
      startScrollLeft: this._scrollLeft,
      originalTime: note.time,
    };

    const noteIndex = this._notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
      this._notes[noteIndex] = { ...this._notes[noteIndex], isDragging: true };
    }
  }

  updateDrag(x: number, scrollLeft: number): SnapResult | null {
    if (!this._draggingNote) return null;

    this._scrollLeft = scrollLeft;

    const pixelX = x + scrollLeft - this._draggingNote.offsetX;
    const rawTime = this.pixelToTime(pixelX);
    const snapped = this.snapTo16th(rawTime);

    const noteIndex = this._notes.findIndex(n => n.id === this._draggingNote!.noteId);
    if (noteIndex !== -1) {
      this._notes[noteIndex] = {
        ...this._notes[noteIndex],
        time: rawTime,
        snappingTarget: snapped.snappedTime,
      };
    }

    return snapped;
  }

  endDrag(): EditorNote | null {
    if (!this._draggingNote) return null;

    const noteId = this._draggingNote.noteId;
    const noteIndex = this._notes.findIndex(n => n.id === noteId);
    
    if (noteIndex === -1) {
      this._draggingNote = null;
      return null;
    }

    const note = this._notes[noteIndex];
    const snapped = this.snapTo16th(note.time);

    this._animations.set(noteId, {
      noteId,
      startTime: performance.now() / 1000,
      startValue: note.time,
      endValue: snapped.snappedTime,
      duration: ANIMATION_DURATION,
    });

    this._notes[noteIndex] = {
      ...note,
      isDragging: false,
      snappingTarget: undefined,
    };

    this._draggingNote = null;
    this._startAnimationLoop();

    return { ...this._notes[noteIndex] };
  }

  private _startAnimationLoop(): void {
    if (this._animationFrameId !== null) return;

    const animate = () => {
      const now = performance.now() / 1000;
      const completed: string[] = [];

      for (const [noteId, anim] of this._animations) {
        const elapsed = now - anim.startTime;
        const t = Math.min(1, elapsed / anim.duration);
        const eased = spring(t);
        const currentTime = anim.startValue + (anim.endValue - anim.startValue) * eased;

        const noteIndex = this._notes.findIndex(n => n.id === noteId);
        if (noteIndex !== -1) {
          this._notes[noteIndex] = { ...this._notes[noteIndex], time: currentTime };
        }

        if (t >= 1) {
          completed.push(noteId);
          if (noteIndex !== -1) {
            this._notes[noteIndex] = { ...this._notes[noteIndex], time: anim.endValue };
          }
        }
      }

      for (const id of completed) {
        this._animations.delete(id);
      }

      if (this._animations.size > 0) {
        this._animationFrameId = requestAnimationFrame(animate);
      } else {
        this._animationFrameId = null;
      }
    };

    this._animationFrameId = requestAnimationFrame(animate);
  }

  setBpm(bpm: number): void {
    this._bpm = bpm;
  }

  setPixelsPerSecond(pps: number): void {
    this._pixelsPerSecond = pps;
  }

  setScrollLeft(scrollLeft: number): void {
    this._scrollLeft = scrollLeft;
  }

  setCurrentTime(time: number): void {
    this._currentTime = time;
  }

  getBeatDuration(): number {
    return 60 / this._bpm;
  }

  get16thNoteDuration(): number {
    return this.getBeatDuration() / 4;
  }

  snapTo16th(time: number): SnapResult {
    const sixteenthDuration = this.get16thNoteDuration();
    const snappedBeat = Math.round(time / sixteenthDuration);
    const snappedTime = snappedBeat * sixteenthDuration;
    return {
      snappedTime,
      snappedBeat,
    };
  }

  timeToPixel(time: number): number {
    return time * this._pixelsPerSecond;
  }

  pixelToTime(pixel: number): number {
    return pixel / this._pixelsPerSecond;
  }

  getGridLines(startTime: number, endTime: number): GridLine[] {
    const lines: GridLine[] = [];
    const beatDuration = this.getBeatDuration();
    const sixteenthDuration = this.get16thNoteDuration();

    const startBeat = Math.floor(startTime / beatDuration);
    const endBeat = Math.ceil(endTime / beatDuration);

    for (let beat = startBeat; beat <= endBeat; beat++) {
      const beatTime = beat * beatDuration;
      lines.push({
        pixel: this.timeToPixel(beatTime),
        time: beatTime,
        type: 'beat',
        height: 1,
      });

      for (let q = 1; q < 4; q++) {
        const quarterTime = beatTime + q * (beatDuration / 4);
        if (quarterTime >= startTime && quarterTime <= endTime) {
          lines.push({
            pixel: this.timeToPixel(quarterTime),
            time: quarterTime,
            type: 'quarter',
            height: 0.6,
          });
        }
      }

      for (let s = 1; s < 16; s++) {
        if (s % 4 === 0) continue;
        const sixteenthTime = beatTime + s * sixteenthDuration;
        if (sixteenthTime >= startTime && sixteenthTime <= endTime) {
          lines.push({
            pixel: this.timeToPixel(sixteenthTime),
            time: sixteenthTime,
            type: 'sixteenth',
            height: 0.3,
          });
        }
      }
    }

    return lines;
  }

  getTotalDuration(): number {
    if (this._notes.length === 0) {
      return this.getBeatDuration() * 4;
    }
    const maxTime = Math.max(...this._notes.map(n => n.time));
    const beatDuration = this.getBeatDuration();
    const beats = Math.ceil(maxTime / beatDuration) + 2;
    return beats * beatDuration;
  }

  getSelectedNote(): EditorNote | null {
    if (!this._selectedNoteId) return null;
    const note = this._notes.find(n => n.id === this._selectedNoteId);
    return note ? { ...note } : null;
  }

  selectNote(id: string | null): void {
    this._selectedNoteId = id;
  }

  isAnimating(): boolean {
    return this._animations.size > 0;
  }

  cancelAnimation(noteId: string): void {
    this._animations.delete(noteId);
  }

  cancelAllAnimations(): void {
    this._animations.clear();
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  destroy(): void {
    this.cancelAllAnimations();
  }
}
