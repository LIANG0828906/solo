import { ParticlePool, ParticleType } from './particle.js';

export type ToolType = 'hammer' | 'chisel' | 'file';

export interface ToolSlot {
  type: ToolType;
  x: number;
  y: number;
  w: number;
  h: number;
}

export class ToolManager {
  private audioCtx: AudioContext | null = null;
  private dragging: ToolType | null = null;
  private dragX: number = 0;
  private dragY: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private trail: { x: number; y: number }[] = [];
  private trailMax: number = 3;
  private hoveredTool: ToolType | null = null;
  private pressedTool: ToolType | null = null;
  public slots: ToolSlot[] = [];
  private particles: ParticlePool;

  constructor(particles: ParticlePool) {
    this.particles = particles;
  }

  private ensureAudio(): AudioContext {
    if (!this.audioCtx) {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AC!();
    }
    if (this.audioCtx!.state === 'suspended') {
      this.audioCtx!.resume();
    }
    return this.audioCtx!;
  }

  playHammerSound(): void {
    try {
      const ctx = this.ensureAudio();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.4, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch { /* noop */ }
  }

  playSnapSound(): void {
    try {
      const ctx = this.ensureAudio();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch { /* noop */ }
  }

  playFileSound(): void {
    try {
      const ctx = this.ensureAudio();
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.15;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
    } catch { /* noop */ }
  }

  playChiselSound(): void {
    try {
      const ctx = this.ensureAudio();
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.25;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      src.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
    } catch { /* noop */ }
  }

  setSlots(slots: ToolSlot[]): void {
    this.slots = slots;
  }

  isDragging(): ToolType | null {
    return this.dragging;
  }

  getDragPos(): { x: number; y: number } {
    return { x: this.dragX, y: this.dragY };
  }

  onPointerDown(type: ToolType, x: number, y: number): void {
    this.pressedTool = type;
  }

  onPointerUp(): { type: ToolType | null; x: number; y: number } {
    const result = { type: this.dragging, x: this.dragX, y: this.dragY };
    if (this.dragging) {
      this.dragging = null;
      this.trail = [];
    }
    this.pressedTool = null;
    return result;
  }

  startDrag(type: ToolType, screenX: number, screenY: number, slotX: number, slotY: number): void {
    this.dragging = type;
    this.dragX = screenX;
    this.dragY = screenY;
    this.offsetX = screenX - slotX;
    this.offsetY = screenY - slotY;
    this.trail = [];
  }

  updateDrag(screenX: number, screenY: number): void {
    if (this.dragging) {
      this.trail.unshift({ x: this.dragX, y: this.dragY });
      if (this.trail.length > this.trailMax) this.trail.pop();
      this.dragX = screenX - this.offsetX;
      this.dragY = screenY - this.offsetY;
    }
  }

  setHovered(type: ToolType | null): void {
    this.hoveredTool = type;
  }

  emitEffect(type: ToolType, x: number, y: number): void {
    if (type === 'hammer') {
      this.playHammerSound();
      for (let i = 0; i < 3; i++) {
        this.particles.emit('shine', x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 10, 1, { color: '#FFFFFF' });
      }
    } else if (type === 'chisel') {
      this.playChiselSound();
      this.particles.emit('sawtooth', x, y, 25, { color: '#8B4513' });
    } else if (type === 'file') {
      this.playFileSound();
      this.particles.emit('smoke', x, y, 35, { color: '#E8E8E8' });
    }
  }

  render(ctx: CanvasRenderingContext2D, scale: number, now: number): void {
    for (const slot of this.slots) {
      if (this.dragging === slot.type) continue;
      const hovered = this.hoveredTool === slot.type;
      const pressed = this.pressedTool === slot.type;
      ctx.save();
      ctx.translate(slot.x + slot.w / 2, slot.y + slot.h / 2);
      let s = 1;
      if (pressed) s = 0.95;
      else if (hovered) s = 1.05;
      ctx.scale(s, s);
      const shad = hovered ? 8 : 5;
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = shad;
      ctx.shadowOffsetY = 3;
      this.drawTool(ctx, slot.type, slot.w, slot.h);
      ctx.restore();
    }

    if (this.dragging) {
      for (let i = this.trail.length - 1; i >= 0; i--) {
        const t = this.trail[i];
        ctx.save();
        ctx.globalAlpha = 0.3 * (1 - i / this.trailMax);
        ctx.translate(t.x, t.y);
        const slot = this.slots.find(s => s.type === this.dragging)!;
        this.drawTool(ctx, this.dragging, slot.w, slot.h);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.translate(this.dragX, this.dragY);
      const slot = this.slots.find(s => s.type === this.dragging)!;
      this.drawTool(ctx, this.dragging, slot.w, slot.h);
      ctx.restore();
    }
  }

  private drawTool(ctx: CanvasRenderingContext2D, type: ToolType, w: number, h: number): void {
    switch (type) {
      case 'hammer': this.drawHammer(ctx, w, h); break;
      case 'chisel': this.drawChisel(ctx, w, h); break;
      case 'file': this.drawFile(ctx, w, h); break;
    }
  }

  private drawHammer(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = '#5C3A1E';
    ctx.beginPath();
    const handleW = w * 0.18;
    const handleX = w / 2 - handleW / 2;
    ctx.roundRect(handleX, h * 0.45, handleW, h * 0.55, 3);
    ctx.fill();
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 1;
    ctx.stroke();

    const headW = w * 0.85;
    const headH = h * 0.32;
    const headX = w / 2 - headW / 2;
    const headY = h * 0.1;
    const grad = ctx.createLinearGradient(headX, headY, headX, headY + headH);
    grad.addColorStop(0, '#A8A8A8');
    grad.addColorStop(0.5, '#808080');
    grad.addColorStop(1, '#5A5A5A');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(headX, headY, headW, headH, 5);
    ctx.fill();
    ctx.strokeStyle = '#3A3A3A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(headX + 5, headY + headH * 0.4, headW * 0.18, headH * 0.2);
    ctx.fillRect(headX + headW - 5 - headW * 0.18, headY + headH * 0.4, headW * 0.18, headH * 0.2);
    ctx.restore();
  }

  private drawChisel(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = '#4A2E1A';
    const handleW = w * 0.35;
    const handleX = w / 2 - handleW / 2;
    ctx.beginPath();
    ctx.roundRect(handleX, h * 0.55, handleW, h * 0.45, 4);
    ctx.fill();
    ctx.strokeStyle = '#2C1810';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#2C2C2C';
    const ringW = w * 0.32;
    const ringX = w / 2 - ringW / 2;
    ctx.fillRect(ringX, h * 0.48, ringW, h * 0.08);

    const bladeTopW = w * 0.3;
    const bladeBotW = w * 0.65;
    const bladeTopX = w / 2 - bladeTopW / 2;
    const bladeBotX = w / 2 - bladeBotW / 2;
    const bladeTopY = h * 0.1;
    const bladeBotY = h * 0.5;
    const grad = ctx.createLinearGradient(bladeTopX, 0, bladeBotX + bladeBotW, 0);
    grad.addColorStop(0, '#E0E0E0');
    grad.addColorStop(0.5, '#C0C0C0');
    grad.addColorStop(1, '#A0A0A0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(bladeTopX, bladeTopY);
    ctx.lineTo(bladeTopX + bladeTopW, bladeTopY);
    ctx.lineTo(bladeBotX + bladeBotW, bladeBotY);
    ctx.lineTo(bladeBotX, bladeBotY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#606060';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#F0F0F0';
    ctx.beginPath();
    ctx.moveTo(bladeBotX, bladeBotY);
    ctx.lineTo(bladeBotX + bladeBotW, bladeBotY);
    ctx.lineTo(bladeBotX + bladeBotW - 3, bladeBotY + 2);
    ctx.lineTo(bladeBotX + 3, bladeBotY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawFile(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.save();
    ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = '#3A2212';
    const handleW = w * 0.35;
    const handleX = w / 2 - handleW / 2;
    ctx.beginPath();
    ctx.roundRect(handleX, h * 0.6, handleW, h * 0.4, 3);
    ctx.fill();
    ctx.strokeStyle = '#1E1208';
    ctx.lineWidth = 1;
    ctx.stroke();

    const bladeW = w * 0.55;
    const bladeX = w / 2 - bladeW / 2;
    const bladeTopY = h * 0.05;
    const bladeBotY = h * 0.62;
    const grad = ctx.createLinearGradient(bladeX, 0, bladeX + bladeW, 0);
    grad.addColorStop(0, '#707070');
    grad.addColorStop(0.3, '#909090');
    grad.addColorStop(0.7, '#808080');
    grad.addColorStop(1, '#606060');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bladeX, bladeTopY, bladeW, bladeBotY - bladeTopY, 3);
    ctx.fill();
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = '#303030';
    ctx.lineWidth = 0.6;
    const step = 4;
    for (let y = bladeTopY + 4; y < bladeBotY - 2; y += step) {
      for (let x = bladeX + 2; x < bladeX + bladeW - 2; x += step) {
        const ox = (Math.floor((y - bladeTopY - 4) / step) % 2) * (step / 2);
        ctx.beginPath();
        ctx.arc(x + ox, y, 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
