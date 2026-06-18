import { useEffect } from 'react';
import QuizRoom from './components/QuizRoom';
import PlayerList from './components/PlayerList';
import { gameManager } from './game/gameManager';

export default function App() {
  useEffect(() => {
    gameManager.init();
    return () => gameManager.destroy();
  }, []);

  return (
    <div className="app-bg min-h-screen flex">
      <QuizRoom />
      <PlayerList />
    </div>
  );
}
