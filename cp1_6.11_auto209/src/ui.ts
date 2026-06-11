type Side = 'red' | 'blue';
type UnitType = 'infantry' | 'cavalry' | 'archer' | 'scout' | 'heavyInfantry' | 'lightCavalry' | 'crossbowman' | 'spy';

interface Stats {
  ownTroops: number;
  enemyTroops: number;
  ownCasualties: number;
  enemyCasualties: number;
  time: number;
  result?: 'victory' | 'defeat' | null;
}

interface Token {
  id: string;
  name: string;
  count: number;
  color: string;
  side: Side;
  type: UnitType;
  emoji: string;
}

interface Button {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hoverColor: string;
  hovered: boolean;
  onClick: () => void;
}

type OnPlaceUnitCallback = (side: Side, type: UnitType, x: number, y: number) => void;
type OnResetCallback = () => void;
type OnPauseCallback = (paused: boolean) => void;
type OnSpeedChangeCallback = (speed: number) => void;
type OnGeneralRallyCallback = (x: number, y: number) => void;

class UIManager {
  private canvasWidth: number = 1200;
  private canvasHeight: number = 800;
  private isPaused: boolean = false;
  private speed: number = 1;
  private draggingToken: Token | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private mousePos: { x: number; y: number } = { x: 0, y: 0 };
  private bannerTime: number = 0;
  private bannerVisible: boolean = false;
  private bannerResult: 'victory' | 'defeat' | null = null;
  private indicatorVisible: boolean = false;
  private indicatorPos: { x: number; y: number } = { x: 0, y: 0 };
  private animationTime: number = 0;
  private stats: Stats = {
    ownTroops: 0,
    enemyTroops: 0,
    ownCasualties: 0,
    enemyCasualties: 0,
    time: 0,
    result: null
  };
  private onPlaceUnit: OnPlaceUnitCallback | null = null;
  private onReset: OnResetCallback | null = null;
  private onPause: OnPauseCallback | null = null;
  private onSpeedChange: OnSpeedChangeCallback | null = null;
  private onGeneralRally: OnGeneralRallyCallback | null = null;
  private generalPosition: { x: number; y: number } = { x: 120, y: 120 };
  private isDraggingGeneral: boolean = false;
  private generalSelected: boolean = false;
  private sandboxOffset: { x: number; y: number } = { x: 50, y: 50 };

  setCallbacks(callbacks: {
    onPlaceUnit?: OnPlaceUnitCallback;
    onReset?: OnResetCallback;
    onPause?: OnPauseCallback;
    onSpeedChange?: OnSpeedChangeCallback;
    onGeneralRally?: OnGeneralRallyCallback;
  }): void {
    if (callbacks.onPlaceUnit) this.onPlaceUnit = callbacks.onPlaceUnit;
    if (callbacks.onReset) this.onReset = callbacks.onReset;
    if (callbacks.onPause) this.onPause = callbacks.onPause;
    if (callbacks.onSpeedChange) this.onSpeedChange = callbacks.onSpeedChange;
    if (callbacks.onGeneralRally) this.onGeneralRally = callbacks.onGeneralRally;
  }

  setSandboxOffset(x: number, y: number): void {
    this.sandboxOffset = { x, y };
  }

  private tokens: Token[] = [
    { id: 'infantry', name: '步兵', count: 1, color: '#E74C3C', side: 'red', type: 'infantry', emoji: '⚔️' },
    { id: 'cavalry', name: '骑兵', count: 1, color: '#E74C3C', side: 'red', type: 'cavalry', emoji: '🐎' },
    { id: 'archer', name: '弓兵', count: 1, color: '#E74C3C', side: 'red', type: 'archer', emoji: '🏹' },
    { id: 'scout', name: '斥候', count: 1, color: '#E74C3C', side: 'red', type: 'scout', emoji: '🔍' },
    { id: 'heavyInfantry', name: '重步兵', count: 1, color: '#3498DB', side: 'blue', type: 'heavyInfantry', emoji: '🛡️' },
    { id: 'lightCavalry', name: '轻骑兵', count: 1, color: '#3498DB', side: 'blue', type: 'lightCavalry', emoji: '🏇' },
    { id: 'crossbowman', name: '弩兵', count: 1, color: '#3498DB', side: 'blue', type: 'crossbowman', emoji: '🎯' },
    { id: 'spy', name: '间谍', count: 1, color: '#3498DB', side: 'blue', type: 'spy', emoji: '🕵️' },
  ];

