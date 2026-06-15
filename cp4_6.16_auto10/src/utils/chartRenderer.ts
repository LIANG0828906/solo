import * as d3 from 'd3';
import type { ChartConfig, DataPoint } from '../types';

const MARGIN = { top: 50, right: 50, bottom: 60, left: 60 };

export function createChart(
  container: HTMLElement,
  config: ChartConfig,
  onDataPointClick?: (index: number) => void
): () => void {
  const width = container.clientWidth;
  const height = container.clientHeight;

  container.innerHTML = '';

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

  switch (config.type) {
    case 'line':
      renderLineChart(g, config, innerWidth, innerHeight, onDataPointClick);
      break;
    case 'bar':
      renderBarChart(g, config, innerWidth, innerHeight, onDataPointClick);
      break;
    case 'pie':
      renderPieChart(svg, config, width, height, onDataPointClick);
      break;
    case 'scatter':
      renderScatterChart(g, config, innerWidth, innerHeight, onDataPointClick);
      break;
  }

  if (config.title) {
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .attr('fill', '#333')
      .text(config.title);
  }

  return () => {
    d3.select(container).selectAll('*').remove();
  };
}

function renderLineChart(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: ChartConfig,
  width: number,
  height: number,
  onDataPointClick?: (index: number) => void
) {
  const data = config.data;
  const colors = config.colors;

  const x = d3
    .scaleBand<string>()
    .domain(data.map((d) => String(d.x)))
    .range([0, width])
    .padding(0.1);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.y) || 100])
    .nice()
    .range([height, 0]);

  const xAxis = g
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  const yAxis = g.append('g').call(d3.axisLeft(y));

  if (config.xAxisLabel) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text(config.xAxisLabel);
  }

  if (config.yAxisLabel) {
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text(config.yAxisLabel);
  }

  const gradient = g
    .append('defs')
    .append('linearGradient')
    .attr('id', 'line-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%');

  gradient.append('stop').attr('offset', '0%').attr('stop-color', colors[0]).attr('stop-opacity', 0.6);
  gradient.append('stop').attr('offset', '100%').attr('stop-color', colors[0]).attr('stop-opacity', 0.05);

  const line = d3
    .line<DataPoint>()
    .x((d) => x(String(d.x))! + x.bandwidth() / 2)
    .y((d) => y(d.y))
    .curve(d3.curveMonotoneX);

  const area = d3
    .area<DataPoint>()
    .x((d) => x(String(d.x))! + x.bandwidth() / 2)
    .y0(height)
    .y1((d) => y(d.y))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(data)
    .attr('fill', 'url(#line-gradient)')
    .attr('d', area);

  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', colors[0])
    .attr('stroke-width', 2.5)
    .attr('d', line);

  g.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', (d) => x(String(d.x))! + x.bandwidth() / 2)
    .attr('cy', (d) => y(d.y))
    .attr('r', 6)
    .attr('fill', colors[0])
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function () {
      d3.select(this).transition().duration(150).attr('r', 8);
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(150).attr('r', 6);
    })
    .on('click', (_, d) => {
      const index = data.indexOf(d);
      onDataPointClick?.(index);
    });

  if (config.showLegend) {
    renderLegend(g, [config.title], [colors[0]], width);
  }

  styleAxis(xAxis, yAxis);
}

