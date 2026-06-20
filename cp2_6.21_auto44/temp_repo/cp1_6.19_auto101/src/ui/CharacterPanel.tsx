import React, { useState, useEffect } from 'react';
import { useGameContext } from '@/context/GameContext';
import { FaHeart, FaShieldAlt, FaSword } from 'react-icons/fa';
import { GiSwordman, GiPointySword, GiCrossbow } from 'react-icons/gi';
import { motion } from 'framer-motion';

const CLASS_ICONS: Record<string, string> = {
  warrior: '⚔️',
  mage: '🔮',
  rogue: '🗡️',
};

const CLASS_NAMES: Record<string, string> = {
  warrior: '战士',
  mage: '法师',
  rogue: '盗贼',
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function CharacterPanel() {
  const { character } = useGameContext();
  const isMobile = useIsMobile();

  if (!character) return null;

  const hpPercent = character.getHpPercent();
  const hpColor = hpPercent > 50 ? '#4CAF50' : hpPercent > 30 ? '#FF9800' : '#F44336';

  const containerStyle: React.CSSProperties = isMobile
    ? { width: '100%', height: 200, background: '#3E2723', border: '2px solid #FFD700', borderRadius: 8, padding: 16, color: '#FFF3E0', fontFamily: 'Crimson Text, serif', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 }
    : { width: 280, background: '#3E2723', border: '2px solid #FFD700', borderRadius: 8, padding: 16, color: '#FFF3E0', fontFamily: 'Crimson Text, serif' };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: isMobile ? 0 : 16 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid #FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 8 }}>
          {CLASS_ICONS[character.className]}
        </div>
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: 20, fontWeight: 700 }}>
          {CLASS_NAMES[character.className]}
        </div>
      </div>

      <div style={{ marginBottom: isMobile ? 0 : 12, flex: isMobile ? 1 : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <FaHeart style={{ color: '#F44336', marginRight: 6 }} />
          <span>生命值</span>
          <span style={{ marginLeft: 'auto' }}>{character.hp}/{character.maxHp}</span>
        </div>
        <motion.div
          style={{ width: '100%', height: 12, borderRadius: 6, background: '#1A0E0A', overflow: 'hidden' }}
          animate={hpPercent <= 30 ? { x: [0, -4, 4, 0] } : {}}
          transition={hpPercent <= 30 ? { duration: 0.3, repeat: Infinity } : {}}
        >
          <div style={{ width: `${hpPercent}%`, height: '100%', borderRadius: 6, background: hpColor, transition: 'width 0.3s ease' }} />
        </motion.div>
      </div>

      <div style={{ marginBottom: isMobile ? 0 : 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #4E342E', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center' }}><GiPointySword style={{ marginRight: 6 }} />{!isMobile && '攻击'}</span>
          <span>{character.attack}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #4E342E', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center' }}><FaShieldAlt style={{ marginRight: 6 }} />{!isMobile && '防御'}</span>
          <span>{character.defense}</span>
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>装备</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #4E342E' }}>
          <span>⚔️ 武器</span>
          <span>{character.weapon || '无'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #4E342E' }}>
          <span>🛡️ 护甲</span>
          <span>{character.armor || '无'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
          <span>🧪 药水</span>
          <span>{character.potionCount}</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(CharacterPanel);
