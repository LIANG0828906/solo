export interface Point {
  x: number;
  y: number;
}

export interface Polygon {
  points: Point[];
  isFront: boolean;
  foldAngle: number;
  zIndex: number;
}

export interface CreaseLine {
  p1: Point;
  p2: Point;
  solid: boolean;
  stepIndex: number;
}

export interface FoldStep {
  name: string;
  crease: { p1: Point; p2: Point };
  foldDirection: number;
  targetAngle: number;
  description: string;
}

export class FoldEngine {
  private canvasWidth: number;
  private canvasHeight: number;
  private paperSize: number;
  private paperCenter: Point;
  private currentStep: number = 0;
  private foldProgress: number = 0;
  private isAnimating: boolean = false;
  private animationStartTime: number = 0;
  private stepDuration: number = 1500;
  private rotationY: number = 0;
  private targetRotationY: number = 0;
  private rotationDamping: number = 0.8;
  private maxRotation: number = Math.PI / 4;

  private foldSteps: FoldStep[] = [
    {
      name: '对角对折',
      crease: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
      foldDirection: 1,
      targetAngle: Math.PI,
      description: '沿对角线对折'
    },
    {
      name: '再次对折',
      crease: { p1: { x: 0, y: 1 }, p2: { x: 0.5, y: 0.5 } },
      foldDirection: -1,
      targetAngle: Math.PI,
      description: '沿中线再次对折'
    },
    {
      name: '展开压平',
      crease: { p1: { x: 0.5, y: 0 }, p2: { x: 0.5, y: 1 } },
      foldDirection: 1,
      targetAngle: Math.PI * 0.5,
      description: '展开压平成方形基础'
    },
    {
      name: '两侧内折',
      crease: { p1: { x: 0.25, y: 0 }, p2: { x: 0.25, y: 1 } },
      foldDirection: -1,
      targetAngle: Math.PI * 0.65,
      description: '两侧向中心线内折'
    },
    {
      name: '底部上折',
      crease: { p1: { x: 0, y: 0.7 }, p2: { x: 1, y: 0.7 } },
      foldDirection: 1,
      targetAngle: Math.PI * 0.55,
      description: '底部向上翻折'
    },
    {
      name: '折出翅膀',
      crease: { p1: { x: 0.1, y: 0.45 }, p2: { x: 0.9, y: 0.45 } },
      foldDirection: -1,
      targetAngle: Math.PI * 0.45,
      description: '折出千纸鹤翅膀'
    },
    {
      name: '折出头部',
      crease: { p1: { x: 0.4, y: 0.1 }, p2: { x: 0.5, y: 0.35 } },
      foldDirection: 1,
      targetAngle: Math.PI * 0.4,
      description: '折出千纸鹤头部'
    },
    {
      name: '整理完成',
      crease: { p1: { x: 0.5, y: 0.35 }, p2: { x: 0.6, y: 0.1 } },
      foldDirection: -1,
      targetAngle: Math.PI * 0.35,
      description: '整理完成千纸鹤'
    }
  ];

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.paperSize = Math.min(canvasWidth, canvasHeight) * 0.65;
    this.paperCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };
  }

  public startFolding(): void {
    if (this.isAnimating) return;
    if (this.currentStep >= this.foldSteps.length) return;
    this.isAnimating = true;
    this.animationStartTime = performance.now();
  }

  public update(): void {
    if (this.isAnimating) {
      const elapsed = performance.now() - this.animationStartTime;
      const stepProgress = Math.min(elapsed / this.stepDuration, 1);
      const easedProgress = this.easeInOutCubic(stepProgress);
      
      this.foldProgress = this.currentStep + easedProgress;

      if (stepProgress >= 1) {
        this.currentStep++;
        this.foldProgress = this.currentStep;
        this.isAnimating = false;
      }
    }

    this.rotationY += (this.targetRotationY - this.rotationY) * (1 - this.rotationDamping);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private paperToCanvas(p: Point): Point {
    const halfSize = this.paperSize / 2;
    return {
      x: this.paperCenter.x - halfSize + p.x * this.paperSize,
      y: this.paperCenter.y - halfSize + p.y * this.paperSize
    };
  }

  public setRotationY(angle: number): void {
    this.targetRotationY = Math.max(-this.maxRotation, Math.min(this.maxRotation, angle));
  }

  public getRotationY(): number {
    return this.rotationY;
  }

  public setProgress(progress: number): void {
    this.foldProgress = Math.max(0, Math.min(this.foldSteps.length, progress));
    this.currentStep = Math.floor(this.foldProgress);
  }

  public getProgress(): number {
    return this.foldProgress;
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public getTotalSteps(): number {
    return this.foldSteps.length;
  }

  public getCurrentStepName(): string {
    if (this.foldProgress <= 0) return '平铺状态';
    if (this.foldProgress >= this.foldSteps.length) return '折叠完成';
    const stepIndex = Math.floor(this.foldProgress);
    return this.foldSteps[stepIndex]?.name || '';
  }

  public isFolding(): boolean {
    return this.isAnimating;
  }

  public canFold(): boolean {
    return !this.isAnimating && this.currentStep < this.foldSteps.length;
  }

  public reset(): void {
    this.currentStep = 0;
    this.foldProgress = 0;
    this.isAnimating = false;
    this.rotationY = 0;
    this.targetRotationY = 0;
  }

  public getPolygons(): Polygon[] {
    return this.computeFoldedState();
  }

  public getCreases(): CreaseLine[] {
    const result: CreaseLine[] = [];
    const polygons = this.computeFoldedState();

    for (let i = 0; i < this.foldSteps.length; i++) {
      const step = this.foldSteps[i];
      if (!step) continue;

      let solid: boolean;
      if (i < Math.floor(this.foldProgress)) {
        solid = true;
      } else if (i === Math.floor(this.foldProgress) && this.foldProgress > i) {
        solid = false;
      } else {
        continue;
      }

      const creaseP1 = this.paperToCanvas(step.crease.p1);
      const creaseP2 = this.paperToCanvas(step.crease.p2);

      const intersections = this.findIntersectionsWithPolygons(creaseP1, creaseP2, polygons);
      
      if (intersections.length >= 2) {
        const sorted = this.sortPointsAlongLine(intersections, creaseP1, creaseP2);
        const start = sorted[0];
        const end = sorted[sorted.length - 1];
        
        if (start && end && this.distance(start, end) > 5) {
          result.push({ p1: start, p2: end, solid, stepIndex: i });
        }
      }
    }

    return result;
  }

  private findIntersectionsWithPolygons(
    lineP1: Point,
    lineP2: Point,
    polygons: Polygon[]
  ): Point[] {
    const intersections: Point[] = [];
    const eps = 2;

    for (const poly of polygons) {
      for (let i = 0; i < poly.points.length; i++) {
        const p1 = poly.points[i];
        const p2 = poly.points[(i + 1) % poly.points.length];
        const intersection = this.segmentIntersection(lineP1, lineP2, p1, p2);
        if (intersection) {
          const exists = intersections.some(p => 
            Math.abs(p.x - intersection.x) < eps && Math.abs(p.y - intersection.y) < eps
          );
          if (!exists) {
            intersections.push(intersection);
          }
        }
      }

      for (const p of poly.points) {
        const dist = this.pointToLineDistance(p, lineP1, lineP2);
        if (dist < eps) {
          const exists = intersections.some(ip => 
            Math.abs(ip.x - p.x) < eps && Math.abs(ip.y - p.y) < eps
          );
          if (!exists) {
            intersections.push({ ...p });
          }
        }
      }
    }

    return intersections;
  }

  private pointToLineDistance(p: Point, lineP1: Point, lineP2: Point): number {
    const A = p.x - lineP1.x;
    const B = p.y - lineP1.y;
    const C = lineP2.x - lineP1.x;
    const D = lineP2.y - lineP1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineP1.x;
      yy = lineP1.y;
    } else if (param > 1) {
      xx = lineP2.x;
      yy = lineP2.y;
    } else {
      xx = lineP1.x + param * C;
      yy = lineP1.y + param * D;
    }

    const dx = p.x - xx;
    const dy = p.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private sortPointsAlongLine(points: Point[], lineP1: Point, lineP2: Point): Point[] {
    const dx = lineP2.x - lineP1.x;
    const dy = lineP2.y - lineP1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    return [...points].sort((a, b) => {
      const projA = ((a.x - lineP1.x) * dx + (a.y - lineP1.y) * dy) / len;
      const projB = ((b.x - lineP1.x) * dx + (b.y - lineP1.y) * dy) / len;
      return projA - projB;
    });
  }

  private distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  private computeFoldedState(): Polygon[] {
    const halfSize = this.paperSize / 2;
    const cx = this.paperCenter.x;
    const cy = this.paperCenter.y;

    let polygons: Polygon[] = [
      {
        points: [
          { x: cx - halfSize, y: cy - halfSize },
          { x: cx + halfSize, y: cy - halfSize },
          { x: cx + halfSize, y: cy + halfSize },
          { x: cx - halfSize, y: cy + halfSize }
        ],
        isFront: true,
        foldAngle: 0,
        zIndex: 0
      }
    ];

    for (let stepIndex = 0; stepIndex < this.foldSteps.length; stepIndex++) {
      const step = this.foldSteps[stepIndex];
      if (!step) continue;

      let progress: number;
      if (stepIndex < Math.floor(this.foldProgress)) {
        progress = 1;
      } else if (stepIndex === Math.floor(this.foldProgress)) {
        progress = this.foldProgress - stepIndex;
      } else {
        continue;
      }

      if (progress <= 0) continue;

      const angle = step.targetAngle * this.easeInOutCubic(progress);
      const creaseP1 = this.paperToCanvas(step.crease.p1);
      const creaseP2 = this.paperToCanvas(step.crease.p2);

      const newPolygons: Polygon[] = [];
      let zIncrement = 0.5;

      for (const poly of polygons) {
        const split = this.splitPolygonByLine(poly, creaseP1, creaseP2);
        
        if (split.length === 2) {
          const [sideA, sideB] = split;
          
          const sideOfA = this.pointLineSide(creaseP1, creaseP2, this.polygonCenter(sideA));
          
          let foldPoly: Polygon;
          let staticPoly: Polygon;
          
          if ((sideOfA > 0 && step.foldDirection > 0) || 
              (sideOfA < 0 && step.foldDirection < 0)) {
            foldPoly = sideA;
            staticPoly = sideB;
          } else {
            foldPoly = sideB;
            staticPoly = sideA;
          }

          const folded = this.foldPolygonOverLine(foldPoly, creaseP1, creaseP2, angle);
          folded.zIndex = poly.zIndex + zIncrement;
          staticPoly.zIndex = poly.zIndex;
          
          newPolygons.push(staticPoly);
          newPolygons.push(folded);
          
          zIncrement += 0.01;
        } else {
          newPolygons.push(poly);
        }
      }

      if (newPolygons.length > polygons.length) {
        polygons = newPolygons;
      }
    }

    const perspectivePolygons = polygons.map(p => ({
      ...p,
      points: p.points.map(pt => this.applyPerspective(pt, p.zIndex))
    }));

    return perspectivePolygons.sort((a, b) => a.zIndex - b.zIndex);
  }

  private polygonCenter(poly: Polygon): Point {
    let sumX = 0, sumY = 0;
    for (const p of poly.points) {
      sumX += p.x;
      sumY += p.y;
    }
    return { x: sumX / poly.points.length, y: sumY / poly.points.length };
  }

  private applyPerspective(point: Point, zIndex: number): Point {
    const dx = point.x - this.paperCenter.x;
    const rotCos = Math.cos(this.rotationY);
    const zFactor = 1 + zIndex * 0.03;
    const newX = this.paperCenter.x + dx * rotCos * zFactor;
    
    return { x: newX, y: point.y };
  }

  private splitPolygonByLine(poly: Polygon, p1: Point, p2: Point): Polygon[] {
    const points = poly.points;
    const side1: Point[] = [];
    const side2: Point[] = [];
    const eps = 0.1;

    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      
      const sideCurrent = this.pointLineSide(p1, p2, current);
      const sideNext = this.pointLineSide(p1, p2, next);

      if (sideCurrent >= -eps) {
        if (side1.length === 0 || this.distance(side1[side1.length - 1], current) > eps) {
          side1.push({ ...current });
        }
      }
      if (sideCurrent <= eps) {
        if (side2.length === 0 || this.distance(side2[side2.length - 1], current) > eps) {
          side2.push({ ...current });
        }
      }

      if ((sideCurrent > eps && sideNext < -eps) || (sideCurrent < -eps && sideNext > eps)) {
        const intersection = this.segmentIntersection(p1, p2, current, next);
        if (intersection) {
          side1.push({ ...intersection });
          side2.push({ ...intersection });
        }
      }
    }

    const result: Polygon[] = [];
    
    if (side1.length >= 3) {
      const cleaned = this.cleanPolygon(side1);
      if (cleaned.length >= 3) {
        result.push({ ...poly, points: cleaned });
      }
    }
    if (side2.length >= 3) {
      const cleaned = this.cleanPolygon(side2);
      if (cleaned.length >= 3) {
        result.push({ ...poly, points: cleaned, isFront: !poly.isFront });
      }
    }

    return result.length > 0 ? result : [poly];
  }

  private cleanPolygon(points: Point[]): Point[] {
    if (points.length <= 3) return points;
    
    const cleaned: Point[] = [];
    const eps = 1;
    
    for (let i = 0; i < points.length; i++) {
      const curr = points[i];
      const prev = cleaned.length > 0 ? cleaned[cleaned.length - 1] : null;
      
      if (!prev || this.distance(prev, curr) > eps) {
        const prevPrev = cleaned.length > 1 ? cleaned[cleaned.length - 2] : null;
        if (prevPrev && prev) {
          const cross = (prev.x - prevPrev.x) * (curr.y - prev.y) - (prev.y - prevPrev.y) * (curr.x - prev.x);
          if (Math.abs(cross) > 1) {
            cleaned.push({ ...curr });
          }
        } else {
          cleaned.push({ ...curr });
        }
      }
    }
    
    if (cleaned.length > 3 && this.distance(cleaned[0], cleaned[cleaned.length - 1]) < eps) {
      cleaned.pop();
    }
    
    return cleaned.length >= 3 ? cleaned : points;
  }

  private pointLineSide(p1: Point, p2: Point, p: Point): number {
    return (p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x);
  }

  private segmentIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(denom) < 0.0001) return null;

    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

    if (ua >= -0.001 && ua <= 1.001 && ub >= -0.001 && ub <= 1.001) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y)
      };
    }

    return null;
  }

  private foldPolygonOverLine(poly: Polygon, p1: Point, p2: Point, angle: number): Polygon {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lineAngle = Math.atan2(dy, dx);
    
    const cosA = Math.cos(angle);

    const rotatedPoints = poly.points.map(p => {
      const localX = (p.x - p1.x) * Math.cos(-lineAngle) - (p.y - p1.y) * Math.sin(-lineAngle);
      const localY = (p.x - p1.x) * Math.sin(-lineAngle) + (p.y - p1.y) * Math.cos(-lineAngle);

      const foldedLocalY = localY * cosA;

      const worldX = localX * Math.cos(lineAngle) - foldedLocalY * Math.sin(lineAngle) + p1.x;
      const worldY = localX * Math.sin(lineAngle) + foldedLocalY * Math.cos(lineAngle) + p1.y;

      return { x: worldX, y: worldY };
    });

    const flipped = Math.abs(angle) > Math.PI / 2;

    return {
      points: rotatedPoints,
      isFront: flipped ? !poly.isFront : poly.isFront,
      foldAngle: angle,
      zIndex: poly.zIndex
    };
  }

  public getPaperCenter(): Point {
    return this.paperCenter;
  }

  public getPaperSize(): number {
    return this.paperSize;
  }
}
