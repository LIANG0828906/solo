import { Slip, BrushStyle, StrokePoint } from './slip';
import { Rope } from './rope';
import { Seal, STAMP_OPTIONS, StampOption } from './seal';

type Phase = '书写' | '编连' | '封缄' | '展开';

interface UIButton {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  visible: boolean;
  hover: boolean;
  color: string;
  textColor: string;
  shape: 'rect' | 'semicircle';
  fontSize?: number;
}

class App {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private phase: Phase = '书写';
  private slips: Slip[] = [];
  private rope!: Rope;
  private seal!: Seal;
  private brushStyle: BrushStyle = 'medium';
  private prevBrushStyle: BrushStyle = 'medium';
  private brushAnimProg = 1;
  private undoStack: number[] = [];
  private isWriting = false;
  private currentSlipIdx = -1;
  private currentPoints: StrokePoint[] = [];
  private lastMX = 0;
  private lastMY = 0;
  private lastMTime = 0;
  private buttons: Map<string, UIButton> = new Map();
  private looseRopePhase = 0;
  private lastTime = 0;
  private hoverSlipIdx = -1;
  private rippleBtn: string | null = null;
  private rippleProg = 0;
  private slipW = 40;
  private slipH = 120;
  private isSmall = false;
  private controlX = 0;
  private controlW = 0;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    this.rope = new Rope(10);
    this.seal = new Seal();

    this.resize();
    this.initSlips();
    this.initButtons();
    this.setupEvents();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private resize(): void {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.isSmall = this.W < 1024;
    this.slipW = this.isSmall ? 30 : 40;
    this.slipH = this.isSmall ? 90 : 120;
    if (this.isSmall) {
      this.controlX = 0;
      this.controlW = this.W;
    } else {
      this.controlX = this.W * 0.6;
      this.controlW = this.W * 0.4;
    }
    this.positionSlips();
  }

  private positionSlips(): void {
    const count = 10;
    const gap = this.isSmall ? 5 : 8;
    const totalW = count * this.slipW + (count - 1) * gap;
    const areaW = this.isSmall ? this.W : this.controlX;
    const startX = (areaW - totalW) / 2;
    const startY = this.isSmall
      ? (this.H * 0.45 - this.slipH) / 2
      : (this.H - this.slipH) / 2;

    for (let i = 0; i < this.slips.length; i++) {
      this.slips[i].x = startX + i * (this.slipW + gap);
      this.slips[i].y = startY;
      this.slips[i].width = this.slipW;
      this.slips[i].height = this.slipH;
    }
  }

  private initSlips(): void {
    this.slips = [];
    for (let i = 0; i < 10; i++) {
      this.slips.push(new Slip(i, 0, 0, this.slipW, this.slipH));
    }
    this.positionSlips();
  }

  private initButtons(): void {
    const cx = this.isSmall ? this.W / 2 : this.controlX + this.controlW / 2;
    const btnW = 80;
    const btnH = 32;
    const gap = 12;

    const brushY = this.isSmall ? this.H - 90 : 70;
    const brushX = cx - (btnW * 3 + gap * 2) / 2;

    this.buttons.set('fine', {
      id: 'fine', x: brushX, y: brushY, w: btnW, h: btnH,
      label: '细锋', visible: true, hover: false,
      color: '#C0C0C0', textColor: '#333', shape: 'rect'
    });
    this.buttons.set('medium', {
      id: 'medium', x: brushX + btnW + gap, y: brushY, w: btnW, h: btnH,
      label: '中锋', visible: true, hover: false,
      color: '#A9A9A9', textColor: '#333', shape: 'rect'
    });
    this.buttons.set('thick', {
      id: 'thick', x: brushX + (btnW + gap) * 2, y: brushY, w: btnW, h: btnH,
      label: '粗锋', visible: true, hover: false,
      color: '#808080', textColor: '#FFF', shape: 'rect'
    });

    const actionY = this.isSmall ? this.H - 50 : this.H / 2 - 20;

    this.buttons.set('bind', {
      id: 'bind', x: cx - btnW / 2, y: actionY, w: btnW + 20, h: btnH + 4,
      label: '编连', visible: true, hover: false,
      color: '#8B6914', textColor: '#FFF', shape: 'rect'
    });

    const undoY = this.isSmall ? this.H - 45 : actionY + btnH + gap + 16;
    this.buttons.set('undo', {
      id: 'undo', x: cx - 25, y: undoY, w: 50, h: 25,
      label: '退墨', visible: true, hover: false,
      color: '#1A1A1A', textColor: '#FFF', shape: 'semicircle'
    });

    this.buttons.set('unroll', {
      id: 'unroll', x: cx - 55, y: actionY + 80, w: 110, h: 36,
      label: '展开简册', visible: false, hover: false,
      color: '#8B6914', textColor: '#FFF', shape: 'rect'
    });
  }

