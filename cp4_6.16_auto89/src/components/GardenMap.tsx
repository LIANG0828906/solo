import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useGardenStore, PRESET_COLORS } from '../store/gardenStore';

const ACTIVITY_ICONS: Record<string, string> = {
  sowing: '🌱',
  watering: '💧',
  fertilizing: '🧪',
  weeding: '🧹',
  harvesting: '🍎',
};

const ACTIVITY_LABELS: Record<string, string> = {
  sowing: '播种',
  watering: '浇水',
  fertilizing: '施肥',
  weeding: '除草',
  harvesting: '收获',
};

const GardenMap: React.FC = () => {
  const plots = useGardenStore((s) => s.plots);
  const logs = useGardenStore((s) => s.logs);
  const currentUserId = useGardenStore((s) => s.currentUserId);
  const users = useGardenStore((s) => s.users);
  const claimPlot = useGardenStore((s) => s.claimPlot);
  const selectPlot = useGardenStore((s) => s.selectPlot);
  const toggleLogPanel = useGardenStore((s) => s.toggleLogPanel);

  const [claimingPlotId, setClaimingPlotId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [tooltip, setTooltip] = useState<{
    plotId: string;
    x: number;
    y: number;
  } | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const scrollStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.map-cell')) return;
    isDragging.current = false;
    startPos.current = { x: e.clientX, y: e.clientY };
    const container = mapRef.current;
    if (container) {
      scrollStart.current = { x: container.scrollLeft, y: container.scrollTop };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons === 0) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isDragging.current = true;
    }
    if (isDragging.current) {
      const container = mapRef.current;
      if (container) {
        container.scrollLeft = scrollStart.current.x - dx;
        container.scrollTop = scrollStart.current.y - dy;
      }
    }
  }, []);

  const handleCellClick = useCallback(
    (plotId: string) => {
      if (isDragging.current) return;
      const plot = plots.find((p) => p.id === plotId);
      if (!plot) return;

      if (!plot.ownerId) {
        setClaimingPlotId(plotId);
        setSelectedColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
      } else {
        selectPlot(plotId);
        toggleLogPanel(true);
      }
    },
    [plots, selectPlot, toggleLogPanel]
  );

  const handleClaim = useCallback(() => {
    if (claimingPlotId) {
      claimPlot(claimingPlotId, selectedColor);
      setClaimingPlotId(null);
    }
  }, [claimingPlotId, selectedColor, claimPlot]);

  const handleCellMouseEnter = useCallback(
    (plotId: string, e: React.MouseEvent) => {
      const plot = plots.find((p) => p.id === plotId);
      if (!plot || !plot.ownerId) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const containerRect = mapRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      setTooltip({
        plotId,
        x: rect.right - containerRect.left + mapRef.current!.scrollLeft + 8,
        y: rect.top - containerRect.top + mapRef.current!.scrollTop,
      });
    },
    [plots]
  );

  const handleCellMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId);
  const plotLogs = (plotId: string) => logs.filter((l) => l.plotId === plotId);

  return (
    <div
      className="map-container"
      ref={mapRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div className="map-grid-wrapper">
        <div className="map-grid">
          {plots.map((plot) => {
            const isClaimed = !!plot.ownerId;
            const isMine = plot.ownerId === currentUserId;
            const owner = users.find((u) => u.id === plot.ownerId);
            const pLogs = plotLogs(plot.id);
            const lastActivity = pLogs.length > 0 ? pLogs[pLogs.length - 1] : null;

            return (
              <div
                key={plot.id}
                className={`map-cell ${isClaimed ? 'claimed' : 'unclaimed'} ${isMine ? 'mine' : ''}`}
                style={isClaimed ? { background: plot.color || '#999' } : undefined}
                onClick={() => handleCellClick(plot.id)}
                onMouseEnter={(e) => handleCellMouseEnter(plot.id, e)}
                onMouseLeave={handleCellMouseLeave}
              >
                {isClaimed && (
                  <>
                    <span className="cell-initials">
                      {owner?.initials || '??'}
                    </span>
                    {plot.totalYield > 0 && (
                      <span className="cell-yield">{plot.totalYield}g</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {tooltip && (() => {
          const plot = plots.find((p) => p.id === tooltip.plotId);
          if (!plot || !plot.ownerId) return null;
          const owner = users.find((u) => u.id === plot.ownerId);
          const pLogs = logs.filter((l) => l.plotId === plot.id);
          return (
            <div
              className="plot-detail-tooltip"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <div className="td-name">{owner?.name || '未知'}</div>
              <div className="td-info">
                日志 {pLogs.length} 条 · 产量 {plot.totalYield}g
              </div>
            </div>
          );
        })()}
      </div>

      {claimingPlotId && (
        <div
          className="claim-modal-overlay"
          onClick={() => setClaimingPlotId(null)}
        >
          <div className="claim-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🌿 认领地块</h3>
            <p>
              为地块选择一个主题色，你将以「{currentUser?.name || '园丁'}」的身份认领此地块
            </p>
            <div className="color-picker">
              {PRESET_COLORS.map((color) => (
                <div
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setClaimingPlotId(null)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleClaim}>
                确认认领
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GardenMap;