  private buttons: Button[] = [];

  constructor() {
    this.updateLayout();
    this.initButtons();
  }

  private updateLayout(): void {
    const viewportWidth = window.innerWidth;
    if (viewportWidth < 900) {
      this.canvasWidth = 600;
      this.canvasHeight = 420;
    } else {
      this.canvasWidth = 1200;
      this.canvasHeight = 800;
    }
  }

  private initButtons(): void {
    const viewportWidth = window.innerWidth;
    const btnWidth = viewportWidth < 900 ? 64 : 80;
    const btnHeight = viewportWidth < 900 ? 26 : 32;
    const btnY = 20;
    const btnSpacing = 10;

    this.buttons = [
      {
        id: 'speed',
        text: '加速x2',
        x: this.canvasWidth - btnWidth * 3 - 20 - btnSpacing * 2,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        color: '#4A6741',
        hoverColor: '#5B7A50',
        hovered: false,
        onClick: () => this.handleSpeed()
      },
      {
        id: 'pause',
        text: '暂停',
        x: this.canvasWidth - btnWidth * 2 - 20 - btnSpacing,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        color: '#556B2F',
        hoverColor: '#6B8E23',
        hovered: false,
        onClick: () => this.handlePauseResume()
      },
      {
        id: 'reset',
        text: '重置',
        x: this.canvasWidth - btnWidth - 20,
        y: btnY,
        width: btnWidth,
        height: btnHeight,
        color: '#8B0000',
        hoverColor: '#A52A2A',
        hovered: false,
        onClick: () => this.handleReset()
      }
    ];
  }

  private handleReset(): void {
    if (this.onReset) {
      this.onReset();
    }
  }

  private handlePauseResume(): void {
    this.isPaused = !this.isPaused;
    const btn = this.buttons.find(b => b.id === 'pause');
    if (btn) {
      btn.text = this.isPaused ? '继续' : '暂停';
    }
    if (this.onPause) {
      this.onPause(this.isPaused);
    }
  }

  private handleSpeed(): void {
    this.speed = this.speed === 1 ? 2 : 1;
    const btn = this.buttons.find(b => b.id === 'speed');
    if (btn) {
      btn.text = this.speed === 1 ? '加速x2' : 'x1';
    }
    if (this.onSpeedChange) {
      this.onSpeedChange(this.speed);
    }
  }

  public updateStats(stats: Stats): void {
    this.stats = { ...stats };
    if (stats.result) {
      this.bannerResult = stats.result;
      this.bannerVisible = true;
      this.bannerTime = 3000;
    }
  }

