import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWindStore, WindTurbineData } from '@/store/windStore';

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  turbine: WindTurbineData | null;
}

export const SidePanel: React.FC = () => {
  const turbines = useWindStore((s) => s.turbines);
  const totalPowerOutput = useWindStore((s) => s.totalPowerOutput);
  const healthyCount = useWindStore((s) => s.healthyCount);
  const faultyCount = useWindStore((s) => s.faultyCount);
  const isWindFluctuation = useWindStore((s) => s.isWindFluctuation);
  const selectedTurbineId = useWindStore((s) => s.selectedTurbineId);
  const selectTurbine = useWindStore((s) => s.selectTurbine);

  const [displayedPower, setDisplayedPower] = useState(totalPowerOutput);
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    turbine: null,
  });
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedPower((prev) => {
        const diff = totalPowerOutput - prev;
        if (Math.abs(diff) < 0.5) return totalPowerOutput;
        return prev + diff * 0.15;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [totalPowerOutput]);

  const selectedTurbine = turbines.find((t) => t.id === selectedTurbineId) || null;

  const maxWindSpeed = useMemo(
    () => Math.max(...turbines.map((t) => t.windSpeed), 1),
    [turbines]
  );
  const chartWidth = 310;
  const chartHeight = 160;
  const padding = { top: 20, right: 15, bottom: 30, left: 35 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const points = useMemo(
    () =>
      turbines.map((t, i) => {
        const x = padding.left + (i / (turbines.length - 1)) * innerWidth;
        const y =
          padding.top + innerHeight - (t.windSpeed / (maxWindSpeed * 1.2)) * innerHeight;
        return { x, y, turbine: t };
      }),
    [turbines, maxWindSpeed, innerWidth, innerHeight]
  );

  const pathD = useMemo(() => {
    return points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx1 = prev.x + (p.x - prev.x) / 3;
      const cpx2 = prev.x + ((p.x - prev.x) * 2) / 3;
      return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
    }, '');
  }, [points]);

  const gradientId = 'windSpeedGradient';
  const areaGradientId = 'areaGradient';

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closest = null as null | { point: typeof points[0]; dist: number };
    points.forEach((p) => {
      const dist = Math.sqrt(Math.pow(p.x - mouseX, 2) + Math.pow(p.y - mouseY, 2));
      if (!closest || dist < closest.dist) closest = { point: p, dist };
    });

    if (closest && closest.dist < 35) {
      setTooltip({
        visible: true,
        x: closest.point.x,
        y: closest.point.y,
        turbine: closest.point.turbine,
      });
      setHoveredPointId(closest.point.turbine.id);
    } else {
      setTooltip({ visible: false, x: 0, y: 0, turbine: null });
      setHoveredPointId(null);
    }
  };

  const handlePointClick = (turbine: WindTurbineData) => {
    selectTurbine(selectedTurbineId === turbine.id ? null : turbine.id);
  };

  const handlePointHover = (turbine: WindTurbineData, x: number, y: number) => {
    setTooltip({
      visible: true,
      x,
      y,
      turbine,
    });
    setHoveredPointId(turbine.id);
  };

  const handlePointLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, turbine: null });
    setHoveredPointId(null);
  };

  return (
    <div className="side-panel">
      <div>
        <h1 className="panel-title">Wind Farm Monitor</h1>
        <p className="panel-subtitle">Real-time 3D visualization dashboard</p>
      </div>

      {isWindFluctuation && (
        <div className="fluctuation-indicator">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          Wind fluctuation event active
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
          <div className="stat-label">Total Power Output</div>
          <div>
            <span className="stat-value">{displayedPower.toFixed(1)}</span>
            <span className="stat-unit">kW</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Healthy</div>
          <div>
            <span className="stat-value healthy">{healthyCount}</span>
            <span className="stat-unit">units</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Faulty</div>
          <div>
            <span className="stat-value faulty">{faultyCount}</span>
            <span className="stat-unit">units</span>
          </div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-title">Wind Speed Distribution</div>
        <div className="chart-container">
          <svg
            ref={svgRef}
            width={chartWidth}
            height={chartHeight}
            onMouseMove={handleMouseMove}
            onMouseLeave={handlePointLeave}
            style={{ overflow: 'visible' }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00d4ff" />
                <stop offset="50%" stopColor="#66e0ff" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
              <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding.left}
                y1={padding.top + innerHeight * (1 - ratio)}
                x2={chartWidth - padding.right}
                y2={padding.top + innerHeight * (1 - ratio)}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
            ))}

            {[0, 0.5, 1].map((ratio, i) => (
              <text
                key={i}
                x={padding.left - 8}
                y={padding.top + innerHeight * (1 - ratio) + 4}
                fill="rgba(255,255,255,0.35)"
                fontSize="10"
                textAnchor="end"
              >
                {(maxWindSpeed * 1.2 * ratio).toFixed(0)}
              </text>
            ))}

            {[0, Math.floor(turbines.length / 2), turbines.length - 1].map((idx) => (
              <text
                key={idx}
                x={padding.left + (idx / (turbines.length - 1)) * innerWidth}
                y={chartHeight - padding.bottom + 18}
                fill="rgba(255,255,255,0.35)"
                fontSize="10"
                textAnchor="middle"
              >
                #{idx + 1}
              </text>
            ))}

            <path
              d={`${pathD} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`}
              fill={`url(#${areaGradientId})`}
              style={{ transition: 'd 0.6s ease' }}
            />

            <path
              d={pathD}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ transition: 'd 0.6s ease' }}
            />

            {points.map((p) => (
              <g key={p.turbine.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={
                    selectedTurbineId === p.turbine.id
                      ? 8
                      : hoveredPointId === p.turbine.id
                      ? 6
                      : 4
                  }
                  fill="#1a1a2e"
                  stroke={
                    selectedTurbineId === p.turbine.id
                      ? '#00d4ff'
                      : hoveredPointId === p.turbine.id
                      ? '#66e0ff'
                      : p.turbine.healthStatus === 'healthy'
                      ? '#4ade80'
                      : '#f87171'
                  }
                  strokeWidth={
                    selectedTurbineId === p.turbine.id
                      ? 3
                      : hoveredPointId === p.turbine.id
                      ? 2.5
                      : 1.5
                  }
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    filter: hoveredPointId === p.turbine.id ? 'drop-shadow(0 0 6px rgba(0,212,255,0.6))' : 'none',
                  }}
                  onClick={() => handlePointClick(p.turbine)}
                  onMouseEnter={() => handlePointHover(p.turbine, p.x, p.y)}
                  onMouseLeave={handlePointLeave}
                />
              </g>
            ))}

            <text
              x={padding.left - 30}
              y={padding.top - 8}
              fill="rgba(255,255,255,0.3)"
              fontSize="9"
            >
              m/s
            </text>
          </svg>

          {tooltip.visible && tooltip.turbine && (
            <div
              className="chart-tooltip"
              style={{
                left: Math.min(tooltip.x + 15, chartWidth - 130),
                top: tooltip.y - 55,
                opacity: 1,
                transform: 'translateY(0)',
                transition: 'opacity 0.15s ease, transform 0.15s ease',
              }}
            >
              <div className="tooltip-id">Turbine #{tooltip.turbine.index + 1}</div>
              <div className="tooltip-value">
                <span style={{ color: '#66e0ff', fontWeight: 600 }}>
                  {tooltip.turbine.windSpeed.toFixed(2)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 2 }}>m/s</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 6px' }}>|</span>
                <span style={{ color: '#fb923c', fontWeight: 600 }}>
                  {tooltip.turbine.powerOutput.toFixed(1)}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.6)', marginLeft: 2 }}>%</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                Status:{' '}
                <span
                  style={{
                    color: tooltip.turbine.healthStatus === 'healthy' ? '#4ade80' : '#f87171',
                    fontWeight: 500,
                  }}
                >
                  {tooltip.turbine.healthStatus === 'healthy' ? 'Operational' : 'Faulty'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTurbine && (
        <div className="detail-overlay">
          <div className="detail-header">
            <span className="detail-title">Turbine #{selectedTurbine.index + 1}</span>
            <button
              className="detail-close"
              onClick={() => selectTurbine(null)}
              style={{
                transform: 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginBottom: 14 }}>
            <span className={`status-badge ${selectedTurbine.healthStatus}`}>
              <span className="status-dot" />
              {selectedTurbine.healthStatus === 'healthy' ? 'Operational' : 'Fault Detected'}
            </span>
          </div>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-item-label">Wind Speed</div>
              <div className="detail-item-value wind">
                {selectedTurbine.windSpeed.toFixed(2)}
                <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.6, marginLeft: 3 }}>
                  m/s
                </span>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Power</div>
              <div className="detail-item-value power">
                {selectedTurbine.powerOutput.toFixed(1)}
                <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.6, marginLeft: 3 }}>%</span>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Rotation</div>
              <div className="detail-item-value">
                {selectedTurbine.rotationSpeed.toFixed(2)}
                <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.6, marginLeft: 3 }}>°/f</span>
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-item-label">Position</div>
              <div className="detail-item-value" style={{ fontSize: 14 }}>
                ({selectedTurbine.position.x.toFixed(0)}, {selectedTurbine.position.z.toFixed(0)})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
