import { motion } from 'framer-motion';
import { Heart, Coins } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { romanNumeral } from '../utils/pixel';
import styles from './StatusPanel.module.css';

export default function StatusPanel() {
  const gold = useGameStore((state) => state.gold);
  const hp = useGameStore((state) => state.hp);
  const maxHp = useGameStore((state) => state.maxHp);
  const dungeonLevel = useGameStore((state) => state.dungeonLevel);
  const harvestCount = useGameStore((state) => state.harvestCount);

  const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div className={styles.statusPanel}>
      <div className={styles.statItem}>
        <Coins className={styles.goldIcon} />
        <motion.span
          key={gold}
          initial={{ scale: 1.5, y: -10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`${styles.goldValue} ${styles.animatedValue}`}
        >
          {gold}
        </motion.span>
      </div>

      <div className={styles.statItem}>
        <div className={styles.hpContainer}>
          <Heart className={styles.heartIcon} fill="#e74c3c" />
          <div className={styles.hpBarContainer}>
            <motion.div
              className={styles.hpBarFill}
              initial={{ width: '100%' }}
              animate={{ width: `${hpPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <motion.span
            key={hp}
            initial={{ scale: 1.3, y: -5, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className={styles.animatedValue}
          >
            {hp}/{maxHp}
          </motion.span>
        </div>
      </div>

      <div className={styles.statItem}>
        <span>层数:</span>
        <motion.span
          key={dungeonLevel}
          initial={{ scale: 1.3, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`${styles.dungeonLevel} ${styles.animatedValue}`}
        >
          {romanNumeral(dungeonLevel)}
        </motion.span>
      </div>

      <div className={styles.statItem}>
        <span>收获:</span>
        <motion.span
          key={harvestCount}
          initial={{ scale: 1.5, y: -10, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`${styles.harvestCount} ${styles.animatedValue}`}
        >
          {harvestCount}
        </motion.span>
      </div>
    </div>
  );
}
