import type { GameState, Echo, Wall, Chandelier, Singer, Particle, Vector2 } from './GameLogic';
import { GameLogic } from './GameLogic';

export class RenderModule {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private gameLogic: GameLogic;
  private readonly SCENE_WIDTH = 800;
  private readonly SCENE_HEIGHT = 600;

  constructor(canvas: HTMLCanvasElement, gameLogic: GameLogic) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.gameLogic = gameLogic;
  }

  public render(now: number): void {
    const state = this.gameLogic.getState();

    this.ctx.clearRect(0, 0, this.SCENE_WIDTH, this.SCENE_HEIGHT);

    this.drawBackground();
    this.drawWalls(state.walls);
    this.drawChandeliers(state.chandeliers);
    this.drawActivationRings(state.singers, state.hoveredSingerId, now);
    this.drawSingers(state.singers, now);
    this.drawEchoes(state.echoes);
    this.drawParticles(state.particles);
    this.drawGlobalFlash(now);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createRadialGradient(
      this.SCENE_WIDTH / 2,
      this.SCENE_HEIGHT / 2,
      0,
      this.SCENE_WIDTH / 2,
      this.SCENE_HEIGHT / 2,
      Math.max(this.SCENE_WIDTH, this.SCENE_HEIGHT) / 2
    );
    gradient.addColorStop(0, '#1a0a24');
    gradient.addColorStop(0.5, '#0f0518');
    gradient.addColorStop(1, '#050208');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.SCENE_WIDTH, this.SCENE_HEIGHT);

    this.drawStageFloor();
  }

  private drawStageFloor(): void {
    this.ctx.save();
    this.ctx.globalAlpha = 0.15;
    this.ctx.strokeStyle = '#4A2E1A';
    this.ctx.lineWidth = 1;

    for (let y = 200; y < this.SCENE_HEIGHT; y += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.SCENE_WIDTH, y);
      this.ctx.stroke();
    }

    for (let x = 0; x < this.SCENE_WIDTH; x += 100) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 200);
      this.ctx.lineTo(x + 50, this.SCENE_HEIGHT);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawWalls(walls: Wall[]): void {
    this.ctx.strokeStyle = '#444444';
    this.ctx.lineWidth = 8;
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    for (const wall of walls) {
      this.ctx.beginPath();
      this.ctx.moveTo(wall.start.x, wall.start.y);
      this.ctx.lineTo(wall.end.x, wall.end.y);
      this.ctx.stroke();
    }

    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  private drawChandeliers(chandeliers: Chandelier[]): void {
    for (const chandelier of chandeliers) {
      this.drawChandelier(chandelier);
    }
  }

  private drawChandelier(chandelier: Chandelier): void {
    const { position, brightness, swingAngle } = chandelier;

    this.ctx.save();
    this.ctx.translate(position.x, position.y);
    this.ctx.rotate(swingAngle);

    const glowRadius = 20 + (brightness - 0.8) * 50;
    const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    glowGradient.addColorStop(0, `rgba(255, 230, 100, ${0.4 * brightness})`);
    glowGradient.addColorStop(0.5, `rgba(255, 200, 50, ${0.2 * brightness})`);
    glowGradient.addColorStop(1, 'rgba(255, 180, 0, 0)');

    this.ctx.fillStyle = glowGradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = `rgba(255, 220, 80, ${brightness})`;
    this.ctx.shadowColor = `rgba(255, 200, 50, ${brightness})`;
    this.ctx.shadowBlur = 15 * brightness;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawActivationRings(singers: Singer[], hoveredId: number | null, now: number): void {
    for (const singer of singers) {
      if (singer.activated) continue;

      const isHovered = singer.id === hoveredId;
      const opacity = isHovered ? 0.5 : 0;

      if (opacity <= 0) continue;

      const pulse = 1 + Math.sin(now / 300) * 0.05;

      this.ctx.save();
      this.ctx.globalAlpha = opacity;

      this.ctx.strokeStyle = '#FF4444';
      this.ctx.lineWidth = 5;
      this.ctx.shadowColor = 'rgba(255, 68, 68, 0.8)';
      this.ctx.shadowBlur = 10;

      this.ctx.beginPath();
      this.ctx.arc(singer.position.x, singer.position.y, 60 * pulse, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.globalAlpha = opacity * 0.3;
      this.ctx.fillStyle = '#FF4444';
      this.ctx.beginPath();
      this.ctx.arc(singer.position.x, singer.position.y, 60 * pulse, 0, Math.PI * 2);
      this.ctx.arc(singer.position.x, singer.position.y, 55 * pulse, 0, Math.PI * 2, true);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private drawSingers(singers: Singer[], now: number): void {
    for (const singer of singers) {
      this.drawSinger(singer, now);
    }
  }

  private drawSinger(singer: Singer, now: number): void {
    const { position, activated, rotation, resonance, flashActive } = singer;
    const opacity = this.gameLogic.getSingerPulseOpacity(singer, now);

    this.ctx.save();
    this.ctx.translate(position.x, position.y);

    if (activated) {
      this.ctx.rotate((rotation * Math.PI) / 180);
    }

    const color = activated ? '#FFD700' : '#EAEAEA';

    if (flashActive) {
      this.ctx.shadowColor = '#FFFFFF';
      this.ctx.shadowBlur = 30;
    } else if (activated) {
      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 20;
    }

    this.ctx.globalAlpha = opacity;
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 2;

    this.drawHumanoidFigure();

    if (!activated && resonance > 0) {
      this.ctx.globalAlpha = 0.8;
      this.ctx.shadowBlur = 0;
      this.drawResonanceBar(resonance);
    }

    this.ctx.restore();
  }

  private drawHumanoidFigure(): void {
    this.ctx.beginPath();
    this.ctx.arc(0, -25, 12, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(0, -13);
    this.ctx.lineTo(0, 15);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(-20, 0);
    this.ctx.lineTo(20, 0);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(0, 15);
    this.ctx.lineTo(-15, 40);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(0, 15);
    this.ctx.lineTo(15, 40);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(-8, -30);
    this.ctx.quadraticCurveTo(0, -40, 8, -30);
    this.ctx.stroke();
  }

  private drawResonanceBar(resonance: number): void {
    const barWidth = 50;
    const barHeight = 4;
    const x = -barWidth / 2;
    const y = 50;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(x, y, barWidth, barHeight);

    const fillWidth = (resonance / 100) * barWidth;
    this.ctx.fillStyle = resonance >= 100 ? '#FFD700' : '#FF6B6B';
    this.ctx.fillRect(x, y, fillWidth, barHeight);
  }

  private drawEchoes(echoes: Echo[]): void {
    for (const echo of echoes) {
      this.drawEcho(echo);
    }
  }

  private drawEcho(echo: Echo): void {
    const { center, radius, opacity, color } = echo;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 15;

    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    if (echo.isReflection) {
      this.ctx.globalAlpha = opacity * 0.5;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(center.x, center.y, radius + 3, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawParticles(particles: Particle[]): void {
    for (const particle of particles) {
      this.drawParticle(particle);
    }
  }

  private drawParticle(particle: Particle): void {
    const { position, size, opacity } = particle;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 8;

    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, size, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawGlobalFlash(now: number): void {
    const alpha = this.gameLogic.getGlobalFlashAlpha(now);
    if (alpha <= 0) return;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.SCENE_WIDTH, this.SCENE_HEIGHT);
    this.ctx.restore();
  }
}
