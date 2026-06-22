import { ColonyManager } from '../core/colony_manager';
import { DecisionEngine, CommandCooldown } from '../core/decision_engine';
import { GameStats, CommandType } from '../types';

interface CommandButton {
  type: CommandType;
  label: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class UIPanelRenderer {
  private ctx: CanvasRenderingContext2D;
  private panelWidth: number = 280;
  private panelHeight: number = 0;
  private commandBarHeight: number = 120;
  private animationTime: number = 0;
  private hoveredButton: CommandType | null = null;

  private commandButtons: CommandButton[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.initCommandButtons();
  }

  private initCommandButtons(): void {
    const btnDefs: Array<{ type: CommandType; label: string; icon: string }> = [
      { type: 'spawn_worker', label: '生成工蚁', icon: '🐜' },
      { type: 'spawn_soldier', label: '生成兵蚁', icon: '⚔' },
      { type: 'recall', label: '召回', icon: '⟲' },
      { type: 'attack_area', label: '警戒区域', icon: '⚠' },
      { type: 'gather_priority', label: '优先采集', icon: '✦' },
      { type: 'move_to', label: '移动', icon: '→' },
    ];

    const btnWidth = 85;
    const btnHeight = 65;
    const spacing = 12;
    const startX = 30;
    const startY = 25;

    btnDefs.forEach((def, i) => {
      this.commandButtons.push({
        ...def,
        x: startX + i * (btnWidth + spacing),
        y: startY,
        width: btnWidth,
        height: btnHeight,
      });
    });
  }

  setHoveredButton(type: CommandType | null): void {
    this.hoveredButton = type;
  }

  getCommandButtonAt(x: number, y: number, canvasHeight: number): CommandType | null {
    const barY = canvasHeight - this.commandBarHeight;
    const localY = y - barY;

    for (const btn of this.commandButtons) {
      if (
        x >= btn.x && x <= btn.x + btn.width &&
        localY >= btn.y && localY <= btn.y + btn.height
      ) {
        return btn.type;
      }
    }
    return null;
  }

  render(
    deltaTime: number,
    canvas: HTMLCanvasElement,
    colony: ColonyManager,
    decisionEngine: DecisionEngine
  ): void {
    this.animationTime += deltaTime;
    this.panelHeight = canvas.height - this.commandBarHeight;

    this.renderInfoPanel(canvas, colony);
    this.renderCommandBar(canvas, decisionEngine);
  }

  private renderInfoPanel(canvas: HTMLCanvasElement, colony: ColonyManager): void {
    const ctx = this.ctx;
    const w = this.panelWidth;
    const h = this.panelHeight;

    ctx.save();
    ctx.fillStyle = 'rgba(27, 40, 56, 0.85)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(118, 185, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    ctx.fillStyle = '#76B900';
    ctx.font = 'bold 18px "Consolas", "Monaco", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('◆ 蚁群状态面板', 18, 20);

    ctx.strokeStyle = 'rgba(118, 185, 0, 0.4)';
    ctx.beginPath();
    ctx.moveTo(18, 48);
    ctx.lineTo(w - 18, 48);
    ctx.stroke();

    const stats: GameStats = {
      totalAnts: colony.getTotalAntCount(),
      workerCount: colony.getWorkerCount(),
      soldierCount: colony.getSoldierCount(),
      foodReserve: Math.floor(colony.globalFood),
      totalNestLevel: colony.getTotalNestLevel(),
      foodGatherRate: colony.foodGatherRate,
      efficiencyIndex: colony.getEfficiencyIndex(),
      fps: 0,
    };

    this.renderStatRow('总蚂蚁数量', stats.totalAnts.toString(), 65, '#00FF7F');
    this.renderStatRow('  工蚁', stats.workerCount.toString(), 95, '#76B900', 14);
    this.renderStatRow('  兵蚁', stats.soldierCount.toString(), 118, '#FF4500', 14);

    const foodPulse = Math.sin(this.animationTime * 2) * 0.1 + 0.9;
    ctx.save();
    ctx.globalAlpha = foodPulse;
    this.renderStatRow('食物储备', `${stats.foodReserve}`, 150, '#FFD700');
    ctx.restore();

    this.renderProgressBar(
      18, 182, w - 36, 8,
      Math.min(1, colony.globalFood / 500),
      '#FFD700',
      'rgba(255, 215, 0, 0.2)'
    );
    ctx.fillStyle = 'rgba(118, 185, 0, 0.6)';
    ctx.font = '11px "Consolas", monospace';
    ctx.fillText(`采集速率: ${stats.foodGatherRate.toFixed(1)}/s`, 18, 198);

    this.renderStatRow('巢穴总等级', stats.totalNestLevel.toString(), 225, '#8B7355');

    const effColor = stats.efficiencyIndex >= 0.5 ? '#76B900' : stats.efficiencyIndex >= 0.2 ? '#FFA500' : '#FF4500';
    this.renderStatRow(
      '群体效率指数',
      stats.efficiencyIndex.toFixed(2),
      260,
      effColor
    );

    this.renderProgressBar(
      18, 292, w - 36, 8,
      Math.min(1, stats.efficiencyIndex),
      effColor,
      'rgba(118, 185, 0, 0.15)'
    );

    ctx.fillStyle = 'rgba(118, 185, 0, 0.4)';
    ctx.font = '11px "Consolas", monospace';
    ctx.fillText('效率 = 采集速率 / 蚂蚁数 × 10', 18, 308);

    const infoStartY = 340;
    ctx.fillStyle = 'rgba(118, 185, 0, 0.8)';
    ctx.font = 'bold 13px "Consolas", monospace';
    ctx.fillText('◆ 操作说明', 18, infoStartY);

    ctx.fillStyle = 'rgba(118, 185, 0, 0.5)';
    ctx.font = '11px "Consolas", monospace';
    const tips = [
      '鼠标滚轮: 缩放地图',
      '鼠标左键拖拽: 平移地图',
      '鼠标左键点击: 选择单位',
      '鼠标右键拖拽: 框选多个单位',
      '底部按钮: 发布指令',
      'Alt+左键点击: 设置警戒区域',
    ];
    tips.forEach((tip, i) => {
      ctx.fillText(`• ${tip}`, 18, infoStartY + 25 + i * 18);
    });

    ctx.restore();
  }

  private renderStatRow(
    label: string,
    value: string,
    y: number,
    valueColor: string,
    fontSize: number = 15
  ): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(118, 185, 0, 0.7)';
    ctx.font = `${fontSize}px "Consolas", monospace`;
    ctx.fillText(label, 18, y);

    ctx.fillStyle = valueColor;
    ctx.font = `bold ${fontSize + 2}px "Consolas", monospace`;
    ctx.textAlign = 'right';
    ctx.fillText(value, this.panelWidth - 20, y);
    ctx.textAlign = 'left';
  }

