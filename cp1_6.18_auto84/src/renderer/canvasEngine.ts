import { Idea, Cluster, BackgroundParticle, DragTrail, EASING_FUNCTION } from '../shared/types';

const ANIMATION_DURATION = 800;
const CONNECTION_DISTANCE = 120;
const TRAIL_DURATION = 300;

export interface CanvasEngineOptions {
  canvas: HTMLCanvasElement;
  onStarDragEnd: (id: string, x: number, y: number) => void;
  getIdeas: () => Idea[];
  getClusters: () => Cluster[];
  getSelectedClusterId: () => string | null;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private particles: BackgroundParticle[] = [];
  private dragTrails: Map<string, DragTrail[]> = new Map();
  private draggingId: string | null = null;
  private starPositions: Map<string, { x: number; y: number; targetX: number; targetY: number; startTime: number }> = new Map();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isDragging: boolean = false;
  private onStarDragEnd: (id: string, x: number, y: number) => void;
  private getIdeas: () => Idea[];
  private getClusters: () => Cluster[];
  private getSelectedClusterId: () => string | null;

  constructor(options: CanvasEngineOptions) {
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    this.onStarDragEnd = options.onStarDragEnd;
    this.getIdeas = options.getIdeas;
    this.getClusters = options.getClusters;
    this.getSelectedClusterId = options.getSelectedClusterId;
    this.initParticles();
    this.bindEvents();
  }

