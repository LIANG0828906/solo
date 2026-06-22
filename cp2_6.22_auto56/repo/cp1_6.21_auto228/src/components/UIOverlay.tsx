import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { SHIP_COSTS, SHIP_CONFIGS, SHIP_ICONS, ShipType } from '../types/game';
import { saveGame, addLeaderboardEntry } from '../api/client';
import { v4 as uuidv4 } from 'uuid';
import './UIOverlay.css';

const UIOverlay: React.FC = () => {
  const { state, endTurn, buildNewShip, startGame } = useGame();
  const navigate = useNavigate();
  const [showEndPanel, setShowEndPanel] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!state) return null;

  const {
    currentPlayer,
    turn,
    maxTurns,
    resources,
    battleReport,
    gameOver,
    winner,
    scores,
    playerNames,
    isDeploymentPhase,
    selectedShip,
    startTime,
  } = state;

  const currentResourceKey = currentPlayer === 1 ? 'player1' : 'player2';
  const currentResources = resources[currentResourceKey];

  const handleBuildShip = async (type: ShipType) => {
    if (currentResources < SHIP_COSTS[type]) return;
    buildNewShip(type);
  };

  const handleEndTurn = () => {
    endTurn();
  };

  const handleSaveGame = async () => {
    try {
      await saveGame(state);
      
      const winnerName = winner === 1 
        ? playerNames.player1 
        : winner === 2 
          ? playerNames.player2 
          : '平局';
      
      const duration = Math.floor((Date.now() - startTime) / 1000);
      
      await addLeaderboardEntry({
        id: uuidv4(),
        player1: playerNames.player1,
        player2: playerNames.player2,
        winner: winnerName,
        turns: turn,
        score1: scores.player1,
        score2: scores.player2,
        duration,
        timestamp: Date.now(),
      });
      
      setSaved(true);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  };

  const handlePlayAgain = () => {
    startGame(playerNames.player1, playerNames.player2);
    setShowEndPanel(false);
    setSaved(false);
  };

  const handleBackToMenu = () => {
    navigate('/');
  };

  const handleViewLeaderboard = () => {
    navigate('/leaderboard');
  };

  return (
    <div className="ui-overlay">
      <div className="top-bar">
        <div className="resource-panel">
          <div className={`player-info player-${currentPlayer}`}>
            <span className="player-name">
              {currentPlayer === 1 ? playerNames.player1 : playerNames.player2}
            </span>
            <span className="resources">
              💎 {currentResources}
            </span>
          </div>
          <div className="turn-info">
            <span className="turn-label">回合</span>
            <span className="turn-number">{turn} / {maxTurns}</span>
          </div>
        </div>
      </div>

      {battleReport && (
        <div className="battle-report">
          {battleReport}
        </div>
      )}

      {isDeploymentPhase && (
        <div className="deployment-notice">
          ⚔️ 部署阶段 - 仅可移动到相邻格子，无法攻击
        </div>
      )}

      {selectedShip && (
        <div className="selected-ship-info">
          <span className="ship-icon">{SHIP_ICONS[selectedShip.type]}</span>
          <span className="ship-name">{selectedShip.name}</span>
          <span className="ship-stats">
            ⚔️{selectedShip.attack} 🛡️{selectedShip.defense} ❤️{selectedShip.hp}/{selectedShip.maxHp}
          </span>
        </div>
      )}

      <div className="bottom-bar">
        <div className="build-panel">
          <span className="build-label">建造：</span>
          {(Object.keys(SHIP_COSTS) as ShipType[]).map((type) => (
            <button
              key={type}
              className={`build-btn ${currentResources < SHIP_COSTS[type] ? 'disabled' : ''}`}
              onClick={() => handleBuildShip(type)}
              disabled={currentResources < SHIP_COSTS[type]}
              title={`${SHIP_CONFIGS[type].name} - 攻击:${SHIP_CONFIGS[type].attack} 防御:${SHIP_CONFIGS[type].defense} 生命:${SHIP_CONFIGS[type].maxHp}`}
            >
              <span className="btn-icon">{SHIP_ICONS[type]}</span>
              <span className="btn-cost">{SHIP_COSTS[type]}💎</span>
            </button>
          ))}
        </div>

        <button className="end-turn-btn" onClick={handleEndTurn}>
          结束回合 →
        </button>
      </div>

      {(gameOver || showEndPanel) && (
        <div className="game-over-modal">
          <div className="modal-content">
            <h2 className="modal-title">
              {winner === 'draw' ? '🤝 平局!' : `🏆 ${winner === 1 ? playerNames.player1 : playerNames.player2} 获胜!`}
            </h2>
            
            <div className="score-breakdown">
              <div className="score-row player1">
                <span className="score-name">{playerNames.player1}</span>
                <span className="score-value">{scores.player1}</span>
              </div>
              <div className="score-row player2">
                <span className="score-name">{playerNames.player2}</span>
                <span className="score-value">{scores.player2}</span>
              </div>
            </div>

            <div className="score-detail">
              <p>统治分 = 占领行星数×5 + 舰队总价值</p>
            </div>

            <div className="modal-actions">
              {!saved && (
                <button className="modal-btn primary" onClick={handleSaveGame}>
                  💾 保存存档
                </button>
              )}
              {saved && (
                <div className="saved-message">✅ 已保存到排行榜</div>
              )}
              <button className="modal-btn" onClick={handlePlayAgain}>
                🔄 再来一局
              </button>
              <button className="modal-btn" onClick={handleViewLeaderboard}>
                📊 查看排行榜
              </button>
              <button className="modal-btn secondary" onClick={handleBackToMenu}>
                🏠 返回主菜单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;
