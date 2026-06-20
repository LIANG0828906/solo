import { useState, useEffect } from 'react';
import type { Player } from '../types';

type ViewMode = 'map' | 'ar';

interface HUDProps {
  player: Player | null;
  leaderboard: Player[];
  viewMode: ViewMode;
  gameRound: number;
  countdownActive: boolean;
  countdownEndTime: number;
  remainingTreasures: number;
  showClaimAnimation: boolean;
  lastPoints: number;
  onBackToMap: () => void;
}

function HUD({
  player,
  leaderboard,
  viewMode,
  gameRound,
  countdownActive,
  countdownEndTime,
  remainingTreasures,
  showClaimAnimation,
  lastPoints,
  onBackToMap,
}: HUDProps) {
  const [leaderboardCollapsed, setLeaderboardCollapsed] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  useEffect(() => {
    if (!countdownActive || countdownEndTime === 0) {
      setCountdownSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((countdownEndTime - Date.now()) / 1000));
      setCountdownSeconds(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [countdownActive, countdownEndTime]);

  const getRankClass = (index: number) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return 'rank-other';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="hud-container">
      {viewMode === 'ar' && (
        <button className="back-btn" onClick={onBackToMap}>
          ← 返回地图
        </button>
      )}

      {viewMode === 'map' && (
        <div className="score-display">
          <div className="score-label">分数</div>
          <div className="score-value">{player?.score || 0}</div>
          <div className="score-round">第 {gameRound} 轮</div>
        </div>
      )}

      {viewMode === 'map' && (
        <div className="remaining-treasures">
          剩余宝藏: {remainingTreasures} / 10
        </div>
      )}

      <div className={`leaderboard-panel ${leaderboardCollapsed ? 'collapsed' : ''}`}>
        <div className="leaderboard-header">
          {!leaderboardCollapsed && (
            <span className="leaderboard-title">排行榜</span>
          )}
          <button
            className="toggle-btn"
            onClick={() => setLeaderboardCollapsed(!leaderboardCollapsed)}
          >
            {leaderboardCollapsed ? '»' : '«'}
          </button>
        </div>
        {!leaderboardCollapsed && (
          <ul className="leaderboard-list">
            {leaderboard.map((player, index) => (
              <li
                key={player.id}
                className={`leaderboard-item ${getRankClass(index)}`}
              >
                <span className="leaderboard-rank">{index + 1}</span>
                <span className="leaderboard-name">{player.name}</span>
                <span className="leaderboard-score">{player.score}</span>
              </li>
            ))}
            {leaderboard.length === 0 && (
              <li className="leaderboard-item rank-other">
                <span className="leaderboard-name" style={{ textAlign: 'center', flex: 1 }}>
                  暂无数据
                </span>
              </li>
            )}
          </ul>
        )}
      </div>

      {viewMode === 'ar' && (
        <div className="ar-crosshair">
          <div className="crosshair-h" />
          <div className="crosshair-v" />
        </div>
      )}

      {viewMode === 'ar' && (
        <div className="treasure-info">
          <div className="treasure-info-text">对准宝藏并点击拾取</div>
          <div className="treasure-info-hint">拖动鼠标旋转视角</div>
        </div>
      )}

      {countdownActive && (
        <div className="countdown-overlay">
          <div className="countdown-text">{countdownSeconds}</div>
          <div className="countdown-label">下一轮开始</div>
        </div>
      )}

      {showClaimAnimation && (
        <div className="claim-animation">+{lastPoints}</div>
      )}
    </div>
  );
}

export default HUD;
