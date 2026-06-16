import { v4 as uuidv4 } from 'uuid';

export type RuneShape = 'triangle' | 'circle' | 'square' | 'diamond' | 'hexagon' | 'spiral' | 'lightning';

export interface Point {
  x: number;
  y: number;
  timestamp: number;
  speed: number;
}

export interface RuneNode {
  id: string;
  shape: RuneShape;
  color: string;
  x: number;
  y: number;
  size: number;
  activated: boolean;
  energy: number;
  pulsePhase: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface LightChain {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  duration: number;
  elapsed: number;
  color: string;
  active: boolean;
}

export interface TextEffect {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  blur: number;
  elapsed: number;
  duration: number;
  active: boolean;
}

export interface FlashEffect {
  id: string;
  opacity: number;
  elapsed: number;
  duration: number;
  active: boolean;
}

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  matchThreshold: number;
  chainInterval: number;
  label: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { matchThreshold: 0.7, chainInterval: 1500, label: '简单' },
  normal: { matchThreshold: 0.8, chainInterval: 1000, label: '普通' },
  hard: { matchThreshold: 0.9, chainInterval: 600, label: '困难' }
};

const SHAPE_COLORS: Record<RuneShape, string> = {
  triangle: '#6A5ACD',
  circle: '#95A5A6',
  square: '#3498DB',
  diamond: '#2ECC71',
  hexagon: '#E74C3C',
  spiral: '#9B59B6',
  lightning: '#F1C40F'
};

type EngineEvent =
  | { type: 'runeCompleted'; shape: RuneShape; matchScore: number }
  | { type: 'nodeActivated'; nodeId: string; shape: RuneShape }
  | { type: 'chainTriggered'; count: number; score: number }
  | { type: 'scoreUpdated'; score: number }
  | { type: 'difficultyChanged'; difficulty: Difficulty };

type EventCallback = (event: EngineEvent) => void;

export class RuneEngine {
  private listeners: EventCallback[] = [];
  private particles: Particle[] = [];
  private chains: LightChain[] = [];
  private textEffects: TextEffect[] = [];
  private flashEffects: FlashEffect[] = [];
  private nodes: RuneNode[] = [];
  private currentStroke: Point[] = [];
  private isDrawing = false;
  private drawForce = 0;
  private completedRuneShape: RuneShape | null = null;
  private completedRunePoints: Point[] = [];
  private runeFormationTime = 0;
  private runePulsePhase = 0;
  private score = 0;
  private chainCount = 0;
  private totalChainCount = 0;
  private activatedNodesOrder: string[] = [];
  private difficulty: Difficulty = 'normal';
  private lastChainTime = 0;
  private drawAreaSize = 720;
  private drawAreaX = 0;
  private drawAreaY = 0;

  constructor() {
    this.initNodes();
  }

  on(callback: EventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emit(event: EngineEvent): void {
    this.listeners.forEach(l => l(event));
  }

  setCanvasSize(width: number, height: number): void {
    this.drawAreaX = (width - this.drawAreaSize) / 2;
    this.drawAreaY = (height - this.drawAreaSize) / 2;
    this.initNodes();
  }

  getDrawArea(): { x: number; y: number; size: number } {
    return { x: this.drawAreaX, y: this.drawAreaY, size: this.drawAreaSize };
  }

  private initNodes(): void {
    const shapes: RuneShape[] = ['diamond', 'circle', 'hexagon', 'triangle', 'spiral', 'lightning', 'square'];
    const positions = this.getNodePositions();
    this.nodes = shapes.slice(0, positions.length).map((shape, i) => ({
      id: uuidv4(),
      shape,
      color: SHAPE_COLORS[shape],
      x: positions[i].x,
      y: positions[i].y,
      size: 55,
      activated: false,
      energy: 0,
      pulsePhase: (i * Math.PI * 2) / positions.length
    }));
  }

  private getNodePositions(): { x: number; y: number }[] {
    const cx = this.drawAreaX + this.drawAreaSize / 2;
    const cy = this.drawAreaY + this.drawAreaSize / 2;
    const radius = this.drawAreaSize / 2 + 90;
    const count = 6;
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      positions.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    }
    return positions;
  }

