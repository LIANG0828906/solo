import type { InstrumentType, NoteEvent } from './instrument';
import { InstrumentEngine } from './instrument';
import type { User } from './session';

interface RippleEffect {
  x: number;
  y: number;
  startTime: number;
  color: string;
  duration: number;
}

interface GlowEffect {
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  radius: number;
  centerX: number;
  centerY: number;
  speed: number;
}

export class UIRenderer {
  private instrumentCanvas: HTMLCanvasElement;
  private instrumentCtx: CanvasRenderingContext2D;
  private bgCanvas: HTMLCanvasElement;
  private bgCtx: CanvasRenderingContext2D;
  private waveCanvas: HTMLCanvasElement;
  private waveCtx: CanvasRenderingContext2D;
  private spectrumCanvas: HTMLCanvasElement;
  private spectrumCtx: CanvasRenderingContext2D;

  private currentInstrument: InstrumentType = 'piano';
  private analyser: AnalyserNode | null = null;
  private pressedKeys: Set<string> = new Set();
  private guitarFret: number = 0;

  private ripples: RippleEffect[] = [];
  private glows: GlowEffect[] = [];
  private particles: Particle[] = [];

  private pianoKeyRects: Map<string, { x: number; y: number; w: number; h: number; isBlack: boolean }> = new Map();
  private guitarRects: Array<{ stringIdx: number; fret: number; x: number; y: number; w: number; h: number }> = [];
  private drumRects: Array<{ idx: number; x: number; y: number; w: number; h: number; pressAnim: number }> = [];

  private animationId: number = 0;
  private waveOffset: number = 0;
  private lastFrameTime: number = 0;
  private beatPulse: number = 0;

  constructor() {
    this.instrumentCanvas = document.getElementById('instrumentCanvas') as HTMLCanvasElement;
    this.bgCanvas = document.getElementById('bgCanvas') as HTMLCanvasElement;
    this.waveCanvas = document.getElementById('waveCanvas') as HTMLCanvasElement;
    this.spectrumCanvas = document.getElementById('spectrumCanvas') as HTMLCanvasElement;

    this.instrumentCtx = this.instrumentCanvas.getContext('2d')!;
    this.bgCtx = this.bgCanvas.getContext('2d')!;
    this.waveCtx = this.waveCanvas.getContext('2d')!;
    this.spectrumCtx = this.spectrumCanvas.getContext('2d')!;

    this.initParticles();
    this.resizeCanvases();
    this.bindInstrumentEvents();
    window.addEventListener('resize', () => this.resizeCanvases());
  }

  setAnalyser(analyser: AnalyserNode): void {
    this.analyser = analyser;
  }

  setInstrument(instrument: InstrumentType): void {
    this.currentInstrument = instrument;
    this.pressedKeys.clear();
    this.guitarRects = [];
    this.drumRects = [];
    this.pianoKeyRects.clear();
  }

  setPressedKeys(keys: Set<string>): void {
    this.pressedKeys = keys;
  }

  setGuitarFret(fret: number): void {
    this.guitarFret = fret;
  }

  triggerRipple(x: number, y: number, color: string): void {
    this.ripples.push({
      x, y,
      startTime: performance.now(),
      color,
      duration: 500
    });

    this.glows.push({
      x, y,
      startTime: performance.now(),
      duration: 600
    });

    this.beatPulse = 1;
  }

