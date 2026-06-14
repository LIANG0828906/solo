import { Point2D, ShapeType, generateShapePoints, shapeColors } from './shapePoints';

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  color: HSLColor;
  targetColor: HSLColor;
  startColor: HSLColor;
  size: number;
  progress: number;
  isRemoving: boolean;
  isAdding: boolean;
  addProgress: number;
  removeProgress: number;
  jitterOffsetX: number;
  jitterOffsetY: number;
  jitterSpeed: number;
  jitterPhase: number;
}

class KDNode {
  particle: Particle;
  left: KDNode | null;
  right: KDNode | null;
  axis: number;

  constructor(particle: Particle, axis: number) {
    this.particle = particle;
    this.left = null;
    this.right = null;
    this.axis = axis;
  }
}

function buildKDTree(particles: Particle[], depth: number = 0): KDNode | null {
  if (particles.length === 0) return null;

  const axis = depth % 2;
  const sorted = [...particles].sort((a, b) => {
    return axis === 0 ? a.x - b.x : a.y - b.y;
  });

  const mid = Math.floor(sorted.length / 2);
  const node = new KDNode(sorted[mid], axis);
  node.left = buildKDTree(sorted.slice(0, mid), depth + 1);
  node.right = buildKDTree(sorted.slice(mid + 1), depth + 1);

  return node;
}

interface NeighborResult {
  particle: Particle;
  distance: number;
}

