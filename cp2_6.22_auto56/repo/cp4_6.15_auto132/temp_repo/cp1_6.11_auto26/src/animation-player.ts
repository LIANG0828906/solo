import { Frame, JOINT_RADIUS, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE } from './types.js';

export class AnimationPlayer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frames: Frame[] = [];
  private currentFrameIndex: number = 0;
  private isPlaying: boolean = false;
  private animationId: number | null = null;
  private lastTimestamp: number = 0;
  private frameDuration: number = 1000 / 60;
  private accumulator: number = 0;
  private frameColor: string = '#000000';
  private bones: { from: number; to: number }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.render();
  }

  setFrames(frames: Frame[], jointCount: number, frameColor: string = '#000000'): void {
    this.frames = frames;
    this.frameColor = frameColor;
    this.currentFrameIndex = 0;
    this.bones = [];

    for (let i = 0; i < jointCount - 1; i++) {
      this.bones.push({ from: i, to: i + 1 });
    }

    this.render();
  }

  play(): void {
    if (this.isPlaying || this.frames.length <= 1) return;
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    this.loop();
  }

  pause(): void {
    this.isPlaying = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  setFrameIndex(index: number): void {
    if (this.frames.length === 0) return;
    this.currentFrameIndex = Math.max(0, Math.min(this.frames.length - 1, index));
    this.render();
  }

  getCurrentFrameIndex(): number {
    return this.currentFrameIndex;
  }

  getFrameCount(): number {
    return this.frames.length;
  }

  private loop(): void {
    if (!this.isPlaying) return;

    this.animationId = requestAnimationFrame(() => this.loop());

    const now = performance.now();
    const delta = now - this.lastTimestamp;
    this.lastTimestamp = now;
    this.accumulator += delta;

    while (this.accumulator >= this.frameDuration) {
      this.advanceFrame();
      this.accumulator -= this.frameDuration;
    }

    this.render();
  }

  private advanceFrame(): void {
    if (this.frames.length === 0) return;
    this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length;
  }

  render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    if (this.frames.length === 0) {
      ctx.fillStyle = '#5a5a7a';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无动画帧', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      return;
    }

    const frame = this.frames[this.currentFrameIndex];
    if (!frame || frame.joints.length === 0) return;

    ctx.strokeStyle = this.frameColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const bone of this.bones) {
      const fromJoint = frame.joints[bone.from];
      const toJoint = frame.joints[bone.to];
      if (fromJoint && toJoint) {
        ctx.beginPath();
        ctx.moveTo(fromJoint.x, fromJoint.y);
        ctx.lineTo(toJoint.x, toJoint.y);
        ctx.stroke();
      }
    }

    for (const joint of frame.joints) {
      const gradient = ctx.createRadialGradient(
        joint.x - 2, joint.y - 2, 1,
        joint.x, joint.y, JOINT_RADIUS + 2
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.7, '#e0e0e0');
      gradient.addColorStop(1, '#b0b0b0');

      ctx.beginPath();
      ctx.arc(joint.x, joint.y, JOINT_RADIUS + 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = this.frameColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(233, 69, 96, 0.8)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    const frameNum = this.currentFrameIndex + 1;
    ctx.fillText(`帧 ${frameNum} / ${this.frames.length}`, CANVAS_WIDTH - 16, 30);
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(42, 42, 78, 0.3)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= this.canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= this.canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  renderFrameToContext(ctx: CanvasRenderingContext2D, frameIndex: number, scale: number = 1): void {
    const frame = this.frames[frameIndex];
    if (!frame) return;

    ctx.save();
    ctx.scale(scale, scale);

    ctx.strokeStyle = this.frameColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const bone of this.bones) {
      const fromJoint = frame.joints[bone.from];
      const toJoint = frame.joints[bone.to];
      if (fromJoint && toJoint) {
        ctx.beginPath();
        ctx.moveTo(fromJoint.x, fromJoint.y);
        ctx.lineTo(toJoint.x, toJoint.y);
        ctx.stroke();
      }
    }

    for (const joint of frame.joints) {
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, JOINT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = this.frameColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  destroy(): void {
    this.pause();
  }
}
