import React, { useEffect } from 'react';
import { Board } from '@/modules/game/Board';
import { HUD } from '@/modules/ui/HUD';
import { initWebSocketService, cleanupWebSocketService } from '@/modules/network/WebSocketService';
import { useGameStore } from '@/store/GameStore';
import './App.css';

const App: React.FC = () => {
  useEffect(() => {
    initWebSocketService();
    return () => {
      cleanupWebSocketService();
    };
  }, []);

  return (
    <div className="sea-clash-app">
      <div className="game-title">
        <span className="title-pixel">SEA</span>
        <span className="title-divider">⚔</span>
        <span className="title-pixel">CLASH</span>
      </div>
      <div className="game-layout">
        <div className="game-boards">
          <Board />
        </div>
        <HUD />
      </div>
    </div>
  );
};

export default App;
