import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import {
  TERRAIN_INFO,
  UNIT_COLORS,
  getMovableCells,
  findPath,
  CELL_SIZE,
  GRID_WIDTH,
  GRID_HEIGHT,
  type Unit,
  type TerrainType,
} from '@/modules/battle-engine';

interface DamagePopup {
  id: string;
  damage: number;
  x: number;
  y: number;
}

interface UnitAnimationState {
  [unitId: string]: {
    attacking?: boolean;
    damaged?: boolean;
    dying?: boolean;
  };
}

const UNIT_ICONS: Record<string, string> = {
  warrior: '⚔️',
  archer: '🏹',
  mage: '🔮',
  assassin: '🗡️',
};

export default function GridMap() {
  const {
    grid,
    units,
    selectedUnitId,
    selectedTerrainTool,
    selectUnit,
    setCellTerrain,
    moveUnit,
  } = useGameStore();

  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [animationStates, setAnimationStates] = useState<UnitAnimationState>({});
  const [animatingUnits, setAnimatingUnits] = useState<Record<string, { x: number; y: number }>>({});
  const prevUnitsRef = useRef<Unit[]>([]);
  const animationTimersRef = useRef<Record<string, number[]>>({});

  const selectedUnit = useMemo(
    () => units.find((u) => u.id === selectedUnitId) || null,
    [units, selectedUnitId]
  );

  const movableCells = useMemo(() => {
    if (!selectedUnit || !selectedUnit.isAlive) return [];
    return getMovableCells(selectedUnit, grid, units);
  }, [selectedUnit, grid, units]);

  const movableSet = useMemo(() => {
    return new Set(movableCells.map((c) => `${c.x},${c.y}`));
  }, [movableCells]);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (selectedTerrainTool) {
        setCellTerrain(x, y, selectedTerrainTool);
        return;
      }

      const unitAtCell = units.find(
        (u) => u.position.x === x && u.position.y === y && u.isAlive
      );

      if (unitAtCell) {
        selectUnit(unitAtCell.id);
        return;
      }

      if (selectedUnit && movableSet.has(`${x},${y}`)) {
        moveUnit(selectedUnit.id, { x, y });
      } else if (!unitAtCell) {
        selectUnit(null);
      }
    },
    [selectedTerrainTool, setCellTerrain, units, selectedUnit, movableSet, selectUnit, moveUnit]
  );

  const addDamagePopup = useCallback((damage: number, x: number, y: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setDamagePopups((prev) => [...prev, { id, damage, x, y }]);
    setTimeout(() => {
      setDamagePopups((prev) => prev.filter((p) => p.id !== id));
    }, 1000);
  }, []);

  const triggerAnimation = useCallback((unitId: string, animationType: 'attacking' | 'damaged' | 'dying') => {
    setAnimationStates((prev) => ({
      ...prev,
      [unitId]: { ...prev[unitId], [animationType]: true },
    }));

    const duration = animationType === 'dying' ? 500 : animationType === 'damaged' ? 500 : 300;
    setTimeout(() => {
      setAnimationStates((prev) => {
        const state = { ...prev[unitId] };
        delete state[animationType];
        return {
          ...prev,
          [unitId]: state,
        };
      });
    }, duration);
  }, []);

  useEffect(() => {
    const prevUnits = prevUnitsRef.current;

    units.forEach((unit) => {
      const prevUnit = prevUnits.find((u) => u.id === unit.id);
      if (!prevUnit) return;

      if (prevUnit.hp > unit.hp && unit.isAlive) {
        const damage = prevUnit.hp - unit.hp;
        addDamagePopup(damage, unit.position.x, unit.position.y);
        triggerAnimation(unit.id, 'damaged');
      }

      if (prevUnit.isAlive && !unit.isAlive) {
        triggerAnimation(unit.id, 'dying');
      }
    });

    prevUnitsRef.current = units;
  }, [units, addDamagePopup, triggerAnimation]);

  const animateAlongPath = useCallback(
    (unitId: string, path: { x: number; y: number }[]) => {
      if (animationTimersRef.current[unitId]) {
        animationTimersRef.current[unitId].forEach((t) => clearTimeout(t));
      }
      const timers: number[] = [];
      animationTimersRef.current[unitId] = timers;

      path.forEach((point, i) => {
        const timer = window.setTimeout(() => {
          setAnimatingUnits((prev) => ({
            ...prev,
            [unitId]: { x: point.x, y: point.y },
          }));

          if (i === path.length - 1) {
            setAnimatingUnits((prev) => {
              const next = { ...prev };
              delete next[unitId];
              return next;
            });
            delete animationTimersRef.current[unitId];
          }
        }, i * 150);
        timers.push(timer);
      });
    },
    []
  );

  useEffect(() => {
    const prevUnits = prevUnitsRef.current;

    units.forEach((unit) => {
      const prevUnit = prevUnits.find((u) => u.id === unit.id);
      if (!prevUnit) return;

      const posChanged =
        prevUnit.position.x !== unit.position.x || prevUnit.position.y !== unit.position.y;

      if (posChanged && unit.isAlive) {
        const path = findPath(
          prevUnit.position.x,
          prevUnit.position.y,
          unit.position.x,
          unit.position.y,
          grid,
          unit.moveRange
        );
        if (path && path.length > 1) {
          setAnimatingUnits((prev) => ({
            ...prev,
            [unit.id]: { x: prevUnit.position.x, y: prevUnit.position.y },
          }));
          animateAlongPath(unit.id, path);
        }
      }
    });
  }, [units, grid, animateAlongPath]);

  const getCellStyle = (x: number, y: number, terrain: TerrainType) => {
    const terrainInfo = TERRAIN_INFO[terrain];
    const isAlternate = (x + y) % 2 === 0;
    const baseColor = terrainInfo.color;

    return {
      backgroundColor: isAlternate ? baseColor : adjustColor(baseColor, 10),
    };
  };

  const getUnitStyle = (unit: Unit) => {
    const color = UNIT_COLORS[unit.unitClass];
    const animPos = animatingUnits[unit.id];
    const pos = animPos || unit.position;
    return {
      left: `${pos.x * CELL_SIZE + (CELL_SIZE - 48) / 2}px`,
      top: `${pos.y * CELL_SIZE + (CELL_SIZE - 48) / 2}px`,
      backgroundColor: color,
      transition: 'left 150ms linear, top 150ms linear',
    };
  };

  const getHpPercent = (unit: Unit) => {
    return (unit.hp / unit.maxHp) * 100;
  };

  const isLowHp = (unit: Unit) => {
    return getHpPercent(unit) < 30;
  };

  const mapWidth = GRID_WIDTH * CELL_SIZE;
  const mapHeight = GRID_HEIGHT * CELL_SIZE;

  return (
    <div className="grid-map-container">
      <div
        className="grid-map"
        style={{
          width: mapWidth,
          height: mapHeight,
          gridTemplateColumns: `repeat(${GRID_WIDTH}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_HEIGHT}, ${CELL_SIZE}px)`,
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const isMovable = movableSet.has(`${x},${y}`);
            return (
              <div
                key={`${x}-${y}`}
                className={`grid-cell ${isMovable ? 'movable' : ''}`}
                style={getCellStyle(x, y, cell.terrain)}
                onClick={() => handleCellClick(x, y)}
              >
                <span className="terrain-icon">{TERRAIN_INFO[cell.terrain].icon}</span>
              </div>
            );
          })
        )}

        {units.map((unit) => {
          if (!unit.isAlive && !animationStates[unit.id]?.dying) return null;

          const animState = animationStates[unit.id] || {};
          const isSelected = unit.id === selectedUnitId;

          return (
            <div
              key={unit.id}
              className={`unit ${isSelected ? 'selected' : ''} ${
                animState.attacking ? 'attacking' : ''
              } ${animState.damaged ? 'damaged' : ''} ${animState.dying ? 'dying' : ''}`}
              style={getUnitStyle(unit)}
              onClick={(e) => {
                e.stopPropagation();
                if (!selectedTerrainTool) {
                  selectUnit(unit.id);
                }
              }}
            >
              <span>{UNIT_ICONS[unit.unitClass] || '?'}</span>
              <div className="hp-bar">
                <div
                  className={`hp-fill ${isLowHp(unit) ? 'low' : ''}`}
                  style={{ width: `${getHpPercent(unit)}%` }}
                />
              </div>
              <div className={`team-badge ${unit.team}`} />
            </div>
          );
        })}

        {damagePopups.map((popup) => (
          <div
            key={popup.id}
            className="damage-popup"
            style={{
              left: `${popup.x * CELL_SIZE + CELL_SIZE / 2}px`,
              top: `${popup.y * CELL_SIZE}px`,
            }}
          >
            -{popup.damage}
          </div>
        ))}
      </div>
    </div>
  );
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(0, 2), 16) + amount));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(2, 4), 16) + amount));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
