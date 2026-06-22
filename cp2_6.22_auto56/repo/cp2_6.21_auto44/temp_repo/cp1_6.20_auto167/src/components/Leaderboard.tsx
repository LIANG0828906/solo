import { useState, useEffect, useRef, useMemo } from 'react';
import type { LeaderboardEntry, LeaderboardCategory } from '../types';

interface LeaderboardProps {
  data: LeaderboardEntry[];
  category: LeaderboardCategory;
  activeTab: LeaderboardCategory;
  onTabChange: (tab: LeaderboardCategory) => void;
  onPlayerClick: (entry: LeaderboardEntry) => void;
  selfPlayerId?: string;
  formatValue: (value: number) => string;
}

const TAB_LABELS: Record<LeaderboardCategory, { label: string; icon: string }> = {
  kills: { label: 'Total Kills', icon: '💀' },
  survival: { label: 'Survival Time', icon: '⏱️' },
  winStreak: { label: 'Win Streak', icon: '🔥' },
};

function Leaderboard({
  data,
  category,
  activeTab,
  onTabChange,
  onPlayerClick,
  selfPlayerId,
  formatValue,
}: LeaderboardProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevRanksRef = useRef<Map<string, number>>(new Map());
  const [animatingRanks, setAnimatingRanks] = useState<Map<string, 'up' | 'down'>>(new Map());
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set());

  const displayData = useMemo(() => {
    return data.map((entry) => ({
      ...entry,
      isSelf: entry.playerId === selfPlayerId,
    }));
  }, [data, selfPlayerId]);

  useEffect(() => {
    const activeIndex = (['kills', 'survival', 'winStreak'] as LeaderboardCategory[]).indexOf(
      activeTab
    );
    const tab = tabRefs.current[activeIndex];
    if (tab) {
      setIndicatorStyle({
        left: tab.offsetLeft,
        width: tab.offsetWidth,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    const prevRanks = prevRanksRef.current;
    const newAnimating = new Map<string, 'up' | 'down'>();
    const newEntering = new Set<string>();

    for (const entry of displayData) {
      const prevRank = prevRanks.get(entry.playerId);
      if (prevRank !== undefined && prevRank !== entry.rank) {
        newAnimating.set(entry.playerId, entry.rank < prevRank ? 'up' : 'down');
      } else if (prevRank === undefined) {
        newEntering.add(entry.playerId);
      }
    }

    if (newAnimating.size > 0) {
      setAnimatingRanks(newAnimating);
      setTimeout(() => setAnimatingRanks(new Map()), 400);
    }

    if (newEntering.size > 0) {
      setEnteringIds(newEntering);
      setTimeout(() => setEnteringIds(new Set()), 300);
    }

    prevRanksRef.current = new Map(displayData.map((e) => [e.playerId, e.rank]));
  }, [displayData]);

  const handleRipple = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '10px';
    ripple.style.height = '10px';

    target.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  };

  const getCrown = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <div className="leaderboard-card">
      <div className="leaderboard-tabs">
        {(['kills', 'survival', 'winStreak'] as LeaderboardCategory[]).map((tab, index) => (
          <button
            key={tab}
            ref={(el) => (tabRefs.current[index] = el)}
            className={`leaderboard-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {TAB_LABELS[tab].icon} {TAB_LABELS[tab].label}
          </button>
        ))}
        <div
          className="tab-indicator"
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`,
          }}
        />
      </div>

      <div className="leaderboard-list">
        {displayData.length === 0 ? (
          <div className="loading-spinner">
            <div className="spinner" />
            <span>Loading leaderboard...</span>
          </div>
        ) : (
          displayData.map((entry) => (
            <div
              key={entry.playerId}
              className={`leaderboard-row ${entry.isSelf ? 'is-self' : ''} ${
                enteringIds.has(entry.playerId) ? 'entering' : ''
              }`}
              onClick={(e) => {
                handleRipple(e);
                onPlayerClick(entry);
              }}
            >
              <div className={`leaderboard-rank rank-${entry.rank}`}>
                {entry.rank <= 3 && <span className="rank-crown">{getCrown(entry.rank)}</span>}
                <span
                  className={`rank-number ${
                    animatingRanks.get(entry.playerId) === 'up'
                      ? 'flip-up'
                      : animatingRanks.get(entry.playerId) === 'down'
                      ? 'flip-down'
                      : ''
                  }`}
                >
                  {entry.rank}
                </span>
              </div>
              <span className="leaderboard-name">
                {entry.playerName}
                {entry.isSelf && <span className="self-indicator">YOU</span>}
              </span>
              <span className="leaderboard-value">{formatValue(entry.value)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