  getNodes(): RuneNode[] {
    return this.nodes;
  }

  getScore(): number {
    return this.score;
  }

  getChainCount(): number {
    return this.totalChainCount;
  }

  getDrawForce(): number {
    return this.drawForce;
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
    this.emit({ type: 'difficultyChanged', difficulty });
  }

  getActivatedNodesOrder(): string[] {
    return this.activatedNodesOrder;
  }

  isCurrentlyDrawing(): boolean {
    return this.isDrawing;
  }

  getCurrentStroke(): Point[] {
    return this.currentStroke;
  }

  getCompletedRune(): { shape: RuneShape | null; points: Point[]; formationTime: number; pulsePhase: number } {
    return {
      shape: this.completedRuneShape,
      points: this.completedRunePoints,
      formationTime: this.runeFormationTime,
      pulsePhase: this.runePulsePhase
    };
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getChains(): LightChain[] {
    return this.chains;
  }

  getTextEffects(): TextEffect[] {
    return this.textEffects;
  }

  getFlashEffects(): FlashEffect[] {
    return this.flashEffects;
  }

  startDrawing(x: number, y: number): void {
    if (this.isInDrawArea(x, y)) {
      this.isDrawing = true;
      this.currentStroke = [];
      this.drawForce = 0;
      this.addPoint(x, y);
    }
  }

  continueDrawing(x: number, y: number): void {
    if (!this.isDrawing) return;
    if (this.isInDrawArea(x, y)) {
      this.addPoint(x, y);
    }
  }

  endDrawing(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.currentStroke.length > 10) {
      this.processStroke();
    } else {
      this.currentStroke = [];
    }
    this.drawForce = 0;
  }

  private isInDrawArea(x: number, y: number): boolean {
    const padding = 30;
    return (
      x >= this.drawAreaX + padding &&
      x <= this.drawAreaX + this.drawAreaSize - padding &&
      y >= this.drawAreaY + padding &&
      y <= this.drawAreaY + this.drawAreaSize - padding
    );
  }

  private addPoint(x: number, y: number): void {
    const now = performance.now();
    const lastPoint = this.currentStroke[this.currentStroke.length - 1];
    let speed = 0;
    if (lastPoint) {
      const dx = x - lastPoint.x;
      const dy = y - lastPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dt = Math.max(1, now - lastPoint.timestamp);
      speed = dist / dt;
      this.drawForce = Math.min(100, this.drawForce + dist * 0.15);
    }
    this.currentStroke.push({ x, y, timestamp: now, speed });
    this.spawnTrailParticles(x, y, speed);
  }