  private initParticles(): void {
    const count = 150;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 400;
      this.particles.push({
        x: 0, y: 0,
        vx: 0, vy: 0,
        size: 1 + Math.random() * 2,
        angle,
        radius,
        centerX: 0,
        centerY: 0,
        speed: 0.005 + Math.random() * 0.01
      });
    }
  }

  private resizeCanvases(): void {
    const dpr = window.devicePixelRatio || 1;

    const bgRect = this.bgCanvas.getBoundingClientRect();
    this.bgCanvas.width = bgRect.width * dpr;
    this.bgCanvas.height = bgRect.height * dpr;
    this.bgCtx.scale(dpr, dpr);

    const instRect = this.instrumentCanvas.getBoundingClientRect();
    this.instrumentCanvas.width = instRect.width * dpr;
    this.instrumentCanvas.height = instRect.height * dpr;
    this.instrumentCtx.scale(dpr, dpr);

    const waveRect = this.waveCanvas.getBoundingClientRect();
    this.waveCanvas.width = waveRect.width * dpr;
    this.waveCanvas.height = waveRect.height * dpr;
    this.waveCtx.scale(dpr, dpr);

    const specRect = this.spectrumCanvas.getBoundingClientRect();
    this.spectrumCanvas.width = specRect.width * dpr;
    this.spectrumCanvas.height = specRect.height * dpr;
    this.spectrumCtx.scale(dpr, dpr);

    this.particles.forEach(p => {
      p.centerX = bgRect.width / 2;
      p.centerY = bgRect.height / 2;
    });
  }

  private bindInstrumentEvents(): void {
    this.instrumentCanvas.addEventListener('pointerdown', (e) => {
      const rect = this.instrumentCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleInstrumentClick(x, y, true);
    });

    this.instrumentCanvas.addEventListener('pointerup', (e) => {
      const rect = this.instrumentCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleInstrumentClick(x, y, false);
    });

    this.instrumentCanvas.addEventListener('pointerleave', () => {
      this.currentPress = null;
    });
  }

  private currentPress: { type: InstrumentType; key: string | number } | null = null;
  private onNoteTrigger?: (event: NoteEvent, isPress: boolean) => void;

  setOnNoteTrigger(callback: (event: NoteEvent, isPress: boolean) => void): void {
    this.onNoteTrigger = callback;
  }

  private handleInstrumentClick(x: number, y: number, isPress: boolean): void {
    if (this.currentInstrument === 'piano') {
      this.handlePianoClick(x, y, isPress);
    } else if (this.currentInstrument === 'guitar') {
      this.handleGuitarClick(x, y, isPress);
    } else if (this.currentInstrument === 'drums') {
      this.handleDrumClick(x, y, isPress);
    }
  }

  private handlePianoClick(x: number, y: number, isPress: boolean): void {
    let foundKey: string | null = null;
    for (const [note, rect] of this.pianoKeyRects) {
      if (rect.isBlack && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        foundKey = note;
        break;
      }
    }
    if (!foundKey) {
      for (const [note, rect] of this.pianoKeyRects) {
        if (!rect.isBlack && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
          foundKey = note;
          break;
        }
      }
    }

    if (foundKey) {
      if (isPress) {
        this.currentPress = { type: 'piano', key: foundKey };
        this.triggerRipple(x, y, '#00BFFF');
        const event: NoteEvent = {
          instrument: 'piano',
          note: foundKey,
          velocity: 0.85,
          timestamp: performance.now()
        };
        this.onNoteTrigger?.(event, true);
      } else if (this.currentPress && this.currentPress.key === foundKey) {
        const event: NoteEvent = {
          instrument: 'piano',
          note: this.currentPress.key as string,
          velocity: 0,
          timestamp: performance.now()
        };
        this.onNoteTrigger?.(event, false);
        this.currentPress = null;
      }
    }
  }

  private handleGuitarClick(x: number, y: number, isPress: boolean): void {
    if (!isPress) {
      if (this.currentPress) {
        const event: NoteEvent = {
          instrument: 'guitar',
          note: this.currentPress.key as string,
          velocity: 0,
          timestamp: performance.now(),
          releaseDelay: 300
        };
        this.onNoteTrigger?.(event, false);
        this.currentPress = null;
      }
      return;
    }

    const rect = this.instrumentCanvas.getBoundingClientRect();
    const padding = 40;
    const width = rect.width - padding * 2;
    const height = rect.height - padding * 2;
    const stringGap = height / 5;
    const fretGap = width / 12;

    const stringIdx = Math.round((y - padding) / stringGap);
    const fretIdx = Math.min(12, Math.max(0, Math.floor((x - padding) / fretGap)));

    if (stringIdx >= 0 && stringIdx <= 5) {
      this.guitarFret = fretIdx;
      const noteKey = `${stringIdx}-${fretIdx}`;
      const actualX = padding + fretIdx * fretGap + fretGap / 2;
      const actualY = padding + stringIdx * stringGap;
      this.triggerRipple(actualX, actualY, '#00FF88');
      this.currentPress = { type: 'guitar', key: noteKey };
      const event: NoteEvent = {
        instrument: 'guitar',
        note: noteKey,
        velocity: 0.8,
        timestamp: performance.now(),
        releaseDelay: 300
      };
      this.onNoteTrigger?.(event, true);
    }
  }

  private handleDrumClick(x: number, y: number, isPress: boolean): void {
    if (!isPress) return;

    for (let i = 0; i < this.drumRects.length; i++) {
      const rect = this.drumRects[i];
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        this.triggerRipple(rect.x + rect.w / 2, rect.y + rect.h / 2, '#FFD700');
        this.drumRects[i].pressAnim = 1;
        const event: NoteEvent = {
          instrument: 'drums',
          note: i,
          velocity: 0.9,
          timestamp: performance.now()
        };
        this.onNoteTrigger?.(event, true);
        break;
      }
    }
  }

  renderUserList(users: User[], selfId: string): void {
    const container = document.getElementById('userList');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = '<div style="color:#666; font-size:12px; text-align:center; padding:20px;">加入房间后显示</div>';
      return;
    }

    container.innerHTML = users.map(user => {
      const isSelf = user.id === selfId;
      const color = isSelf ? '#00FF88' : user.color;
      const initial = user.name.charAt(0).toUpperCase();
      return `
        <div class="user-item ${isSelf ? 'user-self' : ''}" style="--user-color: ${color}">
          <div class="user-avatar" style="--user-color: ${color}">${initial}</div>
          <div class="user-name">${user.name}${isSelf ? ' (我)' : ''}</div>
        </div>
      `;
    }).join('');

    const countEl = document.getElementById('onlineCount');
    if (countEl) countEl.textContent = users.length.toString();
  }

  updateRoomInfo(roomId: string): void {
    const info = document.getElementById('roomInfo');
    const roomIdEl = document.getElementById('currentRoomId');
    if (info) info.style.display = roomId ? 'block' : 'none';
    if (roomIdEl) roomIdEl.textContent = roomId || '-';
  }

  startAnimationLoop(): void {
    const loop = (time: number) => {
      const delta = time - this.lastFrameTime;
      this.lastFrameTime = time;

      this.renderBackground();
      this.renderInstrument();
      this.renderWaveform();
      this.renderSpectrum();
      this.renderEffects();

      this.drumRects.forEach((r, i) => {
        if (r.pressAnim > 0) {
          this.drumRects[i].pressAnim = Math.max(0, r.pressAnim - delta / 200);
        }
      });

      if (this.beatPulse > 0) {
        this.beatPulse = Math.max(0, this.beatPulse - delta / 500);
      }

      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stopAnimationLoop(): void {
    cancelAnimationFrame(this.animationId);
  }

  private renderBackground(): void {
    const ctx = this.bgCtx;
    const rect = this.bgCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
    gradient.addColorStop(0, '#1F1F3A');
    gradient.addColorStop(0.5, '#1A1A2E');
    gradient.addColorStop(1, '#0F0F1A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    this.particles.forEach(p => {
      p.angle += p.speed;
      p.x = p.centerX + Math.cos(p.angle) * p.radius;
      p.y = p.centerY + Math.sin(p.angle) * p.radius * 0.6;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = '#3A3A5A';
      ctx.fill();
    });
    ctx.restore();

    if (this.beatPulse > 0) {
      const pulseR = this.beatPulse * Math.min(w, h) * 0.4;
      const pulseGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, pulseR);
      pulseGrad.addColorStop(0, `rgba(0, 191, 255, ${this.beatPulse * 0.05})`);
      pulseGrad.addColorStop(1, 'rgba(0, 191, 255, 0)');
      ctx.fillStyle = pulseGrad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private renderInstrument(): void {
    const ctx = this.instrumentCtx;
    const rect = this.instrumentCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    if (this.currentInstrument === 'piano') {
      this.renderPiano(ctx, w, h);
    } else if (this.currentInstrument === 'guitar') {
      this.renderGuitar(ctx, w, h);
    } else if (this.currentInstrument === 'drums') {
      this.renderDrums(ctx, w, h);
    }
  }

  private renderPiano(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.pianoKeyRects.clear();
    const whiteKeys = InstrumentEngine.getPianoWhiteKeys();
    const blackKeys = InstrumentEngine.getPianoBlackKeys();
    const padding = 20;
    const keyH = h - padding * 2;
    const whiteW = Math.min(45, (w - padding * 2) / whiteKeys.length);
    const totalWhiteW = whiteW * whiteKeys.length;
    const startX = (w - totalWhiteW) / 2;
    const startY = padding;

    for (let i = 0; i < whiteKeys.length; i++) {
      const x = startX + i * whiteW;
      const y = startY;
      const note = whiteKeys[i];
      const key = `piano-${note}`;
      const pressed = this.pressedKeys.has(key);

      const yOffset = pressed ? 3 : 0;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = pressed ? 5 : 10;
      ctx.shadowOffsetY = pressed ? 0 : 4;
      ctx.fillStyle = pressed ? '#FFD700' : '#F5F5F5';
      this.roundRect(ctx, x, y + yOffset, whiteW - 2, keyH - yOffset, 4);
      ctx.fill();
      ctx.strokeStyle = '#CCC';
      ctx.lineWidth = 1;
      this.roundRect(ctx, x, y + yOffset, whiteW - 2, keyH - yOffset, 4);
      ctx.stroke();
      ctx.restore();

      if (!pressed) {
        ctx.save();
        const grad = ctx.createLinearGradient(x, y, x, y + keyH);
        grad.addColorStop(0, 'rgba(255,255,255,0.3)');
        grad.addColorStop(1, 'rgba(0,0,0,0.05)');
        ctx.fillStyle = grad;
        this.roundRect(ctx, x, y, whiteW - 2, keyH, 4);
        ctx.fill();
        ctx.restore();
      }

      this.pianoKeyRects.set(note, { x, y, w: whiteW - 2, h: keyH, isBlack: false });
    }

    const blackW = whiteW * 0.6;
    const blackH = keyH * 0.6;
    const blackPositions = [0, 1, 3, 4, 5, 7, 8, 10, 11, 12];

    for (let i = 0; i < blackKeys.length; i++) {
      const whiteIdx = blackPositions[i];
      const x = startX + (whiteIdx + 1) * whiteW - blackW / 2 - 1;
      const y = startY;
      const note = blackKeys[i];
      const key = `piano-${note}`;
      const pressed = this.pressedKeys.has(key);

      const yOffset = pressed ? 3 : 0;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = pressed ? 3 : 8;
      ctx.shadowOffsetY = pressed ? 0 : 3;
      ctx.fillStyle = pressed ? '#FFD700' : '#333333';
      this.roundRect(ctx, x, y + yOffset, blackW, blackH - yOffset, 3);
      ctx.fill();
      ctx.restore();

      this.pianoKeyRects.set(note, { x, y, w: blackW, h: blackH, isBlack: true });
    }
  }

  private renderGuitar(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.guitarRects = [];
    const padding = 50;
    const width = w - padding * 2;
    const height = h - padding * 2;
    const fretCount = 12;
    const stringCount = 6;
    const stringGap = height / (stringCount - 1);
    const fretGap = width / fretCount;

    ctx.save();
    ctx.strokeStyle = '#4A4A6A';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding - 20, width, height + 40);

    const bodyGrad = ctx.createLinearGradient(padding, padding, padding + width, padding + height);
    bodyGrad.addColorStop(0, 'rgba(139, 90, 43, 0.1)');
    bodyGrad.addColorStop(0.5, 'rgba(160, 120, 70, 0.08)');
    bodyGrad.addColorStop(1, 'rgba(100, 60, 30, 0.12)');
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(padding, padding - 20, width, height + 40);

    ctx.strokeStyle = '#6A6A8A';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= fretCount; i++) {
      const x = padding + i * fretGap;
      ctx.beginPath();
      ctx.moveTo(x, padding - 20);
      ctx.lineTo(x, padding + height + 20);
      ctx.stroke();

      if (i > 0 && i < fretCount) {
        ctx.fillStyle = '#888';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), x + fretGap / 2, padding + height + 35);
      }
    }

    for (let i = 0; i < stringCount; i++) {
      const y = padding + i * stringGap;
      const stringThickness = 1 + (stringCount - i) * 0.3;
      const key = `guitar-${i}-${this.guitarFret}`;
      const pressed = this.pressedKeys.has(key);

      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.strokeStyle = pressed ? '#00FF88' : (i < 3 ? '#D0D0D0' : '#A0A0A0');
      ctx.lineWidth = stringThickness;
      if (pressed) ctx.shadowColor = '#00FF88', ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;

      this.guitarRects.push({
        stringIdx: i,
        fret: this.guitarFret,
        x: padding,
        y: y - stringGap / 2,
        w: width,
        h: stringGap
      });
    }

    const fretX = padding + this.guitarFret * fretGap + fretGap / 2;
    for (let i = 0; i < stringCount; i++) {
      const y = padding + i * stringGap;
      const key = `guitar-${i}-${this.guitarFret}`;
      const pressed = this.pressedKeys.has(key);
      ctx.beginPath();
      ctx.arc(fretX, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = pressed ? '#00FF88' : '#4A90D9';
      ctx.shadowColor = pressed ? '#00FF88' : '#4A90D9';
      ctx.shadowBlur = pressed ? 20 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(fretX, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFF';
      ctx.fill();
    }

    const fretHighlightX = padding + this.guitarFret * fretGap;
    ctx.fillStyle = 'rgba(0, 191, 255, 0.1)';
    ctx.fillRect(fretHighlightX, padding - 20, fretGap, height + 40);
    ctx.strokeStyle = 'rgba(0, 191, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(fretHighlightX, padding - 20, fretGap, height + 40);

    ctx.restore();

    ctx.fillStyle = '#AAA';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    const noteNames = ['E', 'A', 'D', 'G', 'B', 'E'];
    for (let i = 0; i < stringCount; i++) {
      const y = padding + i * stringGap;
      ctx.fillText(noteNames[i], padding - 20, y + 4);
      ctx.fillText((i + 1).toString(), padding + width + 20, y + 4);
    }
  }

  private renderDrums(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const drumPads = InstrumentEngine.getDrumPads();
    this.drumRects = [];

    const cols = 2;
    const rows = 2;
    const padding = 40;
    const gap = 20;
    const availW = w - padding * 2 - gap * (cols - 1);
    const availH = h - padding * 2 - gap * (rows - 1);
    const padW = Math.min(availW / cols, 200);
    const padH = Math.min(availH / rows, 200);
    const totalW = padW * cols + gap * (cols - 1);
    const totalH = padH * rows + gap * (rows - 1);
    const startX = (w - totalW) / 2;
    const startY = (h - totalH) / 2;

    for (let i = 0; i < drumPads.length; i++) {
      const pad = drumPads[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (padW + gap);
      const y = startY + row * (padH + gap);
      const key = `drums-${i}`;
      const pressed = this.pressedKeys.has(key);

      this.drumRects.push({ idx: i, x, y, w: padW, h: padH, pressAnim: 0 });

      const pressAnim = this.drumRects[i]?.pressAnim || 0;
      const scale = pressed || pressAnim > 0 ? 0.85 + 0.15 * (1 - (pressed ? 1 : pressAnim)) : 1;
      const offsetX = (1 - scale) * padW / 2;
      const offsetY = (1 - scale) * padH / 2;

      ctx.save();
      ctx.translate(x + offsetX, y + offsetY);
      ctx.scale(scale, scale);

      const glowIntensity = pressed ? 0.6 : pressAnim * 0.4;
      if (glowIntensity > 0) {
        const glowGrad = ctx.createRadialGradient(padW / 2, padH / 2, 0, padW / 2, padH / 2, padW);
        glowGrad.addColorStop(0, `rgba(255, 215, 0, ${glowIntensity * 0.5})`);
        glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(-padW / 2, -padH / 2, padW * 2, padH * 2);
      }

      const baseColor = pad.color;
      const grad = ctx.createLinearGradient(0, 0, 0, padH);
      grad.addColorStop(0, pressed ? '#FFD700' : this.lightenColor(baseColor, 20));
      grad.addColorStop(0.5, pressed ? '#FFC700' : baseColor);
      grad.addColorStop(1, pressed ? '#E6B800' : this.darkenColor(baseColor, 20));

      ctx.shadowColor = pressed ? 'rgba(255, 215, 0, 0.6)' : 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = pressed ? 25 : 15;
      ctx.shadowOffsetY = pressed ? 2 : 6;

      ctx.fillStyle = grad;
      this.roundRect(ctx, 0, 0, padW, padH, 16);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      this.roundRect(ctx, 1, 1, padW - 2, padH - 2, 15);
      ctx.stroke();

      const innerGrad = ctx.createRadialGradient(padW / 2, padH / 2, 0, padW / 2, padH / 2, padW * 0.4);
      innerGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
      innerGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = innerGrad;
      this.roundRect(ctx, padW * 0.1, padH * 0.1, padW * 0.8, padH * 0.8, 12);
      ctx.fill();

      ctx.fillStyle = pressed ? '#1A1A2E' : '#E0E0E0';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pad.name, padW / 2, padH / 2 - 10);

      const keyLabels = ['Q', 'W', 'E', 'R'];
      ctx.fillStyle = pressed ? 'rgba(26,26,46,0.7)' : 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(keyLabels[i], padW / 2, padH / 2 + 16);

      ctx.restore();
    }
  }

  private renderWaveform(): void {
    const ctx = this.waveCtx;
    const rect = this.waveCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#0A0A15';
    ctx.fillRect(0, 0, w, h);

    if (!this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00FF88';
    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 6;
    ctx.beginPath();

    const sliceWidth = w / bufferLength;
    this.waveOffset = (this.waveOffset + 1) % w;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * h) / 2;
      const x = (i * sliceWidth + this.waveOffset) % w;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    const gridGrad = ctx.createLinearGradient(0, 0, 0, h);
    gridGrad.addColorStop(0, 'rgba(0, 255, 136, 0.03)');
    gridGrad.addColorStop(0.5, 'rgba(0, 255, 136, 0.06)');
    gridGrad.addColorStop(1, 'rgba(0, 255, 136, 0.03)');
    ctx.strokeStyle = gridGrad;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private renderSpectrum(): void {
    const ctx = this.spectrumCtx;
    const rect = this.spectrumCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#0A0A15';
    ctx.fillRect(0, 0, w, h);

    if (!this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    const bars = 256;
    const step = Math.floor(bufferLength / bars);
    const barWidth = w / bars;

    for (let i = 0; i < bars; i++) {
      const dataIdx = i * step;
      const value = dataArray[dataIdx];
      const barHeight = (value / 255) * h;
      const x = i * barWidth;
      const y = h - barHeight;

      const hue = 240 - (i / bars) * 240;
      const grad = ctx.createLinearGradient(x, h, x, y);
      grad.addColorStop(0, `hsl(${240}, 80%, 50%)`);
      grad.addColorStop(0.5, `hsl(${hue}, 90%, 55%)`);
      grad.addColorStop(1, `hsl(${Math.max(0, hue - 60)}, 100%, 60%)`);

      ctx.fillStyle = grad;
      ctx.fillRect(x + 0.5, y, barWidth - 1, barHeight);

      if (barHeight > 4) {
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, 0.6)`;
        ctx.fillRect(x + 0.5, y, barWidth - 1, 2);
      }
    }
  }

  private renderEffects(): void {
    const now = performance.now();

    this.ripples = this.ripples.filter(r => now - r.startTime < r.duration);
    this.glows = this.glows.filter(g => now - g.startTime < g.duration);

    const ctx = this.instrumentCtx;

    this.glows.forEach(g => {
      const progress = (now - g.startTime) / g.duration;
      const size = 20 + progress * 60;
      const alpha = 1 - progress;
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, size);
      grad.addColorStop(0, `rgba(0, 191, 255, ${alpha * 0.3})`);
      grad.addColorStop(1, 'rgba(0, 191, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    this.ripples.forEach(r => {
      const progress = (now - r.startTime) / r.duration;
      const size = 3 + progress * 9;
      const alpha = 0.7 * (1 - progress);
      ctx.beginPath();
      ctx.arc(r.x, r.y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private darkenColor(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0x00FF) - amount);
    const b = Math.max(0, (num & 0x0000FF) - amount);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  updateToolbarSlider(): void {
    const activeBtn = document.querySelector('.tool-btn.active') as HTMLElement;
    const slider = document.getElementById('toolbarSlider') as HTMLElement;
    if (activeBtn && slider) {
      const rect = activeBtn.getBoundingClientRect();
      const parentRect = activeBtn.parentElement!.getBoundingClientRect();
      slider.style.left = (rect.left - parentRect.left + 6) + 'px';
      slider.style.width = (rect.width - 12) + 'px';
    }
  }
}
