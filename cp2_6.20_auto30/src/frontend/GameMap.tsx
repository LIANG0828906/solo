import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  useGameStore,
  HexTile,
  BuildingType,
  getBuildingName,
  BUILDING_COSTS,
  getResourceName,
  ResourceType,
  TerrainType,
  getTerrainName,
} from './store';

const HEX_SIZE = 40;
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

const TERRAIN_COLORS: Record<TerrainType, string> = {
  forest: '#1a4a2e',
  mountain: '#4a3a2e',
  plain: '#3a4a2e',
  water: '#1a3a5a',
  empty: '#2a3a2e',
};

const TERRAIN_EMOJI: Record<TerrainType, string> = {
  forest: '🌲',
  mountain: '⛰️',
  plain: '🌾',
  water: '💧',
  empty: '',
};

const BUILDING_EMOJI: Record<BuildingType, string> = {
  lumbermill: '🪓',
  mine: '⛏️',
  factory: '🏭',
  farm: '🌾',
  techlab: '🔬',
};

function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * (3 / 2) * q;
  const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x, y };
}

function drawHex(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fill: string,
  stroke: string,
  lineWidth: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function screenToWorld(
  screenX: number,
  screenY: number,
  canvas: HTMLCanvasElement,
  centerOffset: { x: number; y: number },
  mapOffset: { x: number; y: number },
  mapZoom: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const canvasX = screenX - rect.left;
  const canvasY = screenY - rect.top;
  const worldX = (canvasX - centerOffset.x - mapOffset.x) / mapZoom;
  const worldY = (canvasY - centerOffset.y - mapOffset.y) / mapZoom;
  return { x: worldX, y: worldY };
}

function pixelToHex(x: number, y: number): { q: number; r: number } {
  const q = (2 / 3 * x) / HEX_SIZE;
  const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / HEX_SIZE;
  return hexRound(q, r);
}

function hexRound(q: number, r: number): { q: number; r: number } {
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

export default function GameMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const needsRenderRef = useRef(true);
  const lastTimeRef = useRef(0);

  const {
    tiles,
    players,
    selectedTileId,
    currentPlayerId,
    mapOffset,
    mapZoom,
    selectTile,
    buyTile,
    buildOnTile,
    upgradeBuilding,
    setMapOffset,
    setMapZoom,
    getCurrentPlayer,
  } = useGameStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [centerOffset, setCenterOffset] = useState({ x: 0, y: 0 });
  const [dragMoved, setDragMoved] = useState(false);

  const player = getCurrentPlayer();
  const selectedTile = selectedTileId ? tiles[selectedTileId] : null;

  const canBuy = selectedTile && !selectedTile.ownerId && player && player.resources.money >= selectedTile.price;
  const isOwned = selectedTile && selectedTile.ownerId === currentPlayerId;

  const availableBuildings: BuildingType[] = ['farm', 'lumbermill', 'mine', 'factory', 'techlab'];

  const requestRender = useCallback(() => {
    needsRenderRef.current = true;
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.clearRect(0, 0, width, height);

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#1a3a2e');
    bgGradient.addColorStop(0.5, '#0d2818');
    bgGradient.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerOffset.x + mapOffset.x, centerOffset.y + mapOffset.y);
    ctx.scale(mapZoom, mapZoom);

    Object.values(tiles).forEach((tile) => {
      const { x, y } = hexToPixel(tile.q, tile.r);
      const owner = tile.ownerId ? players[tile.ownerId] : null;
      const isSelected = selectedTileId === tile.id;

      const fillColor = TERRAIN_COLORS[tile.resourceType];
      const strokeColor = owner ? owner.color : (isSelected ? '#ffd700' : '#2a4a2a');
      const lineWidth = isSelected ? 3 : (owner ? 2 : 1);

      const size = HEX_SIZE - 2;

      drawHex(ctx, x, y, size, fillColor, strokeColor, lineWidth / mapZoom);

      if (isSelected) {
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        drawHex(ctx, x, y, size + 2, 'transparent', '#ffd700', 2 / mapZoom);
        ctx.restore();
      }

      if (tile.resourceType !== 'empty' && !tile.building) {
        ctx.font = `${16 / mapZoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(TERRAIN_EMOJI[tile.resourceType], x, y - 5 / mapZoom);
      }

      if (!tile.ownerId) {
        ctx.font = `bold ${10 / mapZoom}px sans-serif`;
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`💰${tile.price}`, x, y + 15 / mapZoom);
      }

      if (tile.building) {
        ctx.font = `${22 / mapZoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(BUILDING_EMOJI[tile.building.type], x, y + 4 / mapZoom);

        if (tile.building.buildProgress < 100) {
          const barWidth = 40 / mapZoom;
          const barHeight = 5 / mapZoom;
          const barX = x - barWidth / 2;
          const barY = y + 20 / mapZoom;

          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(barX, barY, barWidth, barHeight);
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(barX, barY, barWidth * (tile.building.buildProgress / 100), barHeight);
        }

        if (tile.building.buildProgress >= 100) {
          ctx.font = `bold ${9 / mapZoom}px sans-serif`;
          ctx.fillStyle = '#ffd700';
          ctx.textAlign = 'left';
          ctx.fillText(`Lv${tile.building.level}`, x + 18 / mapZoom, y - 15 / mapZoom);
        }
      }

      if (owner) {
        const dotR = 6 / mapZoom;
        ctx.beginPath();
        ctx.arc(x + HEX_SIZE * 0.6, y - HEX_SIZE * 0.5, dotR, 0, Math.PI * 2);
        ctx.fillStyle = owner.color;
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2 / mapZoom;
        ctx.fill();
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [tiles, players, selectedTileId, mapOffset, mapZoom, centerOffset]);

  useEffect(() => {
    const animate = (time: number) => {
      if (time - lastTimeRef.current >= 16 && needsRenderRef.current) {
        render();
        needsRenderRef.current = false;
        lastTimeRef.current = time;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [render]);

  useEffect(() => {
    requestRender();
  }, [tiles, players, selectedTileId, mapOffset, mapZoom, centerOffset, requestRender]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width * dpr;
        canvasRef.current.height = rect.height * dpr;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
        setCenterOffset({ x: rect.width / 2, y: rect.height / 2 });
        requestRender();
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [requestRender]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragMoved(false);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOffsetStart({ x: mapOffset.x, y: mapOffset.y });
  }, [mapOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setDragMoved(true);
    }
    setMapOffset(
      offsetStart.x + dx,
      offsetStart.y + dy,
    );
  }, [isDragging, dragStart, offsetStart, setMapOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (dragMoved) {
      setDragMoved(false);
      return;
    }
    if (!canvasRef.current) return;
    const { x, y } = screenToWorld(e.clientX, e.clientY, canvasRef.current, centerOffset, mapOffset, mapZoom);
    const { q, r } = pixelToHex(x, y);
    const tileId = `${q},${r}`;
    if (tiles[tileId]) {
      selectTile(tileId);
      setShowBuildMenu(true);
    }
  }, [dragMoved, centerOffset, mapOffset, mapZoom, tiles, selectTile]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(2, mapZoom + delta));
    const scaleRatio = newZoom / mapZoom;
    const newOffsetX = mouseX - (mouseX - mapOffset.x) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - mapOffset.y) * scaleRatio;
    setMapZoom(newZoom);
    setMapOffset(centerOffset.x + (newOffsetX - centerOffset.x), centerOffset.y + (newOffsetY - centerOffset.y));
  }, [mapZoom, mapOffset, centerOffset, setMapZoom, setMapOffset]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        borderRadius: 12,
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />

      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        display: 'flex',
        gap: 6,
        zIndex: 10,
      }}>
        <button onClick={() => setMapZoom(mapZoom + 0.2)} style={zoomBtnStyle}>+</button>
        <button onClick={() => setMapZoom(mapZoom - 0.2)} style={zoomBtnStyle}>−</button>
        <button onClick={() => { setMapOffset(0, 0); setMapZoom(1); }} style={{ ...zoomBtnStyle, fontSize: 12 }}>⟲</button>
      </div>

      {showBuildMenu && selectedTile && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(26, 26, 46, 0.95)',
          border: '1px solid #e94560',
          borderRadius: 12,
          padding: 16,
          minWidth: 320,
          boxShadow: '0 4px 20px rgba(233, 69, 96, 0.3)',
          zIndex: 20,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ color: '#ffd700', fontSize: 16, fontWeight: 'bold' }}>
              地块 ({selectedTile.q}, {selectedTile.r})
            </div>
            <button
              onClick={() => { setShowBuildMenu(false); selectTile(null); }}
              style={{ ...iconBtnStyle, fontSize: 18 }}
            >✕</button>
          </div>

          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>
            地形: {getTerrainName(selectedTile.resourceType)}
            {selectedTile.ownerId && (
              <span style={{ marginLeft: 10, color: players[selectedTile.ownerId]?.color }}>
                所有者: {players[selectedTile.ownerId]?.name}
              </span>
            )}
          </div>

          {!selectedTile.ownerId && selectedTile.resourceType !== 'water' && (
            <button
              onClick={() => { buyTile(selectedTile.id); }}
              disabled={!canBuy}
              style={{
                ...actionBtnStyle,
                background: canBuy ? 'linear-gradient(135deg, #ffd700, #ff9500)' : '#333',
                color: canBuy ? '#1a1a2e' : '#666',
                cursor: canBuy ? 'pointer' : 'not-allowed',
                marginBottom: 12,
              }}
            >
              💰 购买地块 ({selectedTile.price} 金币)
            </button>
          )}

          {selectedTile.resourceType === 'water' && (
            <div style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
              水域无法购买和建造
            </div>
          )}

          {isOwned && !selectedTile.building && selectedTile.resourceType !== 'water' && (
            <div>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>选择建筑类型:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {availableBuildings.map((bt) => {
                  const cost = BUILDING_COSTS[bt];
                  const canBuild = player && Object.entries(cost).every(
                    ([r, a]) => player.resources[r as ResourceType] >= (a as number)
                  );
                  return (
                    <button
                      key={bt}
                      onClick={() => buildOnTile(selectedTile.id, bt)}
                      disabled={!canBuild}
                      style={{
                        ...actionBtnStyle,
                        background: canBuild ? 'linear-gradient(135deg, #e94560, #c73650)' : '#333',
                        cursor: canBuild ? 'pointer' : 'not-allowed',
                        fontSize: 12,
                        padding: '10px 8px',
                      }}
                    >
                      <div style={{ fontSize: 18 }}>{BUILDING_EMOJI[bt]} {getBuildingName(bt)}</div>
                      <div style={{ fontSize: 10, color: '#ffd700', marginTop: 4 }}>
                        {Object.entries(cost).map(([r, a]) =>
                          `${getResourceName(r as ResourceType)} ${a}`
                        ).join(' · ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isOwned && selectedTile.building && selectedTile.building.buildProgress >= 100 && (
            <div>
              <div style={{ color: '#fff', marginBottom: 8 }}>
                {BUILDING_EMOJI[selectedTile.building.type]} {getBuildingName(selectedTile.building.type)}
                <span style={{ color: '#ffd700', marginLeft: 8 }}>等级 {selectedTile.building.level}</span>
              </div>
              <button
                onClick={() => upgradeBuilding(selectedTile.id)}
                disabled={!player || player.resources.money < selectedTile.building.level * 300}
                style={{
                  ...actionBtnStyle,
                  background: 'linear-gradient(135deg, #00d4ff, #0099cc)',
                }}
              >
                ⬆️ 升级 (消耗 {selectedTile.building.level * 300} 金币)
              </button>
            </div>
          )}

          {isOwned && selectedTile.building && selectedTile.building.buildProgress < 100 && (
            <div style={{ color: '#aaa', fontSize: 13 }}>
              建造中... {selectedTile.building.buildProgress}%
              <div style={{
                width: '100%', height: 8, background: '#333',
                borderRadius: 4, marginTop: 6, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${selectedTile.building.buildProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ffd700, #ff9500)',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  background: 'rgba(26, 26, 46, 0.9)',
  color: '#ffd700',
  border: '1px solid #ffd700',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 18,
  fontWeight: 'bold',
  transition: 'all 0.15s',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#e94560',
  cursor: 'pointer',
  padding: 4,
};

const actionBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  fontWeight: 'bold',
  transition: 'all 0.15s',
};
