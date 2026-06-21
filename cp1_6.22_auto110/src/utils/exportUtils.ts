import { saveAs } from 'file-saver';

export function downloadPNG(dataUrl: string, filename: string): void {
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeString });
  saveAs(blob, filename);
}

export function downloadSVG(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, filename);
}

export function addWatermarkToCanvas(
  canvas: HTMLCanvasElement,
  text: string
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const fontSize = 18;
  const padding = 20;
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
  ctx.textBaseline = 'bottom';
  ctx.textAlign = 'right';

  const textWidth = ctx.measureText(text).width;
  const bgX = canvas.width - padding - textWidth - 12;
  const bgY = canvas.height - padding - fontSize - 8;
  ctx.fillStyle = 'rgba(30, 30, 46, 0.7)';
  ctx.beginPath();
  ctx.roundRect(bgX, bgY, textWidth + 24, fontSize + 16, 6);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
  ctx.fillText(text, canvas.width - padding - 12, canvas.height - padding - 8);

  return canvas;
}

export function formatTimestamp(date: Date, hours: number, minutes: number): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = hours.toString().padStart(2, '0');
  const min = minutes.toString().padStart(2, '0');
  return `${y}年${m}月${d}日 ${h}:${min}`;
}
