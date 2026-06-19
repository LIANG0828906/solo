import type { GameEngine, GameStats, SkillType, GameState } from './GameEngine';
import type { Direction, JudgeResult, Note } from './NoteManager';
import { CHARTS, DIFFICULTY_CONFIG, type Difficulty } from './NoteManager';

export interface UIElement {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  data?: unknown;
}

export class Renderer {
  private engine: GameEngine;
  private width = 1280;
  private height = 720;
  private isMobile = false;
  public uiElements: UIElement[] = [];

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  setSize(w: number, h: number, isMobile: boolean): void {
    this.width = w;
    this.height = h;
    this.isMobile = isMobile;
  }

  render(ctx: CanvasRenderingContext2D, now: number, shakeOffset: { x: number; y: number }): void {
    ctx.save();
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.translate(shakeOffset.x, shakeOffset.y);

    this.drawBackground(ctx);

    const state = this.engine.getState();
    if (state === 'menu') {
      this.drawMenu(ctx, now);
    } else if (state === 'gameover' || state === 'finished') {
      this.drawGameplay(ctx, now);
      this.drawResult(ctx, now);
    } else {
      this.drawGameplay(ctx, now);
      if (state === 'paused') {
        this.drawPauseOverlay(ctx);
      }
    }

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0a0f2e');
    gradient.addColorStop(0.5, '#0e1540');
    gradient.addColorStop(1, '#0a0f2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  private drawMenu(ctx: CanvasRenderingContext2D, now: number): void {
    this.uiElements = [];
    const selectedIndex = this.engine.getSelectedMenuIndex();
    const chartIndex = this.engine.getCurrentChartIndex();
    const difficulty = this.engine.getCurrentDifficulty();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 30;
    ctx.font = 'bold 56px Segoe UI';
    ctx.fillText('RHYTHM STRIKE', this.width / 2, this.height * 0.18);
    ctx.shadowBlur = 0;

    ctx.font = '18px Segoe UI';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('节 奏 闯 关', this.width / 2, this.height * 0.24);

    const items = [
      { label: '曲目', value: CHARTS[chartIndex].name + ` (${CHARTS[chartIndex].bpm} BPM)`, id: 'chart' },
      { label: '难度', value: difficulty.toUpperCase(), id: 'difficulty' },
      { label: '', value: '开 始 游 戏', id: 'start' }
    ];

    const startY = this.height * 0.32;
    const itemH = 68;

    for (let i = 0; i < items.length; i++) {
      const y = startY + i * itemH;
      const isSelected = selectedIndex === i;
      const w = this.width * 0.5;
      const x = (this.width - w) / 2;

      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
        ctx.fillRect(x, y, w, itemH - 12);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, itemH - 12);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(x, y, w, itemH - 12);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, itemH - 12);
      }

      const boxH = itemH - 12;

      if (items[i].label) {
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '15px Segoe UI';
        ctx.fillText(items[i].label, x + 24, y + 24);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = items[i].id === 'start' ? '#ff3d77' : '#ffffff';
      ctx.font = items[i].id === 'start' ? 'bold 24px Segoe UI' : 'bold 20px Segoe UI';
      if (items[i].id === 'start') {
        ctx.shadowColor = '#ff3d77';
        ctx.shadowBlur = isSelected ? 20 : 10;
      }
      const textY = items[i].label ? y + boxH * 0.68 : y + boxH / 2;
      ctx.fillText(items[i].value, this.width / 2, textY);
      ctx.shadowBlur = 0;
      ctx.textBaseline = 'alphabetic';

      if (items[i].id !== 'start') {
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00e5ff';
        ctx.font = '18px Segoe UI';
        ctx.fillText('◀', x + 16, y + boxH / 2);
        ctx.textAlign = 'right';
        ctx.fillText('▶', x + w - 16, y + boxH / 2);
        ctx.textBaseline = 'alphabetic';
      }

      this.uiElements.push({ id: items[i].id, x, y, w, h: itemH - 12 });
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '12px Segoe UI';
    ctx.fillText('方向键/WASD 移动  ← → 选择  Enter/空格 开始  P/Esc 暂停', this.width / 2, this.height - 30);
    ctx.fillText('移动端：点击按钮或菜单选项进行操作', this.width / 2, this.height - 12);
  }

