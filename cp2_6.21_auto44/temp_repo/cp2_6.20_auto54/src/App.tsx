import React from 'react';
import { useGardenStore } from './store';
import { GardenGrid } from './components/GardenGrid';
import { PlantCard } from './components/PlantCard';

const App: React.FC = () => {
  const { grid } = useGardenStore();

  const allPlants = grid.flat().filter((cell) => cell.plant !== null).map((cell) => cell.plant!);

  return (
    <div className="app">
      <main className="main-content">
        <GardenGrid />
      </main>

      <footer className="bottom-bar">
        <div className="bottom-bar-header">
          <h2>🪴 我的植物</h2>
          <span className="plant-count">
            {allPlants.length} 株植物正在生长
          </span>
        </div>
        <div className="cards-container">
          {allPlants.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🌱</div>
              <div className="empty-text">花园里还没有植物，点击上方空格子开始种植吧！</div>
            </div>
          ) : (
            allPlants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))
          )}
        </div>
      </footer>

      <style>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #e8f4fd 0%, #fdf8f0 100%);
        }
        .main-content {
          flex: 1;
          padding-bottom: 24px;
        }
        .bottom-bar {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
          padding: 16px 24px 24px;
          padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
        }
        .bottom-bar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }
        .bottom-bar-header h2 {
          color: #5a8f4c;
          font-size: 20px;
          margin: 0;
        }
        .plant-count {
          font-size: 13px;
          color: #8b6f47;
          background: #f5e6a366;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 500;
        }
        .cards-container {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 8px 4px 4px;
          max-width: 1200px;
          margin: 0 auto;
          scrollbar-width: thin;
          scrollbar-color: #5a8f4c66 transparent;
        }
        .cards-container::-webkit-scrollbar {
          height: 6px;
        }
        .cards-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .cards-container::-webkit-scrollbar-thumb {
          background: #5a8f4c44;
          border-radius: 3px;
        }
        .cards-container::-webkit-scrollbar-thumb:hover {
          background: #5a8f4c66;
        }
        .empty-state {
          width: 100%;
          padding: 40px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .empty-icon {
          font-size: 48px;
          opacity: 0.6;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .empty-text {
          color: #8b6f47;
          font-size: 14px;
          max-width: 400px;
        }
      `}</style>
    </div>
  );
};

export default App;
