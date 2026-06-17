export function exportAsPNG(
  canvas: HTMLCanvasElement,
  filename: string = '灵感图谱.png',
): void {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0D0D1A');
  gradient.addColorStop(1, '#1A1A3A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(canvas, 0, 0);

  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.font = 'bold 48px Inter, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('灵感图谱', 20, canvas.height - 20);
  ctx.restore();

  const dataURL = exportCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
