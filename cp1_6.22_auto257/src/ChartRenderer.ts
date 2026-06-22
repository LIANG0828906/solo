import * as d3 from 'd3';
import { LightSources, LIGHT_SOURCE_COLORS, LIGHT_SOURCE_NAMES } from './types';

export class ChartRenderer {
  private pieContainer: HTMLElement | null = null;
  private lineContainer: HTMLElement | null = null;
  private pieWidth: number = 300;
  private pieHeight: number = 250;
  private lineWidth: number = 340;
  private lineHeight: number = 200;

  constructor() {}

  setPieContainer(container: HTMLElement): void {
    this.pieContainer = container;
  }

  setLineContainer(container: HTMLElement): void {
    this.lineContainer = container;
  }

  renderPieChart(sources: LightSources): void {
    if (!this.pieContainer) return;

    const container = d3.select(this.pieContainer);
    container.selectAll('*').remove();

    const data: { label: string; value: number; color: string; key: keyof LightSources }[] = [
      { label: LIGHT_SOURCE_NAMES.streetLights, value: sources.streetLights, color: LIGHT_SOURCE_COLORS.streetLights, key: 'streetLights' },
      { label: LIGHT_SOURCE_NAMES.billboards, value: sources.billboards, color: LIGHT_SOURCE_COLORS.billboards, key: 'billboards' },
      { label: LIGHT_SOURCE_NAMES.buildingLights, value: sources.buildingLights, color: LIGHT_SOURCE_COLORS.buildingLights, key: 'buildingLights' },
      { label: LIGHT_SOURCE_NAMES.trafficLights, value: sources.trafficLights, color: LIGHT_SOURCE_COLORS.trafficLights, key: 'trafficLights' }
    ];

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const radius = Math.min(this.pieWidth, this.pieHeight) / 2 - 20;

    const svg = container
      .append('svg')
      .attr('width', this.pieWidth)
      .attr('height', this.pieHeight)
      .append('g')
      .attr('transform', `translate(${this.pieWidth / 2}, ${this.pieHeight / 2})`);

    const pie = d3.pie<typeof data[0]>()
      .value(d => d.value)
      .sort(null)
      .startAngle(-Math.PI / 2);

    const arc = d3.arc<d3.PieArcDatum<typeof data[0]>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const arcHover = d3.arc<d3.PieArcDatum<typeof data[0]>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 1.1);

    const arcs = pie(data);

    const path = svg.selectAll('path')
      .data(arcs)
      .enter()
      .append('path')
      .attr('fill', d => d.data.color)
      .attr('stroke', '#1A1A2E')
      .attr('stroke-width', 2)
      .attr('d', arc);

