import { PetInstance, RARITY_COLORS, RARITY_LABELS } from '@/data/petData';
import { useEffect, useRef } from 'react';

interface Props {
  pet: PetInstance;
  onClose: () => void;
}

export default function PetDetailCard({ pet, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const rarityColor = RARITY_COLORS[pet.rarity];

  const maxHp = 250;
  const maxAtk = 120;
  const maxSpd = 100;

  return (
    <div
      ref={cardRef}
      className="pet-detail-card"
      style={{
        width: 240,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 16,
        padding: 20,
        border: `1px solid ${rarityColor}44`,
        boxShadow: `0 0 20px ${rarityColor}22`,
        color: '#fff',
        position: 'fixed',
        top: '50%',
        left: 'calc(50% - 150px)',
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 8,
          right: 12,
          background: 'none',
          border: 'none',
          color: '#aaa',
          fontSize: 18,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: rarityColor,
            margin: '0 auto 8px',
            boxShadow: `0 0 12px ${rarityColor}88`,
          }}
        />
        <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Orbitron, sans-serif' }}>{pet.name}</h3>
        <span
          style={{
            display: 'inline-block',
            marginTop: 4,
            padding: '2px 10px',
            borderRadius: 10,
            fontSize: 12,
            background: `${rarityColor}33`,
            color: rarityColor,
            border: `1px solid ${rarityColor}55`,
          }}
        >
          {RARITY_LABELS[pet.rarity]}
        </span>
      </div>

      <div style={{ fontSize: 14, marginBottom: 6 }}>
        ⚔️ 战力: <span style={{ color: '#FFD700', fontWeight: 700 }}>{pet.power}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <StatBar label="生命" value={pet.hp} max={maxHp} color="#FF6B6B" />
        <StatBar label="攻击" value={pet.attack} max={maxAtk} color="#4ECDC4" />
        <StatBar label="速度" value={pet.speed} max={maxSpd} color="#FFE66D" />
      </div>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 32, fontSize: 12, color: '#ccc' }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: 12,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          className="stat-fill"
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 6,
            background: color,
            transition: 'width 0.3s ease-out',
          }}
        />
      </div>
      <span style={{ width: 30, fontSize: 11, color: '#aaa', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
