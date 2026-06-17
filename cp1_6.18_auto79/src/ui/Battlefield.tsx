import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  GRID_COLS,
  GRID_ROWS,
  HEX_RADIUS,
  HEX_WIDTH,
  HEX_VERTICAL_SPACING,
  hexToPixel,
  getHexCorners,
  getMoveRange,
  getAttackRange,
  isPlayerDeployZone,
} from '../engine/grid';
import { executePlayerMove, executePlayerAttack, executeAITurn } from '../engine/battle';
import type { HexCoord } from '../types';

const UNIT_COLORS: Record<string, string> = {
  warrior: '#E74C3C',
  archer: '#3498DB',
  cavalry: '#F1C40F',
};

const UNIT_RADIUS = 15;

interface DamagePopup {
  id: string;
  unitId: string;
  damage: number;
  x: number;
  y: number;
}

export default function Battlefield() {
  const {
    units,
    selectedUnitId,
    setSelectedUnit,
    phase,
    currentTurn,
    deployingUnitType,
    deployUnit,
    removeUnit,
    setDeployingUnitType,
    animatingUnitId,
    setAnimatingUnit,
    isReplaying,
  } = useGameStore();

  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const [attackTargetId, setAttackTargetId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const popupIdRef = useRef(0);

  const svgWidth = useMemo(() => {
    const lastCol = GRID_COLS - 1;
    const lastRow = GRID_ROWS - 1;
    const rightmost = Math.max(
      hexToPixel(0, lastRow).x + HEX_RADIUS,
      hexToPixel(lastCol, 0).x + HEX_RADIUS,
      hexToPixel(lastCol, lastRow).x + HEX_RADIUS
    );
    return rightmost + HEX_RADIUS;
  }, []);

  const svgHeight = useMemo(() => {
    return HEX_VERTICAL_SPACING * (GRID_ROWS - 1) + HEX_RADIUS * 2;
  }, []);

  const selectedUnit = useMemo(
    () => units.find(u => u.id === selectedUnitId) || null,
    [units, selectedUnitId]
  );

  const moveRange = useMemo(() => {
    if (!selectedUnit || phase !== 'battle' || currentTurn !== 'player' || isReplaying) return [];
    if (selectedUnit.team !== 'player' || selectedUnit.hasMoved) return [];
    return getMoveRange(selectedUnit, units);
  }, [selectedUnit, phase, currentTurn, units, isReplaying]);

  const attackTargets = useMemo(() => {
    if (!selectedUnit || phase !== 'battle' || currentTurn !== 'player' || isReplaying) return [];
    if (selectedUnit.team !== 'player' || selectedUnit.hasAttacked) return [];
    return getAttackRange(selectedUnit, units);
  }, [selectedUnit, phase, currentTurn, units, isReplaying]);

  const moveRangeSet = useMemo(
    () => new Set(moveRange.map(h => `${h.col},${h.row}`)),
    [moveRange]
  );

  const attackTargetSet = useMemo(
    () => new Set(attackTargets.map(u => u.id)),
    [attackTargets]
  );

  const showDamagePopup = useCallback((unitId: string, damage: number) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;
    const { x, y } = hexToPixel(unit.col, unit.row);
    const id = `popup-${popupIdRef.current++}`;
    setDamagePopups(prev => [...prev, { id, unitId, damage, x, y }]);
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== id));
    }, 1000);
  }, [units]);

  const handleHexClick = useCallback((col: number, row: number) => {
    if (isReplaying) return;

    if (phase === 'deploy') {
      if (deployingUnitType && isPlayerDeployZone(col, row)) {
        const success = deployUnit(deployingUnitType, col, row, 'player');
        if (success) {
          const state = useGameStore.getState();
          const remaining = state.deployableUnits.find(d => d.type === deployingUnitType)?.count || 0;
          const playerCount = state.units.filter(u => u.team === 'player').length;
          if (remaining <= 0 || playerCount >= 4) {
            setDeployingUnitType(null);
          }
        }
      }
      return;
    }

    if (phase === 'battle' && currentTurn === 'player') {
      const key = `${col},${row}`;
      if (selectedUnit && moveRangeSet.has(key)) {
        executePlayerMove(selectedUnit.id, col, row);
        return;
      }

      const unitOnHex = units.find(u => u.col === col && u.row === row && u.hp > 0);
      if (unitOnHex) {
        if (unitOnHex.team === 'player') {
          setSelectedUnit(unitOnHex.id);
        } else if (selectedUnit && attackTargetSet.has(unitOnHex.id)) {
          setAnimatingUnit(unitOnHex.id);
          setAttackTargetId(unitOnHex.id);
          const damage = executePlayerAttack(selectedUnit.id, unitOnHex.id);
          if (damage > 0) {
            showDamagePopup(unitOnHex.id, damage);
          }
          setTimeout(() => {
            setAnimatingUnit(null);
            setAttackTargetId(null);
          }, 300);
        }
      } else {
        setSelectedUnit(null);
      }
    }
  }, [phase, currentTurn, selectedUnit, moveRangeSet, attackTargetSet, deployingUnitType, deployUnit, units, setSelectedUnit, setDeployingUnitType, setAnimatingUnit, showDamagePopup, isReplaying]);

  const handleUnitRightClick = useCallback((e: React.MouseEvent, unitId: string) => {
    e.preventDefault();
    if (phase !== 'deploy') return;
    const unit = units.find(u => u.id === unitId);
    if (unit && unit.team === 'player') {
      removeUnit(unitId);
    }
  }, [phase, units, removeUnit]);

  useEffect(() => {
    if (phase === 'battle' && currentTurn === 'ai' && !isReplaying) {
      executeAITurn();
    }
  }, [currentTurn, phase, isReplaying]);

  const hexagons = useMemo(() => {
    const hexes: { col: number; row: number; x: number; y: number; points: string }[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const { x, y } = hexToPixel(col, row);
        const points = getHexCorners(x + HEX_RADIUS, y + HEX_RADIUS);
        hexes.push({ col, row, x: x + HEX_RADIUS, y: y + HEX_RADIUS, points });
      }
    }
    return hexes;
  }, []);

  const getHexFill = (col: number, row: number, isHovered: boolean) => {
    const key = `${col},${row}`;

    if (phase === 'deploy' && isPlayerDeployZone(col, row) && deployingUnitType) {
      return 'rgba(46, 204, 113, 0.25)';
    }

    if (selectedUnit && moveRangeSet.has(key)) {
      return 'rgba(46, 204, 113, 0.4)';
    }

    return '#2D2D44';
  };

  const getHexStroke = (col: number, row: number, isHovered: boolean) => {
    if (isHovered) {
      return '#58A6FF';
    }
    return '#4A4A6A';
  };

  const isUnitAnimating = (unitId: string) => {
    return animatingUnitId === unitId || attackTargetId === unitId;
  };

  return (
    <div className="battlefield-container">
      <svg
        ref={svgRef}
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="battlefield-svg"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {hexagons.map(hex => {
          const isHovered = hoveredHex?.col === hex.col && hoveredHex?.row === hex.row;
          const isInMoveRange = moveRangeSet.has(`${hex.col},${hex.row}`);

          return (
            <polygon
              key={`hex-${hex.col}-${hex.row}`}
              points={hex.points}
              fill={getHexFill(hex.col, hex.row, isHovered)}
              stroke={getHexStroke(hex.col, hex.row, isHovered)}
              strokeWidth={isHovered || isInMoveRange ? 2 : 1}
              filter={isHovered ? 'url(#glow)' : undefined}
              className="hex-cell"
              onClick={() => handleHexClick(hex.col, hex.row)}
              onMouseEnter={() => setHoveredHex({ col: hex.col, row: hex.row })}
              onMouseLeave={() => setHoveredHex(null)}
              style={{ cursor: phase === 'deploy' && deployingUnitType ? 'pointer' : 'default' }}
            />
          );
        })}

        {units.filter(u => u.hp > 0).map(unit => {
          const { x, y } = hexToPixel(unit.col, unit.row);
          const cx = x + HEX_RADIUS;
          const cy = y + HEX_RADIUS;
          const isSelected = selectedUnitId === unit.id;
          const isAttackTarget = attackTargetSet.has(unit.id);
          const animating = isUnitAnimating(unit.id);

          return (
            <g
              key={unit.id}
              className={`unit ${animating ? 'unit-shake' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleHexClick(unit.col, unit.row);
              }}
              onContextMenu={(e) => handleUnitRightClick(e, unit.id)}
              style={{ cursor: 'pointer' }}
            >
              {isSelected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={UNIT_RADIUS + 8}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={2}
                  filter="url(#strongGlow)"
                  className="selection-ring"
                />
              )}

              {isAttackTarget && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={UNIT_RADIUS + 5}
                  fill="rgba(231, 76, 60, 0.3)"
                  stroke="#E74C3C"
                  strokeWidth={2}
                  className="attack-target-ring"
                />
              )}

              <circle
                cx={cx}
                cy={cy}
                r={UNIT_RADIUS}
                fill={UNIT_COLORS[unit.type]}
                stroke={unit.team === 'player' ? '#58A6FF' : '#FFA657'}
                strokeWidth={2}
                filter="url(#glow)"
                className="unit-circle"
              />

              <text
                x={cx}
                y={cy - UNIT_RADIUS - 6}
                textAnchor="middle"
                fontSize={10}
                fill="#ffffff"
                fontWeight="bold"
              >
                {unit.hp}/{unit.maxHp}
              </text>

              {unit.team === 'ai' && (
                <text
                  x={cx}
                  y={cy + UNIT_RADIUS + 12}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#FFA657"
                >
                  AI
                </text>
              )}
            </g>
          );
        })}

        {damagePopups.map(popup => (
          <text
            key={popup.id}
            x={popup.x + HEX_RADIUS}
            y={popup.y + HEX_RADIUS}
            textAnchor="middle"
            fontSize={18}
            fontWeight="bold"
            fill="#E74C3C"
            className="damage-popup"
            filter="url(#strongGlow)"
          >
            -{popup.damage}
          </text>
        ))}
      </svg>

      <style>{`
        .hex-cell {
          transition: fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease;
        }
        .hex-cell:hover {
          stroke: #58A6FF;
        }
        .unit-circle {
          transition: transform 0.3s ease;
        }
        .selection-ring {
          animation: pulse 0.3s ease-in-out;
        }
        @keyframes pulse {
          0% { r: ${UNIT_RADIUS + 4}; opacity: 0.5; }
          50% { r: ${UNIT_RADIUS + 10}; opacity: 1; }
          100% { r: ${UNIT_RADIUS + 8}; opacity: 1; }
        }
        .attack-target-ring {
          animation: flash-red 0.2s ease-in-out infinite alternate;
        }
        @keyframes flash-red {
          0% { opacity: 0.3; }
          100% { opacity: 0.8; }
        }
        .unit-shake {
          animation: shake 0.15s ease-in-out 2;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .damage-popup {
          animation: float-up 1s ease-out forwards;
          pointer-events: none;
        }
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-30px); }
        }
        .battlefield-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: #161B22;
          border-radius: 8px;
          border: 1px solid #30363D;
        }
        .battlefield-svg {
          user-select: none;
        }
      `}</style>
    </div>
  );
}
