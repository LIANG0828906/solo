export class Rosary {
  private x: number = 0;
  private y: number = 0;
  private ringRadius: number = 200;
  private beadRadius: number = 5;
  private readonly TOTAL_BEADS = 108;
  private rotationAngle: number = 0;
  private selectedIndex: number = -1;
  private count: number = 0;
  private beads: Array<{ angle: number; clicked: boolean }> = [];
  private isDragging: boolean = false;
  private dragStartAngle: number = 0;
  private dragRotationStart: number = 0;
  private angularVelocity: number = 0;
  private inertiaActive: boolean = false;
  private lastDragAngle: number = 0;
  private lastDragTime: number = 0;
  private audioCtx: AudioContext | null = null;
  private scale: number = 1;

  constructor() {
    this.initBeads();
  }

  private initBeads(): void {
    this.beads = [];
    for (let i = 0; i < this.TOTAL_BEADS; i++) {
      this.beads.push({
        angle: (Math.PI * 2 / this.TOTAL_BEADS) * i,
        clicked: false,
      });
    }
  }

  resize(width: number, height: number): void {
    this.x = width / 2;
    this.y = height / 2;
    if (width < 768) {
      this.ringRadius = Math.min(width, height) * 0.3;
      this.beadRadius = 4;
      this.scale = 0.8;
    } else {
      this.ringRadius = 200;
      this.beadRadius = 5;
      this.scale = 1;
    }
  }

  private getAngleFromCenter(mx: number, my: number): number {
    return Math.atan2(my - this.y, mx - this.x);
  }

  private getDistFromCenter(mx: number, my: number): number {
    return Math.sqrt((mx - this.x) ** 2 + (my - this.y) ** 2);
  }

  private getBeadWorldAngle(index: number): number {
    return this.beads[index].angle + this.rotationAngle;
  }

  private getBeadPos(index: number): { x: number; y: number } {
    const a = this.getBeadWorldAngle(index);
    return {
      x: this.x + Math.cos(a) * this.ringRadius,
      y: this.y + Math.sin(a) * this.ringRadius,
    };
  }

  handleMouseDown(mx: number, my: number): boolean {
    const dist = this.getDistFromCenter(mx, my);
    if (dist < this.ringRadius - this.beadRadius * 3 || dist > this.ringRadius + this.beadRadius * 3) {
      return false;
    }

    this.isDragging = true;
    this.inertiaActive = false;
    this.angularVelocity = 0;
    this.dragStartAngle = this.getAngleFromCenter(mx, my);
    this.dragRotationStart = this.rotationAngle;
    this.lastDragAngle = this.dragStartAngle;
    this.lastDragTime = performance.now();

    return true;
  }

  handleMouseMove(mx: number, my: number): void {
    if (!this.isDragging) return;

    const currentAngle = this.getAngleFromCenter(mx, my);
    let delta = currentAngle - this.dragStartAngle;

    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    this.rotationAngle = this.dragRotationStart + delta;

    const now = performance.now();
    const dt = (now - this.lastDragTime) / 1000;
    if (dt > 0) {
      let angleDelta = currentAngle - this.lastDragAngle;
      if (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
      if (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
      this.angularVelocity = angleDelta / dt;
    }
    this.lastDragAngle = currentAngle;
    this.lastDragTime = now;
  }

  handleMouseUp(mx: number, my: number): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    const dist = this.getDistFromCenter(mx, my);
    if (dist >= this.ringRadius - this.beadRadius * 3 && dist <= this.ringRadius + this.beadRadius * 3) {
      this.tryClickBead(mx, my);
    }

    if (Math.abs(this.angularVelocity) > 0.01) {
      this.inertiaActive = true;
    }
  }

  private tryClickBead(mx: number, my: number): void {
    const clickAngle = this.getAngleFromCenter(mx, my);
    let closestIndex = -1;
    let closestDist = Infinity;

    for (let i = 0; i < this.TOTAL_BEADS; i++) {
      const beadAngle = this.getBeadWorldAngle(i);
      let angleDiff = clickAngle - beadAngle;
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const angularDist = Math.abs(angleDiff);
      if (angularDist < closestDist) {
        closestDist = angularDist;
        closestIndex = i;
      }
    }

    if (closestIndex >= 0 && closestDist < 0.1 && !this.beads[closestIndex].clicked) {
      this.beads[closestIndex].clicked = true;
      this.selectedIndex = closestIndex;
      this.count++;
      this.playBellSound();

      const nextIndex = (closestIndex + 1) % this.TOTAL_BEADS;
      if (!this.beads[nextIndex].clicked) {
        this.selectedIndex = nextIndex;
      }
    }
  }

  private playBellSound(): void {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(this.audioCtx.currentTime);
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  update(dt: number): void {
    if (this.inertiaActive) {
      this.rotationAngle += this.angularVelocity * dt;
      this.angularVelocity *= 0.92;

      if (Math.abs(this.angularVelocity) < 0.05) {
        this.inertiaActive = false;
        this.angularVelocity = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const beadDrawRadius = this.beadRadius * this.scale;

    ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < this.TOTAL_BEADS; i++) {
      const pos = this.getBeadPos(i);
      const isHighlighted = i === this.selectedIndex;
      const isClicked = this.beads[i].clicked;

      const r = isHighlighted ? beadDrawRadius * 1.2 : beadDrawRadius;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);

      if (isHighlighted) {
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;
      } else if (isClicked) {
        ctx.fillStyle = '#A08030';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#B8860B';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#8B7355';
    ctx.font = `${16 * this.scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`${this.count} / ${this.TOTAL_BEADS}`, this.x, this.y);
  }

  reset(): void {
    this.initBeads();
    this.rotationAngle = 0;
    this.selectedIndex = -1;
    this.count = 0;
    this.isDragging = false;
    this.inertiaActive = false;
    this.angularVelocity = 0;
  }

  getCount(): number {
    return this.count;
  }

  isComplete(): boolean {
    return this.count >= this.TOTAL_BEADS;
  }
}
