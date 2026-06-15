import Phaser from 'phaser';
import { AssemblyLogic } from '../logic/Assembly';
import { MechRenderer } from '../render/MechRenderer';
import { PARTS, STAT_MAX } from '../data/parts';
import { PartType, Part, AssembledMech, BattleResult, BattleHistoryCard, BattleLogEntry } from '../types';

const PART_TYPE_LABELS: Record<PartType, string> = {
  head: '头部',
  torso: '躯干',
  arms: '手臂',
  legs: '腿部'
};

const STAT_CONFIG = [
  { key: 'attack', label: '攻击力', color: 0xe15d44 },
  { key: 'defense', label: '防御力', color: 0x5b8def },
  { key: 'speed', label: '速度', color: 0x88b04b },
  { key: 'energy', label: '能量', color: 0xf7b500 }
] as const;

export class AssemblyScene extends Phaser.Scene {
  private assemblyLogic!: AssemblyLogic;
  private mechRenderer!: MechRenderer;
  private uiContainer!: Phaser.GameObjects.Container;
  private statBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private statTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private gaugeNeedle!: Phaser.GameObjects.Graphics;
  private gaugeText!: Phaser.GameObjects.Text;
  private partCards: Map<string, { bg: Phaser.GameObjects.Graphics; border: Phaser.GameObjects.Graphics }> = new Map();
  private historyContainer!: Phaser.GameObjects.Container;
  private historyScrollY = 0;
  private onStartBattle!: (mech: AssembledMech) => void;
  private logModal!: Phaser.GameObjects.Container;

  constructor() {
    super('AssemblyScene');
  }

  init(data: any) {
    this.onStartBattle = data.onStartBattle || (() => {});
  }

  create() {
    this.assemblyLogic = new AssemblyLogic();
    this.drawBackground();
    this.createUILayout();
    this.renderMechPreview();
    this.renderPartSelector();
    this.renderStatsPanel();
    this.renderHistoryPanel();
    this.renderBattleButton();
    this.updateAllUI();

    const data = this.scene.settings.data as any;
    if (data && data.lastResult) {
      this.time.delayedCall(300, () => {
        this.renderHistoryPanel();
      });
    }
  }