function renderBarChart(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: ChartConfig,
  width: number,
  height: number,
  onDataPointClick?: (index: number) => void
) {
  const data = config.data;
  const colors = config.colors;

  const x = d3
    .scaleBand<string>()
    .domain(data.map((d) => String(d.x)))
    .range([0, width])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.y) || 100])
    .nice()
    .range([height, 0]);

  const xAxis = g
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  const yAxis = g.append('g').call(d3.axisLeft(y));

  if (config.xAxisLabel) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text(config.xAxisLabel);
  }

  if (config.yAxisLabel) {
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text(config.yAxisLabel);
  }

  const defs = g.append('defs');
  data.forEach((d, i) => {
    const gradient = defs
      .append('linearGradient')
      .attr('id', `bar-gradient-${i}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    const color = colors[i % colors.length];
    gradient.append('stop').attr('offset', '0%').attr('stop-color', color);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.6);
  });

  g.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => x(String(d.x))!)
    .attr('y', height)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('rx', 6)
    .attr('ry', 6)
    .attr('fill', (_, i) => `url(#bar-gradient-${i})`)
    .style('cursor', 'pointer')
    .on('mouseenter', function () {
      d3.select(this).transition().duration(150).attr('opacity', 0.8);
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(150).attr('opacity', 1);
    })
    .on('click', (_, d) => {
      const index = data.indexOf(d);
      onDataPointClick?.(index);
    })
    .transition()
    .duration(600)
    .delay((_, i) => i * 80)
    .attr('y', (d) => y(d.y))
    .attr('height', (d) => height - y(d.y));

  if (config.showLegend) {
    renderLegend(g, [config.title], [colors[0]], width);
  }

  styleAxis(xAxis, yAxis);
}

function renderPieChart(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  config: ChartConfig,
  width: number,
  height: number,
  onDataPointClick?: (index: number) => void
) {
  const data = config.data;
  const colors = config.colors;

  const radius = Math.min(width, height) / 2 - 80;
  const centerX = width / 2;
  const centerY = height / 2 + 10;

  const g = svg.append('g').attr('transform', `translate(${centerX},${centerY})`);

  const pie = d3
    .pie<DataPoint>()
    .value((d) => d.y)
    .sort(null);

  const arc = d3
    .arc<d3.PieArcDatum<DataPoint>>()
    .innerRadius(radius * 0.5)
    .outerRadius(radius);

  const arcHover = d3
    .arc<d3.PieArcDatum<DataPoint>>()
    .innerRadius(radius * 0.5)
    .outerRadius(radius + 10);

  const defs = g.append('defs');
  data.forEach((d, i) => {
    const gradient = defs
      .append('radialGradient')
      .attr('id', `pie-gradient-${i}`)
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    const color = colors[i % colors.length];
    gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 1);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', color).attr('stop-opacity', 0.7);
  });

  const arcs = g
    .selectAll('.arc')
    .data(pie(data))
    .enter()
    .append('g')
    .attr('class', 'arc')
    .style('cursor', 'pointer');

  arcs
    .append('path')
    .attr('d', arc)
    .attr('fill', (_, i) => `url(#pie-gradient-${i})`)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .on('mouseenter', function (event, d) {
      d3.select(this).transition().duration(150).attr('d', arcHover(d));
    })
    .on('mouseleave', function (event, d) {
      d3.select(this).transition().duration(150).attr('d', arc(d));
    })
    .on('click', (_, d) => {
      const index = data.indexOf(d.data);
      onDataPointClick?.(index);
    });

  arcs
    .append('text')
    .attr('transform', (d) => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '11px')
    .attr('fill', '#fff')
    .attr('font-weight', '500')
    .text((d) => {
      const percent = ((d.value / d3.sum(data, (d) => d.y)) * 100).toFixed(1);
      return `${percent}%`;
    });

  if (config.showLegend) {
    const labels = data.map((d) => String(d.x));
    const legendColors = data.map((_, i) => colors[i % colors.length]);
    renderLegend(
      svg.append('g').attr('transform', `translate(${width - 120},${MARGIN.top})`),
      labels,
      legendColors,
      100
    );
  }
}

function renderScatterChart(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  config: ChartConfig,
  width: number,
  height: number,
  onDataPointClick?: (index: number) => void
) {
  const data = config.data;
  const colors = config.colors;

  const categories = [...new Set(data.map((d) => d.category || '默认'))];
  const colorScale = d3.scaleOrdinal<string>().domain(categories).range(colors);

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => Number(d.x)) || 100])
    .nice()
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.y) || 100])
    .nice()
    .range([height, 0]);

  const size = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.y) || 100])
    .range([4, 16]);

  const xAxis = g
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  const yAxis = g.append('g').call(d3.axisLeft(y));

  if (config.xAxisLabel) {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text(config.xAxisLabel);
  }

  if (config.yAxisLabel) {
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#666')
      .text(config.yAxisLabel);
  }

  g.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .call(d3.axisBottom(x).tickSize(-height).tickFormat(() => ''));

  g.append('g')
    .attr('class', 'grid')
    .attr('opacity', 0.1)
    .call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ''));

  g.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', (d) => x(Number(d.x)))
    .attr('cy', (d) => y(d.y))
    .attr('r', 0)
    .attr('fill', (d) => colorScale(d.category || '默认'))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .attr('opacity', 0.8)
    .style('cursor', 'pointer')
    .on('mouseenter', function () {
      d3.select(this).transition().duration(150).attr('opacity', 1).attr('stroke-width', 3);
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(150).attr('opacity', 0.8).attr('stroke-width', 2);
    })
    .on('click', (_, d) => {
      const index = data.indexOf(d);
      onDataPointClick?.(index);
    })
    .transition()
    .duration(500)
    .delay((_, i) => i * 50)
    .attr('r', (d) => size(d.y));

  if (config.showLegend && categories.length > 1) {
    renderLegend(
      g,
      categories,
      categories.map((c) => colorScale(c)),
      width
    );
  }

  styleAxis(xAxis, yAxis);
}

function renderLegend(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  labels: string[],
  colors: string[],
  width: number
) {
  const legend = g
    .append('g')
    .attr('transform', `translate(${width - labels.length * 80}, -30)`);

  labels.forEach((label, i) => {
    const item = legend
      .append('g')
      .attr('transform', `translate(${i * 80}, 0)`);

    item
      .append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('rx', 2)
      .attr('fill', colors[i % colors.length]);

    item
      .append('text')
      .attr('x', 18)
      .attr('y', 10)
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(label);
  });
}

function styleAxis(
  xAxis: d3.Selection<SVGGElement, unknown, null, undefined>,
  yAxis: d3.Selection<SVGGElement, unknown, null, undefined>
) {
  xAxis.selectAll('text').attr('font-size', '11px').attr('fill', '#666');
  yAxis.selectAll('text').attr('font-size', '11px').attr('fill', '#666');
  xAxis.selectAll('line').attr('stroke', '#ddd');
  yAxis.selectAll('line').attr('stroke', '#ddd');
  xAxis.select('.domain').attr('stroke', '#ddd');
  yAxis.select('.domain').attr('stroke', '#ddd');
}
