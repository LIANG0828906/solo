import React from 'react';
import { useGameStore } from './GameStore';
import { PLAYER_COLORS } from './BoardConfig';

export default function Leaderboard() {
  const { players, currentPlayerIndex, turnTimer } = useGameStore();

  const getHomeCount = (player: typeof players[0]) => {
    return player.pieces.filter(p => p.isHome).length;
  };

  return (
    <>
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h3 className="text-yellow-400 font-bold text-sm font-serif tracking-wider">排行榜</h3>
          <div className="text-yellow-300 text-xs font-mono">
            回合 {currentPlayerIndex + 1}/{players.length}
          </div>
        </div>
        <div className="leaderboard-content">
          {players.map((player, index) => {
            const isCurrent = index === currentPlayerIndex;
            const homeCount = getHomeCount(player);
            const cardCount = player.eventCards.length;
            const playerColor = PLAYER_COLORS[player.color];

            return (
              <div
                key={player.id}
                className={`player-row ${isCurrent ? 'current-player' : ''}`}
                style={{
                  boxShadow: isCurrent
                    ? '0 0 15px 3px rgba(234, 179, 8, 0.4), 0 0 30px 6px rgba(234, 179, 8, 0.2)'
                    : 'none',
                  animation: isCurrent ? 'goldPulse 2s ease-in-out infinite' : 'none',
                }}
              >
                {isCurrent && (
                  <div
                    className="player-border"
                    style={{
                      animation: 'goldPulse 2s ease-in-out infinite',
                    }}
                  />
                )}
                <div className="player-info">
                  <div
                    className="player-dot"
                    style={{ backgroundColor: playerColor }}
                  />
                  <div className="player-name">
                    <span className={isCurrent ? 'text-yellow-300' : 'text-white/90'}>
                      {player.name}
                    </span>
                  </div>
                  {isCurrent && (
                    <div className="timer">
                      <span className="text-yellow-400 text-lg">⏱</span>
                      <span
                        className={`timer-value ${
                          turnTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-300'
                        }`}
                      >
                        {turnTimer}
                      </span>
                    </div>
                  )}
                </div>
                <div className="player-stats">
                  <div className="stat-item">
                    <span className="text-white/40">🏠</span>
                    <span className={`font-mono ${homeCount === 4 ? 'text-green-400' : 'text-white/70'}`}>
                      {homeCount}/4
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="text-white/40">🃏</span>
                    <span className={`font-mono ${cardCount > 0 ? 'text-yellow-400' : 'text-white/40'}`}>
                      {cardCount}
                    </span>
                  </div>
                  <div className="home-indicators">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`home-dot ${
                          i < homeCount
                            ? 'bg-green-400 border-green-300'
                            : 'bg-transparent border-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .leaderboard-container {
          position: fixed;
          top: 0;
          right: 0;
          height: 35vh;
          width: 280px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-left: 1px solid rgba(234, 179, 8, 0.5);
          border-bottom: 1px solid rgba(234, 179, 8, 0.5);
          z-index: 30;
          display: flex;
          flex-direction: column;
        }

        .leaderboard-header {
          padding: 12px;
          border-bottom: 1px solid rgba(234, 179, 8, 0.3);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .leaderboard-content {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .player-row {
          position: relative;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.05);
        }

        .player-row.current-player {
          background: rgba(234, 179, 8, 0.1);
        }

        .player-border {
          position: absolute;
          inset: 0;
          border-radius: 8px;
          border: 2px solid rgb(250, 204, 21);
        }

        .player-info {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .player-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          flex-shrink: 0;
        }

        .player-name {
          flex: 1;
          min-width: 0;
        }

        .player-name span {
          font-size: 14px;
          font-weight: 600;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .timer {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .timer-value {
          font-size: 18px;
          font-family: monospace;
          font-weight: bold;
        }

        .player-stats {
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 6px;
          font-size: 12px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .home-indicators {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .home-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid;
        }

        @keyframes goldPulse {
          0%, 100% {
            box-shadow: 0 0 15px 3px rgba(234, 179, 8, 0.4), 0 0 30px 6px rgba(234, 179, 8, 0.2);
            border-color: rgba(250, 204, 21, 0.7);
          }
          50% {
            box-shadow: 0 0 25px 8px rgba(234, 179, 8, 0.6), 0 0 50px 12px rgba(234, 179, 8, 0.3);
            border-color: rgba(250, 204, 21, 1);
          }
        }

        @media (max-width: 768px) {
          .leaderboard-container {
            top: auto;
            right: auto;
            bottom: 0;
            left: 0;
            height: 30vh;
            width: auto;
            border-left: none;
            border-bottom: none;
            border-top: 1px solid rgba(234, 179, 8, 0.5);
          }

          .leaderboard-header {
            padding: 8px;
          }
        }
      `}</style>
    </>
  );
}
