import type { Player, TerrainType } from '../game/types';
import './GameResult.css';

interface GameResultProps {
  players: Record<string, Player>;
  winner: string | null;
  yourPlayerId: string;
  terrainStats: Record<string, Record<TerrainType, number>>;
  onRematch: () => void;
}

export function GameResult({
  players,
  winner,
  yourPlayerId,
  terrainStats,
  onRematch,
}: GameResultProps) {
  const playerIds = Object.keys(players);

  const isDraw = winner === null;
  const youWon = winner === yourPlayerId;

  const getTerrainLabel = (terrain: TerrainType): string => {
    const labels: Record<TerrainType, string> = {
      normal: '普通',
      trap: '陷阱',
      speed: '加速',
    };
    return labels[terrain];
  };

  return (
    <div className="result-overlay">
      <div className="result-modal">
        <div className="result-header">
          {isDraw ? (
            <>
              <span className="result-icon">🤝</span>
              <h2 className="result-title">平局</h2>
            </>
          ) : youWon ? (
            <>
              <span className="result-icon">🏆</span>
              <h2 className="result-title win">你赢了!</h2>
            </>
          ) : (
            <>
              <span className="result-icon">😔</span>
              <h2 className="result-title lose">你输了</h2>
            </>
          )}
        </div>

        <div className="result-players">
          {playerIds.map((id) => {
            const player = players[id];
            const isWinner = id === winner;
            const stats = terrainStats[id] || { normal: 0, trap: 0, speed: 0 };

            return (
              <div
                key={id}
                className={`result-player-card ${isWinner ? 'winner-card' : ''} ${id === yourPlayerId ? 'your-card' : ''}`}
                style={{ '--player-color': player.color } as React.CSSProperties}
              >
                {isWinner && (
                  <div className="winner-badge">
                    <span>👑</span>
                  </div>
                )}

                <div className="player-avatar-lg" style={{ background: player.color }}>
                  <span>{player.name.slice(-1)}</span>
                </div>

                <div className="player-name-lg">
                  {player.name}
                  {id === yourPlayerId && <span className="you-tag-sm">你</span>}
                </div>

                <div className="player-score-lg">{player.score}</div>
                <div className="score-label">总得分</div>

                <div className="terrain-stats">
                  {(Object.keys(stats) as TerrainType[]).map((terrain) => (
                    <div key={terrain} className={`terrain-stat terrain-${terrain}`}>
                      <span className="terrain-name">{getTerrainLabel(terrain)}</span>
                      <span className="terrain-count">{stats[terrain]}格</span>
                    </div>
                  ))}
                </div>

                <div className="captured-info">
                  占领 <strong>{player.capturedCells}</strong> / 25 格
                </div>
              </div>
            );
          })}
        </div>

        <button className="rematch-button" onClick={onRematch}>
          再来一局
        </button>
      </div>
    </div>
  );
}
