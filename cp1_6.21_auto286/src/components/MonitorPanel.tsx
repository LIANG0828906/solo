import React, { useState, useRef } from 'react';
import {
  EcoState,
  HistoryPoint,
  CreatureType,
  CREATURE_NAMES,
  CREATURE_COLORS,
} from '../types';

interface MonitorPanelProps {
  state: EcoState;
  history: HistoryPoint[];
}

export const MonitorPanel: React.FC<MonitorPanelProps> = ({ state, history }) => {
  const [hoveredPoint, setHoveredPoint] = useState<HistoryPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const totalResources = state.resources.sunlight + state.resources.water + state.resources.nutrients;
  const totalPopulation = Object.values(state.population).reduce((a, b) => a + b, 0);

  const chartWidth = 260;
  const chartHeight = 180;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxPopulation = Math.max(
    ...history.flatMap((h) => Object.values(h.population)),
    10
  );

  const creatureTypes = [
    CreatureType.PRODUCER,
    CreatureType.PRIMARY_CONSUMER,
    CreatureType.SECONDARY_CONSUMER,
    CreatureType.DECOMPOSER,
  ];

  const generatePath = (type: CreatureType): string => {
    if (history.length < 2) return '';
    return history
      .map((point, i) => {
        const x = padding.left + (i / (history.length - 1)) * innerWidth;
        const y =
          padding.top +
          innerHeight -
          (point.population[type] / maxPopulation) * innerHeight;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || history.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - padding.left;
    const index = Math.round((x / innerWidth) * (history.length - 1));
    if (index >= 0 && index < history.length) {
      setHoveredPoint(history[index]);
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const dataSectionStyle: React.CSSProperties = {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  };

  const labelStyle: React.CSSProperties = {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  };

  const valueStyle: React.CSSProperties = {
    color: '#E2E8F0',
    fontSize: 14,
    fontFamily: 'monospace',
  };

  return (
    <div
      style={{
        width: 300,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: 20,
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        backdropFilter: 'blur(10px)',
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          color: '#E2E8F0',
          fontSize: 16,
          margin: 0,
          marginBottom: 16,
          fontFamily: 'monospace',
          letterSpacing: 1,
        }}
      >
        数据监控
      </h2>

      <div style={dataSectionStyle}>
        <div style={labelStyle}>帧计数</div>
        <div style={valueStyle}>{state.frameCount}</div>
        <div style={{ ...labelStyle, marginTop: 12 }}>运行状态</div>
        <div
          style={{
            ...valueStyle,
            color: state.isRunning ? '#22C55E' : '#F59E0B',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: state.isRunning ? '#22C55E' : '#F59E0B',
              animation: state.isRunning ? 'pulse 1s infinite' : 'none',
            }}
          />
          {state.isRunning ? '运行中' : '已暂停'}
        </div>
        <div style={{ ...labelStyle, marginTop: 12 }}>总生物量</div>
        <div style={valueStyle}>{totalPopulation}</div>
      </div>

      <div style={dataSectionStyle}>
        <div style={{ ...labelStyle, marginBottom: 12 }}>种群数量</div>
        {creatureTypes.map((type) => (
          <div
            key={type}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: CREATURE_COLORS[type],
                  boxShadow: `0 0 6px ${CREATURE_COLORS[type]}`,
                }}
              />
              <span style={labelStyle}>{CREATURE_NAMES[type]}</span>
            </div>
            <span style={valueStyle}>{state.population[type]}</span>
          </div>
        ))}
      </div>

      <div style={dataSectionStyle}>
        <div style={{ ...labelStyle, marginBottom: 12 }}>平均寿命</div>
        {creatureTypes.map((type) => (
          <div
            key={type}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <span style={labelStyle}>{CREATURE_NAMES[type]}</span>
            <span style={valueStyle}>
              {state.avgLifespan[type].toFixed(1)}
            </span>
          </div>
        ))}
      </div>

      <div style={dataSectionStyle}>
        <div style={{ ...labelStyle, marginBottom: 12 }}>资源状态</div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span style={labelStyle}>☀ 阳光</span>
          <span style={{ ...valueStyle, color: '#FBBF24' }}>
            {state.resources.sunlight.toFixed(0)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span style={labelStyle}>💧 水分</span>
          <span style={{ ...valueStyle, color: '#60A5FA' }}>
            {state.resources.water.toFixed(0)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <span style={labelStyle}>🌱 养分</span>
          <span style={{ ...valueStyle, color: '#34D399' }}>
            {state.resources.nutrients.toFixed(0)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
          }}
        >
          <span style={labelStyle}>总资源量</span>
          <span style={valueStyle}>{totalResources.toFixed(0)}</span>
        </div>
      </div>

      <div>
        <div style={{ ...labelStyle, marginBottom: 12 }}>种群趋势 (最近100帧)</div>
        <div style={{ position: 'relative' }}>
          <svg
            ref={svgRef}
            width={chartWidth}
            height={chartHeight}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: 'crosshair' }}
          >
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + innerHeight}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={1}
            />
            <line
              x1={padding.left}
              y1={padding.top + innerHeight}
              x2={padding.left + innerWidth}
              y2={padding.top + innerHeight}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth={1}
            />

            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <text
                key={i}
                x={padding.left - 5}
                y={padding.top + innerHeight - ratio * innerHeight + 4}
                fill="rgba(255, 255, 255, 0.4)"
                fontSize={10}
                fontFamily="monospace"
                textAnchor="end"
              >
                {Math.round(maxPopulation * ratio)}
              </text>
            ))}

            {creatureTypes.map((type) => (
              <path
                key={type}
                d={generatePath(type)}
                fill="none"
                stroke={CREATURE_COLORS[type]}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            ))}

            {hoveredPoint && (
              <line
                x1={
                  padding.left +
                  ((history.indexOf(hoveredPoint) / (history.length - 1)) *
                    innerWidth)
                }
                y1={padding.top}
                x2={
                  padding.left +
                  ((history.indexOf(hoveredPoint) / (history.length - 1)) *
                    innerWidth)
                }
                y2={padding.top + innerHeight}
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            )}
          </svg>

          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(mousePos.x + 10, chartWidth - 140),
                top: Math.min(mousePos.y - 80, chartHeight - 120),
                background: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 6,
                padding: 8,
                pointerEvents: 'none',
                fontSize: 11,
                fontFamily: 'monospace',
                minWidth: 130,
                zIndex: 10,
              }}
            >
              <div style={{ color: '#94A3B8', marginBottom: 6 }}>
                帧 #{hoveredPoint.frame}
              </div>
              {creatureTypes.map((type) => (
                <div
                  key={type}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginBottom: 2,
                  }}
                >
                  <span style={{ color: CREATURE_COLORS[type] }}>
                    {CREATURE_NAMES[type]}
                  </span>
                  <span style={{ color: '#E2E8F0' }}>
                    {hoveredPoint.population[type]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
          }}
        >
          {creatureTypes.map((type) => (
            <div
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                color: '#94A3B8',
                fontFamily: 'monospace',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 2,
                  background: CREATURE_COLORS[type],
                }}
              />
              {CREATURE_NAMES[type]}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
