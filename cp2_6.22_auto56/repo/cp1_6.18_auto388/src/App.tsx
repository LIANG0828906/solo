import React, { useEffect, useRef } from 'react';
import { useGameStore } from './game/store';
import { loadLevel } from './game/levelModule';
import GameCanvas from './ui/GameCanvas';
import { MainMenu, LevelSelect, GameOverScreen, VictoryScreen } from './ui/MenuScreens';

export default function App() {
  const store = useGameStore();
  const [fadeClass, setFadeClass] = React.useState('');
  const prevPhase = useRef(store.gamePhase);

  useEffect(() => {
    if (store.gamePhase !== prevPhase.current) {
      if (store.gamePhase === 'playing' && prevPhase.current !== 'menu' && prevPhase.current !== 'levelSelect') {
        setFadeClass('fade-in');
        const t = setTimeout(() => setFadeClass(''), 500);
        return () => clearTimeout(t);
      }
      if (store.gamePhase === 'victory' || store.gamePhase === 'gameOver') {
        setFadeClass('fade-out');
        const t = setTimeout(() => setFadeClass(''), 500);
        return () => clearTimeout(t);
      }
      prevPhase.current = store.gamePhase;
    }
  }, [store.gamePhase]);

  return (
    <div style={appStyle}>
      <style>{css}</style>
      <div className={fadeClass} style={{ width: '100%', height: '100%' }}>
        {store.gamePhase === 'menu' && <MainMenu />}
        {store.gamePhase === 'levelSelect' && <LevelSelect />}
        {store.gamePhase === 'playing' && <GameCanvas />}
        {store.gamePhase === 'transition' && <GameCanvas />}
        {store.gamePhase === 'gameOver' && (
          <>
            <GameCanvas />
            <GameOverScreen />
          </>
        )}
        {store.gamePhase === 'victory' && (
          <>
            <GameCanvas />
            <VictoryScreen />
          </>
        )}
      </div>
    </div>
  );
}

const appStyle: React.CSSProperties = {
  width: '100%',
  height: '100vh',
  overflow: 'hidden',
  background: '#0F0F1A',
};

const css = `
.fade-in {
  animation: fadeIn 0.5s ease-out;
}
.fade-out {
  animation: fadeOut 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
`;
