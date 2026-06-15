import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Skull, User, Skull as EnemyIcon } from 'lucide-react';
import { useGameStore } from './store';
import type { Unit, HexCell, DragState, RippleEffect } from './types';
import { HEX_SIZE, GRID_WIDTH, GRID_HEIGHT, TERRAIN_COST, THEME, ANIMATION_DURATION } from './config';

const hexToPixel = (q: number, r: number): { x: number; y: number } => {
  const x = HEX_SIZE * (3 / 2) * q;
  const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x: x + HEX_SIZE * 2.5, y: y + HEX_SIZE * 2.5 };
};

const pixelToHex = (x: number, y: number): { q: number; r: number } => {
  const px = x - HEX_SIZE * 2.5;
  const py = y - HEX_SIZE * 2.5;
  const q = (2 / 3 * px) / HEX_SIZE;
  const r = (-1 / 3 * px + Math.sqrt(3) / 3 * py) / HEX_SIZE;
  return hexRound(q, r);
};

const hexRound = (q: number, r: number): { q: number; r: number } => {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  return { q: rq, r: rr };
};

const getHexCorners = (cx: number, cy: number, size: number): string => {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
};

const getNeighbors = (q: number, r: number): Array<{ q: number; r: number }> => {
  return [
    { q: q + 1, r: r },
    { q: q + 1, r: r - 1 },
    { q: q, r: r - 1 },
    { q: q - 1, r: r },
    { q: q - 1, r: r + 1 },
    { q: q, r: r + 1 },
  ];
};

interface MoveRangeCell {
  q: number;
  r: number;
  cost: number;
}

const calculateMoveRange = (unit: Unit, terrain: HexCell[]): MoveRangeCell[] => {
  const result: MoveRangeCell[] = [];
  const visited = new Map<string, number>();
  const queue: Array<{ q: number; r: number; cost: number }> = [
    { q: unit.position.q, r: unit.position.r, cost: 0 },
  ];
  visited.set(`${unit.position.q},${unit.position.r}`, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.cost > 0) {
      result.push({ q: current.q, r: current.r, cost: current.cost });
    }

    const neighbors = getNeighbors(current.q, current.r);
    for (const neighbor of neighbors) {
      const key = `${neighbor.q},${neighbor.r}`;
      const cell = terrain.find((t) => t.q === neighbor.q && t.r === neighbor.r);
      if (!cell) continue;
      if (neighbor.q < 0 || neighbor.q >= GRID_WIDTH || neighbor.r < 0 || neighbor.r >= GRID_HEIGHT) continue;

      const moveCost = TERRAIN_COST[cell.terrain];
      const totalCost = current.cost + moveCost;

      if (totalCost <= unit.movement && (!visited.has(key) || visited.get(key)! > totalCost)) {
        visited.set(key, totalCost);
        queue.push({ ...neighbor, cost: totalCost });
      }
    }
  }

  return result;
};

interface UnitAnimationState {
  unitId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
}

