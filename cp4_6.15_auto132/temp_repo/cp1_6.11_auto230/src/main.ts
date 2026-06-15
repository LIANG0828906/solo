import { Archer, type ShootParams } from './archer';
import { Arrow, type HitResult } from './arrow';
import { Target } from './target';
import { Wind, type WindParams } from './wind';

const COLORS = {
  GROUND: '#C4A882',
  GROUND_DARK: '#A88A60',
  WALL: '#8B2500',
  WALL_DARK: '#6A1C00',
  WALL_TOP: '#A3320A',
  MOUNTAIN: 'rgba(135, 206, 235, 0.3)',
  MOUNTAIN_DARK: 'rgba(100, 150, 200, 0.25)',
  CLOUD: 'rgba(255, 255, 255, 0.15)',
  SKY_TOP: '#E8D9B8',
  SKY_BOTTOM: '#D4C4A0',
  PANEL_BG: 'rgba(26, 26, 26, 0.88)',
  TEXT: '#FFFFFF',
  TEXT_SUB: '#CCCCCC',
  GOLD: '#FFD700',
  RESTART_BG: '#8B2500',
  RESTART_HOVER: '#A3320A'
};

const SIZES = {
  UI_CORNER_RADIUS: 8,
  PANEL_FONT_SIZE: 18,
  ARROWS_PER_ROUND: 10,
  CLOUD_SPEED: 0.3
};

type GamePhase = 'IDLE' | 'DRAWING' | 'FLYING' | 'GAMEOVER';

interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

interface Mountain {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 1280;
  private height: number = 720;

  private archer!: Archer;
  private arrow!: Arrow;
  private target!: Target;
  private wind!: Wind;

  private phase: GamePhase = 'IDLE';
  private currentRound: number = 1;
  private totalScore: number = 0;
  private lastScore: number = 0;
  private lastWindParams: WindParams = { angle: 0, level: 0, offsetPerFrame: 0 };
  private highScore: number = 0;
  private shotsFired: number = 0;

