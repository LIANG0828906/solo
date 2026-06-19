const PRIMARY_COLOR = '#FF6B35';
const SECONDARY_COLOR = '#F7931E';

export function drawRatingDistribution(
  canvas: HTMLCanvasElement,
  ratings: number[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const distribution = [0, 0, 0, 0, 0];
  ratings.forEach(rating => {
    const index = Math.max(0, Math.min(4, Math.floor(rating) - 1));
    distribution[index]++;
  });

  const maxCount = Math.max(...distribution, 1);
  const barWidth = chartWidth / 5 - 10;

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const value = Math.round((maxCount / 4) * (4 - i));
    const y = padding.top + (chartHeight / 4) * i;
    ctx.fillText(value.toString(), padding.left - 10, y);
  }

  distribution.forEach((count, index) => {
    const barHeight = (count / maxCount) * chartHeight;
    const x = padding.left + index * (chartWidth / 5) + 5;
    const y = padding.top + chartHeight - barHeight;

    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    gradient.addColorStop(0, PRIMARY_COLOR);
    gradient.addColorStop(1, SECONDARY_COLOR);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 4);
    ctx.fill();

    ctx.fillStyle = '#1f2937';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelY = padding.top + chartHeight + 10;
    ctx.fillText(`${index + 1}星`, x + barWidth / 2, labelY);

    if (count > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(count.toString(), x + barWidth / 2, y - 5);
    }
  });

  ctx.fillStyle = '#374151';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('评分分布', width / 2, height - 5);
}

export function drawFavoriteTrend(
  canvas: HTMLCanvasElement,
  data: Array<{ date: string; count: number }>
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 20, right: 20, bottom: 50, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  if (data.length === 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无数据', width / 2, height / 2);
    return;
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= gridLines; i++) {
    const value = Math.round((maxCount / gridLines) * (gridLines - i));
    const y = padding.top + (chartHeight / gridLines) * i;
    ctx.fillText(value.toString(), padding.left - 10, y);
  }

  const points = data.map((d, index) => ({
    x: padding.left + index * xStep,
    y: padding.top + chartHeight - (d.count / maxCount) * chartHeight,
  }));

  ctx.beginPath();
  ctx.moveTo(points[0].x, padding.top + chartHeight);
  points.forEach(point => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
  ctx.closePath();

  const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
  areaGradient.addColorStop(0, PRIMARY_COLOR + '40');
  areaGradient.addColorStop(1, SECONDARY_COLOR + '10');
  ctx.fillStyle = areaGradient;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach(point => {
    ctx.lineTo(point.x, point.y);
  });

  const lineGradient = ctx.createLinearGradient(
    padding.left,
    0,
    width - padding.right,
    0
  );
  lineGradient.addColorStop(0, PRIMARY_COLOR);
  lineGradient.addColorStop(1, SECONDARY_COLOR);
  ctx.strokeStyle = lineGradient;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = PRIMARY_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = SECONDARY_COLOR;
    ctx.fill();

    if (index % Math.max(1, Math.floor(data.length / 6)) === 0 || index === data.length - 1) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const dateLabel = data[index].date.slice(5);
      ctx.fillText(dateLabel, point.x, padding.top + chartHeight + 10);
    }
  });

  ctx.fillStyle = '#374151';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('收藏趋势', width / 2, height - 5);
}
