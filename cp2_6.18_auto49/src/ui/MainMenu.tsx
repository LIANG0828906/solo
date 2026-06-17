import React, { useState, useEffect } from 'react';
import './MainMenu.css';

interface MainMenuProps {
  onStart: () => void;
  playerName: string;
  onNameChange: (name: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, playerName, onNameChange }) => {
  const [name, setName] = useState(playerName);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [name]);

  const handleStart = () => {
    onNameChange(name.trim() || '匿名玩家');
    onStart();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  return (
    <div className="main-menu">
      <div className="menu-content">
        <h1 className="game-title">BeatDash</h1>
        <p className="game-subtitle">节奏跑酷</p>
        
        <button className="btn-start" onClick={handleStart}>
          开始游戏
        </button>
        
        <div className="name-input-container">
          <input
            type="text"
            className="name-input"
            placeholder="输入昵称"
            value={name}
            onChange={handleNameChange}
            maxLength={12}
          />
        </div>
        
        <div className="instructions">
          <p className="instructions-title">操作说明</p>
          <div className="instructions-grid">
            <div className="instruction-item">
              <span className="key">← →</span>
              <span className="action">左右移动</span>
            </div>
            <div className="instruction-item">
              <span className="key">空格 / ↑</span>
              <span className="action">跳跃</span>
            </div>
            <div className="instruction-item">
              <span className="key">↓</span>
              <span className="action">滑铲</span>
            </div>
          </div>
        </div>
        
        <p className="menu-hint">按 Enter 键快速开始</p>
      </div>
      
      <div className="decoration-lines">
        <div className="deco-line deco-line-1"></div>
        <div className="deco-line deco-line-2"></div>
        <div className="deco-line deco-line-3"></div>
      </div>
    </div>
  );
};
