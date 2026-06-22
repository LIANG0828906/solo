export interface StrokePoint {
  x: number;
  y: number;
  width: number;
  timestamp: number;
}

export interface CompareResult {
  score: number;
  grade: '神似' | '形似' | '欠佳';
  similarity: number;
  details: {
    coverage: number;
    overlap: number;
    deviation: number;
  };
}

export interface TrailingPoint extends StrokePoint {
  opacity: number;
}

const CHARACTERS: string[] = [
  '九成宫醴泉铭秘书监检',
  '校侍中钜郡公臣魏',
  '徵奉敕撰维贞观',
  '六年孟夏之月皇帝'
];

export class RubbingSimulator {
  private strokes: StrokePoint[][] = [];
  private currentStroke: StrokePoint[] = [];
  private isDrawing: boolean = false;
  private lastPosition: { x: number; y: number } | null = null;
  private lastTime: number = 0;
  private characterCanvas: HTMLCanvasElement | null = null;
  private characterCtx: CanvasRenderingContext2D | null = null;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private trailingPoints: TrailingPoint[] = [];
  private readonly TRAIL_DURATION = 300;
  private readonly TRAIL_OPACITY = 0.08;
  private readonly MIN_BRUSH_WIDTH = 1;
  private readonly MAX_BRUSH_WIDTH = 4;

