import { Note, TrackIndex, TRACK_COLORS, JUDGE_LINE_Y_RATIO } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';

export interface LayoutConfig {
  width: number;
  height: number;
  leftMargin: number;
  rightMargin: number;
  trackGap: number;
  trackWidth: number;
}

export class RenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private layout: LayoutConfig = {
    width: 1280,
    height: 720,
    leftMargin: 80,
    rightMargin: 80,
    trackGap: 40,
    trackWidth: 200,
  };
  private rafId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.layout.width = rect.width;
    this.layout.height = rect.height;

    const playableWidth = this.layout.width - this.layout.leftMargin - this.layout.rightMargin;
    this.layout.trackWidth = (playableWidth - this.layout.trackGap * 2) / 3;
  }

  getTrackX(track: TrackIndex): number {
    return (
      this.layout.leftMargin +
      (this.layout.trackWidth + this.layout.trackGap) * track +
      this.layout.trackWidth / 2
    );
  }

  getJudgeLineY(): number {
    return this.layout.height * JUDGE_LINE_Y_RATIO;
  }

  yProgressToScreen(progress: number): number {
    const jY = this.getJudgeLineY();
    return jY - (1 - progress) * jY - 50;
  }

  private drawBackground(): void {
    const { width, height } = this.layout;
    const grad = this.ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0B0B2B');
    grad.addColorStop(1, '#1A1A4A');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, width, height);
  }

  private drawTracks(): void {
    const { height, leftMargin, trackWidth, trackGap, rightMargin } = this.layout;
    const playableRight = this.layout.width - rightMargin;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const x = leftMargin + (trackWidth + trackGap) * Math.min(i, 2) + (i === 3 ? trackWidth : 0);
      const actualX = i === 3 ? playableRight : x;
      this.ctx.beginPath();
      this.ctx.moveTo(actualX, 0);
      this.ctx.lineTo(actualX, height);
      this.ctx.stroke();
    }

    for (let t = 0; t < 3; t++) {
      const centerX = this.getTrackX(t as TrackIndex);
      const trackGrad = this.ctx.createLinearGradient(centerX, 0, centerX, height);
      trackGrad.addColorStop(0, `${TRACK_COLORS[t]}08`);
      trackGrad.addColorStop(JUDGE_LINE_Y_RATIO - 0.1, `${TRACK_COLORS[t]}18`);
      trackGrad.addColorStop(JUDGE_LINE_Y_RATIO, `${TRACK_COLORS[t]}30`);
      trackGrad.addColorStop(JUDGE_LINE_Y_RATIO + 0.1, `${TRACK_COLORS[t]}18`);
      trackGrad.addColorStop(1, `${TRACK_COLORS[t]}05`);
      this.ctx.fillStyle = trackGrad;
      this.ctx.fillRect(centerX - trackWidth / 2, 0, trackWidth, height);
    }
  }

  private drawJudgeLine(): void {
    const jY = this.getJudgeLineY();
    const { leftMargin, rightMargin, width } = this.layout;
    this.ctx.strokeStyle = '#FFFFFF40';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(leftMargin, jY);
    this.ctx.lineTo(width - rightMargin, jY);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255,255,255,0.04)';
    this.ctx.fillRect(leftMargin, jY - 20, width - leftMargin - rightMargin, 40);
  }

  private drawTapNote(note: Note): void {
    const x = this.getTrackX(note.track);
    const y = this.yProgressToScreen(note.y);
    const color = TRACK_COLORS[note.track];
    const r = 20;

    const grad = this.ctx.createLinearGradient(x, y - 60, x, y);
    grad.addColorStop(0, `${color}00`);
    grad.addColorStop(1, `${color}CC`);
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.moveTo(x - r, y);
    this.ctx.lineTo(x - r, y - 60);
    this.ctx.lineTo(x + r, y - 60);
    this.ctx.lineTo(x + r, y);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(x - 5, y - 5, r * 0.4, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.fill();
  }

  private drawHoldNote(note: Note): void {
    const x = this.getTrackX(note.track);
    const yEnd = this.yProgressToScreen(note.y);
    const color = TRACK_COLORS[note.track];
    const duration = (note.holdEndTime ?? note.hitTime) - note.hitTime;
    const pxPerMs = this.getJudgeLineY() / 2000;
    const totalHeight = duration * pxPerMs;
    const yStart = yEnd - totalHeight;

    const fillProgress = Math.min(1, note.holdProgress ?? 0);
    const fillY = yEnd - totalHeight * fillProgress;

    this.ctx.fillStyle = `${color}40`;
    this.ctx.fillRect(x - 30, yStart, 60, yEnd - yStart);

    const bodyGrad = this.ctx.createLinearGradient(x - 30, 0, x + 30, 0);
    bodyGrad.addColorStop(0, `${color}00`);
    bodyGrad.addColorStop(0.2, `${color}99`);
    bodyGrad.addColorStop(0.5, `${color}CC`);
    bodyGrad.addColorStop(0.8, `${color}99`);
    bodyGrad.addColorStop(1, `${color}00`);
    this.ctx.fillStyle = bodyGrad;
    this.ctx.fillRect(x - 30, fillY, 60, yEnd - fillY);

    this.ctx.beginPath();
    this.ctx.save();
    this.ctx.translate(x, yStart);
    this.ctx.rotate(Math.PI / 4);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(-15, -15, 30, 30);
    this.ctx.restore();

    this.ctx.beginPath();
    this.ctx.save();
    this.ctx.translate(x, yEnd);
    this.ctx.rotate(Math.PI / 4);
    this.ctx.fillStyle = note.isHolding ? '#ffffff' : color;
    this.ctx.fillRect(-30, -10, 60, 20);
    this.ctx.restore();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.save();
    this.ctx.translate(x, yEnd);
    this.ctx.rotate(Math.PI / 4);
    this.ctx.strokeRect(-30, -10, 60, 20);
    this.ctx.restore();
  }

  private drawSlideNote(note: Note): void {
    const x = this.getTrackX(note.track);
    const y = this.yProgressToScreen(note.y);
    const color = TRACK_COLORS[note.track];
    const size = 50;
    const dir = note.slideDirection ?? 'up';

    const grad = this.ctx.createLinearGradient(x, y - 60, x, y);
    grad.addColorStop(0, `${color}00`);
    grad.addColorStop(1, `${color}CC`);
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.moveTo(x - size / 2, y);
    this.ctx.lineTo(x - size / 2, y - 60);
    this.ctx.lineTo(x + size / 2, y - 60);
    this.ctx.lineTo(x + size / 2, y);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    if (dir === 'up') {
      this.ctx.moveTo(x, y - size / 2);
      this.ctx.lineTo(x + size / 2, y + size / 2);
      this.ctx.lineTo(x - size / 2, y + size / 2);
    } else {
      this.ctx.moveTo(x, y + size / 2);
      this.ctx.lineTo(x + size / 2, y - size / 2);
      this.ctx.lineTo(x - size / 2, y - size / 2);
    }
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(dir === 'up' ? '↑' : '↓', x, y);
  }

  private drawNotes(): void {
    const notes = useGameStore.getState().notes;
    for (const note of notes) {
      if (note.y < -0.1 || note.y > 1.3) continue;
      switch (note.type) {
        case 'tap':
          this.drawTapNote(note);
          break;
        case 'hold':
          this.drawHoldNote(note);
          break;
        case 'slide':
          this.drawSlideNote(note);
          break;
      }
    }
  }

  private drawRipples(): void {
    const now = performance.now();
    const ripples = useGameStore.getState().ripples;
    for (const ripple of ripples) {
      const state = useGameStore.getState();
      const judgedNote = state.notes.find((n) => n.id === ripple.id) || state.notes[state.notes.length - 1];
      const track = judgedNote?.track ?? 0;
      const x = this.getTrackX(track as TrackIndex);
      const y = this.getJudgeLineY();
      const t = (now - ripple.startTime) / 300;
      if (t > 1 || t < 0) continue;
      const radius = 20 + t * 40;
      const alpha = 1 - t;
      const color = ripple.grade === 'perfect' ? '241,196,15' : '189,195,199';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(${color},${alpha})`;
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(${color},${alpha * 0.6})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private drawMissEffects(): void {
    const now = performance.now();
    const effects = useGameStore.getState().missEffects;
    for (const m of effects) {
      const t = (now - m.startTime) / 500;
      if (t > 1 || t < 0) continue;
      const state = useGameStore.getState();
      const judgedNote = state.notes.find((n) => n.id === m.id) || state.notes[0];
      const track = judgedNote?.track ?? 0;
      const x = this.getTrackX(track as TrackIndex);
      const y = this.getJudgeLineY();
      const size = 20 + t * 10;
      const alpha = 1 - t;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(Math.PI / 4 + t * 0.3);
      this.ctx.strokeStyle = `rgba(231,76,60,${alpha})`;
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(-size, 0);
      this.ctx.lineTo(size, 0);
      this.ctx.moveTo(0, -size);
      this.ctx.lineTo(0, size);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private drawComboParticles(): void {
    const now = performance.now();
    const particles = useGameStore.getState().comboParticles;
    const cx = this.layout.width / 2;
    const cy = this.layout.height * 0.4;
    for (const p of particles) {
      const t = (now - p.startTime) / 800;
      if (t > 1 || t < 0) continue;
      const alpha = 1 - t;
      const x = cx + p.vx * t * 0.8;
      const y = cy + p.vy * t * 0.8 + 200 * t * t;
      this.ctx.beginPath();
      this.ctx.arc(x, y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
      const colorStr = p.color.replace('rgb(', '').replace(')', '');
      this.ctx.fillStyle = `rgba(${colorStr},${alpha})`;
      this.ctx.fill();
    }
  }

  render = (): void => {
    this.drawBackground();
    this.drawTracks();
    this.drawJudgeLine();
    this.drawNotes();
    this.drawRipples();
    this.drawMissEffects();
    this.drawComboParticles();

    if (useGameStore.getState().isPlaying) {
      this.rafId = requestAnimationFrame(this.render);
    }
  };

  start(): void {
    if (this.rafId !== null) return;
    this.rafId = requestAnimationFrame(this.render);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getLayout(): LayoutConfig {
    return this.layout;
  }
}