const GameBoard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();

  const {
    units,
    terrain,
    selectedUnitId,
    editMode,
    brushType,
    setSelectedUnit,
    updateTerrain,
    moveUnit,
    addUnit,
    addLog,
    currentRound,
  } = useGameStore();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    unitId: null,
    startPos: null,
    currentPos: null,
  });

  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [unitAnimations, setUnitAnimations] = useState<UnitAnimationState[]>([]);
  const [renderTick, setRenderTick] = useState(0);

  const selectedUnit = useMemo(() => units.find((u) => u.id === selectedUnitId), [units, selectedUnitId]);
  const moveRange = useMemo(() => (selectedUnit && !selectedUnit.isDead ? calculateMoveRange(selectedUnit, terrain) : []), [selectedUnit, terrain]);

  const canvasSize = useMemo(() => {
    const farHex = hexToPixel(GRID_WIDTH - 1, GRID_HEIGHT - 1);
    return {
      width: farHex.x + HEX_SIZE * 3,
      height: farHex.y + HEX_SIZE * 3,
    };
  }, []);

  useEffect(() => {
    const animate = (time: number) => {
      setRenderTick((t) => t + 1);

      setUnitAnimations((prev) =>
        prev.filter((anim) => {
          const elapsed = time - anim.startTime;
          return elapsed < ANIMATION_DURATION;
        })
      );

      setRipples((prev) =>
        prev.filter((ripple) => {
          const elapsed = time - ripple.startTime;
          return elapsed < 600;
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getUnitDisplayPos = useCallback(
    (unit: Unit): { x: number; y: number } => {
      const anim = unitAnimations.find((a) => a.unitId === unit.id);
      if (anim) {
        const elapsed = performance.now() - anim.startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        return {
          x: anim.fromX + (anim.toX - anim.fromX) * eased,
          y: anim.fromY + (anim.toY - anim.fromY) * eased,
        };
      }
      return hexToPixel(unit.position.q, unit.position.r);
    },
    [unitAnimations]
  );

  const brushPaint = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !editMode) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const { q, r } = pixelToHex(x, y);
      if (q >= 0 && q < GRID_WIDTH && r >= 0 && r < GRID_HEIGHT) {
        const cell = terrain.find((t) => t.q === q && t.r === r);
        if (cell && cell.terrain !== brushType) {
          updateTerrain(q, r, brushType);
          setRipples((prev) => [
            ...prev.filter((rp) => !(rp.q === q && rp.r === r)),
            { q, r, startTime: performance.now() },
          ]);
        }
      }
    },
    [editMode, terrain, brushType, updateTerrain]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      if (isPainting && editMode) {
        brushPaint(e.clientX, e.clientY);
      }

      if (dragState.isDragging && dragState.unitId) {
        setDragState((prev) => ({
          ...prev,
          currentPos: { x, y },
        }));
      }
    },
    [isPainting, editMode, brushPaint, dragState.isDragging, dragState.unitId]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, unit: Unit) => {
      if (editMode || unit.isDead) return;
      e.stopPropagation();
      setSelectedUnit(unit.id);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragState({
        isDragging: false,
        unitId: unit.id,
        startPos: { x, y },
        currentPos: { x, y },
      });
    },
    [editMode, setSelectedUnit]
  );

  const handleUnitDragStart = useCallback(
    (e: React.MouseEvent, unit: Unit) => {
      if (editMode || unit.isDead) return;
      e.preventDefault();
      e.stopPropagation();
      setSelectedUnit(unit.id);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragState({
        isDragging: true,
        unitId: unit.id,
        startPos: { x, y },
        currentPos: { x, y },
      });
    },
    [editMode, setSelectedUnit]
  );

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.unitId && dragState.currentPos) {
      const movingUnitId = dragState.unitId;
      const { q, r } = pixelToHex(dragState.currentPos.x, dragState.currentPos.y);
      const unit = units.find((u) => u.id === movingUnitId);
      if (unit && q >= 0 && q < GRID_WIDTH && r >= 0 && r < GRID_HEIGHT) {
        const inRange = moveRange.some((m) => m.q === q && m.r === r);
        const isCurrentPos = unit.position.q === q && unit.position.r === r;

        if (inRange && !isCurrentPos) {
          const fromPos = hexToPixel(unit.position.q, unit.position.r);
          const toPos = hexToPixel(q, r);
          setUnitAnimations((prev) => [
            ...prev.filter((a) => a.unitId !== movingUnitId),
            {
              unitId: movingUnitId,
              fromX: fromPos.x,
              fromY: fromPos.y,
              toX: toPos.x,
              toY: toPos.y,
              startTime: performance.now(),
            },
          ]);

          moveUnit(movingUnitId, q, r);
          addLog({
            round: currentRound,
            source: unit.name,
            target: '',
            skill: '移动',
            value: 0,
            type: 'move',
          });
        }
      }
    }
    setDragState({
      isDragging: false,
      unitId: null,
      startPos: null,
      currentPos: null,
    });
    setIsPainting(false);
  }, [dragState, units, moveRange, moveUnit, addLog, currentRound]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { q, r } = pixelToHex(x, y);

      if (editMode) {
        setIsPainting(true);
        brushPaint(e.clientX, e.clientY);
      } else {
        const unitAtPos = units.find((u) => u.position.q === q && u.position.r === r && !u.isDead);
        if (unitAtPos) {
          setSelectedUnit(unitAtPos.id);
        } else {
          setSelectedUnit(null);
        }
      }
    },
    [editMode, brushPaint, units, setSelectedUnit]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (editMode) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { q, r } = pixelToHex(x, y);

      if (q >= 0 && q < GRID_WIDTH && r >= 0 && r < GRID_HEIGHT) {
        const unitAtPos = units.find((u) => u.position.q === q && u.position.r === r);
        if (!unitAtPos) {
          addUnit('player', q, r);
        }
      }
    },
    [editMode, units, addUnit]
  );

  const renderHex = (cell: HexCell) => {
    const { x, y } = hexToPixel(cell.q, cell.r);
    const points = getHexCorners(x, y, HEX_SIZE - 1);

    const inMoveRange = moveRange.some((m) => m.q === cell.q && m.r === cell.r);
    const isSelected = selectedUnit?.position.q === cell.q && selectedUnit?.position.r === cell.r;

    let fillId = `terrain-${cell.terrain}`;

    return (
      <g key={`hex-${cell.q}-${cell.r}`}>
        <polygon
          points={points}
          fill={`url(#${fillId})`}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
          className="hex-cell"
          style={{
            filter: inMoveRange ? 'brightness(1.3)' : undefined,
          }}
        />
        {inMoveRange && (
          <polygon
            points={getHexCorners(x, y, HEX_SIZE - 3)}
            fill="rgba(201, 162, 39, 0.25)"
            stroke={THEME.secondary}
            strokeWidth="1.5"
            className="move-range-hex"
          />
        )}
        {isSelected && (
          <polygon
            points={getHexCorners(x, y, HEX_SIZE + 2)}
            fill="none"
            stroke={THEME.secondary}
            strokeWidth="3"
            className="selected-hex-glow"
          />
        )}
      </g>
    );
  };

  const renderRipples = () => {
    return ripples.map((ripple, index) => {
      const { x, y } = hexToPixel(ripple.q, ripple.r);
      const elapsed = performance.now() - ripple.startTime;
      const progress = Math.min(elapsed / 600, 1);
      const scale = 0.5 + progress * 1.5;
      const opacity = 1 - progress;

      return (
        <polygon
          key={`ripple-${index}-${ripple.q}-${ripple.r}`}
          points={getHexCorners(x, y, HEX_SIZE * scale)}
          fill="none"
          stroke={THEME.secondary}
          strokeWidth="2"
          opacity={opacity}
          style={{ transformOrigin: `${x}px ${y}px` }}
        />
      );
    });
  };

  const renderUnit = (unit: Unit) => {
    const pos = getUnitDisplayPos(unit);
    const isSelected = unit.id === selectedUnitId;
    const isHovered = unit.id === hoveredUnitId;
    const isDragging = dragState.isDragging && dragState.unitId === unit.id;
    const displayPos = isDragging && dragState.currentPos ? dragState.currentPos : pos;

    const hpPercent = unit.hp / unit.maxHp;

    return (
      <g
        key={unit.id}
        className={`unit-token ${isDragging ? 'dragging' : ''}`}
        style={{
          cursor: editMode ? 'default' : 'grab',
          transition: isDragging ? 'none' : `filter ${ANIMATION_DURATION}ms ease`,
        }}
        onMouseEnter={() => setHoveredUnitId(unit.id)}
        onMouseLeave={() => setHoveredUnitId(null)}
        onMouseDown={(e) => handleUnitDragStart(e, unit)}
        onClick={(e) => handleMouseDown(e, unit)}
      >
        {isSelected && !unit.isDead && (
          <circle
            cx={displayPos.x}
            cy={displayPos.y}
            r={HEX_SIZE * 0.9}
            fill="none"
            stroke={THEME.secondary}
            strokeWidth="3"
            className="unit-selection-ring"
          />
        )}

        {(isHovered || isSelected) && !unit.isDead && (
          <circle
            cx={displayPos.x}
            cy={displayPos.y}
            r={HEX_SIZE * 0.75}
            fill="none"
            stroke={isSelected ? '#FF6B35' : THEME.secondary}
            strokeWidth="2"
            className={`unit-glow-ring ${isSelected ? 'fire-glow' : ''}`}
          />
        )}

        <circle
          cx={displayPos.x}
          cy={displayPos.y}
          r={HEX_SIZE * 0.6}
          fill={unit.isDead ? '#555' : unit.type === 'player' ? '#4A90D9' : '#C94A4A'}
          stroke={unit.isDead ? '#333' : '#222'}
          strokeWidth="2"
          className="unit-body"
          style={{
            filter: unit.isDead ? 'grayscale(1) opacity(0.6)' : undefined,
          }}
        />

        <foreignObject
          x={displayPos.x - HEX_SIZE * 0.4}
          y={displayPos.y - HEX_SIZE * 0.4}
          width={HEX_SIZE * 0.8}
          height={HEX_SIZE * 0.8}
        >
          <div className="flex items-center justify-center w-full h-full text-white">
            {unit.isDead ? (
              <Skull size={HEX_SIZE * 0.5} className="text-gray-400" />
            ) : unit.type === 'player' ? (
              <User size={HEX_SIZE * 0.5} />
            ) : (
              <EnemyIcon size={HEX_SIZE * 0.5} />
            )}
          </div>
        </foreignObject>

        {!unit.isDead && (
          <g className="unit-hp-bar">
            <rect
              x={displayPos.x - HEX_SIZE * 0.5}
              y={displayPos.y + HEX_SIZE * 0.65}
              width={HEX_SIZE}
              height="5"
              rx="2"
              fill="#1a1a1a"
              stroke="#333"
              strokeWidth="1"
            />
            <rect
              x={displayPos.x - HEX_SIZE * 0.5 + 1}
              y={displayPos.y + HEX_SIZE * 0.65 + 1}
              width={(HEX_SIZE - 2) * hpPercent}
              height="3"
              rx="1.5"
              fill={hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FF9800' : '#f44336'}
              className="hp-bar-fill"
              style={{
                transition: `width ${ANIMATION_DURATION}ms ease-out, fill ${ANIMATION_DURATION}ms ease`,
              }}
            />
          </g>
        )}

        <text
          x={displayPos.x}
          y={displayPos.y - HEX_SIZE * 0.85}
          textAnchor="middle"
          fill={unit.isDead ? '#888' : THEME.accent}
          fontSize="10"
          fontWeight="bold"
          className="unit-name-label"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
        >
          {unit.name}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto game-board-container"
      onMouseMove={handleMouseMove}
      onMouseDown={handleCanvasMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      style={{
        background: `
          linear-gradient(135deg, rgba(139, 90, 43, 0.15) 0%, rgba(101, 67, 33, 0.2) 50%, rgba(139, 90, 43, 0.15) 100%),
          repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(139, 90, 43, 0.03) 10px, rgba(139, 90, 43, 0.03) 20px),
          #2D1F14
        `,
      }}
    >
      <svg
        ref={svgRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="game-board-svg"
        style={{ userSelect: 'none' }}
      >
        <defs>
          <linearGradient id="terrain-grass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5A8C49" />
            <stop offset="50%" stopColor="#4A7C39" />
            <stop offset="100%" stopColor="#3A6C29" />
          </linearGradient>
          <linearGradient id="terrain-stone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A89375" />
            <stop offset="50%" stopColor="#8B7355" />
            <stop offset="100%" stopColor="#6B5345" />
          </linearGradient>
          <linearGradient id="terrain-water" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B8EC8" />
            <stop offset="50%" stopColor="#3B6EA8" />
            <stop offset="100%" stopColor="#2B5E98" />
          </linearGradient>

          <pattern id="grass-texture" patternUnits="userSpaceOnUse" width="8" height="8">
            <rect width="8" height="8" fill="url(#terrain-grass)" />
            <circle cx="2" cy="2" r="0.5" fill="rgba(90, 156, 73, 0.4)" />
            <circle cx="6" cy="5" r="0.5" fill="rgba(58, 108, 41, 0.4)" />
          </pattern>

          <pattern id="stone-texture" patternUnits="userSpaceOnUse" width="12" height="12">
            <rect width="12" height="12" fill="url(#terrain-stone)" />
            <rect x="1" y="1" width="4" height="3" rx="1" fill="rgba(168, 147, 117, 0.3)" />
            <rect x="7" y="6" width="4" height="4" rx="1" fill="rgba(107, 83, 69, 0.3)" />
          </pattern>

          <pattern id="water-texture" patternUnits="userSpaceOnUse" width="16" height="8">
            <rect width="16" height="8" fill="url(#terrain-water)" />
            <path d="M0 4 Q 2 2, 4 4 T 8 4 T 12 4 T 16 4" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
          </pattern>

          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="hex-grid">
          {terrain.map((cell) => renderHex(cell))}
        </g>

        <g className="ripple-effects">{renderRipples()}</g>

        <g className="units-layer">
          {units.map((unit) => renderUnit(unit))}
        </g>

        {editMode && mousePos && (
          <g className="brush-cursor">
            <circle
              cx={mousePos.x}
              cy={mousePos.y}
              r={HEX_SIZE * 0.8}
              fill="none"
              stroke={THEME.secondary}
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
              className="brush-indicator"
            />
            <circle
              cx={mousePos.x}
              cy={mousePos.y}
              r={HEX_SIZE * 0.5}
              fill={THEME.secondary}
              opacity="0.15"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

export default GameBoard;
