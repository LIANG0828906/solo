import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import './MainMenu.css';

const MainMenu: React.FC = () => {
  const [player1Name, setPlayer1Name] = useState('玩家1');
  const [player2Name, setPlayer2Name] = useState('玩家2');
  const { startGame } = useGame();
  const navigate = useNavigate();

  const handleStartGame = () => {
    startGame(player1Name || '玩家1', player2Name || '玩家2');
    navigate('/game');
  };

  const handleViewLeaderboard = () => {
    navigate('/leaderboard');
  };

  return (
    <div className="main-menu">
      <div className="menu-container">
        <h1 className="game-title">
          <span className="title-icon">🌌</span>
          银河帝国
          <span className="subtitle">星际策略棋盘</span>
        </h1>

        <div className="player-inputs">
          <div className="input-group">
            <label className="input-label player1-label">
              🛸 玩家1 (蓝方)
            </label>
            <input
              type="text"
              className="input-field player1-input"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              placeholder="输入玩家1名称"
              maxLength={12}
            />
          </div>

          <div className="vs-divider">VS</div>

          <div className="input-group">
            <label className="input-label player2-label">
              🚀 玩家2 (红方)
            </label>
            <input
              type="text"
              className="input-field player2-input"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              placeholder="输入玩家2名称"
              maxLength={12}
            />
          </div>
        </div>

        <div className="menu-actions">
          <button className="menu-btn primary" onClick={handleStartGame}>
            ⚔️ 开始游戏
          </button>
          <button className="menu-btn" onClick={handleViewLeaderboard}>
            🏆 排行榜
          </button>
        </div>

        <div className="game-rules">
          <h3 className="rules-title">📜 游戏规则</h3>
          <ul className="rules-list">
            <li>在4x4星图上争夺行星资源和领土</li>
            <li>每支舰队每回合可移动一次并攻击一次</li>
            <li>建造三种战舰：侦察舰🛸、护卫舰🚀、主力舰🛡️</li>
            <li>占领行星获得资源，友方行星提供双倍收入</li>
            <li>10回合后，统治分更高的玩家获胜</li>
            <li>统治分 = 占领行星数×5 + 舰队总价值</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