  private clouds: Cloud[] = [];
  private mountains: Mountain[] = [];
  private lastTimestamp: number = 0;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private pendingHitResult: HitResult | null = null;
  private flyFrames: number = 0;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
    if (!canvas) throw new Error('Canvas element not found');
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.highScore = parseInt(localStorage.getItem('archer_high_score') || '0', 10);
    this.resize();
    this.initScenery();
    this.initModules();
    this.bindEvents();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const container = document.getElementById('game-container')!;
    const aspect = 16 / 9;
    let cw = container.clientWidth;
    let ch = container.clientHeight;
    if (cw / ch > aspect) {
      cw = ch * aspect;
    } else {
      ch = cw / aspect;
    }
    this.width = Math.max(800, Math.floor(cw));
    this.height = Math.max(450, Math.floor(ch));
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private initScenery(): void {
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: this.height * 0.06 + Math.random() * this.height * 0.18,
        w: 80 + Math.random() * 140,
        h: 20 + Math.random() * 30,
        speed: SIZES.CLOUD_SPEED * (0.7 + Math.random() * 0.7)
      });
    }
    this.mountains = [];
    const baseY = this.height * 0.55;
    for (let i = 0; i < 4; i++) {
      this.mountains.push({
        x: i * (this.width / 3) - 100 + Math.random() * 50,
        y: baseY - (i % 2 === 0 ? 80 : 120) - Math.random() * 40,
        w: this.width * 0.5 + Math.random() * 100,
        h: 160 + Math.random() * 80,
        color: i % 2 === 0 ? COLORS.MOUNTAIN : COLORS.MOUNTAIN_DARK
      });
    }
  }

  private initModules(): void {
    const targetX = this.width * 0.62;
    const targetY = this.height * 0.42;
    this.archer = new Archer(this.width, this.height);
    this.arrow = new Arrow();
    this.target = new Target(targetX, targetY, this.width);
    this.wind = new Wind();
    this.lastWindParams = this.wind.getParams();
    this.arrow.setTargetPlane(targetX);
    this.phase = 'IDLE';
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => {
      this.resize();
      this.initScenery();
      this.archer.resize(this.width, this.height);
      const targetX = this.width * 0.62;
      const targetY = this.height * 0.42;
      this.target = new Target(targetX, targetY, this.width);
      this.arrow.setTargetPlane(targetX);
    });

    const toCanvasCoords = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * this.width;
      const y = ((clientY - rect.top) / rect.height) * this.height;
      return { x, y };
    };

    this.canvas.addEventListener('mousemove', (e) => {
      const { x, y } = toCanvasCoords(e.clientX, e.clientY);
      this.mouseX = x;
      this.mouseY = y;
      if (this.phase === 'DRAWING') {
        this.archer.updatePull(x, y);
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (this.phase === 'GAMEOVER') return;
      if (this.phase === 'FLYING') return;
      const { x, y } = toCanvasCoords(e.clientX, e.clientY);
      this.mouseX = x;
      this.mouseY = y;
      const state = this.archer.getState();
      if (state.arrowsRemaining <= 0) return;
      if (this.archer.isNearString(x, y, 60) || this.phase === 'IDLE') {
        this.archer.startPull(x, y);
        this.phase = 'DRAWING';
      }
    });

    const releaseArrow = () => {
      if (this.phase !== 'DRAWING') return;
      const params: ShootParams | null = this.archer.release();
      if (params) {
        this.lastWindParams = this.wind.getParams();
        this.arrow.launch(params, this.lastWindParams);
        this.phase = 'FLYING';
        this.flyFrames = 0;
        this.shotsFired++;
      } else {
        this.phase = 'IDLE';
      }
    };

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      releaseArrow();
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.phase === 'DRAWING') {
        releaseArrow();
      }
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.phase === 'GAMEOVER' || this.phase === 'FLYING') return;
      const t = e.touches[0];
      const { x, y } = toCanvasCoords(t.clientX, t.clientY);
      this.mouseX = x;
      this.mouseY = y;
      const state = this.archer.getState();
      if (state.arrowsRemaining <= 0) return;
      this.archer.startPull(x, y);
      this.phase = 'DRAWING';
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const { x, y } = toCanvasCoords(t.clientX, t.clientY);
      this.mouseX = x;
      this.mouseY = y;
      if (this.phase === 'DRAWING') {
        this.archer.updatePull(x, y);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      releaseArrow();
    }, { passive: false });

    this.canvas.addEventListener('click', (e) => {
      if (this.phase === 'GAMEOVER') {
        const cx = this.width / 2;
        const cy = this.height / 2 + 70;
        const rect = this.canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * this.width;
        const y = ((e.clientY - rect.top) / rect.height) * this.height;
        if (x >= cx - 90 && x <= cx + 90 && y >= cy - 25 && y <= cy + 25) {
          this.restartGame();
        }
      }
    });
  }

  private restartGame(): void {
    this.phase = 'IDLE';
    this.currentRound++;
    this.totalScore = 0;
    this.lastScore = 0;
    this.shotsFired = 0;
    this.pendingHitResult = null;
    this.archer.resetRound();
    this.target.clearMarkers();
    this.wind.regenerate();
    this.lastWindParams = this.wind.getParams();
  }

  private loop(timestamp: number): void {
    const dt = Math.min(32, timestamp - this.lastTimestamp || 16);
    this.lastTimestamp = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.loop);
  }

  private update(dt: number): void {
    for (const c of this.clouds) {
      c.x += c.speed * (dt / 16);
      if (c.x - c.w > this.width) {
        c.x = -c.w - Math.random() * 100;
        c.y = this.height * 0.06 + Math.random() * this.height * 0.18;
      }
    }

    this.target.updateEffects();

    if (this.phase === 'FLYING') {
      this.flyFrames++;
      const still = this.arrow.update();
      const tx = this.width * 0.62;
      const ty = this.height * 0.42;
      const hitRes = this.arrow.checkHit(tx, ty, this.target.totalRadius);

      if (hitRes.hit) {
        this.pendingHitResult = hitRes;
        const score = this.target.registerHit(hitRes.hitX, hitRes.hitY);
        this.lastScore = score;
        this.totalScore += score;
        this.target.triggerRipple(hitRes.hitX, hitRes.hitY);
        this.target.triggerShake();
        if (this.totalScore > this.highScore) {
          this.highScore = this.totalScore;
          localStorage.setItem('archer_high_score', String(this.highScore));
        }
        const state = this.archer.getState();
        if (state.arrowsRemaining <= 0) {
          setTimeout(() => { this.phase = 'GAMEOVER'; }, 700);
        } else {
          this.wind.regenerate();
          this.lastWindParams = this.wind.getParams();
        }
        this.phase = 'IDLE';
      } else if (!still || this.flyFrames > 220) {
        this.lastScore = 0;
        const state = this.archer.getState();
        if (state.arrowsRemaining <= 0) {
          setTimeout(() => { this.phase = 'GAMEOVER'; }, 500);
        } else {
          this.wind.regenerate();
          this.lastWindParams = this.wind.getParams();
        }
        this.phase = 'IDLE';
      }
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawSky();
    this.drawMountains();
    this.drawClouds();
    this.drawWall();
    this.drawGround();
    this.drawDistantTargets();

    this.target.draw(ctx);
    this.archer.draw(ctx);

    if (this.phase === 'FLYING') {
      this.arrow.draw(ctx);
    }

    this.drawRoundInfo();
    this.wind.drawWindIndicator(ctx, this.width - 16, 16);
    this.drawScorePanel();

    if (this.phase === 'IDLE' && this.shotsFired > 0 && this.lastScore > 0) {
      this.drawLastScoreToast();
    }

    if (this.phase === 'GAMEOVER') {
      this.drawGameOver();
    }

    this.drawInstructions();
  }

  private drawSky(): void {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.height * 0.55);
    grad.addColorStop(0, COLORS.SKY_TOP);
    grad.addColorStop(1, COLORS.SKY_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height * 0.55);
  }

  private drawMountains(): void {
    const ctx = this.ctx;
    for (const m of this.mountains) {
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y + m.h);
      ctx.lineTo(m.x + m.w * 0.35, m.y);
      ctx.lineTo(m.x + m.w * 0.6, m.y + m.h * 0.3);
      ctx.lineTo(m.x + m.w * 0.8, m.y + m.h * 0.1);
      ctx.lineTo(m.x + m.w, m.y + m.h);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawClouds(): void {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.CLOUD;
    for (const c of this.clouds) {
      this.drawRoundedCloud(ctx, c.x, c.y, c.w, c.h);
    }
  }

  private drawRoundedCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.save();
    ctx.beginPath();
    const r = h / 2;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w * 0.3, y);
    ctx.arc(x + w * 0.3, y - h * 0.2, h * 0.4, Math.PI, 0, true);
    ctx.lineTo(x + w * 0.55, y - h * 0.2);
    ctx.arc(x + w * 0.55, y - h * 0.35, h * 0.45, Math.PI, 0, true);
    ctx.lineTo(x + w * 0.8, y - h * 0.35);
    ctx.arc(x + w * 0.8, y - h * 0.1, h * 0.35, Math.PI, 0, true);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawWall(): void {
    const ctx = this.ctx;
    const wallTop = this.height * 0.35;
    const wallBottom = this.height * 0.62;
    ctx.fillStyle = COLORS.WALL;
    ctx.fillRect(0, wallTop, this.width, wallBottom - wallTop);

    const tileH = 22;
    const tileW = 55;
    ctx.strokeStyle = COLORS.WALL_DARK;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let yy = wallTop; yy < wallBottom; yy += tileH) {
      const offset = ((yy - wallTop) / tileH) % 2 === 0 ? 0 : tileW / 2;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(this.width, yy);
      ctx.stroke();
      for (let xx = -tileW + offset; xx < this.width; xx += tileW) {
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx, yy + tileH);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.WALL_TOP;
    ctx.fillRect(0, wallTop - 10, this.width, 12);
    ctx.fillStyle = COLORS.WALL_DARK;
    ctx.fillRect(0, wallTop - 14, this.width, 5);
  }

  private drawGround(): void {
    const ctx = this.ctx;
    const groundTop = this.height * 0.62;
    const grad = ctx.createLinearGradient(0, groundTop, 0, this.height);
    grad.addColorStop(0, COLORS.GROUND);
    grad.addColorStop(1, COLORS.GROUND_DARK);
    ctx.fillStyle = grad;
    ctx.fillRect(0, groundTop, this.width, this.height - groundTop);

    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = '#6B4A20';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const y = groundTop + 8 + (i * (this.height - groundTop) / 30);
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < this.width; x += 20) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 1.5);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawDistantTargets(): void {
    const ctx = this.ctx;
    const ty = this.height * 0.42;
    const positions = [0.46, 0.54, 0.62, 0.70, 0.78];
    for (let i = 0; i < positions.length; i++) {
      const tx = this.width * positions[i];
      if (i === 2) continue;
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#5C3A21';
      ctx.fillRect(tx - 3, ty + 30, 6, 60);
      const rings = [
        { r: 30, c: '#333333' },
        { r: 26, c: '#FFFFFF' },
        { r: 22, c: '#333333' },
        { r: 18, c: '#FFFFFF' },
        { r: 14, c: '#333333' },
        { r: 10, c: '#FFFFFF' },
        { r: 6, c: '#FF0000' }
      ];
      for (const ring of rings) {
        ctx.beginPath();
        ctx.arc(tx, ty, ring.r, 0, Math.PI * 2);
        ctx.fillStyle = ring.c;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private drawRoundInfo(): void {
    const ctx = this.ctx;
    const state = this.archer.getState();
    const panelW = 200;
    const panelH = 60;
    const x = 16;
    const y = 16;

    ctx.save();
    ctx.fillStyle = COLORS.PANEL_BG;
    this.roundRect(ctx, x, y, panelW, panelH, SIZES.UI_CORNER_RADIUS);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 37, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = 0.08;
    for (let i = 0; i < panelH; i += 4) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y + i);
      ctx.lineTo(x + panelW - 2, y + i + 1);
      ctx.strokeStyle = '#5C3A21';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.TEXT;
    const isSmall = this.width < 768;
    const fontSize = isSmall ? 14 : SIZES.PANEL_FONT_SIZE;
    ctx.font = `bold ${fontSize}px "KaiTi", "楷体", serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`第 ${this.currentRound} 局`, x + 14, y + 10);
    ctx.fillText(`剩余箭支: ${state.arrowsRemaining}/${SIZES.ARROWS_PER_ROUND}`, x + 14, y + 10 + fontSize + 4);

    ctx.restore();
  }

  private drawScorePanel(): void {
    const ctx = this.ctx;
    const panelH = this.width < 768 ? 88 : 72;
    const y = this.height - panelH - 12;
    const x = 12;
    const w = this.width - 24;

    ctx.save();
    ctx.fillStyle = COLORS.PANEL_BG;
    this.roundRect(ctx, x, y, w, panelH, SIZES.UI_CORNER_RADIUS);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 37, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = 0.08;
    for (let i = 0; i < panelH; i += 4) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y + i);
      ctx.lineTo(x + w - 2, y + i + 1);
      ctx.strokeStyle = '#5C3A21';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const isSmall = this.width < 768;
    const colCount = isSmall ? 2 : 4;
    const colW = w / colCount;
    const fontSize = isSmall ? 13 : 16;

    const columns = [
      { title: '本轮环数', value: this.lastScore > 0 ? `${this.lastScore} 环` : '—', color: this.lastScore >= 8 ? COLORS.GOLD : (this.lastScore === 0 && this.shotsFired > 0 ? '#FF6666' : COLORS.TEXT) },
      { title: '当前风速', value: `${this.lastWindParams.level}级 ${this.lastWindParams.angle >= 0 ? '+' : ''}${this.lastWindParams.angle.toFixed(0)}°`, color: COLORS.TEXT },
      { title: '累计总分', value: `${this.totalScore} 环`, color: this.totalScore >= 50 ? COLORS.GOLD : COLORS.TEXT },
      { title: '历史最高', value: `${this.highScore} 环`, color: COLORS.GOLD }
    ];

    const cols = isSmall ? [columns[0], columns[2], columns[1], columns[3]] : columns;
    ctx.font = `bold ${fontSize + 2}px "KaiTi", "楷体", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLORS.TEXT_SUB;
    for (let i = 0; i < colCount; i++) {
      ctx.fillText(cols[i].title, x + colW * i + colW / 2, y + 10);
    }
    ctx.font = `bold ${fontSize + 8}px "KaiTi", "楷体", serif`;
    for (let i = 0; i < colCount; i++) {
      ctx.fillStyle = cols[i].color;
      ctx.fillText(cols[i].value, x + colW * i + colW / 2, y + 10 + fontSize + 10);
    }

    ctx.restore();
  }

  private drawLastScoreToast(): void {
  }

  private drawInstructions(): void {
    const ctx = this.ctx;
    if (this.phase === 'IDLE' && this.shotsFired === 0) {
      ctx.save();
      const tx = this.width / 2;
      const ty = this.height * 0.26;
      ctx.fillStyle = 'rgba(26, 26, 26, 0.72)';
      this.roundRect(ctx, tx - 220, ty - 36, 440, 72, SIZES.UI_CORNER_RADIUS);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = COLORS.TEXT;
      ctx.font = 'bold 18px "KaiTi", "楷体", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('按住鼠标左键从弓弦处向后拖拽拉弦', tx, ty - 8);
      ctx.font = '15px "KaiTi", "楷体", serif';
      ctx.fillStyle = COLORS.GOLD;
      ctx.fillText('瞄准箭靶后松开左键释放箭矢 · 拉满 ≥ 30% 才可发射', tx, ty + 20);
      ctx.restore();
    }
  }

  private drawGameOver(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, this.width, this.height);

    const panelW = Math.min(480, this.width * 0.85);
    const panelH = 320;
    const cx = this.width / 2;
    const cy = this.height / 2;

    ctx.fillStyle = COLORS.PANEL_BG;
    this.roundRect(ctx, cx - panelW / 2, cy - panelH / 2, panelW, panelH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.globalAlpha = 0.08;
    for (let i = 0; i < panelH; i += 5) {
      ctx.beginPath();
      ctx.moveTo(cx - panelW / 2 + 4, cy - panelH / 2 + i);
      ctx.lineTo(cx + panelW / 2 - 4, cy - panelH / 2 + i + 1);
      ctx.strokeStyle = '#5C3A21';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.GOLD;
    ctx.font = 'bold 28px "KaiTi", "楷体", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('训练结束', cx, cy - 115);

    let rank = '';
    let rankColor = COLORS.TEXT;
    if (this.totalScore >= 50) { rank = '神射手'; rankColor = COLORS.GOLD; }
    else if (this.totalScore >= 30) { rank = '熟练弓手'; rankColor = '#7ED321'; }
    else if (this.totalScore >= 10) { rank = '新手'; rankColor = '#4A90E2'; }
    else { rank = '脱靶'; rankColor = '#FF6666'; }

    ctx.fillStyle = rankColor;
    ctx.font = 'bold 42px "KaiTi", "楷体", serif';
    ctx.fillText(rank, cx, cy - 55);

    ctx.fillStyle = COLORS.TEXT;
    ctx.font = 'bold 20px "KaiTi", "楷体", serif';
    ctx.fillText(`最终总分：${this.totalScore} 环`, cx, cy - 4);

    let comment = '';
    if (this.totalScore >= 80) comment = '百步穿杨，箭无虚发！';
    else if (this.totalScore >= 60) comment = '弓马娴熟，箭法超群！';
    else if (this.totalScore >= 50) comment = '技艺精进，可当大任！';
    else if (this.totalScore >= 30) comment = '稳扎稳打，继续磨砺！';
    else if (this.totalScore >= 10) comment = '初学乍练，勿骄勿躁！';
    else comment = '需勤加练习，方可有成！';

    ctx.fillStyle = COLORS.TEXT_SUB;
    ctx.font = '16px "KaiTi", "楷体", serif';
    ctx.fillText(comment, cx, cy + 26);

    if (this.totalScore >= this.highScore && this.totalScore > 0) {
      ctx.fillStyle = COLORS.GOLD;
      ctx.font = 'bold 14px "KaiTi", "楷体", serif';
      ctx.fillText('★ 新纪录！ ★', cx, cy + 52);
    }

    const by = cy + 85;
    const bw = 180;
    const bh = 50;
    const hovered = this.mouseX >= cx - bw / 2 && this.mouseX <= cx + bw / 2 &&
                    this.mouseY >= by - bh / 2 && this.mouseY <= by + bh / 2;

    ctx.fillStyle = hovered ? COLORS.RESTART_HOVER : COLORS.RESTART_BG;
    this.roundRect(ctx, cx - bw / 2, by - bh / 2, bw, bh, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = COLORS.TEXT;
    ctx.font = 'bold 20px "KaiTi", "楷体", serif';
    ctx.fillText('重新训练', cx, by + 1);

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    new Game();
  } catch (e) {
    console.error('Game init failed:', e);
  }
});
