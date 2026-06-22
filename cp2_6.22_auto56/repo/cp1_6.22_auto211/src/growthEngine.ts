export interface RootNode {
  x: number;
  y: number;
  angle: number;
  targetLength: number;
  currentLength: number;
  baseSpeed: number;
  depth: number;
  isMain: boolean;
  isTip: boolean;
  isMerged: boolean;
  isGrowing: boolean;
  frameCount: number;
  children: RootNode[];
  parent: RootNode | null;
  startX: number;
  startY: number;
  branchCheckInterval: number;
  maxBranchDepth: number;
}

export interface MoisturePoint {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

export interface GrowthStats {
  totalLength: number;
  lateralRootCount: number;
  maxDepth: number;
  moistureLevel: number;
  nodeCount: number;
}

export interface GrowthConfig {
  speedMultiplier: number;
  showMoisture: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

const GRAVITY_ANGLE = Math.PI / 2;
const BASE_SPEED = 8;
const MIN_SPEED_FACTOR = 0.3;
const BRANCH_PROBABILITY = 0.6;
const BRANCH_MIN_INTERVAL = 30;
const BRANCH_MAX_INTERVAL = 50;
const LATERAL_MIN_RATIO = 0.3;
const LATERAL_MAX_RATIO = 0.6;
const ANGLE_VARIATION = Math.PI / 6;
const MOISTURE_INFLUENCE_RADIUS = 150;
const MOISTURE_ATTRACTION_FACTOR = 0.15;
const MERGE_THRESHOLD = 8000;
const MERGE_DEPTH_FACTOR = 0.8;

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class GrowthEngine {
  private roots: RootNode[] = [];
  private moisturePoints: MoisturePoint[] = [];
  private config: GrowthConfig;
  private seedY: number = 0;

  constructor(config: GrowthConfig) {
    this.config = config;
    this.generateMoisturePoints();
  }

  updateConfig(config: Partial<GrowthConfig>): void {
    const oldShowMoisture = this.config.showMoisture;
    this.config = { ...this.config, ...config };
    if (config.showMoisture !== undefined && config.showMoisture !== oldShowMoisture) {
      if (config.showMoisture && this.moisturePoints.length === 0) {
        this.generateMoisturePoints();
      }
    }
    if (config.canvasWidth !== undefined || config.canvasHeight !== undefined) {
      this.generateMoisturePoints();
    }
  }

  getConfig(): GrowthConfig {
    return { ...this.config };
  }

  private generateMoisturePoints(): void {
    this.moisturePoints = [];
    const count = Math.floor(randomRange(50, 100));
    for (let i = 0; i < count; i++) {
      this.moisturePoints.push({
        x: randomRange(0, this.config.canvasWidth),
        y: randomRange(0, this.config.canvasHeight),
        radius: randomRange(5, 15),
        opacity: randomRange(0.2, 0.5)
      });
    }
  }

  getMoisturePoints(): MoisturePoint[] {
    return this.moisturePoints;
  }

  plantSeed(x: number, y: number): void {
    this.seedY = y;
    const mainRoot: RootNode = {
      x,
      y,
      startX: x,
      startY: y,
      angle: GRAVITY_ANGLE,
      targetLength: this.config.canvasHeight * 0.8,
      currentLength: 0,
      baseSpeed: BASE_SPEED,
      depth: 0,
      isMain: true,
      isTip: true,
      isMerged: false,
      isGrowing: true,
      frameCount: 0,
      children: [],
      parent: null,
      branchCheckInterval: Math.floor(randomRange(BRANCH_MIN_INTERVAL, BRANCH_MAX_INTERVAL)),
      maxBranchDepth: 5
    };
    this.roots = [mainRoot];
  }

  private calculateMoistureInfluence(node: RootNode): number {
    if (!this.config.showMoisture || this.moisturePoints.length === 0) {
      return 0;
    }

    let totalInfluence = 0;
    let weightSum = 0;

    for (const point of this.moisturePoints) {
      const dx = point.x - node.x;
      const dy = point.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < MOISTURE_INFLUENCE_RADIUS && distance > 0) {
        const weight = (1 - distance / MOISTURE_INFLUENCE_RADIUS) * point.opacity;
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - node.angle;
        
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        totalInfluence += angleDiff * weight;
        weightSum += weight;
      }
    }

    if (weightSum === 0) return 0;
    return (totalInfluence / weightSum) * MOISTURE_ATTRACTION_FACTOR;
  }

