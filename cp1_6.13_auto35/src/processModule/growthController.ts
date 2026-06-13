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
    this.leafShape = this.calculateLeafShape(features.contours);
    this.params = this.generateLSystemParams(features);
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

  private generateLSystemParams(features: ImageFeatures): LSystemParams {
    const pointCount = features.contours.length;
    const iterations = Math.min(5, Math.max(3, Math.floor(pointCount / 15) + 3));
    
    const avgX = features.contours.reduce((sum, p) => sum + Math.abs(p.x), 0) / pointCount;
    const spreadAngle = 15 + avgX * 30;
    
    const mainColor = features.colors[0];
    const greenness = this.getGreenness(mainColor);
    const baseAngle = 20 + greenness * 15;
    
    const angle = (baseAngle + spreadAngle) / 2 * (Math.PI / 180);
    const branchLength = 0.4 + greenness * 0.3;
    const branchRadius = 0.05 + greenness * 0.03;
    
    return {
      axiom: 'X',
      rules: {
        'X': 'F[+X][-X][&X][^X]F[+X][-X]X',
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

  private calculateLeafShape(points: Point2D[]): number {
    if (points.length < 3) return 1;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    
    const width = maxX - minX;
    const height = maxY - minY;
    const aspectRatio = height > 0 ? width / height : 1;
    
    return Math.max(0.3, Math.min(3, aspectRatio));
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
    
    const colorIndex = Math.min(turtle.level, this.colors.length - 1);
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
    const visibleCount = Math.floor(totalBranches * this.growthProgress);
    const nextBranchProgress = (totalBranches * this.growthProgress) - visibleCount;
    
    this.currentBranches = this.targetBranches.slice(0, visibleCount).map((branch, index) => {
      const branchProgress = Math.min(1, (index + 1) / (totalBranches * this.growthProgress) * this.growthProgress);
      const easedProgress = this.easeOut(branchProgress);
      
      return {
        ...branch,
        end: {
          x: branch.start.x + (branch.end.x - branch.start.x) * easedProgress,
          y: branch.start.y + (branch.end.y - branch.start.y) * easedProgress,
          z: branch.start.z + (branch.end.z - branch.start.z) * easedProgress
        }
      };
    });
    
    if (visibleCount < totalBranches && nextBranchProgress > 0) {
      const nextBranch = this.targetBranches[visibleCount];
      const easedProgress = this.easeOut(nextBranchProgress);
      
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