    path.transition()
      .duration(500)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 }, d);
        return function(t) {
          return arc(interpolate(t)) || '';
        };
      });

    const tooltip = container
      .append('div')
      .style('position', 'absolute')
      .style('padding', '6px 10px')
      .style('background', 'rgba(0, 0, 0, 0.85)')
      .style('color', '#fff')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);

    path
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover(d));

        const percentage = ((d.data.value / total) * 100).toFixed(1);
        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.data.label}</strong><br/>占比: ${percentage}%`);
      })
      .on('mousemove', function(event) {
        const rect = container.node()?.getBoundingClientRect();
        if (rect) {
          tooltip
            .style('left', `${event.offsetX + 10}px`)
            .style('top', `${event.offsetY - 30}px`);
        }
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc(d));

        tooltip.style('opacity', 0);
      });

    const legend = container
      .append('div')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('gap', '6px')
      .style('margin-top', '10px')
      .style('padding', '0 20px');

    data.forEach(d => {
      const percentage = ((d.value / total) * 100).toFixed(1);
      const item = legend
        .append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '8px')
        .style('font-size', '13px');

      item
        .append('div')
        .style('width', '12px')
        .style('height', '12px')
        .style('border-radius', '3px')
        .style('background-color', d.color);

      item
        .append('span')
        .style('color', '#E0E0E0')
        .text(d.label);

      item
        .append('span')
        .style('color', '#888')
        .style('margin-left', 'auto')
        .text(`${percentage}%`);
    });
  }

  renderLineChart(hourlyData: number[], currentHour: number): void {
    if (!this.lineContainer) return;

    const container = d3.select(this.lineContainer);
    container.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = this.lineWidth - margin.left - margin.right;
    const height = this.lineHeight - margin.top - margin.bottom;

    const data = hourlyData.map((value, index) => ({
      hour: index,
      value
    }));

    const svg = container
      .append('svg')
      .attr('width', this.lineWidth)
      .attr('height', this.lineHeight)
      .style('position', 'relative');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, 23])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    const gradientId = 'line-gradient';
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#FFD700')
      .attr('stop-opacity', 0.3);

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FFD700')
      .attr('stop-opacity', 0.05);

    const xAxis = d3.axisBottom(xScale)
      .ticks(8)
      .tickFormat(d => `${d}h`);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5);

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .attr('color', '#666')
      .style('font-size', '10px');

    g.append('g')
      .call(yAxis)
      .attr('color', '#666')
      .style('font-size', '10px');

    g.selectAll('.grid')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5);

    const area = d3.area<typeof data[0]>()
      .x(d => xScale(d.hour))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    const line = d3.line<typeof data[0]>()
      .x(d => xScale(d.hour))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#FFD700')
      .attr('stroke-width', 2)
      .attr('d', line);

    const currentY = yScale(hourlyData[Math.floor(currentHour)]);
    const currentX = xScale(currentHour);

    g.append('line')
      .attr('x1', currentX)
      .attr('x2', currentX)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#FF4500')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.8);

    g.append('circle')
      .attr('cx', currentX)
      .attr('cy', currentY)
      .attr('r', 5)
      .attr('fill', '#FF4500')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    const tooltip = container
      .append('div')
      .style('position', 'absolute')
      .style('padding', '6px 10px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', '#fff')
      .style('border-radius', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);

    const dots = g.selectAll('.data-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.hour))
      .attr('cy', d => yScale(d.value))
      .attr('r', 0)
      .attr('fill', '#FF4500')
      .style('cursor', 'pointer');

    dots
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 4);

        tooltip
          .style('opacity', 1)
          .html(`<strong>${d.hour}:00</strong><br/>光污染值: ${d.value.toFixed(1)}`);
      })
      .on('mousemove', function(event) {
        const rect = container.node()?.getBoundingClientRect();
        if (rect) {
          tooltip
            .style('left', `${event.offsetX + 10}px`)
            .style('top', `${event.offsetY - 40}px`);
        }
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 0);

        tooltip.style('opacity', 0);
      });

    const overlay = g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .style('cursor', 'crosshair');

    const hoverLine = g.append('line')
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .style('opacity', 0);

    const hoverCircle = g.append('circle')
      .attr('r', 4)
      .attr('fill', '#FF4500')
      .style('opacity', 0);

    overlay
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const hour = Math.round(xScale.invert(mx));
        const clampedHour = Math.max(0, Math.min(23, hour));
        const value = hourlyData[clampedHour];

        hoverLine
          .attr('x1', xScale(clampedHour))
          .attr('x2', xScale(clampedHour))
          .style('opacity', 0.5);

        hoverCircle
          .attr('cx', xScale(clampedHour))
          .attr('cy', yScale(value))
          .style('opacity', 1);

        tooltip
          .style('opacity', 1)
          .html(`<strong>${clampedHour}:00</strong><br/>光污染值: ${value.toFixed(1)}`);

        const rect = container.node()?.getBoundingClientRect();
        if (rect) {
          tooltip
            .style('left', `${xScale(clampedHour) + margin.left + 10}px`)
            .style('top', `${yScale(value) + margin.top - 30}px`);
        }
      })
      .on('mouseleave', function() {
        hoverLine.style('opacity', 0);
        hoverCircle.style('opacity', 0);
        tooltip.style('opacity', 0);
      });
  }

  clearCharts(): void {
    if (this.pieContainer) {
      d3.select(this.pieContainer).selectAll('*').remove();
    }
    if (this.lineContainer) {
      d3.select(this.lineContainer).selectAll('*').remove();
    }
  }
}