  private initParticles() {
    this.particles = [];
    const count = 150;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        period: 1500 + Math.random() * 2000
      });
    }
  }

  private bindEvents() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);
  }

  public destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.initParticles();
  }

  public updateStarTargets() {
    const ideas = this.getIdeas();
    const now = performance.now();
    for (const idea of ideas) {
      const existing = this.starPositions.get(idea.id);
      if (existing) {
        if (Math.abs(existing.targetX - idea.x) > 1 || Math.abs(existing.targetY - idea.y) > 1) {
          this.starPositions.set(idea.id, {
            x: existing.x,
            y: existing.y,
            targetX: idea.x,
            targetY: idea.y,
            startTime: now
          });
        }
      } else {
        this.starPositions.set(idea.id, {
          x: idea.x,
          y: idea.y,
          targetX: idea.x,
          targetY: idea.y,
          startTime: now
        });
      }
    }
    for (const id of Array.from(this.starPositions.keys())) {
      if (!ideas.find(i => i.id === id)) {
        this.starPositions.delete(id);
      }
    }
  }

  private handleMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    const ideas = this.getIdeas();
    for (const idea of ideas) {
      const pos = this.getStarCurrentPosition(idea);
      const dx = this.mouseX - pos.x;
      const dy = this.mouseY - pos.y;
      if (dx * dx + dy * dy <= idea.radius * idea.radius) {
        this.draggingId = idea.id;
        this.isDragging = true;
        this.dragTrails.set(idea.id, [{ x: pos.x, y: pos.y, timestamp: performance.now() }]);
        break;
      }
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    if (this.isDragging && this.draggingId) {
      const pos = this.starPositions.get(this.draggingId);
      if (pos) {
        pos.x = this.mouseX;
        pos.y = this.mouseY;
        pos.targetX = this.mouseX;
        pos.targetY = this.mouseY;
      }
      const trails = this.dragTrails.get(this.draggingId);
      if (trails) {
        trails.push({ x: this.mouseX, y: this.mouseY, timestamp: performance.now() });
      }
    }
  };

  private handleMouseUp = () => {
    if (this.isDragging && this.draggingId) {
      const pos = this.starPositions.get(this.draggingId);
      if (pos) {
        this.onStarDragEnd(this.draggingId, pos.x, pos.y);
      }
      this.isDragging = false;
      this.draggingId = null;
    }
  };

  private getStarCurrentPosition(idea: Idea): { x: number; y: number } {
    const pos = this.starPositions.get(idea.id);
    if (!pos) return { x: idea.x, y: idea.y };
    if (this.draggingId === idea.id) {
      return { x: pos.x, y: pos.y };
    }
    const elapsed = performance.now() - pos.startTime;
    if (elapsed >= ANIMATION_DURATION) {
      pos.x = pos.targetX;
      pos.y = pos.targetY;
      return { x: pos.x, y: pos.y };
    }
    const t = EASING_FUNCTION(elapsed / ANIMATION_DURATION);
    return {
      x: pos.x + (pos.targetX - pos.x) * t,
      y: pos.y + (pos.targetY - pos.y) * t
    };
  }

  public start() {
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  private drawBackground() {
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      Math.max(this.canvas.width, this.canvas.height) * 0.8
    );
    gradient.addColorStop(0, '#1A1A4E');
    gradient.addColorStop(1, '#0A0A2E');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawParticles(time: number) {
    for (const p of this.particles) {
      const twinkle = (Math.sin(time / p.period * Math.PI * 2 + p.phase) + 1) / 2;
      const opacity = p.opacity * (0.3 + twinkle * 0.7);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      this.ctx.fill();
    }
  }

  private drawConnections(ideas: Idea[], positions: Map<string, { x: number; y: number }>) {
    for (let i = 0; i < ideas.length; i++) {
      for (let j = i + 1; j < ideas.length; j++) {
        const a = ideas[i];
        const b = ideas[j];
        if (a.clusterId !== b.clusterId || !a.clusterId) continue;
        const posA = positions.get(a.id);
        const posB = positions.get(b.id);
        if (!posA || !posB) continue;
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DISTANCE) {
          const alpha = 0.3 * (1 - dist / CONNECTION_DISTANCE);
          this.ctx.beginPath();
          this.ctx.setLineDash([4, 4]);
          this.ctx.strokeStyle = `rgba(78, 205, 196, ${alpha})`;
          this.ctx.lineWidth = 1;
          this.ctx.moveTo(posA.x, posA.y);
          this.ctx.lineTo(posB.x, posB.y);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }
      }
    }
  }

  private drawDragTrails(time: number) {
    for (const [id, trails] of this.dragTrails) {
      const validTrails = trails.filter(t => time - t.timestamp < TRAIL_DURATION);
      if (validTrails.length < 2) continue;
      const idea = this.getIdeas().find(i => i.id === id);
      if (!idea) continue;
      for (let i = 1; i < validTrails.length; i++) {
        const t1 = validTrails[i - 1];
        const t2 = validTrails[i];
        const age = (time - t2.timestamp) / TRAIL_DURATION;
        const alpha = (1 - age) * 0.8;
        const gradient = this.ctx.createLinearGradient(t1.x, t1.y, t2.x, t2.y);
        gradient.addColorStop(0, idea.color + Math.floor((1 - age) * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, idea.color + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
        this.ctx.beginPath();
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 4 * (1 - age);
        this.ctx.lineCap = 'round';
        this.ctx.moveTo(t1.x, t1.y);
        this.ctx.lineTo(t2.x, t2.y);
        this.ctx.stroke();
      }
      this.dragTrails.set(id, validTrails);
    }
  }

  private drawStar(idea: Idea, pos: { x: number; y: number }, selectedClusterId: string | null) {
    const isSelected = selectedClusterId !== null && idea.clusterId === selectedClusterId;
    if (isSelected) {
      const glowGradient = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, idea.radius + 8);
      glowGradient.addColorStop(0, 'rgba(255, 230, 109, 0.4)');
      glowGradient.addColorStop(1, 'rgba(255, 230, 109, 0)');
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, idea.radius + 8, 0, Math.PI * 2);
      this.ctx.fillStyle = glowGradient;
      this.ctx.fill();
    }

    const glow = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, idea.radius * 1.5);
    glow.addColorStop(0, idea.color + '80');
    glow.addColorStop(1, idea.color + '00');
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, idea.radius * 1.5, 0, Math.PI * 2);
    this.ctx.fillStyle = glow;
    this.ctx.fill();

    const bodyGradient = this.ctx.createRadialGradient(
      pos.x - idea.radius * 0.3,
      pos.y - idea.radius * 0.3,
      0,
      pos.x,
      pos.y,
      idea.radius
    );
    bodyGradient.addColorStop(0, '#ffffff');
    bodyGradient.addColorStop(0.3, idea.color);
    bodyGradient.addColorStop(1, this.darkenColor(idea.color, 0.5));

    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, idea.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = bodyGradient;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, idea.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = idea.color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
  }

  private draw() {
    const time = performance.now();
    this.drawBackground();
    this.drawParticles(time);
    const ideas = this.getIdeas();
    const selectedClusterId = this.getSelectedClusterId();
    const positions = new Map<string, { x: number; y: number }>();
    for (const idea of ideas) {
      positions.set(idea.id, this.getStarCurrentPosition(idea));
    }
    this.drawConnections(ideas, positions);
    this.drawDragTrails(time);
    for (const idea of ideas) {
      const pos = positions.get(idea.id);
      if (pos) {
        this.drawStar(idea, pos, selectedClusterId);
      }
    }
  }
}