  private drawGameplay(ctx: CanvasRenderingContext2D, now: number): void {
    const trackWidth = this.isMobile ? this.width * 0.9 : this.width * 0.6;
    const trackX = (this.width - trackWidth) / 2;
    const laneWidth = trackWidth / 4;
    const laneOrder: Direction[] = ['left', 'down', 'up', 'right'];
    const judgeY = this.height * 0.8;
    const trackColors: Record<Direction, string> = {
      up: '#00e5ff',
      down: '#ff3d77',
      left: '#ffeb3b',
      right: '#7c4dff'
    };
    const notes = this.engine.getActiveNotes();
    const lastJudge = this.engine.getLastJudge();
    const gameTime = this.engine.getGameTime();

    ctx.fillStyle = 'rgba(10, 15, 46, 0.6)';
    ctx.fillRect(trackX, this.height * 0.05, trackWidth, this.height * 0.78);

    for (let i = 0; i <= 4; i++) {
      const x = trackX + i * laneWidth;
      ctx.strokeStyle = i === 0 || i === 4 ? 'rgba(0, 229, 255, 0.3)' : 'rgba(0, 229, 255, 0.1)';
      ctx.lineWidth = i === 0 || i === 4 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, this.height * 0.05);
      ctx.lineTo(x, this.height * 0.83);
      ctx.stroke();
    }

