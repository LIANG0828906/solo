import { Point2D, ImageFeatures } from './imageProcessor';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BranchData {
  start: Vector3;
  end: Vector3;
  radius: number;
  color: string;
  level: number;
  hasLeaf: boolean;
  leafShape: number;
  rotation: number;
}

export interface LSystemParams {
  axiom: string;
  rules: { [key: string]: string };
  angle: number;
  iterations: number;
  branchLength: number;
  branchRadius: number;
}

interface TurtleState {
  position: Vector3;
  heading: Vector3;
  level: number;
  rotation: number;
}

interface Rect {
  center: Point2D;
  size: Point2D;
  angle: number;
}

type GrowthState = 'idle' | 'growing' | 'complete' | 'fading-out' | 'fading-in';

export class GrowthController {
  private params!: LSystemParams;
  private colors: string[] = [];
  private contourPoints: Point2D[] = [];
  private leafShape: number = 1;
  
  private currentBranches: BranchData[] = [];
  private targetBranches: BranchData[] = [];
  
  private growthProgress: number = 0;
  private growthDuration: number = 8;
  private state: GrowthState = 'idle';
  
  private time: number = 0;

  public initialize(features: ImageFeatures): void {
    this.colors = features.colors;
    this.contourPoints = features.contours;
    
    const convexHull = this.computeConvexHull(features.contours);
    const minRect = this.computeMinBoundingRect(convexHull);
    const hullAspectRatio = this.computeHullAspectRatio(convexHull, minRect);
    
    this.leafShape = this.calculateLeafShape(hullAspectRatio);
    this.params = this.generateLSystemParams(features, convexHull);
    this.targetBranches = this.generateBranches();
    this.currentBranches = [];
    this.growthProgress = 0;
    this.state = 'growing';
    this.time = 0;
  }

  public update(deltaTime: number): void {
    this.time += deltaTime;
    
    if (this.state === 'growing') {
      this.growthProgress = Math.min(1, this.growthProgress + deltaTime / this.growthDuration);
      this.updateCurrentBranches();
      
      if (this.growthProgress >= 1) {
        this.state = 'complete';
      }
    }
  }

  public getBranches(): BranchData[] {
    return this.currentBranches;
  }

  public getColors(): string[] {
    return this.colors;
  }

  public getLeafShape(): number {
    return this.leafShape;
  }

  public getGrowthProgress(): number {
    return this.growthProgress;
  }

  public getState(): GrowthState {
    return this.state;
  }

  public reset(): void {
    this.state = 'idle';
    this.growthProgress = 0;
    this.currentBranches = [];
    this.targetBranches = [];
    this.time = 0;
  }

  public restartGrowth(): void {
    this.growthProgress = 0;
    this.currentBranches = [];
    this.state = 'growing';
    this.time = 0;
  }

  public setState(state: GrowthState): void {
    this.state = state;
  }

