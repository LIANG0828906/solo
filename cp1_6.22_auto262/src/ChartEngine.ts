import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyGraph, SankeyNode, SankeyLink } from 'd3-sankey';
import { eventBus, EVENTS } from './eventBus';
import type { Material, DataPoint } from './MaterialManager';

export type ChartType = 'bubble' | 'sankey' | 'radar';

export const THEME_PALETTES = {
  warmOrange: { primary: '#F59E0B', gradient: ['#FEF3C7', '#F59E0B', '#D97706'], name: '暖阳橙' },
  forestGreen: { primary: '#5CB85C', gradient: ['#D1FAE5', '#5CB85C', '#16A34A'], name: '森林绿' },
  deepBlue: { primary: '#4A90D9', gradient: ['#DBEAFE', '#4A90D9', '#2563EB'], name: '深海蓝' },
  roseRed: { primary: '#E74C3C', gradient: ['#FEE2E2', '#E74C3C', '#DC2626'], name: '玫瑰红' },
  lightPurple: { primary: '#9B59B6', gradient: ['#F3E8FF', '#9B59B6', '#7C3AED'], name: '淡紫' },
  graphiteGray: { primary: '#636E72', gradient: ['#F1F5F9', '#636E72', '#334155'], name: '石墨灰' }
};

export type ThemeKey = keyof typeof THEME_PALETTES;

export interface ChartConfig {
  chartType: ChartType;
  theme: ThemeKey;
  title: string;
  titleFontSize: number;
  labelFontSize: number;
  width: number;
  height: number;
}

export interface RenderChartPayload {
  chartId: string;
  material: Material;
  config: ChartConfig;
}

export interface RenderedChart {
  chartId: string;
  svgString: string;
  container: HTMLElement;
  config: ChartConfig;
}

export class ChartEngine {
  private renderedCharts: Map<string, RenderedChart> = new Map();

  constructor() {
    eventBus.on(EVENTS.RENDER_CHART, this.handleRenderChart.bind(this));
  }

  private handleRenderChart(payload: RenderChartPayload) {
    const start = performance.now();
    const result = this.render(payload);
    const elapsed = performance.now() - start;

    if (elapsed > 200) {
      console.warn(`[ChartEngine] 图表渲染耗时 ${elapsed.toFixed(1)}ms，超过200ms阈值`);
    }

    return result;
  }

  render(payload: RenderChartPayload): RenderedChart {
    const { chartId, material, config } = payload;
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.style.width = `${config.width}px`;
    container.style.height = `${config.height}px`;

    let svgElement: SVGSVGElement;

    switch (config.chartType) {
      case 'bubble':
        svgElement = this.renderBubbleChart(material.data, config);
        break;
      case 'sankey':
        svgElement = this.renderSankeyChart(material.data, config);
        break;
      case 'radar':
        svgElement = this.renderRadarChart(material.data, config);
        break;
      default:
        svgElement = this.renderBubbleChart(material.data, config);
    }

    const titleEl = this.createTitle(config);
    container.appendChild(titleEl);
    container.appendChild(svgElement);
    container.appendChild(this.createLegend(material.data, config));

    const svgString = container.innerHTML;

    const rendered: RenderedChart = {
      chartId,
      svgString,
      container,
      config
    };

    this.renderedCharts.set(chartId, rendered);
    eventBus.emit(EVENTS.CHART_RENDERED, rendered);

    return rendered;
  }

  private createTitle(config: ChartConfig): HTMLElement {
    const title = document.createElement('div');
    title.className = 'chart-title';
    title.textContent = config.title;
    title.style.fontSize = `${config.titleFontSize}px`;
    title.style.fontWeight = '700';
    title.style.textAlign = 'center';
    title.style.padding = '12px 8px';
    title.style.color = '#1F2937';
    title.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    return title;
  }

  private createGradient(defs: d3.Selection<SVGDefsElement, unknown, null, undefined>, id: string, colors: string[]) {
    const gradient = defs.append('linearGradient').attr('id', id).attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');

    colors.forEach((color, i) => {
      gradient.append('stop').attr('offset', `${(i / (colors.length - 1)) * 100}%`).attr('stop-color', color);
    });

    return `url(#${id})`;
  }

