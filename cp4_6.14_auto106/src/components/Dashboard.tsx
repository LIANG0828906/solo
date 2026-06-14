import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useStore } from '../store';

export const Dashboard: React.FC = () => {
  const { dashboard, fetchDashboard } = useStore();
  const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!dashboard || !chartRef.current) return;

    const container = chartRef.current.parentElement as HTMLElement;
    const isMobile = window.innerWidth < 768;
    const width = isMobile ? 240 : Math.min(container.clientWidth - 48, 750);
    const height = isMobile ? 180 : 280;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const data = dashboard.salesTrend;

    const xScale = d3
      .scalePoint()
      .domain(data.map((d) => d.date))
      .range([0, innerWidth])
      .padding(0.5);

    const yMax = Math.max(d3.max(data, (d) => d.amount) || 0, 100);
    const yScale = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

    const gridLines = g
      .append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      );
    gridLines.selectAll('line').attr('stroke', '#e2e8f0');
    gridLines.select('.domain').remove();

    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));
    xAxis.selectAll('text').style('font-size', '12px').attr('fill', '#64748b');
    xAxis.selectAll('line').attr('stroke', '#e2e8f0');
    xAxis.select('.domain').attr('stroke', '#e2e8f0');

    const yAxis = g.append('g').call(d3.axisLeft(yScale).ticks(5));
    yAxis.selectAll('text').style('font-size', '12px').attr('fill', '#64748b');
    yAxis.selectAll('line').attr('stroke', '#e2e8f0');
    yAxis.select('.domain').remove();

    const area = d3
      .area<{ date: string; amount: number }>()
      .x((d) => xScale(d.date) || 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.amount))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', '#6366f133')
      .attr('d', area);

    const line = d3
      .line<{ date: string; amount: number }>()
      .x((d) => xScale(d.date) || 0)
      .y((d) => yScale(d.amount))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    g.selectAll('.data-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => xScale(d.date) || 0)
      .attr('cy', (d) => yScale(d.amount))
      .attr('r', 4)
      .attr('fill', '#fff')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2);
  }, [dashboard]);

  return (
    <div className="page-fade-in">
      <div className="page-header">
        <h1 className="page-title">数据概览</h1>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-value">{dashboard?.todayOrders ?? 0}</div>
          <div className="stat-card-label">今日订单数</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{dashboard?.pendingOrders ?? 0}</div>
          <div className="stat-card-label">待处理订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{dashboard?.lowStockProducts ?? 0}</div>
          <div className="stat-card-label">低库存产品</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">¥{(dashboard?.monthlySales ?? 0).toFixed(2)}</div>
          <div className="stat-card-label">月度销售额</div>
        </div>
      </div>

      <div className="chart-section">
        <h2 className="chart-title">最近 7 天销售趋势</h2>
        <div className="chart-container">
          <svg ref={chartRef} />
        </div>
      </div>
    </div>
  );
};
