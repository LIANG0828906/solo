import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Player, GameType, getPlayerMaxScore, getPlayerWinRate } from './utils/scores';
import { ChallengeState } from './ChallengeEngine';

interface TowerRendererProps {
  players: Player[];
  updatedPlayerIds: Set<string>;
  gameFilter: GameType | 'all';
  sortMode: 'score' | 'winrate' | 'challenges';
  currentPlayerId: string | null;
  onChallenge: (challengedId: string) => void;
  challengeState: ChallengeState | null;
}

const getTowerColor = (index: number, total: number): string => {
  const ratio = total <= 1 ? 1 : 1 - index / (total - 1);
  const hue = ratio * 80;
  const saturation = 90;
  const lightness = 45 + ratio * 15;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const getTowerGlow = (index: number, total: number): string => {
  const ratio = total <= 1 ? 1 : 1 - index / (total - 1);
  const hue = ratio * 80;
  return `0 0 12px hsla(${hue}, 90%, 60%, 0.5), 0 0 24px hsla(${hue}, 90%, 60%, 0.25)`;
};

const MiniSparkline: React.FC<{ data: number[] }> = ({ data }) => {
  if (data.length === 0) return null;
  const w = 110;
  const h = 36;
  const pad = 3;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="spkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#05ffa1" />
          <stop offset="100%" stopColor="#01cdfe" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#spkGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
      {data.map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / (data.length - 1);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r={2} fill="#05ffa1" />;
      })}
    </svg>
  );
};

const VictoryParticles: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 1.5,
      size: 4 + Math.random() * 8,
      color: ['#ffd700', '#ff2d95', '#b967ff', '#01cdfe', '#05ffa1', '#ff71ce'][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
    }));
  }, []);

  return (
    <div className="victory-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const CrownRibbon: React.FC = () => (
  <div className="crown-ribbon">
    <div className="crown-icon">👑</div>
    <div className="ribbon-text">VICTORY</div>
    <VictoryParticles />
  </div>
);

