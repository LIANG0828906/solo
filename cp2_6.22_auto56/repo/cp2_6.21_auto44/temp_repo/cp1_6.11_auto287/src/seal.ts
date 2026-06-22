export interface StampOption {
  text: string;
  type: string;
  bg: string;
}

export const STAMP_OPTIONS: StampOption[] = [
  { text: '密', type: '阴文', bg: '#CC3333' },
  { text: '印', type: '阳文', bg: '#CC3333' },
  { text: '信', type: '朱文', bg: '#CC3333' },
  { text: '瑞', type: '白文', bg: '#CC3333' }
];

export interface Crack {
  x: number;
  y: number;
  angle: number;
  length: number;
  branches: { angle: number; length: number }[];
}

export class Seal {
  rolling = false;
  rolled = false;
  rollProgress = 0;
  selectedStamp: StampOption | null = null;
  showStampSelector = false;
  stampAnimProgress = 0;
  cracks: Crack[] = [];
  unrolling = false;
  unrolled = false;
  unrollProgress = 0;
  clayX = 0;
  clayY = 0;
  clayRadius = 25;

  startRolling(): void {
    this.rolling = true;
    this.rollProgress = 0;
  }

  selectStamp(stamp: StampOption): void {
    this.selectedStamp = stamp;
    this.showStampSelector = false;
    this.stampAnimProgress = 0;
    this.generateCracks();
  }

  startUnrolling(): void {
    this.unrolling = true;
    this.unrollProgress = 0;
  }

  update(dt: number): void {
    if (this.rolling && !this.rolled) {
      this.rollProgress += dt / 0.6;
      if (this.rollProgress >= 1) {
        this.rollProgress = 1;
        this.rolling = false;
        this.rolled = true;
      }
    }

    if (this.selectedStamp && this.stampAnimProgress < 1) {
      this.stampAnimProgress = Math.min(1, this.stampAnimProgress + dt * 4);
    }

    if (this.unrolling && !this.unrolled) {
      this.unrollProgress += dt / 0.5;
      if (this.unrollProgress >= 1) {
        this.unrollProgress = 1;
        this.unrolling = false;
        this.unrolled = true;
      }
    }
  }

