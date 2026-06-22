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

type TerrainType = 'grass' | 'highland' | 'obstacle' | 'plain';

interface HexBoardProps {
  gameState: GameState;
  gridConfig?: GridConfig;
  onCellClick: (coord: HexCoord) => void;
  onUnitClick: (unit: Unit) => void;
  onMoveableCellsUpdate: (cells: HexCoord[]) => void;
  onHoverAttackableUnit?: (unit: Unit | null) => void;
}

const getTerrainType = (coord: HexCoord): TerrainType => {
  const seed = (coord.q * 7 + coord.r * 13) % 17;
  if (seed === 3 || seed === 11) return 'highland';
  if (seed === 7) return 'obstacle';
  return 'grass';
};

const getTerrainColor = (terrain: TerrainType): string => {
  switch (terrain) {
    case 'grass':
      return '#e8dcc8';
    case 'highland':
      return '#d4c4a8';
    case 'obstacle':
      return '#a89880';
    default:
      return '#f0f0f0';
  }
};

const getTerrainBorder = (terrain: TerrainType): string => {
  switch (terrain) {
    case 'grass':
      return '#c8b896';
    case 'highland':
      return '#b8a888';
    case 'obstacle':
      return '#8a7a60';
    default:
      return '#cccccc';
  }
};

