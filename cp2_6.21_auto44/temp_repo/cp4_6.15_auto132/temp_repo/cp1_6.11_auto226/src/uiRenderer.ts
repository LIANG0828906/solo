import { GameState, Player, DiceValue, Position } from './gameState';
import {
  BOARD_SIZE, rollDice, getValidMoves, getMarkablePieces,
  applyDiceRoll, applyPieceMove, applyXiaoMark, isRiverPosition, isCornerPosition
} from './gameLogic';

const CORNER_AREAS = [
  { x0: 0, y0: 0, x1: 2, y1: 2 },
  { x0: 13, y0: 0, x1: 15, y1: 2 },
  { x0: 0, y0: 13, x1: 2, y1: 15 },
  { x0: 13, y0: 13, x1: 15, y1: 15 }
];

export class GameUI {
  private state: GameState;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 40;
  private padding: number = 40;
  private pieceRadius: number = 12;
  private audioCtx: AudioContext | null = null;
  private winAnimFrame: number = 0;
  private winAnimStart: number = 0;
  private isAnimating: boolean = false;

  constructor() {
    this.state = {
      currentPlayer: 'red',
      turnNumber: 1,
      diceRollCount: 0,
      pieces: [],
      diceHistory: [],
      moveHistory: [],
      currentDiceResult: null,
      gamePhase: 'rolling',
      winner: null,
      selectedPieceId: null,
      validMoves: []
    };
    this.state = this.createFreshState();

    this.canvas = document.getElementById('board-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
    this.bindEvents();
    this.render();
  }

  private createFreshState(): GameState {
    const RED_START: Position[] = [
      { x: 0, y: 13 }, { x: 1, y: 13 }, { x: 2, y: 13 },
      { x: 0, y: 14 }, { x: 1, y: 14 }, { x: 2, y: 14 }
    ];
    const BLUE_START: Position[] = [
      { x: 13, y: 0 }, { x: 14, y: 0 }, { x: 15, y: 0 },
      { x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }
    ];
    const pieces = [];
    RED_START.forEach((pos, i) => {
      pieces.push({ id: i, player: 'red', position: { ...pos }, startPosition: { ...pos }, isXiao: false });
    });
    BLUE_START.forEach((pos, i) => {
      pieces.push({ id: i + 6, player: 'blue', position: { ...pos }, startPosition: { ...pos }, isXiao: false });
    });
    return {
      currentPlayer: 'red', turnNumber: 1, diceRollCount: 0, pieces,
      diceHistory: [], moveHistory: [], currentDiceResult: null,
      gamePhase: 'rolling', winner: null, selectedPieceId: null, validMoves: []
    };
  }

  private setupCanvas(): void {
    const isMobile = window.innerWidth < 768;
    const baseSize = isMobile ? 440 : 660;
    this.cellSize = baseSize / (BOARD_SIZE + 1);
    this.padding = this.cellSize;
    this.pieceRadius = this.cellSize * 0.3;

    const canvasSize = this.cellSize * (BOARD_SIZE - 1) + this.padding * 2;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = canvasSize * dpr;
    this.canvas.height = canvasSize * dpr;
    this.canvas.style.width = canvasSize + 'px';
    this.canvas.style.height = canvasSize + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private posToPixel(pos: Position): { px: number; py: number } {
    return {
      px: this.padding + pos.x * this.cellSize,
      py: this.padding + pos.y * this.cellSize
    };
  }

  private pixelToPos(px: number, py: number): Position | null {
    const x = Math.round((px - this.padding) / this.cellSize);
    const y = Math.round((py - this.padding) / this.cellSize);
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return null;
    const { px: snapX, py: snapY } = this.posToPixel({ x, y });
    const dist = Math.sqrt((px - snapX) ** 2 + (py - snapY) ** 2);
    if (dist > this.cellSize * 0.45) return null;
    return { x, y };
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('touchend', (e) => this.handleCanvasTouch(e));

    const rollBtn = document.getElementById('roll-btn')!;
    rollBtn.addEventListener('click', () => this.handleRollDice());

    const restartBtn = document.getElementById('restart-btn')!;
    restartBtn.addEventListener('click', () => this.resetGame());

    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.render();
    });
  }

