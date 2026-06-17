import * as d3 from 'd3';
import { Selection } from 'd3';

export class ChartModule {
  private svg: Selection<SVGSVGElement, unknown, null, undefined>;
  private width = 400;
  private height = 200;
  private margin = { top: 20, right: 20, bottom: 35, left: 50 };
  private innerWidth: number;
  private innerHeight: number;
  private xScale: d3.ScaleLinear<number, number>;
  private yScale: d3.ScaleLinear<number, number>;

  constructor(container: HTMLElement) {
    this.innerWidth = this.width - this.margin.left - this.margin.right;
    this.innerHeight = this.height - this.margin.top - this.margin.bottom;

    this.svg = d3
      .select(container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('background', '#1A2744')
      .style('border-radius', '8px')
      .style('box-shadow', '0 4px 12px rgba(0,0,0,0.25)')
      .style('position', 'fixed')
      .style('bottom', '20px')
      .style('right', '20px')
      .style('z-index', '100');

    const g = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    this.xScale = d3.scaleLinear().domain([6, 18]).range([0, this.innerWidth]);
    this.yScale = d3.scaleLinear().domain([0, 1]).range([this.innerHeight, 0]);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.innerHeight})`)
      .call(
        d3
          .axisBottom(this.xScale)
          .ticks(13)
          .tickFormat((d) => `${String(d).padStart(2, '0')}:00`)
      )
      .call((g) =>
        g
          .selectAll('text')
          .attr('fill', '#8899aa')
          .attr('font-size', '9px')
      )
      .call((g) => g.select('.domain').attr('stroke', '#333'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#333'));

    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale).ticks(5))
      .call((g) =>
        g
          .selectAll('text')
          .attr('fill', '#8899aa')
          .attr('font-size', '10px')
      )
      .call((g) => g.select('.domain').attr('stroke', '#333'))
      .call((g) => g.selectAll('.tick line').attr('stroke', '#333'));

    g.append('text')
      .attr('x', this.innerWidth / 2)
      .attr('y', this.innerHeight + 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8899aa')
      .attr('font-size', '10px')
      .text('时间');

    g.append('text')
      .attr('x', -this.innerHeight / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#8899aa')
      .attr('font-size', '10px')
      .attr('transform', 'rotate(-90)')
      .text('光照强度');

    const gridLines = g.append('g').attr('class', 'grid-lines');
    for (let i = 0; i <= 5; i++) {
      const y = this.yScale(i / 5);
      gridLines
        .append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', this.innerWidth)
        .attr('y2', y)
        .attr('stroke', '#333')
        .attr('stroke-dasharray', '3,3');
    }

    const defs = this.svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#FFD700').attr('stop-opacity', 0.4);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#FF8C00').attr('stop-opacity', 0.05);

    const lineGradient = defs
      .append('linearGradient')
      .attr('id', 'lineGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    lineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#FFD700');
    lineGradient.append('stop').attr('offset', '100%').attr('stop-color', '#FF8C00');

    g.append('path').attr('class', 'area-path');
    g.append('path').attr('class', 'line-path');
    g.append('circle').attr('class', 'current-dot');
  }

  update(data: { hour: number; intensity: number }[], currentHour: number): void {
    const g = this.svg.select('g');

    const area = d3
      .area<{ hour: number; intensity: number }>()
      .x((d) => this.xScale(d.hour))
      .y0(this.innerHeight)
      .y1((d) => this.yScale(d.intensity))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line<{ hour: number; intensity: number }>()
      .x((d) => this.xScale(d.hour))
      .y((d) => this.yScale(d.intensity))
      .curve(d3.curveMonotoneX);

    g.select('.area-path')
      .datum(data)
      .attr('d', area)
      .attr('fill', 'url(#areaGradient)');

    g.select('.line-path')
      .datum(data)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', 'url(#lineGradient)')
      .attr('stroke-width', 2);

    const currentItem = data.find((d) => d.hour === Math.round(currentHour));
    if (currentItem) {
      g.select('.current-dot')
        .attr('cx', this.xScale(currentItem.hour))
        .attr('cy', this.yScale(currentItem.intensity))
        .attr('r', 5)
        .attr('fill', '#FFD700')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 0 4px rgba(255,215,0,0.6))');
    }
  }

  destroy(): void {
    this.svg.remove();
  }
}
