import { useEffect } from 'react';
import Map from './Map';
import Controls from './Controls';
import { useSimulationStore } from './store';
import './App.css';

export default function App() {
  const { simulation, isRunning, speed, init, toggleRunning, reset, setSpeed } = useSimulationStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-icon">🚦</span>
          生态城市交通流量模拟器
        </h1>
        <p className="app-subtitle">可视化城市交通规划 · 实时拥堵分析</p>
      </header>

      <main className="app-main">
        <div className="map-wrapper">
          <Map simulation={simulation} />
        </div>
        <aside className="controls-wrapper">
          <Controls
            simulation={simulation}
            isRunning={isRunning}
            speed={speed}
            onToggleRunning={toggleRunning}
            onReset={reset}
            onSpeedChange={setSpeed}
          />
        </aside>
      </main>
    </div>
  );
}
