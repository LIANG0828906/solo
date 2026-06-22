import {
  PuzzlePiece,
  PIECE_WIDTH,
  PIECE_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  easeOut,
} from './puzzleEngine';

export interface RenderState {
  pieces: PuzzlePiece[];
  selectedPieceId: number | null;
  draggingPieceId: number | null;
  dragOffsetX: number;
  dragOffsetY: number;
  mouseX: number;
  mouseY: number;
  isComplete: boolean;
  waveAnimation: WaveAnimation | null;
  animatingPieces: Map<number, PieceAnimation>;
}

export interface WaveAnimation {
  startTime: number;
  centerX: number;
  centerY: number;
  duration: number;
  maxRadius: number;
}

export interface PieceAnimation {
  type: 'snap' | 'rotate';
  startTime: number;
  duration: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromRotation: number;
  toRotation: number;
}

export class RenderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private artCanvas: HTMLCanvasElement;
  private animationFrameId: number | null = null;
  private state: RenderState;
  private onFrame?: () => void;

  constructor(canvas: HTMLCanvasElement, artCanvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }
    this.ctx = ctx;
    this.artCanvas = artCanvas;
    this.state = {
      pieces: [],
      selectedPieceId: null,
      draggingPieceId: null,
      dragOffsetX: 0,
      dragOffsetY: 0,
      mouseX: 0,
      mouseY: 0,
      isComplete: false,
      waveAnimation: null,
      animatingPieces: new Map(),
    };
  }

  setState(partial: Partial<RenderState>): void {
    this.state = { ...this.state, ...partial };
  }

  getState(): RenderState {
    return this.state;
  }

  startPieceSnapAnimation(
    pieceId: number,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ): void {
    this.state.animatingPieces.set(pieceId, {
      type: 'snap',
      startTime: performance.now(),
      duration: 150,
      fromX,
      fromY,
      toX,
      toY,
      fromRotation: 0,
      toRotation: 0,
    });
  }

  startPieceRotateAnimation(
    pieceId: number,
    fromRotation: number,
    toRotation: number
  ): void {
    const piece = this.state.pieces.find((p) => p.id === pieceId);
    if (!piece) return;

    this.state.animatingPieces.set(pieceId, {
      type: 'rotate',
      startTime: performance.now(),
      duration: 300,
      fromX: piece.currentX,
      fromY: piece.currentY,
      toX: piece.currentX,
      toY: piece.currentY,
      fromRotation,
      toRotation,
    });
  }

  startWaveAnimation(centerX: number, centerY: number): void {
    const diag = Math.sqrt(
      Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2)
    );
    this.state.waveAnimation = {
      startTime: performance.now(),
      centerX,
      centerY,
      duration: 1200,
      maxRadius: diag,
    };
  }

  start(onFrame?: () => void): void {
    this.onFrame = onFrame;
    this.loop();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (): void => {
    this.render();
    if (this.onFrame) {
      this.onFrame();
    }
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private render(): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    ctx.clearRect(0, 0, width, height);
    this.drawGrid();

    const now = performance.now();
    const piecesToRender = [...this.state.pieces];

    const draggingPiece = piecesToRender.find(
      (p) => p.id === this.state.draggingPieceId
    );
    const otherPieces = piecesToRender.filter(
      (p) => p.id !== this.state.draggingPieceId
    );

    for (const piece of otherPieces) {
      if (piece.isPlaced) {
        this.drawPiece(piece, now, false);
      }
    }

    if (draggingPiece) {
      this.drawPiece(draggingPiece, now, true);
    }

    this.drawWave(now);
    this.cleanupAnimations(now);
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const totalWidth = GRID_COLS * PIECE_WIDTH;
    const totalHeight = GRID_ROWS * PIECE_HEIGHT;

    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    ctx.strokeStyle = '#D0D0D0';
    ctx.lineWidth = 1;

    for (let col = 0; col <= GRID_COLS; col++) {
      const x = col * PIECE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, totalHeight);
      ctx.stroke();
    }

    for (let row = 0; row <= GRID_ROWS; row++) {
      const y = row * PIECE_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(totalWidth, y);
      ctx.stroke();
    }
  }

  private getAnimatedPieceState(
    piece: PuzzlePiece,
    now: number
  ): { x: number; y: number; rotation: number } {
    const anim = this.state.animatingPieces.get(piece.id);
    if (!anim) {
      return {
        x: piece.currentX,
        y: piece.currentY,
        rotation: piece.rotation,
      };
    }

    const progress = Math.min(1, (now - anim.startTime) / anim.duration);
    const eased = easeOut(progress);

    if (anim.type === 'snap') {
      return {
        x: anim.fromX + (anim.toX - anim.fromX) * eased,
        y: anim.fromY + (anim.toY - anim.fromY) * eased,
        rotation: piece.rotation,
      };
    } else {
      return {
        x: piece.currentX,
        y: piece.currentY,
        rotation: anim.fromRotation + (anim.toRotation - anim.fromRotation) * eased,
      };
    }
  }

  private drawPiece(piece: PuzzlePiece, now: number, isDragging: boolean): void {
    const ctx = this.ctx;
    const animState = this.getAnimatedPieceState(piece, now);

    let x = animState.x;
    let y = animState.y;
    const rotation = animState.rotation;

    if (isDragging) {
      x = this.state.mouseX - this.state.dragOffsetX;
      y = this.state.mouseY - this.state.dragOffsetY;
    }

    if (x < 0 && y < 0) {
      return;
    }

    const centerX = x + PIECE_WIDTH / 2;
    const centerY = y + PIECE_HEIGHT / 2;

    ctx.save();

    if (isDragging) {
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.shadowBlur = 6;
    }

    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.beginPath();
    const radius = 4;
    const w = PIECE_WIDTH;
    const h = PIECE_HEIGHT;
    ctx.moveTo(-w / 2 + radius, -h / 2);
    ctx.lineTo(w / 2 - radius, -h / 2);
    ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + radius);
    ctx.lineTo(w / 2, h / 2 - radius);
    ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - radius, h / 2);
    ctx.lineTo(-w / 2 + radius, h / 2);
    ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - radius);
    ctx.lineTo(-w / 2, -h / 2 + radius);
    ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + radius, -h / 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      this.artCanvas,
      piece.sourceX,
      piece.sourceY,
      PIECE_WIDTH,
      PIECE_HEIGHT,
      -w / 2,
      -h / 2,
      w,
      h
    );

    ctx.restore();

    if (!isDragging && piece.isPlaced) {
      ctx.save();
      ctx.beginPath();
      const r = 4;
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
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawWave(now: number): void {
    const wave = this.state.waveAnimation;
    if (!wave) return;

    const progress = (now - wave.startTime) / wave.duration;
    if (progress >= 1) {
      this.state.waveAnimation = null;
      return;
    }

    const ctx = this.ctx;
    const radius = wave.maxRadius * progress;
    const alpha = 1 - progress;

    for (let i = 0; i < 3; i++) {
      const r = Math.max(0, radius - i * 40);
      if (r <= 0) continue;

      const ringAlpha = alpha * (1 - i * 0.25);
      ctx.save();
      ctx.beginPath();
      ctx.arc(wave.centerX, wave.centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha * 0.6})`;
      ctx.lineWidth = 4 - i;
      ctx.stroke();
      ctx.restore();
    }

    const gradient = ctx.createRadialGradient(
      wave.centerX,
      wave.centerY,
      0,
      wave.centerX,
      wave.centerY,
      radius
    );
    gradient.addColorStop(0, `rgba(74, 144, 217, ${alpha * 0.15})`);
    gradient.addColorStop(0.5, `rgba(74, 144, 217, ${alpha * 0.08})`);
    gradient.addColorStop(1, 'rgba(74, 144, 217, 0)');

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  private cleanupAnimations(now: number): void {
    const toRemove: number[] = [];
    for (const [id, anim] of this.state.animatingPieces) {
      if (now - anim.startTime >= anim.duration) {
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      this.state.animatingPieces.delete(id);
    }
  }

  getPieceAtPosition(x: number, y: number): PuzzlePiece | null {
    for (let i = this.state.pieces.length - 1; i >= 0; i--) {
      const piece = this.state.pieces[i];
      if (!piece.isPlaced && piece.currentX < 0) continue;

      const px = piece.currentX;
      const py = piece.currentY;

      if (
        x >= px &&
        x <= px + PIECE_WIDTH &&
        y >= py &&
        y <= py + PIECE_HEIGHT
      ) {
        return piece;
      }
    }
    return null;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}

export function drawPieceThumbnail(
  ctx: CanvasRenderingContext2D,
  artCanvas: HTMLCanvasElement,
  piece: PuzzlePiece,
  destX: number,
  destY: number,
  destSize: number
): void {
  const scale = destSize / Math.max(PIECE_WIDTH, PIECE_HEIGHT);
  const drawW = PIECE_WIDTH * scale;
  const drawH = PIECE_HEIGHT * scale;
  const offsetX = destX + (destSize - drawW) / 2;
  const offsetY = destY + (destSize - drawH) / 2;

  ctx.save();
  ctx.beginPath();
  const radius = 4;
  ctx.moveTo(offsetX + radius, offsetY);
  ctx.lineTo(offsetX + drawW - radius, offsetY);
  ctx.quadraticCurveTo(offsetX + drawW, offsetY, offsetX + drawW, offsetY + radius);
  ctx.lineTo(offsetX + drawW, offsetY + drawH - radius);
  ctx.quadraticCurveTo(offsetX + drawW, offsetY + drawH, offsetX + drawW - radius, offsetY + drawH);
  ctx.lineTo(offsetX + radius, offsetY + drawH);
  ctx.quadraticCurveTo(offsetX, offsetY + drawH, offsetX, offsetY + drawH - radius);
  ctx.lineTo(offsetX, offsetY + radius);
  ctx.quadraticCurveTo(offsetX, offsetY, offsetX + radius, offsetY);
  ctx.closePath();
  ctx.clip();

  const centerX = offsetX + drawW / 2;
  const centerY = offsetY + drawH / 2;
  ctx.translate(centerX, centerY);
  ctx.rotate((piece.rotation * Math.PI) / 180);
  ctx.drawImage(
    artCanvas,
    piece.sourceX,
    piece.sourceY,
    PIECE_WIDTH,
    PIECE_HEIGHT,
    -drawW / 2,
    -drawH / 2,
    drawW,
    drawH
  );
  ctx.restore();
}
