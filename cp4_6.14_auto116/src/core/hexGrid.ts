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
export const MOVE_RANGE = 2;

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

export function findPath(
  start: HexCoord,
  end: HexCoord,
  units: Unit[],
  gridSize: number,
  maxRange: number
): HexCoord[] {
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
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  const highlightSet = new Set(highlightedHexes.map(h => `${h.q},${h.r}`));
  
  for (let q = 0; q < gridSize; q++) {
    for (let r = 0; r < gridSize; r++) {
      const { x, y } = hexToPixel(q, r, hexRadius, offsetX, offsetY);
      const key = `${q},${r}`;
      
      let fill = COLORS.gridFill;
      let stroke = COLORS.gridStroke;
      let lineWidth = 1;
      
      if (highlightSet.has(key)) {
        ctx.save();
        drawHex(ctx, x, y, hexRadius - 1, COLORS.gridFill, COLORS.gridStroke, 1);
        ctx.globalAlpha = COLORS.highlightAlpha;
        drawHex(ctx, x, y, hexRadius - 1, COLORS.highlight, COLORS.highlight, 2);
        ctx.restore();
      } else {
        drawHex(ctx, x, y, hexRadius - 1, fill, stroke, lineWidth);
      }
    }
  }
  
  const drawnUnits = new Set<string>();
  
  if (isAnimating && animationUnitId && animationPath.length > 1) {
    const animUnit = units.find(u => u.id === animationUnitId);
    if (animUnit) {
      const totalSteps = animationPath.length - 1;
      const currentStep = Math.floor(animationProgress * totalSteps);
      const stepProgress = (animationProgress * totalSteps) - currentStep;
      
      const fromHex = animationPath[Math.min(currentStep, animationPath.length - 1)];
      const toHex = animationPath[Math.min(currentStep + 1, animationPath.length - 1)];
      
      const fromPos = hexToPixel(fromHex.q, fromHex.r, hexRadius, offsetX, offsetY);
      const toPos = hexToPixel(toHex.q, toHex.r, hexRadius, offsetX, offsetY);
      
      const animX = fromPos.x + (toPos.x - fromPos.x) * stepProgress;
      const animY = fromPos.y + (toPos.y - fromPos.y) * stepProgress;
      
      drawUnit(ctx, animX, animY, animUnit, false);
      drawnUnits.add(animationUnitId);
    }
  }
  
  for (const unit of units) {
    if (drawnUnits.has(unit.id)) continue;
    
    const { x, y } = hexToPixel(unit.q, unit.r, hexRadius, offsetX, offsetY);
    const isSelected = unit.id === selectedUnitId;
    drawUnit(ctx, x, y, unit, isSelected);
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
  let animationId: number | null = null;
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
      animationId = requestAnimationFrame(animate);
    } else {
      onComplete();
    }
  };
  
  animationId = requestAnimationFrame(animate);
  
  return () => {
    cancelled = true;
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };
}
