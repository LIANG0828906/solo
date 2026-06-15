import { ParticlePool } from './particle.js';
import { ToolManager, ToolType, ToolSlot } from './tool.js';
import { UIManager, MortiseIconState } from './ui.js';

type MortiseState = 'locked' | 'selected' | 'operating' | 'completed';
type MortiseType = 'dovetail' | 'straight' | 'shoulder' | 'mortise_tenon' | 'fishtail' | 'cross_lap';
type OpStage = 'idle' | 'need_file' | 'need_chisel' | 'need_hammer';

interface MortiseData {
  type: MortiseType;
  label: string;
  state: MortiseState;
  progress: number;
  stage: OpStage;
  hammerOffset: number;
  mergeT: number;
  merged: boolean;
}

interface HitZone {
  kind: 'tenon' | 'mortise' | 'file';
  x: number; y: number; w: number; h: number;
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wrapper: HTMLElement;
  private dpr: number = 1;
  private logicalW: number = 1280;
  private logicalH: number = 720;
  private scale: number = 1;
  private mobile: boolean = false;

  private particles: ParticlePool;
  private tools: ToolManager;
  private ui: UIManager;

  private mortises: MortiseData[] = [];
  private selectedIndex: number = -1;
  private health: number = 100;
  private startTime: number = 0;
  private elapsed: number = 0;
  private totalOps: number = 0;
  private correctOps: number = 0;
  private hammerUses: number = 0;
  private chiselUses: number = 0;
  private fileUses: number = 0;
  private finished: boolean = false;
  private finishAnimStart: number = -1;
  private lastFrame: number = 0;
  private rafId: number = 0;
  private tenonHitY: number = 0;

  private waxAnim: { start: number; duration: number } | null = null;
  private goldLineT: number = 0;
  private bigTextT: number = 0;

  private crackEmitTimer: number = 0;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const wrapper = document.getElementById('workshop') as HTMLElement;
    const uiLayer = document.getElementById('uiLayer') as HTMLElement;
    if (!canvas || !wrapper || !uiLayer) throw new Error('Dom missing');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.wrapper = wrapper;

    this.particles = new ParticlePool(600);
    this.tools = new ToolManager(this.particles);
    this.ui = new UIManager(uiLayer);

    this.initMortises();
    this.bindUI();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('restart-game', () => this.restart());

    this.bindCanvasEvents();

