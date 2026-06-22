import type { CategoryBreakdown, SubItemDetail, MonthlyData } from './types';
import { getSubTypeName } from './carbonCalculator';

export interface PieChartData {
  name: string;
  value: number;
  category: string;
}

export interface BarChartData {
  name: string;
  emission: number;
  description: string;
  activityId: string;
  subType: string;
}

export interface LineChartData {
  month: string;
  total: number;
}

export interface StackedAreaData {
  month: string;
  交通出行: number;
  饮食消费: number;
  能源使用: number;
}

export function transformToPieData(breakdown: CategoryBreakdown[]): PieChartData[] {
  return breakdown.map(item => ({
    name: item.categoryName,
    value: Number(item.total.toFixed(2)),
    category: item.category
  }));
}

export function transformToBarData(subItems: SubItemDetail[]): BarChartData[] {
  const grouped = new Map<string, BarChartData>();

  for (const item of subItems) {
    if (!grouped.has(item.subType)) {
      grouped.set(item.subType, {
        name: getSubTypeName(item.subType),
        emission: 0,
        description: item.description,
        activityId: item.activityId,
        subType: item.subType
      });
    }
    const data = grouped.get(item.subType)!;
    data.emission += item.emission;
  }

  return Array.from(grouped.values())
    .map(d => ({ ...d, emission: Number(d.emission.toFixed(2)) }))
    .sort((a, b) => b.emission - a.emission);
}

export function transformToLineData(monthlyData: MonthlyData[]): LineChartData[] {
  return monthlyData.map(m => ({
    month: m.month,
    total: Number(m.total.toFixed(2))
  }));
}

export function transformToStackedAreaData(monthlyData: MonthlyData[]): StackedAreaData[] {
  return monthlyData.map(m => ({
    month: m.month,
    交通出行: Number(m.transport.toFixed(2)),
    饮食消费: Number(m.diet.toFixed(2)),
    能源使用: Number(m.energy.toFixed(2))
  }));
}

export const PIE_COLORS = ['#2d6a4f', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7'];
export const BAR_COLORS = ['#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc'];
export const STACKED_COLORS = {
  交通出行: '#2d6a4f',
  饮食消费: '#52b788',
  能源使用: '#95d5b2'
};

export async function exportChartAsImage(chartId: string, filename: string): Promise<void> {
  const container = document.getElementById(chartId);
  if (!container) return;

  const svgElement = container.querySelector('svg');
  if (!svgElement) return;

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const rect = svgElement.getBoundingClientRect();
      const scale = 2;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      }
      resolve();
    };
    img.onerror = reject;
    img.src = url;
  });

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
