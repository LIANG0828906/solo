import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { mapManager } from '../../modules/game/MapManager';
import { gameEngine } from '../../modules/game/GameEngine';
import type { Position } from '../../store/types';

const MapView: React.FC = () => {
  const playerPosition = useGameStore((s) => s.playerPosition);
  const mapData = useGameStore((s) => s.mapData);
  const fog = useGameStore((s) => s.fog);
  const isSearching = useGameStore((s) => s.isSearching);
  const turn = useGameStore((s) => s.turn);

  const containerRef = useRef<HTMLDivElement>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const lastTurnRef = useRef(turn);

  const cellSize = mapManager.getCellSize();
  const visibleRadius = mapManager.getVisibleRadius();
  const visibleCells = visibleRadius * 2 + 1;

  useEffect(() => {
    if (turn !== lastTurnRef.current) {
      setShakeKey((k) => k + 1);
      lastTurnRef.current = turn;
    }
  }, [turn]);

  const handleTileClick = useCallback((x: number, y: number) => {
    if (isSearching) return;
    const pos: Position = { x, y };
    gameEngine.clickWreckTile(pos);
  }, [isSearching]);

  const visibleStartX = Math.max(0, playerPosition.x - visibleRadius);
  const visibleStartY = Math.max(0, playerPosition.y - visibleRadius);

  const tiles: React.ReactElement[] = [];

  for (let vy = 0; vy < visibleCells; vy++) {
    for (let vx = 0; vx < visibleCells; vx++) {
      const mapX = visibleStartX + vx;
      const mapY = visibleStartY + vy;

      if (mapX >= mapData[0].length || mapY >= mapData.length) continue;

      const tile = mapData[mapY][mapX];
      const isFogged = fog[mapY][mapX];
      const isPlayer = mapX === playerPosition.x && mapY === playerPosition.y;
      const isWreck = tile === 'wreck';
      const isWreckSearched = mapManager.isWreckSearched(mapX, mapY);
      const isClickable = !isFogged && isWreck && !isSearching;

      let bgColor = '#0d3b66';
      if (!isFogged) {
        if (tile === 'wreck') bgColor = '#6b4423';
        else if (tile === 'trench') bgColor = '#0a0a0a';
      }

      tiles.push(
        <div
          key={`${mapX}-${mapY}`}
          onClick={() => isClickable && handleTileClick(mapX, mapY)}
          style={{
            position: 'absolute',
            left: vx * cellSize,
            top: vy * cellSize,
            width: cellSize,
            height: cellSize,
            backgroundColor: bgColor,
            border: '1px solid rgba(100, 255, 218, 0.1)',
            cursor: isClickable ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease',
            boxShadow: isClickable
              ? 'inset 0 0 8px rgba(100, 255, 218, 0.4)'
              : undefined,
          }}
          className={isClickable ? 'hover:brightness-125' : ''}
          title={!isFogged ? mapManager.getTileLabel(tile) : '未探索区域'}
        >
          {!isFogged && isWreck && (
            <div
              style={{
                position: 'absolute',
                inset: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                opacity: isWreckSearched ? 0.4 : 1,
              }}
            >
              🚢
            </div>
          )}
          {!isFogged && tile === 'trench' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: '#444',
              }}
            >
              ░
            </div>
          )}
          {isFogged && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(5,15,30,0.92))',
                backdropFilter: 'blur(1px)',
              }}
            />
          )}
          {isPlayer && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: `${cellSize * 0.28}px solid transparent`,
                  borderRight: `${cellSize * 0.28}px solid transparent`,
                  borderBottom: `${cellSize * 0.5}px solid #ffffff`,
                  filter: 'drop-shadow(0 0 4px rgba(100, 255, 218, 0.8))',
                  animation: 'float 2s ease-in-out infinite',
                }}
              />
            </div>
          )}
          {isClickable && (
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#64ffda',
                boxShadow: '0 0 6px #64ffda',
                animation: 'pulse-glow 1.5s ease-in-out infinite',
              }}
            />
          )}
        </div>
      );
    }
  }

  const gridWidth = visibleCells * cellSize;
  const gridHeight = visibleCells * cellSize;

  return (
    <div
      ref={containerRef}
      className="glass-panel glow-panel p-4"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#64ffda', fontSize: 16, fontWeight: 600 }}>
          🗺️ 探索地图
        </h3>
        <span
          style={{
            fontSize: 12,
            color: '#8892b0',
            fontFamily: 'monospace',
          }}
        >
          坐标: ({playerPosition.x}, {playerPosition.y})
        </span>
      </div>

      <div
        key={shakeKey}
        className={shakeKey > 0 ? 'grid-shake' : ''}
        style={{
          position: 'relative',
          margin: '0 auto',
          width: gridWidth,
          height: gridHeight,
          border: '2px solid rgba(100, 255, 218, 0.3)',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)',
          background: '#05101e',
        }}
      >
        {tiles}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 4 }}>
        <LegendItem color="#0d3b66" label="海洋" />
        <LegendItem color="#6b4423" label="沉船" />
        <LegendItem color="#0a0a0a" label="海沟" />
        <LegendItem color="#ffffff" label="玩家" shape="triangle" />
      </div>

      <div
        style={{
          fontSize: 11,
          color: '#8892b0',
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        WASD / 方向键移动 · 点击🚢沉船搜索部件
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string; shape?: 'square' | 'triangle' }> = ({
  color,
  label,
  shape = 'square',
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    {shape === 'square' ? (
      <div style={{ width: 12, height: 12, backgroundColor: color, borderRadius: 2, border: '1px solid rgba(255,255,255,0.2)' }} />
    ) : (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: `10px solid ${color}`,
        }}
      />
    )}
    <span style={{ fontSize: 11, color: '#8892b0' }}>{label}</span>
  </div>
);

export default MapView;
