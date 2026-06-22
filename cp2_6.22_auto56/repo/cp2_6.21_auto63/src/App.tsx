import React from 'react';
import { GardenGrid } from './components/GardenGrid';
import { SeedPanel } from './components/SeedPanel';
import { ControlPanel } from './components/ControlPanel';

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #87CEEB 0%, #FFE4B5 50%, #F4D03F 100%)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: '36px',
          color: '#5D4037',
          textShadow: '2px 2px 4px rgba(255,255,255,0.5)',
          marginBottom: '20px',
          letterSpacing: '2px',
        }}
      >
        🌱 植物花园沙盒 🌻
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '30px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <SeedPanel />
        <GardenGrid />
        <ControlPanel />
      </div>

      <div
        style={{
          marginTop: '30px',
          backgroundColor: 'rgba(255,255,255,0.7)',
          borderRadius: '12px',
          padding: '16px 24px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <p style={{ color: '#5D4037', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
          🎮 <strong>游戏说明：</strong>
          从左侧种子栏拖拽种子到中间花园中种植，调整右侧环境参数影响植物生长。
          点击"下一回合"让植物生长，观察不同光照、水分和土壤对植物的影响！
        </p>
      </div>
    </div>
  );
};

export default App;
