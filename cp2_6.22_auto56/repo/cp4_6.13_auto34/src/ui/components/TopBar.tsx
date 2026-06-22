import React, { useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { shipRepair } from '../../modules/ship/ShipRepair';

const TopBar: React.FC = () => {
  const gameView = useGameStore((s) => s.gameView);
  const engineStarted = useGameStore((s) => s.engineStarted);

  const handleToggleView = useCallback(() => {
    if (gameView === 'map') {
      shipRepair.enterDivingMode();
    } else {
      shipRepair.returnToMap();
    }
  }, [gameView]);

  const handleNewGame = useCallback(() => {
    if (confirm('确定要重新开始游戏吗？当前进度将丢失。')) {
      window.location.reload();
    }
  }, []);

  return (
    <div
      className="glass-panel px-6 py-3"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0d3b66, #1e3a5f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            border: '1px solid rgba(100, 255, 218, 0.3)',
            boxShadow: '0 0 12px rgba(100, 255, 218, 0.2)',
          }}
        >
          🌊
        </div>
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#64ffda',
              letterSpacing: 0.5,
            }}
          >
            深海探索 · Deep Sea Explorer
          </h1>
          <p
            style={{
              fontSize: 11,
              color: '#5a6a85',
              marginTop: 2,
            }}
          >
            搜索沉船残骸 · 修复废弃潜水艇 · 征服深海沟
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className="btn"
          onClick={handleToggleView}
          disabled={!engineStarted && gameView === 'map'}
          style={{ padding: '6px 16px', fontSize: 13 }}
        >
          {gameView === 'map' ? '🚤 下潜视图' : '🗺️ 地图视图'}
        </button>
        <button
          className="btn btn-danger"
          onClick={handleNewGame}
          style={{ padding: '6px 16px', fontSize: 13 }}
        >
          🔄 新游戏
        </button>
      </div>
    </div>
  );
};

export default TopBar;
