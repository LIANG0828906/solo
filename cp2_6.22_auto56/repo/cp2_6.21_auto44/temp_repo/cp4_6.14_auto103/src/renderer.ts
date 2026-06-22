import { TILE, type DungeonMap, type Room, findRoomAt } from './mapGenerator';
import type { Player, Monster } from './entity';
import { getPlayerRenderPos } from './entity';

const COLORS = {
  WALL: '#334155',
  FLOOR: '#1e293b',
  CORRIDOR: '#475569',
  PLAYER: '#60a5fa',
  PLAYER_TRAIL: '#60a5fa55',
  BG: '#0f172a',
  FOG: '#020617aa',
  MINIMAP_EXPLORED: '#475569',
  MINIMAP_UNEXPLORED: '#1e293b',
  MINIMAP_PLAYER: '#ef4444',
};

export interface RendererState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  minimapCanvas: HTMLCanvasElement;
  minimapCtx: CanvasRenderingContext2D;
  backBuffer: HTMLCanvasElement;
  backCtx: CanvasRenderingContext2D;
  tileSize: number;
  offsetX: number;
  offsetY: number;
  mapCache: HTMLCanvasElement | null;
  mapCacheDirty: boolean;
  minimapBlink: number;
  viewWidth: number;
  viewHeight: number;
}

export function createRenderer(
  canvas: HTMLCanvasElement,
  minimapCanvas: HTMLCanvasElement
): RendererState {
  const ctx = canvas.getContext('2d')!;
  const minimapCtx = minimapCanvas.getContext('2d')!;

  const backBuffer = document.createElement('canvas');
  const backCtx = backBuffer.getContext('2d')!;

  return {
    canvas,
    ctx,
    minimapCanvas,
    minimapCtx,
    backBuffer,
    backCtx,
    tileSize: 32,
    offsetX: 0,
    offsetY: 0,
    mapCache: null,
    mapCacheDirty: true,
    minimapBlink: 0,
    viewWidth: 0,
    viewHeight: 0,
  };
}

export function resizeRenderer(
  r: RendererState,
  map: DungeonMap,
  viewW: number,
  viewH: number
): void {
  r.viewWidth = viewW;
  r.viewHeight = viewH;

  const maxTileW = Math.floor(viewW / map.width);
  const maxTileH = Math.floor(viewH / map.height);
  r.tileSize = Math.max(16, Math.min(maxTileW, maxTileH, 32));

  const pixelW = map.width * r.tileSize;
  const pixelH = map.height * r.tileSize;
  r.offsetX = Math.floor((viewW - pixelW) / 2);
  r.offsetY = Math.floor((viewH - pixelH) / 2);

  r.canvas.width = viewW;
  r.canvas.height = viewH;
  r.backBuffer.width = viewW;
  r.backBuffer.height = viewH;

  r.mapCacheDirty = true;
}

function buildMapCache(r: RendererState, map: DungeonMap): void {
  if (!r.mapCache) {
    r.mapCache = document.createElement('canvas');
  }
  const w = map.width * r.tileSize;
  const h = map.height * r.tileSize;
  r.mapCache.width = w;
  r.mapCache.height = h;
  const mctx = r.mapCache.getContext('2d')!;

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const t = map.tiles[y][x];
      let color = COLORS.WALL;
      if (t === TILE.FLOOR) color = COLORS.FLOOR;
      else if (t === TILE.CORRIDOR) color = COLORS.CORRIDOR;
      mctx.fillStyle = color;
      mctx.fillRect(x * r.tileSize, y * r.tileSize, r.tileSize, r.tileSize);
    }
  }
  r.mapCacheDirty = false;
}

function isTileVisible(
  map: DungeonMap,
  player: Player,
  tx: number,
  ty: number
): boolean {
  const dist = Math.max(Math.abs(tx - player.x), Math.abs(ty - player.y));
  return dist <= 6;
}

