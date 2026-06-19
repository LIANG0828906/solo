import React, { useEffect, useState } from 'react';
import { useGardenStore } from '../store';
import { PLANT_CONFIGS, PlantType, GrowthStage, GRID_SIZE } from '../types';

const PlantIcon: React.FC<{ type: PlantType; stage: GrowthStage }> = ({ type, stage }) => {
  const config = PLANT_CONFIGS[type];
  let icon = config.seedlingIcon;
  if (stage === GrowthStage.GROWING) icon = config.growingIcon;
  if (stage === GrowthStage.MATURE) icon = config.matureIcon;
  return <span className="plant-icon">{icon}</span>;
};

const PlantSelectorPanel: React.FC<{
  position: { row: number; col: number };
  cellRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (type: PlantType) => void;
  onClose: () => void;
}> = ({ position, cellRef, onSelect, onClose }) => {
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [show, setShow] = useState(false);

  useEffect(() => {
    const updatePos = () => {
      if (cellRef.current) {
        const rect = cellRef.current.getBoundingClientRect();
        const panelWidth = 320;
        const cellCenterX = rect.left + rect.width / 2;
        let left = cellCenterX - panelWidth / 2;
        left = Math.max(10, Math.min(left, window.innerWidth - panelWidth - 10));
        setPanelPos({
          top: rect.top - 10,
          left
        });
      }
    };
    updatePos();
    window.addEventListener('resize', updatePos);
    const timer = setTimeout(() => setShow(true), 10);
    return () => {
      window.removeEventListener('resize', updatePos);
      clearTimeout(timer);
    };
  }, [cellRef]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.plant-selector-panel') && !target.closest('.garden-cell')) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const plants: PlantType[] = ['rose', 'sunflower', 'lavender', 'mint', 'tomato', 'strawberry', 'cactus', 'bamboo'];

  return (
    <div
      className={`plant-selector-panel ${show ? 'show' : ''}`}
      style={{
        position: 'fixed',
        top: panelPos.top,
        left: panelPos.left,
        width: 320,
        zIndex: 1000
      }}
    >
      <div className="plant-selector-content">
        <div className="panel-header">
          <span>选择植物 (位置: {position.row + 1}, {position.col + 1})</span>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="plant-grid">
          {plants.map((type) => {
            const config = PLANT_CONFIGS[type];
            return (
              <button
                key={type}
                className="plant-option"
                onClick={() => onSelect(type)}
                style={{ '--plant-color': config.color } as React.CSSProperties}
              >
                <span className="plant-option-icon">{config.matureIcon}</span>
                <span className="plant-option-name">{config.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="panel-arrow" />
      <style>{`
        .plant-selector-panel {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
        }
        .plant-selector-panel.show {
          opacity: 1;
          transform: translateY(-100%) scale(1);
          pointer-events: all;
        }
        .plant-selector-content {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.6);
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px 12px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #888;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: rgba(0, 0, 0, 0.08);
          color: #333;
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
          padding: 12px 8px;
          border-radius: 12px;
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .plant-option:hover {
          border-color: var(--plant-color);
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .plant-option-icon {
          font-size: 28px;
          margin-bottom: 4px;
        }
        .plant-option-name {
          font-size: 12px;
          color: #555;
          font-weight: 500;
        }
        .panel-arrow {
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 16px;
          height: 16px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.6);
          border-bottom: 1px solid rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
};

export const GardenGrid: React.FC = () => {
  const { grid, selectedCell, showPlantPanel, initGrid, openPlantPanel, closePlantPanel, plantInCell } = useGardenStore();
  const cellRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const [mountedCells, setMountedCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  useEffect(() => {
    if (grid.length === 0) return;
    let index = 0;
    const interval = setInterval(() => {
      const row = Math.floor(index / GRID_SIZE);
      const col = index % GRID_SIZE;
      if (row < GRID_SIZE && col < GRID_SIZE) {
        setMountedCells((prev) => new Set(prev).add(`${row}-${col}`));
      }
      index++;
      if (index >= GRID_SIZE * GRID_SIZE) {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [grid.length]);

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
      playSound('success');
    }
  };

  const playSound = (type: 'click' | 'success' | 'fail') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      if (type === 'click') {
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.08;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
      } else if (type === 'success') {
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16);
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.25);
      } else {
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.value = 0.08;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="garden-container">
      <div className="garden-title">
        <h1>🌿 我的虚拟花园</h1>
        <p>点击空格子开始种植你喜欢的植物吧！</p>
      </div>
      <div className="garden-grid-wrapper">
        <div className="garden-grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
          {grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              const isMounted = mountedCells.has(key);
              const config = cell.plant ? PLANT_CONFIGS[cell.plant.type] : null;
              const isMature = cell.plant?.stage === GrowthStage.MATURE;

              return (
                <div
                  key={key}
                  ref={(el) => {
                    if (el) cellRefs.current.set(key, el);
                  }}
                  className={`garden-cell ${cell.plant ? 'has-plant' : ''} ${isMounted ? 'visible' : ''}`}
                  onClick={() => {
                    playSound('click');
                    handleCellClick(rowIdx, colIdx);
                  }}
                >
                  <div className="cell-inner">
                    {cell.plant && config && (
                      <>
                        <div
                          className={`plant-wrapper ${cell.plant.isWatering ? 'watering' : ''} ${cell.plant.isFertilizing ? 'fertilizing' : ''} ${isMature ? 'mature' : ''}`}
                        >
                          <PlantIcon type={cell.plant.type} stage={cell.plant.stage} />
                          {cell.plant.isWatering && (
                            <div className="water-drops">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className="drop" style={{ '--i': i } as React.CSSProperties}>
                                  💧
                                </span>
                              ))}
                            </div>
                          )}
                          {cell.plant.isFertilizing && (
                            <div className="fertilizer-particles">
                              {[...Array(8)].map((_, i) => (
                                <span key={i} className="particle" style={{ '--i': i } as React.CSSProperties}>
                                  ✨
                                </span>
                              ))}
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
                        </div>
                      </>
                    )}
                    {!cell.plant && <span className="empty-hint">＋</span>}
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
          onClose={closePlantPanel}
        />
      )}

      <style>{`
        .garden-container {
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .garden-title {
          text-align: center;
          margin-bottom: 24px;
        }
        .garden-title h1 {
          color: #5a8f4c;
          font-size: 32px;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(90, 143, 76, 0.2);
        }
        .garden-title p {
          color: #8b6f47;
          font-size: 14px;
        }
        .garden-grid-wrapper {
          padding: 16px;
          background: linear-gradient(135deg, #8b6f4733, #5a8f4c22);
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          border: 2px solid #8b6f4744;
        }
        .garden-grid {
          display: grid;
          gap: 8px;
        }
        .garden-cell {
          width: 80px;
          height: 80px;
          opacity: 0;
          transform: translateX(-20px);
          transition: opacity 0.4s ease, transform 0.4s ease;
        }
        .garden-cell.visible {
          opacity: 1;
          transform: translateX(0);
        }
        .cell-inner {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #a0825a, #8b6f47);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid #6d5637;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        .cell-inner::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 30%;
          background: linear-gradient(180deg, rgba(255,255,255,0.08), transparent);
          pointer-events: none;
        }
        .garden-cell:hover .cell-inner {
          transform: translateY(-3px);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(0, 0, 0, 0.15);
          border-color: #f5e6a3;
        }
        .garden-cell.has-plant .cell-inner {
          cursor: default;
        }
        .empty-hint {
          color: rgba(255, 255, 255, 0.4);
          font-size: 28px;
          transition: all 0.2s;
        }
        .garden-cell:hover .empty-hint {
          color: #f5e6a3;
          transform: scale(1.1);
        }
        .plant-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .plant-icon {
          font-size: 36px;
          line-height: 1;
          transition: transform 0.3s ease;
          display: block;
        }
        .plant-wrapper.mature .plant-icon {
          animation: breathe-glow 2s ease-in-out infinite;
          filter: drop-shadow(0 0 8px rgba(255, 230, 100, 0.6));
        }
        @keyframes breathe-glow {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(255, 230, 100, 0.4));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(255, 230, 100, 0.9));
            transform: scale(1.08);
          }
        }
        .plant-wrapper.watering .plant-icon {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .water-drops {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .drop {
          position: absolute;
          font-size: 14px;
          animation: drop-fall 0.8s ease-out forwards;
          left: calc(var(--i) * 10px - 20px);
        }
        @keyframes drop-fall {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.5);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(40px) scale(0.8);
          }
        }
        .fertilizer-particles {
          position: absolute;
          top: 50%;
          left: 50%;
          pointer-events: none;
        }
        .particle {
          position: absolute;
          font-size: 14px;
          animation: particle-burst 0.8s ease-out forwards;
          --angle: calc(var(--i) * 45deg);
          --dx: calc(cos(var(--angle)) * 40px);
          --dy: calc(sin(var(--angle)) * 40px);
        }
        .particle:nth-child(1) { --dx: 0px; --dy: -40px; }
        .particle:nth-child(2) { --dx: 28px; --dy: -28px; }
        .particle:nth-child(3) { --dx: 40px; --dy: 0px; }
        .particle:nth-child(4) { --dx: 28px; --dy: 28px; }
        .particle:nth-child(5) { --dx: 0px; --dy: 40px; }
        .particle:nth-child(6) { --dx: -28px; --dy: 28px; }
        .particle:nth-child(7) { --dx: -40px; --dy: 0px; }
        .particle:nth-child(8) { --dx: -28px; --dy: -28px; }
        @keyframes particle-burst {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.3);
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(var(--dx), var(--dy)) scale(1.2);
          }
        }
        .progress-bar {
          position: absolute;
          bottom: 6px;
          left: 8px;
          right: 8px;
          height: 5px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};