  private cross2D(o: Point2D, a: Point2D, b: Point2D): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  private computeConvexHull(points: Point2D[]): Point2D[] {
    if (points.length < 3) return points.slice();
    
    const sorted = points.slice().sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      return a.y - b.y;
    });
    
    const lower: Point2D[] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && this.cross2D(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
        lower.pop();
      }
      lower.push(p);
    }
    
    const upper: Point2D[] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && this.cross2D(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
        upper.pop();
      }
      upper.push(p);
    }
    
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }

  private rotatePoint(p: Point2D, center: Point2D, angle: number): Point2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }

  private computeMinBoundingRect(hull: Point2D[]): Rect {
    if (hull.length < 3) {
      if (hull.length === 0) {
        return { center: { x: 0, y: 0 }, size: { x: 1, y: 1 }, angle: 0 };
      }
      if (hull.length === 1) {
        return { center: { ...hull[0] }, size: { x: 0.1, y: 0.1 }, angle: 0 };
      }
      const dx = hull[1].x - hull[0].x;
      const dy = hull[1].y - hull[0].y;
      const len = Math.sqrt(dx * dx + dy * dy) || 0.1;
      const angle = Math.atan2(dy, dx);
      return {
        center: { x: (hull[0].x + hull[1].x) / 2, y: (hull[0].y + hull[1].y) / 2 },
        size: { x: len, y: 0.1 },
        angle
      };
    }
    
    let minArea = Infinity;
    let bestRect: Rect = { center: { x: 0, y: 0 }, size: { x: 1, y: 1 }, angle: 0 };
    const n = hull.length;
    
    for (let i = 0; i < n; i++) {
      const p1 = hull[i];
      const p2 = hull[(i + 1) % n];
      const edgeAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      for (const p of hull) {
        const rotated = this.rotatePoint(p, p1, -edgeAngle);
        minX = Math.min(minX, rotated.x);
        maxX = Math.max(maxX, rotated.x);
        minY = Math.min(minY, rotated.y);
        maxY = Math.max(maxY, rotated.y);
      }
      
      const width = maxX - minX;
      const height = maxY - minY;
      const area = width * height;
      
      if (area < minArea && area > 0) {
        minArea = area;
        const centerRotated = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        const center = this.rotatePoint(centerRotated, p1, edgeAngle);
        bestRect = {
          center,
          size: { x: width, y: height },
          angle: edgeAngle
        };
      }
    }
    
    return bestRect;
  }

  private computeHullAspectRatio(hull: Point2D[], rect: Rect): number {
    if (rect.size.x === 0 || rect.size.y === 0) return 1;
    const major = Math.max(rect.size.x, rect.size.y);
    const minor = Math.min(rect.size.x, rect.size.y);
    return major / minor;
  }

  private computeEccentricity(points: Point2D[]): number {
    if (points.length < 2) return 0;
    
    let meanX = 0, meanY = 0;
    for (const p of points) {
      meanX += p.x;
      meanY += p.y;
    }
    meanX /= points.length;
    meanY /= points.length;
    
    let xx = 0, yy = 0, xy = 0;
    for (const p of points) {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      xx += dx * dx;
      yy += dy * dy;
      xy += dx * dy;
    }
    
    const trace = xx + yy;
    const det = xx * yy - xy * xy;
    const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
    const lambda1 = trace / 2 + disc;
    const lambda2 = trace / 2 - disc;
    
    if (lambda1 <= 0) return 0;
    return 1 - Math.sqrt(lambda2 / lambda1);
  }

  private computePrincipalDirection(points: Point2D[]): number {
    if (points.length < 2) return -Math.PI / 2;
    
    let meanX = 0, meanY = 0;
    for (const p of points) {
      meanX += p.x;
      meanY += p.y;
    }
    meanX /= points.length;
    meanY /= points.length;
    
    let xx = 0, yy = 0, xy = 0;
    for (const p of points) {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      xx += dx * dx;
      yy += dy * dy;
      xy += dx * dy;
    }
    
    const theta = 0.5 * Math.atan2(2 * xy, xx - yy);
    return theta;
  }

  private calculateLeafShape(aspectRatio: number): number {
    return Math.max(0.3, Math.min(3, aspectRatio));
  }

  private generateLSystemParams(features: ImageFeatures, convexHull: Point2D[]): LSystemParams {
    const pointCount = features.contours.length;
    const hullRatio = pointCount > 0 ? convexHull.length / pointCount : 1;
    
    const complexity = pointCount * (1 - hullRatio);
    const iterations = Math.min(6, Math.max(3, Math.floor(complexity / 8) + 3));
    
    const principalDir = this.computePrincipalDirection(features.contours);
    const eccentricity = this.computeEccentricity(features.contours);
    
    let avgY = 0;
    let avgAbsX = 0;
    for (const p of features.contours) {
      avgY += p.y;
      avgAbsX += Math.abs(p.x);
    }
    avgY /= pointCount || 1;
    avgAbsX /= pointCount || 1;
    
    const upwardBias = Math.max(0, Math.min(1, (-avgY + 1) / 2));
    const widthSpread = Math.max(0, Math.min(1, avgAbsX));
    
    const dirInfluence = Math.abs(Math.sin(principalDir + Math.PI / 2));
    const baseAngle = 18 + eccentricity * 15 + dirInfluence * 5;
    const spreadAngle = 10 + widthSpread * 25;
    const angle = (baseAngle + spreadAngle) / 2 * (Math.PI / 180);
    
    const mainColor = features.colors[0];
    const greenness = this.getGreenness(mainColor);
    const branchLength = (0.35 + greenness * 0.3) * (1 + upwardBias * 0.3);
    const branchRadius = 0.05 + greenness * 0.03;
    
    const upwardWeight = 1 + upwardBias * 0.5;
    const sideWeight = 0.6 + widthSpread * 0.8;
    
    let xRule = 'F';
    for (let i = 0; i < Math.ceil(sideWeight); i++) {
      xRule += '[+X]';
    }
    for (let i = 0; i < Math.ceil(sideWeight); i++) {
      xRule += '[-X]';
    }
    if (upwardWeight > 1.2) {
      xRule += '[&X]';
    }
    xRule += 'F';
    if (upwardWeight > 1) {
      xRule += 'X';
    } else {
      xRule += '[+X][-X]X';
    }
    
    return {
      axiom: 'X',
      rules: {
        'X': xRule,
        'F': 'FF'
      },
      angle,
      iterations,
      branchLength,
      branchRadius
    };
  }

  private getGreenness(hexColor: string): number {
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;
    return Math.max(0, Math.min(1, g - Math.max(r, b) + 0.3));
  }

  private generateBranches(): BranchData[] {
    const result: BranchData[] = [];
    const lSystemString = this.iterateLSystem();
    
    const turtle: TurtleState = {
      position: { x: 0, y: 0, z: 0 },
      heading: { x: 0, y: 1, z: 0 },
      level: 0,
      rotation: 0
    };
    
    const stack: TurtleState[] = [];
    const pointIndex = { value: 0 };
    
    for (let i = 0; i < lSystemString.length; i++) {
      const char = lSystemString[i];
      
      switch (char) {
        case 'F':
        case 'G':
          this.processForward(turtle, result, pointIndex);
          break;
        case '+':
          this.rotateHeading(turtle, this.params.angle);
          break;
        case '-':
          this.rotateHeading(turtle, -this.params.angle);
          break;
        case '&':
          this.pitchHeading(turtle, this.params.angle);
          break;
        case '^':
          this.pitchHeading(turtle, -this.params.angle);
          break;
        case '\\':
          turtle.rotation += this.params.angle * 0.5;
          break;
        case '/':
          turtle.rotation -= this.params.angle * 0.5;
          break;
        case '[':
          stack.push({
            position: { ...turtle.position },
            heading: { ...turtle.heading },
            level: turtle.level,
            rotation: turtle.rotation
          });
          turtle.level++;
          break;
        case ']':
          const state = stack.pop();
          if (state) {
            turtle.position = state.position;
            turtle.heading = state.heading;
            turtle.level = state.level;
            turtle.rotation = state.rotation;
          }
          break;
      }
    }
    
    return result;
  }

  private iterateLSystem(): string {
    let result = this.params.axiom;
    
    for (let i = 0; i < this.params.iterations; i++) {
      let newResult = '';
      for (const char of result) {
        newResult += this.params.rules[char] || char;
      }
      result = newResult;
    }
    
    return result;
  }

  private processForward(turtle: TurtleState, result: BranchData[], pointIndex: { value: number }): void {
    const contourInfluence = this.getContourInfluence(pointIndex.value);
    const length = this.params.branchLength * (0.7 + contourInfluence * 0.6);
    const radius = this.params.branchRadius * (1 - turtle.level * 0.15);
    
    const start = { ...turtle.position };
    const end = {
      x: turtle.position.x + turtle.heading.x * length,
      y: turtle.position.y + turtle.heading.y * length,
      z: turtle.position.z + turtle.heading.z * length
    };
    
    const colorIndex = turtle.level === 0 ? 0 : Math.min(turtle.level, this.colors.length - 1);
    const hasLeaf = turtle.level >= this.params.iterations - 1 && Math.random() > 0.3;
    
    result.push({
      start,
      end,
      radius: Math.max(0.01, radius),
      color: this.colors[colorIndex] || this.colors[0],
      level: turtle.level,
      hasLeaf,
      leafShape: this.leafShape,
      rotation: turtle.rotation
    });
    
    turtle.position = end;
    pointIndex.value++;
  }

  private getContourInfluence(index: number): number {
    if (this.contourPoints.length === 0) return 0.5;
    const point = this.contourPoints[index % this.contourPoints.length];
    return (Math.abs(point.x) + Math.abs(point.y)) / 2;
  }

  private rotateHeading(turtle: TurtleState, angle: number): void {
    const { x, y, z } = turtle.heading;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    turtle.heading = {
      x: x * cos - z * sin,
      y,
      z: x * sin + z * cos
    };
  }

  private pitchHeading(turtle: TurtleState, angle: number): void {
    const { x, y, z } = turtle.heading;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    turtle.heading = {
      x,
      y: y * cos - z * sin,
      z: y * sin + z * cos
    };
  }

  private updateCurrentBranches(): void {
    const totalBranches = this.targetBranches.length;
    if (totalBranches === 0) {
      this.currentBranches = [];
      return;
    }
    
    const easedGlobalProgress = this.easeOut(this.growthProgress);
    const visibleFloat = totalBranches * easedGlobalProgress;
    const visibleCount = Math.floor(visibleFloat);
    const nextBranchProgress = visibleFloat - visibleCount;
    
    this.currentBranches = [];
    
    for (let i = 0; i < visibleCount && i < totalBranches; i++) {
      const branch = this.targetBranches[i];
      const branchStart = i / totalBranches;
      const branchEnd = (i + 1) / totalBranches;
      const branchLocalProgress = Math.max(0, Math.min(1, 
        (this.growthProgress - branchStart) / (branchEnd - branchStart)
      ));
      const easedProgress = this.easeOut(branchLocalProgress);
      
      this.currentBranches.push({
        ...branch,
        end: {
          x: branch.start.x + (branch.end.x - branch.start.x) * easedProgress,
          y: branch.start.y + (branch.end.y - branch.start.y) * easedProgress,
          z: branch.start.z + (branch.end.z - branch.start.z) * easedProgress
        }
      });
    }
    
    if (visibleCount < totalBranches && nextBranchProgress > 0) {
      const nextBranch = this.targetBranches[visibleCount];
      const branchStart = visibleCount / totalBranches;
      const branchEnd = (visibleCount + 1) / totalBranches;
      const branchLocalProgress = Math.max(0, Math.min(1,
        (this.growthProgress - branchStart) / (branchEnd - branchStart)
      ));
      const easedProgress = this.easeOut(branchLocalProgress);
      
      this.currentBranches.push({
        ...nextBranch,
        end: {
          x: nextBranch.start.x + (nextBranch.end.x - nextBranch.start.x) * easedProgress,
          y: nextBranch.start.y + (nextBranch.end.y - nextBranch.start.y) * easedProgress,
          z: nextBranch.start.z + (nextBranch.end.z - nextBranch.start.z) * easedProgress
        }
      });
    }
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public getTime(): number {
    return this.time;
  }
}
