import { VoteOptionResult } from './types';

const EASING = 'cubic-bezier(0.25, 0.8, 0.25, 1)';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

interface BarChartData {
  label: string;
  value: number;
  color: string;
}

export function drawBarChart(
  canvas: HTMLCanvasElement,
  data: VoteOptionResult[],
  animationProgress: number,
  prevData?: VoteOptionResult[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  
  ctx.clearRect(0, 0, width, height);

  const barWidth = 60;
  const maxBarHeight = 200;
  const chartBottom = height - 60;
  const chartTop = chartBottom - maxBarHeight;
  const gap = (width - data.length * barWidth) / (data.length + 1);

  const maxValue = Math.max(...data.map(d => d.votes), 1);

  data.forEach((item, index) => {
    const prevValue = prevData?.[index]?.votes || 0;
    const targetValue = item.votes;
    const currentValue = prevValue + (targetValue - prevValue) * easeOutCubic(animationProgress);
    
    const barHeight = (currentValue / maxValue) * maxBarHeight;
    const x = gap + index * (barWidth + gap);
    const y = chartBottom - barHeight * easeOutElastic(Math.min(animationProgress * 1.5, 1));

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [6, 6, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#5D4E37';
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.text, x + barWidth / 2, chartBottom + 25);

    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.fillText(String(Math.round(currentValue)), x + barWidth / 2, y - 8);
  });

  ctx.strokeStyle = '#D7CCC8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(gap / 2, chartBottom);
  ctx.lineTo(width - gap / 2, chartBottom);
  ctx.stroke();
}

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

export function drawDonutChart(
  canvas: HTMLCanvasElement,
  data: VoteOptionResult[],
  animationProgress: number,
  prevData?: VoteOptionResult[]
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = 90;
  const innerRadius = 55;

  ctx.clearRect(0, 0, width, height);

  const total = data.reduce((sum, d) => sum + d.votes, 0);
  
  if (total === 0) {
    ctx.fillStyle = '#E0E0E0';
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
    ctx.fill();
    return;
  }

  let startAngle = -Math.PI / 2;
  const easedProgress = easeOutCubic(animationProgress);

  data.forEach((item, index) => {
    const prevValue = prevData?.[index]?.votes || 0;
    const currentValue = prevValue + (item.votes - prevValue) * easedProgress;
    const sliceAngle = (currentValue / total) * Math.PI * 2;

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle * easedProgress);
    ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle * easedProgress, startAngle, true);
    ctx.closePath();
    ctx.fill();

    const midAngle = startAngle + sliceAngle / 2;
    const labelRadius = outerRadius + 25;
    const labelX = centerX + Math.cos(midAngle) * labelRadius;
    const labelY = centerY + Math.sin(midAngle) * labelRadius;

    ctx.fillStyle = '#5D4E37';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${item.text} ${item.percentage}%`, labelX, labelY);

    startAngle += sliceAngle;
  });

  ctx.fillStyle = '#5D4E37';
  ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(total), centerX, centerY - 10);

  ctx.fillStyle = '#8D6E63';
  ctx.font = '12px "Microsoft YaHei", sans-serif';
  ctx.fillText('总票数', centerX, centerY + 15);
}

export { EASING };