  public handleMouseDown(e: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mousePos = { x, y };

    for (const btn of this.buttons) {
      if (this.isPointInRect(x, y, btn.x, btn.y, btn.width, btn.height)) {
        btn.onClick();
        return;
      }
    }

    const generalDist = Math.sqrt(
      (x - this.generalPosition.x) ** 2 + (y - this.generalPosition.y) ** 2
    );
    if (generalDist < 20) {
      if (e.button === 0) {
        this.isDraggingGeneral = true;
        this.generalSelected = true;
        this.dragOffset = {
          x: x - this.generalPosition.x,
          y: y - this.generalPosition.y
        };
      }
      return;
    }

    const tokenBar = this.getTokenBarRect();
    if (this.isPointInRect(x, y, tokenBar.x, tokenBar.y, tokenBar.width, tokenBar.height)) {
      const viewportWidth = window.innerWidth;
      if (viewportWidth < 900) {
        const tokenWidth = (tokenBar.width - 40) / this.tokens.length;
        const tokenIndex = Math.floor((x - tokenBar.x - 20) / tokenWidth);
        if (tokenIndex >= 0 && tokenIndex < this.tokens.length) {
          this.draggingToken = { ...this.tokens[tokenIndex] };
          const tx = tokenBar.x + 20 + tokenIndex * tokenWidth + tokenWidth / 2;
          const ty = tokenBar.y + 55;
          this.dragOffset = { x: x - tx, y: y - ty };
        }
      } else {
        const tokenIndex = Math.floor((y - tokenBar.y - 20) / 60);
        if (tokenIndex >= 0 && tokenIndex < this.tokens.length) {
          this.draggingToken = { ...this.tokens[tokenIndex] };
          const ty = tokenBar.y + 50 + tokenIndex * 60;
          this.dragOffset = {
            x: x - (tokenBar.x + tokenBar.width / 2),
            y: y - ty
          };
        }
      }
    } else if (this.generalSelected && e.button === 0) {
      const sandboxRect = this.getSandboxRect();
      if (this.isPointInRect(x, y, sandboxRect.x, sandboxRect.y, sandboxRect.width, sandboxRect.height)) {
        const sandboxX = x - this.sandboxOffset.x;
        const sandboxY = y - this.sandboxOffset.y;
        if (this.onGeneralRally) {
          this.onGeneralRally(sandboxX, sandboxY);
        }
        this.generalPosition = { x, y };
        this.generalSelected = false;
      }
    } else {
      this.generalSelected = false;
    }
  }

  public handleMouseMove(e: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mousePos = { x, y };

    for (const btn of this.buttons) {
      btn.hovered = this.isPointInRect(x, y, btn.x, btn.y, btn.width, btn.height);
    }

    if (this.isDraggingGeneral) {
      this.generalPosition = {
        x: x - this.dragOffset.x,
        y: y - this.dragOffset.y
      };
    }

    if (this.draggingToken) {
      const sandboxRect = this.getSandboxRect();
      if (this.isPointInRect(x, y, sandboxRect.x, sandboxRect.y, sandboxRect.width, sandboxRect.height)) {
        this.indicatorVisible = true;
        this.indicatorPos = { x, y };
      } else {
        this.indicatorVisible = false;
      }
    } else {
      this.indicatorVisible = false;
    }
  }

  public handleMouseUp(e: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isDraggingGeneral) {
      this.isDraggingGeneral = false;
    }

