import { v4 as uuidv4 } from 'uuid';
import type { ParsedCSVData, ChartConfig, TurningPoint, TrendLine, StoryScene } from '../types';

export const ANIMATION_DURATION = 600;
export const ANIMATION_DELAY_STEP = 150;

function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long'
  });
}

function formatNumber(num: number, decimals: number = 1): string {
  return num.toFixed(decimals);
}

export function generateStoryScenes(
  data: ParsedCSVData,
  config: ChartConfig,
  turningPoints: TurningPoint[],
  trendLines: TrendLine[]
): StoryScene[] {
  const scenes: StoryScene[] = [];
  let delay = 0;
  
  const sortedData = [...data.rows].sort((a, b) => {
    const dateA = a[config.xField] as Date;
    const dateB = b[config.xField] as Date;
    return dateA.getTime() - dateB.getTime();
  });
  
  const validData = sortedData.filter(row => {
    const x = row[config.xField];
    return x !== null && x !== undefined;
  });
  
  if (validData.length === 0) return scenes;
  
  const dateStart = validData[0][config.xField] as Date;
  const dateEnd = validData[validData.length - 1][config.xField] as Date;
  
  const highlightData: Record<string, number> = {};
  
  config.yFields.forEach(field => {
    const values = validData.map(row => row[field] as number).filter(v => v !== null && !isNaN(v));
    if (values.length > 0) {
      highlightData[`${field}_max`] = Math.max(...values);
      highlightData[`${field}_min`] = Math.min(...values);
      highlightData[`${field}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  });
  
  scenes.push({
    id: uuidv4(),
    type: 'opening',
    title: `数据概览：${formatDate(dateStart)} - ${formatDate(dateEnd)}`,
    content: `在这段时间内，我们追踪了 ${config.yFields.join('、')} 的变化趋势。数据涵盖 ${validData.length} 个时间点，完整记录了各项指标的演变过程。`,
    highlightData,
    animationDelay: delay
  });
  
  delay += ANIMATION_DELAY_STEP;
  
  if (turningPoints.length > 0) {
    turningPoints.forEach((point, index) => {
      const fieldConfig = config.fieldColors[point.field];
      const direction = point.slopeChange > 0 ? '上升' : '下降';
      const dateStr = formatDate(point.xValue);
      
      scenes.push({
        id: uuidv4(),
        type: 'turning-point',
        title: `关键拐点 #${index + 1}：${point.field}`,
        content: `${point.description}。在 ${dateStr}，${point.field} 达到 ${formatNumber(point.yValue)}，斜率变化达到 ${formatNumber(point.slopeChange * 100, 0)}%，标志着趋势发生了显著${direction}。`,
        chartAnnotation: point,
        animationDelay: delay
      });
      
      delay += ANIMATION_DELAY_STEP;
    });
  }
  
  if (trendLines.length > 0) {
    const trendDescriptions: string[] = [];
    
    trendLines.forEach(trend => {
      const direction = trend.slope > 0 ? '上升' : '下降';
      const significance = Math.abs(trend.slope) > 0.5 ? '显著' : '温和';
      const monthlyChange = formatNumber(Math.abs(trend.slope));
      
      trendDescriptions.push(
        `${trend.field} 呈现${significance}${direction}趋势，每月平均变化 ${monthlyChange} 单位`
      );
    });
    
    scenes.push({
      id: uuidv4(),
      type: 'trend',
      title: '总体趋势分析',
      content: `从整体数据来看，${trendDescriptions.join('；')}。趋势线采用最小二乘法拟合，清晰展示了各指标在整个时间段内的长期走向。`,
      highlightData: Object.fromEntries(
        trendLines.map(t => [`${t.field}_slope`, t.slope])
      ),
      animationDelay: delay
    });
    
    delay += ANIMATION_DELAY_STEP;
  }
  
  const summaryPoints: string[] = [];
  
  config.yFields.forEach(field => {
    const values = validData.map(row => row[field] as number).filter(v => v !== null && !isNaN(v));
    if (values.length >= 2) {
      const first = values[0];
      const last = values[values.length - 1];
      const change = ((last - first) / Math.abs(first)) * 100;
      const changeStr = change >= 0 ? `上升 ${formatNumber(change, 0)}%` : `下降 ${formatNumber(Math.abs(change), 0)}%`;
      summaryPoints.push(`${field} 从 ${formatNumber(first)} 变为 ${formatNumber(last)}，累计${changeStr}`);
    }
  });
  
  scenes.push({
    id: uuidv4(),
    type: 'summary',
    title: '数据故事总结',
    content: `综上所述，${summaryPoints.join('；')}。这些数据揭示了时间序列背后的内在规律，为进一步的分析和决策提供了有力支撑。`,
    animationDelay: delay
  });
  
  return scenes;
}

export function getTransitionDelay(index: number, baseDelay: number = 0): number {
  return baseDelay + index * ANIMATION_DELAY_STEP;
}
