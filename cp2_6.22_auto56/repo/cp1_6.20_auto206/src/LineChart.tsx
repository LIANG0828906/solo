import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import type { DataPoint, Annotation, TimeRange, MovingAveragePoint } from './types';

interface LineChartProps {
  data: DataPoint[];
  columns: string[];
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (annotation: Annotation) => void;
  colorPalette: string[];
  hiddenColumns: Set<number>;
  timeRange: TimeRange;
  showTrendLine: boolean;
  selectedTimeRange: TimeRange;
  regressionStartValue: number;
  regressionEndValue: number;
  movingAverageData: MovingAveragePoint[];
  selectedColumnIndex: number;
  maWindow: number;
}

const AGGREGATION_PIXEL_THRESHOLD = 10;
const AGGREGATION_COUNT_THRESHOLD = 3;

const LineChart: React.FC<LineChartProps> = ({
  data,
  columns,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  colorPalette,
  hiddenColumns,
  timeRange,
  showTrendLine,
  selectedTimeRange,
  regressionStartValue,
  regressionEndValue,
  movingAverageData,
  selectedColumnIndex,
  maWindow,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [popup, setPopup] = useState<{ x: number; y: number; timestamp: number; value: number } | null>(null);
  const [popupText, setPopupText] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredAggregation, setHoveredAggregation] = useState<{ id: string; x: number; y: number; annotations: Annotation[] } | null>(null);
  const [expandedAggregations, setExpandedAggregations] = useState<Set<string>>(new Set());
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);

  const margin = { top: 20, right: 20, bottom: 40, left: 60 };

  const dataColumns = columns.slice(1);

  const visibleData = useMemo(() => {
    return data.filter(d => d.timestamp >= timeRange.start && d.timestamp <= timeRange.end);
  }, [data, timeRange]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(300, rect.width),
          height: Math.max(300, rect.height),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const innerWidth = dimensions.width - margin.left - margin.right;
  const innerHeight = dimensions.height - margin.top - margin.bottom;

  const xScale = useMemo(() => {
    const domain = data.length > 1
      ? d3.extent(data, d => d.timestamp) as [number, number]
      : [Date.now() - 86400000, Date.now()];
    return d3.scaleTime()
      .domain(domain)
      .range([0, innerWidth]);
  }, [data, innerWidth]);

  const yScale = useMemo(() => {
    if (visibleData.length === 0 || dataColumns.length === 0) {
      return d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);
    }

    let yMin = Infinity;
    let yMax = -Infinity;

    dataColumns.forEach((_, colIdx) => {
      if (!hiddenColumns.has(colIdx)) {
        visibleData.forEach(d => {
          const val = d.values[colIdx];
          if (val < yMin) yMin = val;
          if (val > yMax) yMax = val;
        });
      }
    });

    if (movingAverageData.length > 0) {
      movingAverageData.forEach(d => {
        if (d.value < yMin) yMin = d.value;
        if (d.value > yMax) yMax = d.value;
      });
    }

    if (!isFinite(yMin) || !isFinite(yMax)) {
      yMin = 0;
      yMax = 1;
    }

    const padding = (yMax - yMin) * 0.05;
    return d3.scaleLinear()
      .domain([yMin - padding, yMax + padding])
      .range([innerHeight, 0]);
  }, [visibleData, dataColumns, hiddenColumns, innerHeight, movingAverageData]);

  const aggregatedAnnotations = useMemo(() => {
    if (annotations.length === 0) return { clusters: [], singles: [] };

    const sorted = [...annotations].sort((a, b) => a.timestamp - b.timestamp);
    const clusters: { id: string; timestamp: number; value: number; annotations: Annotation[] }[] = [];
    const singles: Annotation[] = [];

    let currentCluster: Annotation[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const prevX = xScale(currentCluster[0].timestamp);
      const currX = xScale(sorted[i].timestamp);

      if (Math.abs(currX - prevX) <= AGGREGATION_PIXEL_THRESHOLD) {
        currentCluster.push(sorted[i]);
      } else {
        if (currentCluster.length >= AGGREGATION_COUNT_THRESHOLD) {
          const avgTimestamp = currentCluster.reduce((sum, a) => sum + a.timestamp, 0) / currentCluster.length;
          const avgValue = currentCluster.reduce((sum, a) => sum + a.value, 0) / currentCluster.length;
          clusters.push({
            id: `cluster-${currentCluster[0].id}`,
            timestamp: avgTimestamp,
            value: avgValue,
            annotations: [...currentCluster],
          });
        } else {
          singles.push(...currentCluster);
        }
        currentCluster = [sorted[i]];
      }
    }

    if (currentCluster.length >= AGGREGATION_COUNT_THRESHOLD) {
      const avgTimestamp = currentCluster.reduce((sum, a) => sum + a.timestamp, 0) / currentCluster.length;
      const avgValue = currentCluster.reduce((sum, a) => sum + a.value, 0) / currentCluster.length;
      clusters.push({
        id: `cluster-${currentCluster[0].id}`,
        timestamp: avgTimestamp,
        value: avgValue,
        annotations: [...currentCluster],
      });
    } else {
      singles.push(...currentCluster);
    }

    return { clusters, singles };
  }, [annotations, xScale]);

  const lineGenerator = useMemo(() => {
    return d3.line<DataPoint>()
      .x(d => xScale(d.timestamp))
      .y((d, idx, arr) => {
        const colIdx = (arr as any).__colIdx || 0;
        return yScale(d.values[colIdx]);
      })
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  const maLineGenerator = useMemo(() => {
    return d3.line<MovingAveragePoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
  }, [xScale, yScale]);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || visibleData.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left - margin.left;
    const y = event.clientY - rect.top - margin.top;

    if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) {
      setCrosshair(null);
      setTooltip(null);
      return;
    }

    setCrosshair({ x, y });

    const mouseTimestamp = xScale.invert(x).getTime();

    let closestPoint: DataPoint | null = null;
    let closestDistance = Infinity;
    let closestColIdx = 0;

    for (let colIdx = 0; colIdx < dataColumns.length; colIdx++) {
      if (hiddenColumns.has(colIdx)) continue;

      const bisector = d3.bisector<DataPoint, number>(d => d.timestamp).left;
      const idx = bisector(visibleData, mouseTimestamp);
      
      const candidates = [];
      if (idx > 0) candidates.push(visibleData[idx - 1]);
      if (idx < visibleData.length) candidates.push(visibleData[idx]);

      for (const point of candidates) {
        const dist = Math.abs(point.timestamp - mouseTimestamp);
        if (dist < closestDistance) {
          closestDistance = dist;
          closestPoint = point;
          closestColIdx = colIdx;
        }
      }
    }

    if (closestPoint) {
      const pointX = xScale(closestPoint.timestamp);
      const pointY = yScale(closestPoint.values[closestColIdx]);
      
      let content = `<div style="font-weight:600;margin-bottom:4px">${formatTime(closestPoint.timestamp)}</div>`;
      
      dataColumns.forEach((col, idx) => {
        if (hiddenColumns.has(idx)) return;
        const color = colorPalette[idx % colorPalette.length];
        content += `<div style="display:flex;align-items:center;gap:6px">
          <span style="width:8px;height:8px;border-radius:50%;background:${color}"></span>
          <span>${col}: ${closestPoint!.values[idx].toFixed(2)}</span>
        </div>`;
      });

      const tooltipX = event.clientX - rect.left + 15;
      const tooltipY = event.clientY - rect.top + 15;
      setTooltip({ x: tooltipX, y: tooltipY, content });
    }
  }, [xScale, yScale, visibleData, dataColumns, hiddenColumns, colorPalette, innerWidth, innerHeight, margin]);

  const handleMouseLeave = useCallback(() => {
    setCrosshair(null);
    setTooltip(null);
    setHoveredAggregation(null);
  }, []);

  const handleDoubleClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || visibleData.length === 0) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left - margin.left;
    const y = event.clientY - rect.top - margin.top;

    if (x < 0 || x > innerWidth || y < 0 || y > innerHeight) return;

    const timestamp = xScale.invert(x).getTime();
    const value = yScale.invert(y);

    const popupX = event.clientX - rect.left + 15;
    const popupY = event.clientY - rect.top + 15;

    setPopup({ x: popupX, y: popupY, timestamp, value });
    setPopupText('');
  }, [xScale, yScale, innerWidth, innerHeight, margin, visibleData]);

  const handleConfirmAnnotation = useCallback(() => {
    if (!popup) return;

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: popup.timestamp,
      value: popup.value,
      note: popupText.trim(),
      createdAt: Date.now(),
    };

    onAddAnnotation(newAnnotation);
    setPopup(null);
    setPopupText('');
  }, [popup, popupText, onAddAnnotation]);

  const handleCancelAnnotation = useCallback(() => {
    setPopup(null);
    setPopupText('');
  }, []);

  const handleAnnotationDragStart = useCallback((annotation: Annotation, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingId(annotation.id);
  }, []);

  const handleMouseMoveDrag = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingId || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left - margin.left;
    const y = event.clientY - rect.top - margin.top;

    const clampedX = Math.max(0, Math.min(innerWidth, x));
    const clampedY = Math.max(0, Math.min(innerHeight, y));

    const timestamp = xScale.invert(clampedX).getTime();
    const value = yScale.invert(clampedY);

    const annotation = annotations.find(a => a.id === draggingId);
    if (annotation) {
      onUpdateAnnotation({
        ...annotation,
        timestamp,
        value,
      });
    }
  }, [draggingId, xScale, yScale, innerWidth, innerHeight, margin, annotations, onUpdateAnnotation]);

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleAggregationClick = useCallback((clusterId: string) => {
    setExpandedAggregations(prev => {
      const next = new Set(prev);
      if (next.has(clusterId)) {
        next.delete(clusterId);
      } else {
        next.add(clusterId);
      }
      return next;
    });
  }, []);

  const handleAggregationHover = useCallback((cluster: typeof aggregatedAnnotations.clusters[0], e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;
    setHoveredAggregation({
      id: cluster.id,
      x,
      y,
      annotations: cluster.annotations,
    });
  }, []);

  const handleAggregationLeave = useCallback(() => {
    setHoveredAggregation(null);
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-annotation {
        0%, 100% { opacity: 1; r: 3; }
        50% { opacity: 0.6; r: 4; }
      }
      .annotation-point {
        animation: pulse-annotation 1.2s ease-in-out infinite;
      }
      @keyframes scale-in {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      .scale-in {
        animation: scale-in 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const xAxisTicks = useMemo(() => {
    if (visibleData.length === 0) return [];
    const ticks = xScale.ticks(6);
    return ticks;
  }, [xScale, visibleData]);

  const yAxisTicks = useMemo(() => {
    return yScale.ticks(5);
  }, [yScale]);

  return (
    <div ref={containerRef} className="chart-container" style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        className="chart-svg"
        onMouseMove={(e) => {
          handleMouseMove(e);
          if (draggingId) handleMouseMoveDrag(e);
        }}
        onMouseLeave={() => {
          handleMouseLeave();
          if (draggingId) handleMouseUp();
        }}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        <defs>
          <clipPath id="chart-clip">
            <rect x={0} y={0} width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>

        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <g className="grid-lines" opacity={0.1}>
            {yAxisTicks.map((tick, i) => (
              <line
                key={`grid-h-${i}`}
                x1={0}
                y1={yScale(tick)}
                x2={innerWidth}
                y2={yScale(tick)}
                stroke="#999"
                strokeWidth={1}
              />
            ))}
            {xAxisTicks.map((tick, i) => (
              <line
                key={`grid-v-${i}`}
                x1={xScale(tick)}
                y1={0}
                x2={xScale(tick)}
                y2={innerHeight}
                stroke="#999"
                strokeWidth={1}
              />
            ))}
          </g>

          <g clipPath="url(#chart-clip)">
            {dataColumns.map((col, colIdx) => {
              if (hiddenColumns.has(colIdx)) return null;
              const color = colorPalette[colIdx % colorPalette.length];
              const lineData = [...visibleData];
              (lineData as any).__colIdx = colIdx;
              const path = lineGenerator(lineData);
              return (
                <path
                  key={`line-${col}`}
                  d={path || ''}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  className="line-path"
                />
              );
            })}

            {movingAverageData.length > 0 && (
              <path
                d={maLineGenerator(movingAverageData) || ''}
                fill="none"
                stroke={colorPalette[selectedColumnIndex % colorPalette.length]}
                strokeWidth={1.5}
                opacity={0.7}
              />
            )}

            {showTrendLine && data.length > 1 && (
              <line
                x1={xScale(selectedTimeRange.start)}
                y1={yScale(regressionStartValue)}
                x2={xScale(selectedTimeRange.end)}
                y2={yScale(regressionEndValue)}
                stroke={colorPalette[selectedColumnIndex % colorPalette.length]}
                strokeWidth={1.5}
                strokeDasharray="6,4"
              />
            )}

            {aggregatedAnnotations.singles.map(annotation => {
              const cx = xScale(annotation.timestamp);
              const cy = yScale(annotation.value);
              
              return (
                <g key={annotation.id} className="scale-in">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#ff4d4f"
                    className="annotation-point"
                    style={{ cursor: 'grab' }}
                    onMouseDown={(e) => handleAnnotationDragStart(annotation, e)}
                  />
                  {annotation.note && (
                    <g>
                      <rect
                        x={cx - annotation.note.length * 4 - 4}
                        y={cy - 28}
                        width={annotation.note.length * 8 + 8}
                        height={18}
                        fill="#fffbe6"
                        rx={4}
                        ry={4}
                        style={{
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                        }}
                      />
                      <text
                        x={cx}
                        y={cy - 15}
                        textAnchor="middle"
                        fontSize="11"
                        fill="#333"
                      >
                        {annotation.note.length > 20 ? annotation.note.slice(0, 20) + '...' : annotation.note}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {aggregatedAnnotations.clusters.map(cluster => {
              const isExpanded = expandedAggregations.has(cluster.id);
              
              if (isExpanded) {
                return cluster.annotations.map((annotation, idx) => {
                  const cx = xScale(annotation.timestamp) + (idx - Math.floor(cluster.annotations.length / 2)) * 8;
                  const cy = yScale(annotation.value);
                  
                  return (
                    <g key={`expanded-${annotation.id}`} className="scale-in">
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#ff4d4f"
                        className="annotation-point"
                        style={{ cursor: 'grab' }}
                        onMouseDown={(e) => handleAnnotationDragStart(annotation, e)}
                      />
                    </g>
                  );
                });
              }

              const cx = xScale(cluster.timestamp);
              const cy = yScale(cluster.value);

              return (
                <g
                  key={cluster.id}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAggregationClick(cluster.id);
                  }}
                  onMouseEnter={(e) => handleAggregationHover(cluster, e)}
                  onMouseLeave={handleAggregationLeave}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={12}
                    fill="#b81d1d"
                    className="scale-in"
                  />
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="#fff"
                  >
                    {cluster.annotations.length}
                  </text>
                </g>
              );
            })}
          </g>

          <g className="x-axis" transform={`translate(0, ${innerHeight})`}>
            {xAxisTicks.map((tick, i) => (
              <g key={`x-tick-${i}`}>
                <line
                  x1={xScale(tick)}
                  y1={0}
                  x2={xScale(tick)}
                  y2={6}
                  stroke="#444"
                />
                <text
                  x={xScale(tick)}
                  y={20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#999"
                >
                  {formatTime(tick.getTime())}
                </text>
              </g>
            ))}
            <line
              x1={0}
              y1={0}
              x2={innerWidth}
              y2={0}
              stroke="#444"
            />
          </g>

          <g className="y-axis">
            {yAxisTicks.map((tick, i) => (
              <g key={`y-tick-${i}`}>
                <line
                  x1={-6}
                  y1={yScale(tick)}
                  x2={0}
                  y2={yScale(tick)}
                  stroke="#444"
                />
                <text
                  x={-10}
                  y={yScale(tick) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#999"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            ))}
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={innerHeight}
              stroke="#444"
            />
          </g>

          {crosshair && (
            <g className="crosshair" pointerEvents="none">
              <line
                x1={crosshair.x}
                y1={0}
                x2={crosshair.x}
                y2={innerHeight}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <line
                x1={0}
                y1={crosshair.y}
                x2={innerWidth}
                y2={crosshair.y}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            </g>
          )}
        </g>
      </svg>

      {tooltip && (
        <div
          className="tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}

      {popup && (
        <div
          className="annotation-popup"
          style={{
            left: popup.x,
            top: popup.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-title">添加标注</div>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
            时间: {formatTime(popup.timestamp)} | 数值: {popup.value.toFixed(2)}
          </div>
          <textarea
            className="popup-textarea"
            value={popupText}
            onChange={(e) => setPopupText(e.target.value.slice(0, 100))}
            placeholder="输入备注内容..."
            autoFocus
            maxLength={100}
          />
          <div className="popup-char-count">
            {popupText.length}/100
          </div>
          <div className="popup-buttons">
            <button className="btn btn-secondary" onClick={handleCancelAnnotation}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleConfirmAnnotation}>
              确认
            </button>
          </div>
        </div>
      )}

      {hoveredAggregation && (
        <div
          className="aggregation-tooltip"
          style={{
            left: hoveredAggregation.x,
            top: hoveredAggregation.y,
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>
            聚合标注 ({hoveredAggregation.annotations.length}个)
          </div>
          {hoveredAggregation.annotations.map(a => (
            <div key={a.id} className="aggregation-item">
              <div className="aggregation-time">{formatTime(a.timestamp)}</div>
              <div className="aggregation-note">
                {a.note || '(无备注)'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LineChart;
