import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Player, GameType, GAME_LABELS, getPlayerMaxScore, getPlayerWinRate } from './utils/scores';

interface TowerRendererProps {
  players: Player[];
  updatedPlayerIds: Set<string>;
  gameFilter: GameType | 'all';
  sortMode: 'score' | 'winrate' | 'challenges';
  currentPlayerId: string | null;
  onChallenge: (challengedId: string) => void;
}

interface TowerPosition {
  id: string;
  top: number;
  left: number;
  height: number;
  width: number;
}

const getTowerColor = (index: number, total: number): string => {
  const ratio = total <= 1 ? 1 : 1 - index / (total - 1);
  const hue = 0 + ratio * 80;
  const saturation = 90;
  const lightness = 45 + ratio * 15;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const getTowerGlow = (index: number, total: number): string => {
  const ratio = total <= 1 ? 1 : 1 - index / (total - 1);
  const hue = 0 + ratio * 80;
  return `0 0 15px hsla(${hue}, 90%, 60%, 0.6), 0 0 30px hsla(${hue}, 90%, 60%, 0.3)`;
};

const MiniSparkline: React.FC<{ data: number[] }> = ({ data }) => {
  if (data.length === 0) return null;
  const width = 120;
  const height = 40;
  const padding = 4;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = padding + (i * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        fill="none"
        stroke="url(#sparklineGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#05ffa1" />
          <stop offset="100%" stopColor="#01cdfe" />
        </linearGradient>
      </defs>
      {data.map((value, i) => {
        const x = padding + (i * (width - padding * 2)) / (data.length - 1);
        const y = height - padding - ((value - min) / range) * (height - padding * 2);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2.5}
            fill="#05ffa1"
          />
        );
      })}
    </svg>
  );
};

const PlayerCard: React.FC<{
  player: Player;
  gameFilter: GameType | 'all';
  onClose: () => void;
  onChallenge: () => void;
  isCurrentPlayer: boolean;
}> = ({ player, gameFilter, onClose, onChallenge, isCurrentPlayer }) => {
  const maxScore = getPlayerMaxScore(player, gameFilter === 'all' ? undefined : gameFilter);
  const winRate = getPlayerWinRate(player);

  return (
    <div
      className="player-card-popup"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="player-card-header">
        <div
          className="player-card-avatar"
          style={{ backgroundColor: player.avatarColor }}
        >
          {player.name.charAt(0)}
        </div>
        <div className="player-card-info">
          <div className="player-card-name">{player.name}</div>
          <div className="player-card-id" style={{ color: player.avatarColor }}>
            ID: {player.id.slice(0, 12)}...
          </div>
        </div>
        <button className="player-card-close" onClick={onClose}>✕</button>
      </div>

      <div className="player-card-stats">
        <div className="stat-item">
          <div className="stat-label">最高分</div>
          <div className="stat-value score">{maxScore.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">胜率</div>
          <div className="stat-value">{(winRate * 100).toFixed(1)}%</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">挑战次数</div>
          <div className="stat-value">{player.totalChallenges}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">胜场</div>
          <div className="stat-value" style={{ color: '#05ffa1' }}>{player.wins}</div>
        </div>
      </div>

      <div className="player-card-sparkline">
        <div className="sparkline-label">近5局走势</div>
        <MiniSparkline data={player.recentScores} />
      </div>

      {!isCurrentPlayer && (
        <button className="challenge-btn-popup" onClick={onChallenge}>
          ⚔ 约战
        </button>
      )}
    </div>
  );
};

const TowerRenderer: React.FC<TowerRendererProps> = ({
  players,
  updatedPlayerIds,
  gameFilter,
  sortMode,
  currentPlayerId,
  onChallenge,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<Map<string, DOMRect>>(new Map());
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (updatedPlayerIds.size > 0) {
      setFlashIds(new Set(updatedPlayerIds));
      setAnimatingIds(new Set(updatedPlayerIds));
      const t1 = setTimeout(() => setFlashIds(new Set()), 600);
      const t2 = setTimeout(() => setAnimatingIds(new Set()), 800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [updatedPlayerIds]);

  const maxScore = useMemo(() => {
    if (players.length === 0) return 1;
    return Math.max(
      ...players.map((p) => getPlayerMaxScore(p, gameFilter === 'all' ? undefined : gameFilter))
    );
  }, [players, gameFilter]);

  const displayPlayers = useMemo(() => players.slice(0, isMobile ? 20 : 50), [players, isMobile]);

  return (
    <div
      ref={containerRef}
      className={`tower-container ${isMobile ? 'mobile' : 'desktop'}`}
      onClick={() => setHoveredPlayerId(null)}
    >
      {displayPlayers.map((player, index) => {
        const score = getPlayerMaxScore(player, gameFilter === 'all' ? undefined : gameFilter);
        const heightPct = isMobile
          ? Math.max(8, (score / maxScore) * 100)
          : Math.max(3, (score / maxScore) * 100);
        const color = getTowerColor(index, displayPlayers.length);
        const glow = getTowerGlow(index, displayPlayers.length);
        const isFlashing = flashIds.has(player.id);
        const isAnimating = animatingIds.has(player.id);
        const isHovered = hoveredPlayerId === player.id;
        const isCurrent = currentPlayerId === player.id;

        return (
          <div
            key={player.id}
            className={`tower-item ${isMobile ? 'horizontal' : 'vertical'}`}
            style={{
              animationDelay: `${index * 50}ms`,
              order: isMobile ? index : undefined,
            }}
          >
            <div
              className={`tower-bar ${isFlashing ? 'flash' : ''} ${isAnimating ? 'score-animate' : ''} ${isHovered ? 'hovered' : ''}`}
              style={{
                [isMobile ? 'width' : 'height']: `${heightPct}%`,
                background: `linear-gradient(${isMobile ? '90deg' : '0deg'}, ${color}, ${color}dd)`,
                boxShadow: glow,
              }}
              onMouseEnter={() => setHoveredPlayerId(player.id)}
              onMouseLeave={() => setHoveredPlayerId(null)}
              onClick={(e) => {
                e.stopPropagation();
                setHoveredPlayerId(isHovered ? null : player.id);
              }}
            >
              {isMobile ? (
                <div className="tower-content horizontal-content">
                  <div
                    className="tower-avatar"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div className="tower-info">
                    <div className="tower-name">{player.name}</div>
                    <div className="tower-score">{score.toLocaleString()}</div>
                  </div>
                  <button
                    className="tower-challenge-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isCurrent) onChallenge(player.id);
                    }}
                    disabled={isCurrent}
                  >
                    ⚔
                  </button>
                </div>
              ) : (
                <div className="tower-bar-fill" />
              )}

              {isFlashing && <div className="tower-flash-overlay" />}
            </div>

            {!isMobile && (
              <div className="tower-label">
                <div
                  className="tower-avatar"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.name.charAt(0)}
                </div>
                <div className="tower-name">{player.name}</div>
                <div className="tower-score">{score.toLocaleString()}</div>
                <button
                  className="tower-challenge-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCurrent) onChallenge(player.id);
                  }}
                  disabled={isCurrent}
                >
                  约战
                </button>
              </div>
            )}

            {isHovered && !isMobile && (
              <div className="player-card-wrapper">
                <PlayerCard
                  player={player}
                  gameFilter={gameFilter}
                  onClose={() => setHoveredPlayerId(null)}
                  onChallenge={() => {
                    if (!isCurrent) {
                      onChallenge(player.id);
                      setHoveredPlayerId(null);
                    }
                  }}
                  isCurrentPlayer={isCurrent}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TowerRenderer;
