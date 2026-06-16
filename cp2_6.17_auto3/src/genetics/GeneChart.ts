import type { Genotype, PopulationStats } from '../evolution/EvolutionEngine';
import { GENE_LABELS, GENE_NAMES } from '../evolution/EvolutionEngine';

const COLOR_BLUE = '#3498DB';
const COLOR_RED = '#E74C3C';
const COLOR_GREEN = '#2ECC71';
const COLOR_PURPLE = '#7C4DFF';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function interpolateColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function gaussianKernel(x: number, bandwidth: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * (x / bandwidth) ** 2);
}

function kernelDensityEstimate(
  data: number[],
  points: number[],
  bandwidth: number
): number[] {
  return points.map((p) => {
    let sum = 0;
    for (const d of data) {
      sum += gaussianKernel(p - d, bandwidth);
    }
    return sum / (data.length * bandwidth);
  });
}

export function drawBarChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  stats: PopulationStats
): void {
  const padding = { top: 20, right: 10, bottom: 50, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const geneCount = GENE_NAMES.length;
  const barWidth = chartWidth / geneCount * 0.7;
  const barGap = chartWidth / geneCount * 0.3;

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * (4 - i);
    const value = (i / 4).toFixed(2);
    ctx.fillText(value, padding.left - 5, y + 3);
  }

  for (let i = 0; i < geneCount; i++) {
    const x = padding.left + i * (barWidth + barGap) + barGap / 2;
    const value = stats.mean[i];
    const barHeight = value * chartHeight;
    const y = padding.top + chartHeight - barHeight;

    const color = interpolateColor(COLOR_BLUE, COLOR_RED, value);

    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, interpolateColor(COLOR_BLUE, COLOR_RED, value * 0.7));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(GENE_LABELS[i], x + barWidth / 2, height - 30);
    ctx.fillText(value.toFixed(2), x + barWidth / 2, y - 5);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('基因平均值分布', width / 2, 14);
}

export function drawViolinChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  population: Genotype[]
): void {
  const padding = { top: 20, right: 10, bottom: 50, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const geneCount = GENE_NAMES.length;
  const slotWidth = chartWidth / geneCount;

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * (4 - i);
    const value = (i / 4).toFixed(2);
    ctx.fillText(value, padding.left - 5, y + 3);
  }

  const bandwidth = 0.1;
  const kernelPoints = 100;
  const samplePoints: number[] = [];
  for (let i = 0; i <= kernelPoints; i++) {
    samplePoints.push(i / kernelPoints);
  }

  for (let i = 0; i < geneCount; i++) {
    const geneName = GENE_NAMES[i];
    const data = population.map((ind) => ind[geneName]);
    const density = kernelDensityEstimate(data, samplePoints, bandwidth);
    const maxDensity = Math.max(...density);

    const centerX = padding.left + i * slotWidth + slotWidth / 2;
    const maxWidth = slotWidth * 0.8;

    ctx.fillStyle = COLOR_GREEN + '80';
    ctx.strokeStyle = COLOR_GREEN;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for (let j = 0; j <= kernelPoints; j++) {
      const y = padding.top + chartHeight - (j / kernelPoints) * chartHeight;
      const d = density[j];
      const halfWidth = maxDensity > 0 ? (d / maxDensity) * (maxWidth / 2) : 0;

      if (j === 0) {
        ctx.moveTo(centerX - halfWidth, y);
      } else {
        ctx.lineTo(centerX - halfWidth, y);
      }
    }

    for (let j = kernelPoints; j >= 0; j--) {
      const y = padding.top + chartHeight - (j / kernelPoints) * chartHeight;
      const d = density[j];
      const halfWidth = maxDensity > 0 ? (d / maxDensity) * (maxWidth / 2) : 0;
      ctx.lineTo(centerX + halfWidth, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(GENE_LABELS[i], centerX, height - 30);
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('基因分布密度', width / 2, 14);
}

export function drawRadarChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  individual: Genotype | undefined
): void {
  const centerX = width / 2;
  const centerY = height / 2 - 10;
  const radius = Math.min(width, height) / 2 - 40;
  const geneCount = GENE_NAMES.length;

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let level = 1; level <= 4; level++) {
    const r = (radius / 4) * level;
    ctx.beginPath();
    for (let i = 0; i <= geneCount; i++) {
      const angle = (i / geneCount) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i < geneCount; i++) {
    const angle = (i / geneCount) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();

    const labelRadius = radius + 20;
    const labelX = centerX + Math.cos(angle) * labelRadius;
    const labelY = centerY + Math.sin(angle) * labelRadius;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(GENE_LABELS[i], labelX, labelY);
  }

  if (individual) {
    ctx.fillStyle = COLOR_PURPLE + '40';
    ctx.strokeStyle = COLOR_PURPLE;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i <= geneCount; i++) {
      const idx = i % geneCount;
      const geneName = GENE_NAMES[idx];
      const value = individual[geneName];
      const angle = (idx / geneCount) * Math.PI * 2 - Math.PI / 2;
      const r = value * radius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < geneCount; i++) {
      const geneName = GENE_NAMES[i];
      const value = individual[geneName];
      const angle = (i / geneCount) * Math.PI * 2 - Math.PI / 2;
      const r = value * radius;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      ctx.fillStyle = COLOR_PURPLE;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(
    individual ? `个体 #${individual.id.slice(0, 8)} 基因图谱` : '点击个体查看基因详情',
    width / 2,
    16
  );

  if (!individual) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('8维基因雷达图', width / 2, height / 2);
  }
}

export function drawEvolutionTree(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  history: { generation: number; stats: PopulationStats }[]
): void {
  const padding = { top: 30, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const x = padding.left + (chartWidth / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '10px Inter, sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const x = padding.left + (chartWidth / 5) * i;
    const gen = Math.round((i / 5) * (history.length - 1)) + 1;
    ctx.fillText(`G${gen}`, x, height - 10);
  }

  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * (4 - i);
    const value = (i / 4).toFixed(2);
    ctx.fillText(value, padding.left - 5, y + 3);
  }

  const geneColors = [COLOR_BLUE, COLOR_RED, COLOR_GREEN, COLOR_PURPLE, '#FF9800', '#E91E63', '#00BCD4', '#8BC34A'];

  for (let geneIdx = 0; geneIdx < GENE_NAMES.length; geneIdx++) {
    ctx.strokeStyle = geneColors[geneIdx] + 'CC';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < history.length; i++) {
      const snapshot = history[i];
      const value = snapshot.stats.mean[geneIdx];
      const x = padding.left + (i / (history.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - value * chartHeight;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    for (let i = 0; i < history.length; i++) {
      const snapshot = history[i];
      const value = snapshot.stats.mean[geneIdx];
      const x = padding.left + (i / (history.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - value * chartHeight;

      ctx.fillStyle = geneColors[geneIdx];
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('进化趋势图 (各基因均值)', width / 2, 16);
}
