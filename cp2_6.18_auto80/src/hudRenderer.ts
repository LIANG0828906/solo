import { eventBus, gameState, GamePhase, GameStats } from './gameState';

interface AnimValue {
  current: number;
  target: number;
  display: number;
}

interface Button {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  hovered: boolean;
  visible: boolean;
  onClick: () => void;
}

const BUTTON_WIDTH = 200;
const BUTTON_HEIGHT = 48;
const BUTTON_RADIUS = 24;

export class HUDRenderer {
  private hudCanvas: HTMLCanvasElement;
  private hudCtx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private stats: GameStats;
  private phase: GamePhase;
  private anims: Map<string, AnimValue> = new Map();
  private overlay: HTMLDivElement;
  private buttons: Button[] = [];
  private mouseX: number = -1;
  private mouseY: number = -1;

  constructor(_canvas: HTMLCanvasElement) {
    this.hudCanvas = document.createElement('canvas');
    const hudCtx = this.hudCanvas.getContext('2d');
    if (!hudCtx) throw new Error('Failed to get HUD context');
    this.hudCtx = hudCtx;

    this.stats = gameState.getStats();
    this.phase = gameState.getPhase();

    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: auto; z-index: 10; overflow: hidden;
    `;
    _canvas.parentElement?.appendChild(this.overlay);

    const keys = ['score', 'combo', 'brightness', 'survivalTime', 'fragmentsCollected'];
    for (const k of keys) {
      this.anims.set(k, { current: 0, target: 0, display: 0 });
    }

    this.setupEventListeners();
    this.setupMouseListeners();
    this.resize();
    this.buildButtons();
  }

  private setupEventListeners(): void {
    eventBus.on('phaseChange', () => {
      this.phase = gameState.getPhase();
      this.buildButtons();
    });
    eventBus.on('statsUpdate', () => {
      this.stats = gameState.getStats();
    });
    eventBus.on('restart', () => {
      this.stats = gameState.getStats();
      this.phase = gameState.getPhase();
      this.buildButtons();
    });
  }

  private setupMouseListeners(): void {
    const updateMouse = (e: MouseEvent) => {
      const rect = this.hudCanvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.updateButtonHover();
    };
    this.overlay.addEventListener('mousemove', updateMouse);
    this.overlay.addEventListener('mouseenter', updateMouse);
    this.overlay.addEventListener('mouseleave', () => {
      this.mouseX = -1;
      this.mouseY = -1;
      this.updateButtonHover();
    });
    this.overlay.addEventListener('click', (e) => {
      const rect = this.hudCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleClick(x, y);
    });
  }

  private updateButtonHover(): void {
    for (const btn of this.buttons) {
      if (!btn.visible) continue;
      btn.hovered = this.mouseX >= btn.x && this.mouseX <= btn.x + btn.width &&
                    this.mouseY >= btn.y && this.mouseY <= btn.y + btn.height;
    }
  }

  private handleClick(x: number, y: number): void {
    for (const btn of this.buttons) {
      if (!btn.visible) continue;
      if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
        btn.onClick();
        return;
      }
    }
  }

  private buildButtons(): void {
    this.buttons = [];
    const cx = this.width / 2;

    if (this.phase === 'menu') {
      const y = this.height / 2 + 60;
      this.buttons.push({
        id: 'start', x: cx - BUTTON_WIDTH / 2, y,
        width: BUTTON_WIDTH, height: BUTTON_HEIGHT,
        label: '开始游戏', hovered: false, visible: true,
        onClick: () => gameState.startCountdown(),
      });
      return;
    }

    if (this.phase === 'paused') {
      const cy = this.height / 2;
      this.buttons.push({
        id: 'resume', x: cx - BUTTON_WIDTH / 2, y: cy - 10,
        width: BUTTON_WIDTH, height: BUTTON_HEIGHT,
        label: '继续游戏', hovered: false, visible: true,
        onClick: () => gameState.togglePause(),
      });
      this.buttons.push({
        id: 'restart', x: cx - BUTTON_WIDTH / 2, y: cy + 58,
        width: BUTTON_WIDTH, height: BUTTON_HEIGHT,
        label: '重新开始', hovered: false, visible: true,
        onClick: () => gameState.reset(),
      });
      this.buttons.push({
        id: 'menu', x: cx - BUTTON_WIDTH / 2, y: cy + 126,
        width: BUTTON_WIDTH, height: BUTTON_HEIGHT,
        label: '返回主菜单', hovered: false, visible: true,
        onClick: () => gameState.reset(),
      });
      return;
    }

    if (this.phase === 'gameover') {
      const cy = this.height / 2 + 140;
      this.buttons.push({
        id: 'restart_go', x: cx - BUTTON_WIDTH / 2, y: cy - 6,
        width: BUTTON_WIDTH, height: BUTTON_HEIGHT,
        label: '再来一局', hovered: false, visible: true,
        onClick: () => gameState.reset(),
      });
      this.buttons.push({
        id: 'menu_go', x: cx - BUTTON_WIDTH / 2, y: cy + 62,
        width: BUTTON_WIDTH, height: BUTTON_HEIGHT,
        label: '返回主菜单', hovered: false, visible: true,
        onClick: () => gameState.reset(),
      });
      return;
    }
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.hudCanvas.width = this.width * dpr;
    this.hudCanvas.height = this.height * dpr;
    this.hudCanvas.style.cssText = `
      width: 100%; height: 100%; position: absolute;
      top: 0; left: 0; display: block;
    `;
    this.hudCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.hudCanvas.parentElement) {
      this.overlay.appendChild(this.hudCanvas);
    }
    this.buildButtons();
  }

  update(_dt: number): void {
    const s = this.stats;
    const targets: Record<string, number> = {
      score: s.score, combo: s.combo, brightness: s.brightness,
      survivalTime: s.survivalTime, fragmentsCollected: s.fragmentsCollected,
    };
    this.anims.forEach((v, k) => {
      v.target = targets[k] ?? 0;
      v.display += (v.target - v.display) * 0.15;
      v.current = Math.round(v.display * 100) / 100;
    });
  }

  render(): void {
    this.hudCtx.clearRect(0, 0, this.width, this.height);

    if (this.phase === 'menu') {
      this.drawMenuScreen();
      this.drawButtons();
      return;
    }

    this.drawHUD();
    if (this.phase === 'countdown') this.drawCountdown();
    if (this.phase === 'tutorial') this.drawTutorialHint();
    if (this.phase === 'paused') {
      this.drawGlassOverlay(0.35);
      this.drawPausePanel();
      this.drawButtons();
    }
    if (this.phase === 'gameover') {
      this.drawGlassOverlay(0.45);
      this.drawGameOverPanel();
      this.drawButtons();
    }
  }

  private drawGlassOverlay(intensity: number): void {
    const c = this.hudCtx;
    c.save();

    c.fillStyle = `rgba(8, 10, 30, ${intensity})`;
    c.fillRect(0, 0, this.width, this.height);

    for (let i = 0; i < 3; i++) {
      c.fillStyle = `rgba(15, 20, 50, ${0.06})`;
      c.fillRect(0, 0, this.width, this.height);
    }

    c.strokeStyle = `rgba(80, 120, 200, ${0.03})`;
    c.lineWidth = 1;
    for (let y = 0; y < this.height; y += 3) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(this.width, y + Math.sin(y * 0.01) * 2);
      c.stroke();
    }

    c.restore();
  }

  private drawRoundedRect(x: number, y: number, w: number, h: number, r: number): void {
    const c = this.hudCtx;
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  private card(x: number, y: number, w: number, h: number, r: number): void {
    const c = this.hudCtx;
    this.drawRoundedRect(x, y, w, h, r);
    c.fillStyle = 'rgba(0, 0, 0, 0.6)';
    c.fill();
    c.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    c.lineWidth = 1;
    c.stroke();
  }

  private drawGlassPanel(x: number, y: number, w: number, h: number, r: number): void {
    const c = this.hudCtx;

    c.save();
    this.drawRoundedRect(x, y, w, h, r);
    c.clip();

    const layerCount = 6;
    for (let i = layerCount; i >= 1; i--) {
      c.fillStyle = `rgba(15, 20, 50, ${0.09 * i / layerCount})`;
      c.fillRect(x, y, w, h);
    }

    c.fillStyle = 'rgba(20, 25, 60, 0.55)';
    c.fillRect(x, y, w, h);

    const glowGrad = c.createRadialGradient(
      x + w / 2, y + h * 0.3, 0,
      x + w / 2, y + h * 0.3, Math.max(w, h) * 0.7
    );
    glowGrad.addColorStop(0, 'rgba(100, 150, 255, 0.06)');
    glowGrad.addColorStop(1, 'rgba(100, 150, 255, 0)');
    c.fillStyle = glowGrad;
    c.fillRect(x, y, w, h);

    c.restore();

    this.drawRoundedRect(x, y, w, h, r);
    c.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    c.lineWidth = 1;
    c.stroke();

    c.save();
    this.drawRoundedRect(x + 1, y + 1, w - 2, h - 2, r - 1);
    c.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    c.lineWidth = 1;
    c.stroke();
    c.restore();

    c.save();
    this.drawRoundedRect(x + 2, y + 2, w - 4, 2, Math.min(r - 2, 2));
    c.fillStyle = 'rgba(255, 255, 255, 0.08)';
    c.fill();
    c.restore();
  }

  private drawHUD(): void {
    const c = this.hudCtx;
    const b = this.anims.get('brightness')!.current;
    const score = this.anims.get('score')!.current;
    const combo = this.anims.get('combo')!.current;
    const st = this.anims.get('survivalTime')!.current;
    const fc = this.anims.get('fragmentsCollected')!.current;

    this.card(20, 20, 260, 140, 12);

    const cx = 20 + 55, cy = 20 + 70, radius = 45;
    const startAngle = -Math.PI / 2;
    const ratio = Math.max(0, Math.min(100, b)) / 100;

    c.lineWidth = 6;
    c.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    c.beginPath(); c.arc(cx, cy, radius, 0, Math.PI * 2); c.stroke();

    const grad = c.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    grad.addColorStop(0, '#6EE7B7');
    grad.addColorStop(1, ratio > 0.25 ? '#60A5FA' : '#F59E0B');
    c.strokeStyle = grad;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(cx, cy, radius, startAngle, startAngle + ratio * Math.PI * 2);
    c.stroke();
    c.lineCap = 'butt';

    c.fillStyle = '#E2E8F0';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('亮度', cx, cy + 5);
    c.font = '13px "Segoe UI", sans-serif';
    c.fillStyle = '#94A3B8';
    c.fillText(`x${(0.5 + (b / 100) * 2).toFixed(1)}`, cx, cy + 28);

    const rightX = 20 + 130;
    c.fillStyle = '#E2E8F0';
    c.font = 'bold 22px "Segoe UI", sans-serif';
    c.textAlign = 'right';
    c.fillText(`${Math.floor(score)}`, rightX + 110, 20 + 42);
    c.font = '13px "Segoe UI", sans-serif';
    c.fillStyle = '#94A3B8';
    c.fillText('分数', rightX + 110, 20 + 62);

    if (combo > 0) {
      const a = Math.min(1, combo / 5);
      c.save();
      c.globalAlpha = a;
      c.fillStyle = combo >= 15 ? '#F59E0B' : combo >= 10 ? '#FBBF24' : '#6EE7B7';
      c.font = `bold ${18 + Math.min(combo, 20) * 0.4}px "Segoe UI", sans-serif`;
      c.fillText(`${combo}x`, rightX + 110, 20 + 95);
      c.font = '12px "Segoe UI", sans-serif';
      c.fillStyle = '#94A3B8';
      c.fillText('连击', rightX + 110, 20 + 115);
      c.restore();
    }

    this.card(this.width - 20 - 200, 20, 200, 90, 12);
    c.fillStyle = '#E2E8F0';
    c.font = '14px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    const mins = Math.floor(st / 60), secs = Math.floor(st % 60);
    c.fillText(`\u23F1 ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`, this.width - 20 - 180, 20 + 38);
    c.fillStyle = '#94A3B8';
    c.font = '12px "Segoe UI", sans-serif';
    c.fillText('存活时间', this.width - 20 - 180, 20 + 58);
    c.fillStyle = '#E2E8F0';
    c.font = '14px "Segoe UI", sans-serif';
    c.fillText(`\u25C6 ${Math.floor(fc)}`, this.width - 20 - 180, 20 + 85);
    c.fillStyle = '#94A3B8';
    c.font = '12px "Segoe UI", sans-serif';
    c.fillText('碎片收集', this.width - 20 - 180, 20 + 105);
  }

  private drawCountdown(): void {
    const c = this.hudCtx;
    const num = gameState.getCountdown();
    const anim = 1 - (num - Math.floor(num));
    c.save();
    const cx = this.width / 2, cy = this.height / 2;
    c.fillStyle = 'rgba(0, 0, 0, 0.4)';
    c.fillRect(0, 0, this.width, this.height);
    const scale = 1 + anim * 0.3, alpha = 1 - anim * 0.5;
    c.globalAlpha = alpha;
    c.translate(cx, cy);
    c.scale(scale, scale);
    const glow = c.createRadialGradient(0, 0, 0, 0, 0, 120);
    glow.addColorStop(0, 'rgba(96, 165, 250, 0.6)');
    glow.addColorStop(1, 'rgba(96, 165, 250, 0)');
    c.fillStyle = glow;
    c.beginPath(); c.arc(0, 0, 120, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#FFFFFF';
    c.font = 'bold 120px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.shadowColor = 'rgba(96, 165, 250, 0.8)';
    c.shadowBlur = 30;
    c.fillText(num > 0 ? num.toString() : 'GO!', 0, 0);
    c.shadowBlur = 0;
    c.restore();
  }

  private drawTutorialHint(): void {
    const c = this.hudCtx;
    const timer = gameState.getTutorialTimer();
    c.save();
    const barW = 300, barH = 8;
    const bx = (this.width - barW) / 2, by = this.height - 80;
    this.drawRoundedRect(bx - 20, by - 45, barW + 40, barH + 70, 12);
    c.fillStyle = 'rgba(0, 0, 0, 0.6)'; c.fill();
    c.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.drawRoundedRect(bx, by, barW, barH, 4); c.fill();
    const ratio = timer / 10;
    const g = c.createLinearGradient(bx, by, bx + barW, by);
    g.addColorStop(0, '#F59E0B'); g.addColorStop(1, '#FBBF24');
    c.fillStyle = g;
    this.drawRoundedRect(bx, by, barW * ratio, barH, 4); c.fill();
    c.fillStyle = '#FBBF24';
    c.font = 'bold 16px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(`\u26A1 无敌教学阶段 - ${timer}s`, this.width / 2, by - 18);
    c.fillStyle = '#94A3B8';
    c.font = '13px "Segoe UI", sans-serif';
    c.fillText('使用 WASD 或方向键移动 \u00B7 收集碎片 \u00B7 躲避暗影怪物', this.width / 2, by + barH + 22);
    c.restore();
  }

  private drawButtons(): void {
    const c = this.hudCtx;
    for (const btn of this.buttons) {
      if (!btn.visible) continue;
      c.save();

      const brightness = btn.hovered ? 1.1 : 1;
      const scale = btn.hovered ? 1.02 : 1;
      const bx = btn.x + btn.width / 2;
      const by = btn.y + btn.height / 2;

      c.translate(bx, by);
      c.scale(scale, scale);
      c.translate(-bx, -by);

      c.shadowColor = btn.hovered ? 'rgba(16, 185, 129, 0.4)' : 'rgba(0, 0, 0, 0.3)';
      c.shadowBlur = btn.hovered ? 16 : 8;
      c.shadowOffsetY = btn.hovered ? 4 : 2;

      const grad = c.createLinearGradient(btn.x, btn.y, btn.x + btn.width, btn.y + btn.height);
      if (brightness > 1) {
        grad.addColorStop(0, '#7FF2C3');
        grad.addColorStop(1, '#28D099');
      } else {
        grad.addColorStop(0, '#6EE7B7');
        grad.addColorStop(1, '#10B981');
      }

      this.drawRoundedRect(btn.x, btn.y, btn.width, btn.height, BUTTON_RADIUS);
      c.fillStyle = grad;
      c.fill();

      c.shadowBlur = 0;
      c.shadowOffsetY = 0;

      this.drawRoundedRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height / 2 - 1, BUTTON_RADIUS - 1);
      c.fillStyle = 'rgba(255, 255, 255, 0.12)';
      c.fill();

      c.fillStyle = '#0B0C2A';
      c.font = 'bold 16px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2 + 1);

      c.restore();
    }
  }

  private drawGradientTitle(text: string, x: number, y: number, size: number): void {
    const c = this.hudCtx;
    c.save();
    c.font = `bold ${size}px "Segoe UI", sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';

    const grad = c.createLinearGradient(x - 150, y, x + 150, y);
    grad.addColorStop(0, '#6EE7B7');
    grad.addColorStop(1, '#60A5FA');
    c.fillStyle = grad;
    c.shadowColor = 'rgba(110, 231, 183, 0.3)';
    c.shadowBlur = 20;
    c.fillText(text, x, y);
    c.shadowBlur = 0;
    c.restore();
  }

