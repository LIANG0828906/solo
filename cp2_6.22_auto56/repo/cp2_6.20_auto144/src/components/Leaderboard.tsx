import { useEffect } from 'react';
import type { Player, PlayerColor } from '@/types/game';

const STYLE_ID = 'leaderboard-keyframe-animations';

const COLOR_MAP: Record<PlayerColor, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f1c40f',
  green: '#2ecc71',
};

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes leaderboard-pulse {
      0%, 100% { box-shadow: 0 0 0 2px #d4af37; }
      50% { box-shadow: 0 0 10px 4px rgba(212, 175, 55, 0.6); }
    }
  `;
  document.head.appendChild(style);
}

interface LeaderboardProps {
  players: Player[];
  currentPlayerIndex: number;
}

export default function Leaderboard({ players, currentPlayerIndex }: LeaderboardProps) {
  useEffect(() => {
    injectStyles();
  }, []);

  const sorted = [...players].sort((a, b) => {
    const aFinished = a.pieces.filter((p) => p.isFinished).length;
    const bFinished = b.pieces.filter((p) => p.isFinished).length;
    return bFinished - aFinished;
  });

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        height: '35vh',
        minHeight: 280,
        width: 220,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#d4af37',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        排行榜
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flex: 1 }}>
        {sorted.map((player) => {
          const originalIndex = players.indexOf(player);
          const isCurrentTurn = originalIndex === currentPlayerIndex;
          const finishedCount = player.pieces.filter((p) => p.isFinished).length;
          const cardCount = player.eventCards.length;

          return (
            <div
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 8,
                borderRadius: 8,
                background: isCurrentTurn ? 'rgba(212,175,55,0.15)' : 'transparent',
                animation: isCurrentTurn ? 'leaderboard-pulse 1.5s ease-in-out infinite' : undefined,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: COLOR_MAP[player.color],
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 14,
                  color: 'white',
                  marginLeft: 8,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {player.name}
              </div>
              <div style={{ fontSize: 13, color: '#d4af37', flexShrink: 0, marginRight: 6 }}>
                ✓ {finishedCount}/4
              </div>
              <div style={{ fontSize: 12, color: '#87ceeb', flexShrink: 0 }}>
                🃏 {cardCount}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
