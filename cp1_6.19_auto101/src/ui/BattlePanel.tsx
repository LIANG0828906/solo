import { useState, useEffect, useCallback } from 'react';
import { useGameContext } from '@/context/GameContext';
import { BattleSimulator } from '@/combat/BattleSimulator';
import { Character } from '@/combat/Character';
import type { BattleFrame } from '@/combat/types';
import { motion, AnimatePresence } from 'framer-motion';
import { GiSwordWound, GiRunningNinja } from 'react-icons/gi';
import { FaHeart, FaSkull } from 'react-icons/fa';

const classEmojis: Record<string, string> = {
  warrior: '⚔️',
  mage: '🔮',
  rogue: '🗡️',
};

function getHpColor(percent: number): string {
  if (percent > 50) return '#4CAF50';
  if (percent > 30) return '#FF9800';
  return '#F44336';
}

function BattlePanel() {
  const {
    phase,
    character,
    currentMonster,
    setPhase,
    setCurrentMonster,
    setBattleSimulator,
    incrementMonstersDefeated,
    battleSimulator,
  } = useGameContext();

  const [playerHp, setPlayerHp] = useState(0);
  const [monsterHp, setMonsterHp] = useState(0);
  const [battleLog, setBattleLog] = useState<BattleFrame[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showParticle, setShowParticle] = useState(false);
  const [particleDirection, setParticleDirection] = useState<'right' | 'left'>('right');
  const [panelShake, setPanelShake] = useState(false);

  useEffect(() => {
    if (phase === 'battle' && character && currentMonster) {
      const sim = new BattleSimulator(character, currentMonster);
      setBattleSimulator(sim);
      setPlayerHp(character.hp);
      setMonsterHp(currentMonster.hp);
      setBattleLog([]);
    }
  }, [phase, character, currentMonster, setBattleSimulator]);

  useEffect(() => {
    if (!battleSimulator) return;
    if (battleSimulator.isOver()) {
      const state = battleSimulator.getCurrentState();
      if (state.playerWon) {
        incrementMonstersDefeated();
        const timeout = setTimeout(() => {
          setPhase('exploring');
          setCurrentMonster(null);
        }, 1500);
        return () => clearTimeout(timeout);
      } else {
        setPhase('gameOver');
      }
    }
  }, [playerHp, monsterHp, battleSimulator, incrementMonstersDefeated, setPhase, setCurrentMonster]);

  const handleAttack = useCallback(() => {
    if (!battleSimulator || isAnimating || battleSimulator.isOver()) return;
    setIsAnimating(true);

    const frame = battleSimulator.simulateRound();
    const isPlayerAttacking = frame.attacker === character?.name;

    setParticleDirection(isPlayerAttacking ? 'right' : 'left');
    setShowParticle(true);
    setPanelShake(true);

    setTimeout(() => {
      setShowParticle(false);
      setPanelShake(false);
    }, 300);

    setPlayerHp(frame.playerHp);
    setMonsterHp(frame.monsterHp);
    setBattleLog((prev) => [...prev, frame]);

    setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  }, [battleSimulator, isAnimating, character]);

  const handlePotion = useCallback(() => {
    if (!character || character.potionCount <= 0 || isAnimating) return;
    character.usePotion();
    setPlayerHp(character.hp);
  }, [character, isAnimating]);

  const handleFlee = useCallback(() => {
    if (!battleSimulator || isAnimating || battleSimulator.isOver()) return;
    setIsAnimating(true);

    const success = battleSimulator.tryFlee();
    if (success) {
      setPhase('exploring');
    } else {
      const frame = battleSimulator.simulateRound();
      setParticleDirection('left');
      setShowParticle(true);
      setPanelShake(true);

      setTimeout(() => {
        setShowParticle(false);
        setPanelShake(false);
      }, 300);

      setPlayerHp(frame.playerHp);
      setMonsterHp(frame.monsterHp);
      setBattleLog((prev) => [
        ...prev,
        {
          type: 'flee' as const,
          attacker: '',
          target: '',
          damage: 0,
          isCritical: false,
          playerHp: frame.playerHp,
          playerMaxHp: frame.playerMaxHp,
          monsterHp: frame.monsterHp,
          monsterMaxHp: frame.monsterMaxHp,
          message: '逃跑失败！敌人发动了攻击！',
        },
        frame,
      ]);

      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    }
  }, [battleSimulator, isAnimating, setPhase]);

  if (phase !== 'battle' || !character || !currentMonster || !battleSimulator) return null;

  const playerHpPercent = playerHp / character.maxHp * 100;
  const monsterHpPercent = monsterHp / currentMonster.maxHp * 100;
  const isBattleOver = battleSimulator.isOver();
  const playerWon = battleSimulator.getCurrentState().playerWon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{
          y: 0,
          x: panelShake ? [0, -3, 3, 0] : 0,
        }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 400,
          background: '#3E2723',
          borderTop: '2px solid #FFD700',
          padding: 20,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            <span style={{ fontSize: 40 }}>{classEmojis[character.className] || '⚔️'}</span>
            <span style={{ color: '#FFF3E0', fontSize: 14, fontWeight: 'bold' }}>{character.name}</span>
            <div style={{ width: 200, height: 16, borderRadius: 8, background: '#1A0E0A', position: 'relative', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${playerHpPercent}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  borderRadius: 8,
                  background: getHpColor(playerHpPercent),
                }}
              />
            </div>
            <span style={{ color: '#FFF3E0', fontSize: 12 }}>
              {playerHp} / {character.maxHp}
            </span>
            {playerHpPercent <= 30 && (
              <motion.div
                animate={{ x: [0, -2, 2, 0] }}
                transition={{ duration: 0.1, repeat: Infinity }}
                style={{ position: 'absolute' }}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <GiSwordWound size={32} color="#FFD700" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            <span style={{ fontSize: 40 }}>{currentMonster.icon}</span>
            <span style={{ color: '#FFF3E0', fontSize: 14, fontWeight: 'bold' }}>{currentMonster.name}</span>
            <div style={{ width: 200, height: 16, borderRadius: 8, background: '#1A0E0A', position: 'relative', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${monsterHpPercent}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  borderRadius: 8,
                  background: getHpColor(monsterHpPercent),
                }}
              />
            </div>
            <span style={{ color: '#FFF3E0', fontSize: 12 }}>
              {monsterHp} / {currentMonster.maxHp}
            </span>
            {monsterHpPercent <= 30 && (
              <motion.div
                animate={{ x: [0, -2, 2, 0] }}
                transition={{ duration: 0.1, repeat: Infinity }}
                style={{ position: 'absolute' }}
              />
            )}
          </div>
        </div>

        {showParticle && (
          <motion.div
            initial={{
              x: particleDirection === 'right' ? 60 : 480,
              y: 20,
              opacity: 1,
            }}
            animate={{
              x: particleDirection === 'right' ? 480 : 60,
              y: 20,
              opacity: 0,
            }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: 40,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: particleDirection === 'right' ? '#FFD700' : '#F44336',
              pointerEvents: 'none',
            }}
          />
        )}

        <div
          style={{
            maxHeight: 120,
            overflowY: 'auto',
            background: '#1A0E0A',
            borderRadius: 8,
            padding: 8,
            flex: 1,
          }}
        >
          <AnimatePresence>
            {battleLog.map((frame, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  color: frame.isCritical ? '#FFD700' : '#FFF3E0',
                  fontSize: 13,
                  padding: '4px 0',
                  borderBottom: '1px solid #3E2723',
                }}
              >
                {frame.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {isBattleOver ? (
          <div style={{ textAlign: 'center', padding: 12 }}>
            {playerWon ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FaHeart color="#4CAF50" size={24} />
                <span style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold' }}>胜利！</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <FaSkull color="#F44336" size={24} />
                <span style={{ color: '#F44336', fontSize: 20, fontWeight: 'bold' }}>战败...</span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <motion.button
              whileHover={{ backgroundColor: '#8B0000', translateY: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                background: '#5D4037',
                color: '#FFF3E0',
                cursor: 'pointer',
                fontSize: 14,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: '0.2s',
              }}
              onClick={handleAttack}
              disabled={isAnimating}
            >
              <GiSwordWound size={18} />
              攻击
            </motion.button>
            <motion.button
              whileHover={{ backgroundColor: '#8B0000', translateY: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                background: '#5D4037',
                color: '#FFF3E0',
                cursor: character.potionCount > 0 && !isAnimating ? 'pointer' : 'not-allowed',
                fontSize: 14,
                border: 'none',
                opacity: character.potionCount > 0 ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: '0.2s',
              }}
              onClick={handlePotion}
              disabled={character.potionCount === 0 || isAnimating}
            >
              <FaHeart size={14} />
              使用药水 ({character.potionCount})
            </motion.button>
            <motion.button
              whileHover={{ backgroundColor: '#8B0000', translateY: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                background: '#5D4037',
                color: '#FFF3E0',
                cursor: isAnimating ? 'not-allowed' : 'pointer',
                fontSize: 14,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: '0.2s',
              }}
              onClick={handleFlee}
              disabled={isAnimating}
            >
              <GiRunningNinja size={18} />
              逃跑
            </motion.button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default React.memo(BattlePanel);
