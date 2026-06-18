import type { RenderData, Planet, Spaceship, Asteroid, Particle } from '../types';
import { MathUtils } from '../utils/MathUtils';

const TOP_BAR_HEIGHT = 60;

export class RenderEngine {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private stars: { x: number; y: number; size: number; brightness: number }[] = [];
  private starfieldBuffer: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;
    this.resize();
    this.generateStars();
    this.createStarfieldBuffer();
    window.addEventListener('resize', this.resize.bind(this));
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.generateStars();
    this.createStarfieldBuffer();
  }

  private generateStars(): void {
    this.stars = [];
    const starCount = Math.floor((this.canvas.width * this.canvas.height) / 3000);
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: MathUtils.random(0, this.canvas.width),
        y: MathUtils.random(0, this.canvas.height),
        size: MathUtils.random(0.5, 2),
        brightness: MathUtils.random(0.3, 1)
      });
    }
  }

  private createStarfieldBuffer(): void {
    this.starfieldBuffer = document.createElement('canvas');
    this.starfieldBuffer.width = this.canvas.width;
    this.starfieldBuffer.height = this.canvas.height;
    const bufferCtx = this.starfieldBuffer.getContext('2d');
    if (!bufferCtx) return;

    bufferCtx.fillStyle = '#0B0B1A';
    bufferCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const star of this.stars) {
      bufferCtx.beginPath();
      bufferCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      bufferCtx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      bufferCtx.fill();
    }
  }

  render(data: RenderData): void {
    const { gameState, time, fps } = data;

    if (this.starfieldBuffer) {
      this.ctx.drawImage(this.starfieldBuffer, 0, 0);
    }

    this.drawOrbits(gameState.planets);
    this.drawGravityWells(gameState.planets);
    this.drawPlanets(gameState.planets);
    this.drawAsteroids(gameState.asteroids);
    this.drawFinishLine(gameState.finishLineX, time);
    this.drawSpaceshipTrail(gameState.spaceship);
    this.drawParticles(gameState.particles);
    this.drawSpaceship(gameState.spaceship, time);
    this.drawVelocityVector(gameState.spaceship);
    this.drawTopBar(gameState, fps);
    this.drawScore(gameState.score);

    if (gameState.status === 'failed') {
      this.drawFailedPanel();
    }
    if (gameState.status === 'victory') {
      this.drawVictoryPanel(gameState.score);
    }
  }

  private drawOrbits(planets: Planet[]): void {
    for (const planet of planets) {
      this.ctx.beginPath();
      this.ctx.ellipse(
        planet.orbit.centerX,
        planet.orbit.centerY,
        planet.orbit.semiMajor,
        planet.orbit.semiMinor,
        0,
        0,
        Math.PI * 2
      );
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([5, 5]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  private drawGravityWells(planets: Planet[]): void {
    for (const planet of planets) {
      const gradient = this.ctx.createRadialGradient(
        planet.position.x, planet.position.y, 0,
        planet.position.x, planet.position.y, planet.gravityWell.radius
      );
      gradient.addColorStop(0, this.hexToRgba(planet.color, 0.4));
      gradient.addColorStop(1, this.hexToRgba(planet.color, 0));

      this.ctx.beginPath();
      this.ctx.arc(planet.position.x, planet.position.y, planet.gravityWell.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
  }

  private drawPlanets(planets: Planet[]): void {
    for (const planet of planets) {
      this.ctx.save();
      this.ctx.translate(planet.position.x, planet.position.y);

      const glowGradient = this.ctx.createRadialGradient(0, 0, planet.radius * 0.8, 0, 0, planet.radius * 1.5);
      glowGradient.addColorStop(0, this.hexToRgba(planet.color, 0.5));
      glowGradient.addColorStop(1, this.hexToRgba(planet.color, 0));
      this.ctx.beginPath();
      this.ctx.arc(0, 0, planet.radius * 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = glowGradient;
      this.ctx.fill();

      this.ctx.rotate(planet.rotation);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, planet.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = planet.color;
      this.ctx.fill();

      this.ctx.save();
      this.ctx.clip();
      this.ctx.strokeStyle = this.hexToRgba('#000000', 0.2);
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const offset = (i * planet.radius * 0.6) - planet.radius * 0.6;
        this.ctx.beginPath();
        this.ctx.ellipse(0, offset, planet.radius * 0.8, planet.radius * 0.2, 0.3, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      this.ctx.restore();

      this.ctx.restore();
    }
  }

  private drawAsteroids(asteroids: Asteroid[]): void {
    for (const asteroid of asteroids) {
      this.ctx.save();
      this.ctx.translate(asteroid.position.x, asteroid.position.y);

      const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, asteroid.radius);
      gradient.addColorStop(0, '#8B8B8B');
      gradient.addColorStop(1, '#5A5A5A');

      this.ctx.beginPath();
      for (let i = 0; i < asteroid.vertices.length; i++) {
        const v = asteroid.vertices[i];
        if (i === 0) {
          this.ctx.moveTo(v.x, v.y);
        } else {
          this.ctx.lineTo(v.x, v.y);
        }
      }
      this.ctx.closePath();
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      this.ctx.strokeStyle = '#4A4A4A';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  private drawFinishLine(x: number, time: number): void {
    const alpha = 0.5 + 0.5 * Math.sin(time * (Math.PI * 2) / 0.8);
    
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(x, TOP_BAR_HEIGHT);
    this.ctx.lineTo(x, this.canvas.height);
    this.ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([10, 10]);
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    this.ctx.shadowColor = '#00E5FF';
    this.ctx.shadowBlur = 20;
    this.ctx.beginPath();
    this.ctx.moveTo(x, TOP_BAR_HEIGHT);
    this.ctx.lineTo(x, this.canvas.height);
    this.ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.5})`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  private drawSpaceshipTrail(spaceship: Spaceship): void {
    if (spaceship.trail.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(spaceship.trail[0].x, spaceship.trail[0].y);
    for (let i = 1; i < spaceship.trail.length; i++) {
      const alpha = i / spaceship.trail.length;
      this.ctx.lineTo(spaceship.trail[i].x, spaceship.trail[i].y);
      this.ctx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.3})`;
      this.ctx.lineWidth = alpha * 3;
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(spaceship.trail[i].x, spaceship.trail[i].y);
    }
  }

  private drawSpaceship(spaceship: Spaceship, time: number): void {
    this.ctx.save();
    this.ctx.translate(spaceship.position.x, spaceship.position.y);
    this.ctx.rotate(spaceship.angle);

    if (spaceship.isInGravityWell) {
      const glowAlpha = 0.2 + 0.6 * Math.abs(Math.sin(time * (Math.PI * 2) / 0.5));
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
      this.ctx.fill();
    }

    this.ctx.beginPath();
    this.ctx.moveTo(20, 0);
    this.ctx.lineTo(-15, -12);
    this.ctx.lineTo(-10, 0);
    this.ctx.lineTo(-15, 12);
    this.ctx.closePath();
    this.ctx.fillStyle = '#00E5FF';
    this.ctx.fill();
    this.ctx.strokeStyle = '#00BFFF';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    if (spaceship.thrust > 0.1) {
      const flameLength = 10 + spaceship.thrust * 15;
      this.ctx.beginPath();
      this.ctx.moveTo(-15, -6);
      this.ctx.lineTo(-15 - flameLength, 0);
      this.ctx.lineTo(-15, 6);
      this.ctx.closePath();
      const flameGradient = this.ctx.createLinearGradient(-15, 0, -15 - flameLength, 0);
      flameGradient.addColorStop(0, '#00E5FF');
      flameGradient.addColorStop(1, 'rgba(0, 191, 255, 0)');
      this.ctx.fillStyle = flameGradient;
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  private drawParticles(particles: Particle[]): void {
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      this.ctx.beginPath();
      this.ctx.arc(p.position.x, p.position.y, p.size * alpha, 0, Math.PI * 2);
      
      if (p.type === 'explosion') {
        this.ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`;
      } else if (p.type === 'victory') {
        this.ctx.fillStyle = `rgba(255, 217, 61, ${alpha})`;
      } else {
        this.ctx.fillStyle = p.color.includes('00E5FF') 
          ? `rgba(0, 229, 255, ${alpha})`
          : `rgba(0, 191, 255, ${alpha})`;
      }
      this.ctx.fill();
    }
  }

  private drawVelocityVector(spaceship: Spaceship): void {
    const baseX = 100;
    const baseY = this.canvas.height - 100;
    const speed = MathUtils.length(spaceship.velocity);
    const maxSpeed = 10;
    const arrowLength = Math.min(speed / maxSpeed * 80, 80);
    const angle = MathUtils.toAngle(spaceship.velocity);

    this.ctx.save();
    this.ctx.translate(baseX, baseY);
    this.ctx.rotate(angle);

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(arrowLength, 0);
    this.ctx.strokeStyle = '#FFD93D';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(arrowLength, 0);
    this.ctx.lineTo(arrowLength - 10, -5);
    this.ctx.lineTo(arrowLength - 10, 5);
    this.ctx.closePath();
    this.ctx.fillStyle = '#FFD93D';
    this.ctx.fill();

    this.ctx.restore();

    this.ctx.fillStyle = '#B0B0D0';
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`速度: ${speed.toFixed(2)}`, baseX - 30, baseY + 40);
  }

  private drawTopBar(gameState: RenderData['gameState'], fps: number): void {
    this.ctx.fillStyle = 'rgba(15, 15, 35, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, TOP_BAR_HEIGHT);
    this.ctx.strokeStyle = '#2A2A4E';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, TOP_BAR_HEIGHT);
    this.ctx.lineTo(this.canvas.width, TOP_BAR_HEIGHT);
    this.ctx.stroke();

    const speed = MathUtils.length(gameState.spaceship.velocity);
    const statusText = gameState.spaceship.isInGravityWell ? '引力井内' : '正常飞行';
    
    this.ctx.fillStyle = '#B0B0D0';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(`速度: ${speed.toFixed(2)} px/f`, 20, 35);
    this.ctx.fillText(`推力: ${(gameState.spaceship.thrust * 100).toFixed(0)}%`, 220, 35);
    this.ctx.fillText(`状态: ${statusText}`, 380, 35);
    this.ctx.fillText(`FPS: ${fps.toFixed(0)}`, 540, 35);
    this.ctx.fillText(`粒子: ${gameState.particles.length}`, 680, 35);
  }

  private drawScore(score: number): void {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '18px monospace';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`得分: ${score.toString().padStart(4, '0')}`, this.canvas.width - 150, 38);
    this.ctx.textAlign = 'left';
  }

  private drawFailedPanel(): void {
    const panelWidth = 300;
    const panelHeight = 120;
    const x = (this.canvas.width - panelWidth) / 2;
    const y = (this.canvas.height - panelHeight) / 2;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, panelWidth, panelHeight, 8);
    this.ctx.fill();

    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.font = '24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('任务失败', this.canvas.width / 2, this.canvas.height / 2 + 8);
    this.ctx.textAlign = 'left';

    this.ctx.fillStyle = '#B0B0D0';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('按 R 键重新开始', this.canvas.width / 2, this.canvas.height / 2 + 35);
    this.ctx.textAlign = 'left';
  }

  private drawVictoryPanel(score: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.beginPath();
    this.ctx.roundRect(
      this.canvas.width / 2 - 150,
      this.canvas.height / 2 - 60,
      300,
      120,
      8
    );
    this.ctx.fill();

    this.ctx.fillStyle = '#FFD93D';
    this.ctx.font = '24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('任务成功!', this.canvas.width / 2, this.canvas.height / 2 - 10);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '18px monospace';
    this.ctx.fillText(`最终得分: ${score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    
    this.ctx.fillStyle = '#B0B0D0';
    this.ctx.font = '14px monospace';
    this.ctx.fillText('按 R 键重新开始', this.canvas.width / 2, this.canvas.height / 2 + 45);
    this.ctx.textAlign = 'left';
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
