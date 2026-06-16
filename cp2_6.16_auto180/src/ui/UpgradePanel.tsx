import React from 'react';
import { useGameStore } from '../store/GameStore';

interface UpgradePanelProps {
  moveSpeedLevel: number;
  basketLevel: number;
  shieldLevel: number;
  speed: number;
  basketCapacity: number;
  maxShield: number;
  onUpgrade: (type: 'speed' | 'basket' | 'shield') => void;
}

const UPGRADE_CONFIGS = {
  speed: { label: '移动速度', color: '#00FFFF', maxLevel: 4, unit: 'px/帧' },
  basket: { label: '收集篮容量', color: '#9B59B6', maxLevel: 6, unit: '格' },
  shield: { label: '护盾强度', color: '#E74C3C', maxLevel: 10, unit: '点' },
};

function getCost(currentLevel: number): number {
  return 100 + currentLevel * 50;
}

export const UpgradePanel: React.FC<UpgradePanelProps> = ({
  moveSpeedLevel, basketLevel, shieldLevel,
  speed, basketCapacity, maxShield,
  onUpgrade,
}) => {
  const { score, isUpgradeOpen, setUpgradeOpen } = useGameStore();

  if (!isUpgradeOpen) return null;

  const upgrades = [
    {
      type: 'speed' as const,
      level: moveSpeedLevel,
      current: `${speed.toFixed(1)} ${UPGRADE_CONFIGS.speed.unit}`,
      maxReached: speed >= 4,
    },
    {
      type: 'basket' as const,
      level: basketLevel,
      current: `${basketCapacity} ${UPGRADE_CONFIGS.basket.unit}`,
      maxReached: basketCapacity >= 20,
    },
    {
      type: 'shield' as const,
      level: shieldLevel,
      current: `${maxShield} ${UPGRADE_CONFIGS.shield.unit}`,
      maxReached: maxShield >= 300,
    },
  ];

  return (
    <div
      onClick={() => setUpgradeOpen(false)}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 128, 0.8)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0B3D91, #1a1a5e)',
          borderRadius: 20, padding: 24, minWidth: 320,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'scaleIn 0.4s ease-out',
          transformOrigin: 'center',
        }}
      >
        <h2 style={{
          color: '#FFFFFF', fontSize: 20, fontWeight: 700,
          fontFamily: 'Poppins, sans-serif', marginBottom: 16, textAlign: 'center',
        }}>
          设备升级
        </h2>

        <div style={{ color: '#FFD700', fontSize: 16, textAlign: 'center', marginBottom: 16, fontFamily: 'Poppins, sans-serif' }}>
          积分: {score}
        </div>

        {upgrades.map((u) => {
          const config = UPGRADE_CONFIGS[u.type];
          const cost = getCost(u.level);
          const canAfford = score >= cost && !u.maxReached;

          return (
            <div key={u.type} style={{
              marginBottom: 16, padding: 12,
              background: 'rgba(0,0,0,0.3)', borderRadius: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: config.color, fontSize: 14, fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>
                  {config.label}
                </span>
                <span style={{ color: '#AAAAAA', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}>
                  {u.current}
                </span>
              </div>

              <div style={{
                width: '100%', height: 8, background: 'rgba(0,0,0,0.3)',
                borderRadius: 4, overflow: 'hidden', marginBottom: 8,
              }}>
                <div style={{
                  width: `${(u.level / 10) * 100}%`, height: '100%',
                  background: config.color, borderRadius: 4,
                  transition: 'width 0.3s ease-out',
                }} />
              </div>

              {!u.maxReached ? (
                <button
                  onClick={() => canAfford && onUpgrade(u.type)}
                  style={{
                    width: '100%', padding: '6px 0', border: 'none', borderRadius: 6,
                    background: canAfford ? config.color : '#555555',
                    color: canAfford ? '#000000' : '#999999',
                    fontSize: 13, fontWeight: 600, cursor: canAfford ? 'pointer' : 'not-allowed',
                    fontFamily: 'Poppins, sans-serif',
                    transition: 'transform 0.1s, background 0.2s',
                  }}
                  onMouseDown={(e) => { if (canAfford) (e.target as HTMLElement).style.transform = 'scale(0.95)'; }}
                  onMouseUp={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  升级 ({cost} 积分)
                </button>
              ) : (
                <div style={{ textAlign: 'center', color: '#888888', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}>
                  已满级
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={() => setUpgradeOpen(false)}
          style={{
            width: '100%', padding: '8px 0', border: 'none', borderRadius: 8,
            background: '#444444', color: '#FFFFFF', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Poppins, sans-serif', marginTop: 8,
            transition: 'transform 0.1s',
          }}
          onMouseDown={(e) => { (e.target as HTMLElement).style.transform = 'scale(0.95)'; }}
          onMouseUp={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
        >
          关闭
        </button>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0.5; }
          to { transform: scale(1.0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default UpgradePanel;
