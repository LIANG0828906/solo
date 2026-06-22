import React from 'react';
import { useGameStore } from '../store/useGameStore';
import Leaderboard from './Leaderboard';

const MainMenu: React.FC = () => {
  const { setScene, highScore, credits } = useGameStore();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="pixel-font text-4xl md:text-6xl text-yellow-400 title-glow mb-2">
          ASTRO
        </h1>
        <h1 className="pixel-font text-4xl md:text-6xl text-red-500 title-glow mb-8">
          FORGE
        </h1>
        
        <p className="text-gray-400 mb-8 text-center">
          深空对战 · 战舰改装 · 弹幕挑战
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            className="btn btn-primary py-4 text-lg"
            onClick={() => setScene('playing')}
          >
            开始游戏
          </button>
          
          <button
            className="btn btn-secondary py-4"
            onClick={() => setScene('customize')}
          >
            战舰改装
          </button>
          
          <button
            className="btn py-4"
            onClick={() => setScene('achievements')}
          >
            成就徽章
          </button>
        </div>

        <div className="mt-8 flex gap-8 text-sm">
          <div className="text-center">
            <p className="text-gray-500">最高分</p>
            <p className="text-xl font-bold text-yellow-400">{highScore}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">积分</p>
            <p className="text-xl font-bold text-green-400">{credits}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md mt-8">
        <Leaderboard limit={5} />
      </div>

      <div className="absolute bottom-4 text-gray-600 text-xs">
        ← → 或 A D 移动 · 自动射击
      </div>
    </div>
  );
};

export default MainMenu;
