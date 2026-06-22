import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import type { SeedType } from '@/types';
import Enemy from './Enemy';
import styles from './Dungeon.module.css';

function getRoomIcon(type: string, cleared: boolean): string {
  if (cleared && type !== 'start') return '✓';
  switch (type) {
    case 'enemy':
      return '👾';
    case 'chest':
      return '📦';
    case 'start':
      return '🚪';
    default:
      return '·';
  }
}

interface RewardPopupProps {
  type: 'coins' | 'seed';
  amount: number;
  seedType?: SeedType;
  onClose: () => void;
}

function RewardPopup({ type, amount, seedType, onClose }: RewardPopupProps) {
  const seedNames: Record<SeedType, string> = {
    normal: '普通',
    rare: '稀有',
    magic: '魔法',
  };

  return (
    <motion.div
      className={styles.rewardPopup}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <div className={styles.rewardIcon}>
        {type === 'coins' ? '💰' : '🌱'}
      </div>
      <div className={styles.rewardText}>
        {type === 'coins'
          ? `获得 ${amount} 金币！`
          : `获得 ${seedNames[seedType as SeedType]}种子 x${amount}！`}
      </div>
      <button className={styles.rewardButton} onClick={onClose}>
        确定
      </button>
    </motion.div>
  );
}

export default function Dungeon() {
  const {
    playerPosition,
    dungeon,
    currentEnemy,
    hp,
    maxHp,
    coins,
    view,
    setView,
    movePlayer,
    takeDamage,
    addCoins,
    clearRoom,
    setCurrentEnemy,
  } = useGameStore();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isPlayerHurt, setIsPlayerHurt] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
  const [isEnemyHurt, setIsEnemyHurt] = useState(false);
  const [battleLog, setBattleLog] = useState('');
  const [showReward, setShowReward] = useState<{ type: 'coins' | 'seed'; amount: number; seedType?: SeedType } | null>(null);
  const [enemyHp, setEnemyHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(hp);

  useEffect(() => {
    if (currentEnemy) {
      setEnemyHp(currentEnemy.hp);
    }
  }, [currentEnemy]);

  useEffect(() => {
    setPlayerHp(hp);
  }, [hp]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (view !== 'dungeon' || isTransitioning) return;

      let dx = 0;
      let dy = 0;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          dy = -1;
          break;
        case 's':
        case 'arrowdown':
          dy = 1;
          break;
        case 'a':
        case 'arrowleft':
          dx = -1;
          break;
        case 'd':
        case 'arrowright':
          dx = 1;
          break;
        default:
          return;
      }

      const newX = playerPosition.x + dx;
      const newY = playerPosition.y + dy;

      if (newX >= 0 && newX <= 2 && newY >= 0 && newY <= 2) {
        const currentRoom = dungeon[playerPosition.y][playerPosition.x];
        if (currentRoom.type === 'enemy' && !currentRoom.cleared) return;

        setIsTransitioning(true);
        setTimeout(() => {
          movePlayer(dx, dy);
          setTimeout(() => {
            setIsTransitioning(false);
          }, 500);
        }, 250);
      }
    },
    [view, isTransitioning, playerPosition, dungeon, movePlayer]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleAttack = useCallback(async () => {
    if (!currentEnemy || enemyHp <= 0 || playerHp <= 0) return;

    setIsPlayerAttacking(true);
    setBattleLog('你发动攻击！');

    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsPlayerAttacking(false);
    setIsEnemyHurt(true);

    const newEnemyHp = enemyHp - 1;
    setEnemyHp(newEnemyHp);

    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsEnemyHurt(false);

    if (newEnemyHp <= 0) {
      setBattleLog('敌人被击败了！');
      setTimeout(() => {
        addCoins(2);
        clearRoom(playerPosition.x, playerPosition.y);
        setShowReward({ type: 'coins', amount: 2 });
        setCurrentEnemy(null);
        setView('dungeon');
      }, 500);
      return;
    }

    setBattleLog('敌人反击！');
    await new Promise((resolve) => setTimeout(resolve, 300));

    setIsEnemyAttacking(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsEnemyAttacking(false);
    setIsPlayerHurt(true);

    const newPlayerHp = playerHp - 1;
    setPlayerHp(newPlayerHp);
    takeDamage(1);

    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsPlayerHurt(false);

    if (newPlayerHp <= 0) {
      setBattleLog('你被击败了...');
    } else {
      setBattleLog(`双方各造成1点伤害`);
    }
  }, [currentEnemy, enemyHp, playerHp, addCoins, clearRoom, playerPosition, setCurrentEnemy, setView, takeDamage]);

  const handleExit = useCallback(() => {
    setView('farm');
  }, [setView]);

  const handleCloseReward = useCallback(() => {
    setShowReward(null);
  }, []);

  if (view === 'battle' && currentEnemy) {
    return (
      <motion.div
        className={styles.battleScreen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className={styles.hud}>
          <div className={styles.hudItem}>❤️ HP: {playerHp}/{maxHp}</div>
          <div className={styles.hudItem}>💰 金币: {coins}</div>
        </div>

        <div className={styles.battleArena}>
          <div className={styles.battleSide}>
            <motion.div
              className={[
                styles.playerCharacter,
                isPlayerAttacking ? styles.attacking : '',
                isPlayerHurt ? styles.hurt : '',
              ].filter(Boolean).join(' ')}
              animate={isPlayerHurt ? { x: [0, -10, 10, -10, 0] } : {}}
              transition={{ duration: 0.3 }}
            >
              🧙
            </motion.div>
            <div className={styles.hpDisplay}>
              勇者
              <div className={styles.hpBarLarge}>
                <motion.div
                  className={`${styles.hpBarFill} ${styles.playerHpFill}`}
                  initial={false}
                  animate={{ width: `${(playerHp / maxHp) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div>{playerHp}/{maxHp}</div>
            </div>
          </div>

          <motion.div
            className={styles.vs}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            VS
          </motion.div>

          <div className={styles.battleSide}>
            <Enemy
              enemy={{ ...currentEnemy, hp: enemyHp }}
              isAttacking={isEnemyAttacking}
              isHurt={isEnemyHurt}
            />
            <div className={styles.hpDisplay}>
              史莱姆
              <div>{enemyHp}/{currentEnemy.maxHp}</div>
            </div>
          </div>
        </div>

        <motion.div
          className={styles.battleLog}
          key={battleLog}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {battleLog}
        </motion.div>

        <motion.button
          className={styles.attackButton}
          onClick={handleAttack}
          disabled={enemyHp <= 0 || playerHp <= 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ⚔️ 攻击
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.dungeonContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.hud}>
        <div className={styles.hudItem}>❤️ HP: {hp}/{maxHp}</div>
        <div className={styles.hudItem}>💰 金币: {coins}</div>
        <div className={styles.hudItem}>📍 位置: ({playerPosition.x}, {playerPosition.y})</div>
      </div>

      <button className={styles.exitButton} onClick={handleExit}>
        🚪 出口
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${playerPosition.x}-${playerPosition.y}-${isTransitioning}`}
          className={styles.dungeonGrid}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
        >
          {dungeon.map((row, y) =>
            row.map((room, x) => {
              const isCurrentRoom = playerPosition.x === x && playerPosition.y === y;
              const roomClasses = [
                styles.room,
                room.visited ? styles.visited : '',
                room.cleared ? styles.cleared : '',
                isCurrentRoom ? styles.current : '',
                styles[room.type],
              ].filter(Boolean).join(' ');

              return (
                <motion.div
                  key={`${x}-${y}`}
                  className={roomClasses}
                  onClick={() => {
                    if (!isTransitioning && room.visited) {
                      const dx = x - playerPosition.x;
                      const dy = y - playerPosition.y;
                      if (Math.abs(dx) + Math.abs(dy) === 1) {
                        setIsTransitioning(true);
                        setTimeout(() => {
                          movePlayer(dx, dy);
                          setTimeout(() => {
                            setIsTransitioning(false);
                          }, 500);
                        }, 250);
                      }
                    }
                  }}
                  whileHover={room.visited && !isTransitioning ? { scale: 1.05 } : {}}
                >
                  <span className={styles.roomIcon}>
                    {room.visited ? getRoomIcon(room.type, room.cleared) : '?'}
                  </span>
                  {isCurrentRoom && (
                    <motion.span
                      className={styles.player}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      🧙
                    </motion.span>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      <div className={styles.controls}>
        <div>🎮 使用 WASD 或 方向键 移动</div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          W/↑ 上 | S/↓ 下 | A/← 左 | D/→ 右
        </div>
      </div>

      <AnimatePresence>
        {showReward && (
          <RewardPopup
            type={showReward.type}
            amount={showReward.amount}
            seedType={showReward.seedType}
            onClose={handleCloseReward}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
