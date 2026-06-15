import type { HexCoord, Unit, UnitType } from '../store/gameStore';

const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

export const COLORS = {
  background: '#0f172a',
  gridStroke: '#475569',
  gridFill: '#1e293b',
  highlight: '#60a5fa',
  highlightAlpha: 0.3,
  unitBorder: '#ffffff',
  unitAssault: '#fbbf24',
  unitSniper: '#a78bfa',
  unitMedic: '#34d399',
  unitInactive: '#64748b'
};

export const ANIMATION_DURATION_PER_HEX = 200;

export function hexToPixel(q: number, r: number, radius: number, offsetX: number, offsetY: number): { x: number; y: number } {
  const x = radius * (3 / 2 * q);
  const y = radius * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x: x + offsetX, y: y + offsetY };
}

export function pixelToHex(px: number, py: number, radius: number, offsetX: number, offsetY: number): HexCoord {
  const x = px - offsetX;
  const y = py - offsetY;
  
  const q = (2 / 3 * x) / radius;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / radius;
  
  return hexRound(q, r);
}

export function hexRound(q: number, r: number): HexCoord {
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
}

export function getHexCorners(cx: number, cy: number, radius: number): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    corners.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    });
  }
  return corners;
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

export function getNeighbors(hex: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(dir => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r
  }));
}

export function getHexesInRange(center: HexCoord, range: number, gridSize: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -range; q <= range; q++) {
    for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
      const hq = center.q + q;
      const hr = center.r + r;
      if (hq >= 0 && hq < gridSize && hr >= 0 && hr < gridSize) {
        results.push({ q: hq, r: hr });
      }
    }
  }
  return results;
}

export function getReachableHexes(
  start: HexCoord,
  moveRange: number,
  units: Unit[],
  gridSize: number
): HexCoord[] {
  if (moveRange <= 0) return [];
  
  const occupied = new Set(units.map(u => `${u.q},${u.r}`));
  occupied.delete(`${start.q},${start.r}`);
  
  const reachable: HexCoord[] = [];
  const visited = new Set<string>();
  const queue: { hex: HexCoord; distance: number }[] = [{ hex: start, distance: 0 }];
  visited.add(`${start.q},${start.r}`);
  
  while (queue.length > 0) {
    const { hex, distance } = queue.shift()!;
    
    if (distance > 0 && !occupied.has(`${hex.q},${hex.r}`)) {
      reachable.push(hex);
    }
    
    if (distance >= moveRange) continue;
    
    for (const neighbor of getNeighbors(hex)) {
      const key = `${neighbor.q},${neighbor.r}`;
      if (visited.has(key)) continue;
      if (neighbor.q < 0 || neighbor.q >= gridSize || neighbor.r < 0 || neighbor.r >= gridSize) continue;
      
      visited.add(key);
      queue.push({ hex: neighbor, distance: distance + 1 });
    }
  }
  
  return reachable;
}

export function findPath(
  start: HexCoord,
  end: HexCoord,
  units: Unit[],
  gridSize: number,
  maxRange: number
): HexCoord[] {
  if (maxRange <= 0) return [];
  if (hexDistance(start, end) > maxRange) return [];
  if (start.q === end.q && start.r === end.r) return [];
  
  const occupied = new Set(units.map(u => `${u.q},${u.r}`));
  occupied.delete(`${start.q},${start.r}`);
  
  const queue: { hex: HexCoord; path: HexCoord[] }[] = [{ hex: start, path: [start] }];
  const visited = new Set<string>();
  visited.add(`${start.q},${start.r}`);
  
  while (queue.length > 0) {
    const { hex, path } = queue.shift()!;
    
    if (hex.q === end.q && hex.r === end.r) {
      return path;
    }
    
    if (path.length - 1 >= maxRange) continue;
    
    for (const neighbor of getNeighbors(hex)) {
      const key = `${neighbor.q},${neighbor.r}`;
      if (visited.has(key)) continue;
      if (neighbor.q < 0 || neighbor.q >= gridSize || neighbor.r < 0 || neighbor.r >= gridSize) continue;
      if (occupied.has(key) && !(neighbor.q === end.q && neighbor.r === end.r)) continue;
      
      visited.add(key);
      queue.push({ hex: neighbor, path: [...path, neighbor] });
    }
  }
  
  return [];
}

