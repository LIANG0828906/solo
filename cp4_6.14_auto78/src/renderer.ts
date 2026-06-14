import type { WaveformData } from './audio';
import type { Note } from './notes';

export interface RendererEvents {
  onNoteAdd: (timestamp: number, xOffset: number) => void;
  onNoteMove: (noteId: string, trackIndex: number, timestamp: number) => void;
  onNoteRemove: (noteId: string) => void;
  onCurrentTrackChange: (trackIndex: number) => void;
}

interface Track {
  index: number;
  enabled: boolean;
  name: string;
}

interface RippleEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  color: string;
}

const SAMPLES_PER_FRAME = 256;
const NOTE_RADIUS = 8;
const RIPPLE_DURATION = 300;
const MIN_GRID_PX = 10;

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number = 1;
  private width: number = 0;
  private height: number = 0;

  private waveformData: WaveformData | null = null;
  private renderedSamples: number = 0;
  private animationId: number = 0;

  private notes: Note[] = [];
  private tracks: Track[] = [];
  private gridPositions: number[] = [];
  private ripples: RippleEffect[] = [];
  private duration: number = 0;

  private currentTrack: number = 0;
  private draggingNoteId: string | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private hasMoved: boolean = false;
  private isMouseDown: boolean = false;
  private mouseDownTime: number = 0;
  private mouseDownShift: boolean = false;

  private events: RendererEvents;
  private hoverTrackIndex: number = -1;

  constructor(canvas: HTMLCanvasElement, events: RendererEvents) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D rendering context');
    this.ctx = ctx;
    this.events = events;
    this.setupResize();
    this.setupInput();
    this.resize();
  }

  private setupResize(): void {
    const resizeObserver = new ResizeObserver(() => this.resize());
    resizeObserver.observe(this.canvas.parentElement!);
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private setupInput(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoverTrackIndex = -1;
    });
  }

  private getTrackAtY(y: number): number {
    if (this.tracks.length === 0) return this.currentTrack;
    const enabledTracks = this.tracks.filter((t) => t.enabled);
    if (enabledTracks.length === 0) return 0;
    const trackHeight = this.height / enabledTracks.length;
    const idx = Math.floor(y / trackHeight);
    const clamped = Math.max(0, Math.min(enabledTracks.length - 1, idx));
    return enabledTracks[clamped].index;
  }

  private getTrackYRange(trackIdx: number): { top: number; height: number } {
    const enabledTracks = this.tracks.filter((t) => t.enabled);
    if (enabledTracks.length === 0) return { top: 0, height: this.height };
    const trackHeight = this.height / enabledTracks.length;
    const posIdx = enabledTracks.findIndex((t) => t.index === trackIdx);
    const actualIdx = posIdx === -1 ? 0 : posIdx;
    return { top: actualIdx * trackHeight, height: trackHeight };
  }

  private timestampToX(timestamp: number): number {
    if (this.duration <= 0) return 0;
    return (timestamp / this.duration) * this.width;
  }

  private xToTimestamp(x: number): number {
    if (this.width <= 0) return 0;
    return (x / this.width) * this.duration;
  }

  private findNoteAt(x: number, y: number): Note | null {
    for (let i = this.notes.length - 1; i >= 0; i--) {
      const note = this.notes[i];
      const track = this.tracks.find((t) => t.index === note.trackIndex);
      if (!track || !track.enabled) continue;
      const noteX = this.timestampToX(note.timestamp);
      const range = this.getTrackYRange(note.trackIndex);
      const noteY = range.top + range.height / 2;
      const dx = x - noteX;
      const dy = y - noteY;
      if (dx * dx + dy * dy <= (NOTE_RADIUS + 6) * (NOTE_RADIUS + 6)) {
        return note;
      }
    }
    return null;
  }

  private onMouseDown(e: MouseEvent): void {
    if (!this.waveformData || this.duration <= 0) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.isMouseDown = true;
    this.hasMoved = false;
    this.mouseX = x;
    this.mouseY = y;
    this.dragStartX = x;
    this.dragStartY = y;
    this.mouseDownTime = performance.now();
    this.mouseDownShift = e.shiftKey;

    const hitNote = this.findNoteAt(x, y);
    if (hitNote) {
      this.draggingNoteId = hitNote.id;
      this.canvas.style.cursor = 'grabbing';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mouseX = x;
    this.mouseY = y;

    this.hoverTrackIndex = this.getTrackAtY(y);

    if (this.isMouseDown) {
      const dx = x - this.dragStartX;
      const dy = y - this.dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        this.hasMoved = true;
      }
    }

    if (!this.isMouseDown || this.draggingNoteId) {
      const hoverNote = this.findNoteAt(x, y);
      if (this.draggingNoteId) {
        this.canvas.style.cursor = 'grabbing';
      } else if (hoverNote) {
        this.canvas.style.cursor = e.shiftKey ? 'not-allowed' : 'grab';
      } else if (this.waveformData && this.duration > 0) {
        this.canvas.style.cursor = 'crosshair';
      } else {
        this.canvas.style.cursor = 'default';
      }
    }
  }

  private onMouseUp(e: MouseEvent): void {
    const wasDragging = this.draggingNoteId !== null;
    const dragId = this.draggingNoteId;
    const shiftPressed = this.mouseDownShift;
    const pressedTime = performance.now() - this.mouseDownTime;
    const wasClick = !this.hasMoved && pressedTime < 400;

    this.isMouseDown = false;
    this.draggingNoteId = null;
    this.canvas.style.cursor = 'crosshair';

    if (wasDragging && dragId && this.hasMoved) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const timestamp = this.xToTimestamp(x);
      const trackIdx = this.getTrackAtY(y);
      this.events.onNoteMove(dragId, trackIdx, timestamp);
      return;
    }

    if (wasClick && this.waveformData && this.duration > 0) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xClamped = Math.max(0, Math.min(this.width, x));
      const hitNote = this.findNoteAt(xClamped, y);

      if (hitNote && shiftPressed) {
        this.events.onNoteRemove(hitNote.id);
        return;
      }

      if (!hitNote) {
        const timestamp = this.xToTimestamp(xClamped);
        const trackIdx = this.getTrackAtY(y);
        this.currentTrack = trackIdx;
        this.events.onCurrentTrackChange(trackIdx);
        this.events.onNoteAdd(timestamp, xClamped / this.width);

        const range = this.getTrackYRange(trackIdx);
        this.ripples.push({
          x: this.timestampToX(timestamp),
          y: range.top + range.height / 2,
          startTime: performance.now(),
          duration: RIPPLE_DURATION,
          color: '#22c55e',
        });
      }
    }
  }

  setWaveform(data: WaveformData): void {
    this.waveformData = data;
    this.renderedSamples = 0;
    this.duration = data.duration;
  }

  setNotes(notes: Note[]): void {
    this.notes = notes;
  }

  setGridPositions(positions: number[]): void {
    this.gridPositions = positions;
  }

  setTracks(tracks: Track[]): void {
    this.tracks = tracks;
    if (this.tracks.length > 0 && !this.tracks.find((t) => t.index === this.currentTrack && t.enabled)) {
      const firstEnabled = this.tracks.find((t) => t.enabled);
      if (firstEnabled) {
        this.currentTrack = firstEnabled.index;
        this.events.onCurrentTrackChange(firstEnabled.index);
      }
    }
  }

  setCurrentTrack(idx: number): void {
    this.currentTrack = idx;
  }

  triggerRipple(noteId: string): void {
    const note = this.notes.find((n) => n.id === noteId);
    if (!note) return;
    const range = this.getTrackYRange(note.trackIndex);
    this.ripples.push({
      x: this.timestampToX(note.timestamp),
      y: range.top + range.height / 2,
      startTime: performance.now(),
      duration: RIPPLE_DURATION,
      color: '#22c55e',
    });
  }

  startRenderLoop(): void {
    const renderFrame = () => {
      this.render();
      this.animationId = requestAnimationFrame(renderFrame);
    };
    this.animationId = requestAnimationFrame(renderFrame);
  }

  destroy(): void {
    cancelAnimationFrame(this.animationId);
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground();

    if (!this.waveformData || this.duration <= 0) return;

    this.drawTrackRegions();
    this.drawGrid();
    this.progressWaveformRendering();
    this.drawWaveform();
    this.drawNotes();
    this.drawRipples();

    if (this.hoverTrackIndex >= 0 && this.draggingNoteId) {
      this.drawHoverTrackIndicator();
    }
  }

  private drawBackground(): void {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.strokeStyle = 'rgba(51, 65, 85, 0.08)';
    this.ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  private drawTrackRegions(): void {
    const enabledTracks = this.tracks.filter((t) => t.enabled);
    if (enabledTracks.length === 0) return;
    const trackHeight = this.height / enabledTracks.length;

    enabledTracks.forEach((track, i) => {
      const y = i * trackHeight;
      const isHover = this.hoverTrackIndex === track.index && this.draggingNoteId;
      const isActive = track.index === this.currentTrack;

      const bgColors = ['rgba(51, 65, 85, 0.25)', 'rgba(45, 58, 77, 0.25)'];
      this.ctx.fillStyle = bgColors[i % 2];
      if (isHover) {
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
      }
      this.ctx.fillRect(0, y, this.width, trackHeight);

      if (isActive) {
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
        this.ctx.fillRect(0, y, 4, trackHeight);
      }

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    });
  }

  private drawHoverTrackIndicator(): void {
    const range = this.getTrackYRange(this.hoverTrackIndex);
    this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([6, 4]);
    this.ctx.strokeRect(2, range.top + 2, this.width - 4, range.height - 4);
    this.ctx.setLineDash([]);
  }

  private drawGrid(): void {
    const enabledTracks = this.tracks.filter((t) => t.enabled);
    const totalHeight = this.height;
    const pps = this.duration > 0 ? this.width / this.duration : 100;
    const minPx = MIN_GRID_PX;

    for (const t of this.gridPositions) {
      const x = this.timestampToX(t);
      if (x < 0 || x > this.width) continue;

      const beatInterval = 60 / 120;
      const beat = this.gridPositions.length > 1 ? Math.abs(this.gridPositions[1] - this.gridPositions[0]) : beatInterval;
      const beatIdx = Math.round(t / beat);
      const isMajorBeat = beatIdx % 4 === 0;

      this.ctx.strokeStyle = isMajorBeat ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.03)';
      const lineXSpacing = beat * pps;
      if (lineXSpacing >= minPx * 2) {
        this.ctx.strokeStyle = isMajorBeat ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.035)';
      }

      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, totalHeight);
      this.ctx.stroke();
    }
    void enabledTracks;
  }

  private progressWaveformRendering(): void {
    if (!this.waveformData) return;
    const total = this.waveformData.length;
    if (this.renderedSamples >= total) return;
    this.renderedSamples = Math.min(total, this.renderedSamples + SAMPLES_PER_FRAME);
  }

  private drawWaveform(): void {
    if (!this.waveformData || this.renderedSamples === 0) return;

    const samples = this.waveformData.samples;
    const count = this.renderedSamples;
    const centerY = this.height / 2;
    const amp = this.height * 0.38;

    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
    this.ctx.shadowBlur = 8;

    const enabledTracks = this.tracks.filter((t) => t.enabled);
    const trackCount = Math.max(1, enabledTracks.length);
    const trackHeight = this.height / trackCount;

    const grd = this.ctx.createLinearGradient(0, 0, this.width, 0);
    grd.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
    grd.addColorStop(0.5, 'rgba(96, 165, 250, 0.95)');
    grd.addColorStop(1, 'rgba(59, 130, 246, 0.9)');
    this.ctx.strokeStyle = grd;

    for (let tIdx = 0; tIdx < trackCount; tIdx++) {
      const tCenterY = tIdx * trackHeight + trackHeight / 2;
      const tAmp = trackHeight * 0.36;

      this.ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const x = (i / (count - 1 || 1)) * this.width;
        const val = samples[i];
        const y = tCenterY - val * tAmp;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();

      this.ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const x = (i / (count - 1 || 1)) * this.width;
        const val = samples[i];
        const y = tCenterY + val * tAmp;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }
      this.ctx.stroke();
    }
    void centerY;
    void amp;

    this.ctx.shadowBlur = 0;

    if (count > 0 && count < this.waveformData.length) {
      const progressX = (count / (this.waveformData.length - 1 || 1)) * this.width;
      const scanGrd = this.ctx.createLinearGradient(progressX - 40, 0, progressX, 0);
      scanGrd.addColorStop(0, 'rgba(59, 130, 246, 0)');
      scanGrd.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
      this.ctx.fillStyle = scanGrd;
      this.ctx.fillRect(progressX - 40, 0, 40, this.height);
    }
  }

  private drawNotes(): void {
    const now = performance.now();

    for (const note of this.notes) {
      const track = this.tracks.find((t) => t.index === note.trackIndex);
      if (!track || !track.enabled) continue;

      let x = this.timestampToX(note.timestamp);
      let y: number;

      if (this.draggingNoteId === note.id) {
        x = this.mouseX;
        y = this.mouseY;
        this.drawNote(x, y, note, true, now);
      } else {
        const range = this.getTrackYRange(note.trackIndex);
        y = range.top + range.height / 2;
        this.drawNote(x, y, note, false, now);
      }
    }
  }

  private drawNote(x: number, y: number, note: Note, dragging: boolean, now: number): void {
    const trackColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const color = trackColors[note.trackIndex % trackColors.length];
    const age = now - note.createdAt;
    const appearT = Math.min(1, age / 250);
    const popScale = 0.6 + 0.4 * appearT - 0.2 * Math.sin(appearT * Math.PI);
    const alpha = dragging ? 0.55 : 1;
    const r = NOTE_RADIUS * popScale;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = dragging ? 20 : 12;

    this.ctx.beginPath();
    this.ctx.arc(x, y, r + 4, 0, Math.PI * 2);
    this.ctx.fillStyle = this.hexToRgba(color, 0.18);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    const noteGrd = this.ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    noteGrd.addColorStop(0, this.lightenColor(color, 30));
    noteGrd.addColorStop(0.6, color);
    noteGrd.addColorStop(1, this.darkenColor(color, 20));
    this.ctx.fillStyle = noteGrd;
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '600 10px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(String(note.trackIndex + 1), x, y);

    this.ctx.restore();
  }

  private drawRipples(): void {
    const now = performance.now();
    this.ripples = this.ripples.filter((r) => now - r.startTime < r.duration);

    for (const ripple of this.ripples) {
      const t = (now - ripple.startTime) / ripple.duration;
      const maxRadius = 48;
      const radius = NOTE_RADIUS + maxRadius * t;
      const alpha = 1 - t;

      this.ctx.save();
      this.ctx.strokeStyle = this.hexToRgba(ripple.color, alpha * 0.8);
      this.ctx.lineWidth = 2 * (1 - t * 0.5);
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      if (t < 0.5) {
        this.ctx.strokeStyle = this.hexToRgba(ripple.color, alpha * 0.4);
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(ripple.x, ripple.y, radius * 0.6, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private lightenColor(hex: string, percent: number): string {
    return this.adjustColor(hex, percent);
  }

  private darkenColor(hex: string, percent: number): string {
    return this.adjustColor(hex, -percent);
  }

  private adjustColor(hex: string, percent: number): string {
    const h = hex.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(h.substring(0, 2), 16) + Math.round(2.55 * percent)));
    const g = Math.max(0, Math.min(255, parseInt(h.substring(2, 4), 16) + Math.round(2.55 * percent)));
    const b = Math.max(0, Math.min(255, parseInt(h.substring(4, 6), 16) + Math.round(2.55 * percent)));
    return `rgb(${r}, ${g}, ${b})`;
  }
}