  private getSpeedAtDepth(depth: number, baseSpeed: number): number {
    const reductionFactor = Math.floor(depth / 100) * 0.05;
    const factor = Math.max(MIN_SPEED_FACTOR, 1 - reductionFactor);
    return baseSpeed * factor * this.config.speedMultiplier;
  }

  private shouldBranch(node: RootNode): boolean {
    if (node.maxBranchDepth <= 0) return false;
    if (node.children.length >= 3) return false;
    if (node.frameCount < node.branchCheckInterval) return false;
    return Math.random() < BRANCH_PROBABILITY;
  }

  private createLateralRoot(parent: RootNode): RootNode {
    const direction = Math.random() > 0.5 ? 1 : -1;
    const angleOffset = direction * randomRange(0, ANGLE_VARIATION);
    const angle = GRAVITY_ANGLE + angleOffset;
    const lengthRatio = randomRange(LATERAL_MIN_RATIO, LATERAL_MAX_RATIO);
    const remainingLength = parent.targetLength - parent.currentLength;
    const targetLength = remainingLength * lengthRatio;

    return {
      x: parent.x,
      y: parent.y,
      startX: parent.x,
      startY: parent.y,
      angle,
      targetLength,
      currentLength: 0,
      baseSpeed: parent.baseSpeed * 0.7,
      depth: parent.depth,
      isMain: false,
      isTip: true,
      isMerged: false,
      isGrowing: true,
      frameCount: 0,
      children: [],
      parent,
      branchCheckInterval: Math.floor(randomRange(BRANCH_MIN_INTERVAL, BRANCH_MAX_INTERVAL)),
      maxBranchDepth: parent.maxBranchDepth - 1
    };
  }

  private updateNode(node: RootNode): void {
    if (!node.isGrowing) return;

    node.frameCount++;

    const speed = this.getSpeedAtDepth(node.depth, node.baseSpeed);
    const growthAmount = randomRange(speed * 0.6, speed * 1.2);

    const moistureInfluence = this.calculateMoistureInfluence(node);
    const targetAngle = node.angle + moistureInfluence;
    node.angle += (targetAngle - node.angle) * 0.1;

    const dx = Math.cos(node.angle) * growthAmount;
    const dy = Math.sin(node.angle) * growthAmount;

    node.x += dx;
    node.y += dy;
    node.currentLength += growthAmount;
    node.depth = node.y - this.seedY;

    if (this.shouldBranch(node)) {
      const lateral = this.createLateralRoot(node);
      node.children.push(lateral);
      node.frameCount = 0;
    }

    if (node.currentLength >= node.targetLength ||
        node.y >= this.config.canvasHeight - 10 ||
        node.x < 10 || node.x > this.config.canvasWidth - 10) {
      node.isGrowing = false;
      node.isTip = false;
    }

    for (const child of node.children) {
      this.updateNode(child);
    }
  }

  private mergeDistantNodes(): void {
    const allNodes = this.getAllNodes();
    if (allNodes.length < MERGE_THRESHOLD) return;

    let maxDepth = 0;
    for (const node of allNodes) {
      if (node.depth > maxDepth) maxDepth = node.depth;
    }

    const mergeDepth = maxDepth * MERGE_DEPTH_FACTOR;

    for (const node of allNodes) {
      if (!node.isGrowing && node.depth > mergeDepth && !node.isMain) {
        node.isMerged = true;
      }
    }
  }

  update(): void {
    for (const root of this.roots) {
      this.updateNode(root);
    }
    this.mergeDistantNodes();
  }

  private getAllNodes(): RootNode[] {
    const nodes: RootNode[] = [];
    const collect = (node: RootNode) => {
      nodes.push(node);
      for (const child of node.children) {
        collect(child);
      }
    };
    for (const root of this.roots) {
      collect(root);
    }
    return nodes;
  }

  getRoots(): RootNode[] {
    return this.roots;
  }

  getStats(): GrowthStats {
    const allNodes = this.getAllNodes();
    let totalLength = 0;
    let lateralRootCount = 0;
    let maxDepth = 0;

    for (const node of allNodes) {
      totalLength += node.currentLength;
      if (!node.isMain) lateralRootCount++;
      if (node.depth > maxDepth) maxDepth = node.depth;
    }

    const moistureLevel = this.config.showMoisture
      ? Math.floor(this.moisturePoints.reduce((sum, p) => sum + p.opacity, 0) / this.moisturePoints.length * 100)
      : 0;

    return {
      totalLength: Math.floor(totalLength),
      lateralRootCount,
      maxDepth: Math.floor(maxDepth),
      moistureLevel,
      nodeCount: allNodes.length
    };
  }

  reset(): void {
    this.roots = [];
    this.generateMoisturePoints();
  }
}