  private setupEvents(): void {
    window.addEventListener('resize', () => {
      this.resize();
      this.initButtons();
    });

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.onMouseDown({ clientX: t.clientX, clientY: t.clientY, button: 0 } as MouseEvent);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.onMouseMove({ clientX: t.clientX, clientY: t.clientY } as MouseEvent);
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => this.onMouseUp());

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this.doUndo();
      }
    });
  }

  private onMouseDown(e: MouseEvent): void {
    const mx = e.clientX;
    const my = e.clientY;

    for (const [, btn] of this.buttons) {
      if (btn.visible && this.hitTestButton(mx, my, btn)) {
        this.onButtonClick(btn.id);
        return;
      }
    }

    if (this.phase === '书写') {
      for (let i = 0; i < this.slips.length; i++) {
        if (this.slips[i].containsPoint(mx, my)) {
          this.isWriting = true;
          this.currentSlipIdx = i;
          this.currentPoints = [];
          this.lastMX = mx;
          this.lastMY = my;
          this.lastMTime = performance.now();
          this.addWritingPoint(mx, my, 0);
          return;
        }
      }
    }

    if (this.phase === '编连') {
      for (let i = 0; i < this.slips.length; i++) {
        const slip = this.slips[i];
        if (slip.bound) continue;
        const groove = slip.getGroovePositions().bottom;
        const dx = mx - groove.x;
        const dy = my - groove.y;
        if (dx * dx + dy * dy < 225) {
          this.bindSlip(i);
          return;
        }
      }
    }

    if (this.phase === '封缄' && this.seal.rolled && !this.seal.selectedStamp) {
      if (this.seal.showStampSelector) {
        const stamp = this.seal.hitTestStampSelector(mx, my);
        if (stamp) {
          this.seal.selectStamp(stamp);
          const unrollBtn = this.buttons.get('unroll')!;
          unrollBtn.visible = true;
          return;
        }
        this.seal.showStampSelector = false;
        return;
      }
      if (this.seal.hitTestClay(mx, my)) {
        this.seal.showStampSelector = true;
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const mx = e.clientX;
    const my = e.clientY;

    if (this.isWriting && this.currentSlipIdx >= 0) {
      const now = performance.now();
      const dx = mx - this.lastMX;
      const dy = my - this.lastMY;
      const dt = now - this.lastMTime;
      const speed = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt * 1000 : 0;
      this.addWritingPoint(mx, my, speed);
      this.lastMX = mx;
      this.lastMY = my;
      this.lastMTime = now;
    }

    this.hoverSlipIdx = -1;
    for (let i = 0; i < this.slips.length; i++) {
      if (this.slips[i].containsPoint(mx, my)) {
        this.hoverSlipIdx = i;
        break;
      }
    }

    for (const [, btn] of this.buttons) {
      btn.hover = btn.visible && this.hitTestButton(mx, my, btn);
    }

    if (this.phase === '编连') {
      this.canvas.style.cursor = 'pointer';
    } else if (this.phase === '书写') {
      this.canvas.style.cursor = this.hoverSlipIdx >= 0 ? 'crosshair' : 'default';
    } else {
      this.canvas.style.cursor = 'default';
    }

    if (this.buttons.get('undo')?.hover) {
      this.rippleBtn = 'undo';
      this.rippleProg = 0;
    }
  }

  private onMouseUp(): void {
    if (this.isWriting && this.currentSlipIdx >= 0 && this.currentPoints.length >= 2) {
      this.slips[this.currentSlipIdx].addStroke([...this.currentPoints], this.brushStyle);
      this.undoStack.push(this.currentSlipIdx);
      if (this.undoStack.length > 50) this.undoStack.shift();
    }
    this.isWriting = false;
    this.currentSlipIdx = -1;
    this.currentPoints = [];
  }

  private addWritingPoint(x: number, y: number, speed: number): void {
    this.currentPoints.push({ x, y, speed, time: performance.now() });
  }

  private onButtonClick(id: string): void {
    switch (id) {
      case 'fine':
      case 'medium':
      case 'thick':
        this.prevBrushStyle = this.brushStyle;
        this.brushStyle = id as BrushStyle;
        this.brushAnimProg = 0;
        break;
      case 'bind':
        this.phase = '编连';
        this.buttons.get('bind')!.visible = false;
        this.buttons.get('fine')!.visible = false;
        this.buttons.get('medium')!.visible = false;
        this.buttons.get('thick')!.visible = false;
        break;
      case 'undo':
        this.doUndo();
        break;
      case 'unroll':
        this.seal.startUnrolling();
        this.buttons.get('unroll')!.visible = false;
        break;
    }
  }

  private doUndo(): void {
    if (this.undoStack.length === 0) return;
    const slipIdx = this.undoStack.pop()!;
    this.slips[slipIdx].undoStroke();
  }

  private bindSlip(idx: number): void {
    const slip = this.slips[idx];
    const groove = slip.getGroovePositions().bottom;
    this.rope.addKnot(idx, groove.x, groove.y);
    slip.bound = true;
    slip.triggerTilt();

    if (this.rope.isFullyBound()) {
      setTimeout(() => {
        this.phase = '封缄';
        this.seal.startRolling();
        this.buttons.get('undo')!.visible = false;
      }, 400);
    }
  }

  private hitTestButton(mx: number, my: number, btn: UIButton): boolean {
    if (btn.shape === 'semicircle') {
      const cx = btn.x + btn.w / 2;
      const cy = btn.y + btn.h;
      const rx = btn.w / 2;
      const ry = btn.h;
      const dx = (mx - cx) / rx;
      const dy = (my - cy) / ry;
      return dx * dx + dy * dy <= 1 && my <= cy;
    }
    return mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h;
  }

  private update(dt: number): void {
    for (const slip of this.slips) {
      slip.update(dt);
      if (this.hoverSlipIdx >= 0 && this.slips[this.hoverSlipIdx] === slip) {
        slip.hoverBrightness = Math.min(slip.hoverBrightness + dt * 10, 1);
      } else {
        slip.hoverBrightness = Math.max(slip.hoverBrightness - dt * 10, 0);
      }
    }

    this.rope.update(dt);
    this.seal.update(dt);

    if (this.brushAnimProg < 1) {
      this.brushAnimProg = Math.min(1, this.brushAnimProg + dt * 5);
    }

    if (this.rippleBtn) {
      this.rippleProg += dt * 3.3;
      if (this.rippleProg >= 1) this.rippleBtn = null;
    }

    this.looseRopePhase += dt;

    if (this.seal.unrolled) {
      this.phase = '展开';
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    this.drawWorkbench(ctx);

    if (this.phase === '封缄' && (this.seal.rolling || this.seal.rolled) && !this.seal.unrolling && !this.seal.unrolled) {
      this.drawRollingSlips(ctx);
    } else if (this.seal.unrolling || this.seal.unrolled) {
      this.drawUnrollingSlips(ctx);
    } else {
      this.drawSlips(ctx);
    }

    if (this.phase === '书写' || this.phase === '编连') {
      this.drawLooseRope(ctx);
    }

    if (this.phase === '编连') {
      this.drawRope(ctx);
    }

    if (this.phase === '封缄') {
      const slipArea = this.getSlipAreaCenter();
      this.seal.render(ctx, slipArea.cx, slipArea.cy);
    }

    if (this.phase === '展开') {
      const slipArea = this.getSlipAreaCenter();
      this.drawSlipNumbers(ctx);
      this.seal.renderOnUnrolled(ctx, slipArea.cx, this.slips[0].y);
    }

    if (this.isWriting) {
      this.drawWritingCursor(ctx);
    }

    this.drawBrushIndicator(ctx);
    this.drawControlPanel(ctx);
    this.drawButtons(ctx);

    if (this.rippleBtn === 'undo') {
      this.drawRipple(ctx);
    }
  }

  private drawWorkbench(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#A0724B');
    grad.addColorStop(0.5, '#8B6240');
    grad.addColorStop(1, '#7A5535');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.strokeStyle = 'rgba(60, 35, 15, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < this.W; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this.H);
      ctx.stroke();
    }
    for (let j = 0; j < this.H; j += 30) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(this.W, j);
      ctx.stroke();
    }

    const borderW = this.isSmall ? 0 : this.controlX;
    if (borderW > 0) {
      ctx.strokeStyle = 'rgba(60, 35, 15, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(borderW, 0);
      ctx.lineTo(borderW, this.H);
      ctx.stroke();
    }
  }

  private drawSlips(ctx: CanvasRenderingContext2D): void {
    for (const slip of this.slips) {
      slip.render(ctx);
    }
  }

  private drawRollingSlips(ctx: CanvasRenderingContext2D): void {
    const slipRects = this.slips.map(s => ({
      x: s.x, y: s.y, width: s.width, height: s.height
    }));
    this.seal.renderRollAnimation(ctx, slipRects, this.seal.rollProgress);
  }

  private drawUnrollingSlips(ctx: CanvasRenderingContext2D): void {
    const slipRects = this.slips.map(s => ({
      x: s.x, y: s.y, width: s.width, height: s.height
    }));
    this.seal.renderUnrollAnimation(ctx, slipRects, this.seal.unrollProgress);

    if (this.seal.unrollProgress > 0.5) {
      const alpha = (this.seal.unrollProgress - 0.5) * 2;
      ctx.save();
      ctx.globalAlpha = alpha;
      const grooves = this.slips.map(s => s.getGroovePositions());
      this.rope.render(ctx, grooves);
      ctx.restore();
    }
  }

  private drawSlipNumbers(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = '#4A2C1A';
    ctx.font = `${Math.max(9, this.slipW * 0.25)}px serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    for (let i = 0; i < this.slips.length; i++) {
      const slip = this.slips[i];
      ctx.fillText(`${i + 1}`, slip.x + slip.width - 3, slip.y + 3);
    }
    ctx.restore();
  }

  private drawLooseRope(ctx: CanvasRenderingContext2D): void {
    if (this.rope.bindingOrder.length > 0) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(194, 166, 112, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    const unboundSlips = this.slips.filter(s => !s.bound);
    if (unboundSlips.length < 2) { ctx.restore(); return; }

    for (const grooveType of ['bottom'] as const) {
      ctx.beginPath();
      for (let i = 0; i < unboundSlips.length; i++) {
        const groove = unboundSlips[i].getGroovePositions()[grooveType];
        if (i === 0) ctx.moveTo(groove.x, groove.y);
        else {
          const prev = unboundSlips[i - 1].getGroovePositions()[grooveType];
          const cpx = (prev.x + groove.x) / 2;
          const cpy = (prev.y + groove.y) / 2 + Math.sin(this.looseRopePhase * 2 + i) * 5;
          ctx.quadraticCurveTo(cpx, cpy, groove.x, groove.y);
        }
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawRope(ctx: CanvasRenderingContext2D): void {
    const grooves = this.slips.map(s => s.getGroovePositions());
    this.rope.render(ctx, grooves);

    ctx.fillStyle = '#4A2C1A';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    const progressText = `编连进度: ${this.rope.bindingOrder.length}/10`;
    const cx = this.isSmall ? this.W / 2 : this.controlX + this.controlW / 2;
    const py = this.isSmall ? this.H * 0.45 + this.slipH + 30 : this.slips[0].y + this.slipH + 30;
    ctx.fillText(progressText, cx, py);

    const barW = 120;
    const barH = 6;
    const barX = cx - barW / 2;
    const barY = py + 10;
    ctx.fillStyle = 'rgba(74, 44, 26, 0.3)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#B8860B';
    ctx.fillRect(barX, barY, barW * this.rope.getBindingProgress(), barH);
  }

  private drawWritingCursor(ctx: CanvasRenderingContext2D): void {
    const mult = this.brushStyle === 'fine' ? 0.6 : this.brushStyle === 'thick' ? 1.5 : 1;
    const animP = this.easeInOut(this.brushAnimProg);
    const size = (2 + mult * 2) * (0.5 + animP * 0.5);
    ctx.save();
    ctx.fillStyle = 'rgba(26, 26, 26, 0.3)';
    ctx.beginPath();
    ctx.arc(this.lastMX, this.lastMY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBrushIndicator(ctx: CanvasRenderingContext2D): void {
    const animP = this.easeInOut(this.brushAnimProg);
    const prev = this.prevBrushStyle;
    const curr = this.brushStyle;
    const prevMult = prev === 'fine' ? 0.6 : prev === 'thick' ? 1.5 : 1;
    const currMult = curr === 'fine' ? 0.6 : curr === 'thick' ? 1.5 : 1;
    const mult = prevMult + (currMult - prevMult) * animP;
    const tipW = 2 + mult * 3;
    const tipH = 10 + mult * 5;

    const ix = this.isSmall ? 30 : 30;
    const iy = this.isSmall ? 30 : this.H / 2 + 80;

    ctx.save();
    ctx.translate(ix, iy);

    ctx.fillStyle = '#5C3A1E';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(4, 0);
    ctx.lineTo(3, -20);
    ctx.lineTo(-3, -20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.moveTo(-tipW / 2, 0);
    ctx.lineTo(tipW / 2, 0);
    ctx.lineTo(tipW * 0.3, tipH);
    ctx.lineTo(-tipW * 0.3, tipH);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawControlPanel(ctx: CanvasRenderingContext2D): void {
    if (this.isSmall) return;

    const cx = this.controlX + this.controlW / 2;
    const phaseY = 35;

    ctx.save();
    ctx.fillStyle = '#4A2C1A';
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.phase, cx, phaseY);

    ctx.strokeStyle = 'rgba(74, 44, 26, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.controlX + 30, phaseY + 18);
    ctx.lineTo(this.controlX + this.controlW - 30, phaseY + 18);
    ctx.stroke();

    ctx.fillStyle = 'rgba(74, 44, 26, 0.5)';
    ctx.font = '13px serif';
    ctx.fillText(this.getPhaseHint(), cx, phaseY + 36);
    ctx.restore();
  }

  private getPhaseHint(): string {
    switch (this.phase) {
      case '书写': return '在竹简上拖拽书写文字';
      case '编连': return '依次点击竹简凹槽编连';
      case '封缄': return '点击封泥选择印章';
      case '展开': return '简册已展开，查看全文';
    }
  }

  private drawButtons(ctx: CanvasRenderingContext2D): void {
    for (const [, btn] of this.buttons) {
      if (!btn.visible) continue;

      ctx.save();

      if (btn.shape === 'semicircle') {
        this.drawSemicircleBtn(ctx, btn);
      } else {
        this.drawRectBtn(ctx, btn);
      }

      ctx.restore();
    }
  }

  private drawRectBtn(ctx: CanvasRenderingContext2D, btn: UIButton): void {
    const brightness = btn.hover ? 1.15 : 1;
    ctx.fillStyle = btn.color;
    if (btn.hover) {
      ctx.filter = `brightness(${brightness})`;
    }

    const r = 6;
    ctx.beginPath();
    ctx.moveTo(btn.x + r, btn.y);
    ctx.lineTo(btn.x + btn.w - r, btn.y);
    ctx.arcTo(btn.x + btn.w, btn.y, btn.x + btn.w, btn.y + r, r);
    ctx.lineTo(btn.x + btn.w, btn.y + btn.h - r);
    ctx.arcTo(btn.x + btn.w, btn.y + btn.h, btn.x + btn.w - r, btn.y + btn.h, r);
    ctx.lineTo(btn.x + r, btn.y + btn.h);
    ctx.arcTo(btn.x, btn.y + btn.h, btn.x, btn.y + btn.h - r, r);
    ctx.lineTo(btn.x, btn.y + r);
    ctx.arcTo(btn.x, btn.y, btn.x + r, btn.y, r);
    ctx.closePath();
    ctx.fill();

    if (btn.id === 'unroll') {
      ctx.strokeStyle = 'rgba(200, 170, 100, 0.4)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 3; i++) {
        const cx = btn.x + btn.w * (0.25 + i * 0.25);
        const cy = btn.y + btn.h / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, Math.PI * 0.3, Math.PI * 1.3);
        ctx.stroke();
      }
    }

    if (['fine', 'medium', 'thick'].includes(btn.id) && btn.id === this.brushStyle) {
      ctx.strokeStyle = '#4A2C1A';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.filter = 'none';
    ctx.fillStyle = btn.textColor;
    ctx.font = `${btn.fontSize || 14}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }

  private drawSemicircleBtn(ctx: CanvasRenderingContext2D, btn: UIButton): void {
    const cx = btn.x + btn.w / 2;
    const cy = btn.y + btn.h;

    const brightness = btn.hover ? 1.15 : 1;
    ctx.fillStyle = btn.color;
    if (btn.hover) {
      ctx.filter = `brightness(${brightness})`;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, btn.w / 2, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.filter = 'none';

    ctx.fillStyle = btn.textColor;
    ctx.font = '10px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, cx, cy - btn.h / 2);
  }

  private drawRipple(ctx: CanvasRenderingContext2D): void {
    const btn = this.buttons.get('undo');
    if (!btn) return;
    const cx = btn.x + btn.w / 2;
    const cy = btn.y + btn.h;
    const r = btn.w / 2 + this.rippleProg * 15;

    ctx.save();
    ctx.strokeStyle = `rgba(100, 100, 100, ${1 - this.rippleProg})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.stroke();
    ctx.restore();
  }

  private getSlipAreaCenter(): { cx: number; cy: number } {
    if (this.slips.length === 0) return { cx: this.W / 2, cy: this.H / 2 };
    const first = this.slips[0];
    const last = this.slips[this.slips.length - 1];
    const cx = (first.x + last.x + last.width) / 2;
    const cy = first.y + first.height / 2;
    return { cx, cy };
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private loop = (time: number): void => {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  };
}

new App();