  private renderProgressBar(
    x: number, y: number, w: number, h: number,
    progress: number,
    fillColor: string,
    bgColor: string
  ): void {
    const ctx = this.ctx;
    ctx.fillStyle = bgColor;
    ctx.fillRect(x, y, w, h);

    const gradient = ctx.createLinearGradient(x, y, x + w, y);
    gradient.addColorStop(0, fillColor);
    gradient.addColorStop(1, this.adjustColor(fillColor, -30));
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w * progress, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  private adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  private renderCommandBar(canvas: HTMLCanvasElement, decisionEngine: DecisionEngine): void {
    const ctx = this.ctx;
    const w = canvas.width;
    const h = this.commandBarHeight;
    const y = canvas.height - h;

    ctx.save();
    ctx.fillStyle = '#0F1923';
    ctx.fillRect(0, y, w, h);

    const gradient = ctx.createLinearGradient(0, y, w, y);
    gradient.addColorStop(0, 'rgba(118, 185, 0, 0.6)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 127, 0.8)');
    gradient.addColorStop(1, 'rgba(118, 185, 0, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y, w, 3);

    ctx.strokeStyle = 'rgba(118, 185, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + 3.5);
    ctx.lineTo(w, y + 3.5);
    ctx.stroke();

    ctx.fillStyle = 'rgba(118, 185, 0, 0.6)';
    ctx.font = '12px "Consolas", monospace';
    ctx.fillText('指令面板', 15, y + 12);

    const selectedAnts = decisionEngine.getSelectedAntIds().size;
    const selectedNests = decisionEngine.getSelectedNestIds().size;
    if (selectedAnts > 0 || selectedNests > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText(
        `已选中: ${selectedAnts > 0 ? selectedAnts + ' 蚂蚁' : ''}${selectedAnts > 0 && selectedNests > 0 ? ', ' : ''}${selectedNests > 0 ? selectedNests + ' 巢穴' : ''}`,
        100, y + 12
      );
    }

    this.commandButtons.forEach((btn) => {
      const cooldown = decisionEngine.getCooldown(btn.type);
      this.renderCommandButton(btn, y, cooldown);
    });

    ctx.restore();
  }

  private renderCommandButton(
    btn: CommandButton,
    barY: number,
    cooldown: CommandCooldown | undefined
  ): void {
    const ctx = this.ctx;
    const x = btn.x;
    const y = barY + btn.y;
    const w = btn.width;
    const h = btn.height;
    const isHovered = this.hoveredButton === btn.type;
    const onCooldown = cooldown && cooldown.remaining > 0;
    const progress = cooldown ? 1 - cooldown.remaining / cooldown.total : 1;

    ctx.save();

    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    if (onCooldown) {
      gradient.addColorStop(0, 'rgba(60, 60, 60, 0.8)');
      gradient.addColorStop(1, 'rgba(40, 40, 40, 0.8)');
    } else if (isHovered) {
      gradient.addColorStop(0, 'rgba(118, 185, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(60, 100, 30, 0.6)');
    } else {
      gradient.addColorStop(0, 'rgba(50, 80, 50, 0.6)');
      gradient.addColorStop(1, 'rgba(30, 50, 30, 0.7)');
    }

    ctx.fillStyle = gradient;
    this.roundRect(x, y, w, h, 6);
    ctx.fill();

    ctx.strokeStyle = isHovered && !onCooldown ? '#76B900' : 'rgba(118, 185, 0, 0.3)';
    ctx.lineWidth = isHovered && !onCooldown ? 2 : 1;
    this.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 6);
    ctx.stroke();

    const cooldownBarHeight = 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x + 4, y + h - cooldownBarHeight - 4, w - 8, cooldownBarHeight);

    if (onCooldown) {
      ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
    } else {
      const barGradient = ctx.createLinearGradient(x, y, x, y + h);
      barGradient.addColorStop(0, '#76B900');
      barGradient.addColorStop(1, '#00FF7F');
      ctx.fillStyle = barGradient;
    }
    ctx.fillRect(x + 4, y + h - cooldownBarHeight - 4, (w - 8) * progress, cooldownBarHeight);

    ctx.fillStyle = onCooldown ? 'rgba(150, 150, 150, 0.8)' : (isHovered ? '#00FF7F' : '#76B900');
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.icon, x + w / 2, y + h / 2 - 8);

    ctx.fillStyle = onCooldown ? 'rgba(180, 180, 180, 0.6)' : '#FFFFFF';
    ctx.font = '11px "Consolas", monospace';
    ctx.fillText(btn.label, x + w / 2, y + h - cooldownBarHeight - 12);

    if (onCooldown && cooldown) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 14px "Consolas", monospace';
      ctx.fillText(cooldown.remaining.toFixed(1) + 's', x + w / 2, y + h / 2 - 5);
    }

    ctx.restore();
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
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
}
