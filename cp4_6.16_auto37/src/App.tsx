import React, { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import InventoryGrid from './components/InventoryGrid';
import CraftingTable from './components/CraftingTable';
import ResourceCollector from './components/ResourceCollector';
import ItemGallery from './components/ItemGallery';
import AchievementNotification from './components/AchievementNotification';

const App: React.FC = () => {
  const { initGame } = useGameStore();
  
  useEffect(() => {
    initGame();
  }, [initGame]);
  
  return (
    <div className="app-container">
      <AchievementNotification />
      
      <header className="app-header">
        <h1>⚒️ PuzzleForge ⚒️</h1>
        <p style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          像素风合成与锻造游戏
        </p>
      </header>
      
      <div className="game-main">
        <InventoryGrid />
        <CraftingTable />
      </div>
      
      <ResourceCollector />
      
      <ItemGallery />
    </div>
  );
};

export default App;
