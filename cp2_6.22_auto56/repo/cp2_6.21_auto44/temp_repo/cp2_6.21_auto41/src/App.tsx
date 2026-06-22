import GameCanvas from './components/GameCanvas';
import ResourcePanel from './components/ResourcePanel';
import StatsPanel from './components/StatsPanel';
import EventNotification from './components/EventNotification';
import { useGameLoop } from './hooks/useGameLoop';
import './App.css';

function App() {
  useGameLoop();

  return (
    <div className="game-container">
      <div className="game-main">
        <header className="game-header">
          <h1 className="game-title">🏙️ 像素城市</h1>
          <p className="game-subtitle">建造你的梦想之城</p>
        </header>
        
        <ResourcePanel />
        <GameCanvas />
      </div>
      
      <StatsPanel />
      <EventNotification />
    </div>
  );
}

export default App;
