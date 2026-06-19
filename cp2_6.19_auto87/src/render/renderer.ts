import { Board, CellPosition } from '../game/board';
import { PlayerManager, PlayerId } from '../game/player';
import { Card, getSuitSymbol, getRankDisplay, getSuitColor } from '../game/deck';
import { Animator, Easing, lerp, lerpAngle, clamp } from './animator';
import { AudioManager } from '../utils/audio';

interface LayoutState {
  boardX: number;
  boardY: number;
  cellSize: number;
  boardSize: number;
  redHandX: number;
  redHandY: number;
  blueHandX: number;
  blueHandY: number;
  handCardWidth: number;
  handCardHeight: number;
  handFanAngle: number;
  isMobile: boolean;
}

interface FlyingCard {
  id: string;
  card: Card;
  player: PlayerId;
  startX: number;
  startY: number;
  startRotation: number;
  targetX: number;
  targetY: number;
  targetRow: number;
  targetCol: number;
  progress: number;
  duration: number;
  currentX: number;
  currentY: number;
  currentRotation: number;
  currentScale: number;
  arcHeight: number;
  settled: boolean;
  settleProgress: number;
}

interface RippleEffect {
  x: number;
  y: number;
  maxRadius: number;
  progress: number;
  duration: number;
  color: string;
  player: PlayerId;
}

interface TurnIndicatorState {
  player: PlayerId;
  progress: number;
  duration: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  rotation: number;
}

interface ScoreDigit {
  value: number;
  prevValue: number;
  progress: number;
}

interface CardSettleAnim {
  row: number;
  col: number;
  progress: number;
  duration: number;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private board: Board;
  private playerManager: PlayerManager;
  private animator: Animator;
  private audio: AudioManager;

  private layout: LayoutState;
  private selectedCardId: string | null = null;
  private hoveredCell: CellPosition | null = null;

  private flyingCards: FlyingCard[] = [];
  private rippleEffects: RippleEffect[] = [];
  private turnIndicator: TurnIndicatorState | null = null;
  private cardSettleAnims: CardSettleAnim[] = [];

  private lastScores: Record<PlayerId, number> = { red: 0, blue: 0 };
  private scoreDigits: Record<PlayerId, { hundreds: ScoreDigit; tens: ScoreDigit; ones: ScoreDigit }>;

  private frameTimes: number[] = [];
  private fps: number = 60;
  private frameTimeAvg: number = 0;
  private showFPS: boolean = false;

  private animationId: number = 0;
  private lastTime: number = 0;

  private turnFadeProgress: number = 1;
  private isSwitchingTurn: boolean = false;

