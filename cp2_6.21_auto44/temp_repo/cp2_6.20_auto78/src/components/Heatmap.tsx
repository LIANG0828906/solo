import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  HeatmapDataPoint,
  Platform,
  platformColors,
  platformNames,
  useDataStore,
} from '../store/useDataStore';

interface HeatmapProps {
  data: HeatmapDataPoint[];
}

const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const { setSelectedHeatpoint, selectedHeatpoint } = useDataStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 250 });
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);

  const platforms = useMemo(() => {
    const unique = [...new Set(data.map(d => d.platform))];
    return unique;
  }, [data]);

  const times = useMemo(() => {
    const unique = [...new Set(data.map(d => d.time))];
    return unique;
  }, [data]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width - 20, 300),
          height: Math.max(rect.height - 120, 150),
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxValue = useMemo(() => {
    return Math.max(...data.map(d => d.value));
  }, [data]);

  const getColor = (value: number, platform: Platform) => {
    const intensity = value / maxValue;
    const baseColor = platformColors[platform];
    const alpha = 0.25 + intensity * 0.75;
    return hexToRgba(baseColor, alpha);
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const handleCellClick = (point: HeatmapDataPoint) => {
    setSelectedHeatpoint(
      selectedHeatpoint?.time === point.time && selectedHeatpoint?.platform === point.platform
        ? null
        : point
    );
  };

  const cellWidth = dimensions.width / times.length;
  const cellHeight = dimensions.height / platforms.length;
  const leftPadding = 60;
  const topPadding = 25;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1e293b',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes cellFadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .heatmap-cell {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .heatmap-cell:hover {
          filter: brightness(1.3);
        }
        .heatmap-cell.selected {
          stroke: #fff;
          stroke-width: 2;
        }
      `}</style>
      
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '12px',
          color: '#e2e8f0',
        }}
      >
        平台热力分布
      </h3>
      
      <div ref={containerRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <svg
          width={dimensions.width + leftPadding}
          height={dimensions.height + topPadding}
          style={{ overflow: 'visible' }}
        >
          {times.map((time, i) => (
            <text
              key={`time-${i}`}
              x={leftPadding + i * cellWidth + cellWidth / 2}
              y={topPadding - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
              {time}
            </text>
          ))}
          
          {platforms.map((platform, j) => (
            <text
              key={`platform-${j}`}
              x={leftPadding - 10}
              y={topPadding + j * cellHeight + cellHeight / 2 + 4}
              textAnchor="end"
              fontSize="11"
              fill="#94a3b8"
            >
              {platformNames[platform]}
            </text>
          ))}
          
          {data.map((point, index) => {
            const i = times.indexOf(point.time);
            const j = platforms.indexOf(point.platform);
            const isSelected = selectedHeatpoint?.time === point.time && 
                             selectedHeatpoint?.platform === point.platform;
            const isHovered = hoveredCell?.time === point.time && 
                            hoveredCell?.platform === point.platform;
            
            return (
              <rect
                key={`cell-${index}`}
                className={`heatmap-cell ${isSelected ? 'selected' : ''}`}
                x={leftPadding + i * cellWidth + 1}
                y={topPadding + j * cellHeight + 1}
                width={cellWidth - 2}
                height={cellHeight - 2}
                rx={3}
                ry={3}
                fill={getColor(point.value, point.platform)}
                style={{
                  animation: 'cellFadeIn 0.5s ease forwards',
                  animationDelay: `${(i + j) * 30}ms`,
                  opacity: 0,
                }}
                onMouseEnter={() => setHoveredCell(point)}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => handleCellClick(point)}
              />
            );
          })}
        </svg>
        
        {hoveredCell && (
          <div
            style={{
              position: 'absolute',
              left: leftPadding + times.indexOf(hoveredCell.time) * cellWidth + cellWidth / 2,
              top: topPadding + platforms.indexOf(hoveredCell.platform) * cellHeight - 10,
              transform: 'translate(-50%, -100%)',
              background: 'rgba(15, 25, 35, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              padding: '10px',
              color: '#e2e8f0',
              fontSize: '12px',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ marginBottom: '4px', fontWeight: 600 }}>
              {platformNames[hoveredCell.platform]} · {hoveredCell.time}
            </div>
            <div>
              词频密度: 
              <span style={{ color: platformColors[hoveredCell.platform], fontWeight: 600 }}>
                {' '}{hoveredCell.value}
              </span>
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
              点击查看热词详情
            </div>
          </div>
        )}
      </div>

      {selectedHeatpoint && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '6px',
            fontSize: '12px',
            borderLeft: `3px solid ${platformColors[selectedHeatpoint.platform]}`,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px', color: platformColors[selectedHeatpoint.platform] }}>
            {platformNames[selectedHeatpoint.platform]} · {selectedHeatpoint.time} 热词 TOP5
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {selectedHeatpoint.words.slice(0, 5).map((w, i) => (
              <span
                key={i}
                style={{
                  padding: '3px 10px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {w.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Heatmap;
