import React from 'react';
import { useGameStore } from '../store/gameStore';
import type { UpgradeType } from '../game/types';
import { audioManager } from '../game/AudioManager';

interface UpgradePanelProps {
  shipId: string;
  onClose: () => void;
}

const upgrades: { type: UpgradeType; name: string; desc: string; icon: string }[] = [
  { type: 'speed', name: '引擎强化', desc: '移动速度 +15%', icon: '🚀' },
  { type: 'fireRate', name: '武器升级', desc: '射击速度 +20%', icon: '🔫' },
  { type: 'shield', name: '护盾强化', desc: '护盾耐久 +50%', icon: '🛡️' },
];

export const UpgradePanel: React.FC<UpgradePanelProps> = ({ shipId, onClose }) => {
  const ship = useGameStore((s) => s.ships.find((sh) => sh.id === shipId));
  const upgradeShip = useGameStore((s) => s.upgradeShip);
  const playerIdx = useGameStore((s) => s.ships.findIndex((sh) => sh.id === shipId));
  const player = useGameStore((s) => s.players[playerIdx]);

  if (!ship || ship.minerals < 50) return null;

  const handleUpgrade = (type: UpgradeType) => {
    upgradeShip(shipId, type);
    audioManager.playUpgrade();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: '#1A1D2E',
          borderRadius: 16,
          padding: 32,
          minWidth: 480,
          boxShadow: `0 0 40px ${player?.color || '#F1C40F'}40, 0 8px 32px rgba(0,0,0,0.5)`,
          border: `2px solid ${player?.color || '#F1C40F'}`,
        }}
      >
        <h2
          style={{
            color: '#F1C40F',
            textAlign: 'center',
            marginBottom: 8,
            fontSize: 28,
            fontWeight: 'bold',
            textShadow: '0 0 20px rgba(241,196,15,0.5)',
            fontFamily: "'Courier New', monospace",
          }}
        >
          ✨ 升级可用 ✨
        </h2>
        <p style={{ color: '#aaa', textAlign: 'center', marginBottom: 24, fontFamily: "'Courier New', monospace" }}>
          {player?.name} - 矿物储量: <span style={{ color: '#F1C40F', fontWeight: 'bold' }}>{ship.minerals}</span>
          {' / 消耗: '}
          <span style={{ color: '#E74C3C', fontWeight: 'bold' }}>50</span>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {upgrades.map((u) => (
            <button
              key={u.type}
              onClick={() => handleUpgrade(u.type)}
              style={{
                background: '#0B0E1A',
                border: `2px solid ${player?.color || '#F1C40F'}60`,
                borderRadius: 12,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#eee',
                fontFamily: "'Courier New', monospace",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#252840';
                e.currentTarget.style.borderColor = player?.color || '#F1C40F';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 20px ${player?.color || '#F1C40F'}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#0B0E1A';
                e.currentTarget.style.borderColor = `${player?.color || '#F1C40F'}60`;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>{u.icon}</div>
              <div style={{ fontWeight: 'bold', marginBottom: 6, color: player?.color || '#F1C40F', fontSize: 16 }}>
                {u.name}
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{u.desc}</div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: 24,
            padding: '12px 24px',
            background: '#333',
            border: '1px solid #555',
            borderRadius: 8,
            color: '#ccc',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: "'Courier New', monospace",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#333';
          }}
        >
          稍后再升级 (ESC)
        </button>
      </div>
    </div>
  );
};
