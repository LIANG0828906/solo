import {
  Plant,
  Point,
  Halo,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRID_COLS,
  GRID_ROWS,
  CELL_WIDTH,
  CELL_HEIGHT,
  SEED_COLORS
} from './types';
import { ThreeParticleSystem } from './ThreeParticleSystem';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private particleSystem: ThreeParticleSystem;
  private width: number = CANVAS_WIDTH;
  private height: number = CANVAS_HEIGHT;

  constructor(canvas2D: HTMLCanvasElement, canvas3D: HTMLCanvasElement) {
    const ctx = canvas2D.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.particleSystem = new ThreeParticleSystem(canvas3D);
  }

  public clear(): void {
    this.ctx.fillStyle = '#3E2723';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  public drawGrid(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= GRID_COLS; i++) {
      const x = i * CELL_WIDTH;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    for (let i = 0; i <= GRID_ROWS; i++) {
      const y = i * CELL_HEIGHT;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  public drawPlant(plant: Plant): void {
    const progress = plant.state === 'clearing' ? (plant.reverseProgress ?? 0) : 1;
    if (progress <= 0) return;

    this.ctx.save();
    this.ctx.globalAlpha = plant.opacity * progress;

    const scale = plant.scale * progress;
    if (scale !== 1) {
      this.ctx.translate(plant.position.x, plant.position.y);
      this.ctx.scale(scale, scale);
      this.ctx.translate(-plant.position.x, -plant.position.y);
    }

    if (plant.type === 'vine' && plant.vineBranches) {
      this.drawVine(plant);
    } else if (plant.type === 'mushroom' && plant.mushroom) {
      this.drawMushroom(plant);
    } else if (plant.type === 'glowmoss' && plant.glowmoss) {
      this.drawGlowmoss(plant);
    }

    this.ctx.restore();
  }

  private drawVine(plant: Plant): void {
    if (!plant.vineBranches) return;

    for (let i = 0; i < plant.vineBranches.length; i++) {
      const branch = plant.vineBranches[i];
      if (branch.growthProgress <= 0) continue;

      const adjustedProgress = plant.state === 'clearing'
        ? Math.min(branch.growthProgress, (plant.reverseProgress ?? 0) * 2)
        : branch.growthProgress;

      const currentLength = branch.length * adjustedProgress;
      const endX = branch.start.x + Math.cos(branch.angle) * currentLength;
      const endY = branch.start.y + Math.sin(branch.angle) * currentLength;

      const gradient = this.ctx.createLinearGradient(
        branch.start.x, branch.start.y, endX, endY
      );
      gradient.addColorStop(0, '#2E7D32');
      gradient.addColorStop(1, '#66BB6A');

      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = branch.thickness * (1 - adjustedProgress * 0.3);
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(branch.start.x, branch.start.y);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();

      if (branch.hasLeaf && adjustedProgress > 0.7) {
        const leafProgress = Math.min(1, (adjustedProgress - 0.7) / 0.3);
        const leafOffset = plant.leafOffsets.get(i) || { x: 0, y: 0 };
        this.drawLeaf(
          { x: endX + leafOffset.x, y: endY + leafOffset.y },
          branch.leafAngle,
          leafProgress
        );
      }
    }

    if (plant.state === 'wrapped') {
      this.ctx.strokeStyle = 'rgba(46, 125, 50, 0.6)';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        this.ctx.beginPath();
        this.ctx.arc(plant.position.x, plant.position.y - 10, 25 + i * 5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  private drawLeaf(position: Point, angle: number, progress: number): void {
    this.ctx.save();
    this.ctx.translate(position.x, position.y);
    this.ctx.rotate(angle);
    this.ctx.scale(progress, progress);

    this.ctx.fillStyle = '#4CAF50';
    this.ctx.beginPath();
    this.ctx.ellipse(8, 0, 8, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#2E7D32';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(16, 0);
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawMushroom(plant: Plant): void {
    if (!plant.mushroom) return;

    const growthProgress = Math.min(plant.growthTime / plant.maxGrowthTime, 1);
    const clearProgress = plant.state === 'clearing' ? (plant.reverseProgress ?? 0) : 1;
    const progress = Math.min(growthProgress, clearProgress);
    if (progress <= 0) return;

    const { center, capRadius, stemHeight, brightness, dots } = plant.mushroom;
    const currentRadius = capRadius * progress;
    const currentStemHeight = stemHeight * progress;

    this.ctx.fillStyle = `rgb(${Math.floor(139 * brightness)}, ${Math.floor(90 * brightness)}, ${Math.floor(43 * brightness)})`;
    this.ctx.beginPath();
    this.ctx.rect(
      plant.position.x - 5 * progress,
      plant.position.y - currentStemHeight,
      10 * progress,
      currentStemHeight
    );
    this.ctx.fill();

    const r = Math.floor(255 * brightness);
    const g = Math.floor(87 * brightness);
    const b = Math.floor(34 * brightness);
    const gradient = this.ctx.createRadialGradient(
      center.x, center.y - 5, 0,
      center.x, center.y, currentRadius
    );
    gradient.addColorStop(0, `rgb(${r}, ${g + 30}, ${b + 20})`);
    gradient.addColorStop(0.7, `rgb(${r}, ${g}, ${b})`);
    gradient.addColorStop(1, `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`);

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.ellipse(center.x, center.y, currentRadius, currentRadius * 0.6, 0, Math.PI, 0, false);
    this.ctx.fill();

    if (progress > 0.5) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * brightness})`;
      for (const dot of dots) {
        const dotProgress = Math.min(1, (progress - 0.5) * 2);
        const dotR = 2 * dotProgress;
        this.ctx.beginPath();
        this.ctx.arc(
          center.x + (dot.x - center.x) * progress,
          center.y + (dot.y - center.y) * progress * 0.6,
          dotR,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }
    }

    if (plant.state === 'wrapped') {
      this.ctx.strokeStyle = 'rgba(46, 125, 50, 0.8)';
      this.ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        this.ctx.beginPath();
        this.ctx.ellipse(
          center.x,
          center.y,
          currentRadius * 0.9,
          currentRadius * 0.5,
          angle,
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
      }
    }
  }

  private drawGlowmoss(plant: Plant): void {
    if (!plant.glowmoss) return;

    const growthProgress = Math.min(plant.growthTime / plant.maxGrowthTime, 1);
    const clearProgress = plant.state === 'clearing' ? (plant.reverseProgress ?? 0) : 1;
    const progress = Math.min(growthProgress, clearProgress);
    if (progress <= 0) return;

    const { center, radius, opacity, color, expansion } = plant.glowmoss;
    const currentRadius = radius * expansion * progress;

    this.ctx.save();
    this.ctx.filter = 'blur(5px)';

    const gradient = this.ctx.createRadialGradient(
      center.x, center.y, 0,
      center.x, center.y, currentRadius
    );
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.8})`);
    gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.5})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.ellipse(
      center.x,
      center.y,
      currentRadius,
      currentRadius * 0.5,
      0,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.filter = 'none';
    this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + plant.growthTime;
      const dist = currentRadius * 0.4;
      const x = center.x + Math.cos(angle) * dist;
      const y = center.y + Math.sin(angle) * dist * 0.5;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 2 * progress, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  public drawDraggingSeed(position: Point, seedType: string | null): void {
    if (!seedType) return;

    const color = SEED_COLORS[seedType as keyof typeof SEED_COLORS];
    if (!color) return;

    this.ctx.save();
    this.ctx.globalAlpha = 0.8;

    const gradient = this.ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, 30
    );
    gradient.addColorStop(0, color.hex);
    gradient.addColorStop(0.7, color.hex);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, 30, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = color.hex;
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, 15, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  public drawHalos(halos: Halo[]): void {
    for (const halo of halos) {
      const gradient = this.ctx.createRadialGradient(
        halo.position.x, halo.position.y, 0,
        halo.position.x, halo.position.y, halo.radius
      );
      gradient.addColorStop(0, `rgba(${halo.color.r}, ${halo.color.g}, ${halo.color.b}, ${halo.opacity})`);
      gradient.addColorStop(1, `rgba(${halo.color.r}, ${halo.color.g}, ${halo.color.b}, 0)`);

      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(halo.position.x, halo.position.y, halo.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  public renderPlants(plants: Plant[], draggingPosition: Point | null, selectedSeed: string | null): void {
    this.clear();
    this.drawGrid();

    for (const plant of plants) {
      this.drawPlant(plant);
    }

    this.drawHalos(this.particleSystem.getHalos());

    if (draggingPosition && selectedSeed) {
      this.drawDraggingSeed(draggingPosition, selectedSeed);
    }
  }

  public updateParticles(deltaTime: number): void {
    this.particleSystem.update(deltaTime);
  }

  public renderParticles(): void {
    this.particleSystem.render();
  }

  public emitExplosion(
    position: Point,
    color: { r: number; g: number; b: number }
  ): void {
    this.particleSystem.emitExplosion(position, color);
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.particleSystem.resize(width, height);
  }

  public dispose(): void {
    this.particleSystem.dispose();
  }
}
