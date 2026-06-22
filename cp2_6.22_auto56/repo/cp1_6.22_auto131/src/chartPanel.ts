import * as d3 from 'd3';
import { MonthlyRecord } from './types';

export interface ChartState {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  xScale: d3.ScaleBand<string> | null;
  yTempScale: d3.ScaleLinear<number, number> | null;
  yPrecipScale: d3.ScaleLinear<number, number> | null;
  cityName: string;
}

export function renderCompareChart(
  containerId: string,
  data: MonthlyRecord[],
  cityName: string,
): ChartState {
  const container = document.getElementById(containerId);
  if (!container) return { svg: null, xScale: null, yTempScale: null, yPrecipScale: null, cityName };

  d3.select(container).selectAll('*').remove();

  const width = 300;
  const height = 200;
  const margin = { top: 32, right: 40, bottom: 30, left: 36 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('class', 'compare-svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const months = data.map((d) => `${d.month}月`);

  const xScale = d3.scaleBand<string>().domain(months).range([0, innerW]).padding(0.25);

  const yTempScale = d3.scaleLinear().domain([-10, 40]).range([innerH, 0]).nice();

  const maxPrecip = d3.max(data, (d) => d.precipitation) || 100;
  const yPrecipScale = d3
    .scaleLinear()
    .domain([0, Math.max(100, Math.ceil(maxPrecip / 50) * 50)])
    .range([innerH, 0])
    .nice();

  const xAxis = d3.axisBottom(xScale).tickSize(0).tickPadding(6);
  const yTempAxis = d3.axisLeft(yTempScale).ticks(5).tickSize(-innerW).tickPadding(4);
  const yPrecipAxis = d3.axisRight(yPrecipScale).ticks(4).tickSize(0).tickPadding(4);

  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${innerH})`)
    .call(xAxis)
    .selectAll('text')
    .style('font-size', '9px')
    .style('fill', '#546e7a');

  g.selectAll('.domain, .tick line').style('stroke', '#cfd8dc');

  g.append('g')
    .attr('class', 'y-temp-axis')
    .call(yTempAxis)
    .selectAll('text')
    .style('font-size', '9px')
    .style('fill', '#ef5350');

  g.select('.y-temp-axis').selectAll('.tick line').style('stroke', '#eceff1').style('stroke-dasharray', '2,2');

  g.append('g')
    .attr('class', 'y-precip-axis')
    .attr('transform', `translate(${innerW},0)`)
    .call(yPrecipAxis)
    .selectAll('text')
    .style('font-size', '9px')
    .style('fill', '#1976d2');

  g.selectAll('.domain').style('stroke', '#b0bec5');

  g.selectAll('.precip-bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'precip-bar')
    .attr('x', (d) => xScale(`${d.month}月`)!)
    .attr('width', xScale.bandwidth())
    .attr('y', innerH)
    .attr('height', 0)
    .attr('rx', 2)
    .attr('fill', '#1976d2')
    .attr('opacity', 0)
    .transition()
    .duration(400)
    .attr('y', (d) => yPrecipScale(d.precipitation))
    .attr('height', (d) => innerH - yPrecipScale(d.precipitation))
    .attr('opacity', 0.7);

  const lineGen = d3
    .line<MonthlyRecord>()
    .x((d) => (xScale(`${d.month}月`) || 0) + xScale.bandwidth() / 2)
    .y((d) => yTempScale(d.temperature))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(data)
    .attr('class', 'temp-line')
    .attr('fill', 'none')
    .attr('stroke', '#ef5350')
    .attr('stroke-width', 2)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('d', lineGen)
    .attr('stroke-dasharray', function () {
      const len = (this as SVGPathElement).getTotalLength();
      return `${len}`;
    })
    .attr('stroke-dashoffset', function () {
      return (this as SVGPathElement).getTotalLength();
    })
    .transition()
    .duration(400)
    .attr('stroke-dashoffset', 0);

  g.selectAll('.temp-dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'temp-dot')
    .attr('cx', (d) => (xScale(`${d.month}月`) || 0) + xScale.bandwidth() / 2)
    .attr('cy', (d) => yTempScale(d.temperature))
    .attr('r', 0)
    .attr('fill', '#ef5350')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .transition()
    .delay(300)
    .duration(200)
    .attr('r', 3);

  return { svg, xScale, yTempScale, yPrecipScale, cityName };
}

export function updateCompareChart(
  state: ChartState,
  data: MonthlyRecord[],
  cityName: string,
): ChartState {
  if (!state.svg || !state.xScale || !state.yTempScale || !state.yPrecipScale) {
    return renderCompareChart('', data, cityName);
  }

  const svg = state.svg;
  const xScale = state.xScale;
  const yTempScale = state.yTempScale;
  const yPrecipScale = state.yPrecipScale;

  const innerH = 200 - 32 - 30;
  const maxPrecip = d3.max(data, (d) => d.precipitation) || 100;
  const newYPrecipDomain = [0, Math.max(100, Math.ceil(maxPrecip / 50) * 50)] as [number, number];
  yPrecipScale.domain(newYPrecipDomain);

  const precipAxis = d3.axisRight(yPrecipScale).ticks(4).tickSize(0).tickPadding(4);
  svg
    .select<SVGGElement>('.y-precip-axis')
    .transition()
    .duration(400)
    .call(precipAxis as unknown as (sel: d3.Transition<SVGGElement, unknown, null, undefined>) => void);

  svg
    .select('.y-precip-axis')
    .selectAll('text')
    .style('font-size', '9px')
    .style('fill', '#1976d2');

  svg
    .selectAll('.precip-bar')
    .data(data)
    .transition()
    .duration(400)
    .attr('x', (d) => xScale(`${d.month}月`)!)
    .attr('width', xScale.bandwidth())
    .attr('y', (d) => yPrecipScale(d.precipitation))
    .attr('height', (d) => innerH - yPrecipScale(d.precipitation));

  const lineGen = d3
    .line<MonthlyRecord>()
    .x((d) => (xScale(`${d.month}月`) || 0) + xScale.bandwidth() / 2)
    .y((d) => yTempScale(d.temperature))
    .curve(d3.curveMonotoneX);

  svg
    .select('.temp-line')
    .datum(data)
    .transition()
    .duration(400)
    .attr('d', lineGen);

  svg
    .selectAll('.temp-dot')
    .data(data)
    .transition()
    .duration(400)
    .attr('cx', (d) => (xScale(`${d.month}月`) || 0) + xScale.bandwidth() / 2)
    .attr('cy', (d) => yTempScale(d.temperature));

  return { ...state, cityName };
}
