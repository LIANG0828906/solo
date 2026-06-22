import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { initGame, tryMovePlayer, playerAutoAttack, useSkill, monsterAttack } from './gameEngine';
import MapRenderer from './maps/MapRenderer';
import CombatUI from './combat/CombatUI';
import { motion, AnimatePresence } from 'framer-motion';

function TitleScreen() {
  const { resetGame, currentFloor } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 40,
      }}
    >
      <motion.div
        animate={{
          filter: [
            'drop-shadow(0 0 20px rgba(78,205,196,0.4))',
            'drop-shadow(0 0 40px rgba(155,89,182,0.4))',
            'drop-shadow(0 0 20px rgba(78,205,196,0.4))',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{
          fontSize: 100,
          marginBottom: 10,
        }}
      >
        🏰
      </motion.div>

      <motion.h1
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        style={{
          fontSize: 52,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #4ecdc4, #9b59b6, #ff6b9d)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: 4,
          marginBottom: 8,
          textShadow: '0 4px 30px rgba(78,205,196,0.3)',
        }}
      >
        迷你地牢探险
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          fontSize: 16,
          color: '#8888aa',
          marginBottom: 40,
          letterSpacing: 6,
          textTransform: 'uppercase',
        }}
      >
        Mini Dungeon Roguelike
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          background: 'linear-gradient(135deg, #1a1a2e, #2a2a4e)',
          padding: 20,
          borderRadius: 16,
          border: '1px solid #3b3b5c',
          marginBottom: 30,
          maxWidth: 480,
        }}
      >
        <div style={{ fontSize: 14, color: '#aaaacc', lineHeight: 1.8, marginBottom: 0 }}>
          <p style={{ margin: '6px 0' }}>🎮 <strong style={{ color: '#4ecdc4' }}>WASD</strong> - 在迷宫中移动</p>
          <p style={{ margin: '6px 0' }}>⚔️ <strong style={{ color: '#e63946' }}>碰到怪物</strong> - 自动进入战斗</p>
          <p style={{ margin: '6px 0' }}>💥 <strong style={{ color: '#ff6b9d' }}>1-4 键</strong> - 释放强力技能</p>
          <p style={{ margin: '6px 0' }}>🎁 <strong style={{ color: '#f8c630' }}>拾取装备</strong> - 点击背包使用/装备</p>
          <p style={{ margin: '6px 0' }}>🐉 <strong style={{ color: '#ffd700' }}>击败关底Boss</strong> - 赢得胜利！</p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
        whileHover={{ scale: 1.05, y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          resetGame();
          initGame();
        }}
        style={{
          padding: '18px 60px',
          fontSize: 20,
          fontWeight: 800,
          background: 'linear-gradient(135deg, #4ecdc4, #5dade2, #9b59b6)',
          color: '#fff',
          border: 'none',
          borderRadius: 50,
          cursor: 'pointer',
          letterSpacing: 4,
          boxShadow: '0 10px 40px rgba(78,205,196,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        🗡️ 开始冒险
      </motion.button>

      {currentFloor > 1 && (
        <div style={{ marginTop: 16, fontSize: 13, color: '#666688' }}>
          上次冒险到达了 第 {currentFloor} 层
        </div>
      )}
    </motion.div>
  );
}

function GameOverScreen({ victory }: { victory: boolean }) {
  const { player, currentFloor, resetGame } = useGameStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: 40,
      }}
    >
      <motion.div
        animate={victory ? {
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1],
        } : {
          y: [0, -10, 0],
        }}
        transition={{ duration: victory ? 2 : 1.5, repeat: Infinity }}
        style={{ fontSize: 120, marginBottom: 20 }}
      >
        {victory ? '🏆' : '💀'}
      </motion.div>

      <motion.h1
        animate={{
          color: victory
            ? ['#ffd700', '#ff6b9d', '#ffd700']
            : ['#e63946', '#ff6b6b', '#e63946'],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          fontSize: 56,
          fontWeight: 900,
          marginBottom: 16,
          letterSpacing: 6,
          textShadow: victory
            ? '0 4px 40px rgba(255,215,0,0.5)'
            : '0 4px 40px rgba(230,57,70,0.5)',
        }}
      >
        {victory ? '胜 利！' : '失 败...'}
      </motion.h1>

      <div
        style={{
          fontSize: 18,
          color: victory ? '#ffd700' : '#ff8080',
          marginBottom: 30,
        }}
      >
        {victory
          ? `恭喜你击败了第 ${currentFloor} 层的地牢守护者！`
          : '你的冒险在此告一段落...'}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          marginBottom: 30,
          background: 'linear-gradient(135deg, #1a1a2e, #2a2a4e)',
          padding: 24,
          borderRadius: 16,
          border: '1px solid #3b3b5c',
          minWidth: 360,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>到达楼层</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#4ecdc4' }}>🏰 {currentFloor}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>角色等级</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#9b59b6' }}>⭐ Lv.{player.stats.level}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>获得金币</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#f8c630' }}>💰 {player.stats.gold}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>背包物品</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#5dade2' }}>🎒 {player.inventory.length}</div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05, y: -3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          resetGame();
          initGame();
        }}
        style={{
          padding: '16px 50px',
          fontSize: 18,
          fontWeight: 800,
          background: victory
            ? 'linear-gradient(135deg, #ffd700, #ff6b9d)'
            : 'linear-gradient(135deg, #e63946, #9b59b6)',
          color: '#fff',
          border: 'none',
          borderRadius: 50,
          cursor: 'pointer',
          letterSpacing: 3,
          boxShadow: victory
            ? '0 10px 40px rgba(255,215,0,0.4)'
            : '0 10px 40px rgba(230,57,70,0.4)',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        🔄 再次挑战
      </motion.button>
    </motion.div>
  );
}

export default function App() {
  const { phase, combat } = useGameStore();
  const autoAttackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const monsterAttackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();

    if (phase === 'exploring') {
      switch (key) {
        case 'w':
          tryMovePlayer('up');
          break;
        case 's':
          tryMovePlayer('down');
          break;
        case 'a':
          tryMovePlayer('left');
          break;
        case 'd':
          tryMovePlayer('right');
          break;
      }
    }

    if (phase === 'combat' || phase === 'exploring') {
      if (combat.isInCombat) {
        if (key === '1') useSkill(0);
        else if (key === '2') useSkill(1);
        else if (key === '3') useSkill(2);
        else if (key === '4') useSkill(3);
      }
    }
  }, [phase, combat.isInCombat]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (combat.isInCombat) {
      autoAttackTimerRef.current = setInterval(() => {
        playerAutoAttack();
      }, 1500);

      monsterAttackTimerRef.current = setInterval(() => {
        monsterAttack();
      }, 1000);
    }

    return () => {
      if (autoAttackTimerRef.current) clearInterval(autoAttackTimerRef.current);
      if (monsterAttackTimerRef.current) clearInterval(monsterAttackTimerRef.current);
    };
  }, [combat.isInCombat]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%)`,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        {phase === 'title' && <TitleScreen key="title" />}

        {(phase === 'exploring' || phase === 'combat') && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              padding: 20,
              overflow: 'auto',
            }}
          >
            <MapRenderer />
            <CombatUI />
          </motion.div>
        )}

        {phase === 'victory' && <GameOverScreen key="victory" victory={true} />}
        {phase === 'defeat' && <GameOverScreen key="defeat" victory={false} />}
      </AnimatePresence>

      <style>{`
        @keyframes boss-pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(230,57,70,0.8)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 25px rgba(255,100,100,1)); }
        }
      `}</style>
    </div>
  );
}