export function getUnitColor(type: UnitType, hasActed: boolean): string {
  if (hasActed) return COLORS.unitInactive;
  switch (type) {
    case 'assault': return COLORS.unitAssault;
    case 'sniper': return COLORS.unitSniper;
    case 'medic': return COLORS.unitMedic;
  }
}

export function getUnitTypeName(type: UnitType): string {
  switch (type) {
    case 'assault': return '突击兵';
    case 'sniper': return '狙击手';
    case 'medic': return '医疗兵';
  }
}

export function drawHex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fill: string,
  stroke: string,
  lineWidth: number = 1
): void {
  const corners = getHexCorners(cx, cy, radius);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

interface RenderState {
  gridSize: number;
  hexRadius: number;
  offsetX: number;
  offsetY: number;
  highlightedHexes: HexCoord[];
  units: Unit[];
  selectedUnitId: string | null;
  isAnimating: boolean;
  animationUnitId: string | null;
  animationPath: HexCoord[];
  animationProgress: number;
}

let currentState: RenderState | null = null;
let dirtyHexes = new Set<string>();
let animationFrameId: number | null = null;

function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

function getHexBounds(q: number, r: number, radius: number, offsetX: number, offsetY: number) {
  const { x, y } = hexToPixel(q, r, radius, offsetX, offsetY);
  return {
    minX: x - radius,
    maxX: x + radius,
    minY: y - radius,
    maxY: y + radius
  };
}

function markAllDirty(gridSize: number) {
  dirtyHexes.clear();
  for (let q = 0; q < gridSize; q++) {
    for (let r = 0; r < gridSize; r++) {
      dirtyHexes.add(hexKey(q, r));
    }
  }
}



function getDirtyBounds(state: RenderState) {
  if (dirtyHexes.size === 0) return null;
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const key of dirtyHexes) {
    const [q, r] = key.split(',').map(Number);
    const bounds = getHexBounds(q, r, state.hexRadius, state.offsetX, state.offsetY);
    minX = Math.min(minX, bounds.minX);
    maxX = Math.max(maxX, bounds.maxX);
    minY = Math.min(minY, bounds.minY);
    maxY = Math.max(maxY, bounds.maxY);
  }
  
  return {
    x: Math.floor(minX) - 2,
    y: Math.floor(minY) - 2,
    w: Math.ceil(maxX - minX) + 4,
    h: Math.ceil(maxY - minY) + 4
  };
}

function renderHex(
  ctx: CanvasRenderingContext2D,
  q: number,
  r: number,
  state: RenderState
) {
  const { x, y } = hexToPixel(q, r, state.hexRadius, state.offsetX, state.offsetY);
  const isHighlighted = state.highlightedHexes.some(h => h.q === q && h.r === r);
  
  if (isHighlighted) {
    ctx.save();
    drawHex(ctx, x, y, state.hexRadius - 1, COLORS.gridFill, COLORS.gridStroke, 1);
    ctx.globalAlpha = COLORS.highlightAlpha;
    drawHex(ctx, x, y, state.hexRadius - 1, COLORS.highlight, COLORS.highlight, 2);
    ctx.restore();
  } else {
    drawHex(ctx, x, y, state.hexRadius - 1, COLORS.gridFill, COLORS.gridStroke, 1);
  }
}