    this.startTime = performance.now();
    this.lastFrame = performance.now();
    this.ui.setHealth(this.health);
    this.ui.setProgress(0);
    this.updateToolsLayout();
    this.loop();
  }

  private initMortises(): void {
    const defs: { type: MortiseType; label: string }[] = [
      { type: 'straight', label: '直榫' },
      { type: 'dovetail', label: '燕尾榫' },
      { type: 'mortise_tenon', label: '方榫卯' },
      { type: 'shoulder', label: '抱肩榫' },
      { type: 'fishtail', label: '鱼尾榫' },
      { type: 'cross_lap', label: '十字搭接榫' },
    ];
    this.mortises = defs.map(d => ({
      type: d.type,
      label: d.label,
      state: 'locked',
      progress: 0,
      stage: 'idle',
      hammerOffset: 0,
      mergeT: 0,
      merged: false,
    }));

    const icons: MortiseIconState[] = this.mortises.map((m, i) => ({
      type: m.type,
      label: m.label,
      completed: false,
      index: i,
    }));
    this.ui.buildIcons(icons, {
      onIconClick: (idx) => this.onIconClick(idx),
      onIconHover: () => { /* noop */ },
    });
  }

  private bindUI(): void { /* handled in buildIcons */ }

  private restart(): void {
    this.particles.clear();
    this.mortises.forEach(m => {
      m.state = 'locked';
      m.progress = 0;
      m.stage = 'idle';
      m.hammerOffset = 0;
      m.mergeT = 0;
      m.merged = false;
    });
    this.selectedIndex = -1;
    this.health = 100;
    this.startTime = performance.now();
    this.elapsed = 0;
    this.totalOps = 0;
    this.correctOps = 0;
    this.hammerUses = 0;
    this.chiselUses = 0;
    this.fileUses = 0;
    this.finished = false;
    this.finishAnimStart = -1;
    this.waxAnim = null;
    this.goldLineT = 0;
    this.bigTextT = 0;
    this.crackEmitTimer = 0;
    this.ui.setHealth(100);
    this.ui.setProgress(0);
    this.ui.hideFinish();
    this.mortises.forEach((_, i) => this.ui.updateIcon(i, false));
    this.ui.setHint('提示：点击榫卯图标 → 依次拖拽 木锉→凿子→锤子 到高亮区域');
  }

  private onIconClick(idx: number): void {
    if (this.finished) return;
    const m = this.mortises[idx];
    if (m.state === 'completed') {
      this.ui.showToast(`${m.label}已拼合完成`);
      setTimeout(() => {}, 0);
      return;
    }
    this.selectedIndex = idx;
    if (m.state === 'locked') {
      m.state = 'selected';
    }
    if (m.stage === 'idle') m.stage = 'need_file';
    this.ui.setHint(`已选【${m.label}】：依次拖拽 木锉(打磨) → 凿子(修整卯口) → 锤子(敲击榫头)`);
  }

  private resize(): void {
    const rect = this.wrapper.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    this.logicalW = w;
    this.logicalH = h;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const desktopScale = Math.min(w / 1280, h / 720, 1);
    if (window.innerWidth < 768) {
      this.scale = desktopScale * 0.7;
      this.mobile = true;
    } else {
      this.scale = desktopScale;
      this.mobile = false;
    }
    this.ui.applyResponsive(this.mobile);
    this.updateToolsLayout();
  }

  private updateToolsLayout(): void {
    const baseX = this.logicalW - (this.mobile ? 40 : 90);
    const baseY = this.mobile ? this.logicalH - 100 : this.logicalH / 2 - 140;
    const gap = this.mobile ? 30 : 20;
    const sizeHammer = this.mobile ? 56 : 80;
    const sizeChisel = this.mobile ? 50 : 70;
    const sizeFile = this.mobile ? 44 : 60;
    if (this.mobile) {
      this.tools.setSlots([
        { type: 'file',   x: baseX - 260, y: baseY, w: sizeFile,   h: sizeFile * 1.8 },
        { type: 'chisel', x: baseX - 180, y: baseY - 8, w: sizeChisel, h: sizeChisel * 1.9 },
        { type: 'hammer', x: baseX - 90,  y: baseY - 12, w: sizeHammer, h: sizeHammer * 1.75 },
      ] as ToolSlot[]);
    } else {
      this.tools.setSlots([
        { type: 'file',   x: baseX - 30, y: baseY,                     w: sizeFile,   h: sizeFile * 1.8 },
        { type: 'chisel', x: baseX - 35, y: baseY + sizeFile * 1.8 + gap, w: sizeChisel, h: sizeChisel * 1.9 },
        { type: 'hammer', x: baseX - 40, y: baseY + sizeFile * 1.8 + gap + sizeChisel * 1.9 + gap, w: sizeHammer, h: sizeHammer * 1.75 },
      ] as ToolSlot[]);
    }
  }

  private bindCanvasEvents(): void {
    const down = (e: PointerEvent) => {
      const pt = this.getPt(e);
      const slot = this.hitTool(pt.x, pt.y);
      if (slot) {
        this.tools.onPointerDown(slot.type, pt.x, pt.y);
        this.tools.startDrag(slot.type, pt.x, pt.y, slot.x + slot.w / 2, slot.y + slot.h / 2);
        this.canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
      }
    };
    const move = (e: PointerEvent) => {
      const pt = this.getPt(e);
      this.tools.updateDrag(pt.x, pt.y);
      if (!this.tools.isDragging()) {
        const slot = this.hitTool(pt.x, pt.y);
        this.tools.setHovered(slot ? slot.type : null);
      }
    };
    const up = (e: PointerEvent) => {
      const pt = this.getPt(e);
      const res = this.tools.onPointerUp();
      if (res.type) {
        this.applyToolAt(res.type, pt.x, pt.y);
      }
      try { this.canvas.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };
    this.canvas.addEventListener('pointerdown', down);
    this.canvas.addEventListener('pointermove', move);
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
  }

  private getPt(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private hitTool(x: number, y: number): ToolSlot | null {
    for (const s of this.tools.slots) {
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
    }
    return null;
  }

  private deskRect(): { x: number; y: number; w: number; h: number } {
    const w = 600 * this.scale;
    const h = 400 * this.scale;
    return {
      x: (this.logicalW - w) / 2,
      y: this.logicalH / 2 - h / 2 + 40 * this.scale,
      w, h,
    };
  }

  private selectedZones(): HitZone[] | null {
    if (this.selectedIndex < 0) return null;
    const m = this.mortises[this.selectedIndex];
    if (m.state !== 'selected' && m.state !== 'operating') return null;
    const desk = this.deskRect();
    const cx = desk.x + desk.w / 2;
    const cy = desk.y + desk.h / 2;
    const s = this.scale;
    const tenon: HitZone = { kind: 'tenon', x: cx - 140 * s, y: cy - 50 * s, w: 100 * s, h: 80 * s };
    const mort: HitZone = { kind: 'mortise', x: cx + 40 * s, y: cy - 50 * s, w: 100 * s, h: 80 * s };
    const file: HitZone = { kind: 'file', x: cx - 50 * s, y: cy - 55 * s, w: 100 * s, h: 90 * s };
    return [tenon, mort, file];
  }

  private applyToolAt(type: ToolType, x: number, y: number): void {
    if (this.finished) return;
    if (this.selectedIndex < 0) {
      this.ui.showToast('请先点击选择一个榫卯结构');
      return;
    }
    const m = this.mortises[this.selectedIndex];
    if (m.state === 'completed' || m.merged) return;
    const zones = this.selectedZones();
    if (!zones) return;
    const hit = zones.find(z => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h);
    if (!hit) return;
    if (m.stage === 'idle') m.stage = 'need_file';
    let correct = false;
    if (type === 'file') {
      if (hit.kind === 'file' || hit.kind === 'tenon' || hit.kind === 'mortise') {
        if (m.stage === 'need_file') { correct = true; m.stage = 'need_chisel'; }
      }
    } else if (type === 'chisel') {
      if (hit.kind === 'mortise' || hit.kind === 'file') {
        if (m.stage === 'need_chisel') { correct = true; m.stage = 'need_hammer'; }
      }
    } else if (type === 'hammer') {
      if (hit.kind === 'tenon' || hit.kind === 'file') {
        if (m.stage === 'need_hammer') { correct = true; m.stage = 'need_file'; }
      }
    }

    this.totalOps++;
    if (type === 'hammer') this.hammerUses++;
    if (type === 'chisel') this.chiselUses++;
    if (type === 'file') this.fileUses++;

    if (correct) {
      this.correctOps++;
      m.state = 'operating';
      let gain = 0;
      if (type === 'hammer') { gain = 5; m.hammerOffset = 15 * this.scale; this.tenonHitY = y; }
      else if (type === 'chisel') { gain = 8; }
      else if (type === 'file') { gain = 10; }
      m.progress = Math.min(100, m.progress + gain);
      this.tools.emitEffect(type, x, y);
      this.ui.setProgress(m.progress);

      if (m.progress >= 100) {
        this.startMerge();
      }
    } else {
      m.progress = Math.max(0, m.progress - 10);
      this.health = Math.max(0, this.health - 5);
      this.ui.setProgress(m.progress);
      this.ui.setHealth(this.health);
      this.ui.showToast('木理已伤，顺序需调换');
      this.tools.emitEffect(type, x, y);
    }
  }

  private startMerge(): void {
    if (this.selectedIndex < 0) return;
    const m = this.mortises[this.selectedIndex];
    if (m.merged) return;
    m.mergeT = 0.001;
    this.tools.playSnapSound();
  }

  private finishMerge(): void {
    if (this.selectedIndex < 0) return;
    const m = this.mortises[this.selectedIndex];
    m.merged = true;
    m.state = 'completed';
    this.ui.updateIcon(this.selectedIndex, true);
    this.ui.setHint(`【${m.label}】拼合完成！请点击下一个榫卯图标继续`);
    const allDone = this.mortises.every(x => x.state === 'completed');
    if (allDone) {
      this.finished = true;
      this.elapsed = (performance.now() - this.startTime) / 1000;
      this.finishAnimStart = performance.now();
      this.waxAnim = { start: performance.now(), duration: 2000 };
      this.ui.setHint('全部榫卯拼合，大匠将成...');
    }
  }

  private computeScore(): number {
    const orderAcc = this.totalOps > 0 ? this.correctOps / this.totalOps : 1;
    const total = this.hammerUses + this.chiselUses + this.fileUses || 1;
    const bal = 1 - Math.abs(this.hammerUses - this.fileUses) / total * 0.5 - Math.abs(this.chiselUses - total / 3) / total * 0.5;
    const tool = Math.max(0, Math.min(1, bal));
    const wood = this.health / 100;
    const ideal = 60;
    const te = Math.max(0, 1 - Math.max(0, this.elapsed - ideal) / 120);
    return orderAcc * 40 + tool * 20 + wood * 20 + te * 20;
  }

  private loop = (): void => {
    this.rafId = requestAnimationFrame(this.loop);
    const now = performance.now();
    let dt = now - this.lastFrame;
    if (dt > 40) dt = 40;
    this.lastFrame = now;
    this.update(dt, now);
    this.render(now);
  };

  private update(dt: number, now: number): void {
    this.particles.update(dt);
    for (let i = 0; i < this.mortises.length; i++) {
      const m = this.mortises[i];
      if (m.hammerOffset > 0) {
        m.hammerOffset = Math.max(0, m.hammerOffset - dt * 0.04 * this.scale);
      }
      if (m.mergeT > 0 && !m.merged) {
        m.mergeT += dt / 800;
        if (m.mergeT >= 1) { m.mergeT = 1; this.finishMerge(); }
      }
    }
    if (this.health < 20) {
      this.crackEmitTimer -= dt;
      if (this.crackEmitTimer <= 0) {
        this.crackEmitTimer = 250 + Math.random() * 200;
        const desk = this.deskRect();
        this.particles.emit('crack',
          desk.x + desk.w / 2 + (Math.random() - 0.5) * desk.w * 0.2,
          desk.y + desk.h / 2 + (Math.random() - 0.5) * desk.h * 0.2,
          4, { color: '#FFFFFF' });
      }
    }
    if (this.finished) {
      if (this.waxAnim) {
        const t = (now - this.waxAnim.start) / this.waxAnim.duration;
        this.goldLineT = Math.max(0, Math.min(1, (t - 0.3) / 0.4));
        this.bigTextT = Math.max(0, Math.min(1, (t - 0.55) / 0.45));
        if (t >= 1) {
          this.waxAnim = null;
          const score = this.computeScore();
          this.ui.showFinish(this.elapsed, score);
        }
      }
    }
  }

  private easeOut(t: number): number { return 1 - Math.pow(1 - t, 3); }

  private render(now: number): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalW, this.logicalH);
    this.drawScene(ctx, now);
    this.drawDesk(ctx, now);
    this.drawExplodedView(ctx, now);
    this.drawFinishAnim(ctx, now);
    this.tools.render(ctx, this.scale, now);
  }

  private drawScene(ctx: CanvasRenderingContext2D, now: number): void {
    const wallY = this.logicalH * 0.55;
    const wallGrad = ctx.createLinearGradient(0, 0, 0, wallY);
    wallGrad.addColorStop(0, '#C9A882');
    wallGrad.addColorStop(1, '#B28A5E');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, this.logicalW, wallY);

    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 30; i++) {
      const y = (i * 23 + Math.sin(i) * 8) % wallY;
      ctx.fillStyle = i % 2 ? '#8B6F47' : '#5C3A1E';
      ctx.fillRect(0, y, this.logicalW, 1);
    }
    ctx.restore();

    this.drawToolSilhouettes(ctx, wallY);

    const floorGrad = ctx.createLinearGradient(0, wallY, 0, this.logicalH);
    floorGrad.addColorStop(0, '#E8CC95');
    floorGrad.addColorStop(1, '#C69A5A');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, wallY, this.logicalW, this.logicalH - wallY);

    ctx.save();
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 40; i++) {
      const y = wallY + 8 + i * 18;
      if (y > this.logicalH) break;
      ctx.fillStyle = i % 3 === 0 ? '#8B6F47' : '#6B4423';
      ctx.fillRect(0, y, this.logicalW, 1);
    }
    for (let i = 0; i < 12; i++) {
      const x = (this.logicalW / 12) * i + Math.sin(i * 2) * 20;
      ctx.fillStyle = '#6B4423';
      ctx.fillRect(x, wallY, 1, this.logicalH - wallY);
    }
    ctx.restore();
  }

  private drawToolSilhouettes(ctx: CanvasRenderingContext2D, wallY: number): void {
    const sx = 36 * this.scale;
    const sy = 50 * this.scale;
    const s = this.scale;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#3A2412';
    ctx.translate(sx, sy);

    for (let i = 0; i < 7; i++) {
      const ox = i * (36 * s);
      const oy = (i % 2) * (20 * s);
      ctx.save();
      ctx.translate(ox, oy);
      switch (i % 4) {
        case 0:
          ctx.fillRect(2 * s, 0, 4 * s, 70 * s);
          ctx.fillRect(-8 * s, 8 * s, 24 * s, 14 * s);
          break;
        case 1:
          ctx.beginPath();
          ctx.moveTo(4 * s, 0);
          ctx.lineTo(12 * s, 0);
          ctx.lineTo(18 * s, 70 * s);
          ctx.lineTo(-2 * s, 70 * s);
          ctx.closePath();
          ctx.fill();
          ctx.fillRect(-4 * s, 70 * s, 22 * s, 10 * s);
          break;
        case 2:
          ctx.beginPath();
          ctx.arc(6 * s, 8 * s, 14 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(4 * s, 18 * s, 4 * s, 58 * s);
          break;
        case 3:
          ctx.fillRect(4 * s, 0, 4 * s, 80 * s);
          ctx.fillRect(-6 * s, 4 * s, 24 * s, 6 * s);
          break;
      }
      ctx.restore();
    }

    ctx.translate(0, 110 * s);
    for (let i = 0; i < 5; i++) {
      const ox = i * (48 * s);
      ctx.save();
      ctx.translate(ox, 0);
      if (i % 2 === 0) {
        ctx.fillRect(-2 * s, 0, 6 * s, 90 * s);
        ctx.fillRect(-18 * s, -2 * s, 36 * s, 10 * s);
        ctx.fillRect(-18 * s, 82 * s, 36 * s, 10 * s);
        for (let j = 0; j < 5; j++) {
          ctx.fillRect(-16 * s + j * 8 * s, 12 * s, 4 * s, 64 * s);
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(16 * s, 30 * s, 0, 78 * s);
        ctx.lineWidth = 5 * s;
        ctx.strokeStyle = '#3A2412';
        ctx.stroke();
        ctx.fillStyle = '#3A2412';
        ctx.beginPath();
        ctx.arc(-2 * s, 0, 4 * s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private drawDesk(ctx: CanvasRenderingContext2D, now: number): void {
    const d = this.deskRect();
    ctx.save();
    const legW = 28 * this.scale;
    const legH = 120 * this.scale;
    const deskBottomY = d.y + d.h;

    ctx.fillStyle = 'rgba(60,40,20,0.35)';
    ctx.beginPath();
    ctx.ellipse(d.x + d.w / 2, deskBottomY + legH - 4 * this.scale, d.w * 0.5, 12 * this.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    const legColor = ctx.createLinearGradient(0, deskBottomY, 0, deskBottomY + legH);
    legColor.addColorStop(0, '#A0834F');
    legColor.addColorStop(1, '#6B4423');
    ctx.fillStyle = legColor;
    [[d.x + 12, d.y + d.h - 4], [d.x + d.w - legW - 12, d.y + d.h - 4]].forEach(([lx, ly]) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(legW, 0);
      ctx.lineTo(legW - 4 * this.scale, legH);
      ctx.lineTo(4 * this.scale, legH);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,20,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(60,40,20,0.15)';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(legW / 2 - 1, 20 * this.scale + i * 16 * this.scale, 2, 8 * this.scale);
      }
      ctx.restore();
    });

    const topGrad = ctx.createLinearGradient(d.x, d.y, d.x, d.y + d.h);
    topGrad.addColorStop(0, '#C9A96E');
    topGrad.addColorStop(1, '#A0834F');
    ctx.fillStyle = topGrad;
    this.roundRect(ctx, d.x, d.y, d.w, d.h, 8 * this.scale);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    this.roundRect(ctx, d.x, d.y, d.w, d.h, 8 * this.scale);
    ctx.clip();
    for (let i = 0; i < 24; i++) {
      const y = d.y + i * (d.h / 24) + Math.sin(i * 0.8) * 2;
      const alpha = 0.08 + Math.abs(Math.sin(i * 1.3)) * 0.08;
      ctx.fillStyle = `rgba(92,58,30,${alpha})`;
      ctx.fillRect(d.x, y, d.w, 1 + (i % 3 === 0 ? 1 : 0));
    }
    for (let i = 0; i < 8; i++) {
      const x = d.x + 30 + i * (d.w - 60) / 8;
      ctx.strokeStyle = 'rgba(92,58,30,0.12)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, d.y + 10);
      ctx.bezierCurveTo(x + 20, d.y + d.h * 0.4, x - 20, d.y + d.h * 0.7, x, d.y + d.h - 10);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const hi = ctx.createLinearGradient(d.x, d.y, d.x + d.w * 0.5, d.y + d.h);
    hi.addColorStop(0, 'rgba(255,255,255,0.18)');
    hi.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hi;
    this.roundRect(ctx, d.x + 2, d.y + 2, d.w * 0.6, d.h * 0.5, 8 * this.scale);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(60,40,20,0.55)';
    ctx.lineWidth = 1.6;
    this.roundRect(ctx, d.x, d.y, d.w, d.h, 8 * this.scale);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(60,40,20,0.25)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, d.x + 10 * this.scale, d.y + 10 * this.scale, d.w - 20 * this.scale, d.h - 20 * this.scale, 5 * this.scale);
    ctx.stroke();

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    r = Math.min(r, w / 2, h / 2);
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

  private drawExplodedView(ctx: CanvasRenderingContext2D, now: number): void {
    if (this.selectedIndex < 0) return;
    const m = this.mortises[this.selectedIndex];
    if (m.state === 'completed' && m.merged) return;
    const desk = this.deskRect();
    const cx = desk.x + desk.w / 2;
    const cy = desk.y + desk.h / 2;
    const s = this.scale;
    const explode = m.mergeT > 0 ? (1 - this.easeOut(m.mergeT)) : 1;
    const pulse = Math.sin(now / 600) * 0.06 + 1;
    const rot = (now % 4000) / 4000 * Math.PI * 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1.2 * s * pulse, 1.2 * s * pulse);
    if (m.mergeT <= 0) ctx.rotate(rot);
    ctx.globalAlpha = 0.88;

    const offset = 90 * explode;
    const w = 70, h = 55;

    const tenonGrad = ctx.createLinearGradient(-w / 2 - offset, -h / 2, w / 2 - offset, h / 2);
    tenonGrad.addColorStop(0, '#C9A96E'); tenonGrad.addColorStop(1, '#9C7838');
    const mortGrad = ctx.createLinearGradient(-w / 2 + offset, -h / 2, w / 2 + offset, h / 2);
    mortGrad.addColorStop(0, '#B89557'); mortGrad.addColorStop(1, '#8B6914');

    const tenonX = -w / 2 - offset;
    const mortX = -w / 2 + offset;
    const tenonShift = m.hammerOffset > 0 ? Math.sin(now / 20) * m.hammerOffset * 0.15 : 0;

    this.drawTenonShape(ctx, m.type, tenonX + tenonShift, -h / 2, w, h, tenonGrad, '#FF4444');
    this.drawMortiseShape(ctx, m.type, mortX, -h / 2, w, h, mortGrad, '#4444FF');

    if (m.mergeT <= 0) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.font = `bold ${14}px 'KaiTi','楷体',serif`;
      ctx.fillStyle = '#FF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText('榫头', -offset, -h / 2 - 12);
      ctx.fillText('榫头', -offset, -h / 2 - 12);
      ctx.fillStyle = '#4444FF';
      ctx.strokeText('卯口', offset, -h / 2 - 12);
      ctx.fillText('卯口', offset, -h / 2 - 12);
      ctx.restore();
    }

    ctx.restore();

    if (m.mergeT <= 0) {
      const zones = this.selectedZones();
      if (zones) {
        ctx.save();
        ctx.globalAlpha = 0.45 + Math.sin(now / 250) * 0.15;
        for (const z of zones) {
          let col = '#FFFFFF';
          if (z.kind === 'tenon') col = '#FF4444';
          else if (z.kind === 'mortise') col = '#4444FF';
          else col = '#FFD700';
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          this.roundRect(ctx, z.x, z.y, z.w, z.h, 6);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.font = `${11}px 'KaiTi','楷体',serif`;
        ctx.fillStyle = '#FF4444';
        zones.forEach(z => {
          if (z.kind === 'tenon') { ctx.fillText('敲·榫头', z.x + 4, z.y + z.h - 4); }
          else if (z.kind === 'mortise') { ctx.fillStyle = '#4444FF'; ctx.fillText('凿·卯口', z.x + 4, z.y + z.h - 4); ctx.fillStyle = '#FF4444'; }
          else { ctx.fillStyle = '#8B6914'; ctx.fillText('锉·打磨区', z.x + 2, z.y + z.h - 4); ctx.fillStyle = '#FF4444'; }
        });
        ctx.restore();
      }
    }
  }

  private drawTenonShape(ctx: CanvasRenderingContext2D, type: MortiseType, x: number, y: number, w: number, h: number, fill: CanvasGradient | string, stroke: string): void {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    switch (type) {
      case 'straight':
        ctx.rect(x, y, w, h);
        break;
      case 'dovetail':
        ctx.moveTo(x, y);
        ctx.lineTo(x + w * 0.3, y);
        ctx.lineTo(x + w, y + h * 0.2);
        ctx.lineTo(x + w, y + h * 0.8);
        ctx.lineTo(x + w * 0.3, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        break;
      case 'mortise_tenon':
        ctx.rect(x, y + h * 0.3, w * 0.8, h * 0.4);
        ctx.rect(x + w * 0.8, y, w * 0.2, h);
        break;
      case 'shoulder':
        ctx.moveTo(x, y + h * 0.1);
        ctx.lineTo(x + w * 0.7, y + h * 0.1);
        ctx.lineTo(x + w * 0.7, y);
        ctx.lineTo(x + w, y + h * 0.35);
        ctx.lineTo(x + w, y + h * 0.65);
        ctx.lineTo(x + w * 0.7, y + h);
        ctx.lineTo(x + w * 0.7, y + h * 0.9);
        ctx.lineTo(x, y + h * 0.9);
        ctx.closePath();
        break;
      case 'fishtail':
        ctx.moveTo(x + w * 0.4, y);
        ctx.lineTo(x + w * 0.6, y);
        ctx.lineTo(x + w * 0.55, y + h * 0.3);
        ctx.lineTo(x + w, y + h * 0.15);
        ctx.lineTo(x + w * 0.85, y + h * 0.5);
        ctx.lineTo(x + w, y + h * 0.85);
        ctx.lineTo(x + w * 0.55, y + h * 0.7);
        ctx.lineTo(x + w * 0.6, y + h);
        ctx.lineTo(x + w * 0.4, y + h);
        ctx.lineTo(x + w * 0.45, y + h * 0.7);
        ctx.lineTo(x, y + h * 0.85);
        ctx.lineTo(x + w * 0.15, y + h * 0.5);
        ctx.lineTo(x, y + h * 0.15);
        ctx.lineTo(x + w * 0.45, y + h * 0.3);
        ctx.closePath();
        break;
      case 'cross_lap':
        ctx.rect(x, y, w, h);
        break;
    }
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#5C3A1E';
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + (h / 5) * i);
      ctx.lineTo(x + w - 4, y + (h / 5) * i + Math.sin(i) * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  private drawMortiseShape(ctx: CanvasRenderingContext2D, type: MortiseType, x: number, y: number, w: number, h: number, fill: CanvasGradient | string, stroke: string): void {
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    const ix = x, iy = y, iw = w, ih = h;
    switch (type) {
      case 'straight':
        ctx.rect(ix, iy + ih * 0.2, iw * 0.5, ih * 0.6);
        break;
      case 'dovetail':
        ctx.moveTo(ix + iw * 0.5, iy + ih * 0.2);
        ctx.lineTo(ix + iw * 0.2, iy);
        ctx.lineTo(ix, iy);
        ctx.lineTo(ix, iy + ih);
        ctx.lineTo(ix + iw * 0.2, iy + ih);
        ctx.lineTo(ix + iw * 0.5, iy + ih * 0.8);
        ctx.closePath();
        break;
      case 'mortise_tenon':
        ctx.rect(ix + iw * 0.15, iy + ih * 0.3, iw * 0.45, ih * 0.4);
        break;
      case 'shoulder':
        ctx.moveTo(ix, iy + ih * 0.35);
        ctx.lineTo(ix + iw * 0.3, iy);
        ctx.lineTo(ix + iw * 0.3, iy + ih * 0.1);
        ctx.lineTo(ix + iw, iy + ih * 0.1);
        ctx.lineTo(ix + iw, iy + ih * 0.9);
        ctx.lineTo(ix + iw * 0.3, iy + ih * 0.9);
        ctx.lineTo(ix + iw * 0.3, iy + ih);
        ctx.lineTo(ix, iy + ih * 0.65);
        ctx.closePath();
        break;
      case 'fishtail':
        ctx.moveTo(ix + iw * 0.5, iy + ih * 0.15);
        ctx.lineTo(ix + iw * 0.15, iy + ih * 0.3);
        ctx.lineTo(ix, iy + ih * 0.5);
        ctx.lineTo(ix + iw * 0.15, iy + ih * 0.7);
        ctx.lineTo(ix + iw * 0.5, iy + ih * 0.85);
        ctx.lineTo(ix + iw * 0.85, iy + ih * 0.7);
        ctx.lineTo(ix + iw, iy + ih * 0.5);
        ctx.lineTo(ix + iw * 0.85, iy + ih * 0.3);
        ctx.closePath();
        break;
      case 'cross_lap':
        ctx.rect(ix, iy + ih * 0.3, iw, ih * 0.4);
        break;
    }
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#5C3A1E';
    ctx.lineWidth = 0.8;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 4, y + (h / 5) * i);
      ctx.lineTo(x + w - 4, y + (h / 5) * i + Math.cos(i) * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  private drawFinishAnim(ctx: CanvasRenderingContext2D, now: number): void {
    if (!this.finished) return;
    const desk = this.deskRect();
    if (this.waxAnim) {
      const t = Math.min(1, (now - this.waxAnim.start) / this.waxAnim.duration);
      const et = this.easeOut(t);
      const maxR = Math.sqrt(desk.w * desk.w + desk.h * desk.h) * 0.6;
      const r = 10 + et * (maxR - 10);
      const cx = desk.x + desk.w / 2;
      const cy = desk.y + desk.h / 2;
      ctx.save();
      ctx.beginPath();
      this.roundRect(ctx, desk.x, desk.y, desk.w, desk.h, 8 * this.scale);
      ctx.clip();
      const alpha = (1 - et) * 0.55;
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      grad.addColorStop(0, `rgba(255,215,0,${alpha})`);
      grad.addColorStop(0.6, `rgba(255,215,0,${alpha * 0.6})`);
      grad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(desk.x - 10, desk.y - 10, desk.w + 20, desk.h + 20);
      ctx.restore();
    }
    if (this.goldLineT > 0) {
      ctx.save();
      const lw = 3 + (1 - this.goldLineT) * 6;
      ctx.lineWidth = lw;
      ctx.strokeStyle = '#DAA520';
      ctx.shadowColor = 'rgba(255,215,0,0.6)';
      ctx.shadowBlur = 12;
      ctx.setLineDash([(desk.w * 2 + desk.h * 2) * (1 - this.goldLineT), 10000]);
      this.roundRect(ctx, desk.x + 4, desk.y + 4, desk.w - 8, desk.h - 8, 8 * this.scale);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (this.bigTextT > 0) {
      const s = this.easeOut(this.bigTextT);
      const desk = this.deskRect();
      ctx.save();
      ctx.translate(desk.x + desk.w / 2, desk.y + desk.h / 2);
      ctx.scale(s, s);
      ctx.globalAlpha = Math.min(1, this.bigTextT * 1.4);
      const size = 60 * this.scale;
      ctx.font = `bold ${size}px 'Ma Shan Zheng','KaiTi','楷体',serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,215,0,0.9)';
      ctx.shadowBlur = 22;
      const grad = ctx.createLinearGradient(-150, 0, 150, 0);
      grad.addColorStop(0, '#FFD700');
      grad.addColorStop(0.5, '#FFC125');
      grad.addColorStop(1, '#DAA520');
      ctx.fillStyle = grad;
      const chars = '大匠成器'.split('');
      const spacing = (size * 1.2);
      const total = (chars.length - 1) * spacing;
      chars.forEach((c, i) => {
        ctx.save();
        ctx.translate(-total / 2 + i * spacing, 0);
        const jiggle = Math.sin(now / 400 + i) * 2 * (1 - this.bigTextT);
        ctx.rotate(jiggle * 0.004);
        ctx.strokeStyle = 'rgba(139,69,19,0.7)';
        ctx.lineWidth = 3;
        ctx.strokeText(c, 0, 0);
        ctx.fillText(c, 0, 0);
        ctx.restore();
      });
      ctx.restore();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    new Game();
  } catch (e) {
    console.error(e);
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0008;color:#fff;font-size:14px;';
    el.textContent = '初始化失败：' + (e as Error).message;
    document.body.appendChild(el);
  }
});
