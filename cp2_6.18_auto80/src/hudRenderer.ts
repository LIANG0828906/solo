import { eventBus, gameState, GamePhase, GameStats } from './gameState';

interface AnimValue {
  current: number;
  target: number;
  display: number;
}

export class HUDRenderer {
  private hudCanvas: HTMLCanvasElement;
  private hudCtx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private stats: GameStats;
  private phase: GamePhase;
  private anims: Map<string, AnimValue> = new Map();
  private overlay: HTMLDivElement;

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
      pointer-events: none; z-index: 10; overflow: hidden;
    `;
    _canvas.parentElement?.appendChild(this.overlay);

    const keys = ['score', 'combo', 'brightness', 'survivalTime', 'fragmentsCollected'];
    for (const k of keys) {
      this.anims.set(k, { current: 0, target: 0, display: 0 });
    }

    this.setupEventListeners();
    this.resize();
    this.renderDOM();
  }

  private setupEventListeners(): void {
    eventBus.on('phaseChange', () => {
      this.phase = gameState.getPhase();
      this.renderDOM();
    });
    eventBus.on('statsUpdate', () => {
      this.stats = gameState.getStats();
    });
    eventBus.on('restart', () => {
      this.stats = gameState.getStats();
      this.phase = gameState.getPhase();
      this.renderDOM();
    });
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.hudCanvas.width = this.width * dpr;
    this.hudCanvas.height = this.height * dpr;
    this.hudCanvas.style.cssText = `
      width: 100%; height: 100%; position: absolute;
      top: 0; left: 0; pointer-events: none;
    `;
    this.hudCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.hudCanvas.parentElement) {
      this.overlay.appendChild(this.hudCanvas);
    }
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
    if (this.phase === 'menu') return;

    this.drawHUD();
    if (this.phase === 'countdown') this.drawCountdown();
    if (this.phase === 'tutorial') this.drawTutorialHint();
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

  private renderDOM(): void {
    const toRemove: Element[] = [];
    this.overlay.childNodes.forEach((node) => {
      if (node !== this.hudCanvas && node instanceof Element) {
        toRemove.push(node);
      }
    });
    toRemove.forEach((el) => el.remove());

    if (this.phase === 'menu') this.createMenu();
    if (this.phase === 'paused') this.createPauseMenu();
    if (this.phase === 'gameover') this.createGameOver();
  }

  private btnStyle(btn: HTMLButtonElement): void {
    btn.style.cssText = `
      width: 200px; height: 48px; border-radius: 24px; border: none;
      background: linear-gradient(135deg, #6EE7B7, #10B981);
      color: #0B0C2A; font-weight: bold; font-size: 16px;
      cursor: pointer; transition: filter 0.2s ease-in-out, transform 0.2s ease-in-out;
      font-family: 'Segoe UI', sans-serif; pointer-events: auto;
    `;
    btn.onmouseenter = () => { btn.style.filter = 'brightness(1.1)'; btn.style.transform = 'scale(1.03)'; };
    btn.onmouseleave = () => { btn.style.filter = 'brightness(1)'; btn.style.transform = 'scale(1)'; };
  }

  private titleStyle(el: HTMLElement, size: string): void {
    el.style.cssText = `
      font-size: ${size}; font-weight: bold; color: #E2E8F0;
      text-align: center; margin-bottom: 16px;
      background: linear-gradient(135deg, #6EE7B7, #60A5FA);
      -webkit-background-clip: text; background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: 'Segoe UI', sans-serif;
    `;
  }

  private createMenu(): void {
    const wrap = document.createElement('div');
    wrap.style.cssText = `
      position: absolute; inset: 0; display: flex;
      align-items: center; justify-content: center;
      pointer-events: auto; flex-direction: column;
    `;
    const title = document.createElement('div');
    title.textContent = 'GlowRush';
    this.titleStyle(title, '72px');

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'color:#94A3B8; font-size:18px; margin-bottom:40px; text-align:center; font-family:"Segoe UI", sans-serif;';
    subtitle.textContent = '收集能量碎片 · 维持光辉 · 躲避暗影';

    const startBtn = document.createElement('button');
    startBtn.textContent = '开始游戏';
    this.btnStyle(startBtn);
    startBtn.onclick = () => gameState.startCountdown();

    wrap.appendChild(title);
    wrap.appendChild(subtitle);
    wrap.appendChild(startBtn);
    this.overlay.appendChild(wrap);
  }

  private createPauseMenu(): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute; inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; pointer-events: auto;
    `;
    const title = document.createElement('div');
    title.textContent = '游戏暂停';
    this.titleStyle(title, '48px');

    const resume = document.createElement('button');
    resume.textContent = '继续游戏';
    this.btnStyle(resume);
    resume.style.marginBottom = '12px';
    resume.onclick = () => gameState.togglePause();

    const restart = document.createElement('button');
    restart.textContent = '重新开始';
    this.btnStyle(restart);
    restart.style.marginBottom = '12px';
    restart.onclick = () => { gameState.reset(); };

    const menu = document.createElement('button');
    menu.textContent = '返回主菜单';
    this.btnStyle(menu);
    menu.onclick = () => { gameState.reset(); };

    overlay.appendChild(title);
    overlay.appendChild(resume);
    overlay.appendChild(restart);
    overlay.appendChild(menu);
    this.overlay.appendChild(overlay);
  }

  private createGameOver(): void {
    const s = gameState.getStats();
    const mins = Math.floor(s.survivalTime / 60);
    const secs = Math.floor(s.survivalTime % 60);

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute; inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      pointer-events: auto;
      animation: fadeIn 0.3s ease-in-out;
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 24px; padding: 32px; min-width: 380px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex; flex-direction: column; align-items: center;
    `;

    const title = document.createElement('div');
    title.textContent = '游戏结束';
    this.titleStyle(title, '36px');

    const makeStat = (label: string, value: string, color: string) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        width: 100%; padding: 10px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      `;
      const l = document.createElement('span');
      l.style.cssText = 'color:#94A3B8; font-family:"Segoe UI", sans-serif; font-size:15px;';
      l.textContent = label;
      const v = document.createElement('span');
      v.style.cssText = `color:${color}; font-family:"Segoe UI", sans-serif; font-weight:bold; font-size:18px;`;
      v.textContent = value;
      row.appendChild(l);
      row.appendChild(v);
      return row;
    };

    const stats = document.createElement('div');
    stats.style.cssText = 'width:100%; margin: 16px 0 24px 0;';
    stats.appendChild(makeStat('最终得分', s.score.toLocaleString(), '#6EE7B7'));
    stats.appendChild(makeStat('收集碎片', `${s.fragmentsCollected} 个`, '#60A5FA'));
    stats.appendChild(makeStat('存活时间', `${mins}分${secs}秒`, '#C084FC'));
    stats.appendChild(makeStat('最高连击', `${s.maxCombo}x`, '#FBBF24'));

    const restart = document.createElement('button');
    restart.textContent = '再来一局';
    this.btnStyle(restart);
    restart.style.marginBottom = '12px';
    restart.onclick = () => { gameState.reset(); };

    const menu = document.createElement('button');
    menu.textContent = '返回主菜单';
    this.btnStyle(menu);
    menu.onclick = () => { gameState.reset(); };

    panel.appendChild(title);
    panel.appendChild(stats);
    panel.appendChild(restart);
    panel.appendChild(menu);
    overlay.appendChild(panel);
    this.overlay.appendChild(overlay);
  }
}