  constructor() {}

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.generateCharacters();
  }

  private generateCharacters(): void {
    if (!this.characterCanvas) {
      this.characterCanvas = document.createElement('canvas');
    }
    this.characterCanvas.width = this.canvasWidth;
    this.characterCanvas.height = this.canvasHeight;
    this.characterCtx = this.characterCanvas.getContext('2d')!;

    this.characterCtx.fillStyle = '#F5E6C8';
    this.characterCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const cols = 5;
    const rows = 4;
    const charWidth = (this.canvasWidth - 20) / cols;
    const charHeight = (this.canvasHeight - 20) / rows;
    const fontSize = Math.min(charWidth, charHeight) * 0.8;

    this.characterCtx.font = `bold ${fontSize}px "Noto Serif SC", "STKaiti", "KaiTi", serif`;
    this.characterCtx.textAlign = 'center';
    this.characterCtx.textBaseline = 'middle';
    this.characterCtx.fillStyle = 'rgba(26, 26, 26, 0.2)';

    let charIndex = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (charIndex < 20) {
          const char = this.getCharacter(charIndex);
          const x = 10 + col * charWidth + charWidth / 2;
          const y = 10 + row * charHeight + charHeight / 2;
          this.characterCtx.fillText(char, x, y);
          charIndex++;
        }
      }
    }
  }

  private getCharacter(index: number): string {
    let charIndex = 0;
    for (const line of CHARACTERS) {
      for (const char of line) {
        if (charIndex === index) return char;
        charIndex++;
      }
    }
    return '';
  }

  getCharacterAtPosition(x: number, y: number): string {
    const cols = 5;
    const rows = 4;
    const charWidth = (this.canvasWidth - 20) / cols;
    const charHeight = (this.canvasHeight - 20) / rows;
    
    const col = Math.floor((x - 10) / charWidth);
    const row = Math.floor((y - 10) / charHeight);
    
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      const index = row * cols + col;
      if (index < 20) {
        return this.getCharacter(index);
      }
    }
    return '';
  }

  startDrawing(x: number, y: number): void {
    this.isDrawing = true;
    this.lastPosition = { x, y };
    this.lastTime = performance.now();
    this.currentStroke = [];
    
    const point: StrokePoint = {
      x,
      y,
      width: this.MIN_BRUSH_WIDTH,
      timestamp: this.lastTime
    };
    
    this.currentStroke.push(point);
  }

  addStrokePoint(x: number, y: number): StrokePoint | null {
    if (!this.isDrawing || !this.lastPosition) return null;

    const currentTime = performance.now();
    const dx = x - this.lastPosition.x;
    const dy = y - this.lastPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dt = currentTime - this.lastTime;
    
    let width = this.MIN_BRUSH_WIDTH;
    if (dt > 0) {
      const speed = distance / dt;
      width = this.MIN_BRUSH_WIDTH + 
        (this.MAX_BRUSH_WIDTH - this.MIN_BRUSH_WIDTH) * Math.min(speed * 0.1, 1);
    }

    const point: StrokePoint = {
      x,
      y,
      width,
      timestamp: currentTime
    };

    this.currentStroke.push(point);
    this.lastPosition = { x, y };
    this.lastTime = currentTime;

    return point;
  }

  endDrawing(): StrokePoint[] {
    if (this.currentStroke.length > 0) {
      this.strokes.push([...this.currentStroke]);
    }
    const completedStroke = [...this.currentStroke];
    this.currentStroke = [];
    this.isDrawing = false;
    this.lastPosition = null;
    
    return completedStroke;
  }

  renderStroke(
    ctx: CanvasRenderingContext2D,
    from: StrokePoint,
    to: StrokePoint
  ): void {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = '#1A1A1A';
    ctx.lineWidth = (from.width + to.width) / 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  renderTrail(ctx: CanvasRenderingContext2D, currentTime: number): void {
    if (this.currentStroke.length < 2) return;

    this.trailingPoints = this.trailingPoints.filter(
      p => currentTime - p.timestamp < this.TRAIL_DURATION
    );

    for (const point of this.trailingPoints) {
      const age = currentTime - point.timestamp;
      const opacity = this.TRAIL_OPACITY * (1 - age / this.TRAIL_DURATION);
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.width * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(26, 26, 26, ${opacity})`;
      ctx.fill();
    }

    if (this.currentStroke.length > 0) {
      const lastPoint = this.currentStroke[this.currentStroke.length - 1];
      this.trailingPoints.push({
        ...lastPoint,
        opacity: this.TRAIL_OPACITY
      });
    }
  }

  renderBaseCharacters(ctx: CanvasRenderingContext2D): void {
    if (this.characterCanvas) {
      ctx.drawImage(this.characterCanvas, 0, 0);
    }
  }

  clearStrokes(): void {
    this.strokes = [];
    this.currentStroke = [];
    this.trailingPoints = [];
    this.isDrawing = false;
  }

  getAllStrokes(): StrokePoint[][] {
    return [...this.strokes];
  }

  compareWithOriginal(): CompareResult {
    if (!this.characterCanvas || this.strokes.length === 0) {
      return {
        score: 0,
        grade: '欠佳',
        similarity: 0,
        details: { coverage: 0, overlap: 0, deviation: 0 }
      };
    }

    const userCanvas = document.createElement('canvas');
    userCanvas.width = this.canvasWidth;
    userCanvas.height = this.canvasHeight;
    const userCtx = userCanvas.getContext('2d')!;

    userCtx.fillStyle = '#F5E6C8';
    userCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    userCtx.strokeStyle = '#1A1A1A';
    userCtx.lineCap = 'round';
    userCtx.lineJoin = 'round';

    for (const stroke of this.strokes) {
      for (let i = 1; i < stroke.length; i++) {
        const from = stroke[i - 1];
        const to = stroke[i];
        userCtx.lineWidth = (from.width + to.width) / 2;
        userCtx.beginPath();
        userCtx.moveTo(from.x, from.y);
        userCtx.lineTo(to.x, to.y);
        userCtx.stroke();
      }
    }

    const originalData = this.characterCtx!.getImageData(
      0, 0, this.canvasWidth, this.canvasHeight
    ).data;
    const userData = userCtx.getImageData(
      0, 0, this.canvasWidth, this.canvasHeight
    ).data;

    let originalPixels = 0;
    let userPixels = 0;
    let overlapPixels = 0;
    let userOutsideOriginal = 0;

    const threshold = 180;
    const step = 2;

    for (let i = 0; i < originalData.length; i += 4 * step) {
      const originalGray = 0.299 * originalData[i] + 
                          0.587 * originalData[i + 1] + 
                          0.114 * originalData[i + 2];
      const userGray = 0.299 * userData[i] + 
                      0.587 * userData[i + 1] + 
                      0.114 * userData[i + 2];

      const isOriginal = originalGray < threshold;
      const isUser = userGray < threshold;

      if (isOriginal) originalPixels++;
      if (isUser) userPixels++;
      if (isOriginal && isUser) overlapPixels++;
      if (!isOriginal && isUser) userOutsideOriginal++;
    }

    const coverage = originalPixels > 0 
      ? (overlapPixels / originalPixels) * 100 
      : 0;
    
    const precision = userPixels > 0 
      ? (overlapPixels / userPixels) * 100 
      : 0;

    const deviation = userPixels > 0 
      ? (userOutsideOriginal / userPixels) * 100 
      : 0;

    const similarity = coverage * 0.6 + precision * 0.4;
    const diffScore = Math.abs(100 - similarity);

    let grade: '神似' | '形似' | '欠佳';
    if (diffScore < 20) {
      grade = '神似';
    } else if (diffScore < 50) {
      grade = '形似';
    } else {
      grade = '欠佳';
    }

    return {
      score: Math.round(similarity),
      grade,
      similarity: Math.round(similarity),
      details: {
        coverage: Math.round(coverage),
        overlap: Math.round(precision),
        deviation: Math.round(deviation)
      }
    };
  }

  isCurrentlyDrawing(): boolean {
    return this.isDrawing;
  }

  getCurrentStroke(): StrokePoint[] {
    return [...this.currentStroke];
  }
}