  private generateCracks(): void {
    this.cracks = [];
    const count = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const startR = this.clayRadius * (0.6 + Math.random() * 0.3);
      const crack: Crack = {
        x: Math.cos(angle) * startR,
        y: Math.sin(angle) * startR,
        angle: angle + (Math.random() - 0.5) * 1.5,
        length: 4 + Math.random() * 8,
        branches: []
      };
      const branchCount = Math.floor(Math.random() * 2);
      for (let j = 0; j < branchCount; j++) {
        crack.branches.push({
          angle: crack.angle + (Math.random() - 0.5) * 1.2,
          length: 2 + Math.random() * 4
        });
      }
      this.cracks.push(crack);
    }
  }

  render(ctx: CanvasRenderingContext2D, centerX: number, centerY: number): void {
    this.clayX = centerX;
    this.clayY = centerY - 40;

    if (!this.rolled && !this.unrolling && !this.unrolled) return;

    this.renderClaySeal(ctx);
    if (this.showStampSelector) {
      this.renderStampSelector(ctx);
    }
  }

  renderOnUnrolled(ctx: CanvasRenderingContext2D, centerX: number, topY: number): void {
    this.clayX = centerX;
    this.clayY = topY - 30;
    this.renderClaySeal(ctx);
  }

  private renderClaySeal(ctx: CanvasRenderingContext2D): void {
    const cx = this.clayX;
    const cy = this.clayY;

    ctx.save();
    ctx.fillStyle = '#800000';
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.clayRadius, this.clayRadius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    const grad = ctx.createRadialGradient(cx - 5, cy - 3, 2, cx, cy, this.clayRadius);
    grad.addColorStop(0, 'rgba(160, 40, 40, 0.4)');
    grad.addColorStop(1, 'rgba(80, 0, 0, 0.3)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.clayRadius, this.clayRadius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(60, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.clayRadius, this.clayRadius * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (this.selectedStamp) {
      const p = this.stampAnimProgress;
      ctx.save();
      ctx.globalAlpha = p;
      ctx.translate(cx, cy);
      ctx.scale(0.8 + p * 0.2, 0.8 + p * 0.2);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.selectedStamp.text, 0, 0);

      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(this.selectedStamp.text, 0, 0);

      ctx.restore();
    }

    if (this.cracks.length > 0) {
      ctx.strokeStyle = 'rgba(74, 44, 26, 0.5)';
      ctx.lineWidth = 0.8;
      for (const crack of this.cracks) {
        const sx = cx + crack.x;
        const sy = cy + crack.y * 0.7;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(
          sx + Math.cos(crack.angle) * crack.length,
          sy + Math.sin(crack.angle) * crack.length * 0.7
        );
        ctx.stroke();
        for (const branch of crack.branches) {
          const bx = sx + Math.cos(crack.angle) * crack.length * 0.6;
          const by = sy + Math.sin(crack.angle) * crack.length * 0.6;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(
            bx + Math.cos(branch.angle) * branch.length,
            by + Math.sin(branch.angle) * branch.length * 0.7
          );
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  private renderStampSelector(ctx: CanvasRenderingContext2D): void {
    const cx = this.clayX;
    const cy = this.clayY - 80;
    const radius = 70;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < STAMP_OPTIONS.length; i++) {
      const angle = -Math.PI / 2 + (i / STAMP_OPTIONS.length) * Math.PI * 2;
      const stampR = 35;
      const sx = cx + Math.cos(angle) * stampR;
      const sy = cy + Math.sin(angle) * stampR;
      const sr = 18;

      ctx.fillStyle = STAMP_OPTIONS[i].bg;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#8B0000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(STAMP_OPTIONS[i].text, sx, sy - 4);

      ctx.font = '8px serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(STAMP_OPTIONS[i].type, sx, sy + 10);
    }

    ctx.restore();
  }

  hitTestStampSelector(x: number, y: number): StampOption | null {
    if (!this.showStampSelector) return null;
    const cx = this.clayX;
    const cy = this.clayY - 80;
    const stampR = 35;

    for (let i = 0; i < STAMP_OPTIONS.length; i++) {
      const angle = -Math.PI / 2 + (i / STAMP_OPTIONS.length) * Math.PI * 2;
      const sx = cx + Math.cos(angle) * stampR;
      const sy = cy + Math.sin(angle) * stampR;
      const dx = x - sx;
      const dy = y - sy;
      if (dx * dx + dy * dy < 18 * 18) {
        return STAMP_OPTIONS[i];
      }
    }
    return null;
  }

  hitTestClay(x: number, y: number): boolean {
    const dx = x - this.clayX;
    const dy = y - this.clayY;
    return (dx * dx) / (this.clayRadius * this.clayRadius) +
      (dy * dy) / ((this.clayRadius * 0.7) * (this.clayRadius * 0.7)) < 1;
  }

  renderRollAnimation(ctx: CanvasRenderingContext2D, slips: { x: number; y: number; width: number; height: number }[], progress: number): void {
    if (progress <= 0) return;
    const p = this.easeInOut(progress);
    const slip0 = slips[0];
    const rollX = slip0.x + slip0.width * 0.5;

    for (let i = 0; i < slips.length; i++) {
      const slip = slips[i];
      const slipCenterX = slip.x + slip.width / 2;
      const dist = slipCenterX - rollX;
      const newDist = dist * (1 - p);
      const newX = rollX + newDist - slip.width / 2;

      const curlRadius = p * 15;
      const scaleY = 1 - p * 0.3;

      ctx.save();
      ctx.translate(newX + slip.width / 2, slip.y + slip.height / 2);
      ctx.scale(1, scaleY);
      ctx.translate(-(newX + slip.width / 2), -(slip.y + slip.height / 2));

      ctx.fillStyle = '#D2B48C';
      ctx.fillRect(newX, slip.y, slip.width, slip.height);

      if (curlRadius > 0) {
        ctx.strokeStyle = 'rgba(100, 60, 20, 0.3)';
        ctx.lineWidth = 1;
        for (let j = 0; j < curlRadius; j += 3) {
          ctx.beginPath();
          ctx.moveTo(newX + slip.width - j, slip.y);
          ctx.lineTo(newX + slip.width - j, slip.y + slip.height);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = 'rgba(139, 90, 43, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(newX, slip.y, slip.width, slip.height);

      ctx.restore();
    }

    if (p > 0.5) {
      const wrapAlpha = (p - 0.5) * 2;
      ctx.save();
      ctx.globalAlpha = wrapAlpha * 0.4;
      ctx.fillStyle = '#8B6914';
      const wrapWidth = 8 * wrapAlpha;
      ctx.fillRect(rollX - wrapWidth / 2, slip0.y - 5, wrapWidth, slip0.height + 10);
      ctx.restore();
    }
  }

  renderUnrollAnimation(ctx: CanvasRenderingContext2D, slips: { x: number; y: number; width: number; height: number }[], progress: number): void {
    const p = this.easeInOut(progress);
    const centerX = slips[0].x + (slips[slips.length - 1].x + slips[slips.length - 1].width - slips[0].x) / 2;

    for (let i = 0; i < slips.length; i++) {
      const slip = slips[i];
      const slipCenterX = slip.x + slip.width / 2;
      const dist = slipCenterX - centerX;
      const targetX = slip.x;
      const startDist = 0;
      const currentDist = startDist + (dist - startDist) * p;
      const newX = centerX + currentDist - slip.width / 2;

      ctx.save();
      const scaleY = 0.7 + 0.3 * p;
      ctx.translate(newX + slip.width / 2, slip.y + slip.height / 2);
      ctx.scale(1, scaleY);
      ctx.translate(-(newX + slip.width / 2), -(slip.y + slip.height / 2));

      ctx.fillStyle = '#D2B48C';
      ctx.fillRect(newX, slip.y, slip.width, slip.height);

      ctx.strokeStyle = 'rgba(139, 90, 43, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(newX, slip.y, slip.width, slip.height);

      ctx.restore();
    }
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}