  private getCanvasCoords(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private handleCanvasClick(e: MouseEvent): void {
    if (this.state.gamePhase === 'ended' || this.isAnimating) return;
    const { x, y } = this.getCanvasCoords(e);
    this.processBoardClick(x, y);
  }

  private handleCanvasTouch(e: TouchEvent): void {
    if (this.state.gamePhase === 'ended' || this.isAnimating) return;
    e.preventDefault();
    const touch = e.changedTouches[0];
    const rect = this.canvas.getBoundingClientRect();
    this.processBoardClick(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  private processBoardClick(px: number, py: number): void {
    const clickedPos = this.pixelToPos(px, py);
    if (!clickedPos) return;

    if (this.state.gamePhase === 'marking') {
      const clickedPiece = this.state.pieces.find(
        p => p.position.x === clickedPos.x && p.position.y === clickedPos.y
      );
      if (clickedPiece && clickedPiece.player === this.state.currentPlayer && !clickedPiece.isXiao) {
        this.playClickSound();
        this.state = applyXiaoMark(this.state, clickedPiece.id);
        this.addHistoryEntry(`mark`, clickedPiece.id);
        this.updateUI();
        this.render();
        if (this.state.winner) this.handleWin();
      }
      return;
    }

    if (this.state.gamePhase === 'moving') {
      const isValidTarget = this.state.validMoves.some(
        m => m.x === clickedPos.x && m.y === clickedPos.y
      );

      if (isValidTarget && this.state.selectedPieceId !== null) {
        this.playClickSound();
        const pieceId = this.state.selectedPieceId;
        this.state = applyPieceMove(this.state, pieceId, clickedPos);
        this.addHistoryEntry(`move`, pieceId);
        this.updateUI();
        this.render();
        if (this.state.winner) this.handleWin();
        return;
      }

      const clickedPiece = this.state.pieces.find(
        p => p.position.x === clickedPos.x && p.position.y === clickedPos.y &&
             p.player === this.state.currentPlayer
      );

      if (clickedPiece) {
        this.playClickSound();
        const moves = getValidMoves(this.state, clickedPiece.id);
        this.state = { ...this.state, selectedPieceId: clickedPiece.id, validMoves: moves };
        this.render();
        return;
      }

      this.state = { ...this.state, selectedPieceId: null, validMoves: [] };
      this.render();
    }
  }

  private async handleRollDice(): Promise<void> {
    if (this.state.gamePhase !== 'rolling' || this.isAnimating) return;

    const rollBtn = document.getElementById('roll-btn')! as HTMLButtonElement;
    rollBtn.disabled = true;
    rollBtn.classList.add('shake');
    setTimeout(() => rollBtn.classList.remove('shake'), 300);

    const result = rollDice();
    this.isAnimating = true;
    await this.animateDice(result);
    this.isAnimating = false;

    this.state = applyDiceRoll(this.state, result);
    this.addHistoryEntry(`dice`, result);
    this.updateUI();
    this.render();

    rollBtn.disabled = false;

    if (this.state.gamePhase === 'marking') {
      this.updateResultBar(`投出【枭】！请选择一枚棋子标记枭状态`);
    }
  }

  private animateDice(result: DiceValue): Promise<void> {
    return new Promise((resolve) => {
      const diceEl = document.getElementById('dice-element')!;
      diceEl.textContent = result === 'xiao' ? '枭' : String(result);
      diceEl.style.opacity = '0';
      diceEl.style.transform = 'scale(0)';
      diceEl.classList.remove('animating');

      void diceEl.offsetWidth;

      diceEl.classList.add('animating');

      setTimeout(() => {
        diceEl.classList.remove('animating');
        diceEl.style.opacity = '0';
        diceEl.style.transform = 'scale(0)';
        resolve();
      }, 1800);
    });
  }

  private playClickSound(): void {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      const ctx = this.audioCtx;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    } catch (_) { /* ignore audio errors */ }
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    this.drawBoardBackground(ctx, w, h);
    this.drawRiver(ctx);
    this.drawCornerAreas(ctx);
    this.drawGridLines(ctx);
    this.drawIntersectionDots(ctx);
    this.drawHighlights(ctx);
    this.drawPieces(ctx);
    this.drawSelectionIndicator(ctx);
  }

  private drawBoardBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = '#E8D5B7';
    ctx.fillRect(0, 0, w, h);

    const grainGrad = ctx.createLinearGradient(0, 0, w, h);
    grainGrad.addColorStop(0, 'rgba(139,90,43,0.06)');
    grainGrad.addColorStop(0.3, 'rgba(139,90,43,0.02)');
    grainGrad.addColorStop(0.6, 'rgba(139,90,43,0.06)');
    grainGrad.addColorStop(1, 'rgba(139,90,43,0.02)');
    ctx.fillStyle = grainGrad;
    ctx.fillRect(0, 0, w, h);
  }

  private drawRiver(ctx: CanvasRenderingContext2D): void {
    const tl = this.posToPixel({ x: 7, y: 7 });
    const br = this.posToPixel({ x: 8, y: 8 });
    const half = this.cellSize / 2;
    const x = tl.px - half;
    const y = tl.py - half;
    const size = br.px - tl.px + this.cellSize;

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = 'rgba(135,206,235,0.3)';
    ctx.fillRect(x, y, size, size);

    const waveGrad = ctx.createLinearGradient(x, y, x, y + size);
    waveGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
    waveGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
    waveGrad.addColorStop(1, 'rgba(255,255,255,0.1)');
    ctx.fillStyle = waveGrad;
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = 'rgba(70,130,180,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }

  private drawCornerAreas(ctx: CanvasRenderingContext2D): void {
    for (const corner of CORNER_AREAS) {
      const tl = this.posToPixel({ x: corner.x0, y: corner.y0 });
      const br = this.posToPixel({ x: corner.x1, y: corner.y1 });
      const half = this.cellSize / 2;
      const x = tl.px - half;
      const y = tl.py - half;
      const w = br.px - tl.px + this.cellSize;
      const h = br.py - tl.py + this.cellSize;

      ctx.fillStyle = '#D2B48C';
      ctx.fillRect(x, y, w, h);

      const innerGrad = ctx.createRadialGradient(
        x + w / 2, y + h / 2, 0,
        x + w / 2, y + h / 2, Math.max(w, h) * 0.7
      );
      innerGrad.addColorStop(0, 'rgba(210,180,140,0.3)');
      innerGrad.addColorStop(1, 'rgba(139,90,43,0.1)');
      ctx.fillStyle = innerGrad;
      ctx.fillRect(x, y, w, h);

      ctx.strokeStyle = '#8B5A2B';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    }
  }

  private drawGridLines(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(139,0,0,0.35)';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      const start = this.posToPixel({ x: i, y: 0 });
      const end = this.posToPixel({ x: i, y: BOARD_SIZE - 1 });
      ctx.beginPath();
      ctx.moveTo(start.px, start.py);
      ctx.lineTo(end.px, end.py);
      ctx.stroke();

      const startH = this.posToPixel({ x: 0, y: i });
      const endH = this.posToPixel({ x: BOARD_SIZE - 1, y: i });
      ctx.beginPath();
      ctx.moveTo(startH.px, startH.py);
      ctx.lineTo(endH.px, endH.py);
      ctx.stroke();
    }
  }

  private drawIntersectionDots(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(80,20,20,0.5)';
    for (let x = 0; x < BOARD_SIZE; x++) {
      for (let y = 0; y < BOARD_SIZE; y++) {
        const { px, py } = this.posToPixel({ x, y });
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawHighlights(ctx: CanvasRenderingContext2D): void {
    if (this.state.gamePhase !== 'moving' || this.state.validMoves.length === 0) return;

    for (const move of this.state.validMoves) {
      const { px, py } = this.posToPixel(move);
      ctx.beginPath();
      ctx.arc(px, py, this.pieceRadius + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,136,0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,255,136,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (this.state.gamePhase === 'marking') {
      const markable = getMarkablePieces(this.state);
      for (const piece of markable) {
        const { px, py } = this.posToPixel(piece.position);
        ctx.beginPath();
        ctx.arc(px, py, this.pieceRadius + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,215,0,0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    for (const piece of this.state.pieces) {
      this.drawSinglePiece(ctx, piece);
    }
  }

  private drawSinglePiece(ctx: CanvasRenderingContext2D, piece: { id: number; player: Player; position: Position; isXiao: boolean }): void {
    const { px, py } = this.posToPixel(piece.position);
    const r = this.pieceRadius;

    const isSelected = this.state.selectedPieceId === piece.id;

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(px, py, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.closePath();

    const baseColor = piece.player === 'red' ? '#B22222' : '#191970';
    const lightColor = piece.player === 'red' ? '#E85050' : '#4040A0';
    const darkColor = piece.player === 'red' ? '#801010' : '#0E0E40';

    const grad = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, r * 0.1, px, py, r);
    grad.addColorStop(0, lightColor);
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, darkColor);

    ctx.fillStyle = grad;
    ctx.fill();

    const highlightGrad = ctx.createRadialGradient(px - r * 0.35, py - r * 0.35, 0, px - r * 0.2, py - r * 0.2, r * 0.6);
    highlightGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
    highlightGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = highlightGrad;
    ctx.fill();

    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    if (piece.isXiao) {
      const glowR = r + 5;
      const glowGrad = ctx.createRadialGradient(px, py, r, px, py, glowR);
      glowGrad.addColorStop(0, 'rgba(255,215,0,0.6)');
      glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, r + 1, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  private drawSelectionIndicator(ctx: CanvasRenderingContext2D): void {
    if (this.state.gamePhase === 'marking') {
      const markable = getMarkablePieces(this.state);
      for (const piece of markable) {
        const { px, py } = this.posToPixel(piece.position);
        ctx.beginPath();
        ctx.arc(px, py, this.pieceRadius + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,215,0,0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  private updateUI(): void {
    this.updateTurnInfo();
    this.updateResultBar(this.getDefaultHint());
    this.updateRollButton();
  }

  private updateTurnInfo(): void {
    const turnInfo = document.getElementById('turn-info')!;
    if (this.state.gamePhase === 'ended') {
      turnInfo.textContent = '对弈结束';
    } else {
      const playerName = this.state.currentPlayer === 'red' ? '赤方' : '玄方';
      turnInfo.textContent = `第${this.state.turnNumber}回合 · ${playerName}行棋`;
    }
  }

  private getDefaultHint(): string {
    switch (this.state.gamePhase) {
      case 'rolling': return '请投琼以开始回合';
      case 'moving':
        if (this.state.selectedPieceId !== null) {
          return '点击高亮位置移动棋子，或点击其他己方棋子重新选择';
        }
        return '请点击己方棋子选择走棋';
      case 'marking': return '请点击一枚棋子赋予枭状态';
      case 'ended': return '对弈已结束';
      default: return '';
    }
  }

  private updateResultBar(text?: string): void {
    const bar = document.getElementById('result-bar')!;
    if (text) {
      bar.textContent = text;
    }
  }

  private updateRollButton(): void {
    const btn = document.getElementById('roll-btn')! as HTMLButtonElement;
    btn.disabled = this.state.gamePhase !== 'rolling';
  }

  private addHistoryEntry(type: 'dice' | 'move' | 'mark', data: DiceValue | number): void {
    const panel = document.getElementById('history-panel')!;
    const entry = document.createElement('div');
    entry.className = 'history-entry';

    const playerName = this.state.currentPlayer === 'red' ? '赤' : '玄';
    const playerClass = this.state.currentPlayer === 'red' ? 'history-red' : 'history-blue';

    if (type === 'dice') {
      const val = data as DiceValue;
      if (val === 'xiao') {
        entry.innerHTML = `<span class="${playerClass}">${playerName}</span> 投琼: <span class="history-xiao">枭</span>`;
      } else {
        entry.innerHTML = `<span class="${playerClass}">${playerName}</span> 投琼: ${val}`;
      }
    } else if (type === 'move') {
      const pieceId = data as number;
      const piece = this.state.pieces.find(p => p.id === pieceId);
      if (piece) {
        entry.innerHTML = `<span class="${playerClass}">${playerName}</span> 移棋至(${piece.position.x},${piece.position.y})`;
      }
    } else if (type === 'mark') {
      const pieceId = data as number;
      entry.innerHTML = `<span class="${playerClass}">${playerName}</span> <span class="history-xiao">成枭标记</span>`;
    }

    panel.appendChild(entry);
    panel.scrollTop = panel.scrollHeight;
  }

  private handleWin(): void {
    if (!this.state.winner) return;
    const winName = this.state.winner === 'red' ? '赤' : '玄';
    this.updateResultBar(`${winName}方成枭，大获全胜！`);

    const dialog = document.getElementById('win-dialog')!;
    const winText = document.getElementById('win-text')!;
    winText.textContent = `${winName}方成枭，大获全胜！`;
    dialog.classList.add('visible');

    this.startWinAnimation();
  }

  private startWinAnimation(): void {
    this.winAnimStart = performance.now();
    this.animateWin();
  }

  private animateWin(): void {
    if (this.state.gamePhase !== 'ended') return;

    const now = performance.now();
    const elapsed = now - this.winAnimStart;
    const cycle = 1500;
    const t = (elapsed % cycle) / cycle;
    const glowIntensity = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;

    this.render();

    const ctx = this.ctx;
    if (this.state.winner) {
      const winnerPieces = this.state.pieces.filter(p => p.player === this.state.winner);
      for (const piece of winnerPieces) {
        const { px, py } = this.posToPixel(piece.position);
        const glowR = this.pieceRadius + 8 + glowIntensity * 6;
        const glowGrad = ctx.createRadialGradient(px, py, this.pieceRadius, px, py, glowR);
        glowGrad.addColorStop(0, `rgba(255,215,0,${0.3 + glowIntensity * 0.5})`);
        glowGrad.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
      }
    }

    this.winAnimFrame = requestAnimationFrame(() => this.animateWin());
  }

  private stopWinAnimation(): void {
    if (this.winAnimFrame) {
      cancelAnimationFrame(this.winAnimFrame);
      this.winAnimFrame = 0;
    }
  }

  private resetGame(): void {
    this.stopWinAnimation();
    this.state = this.createFreshState();

    const dialog = document.getElementById('win-dialog')!;
    dialog.classList.remove('visible');

    const panel = document.getElementById('history-panel')!;
    const entries = panel.querySelectorAll('.history-entry');
    entries.forEach(e => e.remove());

    this.updateUI();
    this.render();
  }
}