function renderUnitsInDirtyArea(ctx: CanvasRenderingContext2D, state: RenderState) {
  const unitPositions = new Map<string, { unit: Unit; isSelected: boolean; isAnimating: boolean; animX: number; animY: number }>();
  
  if (state.isAnimating && state.animationUnitId && state.animationPath.length > 1) {
    const animUnit = state.units.find(u => u.id === state.animationUnitId);
    if (animUnit) {
      const totalSteps = state.animationPath.length - 1;
      const currentStep = Math.floor(state.animationProgress * totalSteps);
      const stepProgress = (state.animationProgress * totalSteps) - currentStep;
      
      const fromHex = state.animationPath[Math.min(currentStep, state.animationPath.length - 1)];
      const toHex = state.animationPath[Math.min(currentStep + 1, state.animationPath.length - 1)];
      
      const fromPos = hexToPixel(fromHex.q, fromHex.r, state.hexRadius, state.offsetX, state.offsetY);
      const toPos = hexToPixel(toHex.q, toHex.r, state.hexRadius, state.offsetX, state.offsetY);
      
      const animX = fromPos.x + (toPos.x - fromPos.x) * stepProgress;
      const animY = fromPos.y + (toPos.y - fromPos.y) * stepProgress;
      
      unitPositions.set(state.animationUnitId, {
        unit: animUnit,
        isSelected: false,
        isAnimating: true,
        animX,
        animY
      });
    }
  }
  
  for (const unit of state.units) {
    if (unitPositions.has(unit.id)) continue;
    
    const isSelected = unit.id === state.selectedUnitId;
    const { x, y } = hexToPixel(unit.q, unit.r, state.hexRadius, state.offsetX, state.offsetY);
    
    unitPositions.set(unit.id, {
      unit,
      isSelected,
      isAnimating: false,
      animX: x,
      animY: y
    });
  }
  
  for (const [, data] of unitPositions) {
    const { unit, isSelected, isAnimating, animX, animY } = data;
    const hexKeyStr = isAnimating ? '' : hexKey(unit.q, unit.r);
    
    if (!isAnimating && !dirtyHexes.has(hexKeyStr)) continue;
    
    drawUnit(ctx, animX, animY, unit, isSelected);
  }
}

