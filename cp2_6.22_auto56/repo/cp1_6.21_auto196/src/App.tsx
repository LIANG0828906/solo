import { useEffect } from 'react';
import { GameProvider, useGameContext } from './context/GameContext';
import Grid from './components/Grid';
import ElementBar from './components/ElementBar';
import HUD from './components/HUD';
import EnemyManager from './components/EnemyManager';

function GameScreen() {
  const { state, actions } = useGameContext();
  const { isPlaying, isGameOver, isVictory, gridSize } = state;

  useEffect(() => {
    const handleResize = () => {
      const newSize = window.innerWidth < 768 ? 6 : 8;
      if (newSize !== gridSize) {
        actions.setGridSize(newSize);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridSize, actions]);

  const handleStart = () => {
    const size = window.innerWidth < 768 ? 6 : 8;
    actions.startGame(size);
  };

  const handleRestart = () => {
    const size = window.innerWidth < 768 ? 6 : 8;
    actions.startGame(size);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900 overflow-hidden">
      <EnemyManager />
      {isPlaying && <HUD />}
      <Grid />
      {isPlaying && <ElementBar />}

      {!isPlaying && !isGameOver && !isVictory && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-50">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-widest">
            元素调律
          </h1>
          <p className="text-slate-400 mb-12 font-mono">
            布置符文 · 触发联动 · 消灭敌人
          </p>
          <button
            onClick={handleStart}
            className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-semibold rounded-lg transition-colors duration-200 shadow-lg shadow-blue-600/30"
          >
            开始游戏
          </button>
        </div>
      )}

      {(isGameOver || isVictory) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-50">
          <h1
            className={`text-5xl font-bold mb-4 ${
              isVictory ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isVictory ? '胜利！' : '游戏结束'}
          </h1>
          <p className="text-slate-400 mb-12 font-mono">
            {isVictory ? '你成功抵御了所有敌人的进攻' : '敌人突破了防线'}
          </p>
          <button
            onClick={handleRestart}
            className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-semibold rounded-lg transition-colors duration-200 shadow-lg shadow-blue-600/30"
          >
            重新开始
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  );
}
