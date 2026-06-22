import { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { renderMap, createMarkersFromNotes } from '../utils/mapRenderer';

export default function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const notes = useAppStore((state) => state.notes);
  const mapZoom = useAppStore((state) => state.mapZoom);
  const mapOffset = useAppStore((state) => state.mapOffset);
  const setMapZoom = useAppStore((state) => state.setMapZoom);
  const setMapOffset = useAppStore((state) => state.setMapOffset);
  const filterFamily = useAppStore((state) => state.filterFamily);
  const setFilterFamily = useAppStore((state) => state.setFilterFamily);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0 });
  const animationRef = useRef<number | null>(null);

  const markers = createMarkersFromNotes(notes);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const displayMarkers = filterFamily
      ? markers.filter((m) => m.family === filterFamily)
      : markers;

    renderMap({
      ctx,
      width: rect.width,
      height: rect.height,
      markers: displayMarkers,
      zoom: mapZoom,
      offset: mapOffset,
      notes,
    });
  }, [notes, mapZoom, mapOffset, filterFamily, markers]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(4, mapZoom * delta));
      setMapZoom(newZoom);
    },
    [mapZoom, setMapZoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: mapOffset.x,
        offsetY: mapOffset.y,
      };
      lastMoveRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      velocityRef.current = { x: 0, y: 0 };
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    },
    [mapOffset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      const now = Date.now();
      const dt = now - lastMoveRef.current.time;
      if (dt > 0) {
        velocityRef.current = {
          x: (e.clientX - lastMoveRef.current.x) / dt * 16,
          y: (e.clientY - lastMoveRef.current.y) / dt * 16,
        };
      }
      lastMoveRef.current = { x: e.clientX, y: e.clientY, time: now };

      setMapOffset({
        x: dragStartRef.current.offsetX + dx,
        y: dragStartRef.current.offsetY + dy,
      });
    },
    [isDragging, setMapOffset]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const damping = 0.92;
    const animate = () => {
      velocityRef.current.x *= damping;
      velocityRef.current.y *= damping;

      if (
        Math.abs(velocityRef.current.x) > 0.1 ||
        Math.abs(velocityRef.current.y) > 0.1
      ) {
        setMapOffset((prev) => ({
          x: prev.x + velocityRef.current.x,
          y: prev.y + velocityRef.current.y,
        }));
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isDragging, setMapOffset]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (Math.abs(velocityRef.current.x) > 1 || Math.abs(velocityRef.current.y) > 1) {
        return;
      }

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2 + mapOffset.x;
      const centerY = rect.height / 2 + mapOffset.y;
      
      const relativeX = (x - centerX) / mapZoom + rect.width / 2;
      const relativeY = (y - centerY) / mapZoom + rect.height / 2;

      for (const marker of markers) {
        const mx = marker.x * rect.width;
        const my = marker.y * rect.height;
        const size = 20 + (marker.count / Math.max(...markers.map((m) => m.count), 1)) * 60;
        const distance = Math.sqrt((relativeX - mx) ** 2 + (relativeY - my) ** 2);
        
        if (distance <= size / 2 + 10) {
          setFilterFamily(filterFamily === marker.family ? null : marker.family);
          break;
        }
      }
    },
    [mapOffset, mapZoom, markers, filterFamily, setFilterFamily]
  );

  const resetView = () => {
    setMapZoom(1);
    setMapOffset({ x: 0, y: 0 });
  };

  return (
    <div className="map-view-container">
      <div className="map-header">
        <h2 className="map-title">世界语言地图</h2>
        <div className="map-controls">
          <button className="control-btn" onClick={() => setMapZoom(Math.min(4, mapZoom * 1.2))}>
            +
          </button>
          <button className="control-btn" onClick={() => setMapZoom(Math.max(0.5, mapZoom * 0.8))}>
            −
          </button>
          <button className="control-btn" onClick={resetView}>
            ⊕
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="map-canvas-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} className="map-canvas" />
      </div>

      <div className="map-legend">
        <span className="legend-title">图例</span>
        <div className="legend-items">
          {markers.slice(0, 5).map((marker) => (
            <div key={marker.id} className="legend-item">
              <span
                className="legend-dot"
                style={{ background: marker.color }}
              />
              <span className="legend-label">{marker.family}</span>
              <span className="legend-count">{marker.count}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .map-view-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
          background: #1E1E2E;
          border-radius: 20px;
          overflow: hidden;
        }

        .map-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 10;
          pointer-events: none;
        }

        .map-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #E0E0E0;
          pointer-events: auto;
        }

        .map-controls {
          display: flex;
          gap: 6px;
          pointer-events: auto;
        }

        .control-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(30, 30, 46, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #E0E0E0;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .control-btn:hover {
          background: rgba(124, 77, 255, 0.3);
        }

        .map-canvas-container {
          flex: 1;
          cursor: grab;
          user-select: none;
        }

        .map-canvas-container:active {
          cursor: grabbing;
        }

        .map-canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        .map-legend {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(30, 30, 46, 0.85);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 12px 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          max-width: 200px;
        }

        .legend-title {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 8px;
        }

        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-label {
          color: #B0B0B0;
          flex: 1;
        }

        .legend-count {
          color: #888;
          font-size: 11px;
        }

        @media (max-width: 768px) {
          .map-legend {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
