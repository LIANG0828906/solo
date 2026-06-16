import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { isHighScore, addLeaderboardEntry, setHighScore, addCredits, getHighScore } from '../utils/storage';

interface GameOverProps {
  score: number;
  wave: number;
  kills: number;
  onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, wave, kills, onRestart }) => {
  const { setScene, highScore, setHighScore: setStoreHighScore, setCredits } = useGameStore();
  const [showNameInput, setShowNameInput] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    checkHighScore();
    awardCredits();
  }, []);

  const checkHighScore = async () => {
    const high = await getHighScore();
    if (score > high) {
      await setHighScore(score);
      setStoreHighScore(score);
    }
    const isHigh = await isHighScore(score);
    setIsNewHighScore(isHigh);
    if (isHigh) {
      setShowNameInput(true);
    }
  };

  const awardCredits = async () => {
    const earned = Math.floor(score / 10);
    await addCredits(earned);
    const creds = await import('../utils/storage').then(m => m.getCredits());
    setCredits(creds);
  };

  const handleSubmit = async () => {
    if (!playerName.trim()) return;
    
    await addLeaderboardEntry({
      name: playerName.trim().slice(0, 8),
      score,
      wave,
    });
    
    setShowNameInput(false);
  };

  const handleBackToMenu = () => {
    setScene('menu');
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="text-3xl font-bold text-red-500 mb-2 pixel-font">GAME OVER</h2>
        
        {isNewHighScore && (
          <p className="text-yellow-400 text-lg mb-4 animate-pulse">
            🏆 新纪录！
          </p>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">本局得分</span>
            <span className="text-2xl font-bold text-yellow-400">{score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">最高纪录</span>
            <span className="text-lg text-green-400">{highScore}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">到达波数</span>
            <span className="text-lg text-blue-400">第 {wave} 波</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">击落敌机</span>
            <span className="text-lg text-red-400">{kills} 架</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-gray-400">获得积分</span>
            <span className="text-lg text-green-400">+{Math.floor(score / 10)}</span>
          </div>
        </div>

        {showNameInput && (
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-2">输入昵称 (最多8字符)</p>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              placeholder="Player"
              maxLength={8}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center"
              autoFocus
            />
            <button
              className="btn btn-gold w-full mt-3 py-2"
              onClick={handleSubmit}
              disabled={!playerName.trim()}
            >
              保存成绩
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            className="btn btn-primary flex-1 py-3"
            onClick={onRestart}
          >
            再来一局
          </button>
          <button
            className="btn flex-1 py-3"
            onClick={handleBackToMenu}
          >
            返回菜单
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
