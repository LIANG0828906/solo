export function drawProgressRing(canvas: HTMLCanvasElement, progress: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = canvas.width;
  const center = size / 2;
  const radius = Math.max(1, center - 6);
  const lineWidth = 4;

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * progress) / 100;

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#e74c3c');
  gradient.addColorStop(1, '#2ecc71');

  ctx.beginPath();
  ctx.arc(center, center, radius, startAngle, endAngle);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.max(10, size * 0.22)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${progress}%`, center, center);
}
