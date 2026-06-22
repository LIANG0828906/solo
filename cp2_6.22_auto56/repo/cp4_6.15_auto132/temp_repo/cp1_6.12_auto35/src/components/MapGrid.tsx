import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { findPath } from '../logic/pathfinding';
import { Position, Unit } from '../types/game';
import './MapGrid.css';

interface MapGridProps {
  onMoveUnit: (unitId: string, target: Position, path: Position[]) => void;
  onAttackUnit: (attackerId: string, targetId: string) => void;
  movingUnit: { unitId: string; path: Position[] } | null;
  attackingUnits: { attackerId: string; targetId: string; damage: number }[];
  dyingUnits: string[];
  aiPath: Position[] | null;
}

const CELL_SIZE = 60;

export const MapGrid: React.FC<MapGridProps> = ({
  onMoveUnit,
  onAttackUnit,
  movingUnit,
  attackingUnits,
  dyingUnits,
  aiPath,
}) => {
  const {
    mapSize,
    terrain,
    units,
    selectedUnitId,
    reachableCells,
    attackableTargets,
    gamePhase,
    currentTurn,
  } = useGameStore();

  const selectUnit = useGameStore((state) => state.selectUnit);
  const deselectUnit = useGameStore((state) => state.deselectUnit);

  const gridRef = useRef<HTMLDivElement>(null);

  const reachableSet = useMemo(() => {
    return new Set(reachableCells.map((c) => `${c.x},${c.y}`));
  }, [reachableCells]);

  const attackableSet = useMemo(() => {
    return new Set(attackableTargets.map((u) => u.id));
  }, [attackableTargets]);

  const getTerrainStyle = useCallback((terrainType: string) => {
    switch (terrainType) {
      case 'grass':
        return { backgroundColor: '#7cb342' };
      case 'mountain':
        return { backgroundColor: '#8d6e63' };
      case 'water':
        return { backgroundColor: '#4fc3f7' };
      default:
        return { backgroundColor: '#7cb342' };
    }
  }, []);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (gamePhase !== 'player-turn' || currentTurn !== 'player') return;

      const clickedUnit = units.find(
        (u) => u.isAlive && u.position.x === x && u.position.y === y
      );

      if (clickedUnit) {
        if (selectedUnitId && attackableSet.has(clickedUnit.id)) {
          onAttackUnit(selectedUnitId, clickedUnit.id);
        } else if (clickedUnit.team === 'player') {
          selectUnit(clickedUnit.id);
        }
        return;
      }

      if (selectedUnitId && reachableSet.has(`${x},${y}`)) {
        const selectedUnit = units.find((u) => u.id === selectedUnitId);
        if (selectedUnit && !selectedUnit.hasMoved) {
          const path = findPath(
            selectedUnit.position,
            { x, y },
            terrain,
            mapSize,
            units
          );
          if (path && path.length > 0) {
            onMoveUnit(selectedUnitId, { x, y }, path);
          }
        }
      } else {
        deselectUnit();
      }
    },
    [
      gamePhase,
      currentTurn,
      units,
      selectedUnitId,
      reachableSet,
      attackableSet,
      terrain,
      mapSize,
      selectUnit,
      deselectUnit,
      onMoveUnit,
      onAttackUnit,
    ]
  );

  const getUnitStyle = (unit: Unit) => {
    const left = unit.position.x * CELL_SIZE + CELL_SIZE / 2;
    const top = unit.position.y * CELL_SIZE + CELL_SIZE / 2;
    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  const getUnitColor = (team: string) => {
    return team === 'player' ? '#3498db' : '#e74c3c';
  };

  if (terrain.length === 0) {
    return <div className="map-placeholder">选择地图大小开始游戏</div>;
  }

  return (
    <div className="map-container">
      <div
        ref={gridRef}
        className="map-grid"
        style={{
          width: `${mapSize * CELL_SIZE}px`,
          height: `${mapSize * CELL_SIZE}px`,
        }}
      >
        {terrain.map((row, y) =>
          row.map((cell, x) => {
            const isReachable = reachableSet.has(`${x},${y}`);
            return (
              <div
                key={`${x}-${y}`}
                className={`map-cell ${cell === 'water' ? 'water-cell' : ''} ${isReachable ? 'reachable-cell' : ''}`}
                style={{
                  left: `${x * CELL_SIZE}px`,
                  top: `${y * CELL_SIZE}px`,
                  width: `${CELL_SIZE}px`,
                  height: `${CELL_SIZE}px`,
                  ...getTerrainStyle(cell),
                }}
                onClick={() => handleCellClick(x, y)}
              >
                {cell === 'water' && <div className="water-overlay" />}
                {isReachable && <div className="cell-pulse" />}
              </div>
            );
          })
        )}

        {aiPath && aiPath.length > 1 && (
          <svg
            className="path-svg"
            width={mapSize * CELL_SIZE}
            height={mapSize * CELL_SIZE}
          >
            <polyline
              points={aiPath
                .map(
                  (p) =>
                    `${p.x * CELL_SIZE + CELL_SIZE / 2},${p.y * CELL_SIZE + CELL_SIZE / 2}`
                )
                .join(' ')}
              fill="none"
              stroke="#e74c3c"
              strokeWidth="3"
              strokeDasharray="8,4"
              className="ai-path"
            />
          </svg>
        )}

        {units
          .filter((u) => u.isAlive)
          .map((unit) => (
            <div
              key={unit.id}
              className={`unit ${selectedUnitId === unit.id ? 'unit-selected' : ''} ${movingUnit?.unitId === unit.id ? 'unit-moving' : ''} ${dyingUnits.includes(unit.id) ? 'unit-dying' : ''} ${attackableSet.has(unit.id) ? 'unit-attackable' : ''}`}
              style={{
                ...getUnitStyle(unit),
                backgroundColor: getUnitColor(unit.team),
                transitionDuration: movingUnit?.unitId === unit.id ? '0.3s' : '0s',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleCellClick(unit.position.x, unit.position.y);
              }}
            >
              {selectedUnitId === unit.id && <div className="unit-glow" />}
              <div className="unit-icon">{unit.type[0].toUpperCase()}</div>
              <div className="unit-hp-bar">
                <div
                  className="unit-hp-fill"
                  style={{
                    width: `${(unit.hp / unit.maxHp) * 100}%`,
                    backgroundColor:
                      unit.hp / unit.maxHp > 0.5
                        ? '#2ecc71'
                        : unit.hp / unit.maxHp > 0.25
                        ? '#f1c40f'
                        : '#e74c3c',
                  }}
                />
              </div>
            </div>
          ))}

        {attackingUnits.map(({ attackerId, targetId, damage }) => {
          const target = units.find((u) => u.id === targetId);
          if (!target) return null;
          return (
            <div
              key={`dmg-${targetId}-${Date.now()}`}
              className="damage-number"
              style={{
                left: `${target.position.x * CELL_SIZE + CELL_SIZE / 2}px`,
                top: `${target.position.y * CELL_SIZE + CELL_SIZE / 2}px`,
              }}
            >
              -{damage}
            </div>
          );
        })}

        {attackingUnits.map(({ targetId }) => {
          const target = units.find((u) => u.id === targetId);
          if (!target) return null;
          return (
            <div
              key={`hit-${targetId}-${Date.now()}`}
              className="hit-effect"
              style={{
                left: `${target.position.x * CELL_SIZE + CELL_SIZE / 2}px`,
                top: `${target.position.y * CELL_SIZE + CELL_SIZE / 2}px`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MapGrid;
