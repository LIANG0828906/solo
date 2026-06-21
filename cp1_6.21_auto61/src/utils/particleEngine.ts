import { v4 as uuidv4 } from 'uuid';
import type { Edge, NodeData, Particle } from '../types';

const MAX_PARTICLES = 2000;

export function getLoadColor(load: number): string {
  if (load < 30) return '#00d2ff';
  if (load < 70) return '#ffd700';
  return '#ff4757';
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

export function getParticleSpeed(load: number): number {
  return 0.5 + (load / 100) * 1.5;
}

export function getParticleSpawnInterval(load: number): number {
  return 0.05 + (1 - load / 100) * 0.25;
}

export class ParticleEngine {
  particles: Particle[] = [];
  private spawnTimers: Map<string, number> = new Map();

  update(
    deltaTime: number,
    edges: Edge[],
    nodes: Map<string, NodeData>,
    totalCount: number
  ): { particles: Particle[]; overflow: boolean } {
    let overflow = false;

    for (const edge of edges) {
      const source = nodes.get(edge.sourceId);
      if (!source) continue;
      const speed = getParticleSpeed(source.load);
      const interval = getParticleSpawnInterval(source.load);
      const currentTimer = this.spawnTimers.get(edge.id) ?? 0;
      const newTimer = currentTimer + deltaTime;
      if (newTimer >= interval && this.particles.length < MAX_PARTICLES) {
        this.particles.push({
          id: uuidv4(),
          edgeId: edge.id,
          progress: 0,
          speed,
        });
        this.spawnTimers.set(edge.id, 0);
      } else {
        this.spawnTimers.set(edge.id, newTimer);
      }
      if (this.particles.length >= MAX_PARTICLES) {
        overflow = true;
      }
    }

    const activeEdgeIds = new Set(edges.map((e) => e.id));
    this.particles = this.particles.filter((p) => {
      if (!activeEdgeIds.has(p.edgeId)) return false;
      const edge = edges.find((e) => e.id === p.edgeId);
      if (!edge) return false;
      const source = nodes.get(edge.sourceId);
      if (!source) return false;
      const currentSpeed = getParticleSpeed(source.load);
      p.progress += currentSpeed * deltaTime;
      p.speed = currentSpeed;
      return p.progress < 1;
    });

    if (totalCount > 0 && this.particles.length > MAX_PARTICLES) {
      const excess = this.particles.length - MAX_PARTICLES;
      this.particles.splice(0, excess);
      overflow = true;
    }

    return { particles: this.particles, overflow };
  }

  clear(): void {
    this.particles = [];
    this.spawnTimers.clear();
  }
}
