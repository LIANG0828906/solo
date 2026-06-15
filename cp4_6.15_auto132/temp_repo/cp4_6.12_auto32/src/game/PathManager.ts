export interface Point {
  x: number;
  y: number;
}

export interface HexCoord {
  q: number;
  r: number;
}

export class PathManager {
  private hexSize: number;
  private offsetX: number;
  private offsetY: number;
  private hexPath: HexCoord[];

  public pathPoints: Point[];
  public totalLength: number;
  public segmentLengths: number[];

  constructor(hexSize: number) {
    this.hexSize = hexSize;
    this.offsetX = hexSize * 1.2;
    this.offsetY = hexSize * 1.2;

    this.hexPath = [
      { q: 0, r: 7 },
      { q: 3, r: 7 },
      { q: 3, r: 3 },
      { q: 7, r: 3 },
      { q: 7, r: 11 },
      { q: 11, r: 11 },
      { q: 11, r: 5 },
      { q: 15, r: 5 },
      { q: 15, r: 9 },
      { q: 19, r: 9 },
      { q: 19, r: 7 },
    ];

    this.pathPoints = this.hexPath.map(hex => this.hexToPixel(hex));
    this.segmentLengths = [];
    this.totalLength = 0;
    this.calculateTotalLength();
  }

  private hexToPixel(hex: HexCoord): Point {
    const width = this.hexSize * 1.5;
    const height = this.hexSize * Math.sqrt(3);
    const x = this.offsetX + hex.q * width;
    const y = this.offsetY + hex.r * height + (hex.q % 2 === 1 ? height / 2 : 0);
    return { x, y };
  }

  private calculateTotalLength(): void {
    this.segmentLengths = [];
    this.totalLength = 0;

    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const p1 = this.pathPoints[i];
      const p2 = this.pathPoints[i + 1];
      const length = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      this.segmentLengths.push(length);
      this.totalLength += length;
    }
  }

  public getPositionAtProgress(progress: number): Point {
    if (progress <= 0) {
      return { ...this.pathPoints[0] };
    }
    if (progress >= 1) {
      return { ...this.pathPoints[this.pathPoints.length - 1] };
    }

    const targetDistance = progress * this.totalLength;
    let accumulated = 0;

    for (let i = 0; i < this.segmentLengths.length; i++) {
      const segmentLength = this.segmentLengths[i];
      if (accumulated + segmentLength >= targetDistance) {
        const segmentProgress = (targetDistance - accumulated) / segmentLength;
        const p1 = this.pathPoints[i];
        const p2 = this.pathPoints[i + 1];
        return {
          x: p1.x + (p2.x - p1.x) * segmentProgress,
          y: p1.y + (p2.y - p1.y) * segmentProgress,
        };
      }
      accumulated += segmentLength;
    }

    return { ...this.pathPoints[this.pathPoints.length - 1] };
  }

  public getSegmentLength(progress: number): number {
    if (progress <= 0 || progress >= 1) {
      return 0;
    }

    const targetDistance = progress * this.totalLength;
    let accumulated = 0;

    for (let i = 0; i < this.segmentLengths.length; i++) {
      const segmentLength = this.segmentLengths[i];
      if (accumulated + segmentLength >= targetDistance) {
        return segmentLength;
      }
      accumulated += segmentLength;
    }

    return 0;
  }
}
