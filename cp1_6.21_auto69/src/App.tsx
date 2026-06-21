import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import EarthScene from './EarthScene';
import InfoPanel from './InfoPanel';
import {
  generateEarthquakes,
  filterByTimeRange,
  formatDate,
  type Earthquake,
  type TimeRange,
} from './quakeData';
import { createInteractionManager } from './interaction';

function TimelineSlider({
  timeRange,
  onRangeChange,
}: {
  timeRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  totalCount: number;
  filteredCount: number;
}) {
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const allEarthquakes = useMemo(() => generateEarthquakes(), []);
  const baseStart = allEarthquakes[0].timestamp;
  const baseEnd = allEarthquakes[allEarthquakes.length - 1].timestamp;
  const fullRange = baseEnd - baseStart;

  const startPos = ((timeRange.start - baseStart) / fullRange) * 100;
  const endPos = ((timeRange.end - baseStart) / fullRange) * 100;

  const handleMouseDown = useCallback(
    (handle: 'start' | 'end') => (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(handle);
    },
    []
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const clickedTime = baseStart + x * fullRange;

      if (dragging === 'start') {
        onRangeChange({
          start: Math.min(clickedTime, timeRange.end - 24 * 60 * 60 * 1000),
          end: timeRange.end,
        });
      } else {
        onRangeChange({
          start: timeRange.start,
          end: Math.max(clickedTime, timeRange.start + 24 * 60 * 60 * 1000),
        });
      }
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, timeRange, onRangeChange, baseStart, fullRange]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '48px',
        background: 'rgba(26, 26, 46, 0.85)',
        backdropFilter: 'blur(8px)',
        borderRadius: '24px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        zIndex: 100,
      }}
    >
      <span
        style={{
          fontSize: '12px',
          color: '#888',
          marginRight: '12px',
          whiteSpace: 'nowrap',
          minWidth: '80px',
        }}
      >
        {formatDate(timeRange.start)}
      </span>

      <div
        ref={trackRef}
        style={{
          flex: 1,
          height: '6px',
          borderRadius: '3px',
          background: 'linear-gradient(to right, #16213e, #0f3460)',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${startPos}%`,
            width: `${endPos - startPos}%`,
            height: '100%',
            borderRadius: '3px',
            background: 'linear-gradient(to right, #00ff88, #ff0044)',
            opacity: 0.6,
          }}
        />

        <div
          onMouseDown={handleMouseDown('start')}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${startPos}%`,
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#e94560',
            cursor: 'grab',
            transition: 'box-shadow 0.15s',
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 12px #e94560';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        />

        <div
          onMouseDown={handleMouseDown('end')}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${endPos}%`,
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#e94560',
            cursor: 'grab',
            transition: 'box-shadow 0.15s',
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 12px #e94560';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        />
      </div>

      <span
        style={{
          fontSize: '12px',
          color: '#888',
          marginLeft: '12px',
          whiteSpace: 'nowrap',
          minWidth: '80px',
          textAlign: 'right',
        }}
      >
        {formatDate(timeRange.end)}
      </span>
    </div>
  );
}

export default function App() {
  const allEarthquakes = useMemo(() => generateEarthquakes(), []);
  const [interaction] = useState(() => createInteractionManager());
  const [selectedQuake, setSelectedQuake] = useState<Earthquake | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const baseStart = allEarthquakes[0].timestamp;
  const baseEnd = allEarthquakes[allEarthquakes.length - 1].timestamp;

  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: baseStart,
    end: baseEnd,
  });

  const filteredEarthquakes = useMemo(
    () => filterByTimeRange(allEarthquakes, timeRange),
    [allEarthquakes, timeRange]
  );

  useEffect(() => {
    interaction.setCallback((state) => {
      if (state.selectedQuake) {
        setSelectedQuake(state.selectedQuake);
      }
      if (state.hoveredQuakeId !== undefined) {
        setHoveredId(state.hoveredQuakeId);
      }
    });
  }, [interaction]);

  const handleClosePanel = useCallback(() => {
    interaction.closePanel();
    setSelectedQuake(null);
  }, [interaction]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0b1a', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '24px',
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#e0e0e0',
            marginBottom: '4px',
          }}
        >
          3D 地震活动时空可视化
        </div>
        <div style={{ fontSize: '13px', color: '#888' }}>
          当前显示 {filteredEarthquakes.length} / {allEarthquakes.length} 条地震记录
        </div>
      </div>

      <EarthScene
        earthquakes={filteredEarthquakes}
        interaction={interaction}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
      />

      <TimelineSlider
        timeRange={timeRange}
        onRangeChange={setTimeRange}
        totalCount={allEarthquakes.length}
        filteredCount={filteredEarthquakes.length}
      />

      {selectedQuake && <InfoPanel quake={selectedQuake} onClose={handleClosePanel} />}
    </div>
  );
}
