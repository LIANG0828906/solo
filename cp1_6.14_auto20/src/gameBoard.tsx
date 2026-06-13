import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Skull } from 'lucide-react';
import { useGameStore } from './store';
import type { Unit, HexCell, DragState, RippleEffect } from './types';
import { HEX_SIZE, GRID_WIDTH, GRID_HEIGHT, TERRAIN_COST, TERRAIN_COLORS, THEME, DRAG_THRESHOLD, ANIMATION_DURATION } from './config';

const hexToPixel = (q: number, r: number): { x: number; y: number } => {
  const x = HEX_SIZE * (3 / 2) * q;
  const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x: x + HEX_SIZE * 2, y: y + HEX_SIZE * 2 };
};

const pixelToHex = (x: number, y: number): { q: number; r: number } => {
  const px = x - HEX_SIZE * 2;
  const py = y - HEX_SIZE * 2;
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

const GameBoard: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

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
  const [animatingUnits, setAnimatingUnits] = useState<Map<string, { fromX: number; fromY: number; toX: number; toY: number; startTime: number }>>(new Map());

  const selectedUnit = useMemo(() => units.find((u) => u.id === selectedUnitId), [units, selectedUnitId]);
  const moveRange = useMemo(() => (selectedUnit && !selectedUnit.isDead ? calculateMoveRange(selectedUnit, terrain) : []), [selectedUnit, terrain]);

  const drawHex = useCallback((ctx: CanvasRenderingContext2D, cell: HexCell) => {
    const { x, y } = hexToPixel(cell.q, cell.r);
    const gradient = ctx.createLinearGradient(x - HEX_SIZE, y - HEX_SIZE, x + HEX_SIZE, y + HEX_SIZE);
    
    switch (cell.terrain) {
      case 'grass':
        gradient.addColorStop(0, '#5A8C49');
        gradient.addColorStop(1, '#3A6C29');
        break;
      case 'stone':
        gradient.addColorStop(0, '#9B8365');
        gradient.addColorStop(1, '#6B5345');
        break;
      case 'water':
        gradient.addColorStop(0, '#4B7EB8');
        gradient.addColorStop(1, '#2B5E98');
        break;
    }

    ctx.beginPath();
    const points = getHexCorners(x, y, HEX_SIZE - 1).split(' ').map(p => {
      const [px, py] = p.split(',').map(Number);
      return { x: px, y: py };
    });
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  const brushPaint = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current || !editMode) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { q, r } = pixelToHex(x, y);
    if (q >= 0 &&