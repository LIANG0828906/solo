import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GameBoard from './game/GameBoard';
import { useGameStore } from './store/gameStore';
import './App.css';

const InfoPanel: React.FC = () => {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const totalLevels = useGameStore((state) => state.totalLevels);
  const steps = useGameStore((state) => state.steps);
  const gravityDirection = useGameStore((state) => state.gravityDirection);
  const reset = useGameStore((state) => state.reset);
  const cycleGravity = useGameStore((state) => state.cycleGravity);
  const isComplete = useGameStore((state) => state.isComplete);
  const isAnimating = useGameStore((state) => state.isAnimating);

  const gravityLabels: Record<string, string> = {
    down: '↓ 向下',
    left: '← 向左',
    up: '↑ 向上',
    right: '→ 向右',
  };

  const handleShowHint = () => {
    alert(
      '操作提示：\n\n' +
        '• 点击方块可以旋转 90 度\n' +
        '• 按空格键可以切换重力方向\n' +
        '• 将所有方块送入金色目标区域即可通关\n' +
        '• 方块会沿重力方向下落，遇到障碍或地面停止'
    );
  };

  return (
    <div className="info-panel">
      <h1 className="game-title">重力方块</h1>
      <p className="game-subtitle">解谜游戏</p>

      <div className="info-section">
        <div className="info-item">
          <span className="info-label">关卡</span>
          <span className="info-value">
            {currentLevel + 1} / {totalLevels}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">步数</span>
          <span className="info-value">{steps}</span>
        </div>
        <div className="info-item">
          <span className="info-label">重力</span>
          <span className="info-value gravity-value">
            {gravityLabels[gravityDirection]}
          </span>
        </div>
      </div>

      <div className="button-group">
        <button
          className="game-btn hint-btn"
          onClick={handleShowHint}
        >
          💡 提示
        </button>
        <button
          className="game-btn reset-btn"
          onClick={reset}
          disabled={isAnimating}
        >
          🔄 重置
        </button>
      </div>

      <div className="controls-hint">
        <p className="hint-text">
          <span className="key-hint">空格</span> 切换重力
        </p>
        <p className="hint-text">
          <span className="key-hint">点击方块</span> 旋转
        </p>
      </div>

      {isComplete && (
        <div className="status-badge success">
          ✓ 关卡完成
        </div>
      )}

      {isAnimating && (
        <div className="status-badge animating">
          ⏳ 移动中...
        </div>
      )}
    </div>
  );
};

const GamePage: React.FC = () => {
  const cycleGravity = useGameStore((state) => state.cycleGravity);
  const isAnimating = useGameStore((state) => state.isAnimating);
  const isComplete = useGameStore((state) => state.isComplete);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isAnimating && !isComplete) {
        e.preventDefault();
        cycleGravity();
      }
    },
    [cycleGravity, isAnimating, isComplete]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="game-container">
      <div className="game-main-area">
        <GameBoard />
      </div>
      <InfoPanel />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<GamePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