  private drawMenuScreen(): void {
    const c = this.hudCtx;
    const cx = this.width / 2;

    const bgGrad = c.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, 'rgba(11, 12, 42, 0.7)');
    bgGrad.addColorStop(1, 'rgba(27, 28, 62, 0.7)');
    c.fillStyle = bgGrad;
    c.fillRect(0, 0, this.width, this.height);

    c.fillStyle = 'rgba(255, 255, 255, 0.2)';
    const starSeed = 54321;
    for (let i = 0; i < 100; i++) {
      const sx = ((starSeed * (i + 1) * 9301 + 49297) % 233280) / 233280 * this.width;
      const sy = ((starSeed * (i + 1) * 1237 + 24601) % 233280) / 233280 * this.height;
      const sr = ((starSeed * (i + 1) * 7919 + 1234) % 233280) / 233280 * 1.5 + 0.3;
      c.beginPath();
      c.arc(sx, sy, sr, 0, Math.PI * 2);
      c.fill();
    }

    const titleY = this.height / 2 - 80;
    const playerGlow = c.createRadialGradient(cx, titleY, 0, cx, titleY, 180);
    playerGlow.addColorStop(0, 'rgba(96, 165, 250, 0.35)');
    playerGlow.addColorStop(1, 'rgba(96, 165, 250, 0)');
    c.fillStyle = playerGlow;
    c.beginPath();
    c.arc(cx, titleY, 180, 0, Math.PI * 2);
    c.fill();

