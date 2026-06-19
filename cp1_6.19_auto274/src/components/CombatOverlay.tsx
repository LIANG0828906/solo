import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store';

function AnimatedNumber({ value, color }: { value: number; color: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      style={{ color, fontWeight: 'bold' }}
    >
      {value}
    </motion.span>
  );
}

function CombatOverlay() {
  const {
    isInCombat,
    currentMonster,
    player,
    combatResult,
    attack,
    flee,
    closeCombat,
    lastDamagePlayer,
    lastDamageMonster,
    lastExpGain,
    combatLog,
  } = useGameStore();

  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (combatResult) {
      setShowResult(true);
      const timer = setTimeout(() => {
        setShowResult(false);
        if (combatResult === 'win' || combatResult === 'flee') {
          closeCombat();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [combatResult, closeCombat]);

  if (!isInCombat || !currentMonster) return null;

  const monsterHpPercent = (currentMonster.hp / currentMonster.maxHp) * 100;
  const playerHpPercent = (player.hp / player.maxHp) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <motion.div
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{
            backgroundColor: '#2C3E50',
            borderRadius: '16px',
            padding: '32px',
            minWidth: '400px',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <h2 style={{ color: '#C9A96E', textAlign: 'center', marginBottom: '24px', fontSize: '24px' }}>
            ⚔️ 战斗！
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <motion.div
                animate={lastDamageMonster > 0 ? { x: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  backgroundColor: '#E74C3C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#fff',
                  boxShadow: '0 4px 15px rgba(231, 76, 60, 0.5)',
                }}
              >
                {currentMonster.name.charAt(0)}
              </motion.div>
              <span style={{ color: '#E0E0E0', fontWeight: 'bold', fontSize: '14px' }}>
                {currentMonster.name}
              </span>
              <div style={{ width: '100%', textAlign: 'center' }}>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${monsterHpPercent}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%', backgroundColor: '#E74C3C' }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  HP: {currentMonster.hp}/{currentMonster.maxHp}
                </div>
              </div>
              {lastDamageMonster > 0 && combatResult !== 'win' && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  style={{ color: '#FFD700', fontWeight: 'bold', fontSize: '18px' }}
                >
                  -{lastDamageMonster}
                </motion.div>
              )}
            </div>

            <div style={{ color: '#C9A96E', fontSize: '28px', fontWeight: 'bold' }}>
              VS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <motion.div
                animate={lastDamagePlayer > 0 ? { x: [0, 10, -10, 5, -5, 0], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
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
              </motion.div>
              <span style={{ color: '#E0E0E0', fontWeight: 'bold', fontSize: '14px' }}>
                勇者 Lv.{player.level}
              </span>
              <div style={{ width: '100%', textAlign: 'center' }}>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${playerHpPercent}%` }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%', backgroundColor: '#2ECC71' }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  HP: {player.hp}/{player.maxHp}
                </div>
              </div>
              {lastDamagePlayer > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  style={{ color: '#E74C3C', fontWeight: 'bold', fontSize: '18px' }}
                >
                  -{lastDamagePlayer}
                </motion.div>
              )}
              {lastExpGain > 0 && combatResult === 'win' && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{ color: '#9B59B6', fontWeight: 'bold', fontSize: '14px' }}
                >
                  +{lastExpGain} EXP
                </motion.div>
              )}
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              maxHeight: '100px',
              overflowY: 'auto',
              fontSize: '13px',
              color: '#B0B0B0',
            }}
          >
            {combatLog.slice(-5).map((log, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                {log}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {!combatResult ? (
              <motion.div
                key="buttons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
              >
                <motion.button
                  whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={attack}
                  style={{
                    padding: '14px 40px',
                    backgroundColor: '#C0392B',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(192, 57, 43, 0.4)',
                  }}
                >
                  ⚔️ 攻击
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, filter: 'brightness(1.2)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={flee}
                  style={{
                    padding: '14px 40px',
                    backgroundColor: '#7F8C8D',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(127, 140, 141, 0.4)',
                  }}
                >
                  🏃 逃跑
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{ textAlign: 'center' }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: combatResult === 'win' ? '#2ECC71' : combatResult === 'flee' ? '#F39C12' : '#E74C3C',
                    marginBottom: '8px',
                  }}
                >
                  {combatResult === 'win' && '🏆 胜利！'}
                  {combatResult === 'flee' && '💨 逃跑成功！'}
                  {combatResult === 'lose' && '💀 失败...'}
                </motion.div>
                {combatResult === 'lose' && (
                  <p style={{ color: '#888', fontSize: '14px' }}>游戏结束</p>
                )}
                {combatResult !== 'lose' && (
                  <p style={{ color: '#888', fontSize: '12px' }}>即将关闭...</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CombatOverlay;
