import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGardenStore } from '../store';
import { PLANT_CONFIGS, PlantType, GrowthStage, GRID_SIZE } from '../types';

const PlantIcon: React.FC<{ type: PlantType; stage: GrowthStage }> = ({ type, stage }) => {
  const config = PLANT_CONFIGS[type];
  let icon = config.seedlingIcon;
  if (stage === GrowthStage.GROWING) icon = config.growingIcon;
  if (stage === GrowthStage.MATURE) icon = config.matureIcon;
  return <span className="plant-icon">{icon}</span>;
};

interface PanelPosition {
  top: number;
  left: number;
  originX: number;
  originY: number;
  arrowOffset: number;
}

const PlantSelectorPanel: React.FC<{
  position: { row: number; col: number };
  cellRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (type: PlantType) => void;
  onClose: () => void;
}> = ({ position, cellRef, onSelect, onClose }) => {
  const [panelPos, setPanelPos] = useState<PanelPosition>({
    top: 0,
    left: 0,
    originX: 50,
    originY: 100,
    arrowOffset: 50
  });
  const [show, setShow] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const PANEL_WIDTH = 330;
  const PANEL_HEIGHT = 240;
  const ARROW_SIZE = 10;
  const GAP = 6;

  const updatePos = useCallback(() => {
    if (!cellRef.current) return;
    const rect = cellRef.current.getBoundingClientRect();
    
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const MARGIN = 12;
    const ARROW_HEIGHT = 10;
    const GAP = 6;
    const TOTAL_OFFSET = ARROW_HEIGHT + GAP;
    
    const cellCenterX = rect.left + rect.width / 2;
    const cellTop = rect.top;
    const cellBottom = rect.bottom;
    
    let left = cellCenterX - PANEL_WIDTH / 2;
    left = Math.max(MARGIN, Math.min(left, viewportWidth - PANEL_WIDTH - MARGIN));
    
    let arrowOffset = ((cellCenterX - left) / PANEL_WIDTH) * 100;
    arrowOffset = Math.max(10, Math.min(90, arrowOffset));
    
    const originX = ((cellCenterX - left) / PANEL_WIDTH) * 100;
    const clampedOriginX = Math.max(10, Math.min(90, originX));
    
    const spaceAbove = cellTop - TOTAL_OFFSET - MARGIN;
    const spaceBelow = viewportHeight - cellBottom - TOTAL_OFFSET - MARGIN;
    
    let top: number;
    let originY: number;
    let isAbove: boolean;
    
    if (spaceAbove >= PANEL_HEIGHT || spaceAbove >= spaceBelow) {
      top = cellTop - PANEL_HEIGHT - TOTAL_OFFSET;
      if (top < MARGIN) {
        const fitsBelow = (cellBottom + TOTAL_OFFSET + PANEL_HEIGHT) <= (viewportHeight - MARGIN);
        if (fitsBelow) {
          top = cellBottom + TOTAL_OFFSET;
          originY = 0;
          isAbove = false;
        } else {
          top = MARGIN;
          originY = Math.min(90, Math.max(10, ((cellTop - MARGIN) / PANEL_HEIGHT) * 100));
          isAbove = true;
        }
      } else {
        originY = 100;
        isAbove = true;
      }
    } else {
      top = cellBottom + TOTAL_OFFSET;
      const maxBottom = viewportHeight - MARGIN;
      if (top + PANEL_HEIGHT > maxBottom) {
        const fitsAbove = (cellTop - TOTAL_OFFSET - PANEL_HEIGHT) >= MARGIN;
        if (fitsAbove) {
          top = cellTop - PANEL_HEIGHT - TOTAL_OFFSET;
          originY = 100;
          isAbove = true;
        } else {
          top = Math.max(MARGIN, maxBottom - PANEL_HEIGHT);
          originY = Math.min(90, Math.max(10, ((cellBottom - top) / PANEL_HEIGHT) * 100));
          isAbove = false;
        }
      } else {
        originY = 0;
        isAbove = false;
      }
    }

    setPanelPos({
      top,
      left,
      originX: clampedOriginX,
      originY,
      arrowOffset
    });
  }, [cellRef]);

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      updatePos();
      requestAnimationFrame(() => setShow(true));
    });
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);

    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [updatePos]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('.plant-selector-panel') &&
        !target.closest('.garden-cell-inner')
      ) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const plants: PlantType[] = ['rose', 'sunflower', 'lavender', 'mint', 'tomato', 'strawberry', 'cactus', 'bamboo'];
  const isAbove = panelPos.originY === 100;

  return (
    <div
      ref={panelRef}
      className={`plant-selector-panel ${show ? 'show' : ''} ${isAbove ? 'above' : 'below'}`}
      style={{
        position: 'fixed',
        top: panelPos.top,
        left: panelPos.left,
        width: PANEL_WIDTH,
        zIndex: 1000,
        transformOrigin: `${panelPos.originX}% ${panelPos.originY}%`
      }}
    >
      <div className="plant-selector-content">
        <div className="panel-header">
          <span className="panel-title">
            🌿 选择植物
            <span className="panel-pos-badge">({position.row + 1},{position.col + 1})</span>
          </span>
          <button className="close-btn" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>
        <div className="plant-grid">
          {plants.map((type, idx) => {
            const config = PLANT_CONFIGS[type];
            return (
              <button
                key={type}
                className="plant-option"
                onClick={() => onSelect(type)}
                style={{
                  '--plant-color': config.color,
                  '--delay': `${idx * 25}ms`
                } as React.CSSProperties}
              >
                <div className="plant-option-icon-wrap">
                  <span className="plant-option-icon">{config.matureIcon}</span>
                  <span className="plant-option-glow" />
                </div>
                <span className="plant-option-name">{config.name}</span>
                <span className="plant-option-stats">
                  💧+{config.waterBoost} ✨+{config.fertilizerBoost}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div
        className={`panel-arrow ${isAbove ? 'arrow-down' : 'arrow-up'}`}
        style={{ left: `${panelPos.arrowOffset}%` }}
      />
      <style>{`
        .plant-selector-panel {
          opacity: 0;
          pointer-events: none;
          will-change: transform, opacity;
        }
        .plant-selector-panel.above {
          transform: translateY(20px) scale(0.9);
        }
        .plant-selector-panel.below {
          transform: translateY(-20px) scale(0.9);
        }
        .plant-selector-panel.show {
          opacity: 1;
          pointer-events: all;
          transform: translateY(0) scale(1);
          transition: 
            opacity 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
            transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .plant-selector-content {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: saturate(180%) blur(24px);
          -webkit-backdrop-filter: saturate(180%) blur(24px);
          border-radius: 18px;
          padding: 10px 12px 14px;
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.16), 
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255,255,255,0.8);
          border: 1px solid rgba(255, 255, 255, 0.9);
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 6px 10px;
        }
        .panel-title {
          font-weight: 700;
          color: #2d2a24;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .panel-pos-badge {
          font-size: 11px;
          font-weight: 600;
          color: #8b6f47;
          background: #f5e6a388;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .close-btn {
          background: rgba(0,0,0,0.05);
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #888;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          line-height: 1;
          padding-bottom: 2px;
        }
        .close-btn:hover {
          background: rgba(231, 76, 60, 0.15);
          color: #e74c3c;
          transform: rotate(90deg);
        }
        .plant-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .plant-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 6px;
          border-radius: 14px;
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.22s ease;
          opacity: 0;
          transform: translateY(10px);
          animation: option-fade-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: var(--delay);
          position: relative;
          overflow: hidden;
        }
        @keyframes option-fade-in {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .plant-option::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top, color-mix(in srgb, var(--plant-color) 15%, transparent), transparent 70%);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .plant-option:hover {
          border-color: var(--plant-color);
          background: rgba(255, 255, 255, 0.98);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 
            0 6px 16px rgba(0, 0, 0, 0.1),
            0 0 0 3px color-mix(in srgb, var(--plant-color) 20%, transparent);
        }
        .plant-option:hover::before {
          opacity: 1;
        }
        .plant-option-icon-wrap {
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .plant-option-icon {
          font-size: 28px;
          line-height: 1;
          transition: transform 0.3s;
          position: relative;
          z-index: 1;
        }
        .plant-option:hover .plant-option-icon {
          transform: scale(1.18) rotate(-5deg);
        }
        .plant-option-glow {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: var(--plant-color);
          opacity: 0;
          filter: blur(12px);
          transition: opacity 0.3s;
        }
        .plant-option:hover .plant-option-glow {
          opacity: 0.35;
        }
        .plant-option-name {
          font-size: 12px;
          color: #333;
          font-weight: 700;
          position: relative;
          z-index: 1;
        }
        .plant-option-stats {
          font-size: 9px;
          color: #888;
          font-weight: 600;
          margin-top: 2px;
          opacity: 0.85;
          position: relative;
          z-index: 1;
        }
        .panel-arrow {
          position: absolute;
          width: 20px;
          height: 20px;
          transform: translateX(-50%) rotate(45deg);
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: saturate(180%) blur(24px);
          -webkit-backdrop-filter: saturate(180%) blur(24px);
          box-shadow: 2px 2px 4px rgba(0,0,0,0.04);
          z-index: -1;
        }
        .arrow-down {
          bottom: -8px;
          border-right: 1px solid rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(255, 255, 255, 0.9);
        }
        .arrow-up {
          top: -8px;
          border-left: 1px solid rgba(255, 255, 255, 0.9);
          border-top: 1px solid rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </div>
  );
};

export const GardenGrid: React.FC = () => {
  const {
    grid,
    selectedCell,
    showPlantPanel,
    initGrid,
    openPlantPanel,
    closePlantPanel,
    plantInCell,
    playSound
  } = useGardenStore();

  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [mountedCells, setMountedCells] = useState<Set<string>>(new Set());
  const [gridReady, setGridReady] = useState(false);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  useEffect(() => {
    if (grid.length === 0 || gridReady) return;
    setGridReady(true);

    const order: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        order.push({ row, col });
      }
    }

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= order.length) {
        clearInterval(interval);
        return;
      }
      setMountedCells((prev) => {
        const next = new Set(prev);
        for (let d = 0; d <= 0 && idx + d < order.length; d++) {
          const item = order[idx + d];
          next.add(`${item.row}-${item.col}`);
        }
        return next;
      });
      idx++;
    }, 45);

    return () => clearInterval(interval);
  }, [grid.length, gridReady]);

  const handleCellClick = (row: number, col: number) => {
    const cell = grid[row]?.[col];
    if (!cell) return;
    if (!cell.plant) {
      openPlantPanel(row, col);
    }
  };

  const handleSelectPlant = (type: PlantType) => {
    if (selectedCell) {
      plantInCell(selectedCell.row, selectedCell.col, type);
    }
  };

  return (
    <div className="garden-container">
      <div className="garden-title">
        <h1>🌿 我的虚拟花园</h1>
        <p>点击空格子开始种植你喜欢的植物吧！{GRID_SIZE}×{GRID_SIZE} 共 {GRID_SIZE * GRID_SIZE} 个地块</p>
      </div>
      <div className="garden-grid-wrapper">
        <div className="garden-grid-corner tl">🌱</div>
        <div className="garden-grid-corner tr">🌻</div>
        <div className="garden-grid-corner bl">�</div>
        <div className="garden-grid-corner br">🎋</div>
        <div className="garden-grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              const isMounted = mountedCells.has(key);
              const config = cell.plant ? PLANT_CONFIGS[cell.plant.type] : null;
              const isMature = cell.plant?.stage === GrowthStage.MATURE;
              const animDelay = (rowIdx * GRID_SIZE + colIdx) * 45;

              return (
                <div
                  key={key}
                  className={`garden-cell ${cell.plant ? 'has-plant' : ''} ${isMounted ? 'visible' : ''}`}
                  style={{ '--anim-delay': `${animDelay}ms` } as React.CSSProperties}
                >
                  <div
                    ref={(el) => {
                      if (el) cellRefs.current.set(key, el);
                    }}
                    className={`cell-inner garden-cell-inner ${cell.plant ? 'planted' : 'empty'}`}
                    style={config ? ({ ['--accent' as any]: config.color } as React.CSSProperties) : undefined}
                    onClick={() => {
                      playSound('click');
                      handleCellClick(rowIdx, colIdx);
                    }}
                  >
                    <div className="cell-pattern" />
                    {cell.plant && config && (
                      <>
                        <div
                          className={`plant-wrapper ${cell.plant.isWatering ? 'watering' : ''} ${cell.plant.isFertilizing ? 'fertilizing' : ''} ${isMature ? 'mature' : ''}`}
                        >
                          <PlantIcon type={cell.plant.type} stage={cell.plant.stage} />
                          {cell.plant.isWatering && (
                            <div className="water-drops">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className="drop"
                                  style={{
                                    '--i': i,
                                    '--dx': `${(i - 2) * 9}px`,
                                    '--dur': `${0.55 + (i % 3) * 0.12}s`
                                  } as React.CSSProperties}
                                >
                                  💧
                                </span>
                              ))}
                            </div>
                          )}
                          {cell.plant.isFertilizing && (
                            <div className="fertilizer-particles">
                              {[...Array(10)].map((_, i) => {
                                const angle = (i / 10) * Math.PI * 2;
                                const dist = 32 + (i % 3) * 8;
                                const dx = Math.cos(angle) * dist;
                                const dy = Math.sin(angle) * dist;
                                return (
                                  <span
                                    key={i}
                                    className="particle"
                                    style={{
                                      '--dx': `${dx}px`,
                                      '--dy': `${dy}px`,
                                      '--dur': `${0.6 + (i % 4) * 0.08}s`,
                                      '--delay': `${i * 20}ms`
                                    } as React.CSSProperties}
                                  >
                                    {i % 3 === 0 ? '✨' : i % 3 === 1 ? '💫' : '⭐'}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${cell.plant.progress}%`,
                              background: `linear-gradient(90deg, ${config.color}88, ${config.color})`
                            }}
                          />
                          <div className="progress-shine" />
                        </div>
                      </>
                    )}
                    {!cell.plant && (
                      <div className="empty-state">
                        <span className="empty-hint">＋</span>
                        <span className="empty-label">种植</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showPlantPanel && selectedCell && (
        <PlantSelectorPanel
          position={selectedCell}
          cellRef={{
            current: cellRefs.current.get(`${selectedCell.row}-${selectedCell.col}`) || null
          }}
          onSelect={handleSelectPlant}
          onClose={() => {
            playSound('click');
            closePlantPanel();
          }}
        />
      )}

      <style>{`
        .garden-container {
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .garden-title {
          text-align: center;
          margin-bottom: 28px;
        }
        .garden-title h1 {
          color: #5a8f4c;
          font-size: 34px;
          margin-bottom: 8px;
          text-shadow: 0 2px 8px rgba(90, 143, 76, 0.2);
          font-weight: 800;
          letter-spacing: 1px;
        }
        .garden-title p {
          color: #8b6f47;
          font-size: 14px;
          opacity: 0.9;
        }
        .garden-grid-wrapper {
          position: relative;
          padding: 20px;
          background: linear-gradient(135deg, rgba(139, 111, 71, 0.18), rgba(90, 143, 76, 0.15));
          border-radius: 24px;
          box-shadow: 
            0 12px 36px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255,255,255,0.5);
          border: 2px solid rgba(139, 111, 71, 0.25);
        }
        .garden-grid-corner {
          position: absolute;
          font-size: 20px;
          opacity: 0.55;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
        }
        .garden-grid-corner.tl { top: 6px; left: 10px; transform: rotate(-15deg); }
        .garden-grid-corner.tr { top: 6px; right: 10px; transform: rotate(15deg); }
        .garden-grid-corner.bl { bottom: 6px; left: 10px; transform: rotate(15deg); }
        .garden-grid-corner.br { bottom: 6px; right: 10px; transform: rotate(-15deg); }
        .garden-grid {
          display: grid;
          gap: 10px;
        }
        .garden-cell {
          width: 86px;
          height: 86px;
          opacity: 0;
          transform: translate3d(0, 18px, 0) scale(0.92);
          animation: cell-fade-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: var(--anim-delay, 0ms);
          animation-play-state: paused;
          will-change: transform, opacity;
        }
        .garden-cell.visible {
          animation-play-state: running;
        }
        @keyframes cell-fade-in {
          0% {
            opacity: 0;
            transform: translate3d(0, 18px, 0) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        .cell-inner {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #a6875f, #8b6f47 60%, #7a5d3c);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 2px solid #6d5637;
          box-shadow: 
            inset 0 2px 6px rgba(0, 0, 0, 0.18),
            0 3px 6px rgba(0, 0, 0, 0.1),
            inset 0 -2px 4px rgba(0,0,0,0.12);
          position: relative;
          overflow: hidden;
        }
        .cell-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 30%),
            radial-gradient(circle at 80% 70%, rgba(0,0,0,0.05) 0%, transparent 30%);
          pointer-events: none;
        }
        .cell-inner::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 35%;
          background: linear-gradient(180deg, rgba(255,255,255,0.12), transparent);
          pointer-events: none;
        }
        .cell-inner.empty:hover {
          transform: translateY(-4px);
          box-shadow: 
            inset 0 2px 6px rgba(0, 0, 0, 0.18),
            0 8px 20px rgba(0, 0, 0, 0.18),
            0 0 0 3px rgba(245, 230, 163, 0.5);
          border-color: #f5e6a3;
        }
        .cell-inner.empty:active {
          transform: translateY(-1px) scale(0.98);
        }
        .cell-inner.planted {
          cursor: default;
          box-shadow: 
            inset 0 2px 6px rgba(0, 0, 0, 0.18),
            0 3px 6px rgba(0, 0, 0, 0.1),
            inset 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent);
          border-color: color-mix(in srgb, var(--accent) 45%, #6d5637);
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          transition: all 0.2s;
        }
        .empty-hint {
          color: rgba(255, 255, 255, 0.35);
          font-size: 32px;
          font-weight: 300;
          line-height: 1;
          transition: all 0.2s;
        }
        .empty-label {
          font-size: 9px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 1px;
        }
        .cell-inner.empty:hover .empty-hint {
          color: #f5e6a3;
          transform: scale(1.15);
          text-shadow: 0 0 12px rgba(245, 230, 163, 0.5);
        }
        .cell-inner.empty:hover .empty-label {
          color: rgba(245, 230, 163, 0.8);
        }
        .plant-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .plant-icon {
          font-size: 38px;
          line-height: 1;
          transition: transform 0.3s ease;
          display: block;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
        }
        .plant-wrapper.mature .plant-icon {
          animation: breathe-glow 2.2s ease-in-out infinite;
        }
        @keyframes breathe-glow {
          0%, 100% {
            filter: 
              drop-shadow(0 2px 4px rgba(0,0,0,0.15))
              drop-shadow(0 0 6px rgba(255, 230, 100, 0.5));
            transform: scale(1);
          }
          50% {
            filter: 
              drop-shadow(0 2px 4px rgba(0,0,0,0.15))
              drop-shadow(0 0 18px rgba(255, 230, 100, 0.95));
            transform: scale(1.08);
          }
        }
        .plant-wrapper.watering .plant-icon {
          animation: shake 0.55s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-6deg) scale(1.02); }
          40% { transform: rotate(5deg) scale(1.02); }
          60% { transform: rotate(-4deg); }
          80% { transform: rotate(3deg); }
        }
        .water-drops {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          width: 60px;
          height: 10px;
        }
        .drop {
          position: absolute;
          font-size: 13px;
          animation: drop-fall var(--dur) ease-out forwards;
          left: calc(50% + var(--dx));
          top: 0;
        }
        @keyframes drop-fall {
          0% {
            opacity: 0;
            transform: translateY(-12px) scale(0.4);
          }
          18% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(48px) scale(0.85);
          }
        }
        .fertilizer-particles {
          position: absolute;
          top: 50%;
          left: 50%;
          pointer-events: none;
          width: 0;
          height: 0;
        }
        .particle {
          position: absolute;
          font-size: 13px;
          animation: particle-burst var(--dur) cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: var(--delay);
        }
        @keyframes particle-burst {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.2) rotate(0deg);
          }
          25% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.2) rotate(180deg);
          }
        }
        .progress-bar {
          position: absolute;
          bottom: 7px;
          left: 9px;
          right: 9px;
          height: 6px;
          background: rgba(0, 0, 0, 0.28);
          border-radius: 3px;
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.2);
        }
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }
        .progress-shine {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 45%;
          background: linear-gradient(180deg, rgba(255,255,255,0.45), transparent);
          pointer-events: none;
          border-radius: 3px 3px 0 0;
        }
      `}</style>
    </div>
  );
};