  private renderBubbleChart(data: DataPoint[], config: ChartConfig): SVGSVGElement {
    const theme = THEME_PALETTES[config.theme];
    const width = config.width;
    const height = config.height - 80;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.create('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`).style('overflow', 'visible');

    const defs = svg.append('defs');
    const bubbleGradientId = `bubble-grad-${config.theme}-${Date.now()}`;
    this.createGradient(defs, bubbleGradientId, theme.gradient);

    const hasXY = data.some((d) => d.x !== undefined && d.y !== undefined);
    const xValues = data.map((d) => d.x ?? data.indexOf(d));
    const yValues = data.map((d) => d.y ?? d.value);

    const xScale = d3.scaleLinear().domain([d3.min(xValues)! - 1, d3.max(xValues)! + 1]).range([0, innerW]);

    const yScale = d3.scaleLinear().domain([0, d3.max(yValues)! * 1.1]).range([innerH, 0]);

    const valueExtent = d3.extent(data, (d) => d.value) as [number, number];
    const rScale = d3.scaleSqrt().domain(valueExtent).range([8, 36]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(xScale).ticks(5)).selectAll('text').style('font-size', `${config.labelFontSize}px`).style('fill', '#6B7280');

    g.append('g').call(d3.axisLeft(yScale).ticks(5)).selectAll('text').style('font-size', `${config.labelFontSize}px`).style('fill', '#6B7280');

    g.selectAll('.grid-x').data(yScale.ticks(5)).enter().append('line').attr('class', 'grid-x').attr('x1', 0).attr('x2', innerW).attr('y1', (d) => yScale(d)).attr('y2', (d) => yScale(d)).attr('stroke', '#E5E7EB').attr('stroke-dasharray', '3,3');

    const bubbles = g
      .selectAll('.bubble')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'bubble')
      .attr('transform', (d) => `translate(${xScale(hasXY ? (d.x ?? 0) : data.indexOf(d))},${yScale(hasXY ? (d.y ?? 0) : d.value)})`);

    bubbles
      .append('circle')
      .attr('r', (d) => rScale(d.value))
      .attr('fill', bubbleGradientId)
      .attr('stroke', theme.primary)
      .attr('stroke-width', 2)
      .attr('opacity', 0.85)
      .style('cursor', 'pointer')
      .on('mouseenter', function () {
        d3.select(this).transition().duration(200).attr('opacity', 1).attr('stroke-width', 3);
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(200).attr('opacity', 0.85).attr('stroke-width', 2);
      });

    bubbles
      .append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => -rScale(d.value) - 4)
      .style('font-size', `${config.labelFontSize}px`)
      .style('fill', '#374151')
      .style('font-weight', '500')
      .style('pointer-events', 'none');

