import React from 'react';
import { useGameStore } from '../store/GameStore';
import { TrashType, TRASH_SCORES } from '../game/types';
import { WorldSnapshot } from '../game/World';

interface HUDProps {
  snapshot: WorldSnapshot | null;
}

export const HUD: React.FC<HUDProps> = ({ snapshot }) => {
  const { score, notifications, isUpgradeOpen, setUpgradeOpen } = useGameStore();

  if (!snapshot) return null;

  const shieldPct = (snapshot.playerShield / snapshot.playerMaxShield) * 100;
  const basketPct = (snapshot.playerCurrentItems.length / snapshot.playerBasketCapacity) * 100;
  const isHit = snapshot.playerHitTimer > 0;
  const shieldColor = isHit ? (Math.floor(Date.now() / 100) % 2 === 0 ? '#FF0000' : '#00FF00') : '#00FF00';

  return (
    <div style={{ position: 'relative', width: 640, height: 480, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: 8, left: 8,
        background: 'rgba(0,0,128,0.7)', borderRadius: 8, padding: '6px 12px',
      }}>
        <span style={{ color: '#FFD700', fontSize: 22, fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
          {score}
        </span>
      </div>

      <div style={{
        position: 'absolute', top: 8, right: 8,
        background: 'rgba(0,0,128,0.7)', borderRadius: 8, padding: '6px 12px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: '#ADD8E6', fontSize: 14, fontFamily: 'Poppins, sans-serif' }}>
          {snapshot.playerCurrentItems.length}/{snapshot.playerBasketCapacity}
        </span>
        <div style={{ width: 80, height: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            width: `${basketPct}%`, height: '100%',
            background: '#ADD8E6', borderRadius: 5,
            transition: 'width 0.2s ease-out',
          }} />
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        background: 'rgba(0,0,128,0.7)', borderRadius: 8, padding: '6px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: shieldColor, fontSize: 12, fontFamily: 'Poppins, sans-serif' }}>护盾</span>
          <div style={{ width: 100, height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              width: `${shieldPct}%`, height: '100%',
              background: shieldColor, borderRadius: 4,
              transition: 'width 0.15s ease-out',
            }} />
          </div>
          <span style={{ color: shieldColor, fontSize: 12, fontFamily: 'Poppins, sans-serif' }}>
            {Math.ceil(snapshot.playerShield)}
          </span>
        </div>
      </div>

      {notifications.map((n, i) => (
        <div key={n.id} style={{
          position: 'absolute', top: 50 + i * 24, left: '50%', transform: 'translateX(-50%)',
          color: n.color, fontSize: 16, fontWeight: 600, fontFamily: 'Poppins, sans-serif',
          opacity: Math.min(1, n.timer),
          textShadow: '0 0 4px rgba(0,0,0,0.5)',
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
        }}>
          {n.text}
        </div>
      ))}

      {snapshot.event && (
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          color: '#FF4444', fontSize: 20, fontWeight: 700, fontFamily: 'Poppins, sans-serif',
          textShadow: '0 0 8px rgba(255,0,0,0.5)',
          animation: 'pulse 0.5s ease-in-out infinite alternate',
        }}>
          {snapshot.event.name}
        </div>
      )}

      {snapshot.waterLevel > 0 && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(173, 216, 230, 0.8)', fontSize: 14, fontFamily: 'Poppins, sans-serif',
          pointerEvents: 'none',
        }}>
          水位层级: {snapshot.waterLevel}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 8, right: 8,
        background: 'rgba(0,0,128,0.7)', borderRadius: 8, padding: '6px 12px',
        display: 'flex', gap: 6, pointerEvents: 'auto',
      }}>
        <button
          onClick={() => setUpgradeOpen(true)}
          style={{
            background: '#FFA500', color: '#FFFFFF', border: 'none', borderRadius: 6,
            padding: '4px 10px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            transition: 'transform 0.1s',
          }}
          onMouseDown={(e) => { (e.target as HTMLElement).style.transform = 'scale(0.95)'; }}
          onMouseUp={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
        >
          升级
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default HUD;
