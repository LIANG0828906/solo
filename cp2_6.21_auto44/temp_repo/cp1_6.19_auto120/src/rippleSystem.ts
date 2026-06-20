const RIPPLE_DURATION = 0.6;
const RIPPLE_MAX_RADIUS = 140;
const RIPPLE_WIDTH = 3;
const RIPPLE_SPACING = 18;
const WAVE_COUNT = 3;

const RIPPLE_COLORS = ['#FF6B6B', '#FFD93D', '#6C63FF'];

interface RippleWave {
  x: number;
  y: number;
  startTime: number;
}

export class RippleSystem {
  private ripples: RippleWave[] = [];

  emit(x: number, y: number): void {
    this.ripples.push({
      x,
      y,
      startTime: performance.now()
    });
  }

  update(): void {
    const now = performance.now();
    this.ripples = this.ripples.filter(r => {
      const elapsed = (now - r.startTime) / 1000;
      return elapsed < RIPPLE_DURATION;
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const now = performance.now();

    for (const ripple of this.ripples) {
      const elapsed = (now - ripple.startTime) / 1000;
      const progress = Math.min(elapsed / RIPPLE_DURATION, 1);

      for (let i = 0; i < WAVE_COUNT; i++) {
        const waveProgress = Math.max(0, progress - (i * RIPPLE_SPACING) / RIPPLE_MAX_RADIUS);
        if (waveProgress <= 0) continue;

        const radius = waveProgress * RIPPLE_MAX_RADIUS;
        const alpha = (1 - waveProgress) * 0.6;

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = RIPPLE_COLORS[i];
        ctx.lineWidth = RIPPLE_WIDTH;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = RIPPLE_COLORS[i];
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }
  }
}