  constructor(
    canvas: HTMLCanvasElement,
    board: Board,
    playerManager: PlayerManager,
    animator: Animator,
    audio: AudioManager
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.board = board;
    this.playerManager = playerManager;
    this.animator = animator;
    this.audio = audio;

    this.layout = this.calculateLayout();

    this.scoreDigits = {
      red: {
        hundreds: { value: 0, prevValue: 0, progress: 1 },
        tens: { value: 0, prevValue: 0, progress: 1 },
        ones: { value: 0, prevValue: 0, progress: 1 }
      },
      blue: {
        hundreds: { value: 0, prevValue: 0, progress: 1 },
        tens: { value: 0, prevValue: 0, progress: 1 },
        ones: { value: 0, prevValue: 0, progress: 1 }
      }
    };

    this.setupEventListeners();
    this.updateScoreDisplay();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  private handleResize(): void {
    this.resizeCanvas();
    this.layout = this.calculateLayout();
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
  }

  private calculateLayout(): LayoutState {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isMobile = screenWidth < 768;

    const topPadding = 80;
    const bottomPadding = 20;
    const sidePadding = 20;

    let boardSize: number;
    let boardX: number;
    let boardY: number;
    let cellSize: number;

    if (isMobile) {
      const maxBoardWidth = screenWidth - sidePadding * 2;
      const maxBoardHeight = screenHeight - topPadding - 200;
      boardSize = Math.min(maxBoardWidth, maxBoardHeight);
      boardX = (screenWidth - boardSize) / 2;
      boardY = topPadding;
      cellSize = boardSize / 8;
    } else {
      const handAreaWidth = 180;
      const availableWidth = screenWidth - handAreaWidth * 2 - sidePadding * 2;
      const availableHeight = screenHeight - topPadding - bottomPadding;
      boardSize = Math.min(availableWidth, availableHeight);
      boardX = (screenWidth - boardSize) / 2;
      boardY = topPadding + (availableHeight - boardSize) / 2;
      cellSize = boardSize / 8;
    }

    const handCardWidth = isMobile ? cellSize * 0.7 : cellSize * 0.8;
    const handCardHeight = handCardWidth * 1.4;
    const handFanAngle = isMobile ? Math.PI / 3 : Math.PI / 2;

    let redHandX: number, redHandY: number;
    let blueHandX: number, blueHandY: number;

    if (isMobile) {
      redHandX = screenWidth / 2;
      redHandY = screenHeight - 100;
      blueHandX = screenWidth / 2;
      blueHandY = topPadding + boardSize + 60;
    } else {
      const handAreaWidth = 180;
      redHandX = sidePadding + handAreaWidth / 2;
      redHandY = screenHeight / 2;
      blueHandX = screenWidth - sidePadding - handAreaWidth / 2;
      blueHandY = screenHeight / 2;
    }

    return {
      boardX,
      boardY,
      cellSize,
      boardSize,
      redHandX,
      redHandY,
      blueHandX,
      blueHandY,
      handCardWidth,
      handCardHeight,
      handFanAngle,
      isMobile
    };
  }

  start(): void {
    this.resizeCanvas();
    this.layout = this.calculateLayout();
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop(): void {
    cancelAnimationFrame(this.animationId);
  }

  private gameLoop(): void {
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.frameTimes.push(now);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }
    const fps = 1000 / ((now - this.frameTimes[0]) / this.frameTimes.length);
    this.fps = fps;
    this.frameTimeAvg = deltaTime * 1000;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    this.animator.update(deltaTime);

    this.updateFlyingCards(deltaTime);
    this.updateRippleEffects(deltaTime);
    this.updateTurnIndicator(deltaTime);
    this.updateCardSettle(deltaTime);
    this.updateScoreAnimations(deltaTime);

    if (this.isSwitchingTurn) {
      this.turnFadeProgress -= deltaTime / 0.15;
      if (this.turnFadeProgress <= 0) {
        this.turnFadeProgress = 0;
        this.isSwitchingTurn = false;
        this.playerManager.switchPlayer();
        this.selectedCardId = null;
        this.showTurnIndicator();
        this.turnFadeProgress = 1;
      }
    }
  }

  private updateFlyingCards(deltaTime: number): void {
    for (let i = this.flyingCards.length - 1; i >= 0; i--) {
      const fc = this.flyingCards[i];

      if (!fc.settled) {
        fc.progress += deltaTime / fc.duration;

        if (fc.progress >= 1) {
          fc.progress = 1;
          fc.settled = true;
          fc.settleProgress = 0;
          this.audio.playCardDrop();

          this.cardSettleAnims.push({
            row: fc.targetRow,
            col: fc.targetCol,
            progress: 0,
            duration: 0.3
          });
        }

        const t = Easing.easeOutQuad(fc.progress);
        fc.currentX = lerp(fc.startX, fc.targetX, t);
        fc.currentY = lerp(fc.startY, fc.targetY, t) - Math.sin(t * Math.PI) * fc.arcHeight;
        fc.currentRotation = lerpAngle(fc.startRotation, 0, t);
        fc.currentScale = lerp(1, 0.9, t);
      } else {
        fc.settleProgress += deltaTime / 0.3;

        if (fc.settleProgress >= 1) {
          this.flyingCards.splice(i, 1);
        }
      }
    }
  }

  private updateRippleEffects(deltaTime: number): void {
    for (let i = this.rippleEffects.length - 1; i >= 0; i--) {
      const ripple = this.rippleEffects[i];
      ripple.progress += deltaTime / ripple.duration;

      if (ripple.progress >= 1) {
        this.rippleEffects.splice(i, 1);
      }
    }
  }

  private updateTurnIndicator(deltaTime: number): void {
    if (!this.turnIndicator) return;

    this.turnIndicator.progress += deltaTime / this.turnIndicator.duration;
    this.turnIndicator.rotation += deltaTime * Math.PI * 0.8;

    if (this.turnIndicator.progress >= 1) {
      this.turnIndicator = null;
    }
  }

  private updateCardSettle(deltaTime: number): void {
    for (let i = this.cardSettleAnims.length - 1; i >= 0; i--) {
      const anim = this.cardSettleAnims[i];
      anim.progress += deltaTime / anim.duration;

      if (anim.progress >= 1) {
        this.cardSettleAnims.splice(i, 1);
      }
    }
  }

  private updateScoreAnimations(deltaTime: number): void {
    const animSpeed = 1 / 0.3;

    for (const playerId of ['red', 'blue'] as PlayerId[]) {
      const digits = this.scoreDigits[playerId];
      for (const key of ['hundreds', 'tens', 'ones'] as const) {
        const digit = digits[key];
        if (digit.progress < 1) {
          digit.progress += deltaTime * animSpeed;
          if (digit.progress > 1) digit.progress = 1;
        }
      }
    }
  }

  private render(): void {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    this.drawBackground();
    // this.drawScoreboard();
    this.drawBoard();
    this.drawBoardCards();
    this.drawRippleEffects();
    this.drawCellGlows();
    this.drawFlyingCards();
    this.drawHands();
    this.drawTurnIndicator();

    if (this.showFPS) {
      this.drawFPS();
    }
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    gradient.addColorStop(0, '#1a4d2e');
    gradient.addColorStop(0.5, '#0d3320');
    gradient.addColorStop(1, '#071a10');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 200; i++) {
      const x = (i * 137.5) % w;
      const y = (i * 89.3) % h;
      const size = 1 + (i % 3) * 0.5;
      ctx.fillStyle = i % 2 === 0 ? '#000' : '#fff';
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
  }

  private drawScoreboard(): void {
    const ctx = this.ctx;
    const w = window.innerWidth;

    const boardHeight = 70;
    const boardY = 10;

    ctx.save();

    ctx.fillStyle = 'rgba(20, 60, 35, 0.9)';
    this.roundRect(ctx, 20, boardY, w - 40, boardHeight, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(80, 140, 100, 0.5)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 20, boardY, w - 40, boardHeight, 10);
    ctx.stroke();

    const centerX = w / 2;
    const scoreY = boardY + boardHeight / 2;

    const redScore = this.board.getScore('red');
    const blueScore = this.board.getScore('blue');

    const digitWidth = 22;
    const digitHeight = 32;
    const digitGap = 3;

    const redDigits = this.scoreDigits.red;
    const redStartX = centerX - 140;
    this.drawFlipDigit(ctx, redStartX, scoreY - digitHeight / 2, digitWidth, digitHeight, redDigits.hundreds, '#ff5252');
    this.drawFlipDigit(ctx, redStartX + digitWidth + digitGap, scoreY - digitHeight / 2, digitWidth, digitHeight, redDigits.tens, '#ff5252');
    this.drawFlipDigit(ctx, redStartX + (digitWidth + digitGap) * 2, scoreY - digitHeight / 2, digitWidth, digitHeight, redDigits.ones, '#ff5252');

    const blueDigits = this.scoreDigits.blue;
    const blueStartX = centerX + 140 - digitWidth * 3 - digitGap * 2;
    this.drawFlipDigit(ctx, blueStartX, scoreY - digitHeight / 2, digitWidth, digitHeight, blueDigits.hundreds, '#448aff');
    this.drawFlipDigit(ctx, blueStartX + digitWidth + digitGap, scoreY - digitHeight / 2, digitWidth, digitHeight, blueDigits.tens, '#448aff');
    this.drawFlipDigit(ctx, blueStartX + (digitWidth + digitGap) * 2, scoreY - digitHeight / 2, digitWidth, digitHeight, blueDigits.ones, '#448aff');

    ctx.fillStyle = '#f0e6d2';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText('红方', redStartX - 12, scoreY);

    ctx.textAlign = 'left';
    ctx.fillText('蓝方', blueStartX + digitWidth * 3 + digitGap * 2 + 12, scoreY);
    ctx.shadowBlur = 0;

    this.drawScoreCubes(ctx, redStartX - 70, scoreY, 'red', redScore);
    this.drawScoreCubes(ctx, blueStartX + digitWidth * 3 + digitGap * 2 + 45, scoreY, 'blue', blueScore);

    ctx.restore();
  }

  private drawScoreCubes(ctx: CanvasRenderingContext2D, x: number, y: number, playerId: PlayerId, count: number): void {
    const cubeSize = 6;
    const gap = 2;
    const cubesPerRow = 5;
    const displayCount = Math.min(count, 20);

    const color = playerId === 'red' ? '#e53935' : '#1e88e5';
    const glowColor = playerId === 'red' ? 'rgba(229, 57, 53, 0.5)' : 'rgba(30, 136, 229, 0.5)';

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 3;
    ctx.fillStyle = color;

    const rows = Math.ceil(displayCount / cubesPerRow);
    const startY = y - (rows * (cubeSize + gap) - gap) / 2;

    for (let i = 0; i < displayCount; i++) {
      const col = i % cubesPerRow;
      const row = Math.floor(i / cubesPerRow);
      const cx = x + col * (cubeSize + gap);
      const cy = startY + row * (cubeSize + gap);
      ctx.fillRect(cx, cy, cubeSize, cubeSize);
    }

    ctx.restore();
  }

  private drawFlipDigit(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    digit: ScoreDigit,
    color: string
  ): void {
    const progress = digit.progress;
    const prevValue = digit.prevValue;
    const value = digit.value;

    ctx.save();

    ctx.fillStyle = 'rgba(15, 40, 25, 0.9)';
    this.roundRect(ctx, x, y, width, height, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, width, height, 4);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    if (progress >= 1) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      ctx.fillText(String(value), centerX, centerY);
    } else if (progress < 0.5) {
      const flipProgress = progress * 2;
      const scaleY = Math.cos(flipProgress * Math.PI / 2);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height / 2);
      ctx.clip();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(1, scaleY);
      ctx.translate(-centerX, -centerY);
      ctx.fillText(String(prevValue), centerX, centerY);
      ctx.restore();

      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y + height / 2, width, height / 2);
      ctx.clip();
      ctx.fillText(String(prevValue), centerX, centerY);
      ctx.restore();
    } else {
      const flipProgress = (progress - 0.5) * 2;
      const scaleY = Math.sin(flipProgress * Math.PI / 2);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height / 2);
      ctx.clip();
      ctx.fillText(String(value), centerX, centerY);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y + height / 2, width, height / 2);
      ctx.clip();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(1, scaleY);
      ctx.translate(-centerX, -centerY);
      ctx.fillText(String(value), centerX, centerY);
      ctx.restore();

      ctx.restore();
    }

    ctx.restore();
  }

  private drawBoard(): void {
    const ctx = this.ctx;
    const layout = this.layout;
    const boardSize = this.board.getSize();

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = '#2d5a3d';
    this.roundRect(ctx, layout.boardX - 8, layout.boardY - 8, layout.boardSize + 16, layout.boardSize + 16, 8);
    ctx.fill();

    ctx.restore();

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const x = layout.boardX + col * layout.cellSize;
        const y = layout.boardY + row * layout.cellSize;
        const isLight = (row + col) % 2 === 0;

        ctx.fillStyle = isLight ? '#4a8c5e' : '#3d7a4f';

        if (this.hoveredCell && this.hoveredCell.row === row && this.hoveredCell.col === col) {
          if (this.board.isCellEmpty(row, col) && this.selectedCardId) {
            ctx.fillStyle = '#6bb37c';
          }
        }

        ctx.fillRect(x + 1, y + 1, layout.cellSize - 2, layout.cellSize - 2);

        ctx.save();
        ctx.globalAlpha = 0.1;
        const cellGrad = ctx.createLinearGradient(x, y, x, y + layout.cellSize);
        cellGrad.addColorStop(0, '#fff');
        cellGrad.addColorStop(1, '#000');
        ctx.fillStyle = cellGrad;
        ctx.fillRect(x + 1, y + 1, layout.cellSize - 2, layout.cellSize - 2);
        ctx.restore();
      }
    }
  }

  private drawBoardCards(): void {
    const ctx = this.ctx;
    const layout = this.layout;
    const boardSize = this.board.getSize();

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const cell = this.board.getCell(row, col);
        if (cell.card && cell.owner) {
          const x = layout.boardX + col * layout.cellSize;
          const y = layout.boardY + row * layout.cellSize;

          let scale = 1;
          let offsetY = 0;

          const settleAnim = this.cardSettleAnims.find(a => a.row === row && a.col === col);
          if (settleAnim) {
            const t = settleAnim.progress;
            const wobble = Math.sin(t * Math.PI * 3) * (1 - t) * 3;
            scale = 1 - Math.sin(t * Math.PI) * 0.1;
            offsetY = wobble;
          }

          this.drawCard(
            ctx,
            x + layout.cellSize / 2,
            y + layout.cellSize / 2 + offsetY,
            layout.cellSize * 0.85 * scale,
            layout.cellSize * 1.2 * scale,
            cell.card,
            cell.owner,
            0
          );
        }
      }
    }
  }

  private drawCard(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    card: Card,
    owner?: PlayerId,
    rotation: number = 0,
    alpha: number = 1
  ): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);

    const w = width;
    const h = height;
    const halfW = w / 2;
    const halfH = h / 2;
    const radius = w * 0.1;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    const bgGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
    bgGrad.addColorStop(0, '#fffef8');
    bgGrad.addColorStop(0.5, '#f5f0e6');
    bgGrad.addColorStop(1, '#ebe5d8');

    ctx.fillStyle = bgGrad;
    this.roundRect(ctx, -halfW, -halfH, w, h, radius);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = owner === 'red' ? '#c62828' : owner === 'blue' ? '#1565c0' : '#888';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, -halfW + 1, -halfH + 1, w - 2, h - 2, radius - 1);
    ctx.stroke();

    const suitColor = getSuitColor(card.suit);
    const textColor = suitColor === 'red' ? '#c62828' : '#222';
    const suitSymbol = getSuitSymbol(card.suit);
    const rankDisplay = getRankDisplay(card.rank);

    const fontSize = w * 0.22;
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cornerOffset = w * 0.18;

    ctx.save();
    ctx.translate(-halfW + cornerOffset, -halfH + cornerOffset);
    ctx.scale(0.7, 0.7);
    ctx.fillText(rankDisplay, 0, -fontSize * 0.4);
    ctx.fillText(suitSymbol, 0, fontSize * 0.5);
    ctx.restore();

    ctx.save();
    ctx.translate(halfW - cornerOffset, halfH - cornerOffset);
    ctx.rotate(Math.PI);
    ctx.scale(0.7, 0.7);
    ctx.fillText(rankDisplay, 0, -fontSize * 0.4);
    ctx.fillText(suitSymbol, 0, fontSize * 0.5);
    ctx.restore();

    const bigSuitSize = fontSize * 2.2;
    ctx.font = `${bigSuitSize}px serif`;
    ctx.fillText(suitSymbol, 0, 0);

    ctx.restore();
  }

  private drawCellGlows(): void {
    const ctx = this.ctx;
    const layout = this.layout;

    for (const playerId of ['red', 'blue'] as PlayerId[]) {
      const cells = this.board.getConsecutiveSuitCells(playerId);
      const color = playerId === 'red' ? '#ff5252' : '#448aff';

      for (const pos of cells) {
        const x = layout.boardX + pos.col * layout.cellSize + layout.cellSize / 2;
        const y = layout.boardY + pos.row * layout.cellSize + layout.cellSize / 2;

        ctx.save();
        const glowSize = layout.cellSize * 0.6;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(0.5, color + '20');
        gradient.addColorStop(1, color + '00');

        ctx.fillStyle = gradient;
        ctx.fillRect(
          x - glowSize,
          y - glowSize,
          glowSize * 2,
          glowSize * 2
        );
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = color + '80';
        ctx.lineWidth = 2;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.strokeRect(
          layout.boardX + pos.col * layout.cellSize + 3,
          layout.boardY + pos.row * layout.cellSize + 3,
          layout.cellSize - 6,
          layout.cellSize - 6
        );
        ctx.restore();
      }
    }
  }

  private drawRippleEffects(): void {
    const ctx = this.ctx;

    for (const ripple of this.rippleEffects) {
      const t = ripple.progress;
      const eased = Easing.easeOutQuad(t);
      const radius = ripple.maxRadius * eased;
      const alpha = 1 - t;

      ctx.save();
      ctx.globalAlpha = alpha * 0.8;

      const gradient = ctx.createRadialGradient(ripple.x, ripple.y, 0, ripple.x, ripple.y, radius);
      gradient.addColorStop(0, ripple.color + '00');
      gradient.addColorStop(0.7, ripple.color + '40');
      gradient.addColorStop(1, ripple.color + '00');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ripple.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius * 0.8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  private drawFlyingCards(): void {
    const ctx = this.ctx;

    for (const fc of this.flyingCards) {
      this.drawCard(
        ctx,
        fc.currentX,
        fc.currentY,
        this.layout.handCardWidth * fc.currentScale,
        this.layout.handCardHeight * fc.currentScale,
        fc.card,
        fc.player,
        fc.currentRotation
      );
    }
  }

  private drawHands(): void {
    this.drawPlayerHand('red');
    this.drawPlayerHand('blue');
  }

  private drawPlayerHand(playerId: PlayerId): void {
    const ctx = this.ctx;
    const layout = this.layout;
    const player = this.playerManager.getPlayer(playerId);
    const hand = player.getHand();
    const isCurrentPlayer = this.playerManager.getCurrentPlayerId() === playerId;

    const centerX = playerId === 'red' ? layout.redHandX : layout.blueHandX;
    const centerY = playerId === 'red' ? layout.redHandY : layout.blueHandY;

    const cardCount = hand.length;
    if (cardCount === 0) return;

    const fanAngle = layout.handFanAngle;
    const startAngle = -fanAngle / 2;
    const angleStep = cardCount > 1 ? fanAngle / (cardCount - 1) : 0;

    const radius = layout.handCardHeight * 0.9;
    const isSelected = (cardId: string) => this.selectedCardId === cardId && isCurrentPlayer;

    ctx.save();
    if (!isCurrentPlayer) {
      ctx.globalAlpha = 0.6;
    }

    for (let i = 0; i < cardCount; i++) {
      const card = hand[i];
      const angle = startAngle + i * angleStep;

      let offsetX = 0;
      let offsetY = 0;
      let scale = 1;
      let alpha = 1;

      const selected = isSelected(card.id);

      if (isCurrentPlayer && this.selectedCardId) {
        if (selected) {
          offsetY = -20;
          scale = 1.1;
        } else {
          alpha = 0.5;
        }
      }

      const cardX = centerX + Math.sin(angle) * radius + offsetX;
      let cardY = centerY + Math.cos(angle) * radius * 0.3 + offsetY;

      if (playerId === 'blue') {
        cardY = centerY - Math.cos(angle) * radius * 0.3 - offsetY;
      }

      let rotation = angle * 0.5;
      if (playerId === 'blue') {
        rotation = -angle * 0.5;
      }

      const cardWidth = layout.handCardWidth * scale;
      const cardHeight = layout.handCardHeight * scale;

      this.drawCard(
        ctx,
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        card,
        playerId,
        rotation,
        alpha * this.turnFadeProgress
      );
    }

    ctx.restore();

    if (isCurrentPlayer) {
      ctx.save();
      ctx.fillStyle = playerId === 'red' ? '#ff5252' : '#448aff';
      ctx.font = 'bold 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      const labelY = playerId === 'red' ? centerY + layout.handCardHeight * 0.7 : centerY - layout.handCardHeight * 0.7;
      ctx.fillText(playerId === 'red' ? '红方手牌' : '蓝方手牌', centerX, labelY);
      ctx.restore();
    }
  }

  private drawTurnIndicator(): void {
    if (!this.turnIndicator) return;

    const ctx = this.ctx;
    const layout = this.layout;
    const indicator = this.turnIndicator;

    const centerX = layout.boardX + layout.boardSize / 2;
    const centerY = layout.boardY + layout.boardSize / 2;

    let alpha = 1;
    if (indicator.progress < indicator.fadeInDuration / indicator.duration) {
      alpha = indicator.progress / (indicator.fadeInDuration / indicator.duration);
    } else if (indicator.progress > 1 - indicator.fadeOutDuration / indicator.duration) {
      alpha = (1 - indicator.progress) / (indicator.fadeOutDuration / indicator.duration);
    }

    const color = indicator.player === 'red' ? '#ff5252' : '#448aff';
    const size = layout.cellSize * 1.5;

    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);

    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 1.5);
    glowGradient.addColorStop(0, color + '80');
    glowGradient.addColorStop(0.5, color + '30');
    glowGradient.addColorStop(1, color + '00');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(centerX, centerY);
    ctx.rotate(indicator.rotation);

    const medalGrad = ctx.createRadialGradient(-size * 0.2, -size * 0.2, 0, 0, 0, size);
    medalGrad.addColorStop(0, '#ffffff');
    medalGrad.addColorStop(0.3, color);
    medalGrad.addColorStop(1, color + '80');

    ctx.fillStyle = medalGrad;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = i % 2 === 0 ? size : size * 0.7;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.rotate(-indicator.rotation);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${size * 0.35}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(indicator.player === 'red' ? '红方' : '蓝方', 0, 0);
    ctx.font = `${size * 0.2}px Georgia, serif`;
    ctx.fillText('回合', 0, size * 0.35);

    ctx.restore();
  }

  private drawFPS(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 120, 50);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`FPS: ${this.fps.toFixed(1)}`, 20, 18);
    ctx.fillText(`Frame: ${this.frameTimeAvg.toFixed(2)}ms`, 20, 36);
    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private handleClick(e: MouseEvent): void {
    this.audio.resume();

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.handleInteraction(x, y);
  }

  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.audio.resume();

    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    this.handleInteraction(x, y);
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.hoveredCell = this.getCellAtPosition(x, y);
  }

  private handleInteraction(x: number, y: number): void {
    if (this.turnIndicator) return;

    const currentPlayerId = this.playerManager.getCurrentPlayerId();

    const clickedCardId = this.getHandCardAtPosition(x, y, currentPlayerId);
    if (clickedCardId) {
      this.selectedCardId = this.selectedCardId === clickedCardId ? null : clickedCardId;
      return;
    }

    const cellPos = this.getCellAtPosition(x, y);
    if (cellPos && this.selectedCardId) {
      this.tryPlaceCard(cellPos.row, cellPos.col);
    }
  }

  private getCellAtPosition(x: number, y: number): CellPosition | null {
    const layout = this.layout;
    const col = Math.floor((x - layout.boardX) / layout.cellSize);
    const row = Math.floor((y - layout.boardY) / layout.cellSize);

    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      return { row, col };
    }
    return null;
  }

  private getHandCardAtPosition(x: number, y: number, playerId: PlayerId): string | null {
    const layout = this.layout;
    const player = this.playerManager.getPlayer(playerId);
    const hand = player.getHand();

    const centerX = playerId === 'red' ? layout.redHandX : layout.blueHandX;
    const centerY = playerId === 'red' ? layout.redHandY : layout.blueHandY;

    const cardCount = hand.length;
    if (cardCount === 0) return null;

    const fanAngle = layout.handFanAngle;
    const startAngle = -fanAngle / 2;
    const angleStep = cardCount > 1 ? fanAngle / (cardCount - 1) : 0;

    const radius = layout.handCardHeight * 0.9;

    for (let i = cardCount - 1; i >= 0; i--) {
      const card = hand[i];
      const angle = startAngle + i * angleStep;

      let cardY = centerY + Math.cos(angle) * radius * 0.3;
      if (playerId === 'blue') {
        cardY = centerY - Math.cos(angle) * radius * 0.3;
      }

      const cardX = centerX + Math.sin(angle) * radius;

      const dx = x - cardX;
      const dy = y - cardY;
      const halfW = layout.handCardWidth / 2;
      const halfH = layout.handCardHeight / 2;

      if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
        return card.id;
      }
    }

    return null;
  }

  private tryPlaceCard(row: number, col: number): void {
    if (!this.selectedCardId) return;

    const currentPlayerId = this.playerManager.getCurrentPlayerId();

    const result = this.board.placeCard(row, col, this.selectedCardId);

    if (result.success && result.card && result.position) {
      this.spawnFlyingCard(result.card, currentPlayerId, result.position);

      if (result.lineCells.length > 0) {
        setTimeout(() => {
          this.triggerRippleEffects(result.lineCells, currentPlayerId);
          this.audio.playLineComplete();
          this.updateScoreDisplay();
        }, 400);
      } else {
        this.updateScoreDisplay();
      }

      this.selectedCardId = null;

      setTimeout(() => {
        this.switchTurn();
      }, result.lineCells.length > 0 ? 1000 : 600);
    }
  }

  private spawnFlyingCard(card: Card, playerId: PlayerId, targetPos: CellPosition): void {
    const layout = this.layout;

    const centerX = playerId === 'red' ? layout.redHandX : layout.blueHandX;
    const centerY = playerId === 'red' ? layout.redHandY : layout.blueHandY;

    let startX = centerX;
    let startY = centerY;
    let startRotation = 0;

    const fanAngle = layout.handFanAngle;
    const radius = layout.handCardHeight * 0.9;
    const cardCount = 5;
    const startAngle = -fanAngle / 2;
    const angleStep = cardCount > 1 ? fanAngle / (cardCount - 1) : 0;

    for (let i = 0; i < cardCount; i++) {
      const angle = startAngle + i * angleStep;
      const candidateX = centerX + Math.sin(angle) * radius;
      let candidateY = centerY + Math.cos(angle) * radius * 0.3;
      if (playerId === 'blue') {
        candidateY = centerY - Math.cos(angle) * radius * 0.3;
      }

      if (i === 2) {
        startX = candidateX;
        startY = candidateY;
        startRotation = angle * 0.5;
        if (playerId === 'blue') startRotation = -angle * 0.5;
        break;
      }
    }

    const targetX = layout.boardX + targetPos.col * layout.cellSize + layout.cellSize / 2;
    const targetY = layout.boardY + targetPos.row * layout.cellSize + layout.cellSize / 2;

    const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
    const duration = clamp(0.4 + distance / 2000, 0.4, 0.6);

    this.flyingCards.push({
      id: `fly-${Date.now()}-${Math.random()}`,
      card,
      player: playerId,
      startX,
      startY,
      startRotation,
      targetX,
      targetY,
      targetRow: targetPos.row,
      targetCol: targetPos.col,
      progress: 0,
      duration,
      currentX: startX,
      currentY: startY,
      currentRotation: startRotation,
      currentScale: 1,
      arcHeight: 80,
      settled: false,
      settleProgress: 0
    });
  }

  private triggerRippleEffects(cells: CellPosition[], playerId: PlayerId): void {
    const layout = this.layout;
    const color = playerId === 'red' ? '#ff5252' : '#448aff';

    for (const cell of cells) {
      const x = layout.boardX + cell.col * layout.cellSize + layout.cellSize / 2;
      const y = layout.boardY + cell.row * layout.cellSize + layout.cellSize / 2;

      this.rippleEffects.push({
        x,
        y,
        maxRadius: layout.cellSize * 1.2,
        progress: 0,
        duration: 0.6,
        color,
        player: playerId
      });
    }
  }

  private switchTurn(): void {
    this.isSwitchingTurn = true;
    this.audio.playTurnSwitch();
  }

  private showTurnIndicator(): void {
    const currentPlayer = this.playerManager.getCurrentPlayerId();
    this.turnIndicator = {
      player: currentPlayer,
      progress: 0,
      duration: 1.5,
      fadeInDuration: 0.2,
      fadeOutDuration: 0.3,
      rotation: 0
    };
  }

  private updateScoreDisplay(): void {
    for (const playerId of ['red', 'blue'] as PlayerId[]) {
      const newScore = this.board.getScore(playerId);
      const oldScore = this.lastScores[playerId];

      if (newScore !== oldScore) {
        this.animateScoreDigits(playerId, oldScore, newScore);
        this.lastScores[playerId] = newScore;
      }
    }

    this.updateDOMScore();
    this.updateScoreCubes();
  }

  private animateScoreDigits(playerId: PlayerId, oldScore: number, newScore: number): void {
    const digits = this.scoreDigits[playerId];

    const oldHundreds = Math.floor(oldScore / 100);
    const oldTens = Math.floor((oldScore % 100) / 10);
    const oldOnes = oldScore % 10;

    const newHundreds = Math.floor(newScore / 100);
    const newTens = Math.floor((newScore % 100) / 10);
    const newOnes = newScore % 10;

    if (oldHundreds !== newHundreds) {
      digits.hundreds.prevValue = oldHundreds;
      digits.hundreds.value = newHundreds;
      digits.hundreds.progress = 0;
    }
    if (oldTens !== newTens) {
      digits.tens.prevValue = oldTens;
      digits.tens.value = newTens;
      digits.tens.progress = 0;
    }
    if (oldOnes !== newOnes) {
      digits.ones.prevValue = oldOnes;
      digits.ones.value = newOnes;
      digits.ones.progress = 0;
    }
  }

  private updateDOMScore(): void {
    const redScore = this.board.getScore('red');
    const blueScore = this.board.getScore('blue');

    const redEl = document.getElementById('red-score');
    const blueEl = document.getElementById('blue-score');

    if (redEl) redEl.textContent = String(redScore);
    if (blueEl) blueEl.textContent = String(blueScore);

    const turnText = document.getElementById('turn-text');
    if (turnText) {
      turnText.textContent = this.playerManager.getCurrentPlayerId() === 'red' ? '红方回合' : '蓝方回合';
    }
  }

  private updateScoreCubes(): void {
    const redCubes = document.getElementById('red-cubes');
    const blueCubes = document.getElementById('blue-cubes');

    if (redCubes) {
      redCubes.innerHTML = '';
      const redCount = Math.min(this.board.getScore('red'), 20);
      for (let i = 0; i < redCount; i++) {
        const cube = document.createElement('div');
        cube.className = 'score-cube red';
        redCubes.appendChild(cube);
      }
    }

    if (blueCubes) {
      blueCubes.innerHTML = '';
      const blueCount = Math.min(this.board.getScore('blue'), 20);
      for (let i = 0; i < blueCount; i++) {
        const cube = document.createElement('div');
        cube.className = 'score-cube blue';
        blueCubes.appendChild(cube);
      }
    }
  }

  public getAnimator(): Animator {
    return this.animator;
  }
}
