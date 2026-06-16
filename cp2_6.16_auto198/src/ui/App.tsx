import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import MenuScreen from './MenuScreen';
import GameScreen from './GameScreen';
import Notification from './Notification';

function App() {
  const { gamePhase, showHitEffect, initSocket, notification } = useGameStore();

  useEffect(() => {
    initSocket();
    
    return () => {
      const { socket, stopTurnTimer } = useGameStore.getState();
      stopTurnTimer();
      if (socket) {
        socket.disconnect();
      }
    };
  }, [initSocket]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-deep-space">
      <StarField />
      
      {showHitEffect && (
        <div className="fixed inset-0 pointer-events-none z-50 animate-hit-flash" />
      )}

      {notification && <Notification message={notification} />}

      {gamePhase === 'menu' || gamePhase === 'waiting' ? (
        <MenuScreen />
      ) : (
        <GameScreen />
      )}
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `starFloat ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export default App;
