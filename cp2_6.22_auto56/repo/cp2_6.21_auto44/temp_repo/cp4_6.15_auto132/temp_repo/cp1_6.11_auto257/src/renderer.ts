import { 
  Book, Annotation, CharacterPosition, Position, Rect, 
  AppState, ShelfConfig, ReadingConfig, COLORS 
} from './types';
import { BookManager } from './bookManager';
import { AnnotationManager } from './annotationManager';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function hitTest(point: Position, rect: Rect): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.width &&
         point.y >= rect.y && point.y <= rect.y + rect.height;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 + percent / 100;
  const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `rgb(${newR}, ${newG}, ${newB})`;
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private bookManager: BookManager;
  private annotationManager: AnnotationManager;
  private state: AppState;
  private shelfConfig: ShelfConfig | null = null;
  private readingConfig: ReadingConfig | null = null;
  private characterPositions: Map<string, CharacterPosition[]> = new Map();
  private scrollRects: Map<string, Rect> = new Map();
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private mousePosition: Position = { x: 0, y: 0 };
  private lastMoveTime: number = 0;
  private pendingAnnotation: { bookId: string; charIndex: number } | null = null;
  private onAnnotationRequest?: (bookId: string, charIndex: number, position: Position) => void;
  private onBookClick?: (bookId: string) => void;
  private onAnnotationHover?: (annotation: Annotation | null) => void;
  private paperTexturePattern: CanvasPattern | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    bookManager: BookManager,
    annotationManager: AnnotationManager,
    initialState: AppState
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.bookManager = bookManager;
    this.annotationManager = annotationManager;
    this.state = initialState;

    this.initOffscreenCanvas();
    this.createPaperTexture();
    this.resize();
    this.bindEvents();
  }

  private initOffscreenCanvas(): void {
    this.offscreenCanvas = document.createElement('canvas');
    const offCtx = this.offscreenCanvas.getContext('2d');
    if (offCtx) {
      this.offscreenCtx = offCtx;
    }
  }

  private createPaperTexture(): void {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 100;
    patternCanvas.height = 100;
    const pctx = patternCanvas.getContext('2d');
    if (!pctx) return;

    pctx.fillStyle = COLORS.BACKGROUND;
    pctx.fillRect(0, 0, 100, 100);

    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const alpha = Math.random() * 0.05;
      pctx.fillStyle = `rgba(92, 58, 33, ${alpha})`;
      pctx.fillRect(x, y, 1, 1);
    }

    this.paperTexturePattern = this.ctx.createPattern(patternCanvas, 'repeat');
  }

  setState(newState: Partial<AppState>): void {
    this.state = { ...this.state, ...newState };
  }

  getState(): AppState {
    return { ...this.state };
  }

  setOnAnnotationRequest(callback: (bookId: string, charIndex: number, position: Position) => void): void {
    this.onAnnotationRequest = callback;
  }

  setOnBookClick(callback: (bookId: string) => void): void {
    this.onBookClick = callback;
  }

  setOnAnnotationHover(callback: (annotation: Annotation | null) => void): void {
    this.onAnnotationHover = callback;
  }

  setOnBack(callback: () => void): void {
    this.onBack = callback;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    if (this.offscreenCanvas && this.offscreenCtx) {
      this.offscreenCanvas.width = this.canvas.width;
      this.offscreenCanvas.height = this.canvas.height;
      this.offscreenCtx.scale(dpr, dpr);
    }

    this.calculateShelfConfig();
    this.calculateReadingConfig();
    this.updateCharacterPositions();
    this.updateScrollRects();
  }

  private calculateShelfConfig(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const { rows } = this.bookManager.getShelfDimensions();
    const totalBooks = this.bookManager.getBooksCount();
    const cols = Math.ceil(totalBooks / rows);

    let scale = 1;
    let actualCols = cols;
    
    if (width < 1200) {
      scale = 0.7;
      actualCols = Math.ceil(cols / 2);
    }
    if (width < 768) {
      scale = 0.6;
      actualCols = Math.ceil(cols / 2);
    }

    const scrollWidth = 70 * scale;
    const scrollHeight = 150 * scale;
    const scrollGap = 20 * scale;
    const rowGap = 40 * scale;

    const totalWidth = actualCols * scrollWidth + (actualCols - 1) * scrollGap;
    const totalHeight = rows * scrollHeight + (rows - 1) * rowGap;

    const shelfWidth = totalWidth + 80 * scale;
    const shelfHeight = totalHeight + 80 * scale;
    const shelfX = (width - shelfWidth) / 2;
    const shelfY = Math.max(140, (height - shelfHeight) / 2);

    this.shelfConfig = {
      rows,
      cols: actualCols,
      scrollWidth,
      scrollHeight,
      scrollGap,
      rowGap,
      shelfX,
      shelfY,
      shelfWidth,
      shelfHeight,
      scale,
    };
  }

  private calculateReadingConfig(): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const maxWidth = Math.min(900, width * 0.85);
    const maxHeight = Math.min(600, height * 0.7);
    const scrollX = (width - maxWidth) / 2;
    const scrollY = Math.max(140, (height - maxHeight) / 2);

    const charSize = 32;
    const columnGap = 12;
    const rowGap = 8;
    const rightMargin = maxWidth - 60;
    const topMargin = 60;

    this.readingConfig = {
      scrollX,
      scrollY,
      maxWidth,
      maxHeight,
      charSize,
      columnGap,
      rowGap,
      rightMargin,
      topMargin,
    };
  }

  private updateScrollRects(): void {
    if (!this.shelfConfig) return;

    this.scrollRects.clear();
    const books = this.bookManager.getAllBooks();
    const actualCols = this.shelfConfig.cols;

    books.forEach(book => {
      const virtualCol = book.shelfCol;
      const row = book.shelfRow;
      const col = virtualCol % actualCols;
      const colPage = Math.floor(virtualCol / actualCols);
      const pageOffset = colPage * this.shelfConfig!.shelfWidth * 0.1;

      const x = this.shelfConfig!.shelfX + 40 * this.shelfConfig!.scale + 
                col * (this.shelfConfig!.scrollWidth + this.shelfConfig!.scrollGap) + pageOffset;
      const y = this.shelfConfig!.shelfY + 40 * this.shelfConfig!.scale + 
                row * (this.shelfConfig!.scrollHeight + this.shelfConfig!.rowGap);

      this.scrollRects.set(book.id, {
        x,
        y,
        width: this.shelfConfig!.scrollWidth,
        height: this.shelfConfig!.scrollHeight,
      });
    });
  }

  private updateCharacterPositions(): void {
    if (!this.readingConfig) return;

    this.characterPositions.clear();
    const books = this.bookManager.getAllBooks();

    books.forEach(book => {
      const positions: CharacterPosition[] = [];
      const config = this.readingConfig!;
      const availableWidth = config.maxWidth - 120;
      const availableHeight = config.maxHeight - 120;
      const charTotalSize = config.charSize + config.rowGap;
      const columnTotalSize = config.charSize + config.columnGap;
      
      const maxRows = Math.floor(availableHeight / charTotalSize);
      const maxColumns = Math.floor(availableWidth / columnTotalSize);
      
      const chars = book.characters;
      const totalChars = chars.length;
      const columns = Math.min(maxColumns, Math.ceil(totalChars / maxRows));
      const actualRows = Math.ceil(totalChars / columns);

      chars.forEach((char, index) => {
        const col = Math.floor(index / actualRows);
        const row = index % actualRows;
        
        const x = config.scrollX + config.rightMargin - col * columnTotalSize;
        const y = config.scrollY + config.topMargin + row * charTotalSize;

        positions.push({
          char,
          index,
          x,
          y,
          width: config.charSize,
          height: config.charSize,
        });
      });

      this.characterPositions.set(book.id, positions);
    });
  }

  getScrollRect(bookId: string): Rect | undefined {
    return this.scrollRects.get(bookId);
  }

  getCharacterPosition(bookId: string, charIndex: number): CharacterPosition | undefined {
    const positions = this.characterPositions.get(bookId);
    return positions?.[charIndex];
  }

  findCharAtPosition(bookId: string, pos: Position): CharacterPosition | null {
    const positions = this.characterPositions.get(bookId);
    if (!positions) return null;

    for (const cp of positions) {
      if (hitTest(pos, { x: cp.x, y: cp.y, width: cp.width, height: cp.height })) {
        return cp;
      }
    }
    return null;
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  private handleMouseMove(e: MouseEvent): void {
    const now = Date.now();
    if (now - this.lastMoveTime < 16) return;
    this.lastMoveTime = now;

    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    this.updateHoverState();
  }

  private handleMouseLeave(): void {
    this.mousePosition = { x: -1000, y: -1000 };
    this.updateHoverState();
  }

  private updateHoverState(): void {
    let hoveredBookId: string | null = null;
    let hoveredAnnotationId: string | null = null;

    if (this.state.currentView === 'shelf') {
      for (const [bookId, rect] of this.scrollRects) {
        if (hitTest(this.mousePosition, rect)) {
          hoveredBookId = bookId;
          break;
        }
      }
    } else if (this.state.currentView === 'reading' && this.state.activeBookId) {
      const bookAnns = this.annotationManager.getAnnotationsByBookId(this.state.activeBookId);
      for (const ann of bookAnns) {
        const cp = this.getCharacterPosition(this.state.activeBookId, ann.charIndex);
        if (cp) {
          const markRect = {
            x: cp.x + cp.width,
            y: cp.y + cp.height / 2 - 3,
            width: 6,
            height: 6,
          };
          if (hitTest(this.mousePosition, markRect)) {
            hoveredAnnotationId = ann.id;
            break;
          }
        }
      }
    }

    if (this.state.hoveredBookId !== hoveredBookId) {
      this.state.hoveredBookId = hoveredBookId;
      this.canvas.style.cursor = hoveredBookId ? 'pointer' : 'default';
    }

    if (this.state.hoveredAnnotationId !== hoveredAnnotationId) {
      this.state.hoveredAnnotationId = hoveredAnnotationId;
      const ann = hoveredAnnotationId ? this.annotationManager.getAnnotationById(hoveredAnnotationId) : null;
      this.onAnnotationHover?.(ann ?? null);
    }
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    if (this.state.currentView === 'shelf') {
      for (const [bookId, scrollRect] of this.scrollRects) {
        if (hitTest(pos, scrollRect)) {
          this.onBookClick?.(bookId);
          return;
        }
      }
    }
  }

  private handleDoubleClick(e: MouseEvent): void {
    if (this.state.currentView !== 'reading' || !this.state.activeBookId) return;

    const rect = this.canvas.getBoundingClientRect();
    const pos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const charPos = this.findCharAtPosition(this.state.activeBookId, pos);
    if (charPos) {
      this.pendingAnnotation = {
        bookId: this.state.activeBookId,
        charIndex: charPos.index,
      };
      this.onAnnotationRequest?.(this.state.activeBookId, charPos.index, pos);
    }
  }

  start(): void {
    this.lastTime = performance.now();
    this.animate();
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animate(): void {
    const now = performance.now();
    const deltaTime = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.updateAnimations(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private updateAnimations(deltaTime: number): void {
    const books = this.bookManager.getAllBooks();
    
    books.forEach(book => {
      if (book.isOpen && book.openProgress < 1) {
        const newProgress = Math.min(1, book.openProgress + deltaTime * 1.5);
        this.bookManager.updateOpenProgress(book.id, newProgress);
      } else if (!book.isOpen && book.openProgress > 0) {
        const newProgress = Math.max(0, book.openProgress - deltaTime * 2);
        this.bookManager.updateOpenProgress(book.id, newProgress);
        if (newProgress === 0 && this.state.activeBookId === book.id) {
          this.state.activeBookId = null;
          this.state.currentView = 'shelf';
        }
      }
    });

    this.bookManager.updateBlinkAnimation();
  }

  private render(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    this.drawBackground();

    if (this.state.currentView === 'shelf') {
      this.drawShelfView();
    } else {
      this.drawReadingView();
    }
  }

  private drawBackground(): void {
    const rect = this.canvas.getBoundingClientRect();
    
    if (this.paperTexturePattern) {
      this.ctx.fillStyle = this.paperTexturePattern;
    } else {
      this.ctx.fillStyle = COLORS.BACKGROUND;
    }
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  private drawShelfView(): void {
    if (!this.shelfConfig) return;

    this.drawShelfFrame();
    this.drawScrolls();
  }

  private drawShelfFrame(): void {
    const config = this.shelfConfig!;
    const ctx = this.ctx;

    ctx.save();
    
    ctx.shadowColor = COLORS.SHADOW;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 5;
    
    const gradient = ctx.createLinearGradient(
      config.shelfX, config.shelfY,
      config.shelfX, config.shelfY + config.shelfHeight
    );
    gradient.addColorStop(0, COLORS.WOOD_LIGHT);
    gradient.addColorStop(0.5, COLORS.WOOD_DARK);
    gradient.addColorStop(1, '#4C2A11');
    
    ctx.fillStyle = gradient;
    this.drawRoundedRect(
      config.shelfX, config.shelfY,
      config.shelfWidth, config.shelfHeight,
      8
    );
    ctx.fill();
    
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = COLORS.WOOD_DARK;
    ctx.lineWidth = 3;
    
    for (let i = 1; i < config.rows; i++) {
      const y = config.shelfY + 40 * config.scale + 
                i * (config.scrollHeight + config.rowGap) - config.rowGap / 2;
      ctx.beginPath();
      ctx.moveTo(config.shelfX + 10, y);
      ctx.lineTo(config.shelfX + config.shelfWidth - 10, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  private drawScrolls(): void {
    const books = this.bookManager.getAllBooks();
    
    books.forEach(book => {
      const rect = this.scrollRects.get(book.id);
      if (!rect) return;

      const isHovered = this.state.hoveredBookId === book.id;
      const isMatched = this.state.matchedBookIds.has(book.id);
      const blinkPhase = book.blinkPhase;
      
      let alpha = 1;
      if (blinkPhase !== undefined && isMatched) {
        alpha = blinkPhase % 2 === 0 ? 1 : 0.3;
      }

      this.drawSingleScroll(rect, book, isHovered, alpha);
    });
  }

  private drawSingleScroll(rect: Rect, book: Book, isHovered: boolean, alpha: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;

    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    if (isHovered) {
      ctx.shadowColor = book.color.end;
      ctx.shadowBlur = 25;
    }

    const gradient = ctx.createLinearGradient(
      rect.x, rect.y,
      rect.x + rect.width, rect.y
    );
    
    let startColor = book.color.start;
    let endColor = book.color.end;
    if (isHovered) {
      startColor = adjustBrightness(startColor, 20);
      endColor = adjustBrightness(endColor, 20);
    }
    
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(0.5, endColor);
    gradient.addColorStop(1, startColor);

    ctx.fillStyle = gradient;
    this.drawRoundedRect(rect.x, rect.y, rect.width, rect.height, rect.width / 2);
    ctx.fill();

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    
    for (let i = 1; i < 8; i++) {
      const lineX = rect.x + (rect.width / 8) * i;
      ctx.beginPath();
      ctx.moveTo(lineX, rect.y + 5);
      ctx.lineTo(lineX, rect.y + rect.height - 5);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = COLORS.ROPE_RED;
    
    const ropeY1 = rect.y + rect.height * 0.2;
    const ropeY2 = rect.y + rect.height * 0.8;
    
    ctx.fillRect(rect.x + 2, ropeY1 - 3, rect.width - 4, 6);
    ctx.fillRect(rect.x + 2, ropeY2 - 3, rect.width - 4, 6);
    
    ctx.beginPath();
    ctx.arc(centerX, ropeY1, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX, ropeY2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    ctx.save();
    ctx.translate(centerX, centerY + rect.height * 0.05);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `${Math.max(12, 16 * (this.shelfConfig?.scale || 1))}px "KaiTi", "楷体", serif`;
    ctx.fillStyle = COLORS.TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(book.title, 0, 0);
    ctx.restore();
  }

  private drawReadingView(): void {
    if (!this.readingConfig || !this.state.activeBookId) return;

    const book = this.bookManager.getBookById(this.state.activeBookId);
    if (!book) return;

    const progress = easeInOutCubic(book.openProgress);
    
    if (progress < 1) {
      this.drawShelfView();
    }
    
    this.drawOpenScroll(book, progress);
  }

  private drawOpenScroll(book: Book, progress: number): void {
    if (!this.readingConfig) return;
    
    const config = this.readingConfig;
    const ctx = this.ctx;
    const easedProgress = easeOutCubic(progress);

    const currentWidth = config.maxWidth * easedProgress;
    const scrollX = config.scrollX + (config.maxWidth - currentWidth) / 2;

    ctx.save();
    
    if (progress < 1) {
      ctx.globalAlpha = progress;
    }

    this.drawPaperBackground(scrollX, config.scrollY, currentWidth, config.maxHeight);
    this.drawDecorativeBorder(scrollX, config.scrollY, currentWidth, config.maxHeight);
    this.drawScrollRolls(scrollX, config.scrollY, currentWidth, config.maxHeight);

    if (progress > 0.3) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (progress - 0.3) / 0.7);
      this.drawBookContent(book, scrollX, config.scrollY, currentWidth, config.maxHeight);
      this.drawAnnotationMarks(book);
      ctx.restore();
    }

    this.drawBookTitle(book, scrollX, config.scrollY, currentWidth);

    ctx.restore();
  }

  private drawPaperBackground(x: number, y: number, width: number, height: number): void {
    const ctx = this.ctx;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;

    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, '#FFF8E7');
    gradient.addColorStop(0.5, '#F5E6C8');
    gradient.addColorStop(1, '#EED9B5');
    
    ctx.fillStyle = gradient;
    this.drawRoundedRect(x, y, width, height, 4);
    ctx.fill();
    
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(92, 58, 33, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(x + i, y);
      ctx.lineTo(x + i, y + height);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  private drawDecorativeBorder(x: number, y: number, width: number, height: number): void {
    const ctx = this.ctx;
    const padding = 15;
    const borderSize = 8;

    ctx.save();
    ctx.strokeStyle = COLORS.WOOD_DARK;
    ctx.lineWidth = 2;

    this.drawHuiPattern(x + padding, y + padding, width - padding * 2, height - padding * 2, borderSize);
    
    ctx.strokeStyle = 'rgba(92, 58, 33, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + padding + borderSize, y + padding + borderSize, 
                   width - (padding + borderSize) * 2, height - (padding + borderSize) * 2);
    
    ctx.restore();
  }

  private drawHuiPattern(x: number, y: number, w: number, h: number, size: number): void {
    const ctx = this.ctx;
    
    ctx.beginPath();
    
    const segments = Math.floor(w / (size * 2));
    for (let i = 0; i < segments; i++) {
      const sx = x + i * size * 2;
      this.drawHuiUnit(sx, y, size, 'top');
    }
    
    const rightSegments = Math.floor(h / (size * 2));
    for (let i = 0; i < rightSegments; i++) {
      const sy = y + i * size * 2;
      this.drawHuiUnit(x + w - size, sy, size, 'right');
    }
    
    const bottomSegments = Math.floor(w / (size * 2));
    for (let i = bottomSegments - 1; i >= 0; i--) {
      const sx = x + i * size * 2;
      this.drawHuiUnit(sx, y + h - size, size, 'bottom');
    }
    
    const leftSegments = Math.floor(h / (size * 2));
    for (let i = leftSegments - 1; i >= 0; i--) {
      const sy = y + i * size * 2;
      this.drawHuiUnit(x, sy, size, 'left');
    }
    
    ctx.stroke();
  }

  private drawHuiUnit(x: number, y: number, size: number, direction: 'top' | 'right' | 'bottom' | 'left'): void {
    const ctx = this.ctx;
    const s = size;
    
    switch (direction) {
      case 'top':
        ctx.moveTo(x, y);
        ctx.lineTo(x + s * 2, y);
        ctx.moveTo(x + s, y);
        ctx.lineTo(x + s, y + s);
        ctx.lineTo(x + s * 2, y + s);
        break;
      case 'right':
        ctx.moveTo(x + s, y);
        ctx.lineTo(x + s, y + s * 2);
        ctx.moveTo(x + s, y + s);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x, y + s * 2);
        break;
      case 'bottom':
        ctx.moveTo(x + s * 2, y + s);
        ctx.lineTo(x, y + s);
        ctx.moveTo(x + s, y + s);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x, y);
        break;
      case 'left':
        ctx.moveTo(x, y + s * 2);
        ctx.lineTo(x, y);
        ctx.moveTo(x, y + s);
        ctx.lineTo(x + s, y + s);
        ctx.lineTo(x + s, y);
        break;
    }
  }

  private drawScrollRolls(x: number, y: number, width: number, height: number): void {
    const ctx = this.ctx;
    const rollRadius = 15;
    
    ctx.save();
    
    const leftGradient = ctx.createLinearGradient(x - rollRadius, y, x, y);
    leftGradient.addColorStop(0, COLORS.SCROLL_END);
    leftGradient.addColorStop(1, COLORS.SCROLL_START);
    
    ctx.fillStyle = leftGradient;
    ctx.beginPath();
    ctx.ellipse(x, y + height / 2, rollRadius, height / 2 + 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const rightGradient = ctx.createLinearGradient(x + width, y, x + width + rollRadius, y);
    rightGradient.addColorStop(0, COLORS.SCROLL_START);
    rightGradient.addColorStop(1, COLORS.SCROLL_END);
    
    ctx.fillStyle = rightGradient;
    ctx.beginPath();
    ctx.ellipse(x + width, y + height / 2, rollRadius, height / 2 + 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.ROPE_RED;
    ctx.fillRect(x - 2, y + height * 0.2 - 4, 4, 8);
    ctx.fillRect(x - 2, y + height * 0.8 - 4, 4, 8);
    ctx.fillRect(x + width - 2, y + height * 0.2 - 4, 4, 8);
    ctx.fillRect(x + width - 2, y + height * 0.8 - 4, 4, 8);
    
    ctx.restore();
  }

  private drawBookContent(book: Book, x: number, y: number, width: number, height: number): void {
    if (!this.readingConfig) return;
    
    const ctx = this.ctx;
    const config = this.readingConfig;
    const positions = this.characterPositions.get(book.id);
    if (!positions) return;

    ctx.save();
    ctx.font = `${config.charSize}px "KaiTi", "楷体", "STKaiti", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const highlightedCharIndex = this.getHighlightedCharIndex(book.id);

    positions.forEach(cp => {
      if (cp.x < x + 40 || cp.x > x + width - 40) return;
      if (cp.y < y + 40 || cp.y > y + height - 40) return;

      const isHighlighted = highlightedCharIndex === cp.index;
      
      if (isHighlighted) {
        ctx.fillStyle = COLORS.HIGHLIGHT;
        ctx.fillRect(cp.x - 2, cp.y - 2, cp.width + 4, cp.height + 4);
      }

      const existingAnn = this.annotationManager.getAnnotationAt(book.id, cp.index);
      const isMatched = existingAnn && this.state.matchedAnnotationIds.has(existingAnn.id);
      
      ctx.fillStyle = isMatched ? COLORS.SEARCH_MATCH : COLORS.TEXT;
      ctx.fillText(cp.char, cp.x + cp.width / 2, cp.y + cp.height / 2);
    });

    ctx.restore();
  }

  private getHighlightedCharIndex(bookId: string): number | null {
    if (!this.state.highlightedAnnotationId) return null;
    
    const ann = this.annotationManager.getAnnotationById(this.state.highlightedAnnotationId);
    if (!ann || ann.bookId !== bookId) return null;
    
    return ann.charIndex;
  }

  private drawAnnotationMarks(book: Book): void {
    if (!this.readingConfig) return;
    
    const ctx = this.ctx;
    const annotations = this.annotationManager.getAnnotationsByBookId(book.id);

    annotations.forEach(ann => {
      const cp = this.getCharacterPosition(book.id, ann.charIndex);
      if (!cp) return;

      const isHovered = this.state.hoveredAnnotationId === ann.id;
      const isMatched = this.state.matchedAnnotationIds.has(ann.id);
      
      const markX = cp.x + cp.width + 3;
      const markY = cp.y + cp.height / 2;
      const markSize = isHovered ? 8 : 6;

      ctx.save();
      
      if (isHovered) {
        ctx.shadowColor = isMatched ? COLORS.SEARCH_MATCH : COLORS.ANNOTATION_MARK;
        ctx.shadowBlur = 10;
      }

      ctx.fillStyle = isMatched ? COLORS.SEARCH_MATCH : COLORS.ANNOTATION_MARK;
      ctx.beginPath();
      ctx.arc(markX, markY, markSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  private drawBookTitle(book: Book, x: number, y: number, width: number): void {
    const ctx = this.ctx;
    
    ctx.save();
    ctx.font = 'bold 24px "KaiTi", "楷体", serif';
    ctx.fillStyle = COLORS.WOOD_DARK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`《${book.title}》`, x + width / 2, y + 20);

    ctx.font = '14px "KaiTi", "楷体", serif';
    ctx.fillStyle = COLORS.TEXT;
    ctx.fillText(book.author, x + width / 2, y + 52);
    ctx.restore();
  }

  private drawRoundedRect(x: number, y: number, w: number, h: number, r: number): void {
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

  clearPendingAnnotation(): void {
    this.pendingAnnotation = null;
  }

  getPendingAnnotation(): { bookId: string; charIndex: number } | null {
    return this.pendingAnnotation;
  }
}
