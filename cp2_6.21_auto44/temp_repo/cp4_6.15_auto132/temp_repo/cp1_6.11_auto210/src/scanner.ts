export type ScanMode = 'progressive' | 'interlaced' | 'fan';

export interface ScanState {
  currentIndex: number;
  progress: number;
  isComplete: boolean;
  affectedPixels: number[];
}

export class Scanner {
  private mode: ScanMode;
  private cols: number;
  private rows: number;
  private totalPixels: number;
  private scanPath: number[] = [];
  private currentPosition: number = 0;
  private speed: number = 10;
  private frameCounter: number = 0;
  private centerX: number = 0;
  private centerY: number = 0;
  private maxRadius: number = 0;
  private currentRadius: number = 0;
  private pixelSize: number = 10;

  constructor(cols: number, rows: number, pixelSize: number = 10, mode: ScanMode = 'progressive') {
    this.cols = cols;
    this.rows = rows;
    this.totalPixels = cols * rows;
    this.pixelSize = pixelSize;
    this.mode = mode;
    this.centerX = (cols * pixelSize) / 2;
    this.centerY = (rows * pixelSize) / 2;
    this.maxRadius = Math.sqrt(this.centerX * this.centerX + this.centerY * this.centerY);
    this.buildScanPath();
  }

  private buildScanPath(): void {
    this.scanPath = [];
    
    switch (this.mode) {
      case 'progressive':
        for (let row = 0; row < this.rows; row++) {
          for (let col = 0; col < this.cols; col++) {
            this.scanPath.push(row * this.cols + col);
          }
        }
        break;
        
      case 'interlaced':
        for (let row = 0; row < this.rows; row += 2) {
          for (let col = 0; col < this.cols; col++) {
            this.scanPath.push(row * this.cols + col);
          }
        }
        for (let row = 1; row < this.rows; row += 2) {
          for (let col = 0; col < this.cols; col++) {
            this.scanPath.push(row * this.cols + col);
          }
        }
        break;
        
      case 'fan':
        const radiusSteps = Math.ceil(this.maxRadius / (this.pixelSize * 2));
        for (let r = 0; r <= radiusSteps; r++) {
          const radius = r * this.pixelSize * 2;
          const pixelsInRing = this.getPixelsInRing(radius, this.pixelSize * 2);
          this.scanPath.push(...pixelsInRing);
        }
        break;
    }
  }