function findKNearest(
  node: KDNode | null,
  target: Particle,
  k: number,
  result: NeighborResult[] = []
): NeighborResult[] {
  if (!node) return result;

  const dx = node.particle.x - target.x;
  const dy = node.particle.y - target.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (node.particle.id !== target.id) {
    if (result.length < k) {
      result.push({ particle: node.particle, distance });
      result.sort((a, b) => a.distance - b.distance);
    } else if (distance < result[result.length - 1].distance) {
      result[result.length - 1] = { particle: node.particle, distance };
      result.sort((a, b) => a.distance - b.distance);
    }
  }

  const axis = node.axis;
  const diff = axis === 0 ? dx : dy;

  let firstBranch: KDNode | null;
  let secondBranch: KDNode | null;

  if (diff > 0) {
    firstBranch = node.left;
    secondBranch = node.right;
  } else {
    firstBranch = node.right;
    secondBranch = node.left;
  }

  findKNearest(firstBranch, target, k, result);

  if (result.length < k || Math.abs(diff) < result[result.length - 1].distance) {
    findKNearest(secondBranch, target, k, result);
  }

  return result;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerpHSL(color1: HSLColor, color2: HSLColor, t: number): HSLColor {
  let h1 = color1.h;
  let h2 = color2.h;

  let diff = h2 - h1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  const h = (h1 + diff * t + 360) % 360;
  const s = color1.s + (color2.s - color1.s) * t;
  const l = color1.l + (color2.l - color1.l) * t;

  return { h, s, l };
}

function hslToString(color: HSLColor, alpha: number = 1): string {
  return `hsla(${color.h}, ${color.s}%, ${color.l}%, ${alpha})`;
}

const MORPH_DURATION = 1500;
const ADD_DURATION = 300;
const REMOVE_DURATION = 300;
const JITTER_AMOUNT = 2;

export class ParticleEngine {
  private particles: Particle[] = [];
  private nextId: number = 0;
  private currentShape: ShapeType = 'circle';
  private kdTree: KDNode | null = null;
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;

  setCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getCurrentShape(): ShapeType {
    return this.currentShape;
  }

  init(count: number, shape: ShapeType = 'circle'): void {
    this.currentShape = shape;
    const points = generateShapePoints(shape, count);
    const color = shapeColors[shape];

    this.particles = points.map((point, index) => ({
      id: this.nextId++,
      x: point.x,
      y: point.y,
      vx: 0,
      vy: 0,
      targetX: point.x,
      targetY: point.y,
      startX: point.x,
      startY: point.y,
      color: { ...color },
      targetColor: { ...color },
      startColor: { ...color },
      size: 3,
      progress: 1,
      isRemoving: false,
      isAdding: false,
      addProgress: 1,
      removeProgress: 0,
      jitterOffsetX: Math.random() * Math.PI * 2,
      jitterOffsetY: Math.random() * Math.PI * 2,
      jitterSpeed: 0.5 + Math.random() * 0.5,
      jitterPhase: Math.random() * Math.PI * 2,
    }));

    this.updateKDTree();
  }

  changeShape(shape: ShapeType): void {
    if (shape === this.currentShape) return;

    this.currentShape = shape;
    const points = generateShapePoints(shape, this.particles.filter(p => !p.isRemoving).length);
    const targetColor = shapeColors[shape];

    const activeParticles = this.particles.filter(p => !p.isRemoving);

    for (let i = 0; i < activeParticles.length; i++) {
      const particle = activeParticles[i];
      const targetPoint = points[i];

      particle.startX = particle.x;
      particle.startY = particle.y;
      particle.targetX = targetPoint.x;
      particle.targetY = targetPoint.y;
      particle.startColor = { ...particle.color };
      particle.targetColor = { ...targetColor };
      particle.progress = 0;
    }
  }

  setCount(targetCount: number): void {
    const currentActive = this.particles.filter(p => !p.isRemoving).length;

    if (targetCount === currentActive) return;

    if (targetCount > currentActive) {
      const points = generateShapePoints(this.currentShape, targetCount);
      const color = shapeColors[this.currentShape];
      const toAdd = targetCount - currentActive;

      const shuffledIndices = [];
      for (let i = 0; i < targetCount; i++) {
        shuffledIndices.push(i);
      }
      for (let i = shuffledIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
      }

      const usedIndices = new Set<number>();
      const activeParticles = this.particles.filter(p => !p.isRemoving);
      for (let i = 0; i < activeParticles.length; i++) {
        const idx = shuffledIndices[i];
        usedIndices.add(idx);
        const particle = activeParticles[i];
        particle.startX = particle.x;
        particle.startY = particle.y;
        particle.targetX = points[idx].x;
        particle.targetY = points[idx].y;
        particle.startColor = { ...particle.color };
        particle.targetColor = { ...color };
        particle.progress = 0;
      }

      let addIdx = 0;
      for (let i = 0; i < targetCount && addIdx < toAdd; i++) {
        if (!usedIndices.has(i)) {
          const point = points[i];
          const edgeAngle = Math.random() * Math.PI * 2;
          const edgeDist = Math.max(this.canvasWidth, this.canvasHeight);

          this.particles.push({
            id: this.nextId++,
            x: point.x + Math.cos(edgeAngle) * edgeDist,
            y: point.y + Math.sin(edgeAngle) * edgeDist,
            vx: 0,
            vy: 0,
            targetX: point.x,
            targetY: point.y,
            startX: point.x + Math.cos(edgeAngle) * edgeDist,
            startY: point.y + Math.sin(edgeAngle) * edgeDist,
            color: { ...color },
            targetColor: { ...color },
            startColor: { ...color },
            size: 3,
            progress: 0,
            isRemoving: false,
            isAdding: true,
            addProgress: 0,
            removeProgress: 0,
            jitterOffsetX: Math.random() * Math.PI * 2,
            jitterOffsetY: Math.random() * Math.PI * 2,
            jitterSpeed: 0.5 + Math.random() * 0.5,
            jitterPhase: Math.random() * Math.PI * 2,
          });
          addIdx++;
        }
      }
    } else {
      const toRemove = currentActive - targetCount;
      const activeParticles = this.particles.filter(p => !p.isRemoving);

      const shuffled = [...activeParticles];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      for (let i = 0; i < toRemove; i++) {
        shuffled[i].isRemoving = true;
        shuffled[i].removeProgress = 0;
      }
    }
  }

  update(deltaTime: number, time: number): void {
    const morphStep = deltaTime / MORPH_DURATION;
    const addStep = deltaTime / ADD_DURATION;
    const removeStep = deltaTime / REMOVE_DURATION;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      if (particle.progress < 1) {
        particle.progress = Math.min(1, particle.progress + morphStep);
        const eased = easeInOutCubic(particle.progress);

        particle.x = particle.startX + (particle.targetX - particle.startX) * eased;
        particle.y = particle.startY + (particle.targetY - particle.startY) * eased;
        particle.color = lerpHSL(particle.startColor, particle.targetColor, eased);
      }

      if (particle.isAdding) {
        particle.addProgress = Math.min(1, particle.addProgress + addStep);
        if (particle.addProgress >= 1) {
          particle.isAdding = false;
          particle.addProgress = 1;
        }
      }

      if (particle.isRemoving) {
        particle.removeProgress = Math.min(1, particle.removeProgress + removeStep);
        const removeEased = easeInOutCubic(particle.removeProgress);

        const dx = particle.x - particle.targetX;
        const dy = particle.y - particle.targetY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const flyOutSpeed = 2 + removeEased * 8;

        particle.x += (dx / dist) * flyOutSpeed;
        particle.y += (dy / dist) * flyOutSpeed;

        if (particle.removeProgress >= 1) {
          this.particles.splice(i, 1);
        }
      }
    }

    this.updateKDTree();
  }

  getJitteredPosition(particle: Particle, time: number): { x: number; y: number } {
    const jitterX = Math.sin(time * particle.jitterSpeed * 0.001 + particle.jitterOffsetX) * JITTER_AMOUNT;
    const jitterY = Math.cos(time * particle.jitterSpeed * 0.001 + particle.jitterOffsetY) * JITTER_AMOUNT;
    return {
      x: particle.x + jitterX,
      y: particle.y + jitterY,
    };
  }

  findNearestNeighbors(particle: Particle, k: number = 3): Particle[] {
    if (!this.kdTree) return [];
    const results = findKNearest(this.kdTree, particle, k);
    return results.map(r => r.particle);
  }

  findParticleAtPosition(worldX: number, worldY: number, radius: number = 10): Particle | null {
    for (const particle of this.particles) {
      if (particle.isRemoving) continue;
      const dx = particle.x - worldX;
      const dy = particle.y - worldY;
      if (dx * dx + dy * dy < radius * radius) {
        return particle;
      }
    }
    return null;
  }

  private updateKDTree(): void {
    const activeParticles = this.particles.filter(p => !p.isRemoving);
    this.kdTree = buildKDTree(activeParticles);
  }

  getParticleCount(): number {
    return this.particles.filter(p => !p.isRemoving).length;
  }
}
