import { renderMountedCanvas, CANVAS_WIDTH, CANVAS_HEIGHT } from './canvasRenderer';
import type { MountStyle, MountParams, CropArea } from '../types';

export function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}

export function exportSinglePreview(
  originalImg: HTMLImageElement,
  crop: CropArea,
  style: MountStyle,
  params: MountParams,
  filename: string = '书法装裱预览.png'
): void {
  const canvas = document.createElement('canvas');
  renderMountedCanvas(canvas, originalImg, crop, style, params, true);
  downloadCanvasAsPNG(canvas, filename);
}

export function exportCompareView(
  originalImg: HTMLImageElement,
  crop: CropArea,
  styles: MountStyle[],
  params: MountParams,
  filename: string = '书法装裱对比.png'
): void {
  const cols = styles.length;
  const gap = 24;
  const padding = 32;
  const labelH = 48;
  const outW = CANVAS_WIDTH * cols + gap * (cols - 1) + padding * 2;
  const outH = CANVAS_HEIGHT + labelH + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  const tmp = document.createElement('canvas');
  styles.forEach((style, i) => {
    renderMountedCanvas(tmp, originalImg, crop, style, params, true);
    const dx = padding + i * (CANVAS_WIDTH + gap);
    const dy = padding + labelH;
    ctx.drawImage(tmp, dx, dy);

    ctx.save();
    ctx.fillStyle = '#4a3520';
    ctx.font = 'bold 20px "SimKai","KaiTi","STKaiti",serif';
    ctx.textAlign = 'center';
    const labelMap: Record<MountStyle, string> = {
      scroll: '卷轴装裱',
      frame: '镜框装裱',
      fan: '扇面装裱',
    };
    ctx.fillText(labelMap[style], dx + CANVAS_WIDTH / 2, padding + 30);
    ctx.restore();
  });

  downloadCanvasAsPNG(canvas, filename);
}
