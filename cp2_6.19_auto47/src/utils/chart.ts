export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartOptions {
  width: number;
  height: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  lineColor?: string;
  fillColorStart?: string;
  fillColorEnd?: string;
  axisColor?: string;
  gridColor?: string;
}

export function drawLineChart(
  ctx: CanvasRenderingContext2D,
  data: ChartDataPoint[],
  options: ChartOptions
): void {
  const {
    width,
    height,
    paddingTop = 20,
    paddingRight = 20,
    paddingBottom = 30,
    paddingLeft = 40,
    lineColor = '#4a90d9',
    fillColorStart = 'rgba(74, 144, 217, 0.3)',
    fillColorEnd = 'rgba(74, 144, 217, 0.0)',
    axisColor = '#555',
    gridColor = '#e0e0e0',
  } = options;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  ctx.clearRect(0, 0, width, height);

  if (data.length === 0) {
    ctx.fillStyle = '#999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', width / 2, height / 2);
    return;
  }

  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 100);
  const minValue = Math.min(...values, 0);
  const valueRange = maxValue - minValue || 1;

  const yTicks = 5;
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.fillStyle = axisColor;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= yTicks; i++) {
    const y = paddingTop + (chartHeight / yTicks) * i;
    const value = maxValue - (valueRange / yTicks) * i;
    
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(paddingLeft + chartWidth, y);
    ctx.stroke();

    ctx.fillText(Math.round(value).toString(), paddingLeft - 6, y);
  }

  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, paddingTop + chartHeight);
  ctx.lineTo(paddingLeft + chartWidth, paddingTop + chartHeight);
  ctx.stroke();

  const points: { x: number; y: number }[] = data.map((d, i) => {
    const x = paddingLeft + chartWidth * (i / (data.length - 1 || 1));
    const y = paddingTop + chartHeight * (1 - (d.value - minValue) / valueRange);
    return { x, y };
  });

  if (points.length >= 2) {
    const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + chartHeight);
    gradient.addColorStop(0, fillColorStart);
    gradient.addColorStop(1, fillColorEnd);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, paddingTop + chartHeight);
    
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(points[points.length - 1].x, paddingTop + chartHeight);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  }

  ctx.fillStyle = lineColor;
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = axisColor;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const labelStep = Math.max(1, Math.floor(data.length / 6));
  data.forEach((d, i) => {
    if (i % labelStep === 0 || i === data.length - 1) {
      const x = paddingLeft + chartWidth * (i / (data.length - 1 || 1));
      ctx.fillText(d.label, x, paddingTop + chartHeight + 6);
    }
  });
}
