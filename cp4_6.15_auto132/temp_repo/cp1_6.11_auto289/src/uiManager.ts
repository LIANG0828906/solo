import type { CopperCoin, SilverIngot, BillNote, AbacusColumn, ExchangeZone } from './types';
import { AccountingEngine } from './accountingEngine';

const COLORS = {
  woodDark: '#4A2C1A',
  woodMedium: '#8B5A2B',
  woodLight: '#A0522D',
  copper: '#B87333',
  copperDark: '#8B6914',
  silver: '#C0C0C0',
  silverDark: '#808080',
  paper: '#F5DEB3',
  paperDark: '#DEB887',
  ink: '#2C1810',
  cinnabar: '#CC3333',
  gold: '#D4AF37',
  upperBead: '#CC3333',
  lowerBead: '#333333',
  ledgerBg: '#F0E6D2',
  success: '#228B22',
  error: '#CC3333'
};

export class UIManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: AccountingEngine;
  private width: number = 0;
  private height: number = 0;
  private scale: number = 1;
  private dpr: number = 1;

  private copperCoins: CopperCoin[] = [];
  private silverIngots: SilverIngot[] = [];
  private billNotes: BillNote[] = [];
  private abacusColumns: AbacusColumn[] = [];

  private exchangeZone: ExchangeZone = { x: 0, y: 0, width: 0, height: 0 };
  private copperPileArea = { x: 0, y: 0, width: 0, height: 0 };

  private draggingCoin: CopperCoin | null = null;
  private dragOffset = { x: 0, y: 0 };
  private mousePos = { x: 0, y: 0 };

  private billInputVisible = false;
  private billInputAmount = '';
  private billInputIssuer: '本号' | '他号' = '本号';
  private activeInputField: 'amount' | null = null;

  private animationFrameId: number = 0;
  private lastTime: number = 0;

  private hoveredAbacusColumn: number = -1;
  private audioContext: AudioContext | null = null;

  private abacusX: number = 0;
  private abacusY: number = 0;
  private abacusWidth: number = 0;
  private abacusHeight: number = 0;

  private ledgerScrollY: number = 0;
  private timeSliderValue: number = 0;
  private isReplaying: boolean = false;
  private replayTimer: number = 0;

  private buttons: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    hovered: boolean;
    onClick: () => void;
  }> = [];

  constructor(canvas: HTMLCanvasElement, engine: AccountingEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.engine = engine;

    this.initAbacus();
    this.initCoins();
    this.bindEvents();
    this.engine.subscribe(() => this.onEngineUpdate());
  }

  private initAbacus(): void {
    const placeValues = [10000, 1000, 100, 10, 1, 0.1, 0.01];
    this.abacusColumns = placeValues.map(pv => ({
      upperBeads: [
        { position: 0, target: 0 },
        { position: 0, target: 0 }
      ],
      lowerBeads: [
        { position: 0, target: 0 },
        { position: 0, target: 0 },
        { position: 0, target: 0 },
        { position: 0, target: 0 },
        { position: 0, target: 0 }
      ],
      placeValue: pv,
      hovered: false
    }));
  }

  private initCoins(): void {
    for (let i = 0; i < 20; i++) {
      this.copperCoins.push({
        id: `coin_${i}`,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        isDragging: false
      });
    }
  }

  private repositionCoins(): void {
    const area = this.copperPileArea;
    const coinSize = 20 * this.scale;
    const cols = Math.floor(area.width / (coinSize * 0.7));
    const rows = Math.floor(area.height / (coinSize * 0.6));

    this.copperCoins.forEach((coin, i) => {
      if (!coin.isDragging) {
        const col = i % cols;
        const row = Math.floor(i / cols) % rows;
        coin.x = area.x + coinSize * 0.5 + col * coinSize * 0.7 + Math.random() * 5;
        coin.y = area.y + coinSize * 0.5 + row * coinSize * 0.6 + Math.random() * 5;
      }
    });
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp(new MouseEvent('mouseup')));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener('keydown', (e) => this.onKeyDown(e));
    this.canvas.tabIndex = 0;
  }

  private onEngineUpdate(): void {
    this.updateAbacusFromBalance();
  }

  private updateAbacusFromBalance(): void {
    const state = this.engine.getState();
    const silverStr = state.silverBalance.toFixed(2);
    const parts = silverStr.split('.');
    const intPart = parts[0].padStart(5, '0');
    const decPart = parts[1] || '00';
    const digits = (intPart + decPart).split('').map(Number);

    digits.forEach((digit, i) => {
      if (i < this.abacusColumns.length) {
        const col = this.abacusColumns[i];
        const upperCount = Math.floor(digit / 5);
        const lowerCount = digit % 5;

        col.upperBeads.forEach((bead, j) => {
          bead.target = j < upperCount ? 1 : 0;
        });
        col.lowerBeads.forEach((bead, j) => {
          bead.target = j < lowerCount ? 1 : 0;
        });
      }
    });
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(this.dpr, this.dpr);

    this.scale = Math.min(width / 1200, height / 800);

    this.layoutElements();
  }

  private layoutElements(): void {
    const leftWidth = this.width * 0.6;
    const rightWidth = this.width * 0.4;

    this.exchangeZone = {
      x: leftWidth * 0.1,
      y: this.height * 0.15,
      width: leftWidth * 0.35,
      height: this.height * 0.3
    };

    this.copperPileArea = {
      x: leftWidth * 0.55,
      y: this.height * 0.15,
      width: leftWidth * 0.35,
      height: this.height * 0.3
    };

    this.abacusWidth = leftWidth * 0.8;
    this.abacusHeight = this.height * 0.25;
    this.abacusX = leftWidth * 0.1;
    this.abacusY = this.height * 0.55;

    this.repositionCoins();

    this.buttons = [
      {
        id: 'issueBill',
        x: leftWidth * 0.15,
        y: this.height * 0.85,
        width: leftWidth * 0.25,
        height: this.height * 0.08,
        label: '签发银票',
        hovered: false,
        onClick: () => this.toggleBillInput()
      },
      {
        id: 'exchangeSilver',
        x: leftWidth * 0.5,
        y: this.height * 0.85,
        width: leftWidth * 0.3,
        height: this.height * 0.08,
        label: '批量兑换(百文)',
        hovered: false,
        onClick: () => this.batchExchange()
      }
    ];

    this.updateAbacusFromBalance();
  }

  private getCanvasPos(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private onMouseDown(e: MouseEvent): void {
    const pos = this.getCanvasPos(e);

    for (const coin of this.copperCoins) {
      const dx = pos.x - coin.x;
      const dy = pos.y - coin.y;
      const radius = 10 * this.scale;
      if (dx * dx + dy * dy <= radius * radius) {
        this.draggingCoin = coin;
        coin.isDragging = true;
        this.dragOffset = { x: dx, y: dy };
        return;
      }
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const pos = this.getCanvasPos(e);
    this.mousePos = pos;

    if (this.draggingCoin) {
      this.draggingCoin.x = pos.x - this.dragOffset.x;
      this.draggingCoin.y = pos.y - this.dragOffset.y;
    }

    this.buttons.forEach(btn => {
      btn.hovered = pos.x >= btn.x && pos.x <= btn.x + btn.width &&
                    pos.y >= btn.y && pos.y <= btn.y + btn.height;
    });

    this.checkAbacusHover(pos);
  }

  private onMouseUp(e: MouseEvent): void {
    if (this.draggingCoin) {
      const coin = this.draggingCoin;
      coin.isDragging = false;

      if (this.isInExchangeZone(coin.x, coin.y)) {
        this.exchangeCoin(coin);
      } else {
        this.returnCoinToPile(coin);
      }

      this.draggingCoin = null;
    }
  }

  private onClick(e: MouseEvent): void {
    const pos = this.getCanvasPos(e);

    for (const btn of this.buttons) {
      if (pos.x >= btn.x && pos.x <= btn.x + btn.width &&
          pos.y >= btn.y && pos.y <= btn.y + btn.height) {
        btn.onClick();
        return;
      }
    }

    this.handleAbacusClick(pos);
    this.handleBillInputClick(pos);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (this.billInputVisible && this.activeInputField === 'amount') {
      if (e.key >= '0' && e.key <= '9') {
        if (this.billInputAmount.length < 6) {
          this.billInputAmount += e.key;
        }
      } else if (e.key === 'Backspace') {
        this.billInputAmount = this.billInputAmount.slice(0, -1);
      } else if (e.key === 'Enter') {
        this.submitBill();
      }
    }
  }

  private isInExchangeZone(x: number, y: number): boolean {
    return x >= this.exchangeZone.x && x <= this.exchangeZone.x + this.exchangeZone.width &&
           y >= this.exchangeZone.y && y <= this.exchangeZone.y + this.exchangeZone.height;
  }

  private exchangeCoin(coin: CopperCoin): void {
    const result = this.engine.exchangeCopperToSilver(100);
    if (result.success) {
      const idx = this.copperCoins.findIndex(c => c.id === coin.id);
      if (idx !== -1) {
        this.copperCoins.splice(idx, 1);
      }

      this.silverIngots.push({
        id: `ingot_${Date.now()}`,
        x: this.exchangeZone.x + this.exchangeZone.width / 2,
        y: this.exchangeZone.y + this.exchangeZone.height / 2,
        valueInTaels: 0.1
      });

      this.playBeadSound(800, 0.05);
    }
  }

  private returnCoinToPile(coin: CopperCoin): void {
    const targetX = this.copperPileArea.x + this.copperPileArea.width / 2 + (Math.random() - 0.5) * 40;
    const targetY = this.copperPileArea.y + this.copperPileArea.height / 2 + (Math.random() - 0.5) * 30;
    coin.x = targetX;
    coin.y = targetY;
  }

  private batchExchange(): void {
    const result = this.engine.exchangeCopperToSilver(100);
    if (result.success) {
      for (let i = 0; i < 1 && this.copperCoins.length > 0; i++) {
        this.copperCoins.pop();
      }
      this.silverIngots.push({
        id: `ingot_${Date.now()}`,
        x: this.exchangeZone.x + this.exchangeZone.width / 2 + (Math.random() - 0.5) * 30,
        y: this.exchangeZone.y + this.exchangeZone.height / 2 + (Math.random() - 0.5) * 20,
        valueInTaels: 0.1
      });
      this.playBeadSound(600, 0.08);
    }
  }

  private toggleBillInput(): void {
    this.billInputVisible = !this.billInputVisible;
    this.billInputAmount = '';
    this.activeInputField = 'amount';
    if (this.billInputVisible) {
      this.canvas.focus();
    }
  }

  private handleBillInputClick(pos: { x: number; y: number }): void {
    if (!this.billInputVisible) return;

    const rightX = this.width * 0.6;
    const rightWidth = this.width * 0.4;
    const billY = this.height * 0.05;
    const billW = rightWidth * 0.8;
    const billH = this.height * 0.35;
    const billX = rightX + (rightWidth - billW) / 2;

    const submitBtnX = billX + billW * 0.2;
    const submitBtnY = billY + billH * 0.85;
    const submitBtnW = billW * 0.6;
    const submitBtnH = billH * 0.1;

    if (pos.x >= submitBtnX && pos.x <= submitBtnX + submitBtnW &&
        pos.y >= submitBtnY && pos.y <= submitBtnY + submitBtnH) {
      this.submitBill();
    }

    const issuerY = billY + billH * 0.6;
    const issuer1X = billX + billW * 0.1;
    const issuer2X = billX + billW * 0.55;
    const issuerW = billW * 0.35;
    const issuerH = billH * 0.08;

    if (pos.x >= issuer1X && pos.x <= issuer1X + issuerW &&
        pos.y >= issuerY && pos.y <= issuerY + issuerH) {
      this.billInputIssuer = '本号';
    }
    if (pos.x >= issuer2X && pos.x <= issuer2X + issuerW &&
        pos.y >= issuerY && pos.y <= issuerY + issuerH) {
      this.billInputIssuer = '他号';
    }
  }

  private submitBill(): void {
    const amount = parseFloat(this.billInputAmount);
    if (isNaN(amount) || amount <= 0) return;

    const result = this.engine.issueBillNote(amount, this.billInputIssuer);
    if (result.success && result.bill) {
      this.billNotes.push(result.bill);
      this.billInputAmount = '';
      this.playBeadSound(400, 0.1);
    }
  }

  private checkAbacusHover(pos: { x: number; y: number }): void {
    const colCount = this.abacusColumns.length;
    const colWidth = this.abacusWidth / colCount;
    this.hoveredAbacusColumn = -1;

    for (let i = 0; i < colCount; i++) {
      const colX = this.abacusX + i * colWidth;
      if (pos.x >= colX && pos.x <= colX + colWidth &&
          pos.y >= this.abacusY && pos.y <= this.abacusY + this.abacusHeight) {
        this.hoveredAbacusColumn = i;
        break;
      }
    }
  }

  private handleAbacusClick(pos: { x: number; y: number }): void {
    if (this.hoveredAbacusColumn === -1) return;

    const col = this.abacusColumns[this.hoveredAbacusColumn];
    const colCount = this.abacusColumns.length;
    const colWidth = this.abacusWidth / colCount;
    const colX = this.abacusX + this.hoveredAbacusColumn * colWidth;
    const relativeY = pos.y - this.abacusY;
    const beamY = this.abacusHeight * 0.4;

    if (relativeY < beamY) {
      const upperActive = col.upperBeads.filter(b => b.target === 1).length;
      const newCount = (upperActive + 1) % (col.upperBeads.length + 1);
      col.upperBeads.forEach((bead, j) => {
        bead.target = j < newCount ? 1 : 0;
      });
      this.playBeadSound(500 + Math.random() * 200, 0.05);
    } else {
      const lowerActive = col.lowerBeads.filter(b => b.target === 1).length;
      const newCount = (lowerActive + 1) % (col.lowerBeads.length + 1);
      col.lowerBeads.forEach((bead, j) => {
        bead.target = j < newCount ? 1 : 0;
      });
      this.playBeadSound(400 + Math.random() * 200, 0.05);
    }
  }

  private playBeadSound(frequency: number, duration: number): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = this.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.8, ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  start(): void {
    this.lastTime = performance.now();
    this.animate();
  }

  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private animate(): void {
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.update(deltaTime);
    this.draw();

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private update(dt: number): void {
    const beadSpeed = 15;

    this.abacusColumns.forEach(col => {
      col.upperBeads.forEach(bead => {
        const diff = bead.target - bead.position;
        bead.position += diff * beadSpeed * dt;
        if (Math.abs(diff) < 0.01) bead.position = bead.target;
      });
      col.lowerBeads.forEach(bead => {
        const diff = bead.target - bead.position;
        bead.position += diff * beadSpeed * dt;
        if (Math.abs(diff) < 0.01) bead.position = bead.target;
      });
    });

    this.billNotes.forEach(bill => {
      if (bill.isUnrolling) {
        bill.unrollProgress += dt * 2;
        if (bill.unrollProgress >= 1) {
          bill.unrollProgress = 1;
          bill.isUnrolling = false;
        }
      }
    });

    if (this.isReplaying) {
      this.replayTimer += dt;
      if (this.replayTimer >= 0.3) {
        this.replayTimer = 0;
        const currentIdx = this.engine.getCurrentTimeIndex();
        const totalLen = this.engine.getLedgerLength();
        if (currentIdx < totalLen) {
          this.engine.goToTime(currentIdx + 1);
        } else {
          this.isReplaying = false;
        }
      }
    }
  }

  setTimeSlider(value: number): void {
    this.timeSliderValue = value;
    const totalLen = this.engine.getLedgerLength();
    const index = Math.floor(value * totalLen);
    this.engine.goToTime(index);
  }

  startReplay(): void {
    this.isReplaying = true;
    this.replayTimer = 0;
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawCounter();
    this.drawExchangeZone();
    this.drawCopperPile();
    this.drawSilverIngots();
    this.drawAbacus();
    this.drawButtons();
    this.drawRightPanel();
  }

  private drawCounter(): void {
    const ctx = this.ctx;
    const leftWidth = this.width * 0.6;

    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, COLORS.woodLight);
    gradient.addColorStop(0.5, COLORS.woodMedium);
    gradient.addColorStop(1, COLORS.woodDark);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, leftWidth, this.height);

    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * this.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(leftWidth, y + (Math.random() - 0.5) * 10);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(0, 0, 4, this.height);
    ctx.fillRect(leftWidth - 4, 0, 4, this.height);
  }

  private drawExchangeZone(): void {
    const ctx = this.ctx;
    const zone = this.exchangeZone;

    ctx.fillStyle = 'rgba(255, 248, 220, 0.3)';
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    this.roundRect(zone.x, zone.y, zone.width, zone.height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = COLORS.ink;
    ctx.font = `${14 * this.scale}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'center';
    ctx.fillText('兑换区', zone.x + zone.width / 2, zone.y - 10);
  }

  private drawCopperPile(): void {
    const ctx = this.ctx;
    const area = this.copperPileArea;

    ctx.fillStyle = 'rgba(184, 115, 51, 0.15)';
    this.roundRect(area.x, area.y, area.width, area.height, 8);
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.font = `${14 * this.scale}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'center';
    ctx.fillText('铜钱堆', area.x + area.width / 2, area.y - 10);

    this.copperCoins.forEach(coin => {
      this.drawCopperCoin(coin.x, coin.y);
    });
  }

  private drawCopperCoin(x: number, y: number): void {
    const ctx = this.ctx;
    const radius = 10 * this.scale;

    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, '#DAA520');
    gradient.addColorStop(0.5, COLORS.copper);
    gradient.addColorStop(1, COLORS.copperDark);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = COLORS.copperDark;
    ctx.lineWidth = 1;
    ctx.stroke();

    const holeSize = radius * 0.35;
    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(x - holeSize, y - holeSize, holeSize * 2, holeSize * 2);

    ctx.fillStyle = COLORS.ink;
    ctx.font = `${radius * 0.6}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('通', x, y - radius * 0.1);
  }

  private drawSilverIngots(): void {
    this.silverIngots.forEach(ingot => {
      this.drawSilverIngot(ingot.x, ingot.y);
    });
  }

  private drawSilverIngot(x: number, y: number): void {
    const ctx = this.ctx;
    const w = 40 * this.scale;
    const h = 20 * this.scale;

    ctx.save();
    ctx.translate(x, y);

    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 4, -h / 2);
    ctx.lineTo(w / 4, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, 0);
    ctx.quadraticCurveTo(w / 2, h / 2, w / 4, h / 2);
    ctx.lineTo(-w / 4, h / 2);
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, 0);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    gradient.addColorStop(0, '#E8E8E8');
    gradient.addColorStop(0.3, COLORS.silver);
    gradient.addColorStop(0.7, '#A0A0A0');
    gradient.addColorStop(1, COLORS.silverDark);

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = COLORS.silverDark;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-w / 3 + i * w / 4, -h / 3);
      ctx.lineTo(-w / 3 + i * w / 4 + w / 8, h / 3);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawAbacus(): void {
    const ctx = this.ctx;
    const x = this.abacusX;
    const y = this.abacusY;
    const w = this.abacusWidth;
    const h = this.abacusHeight;

    ctx.fillStyle = COLORS.woodDark;
    this.roundRect(x - 10, y - 10, w + 20, h + 20, 5);
    ctx.fill();

    ctx.fillStyle = COLORS.woodMedium;
    ctx.fillRect(x, y, w, h);

    const beamY = y + h * 0.4;
    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(x, beamY - 4, w, 8);

    const colCount = this.abacusColumns.length;
    const colWidth = w / colCount;

    for (let i = 0; i <= colCount; i++) {
      ctx.strokeStyle = COLORS.woodDark;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + i * colWidth, y);
      ctx.lineTo(x + i * colWidth, y + h);
      ctx.stroke();
    }

    for (let i = 0; i < colCount; i++) {
      const colX = x + i * colWidth + colWidth / 2;
      const col = this.abacusColumns[i];
      const isHovered = i === this.hoveredAbacusColumn;
      const beadScale = isHovered ? 1.2 : 1;

      ctx.strokeStyle = '#2C1810';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(colX, y + 5);
      ctx.lineTo(colX, y + h - 5);
      ctx.stroke();

      const beadRadius = Math.min(colWidth * 0.3, h * 0.07) * beadScale;
      const beadDiameter = beadRadius * 2;
      const spacing = beadDiameter * 1.2;

      const upperRestY = y + 15 + beadRadius;
      const upperActiveY = beamY - beadRadius - spacing;
      col.upperBeads.forEach((bead, j) => {
        const restY = upperRestY + j * spacing;
        const activeY = upperActiveY + j * spacing;
        const by = restY + (activeY - restY) * bead.position;
        this.drawBead(colX, by, beadRadius, COLORS.upperBead, isHovered);
      });

      const lowerActiveY = beamY + beadRadius + 4;
      const lowerRestY = y + h - 15 - beadRadius - spacing * 4;
      col.lowerBeads.forEach((bead, j) => {
        const activeY = lowerActiveY + j * spacing;
        const restY = lowerRestY + j * spacing;
        const by = restY + (activeY - restY) * bead.position;
        this.drawBead(colX, by, beadRadius, COLORS.lowerBead, isHovered);
      });

      if (isHovered) {
        ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
        ctx.fillRect(x + i * colWidth, y, colWidth, h);

        ctx.fillStyle = COLORS.gold;
        ctx.font = `${12 * this.scale}px 'Noto Serif SC', serif`;
        ctx.textAlign = 'center';
        const value = this.getColumnValue(i);
        ctx.fillText(`${value}`, colX, y - 15);
      }
    }

    ctx.fillStyle = COLORS.ink;
    ctx.font = `${16 * this.scale}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'center';
    ctx.fillText('算盘', x + w / 2, y + h + 30);
  }

  private getColumnValue(colIdx: number): number {
    const col = this.abacusColumns[colIdx];
    let value = 0;
    col.upperBeads.forEach(bead => {
      if (bead.position >= 0.5) value += 5;
    });
    col.lowerBeads.forEach(bead => {
      if (bead.position >= 0.5) value += 1;
    });
    return value;
  }

  private drawBead(x: number, y: number, radius: number, color: string, glow: boolean): void {
    const ctx = this.ctx;

    if (glow) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.fill();
    }

    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, color === COLORS.upperBead ? '#FF6666' : '#666666');
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, color === COLORS.upperBead ? '#8B0000' : '#111111');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x, y - radius * 0.2, radius * 0.6, radius * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fill();
  }

  private drawButtons(): void {
    const ctx = this.ctx;

    this.buttons.forEach(btn => {
      if (btn.hovered) {
        const gradient = ctx.createRadialGradient(
          btn.x + btn.width / 2, btn.y + btn.height / 2, 0,
          btn.x + btn.width / 2, btn.y + btn.height / 2, Math.max(btn.width, btn.height) / 2
        );
        gradient.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = gradient;
        this.roundRect(btn.x - 5, btn.y - 5, btn.width + 10, btn.height + 10, 10);
        ctx.fill();
      }

      const btnGradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
      btnGradient.addColorStop(0, COLORS.woodLight);
      btnGradient.addColorStop(1, COLORS.woodDark);

      ctx.fillStyle = btnGradient;
      this.roundRect(btn.x, btn.y, btn.width, btn.height, 5);
      ctx.fill();

      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      this.roundRect(btn.x, btn.y, btn.width, btn.height, 5);
      ctx.stroke();

      ctx.fillStyle = '#FFF8DC';
      ctx.font = `bold ${14 * this.scale}px 'Noto Serif SC', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);
    });
  }

  private drawRightPanel(): void {
    const ctx = this.ctx;
    const rightX = this.width * 0.6;
    const rightWidth = this.width * 0.4;

    const panelGradient = ctx.createLinearGradient(rightX, 0, rightX + rightWidth, 0);
    panelGradient.addColorStop(0, COLORS.woodDark);
    panelGradient.addColorStop(0.1, COLORS.woodMedium);
    panelGradient.addColorStop(1, COLORS.woodLight);

    ctx.fillStyle = panelGradient;
    ctx.fillRect(rightX, 0, rightWidth, this.height);

    this.drawLedger(rightX, rightWidth);
    this.drawBillInput(rightX, rightWidth);
    this.drawBalanceInfo(rightX, rightWidth);
  }

  private drawLedger(rightX: number, rightWidth: number): void {
    const ctx = this.ctx;
    const ledgerX = rightX + rightWidth * 0.1;
    const ledgerY = this.height * 0.05;
    const ledgerW = rightWidth * 0.8;
    const ledgerH = this.height * 0.5;

    const bambooColor = '#D4B896';
    const bambooDark = '#B8956E';

    const stripCount = 12;
    const stripHeight = ledgerH / stripCount;

    for (let i = 0; i < stripCount; i++) {
      const sy = ledgerY + i * stripHeight;
      const gradient = ctx.createLinearGradient(ledgerX, sy, ledgerX, sy + stripHeight);
      gradient.addColorStop(0, bambooColor);
      gradient.addColorStop(0.5, '#E8D4B8');
      gradient.addColorStop(1, bambooDark);

      ctx.fillStyle = gradient;
      this.roundRect(ledgerX, sy + 1, ledgerW, stripHeight - 2, 3);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ledgerX + 10, sy + stripHeight / 2);
      ctx.lineTo(ledgerX + ledgerW - 10, sy + stripHeight / 2);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.woodDark;
    ctx.fillRect(ledgerX - 8, ledgerY - 5, 4, ledgerH + 10);
    ctx.fillRect(ledgerX + ledgerW + 4, ledgerY - 5, 4, ledgerH + 10);

    ctx.fillStyle = COLORS.ink;
    ctx.font = `bold ${16 * this.scale}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'center';
    ctx.fillText('账 册', rightX + rightWidth / 2, ledgerY - 15);

    const state = this.engine.getState();
    const entriesToShow = state.ledger.slice(0, state.currentTimeIndex);

    ctx.fillStyle = COLORS.ink;
    ctx.font = `${10 * this.scale}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'left';

    const col1X = ledgerX + 8;
    const col2X = ledgerX + ledgerW * 0.35;
    const col3X = ledgerX + ledgerW * 0.7;
    const headerY = ledgerY + stripHeight * 0.65;

    ctx.font = `bold ${10 * this.scale}px 'Noto Serif SC', serif`;
    ctx.fillText('日期', col1X, headerY);
    ctx.fillText('摘要', col2X, headerY);
    ctx.fillText('变动', col3X, headerY);

    ctx.font = `${9 * this.scale}px 'Noto Serif SC', serif`;
    const startEntry = Math.max(0, entriesToShow.length - 8);
    for (let i = startEntry; i < entriesToShow.length; i++) {
      const entry = entriesToShow[i];
      const rowY = ledgerY + stripHeight * (i - startEntry + 1.65);

      const dateStr = this.engine.formatDate(entry.date).slice(5);
      ctx.fillText(dateStr, col1X, rowY);

      const summary = entry.summary.length > 8 ? entry.summary.slice(0, 8) + '...' : entry.summary;
      ctx.fillText(summary, col2X, rowY);

      const changeStr = entry.silverChange !== 0
        ? `${entry.silverChange > 0 ? '+' : ''}${entry.silverChange.toFixed(1)}两`
        : `${entry.copperChange > 0 ? '+' : ''}${entry.copperChange}文`;
      ctx.fillStyle = entry.silverChange > 0 || entry.copperChange > 0 ? '#228B22' : '#CC3333';
      ctx.fillText(changeStr, col3X, rowY);
      ctx.fillStyle = COLORS.ink;
    }
  }

  private drawBillInput(rightX: number, rightWidth: number): void {
    if (!this.billInputVisible) return;

    const ctx = this.ctx;
    const billY = this.height * 0.58;
    const billW = rightWidth * 0.8;
    const billH = this.height * 0.3;
    const billX = rightX + (rightWidth - billW) / 2;

    ctx.fillStyle = COLORS.paper;
    this.roundRect(billX, billY, billW, billH, 5);
    ctx.fill();

    ctx.strokeStyle = COLORS.cinnabar;
    ctx.lineWidth = 2;
    this.drawWaveBorder(billX, billY, billW, billH);

    ctx.fillStyle = COLORS.ink;
    ctx.font = `bold ${18 * this.scale}px 'Ma Shan Zheng', cursive`;
    ctx.textAlign = 'center';
    ctx.fillText('银票', billX + billW / 2, billY + billH * 0.12);

    ctx.font = `${12 * this.scale}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'left';
    ctx.fillText('金额(两):', billX + billW * 0.1, billY + billH * 0.3);

    const amountBoxX = billX + billW * 0.1;
    const amountBoxY = billY + billH * 0.35;
    const amountBoxW = billW * 0.8;
    const amountBoxH = billH * 0.12;

    ctx.fillStyle = '#FFF8DC';
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 1;
    this.roundRect(amountBoxX, amountBoxY, amountBoxW, amountBoxH, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.ink;
    ctx.font = `${14 * this.scale}px 'Ma Shan Zheng', cursive`;
    ctx.textAlign = 'left';
    const displayAmount = this.billInputAmount || '_';
    ctx.fillText(displayAmount, amountBoxX + 8, amountBoxY + amountBoxH * 0.7);

    const issuerY = billY + billH * 0.55;
    const issuerW = billW * 0.35;
    const issuerH = billH * 0.1;

    ['本号', '他号'].forEach((label, i) => {
      const ix = billX + billW * 0.1 + i * billW * 0.45;
      const isSelected = this.billInputIssuer === label;

      ctx.fillStyle = isSelected ? COLORS.cinnabar : COLORS.paperDark;
      this.roundRect(ix, issuerY, issuerW, issuerH, 3);
      ctx.fill();

      ctx.fillStyle = isSelected ? '#fff' : COLORS.ink;
      ctx.font = `${11 * this.scale}px 'Noto Serif SC', serif`;
      ctx.textAlign = 'center';
      ctx.fillText(label, ix + issuerW / 2, issuerY + issuerH * 0.65);
    });

    const submitBtnX = billX + billW * 0.2;
    const submitBtnY = billY + billH * 0.75;
    const submitBtnW = billW * 0.6;
    const submitBtnH = billH * 0.12;

    ctx.fillStyle = COLORS.cinnabar;
    this.roundRect(submitBtnX, submitBtnY, submitBtnW, submitBtnH, 5);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${12 * this.scale}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'center';
    ctx.fillText('签 发', submitBtnX + submitBtnW / 2, submitBtnY + submitBtnH * 0.68);

    const sealX = billX + billW * 0.7;
    const sealY = billY + billH * 0.7;
    const sealSize = billW * 0.15;
    this.drawSeal(sealX, sealY, sealSize, 0.6);
  }

  private drawSeal(x: number, y: number, size: number, alpha: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(-0.1);

    ctx.strokeStyle = COLORS.cinnabar;
    ctx.lineWidth = 3;
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    ctx.fillStyle = COLORS.cinnabar;
    ctx.font = `${size * 0.4}px 'Ma Shan Zheng', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('宝', 0, -size * 0.2);
    ctx.fillText('号', 0, size * 0.25);

    ctx.restore();
  }

  private drawWaveBorder(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    const amplitude = 4;
    const frequency = 20;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let px = x; px <= x + w; px += 2) {
      const py = y + Math.sin((px - x) / frequency * Math.PI * 2) * amplitude;
      ctx.lineTo(px, py);
    }

    for (let py = y; py <= y + h; py += 2) {
      const px = x + w + Math.sin((py - y) / frequency * Math.PI * 2) * amplitude;
      ctx.lineTo(px, py);
    }

    for (let px = x + w; px >= x; px -= 2) {
      const py = y + h + Math.sin((px - x) / frequency * Math.PI * 2) * amplitude;
      ctx.lineTo(px, py);
    }

    for (let py = y + h; py >= y; py -= 2) {
      const px = x + Math.sin((py - y) / frequency * Math.PI * 2) * amplitude;
      ctx.lineTo(px, py);
    }

    ctx.stroke();
  }

  private drawBalanceInfo(rightX: number, rightWidth: number): void {
    const ctx = this.ctx;
    const state = this.engine.getState();
    const verification = this.engine.verifyBalance();

    const infoY = this.height * 0.9;
    const infoX = rightX + rightWidth * 0.1;
    const infoW = rightWidth * 0.8;

    ctx.fillStyle = 'rgba(255, 248, 220, 0.5)';
    this.roundRect(infoX, infoY, infoW, this.height * 0.07, 5);
    ctx.fill();

    ctx.fillStyle = COLORS.ink;
    ctx.font = `${11 * this.scale}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'left';

    ctx.fillText(`铜钱: ${this.engine.formatNumber(state.copperBalance)}文`, infoX + 10, infoY + 18);
    ctx.fillText(`白银: ${this.engine.formatNumber(state.silverBalance)}两`, infoX + 10, infoY + 38);

    const balanceText = verification.balanced ? '账平' : `差${Math.abs(verification.difference).toFixed(1)}钱`;
    ctx.fillStyle = verification.balanced ? COLORS.success : COLORS.error;
    ctx.font = `bold ${13 * this.scale}px 'Noto Serif SC', serif`;
    ctx.textAlign = 'right';
    ctx.fillText(balanceText, infoX + infoW - 10, infoY + 28);
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

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