    if (this.draggingToken) {
      const sandboxRect = this.getSandboxRect();
      if (this.isPointInRect(x, y, sandboxRect.x, sandboxRect.y, sandboxRect.width, sandboxRect.height)) {
        const sandboxX = x - this.sandboxOffset.x;
        const sandboxY = y - this.sandboxOffset.y;
        if (this.onPlaceUnit) {
          this.onPlaceUnit(this.draggingToken.side, this.draggingToken.type, sandboxX, sandboxY);
        }
      }
      this.draggingToken = null;
      this.indicatorVisible = false;
    }
  }

  public handleWheel(e: WheelEvent): void {
    e.preventDefault();
    console.log('Wheel event:', e.deltaY);
  }

  private isPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  private getTokenBarRect(): { x: number; y: number; width: number; height: number } {
    const viewportWidth = window.innerWidth;
    if (viewportWidth < 900) {
      return {
        x: 20,
        y: this.canvasHeight - 100,
        width: this.canvasWidth - 40,
        height: 80
      };
    }
    return {
      x: this.canvasWidth - 200,
      y: 80,
      width: 180,
      height: 450
    };
  }

  private getSandboxRect(): { x: number; y: number; width: number; height: number } {
    const viewportWidth = window.innerWidth;
    if (viewportWidth < 900) {
      return { x: 20, y: 70, width: 560, height: 300 };
    }
    return { x: 20, y: 80, width: 960, height: 600 };
  }

  private getStatsPanelRect(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.canvasWidth - 220,
      y: this.canvasHeight - 180,
      width: 200,
      height: 160
    };
  }

  private drawPentagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, fillColor: string): void {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawTitle(ctx: CanvasRenderingContext2D): void {
    const viewportWidth = window.innerWidth;
    const fontSize = viewportWidth < 900 ? 22 : 28;
    
    ctx.save();
    ctx.font = `${fontSize}px "KaiTi", "STKaiti", "SimSun", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const gradient = ctx.createLinearGradient(this.canvasWidth / 2 - 100, 30, this.canvasWidth / 2 + 100, 30);
    gradient.addColorStop(0, '#F5DEB3');
    gradient.addColorStop(0.5, '#DEB887');
    gradient.addColorStop(1, '#F5DEB3');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(this.canvasWidth / 2 - 100, 10, 200, 45);
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.canvasWidth / 2 - 100, 10, 200, 45);
    
    ctx.fillStyle = '#5C3A1E';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText('沙盘推演', this.canvasWidth / 2, 32);
    ctx.fillText('沙盘推演', this.canvasWidth / 2, 32);
    
    ctx.restore();
  }

  private drawTokenBar(ctx: CanvasRenderingContext2D): void {
    const bar = this.getTokenBarRect();
    const viewportWidth = window.innerWidth;
    
    ctx.save();
    ctx.fillStyle = 'rgba(62, 39, 35, 0.85)';
    ctx.beginPath();
    ctx.roundRect(bar.x, bar.y, bar.width, bar.height, 10);
    ctx.fill();
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.fillText('兵牌栏', bar.x + bar.width / 2, bar.y + 20);
    
    if (viewportWidth < 900) {
      const tokenWidth = (bar.width - 20) / this.tokens.length;
      this.tokens.forEach((token, index) => {
        const tx = bar.x + 10 + index * tokenWidth + tokenWidth / 2;
        const ty = bar.y + 45;
        
        ctx.fillStyle = token.color;
        ctx.beginPath();
        ctx.roundRect(tx - 20, ty - 12, 40, 24, 5);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.emoji, tx, ty);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px "SimSun", serif';
        ctx.fillText(token.name, tx, ty + 22);
      });
    } else {
      this.tokens.forEach((token, index) => {
        const ty = bar.y + 45 + index * 50;
        
        ctx.fillStyle = token.color;
        ctx.beginPath();
        ctx.roundRect(bar.x + 15, ty - 15, bar.width - 30, 30, 5);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token.emoji, bar.x + 35, ty);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px "SimSun", serif';
        ctx.textAlign = 'left';
        ctx.fillText(token.name, bar.x + 60, ty);
      });
    }
    
    ctx.restore();
  }

  private drawButtons(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    
    for (const btn of this.buttons) {
      ctx.fillStyle = btn.hovered ? btn.hoverColor : btn.color;
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 5);
      ctx.fill();
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px "SimSun", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
    }
    
    ctx.restore();
  }

  private drawStatsPanel(ctx: CanvasRenderingContext2D): void {
    const panel = this.getStatsPanelRect();
    
    ctx.save();
    ctx.fillStyle = 'rgba(62, 39, 35, 0.85)';
    ctx.beginPath();
    ctx.roundRect(panel.x, panel.y, panel.width, panel.height, 8);
    ctx.fill();
    
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.fillText('战况统计', panel.x + panel.width / 2, panel.y + 25);
    
    const lineHeight = 26;
    const startY = panel.y + 55;
    ctx.font = '14px "SimSun", serif';
    ctx.textAlign = 'left';
    
    ctx.fillStyle = '#E74C3C';
    ctx.fillText(`己方兵力: ${this.stats.ownTroops}`, panel.x + 15, startY);
    
    ctx.fillStyle = '#A9A9A9';
    ctx.fillText(`敌方兵力: ${this.stats.enemyTroops}`, panel.x + 15, startY + lineHeight);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`阵亡比: ${this.stats.ownCasualties}:${this.stats.enemyCasualties}`, panel.x + 15, startY + lineHeight * 2);
    
    const minutes = Math.floor(this.stats.time / 60);
    const seconds = Math.floor(this.stats.time % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`时间: ${timeStr}`, panel.x + 15, startY + lineHeight * 3);
    
    ctx.restore();
  }

  private drawBanner(ctx: CanvasRenderingContext2D): void {
    if (!this.bannerVisible || !this.bannerResult) return;
    
    const blinkFrequency = 1000;
    const isVisible = Math.floor(this.animationTime / blinkFrequency) % 2 === 0;
    
    if (!isVisible) return;
    
    ctx.save();
    ctx.font = '60px "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = this.bannerResult === 'victory' ? '胜 利!' : '失 败...';
    
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 4;
    ctx.strokeText(text, this.canvasWidth / 2, this.canvasHeight / 2);
    ctx.fillText(text, this.canvasWidth / 2, this.canvasHeight / 2);
    
    ctx.restore();
  }

  private drawPlacementIndicator(ctx: CanvasRenderingContext2D): void {
    if (!this.indicatorVisible) return;
    
    const blinkFrequency = 1000;
    const isVisible = Math.floor(this.animationTime / blinkFrequency) % 2 === 0;
    
    if (!isVisible) return;
    
    ctx.save();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(this.indicatorPos.x, this.indicatorPos.y, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawDraggingToken(ctx: CanvasRenderingContext2D): void {
    if (!this.draggingToken) return;
    
    const x = this.mousePos.x - this.dragOffset.x;
    const y = this.mousePos.y - this.dragOffset.y;
    
    ctx.save();
    ctx.globalAlpha = 0.7;
    
    if (this.draggingToken.id === 'general') {
      this.drawPentagon(ctx, x, y, 8, '#FFD700');
    } else {
      ctx.fillStyle = this.draggingToken.color;
      ctx.beginPath();
      ctx.roundRect(x - 25, y - 15, 50, 30, 5);
      ctx.fill();
      ctx.strokeStyle = '#8B7355';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.draggingToken.name, x, y + 30);
    
    ctx.restore();
  }

  public render(ctx: CanvasRenderingContext2D, deltaTime: number = 16): void {
    this.animationTime += deltaTime;
    
    if (this.bannerVisible) {
      this.bannerTime -= deltaTime;
      if (this.bannerTime <= 0) {
        this.bannerVisible = false;
        this.bannerResult = null;
      }
    }
    
    this.drawTitle(ctx);
    this.drawTokenBar(ctx);
    this.drawButtons(ctx);
    this.drawStatsPanel(ctx);
    this.drawGeneral(ctx);
    this.drawBanner(ctx);
    this.drawPlacementIndicator(ctx);
    this.drawDraggingToken(ctx);
  }

  private drawGeneral(ctx: CanvasRenderingContext2D): void {
    const x = this.generalPosition.x;
    const y = this.generalPosition.y;
    const size = 16;

    if (this.generalSelected) {
      const pulseScale = 1 + Math.sin(this.animationTime / 1500 * Math.PI * 2) * 0.15;
      ctx.save();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7 + Math.sin(this.animationTime / 1500 * Math.PI * 2) * 0.3;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const px = x + size * pulseScale * Math.cos(angle);
        const py = y + size * pulseScale * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    this.drawPentagon(ctx, x, y, size, '#FFD700');

    ctx.fillStyle = '#5C3A1E';
    ctx.font = 'bold 10px "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('将', x, y);
  }

  public getCanvasSize(): { width: number; height: number } {
    return { width: this.canvasWidth, height: this.canvasHeight };
  }

  public getSandboxArea(): { x: number; y: number; width: number; height: number } {
    return this.getSandboxRect();
  }
}

export { UIManager };
export type { Stats, Token };
