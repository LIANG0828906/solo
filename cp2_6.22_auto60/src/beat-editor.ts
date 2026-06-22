import type { BeatMarker } from './types';

export class BeatEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private markers: BeatMarker[] = [];
  private duration = 0;
  private currentTime = 0;
  private zoom = 1;
  private offset = 0;
  private draggingMarker: BeatMarker | null = null;
  private waveformData: Float32Array = new Float32Array(0);
  private waveformDirty = true;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private nextId = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('dblclick', (e) => this.handleDblClick(e));
  }

  setDuration(dur: number): void {
    this.duration = dur;
    this.waveformDirty = true;
  }

  setWaveformData(data: Float32Array): void {
    this.waveformData = data;
    this.waveformDirty = true;
  }

  setCurrentTime(t: number): void {
    this.currentTime = t;
  }

  setZoom(level: number): void {
    this.zoom = Math.max(0.5, Math.min(8, level));
    this.waveformDirty = true;
  }

  setOffset(time: number): void {
    this.offset = Math.max(0, Math.min(time, this.duration - this.getVisibleDuration()));
  }

  getZoom(): number {
    return this.zoom;
  }

  getMarkers(): BeatMarker[] {
    return [...this.markers];
  }

  addMarker(time: number): BeatMarker {
    const marker: BeatMarker = {
      id: `beat_${this.nextId++}`,
      time: Math.max(0, Math.min(time, this.duration)),
      color: null,
    };
    this.markers.push(marker);
    this.markers.sort((a, b) => a.time - b.time);
    return marker;
  }

  removeMarker(id: string): void {
    this.markers = this.markers.filter(m => m.id !== id);
  }

  setMarkerColor(id: string, color: 'red' | 'blue' | 'green'): void {
    const marker = this.markers.find(m => m.id === id);
    if (marker) marker.color = color;
  }

  private getVisibleDuration(): number {
    if (this.duration <= 0) return 1;
    return this.duration / this.zoom;
  }

  private timeToX(time: number): number {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const visDur = this.getVisibleDuration();
    return ((time - this.offset) / visDur) * w;
  }

  private xToTime(x: number): number {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const visDur = this.getVisibleDuration();
    return this.offset + (x / w) * visDur;
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = this.xToTime(x);

    const nearMarker = this.findMarkerNearX(x);
    if (!nearMarker && time >= 0 && time <= this.duration) {
      this.addMarker(time);
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const nearMarker = this.findMarkerNearX(x);
    if (nearMarker) {
      this.draggingMarker = nearMarker;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.draggingMarker) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = this.xToTime(x);
    this.draggingMarker.time = Math.max(0, Math.min(time, this.duration));
  }

  private handleMouseUp(): void {
    this.draggingMarker = null;
  }

  private handleDblClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const marker = this.findMarkerNearX(x);
    if (marker) {
      const colors: Array<'red' | 'blue' | 'green'> = ['red', 'blue', 'green'];
      if (marker.color === null) {
        marker.color = 'red';
      } else {
        const idx = colors.indexOf(marker.color);
        if (idx < colors.length - 1) {
          marker.color = colors[idx + 1];
        } else {
          marker.color = null;
        }
      }
    }
  }

  private findMarkerNearX(x: number): BeatMarker | null {
    const threshold = 8;
    let closest: BeatMarker | null = null;
    let minDist = Infinity;

    for (const m of this.markers) {
      const mx = this.timeToX(m.time);
      const dist = Math.abs(mx - x);
      if (dist < threshold && dist < minDist) {
        closest = m;
        minDist = dist;
      }
    }
    return closest;
  }

  resize(w: number, h: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    this.waveformDirty = true;
  }

  render(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;

    this.ctx.clearRect(0, 0, w, h);

    this.renderWaveform(w, h);
    this.renderPlayhead(w, h);
    this.renderMarkers(w, h);
  }

  private renderWaveform(w: number, h: number): void {
    if (this.waveformData.length === 0) return;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(100, 100, 120, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();

    const visDur = this.getVisibleDuration();
    const samplesPerPx = Math.max(1, Math.floor((visDur / w) * 44100));
    const startSample = Math.floor(this.offset * 44100);

    const mid = h / 2;

    for (let x = 0; x < w; x++) {
      const sampleStart = startSample + Math.floor((x / w) * visDur * 44100);
      let min = 0, max = 0;
      const end = Math.min(sampleStart + samplesPerPx, this.waveformData.length);
      for (let s = Math.max(0, sampleStart); s < end; s++) {
        const val = this.waveformData[s];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      const yMin = mid + min * mid;
      const yMax = mid + max * mid;
      this.ctx.moveTo(x, yMin);
      this.ctx.lineTo(x, yMax);
    }

    this.ctx.stroke();
    this.ctx.restore();
  }

  private renderPlayhead(w: number, h: number): void {
    const x = this.timeToX(this.currentTime);
    if (x < 0 || x > w) return;

    const grad = this.ctx.createLinearGradient(x, 0, x, h);
    grad.addColorStop(0, 'rgba(255, 0, 128, 0.8)');
    grad.addColorStop(1, 'rgba(0, 255, 255, 0.8)');
    this.ctx.strokeStyle = grad;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, h);
    this.ctx.stroke();

    this.ctx.shadowColor = 'rgba(255, 0, 128, 0.5)';
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  private renderMarkers(w: number, _h: number): void {
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    for (const m of this.markers) {
      const x = this.timeToX(m.time);
      if (x < -10 || x > w + 10) continue;

      const isNearPlayhead = Math.abs(m.time - this.currentTime) < 0.15;
      const flashAlpha = isNearPlayhead ? 0.7 + Math.sin(performance.now() * 0.01) * 0.3 : 0.5;

      let color: string;
      switch (m.color) {
        case 'red': color = `rgba(255, 60, 60, ${flashAlpha})`; break;
        case 'blue': color = `rgba(60, 120, 255, ${flashAlpha})`; break;
        case 'green': color = `rgba(60, 255, 100, ${flashAlpha})`; break;
        default: color = `rgba(200, 200, 220, ${flashAlpha})`;
      }

      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.moveTo(x - 4, 0);
      this.ctx.lineTo(x + 4, 0);
      this.ctx.lineTo(x, 6);
      this.ctx.closePath();
      this.ctx.fill();
    }
  }
}
