import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GameState, HexCoord, Unit, GridConfig } from '../types';
import {
  generateGrid,
  hexToPixel,
  getHexCorners,
  getGridPixelSize,
  DEFAULT_GRID_CONFIG,
  hexKey,
} from '../map/GridEngine';
import { getClassAbbr } from '../battle/BattleSystem';
import PathfindingWorker from '../map/PathfindingWorker.ts?worker';

interface HexBoardProps {
  gameState: GameState;
  gridConfig?: GridConfig;
  onCellClick: (coord: HexCoord) => void;
  onUnitClick: (unit: Unit) => void;
  onMoveableCellsUpdate: (cells: HexCoord[]) => void;
}

const HexBoard: React.FC<HexBoardProps> = ({
  gameState,
  gridConfig = DEFAULT_GRID_CONFIG,
  onCellClick,
  onUnitClick,
  onMoveableCellsUpdate,
}) => {
  const cells = useMemo(() => generateGrid(gridConfig), [gridConfig]);
  const gridSize = useMemo(() => getGridPixelSize(gridConfig), [gridConfig]);
  const hexCorners = useMemo(() => getHexCorners(gridConfig.hexSize), [gridConfig.hexSize]);

  const workerRef = useRef<Worker | null>(null);
  const moveableSet = useMemo(
    () => new Set(gameState.moveableCells.map(c => hexKey(c))),
    [gameState.moveableCells]
  );
  const attackableSet = useMemo(
    () => new Set(gameState.attackableCells.map(c => hexKey(c))),
    [gameState.attackableCells]
  );

  useEffect(() => {
    workerRef.current = new PathfindingWorker();

    workerRef.current.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'reachable_result') {
        onMoveableCellsUpdate(e.data.cells);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [onMoveableCellsUpdate]);

  useEffect(() => {
    if (gameState.phase === 'selecting_move' && gameState.currentUnitId) {
      const currentUnit = gameState.units.find(u => u.id === gameState.currentUnitId);
      if (currentUnit && !currentUnit.hasMoved) {
        const obstacles = gameState.units
          .filter(u => u.hp > 0 && u.id !== currentUnit.id)
          .map(u => u.position);

        workerRef.current?.postMessage({
          type: 'getReachable',
          start: currentUnit.position,
          range: currentUnit.moveRange,
          obstacles,
          gridConfig,
        });
      }
    }
  }, [gameState.phase, gameState.currentUnitId, gameState.units, gridConfig]);

  const handleCellClick = (coord: HexCoord) => {
    onCellClick(coord);
  };

  const handleUnitClick = (e: React.MouseEvent, unit: Unit) => {
    e.stopPropagation();
    onUnitClick(unit);
  };

  const getUnitColor = (unit: Unit): string => {
    const colors = {
      warrior: { blue: '#4a90d9', red: '#d94a4a' },
      archer: { blue: '#4ad97a', red: '#d97a4a' },
      mage: { blue: '#9370db', red: '#db7093' },
    };
    return colors[unit.unitClass][unit.faction];
  };

  const svgWidth = gridSize.width + gridConfig.hexSize;
  const svgHeight = gridSize.height + gridConfig.hexSize;
  const offsetX = gridConfig.hexSize;
  const offsetY = gridConfig.hexSize * (Math.sqrt(3) / 2);

  const isCurrentUnit = (unit: Unit): boolean => {
    return unit.id === gameState.currentUnitId;
  };

  const isSelectedUnit = (unit: Unit): boolean => {
    return unit.id === gameState.selectedUnitId;
  };

  return (
    <div className="hex-board-container">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="hex-board-svg"
      >
        <g transform={`translate(${offsetX}, ${offsetY})`}>
          {cells.map(cell => {
            const { x, y } = hexToPixel(cell.coord, gridConfig.hexSize);
            const key = hexKey(cell.coord);
            const isMoveable = moveableSet.has(key);
            const isAttackable = attackableSet.has(key);

            let fillColor = '#f0f0f0';
            if (isMoveable) {
              fillColor = 'rgba(100, 149, 237, 0.4)';
            } else if (isAttackable) {
              fillColor = 'rgba(220, 20, 60, 0.3)';
            }

            return (
              <g
                key={key}
                transform={`translate(${x}, ${y})`}
                onClick={() => handleCellClick(cell.coord)}
                className="hex-cell"
              >
                <polygon
                  points={hexCorners}
                  fill={fillColor}
                  stroke="#cccccc"
                  strokeWidth="1.5"
                  className="hex-polygon"
                />
              </g>
            );
          })}

          {gameState.units
            .filter(u => u.hp > 0)
            .map(unit => {
              const { x, y } = hexToPixel(unit.position, gridConfig.hexSize);
              const unitRadius = 15;
              const current = isCurrentUnit(unit);
              const selected = isSelectedUnit(unit);

              return (
                <g
                  key={unit.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={e => handleUnitClick(e, unit)}
                  className={`unit-token ${current ? 'current' : ''} ${selected ? 'selected' : ''}`}
                >
                  {current && (
                    <polygon
                      points={hexCorners}
                      fill="none"
                      stroke="#ffd700"
                      strokeWidth="3"
                      className="current-unit-border"
                    />
                  )}

                  <circle
                    cx="0"
                    cy="0"
                    r={unitRadius}
                    fill={getUnitColor(unit)}
                    stroke={selected ? '#ffd700' : 'rgba(0,0,0,0.3)'}
                    strokeWidth={selected ? '2.5' : '1'}
                    className="unit-circle"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                    }}
                  />

                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize="12"
                    fontWeight="bold"
                    className="unit-text"
                  >
                    {getClassAbbr(unit.unitClass)}
                  </text>

                  <rect
                    x={-unitRadius}
                    y={unitRadius + 3}
                    width={unitRadius * 2}
                    height="4"
                    fill="#333"
                    rx="2"
                  />
                  <rect
                    x={-unitRadius}
                    y={unitRadius + 3}
                    width={(unitRadius * 2) * (unit.hp / unit.maxHp)}
                    height="4"
                    fill={unit.hp > unit.maxHp * 0.5 ? '#4ade80' : unit.hp > unit.maxHp * 0.25 ? '#fbbf24' : '#ef4444'}
                    rx="2"
                  />
                </g>
              );
            })}

          {gameState.damagePopups.map(popup => {
            const { x, y } = hexToPixel(popup.coord, gridConfig.hexSize);
            return (
              <g
                key={popup.id}
                transform={`translate(${x}, ${y - 20})`}
                className="damage-popup"
              >
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fill={popup.isCrit ? '#ffd700' : '#ff6b6b'}
                  fontSize={popup.isCrit ? '18' : '14'}
                  fontWeight="bold"
                  className="damage-text"
                >
                  -{popup.damage}{popup.isCrit ? '!' : ''}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default React.memo(HexBoard);
