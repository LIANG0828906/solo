import React from 'react';
import GameBoard, { HistoryPanel } from './GameBoard';

const App: React.FC = () => {
  return (
    <>
      <div className="bamboo-curtain" />
      <div className="app-container">
        <h1 className="game-title">建安茗战</h1>
        <p className="game-subtitle">—— 北苑贡茶院斗茶模拟器 ——</p>
        <div className="game-layout">
          <div className="game-main">
            <GameBoard />
          </div>
          <HistoryPanel />
        </div>
      </div>
    </>
  );
};

export default App;
