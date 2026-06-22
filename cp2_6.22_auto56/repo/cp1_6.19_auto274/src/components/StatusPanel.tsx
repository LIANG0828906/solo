import { motion } from 'framer-motion';
import { useGameStore } from '../store';

function StatusPanel() {
  const { player, currentLevel, monstersKilled, useItem, restartGame } = useGameStore();

  const hpPercent = (player.hp / player.maxHp) * 100;
  const expPercent = (player.exp / player.expToNext) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px',
        color: '#E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: 'fit-content',
        minWidth: '220px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: '#3498DB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(52, 152, 219, 0.5)',
          }}
        >
          勇
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#C9A96E' }}>
          Lv.{player.level}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span>生命值</span>
          <span>{player.hp}/{player.maxHp}</span>
        </div>
        <div
          style={{
            height: '12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              backgroundColor: '#E74C3C',
              borderRadius: '6px',
              boxShadow: '0 0 8px rgba(231, 76, 60, 0.5)',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span>经验值</span>
          <span>{player.exp}/{player.expToNext}</span>
        </div>
        <div
          style={{
            height: '8px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ width: `${expPercent}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              backgroundColor: '#9B59B6',
              borderRadius: '4px',
              boxShadow: '0 0 6px rgba(155, 89, 182, 0.5)',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>攻击力</span>
          <span style={{ color: '#E74C3C' }}>{player.attack}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>防御力</span>
          <span style={{ color: '#3498DB' }}>{player.defense}</span>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', color: '#C9A96E' }}>
          道具栏
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4].map((index) => {
            const item = player.inventory[index];
            return (
              <motion.div
                key={index}
                whileHover={item ? { scale: 1.1, filter: 'brightness(1.2)' } : {}}
                whileTap={item ? { scale: 0.95 } : {}}
                onClick={() => item && item.type !== 'key' && useItem(index)}
                style={{
                  width: 40,
                  height: 40,
                  border: '2px solid #FFD700',
                  borderRadius: '6px',
                  backgroundColor: item ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: item ? '#FFD700' : 'rgba(255,255,255,0.2)',
                  cursor: item && item.type !== 'key' ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                title={item ? `${item.name}${item.type !== 'key' ? ' (点击使用)' : ''}` : '空'}
              >
                {item ? item.icon : '·'}
                {item && item.type === 'key' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      fontSize: '8px',
                      backgroundColor: '#FFD700',
                      color: '#000',
                      borderRadius: '3px',
                      padding: '1px 3px',
                    }}
                  >
                    钥
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        <p style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>
          点击道具使用（钥匙自动用于特殊宝箱）
        </p>
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: '13px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>当前关卡</span>
          <span style={{ color: '#C9A96E', fontWeight: 'bold' }}>第 {currentLevel} 层</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>已击杀怪物</span>
          <span style={{ color: '#E74C3C', fontWeight: 'bold' }}>{monstersKilled} 只</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.03, filter: 'brightness(1.2)' }}
        whileTap={{ scale: 0.97 }}
        onClick={restartGame}
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          padding: '10px 20px',
          backgroundColor: '#7F8C8D',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 50,
        }}
      >
        重新开始
      </motion.button>
    </motion.div>
  );
}

export default StatusPanel;
