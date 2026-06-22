import Matter from 'matter-js';
import { BlockData, BallData, ParticleData } from './gameEngine';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const LAUNCHER_X = CANVAS_WIDTH / 2;
const LAUNCHER_Y = CANVAS_HEIGHT - 60;
const AIM_AREA_RADIUS = 100;

export interface RenderState {
  blocks: Map<string, BlockData>;
  balls: Map<string, BallData>;
  particles: ParticleData[];
  isAiming: boolean;
  aimAngle: number;
  aimLength: number;
  disappearingBlocks: Map<string, { startTime: number; duration: number }>;
  recycleMessage: { show: boolean; startTime: number };
}

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const viewportWidth = window.innerWidth;
    this.scale = viewportWidth < 900 ? 0.8 : 1;
    
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.canvas.style.width = `${CANVAS_WIDTH * this.scale}px`;
    this.canvas.style.height = `${CANVAS_HEIGHT * this.scale}px`;
  }

  getScale(): number {
    return this.scale;
  }

  render(_world: Matter.World, state: RenderState): void {
    const startTime = performance.now();
    
    this.clear();
    this.drawBackground();
    this.drawAimArea();
    this.drawBlocks(state.blocks, state.disappearingBlocks);
    this.drawBalls(state.balls);
    this.drawParticles(state.particles);
    this.drawLauncher();
    
    if (state.isAiming) {
      this.drawAimGuide(state.aimAngle, state.aimLength);
    }
    
    if (state.recycleMessage.show) {
      this.drawRecycleMessage(state.recycleMessage.startTime);
    }

    const renderTime = performance.now() - startTime;
    if (renderTime > 10) {
      console.warn(`Frame render time: ${renderTime.toFixed(2)}ms`);
    }
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawBackground(): void {
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawAimArea(): void {
    this.ctx.beginPath();
    this.ctx.arc(LAUNCHER_X, LAUNCHER_Y, AIM_AREA_RADIUS, Math.PI, 0, false);
    this.ctx.fillStyle = 'rgba(30, 41, 59, 0.33)';
    this.ctx.fill();
    this.ctx.closePath();
  }

  private drawBlocks(
    blocks: Map<string, BlockData>,
    disappearingBlocks: Map<string, { startTime: number; duration: number }>
  ): void {
    const now = Date.now();

    blocks.forEach(block => {
      const disappearing = disappearingBlocks.get(block.id);
      let scale = 1;
      let opacity = 1;

      if (disappearing) {
        const elapsed = now - disappearing.startTime;
        const progress = Math.min(elapsed / disappearing.duration, 1);
        scale = 1 - progress;
        opacity = 1 - progress;

        if (progress >= 1) {
          return;
        }
      }

      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      this.ctx.translate(block.x, block.y);
      this.ctx.scale(scale, scale);

      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      this.ctx.shadowBlur = 4;
      this.ctx.shadowOffsetY = 2;

      this.ctx.fillStyle = block.color;
      this.ctx.fillRect(
        -block.width / 2,
        -block.height / 2,
        block.width,
        block.height
      );

      this.ctx.restore();
    });
  }

  private drawBalls(balls: Map<string, BallData>): void {
    balls.forEach(ball => {
      if (ball.trail.length > 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
        
        for (let i = 1; i < ball.trail.length; i++) {
          const alpha = (1 - i / ball.trail.length) * 0.2;
          this.ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
          this.ctx.lineWidth = 2;
          this.ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
        }
        this.ctx.stroke();
      }

      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ec4899';
      this.ctx.fill();
      this.ctx.closePath();

      this.ctx.beginPath();
      this.ctx.arc(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        ball.radius * 0.3,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.fill();
      this.ctx.closePath();
    });
  }

  private drawParticles(particles: ParticleData[]): void {
    const now = Date.now();

    particles.forEach(particle => {
      const elapsed = now - particle.createdAt;
      const progress = Math.min(elapsed / particle.lifetime, 1);
      const opacity = 1 - progress;

      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      
      const color = this.hexToRgb(particle.color);
      this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
      this.ctx.fill();
      this.ctx.closePath();
    });
  }

  private drawLauncher(): void {
    this.ctx.beginPath();
    this.ctx.arc(LAUNCHER_X, LAUNCHER_Y, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fill();
    this.ctx.strokeStyle = '#475569';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.arc(LAUNCHER_X, LAUNCHER_Y, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = '#64748b';
    this.ctx.fill();
    this.ctx.closePath();
  }

  private drawAimGuide(angle: number, length: number): void {
    const startX = LAUNCHER_X;
    const startY = LAUNCHER_Y;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;

    this.ctx.beginPath();
    this.ctx.setLineDash([4, 8]);
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.strokeStyle = '#64748b';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
    this.ctx.fill();
    this.ctx.closePath();
  }

  private drawRecycleMessage(startTime: number): void {
    const now = Date.now();
    const elapsed = now - startTime;
    const duration = 400;

    if (elapsed > duration) {
      return;
    }

    const progress = elapsed / duration;
    const opacity = progress < 0.5 ? progress * 2 : 2 - progress * 2;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.font = '24px sans-serif';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('弹珠已回收', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    this.ctx.restore();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 };
  }

  destroy(): void {
    window.removeEventListener('resize', () => this.resize());
  }
}