  private drawBackground() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1d24, 1);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(1, 0x2a2d35, 0.6);
    const gridSize = 40;
    for (let x = 0; x <= width; x += gridSize) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      bg.lineBetween(0, y, width, y);
    }

    const glow = this.add.graphics();
    glow.fillGradientStyle(0x2a3a5a, 0x1a1d24, 0x2a3a5a, 0x1a1d24, 0.3, 0.05, 0.3, 0.05);
    glow.fillEllipse(width * 0.5, height * 0.35, 600, 500);
  }

  private createUILayout() {
    this.uiContainer = this.add.container(0, 0);
  }

  private renderMechPreview() {
    const { width, height } = this.scale;
    const isNarrow = width < 1024;
    const previewX = isNarrow ? width * 0.5 : width * 0.5;
    const previewY = isNarrow ? height * 0.32 : height * 0.4;
    const scale = isNarrow ? 0.9 : 1.3;

    const backGlow = this.add.graphics();
    backGlow.fillGradientStyle(0x3a4a6a, 0x1a1d24, 0x3a4a6a, 0x1a1d24, 0.4, 0.05, 0.4, 0.05);
    backGlow.fillEllipse(previewX, previewY + 60, 500, 400);

    this.mechRenderer = new MechRenderer(this, previewX, previewY, scale);
    this.mechRenderer.renderMech(this.assemblyLogic.getAssembledMech());

    const scanGraphics = this.add.graphics();
    this.time.addEvent({
      delay: 60,
      loop: true,
      callback: () => {
        scanGraphics.clear();
        const t = (this.time.now / 40) % 200;
        scanGraphics.lineStyle(2, 0xff8c42, 0.15);
        const sx = previewX - 150;
        const sy = previewY - 180 + t;
        scanGraphics.lineBetween(sx, sy, sx + 300, sy);
      }
    });

    const title = this.add.text(previewX, (isNarrow ? 10 : 20), '战甲组装模拟器', {
      fontFamily: 'Arial',
      fontSize: isNarrow ? '18px' : '26px',
      color: '#cfd6e4',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    title.setShadow(0, 2, '#000000', 4, true, true);
  }

  private renderPartSelector() {
    const { width, height } = this.scale;
    const isNarrow = width < 1024;
    const panelWidth = isNarrow ? Math.min(width - 40, 500) : 280;
    const panelX = isNarrow ? 20 : 20;
    const panelY = isNarrow ? height * 0.5 : 60;
    const panelHeight = isNarrow ? height * 0.22 : height - 240;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2a2d35, 0.55);
    panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 14);
    panelBg.lineStyle(1, 0xff8c42, 0.35);
    panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 14);

    const blurRect = this.add.graphics();
    blurRect.fillStyle(0x3a3d45, 0.25);
    blurRect.fillRoundedRect(panelX + 6, panelY + 6, panelWidth - 12, panelHeight - 12, 10);

    const titleY = panelY + 16;
    this.add.text(panelX + panelWidth / 2, titleY, '零件选配', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ff8c42',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const partTypes: PartType[] = ['head', 'torso', 'arms', 'legs'];
    let yOffset = panelY + 50;
    const sectionH = (panelHeight - 70) / 4;

    for (const type of partTypes) {
      const sectionY = yOffset;
      const label = this.add.text(panelX + 16, sectionY, PART_TYPE_LABELS[type], {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: '#9fb0c8'
      });

      const parts = PARTS[type];
      const cardW = (panelWidth - 44) / 3;
      const cardY = sectionY + 22;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const cardX = panelX + 16 + i * (cardW + 6);
        this.createPartCard(cardX, cardY, cardW, sectionH - 32, part);
      }
      yOffset += sectionH;
    }
  }

  private createPartCard(x: number, y: number, w: number, h: number, part: Part) {
    const isSelected = this.assemblyLogic.getSelectedPart(part.type)?.id === part.id;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1d24, 0.85);
    bg.fillRoundedRect(x, y, w, h, 8);
    this.partCards.set(part.id + '_bg', { bg, border: null as any });

    const border = this.add.graphics();
    const borderColor = isSelected ? 0xff8c42 : 0x4a4d55;
    const borderAlpha = isSelected ? 0.9 : 0.5;
    border.lineStyle(isSelected ? 2 : 1, borderColor, borderAlpha);
    border.strokeRoundedRect(x, y, w, h, 8);
    this.partCards.set(part.id, { bg, border });

    if (isSelected) {
      bg.setY(y - 2);
      border.setY(y - 2);
    }

    const iconG = this.add.graphics();
    iconG.fillStyle(part.color, 0.9);
    iconG.fillCircle(x + w / 2, y + h * 0.32, Math.min(w, h) * 0.2);
    iconG.lineStyle(1, 0xff8c42, 0.7);
    iconG.strokeCircle(x + w / 2, y + h * 0.32, Math.min(w, h) * 0.2);

    const nameText = this.add.text(x + w / 2, y + h * 0.6, part.name, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#cfd6e4',
      align: 'center',
      wordWrap: { width: w - 8 }
    }).setOrigin(0.5);

    const statSum = part.stats.attack + part.stats.defense + part.stats.speed + part.stats.energy;
    const statColor = statSum >= 20 ? '#88b04b' : statSum >= 10 ? '#f7b500' : '#e15d44';
    this.add.text(x + w / 2, y + h * 0.82, `Σ${statSum > 0 ? '+' : ''}${statSum}`, {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: statColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const hitArea = this.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: [bg, border], scaleX: 1.05, scaleY: 1.05, x: x + w / 2, y: y + h / 2, duration: 120 });
    });
    hitArea.on('pointerout', () => {
      const sel = this.assemblyLogic.getSelectedPart(part.type)?.id === part.id;
      this.tweens.add({
        targets: [bg, border],
        scaleX: 1,
        scaleY: 1,
        y: sel ? y - 2 : y,
        duration: 120
      });
    });
    hitArea.on('pointerdown', () => {
      bg.y = y + 1;
      border.y = y + 1;
    });
    hitArea.on('pointerup', () => {
      this.selectPart(part);
    });
  }

  private selectPart(part: Part) {
    const oldPart = this.assemblyLogic.getSelectedPart(part.type);
    if (oldPart?.id === part.id) return;

    this.assemblyLogic.selectPart(part.type, part.id);

    const partTypes: PartType[] = ['head', 'torso', 'arms', 'legs'];
    const { width, height } = this.scale;
    const isNarrow = width < 1024;
    const panelWidth = isNarrow ? Math.min(width - 40, 500) : 280;
    const panelX = 20;
    const panelY = isNarrow ? height * 0.5 : 60;
    const panelHeight = isNarrow ? height * 0.22 : height - 240;
    let yOffset = panelY + 50;
    const sectionH = (panelHeight - 70) / 4;

    for (const t of partTypes) {
      const sectionY = yOffset;
      const parts = PARTS[t];
      const cardW = (panelWidth - 44) / 3;
      const cardY = sectionY + 22;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const cx = panelX + 16 + i * (cardW + 6);
        const sel = this.assemblyLogic.getSelectedPart(t)?.id === p.id;
        const card = this.partCards.get(p.id);
        if (card) {
          card.border.clear();
          card.border.lineStyle(sel ? 2 : 1, sel ? 0xff8c42 : 0x4a4d55, sel ? 0.9 : 0.5);
          card.border.strokeRoundedRect(cx, cardY, cardW, sectionH - 32, 8);
          card.bg.y = sel ? cardY - 2 : cardY;
          card.border.y = sel ? cardY - 2 : cardY;
        }
      }
      yOffset += sectionH;
    }

    this.mechRenderer.animatePartChange(part.type, () => {
      this.mechRenderer.renderMech(this.assemblyLogic.getAssembledMech());
    });

    this.updateAllUI();
  }

  private renderStatsPanel() {
    const { width, height } = this.scale;
    const isNarrow = width < 1024;
    const panelWidth = isNarrow ? Math.min(width - 40, 500) : 280;
    const panelX = isNarrow ? width - panelWidth - 20 : width - panelWidth - 20;
    const panelY = isNarrow ? height * 0.72 : 60;
    const panelHeight = isNarrow ? height * 0.22 : height - 240;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x2a2d35, 0.55);
    panelBg.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 14);
    panelBg.lineStyle(1, 0xff8c42, 0.35);
    panelBg.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 14);

    const blurRect = this.add.graphics();
    blurRect.fillStyle(0x3a3d45, 0.25);
    blurRect.fillRoundedRect(panelX + 6, panelY + 6, panelWidth - 12, panelHeight - 12, 10);

    this.add.text(panelX + panelWidth / 2, panelY + 16, '属性综合', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ff8c42',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const gaugeCX = panelX + panelWidth / 2;
    const gaugeCY = panelY + 75;
    const gaugeR = Math.min(panelWidth, panelHeight) * 0.15;

    const gaugeBg = this.add.graphics();
    gaugeBg.lineStyle(14, 0x3a3d45, 0.8);
    gaugeBg.beginPath();
    gaugeBg.arc(gaugeCX, gaugeCY, gaugeR, Phaser.Math.DegToRad(150), Phaser.Math.DegToRad(390), false);
    gaugeBg.strokePath();

    for (let i = 0; i <= 10; i++) {
      const angle = Phaser.Math.DegToRad(150 + (i * 240) / 10);
      const x1 = gaugeCX + Math.cos(angle) * (gaugeR - 4);
      const y1 = gaugeCY + Math.sin(angle) * (gaugeR - 4);
      const x2 = gaugeCX + Math.cos(angle) * (gaugeR + 4);
      const y2 = gaugeCY + Math.sin(angle) * (gaugeR + 4);
      gaugeBg.lineStyle(2, i <= 3 ? 0xe15d44 : i <= 7 ? 0xf7b500 : 0x88b04b, 0.8);
      gaugeBg.lineBetween(x1, y1, x2, y2);
    }

    this.gaugeNeedle = this.add.graphics();
    this.gaugeText = this.add.text(gaugeCX, gaugeCY + gaugeR + 18, '0', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ff8c42',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(gaugeCX, gaugeCY + gaugeR + 38, '战力评分', {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#9fb0c8'
    }).setOrigin(0.5);

    const statsY = panelY + (isNarrow ? 165 : 200);
    const statH = (panelHeight - (isNarrow ? 180 : 220)) / 4;
    for (let i = 0; i < STAT_CONFIG.length; i++) {
      const cfg = STAT_CONFIG[i];
      const sy = statsY + i * statH;
      this.createStatRow(panelX + 16, sy, panelWidth - 32, statH - 6, cfg.key, cfg.label, cfg.color);
    }
  }

  private createStatRow(x: number, y: number, w: number, h: number, key: string, label: string, color: number) {
    const iconG = this.add.graphics();
    iconG.fillStyle(color, 0.9);
    iconG.fillCircle(x + 14, y + h / 2, 11);
    iconG.lineStyle(1, 0xff8c42, 0.6);
    iconG.strokeCircle(x + 14, y + h / 2, 11);
    iconG.fillStyle(0x1a1d24, 1);
    iconG.fillCircle(x + 14, y + h / 2, 6);
    iconG.fillStyle(color, 1);
    iconG.fillCircle(x + 14, y + h / 2, 3);

    this.add.text(x + 34, y + 4, label, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#9fb0c8'
    });

    const valText = this.add.text(x + w - 8, y + 4, '0', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.statTexts.set(key, valText);

    const barX = x + 34;
    const barY = y + h - 10;
    const barW = w - 42;
    const barH = 6;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x1a1d24, 0.9);
    barBg.fillRoundedRect(barX, barY, barW, barH, 3);
    barBg.lineStyle(1, 0x4a4d55, 0.6);
    barBg.strokeRoundedRect(barX, barY, barW, barH, 3);

    const barFg = this.add.graphics();
    this.statBars.set(key, barFg);
  }

  private updateAllUI() {
    const mech = this.assemblyLogic.getAssembledMech();
    const stats = mech.totalStats;

    for (const cfg of STAT_CONFIG) {
      const key = cfg.key;
      const val = (stats as any)[key] as number;
      const text = this.statTexts.get(key);
      if (text) {
        const displayVal = val;
        const sign = displayVal >= 0 ? '+' : '';
        text.setText(`${sign}${displayVal}`);
        text.setColor(displayVal >= 30 ? '#88b04b' : displayVal >= 10 ? '#f7b500' : displayVal >= 0 ? '#ffffff' : '#e15d44');
      }
      const bar = this.statBars.get(key);
      this.updateStatBar(bar, val, cfg.color);
    }

    this.updateGauge(mech.powerScore);
  }

  private updateStatBar(bar: Phaser.GameObjects.Graphics | undefined, value: number, color: number) {
    if (!bar) return;
    bar.clear();
    const { width, height } = this.scale;
    const isNarrow = width < 1024;
    const panelWidth = isNarrow ? Math.min(width - 40, 500) : 280;
    const panelX = isNarrow ? width - panelWidth - 20 : width - panelWidth - 20;
    const w = panelWidth - 74;

    const max = STAT_MAX.attack;
    const ratio = Math.max(0, Math.min(1, (value + 30) / (max + 30)));
    const fillW = Math.max(2, w * ratio);
    const t = ratio;
    const r = Math.round(Phaser.Math.Linear(225, 136, t));
    const g = Math.round(Phaser.Math.Linear(93, 176, t));
    const b = Math.round(Phaser.Math.Linear(68, 75, t));
    const col = Phaser.Display.Color.GetColor(r, g, b);

    const panelY = isNarrow ? height * 0.72 : 60;
    const panelHeight = isNarrow ? height * 0.22 : height - 240;
    const statsY = panelY + (isNarrow ? 165 : 200);
    const statH = (panelHeight - (isNarrow ? 180 : 220)) / 4;
    const idx = STAT_CONFIG.findIndex(s => s.color === color);
    const barY = statsY + idx * statH + statH - 14;
    const barX = panelX + 50;

    bar.fillStyle(col, 1);
    bar.fillRoundedRect(barX, barY, fillW, 6, 3);
    bar.lineStyle(1, col, 0.5);
    bar.strokeRoundedRect(barX, barY, fillW, 6, 3);
  }

  private updateGauge(score: number) {
    const { width, height } = this.scale;
    const isNarrow = width < 1024;
    const panelWidth = isNarrow ? Math.min(width - 40, 500) : 280;
    const panelX = isNarrow ? width - panelWidth - 20 : width - panelWidth - 20;
    const panelY = isNarrow ? height * 0.72 : 60;
    const panelHeight = isNarrow ? height * 0.22 : height - 240;
    const gaugeCX = panelX + panelWidth / 2;
    const gaugeCY = panelY + 75;
    const gaugeR = Math.min(panelWidth, panelHeight) * 0.15;

    const maxScore = 200;
    const ratio = Math.max(0, Math.min(1, score / maxScore));
    const targetAngle = Phaser.Math.DegToRad(150 + ratio * 240);

    const glow = this.add.graphics();
    glow.lineStyle(3, 0xff8c42, 0.3 + Math.sin(this.time.now / 300) * 0.15);
    glow.beginPath();
    glow.arc(gaugeCX, gaugeCY, gaugeR + 8, Phaser.Math.DegToRad(140), targetAngle, false);
    glow.strokePath();

    this.tweens.addCounter({
      from: parseInt(this.gaugeText.text || '0'),
      to: score,
      duration: 400,
      ease: 'Cubic.Out',
      onUpdate: (tween: Phaser.Tweens.Tween) => {
        this.gaugeText.setText(Math.round(tween.getValue()).toString());
      }
    });

    const drawNeedle = (angle: number) => {
      this.gaugeNeedle.clear();
      this.gaugeNeedle.lineStyle(3, 0xff8c42, 1);
      this.gaugeNeedle.lineBetween(
        gaugeCX,
        gaugeCY,
        gaugeCX + Math.cos(angle) * (gaugeR - 6),
        gaugeCY + Math.sin(angle) * (gaugeR - 6)
      );
      this.gaugeNeedle.fillStyle(0xff8c42, 1);
      this.gaugeNeedle.fillCircle(gaugeCX, gaugeCY, 5);
      this.gaugeNeedle.fillStyle(0x1a1d24, 1);
      this.gaugeNeedle.fillCircle(gaugeCX, gaugeCY, 2);
    };

    const currentAngleData = (this as any)._needleAngle || Phaser.Math.DegToRad(150);
    this.tweens.add({
      targets: { a: currentAngleData },
      a: targetAngle,
      duration: 500,
      ease: 'Cubic.Out',
      onUpdate: (tw) => {
        drawNeedle((tw as any).targets[0].a);
        (this as any)._needleAngle = (tw as any).targets[0].a;
      }
    });
    drawNeedle(targetAngle);
    (this as any)._needleAngle = targetAngle;
  }

  private renderBattleButton() {
    const { width, height } = this.scale;
    const isNarrow = width < 1024;
    const btnW = 200;
    const btnH = 48;
    const btnX = width / 2;
    const btnY = isNarrow ? height * 0.44 : height - 90;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff8c42, 0.95);
    btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
    btnBg.lineStyle(2, 0xffaa66, 0.9);
    btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);

    const btnText = this.add.text(btnX, btnY, '⚔ 开始战斗', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#1a1d24',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const zone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      this.tweens.add({
        targets: [btnBg, btnText],
        scaleX: 1.05,
        scaleY: 1.05,
        x: btnX,
        y: btnY,
        duration: 120
      });
    });
    zone.on('pointerout', () => {
      this.tweens.add({
        targets: [btnBg, btnText],
        scaleX: 1,
        scaleY: 1,
        duration: 120
      });
    });
    zone.on('pointerdown', () => {
      btnBg.y = btnY + 2;
      btnText.y = btnY + 2;
    });
    zone.on('pointerup', () => {
      btnBg.y = btnY;
      btnText.y = btnY;
      const mech = this.assemblyLogic.getAssembledMech();
      this.onStartBattle(mech);
    });
  }

  private renderHistoryPanel() {
    const { width, height } = this.scale;
    const isNarrow = width < 1024;

    if (this.historyContainer) {
      this.historyContainer.destroy();
    }
    this.historyContainer = this.add.container(0, 0);

    const panelX = 20;
    const panelY = height - 60;
    const panelW = width - 40;
    const panelH = 40;

    const maskG = this.add.graphics();
    maskG.fillStyle(0x000000, 1);
    maskG.fillRect(panelX, panelY, panelW, panelH);
    const mask = new Phaser.Display.Masks.GeometryMask(this, maskG);

    const title = this.add.text(panelX + 10, panelY - 18, '战斗历史 (点击卡片查看日志)', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ff8c42'
    });

    const data = this.scene.settings.data as any;
    const history: BattleHistoryCard[] = data?.getHistory ? data.getHistory() : [];

    let offsetX = 10;
    for (let i = 0; i < history.length; i++) {
      const card = history[i];
      const cardW = 180;
      const cardH = 32;
      const cx = panelX + offsetX;
      const cy = panelY + 4;

      const winColor = card.winner === 'player' ? 0x88b04b : card.winner === 'enemy' ? 0xe15d44 : 0xf7b500;
      const bg = this.add.graphics();
      bg.fillStyle(0x2a2d35, 0.95);
      bg.fillRoundedRect(cx, cy, cardW, cardH, 6);
      bg.lineStyle(1, winColor, 0.8);
      bg.strokeRoundedRect(cx, cy, cardW, cardH, 6);

      const resultText = card.winner === 'player' ? '胜利' : card.winner === 'enemy' ? '失败' : '平局';
      this.add.text(cx + 10, cy + 6, resultText, {
        fontFamily: 'Arial',
        fontSize: '13px',
        color: card.winner === 'player' ? '#88b04b' : card.winner === 'enemy' ? '#e15d44' : '#f7b500',
        fontStyle: 'bold'
      });

      this.add.text(cx + 10, cy + 20, `${card.rounds}回合`, {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#9fb0c8'
      });

      const date = new Date(card.timestamp);
      const ts = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      this.add.text(cx + cardW - 10, cy + 6, ts, {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#9fb0c8'
      }).setOrigin(1, 0);

      const parallax = Math.sin((this.time.now / 500) + i) * 1;
      bg.y += parallax;

      this.add.zone(cx + cardW / 2, cy + cardH / 2, cardW, cardH)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.showLogModal(card));

      offsetX += cardW + 10;
    }

    const scrollHint = this.add.graphics();
    scrollHint.lineStyle(2, 0xff8c42, 0.3 + Math.sin(this.time.now / 400) * 0.2);
    scrollHint.beginPath();
    scrollHint.moveTo(panelX + panelW - 20, panelY + panelH / 2 - 6);
    scrollHint.lineTo(panelX + panelW - 10, panelY + panelH / 2);
    scrollHint.lineTo(panelX + panelW - 20, panelY + panelH / 2 + 6);
    scrollHint.strokePath();
  }

  private showLogModal(card: BattleHistoryCard) {
    if (this.logModal) this.logModal.destroy();
    const { width, height } = this.scale;

    const modalBg = this.add.graphics();
    modalBg.fillStyle(0x000000, 0.65);
    modalBg.fillRect(0, 0, width, height);
    modalBg.setInteractive();

    const mw = 500;
    const mh = Math.min(500, height - 80);
    const mx = (width - mw) / 2;
    const my = (height - mh) / 2;

    const modal = this.add.container(mx, my);
    this.logModal = modal;
    modal.setScale(0.7);
    modal.setAlpha(0);

    const panel = this.add.graphics();
    panel.fillStyle(0x1e2230, 0.98);
    panel.fillRoundedRect(0, 0, mw, mh, 14);
    panel.lineStyle(2, 0xff8c42, 0.8);
    panel.strokeRoundedRect(0, 0, mw, mh, 14);
    modal.add(panel);

    const titleText = card.winner === 'player' ? '战斗胜利 🏆' : card.winner === 'enemy' ? '战斗失败 💀' : '战斗平局 ⚖';
    const tColor = card.winner === 'player' ? '#88b04b' : card.winner === 'enemy' ? '#e15d44' : '#f7b500';
    modal.add(this.add.text(mw / 2, 24, titleText, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: tColor,
      fontStyle: 'bold'
    }).setOrigin(0.5));

    modal.add(this.add.text(mw / 2, 54, `共 ${card.rounds} 回合 · ${new Date(card.timestamp).toLocaleString()}`, {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#9fb0c8'
    }).setOrigin(0.5));

    const logArea = this.add.graphics();
    logArea.fillStyle(0x121520, 1);
    logArea.fillRoundedRect(20, 80, mw - 40, mh - 170, 8);
    modal.add(logArea);

    const logText = this.add.text(34, 94, '', {
      fontFamily: 'Consolas, monospace',
      fontSize: '12px',
      color: '#cfd6e4',
      wordWrap: { width: mw - 68 }
    });
    const logLines: string[] = [];
    card.logs.forEach(log => {
      const color = log.attacker === 'player' ? '#88b04b' : '#e15d44';
      logLines.push(`[回合${log.round}] ${log.action}: 造成 <color=${color}>-${log.damage}</color>  | 对方HP: ${log.defenderHp}`);
    });
    logText.setText(logLines.join('\n'));
    modal.add(logText);

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0xff8c42, 0.95);
    closeBtn.fillRoundedRect(mw / 2 - 70, mh - 70, 140, 40, 8);
    closeBtn.lineStyle(2, 0xffaa66, 0.9);
    closeBtn.strokeRoundedRect(mw / 2 - 70, mh - 70, 140, 40, 8);
    modal.add(closeBtn);
    const closeT = this.add.text(mw / 2, mh - 50, '关闭', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#1a1d24',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    modal.add(closeT);

    this.add.zone(mw / 2, mh - 50, 140, 40).setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.tweens.add({
          targets: modal,
          scale: 0.7,
          alpha: 0,
          duration: 200,
          ease: 'Cubic.In',
          onComplete: () => {
            modal.destroy();
            modalBg.destroy();
            this.logModal = undefined as any;
          }
        });
      });
    modal.add(this.add.zone(mw / 2, mh / 2, mw, mh));

    this.tweens.add({
      targets: modal,
      scale: 1,
      alpha: 1,
      duration: 350,
      ease: 'Back.Out'
    });
  }
}
