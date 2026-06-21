import * as d3 from 'd3';
import { getGlobalTrend, TrendDataPoint } from '../data/carbonData';

export class TrendChart {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private container: HTMLElement;
  private data: TrendDataPoint[];
  private currentYear: number = 2023;
  private width: number = 0;
  private height: number = 0;
  private margin = { top: 10, right: 20, bottom: 20, left: 40 };
  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;
  private line: d3.Line<TrendDataPoint>;
  private area: d3.Area<TrendDataPoint>;
  private g: d3.Selection<SVGGElement, unknown, null, undefined>;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id ${containerId} not found`);
    }

    this.container = container;
    this.data = getGlobalTrend();
    
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('SVG element not found');
    }

    this.svg = d3.select(svgElement);
    
    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();
    this.line = d3.line<TrendDataPoint>();
    this.area = d3.area<TrendDataPoint>();
    this.g = this.svg.append('g');

    this.init();
    this.bindResize();
  }

  private init(): void {
    this.updateDimensions();
    this.createGradient();
    this.drawChart();
  }

  private updateDimensions(): void {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width - this.margin.left - this.margin.right;
    this.height = rect.height - this.margin.top - this.margin.bottom;

    this.svg
      .attr('width', rect.width)
      .attr('height', rect.height);
  }

  private createGradient(): void {
    const defs = this.svg.append('defs');
    
    const gradient = defs.append('linearGradient')
      .attr('id', 'chart-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00E5FF')
      .attr('stop-opacity', 0.4);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#00FF88')
      .attr('stop-opacity', 0.05);

    const lineGradient = defs.append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    lineGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00E5FF');

    lineGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#00FF88');
  }

  private drawChart(): void {
    this.g.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.xScale
      .domain(d3.extent(this.data, d => d.year) as [number, number])
      .range([0, this.width]);

    const yExtent = d3.extent(this.data, d => d.emission) as [number, number];
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
    this.yScale
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([this.height, 0])
      .nice();

    this.line
      .x(d => this.xScale(d.year))
      .y(d => this.yScale(d.emission))
      .curve(d3.curveMonotoneX);

    this.area
      .x(d => this.xScale(d.year))
      .y0(this.height)
      .y1(d => this.yScale(d.emission))
      .curve(d3.curveMonotoneX);

    this.g.selectAll('*').remove();

    this.g.append('path')
      .datum(this.data)
      .attr('class', 'area')
      .attr('d', this.area)
      .attr('fill', 'url(#chart-gradient)');

    this.g.append('path')
      .datum(this.data)
      .attr('class', 'line')
      .attr('d', this.line)
      .attr('fill', 'none')
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round');

    const xAxis = d3.axisBottom(this.xScale)
      .ticks(6)
      .tickFormat(d => String(d));

    this.g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', 'rgba(255, 255, 255, 0.5)')
      .attr('font-size', '10px');

    this.g.selectAll('.domain, .tick line')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    const yAxis = d3.axisLeft(this.yScale)
      .ticks(4)
      .tickFormat(d => (d as number).toFixed(1));

    this.g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', 'rgba(255, 255, 255, 0.5)')
      .attr('font-size', '10px');

    this.g.selectAll('.y-axis .domain, .y-axis .tick line')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    this.updateIndicator(this.currentYear);
  }

  private updateIndicator(year: number): void {
    this.g.selectAll('.indicator-group').remove();

    const indicatorGroup = this.g.append('g')
      .attr('class', 'indicator-group');

    const xPos = this.xScale(year);
    const yValue = this.data.find(d => d.year === year)?.emission || 0;
    const yPos = this.yScale(yValue);

    indicatorGroup.append('line')
      .attr('class', 'indicator-line')
      .attr('x1', xPos)
      .attr('x2', xPos)
      .attr('y1', 0)
      .attr('y2', this.height)
      .attr('stroke', '#00E5FF')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.5);

    indicatorGroup.append('circle')
      .attr('class', 'indicator-dot')
      .attr('cx', xPos)
      .attr('cy', yPos)
      .attr('r', 5)
      .attr('fill', '#00E5FF')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.8))');
  }

  private bindResize(): void {
    let resizeTimeout: number | null = null;
    
    window.addEventListener('resize', () => {
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = window.setTimeout(() => {
        this.updateDimensions();
        this.drawChart();
      }, 200);
    });
  }

  public updateYear(year: number): void {
    this.currentYear = year;
    this.updateIndicator(year);
  }

  public dispose(): void {
    this.svg.selectAll('*').remove();
  }
}
