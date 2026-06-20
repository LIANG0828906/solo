import React, { useMemo, useRef, useState, useCallback } from 'react';
import type { DataPoint, TimeRange, TrendResult, MovingAveragePoint } from './types';
import * as d3 from 'd3';

interface TrendPanelProps {
  data: DataPoint[];
  columns: string[];
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  selectedColumnIndex: number;
  onColumnSelect: (index: number) => void;
  maWindow: number;
  onMaWindowChange: (window: number) => void;
  colorPalette: string[];
  regressionResult: {
    slope: number;
    intercept: number;
    rSquared: number;
    startValue: number;
    endValue: number;
  };
  movingAverageData: MovingAveragePoint[];
}

const TrendPanel: React.FC<TrendPanelProps> = ({
  data,
  columns,
  timeRange,
  onTimeRangeChange,
  selectedColumnIndex,
  onColumnSelect,
  maWindow,
  onMaWindowChange,
  colorPalette,
  regressionResult,
  movingAverageData,
}) => {
  const dataColumns = columns.slice(1);

  const filteredData = useMemo(() => {
    return data.filter(d => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end);
  }, [data, timeRange]);

  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

  const handleThumbMouseDown = useCallback((which: 'start' | 'end') => {
    setDragging(which);
  }, []);

  const handleTrackMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || !sliderTrackRef.current || data.length < 2) return;

    const rect = sliderTrackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const totalRange = data[data.length - 1].timestamp - data[0].timestamp;
    const newTimestamp = data[0].timestamp + (percent / 100) * totalRange;
    const minGap = totalRange * 0.05;

    if (dragging === 'start') {
      if (newTimestamp < timeRange.end - minGap) {
        onTimeRangeChange({ ...timeRange, start: newTimestamp });
      }
    } else {
      if (newTimestamp > timeRange.start + minGap) {
        onTimeRangeChange({ ...timeRange, end: newTimestamp });
      }
    }
  }, [dragging, data, timeRange, onTimeRangeChange]);

  const handleTrackMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  React.useEffect(() => {
    const handleGlobalMouseUp = () => setDragging(null);
    if (dragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [dragging]);

  const startPercent = useMemo(() => {
    if (data.length < 2) return 0;
    const total = data[data.length - 1].timestamp - data[0].timestamp;
    return ((timeRange.start - data[0].timestamp) / total) * 100;
  }, [data, timeRange]);

  const endPercent = useMemo(() => {
    if (data.length < 2) return 100;
    const total = data[data.length - 1].timestamp - data[0].timestamp;
    return ((timeRange.end - data[0].timestamp) / total) * 100;
  }, [data, timeRange]);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const miniChartData = useMemo(() => {
    if (filteredData.length < 2) return null;

    const width = 280;
    const height = 100;
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };

    const xScale = d3.scaleTime()
      .domain(d3.extent(filteredData, d => d.timestamp) as [number, number])
      .range([padding.left, width - padding.right]);

    const yMin = d3.min(filteredData, d => d.values[selectedColumnIndex]) || 0;
    const yMax = d3.max(filteredData, d => d.values[selectedColumnIndex]) || 1;
    const yScale = d3.scaleLinear()
      .domain([yMin * 0.95, yMax * 1.05])
      .range([height - padding.bottom, padding.top]);

    const line = d3.line<DataPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.values[selectedColumnIndex]))
      .curve(d3.curveMonotoneX);

    const trendLine = d3.line<{ x: number; y: number }>()
      .x(d => d.x)
      .y(d => d.y);

    const trendPoints = [
      { x: padding.left, y: yScale(regressionResult.startValue) },
      { x: width - padding.right, y: yScale(regressionResult.endValue) },
    ];

    const filteredMaData = movingAverageData.filter(
      d => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end
    );

    const maLine = d3.line<MovingAveragePoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    return {
      line: line(filteredData) || '',
      trendLine: trendLine(trendPoints) || '',
      maLine: maLine(filteredMaData) || '',
      width,
      height,
    };
  }, [filteredData, selectedColumnIndex, regressionResult, movingAverageData, timeRange]);

  const handleMaWindowInc = () => {
    onMaWindowChange(Math.min(maWindow + 1, Math.max(1, Math.floor(filteredData.length / 2))));
  };

  const handleMaWindowDec = () => {
    onMaWindowChange(Math.max(1, maWindow - 1));
  };

  const handleMaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      onMaWindowChange(val);
    }
  };

  return (
    <div className="trend-panel">
      <h3 className="panel-title">趋势分析</h3>

      <div className="panel-section">
        <label className="section-label">选择数据列</label>
        <div className="legend-container">
          {dataColumns.map((col, idx) => (
            <div
              key={col}
              className="legend-item"
              onClick={() => onColumnSelect(idx)}
              style={{
                opacity: idx === selectedColumnIndex ? 1 : 0.5,
              }}
            >
              <span
                className="legend-color"
                style={{ backgroundColor: colorPalette[idx % colorPalette.length] }}
              />
              <span>{col}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <label className="section-label">时间范围</label>
        <div className="time-range-slider">
          <div
            ref={sliderTrackRef}
            className="slider-track"
            onMouseMove={handleTrackMouseMove}
            onMouseUp={handleTrackMouseUp}
            onMouseLeave={handleTrackMouseUp}
          >
            <div
              className="slider-fill"
              style={{
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`,
              }}
            />
            <div
              className="slider-thumb"
              style={{ left: `${startPercent}%` }}
              onMouseDown={() => handleThumbMouseDown('start')}
            />
            <div
              className="slider-thumb"
              style={{ left: `${endPercent}%` }}
              onMouseDown={() => handleThumbMouseDown('end')}
            />
          </div>
          <div className="time-range-values">
            <span>{formatTime(timeRange.start)}</span>
            <span>{formatTime(timeRange.end)}</span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <label className="section-label">线性回归</label>
        <div className="trend-stats">
          <div className="stat-row">
            <span className="stat-label">R² 值</span>
            <span className="stat-value">{regressionResult.rSquared.toFixed(4)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">斜率</span>
            <span className="stat-value">{regressionResult.slope.toFixed(4)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">截距</span>
            <span className="stat-value">{regressionResult.intercept.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <label className="section-label">移动平均</label>
        <div className="moving-average-control">
          <span className="stat-label">窗口大小:</span>
          <div className="number-input">
            <input
              type="number"
              value={maWindow}
              onChange={handleMaInputChange}
              min="1"
            />
            <div className="number-input-buttons">
              <button className="number-input-btn" onClick={handleMaWindowInc}>▲</button>
              <button className="number-input-btn" onClick={handleMaWindowDec}>▼</button>
            </div>
          </div>
        </div>
      </div>

      {miniChartData && (
        <div className="panel-section">
          <label className="section-label">趋势预览</label>
          <div className="trend-mini-chart">
            <svg width="100%" height="100%" viewBox={`0 0 ${miniChartData.width} ${miniChartData.height}`}>
              <path
                d={miniChartData.line}
                fill="none"
                stroke={colorPalette[selectedColumnIndex % colorPalette.length]}
                strokeWidth={1.5}
                opacity={0.3}
              />
              <path
                d={miniChartData.trendLine}
                fill="none"
                stroke={colorPalette[selectedColumnIndex % colorPalette.length]}
                strokeWidth={1}
                strokeDasharray="4,3"
              />
              {miniChartData.maLine && (
                <path
                  d={miniChartData.maLine}
                  fill="none"
                  stroke={colorPalette[selectedColumnIndex % colorPalette.length]}
                  strokeWidth={1}
                  opacity={0.7}
                />
              )}
            </svg>
          </div>
          <div className="legend-container" style={{ justifyContent: 'center' }}>
            <div className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: colorPalette[selectedColumnIndex % colorPalette.length], opacity: 0.3 }}
              />
              <span style={{ fontSize: '11px' }}>原始数据</span>
            </div>
            <div className="legend-item">
              <span
                className="legend-color"
                style={{
                  background: `repeating-linear-gradient(90deg, ${colorPalette[selectedColumnIndex % colorPalette.length]} 0, ${colorPalette[selectedColumnIndex % colorPalette.length]} 4px, transparent 4px, transparent 7px)`,
                  height: '3px',
                  width: '20px',
                }}
              />
              <span style={{ fontSize: '11px' }}>回归线</span>
            </div>
            <div className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: colorPalette[selectedColumnIndex % colorPalette.length], opacity: 0.7 }}
              />
              <span style={{ fontSize: '11px' }}>移动平均(窗口{maWindow})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendPanel;
