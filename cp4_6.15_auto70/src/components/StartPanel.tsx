import { useState } from 'react';
import { ThemeType } from '../words';
import BrushAnimation from './BrushAnimation';
import './StartPanel.css';

interface StartPanelProps {
  onStart: (theme: ThemeType, playerNames: [string, string]) => void;
}

export default function StartPanel({ onStart }: StartPanelProps) {
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [theme, setTheme] = useState<ThemeType>('idiom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p1 = player1Name.trim() || '玩家1';
    const p2 = player2Name.trim() || '玩家2';
    onStart(theme, [p1, p2]);
  };

  return (
    <div className="app start-phase">
      <div className="start-panel">
        <h1 className="game-title">词语接龙</h1>
        <p className="game-subtitle">双人对战 · 限时30秒</p>

        <BrushAnimation />

        <form className="start-form" onSubmit={handleSubmit}>
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="player1">玩家1</label>
              <input
                id="player1"
                type="text"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                placeholder="请输入玩家1名称"
                maxLength={10}
              />
            </div>
            <div className="input-group">
              <label htmlFor="player2">玩家2</label>
              <input
                id="player2"
                type="text"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                placeholder="请输入玩家2名称"
                maxLength={10}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="theme">词库主题</label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeType)}
            >
              <option value="idiom">成语</option>
              <option value="daily">日常词语</option>
              <option value="english">英文单词</option>
            </select>
          </div>

          <button type="submit" className="start-btn">
            开始对战
          </button>
        </form>
      </div>
    </div>
  );
}