const DefeatEffect: React.FC = () => (
  <div className="defeat-effect">
    <div className="defeat-text">你被击败了</div>
  </div>
);

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
    <div className="player-card-popup" onClick={e => e.stopPropagation()}>
      <div className="player-card-header">
        <div className="player-card-avatar-lg" style={{ backgroundColor: player.avatarColor }}>
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
          <div className="stat-value">{maxScore.toLocaleString()}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">胜率</div>
          <div className="stat-value">{(winRate * 100).toFixed(1)}%</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">挑战</div>
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
        <button className="challenge-btn-popup" onClick={onChallenge}>⚔ 约战</button>
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
  challengeState,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPositionsRef = useRef<Map<string, DOMRect>>(new Map());
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [scaleAnimateIds, setScaleAnimateIds] = useState<Set<string>>(new Set());
  const [flipStyles, setFlipStyles] = useState<Map<string, React.CSSProperties>>(new Map());
  const prevPlayerIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (updatedPlayerIds.size > 0) {
      setFlashIds(new Set(updatedPlayerIds));
      setScaleAnimateIds(new Set(updatedPlayerIds));
      const t1 = setTimeout(() => setFlashIds(new Set()), 700);
      const t2 = setTimeout(() => setScaleAnimateIds(new Set()), 900);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [updatedPlayerIds]);

  const capturePositions = useCallback(() => {
    if (!containerRef.current) return;
    const map = new Map<string, DOMRect>();
    const items = containerRef.current.querySelectorAll<HTMLElement>('[data-player-id]');
    items.forEach(el => {
      const pid = el.getAttribute('data-player-id');
      if (pid) map.set(pid, el.getBoundingClientRect());
    });
    prevPositionsRef.current = map;
  }, []);

  const applyFLIP = useCallback((newPlayerIds: string[]) => {
    if (!containerRef.current) return;
    const newMap = new Map<string, DOMRect>();
    const items = containerRef.current.querySelectorAll<HTMLElement>('[data-player-id]');
    items.forEach(el => {
      const pid = el.getAttribute('data-player-id');
      if (pid) newMap.set(pid, el.getBoundingClientRect());
    });

    const styles = new Map<string, React.CSSProperties>();
    let hasChanges = false;

    newPlayerIds.forEach(pid => {
      const oldRect = prevPositionsRef.current.get(pid);
      const newRect = newMap.get(pid);
      if (oldRect && newRect) {
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          hasChanges = true;
          styles.set(pid, {
            transform: `translate(${dx}px, ${dy}px)`,
            transition: 'none',
          });
        }
      }
    });

    if (hasChanges) {
      setFlipStyles(styles);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const finalStyles = new Map<string, React.CSSProperties>();
          newPlayerIds.forEach(pid => {
            if (styles.has(pid)) {
              finalStyles.set(pid, {
                transform: 'translate(0, 0)',
                transition: 'transform 400ms ease-in-out',
              });
            }
          });
          setFlipStyles(finalStyles);
          setTimeout(() => {
            setFlipStyles(new Map());
          }, 450);
        });
      });
    }

    prevPositionsRef.current = newMap;
  }, []);

  useEffect(() => {
    const currentIds = players.map(p => p.id);
    const prevIds = prevPlayerIdsRef.current;

    if (prevIds.length > 0 && prevIds.length === currentIds.length) {
      const sameSet = prevIds.every((id, i) => id === currentIds[i]);
      if (!sameSet) {
        capturePositions();
      }
    }
    prevPlayerIdsRef.current = currentIds;
  }, [players, capturePositions]);

  useEffect(() => {
    if (prevPositionsRef.current.size > 0 && players.length > 0) {
      const currentIds = players.map(p => p.id);
      applyFLIP(currentIds);
    }
  }, [sortMode, gameFilter, applyFLIP, players]);

  const maxScore = useMemo(() => {
    if (players.length === 0) return 1;
    return Math.max(...players.map(p => getPlayerMaxScore(p, gameFilter === 'all' ? undefined : gameFilter)));
  }, [players, gameFilter]);

  const displayPlayers = useMemo(() => players.slice(0, isMobile ? 20 : 50), [players, isMobile]);

  const isWinner = (playerId: string): boolean => {
    return challengeState?.status === 'ended' && challengeState.winnerId === playerId;
  };

  const isLoser = (playerId: string): boolean => {
    return challengeState?.status === 'ended' &&
      ((playerId === challengeState.challengerId && challengeState.winnerId !== playerId) ||
       (playerId === challengeState.challengedId && challengeState.winnerId !== playerId));
  };

  return (
    <div
      ref={containerRef}
      className={`tower-container ${isMobile ? 'mobile' : 'desktop'}`}
      onClick={() => setHoveredPlayerId(null)}
    >
      {displayPlayers.map((player, index) => {
        const score = getPlayerMaxScore(player, gameFilter === 'all' ? undefined : gameFilter);
        const heightPct = isMobile
          ? Math.max(10, (score / maxScore) * 100)
          : Math.max(4, (score / maxScore) * 100);
        const color = getTowerColor(index, displayPlayers.length);
        const glow = getTowerGlow(index, displayPlayers.length);
        const isFlashing = flashIds.has(player.id);
        const isScaleAnim = scaleAnimateIds.has(player.id);
        const isHovered = hoveredPlayerId === player.id;
        const isCurrent = currentPlayerId === player.id;
        const won = isWinner(player.id);
        const lost = isLoser(player.id);
        const flipStyle = flipStyles.get(player.id);

        const itemStyle: React.CSSProperties = {
          animationDelay: `${index * 50}ms`,
          ...flipStyle,
        };

        if (lost) {
          itemStyle.filter = 'grayscale(1)';
          itemStyle.transform = `${flipStyle?.transform || ''} rotate(5deg)`;
          itemStyle.transition = flipStyle?.transition || 'filter 400ms ease-out, transform 400ms ease-out';
        }

        if (won) {
          itemStyle.filter = 'brightness(1.2)';
          itemStyle.transition = flipStyle?.transition || 'filter 400ms ease-out';
        }

        const barStyle: React.CSSProperties = {
          ...(isMobile ? { width: `${heightPct}%` } : { height: `${heightPct}%` }),
          background: `linear-gradient(${isMobile ? '90deg' : '0deg'}, ${color}, ${color}dd)`,
          boxShadow: glow,
          transition: isScaleAnim
            ? 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), height 400ms ease-out, width 400ms ease-out'
            : 'height 400ms ease-out, width 400ms ease-out, transform 300ms ease-out',
        };

        if (isScaleAnim) {
          barStyle.transform = 'scaleY(0.5)';
        }

        return (
          <div
            key={player.id}
            data-player-id={player.id}
            className={`tower-item ${isMobile ? 'horizontal' : 'vertical'} ${won ? 'winner' : ''} ${lost ? 'loser' : ''}`}
            style={itemStyle}
          >
            <div
              className={`tower-bar ${isFlashing ? 'flash' : ''} ${isScaleAnim ? 'score-animate' : ''} ${isHovered ? 'hovered' : ''} ${isCurrent ? 'current' : ''}`}
              style={barStyle}
              onMouseEnter={() => !isMobile && setHoveredPlayerId(player.id)}
              onMouseLeave={() => !isMobile && setHoveredPlayerId(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (isMobile) setHoveredPlayerId(isHovered ? null : player.id);
                else setHoveredPlayerId(isHovered ? null : player.id);
              }}
            >
              {isMobile && (
                <div className="tower-content horizontal-content">
                  <div className="tower-avatar-sm" style={{ backgroundColor: player.avatarColor }}>
                    {player.name.charAt(0)}
                  </div>
                  <div className="tower-info">
                    <div className="tower-name">{player.name}</div>
                    <div className="tower-score">{score.toLocaleString()}</div>
                  </div>
                  <button
                    className="tower-challenge-btn"
                    onClick={e => { e.stopPropagation(); if (!isCurrent) onChallenge(player.id); }}
                    disabled={isCurrent}
                  >
                    ⚔
                  </button>
                </div>
              )}

              {isFlashing && <div className="tower-flash-overlay" />}
            </div>

            {!isMobile && (
              <div className="tower-label">
                <div className="tower-avatar-sm" style={{ backgroundColor: player.avatarColor }}>
                  {player.name.charAt(0)}
                </div>
                <div className="tower-name">{player.name}</div>
                <div className="tower-score">{score.toLocaleString()}</div>
                <button
                  className="tower-challenge-btn"
                  onClick={e => { e.stopPropagation(); if (!isCurrent) onChallenge(player.id); }}
                  disabled={isCurrent}
                >
                  约战
                </button>
              </div>
            )}

            {won && <CrownRibbon />}
            {lost && <DefeatEffect />}

            {isHovered && !isMobile && (
              <div className="player-card-wrapper">
                <PlayerCard
                  player={player}
                  gameFilter={gameFilter}
                  onClose={() => setHoveredPlayerId(null)}
                  onChallenge={() => { if (!isCurrent) { onChallenge(player.id); setHoveredPlayerId(null); } }}
                  isCurrentPlayer={isCurrent}
                />
              </div>
            )}

            {isHovered && isMobile && (
              <div className="player-card-wrapper mobile-card">
                <PlayerCard
                  player={player}
                  gameFilter={gameFilter}
                  onClose={() => setHoveredPlayerId(null)}
                  onChallenge={() => { if (!isCurrent) { onChallenge(player.id); setHoveredPlayerId(null); } }}
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
