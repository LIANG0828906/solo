import type { HourlyData, ClickPoint, LineChartOptions, HeatmapOptions } from './types';

interface TooltipData {
  x: number;
  y: number;
  data: {
    label: string;
    value: number;
    color: string;
  }[];
  hourLabel: string;
}

const defaultLineChartOptions: Required<LineChartOptions> = {
  width: 600,
  height: 300,
  padding: { top: 20, right: 20, bottom: 40, left: 60 },
  colors: {
    impressions: '#60A5FA',
    clicks: '#34D399',
    conversions: '#F472B6'
  },
  showDots: true,
  smooth: true
};

const defaultHeatmapOptions: Required<HeatmapOptions> = {
  width: 600,
  height: 350,
  radius: 30,
  gradient: ['#FDE68A', '#F9C74F', '#F8961E', '#F3722C', '#EF4444']
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  return `${hours}:00`;
}

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString();
}

function getYAxisLabels(max: number): number[] {
  if (max <= 0) return [0];
  const step = Math.ceil(max / 5 / 10) * 10;
  const labels: number[] = [];
  for (let i = 0; i <= 5; i++) {
    labels.push(i * step);
  }
  return labels;
}

function smoothBezier(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function getGradientColor(gradient: string[], position: number): string {
  if (position <= 0) return gradient[0];
  if (position >= 1) return gradient[gradient.length - 1];

  const step = 1 / (gradient.length - 1);
  const index = Math.floor(position / step);
  const localPos = (position - index * step) / step;

  const c1 = hexToRgb(gradient[index]);
  const c2 = hexToRgb(gradient[Math.min(index + 1, gradient.length - 1)]);

  const r = Math.round(c1.r + (c2.r - c1.r) * localPos);
  const g = Math.round(c1.g + (c2.g - c1.g) * localPos);
  const b = Math.round(c1.b + (c2.b - c1.b) * localPos);

  return `rgb(${r}, ${g}, ${b})`;
}

export function drawLineChart(
  canvas: HTMLCanvasElement,
  data: HourlyData[],
  options: LineChartOptions = {},
  onHover?: (tooltip: TooltipData | null) => void
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const opts = { ...defaultLineChartOptions, ...options };
  const { width, height, padding, colors, showDots, smooth } = opts;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  if (!data || data.length === 0) {
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', width / 2, height / 2);
    return;
  }

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxImpressions = Math.max(...data.map(d => d.impressions));
  const maxClicks = Math.max(...data.map(d => d.clicks));
  const maxConversions = Math.max(...data.map(d => d.conversions));
  const maxValue = Math.max(maxImpressions, maxClicks, maxConversions);

  const yLabels = getYAxisLabels(maxValue);
  const yMax = yLabels[yLabels.length - 1];

  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;

  yLabels.forEach((label, i) => {
    const y = padding.top + chartHeight - (i / (yLabels.length - 1)) * chartHeight;
    
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatNumber(label), padding.left - 8, y + 4);
  });

  const xStep = chartWidth / (data.length - 1 || 1);
  
  const xLabelInterval = Math.ceil(data.length / 8);
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';

  data.forEach((d, i) => {
    if (i % xLabelInterval === 0 || i === data.length - 1) {
      const x = padding.left + i * xStep;
      ctx.fillText(formatTime(d.timestamp), x, height - padding.bottom + 20);
    }
  });

  const dataPoints = {
    impressions: [] as { x: number; y: number; value: number }[],
    clicks: [] as { x: number; y: number; value: number }[],
    conversions: [] as { x: number; y: number; value: number }[]
  };

  data.forEach((d, i) => {
    const x = padding.left + i * xStep;
    dataPoints.impressions.push({
      x,
      y: padding.top + chartHeight - (d.impressions / (yMax || 1)) * chartHeight,
      value: d.impressions
    });
    dataPoints.clicks.push({
      x,
      y: padding.top + chartHeight - (d.clicks / (yMax || 1)) * chartHeight,
      value: d.clicks
    });
    dataPoints.conversions.push({
      x,
      y: padding.top + chartHeight - (d.conversions / (yMax || 1)) * chartHeight,
      value: d.conversions
    });
  });

  const series = [
    { points: dataPoints.impressions, color: colors.impressions, label: '曝光' },
    { points: dataPoints.clicks, color: colors.clicks, label: '点击' },
    { points: dataPoints.conversions, color: colors.conversions, label: '转化' }
  ];

  series.forEach((s) => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (smooth) {
      const path = new Path2D(smoothBezier(s.points));
      ctx.stroke(path);
    } else {
      ctx.beginPath();
      s.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    if (showDots) {
      s.points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  });

  if (onHover) {
    canvas.onmousemove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (mouseX < padding.left || mouseX > width - padding.right) {
        onHover(null);
        return;
      }

      const dataIndex = Math.round((mouseX - padding.left) / xStep);
      const clampedIndex = Math.max(0, Math.min(data.length - 1, dataIndex));
      const d = data[clampedIndex];
      const p = dataPoints.impressions[clampedIndex];

      if (Math.abs(mouseX - p.x) < xStep / 2) {
        onHover({
          x: p.x,
          y: mouseY,
          hourLabel: formatTime(d.timestamp),
          data: [
            { label: '曝光', value: d.impressions, color: colors.impressions },
            { label: '点击', value: d.clicks, color: colors.clicks },
            { label: '转化', value: d.conversions, color: colors.conversions }
          ]
        });
      } else {
        onHover(null);
      }
    };

    canvas.onmouseleave = () => onHover(null);
  }
}

export function drawHeatmap(
  canvas: HTMLCanvasElement,
  data: ClickPoint[],
  options: HeatmapOptions = {}
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const opts = { ...defaultHeatmapOptions, ...options };
  const { width, height, radius, gradient } = opts;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  if (!data || data.length === 0) {
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无热力图数据', width / 2, height / 2);
    return;
  }

  const maxCount = Math.max(...data.map(d => d.count));

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = width;
  shadowCanvas.height = height;
  const shadowCtx = shadowCanvas.getContext('2d');
  if (!shadowCtx) return;

  shadowCtx.globalCompositeOperation = 'lighter';

  data.forEach((point) => {
    const x = (point.x / 100) * width;
    const y = (point.y / 100) * height;
    const alpha = point.count / (maxCount || 1);
    const pointRadius = radius * (0.5 + alpha * 0.5);

    const gradient2 = shadowCtx.createRadialGradient(x, y, 0, x, y, pointRadius);
    gradient2.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
    gradient2.addColorStop(1, 'rgba(255, 255, 255, 0)');

    shadowCtx.beginPath();
    shadowCtx.fillStyle = gradient2;
    shadowCtx.arc(x, y, pointRadius, 0, Math.PI * 2);
    shadowCtx.fill();
  });

  const imageData = shadowCtx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3] / 255;
    if (alpha > 0) {
      const color = getGradientColor(gradient, alpha);
      const rgb = color.match(/\d+/g);
      if (rgb) {
        pixels[i] = parseInt(rgb[0]);
        pixels[i + 1] = parseInt(rgb[1]);
        pixels[i + 2] = parseInt(rgb[2]);
        pixels[i + 3] = Math.floor(alpha * 200);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const x = (i / 4) * width;
    const y = (i / 4) * height;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);
}

export type { TooltipData };
