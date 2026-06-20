import React, { useEffect, useState } from 'react';
import type { Pet, GiftItem, GiftType } from '../types';
import PetSprite from './PetSprite';
import { petApi } from '../api';
import { sfx } from '../utils/audio';
import { breedDisplayName, levelBadgeColor } from '../utils/helpers';

interface Props {
  open: boolean;
  pet: Pet | null;
  onClose: () => void;
  onSendGift: (toPetId: string, type: GiftType) => Promise<{ ok: boolean; expGain?: number }>;
  currentPetId?: string;
}

export const PetDetailModal: React.FC<Props> = ({ open, pet, onClose, onSendGift, currentPetId }) => {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [busy, setBusy] = useState<GiftType | null>(null);
  const [toast, setToast] = useState<string>('');
  useEffect(() => {
    if (open) petApi.getGifts().then(setGifts);
  }, [open]);
  if (!open || !pet) return null;
  const badgeCol = levelBadgeColor(pet.level);
  const isSelf = currentPetId === pet.id;
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      zIndex: 9000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div className="cartoon-card" style={{
        maxWidth: 380, width: '100%', position: 'relative',
        animation: 'levelup-badge 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { sfx.click(); onClose(); }}
          style={{
            position: 'absolute', top: 10, right: 14,
            width: 32, height: 32, borderRadius: '50%',
            background: '#FFCCBC', color: '#BF360C',
            fontWeight: 900, fontSize: 16,
          }}>✕</button>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 8px' }}>
          <PetSprite pet={pet} size={160} />
        </div>
        <h3 style={{ textAlign: 'center', color: '#FF6B35', fontSize: 22 }}>{pet.name}</h3>
        <div style={{ textAlign: 'center', marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 999,
            background: `linear-gradient(135deg, ${badgeCol.shine}, ${badgeCol.fill})`,
            color: '#5D4037', fontWeight: 800, fontSize: 12,
            border: `1.5px solid ${badgeCol.stroke}`,
          }}>⭐ Lv.{pet.level}</span>
          <span style={{ fontSize: 13, color: '#6D4C41', fontWeight: 600 }}>
            {breedDisplayName(pet.species, pet.breed)}
          </span>
        </div>
        <div style={{
          marginTop: 14, padding: 12,
          background: 'linear-gradient(135deg,#FFF8E1,#FFECB3)',
          borderRadius: 14, border: '2px dashed #FFB74D',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 13 }}>
            <span style={{ color: '#8D6E63' }}>🏠 主人</span>
            <span style={{ fontWeight: 700, color: '#5D4037' }}>{pet.ownerName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 13 }}>
            <span style={{ color: '#8D6E63' }}>🍗 饥饿</span>
            <span style={{ fontWeight: 700, color: '#E64A19' }}>{Math.round(pet.hunger)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 13 }}>
            <span style={{ color: '#8D6E63' }}>😊 快乐</span>
            <span style={{ fontWeight: 700, color: '#1976D2' }}>{Math.round(pet.happiness)}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: 13 }}>
            <span style={{ color: '#8D6E63' }}>🛁 清洁</span>
            <span style={{ fontWeight: 700, color: '#8E24AA' }}>{Math.round(pet.cleanliness)}%</span>
          </div>
        </div>
        {!isSelf && (
          <>
            <h4 style={{ marginTop: 16, marginBottom: 10, color: '#5D4037', fontSize: 15 }}>
              🎁 赠送礼物
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {gifts.map(g => (
                <button
                  key={g.type}
                  disabled={busy !== null}
                  onClick={async () => {
                    setBusy(g.type);
                    sfx.gift();
                    const r = await onSendGift(pet.id, g.type);
                    if (r.ok) {
                      setToast(`🎁 送出${g.name}! +${r.expGain ?? 0}经验`);
                      setTimeout(() => setToast(''), 1800);
                    }
                    setTimeout(() => setBusy(null), 600);
                  }}
                  style={{
                    padding: 10, borderRadius: 14,
                    background: busy === g.type ? '#FFE082' : 'linear-gradient(135deg,#F3E5F5,#CE93D8)',
                    border: '2px solid #CE93D8',
                    transition: 'var(--transition-fast)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
                >
                  <span style={{ fontSize: 28 }}>{g.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#4A148C' }}>{g.name}</span>
                  <span style={{ fontSize: 10, color: '#7B1FA2' }}>+{g.expReward}经验</span>
                </button>
              ))}
            </div>
          </>
        )}
        {isSelf && (
          <div style={{ marginTop: 16, textAlign: 'center', padding: 10, background: '#E1F5FE', borderRadius: 12, color: '#01579B', fontWeight: 600 }}>
            🐾 这是你的宠物哦~
          </div>
        )}
        {toast && (
          <div style={{
            position: 'absolute', left: '50%', bottom: -10, transform: 'translate(-50%, 100%)',
            background: 'linear-gradient(135deg,#FFE082,#FFB74D)', color: '#5D4037',
            padding: '8px 16px', borderRadius: 999, fontWeight: 800,
            boxShadow: '0 6px 18px rgba(255,152,0,0.35)',
            animation: 'levelup-badge 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>{toast}</div>
        )}
      </div>
    </div>
  );
};

export default PetDetailModal;
