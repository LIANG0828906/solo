import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  TownArea,
  createEmptyGrid,
  addRandomAnimal,
  getMaxLevel,
  checkAreaUnlock,
  createInitialAreas,
  calculateTotalCoinPerCycle,
} from './utils';
import { GameBoard } from './GameBoard';
import { TownPanel } from './TownPanel';
import { CoinCounter } from './components/CoinCounter';

const App: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(() => {
    let initialGrid = createEmptyGrid();
    initialGrid = addRandomAnimal(initialGrid, 1);
    initialGrid = addRandomAnimal(initialGrid, 1);
    return initialGrid;
  });

  const [coins, setCoins] = useState(100);
  const [areas, setAreas] = useState<TownArea[]>(createInitialAreas());
  const [newlyUnlockedArea, setNewlyUnlockedArea] = useState<TownArea | null>(null);

  const handleMerge = useCallback((newGrid: Grid, newLevel: number) => {
    const gridWithNew = addRandomAnimal(newGrid, 1);
    setGrid(gridWithNew);

    const maxLevel = getMaxLevel(gridWithNew);
    const unlockResult = checkAreaUnlock(areas, maxLevel);
    
    if (unlockResult.unlocked) {
      setAreas(unlockResult.areas);
      setNewlyUnlockedArea(unlockResult.unlocked);
      
      setTimeout(() => {
        setNewlyUnlockedArea(null);
      }, 3000);
    }
  }, [areas]);

  const handleCoinsCollected = useCallback((amount: number) => {
    setCoins(prev => prev + amount);
  }, []);

  const handlePurchaseDecoration = useCallback((updatedAreas: TownArea[], cost: number) => {
    setAreas(updatedAreas);
    setCoins(prev => Math.max(0, prev - cost));
  }, []);

  const totalCoinPerCycle = calculateTotalCoinPerCycle(areas);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <header
        style={{
          width: '100%',
          maxWidth: '900px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(20px, 4vw, 28px)',
            color: '#333',
            margin: 0,
          }}
        >
          🏰 像素小镇
        </h1>
        <CoinCounter coins={coins} />
      </header>

      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            🎮 合成棋盘
          </div>
          <GameBoard grid={grid} onMerge={handleMerge} />
          <div
            style={{
              marginTop: '12px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#666',
            }}
          >
            点击或拖拽相邻的同级动物进行合并
          </div>
        </div>

        <div>
          <TownPanel
            areas={areas}
            coins={coins}
            onCoinsCollected={handleCoinsCollected}
            onPurchaseDecoration={handlePurchaseDecoration}
            newlyUnlockedArea={newlyUnlockedArea}
          />
          <div
            style={{
              marginTop: '12px',
              textAlign: 'center',
              fontSize: '13px',
              color: '#666',
            }}
          >
            每5秒总产出: +{totalCoinPerCycle} 💰
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
