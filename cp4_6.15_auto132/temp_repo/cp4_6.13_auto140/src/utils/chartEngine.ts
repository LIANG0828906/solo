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
    margin: { top: 50, right: 90, bottom: 70, left: 90 }
  };
}

function smoothData(values: { x: number; y: number }[], windowSize: number = 5): { x: number; y: number }[] {
  if (values.length < windowSize) return values;
  
  const smoothed: { x: number; y: number }[] = [];
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(values.length, i + halfWindow + 1);
    const window = values.slice(start, end);
    const avgY = window.reduce((sum, v) => sum + v.y, 0) / window.length;
    smoothed.push({ x: values[i].x, y: avgY });
  }
  
  return smoothed;
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
  
  if (values.length < 10) return [];
  
  const sortedValues = values.sort((a, b) => a.x.getTime() - b.x.getTime());
  
  const numericValues = sortedValues.map(v => ({
    x: v.x.getTime() / (1000 * 60 * 60 * 24 * 30),
    y: v.y
  }));
  
  const smoothed = smoothData(numericValues, 7);
  
  const slopes: number[] = [];
  const slopeWindow = 3;
  
  for (let i = slopeWindow; i < smoothed.length - slopeWindow; i++) {
    const startIdx = i - slopeWindow;
    const endIdx = i + slopeWindow;
    const startPoint = smoothed[startIdx];
    const endPoint = smoothed[endIdx];
    
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    
    slopes.push(dx > 0 ? dy / dx : 0);
  }
  
  const turningPoints: TurningPoint[] = [];
  const minGap = Math.max(6, Math.floor(smoothed.length / 8));
  
  for (let i = 1; i < slopes.length - 1; i++) {
    const prevSlope = slopes[i - 1];
    const currSlope = slopes[i];
    
    const avgAbsSlope = (Math.abs(prevSlope) + Math.abs(currSlope)) / 2;
    if (avgAbsSlope < 0.01) continue;
    
    const slopeDiff = Math.abs(currSlope - prevSlope);
    const slopeChangeRatio = slopeDiff / avgAbsSlope;
    
    if (slopeChangeRatio >= threshold) {
      const dataIndex = i + slopeWindow;
      if (dataIndex >= 0 && dataIndex < sortedValues.length) {
        const direction = currSlope > prevSlope ? '上升' : '下降';
        const dateStr = sortedValues[dataIndex].x.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
        
        turningPoints.push({
          index: dataIndex,
          xValue: sortedValues[dataIndex].x,
          yValue: sortedValues[dataIndex].y,
          field: yField,
          slopeChange: slopeChangeRatio,
          description: `从${dateStr}开始，${yField}曲线迎来一个明显${direction}拐点`
        });
      }
    }
  }
  
  const filteredPoints: TurningPoint[] = [];
  let lastIndex = -minGap;
  
  for (const point of turningPoints) {
    if (point.index - lastIndex >= minGap) {
      filteredPoints.push(point);
      lastIndex = point.index;
    }
  }
  
  return filteredPoints.slice(0, 2);
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
  
  const sortedValues = values.sort((a, b) => a.x.getTime() - b.x.getTime());
  const minX = sortedValues[0].x.getTime();
  const xs = sortedValues.map(v => (v.x.getTime() - minX) / (1000 * 60 * 60 * 24 * 30));
  const ys = sortedValues.map(v => v.y);
  
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
    return date.toLocaleDateString('zh-CN', { year: '2-digit', month: '2-digit' });
  } else {
    return date.toLocaleDateString('zh-CN', { year: 'numeric' });
  }
}

function getTickIndices(count: number, maxTicks: number = 8): number[] {
  if (count <= maxTicks) {
    return Array.from({ length: count }, (_, i) => i);
  }
  
  const step = Math.floor(count / (maxTicks - 1));
  const indices: number[] = [];
  
  for (let i = 0; i < count - 1; i += step) {
    indices.push(i);
  }
  
  if (indices[indices.length - 1] !== count - 1) {
    indices.push(count - 1);
  }
  
  return indices;
}

function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction: number;
  
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }
  
  return niceFraction * Math.pow(10, exponent);
}

interface NiceScale {
  min: number;
  max: number;
  tickSpacing: number;
}

