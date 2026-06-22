import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useGardenStore, PRESET_COLORS, PlotStatus } from '../store/gardenStore';

const STATUS_LABELS: Record<PlotStatus, string> = {
  unclaimed: '未认领',
  claimed: '已认领',
  planting: '种植中',
};

const STATUS_COLORS: Record<PlotStatus, string> = {
  unclaimed: '#c0c0c0',
  claimed: '#6b8e23',
  planting: '#f1c40f',
};

const GardenMap: React.FC = () => {
  const plots = useGardenStore((s) => s.plots);
  const currentUserId = useGardenStore((s) => s.currentUserId);
  const users = useGardenStore((s) => s.users);
  const claimPlot = useGardenStore((s) => s.claimPlot);
  const selectPlot = useGardenStore((s) => s.selectPlot);
  const toggleLogPanel = useGardenStore((s) => s.toggleLogPanel);

  const [detailPlotId, setDetailPlotId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
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

  const detailPlot = useMemo(
    () => plots.find((p) => p.id === detailPlotId) || null,
    [plots, detailPlotId]
  );

  const gridSize = useMemo(() => {
    const rowCount = Math.max(...plots.map((p) => p.row)) + 1;
    return rowCount || 6;
  }, [plots]);

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
      setDetailPlotId(plotId);
      setClaiming(false);
    },
    []
  );

  const handleClaimStart = useCallback(() => {
    setClaiming(true);
    setSelectedColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
  }, []);

  const handleClaimConfirm = useCallback(() => {
    if (detailPlotId) {
      claimPlot(detailPlotId, selectedColor);
      setClaiming(false);
      setDetailPlotId(null);
    }
  }, [detailPlotId, selectedColor, claimPlot]);

  const handleViewLogs = useCallback(() => {
    if (detailPlotId) {
      selectPlot(detailPlotId);
      toggleLogPanel(true);
      setDetailPlotId(null);
    }
  }, [detailPlotId, selectPlot, toggleLogPanel]);

  const handleCellMouseEnter = useCallback(
    (plotId: string, e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const containerRect = mapRef.current?.getBoundingClientRect();
      if (!containerRect) return;
      setTooltip({
        plotId,
        x: rect.left - containerRect.left + mapRef.current!.scrollLeft + rect.width / 2,
        y: rect.top - containerRect.top + mapRef.current!.scrollTop - 28,
      });
    },
    []
  );

  const handleCellMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId);
  const owner = detailPlot ? users.find((u) => u.id === detailPlot.ownerId) : null;

  const getCellStyle = (plot: typeof plots[0]) => {
    let bg = STATUS_COLORS[plot.status];
    if (plot.status !== 'unclaimed' && plot.color) {
      if (plot.status === 'planting') {
        return {
          background: `linear-gradient(135deg, ${plot.color} 0%, ${STATUS_COLORS.planting} 100%)`,
        };
      }
      return { background: plot.color };
    }
    return { background: bg };
  };

  return (
    <div
      className="map-container"
      ref={mapRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      <div className="map-grid-wrapper">
        <div
          className="map-grid"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {plots.map((plot) => {
            const isUnclaimed = plot.status === 'unclaimed';
            const isPlanting = plot.status === 'planting';

            return (
              <div
                key={plot.id}
                className={`map-cell ${isUnclaimed ? 'unclaimed' : 'claimed'} ${isPlanting ? 'planting' : ''}`}
                style={getCellStyle(plot)}
                onClick={() => handleCellClick(plot.id)}
                onMouseEnter={(e) => handleCellMouseEnter(plot.id, e)}
                onMouseLeave={handleCellMouseLeave}
              >
                {isUnclaimed ? (
                  <span className="cell-plus">+</span>
                ) : (
                  <>
                    <span className="cell-initials">
                      {owner?.initials || plot.ownerName?.slice(0, 2) || '??'}
                    </span>
                    {plot.currentCrop && (
                      <span className="cell-crop">{plot.currentCrop}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {tooltip && (() => {
          const plot = plots.find((p) => p.id === tooltip.plotId);
          if (!plot) return null;
          return (
            <div
              className="plot-tooltip"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translateX(-50%)',
              }}
            >
              地块 {plot.id.replace('plot-', '')}
            </div>
          );
        })()}
      </div>

      {detailPlot && (
        <div
          className="claim-modal-overlay"
          onClick={() => { setDetailPlotId(null); setClaiming(false); }}
        >
          <div className="claim-modal plot-detail-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🌿 地块详情</h3>

            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">地块编号</span>
                <span className="detail-value">{detailPlot.id.replace('plot-', '')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">位置坐标</span>
                <span className="detail-value">({detailPlot.row}, {detailPlot.col})</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">状态</span>
                <span
                  className="detail-value status-badge"
                  style={{ background: STATUS_COLORS[detailPlot.status] + '33', color: STATUS_COLORS[detailPlot.status] }}
                >
                  {STATUS_LABELS[detailPlot.status]}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">认领人</span>
                <span className="detail-value">{detailPlot.ownerName || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">当前作物</span>
                <span className="detail-value">{detailPlot.currentCrop || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">总产量</span>
                <span className="detail-value">{detailPlot.totalYield}g</span>
              </div>
            </div>

            {!claiming && detailPlot.status === 'unclaimed' && (
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 16 }}
                onClick={handleClaimStart}
              >
                认领此地块
              </button>
            )}

            {claiming && (
              <div className="claiming-section">
                <p style={{ fontSize: 13, color: '#795548', marginBottom: 10 }}>
                  选择一个主题色，以「{currentUser?.name || '园丁'}」身份认领
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
                <div className="modal-actions" style={{ marginTop: 12 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setClaiming(false)}
                  >
                    取消
                  </button>
                  <button className="btn btn-primary" onClick={handleClaimConfirm}>
                    确认认领
                  </button>
                </div>
              </div>
            )}

            {detailPlot.status !== 'unclaimed' && (
              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: 16 }}
                onClick={handleViewLogs}
              >
                查看种植日志
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GardenMap;
