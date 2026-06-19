import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  useGameStore,
  HexTile,
  BuildingType,
  getBuildingName,
  BUILDING_COSTS,
  getResourceName,
  ResourceType,
} from './store';

const HEX_SIZE = 45;
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

const BUILDING_EMOJI: Record<BuildingType, string> = {
  lumbermill: '🌲',
  mine: '⛏️',
  factory: '🏭',
  farm: '🌾',
  techlab: '🔬',
};

const RESOURCE_EMOJI: Record<string, string> = {
  wood: '🪵',
  iron: '⛓️',
  food: '🍞',
  empty: '',
};

function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * (3 / 2) * q;
  const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return { x, y };
}

function hexPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return points.join(' ');
}

export default function GameMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
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

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCenterOffset({ x: rect.width / 2, y: rect.height / 2 });
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'polygon' || (e.target as HTMLElement).tagName === 'text') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setOffsetStart({ x: mapOffset.x, y: mapOffset.y });
  }, [mapOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setMapOffset(
      offsetStart.x + (e.clientX - dragStart.x),
      offsetStart.y + (e.clientY - dragStart.y)
    );
  }, [isDragging, dragStart, offsetStart, setMapOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setMapZoom(mapZoom + delta);
  }, [mapZoom, setMapZoom]);

  const handleTileClick = (tile: HexTile) => {
    selectTile(tile.id);
    setShowBuildMenu(true);
  };

  const player = getCurrentPlayer();
  const selectedTile = selectedTileId ? tiles[selectedTileId] : null;

  const canBuy = selectedTile && !selectedTile.ownerId && player && player.resources.money >= selectedTile.price;
  const isOwned = selectedTile && selectedTile.ownerId === currentPlayerId;

  const availableBuildings: BuildingType[] = ['farm', 'lumbermill', 'mine', 'factory', 'techlab'];

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'linear-gradient(135deg, #1a3a1a 0%, #0d2818 50%, #1a2a1a 100%)',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        borderRadius: 12,
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        display: 'flex',
        gap: 6,
        zIndex: 10,
      }}>
        <button
          onClick={() => setMapZoom(mapZoom + 0.2)}
          style={zoomBtnStyle}
        >+</button>
        <button
          onClick={() => setMapZoom(mapZoom - 0.2)}
          style={zoomBtnStyle}
        >−</button>
        <button
          onClick={() => { setMapOffset(0, 0); setMapZoom(1); }}
          style={{ ...zoomBtnStyle, fontSize: 12 }}
        >⟲</button>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.5" />
          </filter>
        </defs>
        <g
          transform={`translate(${centerOffset.x + mapOffset.x}, ${centerOffset.y + mapOffset.y}) scale(${mapZoom})`}
        >
          {Object.values(tiles).map((tile) => {
            const { x, y } = hexToPixel(tile.q, tile.r);
            const owner = tile.ownerId ? players[tile.ownerId] : null;
            const isSelected = selectedTileId === tile.id;
            const fillColor = tile.resourceType === 'wood'
              ? '#2d4a2d'
              : tile.resourceType === 'iron'
              ? '#3a3a4a'
              : tile.resourceType === 'food'
              ? '#4a3a2d'
              : '#2a3a2a';

            return (
              <g
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
              >
                <polygon
                  points={hexPoints(x, y, HEX_SIZE - 2)}
                  fill={fillColor}
                  stroke={owner ? owner.color : (isSelected ? '#ffd700' : '#2a4a2a')}
                  strokeWidth={isSelected ? 4 : (owner ? 3 : 1.5)}
                  filter={isSelected ? 'url(#glow)' : undefined}
                  style={{
                    transition: 'all 0.2s ease',
                  }}
                />
                {tile.resourceType !== 'empty' && !tile.building && (
                  <text
                    x={x}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="18"
                    style={{ pointerEvents: 'none' }}
                  >
                    {RESOURCE_EMOJI[tile.resourceType]}
                  </text>
                )}
                {!tile.ownerId && (
                  <text
                    x={x}
                    y={y + 15}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#ffd700"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    💰{tile.price}
                  </text>
                )}
                {tile.building && (
                  <g style={{ pointerEvents: 'none' }}>
                    <text
                      x={x}
                      y={y + 6}
                      textAnchor="middle"
                      fontSize="26"
                      style={{
                        transformOrigin: `${x}px ${y}px`,
                        animation: tile.building.buildProgress >= 100 ? 'spin3d 4s linear infinite' : undefined,
                      }}
                    >
                      {BUILDING_EMOJI[tile.building.type]}
                    </text>
                    {tile.building.buildProgress < 100 && (
                      <>
                        <rect
                          x={x - 25}
                          y={y + 20}
                          width={50}
                          height={6}
                          fill="#1a1a2e"
                          rx={3}
                        />
                        <rect
                          x={x - 25}
                          y={y + 20}
                          width={50 * (tile.building.buildProgress / 100)}
                          height={6}
                          fill="#ffd700"
                          rx={3}
                          style={{ transition: 'width 0.3s ease' }}
                        />
                      </>
                    )}
                    {tile.building.buildProgress >= 100 && (
                      <text
                        x={x + 18}
                        y={y - 15}
                        fontSize="10"
                        fill="#ffd700"
                        fontWeight="bold"
                      >
                        Lv{tile.building.level}
                      </text>
                    )}
                  </g>
                )}
                {owner && (
                  <circle
                    cx={x + HEX_SIZE * 0.6}
                    cy={y - HEX_SIZE * 0.5}
                    r={7}
                    fill={owner.color}
                    stroke="#1a1a2e"
                    strokeWidth={2}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {showBuildMenu && selectedTile && (
        <div
          style={{
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
          }}
        >
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
            资源类型: {getResourceName(selectedTile.resourceType as ResourceType) || '空地'}
            {selectedTile.ownerId && (
              <span style={{ marginLeft: 10, color: players[selectedTile.ownerId]?.color }}>
                所有者: {players[selectedTile.ownerId]?.name}
              </span>
            )}
          </div>

          {!selectedTile.ownerId && (
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

          {isOwned && !selectedTile.building && (
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

      <style>{`
        @keyframes spin3d {
          0% { transform: rotateY(0deg) scale(1); }
          50% { transform: rotateY(180deg) scale(1.1); }
          100% { transform: rotateY(360deg) scale(1); }
        }
        polygon:hover {
          filter: brightness(1.3);
        }
      `}</style>
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
