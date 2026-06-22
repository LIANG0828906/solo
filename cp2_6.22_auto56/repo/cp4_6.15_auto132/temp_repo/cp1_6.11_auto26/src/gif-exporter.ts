import GIF from 'gif.js';
import { Frame, CANVAS_WIDTH, CANVAS_HEIGHT, GIF_FPS, JOINT_RADIUS } from './types.js';

interface ExportOptions {
  frames: Frame[];
  bones: { from: number; to: number }[];
  color: string;
  onProgress?: (progress: number) => void;
  onComplete?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export class GifExporter {
  static export(options: ExportOptions): void {
    const { frames, bones, color, onProgress, onComplete, onError } = options;

    if (frames.length === 0) {
      if (onError) onError(new Error('没有可导出的帧'));
      return;
    }

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      workerScript: '/gif.worker.js',
      repeat: 0
    });

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = CANVAS_WIDTH;
    offscreenCanvas.height = CANVAS_HEIGHT;
    const ctx = offscreenCanvas.getContext('2d')!;

    const delay = Math.round(1000 / GIF_FPS);

    for (let i = 0; i < frames.length; i++) {
      this.renderFrame(ctx, frames[i], bones, color);
      gif.addFrame(ctx, { copy: true, delay });
    }

    gif.on('progress', (p: number) => {
      if (onProgress) onProgress(Math.round(p * 100));
    });

    gif.on('finished', (blob: Blob) => {
      if (onComplete) onComplete(blob);
    });

    gif.on('error', (err: Error) => {
      if (onError) onError(err);
    });

    gif.render();
  }

  private static renderFrame(
    ctx: CanvasRenderingContext2D,
    frame: Frame,
    bones: { from: number; to: number }[],
    color: string
  ): void {
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(42, 42, 78, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const bone of bones) {
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
      ctx.arc(joint.x, joint.y, JOINT_RADIUS + 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
