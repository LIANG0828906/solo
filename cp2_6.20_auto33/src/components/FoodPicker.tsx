import React, { useEffect, useState } from 'react';
import type { FoodItem, FoodType } from '../types';
import { petApi } from '../api';
import { sfx } from '../utils/audio';

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (type: FoodType) => Promise<void>;
  busy?: boolean;
}

export const FoodPicker: React.FC<Props> = ({ open, onClose, onPick, busy }) => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  useEffect(() => {
    if (open) petApi.getFoods().then(setFoods);
  }, [open]);

  if (!open) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 20, borderRadius: 28,
    }} onClick={onClose}>
      <div className="cartoon-card" style={{
        maxWidth: 420, width: '100%',
        animation: 'levelup-badge 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ textAlign: 'center', color: '#FF6B35', marginBottom: 16, fontSize: 22 }}>🍽️ 选择食物</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {foods.map(f => (
            <button
              key={f.type}
              disabled={busy}
              onClick={async () => {
                sfx.feed();
                await onPick(f.type);
                onClose();
              }}
              style={{
                padding: 14, borderRadius: 16, border: '3px solid #FFE0B2',
                background: 'linear-gradient(135deg,#FFF8E1,#FFECB3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                transition: 'var(--transition-mid)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(255,152,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <span style={{ fontSize: 36 }}>{f.icon}</span>
              <span style={{ fontWeight: 700, color: '#5D4037', fontSize: 15 }}>{f.name}</span>
              <div style={{ fontSize: 11, color: '#8D6E63', textAlign: 'center', lineHeight: 1.5 }}>
                🍗+{f.hungerEffect}<br />😊+{f.happinessEffect}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => { sfx.click(); onClose(); }}
          style={{
            marginTop: 16, width: '100%', padding: '10px',
            borderRadius: 12, background: '#FFCCBC', color: '#BF360C',
            fontWeight: 700, fontSize: 14,
          }}
        >取消</button>
      </div>
    </div>
  );
};

export default FoodPicker;
