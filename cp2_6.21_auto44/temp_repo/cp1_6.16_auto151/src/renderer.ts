import {
  GridElement,
  PlayerState,
  EditorState,
  Particle,
  ElementType,
  GRID_SIZE,
  COLORS,
} from './types';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  spawnParticles(x: number, y: number, color: string, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.5,
        maxLife: 0.5,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(
    editorState: EditorState,
    elements: GridElement[],
    player?: PlayerState,
    time: number = 0,
    platformPositions?: Map<number, { x: number; y: number }>
  ): void {
    const { zoom, offsetX, offsetY, isFading } = editorState;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.save();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, COLORS.bgTop);
    gradient.addColorStop(1, COLORS.bgBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    this.drawGrid();
    this.drawElements(elements, time, platformPositions);
    this.drawHoverPreview(editorState);

    if (player) {
      this.drawPlayer(player);
    }

    this.drawParticles();

    ctx.restore();

    if (isFading) {
      ctx.fillStyle = 'rgba(26, 26, 46, 0.8)';
      ctx.fillRect(0, 0, width, height);
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    const { width: gridWidth, height: gridHeight } = { width: 50, height: 30 };
    const zoom = this.ctx.getTransform().a;

    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1 / zoom;

    for (let x = 0; x <= gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, gridHeight * GRID_SIZE);
      ctx.stroke();
    }

    for (let y = 0; y <= gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(gridWidth * GRID_SIZE, y * GRID_SIZE);
      ctx.stroke();
    }
  }

  private drawElements(
    elements: GridElement[],
    time: number,
    platformPositions?: Map<number, { x: number; y: number }>
  ): void {
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const platformPos = platformPositions?.get(i);

      switch (element.type) {
        case ElementType.BRICK:
          this.drawBrick(element.x, element.y);
          break;
        case ElementType.SPIKE:
          this.drawSpike(element.x, element.y);
          break;
        case ElementType.PLATFORM:
          if (platformPos) {
            this.drawPlatform(platformPos.x, platformPos.y, element);
          } else {
            this.drawPlatform(element.x * GRID_SIZE, element.y * GRID_SIZE, element);
          }
          break;
        case ElementType.GOAL:
          this.drawGoal(element.x, element.y, time);
          break;
      }
    }
  }

  private drawBrick(gridX: number, gridY: number): void {
    const ctx = this.ctx;
    const x = gridX * GRID_SIZE;
    const y = gridY * GRID_SIZE;

    ctx.fillStyle = COLORS.brick;
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(x, y, GRID_SIZE, 4);
    ctx.fillRect(x, y, 4, GRID_SIZE);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x, y + GRID_SIZE - 4, GRID_SIZE, 4);
    ctx.fillRect(x + GRID_SIZE - 4, y, 4, GRID_SIZE);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, GRID_SIZE - 1, GRID_SIZE - 1);
  }

  private drawSpike(gridX: number, gridY: number): void {
    const ctx = this.ctx;
    const x = gridX * GRID_SIZE;
    const y = gridY * GRID_SIZE;

    ctx.fillStyle = COLORS.spike;
    ctx.beginPath();
    ctx.moveTo(x + GRID_SIZE / 2, y + 4);
    ctx.lineTo(x + GRID_SIZE - 4, y + GRID_SIZE - 4);
    ctx.lineTo(x + 4, y + GRID_SIZE - 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(x + GRID_SIZE / 2, y + 8);
    ctx.lineTo(x + GRID_SIZE / 2 + 4, y + GRID_SIZE / 2);
    ctx.lineTo(x + GRID_SIZE / 2 - 2, y + GRID_SIZE / 2);
    ctx.closePath();
    ctx.fill();
  }

  private drawPlatform(x: number, y: number, element: GridElement): void {
    const ctx = this.ctx;
    const width = (element.platformEndX! - element.platformStartX! + 1) * GRID_SIZE;
    const height = 12;

    ctx.fillStyle = COLORS.platform;
    ctx.beginPath();
    ctx.roundRect(x, y + (GRID_SIZE - height) / 2, width, height, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 2, y + (GRID_SIZE - height) / 2 + 2, width - 4, 3);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x + 2, y + (GRID_SIZE - height) / 2 + height - 4, width - 4, 2);
  }

  private drawGoal(gridX: number, gridY: number, time: number): void {
    const ctx = this.ctx;
    const x = gridX * GRID_SIZE + GRID_SIZE / 2;
    const y = gridY * GRID_SIZE;
    const poleWidth = 4;
    const flagSize = 20;
    const waveOffset = Math.sin(time * 3) * 3;

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x - poleWidth / 2, y + 4, poleWidth, GRID_SIZE - 8);

    ctx.fillStyle = COLORS.goal;
    ctx.beginPath();
    ctx.moveTo(x + poleWidth / 2, y + 6);
    ctx.lineTo(x + poleWidth / 2 + flagSize + waveOffset, y + 6 + flagSize / 2);
    ctx.lineTo(x + poleWidth / 2, y + 6 + flagSize);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(x + poleWidth / 2 + 2, y + 8);
    ctx.lineTo(x + poleWidth / 2 + flagSize / 2 + waveOffset, y + 8 + flagSize / 3);
    ctx.lineTo(x + poleWidth / 2 + 2, y + 8 + flagSize / 2);
    ctx.closePath();
    ctx.fill();

    const glowSize = 6 + Math.sin(time * 2) * 2;
    ctx.shadowColor = COLORS.goal;
    ctx.shadowBlur = glowSize;
    ctx.fillStyle = COLORS.goal;
    ctx.beginPath();
    ctx.arc(x, y + 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  private drawHoverPreview(editorState: EditorState): void {
    const { hoverGridX, hoverGridY, selectedElement, isPlaying } = editorState;
    
    if (isPlaying || hoverGridX < 0 || hoverGridY < 0) return;

    const ctx = this.ctx;
    const x = hoverGridX * GRID_SIZE;
    const y = hoverGridY * GRID_SIZE;

    ctx.globalAlpha = 0.4;

    switch (selectedElement) {
      case ElementType.BRICK:
        ctx.fillStyle = COLORS.brick;
        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
        break;
      case ElementType.SPIKE:
        ctx.fillStyle = COLORS.spike;
        ctx.beginPath();
        ctx.moveTo(x + GRID_SIZE / 2, y + 4);
        ctx.lineTo(x + GRID_SIZE - 4, y + GRID_SIZE - 4);
        ctx.lineTo(x + 4, y + GRID_SIZE - 4);
        ctx.closePath();
        ctx.fill();
        break;
      case ElementType.PLATFORM:
        ctx.fillStyle = COLORS.platform;
        const platWidth = 4 * GRID_SIZE;
        ctx.fillRect(x, y + (GRID_SIZE - 12) / 2, platWidth, 12);
        break;
      case ElementType.GOAL:
        ctx.fillStyle = COLORS.goal;
        ctx.fillRect(x + GRID_SIZE / 2 - 2, y + 4, 4, GRID_SIZE - 8);
        ctx.beginPath();
        ctx.moveTo(x + GRID_SIZE / 2 + 2, y + 6);
        ctx.lineTo(x + GRID_SIZE / 2 + 22, y + 16);
        ctx.lineTo(x + GRID_SIZE / 2 + 2, y + 26);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.globalAlpha = 1;
  }

  private drawPlayer(player: PlayerState): void {
    const ctx = this.ctx;

    if (player.isFlashing) {
      const flashOn = Math.floor(player.flashTimer * 20) % 2 === 0;
      if (!flashOn) return;
    }

    const x = player.x;
    const y = player.y;
    const w = player.width;
    const h = player.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 2, y + h - 2, w, 3);

    ctx.fillStyle = COLORS.player;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 1, y + 1, w - 3, 4);
    ctx.fillRect(x + 1, y + 1, 3, h - 3);

    ctx.fillStyle = '#fff';
    const eyeY = y + 4;
    const eyeSize = 3;
    ctx.fillRect(x + w - 8, eyeY, eyeSize, eyeSize);
    ctx.fillRect(x + w - 4, eyeY, eyeSize, eyeSize);

    ctx.fillStyle = '#000';
    ctx.fillRect(x + w - 7, eyeY + 1, 1, 1);
    ctx.fillRect(x + w - 3, eyeY + 1, 1, 1);
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
