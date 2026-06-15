import { Instrument, AudioController, BIANZHONG_MIDI, BIANQING_MIDI, GUQIN_MIDI, XIAO_MIDI } from './audio';
import { ScoreNote, Score } from './composer';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
}

interface BellState {
  alpha: number;
  shakeTime: number;
  clapperAngle: number;
  highlight: boolean;
  wrongTime: number;
}

interface ChimeState {
  flashTime: number;
  highlight: boolean;
  wrongTime: number;
}

interface GuqinStringState {
  glowTime: number;
  highlight: boolean;
}

interface XiaoHoleState {
  glowTime: number;
  highlight: boolean;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private particles: Particle[] = [];
  private bellStates: BellState[];
  private chimeStates: ChimeState[];
  private guqinStringStates: GuqinStringState[];
  private xiaoHoleStates: XiaoHoleState[];
  private backgroundPattern: HTMLCanvasElement | null = null;
  private lastWaveformUpdate: number = 0;
  private waveformCache: Map<Instrument, Float32Array> = new Map();
  private totalWaveformCache: Float32Array = new Float32Array(0);

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.bellStates = Array.from({ length: 32 }, () => ({
      alpha: 1, shakeTime: 0, clapperAngle: 0, highlight: false, wrongTime: 0
    }));
    this.chimeStates = Array.from({ length: 16 }, () => ({
      flashTime: 0, highlight: false, wrongTime: 0
    }));
    this.guqinStringStates = Array.from({ length: 7 }, () => ({
      glowTime: 0, highlight: false
    }));
    this.xiaoHoleStates = Array.from({ length: 6 }, () => ({
      glowTime: 0, highlight: false
    }));
    this.createBackgroundPattern();
  }

  private createBackgroundPattern(): void {
    const pc = document.createElement('canvas');
    pc.width = 200;
    pc.height = 200;
    const pctx = pc.getContext('2d')!;
    pctx.fillStyle = '#4A3728';
    pctx.fillRect(0, 0, 200, 200);
    pctx.strokeStyle = 'rgba(80,60,40,0.3)';
    pctx.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
      const x1 = Math.random() * 200;
      const y1 = Math.random() * 200;
      pctx.beginPath();
      pctx.moveTo(x1, y1);
      pctx.lineTo(x1 + Math.random() * 60 - 30, y1 + Math.random() * 60 - 30);
      pctx.stroke();
    }
    pctx.strokeStyle = 'rgba(100,75,50,0.15)';
    for (let i = 0; i < 8; i++) {
      const cx = Math.random() * 200;
      const cy = Math.random() * 200;
      pctx.beginPath();
      pctx.arc(cx, cy, 10 + Math.random() * 20, 0, Math.PI * 2);
      pctx.stroke();
    }
    pctx.fillStyle = 'rgba(60,40,25,0.1)';
    for (let i = 0; i < 30; i++) {
      pctx.fillRect(Math.random() * 200, Math.random() * 200, 2, 2);
    }
    this.backgroundPattern = pc;
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  triggerBell(index: number, correct: boolean): void {
    if (index < 0 || index >= 32) return;
    this.bellStates[index].alpha = 0.4;
    this.bellStates[index].clapperAngle = -10;
    this.bellStates[index].shakeTime = 0;
    if (!correct) {
      this.bellStates[index].wrongTime = 0.2;
    }
  }

  triggerChime(index: number, correct: boolean): void {
    if (index < 0 || index >= 16) return;
    this.chimeStates[index].flashTime = 0.1;
    if (!correct) {
      this.chimeStates[index].wrongTime = 0.2;
    }
  }

  triggerGuqinString(index: number, correct: boolean): void {
    if (index < 0 || index >= 7) return;
    this.guqinStringStates[index].glowTime = 0.5;
  }

  triggerXiaoHole(index: number, correct: boolean): void {
    if (index < 0 || index >= 6) return;
    this.xiaoHoleStates[index].glowTime = 0.5;
  }

  addParticle(x: number, y: number): void {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 / 20) * i;
      const speed = 30 + Math.random() * 40;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 2,
        maxLife: 2,
        radius: 2 + Math.random() * 3,
        color: i < 10 ? '#FFD700' : '#FFA500'
      });
    }
    for (let ring = 0; ring < 3; ring++) {
      this.particles.push({
        x, y,
        vx: 0, vy: 0,
        life: 1.5,
        maxLife: 1.5,
        radius: 5 + ring * 15,
        color: ring === 0 ? '#FFD700' : '#FFA500'
      });
    }
  }

  setHighlights(activeNotes: ScoreNote[]): void {
    for (const bs of this.bellStates) bs.highlight = false;
    for (const cs of this.chimeStates) cs.highlight = false;
    for (const gs of this.guqinStringStates) gs.highlight = false;
    for (const xs of this.xiaoHoleStates) xs.highlight = false;

    for (const note of activeNotes) {
      if (note.instrument === Instrument.BIANZHONG && note.noteIndex < 32) {
        this.bellStates[note.noteIndex].highlight = true;
      } else if (note.instrument === Instrument.BIANQING && note.noteIndex < 16) {
        this.chimeStates[note.noteIndex].highlight = true;
      } else if (note.instrument === Instrument.GUQIN && note.noteIndex < 7) {
        this.guqinStringStates[note.noteIndex].highlight = true;
      } else if (note.instrument === Instrument.XIAO && note.noteIndex < 6) {
        this.xiaoHoleStates[note.noteIndex].highlight = true;
      }
    }
  }

  getBellPositions(): { x: number; y: number; w: number; h: number }[] {
    const positions: { x: number; y: number; w: number; h: number }[] = [];
    const cx = this.width * 0.5;
    const frameTop = this.height * 0.28;
    const frameBottom = this.height * 0.75;
    const frameWidth = this.width * 0.5;
    const frameLeft = cx - frameWidth / 2;

    const tierCounts = [8, 12, 12];
    const tierYs = [frameBottom - (frameBottom - frameTop) * 0.25,
                    frameBottom - (frameBottom - frameTop) * 0.55,
                    frameBottom - (frameBottom - frameTop) * 0.85];
    const tierHeights = [55, 45, 35];

    let bellIdx = 0;
    for (let tier = 0; tier < 3; tier++) {
      const count = tierCounts[tier];
      const y = tierYs[tier];
      const h = tierHeights[tier];
      const w = frameWidth / (count + 1);
      for (let i = 0; i < count; i++) {
        const x = frameLeft + w * (i + 1);
        positions.push({ x, y, w: w * 0.7, h });
        bellIdx++;
      }
    }
    return positions;
  }

  getChimePositions(): { x: number; y: number; w: number; h: number }[] {
    const positions: { x: number; y: number; w: number; h: number }[] = [];
    const left = this.width * 0.02;
    const top = this.height * 0.35;
    const chimeW = 22;
    const chimeH = 40;
    const gapX = 6;
    const gapY = 12;

    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 8; i++) {
        positions.push({
          x: left + i * (chimeW + gapX),
          y: top + row * (chimeH + gapY + 20),
          w: chimeW,
          h: chimeH
        });
      }
    }
    return positions;
  }

  getGuqinRect(): { x: number; y: number; w: number; h: number } {
    return {
      x: this.width * 0.78,
      y: this.height * 0.35,
      w: this.width * 0.18,
      h: this.height * 0.22
    };
  }

  getXiaoRect(): { x: number; y: number; w: number; h: number } {
    return {
      x: this.width * 0.88,
      y: this.height * 0.6,
      w: 20,
      h: this.height * 0.28
    };
  }

  getGuqinStringPositions(): { x1: number; y1: number; x2: number; y2: number }[] {
    const rect = this.getGuqinRect();
    const strings: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const y = rect.y + 15 + (rect.h - 30) * i / 6;
      strings.push({ x1: rect.x + 8, y1: y, x2: rect.x + rect.w - 8, y2: y });
    }
    return strings;
  }

  getXiaoHolePositions(): { x: number; y: number }[] {
    const rect = this.getXiaoRect();
    const holes: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      holes.push({
        x: rect.x + rect.w / 2,
        y: rect.y + 20 + (rect.h - 40) * i / 5
      });
    }
    return holes;
  }

  hitTestBianzhong(mx: number, my: number): number {
    const positions = this.getBellPositions();
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      if (mx > p.x - p.w / 2 && mx < p.x + p.w / 2 &&
          my > p.y - p.h && my < p.y) {
        return i;
      }
    }
    return -1;
  }

  hitTestBianqing(mx: number, my: number): number {
    const positions = this.getChimePositions();
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      if (mx > p.x && mx < p.x + p.w && my > p.y && my < p.y + p.h) {
        return i;
      }
    }
    return -1;
  }

  hitTestGuqin(mx: number, my: number): number {
    const strings = this.getGuqinStringPositions();
    for (let i = 0; i < strings.length; i++) {
      const s = strings[i];
      if (mx >= s.x1 && mx <= s.x2 && Math.abs(my - s.y1) < 8) {
        return i;
      }
    }
    return -1;
  }

  hitTestXiao(mx: number, my: number): number {
    const holes = this.getXiaoHolePositions();
    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];
      const dx = mx - h.x;
      const dy = my - h.y;
      if (dx * dx + dy * dy < 12 * 12) {
        return i;
      }
    }
    return -1;
  }

  update(dt: number, audio: AudioController): void {
    for (const bs of this.bellStates) {
      bs.alpha = Math.min(1, bs.alpha + dt * 3);
      if (bs.clapperAngle !== 0) {
        bs.shakeTime += dt;
        if (bs.shakeTime < 0.2) {
          bs.clapperAngle = -10 * Math.cos(bs.shakeTime * Math.PI / 0.1);
        } else {
          bs.clapperAngle = 0;
        }
      }
      if (bs.wrongTime > 0) {
        bs.wrongTime = Math.max(0, bs.wrongTime - dt);
      }
    }
    for (const cs of this.chimeStates) {
      if (cs.flashTime > 0) cs.flashTime = Math.max(0, cs.flashTime - dt);
      if (cs.wrongTime > 0) cs.wrongTime = Math.max(0, cs.wrongTime - dt);
    }
    for (const gs of this.guqinStringStates) {
      if (gs.glowTime > 0) gs.glowTime = Math.max(0, gs.glowTime - dt);
    }
    for (const xs of this.xiaoHoleStates) {
      if (xs.glowTime > 0) xs.glowTime = Math.max(0, xs.glowTime - dt);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.vx !== 0 || p.vy !== 0) {
        p.vx *= 0.98;
        p.vy *= 0.98;
      }
    }

    const now = performance.now();
    if (now - this.lastWaveformUpdate > 200) {
      this.lastWaveformUpdate = now;
      for (const inst of [Instrument.BIANZHONG, Instrument.BIANQING, Instrument.GUQIN, Instrument.XIAO]) {
        this.waveformCache.set(inst, audio.getWaveform(inst));
      }
      this.totalWaveformCache = audio.getTotalWaveform();
    }
  }

  draw(score: Score | null, currentBeat: number, isPlaying: boolean): void {
    const c = this.ctx;
    c.clearRect(0, 0, this.width, this.height);

    this.drawBackground();
    this.drawBianzhongFrame();
    this.drawBianqing();
    this.drawGuqin();
    this.drawXiao();
    this.drawParticles();

    if (score && isPlaying) {
      this.drawScoreNotes(score, currentBeat);
    }

    this.drawWaveforms();
  }

  private drawBackground(): void {
    const c = this.ctx;
    c.fillStyle = '#1A0A00';
    c.fillRect(0, 0, this.width, this.height);

    if (this.backgroundPattern) {
      const pat = c.createPattern(this.backgroundPattern, 'repeat')!;
      c.fillStyle = pat;
      c.globalAlpha = 0.4;
      c.fillRect(0, 0, this.width, this.height);
      c.globalAlpha = 1;
    }

    const vignette = c.createRadialGradient(
      this.width / 2, this.height / 2, this.height * 0.3,
      this.width / 2, this.height / 2, this.height * 0.8
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = vignette;
    c.fillRect(0, 0, this.width, this.height);
  }

  private drawBianzhongFrame(): void {
    const c = this.ctx;
    const cx = this.width * 0.5;
    const frameTop = this.height * 0.28;
    const frameBottom = this.height * 0.78;
    const frameWidth = this.width * 0.5;
    const frameLeft = cx - frameWidth / 2;

    c.fillStyle = '#5C3A1E';
    c.fillRect(frameLeft - 8, frameTop - 5, 12, frameBottom - frameTop + 10);
    c.fillRect(frameLeft + frameWidth - 4, frameTop - 5, 12, frameBottom - frameTop + 10);

    c.fillStyle = '#6B4423';
    c.fillRect(frameLeft - 12, frameTop - 8, frameWidth + 24, 10);

    const beamYs = [
      frameBottom - (frameBottom - frameTop) * 0.25,
      frameBottom - (frameBottom - frameTop) * 0.55,
      frameBottom - (frameBottom - frameTop) * 0.85
    ];

    for (const by of beamYs) {
      c.fillStyle = '#6B4423';
      c.fillRect(frameLeft - 6, by - 4, frameWidth + 12, 8);
    }

    const tierCounts = [8, 12, 12];
    const tierHeights = [55, 45, 35];

    let bellIdx = 0;
    for (let tier = 0; tier < 3; tier++) {
      const count = tierCounts[tier];
      const beamY = beamYs[tier];
      const bh = tierHeights[tier];
      const bellW = frameWidth / (count + 1) * 0.7;

      for (let i = 0; i < count; i++) {
        if (bellIdx >= 32) break;
        const spacing = frameWidth / (count + 1);
        const x = frameLeft + spacing * (i + 1);
        const y = beamY;
        const state = this.bellStates[bellIdx];

        c.save();
        c.globalAlpha = state.alpha;

        if (state.wrongTime > 0) {
          const shake = Math.sin(state.wrongTime * 60) * 3;
          c.translate(shake, 0);
        }

        const ropeLen = 10;
        c.strokeStyle = '#8B7355';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x, y + ropeLen);
        c.stroke();

        const bellTop = y + ropeLen;
        const topW = bellW * 0.5;
        const botW = bellW;

        let fillColor = '#D4A76A';
        if (state.wrongTime > 0) {
          const t = state.wrongTime / 0.2;
          const r = Math.floor(0xD4 * (1 - t) + 0xFF * t);
          const g = Math.floor(0xA7 * (1 - t) + 0x20 * t);
          const b = Math.floor(0x6A * (1 - t) + 0x20 * t);
          fillColor = `rgb(${r},${g},${b})`;
        }

        const grad = c.createLinearGradient(x - botW / 2, bellTop, x + botW / 2, bellTop);
        grad.addColorStop(0, '#B08850');
        grad.addColorStop(0.3, fillColor);
        grad.addColorStop(0.7, fillColor);
        grad.addColorStop(1, '#B08850');
        c.fillStyle = grad;

        c.beginPath();
        c.moveTo(x - topW / 2, bellTop);
        c.lineTo(x + topW / 2, bellTop);
        c.lineTo(x + botW / 2, bellTop + bh * 0.7);
        c.quadraticCurveTo(x + botW / 2, bellTop + bh, x, bellTop + bh);
        c.quadraticCurveTo(x - botW / 2, bellTop + bh, x - botW / 2, bellTop + bh * 0.7);
        c.closePath();
        c.fill();

        c.strokeStyle = '#8B6914';
        c.lineWidth = 1;
        c.stroke();

        this.drawPanChiWen(c, x, bellTop + bh * 0.3, botW * 0.6, bh * 0.3);

        if (state.clapperAngle !== 0) {
          c.save();
          c.translate(x, bellTop + bh * 0.5);
          c.rotate(state.clapperAngle * Math.PI / 180);
          c.fillStyle = '#8B7355';
          c.fillRect(-1.5, -2, 3, bh * 0.3);
          c.beginPath();
          c.arc(0, bh * 0.3 - 2, 3, 0, Math.PI * 2);
          c.fill();
          c.restore();
        }

        if (state.highlight) {
          c.strokeStyle = '#FFD700';
          c.lineWidth = 2.5;
          c.beginPath();
          c.arc(x, bellTop + bh * 0.5, botW * 0.6, 0, Math.PI * 2);
          c.stroke();
          c.strokeStyle = 'rgba(255,215,0,0.3)';
          c.lineWidth = 5;
          c.stroke();
        }

        c.restore();
        bellIdx++;
      }
    }
  }

  private drawPanChiWen(c: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number): void {
    c.save();
    c.globalAlpha = 0.2;
    c.strokeStyle = '#8B6914';
    c.lineWidth = 0.5;
    const loops = 4;
    for (let i = 0; i < loops; i++) {
      const lx = cx - w / 2 + (w / loops) * (i + 0.5);
      const ly = cy - h / 2 + Math.random() * h;
      c.beginPath();
      c.arc(lx, ly, 3, 0, Math.PI * 1.5);
      c.stroke();
      c.beginPath();
      c.arc(lx + 4, ly + 3, 2, 0.5, Math.PI * 1.2);
      c.stroke();
    }
    c.restore();
  }

  private drawBianqing(): void {
    const c = this.ctx;
    const positions = this.getChimePositions();

    const left = this.width * 0.02;
    const top = this.height * 0.32;

    c.fillStyle = '#5C3A1E';
    c.fillRect(left - 4, top - 8, positions[7].x + positions[7].w - left + 8, 6);
    c.fillRect(left - 4, top + positions[0].h + positions[7].h + 32, positions[7].x + positions[7].w - left + 8, 6);

    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const state = this.chimeStates[i];

      c.save();

      c.strokeStyle = '#8B7355';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(p.x + p.w / 2, p.y - 8);
      c.lineTo(p.x + p.w / 2, p.y);
      c.stroke();

      let fillColor = '#5C7A6B';
      if (state.wrongTime > 0) {
        const t = state.wrongTime / 0.2;
        const r = Math.floor(0x5C * (1 - t) + 0xFF * t);
        const g = Math.floor(0x7A * (1 - t) + 0x20 * t);
        const b = Math.floor(0x6B * (1 - t) + 0x20 * t);
        fillColor = `rgb(${r},${g},${b})`;
      }

      const grad = c.createLinearGradient(p.x, p.y, p.x + p.w, p.y);
      grad.addColorStop(0, '#4A6358');
      grad.addColorStop(0.5, fillColor);
      grad.addColorStop(1, '#4A6358');
      c.fillStyle = grad;

      c.beginPath();
      c.moveTo(p.x + 2, p.y);
      c.lineTo(p.x + p.w - 2, p.y);
      c.lineTo(p.x + p.w, p.y + p.h * 0.3);
      c.lineTo(p.x + p.w - 1, p.y + p.h);
      c.lineTo(p.x + 1, p.y + p.h);
      c.lineTo(p.x, p.y + p.h * 0.3);
      c.closePath();
      c.fill();
      c.strokeStyle = '#3E5A4D';
      c.lineWidth = 0.8;
      c.stroke();

      if (state.flashTime > 0) {
        c.fillStyle = `rgba(255,255,255,${state.flashTime / 0.1 * 0.6})`;
        c.fill();
      }

      if (state.highlight) {
        c.strokeStyle = '#FFFFFF';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(p.x + p.w / 2, p.y + p.h / 2, p.w * 0.8, 0, Math.PI * 2);
        c.stroke();
      }

      c.restore();
    }
  }

  private drawGuqin(): void {
    const c = this.ctx;
    const rect = this.getGuqinRect();

    c.save();
    c.fillStyle = '#3E2723';
    const bodyGrad = c.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    bodyGrad.addColorStop(0, '#4E3733');
    bodyGrad.addColorStop(0.5, '#3E2723');
    bodyGrad.addColorStop(1, '#2E1713');
    c.fillStyle = bodyGrad;

    c.beginPath();
    c.moveTo(rect.x + 10, rect.y);
    c.lineTo(rect.x + rect.w - 10, rect.y);
    c.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + 10);
    c.lineTo(rect.x + rect.w, rect.y + rect.h - 10);
    c.quadraticCurveTo(rect.x + rect.w, rect.y + rect.h, rect.x + rect.w - 10, rect.y + rect.h);
    c.lineTo(rect.x + 10, rect.y + rect.h);
    c.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - 10);
    c.lineTo(rect.x, rect.y + 10);
    c.quadraticCurveTo(rect.x, rect.y, rect.x + 10, rect.y);
    c.closePath();
    c.fill();
    c.strokeStyle = '#5C3A1E';
    c.lineWidth = 2;
    c.stroke();

    const strings = this.getGuqinStringPositions();
    for (let i = 0; i < strings.length; i++) {
      const s = strings[i];
      const state = this.guqinStringStates[i];

      c.strokeStyle = '#E8E0D0';
      c.lineWidth = 1.2 - i * 0.1;
      c.beginPath();
      c.moveTo(s.x1, s.y1);
      c.lineTo(s.x2, s.y2);
      c.stroke();

      if (state.glowTime > 0) {
        const alpha = state.glowTime / 0.5;
        c.strokeStyle = `rgba(255,215,0,${alpha * 0.8})`;
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(s.x1, s.y1);
        c.lineTo(s.x2, s.y2);
        c.stroke();
      }

      if (state.highlight) {
        const progress = (performance.now() % 1000) / 1000;
        const px = s.x1 + (s.x2 - s.x1) * progress;
        c.strokeStyle = 'rgba(255,215,0,0.6)';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(px - 20, s.y1);
        c.lineTo(px + 20, s.y1);
        c.stroke();
      }
    }

    c.fillStyle = '#6B4423';
    for (let i = 0; i < 13; i++) {
      const dx = rect.x + 8 + (rect.w - 16) * i / 12;
      c.fillRect(dx - 1, rect.y + rect.h - 10, 2, 6);
    }

    c.restore();
  }

  private drawXiao(): void {
    const c = this.ctx;
    const rect = this.getXiaoRect();

    c.save();

    const tubeGrad = c.createLinearGradient(rect.x - 5, 0, rect.x + rect.w + 5, 0);
    tubeGrad.addColorStop(0, '#6B8050');
    tubeGrad.addColorStop(0.3, '#8B9E6B');
    tubeGrad.addColorStop(0.7, '#8B9E6B');
    tubeGrad.addColorStop(1, '#6B8050');
    c.fillStyle = tubeGrad;

    c.beginPath();
    c.moveTo(rect.x + rect.w / 2 - 6, rect.y);
    c.lineTo(rect.x + rect.w / 2 + 6, rect.y);
    c.lineTo(rect.x + rect.w / 2 + 7, rect.y + rect.h);
    c.lineTo(rect.x + rect.w / 2 - 7, rect.y + rect.h);
    c.closePath();
    c.fill();
    c.strokeStyle = '#5A6E4A';
    c.lineWidth = 1;
    c.stroke();

    for (let i = 0; i < 4; i++) {
      const ny = rect.y + rect.h * (0.15 + i * 0.22);
      c.strokeStyle = 'rgba(100,130,80,0.4)';
      c.lineWidth = 0.5;
      c.beginPath();
      c.moveTo(rect.x + rect.w / 2 - 6, ny);
      c.lineTo(rect.x + rect.w / 2 + 6, ny);
      c.stroke();
    }

    const holes = this.getXiaoHolePositions();
    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];
      const state = this.xiaoHoleStates[i];

      c.fillStyle = '#2A3A1A';
      c.beginPath();
      c.arc(h.x, h.y, 4, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#5A6E4A';
      c.lineWidth = 0.5;
      c.stroke();

      if (state.highlight) {
        c.fillStyle = 'rgba(80,150,255,0.7)';
        c.beginPath();
        c.arc(h.x, h.y, 6, 0, Math.PI * 2);
        c.fill();
      }

      if (state.glowTime > 0) {
        const alpha = state.glowTime / 0.5;
        c.fillStyle = `rgba(80,150,255,${alpha * 0.5})`;
        c.beginPath();
        c.arc(h.x, h.y, 8, 0, Math.PI * 2);
        c.fill();
      }
    }

    c.restore();
  }

  private drawParticles(): void {
    const c = this.ctx;
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      if (p.vx === 0 && p.vy === 0) {
        c.strokeStyle = p.color.replace(')', `,${t * 0.5})`).replace('rgb', 'rgba').replace('#FFD700', `rgba(255,215,0,${t * 0.5})`).replace('#FFA500', `rgba(255,165,0,${t * 0.5})`);
        c.strokeStyle = `rgba(${p.color === '#FFD700' ? '255,215,0' : '255,165,0'},${t * 0.5})`;
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(p.x, p.y, p.radius * (1 + (1 - t) * 2), 0, Math.PI * 2);
        c.stroke();
      } else {
        c.fillStyle = `rgba(${p.color === '#FFD700' ? '255,215,0' : '255,165,0'},${t})`;
        c.beginPath();
        c.arc(p.x, p.y, p.radius * t, 0, Math.PI * 2);
        c.fill();
      }
    }
  }

  private drawScoreNotes(score: Score, currentBeat: number): void {
  }

  private drawWaveforms(): void {
    const c = this.ctx;
    const waveY = this.height - 100;
    const waveW = this.width * 0.4;
    const waveH = 30;
    const waveX = this.width * 0.05;

    const instruments: { inst: Instrument; color: string; label: string }[] = [
      { inst: Instrument.BIANZHONG, color: '#FFD700', label: '钟' },
      { inst: Instrument.BIANQING, color: '#5C7A6B', label: '磬' },
      { inst: Instrument.GUQIN, color: '#CC4444', label: '琴' },
      { inst: Instrument.XIAO, color: '#5588DD', label: '箫' }
    ];

    for (let i = 0; i < instruments.length; i++) {
      const y = waveY + i * (waveH + 8);
      const { inst, color, label } = instruments[i];

      c.fillStyle = 'rgba(0,0,0,0.4)';
      c.fillRect(waveX, y, waveW, waveH);

      c.fillStyle = color;
      c.font = '12px 楷体, KaiTi, STKaiti, serif';
      c.fillText(label, waveX - 16, y + waveH / 2 + 4);

      const data = this.waveformCache.get(inst);
      if (data && data.length > 0) {
        c.strokeStyle = color;
        c.lineWidth = 1;
        c.beginPath();
        const step = Math.floor(data.length / waveW);
        for (let x = 0; x < waveW; x++) {
          const idx = x * step;
          const val = idx < data.length ? data[idx] : 0;
          const py = y + waveH / 2 + val * waveH * 0.4;
          if (x === 0) c.moveTo(waveX + x, py);
          else c.lineTo(waveX + x, py);
        }
        c.stroke();
      }
    }

    const totalY = waveY;
    const totalX = waveX + waveW + 40;
    const totalW = this.width * 0.25;
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fillRect(totalX, totalY, totalW, waveH * 4 + 24);

    c.fillStyle = '#F5DEB3';
    c.font = '12px 楷体, KaiTi, STKaiti, serif';
    c.fillText('总声轨', totalX + totalW / 2 - 16, totalY - 4);

    if (this.totalWaveformCache.length > 0) {
      c.strokeStyle = '#F5DEB3';
      c.lineWidth = 1.5;
      c.beginPath();
      const step = Math.floor(this.totalWaveformCache.length / totalW);
      for (let x = 0; x < totalW; x++) {
        const idx = x * step;
        const val = idx < this.totalWaveformCache.length ? this.totalWaveformCache[idx] : 0;
        const py = totalY + (waveH * 4 + 24) / 2 + val * (waveH * 2);
        if (x === 0) c.moveTo(totalX + x, py);
        else c.lineTo(totalX + x, py);
      }
      c.stroke();
    }
  }
}
