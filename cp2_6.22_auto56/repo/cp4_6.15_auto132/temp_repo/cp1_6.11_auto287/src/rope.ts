export interface Knot {
  x: number;
  y: number;
  slipIndex: number;
}

export class Rope {
  knots: Knot[] = [];
  bindingOrder: number[] = [];
  weaveOffset = 0;
  private totalSlips: number;

  constructor(totalSlips: number) {
    this.totalSlips = totalSlips;
  }

  addKnot(slipIndex: number, x: number, y: number): void {
    if (this.bindingOrder.includes(slipIndex)) return;
    this.knots.push({ x, y, slipIndex });
    this.bindingOrder.push(slipIndex);
  }

  isFullyBound(): boolean {
    return this.bindingOrder.length >= this.totalSlips;
  }

  getBindingProgress(): number {
    return this.bindingOrder.length / this.totalSlips;
  }

  update(dt: number): void {
    this.weaveOffset += dt * 30;
  }

  render(ctx: CanvasRenderingContext2D, slipGrooves: { top: { x: number; y: number }; bottom: { x: number; y: number } }[]): void {
    if (this.knots.length < 2) {
      for (const knot of this.knots) {
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.arc(knot.x, knot.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    const sortedKnots = [...this.knots].sort((a, b) => {
      const ai = this.bindingOrder.indexOf(a.slipIndex);
      const bi = this.bindingOrder.indexOf(b.slipIndex);
      return ai - bi;
    });

    for (let i = 0; i < sortedKnots.length; i++) {
      const knot = sortedKnots[i];
      const groove = slipGrooves[knot.slipIndex];

      ctx.strokeStyle = '#C2A670';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(groove.top.x, groove.top.y);
      ctx.lineTo(groove.bottom.x, groove.bottom.y);
      ctx.stroke();

      this.drawWeaveSegment(ctx, groove.top, groove.bottom);
    }

    for (let i = 0; i < sortedKnots.length - 1; i++) {
      const from = sortedKnots[i];
      const to = sortedKnots[i + 1];
      const fromGroove = slipGrooves[from.slipIndex];
      const toGroove = slipGrooves[to.slipIndex];

      this.drawRopeSegment(ctx, fromGroove.bottom, toGroove.bottom);
    }

    for (const knot of sortedKnots) {
      ctx.fillStyle = '#B8860B';
      ctx.beginPath();
      ctx.arc(knot.x, knot.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(100, 60, 10, 0.4)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(knot.x, knot.y, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  private drawRopeSegment(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(dist / 4));

    ctx.strokeStyle = '#C2A670';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;
      const offset = Math.sin(t * Math.PI * 8 + this.weaveOffset * 0.05) * 1.5;
      ctx.lineTo(x + offset * (dy / dist), y - offset * (dx / dist));
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(160, 130, 80, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;
      const offset = Math.sin(t * Math.PI * 8 + this.weaveOffset * 0.05 + Math.PI) * 1.5;
      ctx.lineTo(x + offset * (dy / dist), y - offset * (dx / dist));
    }
    ctx.stroke();
  }

  private drawWeaveSegment(ctx: CanvasRenderingContext2D, top: { x: number; y: number }, bottom: { x: number; y: number }): void {
    const dx = bottom.x - top.x;
    const dy = bottom.y - top.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(dist / 3));

    ctx.strokeStyle = '#C2A670';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = top.x + dx * t;
      const y = top.y + dy * t;
      const offset = Math.sin(t * Math.PI * 12 + this.weaveOffset * 0.03) * 1;
      ctx.lineTo(x + offset, y);
    }
    ctx.stroke();
  }
}
