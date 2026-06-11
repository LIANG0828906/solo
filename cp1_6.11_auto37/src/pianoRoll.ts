import { v4 as uuidv4 } from 'uuid';

export interface Note {
  id: string;
  pitch: number;
  start: number;
  duration: number;
  selected?: boolean;
  playing?: boolean;
}

export const MIN_PITCH = 60;
export const MAX_PITCH = 72;
export const PITCH_RANGE = MAX_PITCH - MIN_PITCH + 1;
export const PX_PER_BEAT = 100;
export const PX_PER_SEMITONE = 24;
export const ROLL_CANVAS_WIDTH = 800;
export const LABEL_WIDTH = 50;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function pitchToName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  const noteIndex = pitch % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export function durationToLabel(duration: number): string {
  if (duration >= 1) return `${duration}拍`;
  return duration === 0.5 ? '八分音符' : `${duration}拍`;
}

export class PianoRollEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private notes: Note[] = [];
  private currentTime: number = 0;
  private scrollX: number = 0;
  private hoveredNoteId: string | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private onAddNote?: (note: Note) => void;
  private onUpdateNote?: (note: Note) => void;
  private onDeleteNote?: (id: string) => void;
  private onSelectionChange?: (ids: string[]) => void;
  private isDragging: boolean = false;
  private dragType: 'move-pitch' | 'move-time' | 'resize' | 'select' | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragNoteStart: number = 0;
  private dragNotePitch: number = 0;
  private dragNoteDuration: number = 0;
  private dragNoteId: string | null = null;
  private selectStartX: number = 0;
  private selectStartY: number = 0;
  private selectEndX: number = 0;
  private selectEndY: number = 0;
  private isMultiSelect: boolean = false;
  private selectedIdsBeforeDrag: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.bindEvents();
  }

  setCallbacks(callbacks: {
    onAddNote?: (note: Note) => void;
    onUpdateNote?: (note: Note) => void;
    onDeleteNote?: (id: string) => void;
    onSelectionChange?: (ids: string[]) => void;
  }) {
    this.onAddNote = callbacks.onAddNote;
    this.onUpdateNote = callbacks.onUpdateNote;
    this.onDeleteNote = callbacks.onDeleteNote;
    this.onSelectionChange = callbacks.onSelectionChange;
  }

  setNotes(notes: Note[]) {
    this.notes = notes;
    this.render();
  }

  setCurrentTime(time: number) {
    this.currentTime = time;
    this.render();
  }

  setScrollX(x: number) {
    this.scrollX = x;
    this.render();
  }

  getScrollX() {
    return this.scrollX;
  }

  getCanvasHeight() {
    return PITCH_RANGE * PX_PER_SEMITONE + 40;
  }

  private bindEvents() {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('mouseleave', this.onMouseLeave);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
  }

  private getCanvasCoords(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private screenToTime(x: number): number {
    return (x - LABEL_WIDTH + this.scrollX) / PX_PER_BEAT;
  }

  private screenToPitch(y: number): number {
    const pitchIndex = Math.floor((y - 20) / PX_PER_SEMITONE);
    return MAX_PITCH - pitchIndex;
  }

  private pitchToY(pitch: number): number {
    return 20 + (MAX_PITCH - pitch) * PX_PER_SEMITONE;
  }

  private timeToX(time: number): number {
    return LABEL_WIDTH + time * PX_PER_BEAT - this.scrollX;
  }

  private hitTestNote(x: number, y: number): { note: Note; area: 'body-left' | 'body-right' | 'body' } | null {
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      const nx = this.timeToX(note.start);
      const ny = this.pitchToY(note.pitch);
      const nw = note.duration * PX_PER_BEAT;
      const nh = PX_PER_SEMITONE - 2;

      if (x >= nx && x <= nx + nw && y >= ny && y <= ny + nh) {
        if (nw > 20 && x >= nx + nw - 10) {
          return { note, area: 'body-right' };
        }
        if (x <= nx + 10) {
          return { note, area: 'body-left' };
        }
        return { note, area: 'body' };
      }
    }
    return null;
  }

  private onMouseDown = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoords(e);
    this.mouseX = x;
    this.mouseY = y;
    this.isMultiSelect = e.ctrlKey || e.metaKey;

    if (x < LABEL_WIDTH || y < 20) return;

    const hit = this.hitTestNote(x, y);

    if (hit) {
      this.dragNoteId = hit.note.id;
      this.dragStartX = x;
      this.dragStartY = y;
      this.dragNoteStart = hit.note.start;
      this.dragNotePitch = hit.note.pitch;
      this.dragNoteDuration = hit.note.duration;
      this.selectedIdsBeforeDrag = new Set(this.notes.filter(n => n.selected).map(n => n.id));

      if (hit.area === 'body-right') {
        this.dragType = 'resize';
      } else {
        this.dragType = 'move-pitch';
      }

      if (!this.isMultiSelect && !hit.note.selected) {
        this.clearSelection();
        hit.note.selected = true;
        this.onSelectionChange?.(this.notes.filter(n => n.selected).map(n => n.id));
      } else if (this.isMultiSelect) {
        hit.note.selected = !hit.note.selected;
        this.onSelectionChange?.(this.notes.filter(n => n.selected).map(n => n.id));
      }
      this.isDragging = true;
    } else {
      if (!this.isMultiSelect) {
        this.clearSelection();
        this.onSelectionChange?.([]);
      }
      this.dragType = 'select';
      this.selectStartX = x;
      this.selectStartY = y;
      this.selectEndX = x;
      this.selectEndY = y;
      this.selectedIdsBeforeDrag = new Set(this.notes.filter(n => n.selected).map(n => n.id));
      this.isDragging = true;

      if (e.detail === 1 && !e.ctrlKey && !e.metaKey) {
        setTimeout(() => {
          if (!this.isDragging && this.dragType === null) {
            this.addNoteAt(x, y);
          }
        }, 200);
      }
    }
    this.render();
  };

  private addNoteAt(x: number, y: number) {
    const pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, this.screenToPitch(y)));
    const time = Math.max(0, Math.floor(this.screenToTime(x) * 4) / 4);
    const newNote: Note = {
      id: uuidv4(),
      pitch,
      start: time,
      duration: 1,
      selected: true
    };
    this.clearSelection();
    this.notes.push(newNote);
    this.onAddNote?.(newNote);
    this.onSelectionChange?.([newNote.id]);
    this.render();
  }

  private onMouseMove = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoords(e);
    this.mouseX = x;
    this.mouseY = y;

    const hit = this.hitTestNote(x, y);
    this.hoveredNoteId = hit ? hit.note.id : null;

    if (hit) {
      if (hit.area === 'body-right') {
        this.canvas.style.cursor = 'ew-resize';
      } else {
        this.canvas.style.cursor = 'move';
      }
    } else if (x >= LABEL_WIDTH && y >= 20) {
      this.canvas.style.cursor = 'crosshair';
    } else {
      this.canvas.style.cursor = 'default';
    }

    if (this.isDragging) {
      if (this.dragType === 'select') {
        this.selectEndX = x;
        this.selectEndY = y;
        this.updateSelectionRect();
      } else if (this.dragNoteId) {
        const dx = x - this.dragStartX;
        const dy = y - this.dragStartY;

        if (this.dragType === 'resize') {
          let newDuration = this.dragNoteDuration + dx / PX_PER_BEAT;
          newDuration = Math.max(0.25, Math.round(newDuration * 4) / 4);
          const note = this.notes.find(n => n.id === this.dragNoteId);
          if (note) {
            note.duration = newDuration;
            this.onUpdateNote?.({ ...note });
          }
        } else if (this.dragType === 'move-pitch') {
          const pitchDelta = Math.round(-dy / PX_PER_SEMITONE);
          const timeDelta = Math.round(dx / PX_PER_BEAT * 4) / 4;

          const affectedNotes = this.notes.filter(n => n.selected);
          affectedNotes.forEach(note => {
            if (note.id === this.dragNoteId) {
              let newPitch = this.dragNotePitch + pitchDelta;
              newPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, newPitch));
              note.pitch = newPitch;
              note.start = Math.max(0, this.dragNoteStart + timeDelta);
            } else {
              const originalNote = this.notes.find(n => n.id === note.id);
              if (originalNote) {
                let newPitch = originalNote.pitch + pitchDelta;
                newPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, newPitch));
                note.pitch = newPitch;
                note.start = Math.max(0, originalNote.start + timeDelta);
              }
            }
            this.onUpdateNote?.({ ...note });
          });
        }
      }
      this.render();
    } else {
      this.render();
    }
  };

  private onMouseUp = () => {
    if (this.isDragging && this.dragType === 'select' &&
        Math.abs(this.selectEndX - this.selectStartX) < 5 &&
        Math.abs(this.selectEndY - this.selectStartY) < 5) {
      if (this.mouseX >= LABEL_WIDTH && this.mouseY >= 20) {
        const hit = this.hitTestNote(this.mouseX, this.mouseY);
        if (!hit) {
          this.addNoteAt(this.mouseX, this.mouseY);
        }
      }
    }
    this.isDragging = false;
    this.dragType = null;
    this.dragNoteId = null;
    this.render();
  };

  private onMouseLeave = () => {
    this.hoveredNoteId = null;
    this.isDragging = false;
    this.dragType = null;
    this.render();
  };

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    const { x, y } = this.getCanvasCoords(e);
    const hit = this.hitTestNote(x, y);
    if (hit) {
      const deletedId = hit.note.id;
      this.notes = this.notes.filter(n => n.id !== deletedId);
      this.onDeleteNote?.(deletedId);
      this.render();
    }
  };

  private updateSelectionRect() {
    const x1 = Math.min(this.selectStartX, this.selectEndX);
    const y1 = Math.min(this.selectStartY, this.selectEndY);
    const x2 = Math.max(this.selectStartX, this.selectEndX);
    const y2 = Math.max(this.selectStartY, this.selectEndY);

    this.notes.forEach(note => {
      const nx = this.timeToX(note.start);
      const ny = this.pitchToY(note.pitch);
      const nw = note.duration * PX_PER_BEAT;
      const nh = PX_PER_SEMITONE - 2;
      const overlaps = !(nx + nw < x1 || nx > x2 || ny + nh < y1 || ny > y2);

      if (this.isMultiSelect) {
        if (overlaps) {
          note.selected = !this.selectedIdsBeforeDrag.has(note.id) ? true : false;
        } else {
          note.selected = this.selectedIdsBeforeDrag.has(note.id);
        }
      } else {
        note.selected = overlaps;
      }
    });
    this.onSelectionChange?.(this.notes.filter(n => n.selected).map(n => n.id));
  }

  private clearSelection() {
    this.notes.forEach(n => n.selected = false);
  }

  render() {
    const ctx = this.ctx;
    const height = this.getCanvasHeight();
    this.canvas.height = height;

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, this.canvas.width, height);

    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, LABEL_WIDTH, height);
    ctx.fillRect(0, 0, this.canvas.width, 20);

    for (let p = MAX_PITCH; p >= MIN_PITCH; p--) {
      const y = this.pitchToY(p);
      const isBlackKey = [1, 3, 6, 8, 10].includes(p % 12);

      ctx.fillStyle = isBlackKey ? '#1a1a3e' : '#1e2a4e';
      ctx.fillRect(LABEL_WIDTH, y, this.canvas.width - LABEL_WIDTH, PX_PER_SEMITONE);

      ctx.strokeStyle = '#2a2a4a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(LABEL_WIDTH, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();

      ctx.fillStyle = '#e0e0e0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pitchToName(p), LABEL_WIDTH / 2, y + PX_PER_SEMITONE / 2);
    }

    const maxTime = Math.max(...this.notes.map(n => n.start + n.duration), 8);
    for (let t = 0; t <= maxTime; t++) {
      const x = this.timeToX(t);
      if (x < LABEL_WIDTH || x > this.canvas.width) continue;

      ctx.strokeStyle = t % 4 === 0 ? '#5a5a7a' : '#3a3a5a';
      ctx.lineWidth = t % 4 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, height);
      ctx.stroke();

      if (t % 4 === 0) {
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${t / 4 + 1}`, x, 10);
      }
    }

    const playX = this.timeToX(this.currentTime);
    if (playX >= LABEL_WIDTH && playX <= this.canvas.width) {
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(playX, 20);
      ctx.lineTo(playX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#e94560';
      ctx.beginPath();
      ctx.moveTo(playX - 6, 10);
      ctx.lineTo(playX + 6, 10);
      ctx.lineTo(playX, 20);
      ctx.fill();
    }

    this.notes.forEach(note => {
      const nx = this.timeToX(note.start);
      const ny = this.pitchToY(note.pitch);
      const nw = note.duration * PX_PER_BEAT;
      const nh = PX_PER_SEMITONE - 2;

      let color = '#4a9eff';
      if (note.playing) color = '#ffd700';
      else if (note.selected) color = '#ff9500';

      const gradient = ctx.createLinearGradient(nx, ny, nx, ny + nh);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, this.shadeColor(color, -20));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      const radius = 3;
      ctx.roundRect(nx, ny, nw, nh, radius);
      ctx.fill();

      ctx.strokeStyle = this.shadeColor(color, 30);
      ctx.lineWidth = 1;
      ctx.stroke();

      if (nw > 30) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(pitchToName(note.pitch), nx + 5, ny + nh / 2);
      }
    });

    if (this.isDragging && this.dragType === 'select') {
      const x = Math.min(this.selectStartX, this.selectEndX);
      const y = Math.min(this.selectStartY, this.selectEndY);
      const w = Math.abs(this.selectEndX - this.selectStartX);
      const h = Math.abs(this.selectEndY - this.selectStartY);
      ctx.fillStyle = 'rgba(233, 69, 96, 0.15)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    if (this.hoveredNoteId) {
      const note = this.notes.find(n => n.id === this.hoveredNoteId);
      if (note) {
        const nx = this.timeToX(note.start);
        const ny = this.pitchToY(note.pitch);
        const tooltip = `${pitchToName(note.pitch)} | ${durationToLabel(note.duration)}`;

        ctx.font = '11px monospace';
        const tw = ctx.measureText(tooltip).width + 16;
        const th = 22;
        let tx = this.mouseX + 12;
        let ty = this.mouseY - th - 8;

        if (tx + tw > this.canvas.width) tx = this.mouseX - tw - 12;
        if (ty < 0) ty = this.mouseY + 16;

        ctx.fillStyle = 'rgba(15, 52, 96, 0.95)';
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, th, 4);
        ctx.fill();
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#e0e0e0';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tooltip, tx + 8, ty + th / 2);
      }
    }
  }

  private shadeColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }
}