  private getPixelsInRing(radius: number, ringWidth: number): number[] {
    const pixels: number[] = [];
    const innerRadius = Math.max(0, radius - ringWidth / 2);
    const outerRadius = radius + ringWidth / 2;
    
    const minCol = Math.max(0, Math.floor((this.centerX - outerRadius) / this.pixelSize));
    const maxCol = Math.min(this.cols - 1, Math.ceil((this.centerX + outerRadius) / this.pixelSize));
    const minRow = Math.max(0, Math.floor((this.centerY - outerRadius) / this.pixelSize));
    const maxRow = Math.min(this.rows - 1, Math.ceil((this.centerY + outerRadius) / this.pixelSize));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const pixelCenterX = col * this.pixelSize + this.pixelSize / 2;
        const pixelCenterY = row * this.pixelSize + this.pixelSize / 2;
        const dist = Math.sqrt(
          Math.pow(pixelCenterX - this.centerX, 2) + 
          Math.pow(pixelCenterY - this.centerY, 2)
        );
        
        if (dist >= innerRadius && dist <= outerRadius) {
          pixels.push(row * this.cols + col);
        }
      }
    }
    
    return pixels;
  }

  public setMode(mode: ScanMode): void {
    this.mode = mode;
    this.currentPosition = 0;
    this.frameCounter = 0;
    this.currentRadius = 0;
    this.buildScanPath();
  }

  public getMode(): ScanMode {
    return this.mode;
  }

  public setSpeed(speed: number): void {
    this.speed = speed;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public setPixelSize(pixelSize: number): void {
    this.pixelSize = pixelSize;
    this.centerX = (this.cols * pixelSize) / 2;
    this.centerY = (this.rows * pixelSize) / 2;
    this.maxRadius = Math.sqrt(this.centerX * this.centerX + this.centerY * this.centerY);
    this.reset();
  }

  public setDimensions(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.totalPixels = cols * rows;
    this.centerX = (cols * this.pixelSize) / 2;
    this.centerY = (rows * this.pixelSize) / 2;
    this.maxRadius = Math.sqrt(this.centerX * this.centerX + this.centerY * this.centerY);
    this.reset();
  }

  public reset(): void {
    this.currentPosition = 0;
    this.frameCounter = 0;
    this.currentRadius = 0;
    this.buildScanPath();
  }

  public step(): ScanState {
    let affectedPixels: number[] = [];
    let stepsToMove: number;

    switch (this.mode) {
      case 'progressive':
        stepsToMove = Math.floor(this.speed) * this.cols;
        const startProg = this.currentPosition;
        const endProg = Math.min(startProg + stepsToMove, this.scanPath.length);
        for (let i = startProg; i < endProg; i++) {
          affectedPixels.push(this.scanPath[i]);
        }
        this.currentPosition = endProg;
        break;

      case 'interlaced':
        this.frameCounter++;
        if (this.frameCounter % 2 === 0) {
          stepsToMove = Math.floor(this.speed) * this.cols;
          const startInter = this.currentPosition;
          const endInter = Math.min(startInter + stepsToMove, this.scanPath.length);
          for (let i = startInter; i < endInter; i++) {
            affectedPixels.push(this.scanPath[i]);
          }
          this.currentPosition = endInter;
        }
        break;

      case 'fan':
        const ringWidth = this.pixelSize * 2;
        const radiusIncrement = this.speed * ringWidth;
        const startRadius = this.currentRadius;
        const endRadius = Math.min(startRadius + radiusIncrement, this.maxRadius + ringWidth);
        
        const pixelsInRange = this.getPixelsInRadiusRange(startRadius, endRadius);
        affectedPixels = pixelsInRange;
        this.currentRadius = endRadius;
        break;
    }

    const progress = this.getProgress();
    const isComplete = this.isComplete();

    return {
      currentIndex: this.currentPosition,
      progress,
      isComplete,
      affectedPixels
    };
  }

  private getPixelsInRadiusRange(startRadius: number, endRadius: number): number[] {
    const pixels: number[] = [];
    
    const minCol = Math.max(0, Math.floor((this.centerX - endRadius) / this.pixelSize));
    const maxCol = Math.min(this.cols - 1, Math.ceil((this.centerX + endRadius) / this.pixelSize));
    const minRow = Math.max(0, Math.floor((this.centerY - endRadius) / this.pixelSize));
    const maxRow = Math.min(this.rows - 1, Math.ceil((this.centerY + endRadius) / this.pixelSize));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const pixelCenterX = col * this.pixelSize + this.pixelSize / 2;
        const pixelCenterY = row * this.pixelSize + this.pixelSize / 2;
        const dist = Math.sqrt(
          Math.pow(pixelCenterX - this.centerX, 2) + 
          Math.pow(pixelCenterY - this.centerY, 2)
        );
        
        if (dist >= startRadius && dist <= endRadius) {
          pixels.push(row * this.cols + col);
        }
      }
    }
    
    return pixels;
  }

  public getProgress(): number {
    if (this.mode === 'fan') {
      return Math.min(100, (this.currentRadius / this.maxRadius) * 100);
    }
    return (this.currentPosition / this.scanPath.length) * 100;
  }

  public isComplete(): boolean {
    if (this.mode === 'fan') {
      return this.currentRadius >= this.maxRadius;
    }
    return this.currentPosition >= this.scanPath.length;
  }

  public getScanPath(): number[] {
    return [...this.scanPath];
  }

  public getCurrentPosition(): number {
    return this.currentPosition;
  }
}
