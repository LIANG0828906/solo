import { useRef, useState, useEffect, useMemo } from 'react';
import { TrendingUp, GripVertical } from 'lucide-react';
import Draggable from 'react-draggable';
import { useStormStore } from '@/store/useStormStore';
import { windSpeedColorScale } from '@/utils/colorScale';
import type { StormRecord } from '@/data/types';

export default function StatsChart() {
  const { yearRange, category, basin } = useStormStore();
  const [storms, setStorms] = useState<StormRecord[]>([]);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const { filterStorms } = require('@/data/stormDataLoader');
    const filtered = filterStorms({ yearRange, category, basin });
    setStorms(filtered);
  }, [yearRange, category, basin]);

  const { chartData, width, height, padding } = useMemo(() => {
    const w = 280;
    const h = 140;
    const pad = { top: 10, right: 10, bottom: 25, left: 30 };

    const [startYear, endYear] = yearRange;
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(y);
    }

    const freqMap = new Map<number, number>();
    storms.forEach(s => {
      freqMap.set(s.year, (freqMap.get(s.year) || 0) + 1);
    });

    const data = years.map(year => ({
      year,
      count: freqMap.get(year) || 0,
    }));

    return { chartData: data, width: w, height: h, padding: pad };
  }, [storms, yearRange]);

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  const xScale = (year: number) => {
    const [startYear, endYear] = yearRange;
    return padding.left + ((year - startYear) / (endYear - startYear)) * (width - padding.left - padding.right);
  };

  const yScale = (count: number) => {
    return height - padding.bottom - (count / maxCount) * (height - padding.top - padding.bottom);
  };

  const pathD = useMemo(() => {
    if (chartData.length === 0) return '';
    return chartData
      .map((d, i) => {
        const x = xScale(d.year);
        const y = yScale(d.count);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  }, [chartData, maxCount, yearRange, width, height, padding]);

  const areaD = useMemo(() => {
    if (chartData.length === 0) return '';
    const baseY = height - padding.bottom;
    const linePath = chartData
      .map((d, i) => {
        const x = xScale(d.year);
        const y = yScale(d.count);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
    const lastX = xScale(chartData[chartData.length - 1].year);
    const firstX = xScale(chartData[0].year);
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [chartData, maxCount, yearRange, width, height, padding]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const [startYear, endYear] = yearRange;
    const ratio = (x - padding.left) / (width - padding.left - padding.right);
    const year = Math.round(startYear + ratio * (endYear - startYear));
    const clampedYear = Math.max(startYear, Math.min(endYear, year));
    setHoveredYear(clampedYear);
  };

  const handleMouseLeave = () => {
    setHoveredYear(null);
  };

  const hoveredData = hoveredYear ? chartData.find(d => d.year === hoveredYear) : null;

  return (
    <Draggable handle=".stats-drag-handle" bounds="parent">
      <div className="stats-chart-panel">
        <div className="stats-header">
          <div className="stats-drag-handle">
            <GripVertical size={14} />
          </div>
          <TrendingUp size={16} className="stats-icon" />
          <h4 className="stats-title">年度风暴频率</h4>
        </div>

        <div className="stats-chart-wrapper">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="stats-svg"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1={padding.left}
                y1={padding.top + ratio * (height - padding.top - padding.bottom)}
                x2={width - padding.right}
                y2={padding.top + ratio * (height - padding.top - padding.bottom)}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="2,3"
              />
            ))}

            <path d={areaD} fill="url(#areaGradient)" />

            <path
              d={pathD}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {hoveredData && (
              <g>
                <line
                  x1={xScale(hoveredData.year)}
                  y1={padding.top}
                  x2={xScale(hoveredData.year)}
                  y2={height - padding.bottom}
                  stroke="rgba(34, 211, 238, 0.5)"
                  strokeDasharray="3,3"
                />
                <circle
                  cx={xScale(hoveredData.year)}
                  cy={yScale(hoveredData.count)}
                  r={5}
                  fill="#22d3ee"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth={2}
                />
              </g>
            )}

            <text
              x={padding.left - 4}
              y={padding.top + 4}
              textAnchor="end"
              fill="rgba(255,255,255,0.5)"
              fontSize={10}
            >
              {maxCount}
            </text>
            <text
              x={padding.left - 4}
              y={height - padding.bottom + 3}
              textAnchor="end"
              fill="rgba(255,255,255,0.5)"
              fontSize={10}
            >
              0
            </text>
          </svg>

          {hoveredData && (
            <div
              className="stats-tooltip"
              style={{
                left: `${xScale(hoveredData.year)}px`,
                top: `${yScale(hoveredData.count) - 25}px`,
              }}
            >
              <div className="tooltip-year">{hoveredData.year}年</div>
              <div className="tooltip-count">{hoveredData.count} 场</div>
            </div>
          )}
        </div>

        <div className="stats-summary">
          <div className="summary-item">
            <span className="summary-label">总计</span>
            <span className="summary-value highlight">{storms.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">年均</span>
            <span className="summary-value">
              {(storms.length / Math.max(1, chartData.length)).toFixed(1)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">最高</span>
            <span className="summary-value highlight">{maxCount}</span>
          </div>
        </div>
      </div>
    </Draggable>
  );
}
