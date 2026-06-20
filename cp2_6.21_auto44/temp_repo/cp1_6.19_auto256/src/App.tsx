import React from 'react';
import GameBoard from './GameBoard';
import ToolPanel from './ToolPanel';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">⛏️ 地底矿车轨道铺设模拟器</h1>
      </header>
      <div className="app-body">
        <ToolPanel />
        <main className="app-main">
          <GameBoard />
        </main>
      </div>
    </div>
  );
};

export default App;
