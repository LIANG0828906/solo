interface RippleEffect {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

interface ScoreMarker {
  x: number;
  y: number;
  score: number;
}

const COLORS = {
  BULLSEYE_RED: '#FF0000',
  RING_WHITE: '#FFFFFF',
  RING_BLACK: '#333333',
  TARGET_STAND: '#5C3A21',
  HIT_MARKER: '#FFFFFF',
  RIPPLE: 'rgba(255,255,255,1)'
};

const SIZES = {
  BULLSEYE_DIAMETER: 40,
  OUTER_RING_BORDER: 10,
  HIT_MARKER_SIZE: 4,
  RIPPLE_MAX_RADIUS: 30,
  RIPPLE_DURATION: 30,
  SHAKE_MAX_OFFSET: 3,
  SHAKE_DURATION: 3,
  RING_COUNT: 10
};

const MAX_RIPPLES = 5;
const MAX_MARKERS = 20;

export class Target {
  public x: number;
  public y: number;
  public bullseyeRadius: number;
  public ringWidth: number;
  public totalRadius: number;
  private ripples: RippleEffect[] = [];
  private markers: ScoreMarker[] = [];
  private shakeFrames = 0;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;
  private scale: number;

  constructor(x: number, y: number, canvasWidth: number) {
    this.x = x;
    this.y = y;
    this.bullseyeRadius = SIZES.BULLSEYE_DIAMETER / 2;
    this.ringWidth = this.bullseyeRadius / SIZES.RING_COUNT;
    this.totalRadius = this.bullseyeRadius + (SIZES.RING_COUNT - 1) * this.ringWidth + SIZES.OUTER_RING_BORDER;
    this.scale = canvasWidth >= 1024 ? 1 : canvasWidth < 768 ? 0.8 : 0.9;
  }

  updateScale(canvasWidth: number): void {
    this.scale = canvasWidth >= 1024 ? 1 : canvasWidth < 768 ? 0.8 : 0.9;
  }

  updateEffects(): void {
    if (this.shakeFrames > 0) {
      this.shakeFrames--;
      const decay = this.shakeFrames / SIZES.SHAKE_DURATION;
      this.shakeOffsetX = (Math.random() * 2 - 1) * SIZES.SHAKE_MAX_OFFSET * decay;
      this.shakeOffsetY = (Math.random() * 2 - 1) * SIZES.SHAKE_MAX_OFFSET * decay;
      if (this.shakeFrames === 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }

    this.ripples = this.ripples.filter(r => {
      r.life--;
      const t = 1 - r.life / r.maxLife;
      r.radius = t * SIZES.RIPPLE_MAX_RADIUS;
      r.alpha = 0.6 * (1 - t);
      return r.life > 0;
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    const ox = this.x + this.shakeOffsetX;
    const oy = this.y + this.shakeOffsetY;
    const s = this.scale;

    ctx.fillStyle = COLORS.TARGET_STAND;
    ctx.fillRect(ox - 4 * s, oy + this.totalRadius * s, 8 * s, 80 * s);
    ctx.fillRect(ox - 30 * s, oy + this.totalRadius * s + 70 * s, 60 * s, 6 * s);

    const r10 = this.bullseyeRadius * s;
    const r9 = (this.bullseyeRadius + this.ringWidth) * s;
    const r8 = (this.bullseyeRadius + this.ringWidth * 2) * s;
    const r7 = (this.bullseyeRadius + this.ringWidth * 3) * s;
    const r6 = (this.bullseyeRadius + this.ringWidth * 4) * s;
    const r5 = (this.bullseyeRadius + this.ringWidth * 5) * s;
    const r4 = (this.bullseyeRadius + this.ringWidth * 6) * s;
    const r3 = (this.bullseyeRadius + this.ringWidth * 7) * s;
    const r2 = (this.bullseyeRadius + this.ringWidth * 8) * s;
    const r1 = (this.bullseyeRadius + this.ringWidth * 9) * s;
    const rOuter = (this.bullseyeRadius + this.ringWidth * 9 + SIZES.OUTER_RING_BORDER) * s;

    ctx.beginPath();
    ctx.arc(ox, oy, rOuter, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.RING_BLACK;
    ctx.fill();

    const rings = [
      { r: r1, color: COLORS.RING_WHITE },
      { r: r2, color: COLORS.RING_BLACK },
      { r: r3, color: COLORS.RING_WHITE },
      { r: r4, color: COLORS.RING_BLACK },
      { r: r5, color: COLORS.RING_WHITE },
      { r: r6, color: COLORS.RING_BLACK },
      { r: r7, color: COLORS.RING_WHITE },
      { r: r8, color: COLORS.RING_BLACK },
      { r: r9, color: COLORS.RING_WHITE },
      { r: r10, color: COLORS.BULLSEYE_RED }
    ];

    for (const ring of rings) {
      ctx.beginPath();
      ctx.arc(ox, oy, ring.r, 0, Math.PI * 2);
      ctx.fillStyle = ring.color;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(ox, oy, rOuter, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (const m of this.markers) {
      const mx = ox + (m.x - this.x) * s;
      const my = oy + (m.y - this.y) * s;
      ctx.beginPath();
      ctx.arc(mx, my, SIZES.HIT_MARKER_SIZE, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.HIT_MARKER;
      ctx.fill();
      ctx.strokeStyle = '#FF4500';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (const r of this.ripples) {
      const rx = ox + (r.x - this.x) * s;
      const ry = oy + (r.y - this.y) * s;
      ctx.beginPath();
      ctx.arc(rx, ry, r.radius * s, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${r.alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  registerHit(hitX: number, hitY: number): number {
    const dx = hitX - this.x;
    const dy = hitY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const scaledTotal = this.totalRadius;
    if (dist > scaledTotal) return 0;

    let score = 0;
    for (let i = SIZES.RING_COUNT; i >= 1; i--) {
      const ringR = this.bullseyeRadius + this.ringWidth * (SIZES.RING_COUNT - i);
      if (dist <= ringR) {
        score = i;
        break;
      }
    }

    if (this.markers.length >= MAX_MARKERS) {
      this.markers.shift();
    }
    this.markers.push({ x: hitX, y: hitY, score });
    return score;
  }

  triggerRipple(x: number, y: number): void {
    if (this.ripples.length >= MAX_RIPPLES) {
      this.ripples.shift();
    }
    this.ripples.push({
      x, y,
      radius: 0,
      alpha: 0.6,
      life: SIZES.RIPPLE_DURATION,
      maxLife: SIZES.RIPPLE_DURATION
    });
  }

  triggerShake(): void {
    this.shakeFrames = SIZES.SHAKE_DURATION;
  }

  clearMarkers(): void {
    this.markers = [];
    this.ripples = [];
  }
}