  private spawnTrailParticles(x: number, y: number, speed: number): void {
    const t = Math.min(1, speed / 3);
    const color = this.lerpColor('#6A5ACD', '#FFD700', t);
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        id: uuidv4(),
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 0,
        maxLife: 600 + Math.random() * 400,
        color,
        size: 2 + Math.random() * 2
      });
    }
  }

  private lerpColor(color1: string, color2: string, t: number): string {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);
    if (!c1 || !c2) return color1;
    const r = Math.round(c1.r + (c2.r - c1.r) * t);
    const g = Math.round(c1.g + (c2.g - c1.g) * t);
    const b = Math.round(c1.b + (c2.b - c1.b) * t);
    return `rgb(${r},${g},${b})`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : null;
  }

  private processStroke(): void {
    const normalized = this.normalizePoints(this.currentStroke);
    const matchResult = this.matchShape(normalized);
    const config = DIFFICULTY_CONFIG[this.difficulty];

    if (matchResult.score >= config.matchThreshold) {
      this.completedRuneShape = matchResult.shape;
      this.completedRunePoints = [...this.currentStroke];
      this.runeFormationTime = performance.now();
      this.runePulsePhase = 0;
      this.emit({ type: 'runeCompleted', shape: matchResult.shape, matchScore: matchResult.score });
      this.checkAndActivateNodes(matchResult.shape);
    }
    this.currentStroke = [];
  }

  private normalizePoints(points: Point[]): { x: number; y: number }[] {
    if (points.length === 0) return [];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const scale = Math.max(w, h);
    return points.map(p => ({
      x: (p.x - minX) / scale,
      y: (p.y - minY) / scale
    }));
  }

  private matchShape(points: { x: number; y: number }[]): { shape: RuneShape; score: number } {
    if (points.length < 5) return { shape: 'circle', score: 0 };

    const scores: Record<RuneShape, number> = {
      triangle: this.scoreTriangle(points),
      circle: this.scoreCircle(points),
      square: this.scoreSquare(points),
      diamond: this.scoreDiamond(points),
      hexagon: this.scoreHexagon(points),
      spiral: this.scoreSpiral(points),
      lightning: this.scoreLightning(points)
    };

    let bestShape: RuneShape = 'circle';
    let bestScore = 0;
    (Object.keys(scores) as RuneShape[]).forEach(shape => {
      if (scores[shape] > bestScore) {
        bestScore = scores[shape];
        bestShape = shape;
      }
    });
    return { shape: bestShape, score: bestScore };
  }

  private scoreTriangle(points: { x: number; y: number }[]): number {
    const corners = this.findCorners(points, 3);
    if (corners.length < 3) return 0;
    const totalDist = this.pathLength(points);
    const cornerDist = this.pathLength(corners) + this.dist(corners[corners.length - 1], corners[0]);
    const closure = this.isClosed(points);
    return Math.max(0, (1 - Math.abs(totalDist - cornerDist) / totalDist) * 0.5 + closure * 0.5);
  }

  private scoreCircle(points: { x: number; y: number }[]): number {
    const center = this.centroid(points);
    const radii = points.map(p => this.dist(p, center));
    const avgRadius = radii.reduce((a, b) => a + b, 0) / radii.length;
    const variance = radii.reduce((a, r) => a + Math.pow(r - avgRadius, 2), 0) / radii.length;
    const stdDev = Math.sqrt(variance);
    const closure = this.isClosed(points);
    const uniformity = Math.max(0, 1 - (stdDev / avgRadius) * 3);
    return uniformity * 0.5 + closure * 0.5;
  }

  private scoreSquare(points: { x: number; y: number }[]): number {
    const corners = this.findCorners(points, 4);
    if (corners.length < 4) return 0;
    const closure = this.isClosed(points);
    const angles = this.getCornerAngles(corners);
    const rightAngleCount = angles.filter(a => Math.abs(a - Math.PI / 2) < 0.4).length;
    return (rightAngleCount / 4) * 0.6 + closure * 0.4;
  }

  private scoreDiamond(points: { x: number; y: number }[]): number {
    const corners = this.findCorners(points, 4);
    if (corners.length < 4) return 0;
    const closure = this.isClosed(points);
    const xs = corners.map(c => c.x);
    const ys = corners.map(c => c.y);
    const symmetry = this.checkSymmetry(xs) * this.checkSymmetry(ys);
    return symmetry * 0.5 + closure * 0.5;
  }

  private scoreHexagon(points: { x: number; y: number }[]): number {
    const corners = this.findCorners(points, 6);
    if (corners.length < 5) return 0;
    const closure = this.isClosed(points);
    const cornerScore = Math.min(1, corners.length / 6);
    return cornerScore * 0.5 + closure * 0.5;
  }

  private scoreSpiral(points: { x: number; y: number }[]): number {
    if (points.length < 20) return 0;
    const center = this.centroid(points);
    const radii = points.map(p => this.dist(p, center));
    let increasingCount = 0;
    for (let i = 1; i < radii.length; i++) {
      if (radii[i] > radii[i - 1]) increasingCount++;
    }
    const increasingRatio = increasingCount / (radii.length - 1);
    const angleChanges = this.countAngleChanges(points);
    return Math.min(1, increasingRatio * 0.6 + (angleChanges / 20) * 0.4);
  }

  private scoreLightning(points: { x: number; y: number }[]): number {
    const corners = this.findCorners(points, 20);
    const sharpTurns = this.countSharpTurns(points);
    const zigzag = sharpTurns / Math.max(1, points.length / 5);
    return Math.min(1, zigzag * 0.7 + (corners.length >= 3 ? 0.3 : 0));
  }

  private findCorners(points: { x: number; y: number }[], expected: number): { x: number; y: number }[] {
    if (points.length < 3) return [];
    const corners: { x: number; y: number }[] = [];
    const window = Math.max(3, Math.floor(points.length / (expected * 2)));
    for (let i = window; i < points.length - window; i++) {
      const prev = points[i - window];
      const curr = points[i];
      const next = points[i + window];
      const angle = this.angleBetween(prev, curr, next);
      if (angle < Math.PI * 0.6) {
        corners.push(curr);
      }
    }
    return corners;
  }

  private angleBetween(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
    const v1x = a.x - b.x, v1y = a.y - b.y;
    const v2x = c.x - b.x, v2y = c.y - b.y;
    const dot = v1x * v2x + v1y * v2y;
    const m1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const m2 = Math.sqrt(v2x * v2x + v2y * v2y);
    if (m1 === 0 || m2 === 0) return Math.PI;
    return Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2))));
  }

  private isClosed(points: { x: number; y: number }[]): number {
    if (points.length < 2) return 0;
    const d = this.dist(points[0], points[points.length - 1]);
    const total = this.pathLength(points);
    if (total === 0) return 0;
    return Math.max(0, 1 - (d / total) * 8);
  }

  private centroid(points: { x: number; y: number }[]): { x: number; y: number } {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  private dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private pathLength(points: { x: number; y: number }[]): number {
    let len = 0;
    for (let i = 1; i < points.length; i++) len += this.dist(points[i - 1], points[i]);
    return len;
  }

  private getCornerAngles(corners: { x: number; y: number }[]): number[] {
    const angles: number[] = [];
    for (let i = 0; i < corners.length; i++) {
      const prev = corners[(i - 1 + corners.length) % corners.length];
      const curr = corners[i];
      const next = corners[(i + 1) % corners.length];
      angles.push(this.angleBetween(prev, curr, next));
    }
    return angles;
  }

  private checkSymmetry(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    if (sorted.length < 2) return 0;
    let diffs = 0;
    for (let i = 0; i < Math.floor(sorted.length / 2); i++) {
      const lo = sorted[i] - sorted[0];
      const hi = sorted[sorted.length - 1] - sorted[sorted.length - 1 - i];
      diffs += Math.abs(lo - hi);
    }
    const range = sorted[sorted.length - 1] - sorted[0] || 1;
    return Math.max(0, 1 - diffs / range);
  }

  private countAngleChanges(points: { x: number; y: number }[]): number {
    let count = 0;
    let lastDir = 0;
    for (let i = 2; i < points.length; i++) {
      const dx1 = points[i - 1].x - points[i - 2].x;
      const dy1 = points[i - 1].y - points[i - 2].y;
      const dx2 = points[i].x - points[i - 1].x;
      const dy2 = points[i].y - points[i - 1].y;
      const cross = dx1 * dy2 - dy1 * dx2;
      const dir = cross > 0 ? 1 : cross < 0 ? -1 : 0;
      if (dir !== 0 && dir !== lastDir && lastDir !== 0) count++;
      if (dir !== 0) lastDir = dir;
    }
    return count;
  }

  private countSharpTurns(points: { x: number; y: number }[]): number {
    let count = 0;
    const step = Math.max(2, Math.floor(points.length / 40));
    for (let i = step; i < points.length - step; i += step) {
      const angle = this.angleBetween(points[i - step], points[i], points[i + step]);
      if (angle < Math.PI * 0.4) count++;
    }
    return count;
  }

  private checkAndActivateNodes(shape: RuneShape): void {
    const matchingNode = this.nodes.find(n => n.shape === shape && !n.activated);
    if (!matchingNode) return;

    matchingNode.activated = true;
    matchingNode.energy = 1;
    this.activatedNodesOrder.push(matchingNode.id);
    this.emit({ type: 'nodeActivated', nodeId: matchingNode.id, shape });

    const runeCenter = this.getCompletedRuneCenter();
    this.chains.push({
      id: uuidv4(),
      fromX: matchingNode.x,
      fromY: matchingNode.y,
      toX: runeCenter.x,
      toY: runeCenter.y,
      progress: 0,
      duration: 400,
      elapsed: 0,
      color: matchingNode.color,
      active: true
    });

    const now = performance.now();
    const config = DIFFICULTY_CONFIG[this.difficulty];

    if (now - this.lastChainTime < config.chainInterval + 400) {
      this.chainCount++;
    } else {
      this.chainCount = 1;
    }
    this.lastChainTime = now;

    if (this.chainCount >= 2) {
      this.triggerChainReaction();
    }
  }

  private getCompletedRuneCenter(): { x: number; y: number } {
    if (this.completedRunePoints.length === 0) {
      return {
        x: this.drawAreaX + this.drawAreaSize / 2,
        y: this.drawAreaY + this.drawAreaSize / 2
      };
    }
    return this.centroid(this.completedRunePoints);
  }

  private triggerChainReaction(): void {
    this.totalChainCount++;
    const points = 100 * this.chainCount;
    this.score += points;
    this.emit({ type: 'chainTriggered', count: this.chainCount, score: points });
    this.emit({ type: 'scoreUpdated', score: this.score });

    this.flashEffects.push({
      id: uuidv4(),
      opacity: 1,
      elapsed: 0,
      duration: 300,
      active: true
    });

    const center = this.getCompletedRuneCenter();
    this.textEffects.push({
      id: uuidv4(),
      text: `连锁触发  x${this.chainCount}`,
      x: center.x,
      y: center.y,
      scale: 0,
      opacity: 1,
      blur: 20,
      elapsed: 0,
      duration: 1000,
      active: true
    });

    this.activatedNodesOrder.forEach(nodeId => {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        this.spawnFirework(node.x, node.y, node.color);
      }
    });
    this.spawnFirework(center.x, center.y, '#FFD700');
  }

  private spawnFirework(x: number, y: number, baseColor: string): void {
    const count = 50 + Math.floor(Math.random() * 51);
    const colors = [baseColor, '#FFFFFF', '#FFD700', '#FF6B6B'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 2000,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 4
      });
    }
  }

  resetNodes(): void {
    this.nodes.forEach(n => {
      n.activated = false;
      n.energy = 0;
    });
    this.activatedNodesOrder = [];
    this.chainCount = 0;
    this.completedRuneShape = null;
    this.completedRunePoints = [];
  }

  update(deltaTime: number): void {
    this.runePulsePhase += deltaTime * 0.003;
    this.nodes.forEach(n => {
      n.pulsePhase += deltaTime * 0.004;
      if (n.activated) {
        n.energy = Math.min(1, n.energy + deltaTime * 0.002);
      }
    });

    this.particles = this.particles.filter(p => {
      p.life += deltaTime;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.vy += 0.02;
      return p.life < p.maxLife;
    });

    this.chains = this.chains.filter(c => {
      if (!c.active) return false;
      c.elapsed += deltaTime;
      c.progress = Math.min(1, c.elapsed / c.duration);
      if (c.progress >= 1) c.active = false;
      return c.active;
    });

    this.textEffects = this.textEffects.filter(t => {
      if (!t.active) return false;
      t.elapsed += deltaTime;
      const p = t.elapsed / t.duration;
      if (p < 0.3) {
        t.scale = (p / 0.3) * 48;
        t.blur = 20 * (1 - p / 0.3);
        t.opacity = 1;
      } else if (p < 0.8) {
        t.scale = 48;
        t.blur = 0;
        t.opacity = 1;
      } else {
        t.scale = 48;
        t.opacity = 1 - (p - 0.8) / 0.2;
      }
      if (p >= 1) t.active = false;
      return t.active;
    });

    this.flashEffects = this.flashEffects.filter(f => {
      if (!f.active) return false;
      f.elapsed += deltaTime;
      f.opacity = Math.max(0, 1 - f.elapsed / f.duration);
      if (f.elapsed >= f.duration) f.active = false;
      return f.active;
    });

    this.drawForce = Math.max(0, this.drawForce - deltaTime * 0.08);
  }
}
