import React, { useState } from 'react';
import { Leaderboard } from './Leaderboard';
import './GameOver.css';

interface GameOverProps {
  score: number;
  coinsCollected: number;
  survivalTime: number;
  playerName: string;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  score,
  coinsCollected,
  survivalTime,
  playerName,
  onRestart,
  onBackToMenu,
}) => {
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRestart = () => {
    setIsRestarting(true);
    setTimeout(() => {
      onRestart();
    }, 300);
  };

  const handleBackToMenu = () => {
    setIsRestarting(true);
    setTimeout(() => {
      onBackToMenu();
    }, 300);
  };

  return (
    <div className={`game-over-overlay ${isRestarting ? 'fade-out' : ''}`}>
      <div className="game-over-container">
        <h1 className="game-over-title">游戏结束</h1>
        
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">最终得分</span>
            <span className="stat-value score-value">{score.toLocaleString()}</span>
          </div>
          
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-label">金币收集</span>
              <span className="stat-value coin-value">
                <span className="coin-icon">🪙</span>
                {coinsCollected}
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">存活时间</span>
              <span className="stat-value time-value">
                <span className="time-icon">⏱</span>
                {formatTime(survivalTime)}
              </span>
            </div>
          </div>
        </div>

        <button 
          className="btn-restart"
          onClick={handleRestart}
        >
          再来一次
        </button>

        <button 
          className="btn-back-menu"
          onClick={handleBackToMenu}
        >
          返回主菜单
        </button>

        <div className="leaderboard-wrapper">
          <Leaderboard
            currentScore={score}
            playerName={playerName}
            refreshTrigger={leaderboardRefresh}
          />
        </div>
      </div>
      
      <div className="confetti-container">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              background: ['#6C5CE7', '#A29BFE', '#FFD700', '#E74C3C', '#2ECC71'][
                Math.floor(Math.random() * 5)
              ],
            }}
          />
        ))}
      </div>
    </div>
  );
};
