import React, { useState } from 'react';
import { useGameStore } from './store/gameStore';
import GameCanvas from './modules/ui/GameCanvas';
import { CRYSTAL_CARDS, UPGRADE_COSTS, formatResources, formatWaveInfo, getUpgradeOptions } from './modules/ui/UIManager';
import type { CrystalType, Crystal } from './store/gameStore';

const App: React.FC = () => {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const resources = useGameStore((s) => s.resources);
  const waveInfo = useGameStore((s) => s.waveInfo);
  const selectedCrystalType = useGameStore((s) => s.selectedCrystalType);
  const setSelectedCrystalType = useGameStore((s) => s.setSelectedCrystalType);
  const upgradeCrystal = useGameStore((s) => s.upgradeCrystal);
  const resetGame = useGameStore((s) => s.resetGame);
  const killsTotal = useGameStore((s) => s.killsTotal);
  const escapedTotal = useGameStore((s) => s.escapedTotal);
  const crystalsPlaced = useGameStore((s) => s.crystalsPlaced);
  const crystalsUpgraded = useGameStore((s) => s.crystalsUpgraded);
  const crystals = useGameStore((s) => s.crystals);

  const [selectedCrystal, setSelectedCrystal] = useState<Crystal | null>(null);
  const [hoveredCard, setHoveredCard] = useState<CrystalType | null>(null);

  const handleCrystalSelect = (type: CrystalType) => {
    if (selectedCrystalType === type) {
      setSelectedCrystalType(null);
    } else {
      setSelectedCrystalType(type);
      setSelectedCrystal(null);
    }
  };

  const handleUpgrade = (crystalId: string, upgradeType: 'frequency' | 'radius') => {
    upgradeCrystal(crystalId, upgradeType);
  };

  const isGameOver = gamePhase === 'won' || gamePhase === 'lost';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0B0F19',
        color: '#F1F2F6',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 48,
          background: '#1A1D23',
          borderRadius: 8,
          margin: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#F1F2F6',
          }}
        >
          {formatResources(resources)}
        </span>
        <span style={{ fontSize: 14, color: '#8B8FA3' }}>
          {formatWaveInfo(useGameStore.getState())}
        </span>
        <span style={{ fontSize: 14, color: '#8B8FA3' }}>
          逃逸: {escapedTotal}/20
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 12,
            width: 240,
            zIndex: 10,
            background: 'rgba(30,33,45,0.9)',
            borderRadius: 12,
            border: '1px solid #3D4354',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#F1F2F6', marginBottom: 4 }}>
            共鸣水晶
          </div>
          {CRYSTAL_CARDS.map((card) => {
            const isSelected = selectedCrystalType === card.type;
            const isHovered = hoveredCard === card.type;
            const canBuy = resources >= card.cost;

            return (
              <div
                key={card.type}
                onClick={() => handleCrystalSelect(card.type)}
                onMouseEnter={() => setHoveredCard(card.type)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  padding: 12,
                  cursor: canBuy ? 'pointer' : 'not-allowed',
                  border: isSelected ? `1px solid ${card.color}` : '1px solid transparent',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: isHovered
                    ? `0 4px 12px rgba(0,0,0,0.4)`
                    : '0 1px 3px rgba(0,0,0,0.2)',
                  opacity: canBuy ? 1 : 0.5,
                  transition: 'all 0.2s ease-out',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 20, color: card.color }}>{card.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 'bold', color: '#F1F2F6' }}>
                    {card.name}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 13,
                      color: card.color,
                      fontWeight: 'bold',
                    }}
                  >
                    {card.cost}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#8B8FA3', lineHeight: 1.4 }}>
                  {card.frequency}Hz · {card.bonusText}
                </div>
              </div>
            );
          })}

          {selectedCrystal && (
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 8,
                padding: 12,
                border: '1px solid #3D4354',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#F1F2F6', marginBottom: 8 }}>
                升级水晶
              </div>
              {getUpgradeOptions().map((opt) => {
                const cost = selectedCrystal.type === 'high' ? 60 : 30;
                const canUp = resources >= cost;
                return (
                  <div
                    key={opt.type}
                    onClick={() => {
                      if (canUp) {
                        handleUpgrade(selectedCrystal.id, opt.type);
                        setSelectedCrystal(null);
                      }
                    }}
                    style={{
                      fontSize: 12,
                      color: canUp ? '#F1F2F6' : '#5A5E6B',
                      cursor: canUp ? 'pointer' : 'not-allowed',
                      padding: '6px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'transform 0.2s ease-out',
                    }}
                    onMouseDown={(e) => {
                      const el = e.currentTarget;
                      el.style.transform = 'scale(0.95)';
                      setTimeout(() => {
                        el.style.transform = 'scale(1)';
                      }, 150);
                    }}
                  >
                    {opt.label} · {cost}资源
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ fontSize: 11, color: '#5A5E6B', marginTop: 4 }}>
            点击网格放置水晶<br />
            点击已有水晶可升级
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 800,
            position: 'relative',
          }}
        >
          <GameCanvas />
        </div>
      </div>

      {isGameOver && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: 'rgba(30,33,45,0.95)',
              borderRadius: 16,
              border: '1px solid #3D4354',
              padding: 32,
              minWidth: 360,
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: gamePhase === 'won' ? '#4CAF50' : '#F44336',
                marginBottom: 20,
              }}
            >
              {gamePhase === 'won' ? '防御成功！' : '防线崩溃！'}
            </h2>
            <div style={{ fontSize: 16, color: '#8B8FA3', lineHeight: 2 }}>
              <div>消灭怪物: <span style={{ color: '#F1F2F6' }}>{killsTotal}</span></div>
              <div>放置水晶: <span style={{ color: '#F1F2F6' }}>{crystalsPlaced}</span></div>
              <div>升级水晶: <span style={{ color: '#F1F2F6' }}>{crystalsUpgraded}</span></div>
              <div>最终资源: <span style={{ color: '#F1F2F6' }}>{resources}</span></div>
              <div>逃逸怪物: <span style={{ color: '#F1F2F6' }}>{escapedTotal}</span></div>
            </div>
            <button
              onClick={resetGame}
              style={{
                marginTop: 24,
                padding: '12px 36px',
                fontSize: 16,
                fontWeight: 'bold',
                color: '#F1F2F6',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid #3D4354',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              重新开始
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
