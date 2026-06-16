import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { EcosystemStats, LogEvent } from './creatures';

interface StatsHistoryItem {
  time: number;
  producers: number;
  consumers: number;
  decomposers: number;
}

interface StatisticsProps {
  stats: EcosystemStats;
  statsHistory: StatsHistoryItem[];
  events: LogEvent[];
}

const EVENT_COLORS: Record<LogEvent['type'], string> = {
  eat: '#ff6b6b',
  decompose: '#a0a0a0',
  reproduce: '#00ff88',
  death: '#ff4444',
};

const CREATURE_COLORS = {
  producers: '#00ff88',
  consumers: '#ff6b6b',
  decomposers: '#a0a0a0',
};

const CHART_WIDTH = 260;
const CHART_HEIGHT = 200;
const MARGIN = { top: 10, right: 10, bottom: 25, left: 35 };
const INNER_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;

const Statistics: React.FC<StatisticsProps> = ({ stats, statsHistory, events }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    const createGradient = (id: string, color: string) => {
      const gradient = defs
        .append('linearGradient')
        .attr('id', id)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.4);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0);
    };

    createGradient('gradient-producers', CREATURE_COLORS.producers);
    createGradient('gradient-consumers', CREATURE_COLORS.consumers);
    createGradient('gradient-decomposers', CREATURE_COLORS.decomposers);

    const filter = defs
      .append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter
      .append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 2);

    filter
      .append('feOffset')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('result', 'offsetblur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left}, ${MARGIN.top})`);

    const data = statsHistory.slice(-60);

    const x = d3
      .scaleLinear()
      .domain([0, Math.max(59, data.length - 1)])
      .range([0, INNER_WIDTH]);

    const maxY = d3.max(data, (d) =>
      Math.max(d.producers, d.consumers, d.decomposers)
    );

    const y = d3
      .scaleLinear()
      .domain([0, Math.max(10, maxY || 0)])
      .range([INNER_HEIGHT, 0]);

    const xAxis = d3
      .axisBottom(x)
      .ticks(5)
      .tickFormat((d) => `${-(59 - Number(d))}s`)
      .tickSizeOuter(0);

    const yAxis = d3.axisLeft(y).ticks(4).tickSizeOuter(0);

    g.append('g')
      .attr('transform', `translate(0, ${INNER_HEIGHT})`)
      .call(xAxis)
      .attr('color', '#2a2a4e')
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace');

    g.append('g')
      .call(yAxis)
      .attr('color', '#2a2a4e')
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace');

    g.selectAll('.domain').attr('stroke', '#2a2a4e');
    g.selectAll('.tick line').attr('stroke', '#2a2a4e');

    const createArea = (key: keyof StatsHistoryItem) => {
      return d3
        .area<StatsHistoryItem>()
        .x((_d, i) => x(i))
        .y0(INNER_HEIGHT)
        .y1((d) => y(d[key] as number))
        .curve(d3.curveMonotoneX);
    };

    const createLine = (key: keyof StatsHistoryItem) => {
      return d3
        .line<StatsHistoryItem>()
        .x((_d, i) => x(i))
        .y((d) => y(d[key] as number))
        .curve(d3.curveMonotoneX);
    };

    if (data.length > 1) {
      const areaKeys: Array<{ key: keyof StatsHistoryItem; gradient: string }> = [
        { key: 'producers', gradient: 'url(#gradient-producers)' },
        { key: 'consumers', gradient: 'url(#gradient-consumers)' },
        { key: 'decomposers', gradient: 'url(#gradient-decomposers)' },
      ];

      areaKeys.forEach(({ key, gradient }) => {
        g.append('path')
          .datum(data)
          .attr('fill', gradient)
          .attr('d', createArea(key))
          .attr('filter', 'url(#shadow)');
      });

      const lineKeys: Array<{ key: keyof StatsHistoryItem; color: string }> = [
        { key: 'producers', color: CREATURE_COLORS.producers },
        { key: 'consumers', color: CREATURE_COLORS.consumers },
        { key: 'decomposers', color: CREATURE_COLORS.decomposers },
      ];

      lineKeys.forEach(({ key, color }) => {
        g.append('path')
          .datum(data)
          .attr('fill', 'none')
          .attr('stroke', color)
          .attr('stroke-width', 2)
          .attr('d', createLine(key));
      });
    }

    const legend = g
      .append('g')
      .attr('transform', `translate(0, -5)`);

    const legendItems = [
      { label: '生产者', color: CREATURE_COLORS.producers, value: stats.producerCount },
      { label: '消费者', color: CREATURE_COLORS.consumers, value: stats.consumerCount },
      { label: '分解者', color: CREATURE_COLORS.decomposers, value: stats.decomposerCount },
    ];

    let legendX = 0;
    legendItems.forEach((item) => {
      const itemG = legend
        .append('g')
        .attr('transform', `translate(${legendX}, 0)`);

      itemG
        .append('rect')
        .attr('width', 8)
        .attr('height', 8)
        .attr('fill', item.color);

      itemG
        .append('text')
        .attr('x', 12)
        .attr('y', 7)
        .attr('fill', '#9ca3af')
        .attr('font-size', '9px')
        .attr('font-family', 'Orbitron, sans-serif')
        .text(`${item.label}:${item.value}`);

      legendX += 70;
    });
  }, [statsHistory, stats.producerCount, stats.consumerCount, stats.decomposerCount]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);

  return (
    <div
      style={{
        width: '280px',
        backgroundColor: '#16213e',
        borderRadius: '8px',
        padding: '16px',
        color: '#ffffff',
        fontFamily: 'Orbitron, sans-serif',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      <h2
        style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: 600,
          letterSpacing: '1px',
          color: '#00ff88',
          textTransform: 'uppercase',
        }}
      >
        实时统计
      </h2>

      <div
        style={{
          backgroundColor: 'rgba(42, 42, 78, 0.5)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: '#6b7280',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          能量总量
        </div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#ffd700',
            fontFamily: 'Orbitron, sans-serif',
          }}
        >
          {stats.totalEnergy.toFixed(1)}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '10px',
            color: '#6b7280',
          }}
        >
          <span>尸体: {stats.corpseCount}</span>
          <span>总计: {stats.producerCount + stats.consumerCount + stats.decomposerCount}</span>
        </div>
      </div>

      <div
        style={{
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: '#6b7280',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          种群趋势 (60s)
        </div>
        <svg
          ref={svgRef}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          style={{ display: 'block' }}
        />
      </div>

      <div>
        <div
          style={{
            fontSize: '11px',
            color: '#6b7280',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          事件日志
        </div>
        <div
          style={{
            height: '250px',
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            padding: '8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            lineHeight: '1.6',
          }}
        >
          {sortedEvents.length === 0 ? (
            <div style={{ color: '#4b5563', fontStyle: 'italic' }}>
              暂无事件...
            </div>
          ) : (
            sortedEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  marginBottom: '4px',
                  padding: '2px 4px',
                  borderRadius: '2px',
                  borderLeft: `2px solid ${EVENT_COLORS[event.type]}`,
                }}
              >
                <span style={{ color: '#4b5563', marginRight: '6px' }}>
                  [{formatTime(event.timestamp)}]
                </span>
                <span style={{ color: EVENT_COLORS[event.type] }}>
                  {event.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
