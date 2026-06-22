import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../GameContext';
import { SymbolType } from '../GameCore';

const SYMBOL_LABELS: Record<SymbolType, string> = {
  [SymbolType.Diamond]: '◆',
  [SymbolType.Hexagon]: '⬡',
  [SymbolType.Star]: '★',
  [SymbolType.Wave]: '〰',
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function HUD() {
  const { state, dispatch } = useGame();
  const [minimapExpanded, setMinimapExpanded] = useState(false);
  const [expandTimer, setExpandTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMinimapClick = useCallback(() => {
    if (expandTimer) clearTimeout(expandTimer);
    setMinimapExpanded(true);
    const timer = setTimeout(() => {
      setMinimapExpanded(false);
      setExpandTimer(null);
    }, 3000);
    setExpandTimer(timer);
  }, [expandTimer]);

  useEffect(() => {
    return () => {
      if (expandTimer) clearTimeout(expandTimer);
    };
  }, [expandTimer]);

  const staminaPercent = (state.stamina / state.maxStamina) * 100;
  const minimapSize = minimapExpanded ? 200 : 100;
  const gridRows = state.maze.grid.length;
  const gridCols = state.maze.grid[0].length;
  const cellW = minimapSize / gridCols;
  const cellH = minimapSize / gridRows;

  const potionCount = state.inventory.filter(i => i.type === 'potion').length;
  const keyCount = state.inventory.filter(i => i.type === 'key').length;
  const scrollCount = state.inventory.filter(i => i.type === 'scroll').length;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 16px',
      fontFamily: "'Noto Serif SC', 'Cinzel', serif",
      position: 'relative',
      minHeight: 52,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: '#3e2723', fontWeight: 700 }}>道具:</span>
        {potionCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#22c55e', fontSize: 14 }}>
            <span style={{ fontWeight: 700 }}>✚</span>{potionCount}
          </span>
        )}
        {keyCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#facc15', fontSize: 14 }}>
            <span style={{ fontWeight: 700 }}>▲</span>{keyCount}
          </span>
        )}
        {scrollCount > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: '#9ca3af', fontSize: 14 }}>
            <span style={{ fontWeight: 700 }}>📜</span>{scrollCount}
          </span>
        )}
        {potionCount === 0 && keyCount === 0 && scrollCount === 0 && (
          <span style={{ fontSize: 12, color: '#9ca3af' }}>无</span>
        )}
      </div>

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 28px',
        background: 'linear-gradient(180deg, rgba(245,230,202,0.95) 0%, rgba(232,220,192,0.95) 100%)',
        borderRadius: 4,
        border: '1px solid #b8a080',
        boxShadow: `
          inset 0 1px 0 rgba(255,255,255,0.4),
          0 2px 8px rgba(0,0,0,0.15),
          -8px 0 12px -6px rgba(139,69,19,0.25) inset,
          8px 0 12px -6px rgba(139,69,19,0.25) inset
        `,
        fontFamily: "'Cinzel', 'Noto Serif SC', serif",
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 12,
          background: 'linear-gradient(90deg, rgba(139,69,19,0.2), transparent)',
          borderRadius: '4px 0 0 4px',
        }} />
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 12,
          background: 'linear-gradient(270deg, rgba(139,69,19,0.2), transparent)',
          borderRadius: '0 4px 4px 0',
        }} />
        <span style={{
          color: '#3e2723',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 2,
          position: 'relative',
          zIndex: 1,
        }}>
          {formatTime(state.elapsedTime)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ position: 'relative', width: 140, height: 22 }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 4,
            background: `
              repeating-linear-gradient(
                90deg,
                #5c3a1e 0px,
                #6b4423 2px,
                #5c3a1e 4px,
                #4a2f17 6px,
                #5c3a1e 8px
              )
            `,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }} />
          <div style={{
            position: 'absolute',
            top: 2,
            left: 3,
            bottom: 2,
            right: 3,
            borderRadius: 2,
            background: 'rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${staminaPercent}%`,
              height: '100%',
              background: `linear-gradient(180deg, #ef4444 0%, #b91c1c 50%, #7f1d1d 100%)`,
              borderRadius: 2,
              transition: 'width 0.3s ease-out',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            }} />
          </div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 3,
            transform: 'translateY(-50%)',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #d4a853, #8b6914)',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            right: 3,
            transform: 'translateY(-50%)',
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #d4a853, #8b6914)',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)',
          }} />
          <span style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            fontFamily: "'Cinzel', serif",
          }}>
            {state.stamina}/{state.maxStamina}
          </span>
        </div>
      </div>

      <div
        onClick={handleMinimapClick}
        style={{
          position: 'relative',
          width: minimapSize,
          height: minimapSize,
          borderRadius: 8,
          background: 'rgba(0,0,0,0.5)',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'width 0.3s, height 0.3s',
          border: '1px solid #d4a853',
          overflow: 'hidden',
        }}
      >
        <canvas
          width={minimapSize}
          height={minimapSize}
          ref={(canvas) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, minimapSize, minimapSize);

            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, minimapSize, minimapSize);

            for (let r = 0; r < gridRows; r++) {
              for (let c = 0; c < gridCols; c++) {
                const cell = state.maze.grid[r][c];
                if (cell.type === (0 as any) || cell.type === 'wall') {
                  ctx.fillStyle = 'rgba(45,45,45,0.6)';
                } else {
                  ctx.fillStyle = 'rgba(245,240,232,0.3)';
                }
                ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
              }
            }

            for (const dp of state.discoveredPlates) {
              ctx.fillStyle = '#ffd700';
              ctx.beginPath();
              ctx.arc(dp.col * cellW + cellW / 2, dp.row * cellH + cellH / 2, Math.max(2, cellW / 2), 0, Math.PI * 2);
              ctx.fill();
            }

            for (const dd of state.discoveredDoors) {
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(dd.col * cellW + cellW / 2, dd.row * cellH + cellH / 2, Math.max(2, cellW / 2), 0, Math.PI * 2);
              ctx.fill();
            }

            for (const item of state.items) {
              const collected = item.collected;
              if (!collected) {
                ctx.fillStyle = item.type === 'key' ? '#facc15' : (item.type === 'potion' ? '#22c55e' : '#e5e7eb');
              } else {
                ctx.fillStyle = item.type === 'key' ? 'rgba(250, 204, 21, 0.4)' : (item.type === 'potion' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(229, 231, 235, 0.4)');
              }
              if (item.type === 'key') {
                ctx.beginPath();
                ctx.moveTo(item.position.col * cellW + cellW / 2, item.position.row * cellH + cellH / 2 - Math.max(1.5, cellW / 3));
                ctx.lineTo(item.position.col * cellW + cellW / 2 + Math.max(1.5, cellW / 3), item.position.row * cellH + cellH / 2 + Math.max(1.5, cellW / 3) * 0.5);
                ctx.lineTo(item.position.col * cellW + cellW / 2 - Math.max(1.5, cellW / 3), item.position.row * cellH + cellH / 2 + Math.max(1.5, cellW / 3) * 0.5);
                ctx.closePath();
                ctx.fill();
              } else if (item.type === 'potion') {
                ctx.beginPath();
                ctx.arc(item.position.col * cellW + cellW / 2, item.position.row * cellH + cellH / 2, Math.max(1.5, cellW / 3), 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = collected ? 'rgba(255,255,255,0.3)' : '#fff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(item.position.col * cellW + cellW / 2, item.position.row * cellH + cellH / 2 - Math.max(1, cellW / 4));
                ctx.lineTo(item.position.col * cellW + cellW / 2, item.position.row * cellH + cellH / 2 + Math.max(1, cellW / 4));
                ctx.moveTo(item.position.col * cellW + cellW / 2 - Math.max(1, cellW / 4), item.position.row * cellH + cellH / 2);
                ctx.lineTo(item.position.col * cellW + cellW / 2 + Math.max(1, cellW / 4), item.position.row * cellH + cellH / 2);
                ctx.stroke();
              } else {
                ctx.beginPath();
                ctx.arc(item.position.col * cellW + cellW / 2, item.position.row * cellH + cellH / 2, Math.max(1.5, cellW / 3), 0, Math.PI * 2);
                ctx.fill();
              }
            }

            ctx.fillStyle = '#4488ff';
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(
              state.playerPos.col * cellW + cellW / 2,
              state.playerPos.row * cellH + cellH / 2,
              Math.max(2.5, cellW / 1.5),
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.shadowBlur = 0;
          }}
        />
        {[
          { top: 2, left: 2 },
          { top: 2, right: 2 },
          { bottom: 2, left: 2 },
          { bottom: 2, right: 2 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #ffd700, #b8860b)',
              boxShadow: '0 0 3px rgba(212,168,83,0.6)',
              ...pos,
            }}
          />
        ))}
      </div>
    </div>
  );
}