    return svg.node()!;
  }

  private renderSankeyChart(data: DataPoint[], config: ChartConfig): SVGSVGElement {
    const theme = THEME_PALETTES[config.theme];
    const width = config.width;
    const height = config.height - 80;
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.create('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');
    const linkGradientId = `sankey-link-grad-${config.theme}-${Date.now()}`;
    this.createGradient(defs, linkGradientId, theme.gradient);

    const nodeCount = Math.min(data.length, 6);
    const nodes: SankeyNode<{}, {}>[] = [];
    const links: SankeyLink<{}, {}>[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({ name: data[i].label });
    }

    for (let i = 0; i < nodeCount - 1; i++) {
      links.push({
        source: i,
        target: Math.min(i + 1 + (i % 2), nodeCount - 1),
        value: data[i].value
      });
    }

    const sankeyGenerator = sankey<SankeyGraph<{}, {}>, {}, {}>()
      .nodeWidth(20)
      .nodePadding(15)
      .extent([
        [0, 0],
        [innerW, innerH]
      ]);

    const graph = sankeyGenerator({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d }))
    });

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const linkG = g.append('g').attr('class', 'links').attr('fill', 'none');

    linkG
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', linkGradientId)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .style('transition', 'stroke-opacity 0.2s')
      .on('mouseenter', function () {
        d3.select(this).attr('stroke-opacity', 0.8);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke-opacity', 0.5);
      });

    const nodeG = g.append('g').attr('class', 'nodes');

    const nodeGradientId = `sankey-node-grad-${config.theme}-${Date.now()}`;
    this.createGradient(defs, nodeGradientId, theme.gradient);

    nodeG
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => Math.max(1, d.y1 - d.y0))
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', nodeGradientId)
      .attr('stroke', theme.primary)
      .attr('stroke-width', 1.5)
      .attr('rx', 3)
      .style('cursor', 'pointer');

    nodeG
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', (d: any) => (d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8))
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => (d.x0 < width / 2 ? 'start' : 'end'))
      .text((d: any) => d.name)
      .style('font-size', `${config.labelFontSize}px`)
      .style('fill', '#374151')
      .style('font-weight', '500');

    return svg.node()!;
  }

  private renderRadarChart(data: DataPoint[], config: ChartConfig): SVGSVGElement {
    const theme = THEME_PALETTES[config.theme];
    const width = config.width;
    const height = config.height - 80;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;
    const levels = 5;
    const angleSlice = (Math.PI * 2) / data.length;

    const svg = d3.create('svg').attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const defs = svg.append('defs');
    const areaGradientId = `radar-area-grad-${config.theme}-${Date.now()}`;
    const areaGrad = defs.append('radialGradient').attr('id', areaGradientId).attr('cx', '50%').attr('cy', '50%').attr('r', '50%');

    areaGrad.append('stop').attr('offset', '0%').attr('stop-color', theme.gradient[0]).attr('stop-opacity', 0.9);
    areaGrad.append('stop').attr('offset', '100%').attr('stop-color', theme.gradient[1]).attr('stop-opacity', 0.7);

    const maxValue = d3.max(data, (d) => d.value) || 100;

    for (let level = 0; level < levels; level++) {
      const levelRadius = (radius / levels) * (level + 1);
      const points: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const angle = i * angleSlice - Math.PI / 2;
        const x = centerX + levelRadius * Math.cos(angle);
        const y = centerY + levelRadius * Math.sin(angle);
        points.push(`${x},${y}`);
      }

      svg
        .append('polygon')
        .attr('points', points.join(' '))
        .attr('fill', level % 2 === 0 ? '#FAFAFA' : '#F3F4F6')
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1);
    }

    for (let i = 0; i < data.length; i++) {
      const angle = i * angleSlice - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      svg
        .append('line')
        .attr('x1', centerX)
        .attr('y1', centerY)
        .attr('x2', x)
        .attr('y2', y)
        .attr('stroke', '#E5E7EB')
        .attr('stroke-width', 1);

      const labelX = centerX + (radius + 24) * Math.cos(angle);
      const labelY = centerY + (radius + 24) * Math.sin(angle);

      svg
        .append('text')
        .attr('x', labelX)
        .attr('y', labelY)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(data[i].label)
        .style('font-size', `${config.labelFontSize}px`)
        .style('fill', '#374151')
        .style('font-weight', '500');
    }

    const areaPoints: string[] = [];
    const dataPoints: { x: number; y: number; value: number; label: string }[] = [];

    for (let i = 0; i < data.length; i++) {
      const angle = i * angleSlice - Math.PI / 2;
      const valueRatio = data[i].value / maxValue;
      const x = centerX + radius * valueRatio * Math.cos(angle);
      const y = centerY + radius * valueRatio * Math.sin(angle);
      areaPoints.push(`${x},${y}`);
      dataPoints.push({ x, y, value: data[i].value, label: data[i].label });
    }

    svg
      .append('polygon')
      .attr('points', areaPoints.join(' '))
      .attr('fill', `url(#${areaGradientId})`)
      .attr('stroke', theme.primary)
      .attr('stroke-width', 2.5)
      .attr('stroke-linejoin', 'round');

    dataPoints.forEach((p) => {
      svg
        .append('circle')
        .attr('cx', p.x)
        .attr('cy', p.y)
        .attr('r', 5)
        .attr('fill', 'white')
        .attr('stroke', theme.primary)
        .attr('stroke-width', 2.5)
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this).transition().duration(200).attr('r', 7);
        })
        .on('mouseleave', function () {
          d3.select(this).transition().duration(200).attr('r', 5);
        });

      svg
        .append('text')
        .attr('x', p.x)
        .attr('y', p.y - 12)
        .attr('text-anchor', 'middle')
        .text(p.value)
        .style('font-size', `${Math.max(config.labelFontSize - 1, 10)}px`)
        .style('fill', '#6B7280')
        .style('font-weight', '600');
    });

    return svg.node()!;
  }

  private createLegend(data: DataPoint[], config: ChartConfig): HTMLElement {
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.justifyContent = 'center';
    legend.style.gap = '12px';
    legend.style.padding = '8px 16px 16px';
    legend.style.fontSize = `${config.labelFontSize}px`;
    legend.style.color = '#6B7280';

    const theme = THEME_PALETTES[config.theme];
    const sampleCount = Math.min(data.length, 4);

    for (let i = 0; i < sampleCount; i++) {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '6px';

      const dot = document.createElement('span');
      dot.style.width = '10px';
      dot.style.height = '10px';
      dot.style.borderRadius = '50%';
      dot.style.background = `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.primary})`;

      const text = document.createElement('span');
      text.textContent = `${data[i].label}: ${data[i].value}`;

      item.appendChild(dot);
      item.appendChild(text);
      legend.appendChild(item);
    }

    if (data.length > sampleCount) {
      const more = document.createElement('span');
      more.textContent = `+${data.length - sampleCount} 项`;
      more.style.color = '#9CA3AF';
      legend.appendChild(more);
    }

    return legend;
  }

  updateChart(chartId: string, material: Material, config: ChartConfig): RenderedChart | null {
    const existing = this.renderedCharts.get(chartId);
    if (existing) {
      this.renderedCharts.delete(chartId);
    }
    return this.render({ chartId, material, config });
  }

  removeChart(chartId: string): void {
    this.renderedCharts.delete(chartId);
  }

  getChart(chartId: string): RenderedChart | undefined {
    return this.renderedCharts.get(chartId);
  }

  destroy(): void {
    eventBus.off(EVENTS.RENDER_CHART, this.handleRenderChart.bind(this));
    this.renderedCharts.clear();
  }
}

export const chartEngine = new ChartEngine();
export default chartEngine;
