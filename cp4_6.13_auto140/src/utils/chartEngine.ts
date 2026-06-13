import type { ParsedCSVData, ChartConfig, TurningPoint, TrendLine, LineVisibility } from '../types';

export interface ChartDimensions {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export function calculateDimensions(containerWidth: number): ChartDimensions {
  return {
    width: containerWidth,
    height: 450,
    margin: { top: 40, right: 80, bottom: 60, left: 80 }
  };
}

export function detectTurningPoints(
  data: ParsedCSVData,
  xField: string,
  yField: string,
  threshold: number = 0.3
): TurningPoint[] {
  const values = data.rows
    .map(row => ({ x: row[xField] as Date, y: row[yField] as number }))
    .filter(d => d.x !== null && d.y !== null && !isNaN(d.y));
  
  if (values.length < 5) return [];
  
  const slopes: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const dx = (values[i].x.getTime() - values[i - 1].x.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const dy = values[i].y - values[i - 1].y;
    slopes.push(dx > 0 ? dy / dx : 0);
  }
  
  const turningPoints: TurningPoint[] = [];
  const smoothedSlopes: number[] = [];
  
  for (let i = 0; i < slopes.length; i++) {
    const start = Math.max(0, i - 2);
    const end = Math.min(slopes.length, i + 3);
    const window = slopes.slice(start, end);
    smoothedSlopes.push(window.reduce((a, b) => a + b, 0) / window.length);
  }
  
  for (let i = 1; i < smoothedSlopes.length; i++) {
    const prevSlope = smoothedSlopes[i - 1];
    const currSlope = smoothedSlopes[i];
    
    if (Math.abs(prevSlope) < 0.01) continue;
    
    const change = Math.abs((currSlope - prevSlope) / prevSlope);
    
    if (change >= threshold) {
      const dataIndex = i + 1;
      if (dataIndex < values.length) {
        const direction = currSlope > prevSlope ? '上升' : '下降';
        const dateStr = values[dataIndex].x.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
        
        turningPoints.push({
          index: dataIndex,
          xValue: values[dataIndex].x,
          yValue: values[dataIndex].y,
          field: yField,
          slopeChange: change,
          description: `从${dateStr}开始，${yField}曲线迎来一个明显${direction}拐点`
        });
      }
    }
  }
  
  const uniquePoints: TurningPoint[] = [];
  const seenIndices = new Set<number>();
  
  for (const point of turningPoints) {
    const roundedIndex = Math.round(point.index / 3) * 3;
    if (!seenIndices.has(roundedIndex)) {
      seenIndices.add(roundedIndex);
      uniquePoints.push(point);
    }
  }
  
  return uniquePoints.slice(0, 2);
}

export function calculateTrendLine(
  data: ParsedCSVData,
  xField: string,
  yField: string,
  color: string
): TrendLine | null {
  const values = data.rows
    .map(row => ({ x: row[xField] as Date, y: row[yField] as number }))
    .filter(d => d.x !== null && d.y !== null && !isNaN(d.y));
  
  if (values.length < 2) return null;
  
  const minX = values[0].x.getTime();
  const xs = values.map(v => (v.x.getTime() - minX) / (1000 * 60 * 60 * 24 * 30));
  const ys = values.map(v => v.y);
  
  const n = xs.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { field: yField, slope, intercept, color };
}

function formatDate(date: Date, dataLength: number): string {
  if (dataLength <= 24) {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
  } else if (dataLength <= 60) {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' });
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric' });
  }
}

function getTickIndices(count: number, maxTicks: number = 8): number[] {
  if (count <= maxTicks) {
    return Array.from({ length: count }, (_, i) => i);
  }
  
  const step = Math.ceil(count / maxTicks);
  const indices: number[] = [];
  
  for (let i = 0; i < count; i += step) {
    indices.push(i);
  }
  
  if (indices[indices.length - 1] !== count - 1) {
    indices.push(count - 1);
  }
  
  return indices;
}

export interface DrawChartOptions {
  canvas: HTMLCanvasElement;
  data: ParsedCSVData;
  config: ChartConfig;
  dimensions: ChartDimensions;
  visibility: LineVisibility;
  turningPoints: TurningPoint[];
  trendLines: TrendLine[];
}

export function drawChart(options: DrawChartOptions): void {
  const { canvas, data, config, dimensions, visibility, turningPoints, trendLines } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const { width, height, margin } = dimensions;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);
  
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);
  
  const sortedData = [...data.rows].sort((a, b) => {
    const dateA = a[config.xField] as Date;
    const dateB = b[config.xField] as Date;
    return dateA.getTime() - dateB.getTime();
  });
  
  const validData = sortedData.filter(row => {
    const x = row[config.xField];
    return x !== null && x !== undefined;
  });
  
  if (validData.length === 0 || config.yFields.length === 0) return;
  
  const xValues = validData.map(row => row[config.xField] as Date);
  const minX = xValues[0].getTime();
  const maxX = xValues[xValues.length - 1].getTime();
  const xScale = (d: Date) => margin.left + ((d.getTime() - minX) / (maxX - minX || 1)) * chartWidth;
  
  const yFieldsLeft = config.yFields.slice(0, 1);
  const yFieldsRight = config.yFields.slice(1, 3);
  
  let yMinLeft = Infinity, yMaxLeft = -Infinity;
  let yMinRight = Infinity, yMaxRight = -Infinity;
  
  validData.forEach(row => {
    yFieldsLeft.forEach(field => {
      const val = row[field] as number;
      if (val !== null && !isNaN(val)) {
        yMinLeft = Math.min(yMinLeft, val);
        yMaxLeft = Math.max(yMaxLeft, val);
      }
    });
    yFieldsRight.forEach(field => {
      const val = row[field] as number;
      if (val !== null && !isNaN(val)) {
        yMinRight = Math.min(yMinRight, val);
        yMaxRight = Math.max(yMaxRight, val);
      }
    });
  });
  
  if (yMinLeft === Infinity) yMinLeft = 0;
  if (yMaxLeft === -Infinity) yMaxLeft = 100;
  if (yMinRight === Infinity) yMinRight = 0;
  if (yMaxRight === -Infinity) yMaxRight = 100;
  
  const yPaddingLeft = (yMaxLeft - yMinLeft) * 0.1 || 10;
  const yPaddingRight = (yMaxRight - yMinRight) * 0.1 || 10;
  
  yMinLeft -= yPaddingLeft;
  yMaxLeft += yPaddingLeft;
  yMinRight -= yPaddingRight;
  yMaxRight += yPaddingRight;
  
  const yScaleLeft = (v: number) => margin.top + chartHeight - ((v - yMinLeft) / (yMaxLeft - yMinLeft || 1)) * chartHeight;
  const yScaleRight = (v: number) => margin.top + chartHeight - ((v - yMinRight) / (yMaxRight - yMinRight || 1)) * chartHeight;
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  
  const yTickCount = 5;
  for (let i = 0; i <= yTickCount; i++) {
    const y = margin.top + (chartHeight / yTickCount) * i;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
    ctx.stroke();
    
    const leftVal = yMaxLeft - ((yMaxLeft - yMinLeft) / yTickCount) * i;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(leftVal.toFixed(1), margin.left - 10, y + 4);
    
    if (yFieldsRight.length > 0) {
      const rightVal = yMaxRight - ((yMaxRight - yMinRight) / yTickCount) * i;
      ctx.textAlign = 'left';
      ctx.fillText(rightVal.toFixed(1), width - margin.right + 10, y + 4);
    }
  }
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();
  
  const tickIndices = getTickIndices(xValues.length, 8);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  
  tickIndices.forEach(idx => {
    const x = xScale(xValues[idx]);
    const label = formatDate(xValues[idx], xValues.length);
    ctx.fillText(label, x, height - margin.bottom + 20);
  });
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  if (yFieldsLeft.length > 0) {
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yFieldsLeft[0], 0, 0);
    ctx.restore();
  }
  
  if (yFieldsRight.length > 0) {
    ctx.save();
    ctx.translate(width - 20, height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(yFieldsRight.join(' / '), 0, 0);
    ctx.restore();
  }
  
  config.yFields.forEach((field, fieldIndex) => {
    const isVisible = visibility[field] !== false;
    const color = config.fieldColors[field];
    const useRightAxis = fieldIndex > 0;
    const yScale = useRightAxis ? yScaleRight : yScaleLeft;
    const lineWidth = fieldIndex === 0 ? 3 : 2;
    
    if (!isVisible) {
      ctx.globalAlpha = 0.3;
    }
    
    const points: { x: number; y: number }[] = [];
    validData.forEach(row => {
      const x = row[config.xField] as Date;
      const y = row[field] as number;
      if (x !== null && y !== null && !isNaN(y)) {
        points.push({ x: xScale(x), y: yScale(y) });
      }
    });
    
    if (points.length < 2) return;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    const lastPoint = points[points.length - 1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  });
  
  trendLines.forEach(trend => {
    const isVisible = visibility[trend.field] !== false;
    if (!isVisible) return;
    
    const fieldIndex = config.yFields.indexOf(trend.field);
    const useRightAxis = fieldIndex > 0;
    const yScale = useRightAxis ? yScaleRight : yScaleLeft;
    
    const xStart = xScale(xValues[0]);
    const xEnd = xScale(xValues[xValues.length - 1]);
    
    const x0 = 0;
    const xN = (xValues[xValues.length - 1].getTime() - minX) / (1000 * 60 * 60 * 24 * 30);
    
    const yStart = yScale(trend.slope * x0 + trend.intercept);
    const yEnd = yScale(trend.slope * xN + trend.intercept);
    
    ctx.strokeStyle = trend.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  });
  
  turningPoints.forEach(point => {
    const fieldIndex = config.yFields.indexOf(point.field);
    if (fieldIndex === -1) return;
    
    const useRightAxis = fieldIndex > 0;
    const yScale = useRightAxis ? yScaleRight : yScaleLeft;
    const color = config.fieldColors[point.field];
    
    const x = xScale(point.xValue);
    const y = yScale(point.yValue);
    
    ctx.fillStyle = '#FF3333';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = '#FF3333';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  
  const legendX = width - margin.right - 10;
  const legendY = margin.top + 10;
  
  config.yFields.forEach((field, i) => {
    const isVisible = visibility[field] !== false;
    const color = config.fieldColors[field];
    const y = legendY + i * 28;
    
    ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
    ctx.fillRect(legendX - 120, y - 5, 120, 22);
    
    ctx.fillStyle = isVisible ? color : `${color}4D`;
    ctx.fillRect(legendX - 110, y, 24, 12);
    
    ctx.fillStyle = isVisible ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(field, legendX - 80, y + 10);
  });
}

export function handleLegendClick(
  e: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  config: ChartConfig,
  dimensions: ChartDimensions,
  visibility: LineVisibility,
  onToggle: (field: string) => void
): void {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const { margin } = dimensions;
  const legendX = dimensions.width - margin.right - 10;
  const legendY = margin.top + 10;
  
  config.yFields.forEach((field, i) => {
    const itemY = legendY + i * 28;
    if (x >= legendX - 120 && x <= legendX && y >= itemY - 5 && y <= itemY + 17) {
      onToggle(field);
    }
  });
}