function getNiceScale(min: number, max: number, maxTicks: number = 5): NiceScale {
  const range = niceNumber(max - min, false);
  const tickSpacing = niceNumber(range / (maxTicks - 1), true);
  const niceMin = Math.floor(min / tickSpacing) * tickSpacing;
  const niceMax = Math.ceil(max / tickSpacing) * tickSpacing;
  
  return { min: niceMin, max: niceMax, tickSpacing };
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
  
  if (yMinLeft === Infinity) { yMinLeft = 0; yMaxLeft = 100; }
  if (yMinRight === Infinity) { yMinRight = 0; yMaxRight = 100; }
  
  const leftScale = getNiceScale(yMinLeft, yMaxLeft, 5);
  const rightScale = getNiceScale(yMinRight, yMaxRight, 5);
  
  const yScaleLeft = (v: number) => margin.top + chartHeight - ((v - leftScale.min) / (leftScale.max - leftScale.min || 1)) * chartHeight;
  const yScaleRight = (v: number) => margin.top + chartHeight - ((v - rightScale.min) / (rightScale.max - rightScale.min || 1)) * chartHeight;
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  
  const yTickCount = 5;
  for (let i = 0; i <= yTickCount; i++) {
    const y = margin.top + (chartHeight / yTickCount) * i;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
    ctx.stroke();
  }
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  
  for (let i = 0; i <= yTickCount; i++) {
    const t = i / yTickCount;
    const y = margin.top + chartHeight * t;
    const val = leftScale.max - (leftScale.max - leftScale.min) * t;
    ctx.fillText(val.toFixed(0), margin.left - 12, y);
  }
  
  ctx.textAlign = 'left';
  if (yFieldsRight.length > 0) {
    for (let i = 0; i <= yTickCount; i++) {
      const t = i / yTickCount;
      const y = margin.top + chartHeight * t;
      const val = rightScale.max - (rightScale.max - rightScale.min) * t;
      ctx.fillText(val.toFixed(0), width - margin.right + 12, y);
    }
  }
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(width - margin.right, margin.top);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();
  
  const tickIndices = getTickIndices(xValues.length, 8);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  tickIndices.forEach(idx => {
    const x = xScale(xValues[idx]);
    const label = formatDate(xValues[idx], xValues.length);
    ctx.fillText(label, x, height - margin.bottom + 12);
  });
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  
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
    
    const alpha = isVisible ? 1 : 0.3;
    
    const points: { x: number; y: number }[] = [];
    validData.forEach(row => {
      const x = row[config.xField] as Date;
      const y = row[field] as number;
      if (x !== null && y !== null && !isNaN(y)) {
        points.push({ x: xScale(x), y: yScale(y) });
      }
    });
    
    if (points.length < 2) return;
    
    ctx.globalAlpha = alpha;
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
    
    const isVisible = visibility[point.field] !== false;
    if (!isVisible) return;
    
    const useRightAxis = fieldIndex > 0;
    const yScale = useRightAxis ? yScaleRight : yScaleLeft;
    const color = config.fieldColors[point.field];
    
    const x = xScale(point.xValue);
    const y = yScale(point.yValue);
    
    ctx.fillStyle = '#FF3333';
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = '#FF3333';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  
  const legendX = width - margin.right - 15;
  const legendY = margin.top - 10;
  const legendItemHeight = 26;
  const legendPaddingX = 12;
  const legendPaddingY = 8;
  
  const legendWidth = 130;
  const legendHeight = config.yFields.length * legendItemHeight + legendPaddingY * 2;
  
  ctx.fillStyle = 'rgba(20, 20, 40, 0.92)';
  ctx.beginPath();
  ctx.roundRect(legendX - legendWidth, legendY - legendPaddingY, legendWidth, legendHeight, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  config.yFields.forEach((field, i) => {
    const isVisible = visibility[field] !== false;
    const color = config.fieldColors[field];
    const y = legendY + i * legendItemHeight + legendPaddingY;
    
    ctx.fillStyle = isVisible ? color : `${color}4D`;
    ctx.fillRect(legendX - legendWidth + 12, y + 4, 22, 10);
    
    ctx.fillStyle = isVisible ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(field, legendX - legendWidth + 42, y + 9);
  });
}

export interface LegendArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getLegendArea(
  config: ChartConfig,
  dimensions: ChartDimensions
): { x: number; y: number; width: number; height: number; items: { field: string; y: number; height: number }[] } {
  const { margin } = dimensions;
  const legendX = dimensions.width - margin.right - 15;
  const legendY = margin.top - 10;
  const legendItemHeight = 26;
  const legendPaddingY = 8;
  
  const legendWidth = 130;
  const legendHeight = config.yFields.length * legendItemHeight + legendPaddingY * 2;
  
  const items = config.yFields.map((field, i) => ({
    field,
    y: legendY + i * legendItemHeight + legendPaddingY,
    height: legendItemHeight
  }));
  
  return {
    x: legendX - legendWidth,
    y: legendY - legendPaddingY,
    width: legendWidth,
    height: legendHeight,
    items
  };
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
  
  const legendArea = getLegendArea(config, dimensions);
  
  if (x >= legendArea.x && x <= legendArea.x + legendArea.width &&
      y >= legendArea.y && y <= legendArea.y + legendArea.height) {
    legendArea.items.forEach(item => {
      if (y >= item.y && y <= item.y + item.height) {
        onToggle(item.field);
      }
    });
  }
}