    const noteRadius = laneWidth * 0.32;
    for (const note of notes) {
      const laneIdx = laneOrder.indexOf(note.direction);
      const nx = trackX + laneIdx * laneWidth + laneWidth / 2;
      const color = trackColors[note.direction];

      for (let j = 0; j < note.trail.length; j++) {
        const t = note.trail[j];
        ctx.globalAlpha = t.alpha * 0.35;
        const grad = ctx.createRadialGradient(nx, t.y, 0, nx, t.y, noteRadius * 0.7);
        grad.addColorStop(0, color);
        grad.addColorStop(1, color + '00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, t.y, noteRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const gradient = ctx.createRadialGradient(nx - noteRadius * 0.3, note.y - noteRadius * 0.3, 0, nx, note.y, noteRadius);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, color);
      gradient.addColorStop(1, this.darkenColor(color, 0.4));

      ctx.fillStyle = gradient;
      ctx.shadowColor = color;
      ctx.shadowBlur = note.judged ? 5 : 18;
      ctx.beginPath();
      ctx.arc(nx, note.y, noteRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.floor(noteRadius * 0.9)}px Segoe UI`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const arrows: Record<Direction, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
      ctx.fillText(arrows[note.direction], nx, note.y);
      ctx.globalAlpha = 1;
    }

    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 25;
    const lineGrad = ctx.createLinearGradient(trackX, 0, trackX + trackWidth, 0);
    lineGrad.addColorStop(0, '#00e5ff');
    lineGrad.addColorStop(0.5, '#ffffff');
    lineGrad.addColorStop(1, '#00e5ff');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(trackX, judgeY);
    ctx.lineTo(trackX + trackWidth, judgeY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    for (let i = 0; i < 4; i++) {
      const lx = trackX + i * laneWidth + laneWidth / 2;
      const color = trackColors[laneOrder[i]];
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lx, judgeY, noteRadius * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lx, judgeY, noteRadius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.drawHUD(ctx, now);

    if (lastJudge && now - lastJudge.time < 0.8) {
      const t = (now - lastJudge.time) / 0.8;
      ctx.globalAlpha = 1 - t;
      const judgeColors: Record<JudgeResult, string> = {
        perfect: '#00e5ff',
        good: '#00ff88',
        normal: '#ffeb3b',
        miss: '#ff3d77'
      };
      ctx.textAlign = 'center';
      ctx.fillStyle = judgeColors[lastJudge.result];
      ctx.shadowColor = judgeColors[lastJudge.result];
      ctx.shadowBlur = 20;
      ctx.font = 'bold 44px Segoe UI';
      ctx.fillText(lastJudge.result.toUpperCase(), this.width / 2, this.height * 0.55 - t * 40);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  private drawHUD(ctx: CanvasRenderingContext2D, now: number): void {
    const trackWidth = this.isMobile ? this.width * 0.9 : this.width * 0.6;
    const sideW = (this.width - trackWidth) / 2;
    const chart = this.engine.getChart();
    const stats = this.engine.getStats();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Segoe UI';
    ctx.fillText(stats.score.toString().padStart(7, '0'), this.width / 2, 50);

    ctx.font = 'bold 52px Segoe UI';
    if (stats.combo >= 50) {
      ctx.fillStyle = '#ff3d77';
      ctx.shadowColor = '#ff3d77';
      ctx.shadowBlur = 15;
    } else if (stats.combo >= 20) {
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
    }
    if (stats.combo > 0) {
      ctx.fillText(stats.combo.toString(), this.width / 2, 115);
      ctx.font = '14px Segoe UI';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('COMBO', this.width / 2, 140);
    }
    ctx.shadowBlur = 0;

    if (!this.isMobile) {
      this.drawLeftPanel(ctx, sideW, chart, stats);
      this.drawRightPanel(ctx, sideW, stats, now);
    } else {
      this.drawMobileHUD(ctx, chart, stats, now);
    }
  }

  private drawLeftPanel(ctx: CanvasRenderingContext2D, w: number, chart: { name: string; bpm: number }, stats: GameStats): void {
    const padX = 16;
    let y = 100;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('TRACK', padX, y);
    y += 24;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Segoe UI';
    ctx.fillText(chart.name, padX, y);
    y += 22;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px Segoe UI';
    ctx.fillText(`${chart.bpm} BPM`, padX, y);
    y += 40;

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('HP', padX, y);
    y += 20;
    for (let i = 0; i < stats.maxHp; i++) {
      const hx = padX + i * 22;
      ctx.fillStyle = i < stats.hp ? '#ff3d77' : 'rgba(255,255,255,0.15)';
      ctx.shadowColor = i < stats.hp ? '#ff3d77' : 'transparent';
      ctx.shadowBlur = i < stats.hp ? 8 : 0;
      ctx.fillRect(hx, y, 18, 22);
    }
    ctx.shadowBlur = 0;
    y += 50;

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('PROGRESS', padX, y);
    y += 18;
    const barW = w - padX * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(padX, y, barW, 8);
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(padX, y, barW * (stats.completionPercent / 100), 8);
    y += 22;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px Segoe UI';
    ctx.fillText(`${stats.completionPercent.toFixed(0)}%`, padX, y);
  }

  private drawRightPanel(ctx: CanvasRenderingContext2D, w: number, stats: GameStats, now: number): void {
    const panelX = this.width - w;
    const padX = 16;
    let y = 100;
    const skillCooldowns = this.engine.getSkillCooldowns();
    const activeSkills = this.engine.getActiveSkills();
    const hasShield = this.engine.getHasShield();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('MAX COMBO', panelX + padX, y);
    y += 22;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Segoe UI';
    ctx.fillText(stats.maxCombo.toString(), panelX + padX, y);
    y += 32;

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('ACCURACY', panelX + padX, y);
    y += 22;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Segoe UI';
    ctx.fillText(`${stats.accuracy.toFixed(1)}%`, panelX + padX, y);
    y += 36;

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('ENERGY', panelX + padX, y);
    y += 18;
    const barW = w - padX * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(panelX + padX, y, barW, 14);
    const energyPct = stats.energy / stats.maxEnergy;
    const energyGrad = ctx.createLinearGradient(panelX + padX, 0, panelX + padX + barW, 0);
    energyGrad.addColorStop(0, '#00e5ff');
    energyGrad.addColorStop(1, '#ff3d77');
    ctx.fillStyle = energyGrad;
    ctx.fillRect(panelX + padX, y, barW * energyPct, 14);
    if (stats.energy >= stats.maxEnergy) {
      ctx.shadowColor = '#ff3d77';
      ctx.shadowBlur = 10 + Math.sin(now * 6) * 5;
      ctx.strokeStyle = '#ff3d77';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX + padX, y, barW, 14);
      ctx.shadowBlur = 0;
    }
    y += 24;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px Segoe UI';
    ctx.fillText(`${Math.floor(stats.energy)} / ${stats.maxEnergy}`, panelX + padX, y);
    y += 32;

    const skills: Array<{ key: SkillType; num: number; label: string; cd: number; color: string }> = [
      { key: 'slow', num: 1, label: 'SLOW', cd: skillCooldowns.slow, color: '#00e5ff' },
      { key: 'shield', num: 2, label: 'SHIELD', cd: skillCooldowns.shield, color: '#00ff88' },
      { key: 'doubleCombo', num: 3, label: 'DOUBLE', cd: skillCooldowns.doubleCombo, color: '#ff3d77' }
    ];

    const isSkillActiveFn = (type: SkillType): boolean => {
      return activeSkills.some(s => s.type === type);
    };

    for (const s of skills) {
      const btnW = w - padX * 2;
      const btnH = 52;
      const bx = panelX + padX;
      const by = y;
      const active = isSkillActiveFn(s.key) || (s.key === 'shield' && hasShield);
      const canUse = stats.energy >= stats.maxEnergy && s.cd <= 0;

      ctx.fillStyle = active ? s.color + '33' : 'rgba(255,255,255,0.05)';
      ctx.fillRect(bx, by, btnW, btnH);
      ctx.strokeStyle = active || canUse ? s.color : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = active || canUse ? 2 : 1;
      ctx.strokeRect(bx, by, btnW, btnH);

      if (s.cd > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx, by, btnW * (s.cd / 5), btnH);
      }

      ctx.fillStyle = active || canUse ? s.color : 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 18px Segoe UI';
      ctx.textAlign = 'left';
      ctx.fillText(`[${s.num}]`, bx + 12, by + 32);
      ctx.font = 'bold 15px Segoe UI';
      ctx.fillText(s.label, bx + 50, by + 32);

      if (active) {
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 10;
        ctx.font = 'bold 11px Segoe UI';
        ctx.textAlign = 'right';
        ctx.fillText('ACTIVE', bx + btnW - 10, by + 20);
        ctx.shadowBlur = 0;
      } else if (s.cd > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = 'bold 14px Segoe UI';
        ctx.textAlign = 'right';
        ctx.fillText(s.cd.toFixed(1) + 's', bx + btnW - 10, by + 32);
      }

      y += btnH + 10;
    }
  }

  private drawMobileHUD(ctx: CanvasRenderingContext2D, chart: { name: string; bpm: number }, stats: GameStats, now: number): void {
    const skillCooldowns = this.engine.getSkillCooldowns();
    const activeSkills = this.engine.getActiveSkills();
    const hasShield = this.engine.getHasShield();

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px Segoe UI';
    ctx.fillText(`${chart.name} · ${chart.bpm}BPM`, 12, 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText(`${stats.accuracy.toFixed(0)}%`, this.width - 12, 30);

    let y = this.height - 110;
    const barW = this.width - 24;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(12, y, barW, 10);
    const energyPct = stats.energy / stats.maxEnergy;
    const energyGrad = ctx.createLinearGradient(12, 0, 12 + barW, 0);
    energyGrad.addColorStop(0, '#00e5ff');
    energyGrad.addColorStop(1, '#ff3d77');
    ctx.fillStyle = energyGrad;
    ctx.fillRect(12, y, barW * energyPct, 10);

    y += 20;
    for (let i = 0; i < stats.maxHp; i++) {
      ctx.fillStyle = i < stats.hp ? '#ff3d77' : 'rgba(255,255,255,0.15)';
      ctx.fillRect(12 + i * 18, y, 14, 16);
    }

    const btnSize = 56;
    const gap = 10;
    const startX = this.width / 2 - (btnSize * 3 + gap * 2) / 2;
    y = this.height - btnSize - 14;

    const skills: Array<{ key: SkillType; label: string; cd: number; color: string }> = [
      { key: 'slow', label: '慢', cd: skillCooldowns.slow, color: '#00e5ff' },
      { key: 'shield', label: '盾', cd: skillCooldowns.shield, color: '#00ff88' },
      { key: 'doubleCombo', label: '倍', cd: skillCooldowns.doubleCombo, color: '#ff3d77' }
    ];

    const isSkillActiveFn = (type: SkillType): boolean => {
      return activeSkills.some(s => s.type === type);
    };

    for (let i = 0; i < skills.length; i++) {
      const s = skills[i];
      const bx = startX + i * (btnSize + gap);
      const active = isSkillActiveFn(s.key) || (s.key === 'shield' && hasShield);
      const canUse = stats.energy >= stats.maxEnergy && s.cd <= 0;

      ctx.fillStyle = active ? s.color + '44' : (canUse ? s.color + '22' : 'rgba(255,255,255,0.05)');
      ctx.beginPath();
      ctx.arc(bx + btnSize / 2, y + btnSize / 2, btnSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = active || canUse ? s.color : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (s.cd > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.moveTo(bx + btnSize / 2, y + btnSize / 2);
        ctx.arc(bx + btnSize / 2, y + btnSize / 2, btnSize / 2, -Math.PI / 2, -Math.PI / 2 + (s.cd / 5) * Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.fillStyle = active || canUse ? s.color : 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 22px Segoe UI';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.label, bx + btnSize / 2, y + btnSize / 2);
    }
  }

  private drawPauseOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(10, 15, 46, 0.85)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 64px Segoe UI';
    ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 20);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '18px Segoe UI';
    ctx.fillText('按 P 或 Esc 继续游戏', this.width / 2, this.height / 2 + 30);
  }

  private drawResult(ctx: CanvasRenderingContext2D, now: number): void {
    this.uiElements = [];

    const state = this.engine.getState();
    const stats = this.engine.getStats();
    const rating = this.engine.getRating();
    const fadeIn = Math.min(1, 1.5);

    ctx.save();
    ctx.globalAlpha = fadeIn;

    ctx.fillStyle = 'rgba(10, 15, 46, 0.85)';
    ctx.fillRect(0, 0, this.width, this.height);

    const panelW = this.width * 0.5;
    const panelH = this.height * 0.75;
    const panelX = (this.width - panelW) / 2;
    const panelY = this.height - panelH - 40;

    ctx.fillStyle = '#0e1540';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 20;
    ctx.strokeRect(panelX, panelY, panelW, panelH);
    ctx.shadowBlur = 0;

    ctx.textAlign = 'center';
    ctx.fillStyle = state === 'gameover' ? '#ff3d77' : '#00e5ff';
    ctx.shadowColor = state === 'gameover' ? '#ff3d77' : '#00e5ff';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 36px Segoe UI';
    ctx.fillText(state === 'gameover' ? 'GAME OVER' : 'STAGE CLEAR', this.width / 2, panelY + 55);
    ctx.shadowBlur = 0;

    const ratingColors: Record<string, string> = { S: '#ffeb3b', A: '#00e5ff', B: '#00ff88', C: '#ffa726', D: '#ff3d77' };
    ctx.fillStyle = ratingColors[rating];
    ctx.shadowColor = ratingColors[rating];
    ctx.shadowBlur = 30;
    ctx.font = 'bold 120px Segoe UI';
    ctx.fillText(rating, this.width / 2, panelY + 170);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Segoe UI';
    ctx.fillText(stats.score.toString().padStart(7, '0'), this.width / 2, panelY + 220);

    const statsList = [
      { label: '准确率', value: stats.accuracy.toFixed(2) + '%' },
      { label: '最高连击', value: stats.maxCombo.toString() },
      { label: 'Perfect', value: stats.perfectCount.toString(), color: '#00e5ff' },
      { label: 'Good', value: stats.goodCount.toString(), color: '#00ff88' },
      { label: 'Normal', value: stats.normalCount.toString(), color: '#ffeb3b' },
      { label: 'Miss', value: stats.missCount.toString(), color: '#ff3d77' },
      { label: '技能释放', value: stats.skillUsedCount.toString() }
    ];

    ctx.font = '15px Segoe UI';
    const startStatY = panelY + 260;
    const statH = 28;
    for (let i = 0; i < statsList.length; i++) {
      const s = statsList[i];
      const y = startStatY + i * statH;
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(s.label, this.width / 2 - 30, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = (s as { color?: string }).color || '#ffffff';
      ctx.fillText(s.value, this.width / 2 + 30, y);
    }

    const btnW = panelW * 0.38;
    const btnH = 56;
    const btnY = panelY + panelH - btnH - 30;
    const gap = 24;
    const totalW = btnW * 2 + gap;
    const btnStartX = (this.width - totalW) / 2;

    this.drawButton(ctx, btnStartX, btnY, btnW, btnH, '重 试', '#00e5ff');
    this.drawButton(ctx, btnStartX + btnW + gap, btnY, btnW, btnH, '返 回', '#ff3d77');
    this.uiElements.push({ id: 'retry', x: btnStartX, y: btnY, w: btnW, h: btnH });
    this.uiElements.push({ id: 'back', x: btnStartX + btnW + gap, y: btnY, w: btnW, h: btnH });

    ctx.restore();
  }

  private drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, color: string): void {
    ctx.fillStyle = color + '22';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;

    ctx.fillStyle = color;
    ctx.font = 'bold 20px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);
  }

  private darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const dr = Math.floor(r * factor);
    const dg = Math.floor(g * factor);
    const db = Math.floor(b * factor);
    return '#' + [dr, dg, db].map(v => v.toString(16).padStart(2, '0')).join('');
  }
}