    this.drawGradientTitle('GlowRush', cx, titleY, 72);

    c.fillStyle = '#94A3B8';
    c.font = '18px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('收集能量碎片 \u00B7 维持光辉 \u00B7 躲避暗影', cx, this.height / 2 - 10);
  }

  private drawPausePanel(): void {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const pw = 380;
    const ph = 280;
    const px = cx - pw / 2;
    const py = cy - ph / 2 - 40;

    this.drawGlassPanel(px, py, pw, ph, 24);
    this.drawGradientTitle('游戏暂停', cx, py + 55, 40);
  }

  private drawGameOverPanel(): void {
    const c = this.hudCtx;
    const s = gameState.getStats();
    const cx = this.width / 2;
    const cy = this.height / 2;
    const pw = 440;
    const ph = 480;
    const px = cx - pw / 2;
    const py = cy - ph / 2;

    this.drawGlassPanel(px, py, pw, ph, 24);

    this.drawGradientTitle('游戏结束', cx, py + 55, 36);

    const stats: Array<{ label: string; value: string; color: string }> = [
      { label: '最终得分', value: s.score.toLocaleString(), color: '#6EE7B7' },
      { label: '收集碎片', value: `${s.fragmentsCollected} 个`, color: '#60A5FA' },
      { label: '存活时间', value: `${Math.floor(s.survivalTime / 60)}分${Math.floor(s.survivalTime % 60)}秒`, color: '#C084FC' },
      { label: '最高连击', value: `${s.maxCombo}x`, color: '#FBBF24' },
    ];

    const startY = py + 110;
    const rowH = 50;
    stats.forEach((stat, i) => {
      const ry = startY + i * rowH;

      if (i < stats.length - 1) {
        c.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(px + 40, ry + rowH - 5);
        c.lineTo(px + pw - 40, ry + rowH - 5);
        c.stroke();
      }

      c.fillStyle = '#94A3B8';
      c.font = '15px "Segoe UI", sans-serif';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(stat.label, px + 40, ry + rowH / 2);

      c.fillStyle = stat.color;
      c.font = 'bold 18px "Segoe UI", sans-serif';
      c.textAlign = 'right';
      c.fillText(stat.value, px + pw - 40, ry + rowH / 2);
    });
  }
}
