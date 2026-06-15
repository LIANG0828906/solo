export interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

export class StarfieldRenderer {
  private stars: Star[] = [];
  private width: number;
  private height: number;
  private nebulaBlobs: { x: number; y: number; radius: number; color: string; phase: number }[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.initializeStars();
    this.initializeNebula();
  }

  private initializeStars(): void {
    const starCount = 180;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.8 + 0.3,
        baseAlpha: Math.random() * 0.6 + 0.4,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.06
      });
    }
  }

  private initializeNebula(): void {
    const colors = [
      'rgba(30, 60, 120, 0.12)',
      'rgba(80, 30, 100, 0.08)',
      'rgba(20, 80, 100, 0.1)',
      'rgba(60, 40, 120, 0.08)'
    ];

    for (let i = 0; i < 5; i++) {
      this.nebulaBlobs.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: 80 + Math.random() * 150,
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  public update(deltaTime: number): void {
    const dt = deltaTime / 16.67;
    for (const star of this.stars) {
      star.twinklePhase += star.twinkleSpeed * dt;
    }
    for (const blob of this.nebulaBlobs) {
      blob.phase += 0.008 * dt;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    const bgGradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    bgGradient.addColorStop(0, '#0a0e27');
    bgGradient.addColorStop(0.5, '#0d1235');
    bgGradient.addColorStop(1, '#0a0e27');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const blob of this.nebulaBlobs) {
      const wobbleX = Math.sin(blob.phase) * 15;
      const wobbleY = Math.cos(blob.phase * 0.7) * 15;
      const gradient = ctx.createRadialGradient(
        blob.x + wobbleX, blob.y + wobbleY, 0,
        blob.x + wobbleX, blob.y + wobbleY, blob.radius
      );
      gradient.addColorStop(0, blob.color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    for (const star of this.stars) {
      const twinkle = (Math.sin(star.twinklePhase) * 0.5 + 0.5);
      const alpha = star.baseAlpha * (0.4 + twinkle * 0.6);

      ctx.save();
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      if (star.size > 1.2) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 2.5
        );
        glowGradient.addColorStop(0, `rgba(200, 220, 255, ${alpha * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
