import { GameEngine, Player, Arrow, Particle, PLAYER_COLORS } from './GameEngine';

const BASE_W = 1280;
const BASE_H = 720;
const MIN_W = 1024;

interface UIButton {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  onClick: () => void;
  hoverScale: number;
  pressed: boolean;
  color: string;
  hoverColor: string;
}

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  engine: GameEngine;
  dpr = 1;
  width = BASE_W;
  height = BASE_H;
  scale = 1;
  potX = 0;
  potY = 0;
  potScale = 1;
  groundY = 0;
  leftQuiverX = 0;
  rightQuiverX = 0;
  quiverY = 0;
  buttons: UIButton[] = [];
  hoveredButton: UIButton | null = null;
  mouseX = 0;
  mouseY = 0;
  arrowHitboxList: { x: number; y: number; r: number; side: 'left' | 'right' }[] = [];
  lastFrameTime = 0;
  fpsFrames = 0;
  fpsTime = 0;
  currentFps = 60;
  hoveredArrow: 'left' | 'right' | null = null;
  dragging = false;
  frameCount = 0;

  constructor(canvas: HTMLCanvasElement, engine: GameEngine) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.engine = engine;
    engine.setChangeListener(() => {});
    this.resize();
    this.bindEvents();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;

    const availW = Math.max(window.innerWidth - 40, MIN_W);
    const availH = Math.max(window.innerHeight - 40, MIN_W * 9 / 16);

    let w = availW;
    let h = w * 9 / 16;
    if (h > availH) {
      h = availH;
      w = h * 16 / 9;
    }
    if (w < MIN_W) {
      w = MIN_W;
      h = w * 9 / 16;
    }

    this.width = w;
    this.height = h;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);

    this.scale = w / BASE_W;
    this.potScale = w < 768 ? 0.8 : 1;

    this.potX = w * 0.5 + w * 0.15;
    this.potY = h * 0.62;
    this.groundY = h * 0.85;

    if (w < 768) {
      this.leftQuiverX = this.potX - 180 * this.scale;
      this.rightQuiverX = this.potX + 180 * this.scale;
      this.quiverY = this.potY + 160 * this.scale;
    } else {
      this.leftQuiverX = this.potX - 320 * this.scale;
      this.rightQuiverX = this.potX + 320 * this.scale;
      this.quiverY = this.potY + 80 * this.scale;
    }

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  getCanvasCoord(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    const onDown = (cx: number, cy: number) => {
      const { x, y } = this.getCanvasCoord(cx, cy);
      this.mouseX = x;
      this.mouseY = y;

      for (const btn of this.buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          btn.pressed = true;
          return;
        }
      }

      if (this.engine.showHistoryPanel) {
        if (x > this.width / 2 + 160 && x < this.width / 2 + 190 &&
            y > this.height / 2 - 130 && y < this.height / 2 - 100) {
          this.engine.closeHistoryPanel();
          return;
        }
        return;
      }

      if (this.engine.state === 'countdown' || this.engine.state === 'flying' ||
          this.engine.state === 'result' || this.engine.state === 'gameover') return;

      for (const hb of this.arrowHitboxList) {
        if (Math.hypot(x - hb.x, y - hb.y) < hb.r) {
          this.engine.startAiming(hb.side, x, y);
          this.dragging = true;
          return;
        }
      }
    };

    const onMove = (cx: number, cy: number) => {
      const { x, y } = this.getCanvasCoord(cx, cy);
      this.mouseX = x;
      this.mouseY = y;

      this.hoveredButton = null;
      for (const btn of this.buttons) {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this.hoveredButton = btn;
          btn.hoverScale = Math.min(1.05, btn.hoverScale + 0.1);
        } else {
          btn.hoverScale = Math.max(1, btn.hoverScale - 0.1);
        }
      }

      this.hoveredArrow = null;
      if (!this.dragging && this.engine.state === 'idle') {
        for (const hb of this.arrowHitboxList) {
          if (Math.hypot(x - hb.x, y - hb.y) < hb.r) {
            this.hoveredArrow = hb.side;
            break;
          }
        }
      }

      if (this.dragging) {
        this.engine.updateAim(x, y);
      }
    };

    const onUp = (cx: number, cy: number) => {
      const { x, y } = this.getCanvasCoord(cx, cy);

      for (const btn of this.buttons) {
        if (btn.pressed) {
          btn.pressed = false;
          if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            btn.onClick();
          }
          return;
        }
      }

      if (this.dragging) {
        this.dragging = false;
        this.engine.releaseArrow(this.potX, this.potY, this.scale);
      }
    };

    this.canvas.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', e => onUp(e.clientX, e.clientY));

    this.canvas.addEventListener('touchstart', e => {
      const t = e.touches[0]; if (t) onDown(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchmove', e => {
      const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchend', e => {
      const t = e.changedTouches[0]; if (t) onUp(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
  }

  updateButtons() {
    this.buttons = [];
    const btnY = this.height - 65;
    const historyBtn: UIButton = {
      x: 30,
      y: btnY,
      w: 140,
      h: 44,
      label: '查看历史',
      onClick: () => this.engine.toggleHistoryPanel(),
      hoverScale: 1,
      pressed: false,
      color: '#B87333',
      hoverColor: '#DAA520'
    };
    this.buttons.push(historyBtn);

    if (this.engine.state === 'gameover') {
      const restartBtn: UIButton = {
        x: this.width - 30 - 160,
        y: btnY,
        w: 160,
        h: 44,
        label: '再来一局',
        onClick: () => this.engine.restartGame(),
        hoverScale: 1,
        pressed: false,
        color: '#8B3A3A',
        hoverColor: '#CD5C5C'
      };
      this.buttons.push(restartBtn);
    }
  }

  start() {
    this.lastFrameTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(50, now - this.lastFrameTime);
      this.lastFrameTime = now;

      this.fpsFrames++;
      this.fpsTime += dt;
      if (this.fpsTime >= 500) {
        this.currentFps = Math.round(1000 * this.fpsFrames / this.fpsTime);
        this.fpsFrames = 0;
        this.fpsTime = 0;
      }

      this.engine.update(dt, this.potX, this.potY, this.scale * this.potScale, this.groundY);
      this.updateButtons();
      this.render();
      this.frameCount++;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width, h = this.height;

    ctx.save();
    if (this.engine.screenShake > 0) {
      const mag = this.engine.screenShake * 15;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    this.drawBackground();
    this.drawFloor();

    ctx.save();
    if (this.engine.potShake > 0) {
      const angle = Math.sin(this.frameCount * 0.6) * this.engine.potShake * 0.5;
      ctx.translate(this.potX, this.potY);
      ctx.rotate(angle * Math.PI / 180);
      ctx.translate(-this.potX, -this.potY);
    }
    this.drawPot();
    ctx.restore();

    this.drawQuivers();
    this.drawArrowsInQuiver();
    this.drawFlyingArrow();
    this.drawParticles();
    this.drawCountdownRing();
    this.drawPowerBar();
    this.drawScorePanel();
    this.drawCurrentPlayerHint();
    this.drawResultHint();
    this.drawGameOverPanel();
    this.drawPlayerSelect();
    this.drawButtons();
    this.drawHistoryPanel();

    if (this.engine.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 215, 0, ${this.engine.flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();

    this.drawFPS();
  }

  drawBackground() {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#1A0A2E');
    grad.addColorStop(1, '#2D1B0E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 30; i++) {
      const x = ((i * 97) % this.width);
      const y = ((i * 53) % (this.height * 0.6));
      ctx.fillStyle = '#CD853F';
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.12;
    const woodGrad = ctx.createLinearGradient(0, 0, this.width, 0);
    woodGrad.addColorStop(0, 'transparent');
    woodGrad.addColorStop(0.5, '#8B3A3A');
    woodGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, this.height * 0.04, this.width, 6);
    ctx.fillRect(0, this.height * 0.12, this.width, 3);
    ctx.restore();
  }

  drawFloor() {
    const ctx = this.ctx;
    const y = this.groundY;
    const grad = ctx.createLinearGradient(0, y, 0, this.height);
    grad.addColorStop(0, '#3E2723');
    grad.addColorStop(0.3, '#5D4037');
    grad.addColorStop(1, '#2D1B0E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, this.width, this.height - y);

    ctx.strokeStyle = 'rgba(139, 58, 58, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const ly = y + 20 + i * 28;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(this.width, ly + 5);
      ctx.stroke();
    }
  }

  drawPot() {
    const ctx = this.ctx;
    const px = this.potX, py = this.potY;
    const s = this.scale * this.potScale;

    const earR = 28 * s;
    const earY = py - 60 * s;
    ctx.save();
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 12 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(px - 85 * s, earY, earR, -Math.PI * 0.2, Math.PI * 1.2, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px + 85 * s, earY, earR, -Math.PI * 0.2, Math.PI * 1.2, true);
    ctx.stroke();
    ctx.strokeStyle = '#CD853F';
    ctx.lineWidth = 6 * s;
    ctx.beginPath();
    ctx.arc(px - 85 * s, earY, earR, -Math.PI * 0.2, Math.PI * 1.2, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px + 85 * s, earY, earR, -Math.PI * 0.2, Math.PI * 1.2, true);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const bodyW = 140 * s;
    const bodyH = 220 * s;
    const bodyTop = py - 100 * s;
    const grad = ctx.createLinearGradient(px - bodyW / 2, bodyTop, px + bodyW / 2, bodyTop + bodyH);
    grad.addColorStop(0, '#9B5523');
    grad.addColorStop(0.3, '#8B4513');
    grad.addColorStop(0.7, '#7A4214');
    grad.addColorStop(1, '#6B3A2A');
    ctx.fillStyle = grad;
    this.roundRect(ctx, px - bodyW / 2, bodyTop, bodyW, bodyH, 20 * s);
    ctx.fill();

    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 3 * s;
    for (let i = 0; i < 4; i++) {
      const by = bodyTop + 30 * s + i * 50 * s;
      ctx.beginPath();
      ctx.moveTo(px - bodyW / 2 + 10 * s, by);
      ctx.lineTo(px + bodyW / 2 - 10 * s, by);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    const patternY = bodyTop + 15 * s;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        const sx = px - bodyW / 2 + 20 * s + col * 20 * s;
        const sy = patternY + row * 65 * s;
        this.drawBeastEmboss(ctx, sx, sy, 14 * s);
      }
    }
    ctx.restore();

    ctx.save();
    const neckW = 90 * s;
    const neckH = 30 * s;
    const neckTop = bodyTop - neckH;
    const neckGrad = ctx.createLinearGradient(px - neckW / 2, neckTop, px + neckW / 2, neckTop);
    neckGrad.addColorStop(0, '#CD853F');
    neckGrad.addColorStop(0.5, '#DAA520');
    neckGrad.addColorStop(1, '#CD853F');
    ctx.fillStyle = neckGrad;
    ctx.fillRect(px - neckW / 2, neckTop, neckW, neckH);
    ctx.restore();

    ctx.save();
    const mouthW = 90 * s;
    const mouthH = 20 * s;
    const mouthTop = neckTop - mouthH;
    const rimGrad = ctx.createLinearGradient(px - mouthW / 2 - 10 * s, 0, px + mouthW / 2 + 10 * s, 0);
    rimGrad.addColorStop(0, '#8B4513');
    rimGrad.addColorStop(0.3, '#CD853F');
    rimGrad.addColorStop(0.5, '#FFD700');
    rimGrad.addColorStop(0.7, '#CD853F');
    rimGrad.addColorStop(1, '#8B4513');
    ctx.fillStyle = rimGrad;
    this.roundRect(ctx, px - mouthW / 2 - 8 * s, mouthTop, mouthW + 16 * s, mouthH, 6 * s);
    ctx.fill();

    ctx.fillStyle = '#1a0a05';
    ctx.beginPath();
    ctx.ellipse(px, mouthTop + mouthH / 2, mouthW / 2 - 2 * s, mouthH / 2 - 2 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    const innerGrad = ctx.createRadialGradient(px, mouthTop + mouthH / 2, 2, px, mouthTop + mouthH / 2, mouthW / 2);
    innerGrad.addColorStop(0, 'rgba(255,215,0,0.15)');
    innerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.ellipse(px, mouthTop + mouthH / 2, mouthW / 2 - 2 * s, mouthH / 2 - 2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const baseW = 160 * s;
    const baseH = 25 * s;
    const baseY = bodyTop + bodyH;
    const baseGrad = ctx.createLinearGradient(0, baseY, 0, baseY + baseH);
    baseGrad.addColorStop(0, '#6B3A2A');
    baseGrad.addColorStop(1, '#3E2723');
    ctx.fillStyle = baseGrad;
    this.roundRect(ctx, px - baseW / 2, baseY, baseW, baseH, 6 * s);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.3;
    const shadowGrad = ctx.createRadialGradient(px, baseY + baseH, 10, px, baseY + baseH, 180 * s);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.6)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(px, baseY + baseH + 10 * s, 200 * s, 30 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBeastEmboss(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.arc(0, -r * 0.2, r * 0.55, Math.PI * 0.15, Math.PI - 0.15, true);
    ctx.lineTo(-r * 0.3, r * 0.4);
    ctx.quadraticCurveTo(0, r * 0.55, r * 0.3, r * 0.4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(218, 165, 32, 0.18)';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.15, r * 0.1, 0, Math.PI * 2);
    ctx.arc(r * 0.2, -r * 0.15, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawQuivers() {
    this.drawQuiver(this.leftQuiverX, this.quiverY, 'left');
    this.drawQuiver(this.rightQuiverX, this.quiverY, 'right');
  }

  drawQuiver(x: number, y: number, _side: 'left' | 'right') {
    const ctx = this.ctx;
    const s = this.scale * this.potScale;
    const w = 70 * s, h = 200 * s;

    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, h + 5, w * 0.6, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const qg = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    qg.addColorStop(0, '#5D3A1A');
    qg.addColorStop(0.5, '#8B4513');
    qg.addColorStop(1, '#5D3A1A');
    ctx.fillStyle = qg;
    this.roundRect(ctx, -w / 2, 0, w, h, 10 * s);
    ctx.fill();

    ctx.strokeStyle = '#CD853F';
    ctx.lineWidth = 2 * s;
    for (let i = 1; i < 4; i++) {
      const ly = i * h / 4;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 5, ly);
      ctx.lineTo(w / 2 - 5, ly);
      ctx.stroke();
    }

    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 4 * s;
    ctx.strokeRect(-w / 2, 0, w, 12 * s);
    ctx.restore();
  }

  drawArrowsInQuiver() {
    const ctx = this.ctx;
    const s = this.scale * this.potScale;
    this.arrowHitboxList = [];

    const drawQuiverArrows = (baseX: number, baseY: number, side: 'left' | 'right') => {
      const cp = this.engine.currentPlayer;
      const remaining = cp ? cp.throwsLeft : 0;
      const total = 10;
      const activeArrows = this.engine.state === 'idle' || this.engine.state === 'aiming';

      for (let i = 0; i < total; i++) {
        const count = side === 'left' ? i + 1 : total - i;
        const used = count > remaining;
        const ax = baseX + ((i - total / 2 + 0.5) * 6) * s;
        const wobble = Math.sin((this.frameCount + i * 17) * 0.04) * 1.5 * s;
        const ay = baseY - 170 * s + wobble;
        const angle = ((i - total / 2) * 2.5) * Math.PI / 180;

        if (!used && activeArrows && !this.dragging) {
          this.arrowHitboxList.push({ x: ax, y: ay + 60 * s, r: 22 * s, side });
        }

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);

        if (this.hoveredArrow === side && !used && !this.dragging) {
          ctx.globalAlpha = 0.9;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 15;
          ctx.translate(0, -8 * s);
        } else if (used) {
          ctx.globalAlpha = 0.25;
        }

        this.drawSingleArrow(s);
        ctx.restore();
      }
    };

    drawQuiverArrows(this.leftQuiverX, this.quiverY, 'left');
    drawQuiverArrows(this.rightQuiverX, this.quiverY, 'right');
  }

  drawSingleArrow(s: number) {
    const ctx = this.ctx;
    const len = 120 * s;

    ctx.save();
    ctx.strokeStyle = '#6B8E23';
    ctx.lineWidth = 5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, len * 0.7);
    ctx.stroke();

    ctx.strokeStyle = '#556B2F';
    ctx.lineWidth = 1 * s;
    for (let i = 0; i < 6; i++) {
      const ny = i * 14 * s;
      ctx.beginPath();
      ctx.moveTo(-3 * s, ny);
      ctx.lineTo(3 * s, ny + 3 * s);
      ctx.stroke();
    }

    ctx.fillStyle = '#B87333';
    ctx.beginPath();
    ctx.moveTo(0, -18 * s);
    ctx.lineTo(-7 * s, 6 * s);
    ctx.lineTo(7 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 1 * s;
    ctx.stroke();

    ctx.fillStyle = '#F5F5DC';
    const fy = len * 0.65;
    ctx.beginPath();
    ctx.moveTo(-3 * s, fy);
    ctx.lineTo(-13 * s, fy + 22 * s);
    ctx.lineTo(0, fy + 12 * s);
    ctx.lineTo(13 * s, fy + 22 * s);
    ctx.lineTo(3 * s, fy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 1 * s;
    ctx.stroke();
    ctx.restore();
  }

  drawFlyingArrow() {
    const arr = this.engine.arrow;
    if (!arr) return;
    const ctx = this.ctx;
    const s = this.scale;

    if (arr.trail.length > 1) {
      ctx.save();
      for (let i = 1; i < arr.trail.length; i++) {
        const prev = arr.trail[i - 1];
        const curr = arr.trail[i];
        ctx.strokeStyle = `rgba(255, 215, 0, ${curr.alpha * 0.5})`;
        ctx.lineWidth = (1 - curr.alpha) * 6 * s + 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (!arr.active && this.engine.state !== 'result') return;

    const startTime = performance.now();
    ctx.save();
    ctx.translate(arr.x, arr.y);
    const sway = arr.active ? Math.sin(arr.swayPhase) * 2 : 0;
    ctx.rotate(arr.angle + sway * Math.PI / 180);
    const cp = this.engine.currentPlayer;
    if (cp) {
      ctx.shadowColor = cp.color;
      ctx.shadowBlur = 10;
    }
    this.drawSingleArrow(s);
    ctx.restore();
    const perf = performance.now() - startTime;
    if (perf > 2) console.warn('[perf] 箭矢渲染:', perf.toFixed(2), 'ms');
  }

  drawParticles() {
    if (this.engine.particles.length === 0) return;
    const ctx = this.ctx;
    const startTime = performance.now();
    ctx.save();
    ctx.beginPath();
    for (const p of this.engine.particles) {
      ctx.moveTo(p.x + p.radius, p.y);
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    }
    const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 10);
    grad.addColorStop(0, '#FFD700');
    grad.addColorStop(1, '#FFA500');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.9;
    for (const p of this.engine.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      pg.addColorStop(0, '#FFFFFF');
      pg.addColorStop(0.3, '#FFD700');
      pg.addColorStop(1, 'rgba(255,140,0,0)');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    const perf = performance.now() - startTime;
    if (perf > 2) console.warn('[perf] 粒子系统:', perf.toFixed(2), 'ms');
  }

  drawCountdownRing() {
    if (this.engine.state !== 'countdown') return;
    const ctx = this.ctx;
    const s = this.scale;
    const cx = this.potX;
    const cy = this.potY - 180 * s;
    const r = 45 * s;

    ctx.save();
    ctx.strokeStyle = 'rgba(255,215,0,0.2)';
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const prog = this.engine.countdownProgress;
    const start = -Math.PI / 2;
    const end = start + prog * Math.PI * 2;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4 * s;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${28 * s}px KaiTi, STKaiti, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const sec = Math.ceil(3 - prog * 3);
    ctx.fillText(String(Math.max(1, sec)), cx, cy);
    ctx.restore();
  }

  drawPowerBar() {
    if (this.engine.state !== 'aiming') return;
    const ctx = this.ctx;
    const s = this.scale;
    const bx = this.width / 2 - 100 * s;
    const by = this.height - 110;
    const bw = 200 * s;
    const bh = 20 * s;

    ctx.save();
    ctx.fillStyle = 'rgba(26, 15, 8, 0.7)';
    this.roundRect(ctx, bx - 4, by - 4, bw + 8, bh + 8, 10 * s);
    ctx.fill();

    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#00FF7F');
    grad.addColorStop(0.5, '#FFD700');
    grad.addColorStop(1, '#FF4500');
    ctx.fillStyle = grad;
    this.roundRect(ctx, bx, by, bw * this.engine.power, bh, 6 * s);
    ctx.fill();

    ctx.strokeStyle = '#CD853F';
    ctx.lineWidth = 2 * s;
    this.roundRect(ctx, bx, by, bw, bh, 6 * s);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = `${14 * s}px KaiTi, serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`力度 ${Math.round(this.engine.power * 100)}%`, bx + bw / 2, by - 12);
    ctx.restore();
  }

  drawScorePanel() {
    if (this.engine.showPlayerSelect) return;
    const ctx = this.ctx;
    const s = this.scale;
    const px = this.width - 250;
    const py = 30;
    const pw = 220;
    const ph = 300;

    ctx.save();
    ctx.fillStyle = 'rgba(26, 15, 8, 0.85)';
    this.roundRect(ctx, px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = '#CD853F';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${22 * s}px KaiTi, STKaiti, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('计分榜', px + pw / 2, py + 34);

    ctx.strokeStyle = 'rgba(205, 133, 63, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 20, py + 52);
    ctx.lineTo(px + pw - 20, py + 52);
    ctx.stroke();

    this.engine.players.forEach((p: Player, i: number) => {
      const ry = py + 78 + i * 52;
      const isCur = i === this.engine.currentPlayerIndex && this.engine.state !== 'gameover';

      if (isCur) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        this.roundRect(ctx, px + 10, ry - 22, pw - 20, 46, 8);
        ctx.fill();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = isCur ? 8 : 0;
      ctx.beginPath();
      ctx.arc(px + 30, ry, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#F5F5DC';
      ctx.font = `${18 * s}px KaiTi, serif`;
      ctx.textAlign = 'left';
      ctx.fillText(p.name, px + 50, ry + 6);

      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${24 * s}px KaiTi, serif`;
      ctx.textAlign = 'right';
      ctx.fillText(String(p.score), px + pw - 28, ry + 7);

      ctx.fillStyle = 'rgba(245, 245, 220, 0.6)';
      ctx.font = `${12 * s}px KaiTi, serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`剩余 ${p.throwsLeft}/10`, px + pw - 28, ry + 24);
    });

    ctx.restore();
  }

  drawCurrentPlayerHint() {
    if (this.engine.showPlayerSelect) return;
    if (this.engine.currentPlayerHintAlpha <= 0 && this.engine.state !== 'idle') return;
    const cp = this.engine.currentPlayer;
    if (!cp) return;
    const ctx = this.ctx;
    const s = this.scale;
    const alpha = this.engine.currentPlayerHintAlpha;
    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = cp.color;
    ctx.font = `bold ${24 * s}px KaiTi, STKaiti, serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = cp.color;
    ctx.shadowBlur = 10;
    const y = this.potY - 250 * s;
    ctx.fillText(`${cp.name} · 请投壶`, this.potX, y);
    ctx.restore();
  }

  drawResultHint() {
    if (this.engine.state !== 'result') return;
    const ctx = this.ctx;
    const s = this.scale;
    const alpha = Math.min(1, this.engine.resultDisplayTime / 1000);
    if (alpha <= 0.02) return;

    let text = '';
    let color = '#FFFFFF';
    if (this.engine.hitResult === 'mouth') { text = '中! 壶口 +10'; color = '#FFD700'; }
    else if (this.engine.hitResult === 'ear') { text = '中! 壶耳 +5'; color = '#FFA500'; }
    else { text = '未中 +0'; color = '#AAAAAA'; }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = `bold ${36 * s}px KaiTi, STKaiti, serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillText(text, this.potX, this.height / 2 - 40);
    ctx.restore();
  }

  drawGameOverPanel() {
    if (this.engine.state !== 'gameover') return;
    const ctx = this.ctx;
    const s = this.scale;
    const pw = 500, ph = 380;
    const px = (this.width - pw) / 2;
    const py = (this.height - ph) / 2;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#2D1B0E';
    this.roundRect(ctx, px, py, pw, ph, 14);
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${34 * s}px KaiTi, STKaiti, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('投壶结束', px + pw / 2, py + 50);

    const sorted = [...this.engine.players].sort((a, b) => b.score - a.score);
    sorted.forEach((p, i) => {
      const ry = py + 110 + i * 55;

      if (i === 0) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        this.roundRect(ctx, px + 20, ry - 24, pw - 40, 48, 10);
        ctx.fill();
      }

      const medals = ['🏆', '🥈', '🥉', '4'];
      ctx.font = `${28 * s}px serif`;
      ctx.textAlign = 'left';
      ctx.fillText(medals[i] ?? String(i + 1), px + 40, ry + 8);

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px + 100, ry, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F5F5DC';
      ctx.font = `${22 * s}px KaiTi, serif`;
      ctx.textAlign = 'left';
      ctx.fillText(p.name, px + 125, ry + 7);

      ctx.fillStyle = i === 0 ? '#FFD700' : '#FFFFFF';
      ctx.font = `bold ${28 * s}px KaiTi, serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`${p.score} 分`, px + pw - 40, ry + 8);
    });

    ctx.fillStyle = 'rgba(245, 245, 220, 0.5)';
    ctx.font = `${13 * s}px KaiTi, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('得分已自动保存至历史记录', px + pw / 2, py + ph - 30);
    ctx.restore();
  }

  drawPlayerSelect() {
    if (!this.engine.showPlayerSelect) return;
    const ctx = this.ctx;
    const s = this.scale;
    const pw = 520, ph = 420;
    const px = (this.width - pw) / 2;
    const py = (this.height - ph) / 2;

    ctx.save();
    ctx.fillStyle = '#2D1B0E';
    this.roundRect(ctx, px, py, pw, ph, 14);
    ctx.fill();
    ctx.strokeStyle = '#CD853F';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${36 * s}px KaiTi, STKaiti, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('古 代 投 壶', px + pw / 2, py + 64);

    ctx.fillStyle = '#D2B48C';
    ctx.font = `${16 * s}px KaiTi, serif`;
    ctx.fillText('战国礼仪 · 投掷游戏', px + pw / 2, py + 95);

    ctx.fillStyle = '#F5F5DC';
    ctx.font = `${20 * s}px KaiTi, serif`;
    ctx.fillText('选择玩家人数', px + pw / 2, py + 150);

    const boxW = 90, boxH = 90;
    const gap = 24;
    const totalW = (boxW + gap) * 3 - gap;
    const startX = px + (pw - totalW) / 2;
    const boxY = py + 180;

    for (let i = 0; i < 3; i++) {
      const n = i + 2;
      const bx = startX + i * (boxW + gap);
      const sel = this.engine.selectedPlayerCount === n;
      const hover = Math.abs(this.mouseX - (bx + boxW / 2)) < boxW / 2 &&
                    Math.abs(this.mouseY - (boxY + boxH / 2)) < boxH / 2;

      ctx.fillStyle = sel ? 'rgba(255, 215, 0, 0.2)' : 'rgba(139, 58, 58, 0.3)';
      this.roundRect(ctx, bx, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.strokeStyle = sel ? '#FFD700' : (hover ? '#DAA520' : '#8B3A3A');
      ctx.lineWidth = sel ? 3 : 2;
      ctx.stroke();

      ctx.fillStyle = PLAYER_COLORS[i];
      ctx.beginPath();
      ctx.arc(bx + boxW / 2, boxY + 30, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = sel ? '#FFD700' : '#F5F5DC';
      ctx.font = `bold ${22 * s}px KaiTi, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${n}人`, bx + boxW / 2, boxY + 68);

      const hitbox = { x: bx, y: boxY, w: boxW, h: boxH };
      if (this._clickDetected && this._inBox(this.mouseX, this.mouseY, hitbox)) {
        this.engine.setPlayerCount(n);
      }
    }

    const btnX = px + pw / 2 - 100;
    const btnY = py + ph - 80;
    const btnHover = Math.abs(this.mouseX - (btnX + 100)) < 100 &&
                     Math.abs(this.mouseY - (btnY + 28)) < 28;
    let startBtnScale = 1;
    if (this._startBtnDown && !btnHover) this._startBtnDown = false;
    if (btnHover) startBtnScale = 1.05;
    if (this._startBtnDown) startBtnScale = 0.95;

    ctx.save();
    ctx.translate(btnX + 100, btnY + 28);
    ctx.scale(startBtnScale, startBtnScale);
    ctx.translate(-100, -28);

    const btnGrad = ctx.createLinearGradient(0, 0, 0, 56);
    btnGrad.addColorStop(0, btnHover ? '#DAA520' : '#CD853F');
    btnGrad.addColorStop(1, '#8B4513');
    ctx.fillStyle = btnGrad;
    this.roundRect(ctx, 0, 0, 200, 56, 12);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFF8DC';
    ctx.font = `bold ${24 * s}px KaiTi, STKaiti, serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText('开 始 投 壶', 100, 37);
    ctx.restore();

    const startBtn = { x: btnX, y: btnY, w: 200, h: 56 };
    if (this._clickDetected && this._inBox(this.mouseX, this.mouseY, startBtn) && this._startBtnDown) {
      this.engine.confirmStart();
    }

    ctx.fillStyle = 'rgba(245, 245, 220, 0.4)';
    ctx.font = `${13 * s}px KaiTi, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('点击箭筒中的箭矢 → 向后拖拽 → 松开发射', px + pw / 2, py + ph - 22);
    ctx.restore();

    this._clickDetected = false;
  }

  private _clickDetected = false;
  private _startBtnDown = false;
  private _inBox(x: number, y: number, b: { x: number; y: number; w: number; h: number }) {
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  drawButtons() {
    const ctx = this.ctx;
    for (const btn of this.buttons) {
      ctx.save();
      let scale = btn.hoverScale;
      if (btn.pressed) scale = 0.95;
      const cx = btn.x + btn.w / 2;
      const cy = btn.y + btn.h / 2;
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -cy);

      const grad = ctx.createLinearGradient(0, btn.y, 0, btn.y + btn.h);
      const base = this.hoveredButton === btn ? btn.hoverColor : btn.color;
      grad.addColorStop(0, base);
      grad.addColorStop(1, this.darken(base, 0.6));
      ctx.fillStyle = grad;
      this.roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
      ctx.fill();

      if (btn.pressed) {
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
      }

      ctx.strokeStyle = 'rgba(255,215,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#FFF8DC';
      ctx.font = `bold 18px KaiTi, STKaiti, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      ctx.fillText(btn.label, cx, cy + 1);
      ctx.restore();
    }
  }

  drawHistoryPanel() {
    if (!this.engine.showHistoryPanel) return;
    const ctx = this.ctx;
    const s = this.scale;
    const pw = 400, ph = 300;
    const px = (this.width - pw) / 2;
    const py = (this.height - ph) / 2;
    const pad = 10;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#2D1B0E';
    this.roundRect(ctx, px, py, pw, ph, 12);
    ctx.fill();
    ctx.strokeStyle = '#CD853F';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${22 * s}px KaiTi, STKaiti, serif`;
    ctx.textAlign = 'center';
    ctx.fillText('近 5 局历史记录', px + pw / 2, py + 36);

    const closeX = px + pw - 38;
    const closeY = py + 16;
    const closeHover = Math.abs(this.mouseX - (closeX + 14)) < 14 &&
                       Math.abs(this.mouseY - (closeY + 14)) < 14;
    ctx.fillStyle = closeHover ? '#FF4444' : '#8B3A3A';
    this.roundRect(ctx, closeX, closeY, 28, 28, 6);
    ctx.fill();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = '#FFF8DC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(closeX + 8, closeY + 8);
    ctx.lineTo(closeX + 20, closeY + 20);
    ctx.moveTo(closeX + 20, closeY + 8);
    ctx.lineTo(closeX + 8, closeY + 20);
    ctx.stroke();

    const records = this.engine.historyRecords;
    const chartX = px + pad + 20;
    const chartY = py + 60;
    const chartW = pw - pad * 2 - 40;
    const chartH = ph - 80 - 30;

    if (records.length === 0) {
      ctx.fillStyle = 'rgba(245, 245, 220, 0.5)';
      ctx.font = `${16 * s}px KaiTi, serif`;
      ctx.textAlign = 'center';
      ctx.fillText('暂无历史记录', px + pw / 2, py + ph / 2);
      ctx.restore();
      return;
    }

    let maxScore = 10;
    records.forEach(r => r.scores.forEach((s2: any) => {
      if (s2.score > maxScore) maxScore = s2.score;
    }));
    maxScore = Math.ceil(maxScore / 10) * 10;

    const gameCount = records.length;
    const groupW = chartW / gameCount;
    const reversed = [...records].reverse();

    reversed.forEach((rec, gi) => {
      const gx = chartX + gi * groupW;
      const pc = rec.playerCount;
      const barGap = 4;
      const barW = Math.max(8, (groupW - 30 - barGap * (pc - 1)) / pc);

      rec.scores.forEach((ps: any, bi: number) => {
        const bx = gx + 15 + bi * (barW + barGap);
        const bh = (ps.score / maxScore) * chartH;
        const by = chartY + chartH - bh;

        ctx.fillStyle = PLAYER_COLORS[ps.playerId - 1] || '#888';
        this.roundRect(ctx, bx, by, barW, bh, 3);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${14 * s}px KaiTi, serif`;
        ctx.textAlign = 'center';
        ctx.fillText(String(ps.score), bx + barW / 2, by - 5);
      });

      ctx.fillStyle = 'rgba(245, 245, 220, 0.6)';
      ctx.font = `${11 * s}px KaiTi, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`第${gameCount - gi}局`, gx + groupW / 2, chartY + chartH + 18);
    });

    ctx.strokeStyle = 'rgba(205, 133, 63, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartH);
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.stroke();

    ctx.restore();
  }

  drawFPS() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS ${this.currentFps}`, 8, 16);
    ctx.restore();
  }

  roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  darken(hex: string, factor: number): string {
    const h = hex.replace('#', '');
    const r = Math.floor(parseInt(h.substring(0, 2), 16) * factor);
    const g = Math.floor(parseInt(h.substring(2, 4), 16) * factor);
    const b = Math.floor(parseInt(h.substring(4, 6), 16) * factor);
    return `rgb(${r},${g},${b})`;
  }
}

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const engine = new GameEngine();
const renderer = new Renderer(canvas, engine);

const origDown = canvas.onmousedown;
canvas.addEventListener('mousedown', () => {
  (renderer as any)._clickDetected = true;
  if (engine.showPlayerSelect) {
    renderer._startBtnDown = true;
  }
});
window.addEventListener('mouseup', () => {
  renderer._startBtnDown = false;
});

renderer.start();
