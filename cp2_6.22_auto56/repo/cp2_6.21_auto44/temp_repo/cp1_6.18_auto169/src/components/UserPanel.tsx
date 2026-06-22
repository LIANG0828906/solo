import { useUserStore } from '@/stores/userStore';
import { RARITY_COLORS, RARITY_LABELS, PetInstance } from '@/data/petData';
import { Sparkles, Swords } from 'lucide-react';

interface Props {
  onOpenBlindBox: () => void;
  onBattle: () => void;
  selectedPet: PetInstance | null;
}

export default function UserPanel({ onOpenBlindBox, onBattle, selectedPet }: Props) {
  const { nickname, avatar, points } = useUserStore();

  return (
    <div
      className="user-panel"
      style={{
        width: 300,
        height: '100vh',
        background: '#1E1E2E',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        overflow: 'auto',
      }}
    >
      <div style={{ textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            fontSize: 28,
          }}
        >
          {avatar}
        </div>
        <div style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 600, fontFamily: 'Orbitron, sans-serif' }}>
          {nickname}
        </div>
        <div
          style={{
            color: '#FFD700',
            fontSize: 24,
            fontWeight: 700,
            marginTop: 4,
            textShadow: '0 0 8px rgba(255,215,0,0.5)',
            fontFamily: 'Orbitron, sans-serif',
          }}
        >
          💰 {points}
        </div>
      </div>

      {selectedPet && (
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 16,
            border: `1px solid ${RARITY_COLORS[selectedPet.rarity]}33`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: RARITY_COLORS[selectedPet.rarity],
                boxShadow: `0 0 10px ${RARITY_COLORS[selectedPet.rarity]}66`,
              }}
            />
            <div>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{selectedPet.name}</div>
              <span
                style={{
                  fontSize: 11,
                  padding: '1px 8px',
                  borderRadius: 8,
                  background: `${RARITY_COLORS[selectedPet.rarity]}22`,
                  color: RARITY_COLORS[selectedPet.rarity],
                }}
              >
                {RARITY_LABELS[selectedPet.rarity]}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PanelStatBar label="生命" value={selectedPet.hp} max={250} color="#FF6B6B" />
            <PanelStatBar label="攻击" value={selectedPet.attack} max={120} color="#4ECDC4" />
            <PanelStatBar label="速度" value={selectedPet.speed} max={100} color="#FFE66D" />
          </div>

          <div style={{ marginTop: 8, fontSize: 13, color: '#aaa' }}>
            ⚔️ 战力: <span style={{ color: '#FFD700', fontWeight: 700 }}>{selectedPet.power}</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={onOpenBlindBox}
          className="btn-blindbox"
          style={{
            width: '100%',
            height: 40,
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'box-shadow 0.2s, transform 0.1s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px rgba(102,126,234,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Sparkles size={16} /> 开盲盒
        </button>

        <button
          onClick={onBattle}
          className="btn-battle"
          disabled={!selectedPet}
          style={{
            width: '100%',
            height: 40,
            borderRadius: 8,
            border: 'none',
            background: selectedPet
              ? 'linear-gradient(135deg, #f093fb, #f5576c)'
              : 'linear-gradient(135deg, #555, #444)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: selectedPet ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: selectedPet ? 1 : 0.5,
            transition: 'box-shadow 0.2s, transform 0.1s',
          }}
          onMouseEnter={(e) => {
            if (selectedPet) e.currentTarget.style.boxShadow = '0 0 20px rgba(245,87,108,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            if (selectedPet) e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Swords size={16} /> 对战
        </button>

        <div style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>
          开盲盒消耗 100 积分 | 对战胜利获得 50 积分
        </div>
      </div>
    </div>
  );
}

function PanelStatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 28, fontSize: 11, color: '#999' }}>{label}</span>
      <div
        style={{
          flex: 1,
          height: 12,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.08)',
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
      <span style={{ width: 26, fontSize: 11, color: '#888', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