const HexBoard: React.FC<HexBoardProps> = ({
  gameState,
  gridConfig = DEFAULT_GRID_CONFIG,
  onCellClick,
  onUnitClick,
  onMoveableCellsUpdate,
  onHoverAttackableUnit,
}) => {
  const cells = useMemo(() => generateGrid(gridConfig), [gridConfig]);
  const gridSize = useMemo(() => getGridPixelSize(gridConfig), [gridConfig]);
  const hexCorners = useMemo(() => getHexCorners(gridConfig.hexSize), [gridConfig.hexSize]);

  const [hoveredCoord, setHoveredCoord] = useState<HexCoord | null>(null);
  const [previewTargetUnit, setPreviewTargetUnit] = useState<Unit | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const moveableSet = useMemo(
    () => new Set(gameState.moveableCells.map(c => hexKey(c))),
    [gameState.moveableCells]
  );
  const attackableSet = useMemo(
    () => new Set(gameState.attackableCells.map(c => hexKey(c))),
    [gameState.attackableCells]
  );

  const terrainMap = useMemo(() => {
    const map = new Map<string, TerrainType>();
    cells.forEach(cell => {
      map.set(hexKey(cell.coord), getTerrainType(cell.coord));
    });
    return map;
  }, [cells]);

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

  const handleCellMouseEnter = (coord: HexCoord) => {
    setHoveredCoord(coord);
  };

  const handleCellMouseLeave = () => {
    setHoveredCoord(null);
  };

  const handleUnitMouseEnter = (e: React.MouseEvent, unit: Unit) => {
    e.stopPropagation();
    setHoveredCoord(unit.position);
    const isAttackable = attackableSet.has(hexKey(unit.position));
    const currentUnit = gameState.units.find(u => u.id === gameState.currentUnitId);
    if (isAttackable && currentUnit && currentUnit.faction !== unit.faction) {
      setPreviewTargetUnit(unit);
      onHoverAttackableUnit?.(unit);
    }
  };

  const handleUnitMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTargetUnit(null);
    onHoverAttackableUnit?.(null);
  };

  const calculatePreviewDamage = (attacker: Unit, defender: Unit): number => {
    const defense = defender.defense;
    const defenseFactor = 1 - defense / (defense + 100);
    return Math.floor(attacker.attack * defenseFactor);
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
  const svgHeight = gridSize.height + gridConfig.hexSize + 40;
  const offsetX = gridConfig.hexSize;
  const offsetY = gridConfig.hexSize * (Math.sqrt(3) / 2) + 20;

  const isCurrentUnit = (unit: Unit): boolean => {
    return unit.id === gameState.currentUnitId;
  };

  const isSelectedUnit = (unit: Unit): boolean => {
    return unit.id === gameState.selectedUnitId;
  };

  const currentAttacker = gameState.units.find(u => u.id === gameState.currentUnitId);
  const previewDamage = previewTargetUnit && currentAttacker
    ? calculatePreviewDamage(currentAttacker, previewTargetUnit)
    : null;

  return (
    <div className="hex-board-wrapper">
      {hoveredCoord && (
        <div className="coord-tooltip" style={{ left: '50%', top: 0, transform: 'translateX(-50%)' }}>
          坐标: ({hoveredCoord.q}, {hoveredCoord.r})
          <span className="coord-axial"> | 轴向: ({hoveredCoord.q}, {hoveredCoord.q + hoveredCoord.r})</span>
        </div>
      )}

      <div className="hex-board-container">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="hex-board-svg"
        >
          <defs>
            <filter id="inner-shadow">
              <feOffset dx="0" dy="1" />
              <feGaussianBlur stdDeviation="1" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="#000" floodOpacity="0.15" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
            <linearGradient id="highland-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0d4b8" />
              <stop offset="100%" stopColor="#c8b896" />
            </linearGradient>
          </defs>

          <g transform={`translate(${offsetX}, ${offsetY})`}>
            {cells.map(cell => {
              const { x, y } = hexToPixel(cell.coord, gridConfig.hexSize);
              const key = hexKey(cell.coord);
              const isMoveable = moveableSet.has(key);
              const isAttackable = attackableSet.has(key);
              const isHovered = hoveredCoord && hoveredCoord.q === cell.coord.q && hoveredCoord.r === cell.coord.r;
              const terrain = terrainMap.get(key) || 'plain';
              const terrainFill = getTerrainColor(terrain);
              const terrainBorder = getTerrainBorder(terrain);

              return (
                <g
                  key={key}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => handleCellClick(cell.coord)}
                  onMouseEnter={() => handleCellMouseEnter(cell.coord)}
                  onMouseLeave={handleCellMouseLeave}
                  className={`hex-cell ${terrain}`}
                >
                  <polygon
                    points={hexCorners}
                    fill={terrainFill}
                    stroke={terrainBorder}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    className="hex-terrain"
                    filter="url(#inner-shadow)"
                  />

                  {terrain === 'highland' && (
                    <polygon
                      points={hexCorners}
                      fill="url(#highland-gradient)"
                      opacity="0.5"
                      className="hex-terrain-overlay"
                    />
                  )}

                  {terrain === 'obstacle' && (
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="16"
                      opacity="0.6"
                      className="terrain-icon"
                    >
                      🪨
                    </text>
                  )}

                  {terrain === 'highland' && (
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="12"
                      opacity="0.5"
                      className="terrain-icon"
                    >
                      ⛰
                    </text>
                  )}

                  {isMoveable && (
                    <polygon
                      points={hexCorners}
                      fill="rgba(100, 149, 237, 0.35)"
                      stroke="rgba(100, 149, 237, 0.8)"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="hex-moveable-overlay"
                    />
                  )}

                  {isAttackable && (
                    <polygon
                      points={hexCorners}
                      fill="rgba(220, 20, 60, 0.3)"
                      stroke="rgba(220, 20, 60, 0.7)"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      className="hex-attackable-overlay"
                    />
                  )}

                  {isHovered && (
                    <polygon
                      points={hexCorners}
                      fill="rgba(255, 255, 255, 0.15)"
                      stroke="rgba(255, 215, 0, 0.8)"
                      strokeWidth="2"
                      className="hex-hover-overlay"
                    />
                  )}
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
                const isPreviewTarget = previewTargetUnit?.id === unit.id;

                return (
                  <g
                    key={unit.id}
                    transform={`translate(${x}, ${y})`}
                    onClick={e => handleUnitClick(e, unit)}
                    onMouseEnter={e => handleUnitMouseEnter(e, unit)}
                    onMouseLeave={e => handleUnitMouseLeave(e)}
                    className={`unit-token ${current ? 'current' : ''} ${selected ? 'selected' : ''} ${unit.faction}`}
                  >
                    {current && (
                      <polygon
                        points={hexCorners}
                        fill="none"
                        stroke="#ffd700"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        className="current-unit-border"
                      />
                    )}

                    <circle
                      cx="0"
                      cy="0"
                      r={unitRadius + 3}
                      fill={unit.faction === 'blue' ? 'rgba(74, 144, 217, 0.4)' : 'rgba(217, 74, 74, 0.4)'}
                      className="unit-faction-ring"
                    />

                    <circle
                      cx="0"
                      cy="0"
                      r={unitRadius}
                      fill={getUnitColor(unit)}
                      stroke={selected ? '#ffd700' : 'rgba(0,0,0,0.4)'}
                      strokeWidth={selected ? '2.5' : '1.5'}
                      className="unit-circle"
                      style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                      }}
                    />

                    <circle
                      cx={-unitRadius + 4}
                      cy={-unitRadius + 4}
                      r="4"
                      fill={unit.faction === 'blue' ? '#4a90d9' : '#d94a4a'}
                      stroke="white"
                      strokeWidth="1"
                      className="unit-faction-dot"
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
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {getClassAbbr(unit.unitClass)}
                    </text>

                    <g className="hp-bar-group" transform={`translate(${-unitRadius}, ${unitRadius + 5})`}>
                      <rect
                        x="0"
                        y="0"
                        width={unitRadius * 2}
                        height="5"
                        fill="#1a1a1a"
                        rx="2.5"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="0.5"
                      />
                      <rect
                        x="0.5"
                        y="0.5"
                        width={(unitRadius * 2 - 1) * (unit.hp / unit.maxHp)}
                        height="4"
                        fill={unit.hp > unit.maxHp * 0.5 ? '#4ade80' : unit.hp > unit.maxHp * 0.25 ? '#fbbf24' : '#ef4444'}
                        rx="2"
                        className="hp-bar-fill"
                      />
                    </g>

                    {isPreviewTarget && previewDamage !== null && (
                      <g className="damage-preview" transform="translate(0, -28)">
                        <rect
                          x="-24"
                          y="-10"
                          width="48"
                          height="18"
                          rx="9"
                          fill="rgba(0,0,0,0.8)"
                          stroke="rgba(239, 68, 68, 0.8)"
                          strokeWidth="1"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ef4444"
                          fontSize="12"
                          fontWeight="bold"
                        >
                          -{previewDamage}
                        </text>
                      </g>
                    )}
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
                    fontSize={popup.isCrit ? '20' : '16'}
                    fontWeight="bold"
                    className="damage-text"
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}
                  >
                    {popup.isCrit ? '暴击! ' : ''}-{popup.damage}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        <div className="terrain-legend">
          <div className="legend-item">
            <span className="legend-swatch grass"></span>
            <span>草地</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch highland"></span>
            <span>高地</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch obstacle"></span>
            <span>障碍</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch moveable"></span>
            <span>可移动</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch attackable"></span>
            <span>可攻击</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HexBoard);
