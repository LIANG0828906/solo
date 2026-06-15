import { HexGrid, HexCell } from './hexGrid';
import { Unit, StrategyType } from './unit';
import { BattleSystem, DamageNumber, MoraleEffect, StrategyIcon } from './battleSystem';

const COLORS = {
  background: '#2D1B0E',
  gridBackground: '#4A3B32',
  gridLine: '#5C4A3E',
  gridLineWidth: 1.5,
  unitBorder: '#D0D0D0',
  hpBarBg: '#333333',
  hpBarAlly: '#4CAF50',
  hpBarEnemy: '#E53935',
  damageText: '#FFFFFF',
  healText: '#4CAF50',
  selectedGlow: '#DAA520',
  previewGlow: '#C8A96E',
  human: '#6B8E5A',
  elf: '#5A8A5A',
  orc: '#8B5A3A'
};

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hexGrid: HexGrid;
  private battleSystem: BattleSystem;
  
  private frameTime: number = 0;
  private lowDetailMode: boolean = false;
  private selectedUnit: Unit | null = null;
  private previewUnit: { race: string; x: number; y: number } | null = null;
  private hoveredHex: HexCell | null = null;
  
  private strategyIconColors: Map<StrategyType, string> = new Map([
    ['attack_low_hp', '#FF6B6B'],
    ['attack_closest', '#FF8C00'],
    ['attack_ranged', '#87CEEB'],
    ['defend_ally', '#9370DB'],
    ['capture_point', '#FFD700'],
    ['heal_ally', '#32CD32'],
    ['none', '#666666']
  ]);

  constructor(canvas: HTMLCanvasElement, hexGrid: HexGrid, battleSystem: BattleSystem) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.hexGrid = hexGrid;
    this.battleSystem = battleSystem;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  public resize(): void {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
    } else {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
    
    this.centerGrid();
  }

  private centerGrid(): void {
    const hexSize = this.hexGrid.getHexSize();
    const cols = this.hexGrid.getCols();
    const rows = this.hexGrid.getRows();
    
    const gridWidth = hexSize * Math.sqrt(3) * (cols + 0.5);
    const gridHeight = hexSize * 1.5 * rows + hexSize * 0.5;
    
    const offsetX = (this.canvas.width - gridWidth) / 2 + hexSize * Math.sqrt(3) / 2;
    const offsetY = (this.canvas.height - gridHeight) / 2 + hexSize;
    
    this.hexGrid.setOffset(offsetX, offsetY);
  }

  public setFrameTime(ms: number): void {
    this.frameTime = ms;
    this.lowDetailMode = ms > 16;
  }

  public setSelectedUnit(unit: Unit | null): void {
    this.selectedUnit = unit;
  }

  public setPreviewUnit(preview: { race: string; x: number; y: number } | null): void {
    this.previewUnit = preview;
  }

  public setHoveredHex(hex: HexCell | null): void {
    this.hoveredHex = hex;
  }

  public render(): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawGrid();
    this.drawHoveredHex();
    this.drawUnits();
    this.drawPreviewUnit();
    this.drawDamageNumbers();
    this.drawMoraleEffects();
    this.drawStrategyIcons();
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const cells = this.hexGrid.getCells();
    
    for (const cell of cells) {
      this.drawHexCell(cell);
    }
  }

  private drawHexCell(cell: HexCell): void {
    const ctx = this.ctx;
    const corners = this.hexGrid.getHexCorners(cell.col, cell.row);
    
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    
    ctx.fillStyle = COLORS.gridBackground;
    ctx.fill();
    
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = COLORS.gridLineWidth;
    ctx.stroke();
  }

  private drawHoveredHex(): void {
    if (!this.hoveredHex) return;
    
    const ctx = this.ctx;
    const corners = this.hexGrid.getHexCorners(this.hoveredHex.col, this.hoveredHex.row);
    
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    
    ctx.fillStyle = 'rgba(218, 165, 32, 0.2)';
    ctx.fill();
    
    ctx.strokeStyle = COLORS.selectedGlow;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawUnits(): void {
    const units = this.battleSystem.getUnits();
    const currentUnit = this.battleSystem.getCurrentActionUnit();
    
    for (const unit of units) {
      if (!unit.getIsAlive()) continue;
      
      const x = unit.getPixelX();
      const y = unit.getPixelY();
      
      const isSelected = this.selectedUnit?.getId() === unit.getId();
      const isCurrent = currentUnit?.getId() === unit.getId();
      
      const showDetail = !this.lowDetailMode || isSelected || isCurrent || 
        this.isNearCamera(x, y, 60);
      
      this.drawUnit(unit, x, y, isSelected, isCurrent, showDetail);
    }
  }

  private isNearCamera(x: number, y: number, distance: number): boolean {
    return true;
  }

  private drawUnit(
    unit: Unit,
    x: number,
    y: number,
    isSelected: boolean,
    isCurrent: boolean,
    showDetail: boolean
  ): void {
    const ctx = this.ctx;
    const radius = 15;
    
    if (isSelected || isCurrent) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = isCurrent ? 'rgba(255, 215, 0, 0.6)' : 'rgba(218, 165, 32, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    const attackFlash = unit.getAttackFlashTimer();
    let fillColor = unit.getRaceColor();
    
    if (attackFlash > 0) {
      const flashIntensity = attackFlash / 0.2;
      fillColor = this.lerpColor('#FF4444', unit.getRaceColor(), 1 - flashIntensity);
    }
    
    if (unit.getMoraleActive()) {
      const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
      fillColor = this.lerpColor(fillColor, '#FFD700', pulse * 0.5);
    }
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    ctx.strokeStyle = COLORS.unitBorder;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (unit.getTeam() === 'enemy') {
      ctx.beginPath();
      ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    if (showDetail) {
      this.drawHpBar(x, y - radius - 8, unit);
    }
  }

  private drawHpBar(x: number, y: number, unit: Unit): void {
    const ctx = this.ctx;
    const width = 24;
    const height = 4;
    
    ctx.fillStyle = COLORS.hpBarBg;
    ctx.fillRect(x - width / 2, y, width, height);
    
    const hpRatio = unit.getCurrentHp() / unit.getMaxHp();
    const barColor = unit.getTeam() === 'ally' ? COLORS.hpBarAlly : COLORS.hpBarEnemy;
    
    ctx.fillStyle = barColor;
    ctx.fillRect(x - width / 2, y, width * hpRatio, height);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - width / 2, y, width, height);
  }

  private drawPreviewUnit(): void {
    if (!this.previewUnit) return;
    
    const ctx = this.ctx;
    const { race, x, y } = this.previewUnit;
    const radius = 15;
    
    let color = COLORS.human;
    if (race === 'elf') color = COLORS.elf;
    if (race === 'orc') color = COLORS.orc;
    
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 169, 110, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.strokeStyle = COLORS.unitBorder;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawDamageNumbers(): void {
    const damageNumbers = this.battleSystem.getDamageNumbers();
    const ctx = this.ctx;
    
    ctx.font = 'bold 16px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (const d of damageNumbers) {
      const alpha = d.timer / d.maxTimer;
      const yOffset = (1 - alpha) * -40;
      
      ctx.fillStyle = d.isHeal ? COLORS.healText : COLORS.damageText;
      ctx.globalAlpha = alpha;
      ctx.fillText(d.isHeal ? `+${d.damage}` : `-${d.damage}`, d.x, d.y + yOffset);
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeText(d.isHeal ? `+${d.damage}` : `-${d.damage}`, d.x, d.y + yOffset);
      
      ctx.globalAlpha = 1;
    }
    
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  private drawMoraleEffects(): void {
    const effects = this.battleSystem.getMoraleEffects();
    const ctx = this.ctx;
    
    for (const e of effects) {
      const progress = 1 - e.timer / e.maxTimer;
      const radius = e.startRadius + (e.endRadius - e.startRadius) * progress;
      const alpha = 1 - progress;
      
      const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, radius);
      gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha * 0.6})`);
      gradient.addColorStop(0.5, `rgba(255, 140, 0, ${alpha * 0.4})`);
      gradient.addColorStop(1, `rgba(255, 140, 0, 0)`);
      
      ctx.beginPath();
      ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawStrategyIcons(): void {
    const icons = this.battleSystem.getStrategyIcons();
    const ctx = this.ctx;
    
    for (const icon of icons) {
      const alpha = icon.timer / icon.maxTimer;
      const pulse = Math.sin(icon.timer * 20) * 0.3 + 0.7;
      
      const size = 24;
      const x = icon.x - size / 2;
      const y = icon.y - size / 2;
      
      const color = this.strategyIconColors.get(icon.strategy) || '#666666';
      
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * pulse;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, 4);
      ctx.fill();
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const iconChar = this.getStrategyIconChar(icon.strategy);
      ctx.fillText(iconChar, icon.x, icon.y);
      
      ctx.globalAlpha = 1;
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  }

  private getStrategyIconChar(strategy: StrategyType): string {
    switch (strategy) {
      case 'attack_low_hp': return '⚔';
      case 'attack_closest': return '→';
      case 'attack_ranged': return '🏹';
      case 'defend_ally': return '🛡';
      case 'capture_point': return '⚑';
      case 'heal_ally': return '✚';
      default: return '?';
    }
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    
    if (!c1 || !c2) return color1;
    
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getLowDetailMode(): boolean {
    return this.lowDetailMode;
  }
}