export function render(
  r: RendererState,
  map: DungeonMap,
  player: Player,
  monsters: Monster[],
  dt: number
): void {
  if (r.mapCacheDirty || !r.mapCache) {
    buildMapCache(r, map);
  }

  const ctx = r.backCtx;
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, r.viewWidth, r.viewHeight);

  if (r.mapCache) {
    ctx.drawImage(r.mapCache, r.offsetX, r.offsetY);
  }

  const ts = r.tileSize;

  for (let i = player.trail.length - 1; i >= 0; i--) {
    const t = player.trail[i];
    ctx.fillStyle = COLORS.PLAYER_TRAIL;
    ctx.globalAlpha = t.alpha;
    ctx.fillRect(
      r.offsetX + t.x * ts,
      r.offsetY + t.y * ts,
      ts,
      ts
    );
  }
  ctx.globalAlpha = 1;

  const playerRoom = findRoomAt(map.rooms, player.x, player.y);
  if (playerRoom) playerRoom.explored = true;

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const room = findRoomAt(map.rooms, x, y);
      const visible = isTileVisible(map, player, x, y);
      const explored = room ? room.explored : visible;

      if (!explored) {
        ctx.fillStyle = COLORS.FOG;
        ctx.fillRect(r.offsetX + x * ts, r.offsetY + y * ts, ts, ts);
      } else if (!visible) {
        ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
        ctx.fillRect(r.offsetX + x * ts, r.offsetY + y * ts, ts, ts);
      }
    }
  }

  for (const m of monsters) {
    if (!isTileVisible(map, player, m.x, m.y)) continue;
    ctx.fillStyle = m.color;
    ctx.font = `bold ${Math.floor(ts * 0.8)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      m.symbol,
      r.offsetX + m.x * ts + ts / 2,
      r.offsetY + m.y * ts + ts / 2
    );
  }

  const pr = getPlayerRenderPos(player);
  ctx.fillStyle = COLORS.PLAYER;
  ctx.font = `bold ${Math.floor(ts * 0.85)}px 'Courier New', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    '@',
    r.offsetX + pr.x * ts + ts / 2,
    r.offsetY + pr.y * ts + ts / 2
  );

  r.ctx.drawImage(r.backBuffer, 0, 0);

  renderMinimap(r, map, player, dt);
}

function renderMinimap(
  r: RendererState,
  map: DungeonMap,
  player: Player,
  dt: number
): void {
  const ctx = r.minimapCtx;
  const w = r.minimapCanvas.width;
  const h = r.minimapCanvas.height;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, w, h);

  const roomW = w / map.gridCols;
  const roomH = h / map.gridRows;
  const pad = 2;

  for (const room of map.rooms) {
    const rx = room.gridX * roomW + pad;
    const ry = room.gridY * roomH + pad;
    const rw = roomW - pad * 2;
    const rh = roomH - pad * 2;

    if (room.explored) {
      ctx.fillStyle = COLORS.MINIMAP_EXPLORED;
    } else {
      ctx.fillStyle = COLORS.MINIMAP_UNEXPLORED;
    }
    ctx.fillRect(rx, ry, rw, rh);

    if (room.explored) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      room.connected.forEach((targetIdx) => {
        const target = map.rooms[targetIdx];
        if (!target || !target.explored) return;
        const sx = rx + rw / 2;
        const sy = ry + rh / 2;
        const tx = target.gridX * roomW + pad + rw / 2;
        const ty = target.gridY * roomH + pad + rh / 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      });
    }
  }

  r.minimapBlink += dt;
  const blinkOn = Math.sin(r.minimapBlink * 4) > 0;

  const playerRoom = findRoomAt(map.rooms, player.x, player.y);
  if (playerRoom) {
    const px = playerRoom.gridX * roomW + roomW / 2;
    const py = playerRoom.gridY * roomH + roomH / 2;
    if (blinkOn) {
      ctx.fillStyle = COLORS.MINIMAP_PLAYER;
      ctx.beginPath();
      ctx.arc(px, py, Math.min(roomW, roomH) * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(px, py, Math.min(roomW, roomH) * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