function drawGridFrame(ctx: CanvasRenderingContext2D, state: RenderState) {
  const bounds = getDirtyBounds(state);
  
  if (!bounds) return;
  
  ctx.save();
  ctx.beginPath();
  ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h);
  ctx.clip();
  
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
  
  for (const key of dirtyHexes) {
    const [q, r] = key.split(',').map(Number);
    renderHex(ctx, q, r, state);
  }
  
  renderUnitsInDirtyArea(ctx, state);
  
  ctx.restore();
  
  dirtyHexes.clear();
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  gridSize: number,
  hexRadius: number,
  offsetX: number,
  offsetY: number,
  highlightedHexes: HexCoord[],
  units: Unit[],
  selectedUnitId: string | null,
  isAnimating: boolean,
  animationUnitId: string | null,
  animationPath: HexCoord[],
  animationProgress: number
): void {
  const newState: RenderState = {
    gridSize,
    hexRadius,
    offsetX,
    offsetY,
    highlightedHexes,
    units,
    selectedUnitId,
    isAnimating,
    animationUnitId,
    animationPath,
    animationProgress
  };
  
  if (!currentState) {
    currentState = newState;
    markAllDirty(gridSize);
    const bounds = getDirtyBounds(newState);
    if (bounds) {
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawGridFrame(ctx, newState);
    }
    return;
  }
  
  const oldState = currentState;
  
  if (oldState.gridSize !== gridSize ||
      oldState.hexRadius !== hexRadius ||
      oldState.offsetX !== offsetX ||
      oldState.offsetY !== offsetY) {
    currentState = newState;
    markAllDirty(gridSize);
    const bounds = getDirtyBounds(newState);
    if (bounds) {
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawGridFrame(ctx, newState);
    }
    return;
  }
  
  const oldHighlightKeys = new Set(oldState.highlightedHexes.map(h => hexKey(h.q, h.r)));
  const newHighlightKeys = new Set(highlightedHexes.map(h => hexKey(h.q, h.r)));
  
  for (const h of oldState.highlightedHexes) {
    if (!newHighlightKeys.has(hexKey(h.q, h.r))) {
      dirtyHexes.add(hexKey(h.q, h.r));
    }
  }
  for (const h of highlightedHexes) {
    if (!oldHighlightKeys.has(hexKey(h.q, h.r))) {
      dirtyHexes.add(hexKey(h.q, h.r));
    }
  }
  
  const oldUnitMap = new Map(oldState.units.map(u => [u.id, u]));
  const newUnitMap = new Map(units.map(u => [u.id, u]));
  
  for (const u of oldState.units) {
    if (!newUnitMap.has(u.id)) {
      dirtyHexes.add(hexKey(u.q, u.r));
    }
  }
  
  for (const u of units) {
    const oldUnit = oldUnitMap.get(u.id);
    if (!oldUnit) {
      dirtyHexes.add(hexKey(u.q, u.r));
    } else if (oldUnit.q !== u.q || oldUnit.r !== u.r || oldUnit.hasActed !== u.hasActed || oldUnit.type !== u.type) {
      dirtyHexes.add(hexKey(oldUnit.q, oldUnit.r));
      dirtyHexes.add(hexKey(u.q, u.r));
    }
    if (selectedUnitId === u.id || oldState.selectedUnitId === u.id) {
      dirtyHexes.add(hexKey(u.q, u.r));
    }
  }
  
  if (oldState.selectedUnitId !== selectedUnitId) {
    if (oldState.selectedUnitId) {
      const u = oldUnitMap.get(oldState.selectedUnitId);
      if (u) dirtyHexes.add(hexKey(u.q, u.r));
    }
    if (selectedUnitId) {
      const u = newUnitMap.get(selectedUnitId);
      if (u) dirtyHexes.add(hexKey(u.q, u.r));
    }
  }
  
  if (isAnimating && animationUnitId && animationPath.length > 0) {
    for (const h of animationPath) {
      dirtyHexes.add(hexKey(h.q, h.r));
    }
  }
  
  currentState = newState;
  
  const bounds = getDirtyBounds(newState);
  if (bounds) {
    drawGridFrame(ctx, newState);
  }
}

export function drawUnit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  unit: Unit,
  isSelected: boolean
): void {
  const radius = 10;
  const color = getUnitColor(unit.type, unit.hasActed);
  
  if (isSelected) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.unitBorder;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = COLORS.gridStroke;
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const symbol = unit.type === 'assault' ? '突' : unit.type === 'sniper' ? '狙' : '医';
  ctx.fillText(symbol, cx, cy);
}

export function animateUnitMove(
  ctx: CanvasRenderingContext2D,
  path: HexCoord[],
  gridSize: number,
  hexRadius: number,
  offsetX: number,
  offsetY: number,
  units: Unit[],
  selectedUnitId: string | null,
  highlightedHexes: HexCoord[],
  animationUnitId: string | null,
  onProgress: (progress: number) => void,
  onComplete: () => void
): () => void {
  if (path.length < 2) {
    onComplete();
    return () => {};
  }
  
  const totalDuration = (path.length - 1) * ANIMATION_DURATION_PER_HEX;
  let startTime: number | null = null;
  let animId: number | null = null;
  let cancelled = false;
  
  const animate = (timestamp: number) => {
    if (cancelled) return;
    
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / totalDuration, 1);
    
    onProgress(progress);
    
    drawGrid(
      ctx,
      gridSize,
      hexRadius,
      offsetX,
      offsetY,
      highlightedHexes,
      units,
      selectedUnitId,
      true,
      animationUnitId,
      path,
      progress
    );
    
    if (progress < 1) {
      animId = requestAnimationFrame(animate);
    } else {
      onComplete();
    }
  };
  
  animId = requestAnimationFrame(animate);
  
  return () => {
    cancelled = true;
    if (animId !== null) {
      cancelAnimationFrame(animId);
    }
  };
}

export function resetRenderer() {
  currentState = null;
  dirtyHexes.clear();
  pendingFrame = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}
